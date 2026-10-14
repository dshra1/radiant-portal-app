/**
 * Shared money definitions so every page reports the same figure for the same thing.
 *
 * - PMC fee      = fee % × BOQ works total EXCL. GST of the packages in PMC scope
 *                  (all packages when no scope has been saved). The imported CONT line
 *                  is never counted; contingency is not part of the fee basis.
 * - Committed    = APPROVED purchase orders only, incl. GST, freight and other charges.
 * - Project cost = BOQ project cost incl. GST and contingency (boqTotals().project.incl)
 *                  + PMC fee. Statutory charges are inside the BOQ Approvals package
 *                  (AP01–AP06) and are never added on top.
 * - Statutory paid = project_charges with status "paid" (the rest are only planned).
 */
import { lineAmounts, type Money, type TotalsLine } from "@/lib/boq-totals";

export const DEFAULT_PMC_FEE_PCT = 3;

export const APPROVALS_NOTE =
  "Statutory charges are budgeted in the BOQ Approvals package; this page records what has been paid against it.";

export const COMMITTED_LABEL = "Committed (approved POs)";

const n = (v: unknown) => {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
};

export type PmcScope = { mode?: string; feePct?: number | string | null; includedTrades?: unknown };

type PmcLine = TotalsLine & { stage?: string | null };

/** The work-package key the BOQ Engine groups by: "01 Structure" for report lines, else the stage. */
export function pmcGroupOf(l: PmcLine) {
  return l.package
    ? `${String(l.package_no ?? 0).padStart(2, "0")} ${l.package}`
    : String(l.stage ?? "") || "Miscellaneous";
}

export type PmcPackage = Money & { key: string; lines: number; stages: Set<string> };

/** BOQ work packages with excl. GST / GST / incl. GST totals (CONT line skipped). */
export function pmcPackages(lines: PmcLine[]): PmcPackage[] {
  const map = new Map<string, PmcPackage>();
  for (const l of lines) {
    if (l.item_code === "CONT") continue;
    const key = pmcGroupOf(l);
    const a = lineAmounts(l);
    const p = map.get(key) ?? {
      key,
      lines: 0,
      excl: 0,
      gst: 0,
      incl: 0,
      stages: new Set<string>(),
    };
    p.lines++;
    p.excl += a.excl;
    p.gst += a.gst;
    p.incl += a.incl;
    if (l.stage) p.stages.add(String(l.stage));
    map.set(key, p);
  }
  return [...map.values()].sort((a, b) => a.key.localeCompare(b.key, "en", { numeric: true }));
}

/** Saved fee %, or the default (flagged) when none has been saved. */
export function pmcFeePct(scope: PmcScope | null | undefined) {
  const raw = scope?.feePct;
  const saved = raw !== null && raw !== undefined && raw !== "" && Number.isFinite(Number(raw));
  return { pct: saved ? n(raw) : DEFAULT_PMC_FEE_PCT, isDefault: !saved };
}

/** Saved package list, or null when no scope has been saved (then all packages count). */
export function pmcIncluded(scope: PmcScope | null | undefined) {
  return Array.isArray(scope?.includedTrades) ? scope.includedTrades.map(String) : null;
}

/**
 * True when a package is in scope. Older saves stored construction-stage names, so a
 * package also counts when any of its stages was ticked.
 */
export function packageInScope(p: PmcPackage, included: string[] | null) {
  if (!included) return true;
  return included.includes(p.key) || [...p.stages].some((s) => included.includes(s));
}

export function pmcFee(lines: PmcLine[], scope: PmcScope | null | undefined) {
  const packages = pmcPackages(lines);
  const included = pmcIncluded(scope);
  const { pct, isDefault } = pmcFeePct(scope);
  const basisExcl = packages
    .filter((p) => packageInScope(p, included))
    .reduce((s, p) => s + p.excl, 0);
  return {
    pct,
    isDefault,
    scopeSaved: included !== null,
    basisExcl,
    fee: (basisExcl * pct) / 100,
    packages,
  };
}

/** Label for the fee % that makes a fallback visible. */
export function pmcFeeLabel(pct: number, isDefault: boolean) {
  return isDefault ? `PMC fee @ default ${pct}% (not set)` : `PMC fee @ ${pct}%`;
}

type PoLike = {
  status: string | null;
  freight_charges?: number | string | null;
  other_charges?: number | string | null;
  purchase_order_items?: Array<{
    quantity: number | string | null;
    rate: number | string | null;
    discount_pct: number | string | null;
    gst_pct: number | string | null;
  }> | null;
};

/** Value of APPROVED purchase orders (incl. GST, after discount, plus freight/other). */
export function approvedPoCommitted(orders: PoLike[]) {
  return orders
    .filter((o) => String(o.status ?? "").toLowerCase() === "approved")
    .reduce((sum, o) => {
      const lines = (o.purchase_order_items ?? []).reduce((s, li) => {
        const base = n(li.quantity) * n(li.rate);
        const afterDisc = base * (1 - n(li.discount_pct) / 100);
        return s + afterDisc * (1 + n(li.gst_pct) / 100);
      }, 0);
      return sum + lines + n(o.freight_charges) + n(o.other_charges);
    }, 0);
}

/** Sum of statutory charges actually paid (status "paid"). */
export function statutoryPaid(charges: Array<{ amount: unknown; status?: unknown }>) {
  return charges
    .filter((c) => String(c.status ?? "").toLowerCase() === "paid")
    .reduce((s, c) => s + n(c.amount), 0);
}

/** Total of the BOQ Approvals package (AP01–AP06), incl. GST — the statutory budget. */
export function approvalsBudget(lines: PmcLine[]) {
  return lines
    .filter(
      (l) =>
        l.item_code !== "CONT" &&
        (/^AP\d/i.test(String(l.item_code ?? "")) || /approval/i.test(String(l.package ?? ""))),
    )
    .reduce((s, l) => s + lineAmounts(l).incl, 0);
}
