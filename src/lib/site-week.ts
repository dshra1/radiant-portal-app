/**
 * The site plan for "this week": which programme stages are on now, what
 * comes next, what must be ordered, which hold points are due and which
 * finished stages still need their close-out evidence. Every module (Action
 * Centre, Command Dashboard, Field Console, Inventory, Purchases, QA, Tasks)
 * reads the same plan, so they all follow the stage the site is on.
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DAY, arr, n, toDay, todayDay } from "@/lib/programme-progress";

export type StageCheck = {
  id: string;
  check: string;
  point: string;
  criterion?: string;
  method?: string;
  by?: string;
  record?: string;
  reference?: string;
};
export type StageMaterial = { material: string; unit: string; qty: number; orderBy: string | null };
export type StageSteel = {
  orderBy: string | null;
  totalKg: number;
  bindingWireKg: number;
  coverBlocks: number;
  bars: { dia: number; netKg: number; bars: number; orderKg: number }[];
};
export type CheckResult = {
  result: "OK" | "NOT OK";
  by: string;
  on: string;
  inspectionId?: string;
};
export type Evidence = { checks?: Record<string, CheckResult> };

export type PlanStage = {
  id: string;
  code: string;
  name: string;
  sort: number;
  group: string;
  floor: string;
  durationDays: number;
  preds: string[];
  checks: StageCheck[];
  holdPoint: boolean;
  materials: StageMaterial[];
  steel: StageSteel | null;
  directions: { title: string; steps: string[] }[];
  plannedStart: string | null;
  plannedEnd: string | null;
  actualPct: number;
  status: string;
  evidence: Evidence;
  closedAt: string | null;
};

export type OrderItem = {
  code: string;
  stage: string;
  what: string;
  qty: number;
  unit: string;
  orderBy: string;
  overdue: boolean;
  steel?: boolean;
};

export type PreStartItem = { item: string; neededBy: string | null; owner: string; why: string };

export type SiteWeek = {
  today: number;
  /** First day of the window: today, or the ground-work start if the site has not started. */
  anchor: number;
  beforeStart: boolean;
  daysToStart: number;
  startDate: string | null;
  handover: string | null;
  now: PlanStage[];
  behind: PlanStage[];
  next: PlanStage[];
  awaitingCloseout: PlanStage[];
  orders: OrderItem[];
  holds: { stage: PlanStage; check: StageCheck }[];
  preStart: PreStartItem[];
  stages: PlanStage[];
};

const STAGE_COLUMNS =
  "id,code,name,sort,stage_group,floor,duration_days,preds,checks,hold_point,materials,steel,directions,planned_start,planned_end,actual_pct,status,evidence,closed_at";

export function stageName(name: string) {
  return name.replace(/^[A-Z]{1,3}\d{0,3} · /, "");
}

export function isClosed(s: Pick<PlanStage, "closedAt">) {
  return Boolean(s.closedAt);
}

export function buildWeek(
  stages: PlanStage[],
  notes: { beforeStart?: PreStartItem[] },
  startDate: string | null,
  handover: string | null,
  today = todayDay(),
): SiteWeek {
  const starts = stages.map((s) => toDay(s.plannedStart)).filter(Number.isFinite);
  const first = Number.isFinite(toDay(startDate)) ? toDay(startDate) : Math.min(...starts);
  const beforeStart = Number.isFinite(first) && today < first;
  const anchor = beforeStart ? first : today;
  const end = anchor + 6;

  const open = stages.filter((s) => !isClosed(s) && s.actualPct < 100);
  const now = open.filter(
    (s) =>
      (s.actualPct > 0 && s.actualPct < 100) ||
      (toDay(s.plannedStart) <= end && toDay(s.plannedEnd) >= anchor),
  );
  const nowIds = new Set(now.map((s) => s.id));
  const behind = open.filter((s) => toDay(s.plannedEnd) < today && !nowIds.has(s.id));
  const next = open
    .filter(
      (s) =>
        !nowIds.has(s.id) && toDay(s.plannedStart) > end && toDay(s.plannedStart) <= anchor + 35,
    )
    .sort((a, b) => toDay(a.plannedStart) - toDay(b.plannedStart))
    .slice(0, 10);
  const awaitingCloseout = stages.filter((s) => !isClosed(s) && s.actualPct >= 100);

  const orders: OrderItem[] = [];
  for (const s of open) {
    for (const m of s.materials) {
      if (!m.orderBy || toDay(m.orderBy) > anchor + 14) continue;
      orders.push({
        code: s.code,
        stage: stageName(s.name),
        what: m.material,
        qty: m.qty,
        unit: m.unit,
        orderBy: m.orderBy,
        overdue: toDay(m.orderBy) < today,
      });
    }
    if (s.steel?.orderBy && toDay(s.steel.orderBy) <= anchor + 14) {
      orders.push({
        code: s.code,
        stage: stageName(s.name),
        what: `TMT steel, all bar sizes (${s.steel.bars.map((b) => `${b.dia} mm ${b.orderKg} kg`).join(", ")}), binding wire ${s.steel.bindingWireKg} kg, cover blocks ${s.steel.coverBlocks}`,
        qty: Math.round(s.steel.totalKg),
        unit: "kg",
        orderBy: s.steel.orderBy,
        overdue: toDay(s.steel.orderBy) < today,
        steel: true,
      });
    }
  }
  orders.sort((a, b) => toDay(a.orderBy) - toDay(b.orderBy));

  const holds = now.flatMap((s) =>
    s.checks
      .filter((c) => c.point === "H" && s.evidence.checks?.[c.id]?.result !== "OK")
      .map((c) => ({ stage: s, check: c })),
  );

  const preStart = (notes.beforeStart ?? []).filter(
    (p) => !p.neededBy || toDay(p.neededBy) <= anchor + 30,
  );

  return {
    today,
    anchor,
    beforeStart,
    daysToStart: beforeStart ? first - today : 0,
    startDate,
    handover,
    now,
    behind,
    next,
    awaitingCloseout,
    orders,
    holds,
    preStart: beforeStart ? preStart : [],
    stages,
  };
}

