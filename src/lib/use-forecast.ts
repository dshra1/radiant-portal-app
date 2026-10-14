import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Json } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";
import { loadOrderedMaterial, useSiteWeek, type PlanStage } from "@/lib/site-week";
import {
  dayToIso,
  forecastProgramme,
  shiftIso,
  type Forecast,
  type ForecastInput,
} from "@/lib/programme-forecast";
import { toDay } from "@/lib/programme-progress";

/** Actual and baseline dates per stage, material on POs, the contract handover. */
function useForecastExtras(projectId: string) {
  return useQuery({
    queryKey: ["forecast_extras", projectId],
    enabled: Boolean(projectId),
    staleTime: 60_000,
    queryFn: async () => {
      const [st, pr, ordered] = await Promise.all([
        supabase
          .from("site_stages")
          .select("code,actual_start,actual_end,baseline_start,baseline_end")
          .eq("project_id", projectId),
        supabase
          .from("site_projects")
          .select("target_handover_date")
          .eq("id", projectId)
          .maybeSingle(),
        loadOrderedMaterial(projectId),
      ]);
      if (st.error) throw st.error;
      return {
        dates: new Map((st.data ?? []).map((s) => [s.code, s])),
        target: pr.data?.target_handover_date ?? null,
        ordered: new Set(ordered.keys()),
      };
    },
  });
}

export function useProgrammeForecast(projectId: string, monsoon = false) {
  const week = useSiteWeek(projectId);
  const extras = useForecastExtras(projectId);
  const data = useMemo<{ fc: Forecast; inputs: ForecastInput[] } | null>(() => {
    if (!week.data || !extras.data) return null;
    const inputs: ForecastInput[] = week.data.stages.map((s) => {
      const d = extras.data.dates.get(s.code);
      return {
        ...s,
        actualStart: d?.actual_start ?? null,
        actualEnd: d?.actual_end ?? null,
        baselineStart: d?.baseline_start ?? s.plannedStart,
        baselineEnd: d?.baseline_end ?? s.plannedEnd,
      };
    });
    if (!inputs.some((s) => s.plannedStart)) return null;
    return {
      inputs,
      fc: forecastProgramme(inputs, {
        monsoon,
        ordered: extras.data.ordered,
        targetHandover: extras.data.target,
      }),
    };
  }, [week.data, extras.data, monsoon]);
  return {
    isPending: week.isPending || extras.isPending,
    error: week.error ?? extras.error,
    data,
  };
}

/** New planned dates for one stage, with its order-by dates moved by the same days. */
export function datesPatch(s: PlanStage, start: string | null, end: string | null) {
  const delta = start && s.plannedStart ? toDay(start) - toDay(s.plannedStart) : 0;
  const patch: {
    planned_start?: string | null;
    planned_end?: string | null;
    materials?: Json;
    steel?: Json;
  } = {};
  if (start && start !== s.plannedStart) patch.planned_start = start;
  if (end && end !== s.plannedEnd) patch.planned_end = end;
  if (delta) {
    patch.materials = s.materials.map((m) => ({
      ...m,
      orderBy: shiftIso(m.orderBy, delta),
    })) as unknown as Json;
    if (s.steel) patch.steel = { ...s.steel, orderBy: shiftIso(s.steel.orderBy, delta) } as Json;
  }
  return patch;
}

/** Writes a set of stage date changes. */
export async function writeStageDates(
  projectId: string,
  changes: { stage: PlanStage; start: string | null; end: string | null }[],
) {
  let moved = 0;
  for (let i = 0; i < changes.length; i += 8) {
    const part = changes.slice(i, i + 8);
    const res = await Promise.all(
      part.map(({ stage, start, end }) => {
        const patch = datesPatch(stage, start, end);
        if (!Object.keys(patch).length) return Promise.resolve({ error: null, skipped: true });
        return supabase
          .from("site_stages")
          .update(patch)
          .eq("project_id", projectId)
          .eq("id", stage.id)
          .then((r) => ({ error: r.error, skipped: false }));
      }),
    );
    for (const r of res) {
      if (r.error) throw r.error;
      if (!r.skipped) moved++;
    }
  }
  return moved;
}

export const iso = dayToIso;
