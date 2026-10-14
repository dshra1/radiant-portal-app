/**
 * Programme forecast: when each stage will really start and finish, worked out
 * from what is happening on site, and what to do about the slip.
 *
 * - Finished stages keep their actual dates.
 * - Running stages finish at the rate the site is actually achieving (actual %
 *   over the days since it started), kept within ½× – 3× of the planned rate.
 * - A stage cannot start before its predecessors finish, plus the same gap the
 *   plan left after them (curing, de-shuttering, inspections).
 * - Material whose order-by date has passed with no PO arrives only after its
 *   lead time from today, which holds the stage back.
 * - Optional monsoon allowance: outdoor stages running mid-June to September
 *   take 20% longer.
 * The forecast never pulls a stage earlier than its planned start.
 */
import { DAY, todayDay, toDay } from "@/lib/programme-progress";
import type { PlanStage } from "@/lib/site-week";

export type StageFc = {
  code: string;
  name: string;
  group: string;
  plannedStart: number;
  plannedEnd: number;
  baselineEnd: number;
  start: number;
  end: number;
  /** Days later than the current plan (negative = earlier). */
  slip: number;
  /** Days later than the baseline (the report). */
  slipBaseline: number;
  state: "done" | "running" | "waiting";
  /** What decides the forecast start (or finish, for running stages). */
  driver: string;
  /** The predecessor that holds this stage, for the critical path. */
  drivenBy: string | null;
  materialHold: string[];
  critical: boolean;
};

export type Forecast = {
  stages: StageFc[];
  byCode: Map<string, StageFc>;
  plannedHandover: number;
  forecastHandover: number;
  baselineHandover: number;
  targetHandover: number;
  critical: StageFc[];
  late: StageFc[];
  materialHolds: { code: string; what: string; arrives: number }[];
};

export type ForecastInput = PlanStage & {
  actualStart?: string | null;
  actualEnd?: string | null;
  baselineStart?: string | null;
  baselineEnd?: string | null;
};

const OUTDOOR = /found|frame|terrace|stilt|facade|external|struct|roof|plinth|excav/i;
const isoOf = (d: number) => new Date(d * DAY).toISOString().slice(0, 10);
export const dayToIso = isoOf;

function monsoonDays(group: string, start: number, span: number) {
  if (!OUTDOOR.test(group)) return 0;
  const y = new Date(start * DAY).getUTCFullYear();
  for (const yr of [y, y + 1]) {
    const a = toDay(`${yr}-06-15`);
    const b = toDay(`${yr}-09-30`);
    const overlap = Math.min(b, start + span - 1) - Math.max(a, start) + 1;
    if (overlap > 0) return Math.ceil(overlap * 0.2);
  }
  return 0;
}

/** Stages ordered so each comes after its predecessors (cycles fall back to sort). */
function topo(stages: ForecastInput[]) {
  const by = new Map(stages.map((s) => [s.code, s]));
  const out: ForecastInput[] = [];
  const state = new Map<string, 1 | 2>();
  const visit = (s: ForecastInput) => {
    const st = state.get(s.code);
    if (st === 2 || st === 1) return;
    state.set(s.code, 1);
    for (const p of s.preds) {
      const ps = by.get(p);
      if (ps) visit(ps);
    }
    state.set(s.code, 2);
    out.push(s);
  };
  [...stages].sort((a, b) => a.sort - b.sort).forEach(visit);
  return out;
}

