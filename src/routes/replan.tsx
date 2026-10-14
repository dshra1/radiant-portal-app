import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { CalendarClock, CloudRain, Sparkles, TriangleAlert } from "lucide-react";
import { Shell } from "@/components/saha/Shell";
import { MetricTile, Section } from "@/components/saha/ui";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { useActiveProject } from "@/hooks/useActiveProject";
import { useAccess } from "@/lib/access";
import { fmtDay } from "@/lib/programme-progress";
import { stageName } from "@/lib/site-week";
import { suggestRecovery } from "@/lib/replan.functions";
import { iso, useProgrammeForecast, writeStageDates } from "@/lib/use-forecast";
import type { StageFc } from "@/lib/programme-forecast";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/replan")({
  head: () => ({
    meta: [
      { title: "Programme Re-plan | Saha OS" },
      {
        name: "description",
        content:
          "Forecast of every stage from site progress, predecessors and material on order; the critical path, handover forecast, AI recovery ideas and one-click re-plan.",
      },
    ],
  }),
  component: Page,
});

type View = "late" | "critical" | "all";
const d = (n: number) => fmtDay(Number.isFinite(n) ? iso(n) : null);
const slipText = (n: number) => (n > 0 ? `+${n} d` : n < 0 ? `${n} d` : "on plan");

