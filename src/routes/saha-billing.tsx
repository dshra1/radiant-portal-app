import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle, Copy, FileText, KeyRound, Plus } from "lucide-react";
import { toast } from "sonner";
import { Shell } from "@/components/saha/Shell";
import { AI_FEATURES, type AiFeatureKey } from "@/lib/ai-plans";
import { sahaDashboard, sahaFirmAction } from "@/lib/billing/dashboard.functions";

export const Route = createFileRoute("/saha-billing")({
  head: () => ({ meta: [{ title: "Billing dashboard (SAHA) | SiteYantra" }] }),
  component: Page,
});

const inr = (n: number) => `₹${Number(n).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
const NAME = Object.fromEntries(AI_FEATURES.map((f) => [f.key, f.name])) as Record<
  AiFeatureKey,
  string
>;
type FirmRow = {
  id: string;
  name: string;
  active: boolean;
  balance: number;
  billing: Record<string, string>;
  updated_at: string;
};
type Pay = {
  firm_id: string;
  amount_paise: number;
  credits: number;
  created_at: string;
  invoice_no: string | null;
  source: string;
  payment_id: string;
};

function Page() {
  const qc = useQueryClient();
  const dash = useServerFn(sahaDashboard);
  const act = useServerFn(sahaFirmAction);
  const q = useQuery({ queryKey: ["saha-dash"], queryFn: () => dash(), retry: false });
  const [nf, setNf] = useState({ id: "", name: "" });
  const [key, setKey] = useState<{ id: string; key: string } | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [form, setForm] = useState<
    Record<string, { credits: string; amount: string; note: string }>
  >({});
  const refresh = () => qc.invalidateQueries({ queryKey: ["saha-dash"] });

  const run = useMutation({
    mutationFn: (v: Parameters<typeof act>[0]["data"]) => act({ data: v }),
    onSuccess: (r, v) => {
      if (r && "key" in r && r.key) setKey({ id: v.id, key: r.key });
      if (v.action === "invoice" && r && "url" in r) window.open(r.url, "_blank", "noopener");
      if (v.action === "bank" && r && "invoiceNo" in r)
        toast.success(r.invoiceNo ? `Recorded. Invoice ${r.invoiceNo}` : "Already recorded");
      else if (v.action === "adjust") toast.success("Credits adjusted");
      if (v.action !== "invoice" && v.action !== "events") refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const events = useMutation({
    mutationFn: (id: string) => act({ data: { action: "events", id } }),
  });

  if (q.isError)
    return (
      <Shell title="Billing dashboard">
        <p className="m-6 flex items-start gap-2 rounded-lg bg-amber-50 p-4 text-sm text-amber-900">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" /> {(q.error as Error).message}
        </p>
      </Shell>
    );
  const d = q.data;
  const firms = (d?.firms ?? []) as FirmRow[];
  const pays = (d?.payments ?? []) as Pay[];
  const month = d?.month ?? {};
  const totals = {
    balance: firms.reduce((s, f) => s + Number(f.balance), 0),
    used: Object.values(month).reduce((s, m) => s + m.used, 0),
    paid: pays
      .filter((p) => p.created_at.slice(0, 7) === new Date().toISOString().slice(0, 7))
      .reduce((s, p) => s + p.amount_paise / 100, 0),
  };
  const input = "w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm";
  const F = (id: string) => form[id] ?? { credits: "", amount: "", note: "" };
  const setF = (id: string, patch: Partial<{ credits: string; amount: string; note: string }>) =>
    setForm({ ...form, [id]: { ...F(id), ...patch } });

  return (
    <Shell title="Billing dashboard">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 p-4">
        <header className="rounded-2xl border border-border bg-card p-5">
          <p className="label-caps text-primary">SAHA only</p>
          <h1 className="text-2xl font-extrabold">AI billing across all firms</h1>
          <div className="mt-3 grid gap-3 sm:grid-cols-4">
            {[
              ["Firms", String(firms.length)],
              ["Credits held by firms", inr(totals.balance)],
              ["AI used this month", inr(totals.used)],
              ["Received this month (incl. GST)", inr(totals.paid)],
            ].map(([k, v]) => (
              <div key={k} className="rounded-xl border border-border p-3">
                <p className="text-xs text-muted-foreground">{k}</p>
                <p className="text-xl font-bold tnum">{v}</p>
              </div>
            ))}
          </div>
          {d && !d.payments_on && (
            <p className="mt-3 text-xs text-amber-800">
              Online payment is off: add RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET and
              RAZORPAY_WEBHOOK_SECRET.
            </p>
          )}
        </header>

        {key && (
          <div className="rounded-2xl border-2 border-primary bg-card p-4 text-sm">
            <p className="font-semibold">
              <KeyRound className="mr-1 inline size-4" /> Firm key for {key.id}: shown once, copy it
              now
            </p>
            <p className="mt-2 break-all rounded bg-muted p-2 font-mono text-xs">{key.key}</p>
            <p className="mt-2 text-xs text-muted-foreground">
              Put in the firm's app settings: AI_BILLING=on, SAHA_BILLING_URL=(this app's address),
              SAHA_FIRM_ID={key.id}, SAHA_FIRM_KEY=(this key).
            </p>
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                className="rounded-lg border border-border px-3 py-1.5"
                onClick={() =>
                  navigator.clipboard.writeText(key.key).then(() => toast.success("Copied"))
                }
              >
                <Copy className="mr-1 inline size-4" />
                Copy
              </button>
              <button
                type="button"
                className="rounded-lg border border-border px-3 py-1.5"
                onClick={() => setKey(null)}
              >
                Done
              </button>
            </div>
          </div>
        )}

        <section className="rounded-2xl border border-border bg-card p-4">
          <p className="label-caps text-muted-foreground">Firms</p>
          <div className="mt-3 flex flex-col gap-3">
            {firms.map((f) => {
              const m = month[f.id];
              return (
                <div
                  key={f.id}
                  className={`rounded-xl border p-3 ${f.active ? "border-border" : "border-amber-300 bg-amber-50/40"}`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold">
                        {f.name}{" "}
                        <span className="text-xs font-normal text-muted-foreground">
                          · {f.id}
                          {f.billing?.["gstin"] ? ` · ${f.billing["gstin"]}` : ""}
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {f.billing?.["email"] ?? ""} {f.billing?.["phone"] ?? ""}
                      </p>
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-lg font-bold tnum ${Number(f.balance) < 200 ? "text-amber-700" : ""}`}
                      >
                        {inr(f.balance)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        this month {inr(m?.used ?? 0)} · {m?.uses ?? 0} uses
                      </p>
                    </div>
                  </div>
                  {m && Object.keys(m.byFeature).length > 0 && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {Object.entries(m.byFeature)
                        .map(([k, v]) => `${NAME[k as AiFeatureKey] ?? k} ${inr(v)}`)
                        .join(" · ")}
                    </p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-2 text-sm">
                    <button
                      type="button"
                      className="rounded-lg border border-border px-3 py-1"
                      onClick={() => {
                        setOpen(open === f.id ? null : f.id);
                        if (open !== f.id) events.mutate(f.id);
                      }}
                    >
                      {open === f.id ? "Hide" : "Details"}
                    </button>
                    <button
                      type="button"
                      className="rounded-lg border border-border px-3 py-1"
                      onClick={() => run.mutate({ action: "active", id: f.id, active: !f.active })}
                    >
                      {f.active ? "Pause AI" : "Resume AI"}
                    </button>
                    <button
                      type="button"
                      className="rounded-lg border border-border px-3 py-1"
                      onClick={() => run.mutate({ action: "rotate", id: f.id })}
                    >
                      New key
                    </button>
                  </div>
                  {open === f.id && (
                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                      <div className="rounded-lg bg-muted/50 p-3 text-sm">
                        <p className="text-xs font-semibold">
                          Bank transfer received (issues a GST invoice)
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2 [&>input]:min-w-[7rem] [&>input]:flex-1">
                          <input
                            className={input}
                            type="number"
                            placeholder="Amount incl. GST ₹"
                            value={F(f.id).amount}
                            onChange={(e) => setF(f.id, { amount: e.target.value })}
                          />
                          <input
                            className={input}
                            placeholder="UTR / bank ref"
                            value={F(f.id).note}
                            onChange={(e) => setF(f.id, { note: e.target.value })}
                          />
                          <button
                            type="button"
                            className="rounded-lg bg-primary px-3 py-1.5 text-primary-foreground"
                            onClick={() =>
                              run.mutate({
                                action: "bank",
                                id: f.id,
                                amount: Number(F(f.id).amount),
                                note: F(f.id).note,
                              })
                            }
                          >
                            Record
                          </button>
                        </div>
                        <p className="mt-3 text-xs font-semibold">Correction (no invoice)</p>
                        <div className="mt-2 flex flex-wrap gap-2 [&>input]:min-w-[7rem] [&>input]:flex-1">
                          <input
                            className={input}
                            type="number"
                            placeholder="Credits (− to remove)"
                            value={F(f.id).credits}
                            onChange={(e) => setF(f.id, { credits: e.target.value })}
                          />
                          <input
                            className={input}
                            placeholder="Reason"
                            value={F(f.id).note}
                            onChange={(e) => setF(f.id, { note: e.target.value })}
                          />
                          <button
                            type="button"
                            className="rounded-lg border border-primary px-3 py-1.5 text-primary"
                            onClick={() =>
                              run.mutate({
                                action: "adjust",
                                id: f.id,
                                credits: Number(F(f.id).credits),
                                note: F(f.id).note,
                              })
                            }
                          >
                            Apply
                          </button>
                        </div>
                      </div>
                      <div className="text-sm">
                        <p className="text-xs font-semibold">Payments and invoices</p>
                        <div className="mt-1 flex flex-col divide-y divide-border rounded-lg border border-border">
                          {pays
                            .filter((p) => p.firm_id === f.id)
                            .slice(0, 12)
                            .map((p) => (
                              <div
                                key={p.payment_id}
                                className="flex items-center justify-between gap-2 p-2"
                              >
                                <span>
                                  {new Date(p.created_at).toLocaleDateString("en-IN")} ·{" "}
                                  {inr(p.amount_paise / 100)} · {p.source}
                                </span>
                                {p.invoice_no && (
                                  <button
                                    type="button"
                                    className="text-primary underline"
                                    onClick={() =>
                                      run.mutate({
                                        action: "invoice",
                                        id: f.id,
                                        invoiceNo: p.invoice_no!,
                                      })
                                    }
                                  >
                                    <FileText className="mr-1 inline size-3.5" />
                                    {p.invoice_no}
                                  </button>
                                )}
                              </div>
                            ))}
                        </div>
                        <p className="mt-3 text-xs font-semibold">Recent activity</p>
                        <div className="mt-1 max-h-60 overflow-auto rounded-lg border border-border">
                          {(
                            ((events.data as { events?: unknown[] } | undefined)?.events ?? []) as {
                              id: number;
                              type: string;
                              feature: string | null;
                              credits: number;
                              at: string;
                              ref: string | null;
                            }[]
                          ).map((e) => (
                            <div
                              key={e.id}
                              className="flex justify-between gap-2 border-b border-border p-2 text-xs last:border-0"
                            >
                              <span>
                                {new Date(e.at).toLocaleString("en-IN", {
                                  day: "numeric",
                                  month: "short",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}{" "}
                                · {e.type}
                                {e.feature
                                  ? ` · ${NAME[e.feature as AiFeatureKey] ?? e.feature}`
                                  : ""}
                                {e.type !== "use" && e.ref ? ` · ${e.ref}` : ""}
                              </span>
                              <span className="tnum">
                                {Number(e.credits) > 0 ? "+" : ""}
                                {inr(e.credits)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex flex-wrap gap-2 rounded-lg bg-muted/50 p-3 [&>input]:min-w-[9rem] [&>input]:flex-1">
            <input
              className={input}
              placeholder="Firm code (e.g. acme-builders)"
              value={nf.id}
              onChange={(e) => setNf({ ...nf, id: e.target.value.toLowerCase() })}
            />
            <input
              className={input}
              placeholder="Firm name"
              value={nf.name}
              onChange={(e) => setNf({ ...nf, name: e.target.value })}
            />
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground"
              onClick={() =>
                run.mutate(
                  { action: "create", id: nf.id, name: nf.name },
                  { onSuccess: () => setNf({ id: "", name: "" }) },
                )
              }
            >
              <Plus className="size-4" /> Add firm
            </button>
          </div>
        </section>
      </div>
    </Shell>
  );
}
