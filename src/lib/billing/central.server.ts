/**
 * SAHA central AI billing (runs only in SAHA's own app, with SAHA's service-role key).
 * Firms' apps reach it through /api/billing/* with their firm id and key.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { GST_PCT, PRICE_PER_USE, TOP_UP_PACKS } from "@/lib/ai-credits";
import type { AiFeatureKey } from "@/lib/ai-plans";
import { makeInvoicePdf, splitGst, type InvoiceData } from "@/lib/billing/invoice";

export const INVOICE_BUCKET = "saha-billing";

async function db(): Promise<SupabaseClient> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin as unknown as SupabaseClient;
}

export async function sha256Hex(s: string) {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
export async function hmacHex(secret: string, msg: string) {
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
/** Constant-time string compare. */
export function same(a: string, b: string) {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

export type Firm = {
  id: string;
  name: string;
  active: boolean;
  balance: number;
  billing: Record<string, string>;
  api_key_hash: string;
  created_at: string;
  updated_at: string;
};

export async function verifyFirm(id: string, key: string): Promise<Firm> {
  if (!id || !key) throw new Error("Missing firm credentials");
  const { data } = await (await db()).from("billing_firms").select("*").eq("id", id).maybeSingle();
  const firm = data as Firm | null;
  if (!firm || !same(firm.api_key_hash, await sha256Hex(key)))
    throw new Error("Unknown firm or wrong key");
  return firm;
}

const friendly = (m: string, feature: AiFeatureKey, firm: Firm) =>
  /insufficient/.test(m)
    ? `Not enough AI credits: this needs ₹${PRICE_PER_USE[feature]} and the balance is ₹${Math.floor(Number(firm.balance))}. An admin can top up in AI Features & Plans.`
    : /inactive/.test(m)
      ? "AI is paused for this firm's account. Contact SAHA."
      : `Credits could not be checked: ${m}`;

export async function reserve(firm: Firm, feature: AiFeatureKey, user: string) {
  const price = PRICE_PER_USE[feature];
  if (!price) throw new Error("Unknown AI feature");
  const sb = await db();
  void sb.rpc("billing_release_stale"); // tidy reservations left by crashed runs
  const { data, error } = await sb.rpc("billing_reserve", {
    p_firm: firm.id,
    p_feature: feature,
    p_credits: price,
    p_user: user,
  });
  if (error) {
    const { data: now } = await sb
      .from("billing_firms")
      .select("balance")
      .eq("id", firm.id)
      .maybeSingle();
    throw new Error(
      friendly(error.message, feature, { ...firm, balance: Number(now?.balance ?? firm.balance) }),
    );
  }
  return String(data);
}
export async function settle(id: string) {
  await (await db()).rpc("billing_settle", { p_id: id });
}
export async function release(id: string) {
  await (await db()).rpc("billing_release", { p_id: id });
}

export async function summary(firmId: string) {
  const sb = await db();
  const { data: firm } = await sb
    .from("billing_firms")
    .select("id,name,balance,active,billing")
    .eq("id", firmId)
    .single();
  const since = new Date();
  since.setUTCDate(1);
  since.setUTCHours(0, 0, 0, 0);
  const { data: month } = await sb
    .from("billing_events")
    .select("type,feature,credits")
    .eq("firm_id", firmId)
    .gte("at", since.toISOString())
    .limit(20000);
  const byFeature: Record<string, { uses: number; credits: number }> = {};
  let used = 0;
  for (const e of (month ?? []) as { type: string; feature: string | null; credits: number }[]) {
    if (!e.feature || (e.type !== "use" && e.type !== "refund")) continue;
    const r = (byFeature[e.feature] ??= { uses: 0, credits: 0 });
    r.uses += e.type === "use" ? 1 : -1;
    r.credits += -Number(e.credits);
    used += -Number(e.credits);
  }
  const { data: recent } = await sb
    .from("billing_events")
    .select("*")
    .eq("firm_id", firmId)
    .order("at", { ascending: false })
    .limit(40);
  const { data: invoices } = await sb
    .from("billing_invoices")
    .select("invoice_no,total,created_at,payment_id")
    .eq("firm_id", firmId)
    .order("created_at", { ascending: false })
    .limit(50);
  const { data: tops } = await sb.from("billing_payments").select("credits").eq("firm_id", firmId);
  const topupTotal = ((tops ?? []) as { credits: number }[]).reduce(
    (s, t) => s + Number(t.credits),
    0,
  );
  return { firm, used, byFeature, recent: recent ?? [], invoices: invoices ?? [], topupTotal };
}

/* ── Razorpay ── */
export const paymentsOn = () =>
  Boolean(process.env["RAZORPAY_KEY_ID"] && process.env["RAZORPAY_KEY_SECRET"]);
export async function rzp(path: string, init?: RequestInit) {
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
  if (!res.ok)
    throw new Error(
      `Payment gateway: ${(body["error"] as { description?: string } | undefined)?.description ?? res.statusText}`,
    );
  return body;
}

export async function createOrder(firm: Firm, packId: string, billing: Record<string, string>) {
  if (!paymentsOn())
    throw new Error("Online payment isn't set up yet. Contact SAHA to top up by bank transfer.");
  const pack = TOP_UP_PACKS.find((p) => p.id === packId);
  if (!pack) throw new Error("Unknown pack");
  if (billing && Object.keys(billing).length) {
    await (
      await db()
    )
      .from("billing_firms")
      .update({ billing, updated_at: new Date().toISOString() })
      .eq("id", firm.id);
  }
  const amount = Math.round(pack.pay * (1 + GST_PCT / 100) * 100);
  const order = await rzp("/orders", {
    method: "POST",
    body: JSON.stringify({
      amount,
      currency: "INR",
      receipt: `${firm.id}-${Date.now()}`.slice(0, 40),
      notes: { firm: firm.id, pack: pack.id },
    }),
  });
  return { orderId: String(order["id"]), amount, keyId: process.env["RAZORPAY_KEY_ID"]!, pack };
}

const fyOf = (d: Date) => {
  const y = d.getMonth() >= 3 ? d.getFullYear() : d.getFullYear() - 1;
  return `${y}-${String((y + 1) % 100).padStart(2, "0")}`;
};

/**
 * Record a paid top-up once (from checkout, the webhook, or a bank transfer), add the credits,
 * number the GST invoice and store its PDF. Safe to call twice for the same payment.
 */
export async function recordTopUp(p: {
  paymentId: string;
  orderId: string | null;
  firmId: string;
  packId: string;
  amountPaise: number;
  credits: number;
  taxable: number;
  source: "checkout" | "webhook" | "bank";
  by: string;
}) {
  const sb = await db();
  const prefix = process.env["SAHA_INVOICE_PREFIX"] || "SAHA/AI";
  const { data: no, error } = await sb.rpc("billing_topup", {
    p_payment: p.paymentId,
    p_order: p.orderId,
    p_firm: p.firmId,
    p_pack: p.packId,
    p_amount_paise: p.amountPaise,
    p_credits: p.credits,
    p_source: p.source,
    p_fy: fyOf(new Date()),
    p_prefix: prefix,
    p_by: p.by,
  });
  if (error) throw new Error(`Could not record the payment: ${error.message}`);
  if (!no) return { invoiceNo: null as string | null, duplicate: true };
  await issueInvoice(String(no), p.firmId, p.paymentId, p.taxable, p.credits);
  return { invoiceNo: String(no), duplicate: false };
}

async function issueInvoice(
  invoiceNo: string,
  firmId: string,
  paymentId: string,
  taxable: number,
  credits: number,
) {
  const sb = await db();
  const { data: firm } = await sb
    .from("billing_firms")
    .select("name,billing")
    .eq("id", firmId)
    .single();
  const buyer: InvoiceData["buyer"] = {
    name: String(firm?.name ?? firmId),
    ...((firm?.billing as Record<string, string>) ?? {}),
  };
  const tax = splitGst(
    taxable,
    process.env["SAHA_GSTIN"] ?? "",
    buyer.gstin ?? "",
    buyer.state ?? "",
  );
  const data: InvoiceData = {
    invoiceNo,
    date: new Date(),
    seller: {
      name: process.env["SAHA_LEGAL_NAME"] || "SAHA Developers",
      gstin: process.env["SAHA_GSTIN"] || "",
      address: process.env["SAHA_ADDRESS"] || "Hyderabad, Telangana",
      email: process.env["SAHA_BILLING_EMAIL"] || "",
    },
    buyer,
    line: {
      description: `SiteSutra prepaid AI credits (${credits.toLocaleString("en-IN")} credits)`,
      sac: process.env["SAHA_SAC"] || "9983",
      taxable,
    },
    tax,
    paymentRef: paymentId,
  };
  const pdf = await makeInvoicePdf(data);
  const path = `invoices/${firmId}/${invoiceNo.replace(/\//g, "-")}.pdf`;
  const up = await sb.storage
    .from(INVOICE_BUCKET)
    .upload(path, new Blob([new Uint8Array(pdf)], { type: "application/pdf" }), {
      upsert: true,
      contentType: "application/pdf",
    });
  if (up.error && /not found|bucket/i.test(up.error.message)) {
    await sb.storage.createBucket(INVOICE_BUCKET, { public: false });
    await sb.storage
      .from(INVOICE_BUCKET)
      .upload(path, new Blob([new Uint8Array(pdf)], { type: "application/pdf" }), {
        upsert: true,
        contentType: "application/pdf",
      });
  }
  const fy = invoiceNo.split("/").slice(-2, -1)[0] ?? "";
  await sb.from("billing_invoices").insert({
    invoice_no: invoiceNo,
    fy,
    seq: Number(invoiceNo.split("/").pop()),
    firm_id: firmId,
    payment_id: paymentId,
    buyer,
    taxable,
    cgst: tax.cgst,
    sgst: tax.sgst,
    igst: tax.igst,
    total: taxable + tax.cgst + tax.sgst + tax.igst,
    pdf_path: path,
  });
}

/** Checkout success from the firm's browser: verify Razorpay's signature, then record. */
export async function confirmCheckout(
  firm: Firm,
  orderId: string,
  paymentId: string,
  signature: string,
  by: string,
) {
  if (!paymentsOn()) throw new Error("Online payment isn't set up");
  const expected = await hmacHex(process.env["RAZORPAY_KEY_SECRET"]!, `${orderId}|${paymentId}`);
  if (!same(expected, signature))
    throw new Error("Payment could not be verified. If money was taken, send SAHA the payment id.");
  const order = await rzp(`/orders/${encodeURIComponent(orderId)}`);
  const notes = (order["notes"] ?? {}) as { firm?: string; pack?: string };
  if (notes.firm !== firm.id) throw new Error("This payment belongs to another account");
  const pack = TOP_UP_PACKS.find((x) => x.id === notes.pack);
  if (!pack) throw new Error("This payment is not for an AI credit pack");
  return recordTopUp({
    paymentId,
    orderId,
    firmId: firm.id,
    packId: pack.id,
    amountPaise: Number(order["amount"]),
    credits: pack.credits,
    taxable: pack.pay,
    source: "checkout",
    by,
  });
}

/** Razorpay webhook (order.paid / payment.captured): credits arrive even if the browser closed. */
export async function handleWebhook(raw: string, signature: string) {
  const secret = process.env["RAZORPAY_WEBHOOK_SECRET"];
  if (!secret) throw new Error("Webhook secret not set");
  if (!same(await hmacHex(secret, raw), signature)) throw new Error("Bad signature");
  const ev = JSON.parse(raw) as {
    event: string;
    payload: {
      payment?: { entity: { id: string; order_id: string; amount: number; status: string } };
      order?: { entity: { id: string; notes?: { firm?: string; pack?: string } } };
    };
  };
  if (ev.event !== "order.paid" && ev.event !== "payment.captured") return { ignored: ev.event };
  const pay = ev.payload.payment?.entity;
  if (!pay?.order_id) return { ignored: "no order" };
  let notes = ev.payload.order?.entity.notes;
  if (!notes?.firm)
    notes = ((await rzp(`/orders/${encodeURIComponent(pay.order_id)}`))["notes"] ?? {}) as {
      firm?: string;
      pack?: string;
    };
  const pack = TOP_UP_PACKS.find((x) => x.id === notes?.pack);
  if (!notes?.firm || !pack) return { ignored: "not an AI credit order" };
  return recordTopUp({
    paymentId: pay.id,
    orderId: pay.order_id,
    firmId: notes.firm,
    packId: pack.id,
    amountPaise: pay.amount,
    credits: pack.credits,
    taxable: pack.pay,
    source: "webhook",
    by: "razorpay",
  });
}

export async function invoiceUrl(firmId: string | null, invoiceNo: string) {
  const sb = await db();
  let q = sb.from("billing_invoices").select("pdf_path,firm_id").eq("invoice_no", invoiceNo);
  if (firmId) q = q.eq("firm_id", firmId);
  const { data } = await q.maybeSingle();
  if (!data?.pdf_path) throw new Error("Invoice not found");
  const { data: s, error } = await sb.storage
    .from(INVOICE_BUCKET)
    .createSignedUrl(String(data.pdf_path), 300);
  if (error || !s?.signedUrl) throw new Error("Could not open the invoice");
  return s.signedUrl;
}

/* ── SAHA dashboard ── */
export async function dashboard() {
  const sb = await db();
  const { data: firms } = await sb
    .from("billing_firms")
    .select("id,name,active,balance,billing,created_at,updated_at")
    .order("name");
  const since = new Date();
  since.setUTCDate(1);
  since.setUTCHours(0, 0, 0, 0);
  const { data: ev } = await sb
    .from("billing_events")
    .select("firm_id,type,feature,credits,at")
    .gte("at", since.toISOString())
    .limit(50000);
  const { data: pays } = await sb
    .from("billing_payments")
    .select("firm_id,amount_paise,credits,created_at,invoice_no,source,payment_id")
    .order("created_at", { ascending: false })
    .limit(500);
  const month: Record<string, { used: number; uses: number; byFeature: Record<string, number> }> =
    {};
  for (const e of (ev ?? []) as {
    firm_id: string;
    type: string;
    feature: string | null;
    credits: number;
  }[]) {
    if (e.type !== "use" && e.type !== "refund") continue;
    const m = (month[e.firm_id] ??= { used: 0, uses: 0, byFeature: {} });
    m.used += -Number(e.credits);
    m.uses += e.type === "use" ? 1 : -1;
    if (e.feature) m.byFeature[e.feature] = (m.byFeature[e.feature] ?? 0) + -Number(e.credits);
  }
  return { firms: firms ?? [], month, payments: pays ?? [], payments_on: paymentsOn() };
}

export async function createFirm(id: string, name: string) {
  if (!/^[a-z0-9][a-z0-9-]{2,39}$/.test(id))
    throw new Error("Firm code: 3-40 lowercase letters, digits or dashes");
  const key = `sk_saha_${crypto.randomUUID().replace(/-/g, "")}${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
  const { error } = await (
    await db()
  )
    .from("billing_firms")
    .insert({ id, name, api_key_hash: await sha256Hex(key) });
  if (error)
    throw new Error(/duplicate/.test(error.message) ? "That firm code is taken" : error.message);
  return key;
}
export async function rotateKey(id: string) {
  const key = `sk_saha_${crypto.randomUUID().replace(/-/g, "")}${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
  await (
    await db()
  )
    .from("billing_firms")
    .update({ api_key_hash: await sha256Hex(key), updated_at: new Date().toISOString() })
    .eq("id", id);
  return key;
}
export async function setActive(id: string, active: boolean) {
  await (
    await db()
  )
    .from("billing_firms")
    .update({ active, updated_at: new Date().toISOString() })
    .eq("id", id);
}
export async function adjust(id: string, credits: number, note: string, by: string) {
  const { data, error } = await (
    await db()
  ).rpc("billing_adjust", { p_firm: id, p_credits: credits, p_note: note, p_by: by });
  if (error) throw new Error(error.message);
  return Number(data);
}
/** Bank transfer received: amount incl. GST; credits = amount before GST; invoice issued. */
export async function recordBankPayment(
  id: string,
  amountInclGst: number,
  ref: string,
  by: string,
) {
  const taxable = Math.round((amountInclGst / (1 + GST_PCT / 100)) * 100) / 100;
  return recordTopUp({
    paymentId: `bank:${ref}`,
    orderId: null,
    firmId: id,
    packId: "bank",
    amountPaise: Math.round(amountInclGst * 100),
    credits: taxable,
    taxable,
    source: "bank",
    by,
  });
}
export async function firmEvents(id: string) {
  const { data } = await (
    await db()
  )
    .from("billing_events")
    .select("*")
    .eq("firm_id", id)
    .order("at", { ascending: false })
    .limit(100);
  return data ?? [];
}

/** One entry point for the firm API (HTTP route, or in-process when the firm app is SAHA's own). */
export async function dispatch(
  action: string,
  firmId: string,
  key: string,
  body: Record<string, unknown>,
) {
  const firm = await verifyFirm(firmId, key);
  const user = String(body["user"] ?? "");
  switch (action) {
    case "reserve":
      return { id: await reserve(firm, body["feature"] as AiFeatureKey, user) };
    case "settle":
      await settle(String(body["id"]));
      return { ok: true };
    case "release":
      await release(String(body["id"]));
      return { ok: true };
    case "summary":
      return { ...(await summary(firm.id)), payments: paymentsOn() };
    case "order":
      return createOrder(
        firm,
        String(body["packId"]),
        (body["billing"] ?? {}) as Record<string, string>,
      );
    case "confirm":
      return confirmCheckout(
        firm,
        String(body["orderId"]),
        String(body["paymentId"]),
        String(body["signature"]),
        user,
      );
    case "invoice":
      return { url: await invoiceUrl(firm.id, String(body["invoiceNo"])) };
    default:
      throw new Error("Unknown action");
  }
}
