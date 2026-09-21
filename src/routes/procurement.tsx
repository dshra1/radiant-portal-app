import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Shell } from "@/components/saha/Shell";
import { MetricTile, Section, StatusBadge } from "@/components/saha/ui";
import { supabase } from "@/integrations/supabase/client";
import { useSessionUser } from "@/lib/access";
import { useActiveProject } from "@/hooks/useActiveProject";
import { inr, inrCompact } from "@/data/saha";
import { STATUS_LABEL, lineTotals, type PoItem, type PoRecord, type PoStatus } from "@/lib/po";
import { Download, Plus, Users } from "lucide-react";

export const Route = createFileRoute("/procurement")({
  validateSearch: (search: Record<string, unknown>) => ({
    status: (["draft", "pending", "approved", "rejected"].includes(String(search.status))
      ? String(search.status)
      : undefined) as PoStatus | undefined,
  }),
  head: () => ({
    meta: [
      { title: "Procurement & Vendor Commitments | Saha OS" },
      {
        name: "description",
        content:
          "Live procurement view: purchase orders raised on the project, value committed to each vendor, approvals pending and delivery dates.",
      },
      { property: "og:title", content: "Procurement & Vendor Commitments | Saha OS" },
      {
        property: "og:description",
        content: "Purchase orders, committed value per vendor and pending approvals for your project.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Procurement,
});

const tone: Record<PoStatus, "slate" | "amber" | "emerald" | "red"> = {
  draft: "slate",
  pending: "amber",
  approved: "emerald",
  rejected: "red",
};

type Filter = "all" | PoStatus;

function Procurement() {
  const user = useSessionUser();
  const project = useActiveProject();
  const { status } = Route.useSearch();
  const [filter, setFilter] = useState<Filter>(status ?? "all");
  const [q, setQ] = useState("");

  useEffect(() => {
    setFilter(status ?? "all");
  }, [status]);

  const { data: orders, isPending } = useQuery({
    queryKey: ["purchase_orders", "procurement", project.id],
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
    queryKey: ["purchase_order_items", "procurement", project.id, (orders ?? []).length],
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

  const valueByPo = useMemo(() => {
    const map = new Map<string, number>();
    for (const it of items ?? []) {
      map.set(it.po_id, (map.get(it.po_id) ?? 0) + lineTotals(it).total);
    }
    for (const o of orders ?? []) {
      const base = map.get(o.id) ?? 0;
      map.set(o.id, base + Number(o.freight_charges ?? 0) + Number(o.other_charges ?? 0));
    }
    return map;
  }, [items, orders]);

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return (orders ?? [])
      .filter((o) => (filter === "all" ? true : o.status === filter))
      .filter((o) =>
        term
          ? [o.po_number, o.vendor_name, o.quote_reference, o.raised_by_name]
              .join(" ")
              .toLowerCase()
              .includes(term)
          : true,
      );
  }, [orders, filter, q]);

  const total = (orders ?? []).reduce((s, o) => s + (valueByPo.get(o.id) ?? 0), 0);
  const committed = (orders ?? [])
    .filter((o) => o.status === "approved")
    .reduce((s, o) => s + (valueByPo.get(o.id) ?? 0), 0);
  const pendingValue = (orders ?? [])
    .filter((o) => o.status === "pending")
    .reduce((s, o) => s + (valueByPo.get(o.id) ?? 0), 0);
  const pendingCount = (orders ?? []).filter((o) => o.status === "pending").length;
  const draftCount = (orders ?? []).filter((o) => o.status === "draft").length;

  const vendorSummary = useMemo(() => {
    const map = new Map<string, { name: string; count: number; value: number; approved: number }>();
    for (const o of orders ?? []) {
      const key = o.vendor_name || "Vendor not set";
      const cur = map.get(key) ?? { name: key, count: 0, value: 0, approved: 0 };
      cur.count += 1;
      cur.value += valueByPo.get(o.id) ?? 0;
      if (o.status === "approved") cur.approved += valueByPo.get(o.id) ?? 0;
      map.set(key, cur);
    }
    return [...map.values()].sort((a, b) => b.value - a.value);
  }, [orders, valueByPo]);

  const exportCsv = () => {
    const header = ["PO number", "Vendor", "Status", "PO date", "Required by", "Value (INR)", "Raised by"];
    const lines = rows.map((o) => [
      o.po_number,
      o.vendor_name,
      STATUS_LABEL[o.status],
      o.po_date,
      o.delivery_date ?? "",
      Math.round(valueByPo.get(o.id) ?? 0),
      o.raised_by_name,
    ]);
    const csv = [header, ...lines]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `procurement-${project.name || "project"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Shell
      title="Procurement"
      subtitle={`Purchase orders and vendor commitments — ${project.name}`}
      actions={
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={exportCsv}
            className="inline-flex items-center gap-2 rounded border border-border px-3 py-2 text-sm font-semibold hover:bg-secondary"
          >
            <Download className="size-4" /> Export
          </button>
          <Link
            to="/po-create"
            className="inline-flex items-center gap-2 rounded bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            <Plus className="size-4" /> Raise PO
          </Link>
        </div>
      }
    >
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricTile label="Total PO value raised" value={inrCompact(total)} delta={`${(orders ?? []).length} orders`} />
        <MetricTile label="Approved / committed" value={inrCompact(committed)} tone="good" delta="Payable on delivery" />
        <MetricTile
          label="Awaiting PM approval"
          value={String(pendingCount)}
          tone={pendingCount ? "warn" : "neutral"}
          delta={inrCompact(pendingValue)}
        />
        <MetricTile label="Drafts to complete" value={String(draftCount)} delta="Not yet submitted" />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {(["all", "draft", "pending", "approved", "rejected"] as Filter[]).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
              filter === f ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
            }`}
          >
            {f === "all" ? "All" : STATUS_LABEL[f]}
          </button>
        ))}
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search PO number or vendor"
          className="ml-auto h-9 w-full max-w-xs rounded border border-input bg-card px-3 text-sm"
        />
      </div>

      <Section title="Purchase orders" className="mt-3">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[840px] text-[13px]">
            <thead>
              <tr className="border-b border-border bg-secondary/60">
                {["PO number", "Vendor", "Value", "Status", "PO date", "Required by", "Raised by", ""].map((h) => (
                  <th key={h} className="label-caps px-3 py-2 text-left font-medium text-muted-foreground">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isPending && (
                <tr>
                  <td colSpan={8} className="px-3 py-6 text-center text-muted-foreground">
                    Loading purchase orders…
                  </td>
                </tr>
              )}
              {!isPending && rows.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-3 py-6 text-center text-muted-foreground">
                    No purchase orders {filter === "all" ? "yet" : `in this state`} for {project.name}. Use “Raise PO”
                    to create one.
                  </td>
                </tr>
              )}
              {rows.map((o) => (
                <tr key={o.id} className="border-b border-border hover:bg-secondary/40">
                  <td className="px-3 py-2 font-semibold tnum">{o.po_number}</td>
                  <td className="px-3 py-2">{o.vendor_name || "—"}</td>
                  <td className="px-3 py-2 font-semibold tnum">{inr(valueByPo.get(o.id) ?? 0)}</td>
                  <td className="px-3 py-2">
                    <StatusBadge tone={tone[o.status]}>{STATUS_LABEL[o.status]}</StatusBadge>
                  </td>
                  <td className="px-3 py-2 text-muted-foreground tnum">{o.po_date}</td>
                  <td className="px-3 py-2 text-muted-foreground tnum">{o.delivery_date || "—"}</td>
                  <td className="px-3 py-2 text-muted-foreground">{o.raised_by_name || "—"}</td>
                  <td className="px-3 py-2 text-right">
                    <Link
                      to="/purchase-orders"
                      search={{ po: o.po_number }}
                      className="font-semibold text-primary hover:underline"
                    >
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section
        title="Value committed per vendor"
        className="mt-3"
        action={
          <Link to="/vendor-directory" className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary">
            <Users className="size-3.5" /> Vendor directory
          </Link>
        }
      >
        {vendorSummary.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">
            No vendor commitments yet — raise a purchase order to see spend by vendor.
          </p>
        ) : (
          <div className="divide-y divide-border">
            {vendorSummary.map((v) => (
              <div key={v.name} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5">
                <div>
                  <p className="font-semibold">{v.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {v.count} PO{v.count > 1 ? "s" : ""} · {inr(v.approved)} approved
                  </p>
                </div>
                <span className="font-semibold tnum">{inr(v.value)}</span>
              </div>
            ))}
          </div>
        )}
      </Section>
    </Shell>
  );
}
