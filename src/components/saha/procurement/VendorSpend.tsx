import { Link } from "@tanstack/react-router";
import { useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { MetricTile, Section, StatusBadge } from "@/components/saha/ui";
import { supabase } from "@/integrations/supabase/client";
import { useSessionUser } from "@/lib/access";
import { useActiveProject } from "@/hooks/useActiveProject";
import { inrCompact } from "@/data/saha";
import { lineTotals, type PoItem, type PoRecord } from "@/lib/po";
import { ArrowRight } from "lucide-react";

type BillRow = {
  id: string;
  vendor_name: string;
  status: string;
  basic_amount: number;
  gst_amount: number;
  other_charges: number;
  retention_amount: number;
  deductions: number;
};

/** Vendors, approved PO value, stock and unpaid bills for the active project (was Vendor Lifecycle). */
export function useVendorLifecycle() {
  const project = useActiveProject();
  const user = useSessionUser();
  const enabled = Boolean(user?.id) && Boolean(project.id);

  const vendorsQ = useQuery({
    queryKey: ["vl-vendors", project.id],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vendors")
        .select("id")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
  const posQ = useQuery({
    queryKey: ["vl-pos", project.id],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("purchase_orders")
        .select("*")
        .eq("project_id", project.id!);
      if (error) throw error;
      return (data ?? []) as PoRecord[];
    },
  });
  const poItemsQ = useQuery({
    queryKey: ["vl-po-items", project.id, (posQ.data ?? []).length],
    enabled: Boolean(posQ.data?.length),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("purchase_order_items")
        .select("*")
        .in(
          "po_id",
          (posQ.data ?? []).map((o) => o.id),
        );
      if (error) throw error;
      return (data ?? []) as (PoItem & { po_id: string })[];
    },
  });
  const stockQ = useQuery({
    queryKey: ["vl-stock", project.id],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stock_items")
        .select("id")
        .eq("project_id", project.id!);
      if (error) throw error;
      return data ?? [];
    },
  });
  const billsQ = useQuery({
    queryKey: ["vl-bills", project.id],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bills")
        .select(
          "id,vendor_name,status,basic_amount,gst_amount,other_charges,retention_amount,deductions,bill_date",
        )
        .eq("project_id", project.id!);
      if (error) throw error;
      return (data ?? []) as BillRow[];
    },
  });
  const paymentsQ = useQuery({
    queryKey: ["vl-bill-payments", project.id],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bill_payments")
        .select("bill_id,amount")
        .eq("project_id", project.id!);
      if (error) throw error;
      return data ?? [];
    },
  });

  const valueByPo = useMemo(() => {
    const map = new Map<string, number>();
    for (const it of poItemsQ.data ?? [])
      map.set(it.po_id, (map.get(it.po_id) ?? 0) + lineTotals(it).total);
    for (const o of posQ.data ?? []) {
      const base = map.get(o.id) ?? 0;
      map.set(o.id, base + Number(o.freight_charges ?? 0) + Number(o.other_charges ?? 0));
    }
    return map;
  }, [poItemsQ.data, posQ.data]);

  const paidByBill = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of paymentsQ.data ?? [])
      m.set(p.bill_id, (m.get(p.bill_id) ?? 0) + Number(p.amount ?? 0));
    return m;
  }, [paymentsQ.data]);

  const pos = useMemo(() => posQ.data ?? [], [posQ.data]);
  const bills = useMemo(() => billsQ.data ?? [], [billsQ.data]);
  const approvedPos = pos.filter((p) => p.status === "approved");
  const committed = approvedPos.reduce((s, p) => s + (valueByPo.get(p.id) ?? 0), 0);

  // Outstanding on a bill = payable (gross − retention − deductions) − payments recorded.
  const outstandingOf = useCallback(
    (b: BillRow) =>
      b.status === "paid"
        ? 0
        : Math.max(
            b.basic_amount +
              b.gst_amount +
              b.other_charges -
              b.retention_amount -
              b.deductions -
              (paidByBill.get(b.id) ?? 0),
            0,
          ),
    [paidByBill],
  );
  const pendingBills = bills.filter((b) => outstandingOf(b) > 0);
  const pendingAmount = pendingBills.reduce((s, b) => s + outstandingOf(b), 0);

  const spendByVendor = useMemo(() => {
    const m = new Map<string, { pos: number; value: number; billed: number; pending: number }>();
    for (const p of pos) {
      const v = m.get(p.vendor_name) ?? { pos: 0, value: 0, billed: 0, pending: 0 };
      if (p.status === "approved") {
        v.pos += 1;
        v.value += valueByPo.get(p.id) ?? 0;
      }
      m.set(p.vendor_name, v);
    }
    for (const b of bills) {
      const v = m.get(b.vendor_name) ?? { pos: 0, value: 0, billed: 0, pending: 0 };
      v.billed +=
        b.basic_amount + b.gst_amount + b.other_charges - b.retention_amount - b.deductions;
      v.pending += outstandingOf(b);
      m.set(b.vendor_name, v);
    }
    return [...m.entries()].sort((a, b) => b[1].value - a[1].value);
  }, [pos, bills, valueByPo, outstandingOf]);

  return {
    project,
    vendorCount: (vendorsQ.data ?? []).length,
    stockCount: stockQ.data?.length ?? 0,
    committed,
    approvedCount: approvedPos.length,
    pendingBills: pendingBills.length,
    pendingAmount,
    spendByVendor,
    loading:
      vendorsQ.isLoading ||
      posQ.isLoading ||
      billsQ.isLoading ||
      poItemsQ.isLoading ||
      paymentsQ.isLoading,
  };
}

