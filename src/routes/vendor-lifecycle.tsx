import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Shell } from "@/components/saha/Shell";
import { MetricTile, Section, StatusBadge } from "@/components/saha/ui";
import { supabase } from "@/integrations/supabase/client";
import { useSessionUser } from "@/lib/access";
import { useActiveProject } from "@/hooks/useActiveProject";
import { inrCompact } from "@/data/saha";
import { lineTotals, type PoItem, type PoRecord } from "@/lib/po";
import { Building2, ScanLine, Scale, Receipt, ShoppingCart, Plus, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/vendor-lifecycle")({
  head: () => ({
    meta: [
      { title: "Vendor Lifecycle — Vendors, Orders, Stock & Payments | Saha OS" },
      { name: "description", content: "One live hub tracking every vendor from registration to purchase orders, deliveries and payments." },
      { property: "og:title", content: "Vendor Lifecycle — Vendors, Orders, Stock & Payments | Saha OS" },
      { property: "og:description", content: "One live hub tracking every vendor from registration to purchase orders, deliveries and payments." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  const project = useActiveProject();
  const user = useSessionUser();
  const enabled = Boolean(user?.id) && Boolean(project.id);

  const vendorsQ = useQuery({
    queryKey: ["vl-vendors", project.id],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase.from("vendors").select("*").eq("project_id", project.id!).order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
  const posQ = useQuery({
    queryKey: ["vl-pos", project.id],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase.from("purchase_orders").select("*").eq("project_id", project.id!);
      if (error) throw error;
      return (data ?? []) as PoRecord[];
    },
  });
  const poItemsQ = useQuery({
    queryKey: ["vl-po-items", project.id, (posQ.data ?? []).length],
    enabled: Boolean(posQ.data?.length),
    queryFn: async () => {
      const { data, error } = await supabase.from("purchase_order_items").select("*").in("po_id", (posQ.data ?? []).map((o) => o.id));
      if (error) throw error;
      return (data ?? []) as (PoItem & { po_id: string })[];
    },
  });
  const valueByPo = useMemo(() => {
    const map = new Map<string, number>();
    for (const it of poItemsQ.data ?? []) map.set(it.po_id, (map.get(it.po_id) ?? 0) + lineTotals(it).total);
    for (const o of posQ.data ?? []) {
      const base = map.get(o.id) ?? 0;
      map.set(o.id, base + Number(o.freight_charges ?? 0) + Number(o.other_charges ?? 0));
    }
    return map;
  }, [poItemsQ.data, posQ.data]);
  const stockQ = useQuery({
    queryKey: ["vl-stock", project.id],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase.from("stock_items").select("id").eq("project_id", project.id!);
      if (error) throw error;
      return data ?? [];
    },
  });
  const billsQ = useQuery({
    queryKey: ["vl-bills", project.id],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase.from("bills").select("id,vendor_name,status,basic_amount,gst_amount,other_charges,retention_amount,deductions,bill_date").eq("project_id", project.id!);
      if (error) throw error;
      return data ?? [];
    },
  });

  const vendors = vendorsQ.data ?? [];
  const pos = posQ.data ?? [];
  const bills = billsQ.data ?? [];
  const committed = pos.filter((p) => p.status === "approved").reduce((s, p) => s + (p.total_value ?? 0), 0);
  const pendingBills = bills.filter((b) => b.status !== "paid");
  const pendingAmount = pendingBills.reduce((s, b) => s + (b.basic_amount + b.gst_amount + b.other_charges - b.retention_amount - b.deductions), 0);

  const spendByVendor = useMemo(() => {
    const m = new Map<string, { pos: number; value: number; billed: number; pending: number }>();
    for (const p of pos) {
      const v = m.get(p.vendor_name) ?? { pos: 0, value: 0, billed: 0, pending: 0 };
      if (p.status === "approved") { v.pos += 1; v.value += p.total_value ?? 0; }
      m.set(p.vendor_name, v);
    }
    for (const b of bills) {
      const v = m.get(b.vendor_name) ?? { pos: 0, value: 0, billed: 0, pending: 0 };
      const gross = b.basic_amount + b.gst_amount + b.other_charges - b.retention_amount - b.deductions;
      v.billed += gross;
      if (b.status !== "paid") v.pending += gross;
      m.set(b.vendor_name, v);
    }
    return [...m.entries()].sort((a, b) => b[1].value - a[1].value).slice(0, 20);
  }, [pos, bills]);

  const loading = vendorsQ.isLoading || posQ.isLoading || billsQ.isLoading;

  return (
    <Shell title="Vendor Lifecycle">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground">Vendor Lifecycle</h1>
          <p className="text-sm text-muted-foreground">Every vendor for {project.name}: from registration and quotes to purchase orders, deliveries and payments. All figures are live.</p>
        </div>
        <div className="flex gap-2">
          <Link to="/vendor-directory" className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm font-medium text-foreground"><Plus className="h-4 w-4" /> Add vendor</Link>
          <Link to="/po-create" className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground"><ShoppingCart className="h-4 w-4" /> Raise PO</Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Link to="/vendor-directory" className="transition-transform hover:-translate-y-0.5">
          <MetricTile label="Registered vendors" value={String(vendors.length)} delta="Tap to manage & upload" />
        </Link>
        <Link to="/procurement" search={{ status: "approved" }} className="transition-transform hover:-translate-y-0.5">
          <MetricTile label="Committed PO value" value={inrCompact(committed)} delta={`${pos.filter((p) => p.status === "approved").length} approved POs`} />
        </Link>
        <Link to="/inventory-control" className="transition-transform hover:-translate-y-0.5">
          <MetricTile label="Stock items tracked" value={String(stockQ.data?.length ?? 0)} delta="Tap for material ledger" />
        </Link>
        <Link to="/bills-payments" className="transition-transform hover:-translate-y-0.5">
          <MetricTile label="Pending payments" value={inrCompact(pendingAmount)} tone={pendingBills.length ? "warn" : "good"} delta={`${pendingBills.length} unpaid bills`} />
        </Link>
      </div>

      <Section title="Vendor-wise spend (live)">
        {loading ? (
          <p className="p-4 text-sm text-muted-foreground">Loading vendor spend…</p>
        ) : spendByVendor.length === 0 ? (
          <div className="p-4 text-sm text-muted-foreground">
            No vendors or orders yet for this project. <Link to="/vendor-directory" className="font-semibold text-primary">Add vendors</Link>, then raise POs and bills — their full lifecycle shows up here.
          </div>
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
                {spendByVendor.map(([name, v]) => (
                  <tr key={name} className="border-b border-border/60">
                    <td className="p-3 font-medium text-foreground">{name}</td>
                    <td className="p-3 text-foreground">{v.pos}</td>
                    <td className="p-3 text-foreground">{inrCompact(v.value)}</td>
                    <td className="p-3 text-foreground">{inrCompact(v.billed)}</td>
                    <td className="p-3">{v.pending > 0 ? <StatusBadge tone="amber">{inrCompact(v.pending)}</StatusBadge> : <StatusBadge tone="emerald">Clear</StatusBadge>}</td>
                    <td className="p-3 text-right">
                      <Link to="/procurement" className="text-xs font-medium text-primary">POs <ArrowRight className="inline h-3 w-3" /></Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      <Section title="Vendor tools">
        <div className="grid grid-cols-2 gap-3 p-4 lg:grid-cols-3">
          {[
            { to: "/vendor-directory", icon: Building2, label: "Vendor directory", desc: "Register, edit, bulk-upload vendors" },
            { to: "/price-ocr", icon: ScanLine, label: "Scan a price quote", desc: "Upload proforma — AI extracts rates" },
            { to: "/price-intelligence", icon: Scale, label: "Price intelligence", desc: "Quoted rates vs BOQ, live" },
            { to: "/tender-comparison", icon: Scale, label: "Tender comparison", desc: "RFQs, L1/L2/L3 ranking, award" },
            { to: "/procurement", icon: ShoppingCart, label: "Purchase orders", desc: "PO register with approvals" },
            { to: "/bills-payments", icon: Receipt, label: "Bills & payments", desc: "Verify, approve and pay vendor bills" },
          ].map((t) => (
            <Link key={t.to} to={t.to} className="flex items-start gap-3 rounded-lg border border-border bg-card p-4 transition-all hover:border-primary/40 hover:shadow-sm">
              <t.icon className="mt-0.5 h-5 w-5 text-primary" />
              <div>
                <div className="text-sm font-semibold text-foreground">{t.label}</div>
                <div className="text-xs text-muted-foreground">{t.desc}</div>
              </div>
            </Link>
          ))}
        </div>
      </Section>
    </Shell>
  );
}
