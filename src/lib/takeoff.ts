/**
 * BOQ from drawings: the drawing checklist, the takeoff data read from the drawings,
 * and the quantity engine that turns the takeoff into a stage-wise BOQ.
 *
 * The AI only READS the drawings (dimensions, schedules, counts) into the Takeoff shape.
 * Every quantity below is worked out here with fixed, visible formulas, so each BOQ line
 * carries its basis and can be checked by an engineer.
 *
 * Units: lengths in feet, areas in sft, concrete in m³ (1 m³ = 35.3147 cft), steel in kg.
 * Default rates come from the 77:76 Cyber Enclave BOQ (Nov 2026) where that BOQ has the
 * item; the rest are marked "indicative" and must be confirmed with quotes.
 */

export const CFT_PER_M3 = 35.3147;
const SFT_PER_M2 = 10.7639;

// ─── Drawing checklist ─────────────────────────────────────────────────────────

export type SlotKey =
  | "plans"
  | "sections"
  | "schedule"
  | "elevations"
  | "site"
  | "footings"
  | "columns"
  | "beams"
  | "slabs"
  | "bbs"
  | "electrical"
  | "plumbing"
  | "finishes";

export type DrawingSlot = {
  key: SlotKey;
  group: "Architectural" | "Structural" | "Services" | "Finishes";
  title: string;
  /** What the app reads from it. */
  gives: string;
  /** What the BOQ loses without it. */
  without: string;
  required: boolean;
};

export const DRAWING_SLOTS: DrawingSlot[] = [
  {
    key: "plans",
    group: "Architectural",
    title: "Floor plans, every floor (stilt, typical, terrace)",
    gives: "Rooms and sizes, wall lengths, built-up area, number of identical floors",
    without: "No masonry, plaster, flooring or paint quantities",
    required: true,
  },
  {
    key: "sections",
    group: "Architectural",
    title: "Building section(s)",
    gives: "Floor-to-floor height, slab and beam depth, plinth, parapet, sill heights",
    without: "Wall heights assumed 10′ floor to floor",
    required: true,
  },
  {
    key: "schedule",
    group: "Architectural",
    title: "Door and window schedule",
    gives: "Every door, window, ventilator and slider: size and count",
    without: "Doors and windows read from the plans only (less exact)",
    required: true,
  },
  {
    key: "elevations",
    group: "Architectural",
    title: "Elevations",
    gives: "Facade height and exterior finish areas",
    without: "Exterior paint worked out from the plan perimeter",
    required: false,
  },
  {
    key: "site",
    group: "Architectural",
    title: "Site plan",
    gives: "Compound wall length, paving, sump and septic tank",
    without: "No site-works lines",
    required: false,
  },
  {
    key: "footings",
    group: "Structural",
    title: "Footing layout and footing schedule",
    gives: "Footing sizes, depths and counts; founding depth; PCC",
    without: "No excavation, PCC or footing concrete",
    required: true,
  },
  {
    key: "columns",
    group: "Structural",
    title: "Column layout and column schedule",
    gives: "Column sizes and counts per floor",
    without: "No column concrete or centering",
    required: true,
  },
  {
    key: "beams",
    group: "Structural",
    title: "Beam layouts (plinth and every floor)",
    gives: "Beam sizes and total beam lengths per level",
    without: "No beam concrete or centering",
    required: true,
  },
  {
    key: "slabs",
    group: "Structural",
    title: "Slab details and staircase",
    gives: "Slab areas and thickness per level, staircase, chajjas",
    without: "Slabs taken as the built-up area at 5″",
    required: true,
  },
  {
    key: "bbs",
    group: "Structural",
    title: "Bar bending schedule (BBS) / steel abstract",
    gives: "Steel by bar diameter",
    without: "Steel worked out from kg per m³ ratios for each element",
    required: false,
  },
  {
    key: "electrical",
    group: "Services",
    title: "Electrical layout",
    gives: "Light, fan, socket, AC, TV / data points per floor; DBs",
    without: "Points estimated per room",
    required: false,
  },
  {
    key: "plumbing",
    group: "Services",
    title: "Plumbing and drainage layout",
    gives: "Toilets, kitchens, fixtures; pipe runs",
    without: "Fixtures estimated from the room list",
    required: false,
  },
  {
    key: "finishes",
    group: "Finishes",
    title: "Specification / finish schedule",
    gives: "Floor finish per room, dado heights, kitchen counter, wall material, plaster type",
    without: "Standard specification used (shown on the review screen)",
    required: false,
  },
];

// ─── Takeoff data (what the AI reads, what the engineer checks) ────────────────

export type RoomType =
  | "bed"
  | "living"
  | "kitchen"
  | "toilet"
  | "balcony"
  | "utility"
  | "passage"
  | "store"
  | "stair"
  | "lift"
  | "parking"
  | "other";

export type Room = {
  name: string;
  type: RoomType;
  length_ft: number;
  width_ft: number;
  count: number;
};

export type Floor = {
  name: string;
  /** How many identical floors this plan stands for (e.g. 4 typical floors). */
  repeat: number;
  /** stilt / parking floors have no flats: no partitions, finishes or services. */
  kind: "stilt" | "typical" | "ground" | "terrace" | "other";
  built_up_sft: number;
  external_perimeter_ft: number;
  rooms: Room[];
};

export type Opening = {
  mark: string;
  kind: "main-door" | "door" | "toilet-door" | "window" | "ventilator" | "slider";
  width_ft: number;
  height_ft: number;
  count: number;
};

export type Footing = {
  mark: string;
  length_ft: number;
  width_ft: number;
  depth_ft: number;
  count: number;
};
export type Column = { mark: string; b_in: number; d_in: number; count: number; levels: number };
export type Beam = { level: string; b_in: number; d_in: number; length_ft: number; repeat: number };
export type Slab = { level: string; area_sft: number; thickness_in: number; repeat: number };

export type Takeoff = {
  floors: Floor[];
  heights: {
    floor_to_floor_ft: number;
    slab_in: number;
    beam_depth_in: number;
    plinth_ft: number;
    parapet_ft: number;
    founding_depth_ft: number;
  };
  openings: Opening[];
  footings: Footing[];
  pcc_in: number;
  columns: Column[];
  beams: Beam[];
  slabs: Slab[];
  staircase_m3: number;
  steel_kg_by_dia: { dia_mm: number; kg: number }[];
  electrical: {
    light: number;
    fan: number;
    socket_6a: number;
    socket_16a: number;
    ac: number;
    tv_data: number;
    dbs: number;
  };
  plumbing: {
    wc: number;
    basin: number;
    shower: number;
    kitchen_sink: number;
    utility_tap: number;
  };
  site: { compound_wall_rft: number; paving_sft: number };
  finishes: {
    masonry: "aac" | "brick";
    external_wall_in: number;
    internal_wall_in: number;
    internal_finish: "gypsum" | "cement";
    toilet_dado_ft: number;
    kitchen_counter_rft: number;
    concrete_grade: string;
  };
  /** Which slots the data came from, and notes from the reader. */
  sources: Partial<Record<SlotKey, { file: string; read_at: string; notes: string[] }>>;
};

export function emptyTakeoff(): Takeoff {
  return {
    floors: [],
    heights: {
      floor_to_floor_ft: 10,
      slab_in: 5,
      beam_depth_in: 18,
      plinth_ft: 2,
      parapet_ft: 3.5,
      founding_depth_ft: 5,
    },
    openings: [],
    footings: [],
    pcc_in: 3,
    columns: [],
    beams: [],
    slabs: [],
    staircase_m3: 0,
    steel_kg_by_dia: [],
    electrical: { light: 0, fan: 0, socket_6a: 0, socket_16a: 0, ac: 0, tv_data: 0, dbs: 0 },
    plumbing: { wc: 0, basin: 0, shower: 0, kitchen_sink: 0, utility_tap: 0 },
    site: { compound_wall_rft: 0, paving_sft: 0 },
    finishes: {
      masonry: "aac",
      external_wall_in: 8,
      internal_wall_in: 4,
      internal_finish: "gypsum",
      toilet_dado_ft: 7,
      kitchen_counter_rft: 0,
      concrete_grade: "M25",
    },
    sources: {},
  };
}

