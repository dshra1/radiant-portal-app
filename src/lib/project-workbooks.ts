/**
 * Readers for the Cyber Enclave PMC workbooks (master BOQ, common vs individual
 * split, BOQ for quotation, construction control). They turn each workbook into
 * plain rows for the app's tables: boq_items, site_stages, stock_items, rfqs and
 * rfq_items. Pure functions, no database access, so the import page can show a
 * preview before anything is written.
 *
 * The readers find their columns by header text, not by position, so a later
 * revision of a workbook with an extra column still reads correctly.
 */
import * as XLSX from "xlsx";

type Cell = string | number | boolean | Date | null;
type Row = Cell[];

export type WorkbookKind =
  "master" | "value-engineered" | "split" | "quotation" | "control" | "unknown";

export type BoqLine = {
  pkg: string;
  group: string;
  code: string;
  item: string;
  spec: string;
  make: string;
  unit: string;
  qty: number;
  rate: number;
  gstPct: number;
  basis: string;
};

export type SplitLine = {
  pkg: string;
  code: string;
  item: string;
  spec: string;
  make: string;
  unit: string;
  qty: number;
  rate: number;
  scope: "common" | "individual";
  note: string;
};

export type ProgrammeStage = {
  seq: number;
  code: string;
  name: string;
  group: string;
  floor: string;
  durationDays: number;
  start: string | null;
  finish: string | null;
  preds: string[];
};

export type MaterialLine = {
  material: string;
  unit: string;
  workPackage: string;
  total: number;
  firstStage: string;
  firstNeeded: string | null;
  leadDays: number;
  orderBy: string | null;
  reorderLevel: number;
  stocked: boolean;
};

export type QuotePackage = {
  no: string;
  title: string;
  ask: string;
  neededFrom: string | null;
  enquiryBy: string | null;
  items: {
    code: string;
    item: string;
    spec: string;
    make: string;
    unit: string;
    qty: number;
    commonQty: number;
    individualQty: number;
    neededFrom: string | null;
    benchmarkRate: number;
  }[];
};

export type ControlData = {
  startDate: string | null;
  completion: string | null;
  stages: ProgrammeStage[];
  materials: MaterialLine[];
};

// ---------- small helpers ----------

function rows(ws: XLSX.WorkSheet | undefined): Row[] {
  if (!ws) return [];
  return XLSX.utils.sheet_to_json<Row>(ws, { header: 1, raw: true, defval: null, blankrows: true });
}

function str(v: Cell | undefined): string {
  if (v === null || v === undefined) return "";
  if (v instanceof Date) return isoDate(v) ?? "";
  return String(v).trim();
}

