import { Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronRight, Download, FileCode } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useActiveProject } from "@/hooks/useActiveProject";
import { StatusBadge } from "@/components/saha/ui";
import { MR_VENDOR } from "@/lib/material-requests";
import { DEFAULT_LEDGERS, tallyXml, type TallyLedgers } from "@/lib/tally";
import { cn } from "@/lib/utils";

/**
 * Parties: one balance per vendor, subcontractor or hire party for the project — billed,
 * retention held, deductions, paid, what is still to pay, advances not yet recovered and
 * approved orders not yet billed — with each party's bills and payments in date order.
 * Also the accounts export: party balances (CSV) and bills + payments for Tally (XML).
 */

const num = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};
const inr = (v: number) => `₹${Math.round(v).toLocaleString("en-IN")}`;
const key = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");
const LS = "saha-tally-ledgers";

type Row = {
  name: string;
  billed: number;
  retention: number;
  deductions: number;
  payable: number;
  paid: number;
  balance: number;
  advanceLeft: number;
  unbilledPo: number;
  events: { date: string; text: string; debit: number; credit: number; billId?: string }[];
};

export function PartyLedger() {
  const project = useActiveProject();
  const pid = project.id;
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const [only, setOnly] = useState<"due" | "all">("due");
  const [showTally, setShowTally] = useState(false);
  const [from, setFrom] = useState(new Date().toISOString().slice(0, 8) + "01");
  const [to, setTo] = useState(new Date().toISOString().slice(0, 10));
  const [ledgers, setLedgers] = useState<TallyLedgers>(() => {
    try {
      return {
        ...DEFAULT_LEDGERS,
        ...(JSON.parse(localStorage.getItem(LS) ?? "{}") as Partial<TallyLedgers>),
      };
    } catch {
      return DEFAULT_LEDGERS;
    }
  });
  const [company, setCompany] = useState("");

  const data = useQuery({
    queryKey: ["party-ledger", pid],
    enabled: Boolean(pid),
    queryFn: async () => {
      const [bills, pays, wos, ras, pos] = await Promise.all([
        supabase
          .from("bills")
          .select(
            "id,bill_number,bill_date,vendor_name,description,cost_type,basic_amount,gst_amount,other_charges,retention_amount,deductions,status,po_id",
          )
          .eq("project_id", pid),
        supabase
          .from("bill_payments")
          .select("id,bill_id,payment_date,amount,mode,reference")
          .eq("project_id", pid),
        supabase.from("work_orders").select("contractor,advance,id").eq("project_id", pid),
        supabase
          .from("ra_bills")
          .select("work_order_id,advance_recovery,status")
          .eq("project_id", pid),
        supabase
          .from("purchase_orders")
          .select("id,vendor_name,status,purchase_order_items(quantity,rate,discount_pct)")
          .eq("project_id", pid)
          .eq("status", "approved"),
      ]);
      for (const r of [bills, pays, wos, ras, pos]) if (r.error) throw r.error;
      return {
        bills: (bills.data ?? []).map((b) => ({
          ...b,
          basic_amount: num(b.basic_amount),
          gst_amount: num(b.gst_amount),
          other_charges: num(b.other_charges),
          retention_amount: num(b.retention_amount),
          deductions: num(b.deductions),
        })),
        pays: (pays.data ?? []).map((p) => ({ ...p, amount: num(p.amount) })),
        wos: wos.data ?? [],
        ras: ras.data ?? [],
        pos: (pos.data ?? []) as unknown as {
          id: string;
          vendor_name: string;
          purchase_order_items: { quantity: number; rate: number; discount_pct: number }[];
        }[],
      };
    },
  });

  const rows = useMemo(() => {
    const d = data.data;
    if (!d) return [];
    const m = new Map<string, Row>();
    const get = (name: string) => {
      const k = key(name);
      if (!m.has(k))
        m.set(k, {
          name: name.trim(),
          billed: 0,
          retention: 0,
          deductions: 0,
          payable: 0,
          paid: 0,
          balance: 0,
          advanceLeft: 0,
          unbilledPo: 0,
          events: [],
        });
      return m.get(k)!;
    };
    const billById = new Map(d.bills.map((b) => [b.id, b]));
    for (const b of d.bills) {
      if (!b.vendor_name.trim()) continue;
      const r = get(b.vendor_name);
      const gross = b.basic_amount + b.gst_amount + b.other_charges;
      const payable = gross - b.retention_amount - b.deductions;
      r.billed += gross;
      r.retention += b.retention_amount;
      r.deductions += b.deductions;
      r.payable += payable;
      r.events.push({
        date: b.bill_date ?? "",
        text: `Bill ${b.bill_number}${b.retention_amount ? ` (retention ${inr(b.retention_amount)})` : ""}${b.status !== "approved" && b.status !== "paid" ? ` · ${b.status}` : ""}`,
        debit: 0,
        credit: payable,
        billId: b.id,
      });
    }
    for (const p of d.pays) {
      const b = billById.get(p.bill_id);
      if (!b) continue;
      const r = get(b.vendor_name);
      r.paid += p.amount;
      r.events.push({
        date: p.payment_date,
        text: `Paid ${p.mode}${p.reference ? ` ${p.reference}` : ""} · bill ${b.bill_number}`,
        debit: p.amount,
        credit: 0,
        billId: b.id,
      });
    }
    for (const w of d.wos) {
      const rec = d.ras
        .filter((x) => x.work_order_id === w.id && x.status !== "rejected")
        .reduce((s, x) => s + num(x.advance_recovery), 0);
      if (num(w.advance) > 0) get(w.contractor).advanceLeft += num(w.advance) - rec;
    }
    for (const po of d.pos) {
      if (po.vendor_name === MR_VENDOR) continue;
      const value = (po.purchase_order_items ?? []).reduce(
        (s, i) => s + num(i.quantity) * num(i.rate) * (1 - num(i.discount_pct) / 100),
        0,
      );
      const billed = d.bills
        .filter((b) => b.po_id === po.id)
        .reduce((s, b) => s + b.basic_amount, 0);
      if (value - billed > 1) get(po.vendor_name).unbilledPo += value - billed;
    }
    for (const r of m.values()) {
      r.balance = r.payable - r.paid;
      r.events.sort((a, b) => a.date.localeCompare(b.date));
    }
    return [...m.values()].sort((a, b) => b.balance - a.balance);
  }, [data.data]);

  const shown = rows.filter(
    (r) =>
      (only === "all" || Math.abs(r.balance) > 1 || r.advanceLeft > 1) &&
      (!q.trim() || key(r.name).includes(key(q))),
  );
  const tot = rows.reduce(
    (s, r) => ({
      balance: s.balance + r.balance,
      retention: s.retention + r.retention,
      adv: s.adv + r.advanceLeft,
      po: s.po + r.unbilledPo,
    }),
    { balance: 0, retention: 0, adv: 0, po: 0 },
  );

  const exportCsv = () => {
    const head = [
      "Party",
      "Billed",
      "Retention held",
      "Deductions",
      "Payable",
      "Paid",
      "Balance to pay",
      "Advance not recovered",
      "Approved POs not billed",
    ];
    const body = rows.map((r) =>
      [
        r.name,
        r.billed,
        r.retention,
        r.deductions,
        r.payable,
        r.paid,
        r.balance,
        r.advanceLeft,
        r.unbilledPo,
      ].map((v) => (typeof v === "number" ? v.toFixed(2) : v)),
    );
    const csv = [head, ...body]
      .map((x) => x.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    download(new Blob([csv], { type: "text/csv" }), `party-balances-${project.name}.csv`);
  };
  const exportTally = () => {
    const d = data.data;
    if (!d) return;
    try {
      localStorage.setItem(LS, JSON.stringify(ledgers));
    } catch {
      /* storage blocked */
    }
    const inRange = (x: string | null) => !!x && x >= from && x <= to;
    const bills = d.bills.filter(
      (b) => (b.status === "approved" || b.status === "paid") && inRange(b.bill_date),
    );
    const pays = d.pays.filter((p) => inRange(p.payment_date));
    const xml = tallyXml(bills, pays, ledgers, company);
    download(
      new Blob([xml], { type: "application/xml" }),
      `tally-${project.name}-${from}-to-${to}.xml`,
    );
  };

  return (
    <div className="space-y-3 px-4 pb-16 pt-4 md:px-8">
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        {[
          ["To pay (all parties)", inr(tot.balance)],
          ["Retention held", inr(tot.retention)],
          ["Advances not recovered", inr(tot.adv)],
          ["Approved POs not billed", inr(tot.po)],
        ].map(([l, v]) => (
          <div key={l} className="rounded-xl border border-border bg-card p-3">
            <p className="text-xs text-muted-foreground">{l}</p>
            <p className="text-xl font-bold tnum">{v}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search party"
          className="h-10 min-w-[10rem] flex-1 rounded-lg border border-border bg-card px-3 text-sm"
        />
        <select
          value={only}
          onChange={(e) => setOnly(e.target.value as "due" | "all")}
          className="h-10 rounded-lg border border-border bg-card px-2 text-sm"
        >
          <option value="due">With a balance</option>
          <option value="all">All parties</option>
        </select>
        <button
          type="button"
          onClick={exportCsv}
          className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-sm font-semibold"
        >
          <Download className="size-4" /> Balances CSV
        </button>
        <button
          type="button"
          onClick={() => setShowTally((v) => !v)}
          className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-sm font-semibold"
        >
          <FileCode className="size-4" /> Export to Tally
        </button>
      </div>

      {showTally && (
        <section className="space-y-2 rounded-xl border-2 border-primary/40 bg-card p-3 text-sm">
          <p className="text-muted-foreground">
            Approved and paid bills (Purchase vouchers) and payments (Payment vouchers) between the
            dates, with party ledgers created under Sundry Creditors. In Tally: Gateway of Tally →
            Import → Vouchers → choose this file. Try it once on a copy of the company first.
          </p>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            <label className="text-xs">
              From
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="h-10 w-full rounded-lg border border-border bg-background px-2"
              />
            </label>
            <label className="text-xs">
              To
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="h-10 w-full rounded-lg border border-border bg-background px-2"
              />
            </label>
            <label className="col-span-2 text-xs">
              Tally company name (optional)
              <input
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="h-10 w-full rounded-lg border border-border bg-background px-2"
              />
            </label>
            {(Object.keys(DEFAULT_LEDGERS) as (keyof TallyLedgers)[]).map((k) => (
              <label key={k} className="text-xs capitalize">
                {k} ledger
                <input
                  value={ledgers[k]}
                  onChange={(e) => setLedgers({ ...ledgers, [k]: e.target.value })}
                  className="h-10 w-full rounded-lg border border-border bg-background px-2"
                />
              </label>
            ))}
          </div>
          <button
            type="button"
            onClick={exportTally}
            className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-primary px-4 font-semibold text-primary-foreground"
          >
            <Download className="size-4" /> Download Tally XML
          </button>
        </section>
      )}

      {data.isError && <p className="text-sm text-destructive">{(data.error as Error).message}</p>}
      <ul className="divide-y divide-border rounded-xl border border-border bg-card">
        {shown.map((r) => {
          const isOpen = open === r.name;
          let running = 0;
          return (
            <li key={r.name}>
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : r.name)}
                className="flex w-full items-center gap-2 px-3 py-3 text-left"
              >
                {isOpen ? (
                  <ChevronDown className="size-4 shrink-0" />
                ) : (
                  <ChevronRight className="size-4 shrink-0" />
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{r.name}</span>
                  <span className="block text-xs text-muted-foreground">
                    Billed {inr(r.billed)} · paid {inr(r.paid)}
                    {r.retention ? ` · retention ${inr(r.retention)}` : ""}
                    {r.advanceLeft > 1 ? ` · advance left ${inr(r.advanceLeft)}` : ""}
                    {r.unbilledPo > 1 ? ` · PO not billed ${inr(r.unbilledPo)}` : ""}
                  </span>
                </span>
                <span className="text-right">
                  <span
                    className={cn(
                      "block font-bold tnum",
                      r.balance > 1 ? "text-foreground" : "text-muted-foreground",
                    )}
                  >
                    {inr(r.balance)}
                  </span>
                  <span className="block text-[10px] text-muted-foreground">
                    {r.balance > 1 ? "to pay" : r.balance < -1 ? "overpaid" : "settled"}
                  </span>
                </span>
              </button>
              {isOpen && (
                <div className="overflow-x-auto px-3 pb-3">
                  <table className="w-full min-w-[30rem] text-xs">
                    <thead className="text-muted-foreground">
                      <tr>
                        <th className="py-1 text-left">Date</th>
                        <th className="py-1 text-left">Entry</th>
                        <th className="py-1 text-right">Bill (to pay)</th>
                        <th className="py-1 text-right">Paid</th>
                        <th className="py-1 text-right">Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {r.events.map((e, i) => {
                        running += e.credit - e.debit;
                        return (
                          <tr key={i} className="border-t border-border">
                            <td className="py-1">{e.date}</td>
                            <td className="py-1">
                              {e.billId ? (
                                <Link
                                  to="/bills-payments"
                                  search={{ bill: e.billId } as never}
                                  className="text-primary underline"
                                >
                                  {e.text}
                                </Link>
                              ) : (
                                e.text
                              )}
                            </td>
                            <td className="py-1 text-right">{e.credit ? inr(e.credit) : ""}</td>
                            <td className="py-1 text-right">{e.debit ? inr(e.debit) : ""}</td>
                            <td className="py-1 text-right font-semibold">{inr(running)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {r.balance < -1 && (
                    <StatusBadge tone="amber">
                      Paid more than billed: check for an advance or a missing bill
                    </StatusBadge>
                  )}
                </div>
              )}
            </li>
          );
        })}
        {!data.isPending && shown.length === 0 && (
          <li className="p-6 text-center text-sm text-muted-foreground">
            No parties with a balance.
          </li>
        )}
      </ul>
    </div>
  );
}

function download(blob: Blob, name: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name.replace(/[^\w.-]+/g, "-");
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
