import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, Save, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Shell } from "@/components/saha/Shell";
import { supabase } from "@/integrations/supabase/client";
import { useAccess } from "@/lib/access";
import { useAiConfigured, AI_OFF_REASON } from "@/hooks/useAiStatus";
import {
  AI_FEATURES,
  GSTIN_RE,
  PLAN_FILE,
  PRICING_FILE,
  RATE_IN,
  RATE_OUT,
  costPerUse,
  defaultPricing,
  emptyBilling,
  isOn,
  type AiFeatureKey,
  type Billing,
  type Plan,
  type Pricing,
} from "@/lib/ai-plans";

export const Route = createFileRoute("/ai-plans")({
  head: () => ({
    meta: [
      { title: "AI Features & Plans | Saha OS" },
      {
        name: "description",
        content:
          "Every AI feature in Saha OS with what it does, its running cost and its price; choose the features for your firm's app and enter your billing details.",
      },
    ],
  }),
  component: Page,
});

const BUCKET = "site-media";
const inr = (n: number, d = 0) =>
  `₹${n.toLocaleString("en-IN", { maximumFractionDigits: d, minimumFractionDigits: d })}`;
async function readJson<T>(path: string): Promise<T | null> {
  const dl = await supabase.storage.from(BUCKET).download(path);
  if (!dl.data) return null;
  try {
    return JSON.parse(await dl.data.text()) as T;
  } catch {
    return null;
  }
}
async function putJson(path: string, body: unknown) {
  const blob = new Blob([JSON.stringify(body, null, 1)], { type: "application/json" });
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, blob, { upsert: true, contentType: "application/json" });
  if (error) throw error;
}

