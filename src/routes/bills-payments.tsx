import { createFileRoute } from "@tanstack/react-router";
import { Shell } from "@/components/saha/Shell";
import { supabase } from "@/integrations/supabase/client";
import { useActiveProject } from "@/hooks/useActiveProject";
import { useAccess, useSessionUser } from "@/lib/access";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { toast } from "sonner";

export const Route = createFileRoute("/bills-payments")({
  head: () => ({
    meta: [
      { title: "Bills & Payments | Saha OS" },
      { name: "description", content: "Log vendor bills, verify and approve them, record payments against each bill and track outstanding dues per project." },
      { property: "og:title", content: "Bills & Payments | Saha OS" },
      { property: "og:description", content: "Log vendor bills, verify and approve them, record payments against each bill and track outstanding dues per project." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

export type Bill = {
  id: string;
  project_id: string | null;
  bill_number: string;
  bill_date: string | null;
  due_date: string | null;
  vendor_name: string;
  vendor_gstin: string;
  category: string;
  description: string;
  basic_amount: number;
  gst_amount: number;
  other_charges: number;
  retention_amount: number;
  deductions: number;
  status: string;
  notes: string;
};

type Payment = {
  id: string;
  bill_id: string;
  payment_date: string;
  amount: number;
  mode: string;
  reference: string;
  paid_from: string;
  remarks: string;
};

type BillDraft = Omit<Bill, "id" | "project_id">;

const STATUSES = ["draft", "verified", "approved", "paid"] as const;
const MODES = ["bank transfer", "cheque", "cash", "UPI", "RTGS/NEFT"];

function num(v: unknown): number {
  const n = Number(String(v ?? "").replace(/[^0-9.\-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}
function inr(n: number): string {
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}
export function billGross(b: Bill): number {
  return b.basic_amount + b.gst_amount + b.other_charges;
}
function billPayable(b: Bill): number {
  return billGross(b) - b.retention_amount - b.deductions;
}

function emptyBill(): BillDraft {
  return {
    bill_number: "",
    bill_date: new Date().toISOString().slice(0, 10),
    due_date: null,
    vendor_name: "",
    vendor_gstin: "",
    category: "",
    description: "",
    basic_amount: 0,
    gst_amount: 0,
    other_charges: 0,
    retention_amount: 0,
    deductions: 0,
    status: "draft",
    notes: "",
  };
}

function Page() {
  const project = useActiveProject();
  const user = useSessionUser();
  const access = useAccess();
  const canApprove = access.access?.isAdmin || access.access?.roles.includes("pm");
  const queryClient = useQueryClient();

  const [draft, setDraft] = useState<BillDraft | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [payFor, setPayFor] = useState<Bill | null>(null);
  const [payDraft, setPayDraft] = useState({ payment_date: new Date().toISOString().slice(0, 10), amount: 0, mode: MODES[0]!, reference: "", paid_from: "", remarks: "" });
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");

  const enabled = Boolean(user?.id) && Boolean(project.id);

  const { data: bills = [], isPending } = useQuery({
    queryKey: ["bills", project.id],
    enabled,
    queryFn: async (): Promise<Bill[]> => {
      const { data, error } = await supabase
        .from("bills")
        .select("id,project_id,bill_number,bill_date,due_date,vendor_name,vendor_gstin,category,description,basic_amount,gst_amount,other_charges,retention_amount,deductions,status,notes")
        .eq("project_id", project.id)
        .order("bill_date", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((r) => ({
        ...r,
        basic_amount: num(r.basic_amount),
        gst_amount: num(r.gst_amount),
        other_charges: num(r.other_charges),
        retention_amount: num(r.retention_amount),
        deductions: num(r.deductions),
      })) as Bill[];
    },
  });

  const { data: payments = [] } = useQuery({
    queryKey: ["bill_payments", project.id],
    enabled,
    queryFn: async (): Promise<Payment[]> => {
      const { data, error } = await supabase
        .from("bill_payments")
        .select("id,bill_id,payment_date,amount,mode,reference,paid_from,remarks")
        .eq("project_id", project.id)
        .order("payment_date", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((r) => ({ ...r, amount: num(r.amount) })) as Payment[];
    },
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["bills", project.id] });
    queryClient.invalidateQueries({ queryKey: ["bill_payments", project.id] });
  };

  const paidByBill = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of payments) map.set(p.bill_id, (map.get(p.bill_id) ?? 0) + p.amount);
    return map;
  }, [payments]);

  const saveBill = useMutation({
    mutationFn: async (payload: { draft: BillDraft; id: string | null }) => {
      const row = {
        ...payload.draft,
        bill_date: payload.draft.bill_date || null,
        due_date: payload.draft.due_date || null,
        project_id: project.id,
        created_by: user?.id ?? null,
      };
      if (payload.id) {
        const { error } = await supabase.from("bills").update(row).eq("id", payload.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("bills").insert(row);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Bill saved");
      setDraft(null);
      setEditingId(null);
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const setStatusMut = useMutation({
    mutationFn: async (p: { id: string; status: string }) => {
      const { error } = await supabase.from("bills").update({ status: p.status }).eq("id", p.id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Status updated"); refresh(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteBill = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("bills").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Bill deleted"); refresh(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const savePayment = useMutation({
    mutationFn: async (bill: Bill) => {
      const { error } = await supabase.from("bill_payments").insert({
        ...payDraft,
        bill_id: bill.id,
        project_id: project.id,
        created_by: user?.id ?? null,
      });
      if (error) throw error;
      const paid = (paidByBill.get(bill.id) ?? 0) + payDraft.amount;
      if (paid >= billPayable(bill) - 1) {
        await supabase.from("bills").update({ status: "paid" }).eq("id", bill.id);
      }
    },
    onSuccess: () => {
      toast.success("Payment recorded");
      setPayFor(null);
      setPayDraft({ payment_date: new Date().toISOString().slice(0, 10), amount: 0, mode: MODES[0]!, reference: "", paid_from: "", remarks: "" });
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return bills.filter((b) => {
      if (status !== "all" && b.status !== status) return false;
      if (!q) return true;
      return [b.bill_number, b.vendor_name, b.category, b.description].join(" ").toLowerCase().includes(q);
    });
  }, [bills, search, status]);

  const totals = useMemo(() => {
    const payable = bills.reduce((s, b) => s + billPayable(b), 0);
    const paid = payments.reduce((s, p) => s + p.amount, 0);
    const retention = bills.reduce((s, b) => s + b.retention_amount, 0);
    const pendingApproval = bills.filter((b) => b.status === "draft" || b.status === "verified").length;
    return { payable, paid, outstanding: payable - paid, retention, pendingApproval };
  }, [bills, payments]);

  const exportAll = () => {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(
        bills.length
          ? bills.map((b) => ({
              Bill_No: b.bill_number,
              Bill_Date: b.bill_date ?? "",
              Due_Date: b.due_date ?? "",
              Vendor: b.vendor_name,
              GSTIN: b.vendor_gstin,
              Category: b.category,
              Basic: b.basic_amount,
              GST: b.gst_amount,
              Other: b.other_charges,
              Retention: b.retention_amount,
              Deductions: b.deductions,
              Payable: billPayable(b),
              Paid: paidByBill.get(b.id) ?? 0,
              Balance: billPayable(b) - (paidByBill.get(b.id) ?? 0),
              Status: b.status,
            }))
          : [{ Bill_No: "", Vendor: "", Basic: "" }],
      ),
      "Bills",
    );
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(
        payments.length
          ? payments.map((p) => ({
              Date: p.payment_date,
              Bill_No: bills.find((b) => b.id === p.bill_id)?.bill_number ?? "",
              Amount: p.amount,
              Mode: p.mode,
              Reference: p.reference,
              Paid_From: p.paid_from,
              Remarks: p.remarks,
            }))
          : [{ Date: "", Amount: "" }],
      ),
      "Payments",
    );
    XLSX.writeFile(wb, `bills-${(project.name || "project").replace(/\s+/g, "-").toLowerCase()}.xlsx`);
    toast.success("Exported");
  };

  const FIELDS: { key: keyof BillDraft; label: string; type?: string }[] = [
    { key: "bill_number", label: "Bill / Invoice No" },
    { key: "vendor_name", label: "Vendor" },
    { key: "vendor_gstin", label: "Vendor GSTIN" },
    { key: "category", label: "Category" },
    { key: "bill_date", label: "Bill date", type: "date" },
    { key: "due_date", label: "Due date", type: "date" },
    { key: "basic_amount", label: "Basic amount", type: "number" },
    { key: "gst_amount", label: "GST amount", type: "number" },
    { key: "other_charges", label: "Other charges", type: "number" },
    { key: "retention_amount", label: "Retention held", type: "number" },
    { key: "deductions", label: "Deductions / advance", type: "number" },
    { key: "description", label: "Work / material description" },
    { key: "notes", label: "Notes" },
  ];

  return (
    <Shell title="Bills & Payments">
      <div className="w-full px-4 md:px-8 py-6 flex flex-col gap-6">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-primary tracking-tight">Bills &amp; Payments</h1>
            <p className="text-sm text-muted-foreground mt-1">{project.name} · vendor bills, approvals, payments and outstanding dues.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={exportAll} className="px-3 py-2 rounded-lg border border-border text-sm font-semibold hover:bg-muted">Export</button>
            <button onClick={() => { setDraft(emptyBill()); setEditingId(null); }} className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold">Add Bill</button>
          </div>
        </header>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Total payable", value: inr(totals.payable) },
            { label: "Paid", value: inr(totals.paid) },
            { label: "Outstanding", value: inr(totals.outstanding) },
            { label: "Retention held", value: inr(totals.retention) },
          ].map((k) => (
            <div key={k.label} className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">{k.label}</p>
              <p className="text-2xl font-extrabold mt-1">{k.value}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col md:flex-row gap-3">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search bill no, vendor, category…" className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-sm" />
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="px-3 py-2 rounded-lg border border-border bg-background text-sm capitalize">
            <option value="all">All statuses</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {!project.id && <p className="text-sm text-muted-foreground">Add a project first to log bills.</p>}

        <div className="rounded-xl border border-border bg-card overflow-x-auto">
          <table className="w-full text-sm min-w-[980px]">
            <thead className="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="text-left p-3">Bill</th>
                <th className="text-left p-3">Vendor</th>
                <th className="text-right p-3">Payable</th>
                <th className="text-right p-3">Paid</th>
                <th className="text-right p-3">Balance</th>
                <th className="text-left p-3">Status</th>
                <th className="text-right p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isPending && <tr><td className="p-4 text-muted-foreground" colSpan={7}>Loading bills…</td></tr>}
              {!isPending && !filtered.length && <tr><td className="p-4 text-muted-foreground" colSpan={7}>No bills logged yet.</td></tr>}
              {filtered.map((b) => {
                const paid = paidByBill.get(b.id) ?? 0;
                const bal = billPayable(b) - paid;
                return (
                  <tr key={b.id} className="border-t border-border align-top">
                    <td className="p-3">
                      <p className="font-semibold">{b.bill_number || "—"}</p>
                      <p className="text-xs text-muted-foreground">{b.bill_date ?? "—"}{b.due_date ? ` · due ${b.due_date}` : ""}</p>
                      <p className="text-xs text-muted-foreground">{b.category}</p>
                    </td>
                    <td className="p-3">
                      <p className="font-semibold">{b.vendor_name || "—"}</p>
                      <p className="text-xs text-muted-foreground">{b.description}</p>
                    </td>
                    <td className="p-3 text-right">{inr(billPayable(b))}</td>
                    <td className="p-3 text-right">{inr(paid)}</td>
                    <td className={`p-3 text-right font-bold ${bal > 0 ? "text-destructive" : "text-primary"}`}>{inr(bal)}</td>
                    <td className="p-3">
                      <span className="px-2 py-1 rounded-full bg-muted text-xs font-semibold capitalize">{b.status}</span>
                    </td>
                    <td className="p-3 text-right whitespace-nowrap">
                      {b.status === "draft" && <button onClick={() => setStatusMut.mutate({ id: b.id, status: "verified" })} className="text-primary font-semibold mr-3">Verify</button>}
                      {b.status === "verified" && canApprove && <button onClick={() => setStatusMut.mutate({ id: b.id, status: "approved" })} className="text-primary font-semibold mr-3">Approve</button>}
                      {(b.status === "approved" || b.status === "paid") && <button onClick={() => { setPayFor(b); setPayDraft((d) => ({ ...d, amount: Math.max(bal, 0) })); }} className="text-primary font-semibold mr-3">Pay</button>}
                      <button onClick={() => { setDraft({ bill_number: b.bill_number, bill_date: b.bill_date, due_date: b.due_date, vendor_name: b.vendor_name, vendor_gstin: b.vendor_gstin, category: b.category, description: b.description, basic_amount: b.basic_amount, gst_amount: b.gst_amount, other_charges: b.other_charges, retention_amount: b.retention_amount, deductions: b.deductions, status: b.status, notes: b.notes }); setEditingId(b.id); }} className="font-semibold mr-3">Edit</button>
                      <button onClick={() => { if (confirm(`Delete bill ${b.bill_number}?`)) deleteBill.mutate(b.id); }} className="text-destructive font-semibold">Delete</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <section>
          <h2 className="text-lg font-bold mb-3">Recent payments</h2>
          <div className="rounded-xl border border-border bg-card overflow-x-auto">
            <table className="w-full text-sm min-w-[720px]">
              <thead className="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="text-left p-3">Date</th>
                  <th className="text-left p-3">Bill</th>
                  <th className="text-right p-3">Amount</th>
                  <th className="text-left p-3">Mode / Reference</th>
                  <th className="text-left p-3">Paid from</th>
                </tr>
              </thead>
              <tbody>
                {!payments.length && <tr><td className="p-4 text-muted-foreground" colSpan={5}>No payments recorded yet.</td></tr>}
                {payments.map((p) => (
                  <tr key={p.id} className="border-t border-border">
                    <td className="p-3">{p.payment_date}</td>
                    <td className="p-3">{bills.find((b) => b.id === p.bill_id)?.bill_number ?? "—"}</td>
                    <td className="p-3 text-right font-semibold">{inr(p.amount)}</td>
                    <td className="p-3">{p.mode}{p.reference && ` · ${p.reference}`}</td>
                    <td className="p-3">{p.paid_from || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {draft && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-start md:items-center justify-center p-4 overflow-y-auto">
          <div className="bg-card rounded-xl border border-border w-full max-w-3xl p-5">
            <h2 className="text-lg font-bold mb-4">{editingId ? "Edit bill" : "New bill"}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              {FIELDS.map((f) => (
                <label key={f.key}>
                  <span className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">{f.label}</span>
                  <input
                    type={f.type ?? "text"}
                    className="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-background"
                    value={String(draft[f.key] ?? "")}
                    onChange={(e) => setDraft({ ...draft, [f.key]: f.type === "number" ? num(e.target.value) : e.target.value })}
                  />
                </label>
              ))}
            </div>
            <p className="text-sm mt-3">Gross <strong>{inr(draft.basic_amount + draft.gst_amount + draft.other_charges)}</strong> · Payable <strong>{inr(draft.basic_amount + draft.gst_amount + draft.other_charges - draft.retention_amount - draft.deductions)}</strong></p>
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => { setDraft(null); setEditingId(null); }} className="px-4 py-2 rounded-lg border border-border text-sm font-semibold">Cancel</button>
              <button disabled={saveBill.isPending} onClick={() => saveBill.mutate({ draft, id: editingId })} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold">{saveBill.isPending ? "Saving…" : "Save bill"}</button>
            </div>
          </div>
        </div>
      )}

      {payFor && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-start md:items-center justify-center p-4 overflow-y-auto">
          <div className="bg-card rounded-xl border border-border w-full max-w-xl p-5">
            <h2 className="text-lg font-bold mb-1">Record payment</h2>
            <p className="text-sm text-muted-foreground mb-4">{payFor.bill_number} · {payFor.vendor_name} · balance {inr(billPayable(payFor) - (paidByBill.get(payFor.id) ?? 0))}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <label>
                <span className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">Date</span>
                <input type="date" className="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-background" value={payDraft.payment_date} onChange={(e) => setPayDraft({ ...payDraft, payment_date: e.target.value })} />
              </label>
              <label>
                <span className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">Amount</span>
                <input type="number" className="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-background" value={payDraft.amount} onChange={(e) => setPayDraft({ ...payDraft, amount: num(e.target.value) })} />
              </label>
              <label>
                <span className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">Mode</span>
                <select className="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-background" value={payDraft.mode} onChange={(e) => setPayDraft({ ...payDraft, mode: e.target.value })}>
                  {MODES.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </label>
              <label>
                <span className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">Reference / UTR</span>
                <input className="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-background" value={payDraft.reference} onChange={(e) => setPayDraft({ ...payDraft, reference: e.target.value })} />
              </label>
              <label>
                <span className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">Paid from</span>
                <input className="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-background" value={payDraft.paid_from} onChange={(e) => setPayDraft({ ...payDraft, paid_from: e.target.value })} />
              </label>
              <label>
                <span className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">Remarks</span>
                <input className="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-background" value={payDraft.remarks} onChange={(e) => setPayDraft({ ...payDraft, remarks: e.target.value })} />
              </label>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setPayFor(null)} className="px-4 py-2 rounded-lg border border-border text-sm font-semibold">Cancel</button>
              <button disabled={savePayment.isPending} onClick={() => { if (payDraft.amount <= 0) { toast.error("Enter an amount"); return; } savePayment.mutate(payFor); }} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold">{savePayment.isPending ? "Saving…" : "Record payment"}</button>
            </div>
          </div>
        </div>
      )}
    </Shell>
  );
}
