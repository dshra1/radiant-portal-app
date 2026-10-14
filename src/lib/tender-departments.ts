/**
 * Department tenders: one RFQ per dealer type (CE-D01 … CE-D25), built from the
 * PMC procurement master (every material incl. fixings and consumables). The same
 * schedules were issued to dealers as Excel files (CE-Tender-Dxx-….xlsx); when a
 * dealer sends the file back, `parseVendorQuote` reads it and `importVendorQuote`
 * records it as a bid on that tender, line by line (matched by S.No).
 */
import * as XLSX from "xlsx";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import DEPTS from "@/data/department-tenders.json";

export type DeptItem = {
  sno: number;
  code: string;
  item: string;
  spec: string;
  make: string;
  unit: string;
  qty: number;
  need: string;
  rate: number;
  allowance: boolean;
};
export type Dept = { code: string; name: string; dealer: string; first: string; items: DeptItem[] };
export const DEPARTMENTS = DEPTS as Dept[];

type Log = (text: string, tone?: "ok" | "err") => void;
const DAY = 86_400_000;
const addDays = (iso: string, d: number) =>
  new Date(Date.parse(`${iso}T00:00:00Z`) + d * DAY).toISOString().slice(0, 10);
const fmt = (iso: string) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

export const rfqNumberOf = (deptCode: string) => `CE-${deptCode}`;

/**
 * Creates (or refreshes) the 25 department tenders. Tenders that already have
 * quotes or are awarded keep their lines. The older package tenders (CE-PKG-xx)
 * that have no quotes are removed, since the department tenders cover them.
 */
export async function loadDepartmentTenders(projectId: string, userId: string | null, log: Log) {
  const existing = await supabase
    .from("rfqs")
    .select("id,rfq_number,status")
    .eq("project_id", projectId)
    .or("rfq_number.like.CE-D%,rfq_number.like.CE-PKG-%");
  if (existing.error) throw existing.error;
  const ids = (existing.data ?? []).map((r) => r.id);
  const bids = ids.length
    ? await supabase.from("rfq_bids").select("rfq_id").in("rfq_id", ids)
    : { data: [], error: null };
  if (bids.error) throw bids.error;
  const quoted = new Set((bids.data ?? []).map((b) => b.rfq_id));
  const byNo = new Map((existing.data ?? []).map((r) => [r.rfq_number, r]));

  let added = 0;
  let refreshed = 0;
  let kept = 0;
  for (const d of DEPARTMENTS) {
    const no = rfqNumberOf(d.code);
    const enquiry = addDays(d.first, -45);
    const values = {
      title: `${d.code} · ${d.name}`,
      spec: [
        `Who quotes: ${d.dealer}.`,
        `Send the enquiry by ${fmt(enquiry)}; first supply needed ${fmt(d.first)}.`,
        `Issued as CE-Tender-${d.code}.xlsx. Rates excl. GST, delivered at site; supply called off stage by stage.`,
      ].join(" "),
      deadline: addDays(enquiry, 14),
      budget_estimate: Math.round(d.items.reduce((s, i) => s + i.qty * i.rate, 0)),
    };
    const found = byNo.get(no);
    let rfqId = found?.id;
    if (found && (found.status === "awarded" || quoted.has(found.id))) {
      await supabase.from("rfqs").update(values).eq("id", found.id);
      kept++;
      continue;
    }
    if (rfqId) {
      const up = await supabase.from("rfqs").update(values).eq("id", rfqId);
      if (up.error) throw up.error;
      const del = await supabase.from("rfq_items").delete().eq("rfq_id", rfqId);
      if (del.error) throw del.error;
      refreshed++;
    } else {
      const ins = await supabase
        .from("rfqs")
        .insert({
          ...values,
          project_id: projectId,
          rfq_number: no,
          status: "open",
          created_by: userId,
          created_by_name: "PMC procurement master",
        })
        .select("id")
        .single();
      if (ins.error) throw ins.error;
      rfqId = ins.data.id;
      added++;
    }
    const items = d.items.map((i) => ({
      rfq_id: rfqId!,
      sort: i.sno - 1,
      item_code: i.code,
      description: [
        i.code ? `${i.code} · ${i.item}` : i.item,
        i.spec ? `— ${i.spec}` : "",
        i.make ? `(make: ${i.make})` : "",
        i.allowance ? "[allowance quantity]" : "",
        `[needed from ${fmt(i.need)}]`,
      ]
        .filter(Boolean)
        .join(" "),
      qty: i.qty,
      unit: i.unit,
      benchmark_rate: i.rate,
      gst_pct: 18,
    }));
    for (let k = 0; k < items.length; k += 200) {
      const r = await supabase.from("rfq_items").insert(items.slice(k, k + 200));
      if (r.error) throw r.error;
    }
  }
  // The package tenders from the quotation workbook are covered by the department tenders.
  const oldPkg = (existing.data ?? []).filter(
    (r) => r.rfq_number.startsWith("CE-PKG-") && r.status !== "awarded" && !quoted.has(r.id),
  );
  if (oldPkg.length) {
    const del = await supabase
      .from("rfqs")
      .delete()
      .in(
        "id",
        oldPkg.map((r) => r.id),
      );
    if (del.error) throw del.error;
  }
  log(
    `Department tenders: ${added} created, ${refreshed} refreshed, ${kept} kept with their quotes` +
      (oldPkg.length
        ? `; ${oldPkg.length} older package tenders removed (covered by these).`
        : "."),
  );
  return { added, refreshed, kept, removed: oldPkg.length };
}

