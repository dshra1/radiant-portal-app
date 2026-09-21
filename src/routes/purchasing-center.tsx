import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Shell } from "@/components/saha/Shell";
import { Section, StatusBadge } from "@/components/saha/ui";
import { supabase } from "@/integrations/supabase/client";
import { useSessionUser } from "@/lib/access";
import { useActiveProject } from "@/hooks/useActiveProject";
import { inr, inrCompact } from "@/data/saha";
import { STATUS_LABEL, lineTotals, type PoItem, type PoRecord } from "@/lib/po";
import {
  ShoppingCart,
  FileText,
  CheckCircle2,
  IndianRupee,
  Store,
  ScanSearch,
  BarChart3,
  HardHat,
  ArrowRight,
  Plus,
} from "lucide-react";

export const Route = createFileRoute("/purchasing-center")({
  head: () => ({
    meta: [
      { title: "Purchasing & Vendor Command Center | Saha OS" },
      {
        name: "description",
        content:
          "Live purchase order pipeline, committed spend, vendor directory and procurement tools for your project.",
      },
      { property: "og:title", content: "Purchasing & Vendor Command Center | Saha OS" },
      {
        property: "og:description",
        content:
          "Live purchase order pipeline, committed spend, vendor directory and procurement tools for your project.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

const cardCls =
  "group relative overflow-hidden rounded-xl border border-border bg-card p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md";

function Page() {
  const user = useSessionUser();
  const project = useActiveProject();

  const { data: orders } = useQuery({
    queryKey: ["purchase_orders", "purchasing-center", project.id],
    enabled: Boolean(user?.id) && Boolean(project.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("purchase_orders")
        .select("*")
        .eq("project_id", project.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as PoRecord[];
    },
  });

  const { data: items } = useQuery({
    queryKey: ["purchase_order_items", "purchasing-center", project.id, (orders ?? []).length],
    enabled: Boolean(orders?.length),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("purchase_order_items")
        .select("*")
        .in("po_id", (orders ?? []).map((o) => o.id));
      if (error) throw error;
      return (data ?? []) as (PoItem & { po_id: string })[];
    },
  });

  const { data: vendors } = useQuery({
    queryKey: ["vendors", "purchasing-center"],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase.from("vendors").select("id, name, category");
      if (error) throw error;
      return data ?? [];
    },
  });

  const valueByPo = useMemo(() => {
    const map = new Map<string, number>();
    for (const it of items ?? []) {
      map.set(it.po_id, (map.get(it.po_id) ?? 0) + lineTotals(it).total);
    }
    for (const o of orders ?? []) {
      map.set(
        o.id,
        (map.get(o.id) ?? 0) + Number(o.freight_charges ?? 0) + Number(o.other_charges ?? 0),
      );
    }
    return map;
  }, [items, orders]);

  const active = (orders ?? []).filter((o) => o.status === "pending" || o.status === "approved");
  const drafts = (orders ?? []).filter((o) => o.status === "draft");
  const approved = (orders ?? []).filter((o) => o.status === "approved");
  const committed = approved.reduce((s, o) => s + (valueByPo.get(o.id) ?? 0), 0);
  const recent = (orders ?? []).slice(0, 6);

  return (
    <Shell
      title="Purchasing & Vendor Command Center"
      subtitle={`Live purchase orders and vendors — ${project.name}`}
      actions={
        <Link
          to="/po-create"
          className="inline-flex items-center gap-2 rounded bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
        >
          <Plus className="size-4" /> Create PO
        </Link>
      }
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Link to="/procurement" search={{ status: undefined }} className={cardCls}>
          <div className="flex items-start justify-between">
            <div>
              <p className="label-caps text-muted-foreground">Active purchase orders</p>
              <p className="mt-1 font-display text-3xl font-bold">{active.length}</p>
              <p className="mt-1 text-xs text-muted-foreground">Pending + approved, open on site</p>
            </div>
            <ShoppingCart className="size-5 text-primary" />
          </div>
          <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary">
            View list <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
          </span>
        </Link>

        <Link to="/procurement" search={{ status: "draft" }} className={cardCls}>
          <div className="flex items-start justify-between">
            <div>
              <p className="label-caps text-muted-foreground">Draft orders</p>
              <p className="mt-1 font-display text-3xl font-bold">{drafts.length}</p>
              <p className="mt-1 text-xs text-muted-foreground">Not yet submitted for approval</p>
            </div>
            <FileText className="size-5 text-muted-foreground" />
          </div>
          <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary">
            Complete drafts <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
          </span>
        </Link>

        <Link to="/procurement" search={{ status: "approved" }} className={cardCls}>
          <div className="flex items-start justify-between">
            <div>
              <p className="label-caps text-muted-foreground">Approved POs</p>
              <p className="mt-1 font-display text-3xl font-bold">{approved.length}</p>
              <p className="mt-1 text-xs text-muted-foreground">Cleared by PM, ready to execute</p>
            </div>
            <CheckCircle2 className="size-5 text-emerald-600" />
          </div>
          <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary">
            View approved <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
          </span>
        </Link>

        <Link to="/procurement" search={{ status: "approved" }} className={cardCls}>
          <div className="flex items-start justify-between">
            <div>
              <p className="label-caps text-muted-foreground">Committed value</p>
              <p className="mt-1 font-display text-3xl font-bold">{inrCompact(committed)}</p>
              <p className="mt-1 text-xs text-muted-foreground">Total of approved purchase orders</p>
            </div>
            <IndianRupee className="size-5 text-amber-600" />
          </div>
          <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary">
            Spend by vendor <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
          </span>
        </Link>

        <Link to="/vendor-directory" className={cardCls}>
          <div className="flex items-start justify-between">
            <div>
              <p className="label-caps text-muted-foreground">Vendors</p>
              <p className="mt-1 font-display text-3xl font-bold">{(vendors ?? []).length}</p>
              <p className="mt-1 text-xs text-muted-foreground">In your master directory</p>
            </div>
            <Store className="size-5 text-primary" />
          </div>
          <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary">
            Open directory <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
          </span>
        </Link>
      </div>

      <Section title="Recent purchase orders" className="mt-4" action={
        <Link to="/procurement" search={{ status: undefined }} className="text-xs font-semibold text-primary">
          View all
        </Link>
      }>
        {recent.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">
            No purchase orders yet for {project.name}. Use “Create PO” to raise the first one.
          </p>
        ) : (
          <div className="divide-y divide-border">
            {recent.map((o) => (
              <Link
                key={o.id}
                to="/purchase-orders"
                search={{ po: o.po_number }}
                className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 hover:bg-secondary/40"
              >
                <div>
                  <p className="font-semibold tnum">{o.po_number}</p>
                  <p className="text-xs text-muted-foreground">{o.vendor_name || "Vendor not set"}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold tnum">{inr(valueByPo.get(o.id) ?? 0)}</span>
                  <StatusBadge
                    tone={
                      o.status === "approved"
                        ? "emerald"
                        : o.status === "pending"
                          ? "amber"
                          : o.status === "rejected"
                            ? "red"
                            : "slate"
                    }
                  >
                    {STATUS_LABEL[o.status]}
                  </StatusBadge>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Section>

      <Section title="Procurement tools" className="mt-4">
        <div className="grid grid-cols-1 gap-3 p-3 sm:grid-cols-2 lg:grid-cols-4">
          <Link to="/price-ocr" className="rounded-lg border border-border p-3 transition-colors hover:bg-secondary/40">
            <ScanSearch className="size-5 text-primary" />
            <p className="mt-2 text-sm font-semibold">Price OCR</p>
            <p className="text-xs text-muted-foreground">Scan proforma invoices into the price database</p>
          </Link>
          <Link to="/price-intelligence" className="rounded-lg border border-border p-3 transition-colors hover:bg-secondary/40">
            <BarChart3 className="size-5 text-primary" />
            <p className="mt-2 text-sm font-semibold">Price intelligence</p>
            <p className="text-xs text-muted-foreground">Benchmark material rates and brand alternatives</p>
          </Link>
          <Link to="/vendor-directory" className="rounded-lg border border-border p-3 transition-colors hover:bg-secondary/40">
            <Store className="size-5 text-primary" />
            <p className="mt-2 text-sm font-semibold">Vendor directory</p>
            <p className="text-xs text-muted-foreground">Add, import and manage your vendor master list</p>
          </Link>
          <Link to="/contractors-labour" className="rounded-lg border border-border p-3 transition-colors hover:bg-secondary/40">
            <HardHat className="size-5 text-primary" />
            <p className="mt-2 text-sm font-semibold">Contractors & labour</p>
            <p className="text-xs text-muted-foreground">Labour contracts and trade-wise market rates</p>
          </Link>
        </div>
      </Section>
    </Shell>
  );
}
