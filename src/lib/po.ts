/** Purchase order domain helpers — line maths, GST split and amount in words. */

export type PoStatus = "draft" | "pending" | "approved" | "rejected";

export type PoItem = {
  id: string;
  item_code: string;
  description: string;
  brand: string;
  unit: string;
  quantity: number | string;
  rate: number | string;
  discount_pct: number | string;
  gst_pct: number | string;
  sort_order: number;
};

export type PoRecord = {
  id: string;
  po_number: string;
  project_id: string | null;
  project_name: string;
  site_address: string;
  vendor_name: string;
  vendor_address: string;
  vendor_gstin: string;
  vendor_contact: string;
  vendor_email: string;
  quote_reference: string;
  po_date: string;
  delivery_date: string | null;
  payment_terms: string;
  delivery_terms: string;
  freight_charges: number | string;
  other_charges: number | string;
  tax_mode: "intra" | "inter";
  terms: string;
  notes: string;
  status: PoStatus;
  raised_by: string | null;
  raised_by_name: string;
  approved_by: string | null;
  approved_by_name: string;
  approved_at: string | null;
  rejection_reason: string;
  created_at: string;
};

export const n = (v: unknown) => {
  const x = typeof v === "number" ? v : Number(v ?? 0);
  return Number.isFinite(x) ? x : 0;
};

export function lineTotals(item: PoItem) {
  const gross = n(item.quantity) * n(item.rate);
  const discount = (gross * n(item.discount_pct)) / 100;
  const taxable = gross - discount;
  const gst = (taxable * n(item.gst_pct)) / 100;
  return { gross, discount, taxable, gst, total: taxable + gst };
}

export function poTotals(
  items: PoItem[],
  opts: { freight?: number | string; other?: number | string; taxMode?: "intra" | "inter" } = {},
) {
  let taxable = 0;
  let discount = 0;
  let gst = 0;
  for (const it of items) {
    const l = lineTotals(it);
    taxable += l.taxable;
    discount += l.discount;
    gst += l.gst;
  }
  const freight = n(opts.freight);
  const other = n(opts.other);
  const beforeRound = taxable + gst + freight + other;
  const grand = Math.round(beforeRound);
  const roundOff = grand - beforeRound;
  const half = gst / 2;
  return {
    taxable,
    discount,
    gst,
    cgst: opts.taxMode === "inter" ? 0 : half,
    sgst: opts.taxMode === "inter" ? 0 : half,
    igst: opts.taxMode === "inter" ? gst : 0,
    freight,
    other,
    roundOff,
    grand,
  };
}

const ONES = [
  "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
  "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen",
  "Nineteen",
];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

function twoDigits(v: number): string {
  if (v < 20) return ONES[v] ?? "";
  const t = TENS[Math.floor(v / 10)] ?? "";
  const o = ONES[v % 10] ?? "";
  return o ? `${t} ${o}` : t;
}

/** Indian numbering system: crore / lakh / thousand / hundred. */
export function amountInWords(value: number): string {
  const amount = Math.round(n(value));
  if (amount === 0) return "Rupees Zero Only";
  const parts: string[] = [];
  const push = (v: number, label: string) => {
    if (v > 0) parts.push(`${twoDigits(v)} ${label}`.trim());
  };
  let rest = amount;
  push(Math.floor(rest / 10000000), "Crore");
  rest %= 10000000;
  push(Math.floor(rest / 100000), "Lakh");
  rest %= 100000;
  push(Math.floor(rest / 1000), "Thousand");
  rest %= 1000;
  push(Math.floor(rest / 100), "Hundred");
  rest %= 100;
  if (rest > 0) parts.push(twoDigits(rest));
  return `Rupees ${parts.join(" ")} Only`;
}

export const DEFAULT_PO_TERMS = [
  "Material must conform to the specification, brand and BIS standard stated above.",
  "Delivery to be completed on or before the delivery date; delay attracts 0.5% per week penalty, capped at 5% of PO value.",
  "Goods are subject to inspection at site; rejected material to be lifted by the vendor at their cost within 7 days.",
  "Invoice must quote this PO number, vehicle number and weighment/test certificates.",
  "Payment as per agreed terms after certification of quantity and quality by the site engineer.",
  "Retention/warranty as per contract; unauthorised substitution of brand is not payable.",
].join("\n");

export const STATUS_LABEL: Record<PoStatus, string> = {
  draft: "Draft",
  pending: "Pending PM approval",
  approved: "Approved",
  rejected: "Rejected",
};
