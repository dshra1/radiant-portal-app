import type { AiFeatureKey } from "@/lib/ai-plans";
import { PRICE_PER_USE, emptyWallet, type CreditEvent, type Wallet } from "@/lib/ai-credits";

/**
 * Credit ledger in a private bucket that only the server (service role) can read or write,
 * so a firm cannot edit its own balance. wallet.json holds the balance and a monthly summary;
 * every event is also written as its own file for audit (events/YYYY-MM/...).
 */
const BUCKET = "saha-billing";
let bucketReady = false;

export const billingOn = () => (process.env["AI_BILLING"] ?? "").toLowerCase() === "on";
export const paymentsOn = () =>
  Boolean(process.env["RAZORPAY_KEY_ID"] && process.env["RAZORPAY_KEY_SECRET"]);

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  if (!bucketReady) {
    const { error } = await supabaseAdmin.storage.createBucket(BUCKET, { public: false });
    if (error && !/exist/i.test(error.message))
      throw new Error(`Credit store unavailable: ${error.message}`);
    bucketReady = true;
  }
  return supabaseAdmin;
}

export async function readWallet(): Promise<Wallet> {
  const sb = await admin();
  const dl = await sb.storage.from(BUCKET).download("wallet.json");
  if (!dl.data) return emptyWallet();
  try {
    return { ...emptyWallet(), ...(JSON.parse(await dl.data.text()) as Wallet) };
  } catch {
    return emptyWallet();
  }
}

async function put(path: string, body: unknown) {
  const sb = await admin();
  const blob = new Blob([JSON.stringify(body)], { type: "application/json" });
  const { error } = await sb.storage
    .from(BUCKET)
    .upload(path, blob, { upsert: true, contentType: "application/json" });
  if (error) throw new Error(`Could not record credits: ${error.message}`);
}

export async function exists(path: string) {
  const sb = await admin();
  const dir = path.split("/").slice(0, -1).join("/");
  const name = path.split("/").pop()!;
  const { data } = await sb.storage.from(BUCKET).list(dir, { search: name, limit: 1 });
  return Boolean(data?.some((f) => f.name === name));
}

/** Apply one event to the wallet and keep its audit file. */
export async function record(e: Omit<CreditEvent, "id" | "at">, file?: string) {
  const w = await readWallet();
  const ev: CreditEvent = {
    ...e,
    id: Math.random().toString(36).slice(2, 10),
    at: new Date().toISOString(),
  };
  w.balance = Math.round((w.balance + ev.credits) * 100) / 100;
  if (ev.type === "topup") w.topupTotal += ev.credits;
  if (ev.type === "use") {
    w.spentTotal += -ev.credits;
    const m = ev.at.slice(0, 7);
    const month = (w.months[m] ??= {});
    const k = ev.key!;
    const row = (month[k] ??= { uses: 0, credits: 0 });
    row.uses += 1;
    row.credits += -ev.credits;
  }
  w.recent = [ev, ...w.recent].slice(0, 40);
  w.updatedAt = ev.at;
  await put("wallet.json", w);
  await put(file ?? `events/${ev.at.slice(0, 7)}/${Date.now()}-${ev.id}.json`, ev);
  return w;
}

function shortMsg(key: AiFeatureKey, price: number, balance: number) {
  return `Not enough AI credits: this needs ₹${price} and the balance is ₹${Math.floor(balance)}. An admin can top up in AI Features & Plans.`;
}

/** Before an AI run: plan allows the feature, and the balance covers the price. */
export async function checkAiUse(key: AiFeatureKey) {
  if (!billingOn()) return;
  const w = await readWallet();
  const price = PRICE_PER_USE[key];
  if (w.balance < price) throw new Error(shortMsg(key, price, w.balance));
}
export async function chargeAiUse(key: AiFeatureKey, by: string) {
  if (!billingOn()) return;
  await record({ type: "use", credits: -PRICE_PER_USE[key], key, by });
}
