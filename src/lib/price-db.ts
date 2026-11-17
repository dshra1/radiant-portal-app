/**
 * Price Database: brands' MRP price lists, kept company-wide (shared by every project).
 *
 * Brands publish MRPs as numbered price lists with an effective date (wires, cables), catalogue
 * PDFs with an MRP per product code (sanitaryware, lighting, switches), MRP per pack on product
 * pages (paints), or only through dealers (most pipes). Some lists include GST, some don't.
 *
 * Each brand has sources: a public link the app fetches and reads, or a dealer list uploaded.
 * Every list read is kept as a version; the newest per brand is used. Your discount on MRP
 * (per vendor, brand, category) applies on top; net rates go into the BOQ ex-GST.
 *
 * Storage (site-media, shared): _library/PRICES/brands.json, discounts.json,
 * lists/<brandId>/<timestamp>.json
 */
export const LIB = "_library/PRICES";
export const BUCKET = "site-media";
export const DUE_DAYS = 30;

export type GstBasis = "incl" | "excl" | "unknown";
export type Source = { id: string; label: string; url: string; gst: GstBasis };
export type Brand = {
  id: string;
  brand: string;
  category: string;
  how: string; // how this brand publishes MRPs
  sources: Source[];
};
export type PriceLine = {
  id: string;
  item_code: string;
  item: string;
  category: string;
  unit: string;
  mrp: number;
  gst_pct: number;
};
export type PriceList = {
  id: string;
  brandId: string;
  brand: string;
  listNo: string;
  effective: string; // YYYY-MM-DD or ""
  gst: GstBasis;
  source: string; // url or file name
  fetchedAt: string;
  lines: PriceLine[];
};
export type DiscountRule = {
  id: string;
  vendor: string;
  brand: string;
  category: string;
  pct: number;
};

export const uid = () => Math.random().toString(36).slice(2, 10);
export const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || uid();
export const emptyRule = (): DiscountRule => ({
  id: uid(),
  vendor: "",
  brand: "",
  category: "",
  pct: 0,
});

/**
 * Starter register. Links are the brands' own public pages/catalogues where MRPs are printed;
 * brands that only circulate lists through dealers have no link: upload the dealer's copy.
 */
export const STARTER_BRANDS: Brand[] = [
  {
    id: "asian-paints",
    brand: "Asian Paints",
    category: "Painting",
    how: "MRP per pack size on each product page, inclusive of taxes",
    sources: [
      {
        id: uid(),
        label: "Apex Ultima (exterior)",
        url: "https://www.asianpaints.com/product/apex.apex-ultima.html.html",
        gst: "incl",
      },
    ],
  },
  {
    id: "jaquar",
    brand: "Jaquar",
    category: "CP & Sanitaryware",
    how: "Catalogue PDFs with an MRP against every product code",
    sources: [
      {
        id: uid(),
        label: "Commercial catalogue (lighting)",
        url: "https://www.jaquar.com/pdf/CommercialCatalogue2.pdf",
        gst: "incl",
      },
    ],
  },
  {
    id: "finolex",
    brand: "Finolex",
    category: "Electrical",
    how: "Numbered price lists with an effective date; switches catalogue with MRP per code",
    sources: [
      {
        id: uid(),
        label: "Switches catalogue",
        url: "https://www.finolex.com//UploadedDocs/Switches Catalogue.pdf",
        gst: "incl",
      },
    ],
  },
  {
    id: "polycab",
    brand: "Polycab",
    category: "Electrical",
    how: "Numbered LDC price lists (several a year, effective date on each), usually via dealers",
    sources: [],
  },
  {
    id: "ashirvad",
    brand: "Ashirvad",
    category: "Plumbing",
    how: "Price lists circulated through dealers only: upload your dealer's latest copy",
    sources: [],
  },
  {
    id: "kajaria",
    brand: "Kajaria",
    category: "Flooring",
    how: "MRP per box; dealer price list for your region",
    sources: [],
  },
];

const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
const same = (a: string, b: string) => norm(a) === norm(b);

export function daysSince(iso: string) {
  const t = Date.parse(iso);
  return Number.isFinite(t) ? Math.floor((Date.now() - t) / 86400000) : Infinity;
}

