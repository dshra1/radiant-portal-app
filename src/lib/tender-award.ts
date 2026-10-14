/**
 * Tender award: at least three vendor quotes, award item by item (L1 by
 * default), and one purchase order per awarded vendor. The database refuses an
 * award with fewer than three quotes unless an admin gives a written reason.
 */
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { DEFAULT_PO_TERMS } from "@/lib/po";

export const MIN_QUOTES = 3;

export type TItem = {
  id: string;
  description: string;
  item_code?: string;
  qty: number;
  unit: string;
  benchmark_rate: number;
  gst_pct?: number;
};
export type TBid = {
  id: string;
  vendor_name: string;
  rates: Record<string, number>;
  freight_total: number;
  payment_terms: string;
  lead_time: string;
  notes: string;
};
export type ItemAward = { bid_id: string; vendor: string; rate: number };

const n = (v: unknown) => {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
};

/** Bids that quoted at least one line. */
export function quoteCount(bids: TBid[]) {
  return bids.filter((b) => Object.values(b.rates ?? {}).some((r) => n(r) > 0)).length;
}

/** Number of vendors that quoted this line. */
export function lineQuotes(item: TItem, bids: TBid[]) {
  return bids.filter((b) => n(b.rates?.[item.id]) > 0).length;
}

/** The lowest quote for each line (L1 by item). */
export function lowestPicks(items: TItem[], bids: TBid[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const it of items) {
    let best: TBid | null = null;
    for (const b of bids) {
      const r = n(b.rates?.[it.id]);
      if (r > 0 && (!best || r < n(best.rates[it.id]))) best = b;
    }
    if (best) out[it.id] = best.id;
  }
  return out;
}

/** Item description without the import's bracketed note. */
export function cleanDescription(d: string) {
  return d.replace(/\s*\[[^\]]*\]\s*$/, "").trim();
}

export function codeOf(it: TItem) {
  return (
    it.item_code ||
    /^([A-Z]{1,4}[0-9]{0,3}[a-z]?(?:-[A-Z0-9]{1,4})?) · /.exec(it.description)?.[1] ||
    ""
  );
}

/** Award totals by vendor for a set of picks (excl. GST, freight shared by line value). */
export function awardSummary(items: TItem[], bids: TBid[], picks: Record<string, string>) {
  const byVendor = new Map<
    string,
    { bid: TBid; lines: { item: TItem; rate: number }[]; value: number }
  >();
  for (const it of items) {
    const bid = bids.find((b) => b.id === picks[it.id]);
    const rate = bid ? n(bid.rates?.[it.id]) : 0;
    if (!bid || rate <= 0) continue;
    const v = byVendor.get(bid.id) ?? { bid, lines: [], value: 0 };
    v.lines.push({ item: it, rate });
    v.value += rate * n(it.qty);
    byVendor.set(bid.id, v);
  }
  const total = [...byVendor.values()].reduce((s, v) => s + v.value, 0);
  const benchmark = items.reduce((s, it) => s + n(it.benchmark_rate) * n(it.qty), 0);
  const unpicked = items.filter((it) => !picks[it.id] || !bids.some((b) => b.id === picks[it.id]));
  return { vendors: [...byVendor.values()], total, benchmark, unpicked };
}

type Who = { id: string | null; name: string };

/**
 * Awards the tender with the given picks and raises one PO per vendor
 * (status "pending", for admin / PM approval in Purchase Orders).
 */