/** A sample building (stilt + 5, two 4BHK flats a floor, 113′ × 36′) to try the page without drawings. */
export function sampleTakeoff(): Takeoff {
  const t = emptyTakeoff();
  const rooms: Room[] = [
    { name: "Toilet", type: "toilet", length_ft: 5.94, width_ft: 12.5, count: 2 },
    { name: "Bedroom-03", type: "bed", length_ft: 11.87, width_ft: 12.5, count: 2 },
    { name: "Toilet", type: "toilet", length_ft: 5.38, width_ft: 12.5, count: 2 },
    { name: "Bedroom-02", type: "bed", length_ft: 11.87, width_ft: 12.5, count: 2 },
    { name: "Balcony", type: "balcony", length_ft: 17.94, width_ft: 5.0, count: 2 },
    { name: "Drawing", type: "living", length_ft: 17.94, width_ft: 10.0, count: 2 },
    { name: "Balcony", type: "balcony", length_ft: 13.5, width_ft: 7.5, count: 2 },
    { name: "Passage", type: "passage", length_ft: 4.31, width_ft: 11.0, count: 2 },
    { name: "Living", type: "living", length_ft: 17.25, width_ft: 11.0, count: 2 },
    { name: "Dining", type: "living", length_ft: 11.94, width_ft: 8.5, count: 2 },
    { name: "Foyer", type: "passage", length_ft: 6, width_ft: 8.5, count: 2 },
    { name: "M.Bedroom", type: "bed", length_ft: 13.5, width_ft: 16, count: 2 },
    { name: "Toilet", type: "toilet", length_ft: 5.38, width_ft: 12.5, count: 2 },
    { name: "Bedroom-01", type: "bed", length_ft: 11.87, width_ft: 12.5, count: 2 },
    { name: "P.Room", type: "toilet", length_ft: 5.37, width_ft: 4.06, count: 2 },
    { name: "Toilet", type: "toilet", length_ft: 5.37, width_ft: 8.44, count: 2 },
    { name: "Kitchen", type: "kitchen", length_ft: 10.88, width_ft: 12.5, count: 2 },
    { name: "Store", type: "store", length_ft: 6, width_ft: 5.5, count: 2 },
    { name: "Utility", type: "utility", length_ft: 6, width_ft: 7, count: 2 },
    { name: "Lift", type: "lift", length_ft: 7, width_ft: 7, count: 1 },
  ] as Room[];
  t.floors = [
    {
      name: "Stilt (parking)",
      repeat: 1,
      kind: "stilt",
      built_up_sft: 4068,
      external_perimeter_ft: 0,
      rooms: [],
    },
    {
      name: "Typical floor (1st–5th)",
      repeat: 5,
      kind: "typical",
      built_up_sft: 4068,
      external_perimeter_ft: 298,
      rooms,
    },
    {
      name: "Terrace",
      repeat: 1,
      kind: "terrace",
      built_up_sft: 4068,
      external_perimeter_ft: 0,
      rooms: [],
    },
  ];
  t.heights = {
    floor_to_floor_ft: 10,
    slab_in: 6,
    beam_depth_in: 24,
    plinth_ft: 2,
    parapet_ft: 3.5,
    founding_depth_ft: 6,
  };
  t.footings = [
    { mark: "F1", length_ft: 7, width_ft: 7, depth_ft: 2, count: 10 },
    { mark: "F2", length_ft: 8, width_ft: 8, depth_ft: 2.25, count: 12 },
    { mark: "F3", length_ft: 9, width_ft: 9, depth_ft: 2.5, count: 8 },
  ];
  t.columns = [
    { mark: "C1", b_in: 12, d_in: 24, count: 24, levels: 6 },
    { mark: "C2", b_in: 12, d_in: 30, count: 6, levels: 6 },
  ];
  t.beams = [
    { level: "Plinth", b_in: 12, d_in: 24, length_ft: 650, repeat: 1 },
    { level: "Floors 1–5 + terrace", b_in: 9, d_in: 24, length_ft: 700, repeat: 6 },
  ];
  t.slabs = [{ level: "Floors 1–5 + terrace", area_sft: 4068, thickness_in: 6, repeat: 6 }];
  t.staircase_m3 = 18;
  t.openings = [
    { mark: "W1", kind: "window", width_ft: 5, height_ft: 5.5, count: 50 },
    { mark: "KW", kind: "window", width_ft: 4, height_ft: 4.5, count: 10 },
    { mark: "V1", kind: "ventilator", width_ft: 2, height_ft: 3, count: 40 },
    { mark: "SD", kind: "slider", width_ft: 6, height_ft: 8, count: 20 },
    { mark: "MD", kind: "main-door", width_ft: 3.5, height_ft: 7, count: 10 },
    { mark: "D1", kind: "door", width_ft: 3, height_ft: 7, count: 40 },
    { mark: "D2", kind: "toilet-door", width_ft: 2.5, height_ft: 7, count: 50 },
  ];
  t.site = { compound_wall_rft: 353, paving_sft: 1469 };
  t.finishes = { ...t.finishes, concrete_grade: "M30" };
  const src = { file: "Sample building", read_at: "", notes: [] as string[] };
  t.sources = {
    plans: src,
    sections: src,
    schedule: src,
    footings: src,
    columns: src,
    beams: src,
    slabs: src,
    site: src,
  };
  return t;
}

/** Which parts of the takeoff each slot fills (a new reading of that slot replaces them). */
export const SLOT_FIELDS: Record<SlotKey, (keyof Takeoff)[]> = {
  plans: ["floors"],
  sections: ["heights"],
  schedule: ["openings"],
  elevations: [],
  site: ["site"],
  footings: ["footings", "pcc_in"],
  columns: ["columns"],
  beams: ["beams"],
  slabs: ["slabs", "staircase_m3"],
  bbs: ["steel_kg_by_dia"],
  electrical: ["electrical"],
  plumbing: ["plumbing"],
  finishes: ["finishes"],
};

// ─── Rates ──────────────────────────────────────────────────────────────────────

export type RateSource = "77:76 BOQ" | "indicative";
type Rate = { rate: number; unit: string; src: RateSource };

