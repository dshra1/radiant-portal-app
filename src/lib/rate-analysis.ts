/**
 * BOQ Budget (rate analysis): what each BOQ line costs to build, split into
 * material, labour and equipment, each with a quantity per BOQ unit and a rate.
 *
 * How a line is worked out (no hidden numbers):
 *  - the line's description is matched to a standard norm (RCC, PCC, steel, AAC,
 *    brickwork, plaster, tiling, painting, excavation, filling, shuttering, pumping);
 *  - details are read from the description (grade, mix, thickness, "ready-mix",
 *    "including reinforcement"); anything not written there is an ASSUMPTION the
 *    user can change on the line;
 *  - quantities per unit are fixed, visible coefficients (CPWD-style norms), stated in
 *    metric units and converted to the line's own unit (cum, cft, sqm, sft, rmt, rft, kg, MT);
 *  - every rate shows where it came from: your rate library → your latest PO price →
 *    your labour register (day rates) → the 77:76 Cyber Enclave BOQ → indicative default.
 *
 * Lines no norm fits are listed as "needs a closer look": add components by hand or ask AI.
 * Budget rates are ex-GST, like BOQ rates.
 */
import { RATES as TAKEOFF_RATES } from "@/lib/takeoff";

export type Kind = "material" | "labour" | "equipment";
export const KIND_LABEL: Record<Kind, string> = {
  material: "Material",
  labour: "Labour",
  equipment: "Equipment",
};

/** One part of a line's rate, per ONE unit of the BOQ line. */
export type Component = {
  key: string; // rate library key
  kind: Kind;
  name: string;
  unit: string; // unit the rate is in (bags, cft, kg, day, hour, sft, m³…)
  qty: number; // per BOQ unit
  basis: string; // how qty was worked out
  /** Equipment only: litres of diesel per hour, paid separately at the diesel price. */
  dieselLph?: number;
  /** Rate set on this component (AI or hand-added); otherwise looked up by key. */
  rate?: number;
  origin?: "norm" | "manual" | "ai";
};

export type Choice = { value: string; label: string };
export type Assumption = {
  id: string;
  label: string;
  options: Choice[];
  value: string;
  /** true = not written in the description; the app took the usual case. */
  assumed: boolean;
};

export type Analysis = {
  normId: string;
  normLabel: string;
  components: Component[];
  assumptions: Assumption[];
  notes: string[];
};

// ─── Units ──────────────────────────────────────────────────────────────────────

export type Dim = "vol" | "area" | "len" | "mass" | "count" | "other";
const SFT_PER_M2 = 10.7639;
const CFT_PER_M3 = 35.3147;

/** The line's unit as a dimension and the factor that turns 1 line-unit into metric (m³, m², m, kg). */
export function unitInfo(raw: string): { dim: Dim; toMetric: number; label: string } {
  const u = raw.toLowerCase().replace(/[\s.]/g, "").replace(/³/g, "3").replace(/²/g, "2");
  if (["m3", "cum", "cumt", "cbm", "cubm", "cumtr"].includes(u))
    return { dim: "vol", toMetric: 1, label: "m³" };
  if (["cft", "cuft", "cft3", "ft3"].includes(u))
    return { dim: "vol", toMetric: 1 / CFT_PER_M3, label: "cft" };
  if (["m2", "sqm", "sqmt", "sqmtr", "smt"].includes(u))
    return { dim: "area", toMetric: 1, label: "m²" };
  if (["sft", "sqft", "sqf", "ft2", "sft2"].includes(u))
    return { dim: "area", toMetric: 1 / SFT_PER_M2, label: "sft" };
  if (["m", "rmt", "rm", "mtr", "rmtr", "lm", "metre", "meter"].includes(u))
    return { dim: "len", toMetric: 1, label: "m" };
  if (["rft", "ft", "rf", "lft", "feet"].includes(u))
    return { dim: "len", toMetric: 0.3048, label: "rft" };
  if (["kg", "kgs"].includes(u)) return { dim: "mass", toMetric: 1, label: "kg" };
  if (["mt", "t", "ton", "tons", "tonne", "tonnes", "tn"].includes(u))
    return { dim: "mass", toMetric: 1000, label: "MT" };
  if (["qtl", "quintal"].includes(u)) return { dim: "mass", toMetric: 100, label: "quintal" };
  if (["nos", "no", "each", "ea", "set", "sets", "pcs", "nr", "unit"].includes(u))
    return { dim: "count", toMetric: 1, label: "nos" };
  return { dim: "other", toMetric: 1, label: raw };
}

// ─── Rate library defaults ──────────────────────────────────────────────────────

export type RateSrc = "library" | "po" | "register" | "77:76 BOQ" | "indicative" | "line";
export type RateDef = { name: string; kind: Kind; unit: string; rate: number; src: RateSrc };

const T = TAKEOFF_RATES;
const fromTakeoff = (k: string, fallback: number): { rate: number; src: RateSrc } =>
  T[k]
    ? { rate: T[k].rate, src: T[k].src === "77:76 BOQ" ? "77:76 BOQ" : "indicative" }
    : { rate: fallback, src: "indicative" };

