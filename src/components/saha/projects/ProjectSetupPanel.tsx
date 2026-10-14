import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Calculator, Pencil } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useActiveProject } from "@/hooks/useActiveProject";
import { ProgrammeFlow } from "@/components/saha/ProgrammeFlow";
import { useSiteWeek } from "@/lib/site-week";
import { fmtDay } from "@/lib/programme-progress";

export type SetupProject = {
  id: string;
  name: string;
  location: string;
  single_floor_slab_sft: number;
  cellar_floors: number;
  stilt_floors: number;
  typical_floors: number;
  total_built_up_sft: number;
  total_slab_sft: number;
  steel_grade?: string | null;
  [key: string]: unknown;
};

/**
 * Setup & programme for one project (was the separate Projects & Setup page): floor geometry
 * and the civil quantities it gives, steel and RMC from the stage ledger, the stage summary and
 * the construction flow. Geometry is edited in ONE place: the project form (onEditGeometry).
 */
export function ProjectSetupPanel({
  projects,
  onEditGeometry,
}: {
  projects: SetupProject[];
  onEditGeometry: (projectId: string) => void;
}) {
  const globalProject = useActiveProject();
  const [selectedId, setSelectedId] = useState("");
  const project =
    projects.find((p) => p.id === selectedId) ??
    projects.find((p) => p.id === globalProject.id) ??
    projects[0];

  useEffect(() => {
    if (project && !selectedId) setSelectedId(project.id);
  }, [project, selectedId]);

  const n = (v: unknown) => Math.max(0, Number(v ?? 0) || 0);
  const slabSft = n(project?.single_floor_slab_sft);
  const cellar = n(project?.cellar_floors);
  const stilt = n(project?.stilt_floors);
  const typical = n(project?.typical_floors);
  const totalFloors = cellar + stilt + typical;
  const slabCount = totalFloors;
  // Stored areas (set from the PMC report) win over the simple geometry product.
  const builtupArea = n(project?.total_built_up_sft) || typical * slabSft;
  const castingArea = n(project?.total_slab_sft) || slabCount * slabSft;

  // Concrete and steel from the report (stage ledger RMC and the steel order schedule);
  // the rules of thumb only when a project has no imported programme yet.
  const stageWeek = useSiteWeek(project?.id ?? "");
  const stageList = useMemo(() => stageWeek.data?.stages ?? [], [stageWeek.data]);
  const fromReport = useMemo(() => {
    if (!stageList.length) return null;
    let rmc = 0;
    let steelKg = 0;
    for (const s of stageList) {
      for (const m of s.materials)
        if (m.unit === "m³" && /rmc|ready-mix/i.test(m.material)) rmc += Number(m.qty) || 0;
      steelKg += Number(s.steel?.totalKg ?? 0);
    }
    return { rmc: Math.round(rmc), steelT: Math.round(steelKg / 100) / 10 };
  }, [stageList]);
  const concreteVolume = fromReport?.rmc ?? Math.round(castingArea * 0.035);
  const steelRatio = Number(project?.["steel_ratio_kg_per_sft"] ?? 0);
  const rebarWeight =
    fromReport?.steelT ??
    (steelRatio > 0 ? Math.round((castingArea * steelRatio) / 100) / 10 : null);
  const concreteGrade = String(project?.["concrete_grade"] ?? "") || "grade not set";

  const stageGroups = useMemo(() => {
    const m = new Map<
      string,
      { count: number; closed: number; start: string | null; end: string | null }
    >();
    for (const s of stageList) {
      const g = m.get(s.group) ?? { count: 0, closed: 0, start: null, end: null };
      g.count += 1;
      if (s.closedAt || s.actualPct >= 100) g.closed += 1;
      if (s.plannedStart && (!g.start || s.plannedStart < g.start)) g.start = s.plannedStart;
      if (s.plannedEnd && (!g.end || s.plannedEnd > g.end)) g.end = s.plannedEnd;
      m.set(s.group, g);
    }
    return [...m.entries()];
  }, [stageList]);
  const closedStages = stageGroups.reduce((sum, [, g]) => sum + g.closed, 0);

  const { data: flatCount = null } = useQuery({
    queryKey: ["flats", "count", project?.id ?? ""],
    enabled: Boolean(project?.id),
    queryFn: async () => {
      const { count, error } = await supabase
        .from("flats")
        .select("id", { count: "exact", head: true })
        .eq("project_id", project!.id);
      if (error) throw error;
      return count ?? 0;
    },
  });

  if (!project)
    return (
      <p className="text-sm text-muted-foreground">
        No projects yet — use “New project” to add your first site.
      </p>
    );

  return (
    <div className="flex flex-col gap-4">
      <section className="panel p-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <label className="flex flex-col gap-1 text-sm">
            <span className="label-caps text-muted-foreground">Project</span>
            <select
              value={project.id}
              onChange={(e) => setSelectedId(e.target.value)}
              className="h-9 min-w-[240px] rounded border border-input bg-card px-2 text-sm"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {p.location || "Location pending"}
                </option>
              ))}
            </select>
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onEditGeometry(project.id)}
              className="inline-flex h-8 items-center gap-1.5 rounded border border-input bg-card px-3 text-[13px] font-medium hover:bg-secondary"
            >
              <Pencil className="size-3.5" /> Edit geometry
            </button>
            <Link
              to="/boq-engine"
              className="inline-flex h-8 items-center gap-1.5 rounded bg-primary px-3 text-[13px] font-medium text-primary-foreground hover:opacity-90"
            >
              <Calculator className="size-3.5" /> Open the BOQ Engine
            </Link>
          </div>
        </div>

        <h2 className="mt-4 text-sm font-semibold tracking-tight">
          Floor geometry & civil quantities
        </h2>
        <p className="text-xs text-muted-foreground">
          Geometry is edited in the project form (Edit geometry). Quantities below follow from it;
          RMC and steel come from the imported programme when there is one.
        </p>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <Metric label="Single-floor slab" value={`${slabSft.toLocaleString("en-IN")} sft`} />
          <Metric
            label="Floors"
            value={String(totalFloors)}
            note={`${cellar ? `${cellar} cellar + ` : ""}${stilt} stilt + ${typical} typical`}
          />
          <Metric label="Slabs" value={String(slabCount)} />
          <Metric label="Built-up area" value={`${builtupArea.toLocaleString("en-IN")} sft`} />
          <Metric label="Slab casting area" value={`${castingArea.toLocaleString("en-IN")} sft`} />
          <Metric
            label={fromReport ? "RMC (programme)" : "RMC (estimate)"}
            value={`${fromReport ? "" : "~"}${concreteVolume} m³`}
            note={fromReport ? `Stage ledger · ${concreteGrade}` : "0.035 m³/sft until imported"}
          />
          <Metric
            label="TMT steel to order"
            value={rebarWeight == null ? "—" : `${fromReport ? "" : "~"}${rebarWeight} MT`}
            note={
              fromReport
                ? `Steel order schedule · ${project.steel_grade ?? ""}`
                : steelRatio > 0
                  ? `${steelRatio} kg/sft × casting area`
                  : "Set the steel ratio or import the programme"
            }
          />
        </div>
      </section>

      <section className="panel p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold tracking-tight">Programme stages</h2>
          <span className="text-xs font-semibold text-primary">
            {stageWeek.isPending
              ? "Loading…"
              : `${stageList.length} stage${stageList.length === 1 ? "" : "s"} · ${closedStages} done`}
            {flatCount != null && ` · ${flatCount} flat${flatCount === 1 ? "" : "s"}`}
          </span>
        </div>
        {stageGroups.length === 0 && !stageWeek.isPending ? (
          <p className="mt-2 text-sm text-muted-foreground">
            No programme imported yet.{" "}
            <Link to="/project-import" className="text-primary underline">
              Import the PMC workbooks
            </Link>{" "}
            to load the stages.
          </p>
        ) : (
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
            {stageGroups.map(([name, g]) => (
              <div key={name} className="flex flex-col gap-0.5 rounded bg-secondary/60 p-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-medium">{name}</span>
                  <span className="shrink-0 text-xs font-bold text-primary">
                    {g.closed}/{g.count}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {fmtDay(g.start)} → {fmtDay(g.end)}
                </span>
              </div>
            ))}
          </div>
        )}
        {stageList.length > 0 && (
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Stages closed</span>
              <span className="font-bold text-primary">
                {Math.round((closedStages / stageList.length) * 100)}%
              </span>
            </div>
            <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full bg-primary"
                style={{ width: `${(closedStages / stageList.length) * 100}%` }}
              />
            </div>
          </div>
        )}
      </section>

      <section className="flex flex-col gap-2">
        <div>
          <h2 className="text-sm font-semibold tracking-tight">
            Construction flow · material and directions for each step
          </h2>
          <p className="text-xs text-muted-foreground">
            From the PMC Construction Control workbook: every stage in order, what it needs, how to
            do it and what must be signed before the next step.
          </p>
        </div>
        <ProgrammeFlow projectId={project.id} />
      </section>
    </div>
  );
}

function Metric({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="rounded border border-border bg-card p-2.5">
      <p className="label-caps text-muted-foreground">{label}</p>
      <p className="mt-1 text-base font-semibold tnum">{value}</p>
      {note && <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{note}</p>}
    </div>
  );
}
