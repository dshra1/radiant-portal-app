import { Fragment, useMemo, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { boqTotals, lineAmounts, inrShort, crore, type TotalsLine } from "@/lib/boq-totals";

export type SummaryLine = TotalsLine & {
  id: string;
  description: string;
  unit: string;
  line_group?: string | null;
};

/**
 * The BOQ the way the PMC report's Summary sheet shows it: one row per package
 * (excl. GST, GST, incl. GST, ₹/sft, share), then sub-total, contingency,
 * project cost and the budget check. Each package opens to its lines, grouped
 * by the report's sub-headings.
 */
export function BoqPackageSummary({
  lines,
  contingencyPct,
  saleableSft,
  budget,
}: {
  lines: SummaryLine[];
  contingencyPct: number;
  saleableSft: number;
  budget: number;
}) {
  const t = useMemo(() => boqTotals(lines, contingencyPct), [lines, contingencyPct]);
  const [open, setOpen] = useState<string>("");
  const perSft = (v: number) =>
    saleableSft > 0 ? `₹${Math.round(v / saleableSft).toLocaleString("en-IN")}` : "—";
  const over = budget > 0 ? t.project.incl - budget : 0;
  const cell = "px-2 py-1.5 text-right tnum whitespace-nowrap";

  const linesOf = (no: number, name: string) => {
    const mine = lines.filter(
      (l) =>
        l.item_code !== "CONT" &&
        (Number(l.package_no) || 999) === no &&
        ((l.package ?? "").trim() || "Other (not from the report)") === name,
    );
    const groups = new Map<string, SummaryLine[]>();
    for (const l of mine) {
      const g = (l.line_group ?? "").trim() || "Items";
      groups.set(g, [...(groups.get(g) ?? []), l]);
    }
    return [...groups.entries()];
  };

  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold">
          Package summary · {t.packages.length} packages · {t.lines} lines
        </h2>
        <span className="text-[11px] text-muted-foreground">
          GST at each line's rate (18%; 0% on approvals and labour contracts) ·{" "}
          {saleableSft > 0
            ? `${saleableSft.toLocaleString("en-IN")} sft saleable`
            : "set saleable sft in Project Details"}
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-[13px]">
          <thead>
            <tr className="border-b border-border text-[11px] uppercase text-muted-foreground">
              <th className="px-2 py-1.5 text-left">#</th>
              <th className="px-2 py-1.5 text-left">Package</th>
              <th className={cell}>Lines</th>
              <th className={cell}>Excl. GST</th>
              <th className={cell}>GST</th>
              <th className={cell}>Incl. GST</th>
              <th className={cell}>₹/sft</th>
              <th className={cell}>Share</th>
            </tr>
          </thead>
          <tbody>
            {t.packages.map((p) => {
              const key = `${p.no}|${p.name}`;
              const isOpen = open === key;
              const share = t.subtotal.incl > 0 ? (p.incl / t.subtotal.incl) * 100 : 0;
              return (
                <Fragment key={key}>
                  <tr
                    className="cursor-pointer border-b border-border/60 hover:bg-secondary/50"
                    onClick={() => setOpen(isOpen ? "" : key)}
                  >
                    <td className="px-2 py-1.5 text-muted-foreground">
                      {p.no === 999 ? "—" : p.no}
                    </td>
                    <td className="px-2 py-1.5 font-medium">
                      <span className="inline-flex items-center gap-1">
                        {isOpen ? (
                          <ChevronDown className="size-3.5" />
                        ) : (
                          <ChevronRight className="size-3.5" />
                        )}
                        {p.name}
                      </span>
                    </td>
                    <td className={cell}>{p.lines}</td>
                    <td className={cell}>{inrShort(p.excl)}</td>
                    <td className={cell}>{inrShort(p.gst)}</td>
                    <td className={`${cell} font-semibold`}>{inrShort(p.incl)}</td>
                    <td className={cell}>{perSft(p.incl)}</td>
                    <td className={cell}>{share.toFixed(1)}%</td>
                  </tr>
                  {isOpen &&
                    linesOf(p.no, p.name).map(([group, gl]) => (
                      <Fragment key={group}>
                        <tr className="bg-secondary/40">
                          <td />
                          <td
                            colSpan={7}
                            className="px-2 py-1 text-[11px] font-semibold uppercase text-muted-foreground"
                          >
                            {group}
                          </td>
                        </tr>
                        {gl.map((l) => {
                          const a = lineAmounts(l);
                          return (
                            <tr key={l.id} className="border-b border-border/40 text-[12px]">
                              <td className="px-2 py-1 text-muted-foreground">{l.item_code}</td>
                              <td className="px-2 py-1">
                                {l.description}
                                <span className="ml-1 text-muted-foreground">
                                  · {Number(l.quantity).toLocaleString("en-IN")} {l.unit} @ ₹
                                  {Number(l.rate).toLocaleString("en-IN")}
                                </span>
                              </td>
                              <td className={cell}>
                                {l.work_scope === "individual" ? "Indiv." : "Common"}
                              </td>
                              <td className={cell}>{inrShort(a.excl)}</td>
                              <td className={cell}>{inrShort(a.gst)}</td>
                              <td className={cell}>{inrShort(a.incl)}</td>
                              <td className={cell}>{perSft(a.incl)}</td>
                              <td />
                            </tr>
                          );
                        })}
                      </Fragment>
                    ))}
                </Fragment>
              );
            })}
          </tbody>
          <tfoot className="text-[13px]">
            <tr className="border-t-2 border-border font-semibold">
              <td />
              <td className="px-2 py-1.5">Sub-total</td>
              <td className={cell}>{t.lines}</td>
              <td className={cell}>{crore(t.subtotal.excl)}</td>
              <td className={cell}>{crore(t.subtotal.gst)}</td>
              <td className={cell}>{crore(t.subtotal.incl)}</td>
              <td className={cell}>{perSft(t.subtotal.incl)}</td>
              <td />
            </tr>
            <tr>
              <td />
              <td className="px-2 py-1.5">Contingency {t.contingencyPct}%</td>
              <td />
              <td className={cell}>{crore(t.contingency.excl)}</td>
              <td className={cell}>{crore(t.contingency.gst)}</td>
              <td className={cell}>{crore(t.contingency.incl)}</td>
              <td className={cell}>{perSft(t.contingency.incl)}</td>
              <td />
            </tr>
            <tr className="font-bold text-primary">
              <td />
              <td className="px-2 py-1.5">Project cost</td>
              <td />
              <td className={cell}>{crore(t.project.excl)}</td>
              <td className={cell}>{crore(t.project.gst)}</td>
              <td className={cell}>{crore(t.project.incl)}</td>
              <td className={cell}>{perSft(t.project.incl)}</td>
              <td />
            </tr>
            <tr className="text-muted-foreground">
              <td />
              <td className="px-2 py-1.5">Common works · Individual works (incl. GST)</td>
              <td />
              <td colSpan={3} className={cell}>
                {crore(t.common.incl)} · {crore(t.individual.incl)}
              </td>
              <td colSpan={2} />
            </tr>
            {budget > 0 && (
              <tr className={over > 0 ? "text-destructive" : "text-primary"}>
                <td />
                <td className="px-2 py-1.5">
                  Budget {crore(budget)}
                  {saleableSft > 0 &&
                    ` (₹${Math.round(budget / saleableSft).toLocaleString("en-IN")}/sft)`}
                </td>
                <td />
                <td colSpan={3} className={`${cell} font-semibold`}>
                  {over > 0 ? "Over by " : "Under by "}
                  {crore(Math.abs(over))} ({((over / budget) * 100).toFixed(1)}%)
                </td>
                <td colSpan={2} />
              </tr>
            )}
          </tfoot>
        </table>
      </div>
    </div>
  );
}
