import { Fragment, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronDown, ChevronRight, Scale } from "lucide-react";
import { useOwnerLiability } from "@/lib/owner-liability";
import { fmtDay } from "@/lib/programme-progress";

const rs = (v: number) => `₹${Math.round(v).toLocaleString("en-IN")}`;
const cr = (v: number) =>
  Math.abs(v) >= 1e7 ? `₹${(v / 1e7).toFixed(2)} Cr` : `₹${(v / 1e5).toFixed(2)} L`;

/**
 * Each landowner's (and flat owner's) liability with its proper break-up
 * (common works by share, own flats, unallotted flats) and the money they
 * have been asked for and have paid, with the entries behind it.
 */
export function LandownerBreakup({ projectId }: { projectId: string }) {
  const q = useOwnerLiability(projectId);
  const [open, setOpen] = useState<string>("");
  if (!projectId) return null;
  if (q.isLoading)
    return <div className="rounded-xl border border-border bg-card p-4 text-sm">Loading…</div>;
  if (q.error)
    return (
      <div className="rounded-xl border border-border bg-card p-4 text-sm text-destructive">
        {(q.error as Error).message}
      </div>
    );
  const d = q.data!;
  const sum = (f: (l: (typeof d.list)[number]) => number) => d.list.reduce((t, l) => t + f(l), 0);

  return (
    <section className="rounded-xl border border-border bg-card shadow-sm">
      <div className="border-b border-border p-4">
        <h2 className="flex items-center gap-2 text-base font-semibold">
          <Scale className="size-4 text-primary" /> Liability break-up and contributions
        </h2>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Common works {cr(d.common.total)} (BOQ common incl. GST + {d.contingencyPct}% contingency)
          shared by each landowner's %. Individual works {cr(d.individualTotal)} go to each flat's
          owner
          {d.hasFlats ? (
            <>
              {" "}
              (by flat type,{" "}
              <Link to="/flats" className="text-primary underline">
                Flats
              </Link>
              ); {cr(d.unallottedTotal)} for flats not yet allotted is carried by share.
            </>
          ) : (
            <>; no flats on record yet, so they are carried by share.</>
          )}{" "}
          Calls and receipts come from the{" "}
          <Link to="/capital-ledger" className="text-primary underline">
            Capital Ledger
          </Link>
          .
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] text-[13px]">
          <thead className="bg-muted/40 text-left text-[11px] uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-3 py-2">Payer</th>
              <th className="px-3 py-2 text-right">Share</th>
              <th className="px-3 py-2 text-right">Common works</th>
              <th className="px-3 py-2 text-right">Own flats</th>
              <th className="px-3 py-2 text-right">Unallotted flats</th>
              <th className="px-3 py-2 text-right">Total liability</th>
              <th className="px-3 py-2 text-right">Called</th>
              <th className="px-3 py-2 text-right">Received</th>
              <th className="px-3 py-2 text-right">Balance to fund</th>
            </tr>
          </thead>
          <tbody>
            {d.list.map((l) => {
              const isOpen = open === l.name;
              return (
                <Fragment key={l.name}>
                  <tr
                    className="cursor-pointer border-t border-border hover:bg-muted/30"
                    onClick={() => setOpen(isOpen ? "" : l.name)}
                  >
                    <td className="px-3 py-2 font-semibold">
                      <span className="inline-flex items-center gap-1">
                        {isOpen ? (
                          <ChevronDown className="size-3.5" />
                        ) : (
                          <ChevronRight className="size-3.5" />
                        )}
                        {l.name}
                      </span>
                      <span className="block pl-5 text-[11px] font-normal text-muted-foreground">
                        {l.role}
                        {l.flats.length > 0 && ` · flats ${l.flats.map((f) => f.no).join(", ")}`}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right tnum">{l.share ? `${l.share}%` : "—"}</td>
                    <td className="px-3 py-2 text-right tnum">{cr(l.common.total)}</td>
                    <td className="px-3 py-2 text-right tnum">{cr(l.ownFlats)}</td>
                    <td className="px-3 py-2 text-right tnum">{cr(l.unallotted)}</td>
                    <td className="px-3 py-2 text-right font-semibold tnum">{cr(l.total)}</td>
                    <td className="px-3 py-2 text-right tnum">{cr(l.called)}</td>
                    <td className="px-3 py-2 text-right tnum text-emerald-700">{cr(l.received)}</td>
                    <td className="px-3 py-2 text-right font-semibold tnum">{cr(l.balance)}</td>
                  </tr>
                  {isOpen && (
                    <tr className="bg-background">
                      <td colSpan={9} className="px-4 py-3">
                        <div className="grid gap-4 md:grid-cols-2">
                          <div>
                            <h3 className="text-xs font-bold uppercase text-muted-foreground">
                              Break-up
                            </h3>
                            <table className="mt-1 w-full text-[12px]">
                              <tbody>
                                <Row k="Common works, excl. GST" v={rs(l.common.excl)} />
                                <Row k="GST on common works" v={rs(l.common.gst)} />
                                <Row
                                  k={`Contingency ${d.contingencyPct}% on common works`}
                                  v={rs(l.common.contingency)}
                                />
                                <Row k="Common works total" v={rs(l.common.total)} strong />
                                {l.flats.map((f) => (
                                  <Row
                                    key={f.no}
                                    k={`Flat ${f.no} (${f.type}) individual works${f.extra ? `, incl. own extras ${rs(f.extra)}` : ""}`}
                                    v={rs(f.base + f.extra)}
                                  />
                                ))}
                                {l.unallotted > 0 && (
                                  <Row k="Share of unallotted flats" v={rs(l.unallotted)} />
                                )}
                                <Row k="Total liability" v={rs(l.total)} strong />
                                <Row k="Received so far" v={`− ${rs(l.received)}`} />
                                <Row k="Balance to fund" v={rs(l.balance)} strong />
                              </tbody>
                            </table>
                          </div>
                          <div>
                            <h3 className="text-xs font-bold uppercase text-muted-foreground">
                              Contributions ({l.entries.length})
                            </h3>
                            {l.entries.length === 0 ? (
                              <p className="mt-1 text-[12px] text-muted-foreground">
                                No calls or receipts yet.
                              </p>
                            ) : (
                              <div className="mt-1 max-h-60 overflow-y-auto">
                                <table className="w-full text-[12px]">
                                  <tbody>
                                    {l.entries.map((e, i) => (
                                      <tr key={i} className="border-t border-border/50">
                                        <td className="whitespace-nowrap pr-2 text-muted-foreground">
                                          {fmtDay(e.date ?? "")}
                                        </td>
                                        <td className="pr-2">
                                          {e.type === "call" ? "Called" : "Received"} ·{" "}
                                          {e.milestone || e.reference}
                                          <span className="block text-[11px] text-muted-foreground">
                                            {e.status}
                                          </span>
                                        </td>
                                        <td
                                          className={`whitespace-nowrap text-right tnum ${e.type === "call" ? "" : "text-emerald-700"}`}
                                        >
                                          {rs(e.amount)}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
          <tfoot className="border-t-2 border-border font-semibold">
            <tr>
              <td className="px-3 py-2">Total</td>
              <td className="px-3 py-2 text-right tnum">{sum((l) => l.share)}%</td>
              <td className="px-3 py-2 text-right tnum">{cr(sum((l) => l.common.total))}</td>
              <td className="px-3 py-2 text-right tnum">{cr(sum((l) => l.ownFlats))}</td>
              <td className="px-3 py-2 text-right tnum">{cr(sum((l) => l.unallotted))}</td>
              <td className="px-3 py-2 text-right tnum">{cr(sum((l) => l.total))}</td>
              <td className="px-3 py-2 text-right tnum">{cr(sum((l) => l.called))}</td>
              <td className="px-3 py-2 text-right tnum">{cr(sum((l) => l.received))}</td>
              <td className="px-3 py-2 text-right tnum">{cr(sum((l) => l.balance))}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
}

function Row({ k, v, strong }: { k: string; v: string; strong?: boolean }) {
  return (
    <tr className={`border-t border-border/50 ${strong ? "font-semibold" : ""}`}>
      <td className="py-0.5 pr-2">{k}</td>
      <td className="py-0.5 text-right tnum">{v}</td>
    </tr>
  );
}
