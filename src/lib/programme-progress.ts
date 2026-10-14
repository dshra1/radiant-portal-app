/** Programme date helpers: planned % from the stage dates, duration-weighted progress. */
export const DAY = 86_400_000;
export const toDay = (iso: string | null) =>
  iso ? Math.floor(Date.parse(`${iso.slice(0, 10)}T00:00:00Z`) / DAY) : NaN;
/** Today's calendar date (in the viewer's time zone) as a day number. */
export const todayDay = () => {
  const d = new Date();
  return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / DAY);
};
export const fmtDay = (iso: string | null) =>
  iso
    ? new Date(`${iso.slice(0, 10)}T00:00:00Z`).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "2-digit",
        timeZone: "UTC",
      })
    : "—";
export const n = (v: unknown) => (Number.isFinite(Number(v)) ? Number(v) : 0);
export const arr = <T>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);

/** Planned % complete of a stage today, from its planned dates. */
export function plannedPctToday(
  s: { planned_start: string | null; planned_end: string | null },
  today = todayDay(),
) {
  const a = toDay(s.planned_start);
  const b = toDay(s.planned_end);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return 0;
  if (today < a) return 0;
  if (today >= b) return 100;
  return Math.round(((today - a + 1) / (b - a + 1)) * 100);
}

/** Duration-weighted planned and actual % for a set of stages. */
export function weightedProgress(
  stages: {
    duration_days?: number | null;
    planned_start: string | null;
    planned_end: string | null;
    actual_pct: number;
  }[],
) {
  let w = 0;
  let plan = 0;
  let act = 0;
  for (const s of stages) {
    const d = Math.max(1, n(s.duration_days) || 1);
    w += d;
    plan += d * plannedPctToday(s);
    act += d * n(s.actual_pct);
  }
  return { planned: w ? plan / w : 0, actual: w ? act / w : 0 };
}