/** Best discount for a brand/category: highest % among matching rules (blank = any). */
export function discountFor(brand: string, category: string, rules: DiscountRule[]) {
  let best: DiscountRule | null = null;
  for (const r of rules) {
    if (!(r.pct > 0)) continue;
    if (r.brand && !same(r.brand, brand)) continue;
    if (r.category && !same(r.category, category)) continue;
    if (!best || r.pct > best.pct) best = r;
  }
  return best;
}

/** Net rate ex-GST: take GST out of MRPs that include it, then apply the discount. */
export function netExGst(mrp: number, gst: GstBasis, gstPct: number, discPct: number) {
  const base = gst === "incl" ? mrp / (1 + (gstPct || 18) / 100) : mrp;
  return Math.round(base * (1 - discPct / 100) * 100) / 100;
}

const UNIT: Record<string, string> = {
  no: "nos",
  nos: "nos",
  pcs: "nos",
  pc: "nos",
  each: "nos",
  ea: "nos",
  piece: "nos",
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
  boxes: "box",
  set: "set",
  sets: "set",
};
export const normUnit = (u: string) => UNIT[norm(u)] ?? norm(u);
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
  gst_pct: number;
  stage: string;
};
export type Match = {
  boq: BoqRow;
  line: PriceLine;
  list: PriceList;
  rule: DiscountRule | null;
  net: number;
  how: "code" | "brand + name";
};

/** Match the newest list of each brand to BOQ lines: product code, or same brand + most of the item's words, same unit. */
export function matchBoq(boq: BoqRow[], lists: PriceList[], rules: DiscountRule[]): Match[] {
  const out: Match[] = [];
  for (const b of boq) {
    let hit: { line: PriceLine; list: PriceList } | null = null;
    let how: Match["how"] = "code";
    if (b.item_code) {
      for (const list of lists) {
        const line = list.lines.find((l) => l.item_code && same(l.item_code, b.item_code));
        if (line) {
          hit = { line, list };
          break;
        }
      }
    }
    if (!hit && b.brand) {
      how = "brand + name";
      const bt = tokens(`${b.description} ${b.category}`);
      let best = 0;
      for (const list of lists) {
        if (!same(list.brand, b.brand)) continue;
        for (const l of list.lines) {
          const lt = tokens(l.item);
          if (!lt.size || !(l.mrp > 0)) continue;
          let c = 0;
          lt.forEach((w) => bt.has(w) && c++);
          const s = c / lt.size;
          if (s >= 0.6 && s > best) {
            best = s;
            hit = { line: l, list };
          }
        }
      }
    }
    if (!hit || !(hit.line.mrp > 0)) continue;
    if (hit.line.unit && b.unit && normUnit(hit.line.unit) !== normUnit(b.unit)) continue;
    const rule = discountFor(hit.list.brand, hit.line.category || b.category, rules);
    const net = netExGst(hit.line.mrp, hit.list.gst, hit.line.gst_pct || b.gst_pct, rule?.pct ?? 0);
    out.push({ boq: b, line: hit.line, list: hit.list, rule, net, how });
  }
  return out;
}

/** CSV import: item and MRP columns required; brand, category, unit, code, gst optional. */
export function parseCsv(text: string): (PriceLine & { brand: string })[] {
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
    gst: col(["gst", "gst_pct", "gst_%"]),
  };
  if (ix.item < 0 || ix.mrp < 0)
    throw new Error("The CSV needs an item (or description) column and an MRP column");
  const at = (r: string[], i: number) => (i >= 0 ? (r[i] ?? "") : "");
  return rows
    .slice(1)
    .map((r) => ({
      id: uid(),
      brand: at(r, ix.brand),
      item: at(r, ix.item),
      category: at(r, ix.category),
      unit: at(r, ix.unit),
      mrp: Number(at(r, ix.mrp).replace(/[^0-9.]/g, "")) || 0,
      item_code: at(r, ix.code),
      gst_pct: Number(at(r, ix.gst).replace(/[^0-9.]/g, "")) || 0,
    }))
    .filter((l) => l.item && l.mrp > 0);
}

export const CSV_TEMPLATE =
  "item_code,item,category,unit,mrp,gst_pct\n,FR-LSH wire 1.5 sq mm 90 m coil,Electrical,coil,0,18\n";
