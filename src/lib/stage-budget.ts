/**
 * Stage budget: the master BOQ (incl. GST) spread over the programme stages
 * that carry out each line, split into material, machinery, labour and misc.
 *
 * How a BOQ line is placed (explainable, no guessing from text similarity):
 *  - concrete, pumping and formwork lines follow each stage's RMC volume
 *    (stage ledger), reinforcement follows each stage's steel order (kg);
 *  - earthwork lines go to the foundation stage that does them;
 *  - every other package goes to the trade stages that build it (e.g.
 *    Electrical: conduits → EA, wire → EW, accessories → ES, boards → EF),
 *    shared by the stages' working days;
 *  - approvals and design fees fall due before the start ("PRE");
 *  - monthly site costs (watch and ward, engineer, power) follow the
 *    working days of all stages.
 */
export type BudgetCategory = "material" | "machinery" | "labour" | "misc";

export type BudgetLine = {
  item_code: string;
  description: string;
  package_no: number;
  line_group: string;
  quantity: number;
  rate: number;
  gst_pct: number;
};

export type BudgetStage = {
  code: string;
  name: string;
  durationDays: number;
  plannedStart: string | null;
  materials: { material: string; unit: string; qty: number; orderBy?: string | null }[];
  steel: { totalKg: number; orderBy?: string | null } | null;
};

export type StageBudget = {
  code: string;
  name: string;
  plannedStart: string | null;
  material: number;
  machinery: number;
  labour: number;
  misc: number;
  total: number;
  lines: {
    code: string;
    description: string;
    category: BudgetCategory;
    amount: number;
    basis: string;
  }[];
};

export const PRE = "PRE";

const n = (v: unknown) => {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
};

const prefixOf = (code: string) => code.replace(/\d+$/, "");

/** Material / machinery / labour / misc for one BOQ line. */
export function categoryOf(l: BudgetLine): BudgetCategory {
  const d = l.description.toLowerCase();
  const code = l.item_code;
  if ([28, 29, 30].includes(l.package_no)) return "misc";
  if (l.package_no === 31) return code === "SE09" ? "machinery" : "misc";
  if (
    ["ST01", "ST02a", "ST07"].includes(code) ||
    /scaffold|pumping|\bhire\b|plant and tools/.test(d)
  )
    return "machinery";
  if (l.package_no === 4 || l.package_no === 15 || /labour|^fix |^laying |^fixing /.test(d))
    return "labour";
  return "material";
}

type Rule = {
  prefixes: string[];
  codes?: string[];
  driver?: "rmc" | "steel" | "days";
  basis: string;
};

const STRUCTURE = ["F", "C", "S", "T", "G"];
const isStructureStage = (code: string) => /^(F0[2-7]|C\d|S\d|T0\d|G01)$/.test(code);

