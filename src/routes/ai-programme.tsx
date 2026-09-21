import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CalendarClock, Sparkles, Download, Gauge } from "lucide-react";
import { Shell } from "@/components/saha/Shell";
import { supabase } from "@/integrations/supabase/client";
import { generateProgramme, type ProgrammeTask } from "@/lib/programme.functions";
import { useSessionUser } from "@/lib/access";

export const Route = createFileRoute("/ai-programme")({
  head: () => ({
    meta: [
      { title: "AI Project Programme — Saha OS" },
      {
        name: "description",
        content:
          "Generate a realistic construction programme from your project inputs and BOQ: activity-wise durations, curing periods, parallel fronts and handover date.",
      },
      { property: "og:title", content: "AI Project Programme — Saha OS" },
      {
        property: "og:description",
        content: "Activity-wise construction schedule generated from your project and BOQ data.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function toNum(v: unknown) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function fmtDate(v: string) {
  if (!v) return "—";
  const d = new Date(`${v}T00:00:00Z`);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}

const inputClass =
  "rounded-xl border border-sky-500/40 bg-sky-500/5 px-3 py-2 text-sm text-foreground outline-none focus:border-sky-500";

function Page() {
  const [projectId, setProjectId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [floors, setFloors] = useState(5);
  const [fronts, setFronts] = useState(2);
  const [workingDays, setWorkingDays] = useState(6);
  const [holidays, setHolidays] = useState(12);
  const [buffer, setBuffer] = useState(14);
  const [nightWork, setNightWork] = useState(true);
  const [monsoon, setMonsoon] = useState(true);
  const [loadedFor, setLoadedFor] = useState("");
  const [status, setStatus] = useState("");
  const [result, setResult] = useState<{
    tasks: ProgrammeTask[];
    totalWorkingDays: number;
    totalCalendarDays: number;
    finishDate: string;
    requestedCalendarDays: number;
    feasible: boolean;
    boqLineItems: number;
  } | null>(null);

  const run = useServerFn(generateProgramme);

  const projectsQuery = useQuery({
    queryKey: ["site_projects", "ai-programme"],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_projects")
        .select(
          "id,name,location,start_date,target_handover_date,cellar_floors,stilt_floors,typical_floors,working_days_per_week,procurement_lead_days,total_built_up_sft",
        )
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const projects = projectsQuery.data ?? [];
  const activeId = projectId || projects[0]?.id || "";
  const project = projects.find((p) => p.id === activeId);

  useEffect(() => {
    if (!project || loadedFor === activeId) return;
    setStartDate(project.start_date ?? new Date().toISOString().slice(0, 10));
    setTargetDate(project.target_handover_date ?? "");
    setFloors(
      Math.max(
        1,
        toNum(project.cellar_floors) + toNum(project.stilt_floors) + toNum(project.typical_floors),
      ),
    );
    setWorkingDays(toNum(project.working_days_per_week) || 6);
    setBuffer(toNum(project.procurement_lead_days) || 14);
    setLoadedFor(activeId);
    setResult(null);
  }, [project, activeId, loadedFor]);

  const mutation = useMutation({
    mutationFn: async () =>
      run({
        data: {
          projectId: activeId,
          startDate,
          targetDate,
          floors,
          parallelFronts: fronts,
          workingDaysPerWeek: workingDays,
          holidaysPerYear: holidays,
          procurementBufferDays: buffer,
          nightWork,
          monsoonAllowance: monsoon,
        },
      }),
    onSuccess: (res) => {
      setResult(res);
      setStatus(
        `Programme ready — ${res.tasks.length} activities, ${res.totalCalendarDays} calendar days, handover ${fmtDate(res.finishDate)}.`,
      );
    },
    onError: (e: Error) => setStatus(`Programme generation failed: ${e.message}`),
  });

  const phases = useMemo(() => {
    const map = new Map<string, ProgrammeTask[]>();
    for (const t of result?.tasks ?? []) {
      const list = map.get(t.phase) ?? [];
      list.push(t);
      map.set(t.phase, list);
    }
    return [...map.entries()];
  }, [result]);

  const exportCsv = () => {
    if (!result) return;
    const header = "Phase,Activity,Start day,Duration (working days),Start,Finish,Crew,Depends on,Notes";
    const rows = result.tasks.map((t) =>
      [t.phase, t.activity, t.startDay, t.durationDays, t.startDate, t.endDate, t.crew, t.dependency, t.notes]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(","),
    );
    const url = URL.createObjectURL(
      new Blob([[header, ...rows].join("\n")], { type: "text/csv;charset=utf-8" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `${project?.name ?? "project"}-programme.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Shell title="AI Project Programme">
      <div className="space-y-6">
        <header className="space-y-2">
          <h1 className="flex items-center gap-3 text-2xl font-extrabold uppercase tracking-tight text-foreground sm:text-3xl">
            <CalendarClock className="h-7 w-7 text-primary" />
            AI Project Programme
          </h1>
          <p className="max-w-3xl text-sm text-muted-foreground">
            Reads your saved project details and BOQ, then plans the job activity by activity —
            curing periods, slab cycles, monsoon and night-work limits, procurement lead time and
            the number of work fronts you run.
          </p>
        </header>

        <div className="grid gap-4 rounded-2xl border border-border bg-card p-4 sm:p-5">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Project
            </span>
            <select
              value={activeId}
              onChange={(e) => {
                setProjectId(e.target.value);
                setLoadedFor("");
                setStatus("");
              }}
              className="min-w-[220px] rounded-xl border border-border bg-background px-3 py-2 text-sm"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.location ? `· ${p.location}` : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Project start date">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="Target handover date">
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="Floors">
              <input
                type="number"
                min={1}
                value={floors}
                onChange={(e) => setFloors(toNum(e.target.value))}
                className={inputClass}
              />
            </Field>
            <Field label="Parallel work fronts">
              <input
                type="number"
                min={1}
                value={fronts}
                onChange={(e) => setFronts(toNum(e.target.value))}
                className={inputClass}
              />
            </Field>
            <Field label="Working days / week">
              <input
                type="number"
                min={1}
                max={7}
                value={workingDays}
                onChange={(e) => setWorkingDays(toNum(e.target.value))}
                className={inputClass}
              />
            </Field>
            <Field label="Public holidays / year">
              <input
                type="number"
                min={0}
                value={holidays}
                onChange={(e) => setHolidays(toNum(e.target.value))}
                className={inputClass}
              />
            </Field>
            <Field label="Procurement buffer (days)">
              <input
                type="number"
                min={0}
                value={buffer}
                onChange={(e) => setBuffer(toNum(e.target.value))}
                className={inputClass}
              />
            </Field>
            <label className="flex items-center gap-3 self-end rounded-xl border border-border bg-background px-3 py-2 text-sm">
              <input
                type="checkbox"
                checked={nightWork}
                onChange={(e) => setNightWork(e.target.checked)}
              />
              Night work allowed
            </label>
            <label className="flex items-center gap-3 self-end rounded-xl border border-border bg-background px-3 py-2 text-sm">
              <input
                type="checkbox"
                checked={monsoon}
                onChange={(e) => setMonsoon(e.target.checked)}
              />
              Monsoon allowance
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => mutation.mutate()}
              disabled={!activeId || mutation.isPending}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
            >
              <Sparkles className="h-4 w-4" />
              {mutation.isPending ? "Planning…" : "Generate AI Programme"}
            </button>
            {result ? (
              <button
                type="button"
                onClick={exportCsv}
                className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-semibold text-foreground"
              >
                <Download className="h-4 w-4" />
                Export programme
              </button>
            ) : null}
            {projects.length === 0 ? (
              <span className="text-sm text-muted-foreground">Add a project first.</span>
            ) : null}
          </div>

          {status ? (
            <p className="rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-foreground">
              {status}
            </p>
          ) : null}
        </div>

        {result ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: "Activities planned", value: String(result.tasks.length) },
                { label: "Working days", value: String(result.totalWorkingDays) },
                { label: "Calendar days", value: String(result.totalCalendarDays) },
                { label: "Projected handover", value: fmtDate(result.finishDate) },
              ].map((c) => (
                <div
                  key={c.label}
                  className="rounded-2xl border border-emerald-600/30 bg-emerald-600/5 p-4"
                >
                  <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
                    {c.label}
                  </p>
                  <p className="mt-1 text-xl font-bold text-foreground">{c.value}</p>
                </div>
              ))}
            </div>

            <div
              className={`flex items-start gap-3 rounded-2xl border p-4 text-sm ${
                result.feasible
                  ? "border-emerald-600/30 bg-emerald-600/5 text-foreground"
                  : "border-amber-500/40 bg-amber-500/10 text-foreground"
              }`}
            >
              <Gauge className="mt-0.5 h-5 w-5 text-primary" />
              <p>
                {result.requestedCalendarDays > 0
                  ? result.feasible
                    ? `Your target of ${result.requestedCalendarDays} calendar days is achievable with these inputs — the plan finishes in ${result.totalCalendarDays} days.`
                    : `Your target of ${result.requestedCalendarDays} calendar days is not realistic with these inputs — the plan needs ${result.totalCalendarDays} days. Add work fronts, allow night work, or move the handover date.`
                  : `Plan runs ${result.totalCalendarDays} calendar days from the start date. Set a target handover date to check it against your deadline.`}
                {result.boqLineItems === 0
                  ? " Note: no BOQ items saved for this project yet, so scope was assumed — generate the BOQ for a sharper plan."
                  : ` Based on ${result.boqLineItems} BOQ line items.`}
              </p>
            </div>

            {phases.map(([phase, tasks]) => (
              <div key={phase} className="overflow-hidden rounded-2xl border border-border bg-card">
                <div className="flex items-center justify-between border-b border-border bg-muted/40 px-4 py-3">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-primary">
                    {phase}
                  </h2>
                  <span className="text-xs text-muted-foreground">{tasks.length} activities</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[820px] text-sm">
                    <thead>
                      <tr className="border-b border-border text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        <th className="px-4 py-2">Activity</th>
                        <th className="px-4 py-2">Start</th>
                        <th className="px-4 py-2">Finish</th>
                        <th className="px-4 py-2">Days</th>
                        <th className="px-4 py-2">Crew</th>
                        <th className="px-4 py-2">Depends on</th>
                        <th className="px-4 py-2">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tasks.map((t, i) => (
                        <tr key={`${t.activity}-${i}`} className="border-b border-border/60">
                          <td className="px-4 py-2 font-medium text-foreground">{t.activity}</td>
                          <td className="px-4 py-2 whitespace-nowrap">{fmtDate(t.startDate)}</td>
                          <td className="px-4 py-2 whitespace-nowrap">{fmtDate(t.endDate)}</td>
                          <td className="px-4 py-2">{t.durationDays}</td>
                          <td className="px-4 py-2">{t.crew || "—"}</td>
                          <td className="px-4 py-2">{t.dependency || "—"}</td>
                          <td className="px-4 py-2 text-muted-foreground">{t.notes || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </>
        ) : null}
      </div>
    </Shell>
  );
}