function Page() {
  const access = useAccess();
  const isAdmin = Boolean(access.access?.isAdmin);
  const ai = useAiConfigured();
  const qc = useQueryClient();
  const saved = useQuery({
    queryKey: ["ai-plan"],
    queryFn: async () => ({
      pricing: { ...defaultPricing(), ...((await readJson<Pricing>(PRICING_FILE)) ?? {}) },
      plan: await readJson<Plan>(PLAN_FILE),
    }),
  });
  const [pricing, setPricing] = useState<Pricing | null>(null);
  const [features, setFeatures] = useState<Partial<Record<AiFeatureKey, boolean>> | null>(null);
  const [billing, setBilling] = useState<Billing | null>(null);

  const P = pricing ?? saved.data?.pricing ?? defaultPricing();
  const plan = saved.data?.plan ?? null;
  const F = features ?? Object.fromEntries(AI_FEATURES.map((f) => [f.key, isOn(plan, f.key)]));
  const B = billing ?? { ...emptyBilling(), ...(plan?.billing ?? {}) };

  const uses = (k: AiFeatureKey) =>
    P.usage[k] ?? AI_FEATURES.find((f) => f.key === k)!.usesPerMonth;
  const chosen = AI_FEATURES.filter((f) => F[f.key]);
  const monthly = P.baseFee + chosen.reduce((s, f) => s + (P.prices[f.key] ?? 0), 0);
  const running = chosen.reduce((s, f) => s + costPerUse(f, P.usdInr) * uses(f.key), 0);
  const cycleMonths = B.cycle === "annual" ? 12 : 1;
  const beforeGst =
    monthly * cycleMonths * (B.cycle === "annual" ? 1 - P.annualDiscountPct / 100 : 1);
  const gst = beforeGst * 0.18;
  const unpriced = chosen.filter((f) => !(P.prices[f.key]! > 0));

  const savePricing = useMutation({
    mutationFn: () => putJson(PRICING_FILE, { ...P, updatedAt: new Date().toISOString() }),
    onSuccess: () => {
      toast.success("Prices saved");
      setPricing(null);
      qc.invalidateQueries({ queryKey: ["ai-plan"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const savePlan = useMutation({
    mutationFn: async () => {
      if (!B.firm.trim()) throw new Error("Enter the firm's name");
      if (B.gstin && !GSTIN_RE.test(B.gstin.toUpperCase()))
        throw new Error("That GSTIN doesn't look right (15 characters, e.g. 36ABCDE1234F1Z5)");
      if (!/^\S+@\S+\.\S+$/.test(B.email)) throw new Error("Enter a billing email");
      const body: Plan = {
        features: F,
        billing: { ...B, gstin: B.gstin.toUpperCase(), pan: B.pan.toUpperCase() },
        quote: {
          monthly,
          gst: Math.round(gst),
          total: Math.round(beforeGst + gst),
          cycle: B.cycle,
        },
        savedAt: new Date().toISOString(),
        savedBy: access.access?.email ?? "",
      };
      await putJson(PLAN_FILE, body);
    },
    onSuccess: () => {
      toast.success("Plan saved. Features you left out are now switched off in this app.");
      setFeatures(null);
      setBilling(null);
      qc.invalidateQueries({ queryKey: ["ai-plan"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const input =
    "w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm disabled:opacity-60";
  const setB = (patch: Partial<Billing>) => setBilling({ ...B, ...patch });
  const setP = (patch: Partial<Pricing>) => setPricing({ ...P, ...patch });

  return (
    <Shell title="AI Features & Plans">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 p-4">
        <header className="rounded-2xl border border-border bg-card p-5">
          <p className="label-caps text-primary">Your Saha OS plan</p>
          <h1 className="text-2xl font-extrabold">AI features and plans</h1>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            Choose the AI features your firm wants. Features you leave out are switched off in your
            app; everything else in Saha OS (BOQ, site, stock, QA, accounts, team chat) works the
            same. The running cost is Google's AI charge for typical use; the price is what your
            plan costs.
          </p>
          {plan && (
            <p className="mt-2 text-sm">
              Current plan: <span className="font-semibold">{plan.billing.firm}</span> ·{" "}
              {AI_FEATURES.filter((f) => isOn(plan, f.key)).length} of {AI_FEATURES.length} AI
              features · saved {new Date(plan.savedAt).toLocaleDateString("en-IN")}
            </p>
          )}
          {ai === false && (
            <p className="mt-3 flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" /> {AI_OFF_REASON}
            </p>
          )}
        </header>

        <section className="flex flex-col gap-3">
          {AI_FEATURES.map((f) => {
            const per = costPerUse(f, P.usdInr);
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
                    <p className="flex items-center gap-1.5 font-semibold">
                      <Sparkles className="size-4 text-primary" /> {f.name}
                    </p>
                    <p className="mt-0.5 text-sm text-muted-foreground">{f.does}</p>
                    <p className="mt-1 text-xs">
                      In the app:{" "}
                      {f.where.map((w, i) => (
                        <span key={w.to}>
                          {i > 0 && ", "}
                          <Link to={w.to} className="text-primary underline">
                            {w.label}
                          </Link>
                        </span>
                      ))}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-end gap-3 pl-7 text-sm">
                  <div className="min-w-[9rem]">
                    <p className="text-xs text-muted-foreground">Running cost</p>
                    <p className="tnum">
                      {inr(per, 2)} per {f.per}
                    </p>
                  </div>
                  <label className="w-32">
                    <span className="text-xs text-muted-foreground">Uses / month</span>
                    <input
                      type="number"
                      className={input}
                      value={uses(f.key)}
                      disabled={!isAdmin}
                      onChange={(e) =>
                        setP({ usage: { ...P.usage, [f.key]: Number(e.target.value) || 0 } })
                      }
                    />
                  </label>
                  <div className="min-w-[8rem]">
                    <p className="text-xs text-muted-foreground">≈ running / month</p>
                    <p className="tnum">{inr(per * uses(f.key))}</p>
                  </div>
                  <label className="w-40">
                    <span className="text-xs text-muted-foreground">Price / month</span>
                    <input
                      type="number"
                      className={input}
                      placeholder="Set price"
                      value={P.prices[f.key] || ""}
                      disabled={!isAdmin}
                      onChange={(e) =>
                        setP({ prices: { ...P.prices, [f.key]: Number(e.target.value) || 0 } })
                      }
                    />
                  </label>
                </div>
              </div>
            );
          })}
        </section>

        <section className="rounded-2xl border border-border bg-card p-4">
          <p className="label-caps text-muted-foreground">Plan settings (admin)</p>
          <div className="mt-2 flex flex-wrap gap-3 [&>label]:min-w-[10rem] [&>label]:flex-1 text-sm">
            <label>
              <span className="text-xs text-muted-foreground">
                Platform fee / month (non-AI modules)
              </span>
              <input
                type="number"
                className={input}
                value={P.baseFee || ""}
                disabled={!isAdmin}
                onChange={(e) => setP({ baseFee: Number(e.target.value) || 0 })}
              />
            </label>
            <label>
              <span className="text-xs text-muted-foreground">Annual plan discount %</span>
              <input
                type="number"
                className={input}
                value={P.annualDiscountPct || ""}
                disabled={!isAdmin}
                onChange={(e) => setP({ annualDiscountPct: Number(e.target.value) || 0 })}
              />
            </label>
            <label>
              <span className="text-xs text-muted-foreground">USD → INR for running cost</span>
              <input
                type="number"
                className={input}
                value={P.usdInr}
                disabled={!isAdmin}
                onChange={(e) => setP({ usdInr: Number(e.target.value) || 0 })}
              />
            </label>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Running cost uses Google's Gemini 3.7 Flash rates from 1 Jan 2027 (${RATE_IN} per
            million input tokens, ${RATE_OUT} per million output) and typical document sizes; actual
            cost depends on how big the drawings and lists are.
          </p>
          {isAdmin && (
            <button
              type="button"
              disabled={pricing === null || savePricing.isPending}
              onClick={() => savePricing.mutate()}
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-primary px-3 py-1.5 text-sm font-semibold text-primary disabled:opacity-50"
            >
              <Save className="size-4" /> Save prices and usage
            </button>
          )}
        </section>

        <section className="rounded-2xl border border-border bg-card p-4">
          <p className="label-caps text-muted-foreground">Billing details</p>
          <p className="mt-1 text-xs text-muted-foreground">
            For invoices only. No card or bank details are taken in the app.
          </p>
          <div className="mt-3 grid gap-3 md:grid-cols-2 text-sm">
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
                  value={B[k] as string}
                  disabled={!isAdmin}
                  onChange={(e) => setB({ [k]: e.target.value } as Partial<Billing>)}
                />
              </label>
            ))}
            <label>
              <span className="text-xs text-muted-foreground">Billing cycle</span>
              <select
                className={input}
                value={B.cycle}
                disabled={!isAdmin}
                onChange={(e) => setB({ cycle: e.target.value as Billing["cycle"] })}
              >
                <option value="monthly">Monthly</option>
                <option value="annual">
                  Annual{P.annualDiscountPct ? ` (−${P.annualDiscountPct}%)` : ""}
                </option>
              </select>
            </label>
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
        </section>

        <section className="rounded-2xl border border-primary/40 bg-card p-4">
          <p className="label-caps text-primary">Your plan</p>
          <div className="mt-2 grid gap-2 text-sm md:grid-cols-2">
            <p>
              AI features chosen:{" "}
              <span className="font-semibold">
                {chosen.length} of {AI_FEATURES.length}
              </span>
            </p>
            <p>
              Plan per month: <span className="font-semibold tnum">{inr(monthly)}</span>
            </p>
            <p>
              {B.cycle === "annual" ? "Annual" : "Monthly"} amount before GST:{" "}
              <span className="font-semibold tnum">{inr(beforeGst)}</span>
            </p>
            <p>
              GST 18%: <span className="tnum">{inr(gst)}</span> · Total{" "}
              <span className="font-semibold tnum">{inr(beforeGst + gst)}</span>
            </p>
            {isAdmin && (
              <p className="text-muted-foreground">
                AI running cost at the usage above ≈ <span className="tnum">{inr(running)}</span> /
                month
              </p>
            )}
          </div>
          {unpriced.length > 0 && (
            <p className="mt-2 text-xs text-amber-800">
              No price set yet for: {unpriced.map((f) => f.name).join(", ")}.
            </p>
          )}
          {isAdmin ? (
            <button
              type="button"
              disabled={savePlan.isPending}
              onClick={() => savePlan.mutate()}
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
            >
              <CheckCircle2 className="size-4" />{" "}
              {savePlan.isPending ? "Saving…" : "Save plan and switch features"}
            </button>
          ) : (
            <p className="mt-3 text-xs text-muted-foreground">Only an admin can change the plan.</p>
          )}
        </section>
      </div>
    </Shell>
  );
}
