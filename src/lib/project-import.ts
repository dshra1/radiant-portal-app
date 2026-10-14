/**
 * Writes the rows read from the PMC workbooks (see project-workbooks.ts) into
 * the project's tables. Every step can be run again with a newer workbook:
 *
 * - BOQ: rows imported earlier from the workbooks (source = "pmc-workbook")
 *   are replaced; rows typed in the BOQ Engine, AI rows and labour rows stay.
 * - Programme: stages are matched by their code (F01, S1, TL3 …); planned
 *   dates are updated, progress and actual dates entered on site are kept.
 * - Materials: stock items are matched by item code; stock movements and the
 *   opening quantity are never touched.
 * - Tenders: one RFQ per quotation package (CE-PKG-01 …). Its line items are
 *   refreshed only while no vendor bid has been entered; awarded RFQs are left
 *   alone.
 * - Drawings: PDFs go to the project's drawing register under their own file
 *   name, replacing an older upload of the same name.
 */
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import type {
  AppBoqRow,
  ControlData,
  FlatType,
  MasterBoq,
  QuotePackage,
} from "@/lib/project-workbooks";
import { boqTotals } from "@/lib/boq-totals";
import { IMPORT_SOURCE, materialCodes } from "@/lib/project-workbooks";

type Log = (line: string) => void;

const CHUNK = 200;

function chunks<T>(list: T[], size = CHUNK): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size));
  return out;
}