/** Default rates (₹, before GST). 77:76 = taken from the 77:76 Cyber Enclave BOQ, Nov 2026. */
export const RATES: Record<string, Rate> = {
  excavation: { rate: 350, unit: "m³", src: "77:76 BOQ" },
  backfill: { rate: 150, unit: "m³", src: "77:76 BOQ" },
  antitermite: { rate: 6, unit: "sft", src: "77:76 BOQ" },
  pcc: { rate: 4800, unit: "m³", src: "77:76 BOQ" },
  rmc_m30: { rate: 4406.78, unit: "m³", src: "77:76 BOQ" },
  rmc_m25: { rate: 4067.8, unit: "m³", src: "77:76 BOQ" },
  pumping: { rate: 350, unit: "m³", src: "77:76 BOQ" },
  steel: { rate: 53.39, unit: "kg", src: "77:76 BOQ" },
  binding: { rate: 110, unit: "kg", src: "77:76 BOQ" },
  cover_blocks: { rate: 6, unit: "nos", src: "indicative" },
  centering: { rate: 45, unit: "sft", src: "indicative" },
  aac_200: { rate: 77, unit: "nos", src: "77:76 BOQ" },
  aac_150: { rate: 60, unit: "nos", src: "77:76 BOQ" },
  aac_100: { rate: 42, unit: "nos", src: "indicative" },
  adhesive: { rate: 420, unit: "bags", src: "77:76 BOQ" },
  bricks: { rate: 11, unit: "nos", src: "77:76 BOQ" },
  cement: { rate: 390, unit: "bags", src: "77:76 BOQ" },
  sand: { rate: 70, unit: "cft", src: "77:76 BOQ" },
  msand: { rate: 65, unit: "cft", src: "77:76 BOQ" },
  mesh: { rate: 15, unit: "rft", src: "77:76 BOQ" },
  gypsum: { rate: 30, unit: "sft", src: "77:76 BOQ" },
  ext_plaster_labour: { rate: 28, unit: "sft", src: "indicative" },
  int_plaster_labour: { rate: 22, unit: "sft", src: "indicative" },
  int_paint: { rate: 24, unit: "sft", src: "indicative" },
  ext_paint: { rate: 26, unit: "sft", src: "77:76 BOQ" },
  wp_wet: { rate: 45, unit: "sft", src: "77:76 BOQ" },
  wp_terrace: { rate: 75, unit: "sft", src: "77:76 BOQ" },
  vitrified: { rate: 85, unit: "sft", src: "indicative" },
  antiskid: { rate: 44.07, unit: "sft", src: "77:76 BOQ" },
  wall_tile: { rate: 70, unit: "sft", src: "indicative" },
  tile_adhesive: { rate: 650, unit: "bags", src: "77:76 BOQ" },
  tile_laying: { rate: 35, unit: "sft", src: "77:76 BOQ" },
  screed_labour: { rate: 12, unit: "sft", src: "77:76 BOQ" },
  skirting: { rate: 90, unit: "rft", src: "77:76 BOQ" },
  granite_counter: { rate: 220, unit: "sft", src: "77:76 BOQ" },
  granite_sill: { rate: 140, unit: "rft", src: "77:76 BOQ" },
  window: { rate: 380, unit: "sft", src: "77:76 BOQ" },
  ventilator: { rate: 700, unit: "sft", src: "77:76 BOQ" },
  slider: { rate: 520, unit: "sft", src: "77:76 BOQ" },
  main_door: { rate: 45000, unit: "nos", src: "indicative" },
  door: { rate: 18000, unit: "nos", src: "indicative" },
  toilet_door: { rate: 14000, unit: "nos", src: "indicative" },
  conduit: { rate: 18, unit: "rft", src: "77:76 BOQ" },
  wire_15: { rate: 1600, unit: "coils", src: "indicative" },
  wire_25: { rate: 2500, unit: "coils", src: "indicative" },
  wire_40: { rate: 3900, unit: "coils", src: "indicative" },
  point_labour: { rate: 322.2, unit: "pts", src: "77:76 BOQ" },
  switch_module: { rate: 180, unit: "nos", src: "indicative" },
  db: { rate: 9000, unit: "nos", src: "indicative" },
  cpvc: { rate: 45, unit: "ft", src: "77:76 BOQ" },
  swr_110: { rate: 125, unit: "ft", src: "77:76 BOQ" },
  swr_75: { rate: 85, unit: "ft", src: "77:76 BOQ" },
  swr_50: { rate: 60, unit: "ft", src: "77:76 BOQ" },
  wc: { rate: 18000, unit: "nos", src: "indicative" },
  basin: { rate: 7000, unit: "nos", src: "indicative" },
  shower_set: { rate: 9000, unit: "nos", src: "indicative" },
  sink: { rate: 8000, unit: "nos", src: "indicative" },
  compound_wall: { rate: 2200, unit: "rft", src: "77:76 BOQ" },
  civil_labour: { rate: 220, unit: "sft", src: "77:76 BOQ" },
  lift: { rate: 1313559, unit: "nos", src: "77:76 BOQ" },
  paving: { rate: 110, unit: "sft", src: "77:76 BOQ" },
};

// ─── Stages ─────────────────────────────────────────────────────────────────────

export const STAGES = [
  "1 · Foundations",
  "2 · Frame (RCC)",
  "3 · Masonry",
  "4 · Services first fix",
  "5 · Plaster and waterproofing",
  "6 · Doors and windows",
  "7 · Flooring and dado",
  "8 · Painting",
  "9 · Fixtures and fittings",
  "10 · Site works",
] as const;
export type Stage = (typeof STAGES)[number];

export type BoqLine = {
  /** Rate key (RATES), used for the materials summary. */
  key: string;
  stage: Stage;
  item: string;
  qty: number;
  unit: string;
  rate: number;
  amount: number;
  rateSource: RateSource;
  /** How the quantity was worked out, in words and numbers. */
  basis: string;
  /** Rate and vendor can be locked before the site starts (quantity known from the drawings). */
  lockBeforeStart: boolean;
  /** The takeoff had no data for this, so the line uses a stated assumption. */
  assumed?: boolean;
};

const r2 = (n: number) => Math.round(n * 100) / 100;
const r0 = (n: number) => Math.round(n);
const fmt = (n: number, d = 1) => n.toLocaleString("en-IN", { maximumFractionDigits: d });

// ─── The quantity engine ────────────────────────────────────────────────────────

export type BoqResult = {
  lines: BoqLine[];
  byStage: { stage: Stage; amount: number; lines: number }[];
  total: number;
  builtUpSft: number;
  perSft: number;
  missing: SlotKey[];
  concreteM3: number;
  steelKg: number;
  /** Main materials, totalled across stages. */
  materials: { name: string; qty: number; unit: string }[];
};

const MATERIAL_GROUPS: [string, string[]][] = [
  ["Ready-mix concrete (RMC)", ["rmc_m30", "rmc_m25"]],
  ["PCC M10", ["pcc"]],
  ["TMT steel", ["steel"]],
  ["Cement", ["cement"]],
  ["Sand / M-sand (robo sand)", ["msand", "sand"]],
  ["AAC blocks", ["aac_200", "aac_150", "aac_100"]],
  ["Red bricks", ["bricks"]],
  ["Block adhesive", ["adhesive"]],
  ["Centering / shuttering area", ["centering"]],
  ["Floor tiles", ["vitrified", "antiskid"]],
  ["Wall tiles", ["wall_tile"]],
  ["Tile adhesive", ["tile_adhesive"]],
  ["Granite (counters)", ["granite_counter"]],
  ["Windows, ventilators, sliders", ["window", "ventilator", "slider"]],
  ["Doors", ["main_door", "door", "toilet_door"]],
  ["Wires (90 m coils)", ["wire_15", "wire_25", "wire_40"]],
  ["Electrical conduit", ["conduit"]],
  ["CPVC pipes", ["cpvc"]],
  ["SWR drainage pipes", ["swr_110", "swr_75", "swr_50"]],
  ["Interior paint area", ["int_paint"]],
  ["Exterior paint area", ["ext_paint"]],
];