/** Default rates (₹, ex-GST). Replace with your own in the rate library. */
export const DEFAULT_RATES: Record<string, RateDef> = {
  // materials
  cement: {
    name: "Cement (OPC/PPC)",
    kind: "material",
    unit: "bags",
    ...fromTakeoff("cement", 390),
  },
  sand: { name: "River sand", kind: "material", unit: "cft", ...fromTakeoff("sand", 70) },
  msand: { name: "M-sand / P-sand", kind: "material", unit: "cft", ...fromTakeoff("msand", 65) },
  agg20: {
    name: "Coarse aggregate 20 mm",
    kind: "material",
    unit: "cft",
    rate: 50,
    src: "indicative",
  },
  agg40: {
    name: "Coarse aggregate 40 mm",
    kind: "material",
    unit: "cft",
    rate: 45,
    src: "indicative",
  },
  rmc_m15: { name: "RMC M15", kind: "material", unit: "m³", rate: 3500, src: "indicative" },
  rmc_m20: { name: "RMC M20", kind: "material", unit: "m³", rate: 3750, src: "indicative" },
  rmc_m25: { name: "RMC M25", kind: "material", unit: "m³", ...fromTakeoff("rmc_m25", 4068) },
  rmc_m30: { name: "RMC M30", kind: "material", unit: "m³", ...fromTakeoff("rmc_m30", 4407) },
  rmc_m35: { name: "RMC M35", kind: "material", unit: "m³", rate: 4750, src: "indicative" },
  rmc_m40: { name: "RMC M40", kind: "material", unit: "m³", rate: 5100, src: "indicative" },
  steel: { name: "TMT steel Fe500D", kind: "material", unit: "kg", ...fromTakeoff("steel", 54) },
  binding: { name: "Binding wire", kind: "material", unit: "kg", ...fromTakeoff("binding", 110) },
  aac_100: {
    name: "AAC block 600×200×100",
    kind: "material",
    unit: "nos",
    ...fromTakeoff("aac_100", 42),
  },
  aac_150: {
    name: "AAC block 600×200×150",
    kind: "material",
    unit: "nos",
    ...fromTakeoff("aac_150", 60),
  },
  aac_200: {
    name: "AAC block 600×200×200",
    kind: "material",
    unit: "nos",
    ...fromTakeoff("aac_200", 77),
  },
  aac_adhesive: {
    name: "AAC block adhesive (40 kg)",
    kind: "material",
    unit: "bags",
    ...fromTakeoff("adhesive", 420),
  },
  bricks: {
    name: "Bricks (red / fly-ash)",
    kind: "material",
    unit: "nos",
    ...fromTakeoff("bricks", 11),
  },
  vitrified: {
    name: "Vitrified tiles",
    kind: "material",
    unit: "sft",
    ...fromTakeoff("vitrified", 85),
  },
  wall_tile: {
    name: "Ceramic wall tiles",
    kind: "material",
    unit: "sft",
    ...fromTakeoff("wall_tile", 70),
  },
  antiskid: {
    name: "Anti-skid tiles",
    kind: "material",
    unit: "sft",
    ...fromTakeoff("antiskid", 44),
  },
  tile_adhesive: {
    name: "Tile adhesive (20 kg)",
    kind: "material",
    unit: "bags",
    ...fromTakeoff("tile_adhesive", 650),
  },
  putty: { name: "Wall putty", kind: "material", unit: "kg", rate: 22, src: "indicative" },
  primer: { name: "Primer", kind: "material", unit: "litre", rate: 200, src: "indicative" },
  emulsion_int: {
    name: "Interior emulsion",
    kind: "material",
    unit: "litre",
    rate: 350,
    src: "indicative",
  },
  emulsion_ext: {
    name: "Exterior emulsion",
    kind: "material",
    unit: "litre",
    rate: 420,
    src: "indicative",
  },
  murrum: {
    name: "Murrum / gravel for filling",
    kind: "material",
    unit: "cft",
    rate: 25,
    src: "indicative",
  },
  // labour: contract rates per unit of work
  lab_rcc_rmc: {
    name: "Concreting labour, RMC (contract)",
    kind: "labour",
    unit: "m³",
    rate: 450,
    src: "indicative",
  },
  lab_rcc_site: {
    name: "Concreting labour, site-mixed (contract)",
    kind: "labour",
    unit: "m³",
    rate: 1100,
    src: "indicative",
  },
  lab_pcc: {
    name: "PCC labour (contract)",
    kind: "labour",
    unit: "m³",
    rate: 900,
    src: "indicative",
  },
  lab_steel: {
    name: "Bar bending & fixing (contract)",
    kind: "labour",
    unit: "kg",
    rate: 9,
    src: "indicative",
  },
  lab_aac: {
    name: "AAC block laying (contract)",
    kind: "labour",
    unit: "m³",
    rate: 1000,
    src: "indicative",
  },
  lab_brick: {
    name: "Brick masonry labour (contract)",
    kind: "labour",
    unit: "m³",
    rate: 1600,
    src: "indicative",
  },
  lab_plaster_int: {
    name: "Internal plastering (contract)",
    kind: "labour",
    unit: "sft",
    ...fromTakeoff("int_plaster_labour", 22),
  },
  lab_plaster_ext: {
    name: "External plastering (contract)",
    kind: "labour",
    unit: "sft",
    ...fromTakeoff("ext_plaster_labour", 28),
  },
  lab_tile: {
    name: "Tile laying (contract)",
    kind: "labour",
    unit: "sft",
    ...fromTakeoff("tile_laying", 35),
  },
  lab_paint_int: {
    name: "Painting labour, interior (contract)",
    kind: "labour",
    unit: "sft",
    rate: 12,
    src: "indicative",
  },
  lab_paint_ext: {
    name: "Painting labour, exterior (contract)",
    kind: "labour",
    unit: "sft",
    rate: 14,
    src: "indicative",
  },
  lab_excav_manual: {
    name: "Manual excavation (contract)",
    kind: "labour",
    unit: "m³",
    rate: 300,
    src: "indicative",
  },
  lab_dressing: {
    name: "Trimming & dressing after machine (contract)",
    kind: "labour",
    unit: "m³",
    rate: 40,
    src: "indicative",
  },
  lab_backfill: {
    name: "Filling & compaction labour (contract)",
    kind: "labour",
    unit: "m³",
    rate: 120,
    src: "indicative",
  },
  sub_shuttering: {
    name: "Shuttering contractor (with material)",
    kind: "labour",
    unit: "sft",
    ...fromTakeoff("centering", 45),
  },
  mason_day: {
    name: "Mason (daily wage)",
    kind: "labour",
    unit: "day",
    rate: 950,
    src: "indicative",
  },
  helper_day: {
    name: "Helper / beldar (daily wage)",
    kind: "labour",
    unit: "day",
    rate: 700,
    src: "indicative",
  },
  // equipment: hire rate excludes diesel (diesel at the diesel price)
  excavator: {
    name: "Hydraulic excavator",
    kind: "equipment",
    unit: "hour",
    rate: 1200,
    src: "indicative",
  },
  tipper: { name: "Tipper", kind: "equipment", unit: "hour", rate: 900, src: "indicative" },
  compactor: {
    name: "Plate compactor",
    kind: "equipment",
    unit: "hour",
    rate: 150,
    src: "indicative",
  },
  mixer: { name: "Concrete mixer", kind: "equipment", unit: "hour", rate: 150, src: "indicative" },
  vibrator: {
    name: "Needle vibrator",
    kind: "equipment",
    unit: "hour",
    rate: 60,
    src: "indicative",
  },
  pump: {
    name: "Concrete pump (with diesel)",
    kind: "equipment",
    unit: "m³",
    ...fromTakeoff("pumping", 350),
  },
};

export const DEFAULT_DIESEL = 92;
const nameOf = (key: string) => DEFAULT_RATES[key]?.name ?? key;

// ─── Reading the description ────────────────────────────────────────────────────

const lc = (s: string) => s.toLowerCase();