function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(`${iso}T12:00:00`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ---------- BOQ ----------

export async function importBoq(projectId: string, rows: AppBoqRow[], log: Log) {
  const del = await supabase
    .from("boq_items")
    .delete()
    .eq("project_id", projectId)
    .eq("source", IMPORT_SOURCE);
  if (del.error) throw new Error(`BOQ: could not clear the earlier import (${del.error.message})`);
  let n = 0;
  for (const part of chunks(rows)) {
    const ins = await supabase.from("boq_items").insert(
      part.map((r) => ({
        project_id: projectId,
        item_code: r.item_code,
        stage: r.stage,
        category: r.category,
        description: r.description,
        unit: r.unit,
        quantity: r.quantity,
        rate: r.rate,
        brand: r.brand,
        supplier: "",
        notes: r.notes,
        work_scope: r.work_scope,
        sort_order: r.sort_order,
        source: IMPORT_SOURCE,
        package: r.package,
        package_no: r.package_no,
        line_group: r.line_group,
        gst_pct: r.gst_pct,
      })),
    );
    if (ins.error) throw new Error(`BOQ: ${ins.error.message} (after ${n} rows)`);
    n += part.length;
  }
  log(`BOQ: ${n} lines imported into the BOQ Engine.`);
}

// ---------- programme ----------

export async function importProgramme(projectId: string, control: ControlData, log: Log) {
  const existing = await supabase
    .from("site_stages")
    .select("id,name,code")
    .eq("project_id", projectId);
  if (existing.error) throw new Error(`Programme: ${existing.error.message}`);
  const byCode = new Map<string, string>();
  for (const s of existing.data ?? []) {
    const code = s.code || /^([A-Z]{1,3}\d{1,3}) · /.exec(s.name ?? "")?.[1];
    if (code) byCode.set(code, s.id);
  }

  let added = 0;
  let updated = 0;
  const inserts = [];
  for (const s of control.stages) {
    const notes = [
      s.group + (s.floor ? ` · ${s.floor}` : ""),
      `${s.durationDays} working days`,
      s.preds.length ? `after ${s.preds.join(", ")}` : "",
    ]
      .filter(Boolean)
      .join(" · ");
    const values = {
      name: `${s.code} · ${s.name}`,
      sort: s.seq,
      planned_start: s.start,
      planned_end: s.finish,
      notes,
      code: s.code,
      stage_group: s.group,
      floor: s.floor,
      duration_days: s.durationDays,
      preds: s.preds,
      checks: s.checks as unknown as Json,
      hold_point: s.checks.some((c) => c.point === "H"),
      materials: s.materials as unknown as Json,
      steel: s.steel as unknown as Json,
      directions: s.directions as unknown as Json,
    };
    const id = byCode.get(s.code);
    if (id) {
      const up = await supabase.from("site_stages").update(values).eq("id", id);
      if (up.error) throw new Error(`Programme ${s.code}: ${up.error.message}`);
      updated++;
    } else {
      inserts.push({
        ...values,
        project_id: projectId,
        status: "not started",
        planned_pct: 0,
        actual_pct: 0,
      });
    }
  }
  for (const part of chunks(inserts)) {
    const ins = await supabase.from("site_stages").insert(part);
    if (ins.error) throw new Error(`Programme: ${ins.error.message}`);
    added += part.length;
  }
  log(`Programme: ${added} stages added, ${updated} updated (site progress kept).`);
}

export async function importProjectDates(projectId: string, control: ControlData, log: Log) {
  const patch: { start_date?: string; target_handover_date?: string; control_notes: Json } = {
    control_notes: control.notes as unknown as Json,
  };
  if (control.startDate) patch.start_date = control.startDate;
  if (control.completion) patch.target_handover_date = control.completion;
  const up = await supabase.from("site_projects").update(patch).eq("id", projectId);
  if (up.error) throw new Error(`Project dates: ${up.error.message}`);
  log(
    `Project dates: start ${fmtDate(control.startDate)}, handover ${fmtDate(control.completion)}.`,
  );
}

/**
 * The report's own figures on the project: budget (₹/sft × saleable area), the
 * saleable area, the contingency % and the estimate (BOQ incl. GST + contingency).
 */
export async function importProjectFigures(
  projectId: string,
  master: MasterBoq,
  rows: AppBoqRow[],
  log: Log,
) {
  const totals = boqTotals(rows, master.contingencyPct || 5);
  const patch: {
    contingency_pct: number;
    estimate_amount: number;
    target_budget?: number;
    saleable_sft?: number;
  } = {
    contingency_pct: master.contingencyPct || 5,
    estimate_amount: Math.round(totals.project.incl),
  };
  if (master.budget > 0) patch.target_budget = Math.round(master.budget);
  if (master.saleableSft > 0) patch.saleable_sft = master.saleableSft;
  const up = await supabase.from("site_projects").update(patch).eq("id", projectId);
  if (up.error) throw new Error(`Project figures: ${up.error.message}`);
  log(
    `Project figures: budget ₹${((patch.target_budget ?? 0) / 1e7).toFixed(2)} Cr on ${(patch.saleable_sft ?? 0).toLocaleString("en-IN")} sft saleable, estimate ₹${(patch.estimate_amount / 1e7).toFixed(2)} Cr incl. GST + ${patch.contingency_pct}% contingency.`,
  );
}

// ---------- materials ----------

export async function importMaterials(projectId: string, control: ControlData, log: Log) {
  const stocked = control.materials.filter((m) => m.stocked);
  const codes = materialCodes(stocked);
  const existing = await supabase
    .from("stock_items")
    .select("id,item_code")
    .eq("project_id", projectId);
  if (existing.error) throw new Error(`Materials: ${existing.error.message}`);
  const byCode = new Map((existing.data ?? []).map((r) => [r.item_code, r.id]));

  let added = 0;
  let updated = 0;
  const inserts = [];
  for (let i = 0; i < stocked.length; i++) {
    const m = stocked[i]!;
    const code = codes[i]!;
    const values = {
      item_code: code,
      description: m.material,
      unit: m.unit,
      category: m.workPackage,
      reorder_level: Math.ceil(m.reorderLevel),
      first_needed: m.firstNeeded,
      order_by: m.orderBy,
      notes: [
        `Project total ${m.total.toLocaleString("en-IN")} ${m.unit}`,
        `first needed ${fmtDate(m.firstNeeded)} (stage ${m.firstStage})`,
        `order by ${fmtDate(m.orderBy)}`,
        `lead ${m.leadDays} days`,
      ].join(" · "),
    };
    const id = byCode.get(code);
    if (id) {
      const up = await supabase.from("stock_items").update(values).eq("id", id);
      if (up.error) throw new Error(`Materials ${code}: ${up.error.message}`);
      updated++;
    } else {
      inserts.push({
        ...values,
        project_id: projectId,
        opening_qty: 0,
        rate: 0,
        store_location: "Site store",
      });
    }
  }
  for (const part of chunks(inserts)) {
    const ins = await supabase.from("stock_items").insert(part);
    if (ins.error) throw new Error(`Materials: ${ins.error.message}`);
    added += part.length;
  }
  log(`Materials: ${added} stock items added, ${updated} updated (stock movements kept).`);
}

// ---------- tenders ----------

export async function importTenders(
  projectId: string,
  packages: QuotePackage[],
  userId: string | undefined,
  log: Log,
) {
  // The department tenders (CE-D01 … CE-D25) replace the package tenders.
  const dept = await supabase
    .from("rfqs")
    .select("id", { count: "exact", head: true })
    .eq("project_id", projectId)
    .like("rfq_number", "CE-D%");
  if ((dept.count ?? 0) > 0) {
    log(
      "Tenders: skipped. The department tenders (CE-D01 … CE-D25) are loaded; dealers' quotes come in from their returned tender files.",
    );
    return;
  }
  const existing = await supabase
    .from("rfqs")
    .select("id,rfq_number,status")
    .eq("project_id", projectId)
    .like("rfq_number", "CE-PKG-%");
  if (existing.error) throw new Error(`Tenders: ${existing.error.message}`);
  const byNo = new Map((existing.data ?? []).map((r) => [r.rfq_number, r]));

  let added = 0;
  let refreshed = 0;
  let kept = 0;
  let quoted = 0;
  for (const p of packages) {
    const rfqNumber = `CE-PKG-${p.no}`;
    const budget = Math.round(p.items.reduce((s, i) => s + i.qty * i.benchmarkRate, 0));
    const spec = [
      `Ask: ${p.ask}`,
      `Enquiry by ${fmtDate(p.enquiryBy)}; needed on site from ${fmtDate(p.neededFrom)}.`,
      "Quote supply at site, Cyber Enclave, Madhapur. Rates excl. GST; state GST %, validity, lead time, payment terms.",
    ].join(" ");
    const values = {
      title: `Pkg ${p.no} · ${p.title}`,
      spec,
      // Quotes due two weeks after the enquiry goes out.
      deadline: p.enquiryBy ? addDays(p.enquiryBy, 14) : null,
      budget_estimate: budget,
    };
    const items = p.items.map((i, idx) => ({
      description: [
        `${i.code} · ${i.item}`,
        i.spec ? `— ${i.spec}` : "",
        i.make ? `(make: ${i.make})` : "",
        `[common ${i.commonQty.toLocaleString("en-IN")} / individual ${i.individualQty.toLocaleString("en-IN")}; needed from ${fmtDate(i.neededFrom)}]`,
      ]
        .filter(Boolean)
        .join(" "),
      qty: i.qty,
      unit: i.unit,
      benchmark_rate: i.benchmarkRate,
      item_code: i.code,
      gst_pct: i.gstPct,
      sort: idx,
    }));

    const found = byNo.get(rfqNumber);
    if (found?.status === "awarded") {
      kept++;
      continue;
    }
    let rfqId = found?.id;
    if (rfqId) {
      const up = await supabase.from("rfqs").update(values).eq("id", rfqId);
      if (up.error) throw new Error(`Tender ${rfqNumber}: ${up.error.message}`);
      // Quotes typed in the app stay; the line items stay with them.
      const typed = await supabase
        .from("rfq_bids")
        .select("id", { count: "exact", head: true })
        .eq("rfq_id", rfqId)
        .neq("source", "workbook");
      if ((typed.count ?? 0) > 0) {
        kept++;
        quoted += await importWorkbookBids(rfqId, p, userId);
        continue;
      }
      const delBids = await supabase
        .from("rfq_bids")
        .delete()
        .eq("rfq_id", rfqId)
        .eq("source", "workbook");
      if (delBids.error) throw new Error(`Tender ${rfqNumber}: ${delBids.error.message}`);
      const del = await supabase.from("rfq_items").delete().eq("rfq_id", rfqId);
      if (del.error) throw new Error(`Tender ${rfqNumber}: ${del.error.message}`);
      refreshed++;
    } else {
      const ins = await supabase
        .from("rfqs")
        .insert({
          ...values,
          project_id: projectId,
          rfq_number: rfqNumber,
          status: "open",
          created_by: userId ?? null,
          created_by_name: "PMC workbook import",
        })
        .select("id")
        .single();
      if (ins.error) throw new Error(`Tender ${rfqNumber}: ${ins.error.message}`);
      rfqId = ins.data.id;
      added++;
    }
    const insItems = await supabase
      .from("rfq_items")
      .insert(items.map((i) => ({ ...i, rfq_id: rfqId! })));
    if (insItems.error) throw new Error(`Tender ${rfqNumber} items: ${insItems.error.message}`);
    quoted += await importWorkbookBids(rfqId!, p, userId);
  }
  log(
    `Tenders: ${added} RFQs created, ${refreshed} refreshed` +
      (kept ? `, ${kept} kept with their quotes or award` : "") +
      `; ${quoted} vendor quote${quoted === 1 ? "" : "s"} from the workbook.`,
  );
}

/**
 * Vendor quotes typed into the workbook's three vendor columns become bids
 * (source "workbook"), matched to the tender's lines by item code. They replace
 * the previous workbook bids; quotes typed in the app are left alone.
 */
async function importWorkbookBids(rfqId: string, p: QuotePackage, userId: string | undefined) {
  const its = await supabase.from("rfq_items").select("id,item_code").eq("rfq_id", rfqId);
  if (its.error) throw new Error(`Tender items: ${its.error.message}`);
  const idOf = new Map((its.data ?? []).map((i) => [i.item_code, i.id]));
  const bids = p.vendors
    .map((vendor, k) => {
      const rates: Record<string, number> = {};
      for (const it of p.items) {
        const r = it.rates[k] ?? 0;
        const id = idOf.get(it.code);
        if (r > 0 && id) rates[id] = r;
      }
      return { vendor, rates };
    })
    .filter((b) => b.vendor && Object.keys(b.rates).length);
  const del = await supabase.from("rfq_bids").delete().eq("rfq_id", rfqId).eq("source", "workbook");
  if (del.error) throw new Error(`Tender quotes: ${del.error.message}`);
  if (!bids.length) return 0;
  const ins = await supabase.from("rfq_bids").insert(
    bids.map((b) => ({
      rfq_id: rfqId,
      vendor_name: b.vendor,
      rates: b.rates as unknown as Json,
      source: "workbook",
      notes: "From the quotation workbook",
      created_by: userId ?? null,
      created_by_name: "PMC workbook import",
    })),
  );
  if (ins.error) throw new Error(`Tender quotes: ${ins.error.message}`);
  await supabase.from("rfqs").update({ status: "evaluating" }).eq("id", rfqId).eq("status", "open");
  return bids.length;
}

// ---------- drawings ----------

export const DRAWINGS_BUCKET = "project-drawings";

export function drawingFileName(name: string) {
  return name.replace(/_\d+(\.pdf)$/i, "$1").replace(/[^\w.-]+/g, "_");
}

export async function importDrawings(projectId: string, files: File[], log: Log) {
  let n = 0;
  for (const f of files) {
    const path = `${projectId}/${drawingFileName(f.name)}`;
    const up = await supabase.storage
      .from(DRAWINGS_BUCKET)
      .upload(path, f, { upsert: true, contentType: "application/pdf" });
    if (up.error) throw new Error(`Drawing ${f.name}: ${up.error.message}`);
    n++;
    log(`Drawing uploaded: ${drawingFileName(f.name)}`);
  }
  log(`Drawings: ${n} PDF${n === 1 ? "" : "s"} in the drawing register.`);
}

/**
 * Quality registers from the control workbook: the checklist log (one ITP check per
 * stage, planned date) and the cube-test register (every pour). Results entered on
 * site are kept: only the planned columns are written on a re-import.
 */
export async function importQuality(projectId: string, control: ControlData, log: Log) {
  const checks = control.checklist.map((c) => ({
    project_id: projectId,
    stage_code: c.stage,
    floor: c.floor,
    itp_id: c.itp,
    check_name: c.check,
    point: c.point,
    planned_date: c.planned,
  }));
  for (const part of chunks(checks)) {
    const up = await supabase
      .from("quality_checks")
      .upsert(part, { onConflict: "project_id,stage_code,itp_id" });
    if (up.error) throw new Error(`Checklist: ${up.error.message}`);
  }
  const cubes = control.cubes.map((c) => ({
    project_id: projectId,
    stage_code: c.stage,
    pour: c.pour,
    grade: c.grade,
    volume_m3: c.volume,
    planned_pour_date: c.planned,
    samples: c.samples,
    cubes: c.cubes,
  }));
  for (const part of chunks(cubes)) {
    const up = await supabase
      .from("cube_tests")
      .upsert(part, { onConflict: "project_id,stage_code,pour" });
    if (up.error) throw new Error(`Cube register: ${up.error.message}`);
  }
  log(`Quality: ${checks.length} checklist lines and ${cubes.length} pours in the cube register.`);
}

/**
 * Flat types and flats from the split workbook. Types are replaced from the
 * workbook (costs and lines); flats are added if missing, and an existing
 * flat's owner, extras and notes are never overwritten.
 */
export async function importFlats(projectId: string, types: FlatType[], log: Log) {
  if (!types.length) return;
  const pr = await supabase
    .from("site_projects")
    .select("saleable_sft")
    .eq("id", projectId)
    .maybeSingle();
  const count = types.reduce((t, x) => t + x.flats.length, 0);
  const perFlat = count && pr.data?.saleable_sft ? Number(pr.data.saleable_sft) / count : 0;
  const up = await supabase.from("flat_types").upsert(
    types.map((t, i) => ({
      project_id: projectId,
      code: t.code,
      label: t.label,
      bhk: t.bhk,
      floors: t.floors,
      saleable_sft: Math.round(perFlat * 10) / 10,
      indiv_excl: t.indivExcl,
      indiv_incl: t.indivIncl,
      indiv_total: t.indivTotal,
      lines: t.lines as unknown as Json,
      sort: i,
    })),
    { onConflict: "project_id,code" },
  );
  if (up.error) throw new Error(`Flat types: ${up.error.message}`);
  const flats = types.flatMap((t) =>
    t.flats.map((no) => ({
      project_id: projectId,
      flat_no: no,
      floor: Math.floor(Number(no) / 100) || 0,
      type_code: t.code,
      saleable_sft: Math.round(perFlat * 10) / 10,
    })),
  );
  const ins = await supabase
    .from("flats")
    .upsert(flats, { onConflict: "project_id,flat_no", ignoreDuplicates: true });
  if (ins.error) throw new Error(`Flats: ${ins.error.message}`);
  log(
    `Flats: ${types.length} flat types (${types.map((t) => t.label).join(", ")}) and ${flats.length} flats; owners already set are kept.`,
  );
}
