import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { GST_PCT, TOP_UP_PACKS, type CreditsSummary } from "@/lib/ai-credits";

async function isAppAdmin(supabase: { from: (t: string) => any }, userId: string) {
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  return ((data ?? []) as { role: string }[]).some((r) => r.role === "admin");
}
const sahaAdmins = () =>
  (process.env["SAHA_ADMIN_EMAILS"] ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

/** Balance, this month's use and recent events. */
export const getCredits = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<CreditsSummary & { sahaAdmin: boolean }> => {
    const { billingOn, paymentsOn, readWallet } = await import("@/lib/ai-credits.server");
    const email = String((context.claims as { email?: string }).email ?? "").toLowerCase();
    const base = {
      sahaAdmin: sahaAdmins().includes(email),
      payments: paymentsOn(),
      billing: billingOn(),
    };
    if (!billingOn()) {
      const { emptyWallet } = await import("@/lib/ai-credits");
      return { ...base, wallet: emptyWallet() };
    }
    return { ...base, wallet: await readWallet() };
  });

const rzp = async (path: string, init?: RequestInit) => {
  const id = process.env["RAZORPAY_KEY_ID"]!;
  const secret = process.env["RAZORPAY_KEY_SECRET"]!;
  const res = await fetch(`https://api.razorpay.com/v1${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      authorization: `Basic ${btoa(`${id}:${secret}`)}`,
    },
  });
  const body = (await res.json()) as Record<string, unknown>;
  if (!res.ok) {
    const err =
      (body["error"] as { description?: string } | undefined)?.description ?? res.statusText;
    throw new Error(`Payment gateway: ${err}`);
  }
  return body;
};

/** Start a top-up: creates a Razorpay order for the pack price plus GST. */
export const createTopUp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { packId: string }) => input)
  .handler(async ({ data, context }) => {
    const { billingOn, paymentsOn } = await import("@/lib/ai-credits.server");
    if (!billingOn()) throw new Error("AI credits are not in use on this app");
    if (!paymentsOn())
      throw new Error("Online payment isn't set up yet. Contact SAHA to top up by bank transfer.");
    if (!(await isAppAdmin(context.supabase, context.userId)))
      throw new Error("Only an admin can buy AI credits");
    const pack = TOP_UP_PACKS.find((p) => p.id === data.packId);
    if (!pack) throw new Error("Unknown pack");
    const amount = Math.round(pack.pay * (1 + GST_PCT / 100) * 100); // paise
    const order = await rzp("/orders", {
      method: "POST",
      body: JSON.stringify({
        amount,
        currency: "INR",
        receipt: `ai-${Date.now()}`,
        notes: { pack: pack.id, credits: String(pack.credits), user: context.userId },
      }),
    });
    return { orderId: String(order["id"]), amount, keyId: process.env["RAZORPAY_KEY_ID"]!, pack };
  });

async function hmacHex(secret: string, msg: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(msg));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Finish a top-up: verify Razorpay's signature, then add the pack's credits once. */
export const confirmTopUp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { orderId: string; paymentId: string; signature: string }) => input)
  .handler(async ({ data, context }) => {
    const { paymentsOn, record, exists, readWallet } = await import("@/lib/ai-credits.server");
    if (!paymentsOn()) throw new Error("Online payment isn't set up");
    const expected = await hmacHex(
      process.env["RAZORPAY_KEY_SECRET"]!,
      `${data.orderId}|${data.paymentId}`,
    );
    if (expected !== data.signature)
      throw new Error(
        "Payment could not be verified. If money was taken, contact SAHA with the payment id.",
      );
    const file = `topups/${data.paymentId}.json`;
    if (await exists(file)) return { wallet: await readWallet(), already: true };
    const order = await rzp(`/orders/${encodeURIComponent(data.orderId)}`);
    const notes = (order["notes"] ?? {}) as { pack?: string };
    const pack = TOP_UP_PACKS.find((p) => p.id === notes.pack);
    if (!pack) throw new Error("This payment is not for an AI credit pack");
    const wallet = await record(
      {
        type: "topup",
        credits: pack.credits,
        by: context.userId,
        ref: `Razorpay ${data.paymentId} · ₹${(Number(order["amount"]) / 100).toFixed(2)} incl. GST`,
      },
      file,
    );
    return { wallet, already: false };
  });

/** SAHA staff only: add or remove credits (bank transfer, goodwill, correction). */
export const adjustCredits = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { credits: number; note: string }) => input)
  .handler(async ({ data, context }) => {
    const email = String((context.claims as { email?: string }).email ?? "").toLowerCase();
    if (!sahaAdmins().includes(email)) throw new Error("Only SAHA staff can adjust credits");
    if (!Number.isFinite(data.credits) || data.credits === 0)
      throw new Error("Enter the credits to add or remove");
    if (!data.note.trim()) throw new Error("Add a note (e.g. bank transfer reference)");
    const { record } = await import("@/lib/ai-credits.server");
    return {
      wallet: await record({
        type: "adjust",
        credits: data.credits,
        by: email,
        ref: data.note.trim(),
      }),
    };
  });
