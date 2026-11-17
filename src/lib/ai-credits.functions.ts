import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { PLAN_FILE, type Plan } from "@/lib/ai-plans";
import type { CreditsSummary } from "@/lib/ai-credits";

async function isAppAdmin(supabase: { from: (t: string) => any }, userId: string) {
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  return ((data ?? []) as { role: string }[]).some((r) => r.role === "admin");
}

/** The firm's balance, this month's use, recent activity and invoices (from SAHA's central billing). */
export const getCredits = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async (): Promise<CreditsSummary> => {
    const { billingOn, central } = await import("@/lib/ai-credits.server");
    if (!billingOn())
      return {
        billing: false,
        payments: false,
        balance: 0,
        used: 0,
        topupTotal: 0,
        byFeature: {},
        recent: [],
        invoices: [],
      };
    const s = await central<{
      firm: { balance: number };
      used: number;
      topupTotal: number;
      byFeature: CreditsSummary["byFeature"];
      recent: CreditsSummary["recent"];
      invoices: CreditsSummary["invoices"];
      payments: boolean;
    }>("summary");
    return {
      billing: true,
      payments: s.payments,
      balance: Number(s.firm.balance),
      used: s.used,
      topupTotal: s.topupTotal,
      byFeature: s.byFeature,
      recent: s.recent,
      invoices: s.invoices,
    };
  });

/** Start a top-up: SAHA's billing creates the Razorpay order (price + GST). */
export const createTopUp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { packId: string }) => input)
  .handler(async ({ data, context }) => {
    const { billingOn, central } = await import("@/lib/ai-credits.server");
    if (!billingOn()) throw new Error("AI credits are not in use on this app");
    if (!(await isAppAdmin(context.supabase, context.userId)))
      throw new Error("Only an admin can buy AI credits");
    const dl = await context.supabase.storage.from("site-media").download(PLAN_FILE);
    const plan = dl.data ? ((JSON.parse(await dl.data.text()) as Plan) ?? null) : null;
    if (!plan?.billing?.firm)
      throw new Error("Save the firm's billing details first (they go on the GST invoice)");
    return central<{
      orderId: string;
      amount: number;
      keyId: string;
      pack: { id: string; label: string; credits: number };
    }>("order", { packId: data.packId, billing: plan.billing, user: context.userId });
  });

/** Finish a top-up from the browser. Razorpay's webhook also confirms it, so closing the browser is safe. */
export const confirmTopUp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { orderId: string; paymentId: string; signature: string }) => input)
  .handler(async ({ data, context }) => {
    const { central } = await import("@/lib/ai-credits.server");
    return central<{ invoiceNo: string | null; duplicate: boolean }>("confirm", {
      ...data,
      user: context.userId,
    });
  });

/** A short-lived link to one of the firm's GST invoices. */
export const getInvoiceLink = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { invoiceNo: string }) => input)
  .handler(async ({ data }) => {
    const { central } = await import("@/lib/ai-credits.server");
    return central<{ url: string }>("invoice", { invoiceNo: data.invoiceNo });
  });
