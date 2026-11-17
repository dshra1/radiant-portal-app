/**
 * MRP rate library and vendor discounts.
 *
 * Each month the manufacturers' MRP price lists are uploaded (read by AI from the PDF/photo,
 * or imported from CSV). Your discount on MRP is kept per vendor, brand and/or category.
 * Net rate = MRP × (1 − discount %). Net rates are pushed into the BOQ as the material rate.
 *
 * Stored as JSON in the project's storage folder (site-media/<project>/RATES):
 *   mrp-YYYY-MM.json   one file per month
 *   discounts.json     the discount rules
 */
export type MrpLine = {
  id: string;
  item_code: string;
  brand: string;
  item: string;
  category: string;
  unit: string;
  mrp: number;
};
export type MrpMonth = { month: string; updatedAt: string; sources: string[]; lines: MrpLine[] };
export type DiscountRule = {
  id: string;
  vendor: string;
  brand: string; // blank = any brand
  category: string; // blank = any category
  pct: number;
};

export const RATES_DIR = (pid: string) => `${pid}/RATES`;
export const monthFile = (m: string) => `mrp-${m}.json`;
export const thisMonth = () => new Date().toISOString().slice(0, 7);
export const uid = () => Math.random().toString(36).slice(2, 10);
export const emptyLine = (): MrpLine => ({
  id: uid(),
  item_code: "",
  brand: "",
  item: "",
  category: "",
  unit: "",
  mrp: 0,
});
export const emptyRule = (): DiscountRule => ({
  id: uid(),
  vendor: "",
  brand: "",
  category: "",
  pct: 0,
});

export function monthLabel(m: string) {
  const [y, mo] = m.split("-").map(Number);
  if (!y || !mo) return m;
  return new Date(y, mo - 1, 1).toLocaleString("en-IN", { month: "short", year: "numeric" });
}

const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
const same = (a: string, b: string) => norm(a) === norm(b);

/** The best discount for a line: the highest % among the rules whose brand and category match (blank = any). */
export function discountFor(line: Pick<MrpLine, "brand" | "category">, rules: DiscountRule[]) {
  let best: DiscountRule | null = null;
  for (const r of rules) {
    if (!(r.pct > 0)) continue;
    if (r.brand && !same(r.brand, line.brand)) continue;
    if (r.category && !same(r.category, line.category)) continue;
    if (!best || r.pct > best.pct) best = r;
  }
  return best;
}
export const netRate = (mrp: number, pct: number) => Math.round(mrp * (1 - pct / 100) * 100) / 100;

const UNIT_ALIASES: Record<string, string> = {
  no: "nos",
  nos: "nos",
  "no.": "nos",
  pcs: "nos",
  pc: "nos",
  each: "nos",
  ea: "nos",
  sqft: "sqft",
  sft: "sqft",
  "sq ft": "sqft",
  sqm: "sqm",
  "sq m": "sqm",
  m2: "sqm",
  rmt: "rmt",
  rm: "rmt",
  m: "rmt",
  mtr: "rmt",
  metre: "rmt",
  meter: "rmt",
  kg: "kg",
  kgs: "kg",
  bag: "bag",
  bags: "bag",
  ltr: "ltr",
  l: "ltr",
  litre: "ltr",
  liter: "ltr",
  coil: "coil",
  coils: "coil",
  box: "box",
  set: "set",
  sets: "set",
};
export const normUnit = (u: string) => UNIT_ALIASES[norm(u)] ?? norm(u);

const STOP = new Set(["with", "and", "for", "the", "of", "mm", "in", "to", "a"]);
const tokens = (s: string) =>
  new Set(
    norm(s)
      .split(" ")
      .filter((w) => w.length > 1 && !STOP.has(w)),
  );

export type BoqRow = {
  id: string;
  item_code: string;
  description: string;
  brand: string;
  category: string;
  unit: string;
  quantity: number;
  rate: number;
  stage: string;
};
export type Match = {
  boq: BoqRow;
  line: MrpLine;
  rule: DiscountRule | null;
  net: number;
  how: "code" | "brand + name";
};