export function computeBoq(t: Takeoff, present: Set<SlotKey>): BoqResult {
  const L: BoqLine[] = [];
  const add = (
    stage: Stage,
    item: string,
    qty: number,
    rateKey: string,
    basis: string,
    lock = false,
    assumed = false,
    inContract = false,
  ) => {
    const r = RATES[rateKey];
    if (!r || !(qty > 0)) return;
    if (inContract) basis += " · cost in the civil labour contract";
    const q =
      r.unit === "nos" || r.unit === "coils" || r.unit === "bags" || r.unit === "pts"
        ? Math.ceil(qty)
        : r2(qty);
    L.push({
      key: rateKey,
      stage,
      item,
      qty: q,
      unit: r.unit,
      rate: inContract ? 0 : r.rate,
      amount: inContract ? 0 : r0(q * r.rate),
      rateSource: r.src,
      basis,
      lockBeforeStart: lock,
      assumed,
    });
  };

  const h = t.heights;
  const f2f = h.floor_to_floor_ft || 10;
  const slabFt = (h.slab_in || 5) / 12;
  const beamFt = (h.beam_depth_in || 18) / 12;
  const wallH = Math.max(0, f2f - beamFt);
  const rmcKey = /30/.test(t.finishes.concrete_grade) ? "rmc_m30" : "rmc_m25";
  const grade = /30/.test(t.finishes.concrete_grade) ? "M30" : "M25";
  const flatFloors = t.floors.filter((f) => f.kind !== "stilt" && f.kind !== "terrace");
  const builtUp = t.floors.reduce((s, f) => s + (f.built_up_sft || 0) * (f.repeat || 1), 0);

  // ── 1 Foundations ──
  let excav = 0,
    pcc = 0,
    footCft = 0,
    footShut = 0,
    footArea = 0;
  for (const f of t.footings) {
    const n = f.count || 0;
    excav += (f.length_ft + 2) * (f.width_ft + 2) * (h.founding_depth_ft || 5) * n;
    pcc += (f.length_ft + 0.5) * (f.width_ft + 0.5) * ((t.pcc_in || 3) / 12) * n;
    footCft += f.length_ft * f.width_ft * f.depth_ft * n;
    footShut += 2 * (f.length_ft + f.width_ft) * f.depth_ft * n;
    footArea += f.length_ft * f.width_ft * n;
  }
  const nFoot = t.footings.reduce((s, f) => s + (f.count || 0), 0);
  // neck columns: footing top to plinth beam, using the ground-floor column sizes
  const neckH = Math.max(
    0,
    (h.founding_depth_ft || 5) - avg(t.footings.map((f) => f.depth_ft)) + (h.plinth_ft || 2),
  );
  const colArea = t.columns.reduce((s, c) => s + (c.b_in / 12) * (c.d_in / 12) * c.count, 0);
  const colPerim = t.columns.reduce((s, c) => s + 2 * ((c.b_in + c.d_in) / 12) * c.count, 0);
  const neckCft = colArea * neckH;
  const backfill = Math.max(0, excav - pcc - footCft - neckCft);
  if (t.footings.length) {
    add(
      "1 · Foundations",
      "Excavation for footings",
      excav / CFT_PER_M3,
      "excavation",
      `${nFoot} footings, (L+2′)×(B+2′)×${h.founding_depth_ft}′ founding depth`,
      false,
    );
    add(
      "1 · Foundations",
      "Anti-termite treatment, pit bottoms and sides",
      footArea * 1.6,
      "antitermite",
      "Footing plan area × 1.6 (bottoms + sides)",
      false,
    );
    add(
      "1 · Foundations",
      "PCC M10 under footings",
      pcc / CFT_PER_M3,
      "pcc",
      `(L+6″)×(B+6″)×${t.pcc_in}″ under ${nFoot} footings`,
      true,
    );
    add(
      "1 · Foundations",
      `RMC ${grade}: footings`,
      (footCft / CFT_PER_M3) * 1.02,
      rmcKey,
      `Σ L×B×D of ${nFoot} footings = ${fmt(footCft / CFT_PER_M3)} m³ + 2% wastage`,
      true,
    );
    add(
      "1 · Foundations",
      `RMC ${grade}: neck columns`,
      (neckCft / CFT_PER_M3) * 1.02,
      rmcKey,
      `Column section ${fmt(colArea)} sft × ${fmt(neckH)}′ footing top to plinth + 2%`,
      true,
    );
    add(
      "1 · Foundations",
      "Centering: footing sides",
      footShut,
      "centering",
      "Σ 2(L+B)×D",
      false,
      false,
      true,
    );
    add(
      "1 · Foundations",
      "Backfill, compacted in layers",
      backfill / CFT_PER_M3,
      "backfill",
      "Excavation − PCC − footings − neck columns",
      false,
    );
  }

  // ── 2 Frame ──
  const nLevels = Math.max(
    1,
    t.floors.reduce((s, f) => s + (f.kind === "terrace" ? 0 : f.repeat || 1), 0),
  );
  let colCft = 0,
    colShut = 0;
  for (const c of t.columns) {
    const levels = c.levels || nLevels;
    colCft += (c.b_in / 12) * (c.d_in / 12) * (f2f - slabFt) * c.count * levels;
    colShut += 2 * ((c.b_in + c.d_in) / 12) * (f2f - slabFt) * c.count * levels;
  }
  let beamCft = 0,
    beamShut = 0;
  for (const b of t.beams) {
    const below = Math.max(0, b.d_in / 12 - slabFt);
    beamCft += (b.b_in / 12) * below * b.length_ft * (b.repeat || 1);
    beamShut += (b.b_in / 12 + 2 * below) * b.length_ft * (b.repeat || 1);
  }
  let slabs = t.slabs;
  let slabsAssumed = false;
  if (!slabs.length && builtUp > 0) {
    slabs = [{ level: "All floors", area_sft: builtUp, thickness_in: h.slab_in || 5, repeat: 1 }];
    slabsAssumed = true;
  }
  let slabCft = 0,
    slabSoffit = 0;
  for (const s of slabs) {
    slabCft += s.area_sft * (s.thickness_in / 12) * (s.repeat || 1);
    slabSoffit += s.area_sft * (s.repeat || 1);
  }
  const stairM3 = t.staircase_m3 || 0;
  if (t.columns.length)
    add(
      "2 · Frame (RCC)",
      `RMC ${grade}: columns`,
      (colCft / CFT_PER_M3) * 1.02,
      rmcKey,
      `${t.columns.reduce((s, c) => s + c.count, 0)} columns × ${fmt(f2f - slabFt)}′ clear × ${nLevels} levels + 2%`,
      true,
    );
  if (t.beams.length)
    add(
      "2 · Frame (RCC)",
      `RMC ${grade}: beams (below slab)`,
      (beamCft / CFT_PER_M3) * 1.02,
      rmcKey,
      `Σ b×(d−slab)×length over ${t.beams.length} beam groups + 2%`,
      true,
    );
  add(
    "2 · Frame (RCC)",
    `RMC ${grade}: slabs`,
    (slabCft / CFT_PER_M3) * 1.02,
    rmcKey,
    `${fmt(slabSoffit, 0)} sft × thickness + 2%${slabsAssumed ? " (no slab drawing: built-up area at 5″)" : ""}`,
    true,
    slabsAssumed,
  );
  if (stairM3)
    add(
      "2 · Frame (RCC)",
      `RMC ${grade}: staircase`,
      stairM3 * 1.02,
      rmcKey,
      "From the slab / stair drawing + 2%",
      true,
    );
  const rccM3 = (footCft + neckCft + colCft + beamCft + slabCft) / CFT_PER_M3 + stairM3;
  add(
    "2 · Frame (RCC)",
    "Civil labour contract: shuttering with material, steel fixing, concreting, masonry, plaster",
    slabSoffit,
    "civil_labour",
    `Slab area ${fmt(slabSoffit, 0)} sft × ₹220 (77:76 Option B)`,
    true,
    slabsAssumed,
  );
  add("2 · Frame (RCC)", "Concrete pumping", rccM3, "pumping", "All RCC poured by pump", false);
  add(
    "2 · Frame (RCC)",
    "Centering / shuttering: columns",
    colShut,
    "centering",
    "Column perimeter × clear height",
    false,
    false,
    true,
  );
  add(
    "2 · Frame (RCC)",
    "Centering / shuttering: beams",
    beamShut,
    "centering",
    "(b + 2 × depth below slab) × length",
    false,
    false,
    true,
  );
  add(
    "2 · Frame (RCC)",
    "Centering / shuttering: slabs",
    slabSoffit,
    "centering",
    "Slab soffit area",
    false,
    slabsAssumed,
    true,
  );

  // steel
  let steelKg = 0;
  let steelBasis = "";
  if (t.steel_kg_by_dia.length) {
    steelKg = t.steel_kg_by_dia.reduce((s, x) => s + x.kg, 0) * 1.03;
    steelBasis = `BBS: ${t.steel_kg_by_dia.map((x) => `${x.dia_mm} mm ${fmt(x.kg, 0)} kg`).join(", ")} + 3% cutting wastage`;
  } else {
    const parts = [
      ["footings", (footCft + neckCft) / CFT_PER_M3, 80],
      ["columns", colCft / CFT_PER_M3, 180],
      ["beams", beamCft / CFT_PER_M3, 150],
      ["slabs", slabCft / CFT_PER_M3, 90],
      ["stair", stairM3, 100],
    ] as const;
    steelKg = parts.reduce((s, [, m3, r]) => s + m3 * r, 0) * 1.03;
    steelBasis = `No BBS: kg/m³ of ${parts
      .filter((p) => p[1] > 0)
      .map(([n, , r]) => `${n} ${r}`)
      .join(", ")} + 3% wastage`;
  }
  add(
    "2 · Frame (RCC)",
    "TMT steel Fe550D",
    steelKg,
    "steel",
    steelBasis,
    true,
    !t.steel_kg_by_dia.length,
  );
  add(
    "2 · Frame (RCC)",
    "Binding wire 18 SWG",
    (steelKg / 1000) * 10,
    "binding",
    "10 kg per tonne of steel",
    true,
  );
  add("2 · Frame (RCC)", "Cover blocks", rccM3 * 6, "cover_blocks", "6 per m³ of RCC", false);

  // ── 3 Masonry ──
  let extLen = 0,
    intLen = 0,
    openArea = 0;
  for (const f of flatFloors) {
    const rep = f.repeat || 1;
    const perimSum = f.rooms.reduce(
      (s, r) => s + 2 * (r.length_ft + r.width_ft) * (r.count || 1),
      0,
    );
    const ext = f.external_perimeter_ft || 0;
    extLen += ext * rep;
    intLen += Math.max(0, (perimSum - ext) / 2) * rep;
  }
  for (const o of t.openings) openArea += o.width_ft * o.height_ft * o.count;
  const extGross = extLen * wallH;
  const intGross = intLen * wallH;
  const totalGross = extGross + intGross;
  // openings split between external (windows, sliders, main door) and internal (room doors)
  const extOpen = t.openings
    .filter((o) => o.kind === "window" || o.kind === "ventilator" || o.kind === "slider")
    .reduce((s, o) => s + o.width_ft * o.height_ft * o.count, 0);
  const intOpen = Math.max(0, openArea - extOpen);
  const extNet = Math.max(0, extGross - extOpen);
  const intNet = Math.max(0, intGross - intOpen);
  const extIn = t.finishes.external_wall_in || 8;
  const intIn = t.finishes.internal_wall_in || 4;
  if (extLen + intLen > 0) {
    const basisW = `wall height ${fmt(wallH)}′ (floor to floor ${f2f}′ − beam ${h.beam_depth_in}″); internal walls = (Σ room perimeters − outer perimeter) ÷ 2`;
    if (t.finishes.masonry === "aac") {
      const perBlockSft = 0.6 * 0.2 * SFT_PER_M2; // 600×200 face
      const extBlocks = (extNet / perBlockSft) * 1.05;
      const intBlocks = (intNet / perBlockSft) * 1.05;
      const extKey = extIn >= 8 ? "aac_200" : "aac_150";
      add(
        "3 · Masonry",
        `AAC blocks 600×200×${extIn >= 8 ? 200 : 150} (outer walls)`,
        extBlocks,
        extKey,
        `${fmt(extLen, 0)} rft outer walls × ${fmt(wallH)}′ − windows ${fmt(extOpen, 0)} sft = ${fmt(extNet, 0)} sft; 8.33 blocks/m² + 5%. ${basisW}`,
        true,
      );
      add(
        "3 · Masonry",
        `AAC blocks 600×200×${intIn >= 6 ? 150 : 100} (inner walls)`,
        intBlocks,
        intIn >= 6 ? "aac_150" : "aac_100",
        `${fmt(intLen, 0)} rft inner walls − doors ${fmt(intOpen, 0)} sft = ${fmt(intNet, 0)} sft; 8.33 blocks/m² + 5%`,
        true,
      );
      const vol = (extNet * (extIn / 12) + intNet * (intIn / 12)) / CFT_PER_M3;
      add(
        "3 · Masonry",
        "Thin-bed block adhesive (40 kg)",
        vol * 0.6,
        "adhesive",
        `${fmt(vol)} m³ of AAC × 0.6 bag/m³ (77:76 consumption)`,
        true,
      );
      add(
        "3 · Masonry",
        "Bed-joint mesh, every 3rd course",
        (extNet + intNet) / 2,
        "mesh",
        "One run per 3 courses (≈ 0.5 rft per sft of wall)",
        false,
      );
    } else {
      const vol = (extNet * (extIn / 12) + intNet * (intIn / 12)) / CFT_PER_M3;
      add(
        "3 · Masonry",
        "Red bricks",
        vol * 500 * 1.05,
        "bricks",
        `${fmt(vol)} m³ of brickwork × 500 bricks/m³ + 5%`,
        true,
      );
      add(
        "3 · Masonry",
        "Cement for brickwork (CM 1:6)",
        vol * 1.37,
        "cement",
        "1.37 bags per m³ of brickwork",
        true,
      );
      add(
        "3 · Masonry",
        "Sand / M-sand for brickwork",
        vol * 10.1,
        "msand",
        "10.1 cft per m³ of brickwork",
        true,
      );
    }
  }

  // ── 4 Services first fix ──
  const e = t.electrical;
  let pts = e.light + e.fan + e.socket_6a + e.socket_16a + e.ac + e.tv_data;
  let elecAssumed = false;
  const roomsAll = flatFloors.flatMap((f) =>
    f.rooms.map((r) => ({ ...r, n: (r.count || 1) * (f.repeat || 1) })),
  );
  const countRooms = (types: RoomType[]) =>
    roomsAll.filter((r) => types.includes(r.type)).reduce((s, r) => s + r.n, 0);
  const elec = { ...e };
  if (!pts && roomsAll.length) {
    elecAssumed = true;
    const beds = countRooms(["bed"]);
    const liv = countRooms(["living"]);
    const kit = countRooms(["kitchen"]);
    const toi = countRooms(["toilet"]);
    const other = countRooms(["balcony", "utility", "passage", "store"]);
    elec.light = beds * 3 + liv * 4 + kit * 2 + toi * 2 + other;
    elec.fan = beds + liv + kit;
    elec.socket_6a = beds * 4 + liv * 5 + kit * 3 + other;
    elec.socket_16a = kit * 3 + toi + countRooms(["utility"]) * 2;
    elec.ac = beds + liv;
    elec.tv_data = beds + liv;
    elec.dbs = Math.max(1, Math.round(kit));
    pts = elec.light + elec.fan + elec.socket_6a + elec.socket_16a + elec.ac + elec.tv_data;
  }
  if (pts) {
    const ptBasis = `${pts} points (${elec.light} light, ${elec.fan} fan, ${elec.socket_6a} 6A, ${elec.socket_16a} 16A, ${elec.ac} AC, ${elec.tv_data} TV/data)${elecAssumed ? " estimated per room — upload the electrical layout" : ""}`;
    add(
      "4 · Services first fix",
      "PVC conduit 20/25 mm FRLS with boxes",
      pts * 25,
      "conduit",
      `25 rft per point · ${ptBasis}`,
      true,
      elecAssumed,
    );
    add(
      "4 · Services first fix",
      "Wire 1.5 sq mm FR-LSH, 90 m coils",
      ((elec.light + elec.fan) * 3 * 30) / 295,
      "wire_15",
      "3 cores × 30 ft per light / fan point",
      true,
      elecAssumed,
    );
    add(
      "4 · Services first fix",
      "Wire 2.5 sq mm FR-LSH, 90 m coils",
      (elec.socket_6a * 3 * 30) / 295,
      "wire_25",
      "3 cores × 30 ft per 6A socket",
      true,
      elecAssumed,
    );
    add(
      "4 · Services first fix",
      "Wire 4 sq mm FR-LSH, 90 m coils",
      ((elec.socket_16a + elec.ac) * 3 * 35) / 295,
      "wire_40",
      "3 cores × 35 ft per 16A / AC point",
      true,
      elecAssumed,
    );
    add(
      "4 · Services first fix",
      "Point wiring labour",
      pts,
      "point_labour",
      "Per point",
      false,
      elecAssumed,
    );
  }
  const p = { ...t.plumbing };
  let plAssumed = false;
  if (!p.wc && !p.kitchen_sink && roomsAll.length) {
    plAssumed = true;
    p.wc = countRooms(["toilet"]);
    p.basin = p.wc;
    p.shower = p.wc;
    p.kitchen_sink = countRooms(["kitchen"]);
    p.utility_tap = countRooms(["utility"]);
  }
  if (p.wc || p.kitchen_sink) {
    const pb = `${p.wc} toilets, ${p.kitchen_sink} kitchens, ${p.utility_tap} utilities${plAssumed ? " (from the room list)" : ""}`;
    add(
      "4 · Services first fix",
      "CPVC SDR 11 pipes ½″–¾″ with fittings",
      p.wc * 60 + p.kitchen_sink * 25 + p.utility_tap * 20,
      "cpvc",
      `60 ft per toilet, 25 per kitchen, 20 per utility · ${pb}`,
      true,
      plAssumed,
    );
    add(
      "4 · Services first fix",
      "SWR 110 mm (WC branches)",
      p.wc * 10,
      "swr_110",
      "10 ft per WC",
      true,
      plAssumed,
    );
    add(
      "4 · Services first fix",
      "SWR 75 mm (floor traps, shower)",
      p.wc * 15 + p.utility_tap * 10,
      "swr_75",
      "15 ft per toilet, 10 per utility",
      true,
      plAssumed,
    );
    add(
      "4 · Services first fix",
      "SWR 50 mm (basins, sinks)",
      p.basin * 8 + p.kitchen_sink * 15,
      "swr_50",
      "8 ft per basin, 15 per sink",
      true,
      plAssumed,
    );
  }

  // ── 5 Plaster and waterproofing ──
  const extPlaster = extNet; // outer face of outer walls
  const intFaces = extNet + 2 * intNet; // inner face of outer walls + both faces of inner walls
  if (extPlaster > 0) {
    const m2 = extPlaster / SFT_PER_M2;
    add(
      "5 · Plaster and waterproofing",
      "External plaster 20 mm CM 1:4, two coats: cement",
      (m2 / 100) * 14.6,
      "cement",
      `${fmt(extPlaster, 0)} sft of outer wall; 14.6 bags per 100 m²`,
      true,
    );
    add(
      "5 · Plaster and waterproofing",
      "External plaster: sand / M-sand",
      (m2 / 100) * 71.8,
      "msand",
      "71.8 cft per 100 m²",
      true,
    );
    add(
      "5 · Plaster and waterproofing",
      "External plaster labour",
      extPlaster,
      "ext_plaster_labour",
      "Outer wall area",
      false,
      false,
      true,
    );
  }
  if (intFaces > 0) {
    if (t.finishes.internal_finish === "gypsum") {
      add(
        "5 · Plaster and waterproofing",
        "Gypsum punning on walls, labour + material",
        intFaces,
        "gypsum",
        `Inner face of outer walls + both faces of inner walls = ${fmt(intFaces, 0)} sft`,
        true,
      );
    } else {
      const m2 = intFaces / SFT_PER_M2;
      add(
        "5 · Plaster and waterproofing",
        "Internal plaster 12 mm CM 1:6: cement",
        (m2 / 100) * 6.3,
        "cement",
        `${fmt(intFaces, 0)} sft; 6.3 bags per 100 m²`,
        true,
      );
      add(
        "5 · Plaster and waterproofing",
        "Internal plaster: sand / M-sand",
        (m2 / 100) * 46,
        "msand",
        "46 cft per 100 m²",
        true,
      );
      add(
        "5 · Plaster and waterproofing",
        "Internal plaster labour",
        intFaces,
        "int_plaster_labour",
        "Wall area",
        false,
        false,
        true,
      );
    }
  }
  const area = (types: RoomType[]) =>
    roomsAll
      .filter((r) => types.includes(r.type))
      .reduce((s, r) => s + r.length_ft * r.width_ft * r.n, 0);
  const perim = (types: RoomType[]) =>
    roomsAll
      .filter((r) => types.includes(r.type))
      .reduce((s, r) => s + 2 * (r.length_ft + r.width_ft) * r.n, 0);
  const wetArea = area(["toilet", "utility"]) + perim(["toilet", "utility"]) * 1;
  const balArea = area(["balcony"]) + perim(["balcony"]) * 0.5;
  add(
    "5 · Plaster and waterproofing",
    "Waterproofing: toilets and utilities, floor + 1′ upturn",
    wetArea,
    "wp_wet",
    "Floor area + perimeter × 1′",
    false,
  );
  add(
    "5 · Plaster and waterproofing",
    "Waterproofing: balconies",
    balArea,
    "wp_wet",
    "Floor area + perimeter × 6″ upturn (only the outer sides in practice)",
    false,
  );
  const roofArea =
    t.floors.filter((f) => f.kind === "terrace").reduce((s, f) => s + f.built_up_sft, 0) ||
    (t.floors.length ? Math.max(...t.floors.map((f) => f.built_up_sft)) : 0);
  add(
    "5 · Plaster and waterproofing",
    "Terrace waterproofing, PU membrane",
    roofArea * 1.1,
    "wp_terrace",
    "Roof area + 10% for upturns",
    false,
  );

  // ── 6 Doors and windows ──
  for (const o of t.openings) {
    const sft = o.width_ft * o.height_ft;
    const label = `${o.mark} ${ftIn(o.width_ft)} × ${ftIn(o.height_ft)}`;
    if (o.kind === "window")
      add(
        "6 · Doors and windows",
        `Window ${label}`,
        sft * o.count,
        "window",
        `${o.count} nos × ${fmt(sft)} sft`,
        true,
      );
    if (o.kind === "ventilator")
      add(
        "6 · Doors and windows",
        `Ventilator ${label}`,
        Math.max(6, sft) * o.count,
        "ventilator",
        `${o.count} nos × ${fmt(Math.max(6, sft))} sft (6 sft minimum)`,
        true,
      );
    if (o.kind === "slider")
      add(
        "6 · Doors and windows",
        `Sliding door ${label}`,
        sft * o.count,
        "slider",
        `${o.count} nos × ${fmt(sft)} sft`,
        true,
      );
    if (o.kind === "main-door")
      add(
        "6 · Doors and windows",
        `Main door ${label}, frame and hardware`,
        o.count,
        "main_door",
        "From the schedule",
        true,
      );
    if (o.kind === "door")
      add(
        "6 · Doors and windows",
        `Door ${label}, frame and hardware`,
        o.count,
        "door",
        "From the schedule",
        true,
      );
    if (o.kind === "toilet-door")
      add(
        "6 · Doors and windows",
        `Toilet door ${label} (WPC)`,
        o.count,
        "toilet_door",
        "From the schedule",
        true,
      );
  }
  const sillRft = t.openings
    .filter((o) => o.kind === "window" || o.kind === "ventilator")
    .reduce((s, o) => s + o.width_ft * o.count, 0);
  add(
    "6 · Doors and windows",
    "Granite sills 6″",
    sillRft,
    "granite_sill",
    "Σ window and ventilator widths",
    true,
  );

  // ── 7 Flooring and dado ──
  const dryArea = area(["bed", "living", "kitchen", "passage", "store"]);
  const wetFloor = area(["toilet", "utility", "balcony"]);
  if (dryArea + wetFloor > 0) {
    add(
      "7 · Flooring and dado",
      "Vitrified floor tiles (living, bedrooms, kitchen)",
      dryArea * 1.08,
      "vitrified",
      `${fmt(dryArea, 0)} sft + 8% cutting`,
      true,
    );
    add(
      "7 · Flooring and dado",
      "Anti-skid tiles (toilets, utilities, balconies)",
      wetFloor * 1.1,
      "antiskid",
      `${fmt(wetFloor, 0)} sft + 10%`,
      true,
    );
    const toiletDado = perim(["toilet"]) * (t.finishes.toilet_dado_ft || 7) * 0.9;
    const kitDado = (t.finishes.kitchen_counter_rft || countRooms(["kitchen"]) * 12) * 2;
    add(
      "7 · Flooring and dado",
      "Wall tiles: toilet dado and kitchen backsplash",
      (toiletDado + kitDado) * 1.08,
      "wall_tile",
      `Toilets: perimeter × ${t.finishes.toilet_dado_ft}′ less door; kitchen 2′ over the counter; + 8%`,
      true,
    );
    const tiled = dryArea + wetFloor;
    const m2 = tiled / SFT_PER_M2;
    add(
      "7 · Flooring and dado",
      "Floor screed 40 mm CM 1:4: cement",
      (m2 * 14.6) / 50,
      "cement",
      `${fmt(tiled, 0)} sft; 14.6 kg per m²`,
      true,
    );
    add(
      "7 · Flooring and dado",
      "Floor screed: sand / M-sand",
      m2 * 1.43,
      "msand",
      "1.43 cft per m²",
      true,
    );
    add(
      "7 · Flooring and dado",
      "Tile adhesive (floors and walls)",
      tiled * 0.025 + (toiletDado + kitDado) * 0.03,
      "tile_adhesive",
      "0.025 bag per sft floor, 0.03 per sft wall",
      true,
    );
    add(
      "7 · Flooring and dado",
      "Screed laying labour",
      tiled,
      "screed_labour",
      "Tiled floor area",
      false,
    );
    add(
      "7 · Flooring and dado",
      "Tile laying labour",
      tiled + toiletDado + kitDado,
      "tile_laying",
      "Floor + wall tiles",
      false,
    );
    add(
      "7 · Flooring and dado",
      "Skirting 4″",
      perim(["bed", "living", "passage"]) * 0.85,
      "skirting",
      "Room perimeters less doorways (85%)",
      true,
    );
    const counter = t.finishes.kitchen_counter_rft || countRooms(["kitchen"]) * 12;
    add(
      "7 · Flooring and dado",
      "Granite kitchen counter 2′ wide",
      counter * 2,
      "granite_counter",
      `${fmt(counter, 0)} rft × 2′${t.finishes.kitchen_counter_rft ? "" : " (12 rft per kitchen assumed)"}`,
      true,
      !t.finishes.kitchen_counter_rft,
    );
  }

  // ── 8 Painting ──
  const ceil = area(["bed", "living", "kitchen", "passage", "store", "toilet", "utility"]);
  add(
    "8 · Painting",
    "Interior: putty (ceilings), primer, 2 coats emulsion",
    intFaces + ceil,
    "int_paint",
    `Walls ${fmt(intFaces, 0)} sft + ceilings ${fmt(ceil, 0)} sft`,
    true,
  );
  const facade =
    t.floors.reduce((s, f) => s + (f.external_perimeter_ft || 0) * f2f * (f.repeat || 1), 0) -
    extOpen;
  add(
    "8 · Painting",
    "Exterior: primer + 2 coats",
    facade,
    "ext_paint",
    "Outer perimeter × floor height × floors − windows",
    true,
  );

  // ── 9 Fixtures ──
  add(
    "9 · Fixtures and fittings",
    "Switches and sockets (modules)",
    pts * 1.2,
    "switch_module",
    "1.2 modules per point",
    true,
    elecAssumed,
  );
  add(
    "9 · Fixtures and fittings",
    "Distribution boards",
    elec.dbs,
    "db",
    "One per flat",
    true,
    elecAssumed,
  );
  add(
    "9 · Fixtures and fittings",
    "Wall-hung WC with concealed cistern",
    p.wc,
    "wc",
    "Per toilet",
    true,
    plAssumed,
  );
  add(
    "9 · Fixtures and fittings",
    "Wash basin with mixer",
    p.basin,
    "basin",
    "Per toilet",
    true,
    plAssumed,
  );
  add(
    "9 · Fixtures and fittings",
    "Shower / diverter set",
    p.shower,
    "shower_set",
    "Per toilet",
    true,
    plAssumed,
  );
  add(
    "9 · Fixtures and fittings",
    "Kitchen sink with tap",
    p.kitchen_sink,
    "sink",
    "Per kitchen",
    true,
    plAssumed,
  );

  if (t.floors.some((f) => f.rooms.some((r) => r.type === "lift")))
    add(
      "9 · Fixtures and fittings",
      "Passenger lift, MRL, 8 persons",
      1,
      "lift",
      "Lift shown on the plans",
      true,
    );

  // ── 10 Site works ──
  add(
    "10 · Site works",
    "Compound wall 6′, RCC posts + brick, plastered",
    t.site.compound_wall_rft,
    "compound_wall",
    "From the site plan",
    true,
  );
  add(
    "10 · Site works",
    "Paving, interlocking pavers",
    t.site.paving_sft,
    "paving",
    "From the site plan",
    false,
  );

  const byStage = STAGES.map((stage) => {
    const ls = L.filter((l) => l.stage === stage);
    return { stage, amount: ls.reduce((s, l) => s + l.amount, 0), lines: ls.length };
  }).filter((s) => s.lines > 0);
  const total = L.reduce((s, l) => s + l.amount, 0);
  const missing = DRAWING_SLOTS.filter((s) => s.required && !present.has(s.key)).map((s) => s.key);
  return {
    lines: L,
    byStage,
    total,
    builtUpSft: builtUp,
    perSft: builtUp ? total / builtUp : 0,
    missing,
    concreteM3: rccM3,
    steelKg,
    materials: MATERIAL_GROUPS.map(([name, keys]) => {
      const ls = L.filter((l) => keys.includes(l.key));
      return { name, qty: r2(ls.reduce((s, l) => s + l.qty, 0)), unit: ls[0]?.unit ?? "" };
    }).filter((m) => m.qty > 0),
  };
}

