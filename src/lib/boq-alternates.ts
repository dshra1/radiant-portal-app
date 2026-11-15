/**
 * BOQ alternates and the optimizer.
 *
 * An alternate is another make, specification or method for one BOQ line, with its
 * own rate per the line's unit (excl. GST). Alternates are kept in `flat_options`,
 * the same table the Owner's Portal reads, so:
 * - an alternate for an individual-works item (type_code '') is also offered to
 *   flat owners as an option for their flat;
 * - an alternate for a common-works item is stored with type_code `pkg:<package>`,
 *   which the Owner's Portal never shows, and which keeps codes that repeat in two
 *   packages (CA01, CA02 …) apart.
 *
 * Nothing here changes the BOQ. Choosing an alternate goes through the BOQ Engine's
 * normal edit path (partner approval when it is on).
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import library7776 from "@/data/boq-alternates-7776.json";

export type AlternateRow = Database["public"]["Tables"]["flat_options"]["Row"];

export type AltLine = {
  id: string;
  item_code: string;
  package?: string | null;
  stage: string;
  description: string;
  unit: string;
  quantity: number | string;
  rate: number | string;
  brand: string;
  supplier: string;
  work_scope?: string | null;
  gst_pct?: number | string | null;
};

type LibraryLine = {
  pkg: string;
  code: string;
  label: string;
  make: string;
  rate: number;
  how: string;
  check: string;
  source: string;
};

const n = (v: unknown) => {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
};

const pkgKey = (pkg: string | null | undefined) => `pkg:${(pkg ?? "").trim()}`;

/** Package of a line: the report package, else its trade. */
export const packageOf = (l: Pick<AltLine, "package" | "stage">) =>
  (l.package || l.stage || "").trim();

const gstOf = (l: Pick<AltLine, "gst_pct">) => {
  const g = l.gst_pct;
  return g === null || g === undefined || g === "" ? 18 : n(g);
};

/** Saved alternates of a project, plus the package of each individual-works code. */
export function useAlternates(projectId: string) {
  return useQuery({
    queryKey: ["boq_alternates", projectId],
    enabled: Boolean(projectId),
    queryFn: async () => {
      const [opts, types] = await Promise.all([
        supabase.from("flat_options").select("*").eq("project_id", projectId).order("sort"),
        supabase.from("flat_types").select("lines").eq("project_id", projectId),
      ]);
      if (opts.error) throw opts.error;
      // Code → package of the flat-type lines, so an owner option (type_code '')
      // attaches to the right BOQ line when the code repeats in another package.
      const flatPkg: Record<string, string> = {};
      for (const t of types.data ?? []) {
        for (const l of (t.lines as { code?: string; pkg?: string }[] | null) ?? []) {
          if (l?.code && l.pkg && !flatPkg[l.code]) flatPkg[l.code] = l.pkg;
        }
      }
      return { options: (opts.data ?? []) as AlternateRow[], flatPkg };
    },
  });
}

/** The alternates that apply to one BOQ line, cheapest first. */
export function alternatesFor(
  line: AltLine,
  options: AlternateRow[],
  flatPkg: Record<string, string>,
): AlternateRow[] {
  const pkg = packageOf(line);
  return options
    .filter((o) => {
      if (o.item_code !== line.item_code) return false;
      if (o.type_code.startsWith("pkg:")) return o.type_code === pkgKey(pkg);
      // Owner options ('' or a flat type): the package the flat sheets use for the code.
      const fp = flatPkg[o.item_code];
      return !fp || fp === pkg;
    })
    .sort((a, b) => n(a.rate) - n(b.rate));
}

/** Saving (incl. GST) if the line is priced at the alternate's rate; negative = costs more. */
export function savingOf(line: AltLine, alt: Pick<AlternateRow, "rate">) {
  const q = n(line.quantity);
  return q * (n(line.rate) - n(alt.rate)) * (1 + gstOf(line) / 100);
}

/** Which library to offer for a project ("77:76 CYBER ENCLAVE" → the 77:76 workbooks). */
export function libraryFor(projectName: string | null | undefined): LibraryLine[] {
  if (/(?:^|\D)77:76(?!\d)/.test(projectName ?? "")) return library7776.lines as LibraryLine[];
  return [];
}

/**
 * Rows to insert from the PMC library for the codes this BOQ has, skipping
 * alternates already saved (same code, scope key and label).
 */
export function libraryRows(
  projectId: string,
  projectName: string,
  lines: AltLine[],
  existing: AlternateRow[],
  userId: string | null,
) {
  const lib = libraryFor(projectName);
  const out: Database["public"]["Tables"]["flat_options"]["Insert"][] = [];
  const have = new Set(
    existing.map((o) => `${o.item_code}|${o.type_code}|${o.label.trim().toLowerCase()}`),
  );
  let sort = existing.reduce((m, o) => Math.max(m, o.sort), 0);
  for (const l of lib) {
    const matches = lines.filter((x) => x.item_code === l.code && packageOf(x) === l.pkg);
    if (!matches.length) continue;
    const individual = matches.some((x) => (x.work_scope ?? "") === "individual");
    const typeCode = individual ? "" : pkgKey(l.pkg);
    const key = `${l.code}|${typeCode}|${l.label.trim().toLowerCase()}`;
    if (have.has(key)) continue;
    have.add(key);
    const note = [
      l.how && `How to buy: ${l.how}`,
      l.check && `Check: ${l.check}`,
      `Source: ${l.source}`,
    ]
      .filter(Boolean)
      .join(" · ");
    out.push({
      project_id: projectId,
      item_code: l.code,
      type_code: typeCode,
      label: l.label,
      make: l.make,
      rate: l.rate,
      gst_pct: gstOf(matches[0]!),
      note,
      sort: ++sort,
      created_by: userId,
    });
  }
  return out;
}

/**
 * Alternates that only work together with another line's alternate (a floor-mounted
 * EWC and "no concealed cistern"): offered on the line, never picked by the optimizer.
 */
export const isPairedAlternate = (a: Pick<AlternateRow, "label">) =>
  /only with|with a floor-mounted|take with/i.test(a.label);

export type OptimizerPick = {
  line: AltLine;
  alt: AlternateRow;
  saving: number;
};

/**
 * Picks the cheapest alternate for every line that has one and saves money, biggest
 * saving first. With a target, it stops once the BOQ (incl. GST + contingency) is at
 * or under the target. `ready` lists every useful pick; `picked` the ones the plan
 * takes.
 */
export function optimize(
  lines: AltLine[],
  options: AlternateRow[],
  flatPkg: Record<string, string>,
  opts: { currentIncl: number; target: number; contingencyPct: number; minSaving?: number },
) {
  const ready: OptimizerPick[] = [];
  for (const line of lines) {
    const alts = alternatesFor(line, options, flatPkg);
    let best: OptimizerPick | null = null;
    for (const alt of alts) {
      if (isPairedAlternate(alt)) continue;
      const s = savingOf(line, alt);
      if (s > (opts.minSaving ?? 0) && (!best || s > best.saving)) best = { line, alt, saving: s };
    }
    if (best) ready.push(best);
  }
  ready.sort((a, b) => b.saving - a.saving);
  const k = 1 + opts.contingencyPct / 100;
  const picked: OptimizerPick[] = [];
  let total = opts.currentIncl;
  for (const p of ready) {
    if (opts.target > 0 && total <= opts.target) break;
    picked.push(p);
    total -= p.saving * k;
  }
  return { ready, picked, after: total };
}