function ruleFor(l: BudgetLine): Rule {
  const c = l.item_code;
  const g = l.line_group.toLowerCase();
  const d = l.description.toLowerCase();
  switch (l.package_no) {
    case 1:
      if (["ST01", "ST02a", "ST03"].includes(c))
        return { prefixes: [], codes: ["F01"], basis: "excavation stage" };
      if (["ST02b", "ST04"].includes(c))
        return { prefixes: [], codes: ["F02"], basis: "PCC stage" };
      if (c === "ST02") return { prefixes: [], codes: ["F07"], basis: "backfill stage" };
      if (c === "ST04a") return { prefixes: [], codes: ["G01"], basis: "stilt slab on grade" };
      if (g.startsWith("c.") || /reinforcement|binding wire|tmt/.test(d))
        return { prefixes: STRUCTURE, driver: "steel", basis: "by the stage's steel (kg)" };
      return { prefixes: STRUCTURE, driver: "rmc", basis: "by the stage's concrete (m³)" };
    case 2:
      return { prefixes: ["M"], driver: "days", basis: "masonry stages" };
    case 3:
      if (c === "PPA5" || c === "PPB6" || c === "PPB7")
        return { prefixes: [], codes: ["FA1"], basis: "facade plaster and paint" };
      if (["PPC6", "PPC7", "PPC8", "PPC9"].includes(c))
        return { prefixes: [], codes: ["TR1"], basis: "terrace" };
      if (c === "PPC10")
        return { prefixes: [], codes: ["T02", "F06"], driver: "days", basis: "tanks and sump" };
      if (g.startsWith("c.") && c !== "PPB-L")
        return { prefixes: ["WP"], driver: "days", basis: "waterproofing stages" };
      if (g.startsWith("a.") || /plaster|skim/.test(d))
        return { prefixes: ["PL"], driver: "days", basis: "plaster stages" };
      if (c === "PPB-L")
        return {
          prefixes: ["PU", "PR", "FP"],
          codes: ["FA1", "CO1"],
          driver: "days",
          basis: "paint stages",
        };
      return { prefixes: ["PU", "PR", "FP"], driver: "days", basis: "paint stages" };
    case 4:
      return {
        prefixes: ["F", "C", "S", "T", "G", "M", "PL"],
        driver: "days",
        basis: "structure, masonry and plaster stages",
      };
    case 5:
      if (/window|ventilator|slider|louvre/.test(d))
        return { prefixes: ["WN"], driver: "days", basis: "window stages" };
      if (/frame/.test(d)) return { prefixes: ["DF"], driver: "days", basis: "door-frame stages" };
      return { prefixes: ["DS", "DF"], driver: "days", basis: "door stages" };
    case 6:
    case 7:
    case 8:
      return { prefixes: ["TL"], driver: "days", basis: "tiling stages" };
    case 9:
      return { prefixes: ["PS"], driver: "days", basis: "sanitary stages" };
    case 10:
      return { prefixes: ["PC"], driver: "days", basis: "CP-fitting stages" };
    case 11:
    case 13:
      return { prefixes: ["PA"], driver: "days", basis: "plumbing stage 1" };
    case 12:
      return { prefixes: [], codes: ["WS1"], basis: "water system" };
    case 14:
      return { prefixes: ["PA", "PS"], driver: "days", basis: "plumbing stages" };
    case 15:
      return { prefixes: ["PA", "PS", "PC"], driver: "days", basis: "plumbing stages" };
    case 16:
      if (/accessor/.test(g))
        return { prefixes: ["ES"], driver: "days", basis: "electrical stage 3" };
      if (/distribution/.test(g))
        return { prefixes: ["EF", "EW"], driver: "days", basis: "electrical stages 2 and 4" };
      if (/labour/.test(d))
        return { prefixes: ["EA", "EW", "ES", "EF"], driver: "days", basis: "electrical stages" };
      if (/conduit/.test(d))
        return { prefixes: ["EA"], driver: "days", basis: "electrical stage 1" };
      if (/wire|cable/.test(d))
        return { prefixes: ["EW"], driver: "days", basis: "electrical stage 2" };
      if (/light|led|fan/.test(d))
        return { prefixes: ["EF"], driver: "days", basis: "electrical stage 4" };
      return { prefixes: ["EA", "EW", "ES", "EF"], driver: "days", basis: "electrical stages" };
    case 17:
      return { prefixes: ["FC"], driver: "days", basis: "false-ceiling stages" };
    case 18:
      return { prefixes: [], codes: ["LF1"], basis: "lift" };
    case 19:
      if (/acp|duct screen|pipe enclosure|access panel|outdoor-unit/.test(d))
        return { prefixes: [], codes: ["FA1"], basis: "facade" };
      return { prefixes: ["DS"], driver: "days", basis: "shutter and railing stages" };
    case 20:
    case 27:
      return { prefixes: [], codes: ["CO1"], basis: "common areas" };
    case 21:
      return { prefixes: [], codes: ["FA2"], basis: "facade cladding" };
    case 22:
      return { prefixes: [], codes: ["TR1"], basis: "terrace" };
    case 23:
      return { prefixes: [], codes: ["SW1"], basis: "site works" };
    case 24:
      return { prefixes: [], codes: ["EX2", "WS1"], driver: "days", basis: "external services" };
    case 25:
    case 26:
      return { prefixes: [], codes: ["EX1"], basis: "external electrical" };
    case 28:
      return { prefixes: [], codes: ["F01"], basis: "before excavation" };
    case 29:
      return { prefixes: [], codes: [PRE], basis: "approvals before the start" };
    case 30:
      return c === "CN05"
        ? { prefixes: [], codes: ["HO1"], basis: "as-built at handover" }
        : { prefixes: [], codes: [PRE], basis: "design before the start" };
    case 31:
      if (["SE02", "SE04", "SE05", "SE07"].includes(c))
        return { prefixes: [], codes: ["F01"], basis: "mobilisation" };
      if (c === "SE06") return { prefixes: [], codes: ["HO1"], basis: "final cleaning" };
      return { prefixes: ["*"], driver: "days", basis: "spread over the programme" };
    default:
      return { prefixes: ["*"], driver: "days", basis: "spread over the programme" };
  }
}

