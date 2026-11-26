/**
 * Landowner / investor statement of account (and payment request when calls are open), as an
 * A4 PDF that is shared from the phone (WhatsApp via the share sheet) or downloaded.
 * Figures are the ones the Capital Ledger and the owner portal show (useOwnerLiability):
 * share of common works, own flats, share of unallotted flats, calls, receipts and balance.
 */
import type { Liability } from "@/lib/owner-liability";
import { needsImage, safe, textPng } from "@/lib/dpr";

export type StatementProject = {
  name: string;
  location: string;
  company_name?: string | null;
  company_gstin?: string | null;
  bank_name?: string | null;
  bank_account_name?: string | null;
  bank_account_last4?: string | null;
  bank_ifsc?: string | null;
};

const rs = (v: number) => `Rs ${Math.round(v).toLocaleString("en-IN")}`;

/** Calls not yet marked received. */
export function openCallsOf(l: Liability) {
  return l.entries.filter((e) => e.type === "call" && e.status !== "received");
}

/** What the owner still owes against calls: open calls, less money already received toward them. */
export function dueNow(l: Liability) {
  const open = openCallsOf(l).reduce((s, e) => s + e.amount, 0);
  return Math.max(0, Math.min(open, l.called - l.received));
}

export async function buildOwnerStatementPdf(p: StatementProject, l: Liability) {
  const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const W = 595;
  const H = 842;
  const M = 44;
  let page = doc.addPage([W, H]);
  let y = H - M;
  const green = rgb(0.06, 0.43, 0.34);
  const grey = rgb(0.4, 0.4, 0.4);
  const ensure = (h: number) => {
    if (y - h < M + 20) {
      page = doc.addPage([W, H]);
      y = H - M;
    }
  };
  /** Text in the standard font, or drawn by the browser when it holds Telugu/Hindi. */
  const put = async (
    s: string,
    x: number,
    size = 10,
    f = font,
    color = rgb(0, 0, 0),
    width = 300,
  ) => {
    if (needsImage(s)) {
      const img = await textPng(s, width, size);
      if (img) {
        const png = await doc.embedPng(img.png);
        page.drawImage(png, {
          x,
          y: y + size - img.heightPt + 2,
          width: img.widthPt,
          height: img.heightPt,
        });
        return;
      }
    }
    page.drawText(safe(s), { x, y, size, font: f, color });
  };
  const right = (s: string, xr: number, size = 10, f = font, color = rgb(0, 0, 0)) =>
    page.drawText(safe(s), { x: xr - f.widthOfTextAtSize(safe(s), size), y, size, font: f, color });

  const open = openCallsOf(l);
  const due = dueNow(l);
  const openTotal = open.reduce((s, e) => s + e.amount, 0);
  const today = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // Header
  if (p.company_name) {
    await put(p.company_name, M, 11, bold, green);
    y -= 13;
    if (p.company_gstin) {
      page.drawText(safe(`GSTIN ${p.company_gstin}`), { x: M, y, size: 8, font, color: grey });
      y -= 12;
    }
  }
  y -= 6;
  page.drawText(due > 0 ? "PAYMENT REQUEST & STATEMENT OF ACCOUNT" : "STATEMENT OF ACCOUNT", {
    x: M,
    y,
    size: 15,
    font: bold,
    color: green,
  });
  y -= 20;
  await put(`${p.name}${p.location ? ` · ${p.location}` : ""}`, M, 11, bold, rgb(0, 0, 0), 400);
  y -= 15;
  await put(`To: ${l.name} (${l.role}, ${l.share}% share)`, M, 10, font, rgb(0, 0, 0), 400);
  right(`Date: ${today}`, W - M, 10, font, grey);
  y -= 22;

  // Amount due box
  if (due > 0) {
    page.drawRectangle({
      x: M,
      y: y - 34,
      width: W - 2 * M,
      height: 44,
      color: rgb(1, 0.96, 0.88),
    });
    page.drawText("Amount requested now", { x: M + 10, y: y - 6, size: 10, font, color: grey });
    page.drawText(safe(rs(due)), { x: M + 10, y: y - 26, size: 18, font: bold });
    const ms = open
      .map((e) => e.milestone || e.reference)
      .filter(Boolean)
      .join(", ");
    y -= 8;
    if (ms) await put(`For: ${ms}`, M + 200, 9, font, grey, W - 2 * M - 210);
    if (openTotal - due > 1)
      page.drawText(safe(`(calls ${rs(openTotal)} less ${rs(openTotal - due)} already received)`), {
        x: M + 200,
        y: y - 13,
        size: 8,
        font,
        color: grey,
      });
    y -= 44;
  }

  // Summary
  const rows: [string, number, boolean?][] = [
    ["Your share of common works (incl. GST and contingency)", l.common.total],
    ["Your flats (individual works and your extras)", l.ownFlats],
    ["Your share of flats not yet allotted", l.unallotted],
    ["Total cost to you", l.total, true],
    ["Called so far", l.called],
    ["Received so far", l.received],
    ["Balance still to fund", l.balance, true],
  ];
  page.drawText("Summary", { x: M, y, size: 11, font: bold, color: green });
  y -= 16;
  for (const [label, v, strong] of rows) {
    ensure(16);
    page.drawText(label, { x: M, y, size: 10, font: strong ? bold : font });
    right(rs(v), W - M, 10, strong ? bold : font);
    y -= 4;
    page.drawLine({
      start: { x: M, y },
      end: { x: W - M, y },
      thickness: 0.3,
      color: rgb(0.85, 0.85, 0.85),
    });
    y -= 12;
  }

  if (l.flats.length) {
    y -= 6;
    ensure(30);
    page.drawText("Your flats", { x: M, y, size: 11, font: bold, color: green });
    y -= 15;
    for (const f of l.flats) {
      ensure(14);
      page.drawText(safe(`Flat ${f.no} (${f.type})`), { x: M, y, size: 9, font });
      right(`${rs(f.base)}${f.extra ? ` + extras ${rs(f.extra)}` : ""}`, W - M, 9);
      y -= 13;
    }
  }

  // Ledger
  y -= 8;
  ensure(40);
  page.drawText("Calls and receipts", { x: M, y, size: 11, font: bold, color: green });
  y -= 15;
  const cols = [M, M + 70, M + 150, M + 360];
  ["Date", "Type", "Stage / reference", "Amount"].forEach((h, i) =>
    i === 3
      ? right(h, W - M, 8, bold, grey)
      : page.drawText(h, { x: cols[i]!, y, size: 8, font: bold, color: grey }),
  );
  y -= 13;
  const list = [...l.entries].sort((a, b) =>
    String(a.date ?? "").localeCompare(String(b.date ?? "")),
  );
  if (list.length === 0) {
    page.drawText("No calls or receipts yet.", { x: M, y, size: 9, font, color: grey });
    y -= 13;
  }
  for (const e of list) {
    ensure(14);
    const type =
      e.type === "call" ? (e.status === "received" ? "Call (paid)" : "Call (due)") : "Received";
    page.drawText(safe(e.date ?? "-"), { x: cols[0]!, y, size: 9, font });
    page.drawText(type, {
      x: cols[1]!,
      y,
      size: 9,
      font: e.type === "call" && e.status !== "received" ? bold : font,
    });
    await put(
      [e.milestone, e.reference].filter(Boolean).join(" · ") || "-",
      cols[2]!,
      9,
      font,
      rgb(0, 0, 0),
      200,
    );
    right(rs(e.amount), W - M, 9);
    y -= 13;
  }

  // Pay to
  if (p.bank_name || p.bank_ifsc) {
    y -= 10;
    ensure(60);
    page.drawText("Please pay to", { x: M, y, size: 11, font: bold, color: green });
    y -= 15;
    for (const line of [
      p.bank_account_name && `Account name: ${p.bank_account_name}`,
      p.bank_name && `Bank: ${p.bank_name}`,
      p.bank_account_last4 &&
        `Account no.: ending ${p.bank_account_last4} (full number on request)`,
      p.bank_ifsc && `IFSC: ${p.bank_ifsc}`,
    ].filter(Boolean) as string[]) {
      await put(line, M, 10, font, rgb(0, 0, 0), 420);
      y -= 13;
    }
    y -= 4;
    page.drawText(
      "Please share the UTR / reference once paid so it is recorded against your name.",
      {
        x: M,
        y,
        size: 9,
        font,
        color: grey,
      },
    );
    y -= 12;
  }

  y -= 8;
  ensure(30);
  for (const ln of [
    "Common works are the BOQ common lines with GST and the project contingency, shared by your share %.",
    "Individual works are your flats at the agreed specification plus the extras you chose and the PMC accepted.",
  ]) {
    page.drawText(ln, { x: M, y, size: 8, font, color: grey });
    y -= 11;
  }

  const pages = doc.getPages();
  pages.forEach((pg, i) =>
    pg.drawText(
      safe(
        `${p.name} · statement${needsImage(l.name) ? "" : ` for ${l.name}`} · ${today} · page ${i + 1} of ${pages.length} · SiteYantra`,
      ),
      {
        x: M,
        y: 22,
        size: 7,
        font,
        color: grey,
      },
    ),
  );
  return doc.save();
}

/** Message that goes with the PDF (WhatsApp text). */
export function statementMessage(p: StatementProject, l: Liability) {
  const due = dueNow(l);
  return due > 0
    ? `Namaste ${l.name}, for ${p.name}: ${rs(due)} is requested now (${openCallsOf(l)
        .map((e) => e.milestone || e.reference)
        .filter(Boolean)
        .join(", ")}). Your statement is attached. Balance still to fund: ${rs(l.balance)}.`
    : `Namaste ${l.name}, your statement for ${p.name} is attached. Received so far ${rs(l.received)}; balance still to fund ${rs(l.balance)}.`;
}
