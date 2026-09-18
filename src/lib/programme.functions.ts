import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { streamText } from "ai";

export type ProgrammeTask = {
  phase: string;
  activity: string;
  startDay: number;
  durationDays: number;
  startDate: string;
  endDate: string;
  crew: string;
  dependency: string;
  notes: string;
};

export type ProgrammeInput = {
  projectId: string;
  startDate: string;
  targetDate: string;
  floors: number;
  parallelFronts: number;
  workingDaysPerWeek: number;
  holidaysPerYear: number;
  procurementBufferDays: number;
  nightWork: boolean;
  monsoonAllowance: boolean;
};

function toNum(v: unknown) {
  const n = Number(String(v ?? "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function extractJsonArray(text: string): Record<string, unknown>[] {
  const cleaned = text.replace(/```json/gi, "```").split("```").join("\n");
  const start = cleaned.indexOf("[");
  if (start === -1) return [];
  let depth = 0;
  let end = -1;
  let inStr = false;
  for (let i = start; i < cleaned.length; i++) {
    const ch = cleaned[i];
    if (inStr) {
      if (ch === "\\") i++;
      else if (ch === '"') inStr = false;
      continue;
    }
    if (ch === '"') inStr = true;
    else if (ch === "[") depth++;
    else if (ch === "]") {
      depth--;
      if (depth === 0) {
        end = i;
        break;
      }
    }
  }
  const slice = end === -1 ? cleaned.slice(start) : cleaned.slice(start, end + 1);
  const attempts = [slice, slice.replace(/,\s*$/, "") + "]", slice.replace(/,[^,]*$/, "") + "]"];
  for (const attempt of attempts) {
    try {
      const parsed = JSON.parse(attempt);
      if (Array.isArray(parsed)) return parsed as Record<string, unknown>[];
    } catch {
      /* try next repair */
    }
  }
  return [];
}

function addWorkingDays(start: Date, offsetDays: number, workingDaysPerWeek: number) {
  // offsetDays are programme (working) days; convert to calendar days.
  const perWeek = Math.max(1, Math.min(7, workingDaysPerWeek || 6));
  const calendar = Math.round((offsetDays * 7) / perWeek);
  const d = new Date(start.getTime());
  d.setDate(d.getDate() + calendar);
  return d;
}

function iso(d: Date) {
  return d.toISOString().slice(0, 10);
}

export const generateProgramme = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: ProgrammeInput) => input)
  .handler(async ({ data, context }) => {
    const { supabase } = context;

    const { data: project, error } = await supabase
      .from("site_projects")
      .select("*")
      .eq("id", data.projectId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!project) throw new Error("Project not found");

    const { data: boq, error: boqError } = await supabase
      .from("boq_items")
      .select("stage,description,unit,quantity,rate")
      .eq("project_id", data.projectId);
    if (boqError) throw new Error(boqError.message);

    const items = boq ?? [];
    const tradeTotals = new Map<string, { amount: number; items: number }>();
    for (const it of items) {
      const key = String(it.stage ?? "Misc");
      const prev = tradeTotals.get(key) ?? { amount: 0, items: 0 };
      tradeTotals.set(key, {
        amount: prev.amount + toNum(it.quantity) * toNum(it.rate),
        items: prev.items + 1,
      });
    }
    const boqSummary = [...tradeTotals.entries()]
      .sort((a, b) => b[1].amount - a[1].amount)
      .map(([trade, v]) => `${trade}: ₹${Math.round(v.amount)} across ${v.items} items`)
      .join("; ");

    const key = process.env["GOOGLE_GENERATIVE_AI_API_KEY"];
    if (!key) throw new Error("AI is not configured for this workspace");

    const { createAiProvider, SAHA_MODEL } = await import("@/lib/ai-gateway.server");
    const gateway = createAiProvider(key);
    const model = gateway(SAHA_MODEL);

    const start = new Date(`${data.startDate || iso(new Date())}T00:00:00Z`);
    const target = data.targetDate ? new Date(`${data.targetDate}T00:00:00Z`) : null;
    const requestedCalendarDays = target
      ? Math.max(0, Math.round((target.getTime() - start.getTime()) / 86400000))
      : 0;

    const brief = {
      name: project.name,
      location: project.location,
      type: project.type,
      totalBuiltUpSft: project.total_built_up_sft,
      totalSlabSft: project.total_slab_sft,
      singleFloorSlabSft: project.single_floor_slab_sft,
      cellarFloors: project.cellar_floors,
      stiltFloors: project.stilt_floors,
      typicalFloors: project.typical_floors,
      floorsRequested: data.floors,
      concreteGrade: project.concrete_grade,
      steelGrade: project.steel_grade,
      blockwork: project.blockwork_type,
      finishingSpec: project.finishing_spec,
      contractType: project.contract_type,
      engineers: project.engineers_count,
      labour: project.labour_count,
      slabCycleDays: project.slab_cycle_days,
      finishingDaysPerFloor: project.finishing_days_per_floor,
      procurementLeadDays: project.procurement_lead_days,
      boqTrades: boqSummary || "BOQ not generated yet — assume standard trade scope",
      boqLineItems: items.length,
      constraints: {
        startDate: data.startDate,
        targetDate: data.targetDate,
        requestedCalendarDays,
        parallelFronts: data.parallelFronts,
        workingDaysPerWeek: data.workingDaysPerWeek,
        holidaysPerYear: data.holidaysPerYear,
        procurementBufferDays: data.procurementBufferDays,
        nightWorkAllowed: data.nightWork,
        monsoonAllowance: data.monsoonAllowance,
      },
    };

    const result = streamText({
      model,
      system: [
        "You are a senior Indian construction planning engineer preparing a realistic construction programme for a Hyderabad building project.",
        "Return ONLY a JSON array — no prose, no markdown fences. Each element must be an object with exactly these keys:",
        '{"phase":string,"activity":string,"startDay":number,"durationDays":number,"crew":string,"dependency":string,"notes":string}',
        "startDay is the working-day offset from day 1 of the programme (integer). durationDays is in working days (integer).",
        "Respect IS 456 curing and de-shuttering periods, slab cycle times, monsoon and night-work constraints, procurement lead time and the parallel work fronts given.",
        "Cover the whole job: mobilisation & site setup, excavation, footings, cellar/retaining, columns and slabs floor by floor, blockwork, plastering, waterproofing, plumbing and electrical rough-in, flooring & tiling, doors/windows, painting, external development, services, testing, snagging and handover.",
        "Give 25-45 activities. Be honest: if the requested target date is not achievable, still plan realistically and say so in the notes of the handover activity.",
      ].join("\n"),
      prompt: [
        `PROJECT + CONSTRAINTS (JSON): ${JSON.stringify(brief)}`,
        "Respond with the JSON array only.",
      ].join("\n\n"),
    });

    const text = await result.text;
    const raw = extractJsonArray(text);

    const tasks: ProgrammeTask[] = raw
      .map((r) => {
        const startDay = Math.max(1, Math.round(toNum(r["startDay"]) || 1));
        const durationDays = Math.max(1, Math.round(toNum(r["durationDays"]) || 1));
        const s = addWorkingDays(start, startDay - 1, data.workingDaysPerWeek);
        const e = addWorkingDays(start, startDay - 1 + durationDays, data.workingDaysPerWeek);
        return {
          phase: String(r["phase"] ?? "").trim() || "General",
          activity: String(r["activity"] ?? "").trim(),
          startDay,
          durationDays,
          startDate: iso(s),
          endDate: iso(e),
          crew: String(r["crew"] ?? "").trim(),
          dependency: String(r["dependency"] ?? "").trim(),
          notes: String(r["notes"] ?? "").trim(),
        };
      })
      .filter((t) => t.activity !== "")
      .sort((a, b) => a.startDay - b.startDay);

    if (tasks.length === 0) throw new Error("AI returned no usable programme activities");

    const totalWorkingDays = tasks.reduce(
      (max, t) => Math.max(max, t.startDay - 1 + t.durationDays),
      0,
    );
    const finish = addWorkingDays(start, totalWorkingDays, data.workingDaysPerWeek);
    const totalCalendarDays = Math.round((finish.getTime() - start.getTime()) / 86400000);

    return {
      tasks,
      totalWorkingDays,
      totalCalendarDays,
      finishDate: iso(finish),
      requestedCalendarDays,
      feasible: requestedCalendarDays === 0 ? true : totalCalendarDays <= requestedCalendarDays,
      boqLineItems: items.length,
    };
  });
