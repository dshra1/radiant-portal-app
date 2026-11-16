/**
 * Work cards: the pour card's discipline for every other trade. Before a trade
 * starts or its work is covered up, the supervisor ticks the trade's checks and
 * records its test readings (pressure, IR, ponding, hose…); the PMC / site engineer
 * approves it to proceed. A stage of that trade cannot close without one.
 *
 * Stored in the pour_cards table (same approval flow and permissions) with
 * element = "trade:<key>", so no schema change is needed.
 */

export type TradeTest = {
  key: string;
  label: string;
  unit: string;
  /** Pass rule: reading must be ≥ min and/or ≤ max. */
  min?: number;
  max?: number;
  hint: string;
};

export type Trade = {
  key: string;
  label: string;
  /** What the approval allows: start the work, or cover it up. */
  gate: string;
  checks: string[];
  tests: TradeTest[];
};

export const TRADES: Trade[] = [
  {
    key: "masonry",
    label: "AAC blockwork",
    gate: "Approved to start the walls",
    checks: [
      "Wall lines, door and window openings marked from the plan (WD sizes)",
      "Slab below cured; props out of this floor (14 days)",
      "Blocks dry, density as the approved sample; adhesive as approved",
      "RCC kerb cast under toilet, kitchen and utility walls",
      "Column / wall ties or dowels in place",
      "Mesh every 3rd course ready; lintel and sill band positions marked",
      "15–20 mm soft joint left at the top of every wall",
      "Electrical and plumbing chase routes agreed before the walls close",
    ],
    tests: [
      {
        key: "plumb",
        label: "Wall plumb deviation",
        unit: "mm",
        max: 5,
        hint: "per storey height",
      },
    ],
  },
  {
    key: "doors",
    label: "Door frames and shutters",
    gate: "Approved to fix",
    checks: [
      "Frame sizes and swing as the door schedule",
      "Frames plumb, square and at finished floor level",
      "Hold-fasts grouted (3 per side); anti-termite on frame backs",
      "Toilet doors WPC; main door frame teak as specified",
      "Frames protected against plaster and tile work",
    ],
    tests: [],
  },
  {
    key: "electrical_conduit",
    label: "Electrical conduits (before concealing)",
    gate: "Approved to conceal / punning",
    checks: [
      "Conduit routes and boxes as the wall schedule (A112)",
      "ISI FRLS conduits 20 / 25 mm; no more than 2 bends between boxes",
      "Chases machine-cut, not hand-broken; depth within the wall cover",
      "Boxes level, at schedule heights, flush with the finished face",
      "Draw wire in every conduit; ends capped",
      "AC copper and drain lines insulated, sloped and capped",
      "Photos of every wall taken before it is covered",
    ],
    tests: [],
  },
  {
    key: "electrical_wiring",
    label: "Electrical wiring and tests",
    gate: "Approved to energise / hand over",
    checks: [
      "FR-LSH copper wire sizes as the circuit schedule (1.5 / 2.5 / 4 sq mm)",
      "Phase / neutral / earth colours correct; no joints inside conduits",
      "Earth wire to every point and box",
      "MCB ratings and RCCB 30 mA as the DB schedule; circuits labelled",
      "Switch and socket heights and alignment checked",
    ],
    tests: [
      {
        key: "ir",
        label: "Insulation resistance (lowest circuit)",
        unit: "MΩ",
        min: 1,
        hint: "500 V megger, phase–earth",
      },
      { key: "earth", label: "Earth resistance", unit: "Ω", max: 5, hint: "earth pit / point" },
      {
        key: "rccb",
        label: "RCCB trip time at 30 mA",
        unit: "ms",
        max: 300,
        hint: "push the test button too",
      },
    ],
  },
  {
    key: "plumbing",
    label: "Plumbing pipes (before concealing)",
    gate: "Approved to conceal",
    checks: [
      "CPVC SDR 11 and SWR routes as the plumbing drawings",
      "No sunk slab: drains hung below the slab to the duct stacks (D-84)",
      "Drain fall 1:40; clamps at 1 m centres",
      "Solvent joints cured 24 h before testing",
      "Outlet and valve heights as the schedule; ends plugged",
      "Sleeves sealed where pipes cross walls / slabs",
      "Photos of every wall and ceiling run before it is covered",
    ],
    tests: [
      {
        key: "pressure",
        label: "Test pressure (1.5 × working)",
        unit: "kg/cm²",
        min: 5,
        hint: "hydraulic pump gauge",
      },
      { key: "hours", label: "Held for", unit: "hours", min: 2, hint: "start → end time" },
      { key: "drop", label: "Pressure drop", unit: "kg/cm²", max: 0, hint: "must be zero" },
      {
        key: "flow",
        label: "Drain flow test: stacks / lines failing",
        unit: "nos",
        max: 0,
        hint: "water poured at every outlet",
      },
    ],
  },
  {
    key: "pipelines",
    label: "External pipelines (sewer, storm, water mains)",
    gate: "Approved to backfill",
    checks: [
      "Trench depth, width and bedding as the drawing",
      "Gradient checked with levels (sewer 1:40, storm 1:200)",
      "Chambers, inspection points and covers at drawing positions",
      "Joints sealed; pipe class / size as specified",
      "Crossings with other services protected and photographed",
    ],
    tests: [
      {
        key: "minutes",
        label: "Water / air test held for",
        unit: "min",
        min: 30,
        hint: "line filled and plugged",
      },
      {
        key: "leaks",
        label: "Leaks or level drop found",
        unit: "nos",
        max: 0,
        hint: "walk the full run",
      },
    ],
  },
  {
    key: "waterproofing",
    label: "Waterproofing",
    gate: "Approved for the protective screed",
    checks: [
      "Surface clean, sound and damp; cracks and honeycombs filled",
      "Pipe collars and sleeves sealed before the coating",
      "Cove / fillet at every wall–floor corner",
      "Upturns 1′6″ on walls; shower walls to 7′",
      "Coats as the system (2 coats, cross direction), each cured",
    ],
    tests: [
      {
        key: "hours",
        label: "Ponding / flood test duration",
        unit: "hours",
        min: 48,
        hint: "50 mm water, level marked",
      },
      {
        key: "leaks",
        label: "Damp spots below / level drop",
        unit: "nos",
        max: 0,
        hint: "check the ceiling below",
      },
    ],
  },
  {
    key: "plaster",
    label: "Plaster / punning",
    gate: "Approved to start plaster",
    checks: [
      "At least 28 days after the masonry",
      "Conduits and pipes tested, approved and photographed",
      "Mesh fixed over every RCC / block joint and chase",
      "Level dots and corner beads set; reveals marked",
      "Surface cleaned, wetted / primed as the system",
    ],
    tests: [
      {
        key: "plumb",
        label: "Plumb / level deviation",
        unit: "mm",
        max: 3,
        hint: "2 m straight edge",
      },
      { key: "hollow", label: "Hollow-sounding patches", unit: "nos", max: 0, hint: "tap test" },
    ],
  },
  {
    key: "ceiling",
    label: "False ceiling",
    gate: "Approved to close the boards",
    checks: [
      "Ceiling conduits, fan and light boxes done and tested",
      "AC and drain lines above the ceiling tested",
      "GI framing spacing and hangers as the system",
      "MR boards in toilets; access panels where valves are",
    ],
    tests: [
      {
        key: "level",
        label: "Ceiling level deviation",
        unit: "mm",
        max: 3,
        hint: "laser / water level",
      },
    ],
  },
  {
    key: "windows",
    label: "Windows and sliders",
    gate: "Approved / accepted",
    checks: [
      "Sizes as the window schedule; frame plumb and square",
      "Fixing anchors, packers and drainage slots in place",
      "Perimeter sealant continuous, inside and outside",
      "Glass type and tint as specified; hardware working",
    ],
    tests: [
      {
        key: "minutes",
        label: "Hose test per window",
        unit: "min",
        min: 10,
        hint: "spray the outside",
      },
      { key: "leaks", label: "Windows leaking", unit: "nos", max: 0, hint: "check inside sill" },
    ],
  },
  {
    key: "tiling",
    label: "Screed, tiles and granite",
    gate: "Approved to start tiling",
    checks: [
      "Waterproofing ponding test passed (wet areas)",
      "Plumbing and electrical below the floor tested",
      "Screed level and falls to drains (1:100) checked",
      "Tile batch, shade and size approved; adhesive C2",
      "Layout / joint lines agreed (spacers, start line)",
    ],
    tests: [
      { key: "hollow", label: "Hollow tiles (tap test)", unit: "nos", max: 0, hint: "every room" },
      { key: "lippage", label: "Lippage between tiles", unit: "mm", max: 1, hint: "straight edge" },
    ],
  },
  {
    key: "painting",
    label: "Painting",
    gate: "Approved for the next coat",
    checks: [
      "Surface check under a raking light done (hold point)",
      "Putty / punning sanded smooth; cracks filled",
      "Primer brand and shade as approved",
      "Every other trade out of the floor before the final coats",
      "Floors, fittings and frames masked",
    ],
    tests: [],
  },
  {
    key: "sanitary",
    label: "Sanitary ware and CP fittings",
    gate: "Approved / accepted",
    checks: [
      "Fixtures level, firmly fixed and sealed",
      "Traps, angle valves and connectors as specified",
      "Hot / cold correct at every mixer",
      "Fixtures protected until handover",
    ],
    tests: [
      {
        key: "hours",
        label: "Use test (all fixtures running)",
        unit: "hours",
        min: 24,
        hint: "fill and drain",
      },
      { key: "leaks", label: "Leaks found", unit: "nos", max: 0, hint: "under every basin / WC" },
    ],
  },
];

