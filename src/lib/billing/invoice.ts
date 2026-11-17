import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

/** GST state codes (first two digits of a GSTIN). */
export const GST_STATES: Record<string, string> = {
  "01": "Jammu and Kashmir",
  "02": "Himachal Pradesh",
  "03": "Punjab",
  "04": "Chandigarh",
  "05": "Uttarakhand",
  "06": "Haryana",
  "07": "Delhi",
  "08": "Rajasthan",
  "09": "Uttar Pradesh",
  "10": "Bihar",
  "11": "Sikkim",
  "12": "Arunachal Pradesh",
  "13": "Nagaland",
  "14": "Manipur",
  "15": "Mizoram",
  "16": "Tripura",
  "17": "Meghalaya",
  "18": "Assam",
  "19": "West Bengal",
  "20": "Jharkhand",
  "21": "Odisha",
  "22": "Chhattisgarh",
  "23": "Madhya Pradesh",
  "24": "Gujarat",
  "26": "Dadra and Nagar Haveli and Daman and Diu",
  "27": "Maharashtra",
  "29": "Karnataka",
  "30": "Goa",
  "31": "Lakshadweep",
  "32": "Kerala",
  "33": "Tamil Nadu",
  "34": "Puducherry",
  "35": "Andaman and Nicobar Islands",
  "36": "Telangana",
  "37": "Andhra Pradesh",
  "38": "Ladakh",
  "97": "Other Territory",
};
const codeForState = (name: string) =>
  Object.entries(GST_STATES).find(([, n]) => n.toLowerCase() === name.trim().toLowerCase())?.[0] ??
  "";

export type Tax = {
  intra: boolean;
  cgst: number;
  sgst: number;
  igst: number;
  placeCode: string;
  placeName: string;
};

/** CGST + SGST when the buyer is in the seller's state, otherwise IGST (18% in total). */
export function splitGst(
  taxable: number,
  sellerGstin: string,
  buyerGstin: string,
  buyerState: string,
): Tax {
  const sellerCode = sellerGstin.slice(0, 2) || "36";
  const placeCode =
    (buyerGstin && /^\d{2}/.test(buyerGstin) ? buyerGstin.slice(0, 2) : codeForState(buyerState)) ||
    sellerCode;
  const r2 = (n: number) => Math.round(n * 100) / 100;
  const intra = placeCode === sellerCode;
  return intra
    ? {
        intra,
        cgst: r2(taxable * 0.09),
        sgst: r2(taxable * 0.09),
        igst: 0,
        placeCode,
        placeName: GST_STATES[placeCode] ?? "",
      }
    : {
        intra,
        cgst: 0,
        sgst: 0,
        igst: r2(taxable * 0.18),
        placeCode,
        placeName: GST_STATES[placeCode] ?? "",
      };
}

const ONES = [
  "",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
  "Eleven",
  "Twelve",
  "Thirteen",
  "Fourteen",
  "Fifteen",
  "Sixteen",
  "Seventeen",
  "Eighteen",
  "Nineteen",
];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
function two(n: number) {
  return n < 20 ? ONES[n]! : `${TENS[Math.floor(n / 10)]}${n % 10 ? ` ${ONES[n % 10]}` : ""}`;
}
function three(n: number) {
  const h = Math.floor(n / 100);
  const r = n % 100;
  return [h ? `${ONES[h]} Hundred` : "", r ? two(r) : ""].filter(Boolean).join(" ");
}
/** Indian numbering: crore, lakh, thousand. */
export function rupeesInWords(amount: number) {
  const rs = Math.floor(amount);
  const ps = Math.round((amount - rs) * 100);
  const parts: string[] = [];
  const cr = Math.floor(rs / 1e7);
  const lk = Math.floor((rs % 1e7) / 1e5);
  const th = Math.floor((rs % 1e5) / 1e3);
  const rest = rs % 1e3;
  if (cr) parts.push(`${three(cr)} Crore`);
  if (lk) parts.push(`${two(lk)} Lakh`);
  if (th) parts.push(`${two(th)} Thousand`);
  if (rest) parts.push(three(rest));
  const words = parts.join(" ") || "Zero";
  return `Rupees ${words}${ps ? ` and ${two(ps)} Paise` : ""} Only`;
}

export type InvoiceData = {
  invoiceNo: string;
  date: Date;
  seller: { name: string; gstin: string; address: string; email: string };
  buyer: {
    name: string;
    firm?: string;
    gstin?: string;
    address?: string;
    state?: string;
    pin?: string;
    contact?: string;
    email?: string;
    phone?: string;
    poRef?: string;
  };
  line: { description: string; sac: string; taxable: number };
  tax: Tax;
  paymentRef: string;
};

