import { Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Section } from "@/components/saha/ui";
import { inr } from "@/data/saha";
import { fmtDay } from "@/lib/programme-progress";
import { addExtraToTender, useOwnerExtras } from "@/lib/owner-extras";

/** Accepted owner choices that must be bought for their flat. */
export function OwnerExtrasSection({
  projectId,
  canWrite,
}: {
  projectId: string;
  canWrite: boolean;
}) {
  const q = useOwnerExtras(projectId);
  const qc = useQueryClient();
  const [busy, setBusy] = useState("");
  const rows = q.data ?? [];
  const open = rows.filter((r) => !r.po).length;

  return (
    <Section
      title={`Owners' extras to buy${rows.length ? ` · ${open} to order` : ""}`}
      className="mt-3"
      action={
        <Link to="/owner" search={{ tab: "flat" }} className="text-xs font-semibold text-primary">
          Owner's Portal
        </Link>
      }
    >
      <div id="owner-extras" />
      {q.isError && <p className="p-4 text-sm text-destructive">{(q.error as Error).message}</p>}
      {!q.isPending && rows.length === 0 && (
        <p className="p-4 text-sm text-muted-foreground">
          No owner's choices in the plan yet. When the PMC accepts an owner's option (another make
          or series) on the Owner's Portal, it appears here to be added to its tender and ordered
          for that flat.
        </p>
      )}
      {rows.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-sm">
            <thead className="bg-secondary/40 text-left text-[11px] uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-3 py-2">Flat</th>
                <th className="px-3 py-2">Item</th>
                <th className="px-3 py-2">Owner's choice</th>
                <th className="px-3 py-2 text-right">Qty</th>
                <th className="px-3 py-2 text-right">Rate excl. GST</th>
                <th className="px-3 py-2 text-right">Extra to owner</th>
                <th className="px-3 py-2">Needed from</th>
                <th className="px-3 py-2">Buying</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((x) => (
                <tr key={x.selectionId}>
                  <td className="px-3 py-2 font-semibold">
                    {x.flatNo}
                    <p className="text-[11px] font-normal text-muted-foreground">{x.owner}</p>
                  </td>
                  <td className="px-3 py-2">
                    <span className="font-mono text-[11px] text-muted-foreground">{x.code}</span>{" "}
                    {x.item}
                    {x.specMake && (
                      <p className="text-[11px] text-muted-foreground">our spec: {x.specMake}</p>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {x.choice}
                    {x.make && <p className="text-[11px] text-muted-foreground">{x.make}</p>}
                  </td>
                  <td className="px-3 py-2 text-right tnum">
                    {x.qty.toLocaleString("en-IN")} {x.unit}
                  </td>
                  <td className="px-3 py-2 text-right tnum">{inr(x.rate)}</td>
                  <td className="px-3 py-2 text-right tnum">{inr(x.delta)}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{fmtDay(x.needBy)}</td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {x.po ? (
                        <span className="rounded bg-primary/15 px-2 py-0.5 text-xs font-semibold text-primary">
                          {x.po}
                        </span>
                      ) : (
                        <>
                          {x.onTender ? (
                            <Link
                              to="/tender-comparison"
                              className="rounded border border-border px-2 py-0.5 text-xs font-semibold"
                            >
                              On {x.onTender}
                            </Link>
                          ) : (
                            x.dept &&
                            canWrite && (
                              <button
                                type="button"
                                disabled={busy === x.selectionId}
                                onClick={async () => {
                                  setBusy(x.selectionId);
                                  try {
                                    const no = await addExtraToTender(projectId, x);
                                    toast.success(`Added to ${no} for flat ${x.flatNo}`);
                                    await qc.invalidateQueries({
                                      queryKey: ["owner_extras", projectId],
                                    });
                                  } catch (e) {
                                    toast.error((e as Error).message);
                                  }
                                  setBusy("");
                                }}
                                className="rounded border border-border px-2 py-0.5 text-xs font-semibold disabled:opacity-50"
                              >
                                Add to {`CE-${x.dept.code}`}
                              </button>
                            )
                          )}
                          {canWrite && (
                            <Link
                              to="/po-create"
                              search={{ extra: x.selectionId }}
                              className="rounded bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground"
                            >
                              Raise PO
                            </Link>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Section>
  );
}
