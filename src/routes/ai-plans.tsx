import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  AlertTriangle,
  CheckCircle2,
  CreditCard,
  Sparkles,
  Wallet as WalletIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Shell } from "@/components/saha/Shell";
import { supabase } from "@/integrations/supabase/client";
import { useAccess } from "@/lib/access";
import { useAiConfigured, AI_OFF_REASON } from "@/hooks/useAiStatus";
import {
  AI_FEATURES,
  GSTIN_RE,
  PLAN_FILE,
  emptyBilling,
  isOn,
  type AiFeatureKey,
  type Billing,
  type Plan,
} from "@/lib/ai-plans";
import { GST_PCT, LOW_BALANCE, PRICE_PER_USE, TOP_UP_PACKS } from "@/lib/ai-credits";
import { confirmTopUp, createTopUp, getCredits, getInvoiceLink } from "@/lib/ai-credits.functions";

export const Route = createFileRoute("/ai-plans")({
  head: () => ({
    meta: [
      { title: "AI Features & Plans | Saha OS" },
      {
        name: "description",
        content:
          "Every AI feature in Saha OS and its price per use; prepaid AI credits, top-ups, usage, and the firm's billing details.",
      },
    ],
  }),
  component: Page,
});

const BUCKET = "site-media";
const inr = (n: number, d = 0) =>
  `₹${n.toLocaleString("en-IN", { maximumFractionDigits: d, minimumFractionDigits: d })}`;
const FEATURE_NAME = Object.fromEntries(AI_FEATURES.map((f) => [f.key, f.name])) as Record<
  AiFeatureKey,
  string
>;

declare global {
  interface Window {
    Razorpay?: new (o: Record<string, unknown>) => {
      open: () => void;
      on: (ev: string, fn: (r: unknown) => void) => void;
    };
  }
}
function loadRazorpay() {
  return new Promise<void>((resolve, reject) => {
    if (window.Razorpay) return resolve();
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Could not load the payment window"));
    document.body.appendChild(s);
  });
}