/**
 * Match MRP lines to BOQ lines: same item code, or same brand with most of the MRP item's words
 * in the BOQ description. Units must agree.
 */
export function matchBoq(boq: BoqRow[], lines: MrpLine[], rules: DiscountRule[]): Match[] {
  const out: Match[] = [];
  for (const b of boq) {
    let hit: MrpLine | null = null;
    let how: Match["how"] = "code";
    if (b.item_code) hit = lines.find((l) => l.item_code && same(l.item_code, b.item_code)) ?? null;
    if (!hit && b.brand) {
      const bt = tokens(`${b.description} ${b.category}`);
      let bestScore = 0;
      for (const l of lines) {
        if (!l.brand || !same(l.brand, b.brand) || !(l.mrp > 0)) continue;
        const lt = tokens(l.item);
        if (!lt.size) continue;
        let common = 0;
        lt.forEach((w) => bt.has(w) && common++);
        const score = common / lt.size;
        if (score >= 0.6 && score > bestScore) {
          bestScore = score;
          hit = l;
        }
      }
      how = "brand + name";
    }
    if (!hit || !(hit.mrp > 0)) continue;
    if (hit.unit && b.unit && normUnit(hit.unit) !== normUnit(b.unit)) continue;
    const rule = discountFor(
      { brand: hit.brand || b.brand, category: hit.category || b.category },
      rules,
    );
    out.push({ boq: b, line: hit, rule, net: netRate(hit.mrp, rule?.pct ?? 0), how });
  }
  return out;
}

/** CSV: brand, item, category, unit, mrp, item_code (header row required; order free). */
export function parseCsv(text: string): MrpLine[] {
  const rows = text
    .split(/\r?\n/)
    .filter((r) => r.trim())
    .map((r) => {
      const cells: string[] = [];
      let cur = "";
      let q = false;
      for (const ch of r) {
        if (ch === '"') q = !q;
        else if (ch === "," && !q) {
          cells.push(cur);
          cur = "";
        } else cur += ch;
      }
      cells.push(cur);
      return cells.map((c) => c.trim());
    });
  if (rows.length < 2) return [];
  const head = (rows[0] ?? []).map((h) => norm(h).replace(/ /g, "_"));
  const col = (k: string[]) => head.findIndex((h) => k.includes(h));
  const ix = {
    brand: col(["brand", "make"]),
    item: col(["item", "description", "product", "name"]),
    category: col(["category", "trade"]),
    unit: col(["unit", "uom"]),
    mrp: col(["mrp", "price", "rate", "list_price"]),
    code: col(["item_code", "code", "sku", "cat_no", "catalogue_no"]),
  };
  if (ix.item < 0 || ix.mrp < 0)
    throw new Error("The CSV needs at least an item (or description) column and an MRP column");
  return rows
    .slice(1)
    .map((r) => ({
      id: uid(),
      brand: ix.brand >= 0 ? (r[ix.brand] ?? "") : "",
      item: r[ix.item] ?? "",
      category: ix.category >= 0 ? (r[ix.category] ?? "") : "",
      unit: ix.unit >= 0 ? (r[ix.unit] ?? "") : "",
      mrp: Number(String(r[ix.mrp] ?? "").replace(/[^0-9.]/g, "")) || 0,
      item_code: ix.code >= 0 ? (r[ix.code] ?? "") : "",
    }))
    .filter((l) => l.item && l.mrp > 0);
}

export const CSV_TEMPLATE =
  "brand,item,category,unit,mrp,item_code\n" +
  "Finolex,FR PVC insulated copper wire 1.5 sq mm (90 m coil),Electrical,coil,0,\n" +
  "Ashirvad,CPVC pipe 25 mm SDR 11 (3 m),Plumbing,nos,0,\n";
