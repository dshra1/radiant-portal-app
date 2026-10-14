/**
 * BOQ totals the way the PMC report builds them (master BOQ Summary sheet):
 * line amount excl. GST = qty × rate; GST per line at its own rate (18% on most,
 * 0% on approvals and labour contracts); sub-total incl. GST; contingency as a %
 * of the sub-total (on both the amount and its GST); project cost = sub-total +
 * contingency. Grouped by the report's packages and split common / individual.
 */
export type TotalsLine = {
  quantity: number | string | null;
  rate: number | string | null;
  gst_pct?: number | string | null;
  work_scope?: string | null;
  package?: string | null;
  package_no?: number | null;
  item_code?: string | null;
};

export type Money = { excl: number; gst: number; incl: number };

export type PackageTotal = Money & { no: number; name: string; lines: number };

export type BoqTotals = {
  subtotal: Money;
  contingencyPct: number;
  contingency: Money;
  project: Money;
  common: Money;
  individual: Money;
  packages: PackageTotal[];
  lines: number;
};

const n = (v: unknown) => {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
};

const zero = (): Money => ({ excl: 0, gst: 0, incl: 0 });

function add(m: Money, excl: number, gst: number) {
  m.excl += excl;
  m.gst += gst;
  m.incl += excl + gst;
}

/** GST % of a line; lines without the field (older rows) count at 18%. */
export function gstPctOf(l: TotalsLine) {
  return l.gst_pct === null || l.gst_pct === undefined || l.gst_pct === "" ? 18 : n(l.gst_pct);
}

export function lineAmounts(l: TotalsLine) {
  const excl = n(l.quantity) * n(l.rate);
  const gst = (excl * gstPctOf(l)) / 100;
  return { excl, gst, incl: excl + gst };
}

export function boqTotals(lines: TotalsLine[], contingencyPct = 5): BoqTotals {
  const subtotal = zero();
  const common = zero();
  const individual = zero();
  const pk = new Map<string, PackageTotal>();
  let counted = 0;
  for (const l of lines) {
    // An old imported contingency line is replaced by the computed contingency.
    if (l.item_code === "CONT") continue;
    counted++;
    const a = lineAmounts(l);
    add(subtotal, a.excl, a.gst);
    add(l.work_scope === "individual" ? individual : common, a.excl, a.gst);
    const name = (l.package ?? "").trim() || "Other (not from the report)";
    const no = n(l.package_no) || 999;
    const key = `${no}|${name}`;
    const t = pk.get(key) ?? { no, name, lines: 0, ...zero() };
    t.lines++;
    add(t, a.excl, a.gst);
    pk.set(key, t);
  }
  const f = contingencyPct / 100;
  const contingency = { excl: subtotal.excl * f, gst: subtotal.gst * f, incl: subtotal.incl * f };
  const project = {
    excl: subtotal.excl + contingency.excl,
    gst: subtotal.gst + contingency.gst,
    incl: subtotal.incl + contingency.incl,
  };
  const packages = [...pk.values()].sort((a, b) => a.no - b.no || a.name.localeCompare(b.name));
  return {
    subtotal,
    contingencyPct,
    contingency,
    project,
    common,
    individual,
    packages,
    lines: counted,
  };
}

export function crore(v: number) {
  return `₹${(v / 1e7).toFixed(2)} Cr`;
}

export function lakh(v: number) {
  return `₹${(v / 1e5).toFixed(2)} L`;
}

export function inrShort(v: number) {
  if (Math.abs(v) >= 1e7) return crore(v);
  if (Math.abs(v) >= 1e5) return lakh(v);
  return `₹${Math.round(v).toLocaleString("en-IN")}`;
}
