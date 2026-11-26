/**
 * Tally export: bills as Purchase vouchers and payments as Payment vouchers, with the party
 * ledgers created under Sundry Creditors, in Tally's XML import format (Tally Prime / ERP 9:
 * Gateway of Tally → Import → Vouchers). Ledger names for expenses, GST, retention, deductions
 * and bank are the company's own; they are set once on the page and remembered.
 */

export type TallyLedgers = {
  material: string;
  labour: string;
  machinery: string;
  misc: string;
  gst: string;
  retention: string;
  deductions: string;
  bank: string;
};
export const DEFAULT_LEDGERS: TallyLedgers = {
  material: "Purchase - Construction Material",
  labour: "Subcontract & Labour Charges",
  machinery: "Machinery Hire Charges",
  misc: "Site Expenses",
  gst: "Input GST",
  retention: "Retention Payable",
  deductions: "Recoveries from Contractors",
  bank: "Bank",
};

export type TallyBill = {
  id: string;
  bill_number: string;
  bill_date: string | null;
  vendor_name: string;
  description: string;
  cost_type: string;
  basic_amount: number;
  gst_amount: number;
  other_charges: number;
  retention_amount: number;
  deductions: number;
};
export type TallyPayment = {
  id: string;
  bill_id: string;
  payment_date: string;
  amount: number;
  mode: string;
  reference: string;
};

const esc = (s: string) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
const d8 = (iso: string | null) => (iso ?? new Date().toISOString().slice(0, 10)).replace(/-/g, "");
const amt = (n: number) => n.toFixed(2);

/** One ledger line: debit = deemed positive with a negative amount (Tally's convention). */
const line = (ledger: string, debit: boolean, value: number) =>
  `<ALLLEDGERENTRIES.LIST><LEDGERNAME>${esc(ledger)}</LEDGERNAME><ISDEEMEDPOSITIVE>${debit ? "Yes" : "No"}</ISDEEMEDPOSITIVE><AMOUNT>${amt(debit ? -value : value)}</AMOUNT></ALLLEDGERENTRIES.LIST>`;

export function tallyXml(
  bills: TallyBill[],
  payments: TallyPayment[],
  ledgers: TallyLedgers,
  company: string,
) {
  const parties = [...new Set(bills.map((b) => b.vendor_name.trim()).filter(Boolean))];
  const masters = parties
    .map(
      (p) =>
        `<TALLYMESSAGE xmlns:UDF="TallyUDF"><LEDGER NAME="${esc(p)}" ACTION="Create"><NAME.LIST><NAME>${esc(p)}</NAME></NAME.LIST><PARENT>Sundry Creditors</PARENT><ISBILLWISEON>Yes</ISBILLWISEON></LEDGER></TALLYMESSAGE>`,
    )
    .join("\n");
  const expense = (t: string) =>
    t === "labour"
      ? ledgers.labour
      : t === "machinery"
        ? ledgers.machinery
        : t === "misc"
          ? ledgers.misc
          : ledgers.material;

  const vouchers: string[] = [];
  for (const b of bills) {
    const basic = b.basic_amount + b.other_charges;
    const payable = basic + b.gst_amount - b.retention_amount - b.deductions;
    const lines = [
      line(b.vendor_name, false, payable),
      ...(b.retention_amount ? [line(ledgers.retention, false, b.retention_amount)] : []),
      ...(b.deductions ? [line(ledgers.deductions, false, b.deductions)] : []),
      line(expense(b.cost_type), true, basic),
      ...(b.gst_amount ? [line(ledgers.gst, true, b.gst_amount)] : []),
    ];
    vouchers.push(
      `<TALLYMESSAGE xmlns:UDF="TallyUDF"><VOUCHER VCHTYPE="Purchase" ACTION="Create"><DATE>${d8(b.bill_date)}</DATE><VOUCHERTYPENAME>Purchase</VOUCHERTYPENAME><REFERENCE>${esc(b.bill_number)}</REFERENCE><VOUCHERNUMBER>${esc(b.bill_number)}</VOUCHERNUMBER><PARTYLEDGERNAME>${esc(b.vendor_name)}</PARTYLEDGERNAME><NARRATION>${esc(b.description)}</NARRATION>${lines.join("")}</VOUCHER></TALLYMESSAGE>`,
    );
  }
  const byId = new Map(bills.map((b) => [b.id, b]));
  for (const p of payments) {
    const b = byId.get(p.bill_id);
    if (!b) continue;
    vouchers.push(
      `<TALLYMESSAGE xmlns:UDF="TallyUDF"><VOUCHER VCHTYPE="Payment" ACTION="Create"><DATE>${d8(p.payment_date)}</DATE><VOUCHERTYPENAME>Payment</VOUCHERTYPENAME><NARRATION>${esc(`Against bill ${b.bill_number}${p.reference ? ` · ${p.mode} ${p.reference}` : ""}`)}</NARRATION>${line(b.vendor_name, true, p.amount)}${line(ledgers.bank, false, p.amount)}</VOUCHER></TALLYMESSAGE>`,
    );
  }
  return `<ENVELOPE>
<HEADER><TALLYREQUEST>Import Data</TALLYREQUEST></HEADER>
<BODY><IMPORTDATA>
<REQUESTDESC><REPORTNAME>Vouchers</REPORTNAME>${company ? `<STATICVARIABLES><SVCURRENTCOMPANY>${esc(company)}</SVCURRENTCOMPANY></STATICVARIABLES>` : ""}</REQUESTDESC>
<REQUESTDATA>
${masters}
${vouchers.join("\n")}
</REQUESTDATA>
</IMPORTDATA></BODY>
</ENVELOPE>`;
}