function driverOf(s: BudgetStage, driver: Rule["driver"]) {
  if (driver === "steel") return n(s.steel?.totalKg);
  if (driver === "rmc")
    return s.materials
      .filter((m) => m.unit === "m³" && /rmc|ready-mix|concrete m/i.test(m.material))
      .reduce((t, m) => t + n(m.qty), 0);
  return Math.max(1, n(s.durationDays));
}

export function stageBudgets(lines: BudgetLine[], stages: BudgetStage[]) {
  const out = new Map<string, StageBudget>();
  const bucket = (code: string, name: string, start: string | null) => {
    let b = out.get(code);
    if (!b) {
      b = {
        code,
        name,
        plannedStart: start,
        material: 0,
        machinery: 0,
        labour: 0,
        misc: 0,
        total: 0,
        lines: [],
      };
      out.set(code, b);
    }
    return b;
  };
  const byCode = new Map(stages.map((s) => [s.code, s]));
  const first =
    stages
      .map((s) => s.plannedStart)
      .filter(Boolean)
      .sort()[0] ?? null;
  bucket(PRE, "Before the start: approvals, design, investigations", first);
  let unplaced = 0;

  for (const l of lines) {
    if (l.item_code === "CONT") continue;
    const excl = n(l.quantity) * n(l.rate);
    if (!excl) continue;
    const amount = excl * (1 + n(l.gst_pct) / 100);
    const cat = categoryOf(l);
    const rule = ruleFor(l);
    let targets = stages.filter(
      (s) =>
        rule.prefixes.includes("*") ||
        (rule.codes ?? []).includes(s.code) ||
        rule.prefixes.some((p) =>
          p.length === 1
            ? prefixOf(s.code) === p &&
              (STRUCTURE.includes(p) ? isStructureStage(s.code) || p === "M" : true)
            : prefixOf(s.code) === p,
        ),
    );
    if ((rule.codes ?? []).includes(PRE)) targets = [];
    const weights = targets.map((s) => driverOf(s, rule.driver ?? "days"));
    const sum = weights.reduce((a, b) => a + b, 0);
    if (!targets.length || sum <= 0) {
      const code = (rule.codes ?? []).includes(PRE) ? PRE : (rule.codes?.[0] ?? PRE);
      const st = byCode.get(code);
      const b = bucket(code, st?.name ?? code, st?.plannedStart ?? first);
      if (!st && code !== PRE) unplaced += amount;
      b[cat] += amount;
      b.total += amount;
      b.lines.push({
        code: l.item_code,
        description: l.description,
        category: cat,
        amount,
        basis: rule.basis,
      });
      continue;
    }
    targets.forEach((s, i) => {
      const share = (amount * weights[i]!) / sum;
      if (!share) return;
      const b = bucket(s.code, s.name, s.plannedStart);
      b[cat] += share;
      b.total += share;
      b.lines.push({
        code: l.item_code,
        description: l.description,
        category: cat,
        amount: share,
        basis: rule.basis,
      });
    });
  }
  const order = new Map(stages.map((s, i) => [s.code, i]));
  const list = [...out.values()].sort((a, b) =>
    a.code === PRE
      ? -1
      : b.code === PRE
        ? 1
        : (order.get(a.code) ?? 999) - (order.get(b.code) ?? 999),
  );
  return { stages: list, unplaced, total: list.reduce((t, s) => t + s.total, 0) };
}

/** Cash needed by month (by each stage's planned start). */
export function cashByMonth(list: StageBudget[]) {
  const m = new Map<string, number>();
  for (const s of list) {
    const k = (s.plannedStart ?? "").slice(0, 7) || "unscheduled";
    m.set(k, (m.get(k) ?? 0) + s.total);
  }
  return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0]));
}
