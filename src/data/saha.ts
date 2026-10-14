/** Number formatting helpers (en-IN). */
const toNum = (v: unknown) => {
  const n = typeof v === "number" ? v : Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
};

export const inr = (v: number | string | null | undefined) =>
  "₹" + new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(toNum(v));

export const inrCompact = (value: number | string | null | undefined) => {
  const v = toNum(value);
  if (v >= 10000000) return "₹" + (v / 10000000).toFixed(2) + " Cr";
  if (v >= 100000) return "₹" + (v / 100000).toFixed(1) + " L";
  return inr(v);
};

export const num = (v: number | string | null | undefined, d = 0) =>
  new Intl.NumberFormat("en-IN", { minimumFractionDigits: d, maximumFractionDigits: d }).format(
    toNum(v),
  );