export function forecastProgramme(
  input: ForecastInput[],
  opts: {
    today?: number;
    monsoon?: boolean;
    /** `${stage code}|${material}` (or `|STEEL`) already on a PO. */
    ordered?: Set<string>;
    targetHandover?: string | null;
  } = {},
): Forecast {
  const today = opts.today ?? todayDay();
  const ordered = opts.ordered ?? new Set<string>();
  const stages = input.filter(
    (s) => Number.isFinite(toDay(s.plannedStart)) && Number.isFinite(toDay(s.plannedEnd)),
  );
  const planBy = new Map(stages.map((s) => [s.code, s]));
  const fc = new Map<string, StageFc>();
  const materialHolds: Forecast["materialHolds"] = [];

  for (const s of topo(stages)) {
    const ps = toDay(s.plannedStart);
    const pe = toDay(s.plannedEnd);
    const span = Math.max(1, pe - ps + 1);
    const be = Number.isFinite(toDay(s.baselineEnd ?? null)) ? toDay(s.baselineEnd ?? null) : pe;
    const base = {
      code: s.code,
      name: s.name,
      group: s.group,
      plannedStart: ps,
      plannedEnd: pe,
      baselineEnd: be,
      materialHold: [] as string[],
      critical: false,
      drivenBy: null as string | null,
    };
    const done = Boolean(s.closedAt) || s.actualPct >= 100;
    if (done) {
      const end = Number.isFinite(toDay(s.actualEnd ?? null))
        ? toDay(s.actualEnd ?? null)
        : s.closedAt
          ? toDay(s.closedAt.slice(0, 10))
          : Math.min(pe, today);
      const start = Number.isFinite(toDay(s.actualStart ?? null))
        ? toDay(s.actualStart ?? null)
        : Math.min(ps, end);
      fc.set(s.code, {
        ...base,
        start,
        end,
        slip: end - pe,
        slipBaseline: end - be,
        state: "done",
        driver: "Finished",
      });
      continue;
    }

    if (s.actualPct > 0) {
      const start = Number.isFinite(toDay(s.actualStart ?? null))
        ? toDay(s.actualStart ?? null)
        : Math.min(ps, today);
      const p = s.actualPct;
      const planRem = span * (1 - p / 100);
      const elapsed = today - start + 1;
      let rem = planRem;
      let driver = "On the planned rate";
      if (elapsed >= 3) {
        const observed = (elapsed * (100 - p)) / p;
        rem = Math.min(Math.max(observed, planRem * 0.5), planRem * 3);
        driver = `${p}% done in ${elapsed} days: finishing at the site's actual rate`;
      }
      const end = Math.max(today, today + Math.ceil(rem) - 1);
      const extra = opts.monsoon ? monsoonDays(s.group, today, end - today + 1) : 0;
      const e2 = end + extra;
      fc.set(s.code, {
        ...base,
        start,
        end: e2,
        slip: e2 - pe,
        slipBaseline: e2 - be,
        state: "running",
        driver: extra ? `${driver}; +${extra} days monsoon` : driver,
      });
      continue;
    }

    // Not started: predecessors, material and today decide the start.
    let start = ps;
    let driver = "As planned";
    let drivenBy: string | null = null;
    for (const code of s.preds) {
      const pf = fc.get(code);
      const pp = planBy.get(code);
      if (!pf || !pp) continue;
      const gap = ps - toDay(pp.plannedEnd) - 1;
      const can = pf.end + gap + 1;
      if (can > start) {
        start = can;
        drivenBy = code;
        driver = `Waits for ${code} (finishing ${fmt(pf.end)}${pf.slip > 0 ? `, ${pf.slip} days late` : ""})`;
      }
    }
    if (start < today) {
      start = today;
      drivenBy = null;
      driver = "Should have started: earliest start is today";
    }
    const holds: string[] = [];
    const lead = (orderBy: string | null) =>
      orderBy && Number.isFinite(toDay(orderBy)) ? Math.max(0, ps - toDay(orderBy)) : 0;
    for (const m of s.materials) {
      if (!m.orderBy || ordered.has(`${s.code}|${m.material}`)) continue;
      if (toDay(m.orderBy) >= today) continue;
      const arrives = today + lead(m.orderBy);
      materialHolds.push({ code: s.code, what: m.material, arrives });
      if (arrives > start) {
        start = arrives;
        drivenBy = null;
        driver = `Material not ordered: ${m.material} (order-by ${fmt(toDay(m.orderBy))} passed)`;
      }
      holds.push(m.material);
    }
    if (s.steel?.orderBy && !ordered.has(`${s.code}|STEEL`) && toDay(s.steel.orderBy) < today) {
      const arrives = today + lead(s.steel.orderBy);
      materialHolds.push({ code: s.code, what: "TMT steel", arrives });
      if (arrives > start) {
        start = arrives;
        drivenBy = null;
        driver = `Steel not ordered (order-by ${fmt(toDay(s.steel.orderBy))} passed)`;
      }
      holds.push("TMT steel");
    }
    const extra = opts.monsoon ? monsoonDays(s.group, start, span) : 0;
    const end = start + span - 1 + extra;
    fc.set(s.code, {
      ...base,
      start,
      end,
      slip: end - pe,
      slipBaseline: end - be,
      state: "waiting",
      driver: extra ? `${driver}; +${extra} days monsoon` : driver,
      drivenBy,
      materialHold: holds,
    });
  }

  const list = stages.map((s) => fc.get(s.code)!).filter(Boolean);
  const plannedHandover = Math.max(...list.map((s) => s.plannedEnd));
  const forecastHandover = Math.max(...list.map((s) => s.end));
  const baselineHandover = Math.max(...list.map((s) => s.baselineEnd));
  // Critical path: from the last finishing stage back through what held each one.
  const critical: StageFc[] = [];
  let curr = list.find((s) => s.end === forecastHandover) ?? null;
  const seen = new Set<string>();
  while (curr && !seen.has(curr.code)) {
    seen.add(curr.code);
    curr.critical = true;
    critical.unshift(curr);
    const plan = planBy.get(curr.code);
    let nextCode = curr.drivenBy;
    if (!nextCode && plan && curr.state === "waiting" && curr.driver === "As planned") {
      // Held by its own plan date: follow the latest-finishing predecessor.
      const preds = plan.preds.map((p) => fc.get(p)).filter(Boolean) as StageFc[];
      nextCode = preds.sort((a, b) => b.end - a.end)[0]?.code ?? null;
    }
    curr = nextCode ? (fc.get(nextCode) ?? null) : null;
  }
  return {
    stages: list,
    byCode: fc,
    plannedHandover,
    forecastHandover,
    baselineHandover,
    targetHandover: toDay(opts.targetHandover ?? null),
    critical,
    late: list.filter((s) => s.state !== "done" && s.slip > 0).sort((a, b) => b.slip - a.slip),
    materialHolds: materialHolds.sort((a, b) => b.arrives - a.arrives),
  };
}

function fmt(d: number) {
  return new Date(d * DAY).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

/** Shifts an ISO date by whole days. */
export function shiftIso(iso: string | null, days: number) {
  if (!iso || !Number.isFinite(toDay(iso))) return iso;
  return isoOf(toDay(iso) + days);
}
