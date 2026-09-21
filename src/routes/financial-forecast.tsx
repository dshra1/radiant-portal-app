import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  TrendingUp,
  Wallet,
  Landmark,
  AlertTriangle,
  CalendarClock,
  FileDown,
} from "lucide-react";
import { Shell } from "@/components/saha/Shell";
import { supabase } from "@/integrations/supabase/client";
import { useActiveProject } from "@/hooks/useActiveProject";
import { useSessionUser } from "@/lib/access";

export const Route = createFileRoute("/financial-forecast")({
  head: () => ({
    meta: [
      { title: "Financial Forecast — Cash Runway & Cost to Complete | Saha OS" },
      {
        name: "description",
        content:
          "Live cash-flow forecast for the project: funds in hand, monthly burn, cost to complete, funding gap and projected finish date.",
      },
      { property: "og:title", content: "Financial Forecast — Saha OS" },
      {
        property: "og:description",
        content:
          "Funds in hand, monthly burn rate, cost to complete, funding gap and projected finish date from real project data.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function num(v: unknown): number {
  const n = Number(String(v ?? "").replace(/[^0-9.\-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}
function inr(n: number): string {
  const v = Math.round(n);
  if (Math.abs(v) >= 10000000) return `₹${(v / 10000000).toFixed(2)} Cr`;
  if (Math.abs(v) >= 100000) return `₹${(v / 100000).toFixed(2)} L`;
  return `₹${v.toLocaleString("en-IN")}`;
}
function inrFull(n: number): string {
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}
function monthKey(d: string): string {
  return (d || "").slice(0, 7);
}
function monthLabel(key: string): string {
  if (!key) return "—";
  const [y, m] = key.split("-");
  const names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${names[Number(m) - 1] ?? "?"} ${String(y).slice(2)}`;
}
function esc(v: string) {
  return `"${String(v).replace(/"/g, '""')}"`;
}

function Page() {
  const project = useActiveProject();
  const user = useSessionUser();
  const enabled = Boolean(user?.id) && Boolean(project.id);
  const [contingencyPct, setContingencyPct] = useState(5);

  const projectRow = useQuery({
    queryKey: ["site_projects", "forecast", project.id],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_projects")
        .select("id,name,target_budget,spend,start_date,target_handover_date,total_built_up_sft")
        .eq("id", project.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const boq = useQuery({
    queryKey: ["boq_items", "forecast", project.id],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("boq_items")
        .select("quantity,rate")
        .eq("project_id", project.id);
      if (error) throw error;
      return data ?? [];
    },
  });

  const bills = useQuery({
    queryKey: ["bills", "forecast", project.id],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bills")
        .select(
          "id,bill_number,vendor_name,due_date,status,basic_amount,gst_amount,other_charges,retention_amount,deductions",
        )
        .eq("project_id", project.id);
      if (error) throw error;
      return data ?? [];
    },
  });

  const payments = useQuery({
    queryKey: ["bill_payments", "forecast", project.id],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bill_payments")
        .select("id,bill_id,payment_date,amount")
        .eq("project_id", project.id);
      if (error) throw error;
      return data ?? [];
    },
  });

  const capital = useQuery({
    queryKey: ["capital_entries", "forecast", project.id],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("capital_entries")
        .select("id,entry_type,amount,entry_date,status,owner_name")
        .eq("project_id", project.id);
      if (error) throw error;
      return data ?? [];
    },
  });

  const charges = useQuery({
    queryKey: ["project_charges", "forecast", project.id],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_charges")
        .select("id,category,authority,amount,charge_date,status")
        .eq("project_id", project.id);
      if (error) throw error;
      return data ?? [];
    },
  });

  const loading =
    projectRow.isLoading ||
    boq.isLoading ||
    bills.isLoading ||
    payments.isLoading ||
    capital.isLoading ||
    charges.isLoading;

  const m = useMemo(() => {
    const boqTotal = (boq.data ?? []).reduce(
      (s, r) => s + num(r.quantity) * num(r.rate),
      0,
    );
    const paidByBill = new Map<string, number>();
    for (const p of payments.data ?? []) {
      paidByBill.set(p.bill_id, (paidByBill.get(p.bill_id) ?? 0) + num(p.amount));
    }
    const billRows = (bills.data ?? []).map((b) => {
      const gross =
        num(b.basic_amount) +
        num(b.gst_amount) +
        num(b.other_charges) -
        num(b.retention_amount) -
        num(b.deductions);
      const paid = paidByBill.get(b.id) ?? 0;
      return { ...b, gross, paid, outstanding: Math.max(gross - paid, 0) };
    });
    const billedGross = billRows.reduce((s, r) => s + r.gross, 0);
    const vendorPaid = (payments.data ?? []).reduce((s, p) => s + num(p.amount), 0);
    const vendorOutstanding = billRows.reduce((s, r) => s + r.outstanding, 0);

    const chargesTotal = (charges.data ?? []).reduce((s, c) => s + num(c.amount), 0);
    const chargesPaid = (charges.data ?? [])
      .filter((c) => String(c.status).toLowerCase() === "paid")
      .reduce((s, c) => s + num(c.amount), 0);
    const chargesPending = Math.max(chargesTotal - chargesPaid, 0);

    const inflow = (capital.data ?? [])
      .filter((c) => String(c.entry_type).toLowerCase() === "deposit")
      .reduce((s, c) => s + num(c.amount), 0);
    const outflowOwners = (capital.data ?? [])
      .filter((c) => ["withdrawal", "refund"].includes(String(c.entry_type).toLowerCase()))
      .reduce((s, c) => s + num(c.amount), 0);

    const spentToDate = vendorPaid + chargesPaid;
    const fundsInHand = inflow - outflowOwners - spentToDate;

    const contingency = (boqTotal * contingencyPct) / 100;
    const forecastCost = boqTotal + chargesTotal + contingency;
    const costToComplete = Math.max(forecastCost - spentToDate, 0);
    const committedNow = vendorOutstanding + chargesPending;
    const fundingGap = Math.max(costToComplete - fundsInHand, 0);

    const targetBudget = num(projectRow.data?.target_budget);
    const budgetVariance = targetBudget ? targetBudget - forecastCost : 0;

    // monthly series (last 6 months with activity)
    const keys = new Set<string>();
    const inMap = new Map<string, number>();
    const outMap = new Map<string, number>();
    for (const c of capital.data ?? []) {
      const k = monthKey(String(c.entry_date ?? ""));
      if (!k) continue;
      keys.add(k);
      const t = String(c.entry_type).toLowerCase();
      if (t === "deposit") inMap.set(k, (inMap.get(k) ?? 0) + num(c.amount));
      else outMap.set(k, (outMap.get(k) ?? 0) + num(c.amount));
    }
    for (const p of payments.data ?? []) {
      const k = monthKey(String(p.payment_date ?? ""));
      if (!k) continue;
      keys.add(k);
      outMap.set(k, (outMap.get(k) ?? 0) + num(p.amount));
    }
    for (const c of charges.data ?? []) {
      if (String(c.status).toLowerCase() !== "paid") continue;
      const k = monthKey(String(c.charge_date ?? ""));
      if (!k) continue;
      keys.add(k);
      outMap.set(k, (outMap.get(k) ?? 0) + num(c.amount));
    }
    const months = Array.from(keys)
      .sort()
      .slice(-6)
      .map((k) => ({ key: k, inflow: inMap.get(k) ?? 0, outflow: outMap.get(k) ?? 0 }));

    const burnMonths = months.filter((x) => x.outflow > 0);
    const monthlyBurn =
      burnMonths.length > 0
        ? burnMonths.reduce((s, x) => s + x.outflow, 0) / burnMonths.length
        : 0;
    const runwayMonths = monthlyBurn > 0 ? fundsInHand / monthlyBurn : 0;
    const monthsToComplete = monthlyBurn > 0 ? costToComplete / monthlyBurn : 0;
    const projectedFinish =
      monthlyBurn > 0
        ? new Date(Date.now() + monthsToComplete * 30.4 * 86400000)
        : null;
    const targetHandover = projectRow.data?.target_handover_date
      ? new Date(String(projectRow.data.target_handover_date))
      : null;

    const dueSoon = billRows
      .filter((r) => r.outstanding > 0)
      .sort((a, b) => String(a.due_date ?? "9999").localeCompare(String(b.due_date ?? "9999")))
      .slice(0, 6);

    return {
      boqTotal,
      contingency,
      chargesTotal,
      chargesPaid,
      chargesPending,
      billedGross,
      vendorPaid,
      vendorOutstanding,
      inflow,
      outflowOwners,
      spentToDate,
      fundsInHand,
      forecastCost,
      costToComplete,
      committedNow,
      fundingGap,
      targetBudget,
      budgetVariance,
      months,
      monthlyBurn,
      runwayMonths,
      monthsToComplete,
      projectedFinish,
      targetHandover,
      dueSoon,
    };
  }, [boq.data, bills.data, payments.data, capital.data, charges.data, projectRow.data, contingencyPct]);

  const maxBar = Math.max(1, ...m.months.map((x) => Math.max(x.inflow, x.outflow)));

  function exportCsv() {
    const lines: string[] = [];
    lines.push(["Metric", "Amount (INR)"].join(","));
    const rows: Array<[string, number]> = [
      ["BOQ estimated cost", m.boqTotal],
      [`Contingency @ ${contingencyPct}%`, m.contingency],
      ["Statutory / common charges", m.chargesTotal],
      ["Forecast total cost", m.forecastCost],
      ["Owner funding received", m.inflow],
      ["Owner withdrawals / refunds", m.outflowOwners],
      ["Paid to vendors", m.vendorPaid],
      ["Statutory charges paid", m.chargesPaid],
      ["Spent to date", m.spentToDate],
      ["Funds in hand", m.fundsInHand],
      ["Vendor bills outstanding", m.vendorOutstanding],
      ["Statutory charges pending", m.chargesPending],
      ["Cost to complete", m.costToComplete],
      ["Funding gap", m.fundingGap],
      ["Average monthly burn", m.monthlyBurn],
    ];
    for (const [k, v] of rows) lines.push([esc(k), Math.round(v)].join(","));
    lines.push("");
    lines.push(["Month", "Inflow", "Outflow"].join(","));
    for (const x of m.months)
      lines.push([monthLabel(x.key), Math.round(x.inflow), Math.round(x.outflow)].join(","));
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `financial-forecast-${project.name.replace(/\s+/g, "-").toLowerCase()}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  const gapCritical = m.fundingGap > 0;

  return (
    <Shell title="Financial Forecast">
      <div className="flex flex-col gap-6 pb-16">
        <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 shadow-sm md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              {project.name} · {project.location}
            </p>
            <h1 className="text-2xl font-bold text-foreground">Financial forecast</h1>
            <p className="text-sm text-muted-foreground">
              Built from your BOQ, vendor bills, payments, owner funding and statutory charges.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-sm">
              <span className="text-muted-foreground">Contingency</span>
              <input
                type="number"
                min={0}
                max={25}
                value={contingencyPct}
                onChange={(e) => setContingencyPct(Math.max(0, Math.min(25, num(e.target.value))))}
                className="w-14 bg-transparent text-right font-semibold outline-none"
              />
              <span className="text-muted-foreground">%</span>
            </label>
            <button
              onClick={exportCsv}
              className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
            >
              <FileDown className="h-4 w-4" /> Export forecast
            </button>
          </div>
        </div>

        {!project.id ? (
          <div className="rounded-2xl border border-border bg-card p-8 text-center text-muted-foreground">
            Add a project first, then the forecast will fill in automatically.
          </div>
        ) : loading ? (
          <div className="rounded-2xl border border-border bg-card p-8 text-center text-muted-foreground">
            Loading project finances…
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Kpi
                icon={<Landmark className="h-4 w-4" />}
                label="Forecast total cost"
                value={inr(m.forecastCost)}
                note={`BOQ ${inr(m.boqTotal)} + charges ${inr(m.chargesTotal)} + contingency ${inr(m.contingency)}`}
                to="/boq-engine"
              />
              <Kpi
                icon={<Wallet className="h-4 w-4" />}
                label="Funds in hand"
                value={inr(m.fundsInHand)}
                note={`Owner funding ${inr(m.inflow)} − spent ${inr(m.spentToDate)}`}
                tone={m.fundsInHand < 0 ? "bad" : "good"}
                to="/capital-ledger"
              />
              <Kpi
                icon={<TrendingUp className="h-4 w-4" />}
                label="Cost to complete"
                value={inr(m.costToComplete)}
                note={`${inr(m.committedNow)} already committed in bills & charges`}
                to="/bills-payments"
              />
              <Kpi
                icon={<AlertTriangle className="h-4 w-4" />}
                label="Funding gap"
                value={inr(m.fundingGap)}
                note={
                  gapCritical
                    ? "Extra funding needed to finish at current forecast"
                    : "Funds in hand cover the remaining work"
                }
                tone={gapCritical ? "bad" : "good"}
                to="/cost-dashboard"
              />

            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div className="rounded-2xl border border-border bg-card p-5 shadow-sm lg:col-span-2">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">Money in vs money out</h2>
                    <p className="text-sm text-muted-foreground">
                      Last {m.months.length || 0} month(s) of recorded funding and payments
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <span className="h-2.5 w-2.5 rounded bg-primary" /> In
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="h-2.5 w-2.5 rounded bg-destructive" /> Out
                    </span>
                  </div>
                </div>
                {m.months.length === 0 ? (
                  <p className="py-10 text-center text-sm text-muted-foreground">
                    No dated funding or payments yet. Add entries in the capital ledger and bills to
                    see the trend.
                  </p>
                ) : (
                  <div className="flex h-56 items-end gap-4">
                    {m.months.map((x) => (
                      <div key={x.key} className="flex flex-1 flex-col items-center gap-2">
                        <div className="flex h-44 w-full items-end justify-center gap-1">
                          <div
                            title={`In ${inrFull(x.inflow)}`}
                            className="w-1/2 rounded-t bg-primary"
                            style={{ height: `${Math.max((x.inflow / maxBar) * 100, x.inflow > 0 ? 4 : 0)}%` }}
                          />
                          <div
                            title={`Out ${inrFull(x.outflow)}`}
                            className="w-1/2 rounded-t bg-destructive"
                            style={{ height: `${Math.max((x.outflow / maxBar) * 100, x.outflow > 0 ? 4 : 0)}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">{monthLabel(x.key)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm">
                <h2 className="text-lg font-semibold text-foreground">Runway & timeline</h2>
                <Row label="Average monthly spend" value={m.monthlyBurn > 0 ? inr(m.monthlyBurn) : "—"} />
                <Row
                  label="Cash runway"
                  value={
                    m.monthlyBurn > 0
                      ? `${m.runwayMonths.toFixed(1)} months`
                      : "Needs payment history"
                  }
                />
                <Row
                  label="Months to finish at this spend"
                  value={m.monthlyBurn > 0 ? `${m.monthsToComplete.toFixed(1)} months` : "—"}
                />
                <Row
                  label="Projected finish"
                  value={
                    m.projectedFinish
                      ? m.projectedFinish.toLocaleDateString("en-IN", {
                          month: "short",
                          year: "numeric",
                        })
                      : "—"
                  }
                />
                <Row
                  label="Target handover"
                  value={
                    m.targetHandover
                      ? m.targetHandover.toLocaleDateString("en-IN", {
                          month: "short",
                          year: "numeric",
                        })
                      : "Not set"
                  }
                />
                {m.targetBudget > 0 && (
                  <Row
                    label="Vs target budget"
                    value={`${m.budgetVariance >= 0 ? "Under by " : "Over by "}${inr(Math.abs(m.budgetVariance))}`}
                    tone={m.budgetVariance >= 0 ? "good" : "bad"}
                  />
                )}
                <div className="mt-auto flex items-center gap-2 rounded-xl bg-muted p-3 text-xs text-muted-foreground">
                  <CalendarClock className="h-4 w-4 shrink-0" />
                  Forecast updates automatically as bills, payments and owner funding are recorded.
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <h2 className="mb-3 text-lg font-semibold text-foreground">Where the forecast comes from</h2>
                <div className="flex flex-col gap-2 text-sm">
                  <Row label="BOQ estimated cost" value={inrFull(m.boqTotal)} />
                  <Row label={`Contingency @ ${contingencyPct}%`} value={inrFull(m.contingency)} />
                  <Row label="Statutory & common charges" value={inrFull(m.chargesTotal)} />
                  <Row label="Bills raised (net)" value={inrFull(m.billedGross)} />
                  <Row label="Paid to vendors" value={inrFull(m.vendorPaid)} />
                  <Row label="Bills outstanding" value={inrFull(m.vendorOutstanding)} />
                  <Row label="Charges pending" value={inrFull(m.chargesPending)} />
                  <Row label="Owner funding received" value={inrFull(m.inflow)} />
                </div>
                <div className="mt-4 flex flex-wrap gap-2 text-sm">
                  <Link to="/bills-payments" className="rounded-lg border border-border px-3 py-1.5">
                    Bills & payments
                  </Link>
                  <Link to="/capital-ledger" className="rounded-lg border border-border px-3 py-1.5">
                    Capital ledger
                  </Link>
                  <Link to="/common-expenses" className="rounded-lg border border-border px-3 py-1.5">
                    Common expenses
                  </Link>
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <h2 className="mb-3 text-lg font-semibold text-foreground">Payments coming up</h2>
                {m.dueSoon.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    No outstanding vendor bills right now.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="text-xs uppercase text-muted-foreground">
                        <tr>
                          <th className="py-2 pr-3">Bill</th>
                          <th className="py-2 pr-3">Vendor</th>
                          <th className="py-2 pr-3">Due</th>
                          <th className="py-2 text-right">Outstanding</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {m.dueSoon.map((b) => (
                          <tr key={b.id}>
                            <td className="py-2 pr-3 font-medium text-foreground">
                              {b.bill_number || "—"}
                            </td>
                            <td className="py-2 pr-3 text-muted-foreground">{b.vendor_name || "—"}</td>
                            <td className="py-2 pr-3 text-muted-foreground">{b.due_date || "—"}</td>
                            <td className="py-2 text-right font-semibold text-foreground">
                              {inrFull(b.outstanding)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </Shell>
  );
}

function Kpi({
  icon,
  label,
  value,
  note,
  tone,
  to,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  note: string;
  tone?: "good" | "bad";
  to?: "/boq-engine" | "/capital-ledger" | "/bills-payments" | "/cost-dashboard";
}) {
  const body = (
    <>
      <div className="flex items-center justify-between text-xs uppercase tracking-wide text-muted-foreground">
        <span>{label}</span>
        <span className="rounded-lg bg-muted p-1.5 text-foreground">{icon}</span>
      </div>
      <p
        className={`mt-3 text-2xl font-bold ${
          tone === "bad" ? "text-destructive" : tone === "good" ? "text-primary" : "text-foreground"
        }`}
      >
        {value}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{note}</p>
    </>
  );
  const cls = "block rounded-2xl border border-border bg-card p-5 shadow-sm";
  if (to)
    return (
      <Link to={to} className={`${cls} transition hover:border-primary hover:bg-muted/50`}>
        {body}
      </Link>
    );
  return <div className={cls}>{body}</div>;
}


function Row({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "good" | "bad";
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border/60 pb-1.5 text-sm last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span
        className={`font-semibold ${
          tone === "bad" ? "text-destructive" : tone === "good" ? "text-primary" : "text-foreground"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