function Page() {
  const access = useAccess();
  const isAdmin = Boolean(access.access?.isAdmin);
  const ai = useAiConfigured();
  const qc = useQueryClient();
  const credits = useServerFn(getCredits);
  const topUp = useServerFn(createTopUp);
  const confirm = useServerFn(confirmTopUp);
  const invoiceLink = useServerFn(getInvoiceLink);

  const planQ = useQuery({
    queryKey: ["ai-plan"],
    queryFn: async () => {
      const dl = await supabase.storage.from(BUCKET).download(PLAN_FILE);
      if (!dl.data) return null;
      try {
        return JSON.parse(await dl.data.text()) as Plan;
      } catch {
        return null;
      }
    },
  });
  const cq = useQuery({ queryKey: ["ai-credits"], queryFn: () => credits(), retry: false });

  const plan = planQ.data ?? null;
  const [features, setFeatures] = useState<Partial<Record<AiFeatureKey, boolean>> | null>(null);
  const [usage, setUsage] = useState<Partial<Record<AiFeatureKey, number>> | null>(null);
  const [billing, setBilling] = useState<Billing | null>(null);
  const F = features ?? Object.fromEntries(AI_FEATURES.map((f) => [f.key, isOn(plan, f.key)]));
  const U = usage ?? plan?.usage ?? {};
  const B = billing ?? { ...emptyBilling(), ...(plan?.billing ?? {}) };
  const uses = (k: AiFeatureKey) => U[k] ?? AI_FEATURES.find((f) => f.key === k)!.usesPerMonth;
  const chosen = AI_FEATURES.filter((f) => F[f.key]);
  const estMonthly = chosen.reduce((s, f) => s + PRICE_PER_USE[f.key] * uses(f.key), 0);

  const c = cq.data;
  const w = c?.billing ? c : null;
  const thisMonth = c?.byFeature ?? {};
  const spentThisMonth = c?.used ?? 0;

  const savePlan = useMutation({
    mutationFn: async () => {
      if (!B.firm.trim()) throw new Error("Enter the firm's name");
      if (B.gstin && !GSTIN_RE.test(B.gstin.toUpperCase()))
        throw new Error("That GSTIN doesn't look right (15 characters, e.g. 36ABCDE1234F1Z5)");
      if (!/^\S+@\S+\.\S+$/.test(B.email)) throw new Error("Enter a billing email");
      const body: Plan = {
        features: F,
        usage: U,
        billing: { ...B, gstin: B.gstin.toUpperCase(), pan: B.pan.toUpperCase() },
        savedAt: new Date().toISOString(),
        savedBy: access.access?.email ?? "",
      };
      const blob = new Blob([JSON.stringify(body, null, 1)], { type: "application/json" });
      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(PLAN_FILE, blob, { upsert: true, contentType: "application/json" });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Saved. Features you left out are now switched off in this app.");
      setFeatures(null);
      setUsage(null);
      setBilling(null);
      qc.invalidateQueries({ queryKey: ["ai-plan"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const buy = useMutation({
    mutationFn: async (packId: string) => {
      if (!plan?.billing?.firm)
        throw new Error("Save the firm's billing details first (they go on the GST invoice)");
      const o = await topUp({ data: { packId } });
      await loadRazorpay();
      return new Promise<string>((resolve, reject) => {
        const rz = new window.Razorpay!({
          key: o.keyId,
          order_id: o.orderId,
          amount: o.amount,
          currency: "INR",
          name: "SAHA OS",
          description: `AI credits · ${o.pack.label} · ${o.pack.credits.toLocaleString("en-IN")} credits`,
          prefill: {
            name: plan.billing.contact,
            email: plan.billing.email,
            contact: plan.billing.phone,
          },
          notes: { firm: plan.billing.firm, gstin: plan.billing.gstin },
          theme: { color: "#1f3a2e" },
          handler: async (r: {
            razorpay_order_id: string;
            razorpay_payment_id: string;
            razorpay_signature: string;
          }) => {
            try {
              const res = await confirm({
                data: {
                  orderId: r.razorpay_order_id,
                  paymentId: r.razorpay_payment_id,
                  signature: r.razorpay_signature,
                },
              });
              resolve(
                `${o.pack.credits.toLocaleString("en-IN")} credits added${res.invoiceNo ? ` · GST invoice ${res.invoiceNo}` : ""}.`,
              );
            } catch (e) {
              reject(e);
            }
          },
          modal: { ondismiss: () => reject(new Error("Payment cancelled")) },
        });
        rz.on("payment.failed", () =>
          reject(new Error("The payment failed. No credits were added.")),
        );
        rz.open();
      });
    },
    onSuccess: (m) => {
      toast.success(m);
      qc.invalidateQueries({ queryKey: ["ai-credits"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const openInvoice = useMutation({
    mutationFn: (invoiceNo: string) => invoiceLink({ data: { invoiceNo } }),
    onSuccess: (r) => window.open(r.url, "_blank", "noopener"),
    onError: (e: Error) => toast.error(e.message),
  });

  const input =
    "w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm disabled:opacity-60";
  const setB = (patch: Partial<Billing>) => setBilling({ ...B, ...patch });

  return (
    <Shell title="AI Features & Plans">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 p-4">
        <header className="rounded-2xl border border-border bg-card p-5">
          <p className="label-caps text-primary">Your Saha OS plan</p>
          <h1 className="text-2xl font-extrabold">AI features and credits</h1>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            AI in Saha OS runs on prepaid credits (1 credit = ₹1). Each AI use takes a fixed number
            of credits, only when it succeeds. Switch off any feature your firm doesn't want.
            Everything else in Saha OS works without credits.
          </p>
          {ai === false && (
            <p className="mt-3 flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" /> {AI_OFF_REASON}
            </p>
          )}
          {c && !c.billing && (
            <p className="mt-3 rounded-lg bg-muted p-3 text-sm">
              Credits are not in use on this app: AI is not charged here. Firms' apps run with
              credits switched on.
            </p>
          )}
        </header>

        {c?.billing && w && (
          <section className="rounded-2xl border border-primary/40 bg-card p-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="label-caps text-muted-foreground">AI credit balance</p>
                <p
                  className={`text-3xl font-extrabold tnum ${w.balance < LOW_BALANCE ? "text-amber-700" : ""}`}
                >
                  <WalletIcon className="mr-1 inline size-6" /> {inr(w.balance)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Used this month {inr(spentThisMonth)} · bought to date {inr(w.topupTotal)}
                </p>
              </div>
              {w.balance < LOW_BALANCE && (
                <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
                  Low balance: AI features stop when credits run out.
                </p>
              )}
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {TOP_UP_PACKS.map((p) => (
                <div key={p.id} className="rounded-xl border border-border p-3">
                  <p className="font-semibold">{p.label}</p>
                  <p className="text-sm">{p.credits.toLocaleString("en-IN")} credits</p>
                  <p className="text-xs text-muted-foreground">
                    {inr(p.pay)} + {GST_PCT}% GST = {inr(p.pay * (1 + GST_PCT / 100), 2)}
                  </p>
                  {c.payments ? (
                    <button
                      type="button"
                      disabled={!isAdmin || buy.isPending}
                      onClick={() => buy.mutate(p.id)}
                      className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
                    >
                      <CreditCard className="size-4" />{" "}
                      {buy.isPending ? "Opening…" : `Pay ${inr(p.pay * (1 + GST_PCT / 100))}`}
                    </button>
                  ) : (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Online payment coming soon. Contact SAHA to top up by bank transfer.
                    </p>
                  )}
                </div>
              ))}
            </div>
            {!isAdmin && (
              <p className="mt-2 text-xs text-muted-foreground">Only an admin can buy credits.</p>
            )}

            {Object.keys(thisMonth).length > 0 && (
              <div className="mt-4">
                <p className="label-caps text-muted-foreground">This month by feature</p>
                <div className="mt-1 flex flex-col divide-y divide-border rounded-lg border border-border text-sm">
                  {Object.entries(thisMonth).map(([k, r]) => (
                    <div key={k} className="flex justify-between gap-3 p-2">
                      <span>{FEATURE_NAME[k as AiFeatureKey] ?? k}</span>
                      <span className="tnum">
                        {r?.uses} uses · {inr(r?.credits ?? 0)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {w.recent.length > 0 && (
              <details className="mt-3 text-sm">
                <summary className="cursor-pointer text-muted-foreground">
                  Recent credit activity
                </summary>
                <div className="mt-1 flex flex-col divide-y divide-border rounded-lg border border-border">
                  {w.recent.map((e) => (
                    <div key={`${e.id}-${e.at}`} className="flex justify-between gap-3 p-2">
                      <span>
                        {new Date(e.at).toLocaleString("en-IN", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}{" "}
                        ·{" "}
                        {e.type === "use"
                          ? (FEATURE_NAME[e.feature as AiFeatureKey] ?? e.feature)
                          : e.type === "topup"
                            ? "Top-up"
                            : e.type === "refund"
                              ? "Refund (AI run failed)"
                              : "Adjustment"}
                        {e.ref && <span className="text-muted-foreground"> · {e.ref}</span>}
                      </span>
                      <span className={`tnum ${e.credits > 0 ? "text-emerald-700" : ""}`}>
                        {e.credits > 0 ? "+" : ""}
                        {inr(e.credits)}
                      </span>
                    </div>
                  ))}
                </div>
              </details>
            )}
            {c.invoices.length > 0 && (
              <div className="mt-3 text-sm">
                <p className="label-caps text-muted-foreground">GST invoices</p>
                <div className="mt-1 flex flex-col divide-y divide-border rounded-lg border border-border">
                  {c.invoices.map((v) => (
                    <button
                      key={v.invoice_no}
                      type="button"
                      onClick={() => openInvoice.mutate(v.invoice_no)}
                      className="flex justify-between gap-3 p-2 text-left hover:bg-muted/50"
                    >
                      <span className="text-primary underline">{v.invoice_no}</span>
                      <span className="tnum">
                        {new Date(v.created_at).toLocaleDateString("en-IN")} ·{" "}
                        {inr(Number(v.total), 2)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        <section className="flex flex-col gap-3">
          {AI_FEATURES.map((f) => {
            const on = Boolean(F[f.key]);
            return (
              <div
                key={f.key}
                className={`rounded-2xl border p-4 ${on ? "border-primary/40 bg-card" : "border-border bg-muted/30"}`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    className="mt-1.5 size-4"
                    checked={on}
                    disabled={!isAdmin}
                    onChange={(e) => setFeatures({ ...F, [f.key]: e.target.checked })}
                    aria-label={`Include ${f.name}`}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <p className="flex items-center gap-1.5 font-semibold">
                        <Sparkles className="size-4 text-primary" /> {f.name}
                      </p>
                      <p className="text-sm font-semibold tnum">
                        {inr(PRICE_PER_USE[f.key])}{" "}
                        <span className="font-normal text-muted-foreground">per {f.per}</span>
                      </p>
                    </div>
                    <p className="mt-0.5 text-sm text-muted-foreground">{f.does}</p>
                    <div className="mt-2 flex flex-wrap items-end gap-3 text-sm">
                      <p className="text-xs">
                        In the app:{" "}
                        {f.where.map((x, i) => (
                          <span key={x.to}>
                            {i > 0 && ", "}
                            <Link to={x.to} className="text-primary underline">
                              {x.label}
                            </Link>
                          </span>
                        ))}
                      </p>
                      <label className="ml-auto w-28">
                        <span className="text-xs text-muted-foreground">Uses / month</span>
                        <input
                          type="number"
                          className={input}
                          value={uses(f.key)}
                          disabled={!isAdmin}
                          onChange={(e) => setUsage({ ...U, [f.key]: Number(e.target.value) || 0 })}
                        />
                      </label>
                      <p className="w-28 text-right">
                        <span className="block text-xs text-muted-foreground">≈ per month</span>
                        <span className="tnum">{inr(PRICE_PER_USE[f.key] * uses(f.key))}</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          <p className="px-1 text-sm">
            Estimated AI spend for the features ticked:{" "}
            <span className="font-semibold tnum">{inr(estMonthly)}</span> a month (+ {GST_PCT}% GST
            on top-ups).
          </p>
        </section>

        <section className="rounded-2xl border border-border bg-card p-4">
          <p className="label-caps text-muted-foreground">Billing details (for GST invoices)</p>
          <p className="mt-1 text-xs text-muted-foreground">
            No card or bank details are stored in the app; payments go through the payment gateway.
          </p>
          <div className="mt-3 grid gap-3 text-sm md:grid-cols-2">
            {(
              [
                ["firm", "Firm / company name"],
                ["gstin", "GSTIN"],
                ["pan", "PAN"],
                ["contact", "Billing contact"],
                ["email", "Billing email"],
                ["phone", "Phone"],
                ["state", "State"],
                ["pin", "PIN code"],
                ["poRef", "PO / reference (optional)"],
              ] as [keyof Billing, string][]
            ).map(([k, label]) => (
              <label key={k}>
                <span className="text-xs text-muted-foreground">{label}</span>
                <input
                  className={input}
                  value={B[k]}
                  disabled={!isAdmin}
                  onChange={(e) => setB({ [k]: e.target.value } as Partial<Billing>)}
                />
              </label>
            ))}
            <label className="md:col-span-2">
              <span className="text-xs text-muted-foreground">Billing address</span>
              <textarea
                className={input}
                rows={2}
                value={B.address}
                disabled={!isAdmin}
                onChange={(e) => setB({ address: e.target.value })}
              />
            </label>
          </div>
          {isAdmin ? (
            <button
              type="button"
              disabled={savePlan.isPending}
              onClick={() => savePlan.mutate()}
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
            >
              <CheckCircle2 className="size-4" />{" "}
              {savePlan.isPending ? "Saving…" : "Save features and billing details"}
            </button>
          ) : (
            <p className="mt-3 text-xs text-muted-foreground">Only an admin can change the plan.</p>
          )}
        </section>
      </div>
    </Shell>
  );
}
