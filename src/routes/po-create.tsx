import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Shell } from "@/components/saha/Shell";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAccess } from "@/lib/access";
import { inr, num } from "@/data/saha";
import {
  DEFAULT_PO_TERMS,
  amountInWords,
  lineTotals,
  n,
  poTotals,
  type PoItem,
} from "@/lib/po";
import { Plus, Save, Send, Trash2, PackageSearch } from "lucide-react";

export const Route = createFileRoute("/po-create")({
  head: () => ({
    meta: [
      { title: "Raise Purchase Order | Saha OS" },
      {
        name: "description",
        content:
          "Raise a GST-compliant purchase order against your project BOQ with vendor details, terms and PM approval routing.",
      },
      { property: "og:title", content: "Raise Purchase Order | Saha OS" },
      {
        property: "og:description",
        content: "Create, price and route a purchase order for PM approval in Saha OS.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

type ProjectRow = {
  id: string;
  name: string;
  location: string;
  company_name: string;
  company_gstin: string;
  bank_name: string;
  bank_account_name: string;
  bank_account_last4: string;
  bank_ifsc: string;
};

const emptyItem = (sort: number): PoItem => ({
  id: crypto.randomUUID(),
  item_code: "",
  description: "",
  brand: "",
  unit: "",
  quantity: 0,
  rate: 0,
  discount_pct: 0,
  gst_pct: 18,
  sort_order: sort,
});

const field =
  "w-full rounded border border-border bg-card px-2.5 py-2 text-sm text-foreground outline-none focus:border-primary";
const label = "label-caps text-muted-foreground";

function Page() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { access } = useAccess();

  const { data: projects } = useQuery({
    queryKey: ["site_projects", "po-create"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_projects")
        .select(
          "id,name,location,company_name,company_gstin,bank_name,bank_account_name,bank_account_last4,bank_ifsc",
        )
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ProjectRow[];
    },
  });

  const [projectId, setProjectId] = useState("");
  useEffect(() => {
    if (!projectId && projects?.[0]) setProjectId(projects[0].id);
  }, [projects, projectId]);
  const project = projects?.find((p) => p.id === projectId) ?? null;

  const [poNumber, setPoNumber] = useState("");
  useEffect(() => {
    supabase.rpc("next_po_number").then(({ data }) => {
      if (typeof data === "string") setPoNumber(data);
    });
  }, []);

  const [vendor, setVendor] = useState({
    vendor_name: "",
    vendor_address: "",
    vendor_gstin: "",
    vendor_contact: "",
    vendor_email: "",
    quote_reference: "",
  });
  const [meta, setMeta] = useState({
    po_date: new Date().toISOString().slice(0, 10),
    delivery_date: "",
    payment_terms: "30 days from certified delivery",
    delivery_terms: "Free delivery at site, unloading in vendor scope",
    tax_mode: "intra" as "intra" | "inter",
    freight_charges: 0 as number | string,
    other_charges: 0 as number | string,
    notes: "",
    terms: DEFAULT_PO_TERMS,
  });

  const [items, setItems] = useState<PoItem[]>([emptyItem(0)]);
  const totals = useMemo(
    () =>
      poTotals(items, {
        freight: meta.freight_charges,
        other: meta.other_charges,
        taxMode: meta.tax_mode,
      }),
    [items, meta.freight_charges, meta.other_charges, meta.tax_mode],
  );

  const [boqOpen, setBoqOpen] = useState(false);
  const { data: boqItems } = useQuery({
    queryKey: ["boq_items", "po-picker", projectId],
    enabled: !!projectId && boqOpen,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("boq_items")
        .select("id,item_code,description,brand,unit,quantity,rate,stage,category")
        .eq("project_id", projectId)
        .order("sort_order");
      if (error) throw error;
      return data ?? [];
    },
  });
  const [boqSearch, setBoqSearch] = useState("");
  const boqFiltered = (boqItems ?? []).filter((b) => {
    const q = boqSearch.trim().toLowerCase();
    if (!q) return true;
    return `${b.description} ${b.brand} ${b.item_code} ${b.category}`.toLowerCase().includes(q);
  });

  const setItem = (id: string, patch: Partial<PoItem>) =>
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));

  const [message, setMessage] = useState("");

  const save = useMutation({
    mutationFn: async (status: "draft" | "pending") => {
      const rows = items.filter((it) => it.description.trim() || n(it.quantity) > 0);
      if (!vendor.vendor_name.trim()) throw new Error("Vendor name is required");
      if (rows.length === 0) throw new Error("Add at least one line item");

      let number = poNumber;
      const { data: fresh } = await supabase.rpc("next_po_number");
      if (typeof fresh === "string") number = fresh;

      const { data: po, error } = await supabase
        .from("purchase_orders")
        .insert({
          po_number: number,
          project_id: projectId || null,
          project_name: project?.name ?? "",
          site_address: project?.location ?? "",
          ...vendor,
          po_date: meta.po_date,
          delivery_date: meta.delivery_date || null,
          payment_terms: meta.payment_terms,
          delivery_terms: meta.delivery_terms,
          freight_charges: n(meta.freight_charges),
          other_charges: n(meta.other_charges),
          tax_mode: meta.tax_mode,
          terms: meta.terms,
          notes: meta.notes,
          status,
          raised_by: access?.userId ?? null,
          raised_by_name: access?.profile?.full_name || access?.email || "",
        })
        .select("id,po_number")
        .single();
      if (error) throw error;

      const { error: itemErr } = await supabase.from("purchase_order_items").insert(
        rows.map((it, i) => ({
          po_id: po.id,
          item_code: it.item_code,
          description: it.description,
          brand: it.brand,
          unit: it.unit,
          quantity: n(it.quantity),
          rate: n(it.rate),
          discount_pct: n(it.discount_pct),
          gst_pct: n(it.gst_pct),
          sort_order: i,
        })),
      );
      if (itemErr) throw itemErr;
      return po;
    },
    onSuccess: async (po) => {
      await qc.invalidateQueries({ queryKey: ["purchase_orders"] });
      navigate({ to: "/purchase-orders", search: { po: po.po_number } as never });
    },
    onError: (e: unknown) => setMessage(e instanceof Error ? e.message : "Could not save PO"),
  });

  return (
    <Shell title="Raise Purchase Order" subtitle="GST-format purchase order routed to the PM for approval">
      <div className="mx-auto flex w-full flex-col gap-4 px-4 pb-16 pt-4 md:px-6">
        <header className="panel flex flex-wrap items-end justify-between gap-3 p-4">
          <div>
            <p className="section-title text-primary">PO NUMBER</p>
            <p className="text-sm text-muted-foreground">
              {poNumber ? poNumber : "Generating PO number…"} — assigned when you save
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={save.isPending}
              onClick={() => save.mutate("draft")}
              className="inline-flex items-center gap-2 rounded border border-border px-3 py-2 text-sm font-semibold hover:bg-secondary"
            >
              <Save className="size-4" /> Save as draft
            </button>
            <button
              type="button"
              disabled={save.isPending}
              onClick={() => save.mutate("pending")}
              className="inline-flex items-center gap-2 rounded bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
            >
              <Send className="size-4" /> Submit for PM approval
            </button>
          </div>
        </header>

        {message && (
          <div className="rounded border border-destructive/40 bg-destructive-soft px-3 py-2 text-sm text-destructive">
            {message}
          </div>
        )}

        {/* Buyer + PO meta */}
        <section className="grid gap-4 lg:grid-cols-3">
          <div className="panel space-y-3 p-4">
            <h2 className="section-title text-primary">BUYER</h2>
            <div>
              <span className={label}>Project</span>
              <select
                className={field}
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
              >
                {(projects ?? []).length === 0 && <option value="">No project yet</option>}
                {(projects ?? []).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <dl className="space-y-1 text-sm">
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">Company</dt>
                <dd className="text-right font-medium">{project?.company_name || "—"}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">GSTIN</dt>
                <dd className="text-right font-medium">{project?.company_gstin || "—"}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">Site</dt>
                <dd className="text-right font-medium">{project?.location || "—"}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">Bank</dt>
                <dd className="text-right font-medium">
                  {project?.bank_name
                    ? `${project.bank_name} ••••${project.bank_account_last4}`
                    : "—"}
                </dd>
              </div>
            </dl>
          </div>

          <div className="panel space-y-3 p-4">
            <h2 className="section-title text-primary">VENDOR</h2>
            <div className="grid gap-2">
              <input
                className={field}
                placeholder="Vendor name *"
                value={vendor.vendor_name}
                onChange={(e) => setVendor({ ...vendor, vendor_name: e.target.value })}
              />
              <textarea
                className={field}
                rows={2}
                placeholder="Vendor address"
                value={vendor.vendor_address}
                onChange={(e) => setVendor({ ...vendor, vendor_address: e.target.value })}
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  className={field}
                  placeholder="Vendor GSTIN"
                  value={vendor.vendor_gstin}
                  onChange={(e) => setVendor({ ...vendor, vendor_gstin: e.target.value })}
                />
                <input
                  className={field}
                  placeholder="Contact number"
                  value={vendor.vendor_contact}
                  onChange={(e) => setVendor({ ...vendor, vendor_contact: e.target.value })}
                />
                <input
                  className={field}
                  placeholder="Email"
                  value={vendor.vendor_email}
                  onChange={(e) => setVendor({ ...vendor, vendor_email: e.target.value })}
                />
                <input
                  className={field}
                  placeholder="Quotation reference"
                  value={vendor.quote_reference}
                  onChange={(e) => setVendor({ ...vendor, quote_reference: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="panel space-y-3 p-4">
            <h2 className="section-title text-primary">ORDER DETAILS</h2>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className={label}>PO date</span>
                <input
                  type="date"
                  className={field}
                  value={meta.po_date}
                  onChange={(e) => setMeta({ ...meta, po_date: e.target.value })}
                />
              </div>
              <div>
                <span className={label}>Required by</span>
                <input
                  type="date"
                  className={field}
                  value={meta.delivery_date}
                  onChange={(e) => setMeta({ ...meta, delivery_date: e.target.value })}
                />
              </div>
              <div className="col-span-2">
                <span className={label}>Payment terms</span>
                <input
                  className={field}
                  value={meta.payment_terms}
                  onChange={(e) => setMeta({ ...meta, payment_terms: e.target.value })}
                />
              </div>
              <div className="col-span-2">
                <span className={label}>Delivery terms</span>
                <input
                  className={field}
                  value={meta.delivery_terms}
                  onChange={(e) => setMeta({ ...meta, delivery_terms: e.target.value })}
                />
              </div>
              <div className="col-span-2">
                <span className={label}>GST type</span>
                <select
                  className={field}
                  value={meta.tax_mode}
                  onChange={(e) =>
                    setMeta({ ...meta, tax_mode: e.target.value as "intra" | "inter" })
                  }
                >
                  <option value="intra">Within state — CGST + SGST</option>
                  <option value="inter">Other state — IGST</option>
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* Line items */}
        <section className="panel p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="section-title text-primary">LINE ITEMS</h2>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setBoqOpen((v) => !v)}
                className="inline-flex items-center gap-2 rounded border border-border px-3 py-1.5 text-sm font-semibold hover:bg-secondary"
              >
                <PackageSearch className="size-4" /> Pick from BOQ
              </button>
              <button
                type="button"
                onClick={() => setItems((p) => [...p, emptyItem(p.length)])}
                className="inline-flex items-center gap-2 rounded bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground"
              >
                <Plus className="size-4" /> Add line
              </button>
            </div>
          </div>

          {boqOpen && (
            <div className="mb-3 rounded border border-border bg-secondary/40 p-3">
              <input
                className={field}
                placeholder="Search BOQ items…"
                value={boqSearch}
                onChange={(e) => setBoqSearch(e.target.value)}
              />
              <div className="mt-2 max-h-56 overflow-y-auto">
                {boqFiltered.slice(0, 60).map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() =>
                      setItems((p) => [
                        ...p.filter((it) => it.description.trim() || n(it.quantity) > 0),
                        {
                          ...emptyItem(p.length),
                          item_code: b.item_code ?? "",
                          description: b.description ?? "",
                          brand: b.brand ?? "",
                          unit: b.unit ?? "",
                          quantity: Number(b.quantity ?? 0),
                          rate: Number(b.rate ?? 0),
                        },
                      ])
                    }
                    className="flex w-full items-center justify-between gap-3 rounded px-2 py-1.5 text-left text-sm hover:bg-card"
                  >
                    <span className="truncate">
                      {b.description}
                      {b.brand ? ` · ${b.brand}` : ""}
                    </span>
                    <span className="shrink-0 text-muted-foreground tnum">
                      {num(b.quantity)} {b.unit} · {inr(b.rate)}
                    </span>
                  </button>
                ))}
                {boqFiltered.length === 0 && (
                  <p className="px-2 py-3 text-sm text-muted-foreground">
                    No BOQ items for this project yet — generate them in the BOQ Engine.
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-sm">
              <thead>
                <tr className="border-b border-border text-left label-caps text-muted-foreground">
                  <th className="py-2 pr-2">#</th>
                  <th className="py-2 pr-2">Code</th>
                  <th className="py-2 pr-2">Description</th>
                  <th className="py-2 pr-2">Brand / make</th>
                  <th className="py-2 pr-2">Unit</th>
                  <th className="py-2 pr-2 text-right">Qty</th>
                  <th className="py-2 pr-2 text-right">Rate</th>
                  <th className="py-2 pr-2 text-right">Disc %</th>
                  <th className="py-2 pr-2 text-right">GST %</th>
                  <th className="py-2 pr-2 text-right">Amount</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {items.map((it, i) => {
                  const l = lineTotals(it);
                  return (
                    <tr key={it.id} className="border-b border-border/60">
                      <td className="py-1.5 pr-2 text-muted-foreground tnum">{i + 1}</td>
                      <td className="py-1.5 pr-2">
                        <input
                          className={field}
                          value={it.item_code}
                          onChange={(e) => setItem(it.id, { item_code: e.target.value })}
                        />
                      </td>
                      <td className="py-1.5 pr-2 min-w-[220px]">
                        <input
                          className={field}
                          value={it.description}
                          onChange={(e) => setItem(it.id, { description: e.target.value })}
                        />
                      </td>
                      <td className="py-1.5 pr-2">
                        <input
                          className={field}
                          value={it.brand}
                          onChange={(e) => setItem(it.id, { brand: e.target.value })}
                        />
                      </td>
                      <td className="py-1.5 pr-2 w-20">
                        <input
                          className={field}
                          value={it.unit}
                          onChange={(e) => setItem(it.id, { unit: e.target.value })}
                        />
                      </td>
                      {(["quantity", "rate", "discount_pct", "gst_pct"] as const).map((k) => (
                        <td key={k} className="py-1.5 pr-2 w-24">
                          <input
                            type="number"
                            className={`${field} text-right`}
                            value={String(it[k])}
                            onChange={(e) => setItem(it.id, { [k]: e.target.value } as Partial<PoItem>)}
                          />
                        </td>
                      ))}
                      <td className="py-1.5 pr-2 text-right font-semibold tnum">{inr(l.total)}</td>
                      <td className="py-1.5">
                        <button
                          type="button"
                          onClick={() => setItems((p) => p.filter((x) => x.id !== it.id))}
                          className="rounded p-1.5 text-muted-foreground hover:bg-destructive-soft hover:text-destructive"
                          aria-label="Remove line"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Totals + terms */}
        <section className="grid gap-4 lg:grid-cols-3">
          <div className="panel space-y-2 p-4 lg:col-span-2">
            <h2 className="section-title text-primary">TERMS &amp; NOTES</h2>
            <textarea
              className={field}
              rows={7}
              value={meta.terms}
              onChange={(e) => setMeta({ ...meta, terms: e.target.value })}
            />
            <textarea
              className={field}
              rows={2}
              placeholder="Internal notes (not printed on the PO)"
              value={meta.notes}
              onChange={(e) => setMeta({ ...meta, notes: e.target.value })}
            />
          </div>

          <div className="panel space-y-2 p-4 text-sm">
            <h2 className="section-title text-primary">SUMMARY</h2>
            <Row k="Taxable value" v={inr(totals.taxable)} />
            {totals.discount > 0 && <Row k="Discount" v={`− ${inr(totals.discount)}`} />}
            {meta.tax_mode === "intra" ? (
              <>
                <Row k="CGST" v={inr(totals.cgst)} />
                <Row k="SGST" v={inr(totals.sgst)} />
              </>
            ) : (
              <Row k="IGST" v={inr(totals.igst)} />
            )}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div>
                <span className={label}>Freight</span>
                <input
                  type="number"
                  className={`${field} text-right`}
                  value={String(meta.freight_charges)}
                  onChange={(e) => setMeta({ ...meta, freight_charges: e.target.value })}
                />
              </div>
              <div>
                <span className={label}>Other charges</span>
                <input
                  type="number"
                  className={`${field} text-right`}
                  value={String(meta.other_charges)}
                  onChange={(e) => setMeta({ ...meta, other_charges: e.target.value })}
                />
              </div>
            </div>
            <Row k="Round off" v={inr(totals.roundOff)} />
            <div className="flex items-baseline justify-between border-t border-border pt-2">
              <span className="label-caps text-muted-foreground">Grand total</span>
              <span className="metric-figure text-foreground">{inr(totals.grand)}</span>
            </div>
            <p className="text-xs text-muted-foreground">{amountInWords(totals.grand)}</p>
          </div>
        </section>
      </div>
    </Shell>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-muted-foreground">{k}</span>
      <span className="font-medium tnum">{v}</span>
    </div>
  );
}
