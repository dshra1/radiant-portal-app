/**
 * Concrete cube acceptance per IS 456:2000 clause 16 / Table 11.
 *
 * - A test result (sample) = mean of the 3 cubes cast from one sample.
 * - Individual criterion: every test result ≥ fck − 4 N/mm² (M20 and above;
 *   fck − 3 for M15).
 * - Group criterion: the mean of 4 non-overlapping consecutive test results
 *   ≥ the greater of fck + 0.825 × s and fck + 4 (fck + 3 for M15), where s is
 *   the established standard deviation, or the assumed value when not yet
 *   established: 3.5 (M10–M15), 4.0 (M20), 5.0 N/mm² (M25 and above).
 *   For M25+ with s = 5 this is fck + 4.125.
 */

export const gradeFck = (grade: string) => Number(/M(\d+)/i.exec(grade)?.[1] ?? 30);

/** Allowance in Table 11: 4 N/mm² for M20 and above, 3 for M15 and below. */
export const tableMargin = (fck: number) => (fck >= 20 ? 4 : 3);

/** Assumed standard deviation when not established (N/mm²). */
export const assumedSd = (fck: number) => (fck <= 15 ? 3.5 : fck <= 20 ? 4 : 5);

/** Minimum individual test result (sample mean). */
export const individualMin = (fck: number) => fck - tableMargin(fck);

/** Minimum mean of a group of 4 consecutive non-overlapping test results. */
export function groupMin(fck: number, sd = assumedSd(fck)) {
  return Math.max(fck + 0.825 * sd, fck + tableMargin(fck));
}

type CubeRow = {
  id: string;
  grade: string;
  cube_28_1: number | null;
  cube_28_2: number | null;
  cube_28_3: number | null;
  actual_pour_date?: string | null;
  planned_pour_date?: string | null;
};

export type SampleResult = {
  mean: number | null;
  status: "pending" | "pass" | "fail";
  min: number;
};

/** Individual criterion for one pour's sample (mean of its 3 cubes ≥ fck − 4). */
export function sampleResult(c: CubeRow): SampleResult {
  const fck = gradeFck(c.grade);
  const min = individualMin(fck);
  const vals = [c.cube_28_1, c.cube_28_2, c.cube_28_3]
    .filter((v): v is number => v !== null && v !== undefined && String(v) !== "")
    .map(Number);
  if (vals.length < 3) return { mean: null, status: "pending", min };
  const mean = vals.reduce((a, b) => a + b, 0) / 3;
  return { mean, status: mean >= min ? "pass" : "fail", min };
}

export type GroupResult = {
  grade: string;
  index: number; // 1-based group number within the grade
  ids: string[];
  mean: number;
  required: number;
  status: "pass" | "fail";
};

/**
 * Group criterion: per grade, tested pours in pour-date order, split into
 * non-overlapping runs of 4. Returns each complete group and, per pour id,
 * the group it belongs to (or how many tested pours are waiting for a group).
 */
export function groupResults(rows: CubeRow[]) {
  const groups: GroupResult[] = [];
  const byId = new Map<string, GroupResult>();
  const waiting = new Map<string, number>(); // grade → tested pours not yet in a full group
  const grades = [...new Set(rows.map((r) => r.grade))];
  for (const grade of grades) {
    const fck = gradeFck(grade);
    const tested = rows
      .filter((r) => r.grade === grade)
      .map((r) => ({ r, s: sampleResult(r) }))
      .filter((x) => x.s.mean !== null)
      .sort((a, b) =>
        String(a.r.actual_pour_date ?? a.r.planned_pour_date ?? "").localeCompare(
          String(b.r.actual_pour_date ?? b.r.planned_pour_date ?? ""),
        ),
      );
    const full = Math.floor(tested.length / 4);
    for (let g = 0; g < full; g++) {
      const run = tested.slice(g * 4, g * 4 + 4);
      const mean = run.reduce((t, x) => t + (x.s.mean ?? 0), 0) / 4;
      const required = groupMin(fck);
      const res: GroupResult = {
        grade,
        index: g + 1,
        ids: run.map((x) => x.r.id),
        mean,
        required,
        status: mean >= required ? "pass" : "fail",
      };
      groups.push(res);
      for (const x of run) byId.set(x.r.id, res);
    }
    waiting.set(grade, tested.length - full * 4);
  }
  return { groups, byId, waiting };
}
