import { createFileRoute, Link } from "@tanstack/react-router";
import { Shell } from "@/components/saha/Shell";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAccess } from "@/lib/access";
import { inr, num } from "@/data/saha";
import logoAsset from "@/assets/saha-logo.jpeg.asset.json";
import {
  STATUS_LABEL,
  amountInWords,
  lineTotals,
  poTotals,
  type PoItem,
  type PoRecord,
  type PoStatus,
} from "@/lib/po";
import { CheckCircle2, Plus, Printer, Send, Trash2, XCircle } from "lucide-react";

export const Route = createFileRoute("/purchase-orders")({
  validateSearch: (search: Record<string, unknown>) => ({
    po: typeof search['po'] === "string" ? (search['po'] as string) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Purchase Order Register | Saha OS" },
      {
        name: "description",
        content:
          "Live purchase order register with draft, PM approval and approved states, printable GST-format POs and vendor details.",
      },
      { property: "og:title", content: "Purchase Order Register | Saha OS" },
      {
        property: "og:description",
        content: "Track, approve and print every purchase order raised on your project.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

const statusTone: Record<PoStatus, string> = {
  draft: "bg-secondary text-muted-foreground",
  pending: "bg-warning-soft text-warning",
  approved: "bg-primary-soft text-primary",
  rejected: "bg-destructive-soft text-destructive",
};

function Page() {
  const qc = useQueryClient();
  const { access } = useAccess();
  const canApprove = !!access && (access.isAdmin || access.roles.includes("pm"));
  const search = Route.useSearch();

  const { data: orders, isPending } = useQuery({
    queryKey: ["purchase_orders", "list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("purchase_orders")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as PoRecord[];
    },
  });

  const [selectedId, setSelectedId] = useState<string | null>(null);
  useEffect(() => {
    if (!orders?.length) return;
    if (selectedId && orders.some((o) => o.id === selectedId)) return;
    const bySearch = search.po ? orders.find((o) => o.po_number === search.po) : undefined;
    setSelectedId((bySearch ?? orders[0]!).id);
  }, [orders, search.po, selectedId]);

  const selected = orders?.find((o) => o.id === selectedId) ?? null;

  const { data: items } = useQuery({
    queryKey: ["purchase_order_items", selectedId],
    enabled: !!selectedId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("purchase_order_items")
        .select("*")
        .eq("po_id", selectedId!)
        .order("sort_order");
      if (error) throw error;
      return (data ?? []) as PoItem[];
    },
  });

  const totals = useMemo(
    () =>
      poTotals(items ?? [], {
        freight: selected?.freight_charges,
        other: selected?.other_charges,
        taxMode: selected?.tax_mode,
      }),
    [items, selected],
  );

  const setStatus = useMutation({
    mutationFn: async ({ status, reason }: { status: PoStatus; reason?: string }) => {
      if (!selected) return;
      const patch: Partial<PoRecord> & { status: PoStatus } = { status };
      if (status === "approved" || status === "rejected") {
        patch.approved_by = access?.userId ?? null;
        patch.approved_by_name = access?.profile?.full_name || access?.email || "";
        patch.approved_at = new Date().toISOString();
        patch.rejection_reason = status === "rejected" ? (reason ?? "") : "";
      }
      const { error } = await supabase.from("purchase_orders").update(patch).eq("id", selected.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["purchase_orders"] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("purchase_orders").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      setSelectedId(null);
      qc.invalidateQueries({ queryKey: ["purchase_orders"] });
    },
  });

  const counts = {
    draft: orders?.filter((o) => o.status === "draft").length ?? 0,
    pending: orders?.filter((o) => o.status === "pending").length ?? 0,
    approved: orders?.filter((o) => o.status === "approved").length ?? 0,
  };

  return (
    <Shell title="Purchase Order Register | Saha OS">
      <div className="mx-auto flex w-full flex-col gap-4 px-4 pb-16 pt-4 md:px-6 no-print">
        <header className="panel flex flex-wrap items-end justify-between gap-3 p-4">
          <div>
            <h1 className="display-title">PURCHASE ORDERS</h1>
            <p className="text-sm text-muted-foreground">
              {counts.draft} draft · {counts.pending} awaiting PM approval · {counts.approved}{" "}
              approved
            </p>
          </div>
          <Link
            to="/po-create"
            className="inline-flex items-center gap-2 rounded bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            <Plus className="size-4" /> Raise PO
          </Link>
        </header>

        <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
          <aside className="panel max-h-[70vh] overflow-y-auto p-2">
            {isPending && <p className="p-3 text-sm text-muted-foreground">Loading…</p>}
            {!isPending && (orders ?? []).length === 0 && (
              <p className="p-3 text-sm text-muted-foreground">
                No purchase orders yet. Raise your first PO to see it here.
              </p>
            )}
            {(orders ?? []).map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => setSelectedId(o.id)}
                className={`mb-1 flex w-full flex-col gap-1 rounded p-2.5 text-left transition-colors ${
                  o.id === selectedId ? "bg-secondary" : "hover:bg-secondary/60"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold">{o.po_number}</span>
                  <span
                    className={`rounded px-1.5 py-0.5 text-[11px] font-semibold ${statusTone[o.status]}`}
                  >
                    {STATUS_LABEL[o.status]}
                  </span>
                </div>
                <span className="truncate text-sm text-muted-foreground">
                  {o.vendor_name || "Vendor not set"} · {o.project_name || "—"}
                </span>
              </button>
            ))}
          </aside>

          <section className="flex flex-col gap-3">
            {!selected && (
              <div className="panel p-6 text-sm text-muted-foreground">
                Select a purchase order to view it.
              </div>
            )}
            {selected && (
              <>
                <div className="panel flex flex-wrap items-center gap-2 p-3">
                  <span
                    className={`rounded px-2 py-1 text-xs font-semibold ${statusTone[selected.status]}`}
                  >
                    {STATUS_LABEL[selected.status]}
                  </span>
                  {selected.status === "draft" && (
                    <button
                      type="button"
                      onClick={() => setStatus.mutate({ status: "pending" })}
                      className="inline-flex items-center gap-2 rounded border border-border px-3 py-1.5 text-sm font-semibold hover:bg-secondary"
                    >
                      <Send className="size-4" /> Submit for approval
                    </button>
                  )}
                  {canApprove && selected.status === "pending" && (
                    <>
                      <button
                        type="button"
                        onClick={() => setStatus.mutate({ status: "approved" })}
                        className="inline-flex items-center gap-2 rounded bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground"
                      >
                        <CheckCircle2 className="size-4" /> Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const reason = window.prompt("Reason for rejection") ?? "";
                          setStatus.mutate({ status: "rejected", reason });
                        }}
                        className="inline-flex items-center gap-2 rounded border border-destructive/40 px-3 py-1.5 text-sm font-semibold text-destructive hover:bg-destructive-soft"
                      >
                        <XCircle className="size-4" /> Reject
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-2 rounded border border-border px-3 py-1.5 text-sm font-semibold hover:bg-secondary"
                  >
                    <Printer className="size-4" /> Print / PDF
                  </button>
                  {canApprove && (
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`Delete ${selected.po_number}?`))
                          remove.mutate(selected.id);
                      }}
                      className="ml-auto inline-flex items-center gap-2 rounded p-2 text-muted-foreground hover:bg-destructive-soft hover:text-destructive"
                      aria-label="Delete purchase order"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  )}
                </div>
                {selected.status === "rejected" && selected.rejection_reason && (
                  <div className="rounded border border-destructive/40 bg-destructive-soft px-3 py-2 text-sm text-destructive">
                    Rejected: {selected.rejection_reason}
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </div>

      {selected && (
        <PoDocument po={selected} items={items ?? []} totals={totals} />
      )}
    </Shell>
  );
}

function PoDocument({
  po,
  items,
  totals,
}: {
  po: PoRecord;
  items: PoItem[];
  totals: ReturnType<typeof poTotals>;
}) {
  return (
    <div className="po-print mx-auto w-full max-w-4xl bg-card px-4 pb-16 md:px-6">
      <div className="panel space-y-4 p-6 text-sm text-foreground">
        <div className="flex items-start justify-between gap-4 border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <img src={logoAsset.url} alt="Saha Developers" className="h-12 w-auto" />
            <div>
              <p className="text-base font-bold">{po.project_name || "Saha Developers"}</p>
              <p className="text-muted-foreground">{po.site_address}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="display-title text-xl">PURCHASE ORDER</p>
            <p className="font-semibold">{po.po_number}</p>
            <p className="text-muted-foreground">Date: {po.po_date}</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Block title="VENDOR">
            <p className="font-semibold">{po.vendor_name}</p>
            <p className="whitespace-pre-line text-muted-foreground">{po.vendor_address}</p>
            {po.vendor_gstin && <p>GSTIN: {po.vendor_gstin}</p>}
            {po.vendor_contact && <p>Contact: {po.vendor_contact}</p>}
            {po.vendor_email && <p>{po.vendor_email}</p>}
            {po.quote_reference && <p>Quote ref: {po.quote_reference}</p>}
          </Block>
          <Block title="DELIVERY & PAYMENT">
            <p>Deliver to: {po.site_address || "—"}</p>
            <p>Required by: {po.delivery_date || "—"}</p>
            <p>Payment terms: {po.payment_terms}</p>
            <p>Delivery terms: {po.delivery_terms || "—"}</p>
          </Block>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border border-border text-xs">
            <thead className="bg-secondary">
              <tr className="text-left">
                {["#", "Item", "Description", "Brand", "Unit", "Qty", "Rate", "Disc%", "Taxable", "GST%", "Amount"].map(
                  (h) => (
                    <th key={h} className="border border-border px-2 py-1.5 font-semibold">
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {items.map((it, i) => {
                const l = lineTotals(it);
                return (
                  <tr key={it.id}>
                    <td className="border border-border px-2 py-1 tnum">{i + 1}</td>
                    <td className="border border-border px-2 py-1">{it.item_code}</td>
                    <td className="border border-border px-2 py-1">{it.description}</td>
                    <td className="border border-border px-2 py-1">{it.brand}</td>
                    <td className="border border-border px-2 py-1">{it.unit}</td>
                    <td className="border border-border px-2 py-1 text-right tnum">
                      {num(it.quantity, 2)}
                    </td>
                    <td className="border border-border px-2 py-1 text-right tnum">
                      {num(it.rate, 2)}
                    </td>
                    <td className="border border-border px-2 py-1 text-right tnum">
                      {num(it.discount_pct, 1)}
                    </td>
                    <td className="border border-border px-2 py-1 text-right tnum">
                      {inr(l.taxable)}
                    </td>
                    <td className="border border-border px-2 py-1 text-right tnum">
                      {num(it.gst_pct, 1)}
                    </td>
                    <td className="border border-border px-2 py-1 text-right font-semibold tnum">
                      {inr(l.total)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Block title="AMOUNT IN WORDS">
            <p>{amountInWords(totals.grand)}</p>
          </Block>
          <div className="space-y-1">
            <Line k="Taxable value" v={inr(totals.taxable)} />
            {po.tax_mode === "intra" ? (
              <>
                <Line k="CGST" v={inr(totals.cgst)} />
                <Line k="SGST" v={inr(totals.sgst)} />
              </>
            ) : (
              <Line k="IGST" v={inr(totals.igst)} />
            )}
            {totals.freight > 0 && <Line k="Freight" v={inr(totals.freight)} />}
            {totals.other > 0 && <Line k="Other charges" v={inr(totals.other)} />}
            <Line k="Round off" v={inr(totals.roundOff)} />
            <div className="flex justify-between border-t border-border pt-1 text-base font-bold">
              <span>Grand total</span>
              <span className="tnum">{inr(totals.grand)}</span>
            </div>
          </div>
        </div>

        {po.terms && (
          <Block title="TERMS & CONDITIONS">
            <p className="whitespace-pre-line text-muted-foreground">{po.terms}</p>
          </Block>
        )}

        <div className="grid gap-6 border-t border-border pt-8 sm:grid-cols-3">
          <Sign role="Prepared by" name={po.raised_by_name} />
          <Sign
            role="Checked / approved by (PM)"
            name={po.status === "approved" ? po.approved_by_name : ""}
          />
          <Sign role="Authorised signatory" name="" />
        </div>
      </div>
    </div>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="label-caps mb-1 text-primary">{title}</p>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function Line({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-muted-foreground">{k}</span>
      <span className="font-medium tnum">{v}</span>
    </div>
  );
}

function Sign({ role, name }: { role: string; name: string }) {
  return (
    <div>
      <div className="h-10 border-b border-border" />
      <p className="mt-1 text-xs font-semibold">{role}</p>
      <p className="text-xs text-muted-foreground">{name || "—"}</p>
    </div>
  );
}