/** "1:4:8" → [1,4,8]; "1 : 6" → [1,6]. */
export function readRatio(desc: string): number[] | null {
  const m = desc.match(/1\s*:\s*(\d+(?:\.\d+)?)(?:\s*:\s*(\d+(?:\.\d+)?))?/);
  if (!m) return null;
  return m[2] ? [1, Number(m[1]), Number(m[2])] : [1, Number(m[1])];
}
export function readGrade(desc: string): number | null {
  const m = desc.match(/\bM\s*-?\s*(10|15|20|25|30|35|40|45|50)\b/i);
  return m ? Number(m[1]) : null;
}
/** Thickness in mm (first "NN mm" between 3 and 400, or "4.5 inch"/"9 inch" walls). */
export function readThickness(desc: string): number | null {
  const mm = [...desc.matchAll(/(\d+(?:\.\d+)?)\s*mm\b(?!\s*(?:dia|ø|φ))/gi)]
    .map((m) => Number(m[1]))
    .filter((n) => n >= 3 && n <= 400);
  if (mm.length) return mm[0] ?? null;
  const inch = desc.match(/(\d+(?:\.\d+)?)\s*(?:"|inch|in\b)/i);
  if (inch) return Math.round(Number(inch[1]) * 25.4);
  return null;
}

const opt = (value: string, label: string): Choice => ({ value, label });

function pick(
  id: string,
  label: string,
  options: Choice[],
  read: string | null,
  usual: string,
  chosen?: Record<string, string> | undefined,
): Assumption {
  const user = chosen?.[id];
  const valid = (v: string | null | undefined) => !!v && options.some((o) => o.value === v);
  if (valid(user)) return { id, label, options, value: user!, assumed: false };
  if (valid(read)) return { id, label, options, value: read!, assumed: false };
  return { id, label, options, value: usual, assumed: true };
}

// ─── Building blocks ────────────────────────────────────────────────────────────

/** Dry materials for 1 m³ of WET mix (concrete: dry 1.54, mortar: dry 1.27). */
function dryMix(ratio: number[], dryFactor: number) {
  const parts = ratio.reduce((s, n) => s + n, 0);
  const dry = dryFactor;
  const cementM3 = (dry * (ratio[0] ?? 1)) / parts;
  return {
    cementBags: (cementM3 * 1440) / 50,
    sandCft: ((dry * (ratio[1] ?? 0)) / parts) * CFT_PER_M3,
    aggCft: ((dry * (ratio[2] ?? 0)) / parts) * CFT_PER_M3,
  };
}

const r2 = (n: number) => Math.round(n * 10000) / 10000;

function labourChoice(chosen?: Record<string, string> | undefined, inContract = false) {
  return pick(
    "labour",
    "Labour paid",
    [
      ...(inContract ? [opt("civil", "In the civil labour contract (its own BOQ line)")] : []),
      opt("contract", "Contractor, paid per unit of work"),
      opt("daily", "Daily wages (mason + helper days)"),
    ],
    null,
    inContract ? "civil" : "contract",
    chosen,
  );
}

/** Norms whose labour a lump-sum civil labour contract (₹/sft of slab) already pays for. */
const CIVIL_NORMS = new Set(["rcc", "pcc", "steel", "aac", "brick", "plaster", "shuttering"]);
const CIVIL_KEYS = new Set([
  "lab_rcc_rmc",
  "lab_rcc_site",
  "lab_pcc",
  "lab_steel",
  "lab_aac",
  "lab_brick",
  "lab_plaster_int",
  "lab_plaster_ext",
  "sub_shuttering",
  "mason_day",
  "helper_day",
  "vibrator",
]);

/** True when the BOQ has a separate concrete-pumping line (pumping charges per m³). */
export function hasPumpingLine(lines: { description: string }[]) {
  return lines.some((l) => {
    const d = (l.description ?? "").toLowerCase();
    return (
      /pumping|pump (charges|hire)|by (concrete )?pump/.test(d) &&
      readGrade(d) === null &&
      !/rcc|reinforced/.test(d)
    );
  });
}

/** True when the BOQ pays civil labour as one contract line (e.g. ₹220/sft of slab). */
export function hasCivilLabourContract(lines: { description: string }[]) {
  return lines.some((l) =>
    /civil labou?r contract|labou?r contract.*(sft|slab)/i.test(l.description ?? ""),
  );
}

// ─── Norms ──────────────────────────────────────────────────────────────────────

type Ctx = {
  desc: string;
  d: string;
  dim: Dim;
  chosen?: Record<string, string> | undefined;
  inContract?: boolean;
  /** The BOQ has its own concrete-pumping line. */
  pumpLine?: boolean;
};
type Norm = {
  id: string;
  label: string;
  dims: Dim[];
  test: (d: string) => boolean;
  /** Components per ONE metric unit (m³ / m² / m / kg) and assumptions. */
  build: (c: Ctx) => { comps: Component[]; asm: Assumption[]; notes?: string[] };
};

const NORMS: Norm[] = [
  {
    id: "pumping",
    label: "Concrete pumping",
    dims: ["vol"],
    test: (d) =>
      /pumping|pump (charges|hire)|by (concrete )?pump/.test(d) &&
      readGrade(d) === null &&
      !/rcc|reinforced|providing and laying|pump ?(set|room|house|motor)|submersible|sump/.test(d),
    build: () => ({
      comps: [
        {
          key: "pump",
          kind: "equipment",
          name: "Concrete pump (with diesel)",
          unit: "m³",
          qty: 1,
          basis: "1 m³ pumped per m³",
        },
      ],
      asm: [],
    }),
  },
  {
    id: "shuttering",
    label: "Shuttering / centering",
    dims: ["area"],
    test: (d) => /shutter|centering|centring|formwork/.test(d) && !/concrete|rcc|pcc/.test(d),
    build: () => ({
      comps: [
        {
          key: "sub_shuttering",
          kind: "labour",
          name: "Shuttering contractor (with material)",
          unit: "sft",
          qty: SFT_PER_M2,
          basis: "1 m² = 10.76 sft of contact area",
        },
      ],
      asm: [],
    }),
  },
  {
    id: "steel",
    label: "Reinforcement steel",
    dims: ["mass"],
    test: (d) => /reinforc|tmt|\bfe\s*-?\s*5\d\d|steel bar|rebar|\bsteel\b/.test(d),
    build: ({ d, chosen }) => {
      const wastage = pick(
        "wastage",
        "Cutting wastage",
        [opt("0", "None (quantity already includes it)"), opt("2.5", "2.5%"), opt("5", "5%")],
        /including (cutting )?wastage|incl\.? wastage/.test(d) ? "0" : null,
        "2.5",
        chosen,
      );
      const w = 1 + Number(wastage.value) / 100;
      return {
        comps: [
          {
            key: "steel",
            kind: "material",
            name: "TMT steel",
            unit: "kg",
            qty: w,
            basis: `1 kg + ${wastage.value}% wastage`,
          },
          {
            key: "binding",
            kind: "material",
            name: "Binding wire",
            unit: "kg",
            qty: 0.01,
            basis: "10 kg per tonne",
          },
          {
            key: "lab_steel",
            kind: "labour",
            name: "Bar bending & fixing (contract)",
            unit: "kg",
            qty: 1,
            basis: "per kg fixed",
          },
        ],
        asm: [wastage],
      };
    },
  },
  {
    id: "rcc",
    label: "Reinforced / structural concrete",
    dims: ["vol"],
    test: (d) =>
      !/\bpcc\b|plain cement concrete|lean concrete/.test(d) &&
      ((/concrete|\brmc\b|ready.?mix/.test(d) && (readGrade(d) ?? 0) >= 15) ||
        /\brcc\b|reinforced cement concrete/.test(d)),
    build: ({ desc, d, chosen, inContract, pumpLine }) => {
      const grade = readGrade(desc) ?? 25;
      const mode = pick(
        "concrete",
        "Concrete",
        [opt("rmc", "Ready-mix (RMC)"), opt("site", "Site-mixed")],
        /ready.?mix|\brmc\b/.test(d)
          ? "rmc"
          : /site.?mix|machine.?mix|hand.?mix/.test(d)
            ? "site"
            : null,
        "rmc",
        chosen,
      );
      const element = pick(
        "element",
        "Element (sets steel per m³)",
        [
          opt("slab", "Slab · ~80 kg/m³"),
          opt("beam", "Beam · ~120 kg/m³"),
          opt("column", "Column · ~160 kg/m³"),
          opt("footing", "Footing / raft · ~90 kg/m³"),
          opt("other", "Other · ~100 kg/m³"),
        ],
        /slab|roof|floor/.test(d)
          ? "slab"
          : /beam|lintel|plinth/.test(d)
            ? "beam"
            : /column|pedestal|shear wall/.test(d)
              ? "column"
              : /footing|raft|foundation|pile cap/.test(d)
                ? "footing"
                : null,
        "other",
        chosen,
      );
      const steelIn = pick(
        "steel",
        "Reinforcement",
        [opt("out", "Separate BOQ line"), opt("in", "Included in this line")],
        /exclud\w* (the )?(cost of )?(reinforc|steel)|excluding (reinforc|steel)/.test(d)
          ? "out"
          : /includ\w* (the )?(cost of )?(reinforc|steel)|with reinforc/.test(d)
            ? "in"
            : null,
        "out",
        chosen,
      );
      const labour = labourChoice(chosen, inContract);
      const comps: Component[] = [];
      const asm: Assumption[] = [mode, element, steelIn];
      const notes: string[] = [];
      if (mode.value === "rmc") {
        const g = [15, 20, 25, 30, 35, 40].reduce((a, b) =>
          Math.abs(b - grade) < Math.abs(a - grade) ? b : a,
        );
        const pumped = pick(
          "pumped",
          "Placing",
          [
            ...(pumpLine ? [opt("separate", "Pumped, paid in its own BOQ line")] : []),
            opt("pump", "Pumped"),
            opt("chute", "Direct from transit mixer / chute"),
          ],
          pumpLine ? null : /pump/.test(d) ? "pump" : null,
          pumpLine ? "separate" : element.value === "footing" ? "chute" : "pump",
          chosen,
        );
        asm.push(pumped);
        comps.push({
          key: `rmc_m${g}`,
          kind: "material",
          name: `RMC M${g}`,
          unit: "m³",
          qty: 1.02,
          basis: "1 m³ + 2% spillage",
        });
        if (pumped.value === "pump")
          comps.push({
            key: "pump",
            kind: "equipment",
            name: "Concrete pump (with diesel)",
            unit: "m³",
            qty: 1,
            basis: "1 m³ pumped per m³",
          });
        if (labour.value === "contract")
          comps.push({
            key: "lab_rcc_rmc",
            kind: "labour",
            name: "Concreting labour, RMC (contract)",
            unit: "m³",
            qty: 1,
            basis: "per m³ placed",
          });
        else
          comps.push(
            {
              key: "mason_day",
              kind: "labour",
              name: "Mason",
              unit: "day",
              qty: 0.1,
              basis: "0.1 mason-day per m³ (RMC)",
            },
            {
              key: "helper_day",
              kind: "labour",
              name: "Helper",
              unit: "day",
              qty: 1.2,
              basis: "1.2 helper-days per m³ (RMC)",
            },
          );
      } else {
        const ratio = grade <= 15 ? [1, 2, 4] : grade <= 20 ? [1, 1.5, 3] : [1, 1, 2];
        const m = dryMix(ratio, 1.54);
        notes.push(
          grade > 20
            ? `M${grade} site-mixed taken as nominal 1:1:2; use a design mix for M25 and above.`
            : `M${grade} taken as nominal mix 1:${ratio[1]}:${ratio[2]}.`,
        );
        comps.push(
          {
            key: "cement",
            kind: "material",
            name: "Cement",
            unit: "bags",
            qty: r2(m.cementBags),
            basis: `1:${ratio[1]}:${ratio[2]}, dry volume 1.54 per m³`,
          },
          {
            key: "sand",
            kind: "material",
            name: "Sand",
            unit: "cft",
            qty: r2(m.sandCft),
            basis: `1:${ratio[1]}:${ratio[2]} mix`,
          },
          {
            key: "agg20",
            kind: "material",
            name: "Coarse aggregate 20 mm",
            unit: "cft",
            qty: r2(m.aggCft),
            basis: `1:${ratio[1]}:${ratio[2]} mix`,
          },
          {
            key: "mixer",
            kind: "equipment",
            name: "Concrete mixer",
            unit: "hour",
            qty: 0.6,
            basis: "~1.7 m³ per mixer-hour",
            dieselLph: 1.5,
          },
        );
        if (labour.value === "contract")
          comps.push({
            key: "lab_rcc_site",
            kind: "labour",
            name: "Concreting labour, site-mixed (contract)",
            unit: "m³",
            qty: 1,
            basis: "per m³ placed",
          });
        else
          comps.push(
            {
              key: "mason_day",
              kind: "labour",
              name: "Mason",
              unit: "day",
              qty: 0.25,
              basis: "0.25 mason-day per m³",
            },
            {
              key: "helper_day",
              kind: "labour",
              name: "Helper",
              unit: "day",
              qty: 2.5,
              basis: "2.5 helper-days per m³",
            },
          );
      }
      asm.push(labour);
      comps.push({
        key: "vibrator",
        kind: "equipment",
        name: "Needle vibrator",
        unit: "hour",
        qty: 0.5,
        basis: "0.5 vibrator-hour per m³",
      });
      if (steelIn.value === "in") {
        const kg =
          { slab: 80, beam: 120, column: 160, footing: 90, other: 100 }[element.value] ?? 100;
        comps.push(
          {
            key: "steel",
            kind: "material",
            name: "TMT steel",
            unit: "kg",
            qty: kg * 1.025,
            basis: `${kg} kg/m³ (${element.value}) + 2.5% wastage`,
          },
          {
            key: "binding",
            kind: "material",
            name: "Binding wire",
            unit: "kg",
            qty: r2(kg * 0.01),
            basis: "10 kg per tonne of steel",
          },
          {
            key: "lab_steel",
            kind: "labour",
            name: "Bar bending & fixing (contract)",
            unit: "kg",
            qty: kg,
            basis: `${kg} kg/m³`,
          },
        );
      }
      if (/shutter|centering|centring|formwork/.test(d))
        notes.push(
          "Description includes shuttering: add the shuttering cost or keep it as a separate line.",
        );
      return { comps, asm, notes };
    },
  },
  {
    id: "pcc",
    label: "Plain cement concrete",
    dims: ["vol"],
    test: (d) =>
      /\bpcc\b|plain cement concrete|lean concrete|levelling course|bed concrete/.test(d) ||
      (/concrete/.test(d) && (readRatio(d)?.length ?? 0) === 3),
    build: ({ desc, chosen, inContract }) => {
      const read = readRatio(desc);
      const ratioA = pick(
        "mix",
        "Mix",
        [
          opt("1:2:4", "1:2:4 (M15)"),
          opt("1:3:6", "1:3:6"),
          opt("1:4:8", "1:4:8"),
          opt("1:5:10", "1:5:10"),
        ],
        read && read.length === 3 ? `1:${read[1]}:${read[2]}` : null,
        "1:4:8",
        chosen,
      );
      const ratio = ratioA.value.split(":").map(Number);
      const m = dryMix(ratio, 1.54);
      const labour = labourChoice(chosen, inContract);
      const comps: Component[] = [
        {
          key: "cement",
          kind: "material",
          name: "Cement",
          unit: "bags",
          qty: r2(m.cementBags),
          basis: `${ratioA.value}, dry volume 1.54 per m³`,
        },
        {
          key: "sand",
          kind: "material",
          name: "Sand",
          unit: "cft",
          qty: r2(m.sandCft),
          basis: `${ratioA.value} mix`,
        },
        {
          key: "agg40",
          kind: "material",
          name: "Coarse aggregate 40 mm",
          unit: "cft",
          qty: r2(m.aggCft),
          basis: `${ratioA.value} mix`,
        },
        {
          key: "mixer",
          kind: "equipment",
          name: "Concrete mixer",
          unit: "hour",
          qty: 0.6,
          basis: "~1.7 m³ per mixer-hour",
          dieselLph: 1.5,
        },
      ];
      if (labour.value === "contract")
        comps.push({
          key: "lab_pcc",
          kind: "labour",
          name: "PCC labour (contract)",
          unit: "m³",
          qty: 1,
          basis: "per m³ laid",
        });
      else
        comps.push(
          {
            key: "mason_day",
            kind: "labour",
            name: "Mason",
            unit: "day",
            qty: 0.17,
            basis: "0.17 mason-day per m³",
          },
          {
            key: "helper_day",
            kind: "labour",
            name: "Helper",
            unit: "day",
            qty: 2,
            basis: "2 helper-days per m³",
          },
        );
      return { comps, asm: [ratioA, labour] };
    },
  },
  {
    id: "filling",
    label: "Filling & compaction",
    dims: ["vol"],
    test: (d) => /back ?fill|filling|refill/.test(d) && !/tile|joint|crack/.test(d),
    build: ({ d, chosen }) => {
      const mat = pick(
        "material",
        "Filling material",
        [opt("site", "Excavated earth from site"), opt("murrum", "Brought murrum / gravel")],
        /murrum|moorum|gravel|brought from outside|imported/.test(d)
          ? "murrum"
          : /excavated|available|surplus/.test(d)
            ? "site"
            : null,
        "site",
        chosen,
      );
      const comps: Component[] = [
        {
          key: "lab_backfill",
          kind: "labour",
          name: "Filling & compaction (contract)",
          unit: "m³",
          qty: 1,
          basis: "per m³, in layers",
        },
        {
          key: "compactor",
          kind: "equipment",
          name: "Plate compactor",
          unit: "hour",
          qty: 0.1,
          basis: "~10 m³ per hour in 150 mm layers",
          dieselLph: 1.2,
        },
      ];
      if (mat.value === "murrum")
        comps.unshift({
          key: "murrum",
          kind: "material",
          name: "Murrum / gravel",
          unit: "cft",
          qty: r2(1.25 * CFT_PER_M3),
          basis: "1.25 m³ loose per m³ compacted",
        });
      return { comps, asm: [mat] };
    },
  },
  {
    id: "excavation",
    label: "Excavation",
    dims: ["vol"],
    test: (d) => /excavat|earth ?work in (excav|cutting)|digging/.test(d),
    build: ({ d, chosen }) => {
      const method = pick(
        "method",
        "Method",
        [opt("machine", "Excavator"), opt("manual", "Manual")],
        /mechanical|machine|excavator|jcb|poclain/.test(d)
          ? "machine"
          : /manual/.test(d)
            ? "manual"
            : null,
        "machine",
        chosen,
      );
      const disposal = pick(
        "disposal",
        "Surplus earth",
        [opt("none", "Kept on site / used for filling"), opt("tipper", "Carted away by tipper")],
        /\d+(\.\d+)? ?km|cart(ed|ing)? away|outside the site|off.?site/.test(d) ? "tipper" : null,
        "none",
        chosen,
      );
      const comps: Component[] = [];
      if (method.value === "machine")
        comps.push(
          {
            key: "excavator",
            kind: "equipment",
            name: "Hydraulic excavator",
            unit: "hour",
            qty: 0.035,
            basis: "~28 m³ per machine-hour",
            dieselLph: 8,
          },
          {
            key: "lab_dressing",
            kind: "labour",
            name: "Trimming & dressing (contract)",
            unit: "m³",
            qty: 1,
            basis: "per m³",
          },
        );
      else
        comps.push({
          key: "lab_excav_manual",
          kind: "labour",
          name: "Manual excavation (contract)",
          unit: "m³",
          qty: 1,
          basis: "per m³ (ordinary soil)",
        });
      if (disposal.value === "tipper")
        comps.push({
          key: "tipper",
          kind: "equipment",
          name: "Tipper",
          unit: "hour",
          qty: 0.03,
          basis: "~33 m³ per tipper-hour, short lead",
          dieselLph: 6,
        });
      return {
        comps,
        asm: [method, disposal],
        notes: ["Hard rock or dewatering needs its own rate."],
      };
    },
  },
  {
    id: "aac",
    label: "AAC block masonry",
    dims: ["vol", "area"],
    test: (d) => /\baac\b|autoclaved|aerated|siporex|light ?weight block/.test(d),
    build: ({ desc, dim, chosen, inContract }) => {
      const t = readThickness(desc);
      const th = pick(
        "thick",
        "Wall thickness",
        [opt("100", "100 mm"), opt("150", "150 mm"), opt("200", "200 mm"), opt("230", "230 mm")],
        t && [100, 150, 200, 230].includes(t) ? String(t) : null,
        "200",
        chosen,
      );
      const tm = Number(th.value) / 1000;
      const key = tm <= 0.1 ? "aac_100" : tm <= 0.15 ? "aac_150" : "aac_200";
      const perM3 = dim === "vol";
      const blocks = (perM3 ? 1 / (0.12 * tm) : 1 / 0.12) * 1.05;
      const adhesive = perM3 ? 0.85 : 0.85 * tm;
      const labour = labourChoice(chosen, inContract);
      const comps: Component[] = [
        {
          key,
          kind: "material",
          name: nameOf(key),
          unit: "nos",
          qty: r2(blocks),
          basis: `600×200 face, ${perM3 ? `per m³ of ${th.value} mm wall` : "8.33 per m²"} + 5% breakage`,
        },
        {
          key: "aac_adhesive",
          kind: "material",
          name: "AAC block adhesive (40 kg)",
          unit: "bags",
          qty: r2(adhesive),
          basis: "0.85 bag per m³ of wall (3 mm joints)",
        },
      ];
      if (labour.value === "contract")
        comps.push({
          key: "lab_aac",
          kind: "labour",
          name: "AAC block laying (contract)",
          unit: "m³",
          qty: perM3 ? 1 : tm,
          basis: perM3 ? "per m³" : `${th.value} mm = ${tm} m³ per m²`,
        });
      else
        comps.push(
          {
            key: "mason_day",
            kind: "labour",
            name: "Mason",
            unit: "day",
            qty: r2(0.6 * (perM3 ? 1 : tm)),
            basis: "0.6 mason-day per m³",
          },
          {
            key: "helper_day",
            kind: "labour",
            name: "Helper",
            unit: "day",
            qty: r2(0.6 * (perM3 ? 1 : tm)),
            basis: "0.6 helper-day per m³",
          },
        );
      return { comps, asm: [th, labour] };
    },
  },
  {
    id: "brick",
    label: "Brick masonry",
    dims: ["vol", "area"],
    test: (d) => /brick ?work|brick masonry|\bbricks?\b/.test(d) && !/aac|tile|bat/.test(d),
    build: ({ desc, d, dim, chosen, inContract }) => {
      const t = readThickness(desc);
      const th = pick(
        "thick",
        "Wall thickness",
        [opt("115", "115 mm (half brick)"), opt("230", "230 mm (one brick)")],
        t ? (t <= 150 ? "115" : "230") : /half brick|4\.5|4 ?1\/2/.test(d) ? "115" : null,
        dim === "area" ? "115" : "230",
        chosen,
      );
      const ratioRead = readRatio(desc);
      const mix = pick(
        "mix",
        "Mortar",
        [opt("4", "1:4"), opt("5", "1:5"), opt("6", "1:6")],
        ratioRead && ratioRead.length === 2 ? String(ratioRead[1]) : null,
        th.value === "115" ? "4" : "6",
        chosen,
      );
      const tm = Number(th.value) / 1000;
      const scale = dim === "vol" ? 1 : tm; // per m² = per m³ × thickness
      const m = dryMix([1, Number(mix.value)], 1.27);
      const mortar = 0.25; // m³ wet mortar per m³ of brickwork
      const labour = labourChoice(chosen, inContract);
      const comps: Component[] = [
        {
          key: "bricks",
          kind: "material",
          name: "Bricks",
          unit: "nos",
          qty: r2(500 * scale),
          basis: "500 per m³ incl. breakage",
        },
        {
          key: "cement",
          kind: "material",
          name: "Cement",
          unit: "bags",
          qty: r2(m.cementBags * mortar * scale),
          basis: `1:${mix.value} mortar, 0.25 m³ per m³ of brickwork`,
        },
        {
          key: "sand",
          kind: "material",
          name: "Sand",
          unit: "cft",
          qty: r2(m.sandCft * mortar * scale),
          basis: `1:${mix.value} mortar`,
        },
      ];
      if (labour.value === "contract")
        comps.push({
          key: "lab_brick",
          kind: "labour",
          name: "Brick masonry labour (contract)",
          unit: "m³",
          qty: r2(scale),
          basis: dim === "vol" ? "per m³" : `${th.value} mm = ${tm} m³ per m²`,
        });
      else
        comps.push(
          {
            key: "mason_day",
            kind: "labour",
            name: "Mason",
            unit: "day",
            qty: r2(0.75 * scale),
            basis: "0.75 mason-day per m³",
          },
          {
            key: "helper_day",
            kind: "labour",
            name: "Helper",
            unit: "day",
            qty: r2(1 * scale),
            basis: "1 helper-day per m³",
          },
        );
      return { comps, asm: [th, mix, labour] };
    },
  },
  {
    id: "plaster",
    label: "Cement plaster",
    dims: ["area"],
    test: (d) => /plaster/.test(d) && !/gypsum|\bpop\b|plaster of paris|punning/.test(d),
    build: ({ desc, d, chosen, inContract }) => {
      const t = readThickness(desc);
      const thick = pick(
        "thick",
        "Thickness",
        [
          opt("6", "6 mm"),
          opt("12", "12 mm"),
          opt("15", "15 mm"),
          opt("18", "18 mm"),
          opt("20", "20 mm"),
        ],
        t
          ? String(
              [6, 12, 15, 18, 20].reduce((a, b) => (Math.abs(b - t) < Math.abs(a - t) ? b : a)),
            )
          : null,
        "12",
        chosen,
      );
      const where = pick(
        "where",
        "Surface",
        [opt("int", "Internal walls"), opt("ceiling", "Ceiling"), opt("ext", "External walls")],
        /extern|exterior|outside|elevation/.test(d)
          ? "ext"
          : /ceiling|soffit/.test(d)
            ? "ceiling"
            : /intern|inside/.test(d)
              ? "int"
              : null,
        "int",
        chosen,
      );
      const tmm = Number(thick.value);
      const rRead = readRatio(desc);
      const usualMix = tmm <= 6 ? "3" : tmm <= 12 ? "6" : "4";
      const mix = pick(
        "mix",
        "Mortar",
        [opt("3", "1:3"), opt("4", "1:4"), opt("5", "1:5"), opt("6", "1:6")],
        rRead && rRead.length === 2 ? String(rRead[1]) : null,
        usualMix,
        chosen,
      );
      const wet = 0.0138 * (tmm / 12); // m³ wet mortar per m² (CPWD: 0.0138 for 12 mm incl. wastage)
      const m = dryMix([1, Number(mix.value)], 1.27);
      const labour = labourChoice(chosen, inContract);
      const comps: Component[] = [
        {
          key: "cement",
          kind: "material",
          name: "Cement",
          unit: "bags",
          qty: r2(m.cementBags * wet),
          basis: `${tmm} mm, 1:${mix.value}: ${r2(wet)} m³ mortar per m²`,
        },
        {
          key: "sand",
          kind: "material",
          name: "Sand",
          unit: "cft",
          qty: r2(m.sandCft * wet),
          basis: `1:${mix.value} mortar`,
        },
      ];
      if (labour.value === "contract") {
        const k = where.value === "ext" ? "lab_plaster_ext" : "lab_plaster_int";
        comps.push({
          key: k,
          kind: "labour",
          name: nameOf(k),
          unit: "sft",
          qty: SFT_PER_M2,
          basis: "1 m² = 10.76 sft",
        });
      } else
        comps.push(
          {
            key: "mason_day",
            kind: "labour",
            name: "Mason",
            unit: "day",
            qty: where.value === "ceiling" ? 0.15 : 0.12,
            basis: "per m²",
          },
          {
            key: "helper_day",
            kind: "labour",
            name: "Helper",
            unit: "day",
            qty: 0.12,
            basis: "per m²",
          },
        );
      const notes = /mesh/.test(d)
        ? ["Chicken mesh at junctions is not in this breakdown; add it or keep it as its own line."]
        : [];
      if (where.value === "ext") notes.push("Scaffolding for external plaster is not included.");
      return { comps, asm: [thick, mix, where, labour], notes };
    },
  },
  {
    id: "tiling",
    label: "Tiling",
    dims: ["area"],
    test: (d) =>
      /tile|tiling|vitrified|ceramic|dado|anti.?skid/.test(d) &&
      !/tile adhesive$|grout only/.test(d),
    build: ({ d, chosen }) => {
      const kind = pick(
        "tile",
        "Tile",
        [
          opt("vitrified", "Vitrified (floor)"),
          opt("wall_tile", "Ceramic wall / dado"),
          opt("antiskid", "Anti-skid"),
        ],
        /anti.?skid|parking|terrace|ramp/.test(d)
          ? "antiskid"
          : /wall|dado|ceramic|glazed/.test(d)
            ? "wall_tile"
            : /vitrified|floor/.test(d)
              ? "vitrified"
              : null,
        "vitrified",
        chosen,
      );
      const bed = pick(
        "bed",
        "Fixed with",
        [opt("adhesive", "Tile adhesive"), opt("mortar", "Cement mortar bed 1:4, 20 mm")],
        /adhesive/.test(d) ? "adhesive" : /mortar|cement bed|cm 1:4/.test(d) ? "mortar" : null,
        kind.value === "wall_tile" ? "adhesive" : "mortar",
        chosen,
      );
      const waste = pick(
        "waste",
        "Cutting wastage",
        [opt("5", "5%"), opt("8", "8%"), opt("10", "10%")],
        null,
        "5",
        chosen,
      );
      const comps: Component[] = [
        {
          key: kind.value,
          kind: "material",
          name: nameOf(kind.value),
          unit: "sft",
          qty: r2(SFT_PER_M2 * (1 + Number(waste.value) / 100)),
          basis: `10.76 sft per m² + ${waste.value}% cutting`,
        },
      ];
      if (bed.value === "adhesive")
        comps.push({
          key: "tile_adhesive",
          kind: "material",
          name: "Tile adhesive (20 kg)",
          unit: "bags",
          qty: 0.25,
          basis: "20 kg covers ~4 m²",
        });
      else {
        const m = dryMix([1, 4], 1.27);
        const wet = 0.021;
        comps.push(
          {
            key: "cement",
            kind: "material",
            name: "Cement",
            unit: "bags",
            qty: r2(m.cementBags * wet + 0.066),
            basis: "20 mm 1:4 bed + neat cement slurry 3.3 kg/m²",
          },
          {
            key: "sand",
            kind: "material",
            name: "Sand",
            unit: "cft",
            qty: r2(m.sandCft * wet),
            basis: "20 mm 1:4 bed",
          },
        );
      }
      comps.push({
        key: "lab_tile",
        kind: "labour",
        name: "Tile laying (contract)",
        unit: "sft",
        qty: SFT_PER_M2,
        basis: "1 m² = 10.76 sft",
      });
      return {
        comps,
        asm: [kind, bed, waste],
        notes: ["Grout / spacers are small and not included."],
      };
    },
  },
  {
    id: "painting",
    label: "Painting",
    dims: ["area"],
    test: (d) =>
      /paint|emulsion|putty|distemper/.test(d) && !/enamel|metal|grill|steel|door|window/.test(d),
    build: ({ d, chosen }) => {
      const where = pick(
        "where",
        "Surface",
        [opt("int", "Interior"), opt("ext", "Exterior")],
        /extern|exterior|outside|elevation|weather/.test(d)
          ? "ext"
          : /intern|interior|inside/.test(d)
            ? "int"
            : null,
        "int",
        chosen,
      );
      const putty = pick(
        "putty",
        "Putty",
        [opt("2", "2 coats"), opt("0", "No putty")],
        /putty/.test(d) ? "2" : /without putty|no putty/.test(d) ? "0" : null,
        where.value === "int" ? "2" : "0",
        chosen,
      );
      const coats = pick(
        "coats",
        "Finish coats",
        [opt("1", "1 coat"), opt("2", "2 coats"), opt("3", "3 coats")],
        /three coats|3 coats/.test(d)
          ? "3"
          : /two coats|2 coats/.test(d)
            ? "2"
            : /one coat|1 coat|single coat/.test(d)
              ? "1"
              : null,
        "2",
        chosen,
      );
      const ext = where.value === "ext";
      const comps: Component[] = [];
      if (putty.value !== "0")
        comps.push({
          key: "putty",
          kind: "material",
          name: "Wall putty",
          unit: "kg",
          qty: 1.2,
          basis: "2 coats, ~1.2 kg per m²",
        });
      comps.push(
        {
          key: "primer",
          kind: "material",
          name: "Primer",
          unit: "litre",
          qty: 0.11,
          basis: "1 coat, ~9 m² per litre",
        },
        {
          key: ext ? "emulsion_ext" : "emulsion_int",
          kind: "material",
          name: ext ? "Exterior emulsion" : "Interior emulsion",
          unit: "litre",
          qty: r2((ext ? 0.1 : 0.09) * Number(coats.value)),
          basis: `${coats.value} coat(s), ~${ext ? 10 : 11} m² per litre per coat`,
        },
        {
          key: ext ? "lab_paint_ext" : "lab_paint_int",
          kind: "labour",
          name: ext ? "Painting labour, exterior" : "Painting labour, interior",
          unit: "sft",
          qty: SFT_PER_M2,
          basis: "1 m² = 10.76 sft",
        },
      );
      return { comps, asm: [where, putty, coats] };
    },
  },
];

/** Breakdown for one BOQ line; null when no norm fits (needs a closer look). */
export function analyseLine(
  line: { description: string; unit: string; rate?: number },
  chosen?: Record<string, string>,
  opts?: { civilContract?: boolean; pumpLine?: boolean },
): Analysis | null {
  const desc = line.description ?? "";
  const d = lc(desc);
  const u = unitInfo(line.unit ?? "");
  // The civil labour contract line itself: its cost is the agreed contract rate.
  if (/civil labou?r contract|labou?r contract.*(sft|slab)/.test(d) && (line.rate ?? 0) > 0)
    return {
      normId: "civil-contract",
      normLabel: "Civil labour contract",
      components: [
        {
          key: "civil_contract",
          kind: "labour",
          name: "Civil labour contract (agreed rate)",
          unit: line.unit,
          qty: 1,
          rate: line.rate ?? 0,
          basis: "the rate agreed with the contractor, as in the BOQ",
          origin: "manual",
        },
      ],
      assumptions: [],
      notes: [],
    };
  // A norm states quantities per metric unit; an "area" norm also accepts len/vol only if listed.
  for (const n of NORMS) {
    if (!n.test(d)) continue;
    if (!n.dims.includes(u.dim)) continue;
    const civil = !!opts?.civilContract && CIVIL_NORMS.has(n.id);
    const built = n.build({
      desc,
      d,
      dim: u.dim,
      chosen,
      inContract: civil,
      pumpLine: !!opts?.pumpLine,
    });
    let comps = built.comps;
    const asm = built.asm;
    const notes = built.notes ?? [];
    if (civil) {
      // Steel and shuttering have no labour choice of their own: add it here.
      if (!asm.some((a) => a.id === "labour")) asm.push(labourChoice(chosen, true));
      if (asm.find((a) => a.id === "labour")?.value === "civil") {
        comps = comps.filter((c) => !CIVIL_KEYS.has(c.key));
        notes.push(
          "Labour is paid in the civil labour contract line (₹/sft of slab), so none is added here.",
        );
      }
    }
    return {
      normId: n.id,
      normLabel: n.label,
      components: comps.map((c) => ({ ...c, qty: c.qty * u.toMetric, origin: "norm" as const })),
      assumptions: asm,
      notes,
    };
  }
  return null;
}

// ─── Rates: where each number comes from ────────────────────────────────────────

export type LibraryRate = {
  key: string;
  name: string;
  kind: Kind;
  unit: string;
  rate: number;
  at: string;
  by?: string;
};
export type PoRate = { rate: number; ref: string; date: string; unit: string };
export type RateCtx = {
  library: Record<string, LibraryRate>;
  po: Record<string, PoRate>;
  register: Record<string, { rate: number; n: number }>;
  diesel: number;
};

export type ResolvedRate = { rate: number; src: RateSrc; note: string };

export function resolveRate(c: Component, ctx: RateCtx, lineRate?: number): ResolvedRate {
  if (lineRate !== undefined && lineRate >= 0)
    return { rate: lineRate, src: "line", note: "set on this line" };
  const lib = ctx.library[c.key];
  if (lib)
    return { rate: lib.rate, src: "library", note: `your rate library (${lib.at.slice(0, 10)})` };
  const po = ctx.po[c.key];
  if (po) return { rate: po.rate, src: "po", note: `your last purchase, ${po.ref} · ${po.date}` };
  const reg = ctx.register[c.key];
  if (reg)
    return {
      rate: reg.rate,
      src: "register",
      note: `median day rate in your labour register (${reg.n} entries)`,
    };
  if (c.rate !== undefined)
    return {
      rate: c.rate,
      src: c.origin === "ai" ? "indicative" : "line",
      note: c.origin === "ai" ? "AI estimate, check" : "set on this line",
    };
  const def = DEFAULT_RATES[c.key];
  if (def)
    return {
      rate: def.rate,
      src: def.src,
      note:
        def.src === "77:76 BOQ"
          ? "77:76 Cyber Enclave BOQ (Nov 2026)"
          : "indicative, replace with yours",
    };
  return { rate: 0, src: "indicative", note: "no rate yet" };
}

/** PO lines → latest rate per library key (rate per the library unit). */
const PO_MATCH: { key: string; test: RegExp; not?: RegExp; units: Record<string, number> }[] = [
  {
    key: "cement",
    test: /cement|\bopc\b|\bppc\b/,
    not: /adhesive|putty|board|sheet|primer|white cement/,
    units: { bag: 1, bags: 1, mt: 0.05, ton: 0.05, tonne: 0.05 },
  },
  {
    key: "steel",
    test: /\btmt\b|reinforc|\bfe\s*-?5\d\d|steel bar|rebar/,
    not: /binding/,
    units: { kg: 1, kgs: 1, mt: 0.001, ton: 0.001, tonne: 0.001, t: 0.001 },
  },
  { key: "binding", test: /binding wire/, units: { kg: 1, kgs: 1 } },
  { key: "msand", test: /m.?sand|p.?sand|manufactured sand|robo/, units: { cft: 1 } },
  { key: "sand", test: /\bsand\b/, not: /m.?sand|p.?sand|manufactured|robo/, units: { cft: 1 } },
  {
    key: "agg20",
    test: /(aggregate|jelly|metal|chips).*20|20 ?mm.*(aggregate|jelly|metal)/,
    units: { cft: 1 },
  },
  {
    key: "agg40",
    test: /(aggregate|jelly|metal).*40|40 ?mm.*(aggregate|jelly|metal)/,
    units: { cft: 1 },
  },
  {
    key: "aac_200",
    test: /aac|aerated|siporex/,
    not: /adhesive|100 ?mm|150 ?mm/,
    units: { nos: 1, no: 1, pcs: 1 },
  },
  {
    key: "aac_150",
    test: /(aac|aerated).*150|150.*(aac|block)/,
    not: /adhesive/,
    units: { nos: 1, no: 1, pcs: 1 },
  },
  {
    key: "aac_100",
    test: /(aac|aerated).*100|100.*(aac|block)/,
    not: /adhesive/,
    units: { nos: 1, no: 1, pcs: 1 },
  },
  {
    key: "aac_adhesive",
    test: /(block|aac).*adhesive|adhesive.*(block|aac)/,
    units: { bag: 1, bags: 1 },
  },
  { key: "tile_adhesive", test: /tile.*adhesive|adhesive.*tile/, units: { bag: 1, bags: 1 } },
  { key: "bricks", test: /\bbricks?\b/, not: /aac|tile/, units: { nos: 1, no: 1, pcs: 1 } },
  { key: "putty", test: /putty/, units: { kg: 1, kgs: 1 } },
  {
    key: "diesel",
    test: /diesel|\bhsd\b/,
    units: { l: 1, ltr: 1, litre: 1, liter: 1, ltrs: 1, litres: 1 },
  },
];

for (const g of [15, 20, 25, 30, 35, 40])
  PO_MATCH.push({
    key: `rmc_m${g}`,
    test: new RegExp(
      `(rmc|ready.?mix|concrete).*\\bm\\s*-?${g}\\b|\\bm\\s*-?${g}\\b.*(rmc|ready.?mix)`,
    ),
    units: { cum: 1, m3: 1, "m³": 1, cbm: 1 },
  });

export function poRates(
  rows: {
    description: string;
    unit: string;
    rate: number;
    discount_pct?: number | null;
    po_number: string;
    po_date: string;
  }[],
): Record<string, PoRate> {
  const out: Record<string, PoRate> = {};
  const sorted = [...rows].sort((a, b) => (a.po_date < b.po_date ? 1 : -1));
  for (const r of sorted) {
    const d = lc(r.description ?? "");
    const u = lc(String(r.unit ?? "")).replace(/[\s.]/g, "");
    const net = Number(r.rate) * (1 - Number(r.discount_pct ?? 0) / 100);
    if (!(net > 0)) continue;
    for (const m of PO_MATCH) {
      if (out[m.key]) continue;
      if (!m.test.test(d) || (m.not && m.not.test(d))) continue;
      const f = m.units[u];
      if (f === undefined) continue;
      // f turns the PO unit into the library unit (per MT → per kg ×0.001; cement per MT → per bag ×0.05).
      out[m.key] = {
        rate: Math.round(net * f * 100) / 100,
        ref: r.po_number,
        date: r.po_date,
        unit: u,
      };
    }
  }
  return out;
}

/** The rate-library key a purchase line belongs to, and the factor to its library unit. */
export function matchKey(
  description: string,
  unit: string,
): { key: string; factor: number } | null {
  const d = lc(description ?? "");
  const u = lc(String(unit ?? "")).replace(/[\s.]/g, "");
  for (const m of PO_MATCH) {
    if (!m.test.test(d) || (m.not && m.not.test(d))) continue;
    const f = m.units[u];
    if (f === undefined) continue;
    return { key: m.key, factor: f };
  }
  return null;
}

/** Median day rate by trade from the labour register → mason_day / helper_day. */
export function registerRates(rows: { trade: string; day_rate: number }[]) {
  const mason: number[] = [];
  const helper: number[] = [];
  for (const r of rows) {
    const t = lc(r.trade ?? "");
    const rate = Number(r.day_rate);
    if (!(rate > 0)) continue;
    if (/mason|mistri|meson/.test(t)) mason.push(rate);
    else if (/helper|beldar|coolie|labou?r|mazdoor|unskilled/.test(t)) helper.push(rate);
  }
  const out: Record<string, { rate: number; n: number }> = {};
  const median = (v: number[]) => {
    const s = [...v].sort((a, b) => a - b);
    const mid = Math.floor(s.length / 2);
    return s.length % 2 ? (s[mid] ?? 0) : ((s[mid - 1] ?? 0) + (s[mid] ?? 0)) / 2;
  };
  if (mason.length >= 3) out["mason_day"] = { rate: median(mason), n: mason.length };
  if (helper.length >= 3) out["helper_day"] = { rate: median(helper), n: helper.length };
  return out;
}

// ─── Per-line state and totals ─────────────────────────────────────────────────

/** What the user changed on a line; saved with the project's budget. */
export type LineState = {
  choices?: Record<string, string>;
  /** Per component key: qty per unit and/or rate set on this line. */
  edits?: Record<string, { qty?: number; rate?: number }>;
  removed?: string[];
  added?: Component[];
  /** "skip" = this line is not budgeted (e.g. provisional sum). */
  skip?: boolean;
};

export type CostedComponent = Component & {
  rate: number;
  src: RateSrc;
  note: string;
  dieselPerUnit: number; // ₹ of diesel per BOQ unit
  amountPerUnit: number; // ₹ per BOQ unit incl. diesel
  edited: boolean;
};

export type LineBudget = {
  analysis: Analysis | null;
  components: CostedComponent[];
  perUnit: Record<Kind, number>;
  budgetRate: number;
  budgeted: boolean;
};

export function costLine(
  line: { description: string; unit: string; rate?: number },
  state: LineState | undefined,
  ctx: RateCtx,
  opts?: { civilContract?: boolean; pumpLine?: boolean },
): LineBudget {
  const analysis = state?.skip ? null : analyseLine(line, state?.choices, opts);
  const removed = new Set(state?.removed ?? []);
  const base = (analysis?.components ?? []).filter((c) => !removed.has(c.key));
  const all = [...base, ...(state?.skip ? [] : (state?.added ?? []))];
  const perUnit: Record<Kind, number> = { material: 0, labour: 0, equipment: 0 };
  const components: CostedComponent[] = all.map((c) => {
    const e = state?.edits?.[c.key];
    const qty = e?.qty !== undefined ? e.qty : c.qty;
    const r = resolveRate(c, ctx, e?.rate);
    const dieselPerUnit =
      c.kind === "equipment" && c.dieselLph ? qty * c.dieselLph * ctx.diesel : 0;
    const amountPerUnit = qty * r.rate + dieselPerUnit;
    perUnit[c.kind] += amountPerUnit;
    return { ...c, qty, ...r, dieselPerUnit, amountPerUnit, edited: e !== undefined };
  });
  const budgetRate = perUnit.material + perUnit.labour + perUnit.equipment;
  return {
    analysis,
    components,
    perUnit,
    budgetRate,
    budgeted: components.length > 0 && budgetRate > 0,
  };
}

export type Flag = { tone: "bad" | "warn"; text: string };
export function lineFlag(boqRate: number, budgetRate: number, budgeted: boolean): Flag | null {
  if (!budgeted || boqRate <= 0) return null;
  const m = (boqRate - budgetRate) / boqRate;
  if (m < 0) return { tone: "bad", text: "Costs more than the BOQ rate" };
  if (m < 0.05) return { tone: "warn", text: "Thin margin (under 5%)" };
  if (m > 0.5)
    return { tone: "warn", text: "Budget under half the BOQ rate: something may be missing" };
  return null;
}

export const slug = (s: string) =>
  "x_" +
  lc(s)
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 40);
