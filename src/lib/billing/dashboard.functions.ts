import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** SAHA staff only: their sign-in email must be in SAHA_ADMIN_EMAILS. */
function assertSaha(claims: unknown) {
  const email = String((claims as { email?: string }).email ?? "").toLowerCase();
  const list = (process.env["SAHA_ADMIN_EMAILS"] ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (!list.includes(email)) throw new Error("Only SAHA staff can open the billing dashboard");
  return email;
}

export const sahaDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    assertSaha(context.claims);
    const c = await import("@/lib/billing/central.server");
    return c.dashboard();
  });

export const sahaFirmAction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      action: "create" | "rotate" | "active" | "adjust" | "bank" | "events" | "invoice";
      id: string;
      name?: string;
      active?: boolean;
      credits?: number;
      amount?: number;
      note?: string;
      invoiceNo?: string;
    }) => input,
  )
  .handler(async ({ data, context }) => {
    const by = assertSaha(context.claims);
    const c = await import("@/lib/billing/central.server");
    switch (data.action) {
      case "create":
        return { key: await c.createFirm(data.id.trim(), (data.name ?? "").trim() || data.id) };
      case "rotate":
        return { key: await c.rotateKey(data.id) };
      case "active":
        await c.setActive(data.id, Boolean(data.active));
        return { ok: true };
      case "adjust": {
        if (!data.credits || !data.note?.trim()) throw new Error("Enter credits and a note");
        return { balance: await c.adjust(data.id, data.credits, data.note.trim(), by) };
      }
      case "bank": {
        if (!data.amount || data.amount <= 0 || !data.note?.trim())
          throw new Error("Enter the amount received (incl. GST) and the bank reference");
        return c.recordBankPayment(data.id, data.amount, data.note.trim(), by);
      }
      case "events":
        return { events: await c.firmEvents(data.id) };
      case "invoice":
        return { url: await c.invoiceUrl(null, String(data.invoiceNo)) };
    }
  });
