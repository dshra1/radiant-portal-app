/**
 * Comparing scanned vendor quote rates with BOQ rates on the same basis.
 *
 * - BOQ rates (boq_items.rate) EXCLUDE GST (GST is added per line, see boq-totals).
 * - Quote net rates (price_quote_items.net_rate) INCLUDE GST: rate × (1 − discount) × (1 + GST).
 *
 * So every comparison converts the quote back to excl. GST using its own gst_pct
 * (18% when missing) and only compares lines whose units agree after normalising
 * trivial spellings. Potential saving = (BOQ rate − quote rate excl. GST) × BOQ qty,
 * only when the quote is cheaper and the units agree.
 */

export const RATE_BASIS_NOTE =
  "All rates compared excl. GST: quote net rates are converted back using each line's GST % (18% if not given); BOQ rates are already excl. GST. Lines with different units are not compared.";

const UNIT_ALIASES: Record<string, string> = {
  no: "nos",
  nos: "nos",
  nr: "nos",
  number: "nos",
  numbers: "nos",
  each: "nos",
  ea: "nos",
  pc: "nos",
  pcs: "nos",
  piece: "nos",
  pieces: "nos",
  sqft: "sqft",
  sft: "sqft",
  sqfeet: "sqft",
  ft2: "sqft",
  sqm: "sqm",
  sqmt: "sqm",
  sqmtr: "sqm",
  m2: "sqm",
  rmt: "rmt",
  rm: "rmt",
  runningmetre: "rmt",
  runningmeter: "rmt",
  rft: "rft",
  rf: "rft",
  runningfeet: "rft",
  runningfoot: "rft",
  cum: "cum",
  cumt: "cum",
  m3: "cum",
  cft: "cft",
  cuft: "cft",
  kg: "kg",
  kgs: "kg",
  bag: "bag",
  bags: "bag",
  ltr: "ltr",
  ltrs: "ltr",
  litre: "ltr",
  litres: "ltr",
  liter: "ltr",
  liters: "ltr",
  l: "ltr",
};

/** Normalised unit key; nos/no/Nos → "nos", sqft/sft → "sqft", rmt/rm → "rmt", rft/rf → "rft". */
export function normUnit(u: string | null | undefined) {
  const k = String(u ?? "")
    .toLowerCase()
    .replace(/^per\s+/, "")
    .replace(/[^a-z0-9]/g, "");
  return UNIT_ALIASES[k] ?? k;
}

/** True when both units are known and equal after normalising (blank units never match). */
export function unitsMatch(a: string | null | undefined, b: string | null | undefined) {
  const x = normUnit(a);
  const y = normUnit(b);
  return x !== "" && x === y;
}

const num = (v: unknown) => {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
};

/** A quote line's net rate (incl. GST) brought back to excl. GST. */
export function quoteRateExclGst(item: {
  net_rate: number | string | null;
  gst_pct?: number | string | null;
}) {
  const g =
    item.gst_pct === null || item.gst_pct === undefined || item.gst_pct === ""
      ? 18
      : num(item.gst_pct);
  return num(item.net_rate) / (1 + g / 100);
}

export type RateComparison = {
  /** Quote rate excl. GST. */
  quoteExcl: number;
  unitsMatch: boolean;
  /** % difference of quote vs BOQ (negative = quote cheaper); null when not comparable. */
  delta: number | null;
  /** Potential saving on the BOQ quantity; 0 when not cheaper or not comparable. */
  saving: number;
};

export function compareRate(
  boq: { rate: number | string | null; unit: string | null; quantity: number | string | null },
  quote: {
    net_rate: number | string | null;
    gst_pct?: number | string | null;
    unit: string | null;
  },
): RateComparison {
  const quoteExcl = quoteRateExclGst(quote);
  const same = unitsMatch(boq.unit, quote.unit);
  const base = num(boq.rate);
  if (!same || base <= 0) return { quoteExcl, unitsMatch: same, delta: null, saving: 0 };
  const delta = ((quoteExcl - base) / base) * 100;
  const saving = quoteExcl < base ? (base - quoteExcl) * num(boq.quantity) : 0;
  return { quoteExcl, unitsMatch: true, delta, saving };
}

/**
 * The cheapest (excl. GST) of the candidate quote lines, preferring lines in the
 * BOQ line's unit; when none share the unit, the cheapest overall is returned with
 * unitsMatch false so the page can flag it instead of comparing.
 */
export function cheapestQuote<
  T extends {
    net_rate: number | string | null;
    gst_pct?: number | string | null;
    unit: string | null;
  },
>(candidates: T[], boqUnit?: string | null) {
  const pool =
    boqUnit === undefined
      ? candidates
      : candidates.filter((c) => unitsMatch(boqUnit, c.unit)).length
        ? candidates.filter((c) => unitsMatch(boqUnit, c.unit))
        : candidates;
  let best: T | undefined;
  for (const c of pool) if (!best || quoteRateExclGst(c) < quoteRateExclGst(best)) best = c;
  return best;
}