const money = (n: number) =>
  `Rs. ${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export async function makeInvoicePdf(d: InvoiceData): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`Tax Invoice ${d.invoiceNo}`);
  pdf.setAuthor(d.seller.name);
  const page = pdf.addPage([595.28, 841.89]); // A4
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const ink = rgb(0.1, 0.1, 0.1);
  const grey = rgb(0.4, 0.4, 0.4);
  const green = rgb(0.12, 0.23, 0.18);
  const L = 40;
  const R = 555;
  let y = 800;
  const text = (s: string, x: number, yy: number, size = 9, f = font, color = ink) =>
    page.drawText(s, { x, y: yy, size, font: f, color });
  const right = (s: string, x: number, yy: number, size = 9, f = font) =>
    text(s, x - f.widthOfTextAtSize(s, size), yy, size, f);
  const wrap = (s: string, x: number, yy: number, width: number, size = 9, f = font) => {
    const words = (s || "").split(/\s+/);
    let line = "";
    let cy = yy;
    for (const w of words) {
      const t = line ? `${line} ${w}` : w;
      if (f.widthOfTextAtSize(t, size) > width && line) {
        text(line, x, cy, size, f);
        cy -= size + 3;
        line = w;
      } else line = t;
    }
    if (line) text(line, x, cy, size, f);
    return cy - size - 3;
  };

  page.drawRectangle({ x: 0, y: 812, width: 595.28, height: 30, color: green });
  text("TAX INVOICE", L, 822, 14, bold, rgb(1, 1, 1));
  page.drawText("Original for recipient", {
    x: R - font.widthOfTextAtSize("Original for recipient", 9),
    y: 823,
    size: 9,
    font,
    color: rgb(1, 1, 1),
  });

  y = 790;
  text(d.seller.name, L, y, 13, bold);
  y = wrap(d.seller.address, L, y - 15, 300, 9);
  if (d.seller.gstin) text(`GSTIN: ${d.seller.gstin}`, L, y, 9, bold);
  if (d.seller.email) text(d.seller.email, L, y - 12, 9, font, grey);

  right(`Invoice no: ${d.invoiceNo}`, R, 790, 10, bold);
  right(
    `Date: ${d.date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}`,
    R,
    776,
    9,
  );
  right(`Place of supply: ${d.tax.placeName} (${d.tax.placeCode})`, R, 763, 9);
  right(`Payment ref: ${d.paymentRef}`, R, 750, 8);

  y = 700;
  page.drawLine({
    start: { x: L, y: y + 12 },
    end: { x: R, y: y + 12 },
    thickness: 0.6,
    color: grey,
  });
  text("Bill to", L, y, 8, bold, grey);
  text(d.buyer.name || d.buyer.firm || "", L, y - 14, 11, bold);
  let by = wrap(
    [d.buyer.address, d.buyer.state, d.buyer.pin].filter(Boolean).join(", "),
    L,
    y - 28,
    320,
    9,
  );
  if (d.buyer.gstin) {
    text(`GSTIN: ${d.buyer.gstin}`, L, by, 9, bold);
    by -= 12;
  }
  if (d.buyer.contact || d.buyer.email)
    text(
      [d.buyer.contact, d.buyer.email, d.buyer.phone].filter(Boolean).join(" · "),
      L,
      by,
      9,
      font,
      grey,
    );
  if (d.buyer.poRef) text(`PO / ref: ${d.buyer.poRef}`, L, by - 12, 9, font, grey);

  // Table
  y = 590;
  page.drawRectangle({ x: L, y: y - 4, width: R - L, height: 18, color: rgb(0.93, 0.95, 0.94) });
  text("#", L + 6, y + 1, 9, bold);
  text("Description", L + 24, y + 1, 9, bold);
  text("SAC", 340, y + 1, 9, bold);
  right("Taxable value", R - 6, y + 1, 9, bold);
  y -= 20;
  text("1", L + 6, y, 9);
  const after = wrap(d.line.description, L + 24, y, 280, 9);
  text(d.line.sac, 340, y, 9);
  right(money(d.line.taxable), R - 6, y, 9);
  y = Math.min(after, y - 14) - 8;
  page.drawLine({ start: { x: L, y }, end: { x: R, y }, thickness: 0.6, color: grey });

  const rows: [string, number][] = [["Taxable value", d.line.taxable]];
  if (d.tax.intra) {
    rows.push(["CGST @ 9%", d.tax.cgst], ["SGST @ 9%", d.tax.sgst]);
  } else rows.push(["IGST @ 18%", d.tax.igst]);
  const total = d.line.taxable + d.tax.cgst + d.tax.sgst + d.tax.igst;
  y -= 18;
  for (const [k, v] of rows) {
    text(k, 340, y, 9);
    right(money(v), R - 6, y, 9);
    y -= 15;
  }
  page.drawLine({
    start: { x: 330, y: y + 9 },
    end: { x: R, y: y + 9 },
    thickness: 0.6,
    color: grey,
  });
  text("Total", 340, y - 4, 11, bold);
  right(money(total), R - 6, y - 4, 11, bold);
  y -= 30;
  wrap(`Amount in words: ${rupeesInWords(total)}`, L, y, R - L, 9, bold);

  y -= 40;
  text("Notes", L, y, 8, bold, grey);
  wrap(
    "Prepaid AI credits for SiteYantra (1 credit = Rs. 1 before GST), used against AI features at the published price per use. Credits do not expire while the account is active. Tax is not payable on reverse charge.",
    L,
    y - 13,
    R - L,
    8,
  );
  right(`For ${d.seller.name}`, R, 120, 9, bold);
  right("Authorised signatory (computer-generated invoice)", R, 92, 8);
  text("This is a computer-generated invoice and does not need a signature.", L, 50, 7, font, grey);
  return pdf.save();
}