export type VendorQuote = {
  dept: string;
  vendor: string;
  gstin: string;
  validity: string;
  payment: string;
  lines: { sno: number; rate: number; gst: number; make: string; lead: string; remarks: string }[];
};

const cellText = (v: unknown) => (v === null || v === undefined ? "" : String(v).trim());
const cellNum = (v: unknown) => {
  const n = typeof v === "number" ? v : Number(String(v ?? "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
};

/** True when the workbook is one of our department tender files. */
export function isVendorQuote(wb: XLSX.WorkBook) {
  return wb.SheetNames.includes("Tender request") && wb.SheetNames.includes("Price schedule");
}

/** Reads a dealer's filled-in tender file. */
export function parseVendorQuote(wb: XLSX.WorkBook): VendorQuote | null {
  if (!isVendorQuote(wb)) return null;
  const rows = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets["Price schedule"]!, {
    header: 1,
    raw: true,
    defval: null,
    blankrows: true,
  });
  const title = cellText(rows[0]?.[0]);
  const dept = /·\s*(D\d{2})\s/.exec(title)?.[1] ?? "";
  const h = rows.findIndex((r) => cellText(r?.[0]).toLowerCase() === "s.no");
  if (!dept || h < 0) return null;
  const head = (rows[h] ?? []).map((c) => cellText(c).toLowerCase());
  const col = (start: string) => head.findIndex((c) => c.startsWith(start));
  const c = {
    rate: col("your rate"),
    gst: col("gst %"),
    make: col("make / model offered"),
    lead: col("lead time"),
    remarks: col("remarks"),
  };
  const lines: VendorQuote["lines"] = [];
  for (const r of rows.slice(h + 1)) {
    const sno = r?.[0];
    if (typeof sno !== "number") continue;
    const rate = cellNum(r[c.rate]);
    if (rate <= 0) continue;
    lines.push({
      sno,
      rate,
      gst: c.gst >= 0 && r[c.gst] !== null ? cellNum(r[c.gst]) : 18,
      make: cellText(r[c.make]),
      lead: cellText(r[c.lead]),
      remarks: cellText(r[c.remarks]),
    });
  }
  return {
    dept,
    vendor: cellText(rows[1]?.[2]) || "",
    gstin: cellText(rows[2]?.[2]),
    validity: cellText(rows[1]?.[7]),
    payment: cellText(rows[2]?.[7]),
    lines,
  };
}

/**
 * Records a dealer's returned tender file as a quote (bid) on its department
 * tender. The same vendor sending a revised file replaces their earlier quote.
 */
export async function importVendorQuote(
  projectId: string,
  q: VendorQuote,
  fileName: string,
  userId: string | null,
  log: Log,
) {
  if (!q.vendor) throw new Error(`${fileName}: the vendor name (Price schedule, cell C2) is empty`);
  if (!q.lines.length) throw new Error(`${fileName}: no rates filled in`);
  const rfq = await supabase
    .from("rfqs")
    .select("id,status")
    .eq("project_id", projectId)
    .eq("rfq_number", rfqNumberOf(q.dept))
    .maybeSingle();
  if (rfq.error) throw rfq.error;
  if (!rfq.data)
    throw new Error(`${fileName}: load the department tenders first (Tender Comparison)`);
  const items = await supabase.from("rfq_items").select("id,sort").eq("rfq_id", rfq.data.id);
  if (items.error) throw items.error;
  const bySno = new Map((items.data ?? []).map((i) => [i.sort + 1, i.id]));
  const rates: Record<string, number> = {};
  const notes: string[] = [];
  for (const l of q.lines) {
    const id = bySno.get(l.sno);
    if (!id) continue;
    // Bids are compared excl. GST; the GST % and make offered go into the notes.
    rates[id] = l.rate;
    if (l.make || l.remarks || (l.gst && l.gst !== 18))
      notes.push(
        `#${l.sno}: ${[l.make && `make ${l.make}`, l.gst !== 18 && `GST ${l.gst}%`, l.remarks].filter(Boolean).join(", ")}`,
      );
  }
  const leads = q.lines.map((l) => l.lead).filter(Boolean);
  const del = await supabase
    .from("rfq_bids")
    .delete()
    .eq("rfq_id", rfq.data.id)
    .eq("vendor_name", q.vendor)
    .eq("source", "vendor-file");
  if (del.error) throw del.error;
  const ins = await supabase.from("rfq_bids").insert({
    rfq_id: rfq.data.id,
    vendor_name: q.vendor,
    rates: rates as unknown as Json,
    payment_terms: q.payment,
    lead_time: leads.length
      ? `${Math.max(...leads.map((x) => cellNum(x)))} days (longest line)`
      : "",
    notes: [
      q.gstin && `GSTIN ${q.gstin}`,
      q.validity && `validity ${q.validity} days`,
      `from ${fileName}`,
      notes.slice(0, 40).join("; "),
    ]
      .filter(Boolean)
      .join(" · ")
      .slice(0, 2000),
    source: "vendor-file",
    created_by: userId,
    created_by_name: "Vendor tender file",
  });
  if (ins.error) throw ins.error;
  if (rfq.data.status === "open")
    await supabase.from("rfqs").update({ status: "evaluating" }).eq("id", rfq.data.id);
  log(`${q.vendor}: ${Object.keys(rates).length} rates on ${rfqNumberOf(q.dept)} (${fileName}).`);
}