function avg(xs: number[]) {
  const v = xs.filter((x) => x > 0);
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0;
}

export function ftIn(ft: number) {
  const f = Math.floor(ft + 1e-6);
  const i = Math.round((ft - f) * 12);
  return i === 12 ? `${f + 1}′0″` : `${f}′${i}″`;
}

// ─── Cleaning what the AI returns ────────────────────────────────────────────────

const num = (v: unknown, d = 0) => {
  const n = Number(String(v ?? "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : d;
};
const str = (v: unknown) => (typeof v === "string" ? v.trim() : v == null ? "" : String(v));
const arr = (v: unknown) => (Array.isArray(v) ? (v as Record<string, unknown>[]) : []);
const ROOM_TYPES: RoomType[] = [
  "bed",
  "living",
  "kitchen",
  "toilet",
  "balcony",
  "utility",
  "passage",
  "store",
  "stair",
  "lift",
  "parking",
  "other",
];
const OPEN_KINDS: Opening["kind"][] = [
  "main-door",
  "door",
  "toilet-door",
  "window",
  "ventilator",
  "slider",
];

/** Turns the AI's JSON for one slot into a clean partial takeoff (only that slot's fields). */
export function cleanSlot(slot: SlotKey, raw: Record<string, unknown>): Partial<Takeoff> {
  const out: Partial<Takeoff> = {};
  if (slot === "plans") {
    out.floors = arr(raw["floors"]).map((f) => ({
      name: str(f["name"]) || "Floor",
      repeat: Math.max(1, Math.round(num(f["repeat"], 1))),
      kind: (["stilt", "typical", "ground", "terrace", "other"].includes(str(f["kind"]))
        ? str(f["kind"])
        : "typical") as Floor["kind"],
      built_up_sft: num(f["built_up_sft"]),
      external_perimeter_ft: num(f["external_perimeter_ft"]),
      rooms: arr(f["rooms"])
        .map((r) => ({
          name: str(r["name"]),
          type: (ROOM_TYPES.includes(str(r["type"]) as RoomType)
            ? str(r["type"])
            : "other") as RoomType,
          length_ft: num(r["length_ft"]),
          width_ft: num(r["width_ft"]),
          count: Math.max(1, Math.round(num(r["count"], 1))),
        }))
        .filter((r) => r.length_ft > 0 && r.width_ft > 0),
    }));
  }
  if (slot === "sections") {
    const d = emptyTakeoff().heights;
    out.heights = {
      floor_to_floor_ft: num(raw["floor_to_floor_ft"], d.floor_to_floor_ft) || d.floor_to_floor_ft,
      slab_in: num(raw["slab_in"], d.slab_in) || d.slab_in,
      beam_depth_in: num(raw["beam_depth_in"], d.beam_depth_in) || d.beam_depth_in,
      plinth_ft: num(raw["plinth_ft"], d.plinth_ft) || d.plinth_ft,
      parapet_ft: num(raw["parapet_ft"], d.parapet_ft) || d.parapet_ft,
      founding_depth_ft: num(raw["founding_depth_ft"], d.founding_depth_ft) || d.founding_depth_ft,
    };
  }
  if (slot === "schedule") {
    out.openings = arr(raw["openings"])
      .map((o) => ({
        mark: str(o["mark"]),
        kind: (OPEN_KINDS.includes(str(o["kind"]) as Opening["kind"])
          ? str(o["kind"])
          : "window") as Opening["kind"],
        width_ft: num(o["width_ft"]),
        height_ft: num(o["height_ft"]),
        count: Math.max(0, Math.round(num(o["count"]))),
      }))
      .filter((o) => o.width_ft > 0 && o.height_ft > 0 && o.count > 0);
  }
  if (slot === "footings") {
    out.footings = arr(raw["footings"])
      .map((f) => ({
        mark: str(f["mark"]),
        length_ft: num(f["length_ft"]),
        width_ft: num(f["width_ft"]),
        depth_ft: num(f["depth_ft"]),
        count: Math.round(num(f["count"])),
      }))
      .filter((f) => f.length_ft > 0 && f.width_ft > 0 && f.count > 0);
    out.pcc_in = num(raw["pcc_in"], 3) || 3;
  }
  if (slot === "columns") {
    out.columns = arr(raw["columns"])
      .map((c) => ({
        mark: str(c["mark"]),
        b_in: num(c["b_in"]),
        d_in: num(c["d_in"]),
        count: Math.round(num(c["count"])),
        levels: Math.round(num(c["levels"])),
      }))
      .filter((c) => c.b_in > 0 && c.d_in > 0 && c.count > 0);
  }
  if (slot === "beams") {
    out.beams = arr(raw["beams"])
      .map((b) => ({
        level: str(b["level"]),
        b_in: num(b["b_in"]),
        d_in: num(b["d_in"]),
        length_ft: num(b["length_ft"]),
        repeat: Math.max(1, Math.round(num(b["repeat"], 1))),
      }))
      .filter((b) => b.b_in > 0 && b.d_in > 0 && b.length_ft > 0);
  }
  if (slot === "slabs") {
    out.slabs = arr(raw["slabs"])
      .map((s) => ({
        level: str(s["level"]),
        area_sft: num(s["area_sft"]),
        thickness_in: num(s["thickness_in"], 5) || 5,
        repeat: Math.max(1, Math.round(num(s["repeat"], 1))),
      }))
      .filter((s) => s.area_sft > 0);
    out.staircase_m3 = num(raw["staircase_m3"]);
  }
  if (slot === "bbs") {
    out.steel_kg_by_dia = arr(raw["steel"])
      .map((s) => ({ dia_mm: num(s["dia_mm"]), kg: num(s["kg"]) }))
      .filter((s) => s.dia_mm > 0 && s.kg > 0);
  }
  if (slot === "electrical") {
    out.electrical = {
      light: num(raw["light"]),
      fan: num(raw["fan"]),
      socket_6a: num(raw["socket_6a"]),
      socket_16a: num(raw["socket_16a"]),
      ac: num(raw["ac"]),
      tv_data: num(raw["tv_data"]),
      dbs: num(raw["dbs"]),
    };
  }
  if (slot === "plumbing") {
    out.plumbing = {
      wc: num(raw["wc"]),
      basin: num(raw["basin"]),
      shower: num(raw["shower"]),
      kitchen_sink: num(raw["kitchen_sink"]),
      utility_tap: num(raw["utility_tap"]),
    };
  }
  if (slot === "site")
    out.site = {
      compound_wall_rft: num(raw["compound_wall_rft"]),
      paving_sft: num(raw["paving_sft"]),
    };
  if (slot === "finishes") {
    const d = emptyTakeoff().finishes;
    out.finishes = {
      masonry: str(raw["masonry"]) === "brick" ? "brick" : "aac",
      external_wall_in: num(raw["external_wall_in"], d.external_wall_in) || d.external_wall_in,
      internal_wall_in: num(raw["internal_wall_in"], d.internal_wall_in) || d.internal_wall_in,
      internal_finish: str(raw["internal_finish"]) === "cement" ? "cement" : "gypsum",
      toilet_dado_ft: num(raw["toilet_dado_ft"], d.toilet_dado_ft) || d.toilet_dado_ft,
      kitchen_counter_rft: num(raw["kitchen_counter_rft"]),
      concrete_grade: str(raw["concrete_grade"]) || d.concrete_grade,
    };
  }
  return out;
}

/** What to ask the AI for each slot: instructions + the JSON shape. */
export const SLOT_PROMPTS: Record<SlotKey, string> = {
  plans:
    'Read every floor plan. Return {"floors":[{"name":"","repeat":1,"kind":"stilt|typical|ground|terrace|other","built_up_sft":0,"external_perimeter_ft":0,"rooms":[{"name":"","type":"bed|living|kitchen|toilet|balcony|utility|passage|store|stair|lift|parking|other","length_ft":0,"width_ft":0,"count":1}]}]}. One entry per DIFFERENT plan; repeat = how many identical floors it stands for (from titles like "1st to 4th floor"). Room sizes from the dimension text (convert 12\'6" to 12.5). Living/drawing/dining/family = living. Include both flats on a floor. external_perimeter_ft = outer wall length of the building on that floor.',
  sections:
    'Read the section(s). Return {"floor_to_floor_ft":0,"slab_in":0,"beam_depth_in":0,"plinth_ft":0,"parapet_ft":0,"founding_depth_ft":0}. founding_depth_ft = depth of footing bottom below ground level. Use 0 for anything not shown.',
  schedule:
    'Read the door and window schedule (or the marks on the plans). Return {"openings":[{"mark":"D1","kind":"main-door|door|toilet-door|window|ventilator|slider","width_ft":0,"height_ft":0,"count":0}]}. count = total in the whole building (all floors).',
  elevations: 'Return {"notes":["exterior finishes and heights you can read"]}.',
  site: 'Read the site plan. Return {"compound_wall_rft":0,"paving_sft":0,"notes":[""]}.',
  footings:
    'Read the footing layout and schedule. Return {"footings":[{"mark":"F1","length_ft":0,"width_ft":0,"depth_ft":0,"count":0}],"pcc_in":3}. depth_ft = footing thickness (sloped footings: average depth). Count each mark on the layout.',
  columns:
    'Read the column layout and schedule. Return {"columns":[{"mark":"C1","b_in":9,"d_in":18,"count":0,"levels":0}]}. count = columns of that size on one floor; levels = how many floors it runs (0 if all).',
  beams:
    'Read the beam layout(s). Return {"beams":[{"level":"plinth|1st floor|typical","b_in":9,"d_in":18,"length_ft":0,"repeat":1}]}. length_ft = total length of beams of that size on that level; repeat = identical levels.',
  slabs:
    'Read the slab and staircase details. Return {"slabs":[{"level":"","area_sft":0,"thickness_in":5,"repeat":1}],"staircase_m3":0}. staircase_m3 = waist slab + steps concrete for the whole stair if you can work it out, else 0.',
  bbs: 'Read the bar bending schedule / steel abstract. Return {"steel":[{"dia_mm":8,"kg":0}]} totals by bar diameter for the whole building.',
  electrical:
    'Count the points on the electrical layout for the WHOLE building (multiply typical floors). Return {"light":0,"fan":0,"socket_6a":0,"socket_16a":0,"ac":0,"tv_data":0,"dbs":0}.',
  plumbing:
    'Count fixtures on the plumbing layout for the WHOLE building. Return {"wc":0,"basin":0,"shower":0,"kitchen_sink":0,"utility_tap":0}.',
  finishes:
    'Read the specification. Return {"masonry":"aac|brick","external_wall_in":8,"internal_wall_in":4,"internal_finish":"gypsum|cement","toilet_dado_ft":7,"kitchen_counter_rft":0,"concrete_grade":"M25"}.',
};