function num(v: Cell | undefined): number {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  if (typeof v === "string") {
    const n = Number(v.replace(/[^0-9.-]/g, ""));
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function isoDate(v: Cell | undefined): string | null {
  if (v instanceof Date && !Number.isNaN(v.getTime())) {
    // SheetJS builds dates in local time and can land a few seconds before
    // midnight; shift by half a day before reading the calendar date.
    const t = new Date(v.getTime() + 12 * 3600 * 1000);
    const y = t.getFullYear();
    const m = String(t.getMonth() + 1).padStart(2, "0");
    const d = String(t.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  if (typeof v === "number" && v > 30000 && v < 80000) {
    const p = XLSX.SSF.parse_date_code(v);
    if (p) return `${p.y}-${String(p.m).padStart(2, "0")}-${String(p.d).padStart(2, "0")}`;
  }
  return null;
}

/** Index of the first row whose cells include every label (case-insensitive). */
function findHeader(data: Row[], labels: string[], from = 0): number {
  const want = labels.map((l) => l.toLowerCase());
  for (let i = from; i < Math.min(data.length, from + 40); i++) {
    const cells = (data[i] ?? []).map((c) => str(c).toLowerCase());
    if (want.every((w) => cells.some((c) => c.startsWith(w)))) return i;
  }
  return -1;
}

/** Column lookup by header text (startsWith, case-insensitive). */
function columns(header: Row) {
  const cells = header.map((c) => str(c).toLowerCase());
  return (label: string) => cells.findIndex((c) => c.startsWith(label.toLowerCase()));
}

function at(r: Row, i: number): Cell {
  return i >= 0 ? (r[i] ?? null) : null;
}

// ST01, ST02a, MAA10, EL02-CP, PPB-L, DR-GD, EL-FR
const CODE_RE = /^[A-Z]{1,4}[0-9]{0,3}[a-z]?(-[A-Z0-9]{1,4})?$/;

// ---------- workbook detection ----------

export function readWorkbook(buf: ArrayBuffer): XLSX.WorkBook {
  return XLSX.read(buf, { type: "array", cellDates: true });
}

export function detectKind(wb: XLSX.WorkBook, fileName: string): WorkbookKind {
  const names = new Set(wb.SheetNames);
  if (names.has("Common BOQ") && names.has("Individual BOQ")) return "split";
  if (names.has("Programme") && names.has("Material plan")) return "control";
  if (wb.SheetNames.some((n) => /^PMC reference/i.test(n))) return "quotation";
  if (names.has("Summary") && names.has("Structure") && names.has("Specifications")) {
    const title = str(rows(wb.Sheets["Summary"])[0]?.[0]);
    if (/value/i.test(fileName) || /value.engineer/i.test(title)) return "value-engineered";
    return "master";
  }
  return "unknown";
}

// ---------- master BOQ ----------

const NON_PACKAGE_SHEETS = new Set(["Summary", "Specifications", "Inputs"]);

export function parseMasterBoq(wb: XLSX.WorkBook): { lines: BoqLine[]; contingency: number } {
  const lines: BoqLine[] = [];
  for (const sheet of wb.SheetNames) {
    if (NON_PACKAGE_SHEETS.has(sheet)) continue;
    const data = rows(wb.Sheets[sheet]);
    const h = findHeader(data, ["code", "item", "unit", "qty", "rate"]);
    if (h < 0) continue;
    const col = columns(data[h] ?? []);
    const c = {
      code: col("code"),
      item: col("item"),
      spec: col("specification"),
      make: col("make"),
      unit: col("unit"),
      qty: col("qty"),
      rate: col("rate"),
      gst: col("gst %"),
      basis: col("basis"),
    };
    let group = "";
    for (let i = h + 1; i < data.length; i++) {
      const r = data[i] ?? [];
      const first = str(at(r, 0));
      // A second header row or the element-quantity check table ends the package.
      if (first === "Code" || /^element quantities/i.test(first)) break;
      const code = str(at(r, c.code));
      const item = str(at(r, c.item));
      if (first && !item && r.slice(1).every((v) => v === null || v === "")) {
        group = first;
        continue;
      }
      if (code === "Code" || !CODE_RE.test(code) || !item) continue;
      lines.push({
        pkg: sheet,
        group,
        code,
        item,
        spec: str(at(r, c.spec)),
        make: str(at(r, c.make)),
        unit: str(at(r, c.unit)),
        qty: num(at(r, c.qty)),
        rate: num(at(r, c.rate)),
        gstPct: c.gst >= 0 ? num(at(r, c.gst)) : 0.18,
        basis: str(at(r, c.basis)),
      });
    }
  }

  // Contingency (excl. GST) from the summary sheet, carried as one line.
  let contingency = 0;
  for (const r of rows(wb.Sheets["Summary"])) {
    if (/^contingency/i.test(str(at(r, 1)))) {
      contingency = num(at(r, 2));
      break;
    }
  }
  return { lines, contingency };
}

// ---------- common vs individual split ----------

export function parseSplit(wb: XLSX.WorkBook): SplitLine[] {
  const out: SplitLine[] = [];
  const read = (sheet: string, scope: "common" | "individual") => {
    const data = rows(wb.Sheets[sheet]);
    const h = findHeader(data, ["package", "code", "item", "unit"]);
    if (h < 0) return;
    const col = columns(data[h] ?? []);
    const c = {
      pkg: col("package"),
      code: col("code"),
      item: col("item"),
      spec: col("specification"),
      make: col("make"),
      unit: col("unit"),
      qty: scope === "common" ? col("common qty") : col("individual qty"),
      rate: col("rate"),
      note: col("split note"),
    };
    for (let i = h + 1; i < data.length; i++) {
      const r = data[i] ?? [];
      const code = str(at(r, c.code));
      if (!code || !str(at(r, c.item))) continue;
      out.push({
        pkg: str(at(r, c.pkg)),
        code,
        item: str(at(r, c.item)),
        spec: str(at(r, c.spec)),
        make: str(at(r, c.make)),
        unit: str(at(r, c.unit)),
        qty: num(at(r, c.qty)),
        rate: num(at(r, c.rate)),
        scope,
        note: str(at(r, c.note)),
      });
    }
  };
  read("Common BOQ", "common");
  read("Individual BOQ", "individual");
  return out;
}

// ---------- BOQ rows for the app ----------

/** The app's BOQ Engine sections (BOQ_TRADES + Labour Contracts). */
function sectionFor(line: { pkg: string; group: string; item: string; code: string }): string {
  const g = line.group.toLowerCase();
  const t = line.item.toLowerCase();
  switch (line.pkg) {
    case "Structure":
      if (/pcc/.test(t)) return "Plain Cement Concrete (PCC)";
      if (g.startsWith("a.")) return "Earthwork";
      if (g.startsWith("b.")) return "RCC Works";
      if (g.startsWith("c.")) return "Reinforcement (Steel)";
      if (g.startsWith("d.")) return "Shuttering / Formwork";
      return "RCC Works";
    case "Masonry AAC":
      return "Masonry";
    case "Plaster paint WP":
      if (g.startsWith("b.")) return "Painting";
      if (g.startsWith("c.")) return "Waterproofing";
      return "Plastering";
    case "Civil labour contract":
      return "Labour Contracts";
    case "Doors and windows":
      return /window|ventilator|louvre|slider|sliding|glass|w[0-9]|kw|sd[0-9]/.test(t)
        ? "Windows & Glazing"
        : "Doors";
    case "Tiles":
      return /wall|dado/.test(t) ? "Wall Tiling" : "Flooring";
    case "Granite":
    case "Marble":
      return "Granite Works";
    case "Sanitary ware":
      return "Sanitaryware";
    case "CP fittings":
      return "CP Fittings";
    case "Plumbing internal":
    case "Plumbing external":
    case "Drainage":
    case "Inlets and valves":
    case "Plumbing labour":
      return "Plumbing";
    case "Electrical":
      return "Electrical";
    case "Ceiling and AC":
      return "False Ceiling";
    case "Lift":
      return "Lift Works";
    case "Terrace":
      return "Waterproofing";
    case "Site works":
    case "External services":
      return "External Development";
    case "Common electrical":
    case "Security":
      return "Services (Transformer / DG / STP)";
    case "Fire safety":
      return "Fire Fighting";
    case "Approvals":
    case "Consultants":
    case "Site establishment":
      return "Preliminaries";
    default:
      // Railings and MS, Common areas, Facade, Provisional
      return "Miscellaneous";
  }
}

export const IMPORT_SOURCE = "pmc-workbook";

export type AppBoqRow = {
  item_code: string;
  stage: string;
  category: string;
  description: string;
  unit: string;
  quantity: number;
  rate: number;
  brand: string;
  notes: string;
  work_scope: "common" | "individual";
  sort_order: number;
};

function round(n: number, dp = 2) {
  const f = 10 ** dp;
  return Math.round(n * f) / f;
}

/**
 * Master BOQ lines, split into common and individual rows when the split
 * workbook is given.
 *
 * - A master line takes the split's rows (same package and code, plus any
 *   split-only children such as EL02-CP or LC01a/LC01b) only when they add up
 *   to the master amount (within 1%). The split was made before some later
 *   changes (the facade, D-128), so a line that no longer matches is kept
 *   whole as common and counted in `stale`.
 * - Lines the split does not cover stay common.
 */
export function buildBoqRows(
  master: { lines: BoqLine[]; contingency: number },
  split: SplitLine[] | null,
): { rows: AppBoqRow[]; stale: string[]; splitUsed: number } {
  const norm = (t: string) => t.toLowerCase().replace(/\s+/g, " ").trim();
  const masterCodes = new Map<string, BoqLine[]>();
  for (const l of master.lines) {
    const k = `${l.pkg}|${l.code}`;
    masterCodes.set(k, [...(masterCodes.get(k) ?? []), l]);
  }
  const parentOf = (code: string) => code.replace(/-[A-Z0-9]+$/, "").replace(/[a-z]$/, "");

  // Split rows that match a master code, and split-only children by parent.
  const direct = new Map<string, SplitLine[]>();
  const children = new Map<string, SplitLine[]>();
  const orphans: SplitLine[] = [];
  for (const s of split ?? []) {
    const k = `${s.pkg}|${s.code}`;
    if (masterCodes.has(k)) direct.set(k, [...(direct.get(k) ?? []), s]);
    else {
      const pk = `${s.pkg}|${parentOf(s.code)}`;
      if (masterCodes.has(pk)) children.set(pk, [...(children.get(pk) ?? []), s]);
      else orphans.push(s);
    }
  }

  const out: AppBoqRow[] = [];
  const stale: string[] = [];
  let splitUsed = 0;
  let sort = 0;
  const push = (
    l: BoqLine,
    scope: "common" | "individual",
    qty: number,
    rate: number,
    extraNote = "",
  ) => {
    if (qty === 0 || rate === 0) return;
    const spec = l.spec ? ` — ${l.spec}` : "";
    out.push({
      item_code: l.code,
      stage: sectionFor(l),
      category: l.group ? `${l.pkg} · ${l.group.replace(/\s*\(.*$/, "")}` : l.pkg,
      description: `${l.item}${spec}`,
      unit: l.unit,
      quantity: round(qty, 3),
      rate: round(rate, 2),
      brand: l.make,
      notes: [l.basis, extraNote].filter(Boolean).join(" · "),
      work_scope: scope,
      sort_order: ++sort,
    });
  };
  const childLine = (parent: BoqLine, p: SplitLine): BoqLine => ({
    ...parent,
    code: p.code,
    item: p.item,
    spec: p.spec,
    make: p.make || parent.make,
    unit: p.unit || parent.unit,
  });

  const usedChildren = new Set<string>();
  for (const l of master.lines) {
    const k = `${l.pkg}|${l.code}`;
    const sameCode = masterCodes.get(k) ?? [];
    // Duplicate codes inside one package are matched on the item text.
    let parts = direct.get(k) ?? [];
    if (sameCode.length > 1) parts = parts.filter((p) => norm(p.item) === norm(l.item));
    const kids = usedChildren.has(k) ? [] : (children.get(k) ?? []);
    if (!split || (parts.length === 0 && kids.length === 0)) {
      push(l, "common", l.qty, l.rate);
      continue;
    }
    const masterAmt = l.qty * l.rate;
    const splitAmt = [...parts, ...kids].reduce((s, p) => s + p.qty * p.rate, 0);
    if (Math.abs(splitAmt - masterAmt) > Math.max(500, Math.abs(masterAmt) * 0.01)) {
      stale.push(`${l.pkg} ${l.code}`);
      push(
        l,
        "common",
        l.qty,
        l.rate,
        "Split not applied: the split workbook is older than this line",
      );
      continue;
    }
    usedChildren.add(k);
    splitUsed++;
    for (const p of parts) push(l, p.scope, p.qty, p.rate, p.note ? `Split: ${p.note}` : "");
    for (const p of kids)
      push(childLine(l, p), p.scope, p.qty, p.rate, p.note ? `Split: ${p.note}` : "");
  }
  for (const p of orphans) {
    stale.push(`${p.pkg} ${p.code} (only in the split, not imported)`);
  }

  if (master.contingency > 0) {
    out.push({
      item_code: "CONT",
      stage: "Miscellaneous",
      category: "Contingency",
      description: "Contingency on the master BOQ (excl. GST)",
      unit: "LS",
      quantity: 1,
      rate: round(master.contingency, 2),
      brand: "",
      notes: "Master BOQ summary",
      work_scope: "common",
      sort_order: ++sort,
    });
  }
  return { rows: out, stale, splitUsed };
}

// ---------- construction control workbook ----------

export function parseControl(wb: XLSX.WorkBook): ControlData {
  // Inputs: construction start
  let startDate: string | null = null;
  for (const r of rows(wb.Sheets["Inputs"])) {
    if (/^construction start/i.test(str(at(r, 0)))) {
      startDate = isoDate(at(r, 1));
      break;
    }
  }

  // Programme
  const prog = rows(wb.Sheets["Programme"]);
  const h = findHeader(prog, ["seq", "code", "stage", "group"]);
  const stages: ProgrammeStage[] = [];
  let completion: string | null = null;
  if (h >= 0) {
    const col = columns(prog[h] ?? []);
    const c = {
      seq: col("seq"),
      code: col("code"),
      stage: col("stage"),
      group: col("group"),
      floor: col("floor"),
      dur: col("duration"),
      p1: col("pred 1"),
      p2: col("pred 2"),
      p3: col("pred 3"),
      start: col("start"),
      finish: col("finish"),
    };
    for (let i = h + 1; i < prog.length; i++) {
      const r = prog[i] ?? [];
      const code = str(at(r, c.code));
      if (/^completion/i.test(str(at(r, c.stage)))) completion = isoDate(at(r, c.start));
      if (!code || !num(at(r, c.seq))) continue;
      stages.push({
        seq: num(at(r, c.seq)),
        code,
        name: str(at(r, c.stage)),
        group: str(at(r, c.group)),
        floor: str(at(r, c.floor)),
        durationDays: num(at(r, c.dur)),
        start: isoDate(at(r, c.start)),
        finish: isoDate(at(r, c.finish)),
        preds: [at(r, c.p1), at(r, c.p2), at(r, c.p3)].map(str).filter(Boolean),
      });
    }
  }
  if (!completion)
    completion = stages.reduce<string | null>(
      (m, s) => (s.finish && (!m || s.finish > m) ? s.finish : m),
      null,
    );

  // Material plan
  const mat = rows(wb.Sheets["Material plan"]);
  const mh = findHeader(mat, ["material", "unit", "work package"]);
  const materials: MaterialLine[] = [];
  if (mh >= 0) {
    const col = columns(mat[mh] ?? []);
    const c = {
      material: col("material"),
      unit: col("unit"),
      pkg: col("work package"),
      total: col("total"),
      firstStage: col("first used"),
      firstNeeded: col("first needed"),
      lead: col("lead time"),
      orderBy: col("order by"),
      reorder: col("reorder level"),
      stocked: col("stocked"),
    };
    for (let i = mh + 1; i < mat.length; i++) {
      const r = mat[i] ?? [];
      const material = str(at(r, c.material));
      if (!material) continue;
      materials.push({
        material,
        unit: str(at(r, c.unit)),
        workPackage: str(at(r, c.pkg)),
        total: num(at(r, c.total)),
        firstStage: str(at(r, c.firstStage)),
        firstNeeded: isoDate(at(r, c.firstNeeded)),
        leadDays: num(at(r, c.lead)),
        orderBy: isoDate(at(r, c.orderBy)),
        reorderLevel: num(at(r, c.reorder)),
        stocked: /^y/i.test(str(at(r, c.stocked))),
      });
    }
  }
  return { startDate, completion, stages, materials };
}

// ---------- BOQ for quotation ----------

export function parseQuotation(wb: XLSX.WorkBook): QuotePackage[] {
  // Benchmark (PMC) rates by package + code from the internal reference sheet.
  const refName = wb.SheetNames.find((n) => /^PMC reference/i.test(n));
  const ref = rows(refName ? wb.Sheets[refName] : undefined);
  const rh = findHeader(ref, ["package", "code", "item"]);
  const bench = new Map<string, number>();
  if (rh >= 0) {
    const col = columns(ref[rh] ?? []);
    const cp = col("package"),
      cc = col("code"),
      cr = col("pmc rate");
    for (let i = rh + 1; i < ref.length; i++) {
      const r = ref[i] ?? [];
      if (str(at(r, cc))) bench.set(`${str(at(r, cp))}|${str(at(r, cc))}`, num(at(r, cr)));
    }
  }

  // Package list from the summary.
  const sum = rows(wb.Sheets["Summary"]);
  const sh = findHeader(sum, ["pkg", "package", "ask"]);
  const info = new Map<
    string,
    { title: string; ask: string; needed: string | null; enquiry: string | null }
  >();
  if (sh >= 0) {
    const col = columns(sum[sh] ?? []);
    const c = {
      no: col("pkg"),
      title: col("package"),
      ask: col("ask"),
      needed: col("needed"),
      enquiry: col("enquiry"),
    };
    for (let i = sh + 1; i < sum.length; i++) {
      const r = sum[i] ?? [];
      const no = str(at(r, c.no));
      if (!/^\d{2}$/.test(no)) continue;
      info.set(no, {
        title: str(at(r, c.title)),
        ask: str(at(r, c.ask)),
        needed: isoDate(at(r, c.needed)),
        enquiry: isoDate(at(r, c.enquiry)),
      });
    }
  }

  const out: QuotePackage[] = [];
  for (const sheet of wb.SheetNames) {
    const m = /^(\d{2})\s/.exec(sheet);
    if (!m) continue;
    const no = m[1] ?? "";
    const data = rows(wb.Sheets[sheet]);
    const h = findHeader(data, ["s.no", "code", "item", "specification"]);
    if (h < 0) continue;
    const col = columns(data[h] ?? []);
    const c = {
      sno: col("s.no"),
      code: col("code"),
      item: col("item"),
      spec: col("specification"),
      make: col("suggested make"),
      unit: col("unit"),
      qty: col("quantity"),
      common: col("common qty"),
      indiv: col("individual"),
      needed: col("needed on site"),
    };
    const i0 = info.get(no);
    const pkg: QuotePackage = {
      no,
      title: i0?.title ?? str(data[0]?.[0]).replace(/^PACKAGE \d+ · /i, ""),
      ask: i0?.ask ?? str(data[1]?.[0]).replace(/^Ask:\s*/i, ""),
      neededFrom: i0?.needed ?? null,
      enquiryBy: i0?.enquiry ?? null,
      items: [],
    };
    for (let i = h + 1; i < data.length; i++) {
      const r = data[i] ?? [];
      if (!num(at(r, c.sno))) continue;
      const code = str(at(r, c.code));
      pkg.items.push({
        code,
        item: str(at(r, c.item)),
        spec: str(at(r, c.spec)),
        make: str(at(r, c.make)),
        unit: str(at(r, c.unit)),
        qty: num(at(r, c.qty)),
        commonQty: num(at(r, c.common)),
        individualQty: num(at(r, c.indiv)),
        neededFrom: isoDate(at(r, c.needed)),
        benchmarkRate: bench.get(`${no}|${code}`) ?? 0,
      });
    }
    if (pkg.items.length) out.push(pkg);
  }
  return out;
}

// ---------- totals for the preview ----------

export function boqTotal(list: { quantity: number; rate: number }[]) {
  return list.reduce((s, r) => s + r.quantity * r.rate, 0);
}

/**
 * Stable codes for the stocked materials (stock_items.item_code), one per
 * material + unit. A clash after shortening gets -2, -3 in workbook order.
 */
export function materialCodes(list: { material: string; unit: string }[]): string[] {
  const seen = new Map<string, number>();
  return list.map(({ material, unit }) => {
    const slug = `${material} ${unit}`
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 44);
    const n = (seen.get(slug) ?? 0) + 1;
    seen.set(slug, n);
    return n === 1 ? `CE-${slug}` : `CE-${slug}-${n}`;
  });
}