export const tradeByKey = (key: string) => TRADES.find((t) => t.key === key);

/** The trade a programme stage belongs to, from its code (M1, PA2, EW3, WP1 …). */
export function tradeOfStage(code: string, name = ""): Trade | undefined {
  const p = code.replace(/\d+$/, "").toUpperCase();
  const map: Record<string, string> = {
    M: "masonry",
    DF: "doors",
    DS: "doors",
    EA: "electrical_conduit",
    EW: "electrical_wiring",
    ES: "electrical_wiring",
    EF: "electrical_wiring",
    PA: "plumbing",
    PS: "sanitary",
    PC: "sanitary",
    WP: "waterproofing",
    PL: "plaster",
    CO: "plaster",
    FC: "ceiling",
    WN: "windows",
    TL: "tiling",
    PU: "painting",
    PR: "painting",
    FP: "painting",
  };
  if (map[p]) return tradeByKey(map[p]);
  const n = name.toLowerCase();
  if (code === "WS1" || /rising main|down-take/.test(n)) return tradeByKey("plumbing");
  if (code === "TR1" || /waterproof/.test(n)) return tradeByKey("waterproofing");
  if (code === "EX1" || /external electrical|earthing/.test(n))
    return tradeByKey("electrical_wiring");
  if (code === "EX2" || /sewer|storm drain|pipeline/.test(n)) return tradeByKey("pipelines");
  if (code === "FA1" || /external plaster/.test(n)) return tradeByKey("plaster");
  return undefined;
}

export type CardData = { checks: Record<string, boolean>; tests: Record<string, string> };

export function readCard(raw: unknown): CardData {
  const r = (raw ?? {}) as Partial<CardData>;
  return { checks: r.checks ?? {}, tests: r.tests ?? {} };
}

/** Failed or missing readings for a card, as short messages. */
export function testProblems(trade: Trade, tests: Record<string, string>) {
  const out: string[] = [];
  for (const t of trade.tests) {
    const raw = (tests[t.key] ?? "").trim();
    if (raw === "") {
      out.push(`${t.label}: not recorded`);
      continue;
    }
    const v = Number(raw);
    if (!Number.isFinite(v)) out.push(`${t.label}: not a number`);
    else if (t.min !== undefined && v < t.min)
      out.push(`${t.label} ${v} ${t.unit} (needs ≥ ${t.min})`);
    else if (t.max !== undefined && v > t.max)
      out.push(`${t.label} ${v} ${t.unit} (needs ≤ ${t.max})`);
  }
  return out;
}

export const TRADE_PREFIX = "trade:";
