/**
 * Firm side of AI billing. With AI_BILLING=on, every AI use is reserved with SAHA's central
 * billing before it runs, settled when it succeeds and released (refunded) when it fails.
 *
 * Env on a firm's app:   AI_BILLING=on, SAHA_BILLING_URL=https://app.saha-developers.com,
 *                        SAHA_FIRM_ID=<code>, SAHA_FIRM_KEY=<key from SAHA's dashboard>
 * SAHA's own app is the central billing; it leaves AI_BILLING off (its own use isn't charged).
 * If SAHA_BILLING_URL is empty, calls go to the central code in this same app.
 */
import type { AiFeatureKey } from "@/lib/ai-plans";

export const billingOn = () => (process.env["AI_BILLING"] ?? "").toLowerCase() === "on";

export async function central<T>(action: string, body: Record<string, unknown> = {}): Promise<T> {
  const url = (process.env["SAHA_BILLING_URL"] ?? "").replace(/\/$/, "");
  const firmId = process.env["SAHA_FIRM_ID"] ?? "";
  const key = process.env["SAHA_FIRM_KEY"] ?? "";
  if (!firmId || !key)
    throw new Error("This app's SAHA billing account is not set up (SAHA_FIRM_ID / SAHA_FIRM_KEY)");
  if (!url) {
    const { dispatch } = await import("@/lib/billing/central.server");
    return (await dispatch(action, firmId, key, body)) as T;
  }
  const res = await fetch(`${url}/api/billing/${action}`, {
    method: "POST",
    headers: { "x-saha-firm": firmId, "x-saha-key": key, "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await res
    .json()
    .catch(() => ({ error: `SAHA billing answered ${res.status}` }))) as T & { error?: string };
  if (!res.ok) throw new Error(data.error ?? `SAHA billing answered ${res.status}`);
  return data;
}

/** Reserve the price of one AI use; returns a reservation id, or null when billing is off. */
export async function reserveAi(feature: AiFeatureKey, user: string): Promise<string | null> {
  if (!billingOn()) return null;
  const r = await central<{ id: string }>("reserve", { feature, user });
  return r.id;
}
export async function settleAi(id: string | null) {
  if (id) await central("settle", { id }).catch(() => undefined);
}
export async function releaseAi(id: string | null) {
  if (id) await central("release", { id }).catch(() => undefined);
}
