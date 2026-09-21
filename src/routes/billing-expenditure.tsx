import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FileText, Landmark, Wallet, Receipt, Plus } from "lucide-react";
import { Shell } from "@/components/saha/Shell";
import { supabase } from "@/integrations/supabase/client";
import { useActiveProject } from "@/hooks/useActiveProject";
import { useSessionUser } from "@/lib/access";

export const Route = createFileRoute("/billing-expenditure")({
  head: () => ({
    meta: [
      { title: "Billing & Expenditure | Saha OS" },
      {
        name: "description",
        content:
          "Single expenditure register combining vendor bills, payments made and statutory charges such as permissions, LRS, HMWSSB and architect fees.",
      },
      { property: "og:title", content: "Billing & Expenditure | Saha OS" },
      {
        property: "og:description",
        content:
          "Vendor bills, payments and statutory charges for the project in one expenditure register.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

const CHARGE_LABELS: Record<string, string> = {
  permissions: "Permission / Approval charges",
  lrs: "LRS charges (owner land wise)",
  electrical: "Electrical connection charges",
  hmwssb: "HMWSSB water & sewerage charges",
  architectural: "Architectural / consultant fees",
  other: "Other common charge",
};

function num(v: unknown): number {
  const n = Number(String(v ?? "").replace(/[^0-9.\-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}
function inr(n: number): string {
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

type Row = {
  id: string;
  kind: "Vendor bill" | "Statutory charge";
  reference: string;
  payee: string;
  date: string | null;
  category: string;
  detail: string;
  amount: number;
  paid: number;
  status: string;
};

function Page() {
  const project = useActiveProject();
  const user = useSessionUser();
  const enabled = Boolean(user?.id) && Boolean(project.id);
  const [search, setSearch] = useState("");
  const [kind, setKind] = useState("all");

  const { data: bills = [], isPending: billsPending } = useQuery({
    queryKey: ["bills", "billing-expenditure", project.id],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bills")
        .select(
          "id,bill_number,bill_date,vendor_name,category,description,basic_amount,gst_amount,other_charges,retention_amount,deductions,status",
        )
        .eq("project_id", project.id)
        .order("bill_date", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: payments = [] } = useQuery({
    queryKey: ["bill_payments", "billing-expenditure", project.id],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bill_payments")
        .select("id,bill_id,amount")
        .eq("project_id", project.id);
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: charges = [], isPending: chargesPending } = useQuery({
    queryKey: ["project_charges", "billing-expenditure", project.id],
    enabled,
    refetchOnWindowFocus: true,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_charges")
        .select("id,category,description,authority,amount,charge_date,status,allocation")
        .eq("project_id", project.id)
        .order("charge_date", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const rows = useMemo<Row[]>(() => {
    const paidByBill = new Map<string, number>();
    for (const p of payments) {
      paidByBill.set(p.bill_id, (paidByBill.get(p.bill_id) ?? 0) + num(p.amount));
    }
    const billRows: Row[] = bills.map((b) => {
      const gross =
        num(b.basic_amount) + num(b.gst_amount) + num(b.other_charges) -
        num(b.retention_amount) - num(b.deductions);
      return {
        id: b.id,
        kind: "Vendor bill",
        reference: b.bill_number || "—",
        payee: b.vendor_name || "—",
        date: b.bill_date,
        category: b.category || "Uncategorised",
        detail: b.description || "",
        amount: gross,
        paid: paidByBill.get(b.id) ?? 0,
        status: b.status || "draft",
      };
    });
    const chargeRows: Row[] = charges.map((c) => ({
      id: c.id,
      kind: "Statutory charge",
      reference: CHARGE_LABELS[String(c.category)] ?? String(c.category),
      payee: c.authority || "—",
      date: c.charge_date,
      category: String(c.allocation) === "per_owner" ? "Owner-wise" : "Common",
      detail: c.description || "",
      amount: num(c.amount),
      paid: String(c.status) === "paid" ? num(c.amount) : 0,
      status: String(c.status),
    }));
    return [...chargeRows, ...billRows].sort((a, b) =>
      String(b.date ?? "").localeCompare(String(a.date ?? "")),
    );
  }, [bills, charges, payments]);

  const filtered = rows.filter((r) => {
    if (kind === "paid") {
      if (r.paid <= 0) return false;
    } else if (kind !== "all" && r.kind !== kind) return false;

    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return [r.reference, r.payee, r.category, r.detail, r.status].some((v) =>
      String(v).toLowerCase().includes(q),
    );
  });

  const totals = useMemo(() => {
    const billTotal = rows.filter((r) => r.kind === "Vendor bill").reduce((s, r) => s + r.amount, 0);
    const chargeTotal = rows
      .filter((r) => r.kind === "Statutory charge")
      .reduce((s, r) => s + r.amount, 0);
    const paid = rows.reduce((s, r) => s + r.paid, 0);
    return { billTotal, chargeTotal, total: billTotal + chargeTotal, paid };
  }, [rows]);

  const loading = billsPending || chargesPending;

  return (
    <Shell title={"Billing & Expenditure"}>
      <div className="p-4 md:p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Billing & Expenditure</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {project.name} · vendor bills, payments and statutory charges in one register
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/bills-payments"
              className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium hover:bg-muted"
            >
              <Receipt className="h-4 w-4" /> Bills & Payments
            </Link>
            <Link
              to="/common-expenses"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              <Plus className="h-4 w-4" /> Add statutory charge
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: "Vendor bills",
              value: totals.billTotal,
              Icon: FileText,
              kind: "Vendor bill",
              note: "Show vendor bills only",
            },
            {
              label: "Statutory charges",
              value: totals.chargeTotal,
              Icon: Landmark,
              kind: "Statutory charge",
              note: "Show statutory charges only",
            },
            {
              label: "Total expenditure",
              value: totals.total,
              Icon: Receipt,
              kind: "all",
              note: "Show every entry",
            },
            {
              label: "Paid so far",
              value: totals.paid,
              Icon: Wallet,
              kind: "paid",
              note: "Show settled entries",
            },
          ].map(({ label, value, Icon, kind: k, note }) => (
            <button
              key={label}
              type="button"
              onClick={() => setKind(k)}
              className={`text-left rounded-xl border bg-card p-5 shadow-sm flex items-center gap-4 transition hover:bg-muted/50 ${
                kind === k ? "border-primary ring-1 ring-primary" : ""
              }`}
            >
              <div className="rounded-xl bg-muted p-3 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{inr(value)}</p>
                <p className="text-xs font-medium text-muted-foreground mt-0.5">{label}</p>
                <p className="text-[11px] text-muted-foreground">{note}</p>
              </div>
            </button>
          ))}
        </div>


        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 border-b">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search reference, payee, category or description"
              className="w-full md:w-96 rounded-lg border bg-background px-3 py-2 text-sm"
            />
            <select
              value={kind}
              onChange={(e) => setKind(e.target.value)}
              className="rounded-lg border bg-background px-3 py-2 text-sm"
            >
              <option value="all">All entries</option>
              <option value="Vendor bill">Vendor bills only</option>
              <option value="Statutory charge">Statutory charges only</option>
              <option value="paid">Paid entries only</option>

            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/50 border-b text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Reference</th>
                  <th className="py-3 px-4">Payee / Authority</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Allocation / Category</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-right">Paid</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Open</th>
                </tr>

              </thead>
              <tbody className="divide-y text-sm">
                {filtered.map((r) => (
                  <tr key={`${r.kind}-${r.id}`} className="hover:bg-muted/40">
                    <td className="py-3 px-4">
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                        {r.kind}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium">
                      {r.reference}
                      {r.detail ? (
                        <span className="block text-xs font-normal text-muted-foreground">
                          {r.detail}
                        </span>
                      ) : null}
                    </td>
                    <td className="py-3 px-4">{r.payee}</td>
                    <td className="py-3 px-4">{r.date ?? "—"}</td>
                    <td className="py-3 px-4">{r.category}</td>
                    <td className="py-3 px-4 text-right font-semibold">{inr(r.amount)}</td>
                    <td className="py-3 px-4 text-right">{inr(r.paid)}</td>
                    <td className="py-3 px-4 capitalize">{r.status}</td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        to={r.kind === "Vendor bill" ? "/bills-payments" : "/common-expenses"}
                        className="text-primary text-xs font-semibold hover:underline"
                      >
                        {r.kind === "Vendor bill" ? "View bill" : "View charge"}
                      </Link>
                    </td>
                  </tr>

                ))}
                {!loading && filtered.length === 0 ? (
                  <tr>
                    <td className="py-12 text-center text-muted-foreground" colSpan={9}>
                      No bills or statutory charges recorded for this project yet.
                    </td>
                  </tr>
                ) : null}
                {loading ? (
                  <tr>
                    <td className="py-12 text-center text-muted-foreground" colSpan={9}>
                      Loading expenditure…
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Shell>
  );
}