export async function awardTender(opts: {
  rfq: { id: string; rfq_number: string; title: string; project_id: string | null };
  project: { id: string; name: string; location?: string | null };
  items: TItem[];
  bids: TBid[];
  picks: Record<string, string>;
  note: string;
  who: Who;
}) {
  const { rfq, project, items, bids, picks, note, who } = opts;
  const sum = awardSummary(items, bids, picks);
  if (!sum.vendors.length) throw new Error("Pick a vendor for at least one line");

  const itemAwards: Record<string, ItemAward> = {};
  for (const v of sum.vendors)
    for (const l of v.lines)
      itemAwards[l.item.id] = { bid_id: v.bid.id, vendor: v.bid.vendor_name, rate: l.rate };
  const lead = [...sum.vendors].sort((a, b) => b.value - a.value)[0]!;

  // The award first: the database checks the three-quote rule here.
  const up = await supabase
    .from("rfqs")
    .update({
      status: "awarded",
      item_awards: itemAwards as unknown as Json,
      award_note: note.trim(),
      awarded_bid_id: lead.bid.id,
      awarded_vendor_name:
        sum.vendors.length > 1
          ? `${lead.bid.vendor_name} + ${sum.vendors.length - 1} more`
          : lead.bid.vendor_name,
      awarded_by_name: who.name,
    })
    .eq("id", rfq.id);
  if (up.error) throw new Error(up.error.message);

  const names = sum.vendors.map((v) => v.bid.vendor_name);
  const vend = await supabase
    .from("vendors")
    .select("vendor_name,gstin,phone,email,contact_person,city")
    .in("vendor_name", names);
  const info = new Map((vend.data ?? []).map((v) => [v.vendor_name, v]));

  const poNumbers: string[] = [];
  for (const v of sum.vendors) {
    const num = await supabase.rpc("next_po_number");
    const vi = info.get(v.bid.vendor_name);
    // Freight quoted for the whole package, shared by the value this vendor won.
    const bidValue = items.reduce((s, it) => s + n(v.bid.rates?.[it.id]) * n(it.qty), 0);
    const freight = bidValue > 0 ? (n(v.bid.freight_total) * v.value) / bidValue : 0;
    const po = await supabase
      .from("purchase_orders")
      .insert({
        po_number: typeof num.data === "string" ? num.data : `PO-${Date.now()}`,
        project_id: project.id,
        project_name: project.name,
        site_address: project.location ?? "",
        vendor_name: v.bid.vendor_name,
        vendor_gstin: vi?.gstin ?? "",
        vendor_contact: [vi?.contact_person, vi?.phone].filter(Boolean).join(" · "),
        vendor_email: vi?.email ?? "",
        vendor_address: vi?.city ?? "",
        quote_reference: `${rfq.rfq_number} · ${rfq.title}`.slice(0, 200),
        po_date: new Date().toISOString().slice(0, 10),
        payment_terms: v.bid.payment_terms || "30 days from certified delivery",
        delivery_terms: `Call-off by stage per the programme${v.bid.lead_time ? `; lead time ${v.bid.lead_time}` : ""}`,
        freight_charges: Math.round(freight),
        other_charges: 0,
        tax_mode: "intra",
        terms: DEFAULT_PO_TERMS,
        notes: `Rate contract from tender ${rfq.rfq_number}, awarded ${new Date().toLocaleDateString("en-IN")} by ${who.name}. Quantities are the project quantities; supply is called off stage by stage.${note.trim() ? ` Award note: ${note.trim()}` : ""}`,
        status: "pending",
        raised_by: who.id,
        raised_by_name: who.name,
      })
      .select("id,po_number")
      .single();
    if (po.error) throw new Error(`PO for ${v.bid.vendor_name}: ${po.error.message}`);
    const lines = await supabase.from("purchase_order_items").insert(
      v.lines.map((l, i) => ({
        po_id: po.data.id,
        item_code: codeOf(l.item),
        description: cleanDescription(l.item.description).replace(/^[A-Za-z0-9-]+ · /, ""),
        brand: "",
        unit: l.item.unit,
        quantity: n(l.item.qty),
        rate: l.rate,
        discount_pct: 0,
        gst_pct: n(l.item.gst_pct) || 18,
        sort_order: i,
        stage_code: "",
        material_key: "",
      })),
    );
    if (lines.error) throw new Error(`PO lines for ${v.bid.vendor_name}: ${lines.error.message}`);
    poNumbers.push(po.data.po_number);
  }
  await supabase
    .from("rfqs")
    .update({ po_numbers: poNumbers as unknown as Json })
    .eq("id", rfq.id);
  await supabase.from("notifications").insert({
    title: `Tender ${rfq.rfq_number} awarded: ${poNumbers.length} PO${poNumbers.length > 1 ? "s" : ""} for approval`,
    body: sum.vendors
      .map(
        (v) =>
          `${v.bid.vendor_name}: ${v.lines.length} line${v.lines.length > 1 ? "s" : ""}, ₹${Math.round(v.value).toLocaleString("en-IN")} excl. GST`,
      )
      .join(" · "),
    category: "Purchase",
    priority: "High",
    link: "/purchase-orders",
    project_id: project.id,
    sender_id: who.id,
  });
  return poNumbers;
}