/** Vendors, stock and unpaid bills tiles (the PO value tiles are on Procurement itself). */
export function VendorKpiTiles() {
  const v = useVendorLifecycle();
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <Link
        to="/vendor-directory"
        search={{ tab: undefined }}
        className="transition-transform hover:-translate-y-0.5"
      >
        <MetricTile
          label="Registered vendors"
          value={String(v.vendorCount)}
          delta="Tap to manage & upload"
        />
      </Link>
      <Link to="/inventory-control" className="transition-transform hover:-translate-y-0.5">
        <MetricTile
          label="Stock items tracked"
          value={String(v.stockCount)}
          delta="Tap for material ledger"
        />
      </Link>
      <Link
        to="/vendor-directory"
        search={{ tab: "spend" }}
        className="transition-transform hover:-translate-y-0.5"
      >
        <MetricTile
          label="Pending vendor payments"
          value={inrCompact(v.pendingAmount)}
          tone={v.pendingBills ? "warn" : "good"}
          delta={`${v.pendingBills} bills with a balance — vendor-wise spend`}
        />
      </Link>
    </div>
  );
}

/** Vendor-wise spend: approved PO value, billed and still to pay (was on Vendor Lifecycle). */
export function VendorSpendTable() {
  const v = useVendorLifecycle();
  return (
    <Section
      title={`Vendor-wise spend (live) — ${v.project.name}`}
      action={
        <Link
          to="/bills-payments"
          search={{ tab: undefined, bill: undefined }}
          className="text-xs font-semibold text-primary"
        >
          Bills & payments
        </Link>
      }
    >
      <div className="grid grid-cols-1 gap-3 border-b border-border p-3 sm:grid-cols-3">
        <MetricTile
          label="Committed PO value"
          value={inrCompact(v.committed)}
          delta={`${v.approvedCount} approved POs`}
        />
        <MetricTile label="Registered vendors" value={String(v.vendorCount)} />
        <MetricTile
          label="Pending payments"
          value={inrCompact(v.pendingAmount)}
          tone={v.pendingBills ? "warn" : "good"}
          delta={`${v.pendingBills} bills with a balance (after part-payments)`}
        />
      </div>
      {v.loading ? (
        <p className="p-4 text-sm text-muted-foreground">Loading vendor spend…</p>
      ) : v.spendByVendor.length === 0 ? (
        <p className="p-4 text-sm text-muted-foreground">
          No orders or bills yet for this project. Raise POs and log bills — each vendor's spend
          shows up here.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-left">
                <th className="p-3 font-semibold text-foreground">Vendor</th>
                <th className="p-3 font-semibold text-foreground">Approved POs</th>
                <th className="p-3 font-semibold text-foreground">PO value</th>
                <th className="p-3 font-semibold text-foreground">Billed</th>
                <th className="p-3 font-semibold text-foreground">Pending</th>
                <th className="p-3 font-semibold text-foreground"></th>
              </tr>
            </thead>
            <tbody>
              {v.spendByVendor.map(([name, s]) => (
                <tr key={name} className="border-b border-border/60">
                  <td className="p-3 font-medium text-foreground">{name || "Vendor not set"}</td>
                  <td className="p-3 text-foreground">{s.pos}</td>
                  <td className="p-3 text-foreground">{inrCompact(s.value)}</td>
                  <td className="p-3 text-foreground">{inrCompact(s.billed)}</td>
                  <td className="p-3">
                    {s.pending > 0 ? (
                      <StatusBadge tone="amber">{inrCompact(s.pending)}</StatusBadge>
                    ) : (
                      <StatusBadge tone="emerald">Clear</StatusBadge>
                    )}
                  </td>
                  <td className="p-3 text-right">
                    <Link
                      to="/procurement"
                      search={{ status: undefined }}
                      className="text-xs font-medium text-primary"
                    >
                      POs <ArrowRight className="inline h-3 w-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Section>
  );
}