export function useSiteWeek(projectId: string) {
  return useQuery({
    queryKey: ["site_week", projectId],
    enabled: Boolean(projectId),
    staleTime: 60_000,
    queryFn: async (): Promise<SiteWeek> => {
      const st = await supabase
        .from("site_stages")
        .select(STAGE_COLUMNS)
        .eq("project_id", projectId)
        .order("sort", { ascending: true });
      if (st.error) throw st.error;
      const pr = await supabase
        .from("site_projects")
        .select("control_notes,start_date,target_handover_date")
        .eq("id", projectId)
        .maybeSingle();
      if (pr.error) throw pr.error;
      const stages: PlanStage[] = (st.data ?? [])
        .filter((s) => s.code)
        .map((s) => ({
          id: s.id,
          code: s.code,
          name: s.name ?? "",
          sort: n(s.sort),
          group: s.stage_group || "Other",
          floor: s.floor ?? "",
          durationDays: n(s.duration_days),
          preds: arr<string>(s.preds),
          checks: arr<StageCheck>(s.checks),
          holdPoint: Boolean(s.hold_point),
          materials: arr<StageMaterial>(s.materials),
          steel: (s.steel as StageSteel | null) ?? null,
          directions: arr<{ title: string; steps: string[] }>(s.directions),
          plannedStart: s.planned_start,
          plannedEnd: s.planned_end,
          actualPct: n(s.actual_pct),
          status: s.status ?? "",
          evidence: ((s.evidence ?? {}) as Evidence) || {},
          closedAt: s.closed_at ?? null,
        }));
      const notes = (pr.data?.control_notes ?? {}) as { beforeStart?: PreStartItem[] };
      return buildWeek(
        stages,
        notes,
        pr.data?.start_date ?? null,
        pr.data?.target_handover_date ?? null,
      );
    },
  });
}

/** Stages that follow a given stage (it is one of their predecessors). */
export function successorsOf(stages: PlanStage[], code: string) {
  return stages.filter((s) => s.preds.includes(code) && !isClosed(s));
}

export const dayIso = (d: number) => new Date(d * DAY).toISOString().slice(0, 10);

/** The task text a field team gets for a stage: directions, checks, material. */
export function stageInstructions(s: PlanStage) {
  const lines: string[] = [];
  lines.push(`[${s.code}] ${stageName(s.name)}${s.floor ? ` · ${s.floor}` : ""}`);
  lines.push(
    `Planned ${s.plannedStart ?? "?"} → ${s.plannedEnd ?? "?"} (${s.durationDays} working days)`,
  );
  if (s.preds.length) lines.push(`Starts after: ${s.preds.join(", ")}`);
  for (const d of s.directions) {
    lines.push("", `How to do it: ${d.title}`);
    for (const step of d.steps) lines.push(`• ${step}`);
  }
  if (s.checks.length) {
    lines.push("", "Checks before sign-off:");
    for (const c of s.checks)
      lines.push(
        `• ${c.point === "H" ? "HOLD" : c.point === "W" ? "WITNESS" : "RECORD"} ${c.id} ${c.check}${c.criterion ? `: ${c.criterion}` : ""}${c.by ? ` (signs: ${c.by})` : ""}`,
      );
  }
  if (s.materials.length) {
    lines.push("", "Material for this stage:");
    for (const m of s.materials.slice(0, 25))
      lines.push(`• ${m.material}: ${m.qty.toLocaleString("en-IN")} ${m.unit}`);
    if (s.materials.length > 25)
      lines.push(`• … ${s.materials.length - 25} more (Site Execution → stage)`);
  }
  lines.push(
    "",
    "Close-out: photos, check results and approvals in Site Execution before the next stage.",
  );
  return lines.join("\n");
}