function Page() {
  const project = useActiveProject();
  const { access } = useAccess();
  const isManager = Boolean(access?.isAdmin || access?.roles.includes("pm"));
  const [monsoon, setMonsoon] = useState(false);
  const [view, setView] = useState<View>("late");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const qc = useQueryClient();
  const f = useProgrammeForecast(project.id, monsoon);
  const fc = f.data?.fc;

  const history = useQuery({
    queryKey: ["programme_replans", project.id],
    enabled: Boolean(project.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("programme_replans")
        .select("*")
        .eq("project_id", project.id)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data ?? [];
    },
  });

  const runAi = useServerFn(suggestRecovery);
  const ai = useMutation({
    mutationFn: async () => {
      if (!fc || !f.data) throw new Error("No forecast yet");
      const pct = new Map(f.data.inputs.map((s) => [s.code, s.actualPct]));
      return runAi({
        data: {
          projectId: project.id,
          handover: {
            report: iso(fc.baselineHandover),
            plan: iso(fc.plannedHandover),
            forecast: iso(fc.forecastHandover),
            slipDays: fc.forecastHandover - fc.plannedHandover,
          },
          critical: fc.critical
            .filter((s) => s.state !== "done")
            .map((s) => ({
              code: s.code,
              name: stageName(s.name),
              start: iso(s.start),
              end: iso(s.end),
              slip: s.slip,
              driver: s.driver,
            })),
          late: fc.late.map((s) => ({
            code: s.code,
            name: stageName(s.name),
            slip: s.slip,
            driver: s.driver,
            pct: pct.get(s.code) ?? 0,
          })),
          materialHolds: fc.materialHolds.map((m) => ({
            code: m.code,
            what: m.what,
            arrives: iso(m.arrives),
          })),
        },
      });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const changes = useMemo(() => {
    if (!fc || !f.data) return [];
    return f.data.inputs
      .map((s) => {
        const x = fc.byCode.get(s.code);
        if (!x || x.state === "done") return null;
        const start = x.state === "waiting" ? iso(x.start) : s.plannedStart;
        const end = iso(x.end);
        if (start === s.plannedStart && end === s.plannedEnd) return null;
        return { stage: s, start, end };
      })
      .filter(Boolean) as {
      stage: (typeof f.data.inputs)[number];
      start: string | null;
      end: string | null;
    }[];
  }, [fc, f.data]);

  const toReport = useMemo(() => {
    if (!f.data || !fc) return [];
    return f.data.inputs
      .filter((s) => fc.byCode.get(s.code)?.state !== "done")
      .filter(
        (s) =>
          s.baselineStart &&
          s.baselineEnd &&
          (s.baselineStart !== s.plannedStart || s.baselineEnd !== s.plannedEnd),
      )
      .map((s) => ({
        stage: s,
        start: fc.byCode.get(s.code)?.state === "running" ? s.plannedStart : s.baselineStart!,
        end: s.baselineEnd!,
      }));
  }, [f.data, fc]);

  async function apply(kind: "forecast" | "report") {
    if (!fc) return;
    const list = kind === "forecast" ? changes : toReport;
    if (!list.length) {
      toast.info("Nothing to change");
      return;
    }
    setBusy(true);
    try {
      const moved = await writeStageDates(project.id, list);
      const after =
        kind === "forecast"
          ? fc.forecastHandover
          : Math.max(
              ...f.data!.inputs.map((s) => {
                const ch = list.find((c) => c.stage.code === s.code);
                return Date.parse(`${ch?.end ?? s.plannedEnd}T00:00:00Z`) / 86_400_000;
              }),
            );
      const log = await supabase.from("programme_replans").insert({
        project_id: project.id,
        applied_by: access?.userId ?? null,
        applied_by_name: access?.profile?.full_name || access?.email || "",
        handover_before: iso(fc.plannedHandover),
        handover_after: iso(after),
        stages_moved: moved,
        monsoon: kind === "forecast" && monsoon,
        reason: (kind === "report" ? "Back to the report's dates. " : "") + reason.trim(),
        summary: list.slice(0, 200).map((c) => ({
          code: c.stage.code,
          from: [c.stage.plannedStart, c.stage.plannedEnd],
          to: [c.start, c.end],
        })) as unknown as Json,
      });
      if (log.error) throw log.error;
      await supabase.from("notifications").insert({
        title: `Programme re-planned: handover ${fmtDay(iso(fc.plannedHandover))} → ${fmtDay(iso(after))}`,
        body: `${moved} stages moved${reason.trim() ? `: ${reason.trim()}` : ""}. Order-by dates moved with their stages.`,
        category: "Programme",
        priority: "High",
        link: "/replan",
        project_id: project.id,
        sender_id: access?.userId ?? null,
      });
      toast.success(`${moved} stages re-planned`);
      setReason("");
      for (const k of ["site_week", "forecast_extras", "programme_replans"])
        await qc.invalidateQueries({ queryKey: [k, project.id] });
    } catch (e) {
      toast.error((e as Error).message);
    }
    setBusy(false);
  }

  const rows: StageFc[] = !fc
    ? []
    : view === "late"
      ? fc.late
      : view === "critical"
        ? fc.critical
        : fc.stages;

  return (
    <Shell
      title="Programme Re-plan"
      subtitle="Forecast from site progress · critical path · recovery"
    >
      <div className="space-y-3">
        {f.isPending && <p className="text-sm text-muted-foreground">Working out the forecast…</p>}
        {f.error && <p className="text-sm text-destructive">{(f.error as Error).message}</p>}
        {!f.isPending && !fc && (
          <p className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
            No programme with dates yet. Import the construction control workbook in Import PMC
            Workbooks first.
          </p>
        )}
        {fc && (
          <>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
              <MetricTile label="Report handover" value={d(fc.baselineHandover)} />
              <MetricTile label="Current plan" value={d(fc.plannedHandover)} />
              <MetricTile
                label="Forecast handover"
                value={d(fc.forecastHandover)}
                delta={slipText(fc.forecastHandover - fc.plannedHandover) + " vs plan"}
                tone={fc.forecastHandover > fc.plannedHandover ? "bad" : "good"}
                icon={<CalendarClock className="size-4" />}
              />
              <MetricTile
                label="Stages late"
                value={String(fc.late.length)}
                tone={fc.late.length ? "warn" : "good"}
              />
              <MetricTile
                label="Material holding stages"
                value={String(new Set(fc.materialHolds.map((m) => m.code)).size)}
                tone={fc.materialHolds.length ? "bad" : "good"}
                icon={<TriangleAlert className="size-4" />}
              />
            </div>

            <div className="rounded-xl border border-border bg-card p-4 text-sm">
              <p className="text-muted-foreground">
                How the forecast works: finished stages keep their dates; running stages finish at
                the rate the site is achieving; a stage starts only after the stages before it
                finish, with the same gap the plan left (curing, de-shuttering, checks); material
                past its order-by date with no PO arrives after its lead time from today. Nothing is
                pulled earlier than planned.
              </p>
              <label className="mt-3 inline-flex items-center gap-2 font-semibold">
                <input
                  type="checkbox"
                  checked={monsoon}
                  onChange={(e) => setMonsoon(e.target.checked)}
                />
                <CloudRain className="size-4 text-primary" /> Monsoon allowance (outdoor stages
                mid-June to September take 20% longer)
              </label>
            </div>

            <Section
              title="Critical path (what decides handover)"
              action={
                <span className="text-xs text-muted-foreground">{fc.critical.length} stages</span>
              }
            >
              <div className="flex flex-wrap gap-1.5 p-3">
                {fc.critical.map((s) => (
                  <span
                    key={s.code}
                    title={`${stageName(s.name)} · ${d(s.start)} → ${d(s.end)} · ${s.driver}`}
                    className={cn(
                      "rounded border px-2 py-1 text-xs",
                      s.state === "done"
                        ? "border-border text-muted-foreground line-through"
                        : s.slip > 0
                          ? "border-destructive/40 bg-destructive/10 font-semibold text-destructive"
                          : "border-primary/40 bg-primary/10 font-semibold text-primary",
                    )}
                  >
                    {s.code}
                    {s.slip > 0 && s.state !== "done" ? ` +${s.slip}` : ""}
                  </span>
                ))}
              </div>
            </Section>

            <Section
              title="Recovery ideas (AI)"
              action={
                <button
                  type="button"
                  disabled={ai.isPending}
                  onClick={() => ai.mutate()}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground disabled:opacity-50"
                >
                  <Sparkles className="size-3.5" />
                  {ai.isPending ? "Thinking…" : ai.data ? "Ask again" : "Suggest how to recover"}
                </button>
              }
            >
              <div className="p-4 text-sm">
                {ai.data ? (
                  <p className="whitespace-pre-wrap leading-relaxed">{ai.data.text}</p>
                ) : (
                  <p className="text-muted-foreground">
                    The AI reads this forecast (critical path, late stages, material not ordered)
                    and suggests site actions: extra gangs, parallel fronts, orders to place today.
                    It never shortens curing or skips hold points. Nothing changes until you apply a
                    re-plan.
                  </p>
                )}
              </div>
            </Section>

            {fc.materialHolds.length > 0 && (
              <Section title="Material not ordered in time">
                <div className="divide-y divide-border">
                  {fc.materialHolds.slice(0, 30).map((m) => (
                    <div
                      key={`${m.code}|${m.what}`}
                      className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm"
                    >
                      <span>
                        <b>{m.code}</b> · {m.what}
                      </span>
                      <span className="flex items-center gap-3 text-xs">
                        <span className="text-muted-foreground">
                          arrives about {d(m.arrives)} if ordered today
                        </span>
                        <Link
                          to="/po-create"
                          search={{ stage: m.code }}
                          className="rounded bg-primary px-2 py-0.5 font-semibold text-primary-foreground"
                        >
                          Raise PO
                        </Link>
                      </span>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            <Section
              title="Stages: plan against forecast"
              action={
                <div className="flex gap-1">
                  {(
                    [
                      ["late", `Late (${fc.late.length})`],
                      ["critical", "Critical path"],
                      ["all", "All"],
                    ] as const
                  ).map(([k, l]) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setView(k)}
                      className={cn(
                        "rounded px-2 py-1 text-xs font-semibold",
                        view === k ? "bg-primary text-primary-foreground" : "border border-border",
                      )}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              }
            >
              {rows.length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground">
                  {view === "late" ? "No stage is forecast to finish late." : "No stages."}
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[900px] text-sm">
                    <thead className="bg-secondary/40 text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                      <tr>
                        <th className="px-3 py-2">Stage</th>
                        <th className="px-3 py-2">Plan</th>
                        <th className="px-3 py-2">Forecast</th>
                        <th className="px-3 py-2 text-right">vs plan</th>
                        <th className="px-3 py-2 text-right">vs report</th>
                        <th className="px-3 py-2">Why</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {rows.map((s) => (
                        <tr key={s.code} className={s.critical ? "bg-primary/5" : ""}>
                          <td className="px-3 py-2">
                            <b>{s.code}</b> {stageName(s.name)}
                            <p className="text-[11px] text-muted-foreground">
                              {s.group} · {s.state}
                              {s.critical ? " · critical" : ""}
                            </p>
                          </td>
                          <td className="whitespace-nowrap px-3 py-2">
                            {d(s.plannedStart)} → {d(s.plannedEnd)}
                          </td>
                          <td className="whitespace-nowrap px-3 py-2 font-semibold">
                            {d(s.start)} → {d(s.end)}
                          </td>
                          <td
                            className={cn(
                              "px-3 py-2 text-right tnum",
                              s.slip > 0 && "font-semibold text-destructive",
                            )}
                          >
                            {slipText(s.slip)}
                          </td>
                          <td className="px-3 py-2 text-right tnum text-muted-foreground">
                            {slipText(s.slipBaseline)}
                          </td>
                          <td className="px-3 py-2 text-xs">{s.driver}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Section>

            <Section title="Apply">
              <div className="space-y-3 p-4 text-sm">
                {isManager ? (
                  <>
                    <p className="text-muted-foreground">
                      Applying makes the forecast the plan: {changes.length} stages get new dates
                      and their material order-by dates move with them, so the Hub, orders and
                      payment requests follow. The report's dates stay as the baseline.
                    </p>
                    <input
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Reason (e.g. excavation slower, rock found; RMC strike)"
                      className="h-9 w-full rounded border border-border bg-background px-3"
                    />
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={busy || !changes.length}
                        onClick={() => void apply("forecast")}
                        className="rounded-lg bg-primary px-3 py-2 text-xs font-bold text-primary-foreground disabled:opacity-50"
                      >
                        Apply forecast as the plan ({changes.length} stages)
                      </button>
                      <button
                        type="button"
                        disabled={busy || !toReport.length}
                        onClick={() => void apply("report")}
                        className="rounded-lg border border-border px-3 py-2 text-xs font-bold disabled:opacity-50"
                      >
                        Back to the report's dates ({toReport.length})
                      </button>
                    </div>
                  </>
                ) : (
                  <p className="text-muted-foreground">
                    Only the admin or PM applies a re-plan. Send them the stages that are late.
                  </p>
                )}
              </div>
            </Section>

            <Section title="Re-plan history">
              {(history.data ?? []).length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground">
                  No re-plan applied yet: the plan is the report's programme.
                </p>
              ) : (
                <div className="divide-y divide-border text-sm">
                  {(history.data ?? []).map((h) => (
                    <div key={h.id} className="px-3 py-2">
                      <b>
                        {fmtDay(h.handover_before)} → {fmtDay(h.handover_after)}
                      </b>{" "}
                      · {h.stages_moved} stages{h.monsoon ? " · monsoon allowance" : ""}
                      <p className="text-xs text-muted-foreground">
                        {new Date(h.created_at).toLocaleString("en-IN")} · {h.applied_by_name}
                        {h.reason ? ` · ${h.reason}` : ""}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </Section>
          </>
        )}
      </div>
    </Shell>
  );
}
