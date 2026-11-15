import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Gauge, Library } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { crore } from "@/lib/boq-totals";
import { inr, inrCompact } from "@/data/saha";
import {
  libraryRows,
  optimize,
  packageOf,
  type AltLine,
  type AlternateRow,
  type OptimizerPick,
} from "@/lib/boq-alternates";

const n = (v: unknown) => {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
};

/**
 * The BOQ optimizer: takes the saved alternates, picks the cheapest one for each
 * line (biggest saving first) until the BOQ fits the target, and lets the user tick
 * which to send for approval (or apply, when approval is off). Works without AI.
 */
export function BoqOptimizer({
  projectId,
  projectName,
  lines,
  options,
  flatPkg,
  currentIncl,
  budget,
  contingencyPct,
  canEdit,
  gateOn,
  onApply,
  onClose,
}: {
  projectId: string;
  projectName: string;
  lines: AltLine[];
  options: AlternateRow[];
  flatPkg: Record<string, string>;
  currentIncl: number;
  budget: number;
  contingencyPct: number;
  canEdit: boolean;
  gateOn: boolean;
  onApply: (picks: OptimizerPick[]) => Promise<void>;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [scope, setScope] = useState<"ALL" | "common" | "individual">("ALL");
  const [pkg, setPkg] = useState("ALL");
  const [targetCr, setTargetCr] = useState(budget > 0 ? (budget / 1e7).toFixed(2) : "");
  const [ticked, setTicked] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const packages = useMemo(
    () => [...new Set(lines.map((l) => packageOf(l)).filter(Boolean))],
    [lines],
  );
  const inScope = useMemo(
    () =>
      lines.filter(
        (l) =>
          (scope === "ALL" || (l.work_scope ?? "common") === scope) &&
          (pkg === "ALL" || packageOf(l) === pkg),
      ),
    [lines, scope, pkg],
  );
  const target = Math.max(0, n(targetCr) * 1e7);
  const plan = useMemo(
    () => optimize(inScope, options, flatPkg, { currentIncl, target, contingencyPct }),
    [inScope, options, flatPkg, currentIncl, target, contingencyPct],
  );

  // A fresh plan ticks exactly the lines the plan takes.
  useEffect(() => {
    setTicked(new Set(plan.picked.map((p) => p.line.id)));
  }, [plan]);

  const k = 1 + contingencyPct / 100;
  const tickedPicks = plan.ready.filter((p) => ticked.has(p.line.id));
  const savingTicked = tickedPicks.reduce((s, p) => s + p.saving * k, 0);
  const after = currentIncl - savingTicked;
  const allSaving = plan.ready.reduce((s, p) => s + p.saving * k, 0);

  const newLib = useMemo(
    () => libraryRows(projectId, projectName, lines, options, null),
    [projectId, projectName, lines, options],
  );

  async function loadLibrary() {
    setBusy(true);
    setMsg("");
    const { data: u } = await supabase.auth.getUser();
    const rows = newLib.map((r) => ({ ...r, created_by: u.user?.id ?? null }));
    const { error } = await supabase.from("flat_options").insert(rows);
    setBusy(false);
    if (error) {
      setMsg(`Could not load the alternates: ${error.message}`);
      return;
    }
    setMsg(`${rows.length} alternates added from the PMC vendor and cost-reduction workbooks.`);
    await qc.invalidateQueries({ queryKey: ["boq_alternates", projectId] });
    await qc.invalidateQueries({ queryKey: ["owner_portal", projectId] });
  }

  async function apply() {
    if (!tickedPicks.length) return;
    setBusy(true);
    setMsg("");
    try {
      await onApply(tickedPicks);
      setMsg(
        gateOn
          ? `${tickedPicks.length} change(s) sent for approval. The BOQ moves when the admin approves them.`
          : `${tickedPicks.length} line(s) changed.`,
      );
    } catch (e) {
      setMsg(`Stopped: ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  }

  const fits = target > 0 && after <= target;
  return (
    <section className="rounded-xl border border-primary/40 bg-card">
      <div className="flex flex-wrap items-center gap-2 border-b border-border px-3 py-2.5">
        <Gauge className="size-4 text-primary" />
        <h2 className="text-sm font-bold uppercase tracking-tight text-foreground">
          BOQ optimizer
        </h2>
        <span className="text-[12px] text-muted-foreground">
          Picks the cheapest saved alternate per line until the BOQ fits the target. Nothing changes
          until you send or apply.
        </span>
        <button
          type="button"
          onClick={onClose}
          className="ml-auto text-[12px] font-semibold text-muted-foreground"
        >
          Close
        </button>
      </div>

      <div className="space-y-3 p-3">
        {newLib.length > 0 && canEdit && (
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-primary/30 bg-primary-soft/40 px-3 py-2 text-[13px]">
            <Library className="size-4 text-primary" />
            <span>
              <b>{newLib.length}</b> alternates from the PMC vendor &amp; brand options and
              cost-reduction workbooks are not loaded into this BOQ yet.
            </span>
            <button
              type="button"
              disabled={busy}
              onClick={() => void loadLibrary()}
              className="ml-auto h-8 rounded bg-primary px-3 text-[12px] font-semibold text-primary-foreground disabled:opacity-50"
            >
              Load them
            </button>
          </div>
        )}

        <div className="flex flex-wrap items-end gap-3">
          <label className="text-[12px] font-semibold text-muted-foreground">
            Target, incl. GST + {contingencyPct}% (₹ Cr)
            <input
              value={targetCr}
              onChange={(e) => setTargetCr(e.target.value)}
              inputMode="decimal"
              className="mt-1 block h-9 w-28 rounded border border-input bg-background px-2 text-right text-sm tnum"
            />
          </label>
          <label className="text-[12px] font-semibold text-muted-foreground">
            Works
            <select
              value={scope}
              onChange={(e) => setScope(e.target.value as typeof scope)}
              className="mt-1 block h-9 rounded border border-input bg-background px-2 text-sm"
            >
              <option value="ALL">Common + individual</option>
              <option value="common">Common works only</option>
              <option value="individual">Individual works only</option>
            </select>
          </label>
          <label className="text-[12px] font-semibold text-muted-foreground">
            Package
            <select
              value={pkg}
              onChange={(e) => setPkg(e.target.value)}
              className="mt-1 block h-9 max-w-[220px] rounded border border-input bg-background px-2 text-sm"
            >
              <option value="ALL">All packages</option>
              {packages.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          <Stat label="BOQ now" value={crore(currentIncl)} />
          <Stat label="Target" value={target > 0 ? crore(target) : "—"} />
          <Stat
            label={`After the ${tickedPicks.length} ticked`}
            value={crore(after)}
            tone={target > 0 ? (fits ? "good" : "bad") : undefined}
            sub={
              target > 0
                ? fits
                  ? "fits the target"
                  : `${crore(after - target)} still over`
                : undefined
            }
          />
          <Stat
            label="If every alternate is taken"
            value={`saves ${inrCompact(allSaving)}`}
            sub={`${plan.ready.length} line(s) with a cheaper alternate`}
          />
        </div>

        {plan.ready.length === 0 ? (
          <p className="rounded border border-dashed border-border p-3 text-[13px] text-muted-foreground">
            No cheaper alternates saved for {pkg === "ALL" ? "these lines" : pkg}. Open “Alternates”
            on a line to add one{newLib.length ? ", or load the PMC alternates above" : ""}.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-[13px]">
              <thead className="bg-secondary/60 text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-2 py-1.5">
                    <input
                      type="checkbox"
                      aria-label="Tick all"
                      checked={ticked.size === plan.ready.length}
                      onChange={(e) =>
                        setTicked(
                          e.target.checked ? new Set(plan.ready.map((p) => p.line.id)) : new Set(),
                        )
                      }
                    />
                  </th>
                  <th className="px-2 py-1.5">Line</th>
                  <th className="px-2 py-1.5">Now</th>
                  <th className="px-2 py-1.5">Alternate</th>
                  <th className="px-2 py-1.5 text-right">Rate now → alt.</th>
                  <th className="px-2 py-1.5 text-right">Saving incl. GST</th>
                </tr>
              </thead>
              <tbody>
                {plan.ready.map((p) => (
                  <tr key={p.line.id} className="border-t border-border align-top">
                    <td className="px-2 py-1.5">
                      <input
                        type="checkbox"
                        checked={ticked.has(p.line.id)}
                        onChange={(e) => {
                          const next = new Set(ticked);
                          if (e.target.checked) next.add(p.line.id);
                          else next.delete(p.line.id);
                          setTicked(next);
                        }}
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <div className="font-semibold text-foreground">
                        {p.line.item_code} · {p.line.description.slice(0, 60)}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {packageOf(p.line)} ·{" "}
                        {(p.line.work_scope ?? "common") === "individual" ? "individual" : "common"}
                      </div>
                    </td>
                    <td className="px-2 py-1.5 text-muted-foreground">
                      {p.line.brand || "our spec"}
                    </td>
                    <td className="px-2 py-1.5">
                      <div className="font-semibold text-foreground">{p.alt.label}</div>
                      {p.alt.make && (
                        <div className="text-[11px] text-muted-foreground">{p.alt.make}</div>
                      )}
                    </td>
                    <td className="px-2 py-1.5 text-right tnum">
                      {inr(n(p.line.rate))} → {inr(n(p.alt.rate))} / {p.line.unit}
                    </td>
                    <td className="px-2 py-1.5 text-right font-semibold tnum text-primary">
                      {inrCompact(p.saving)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={busy || !canEdit || tickedPicks.length === 0}
            title={canEdit ? undefined : "Only an admin or PM can change the BOQ"}
            onClick={() => void apply()}
            className="h-9 rounded bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-50"
          >
            {busy
              ? "Working…"
              : gateOn
                ? `Send ${tickedPicks.length} for approval`
                : `Apply ${tickedPicks.length} change(s)`}
          </button>
          <span className="text-[12px] text-muted-foreground">
            Saving of the ticked lines:{" "}
            <b className="tnum text-foreground">{inrCompact(savingTicked)}</b> incl. GST and
            contingency. Alternate rates are targets to quote against: confirm with dealer quotes
            before ordering.
          </span>
        </div>
        {msg && <p className="text-[13px] font-medium text-primary">{msg}</p>}
      </div>
    </section>
  );
}

function Stat({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub?: string | undefined;
  tone?: "good" | "bad" | undefined;
}) {
  return (
    <div className="rounded-lg border border-border p-2.5">
      <div className="label-caps text-muted-foreground">{label}</div>
      <div
        className={`mt-1 text-lg font-bold tnum ${tone === "good" ? "text-primary" : tone === "bad" ? "text-destructive" : "text-foreground"}`}
      >
        {value}
      </div>
      {sub && <div className="text-[11px] text-muted-foreground">{sub}</div>}
    </div>
  );
}
