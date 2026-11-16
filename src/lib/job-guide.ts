/**
 * The job guide: what a supervisor needs at hand for one stage, by kind of job.
 * The programme's own directions are written per phase (all of Foundations, all
 * of Finishes); this adds the job-specific method, the crew to book, the tools,
 * the safety precautions and the mistakes to avoid, so the job page can show
 * everything for that one stage without searching other pages.
 *
 * Crew sizes are a typical gang for one floor (two flats) at the planned
 * duration; the contractor's gang may differ.
 */

/** Trade names as used in the daily report's labour booking. */
export type CrewTrade =
  | "RCC / Shuttering"
  | "Bar bending"
  | "Masonry"
  | "Plastering"
  | "Plumbing"
  | "Electrical"
  | "Waterproofing"
  | "Painting"
  | "Flooring / Tiling"
  | "Carpentry"
  | "Helpers";

export type JobGuide = {
  key: string;
  label: string;
  /** Short method for this job, in order. */
  steps: string[];
  crew: { trade: CrewTrade; count: number; note?: string }[];
  tools: string[];
  safety: string[];
  /** Quality precautions: the mistakes that cost rework. */
  avoid: string[];
  /** The concrete for this job needs a pour card (RCC stages). */
  pour?: boolean;
};

const PPE = "Helmet, safety shoes and gloves for everyone on the floor";
const EDGES = "Edge protection / barricade at slab edges, stair and lift openings";
const ELEC_SAFE =
  "Temporary power through an RCCB-protected DB; no bare joints; extension leads off wet floors";
const LADDER = "Ladders tied and footed; scaffold with boards and toe guards above 2 m";

export const JOB_GUIDES: JobGuide[] = [
  {
    key: "earthwork",
    label: "Excavation, backfill and anti-termite",
    steps: [
      "Set out from the grid; mark pit sizes with lime and check diagonals",
      "Excavate to founding level; keep spoil 1 m back from the pit edge",
      "Dewater before any PCC; trim and level the pit bottom",
      "HOLD: structural engineer sees the founding strata",
      "Anti-termite on the pit bottom / under the floor as specified",
      "Backfill in 150–200 mm layers, watered and compacted",
    ],
    crew: [
      { trade: "Helpers", count: 10, note: "plus excavator and tipper" },
      { trade: "Masonry", count: 1, note: "for line and level" },
    ],
    tools: [
      "Excavator / JCB",
      "Dewatering pump",
      "Plate compactor",
      "Dumpy level",
      "Lime, pegs, line",
    ],
    safety: [
      PPE,
      "Pits over 1.5 m deep: sloped or shored sides, ladder in the pit",
      "Barricade and red tape around open pits; lights at night",
      "Nobody in the pit while the excavator bucket swings over it",
      "Check for buried cables and pipes before digging",
    ],
    avoid: [
      "Over-digging below founding level (fill with PCC, never with soil)",
      "PCC on a wet or loose pit bottom",
      "Backfill in one thick lift or with debris and organic soil",
    ],
  },
  {
    key: "rcc",
    label: "RCC: shuttering, steel and concrete",
    pour: true,
    steps: [
      "Shuttering to line, level and plumb; joints sealed; props on firm base",
      "Steel per the BBS: bar sizes, spacing, laps, chairs and cover blocks",
      "Sleeves and conduits placed before the steel is closed",
      "HOLD: steel and shuttering checked and the pour card approved",
      "RMC: check grade, slump and time on the delivery challan; cast cubes",
      "Pour, vibrate (needle vibrator), finish; start curing next morning",
      "Cure for the specified days; strike the shuttering on the agreed dates",
    ],
    crew: [
      { trade: "RCC / Shuttering", count: 8, note: "shuttering carpenters" },
      { trade: "Bar bending", count: 6 },
      { trade: "Helpers", count: 12, note: "more on the pour day" },
      { trade: "Masonry", count: 2, note: "finishing on the pour day" },
      { trade: "Electrical", count: 1, note: "slab conduits before the pour" },
      { trade: "Plumbing", count: 1, note: "sleeves before the pour" },
    ],
    tools: [
      "Needle vibrators (2, one standby)",
      "Cube moulds (3 per sample)",
      "Slump cone",
      "Dumpy level, plumb bob",
      "Concrete pump booking",
    ],
    safety: [
      PPE,
      EDGES,
      "Props checked before the pour; nobody under the deck during the pour",
      "Bar ends capped; no standing on loose steel",
      ELEC_SAFE,
      "Pump pipeline clamped; keep clear of the boom",
    ],
    avoid: [
      "Pouring without an approved pour card",
      "Adding water to RMC on site",
      "Concrete older than 90 minutes from batching",
      "Missing cover blocks or sleeves found after the pour",
      "Striking the shuttering or loading the slab early",
    ],
  },
  {
    key: "masonry",
    label: "AAC blockwork",
    steps: [
      "Mark walls and openings from the plan; check door and window sizes",
      "Kerb under toilet and utility walls; first course level on mortar",
      "Thin-bed adhesive, staggered joints; mesh every 3rd course",
      "Lintels and sill bands at the marked levels; bearing ≥ 150 mm",
      "Soft joint of 15–20 mm at the top; fill after 14 days",
      "Cure the RCC bands; keep blocks dry",
    ],
    crew: [
      { trade: "Masonry", count: 4 },
      { trade: "Helpers", count: 4 },
      { trade: "Carpentry", count: 1, note: "lintel shuttering" },
    ],
    tools: [
      "Notched trowel",
      "Block saw",
      "Rubber mallet",
      "Spirit level 1.2 m",
      "Plumb bob",
      "Line",
    ],
    safety: [PPE, EDGES, LADDER, "Block cutting with a dust mask and goggles"],
    avoid: [
      "Wetting AAC blocks or using cement mortar for the joints",
      "Wall tight to the beam (no soft joint) — it cracks later",
      "Skipping the mesh or the sill band",
      "Openings off the door / window schedule",
    ],
  },
  {
    key: "doors",
    label: "Doors: frames and shutters",
    steps: [
      "Check each frame size and swing against the door schedule",
      "Set frames plumb and level at finished floor level",
      "Grout 3 hold-fasts a side; anti-termite on the back",
      "Protect frames until painting",
      "Shutters: hang, align gaps, fix locks and hardware last",
    ],
    crew: [
      { trade: "Carpentry", count: 2 },
      { trade: "Helpers", count: 1 },
    ],
    tools: ["Spirit level", "Plumb bob", "Drill", "Router (for hinges and locks)"],
    safety: [PPE, "Power tools with guards; shutters stacked flat, not leaning"],
    avoid: [
      "Frames fixed before the floor level is known",
      "Swing direction against the schedule",
      "Hardware fixed before painting",
    ],
  },
  {
    key: "elec1",
    label: "Electrical stage 1: chases, conduits, boxes",
    steps: [
      "Mark every point from the electrical drawings and wall schedule",
      "Cut chases by machine; never hand-break AAC",
      "Conduits with bends ≥ 6 × diameter; boxes at the scheduled heights",
      "DB box, AC copper and drain pipes concealed",
      "Draw-wire in every conduit; ends capped",
      "Fill chases with mesh over them before punning",
    ],
    crew: [
      { trade: "Electrical", count: 3 },
      { trade: "Helpers", count: 3 },
    ],
    tools: [
      "Wall chaser with dust extraction",
      "Conduit bending spring",
      "Laser level",
      "Draw-wire",
    ],
    safety: [
      PPE,
      ELEC_SAFE,
      "Dust mask and goggles while chasing",
      "No chase deeper than 1/3 of the block",
    ],
    avoid: [
      "Horizontal chases across walls",
      "Boxes at the wrong height (check the schedule)",
      "Conduit left open — it fills with plaster",
    ],
  },
  {
    key: "elec2",
    label: "Electrical stage 2: wiring and DB",
    steps: [
      "Pull wires by circuit; colour code and sizes per the schedule",
      "Dress the DB: MCBs, RCCB, labels per circuit",
      "TV, data and door-phone cables in their own conduits",
      "Test continuity and insulation resistance before closing",
    ],
    crew: [
      { trade: "Electrical", count: 3 },
      { trade: "Helpers", count: 2 },
    ],
    tools: ["Insulation tester (megger)", "Multimeter", "Crimping tool", "Wire labels"],
    safety: [PPE, "Work dead: supply isolated and locked off", LADDER],
    avoid: [
      "Joints inside the conduit",
      "Wrong wire size for AC and geyser circuits",
      "Unlabelled DB circuits",
    ],
  },
  {
    key: "elec3",
    label: "Electrical stage 3 and 4: switches and fittings",
    steps: [
      "Fix switches, sockets and plates after the paint primer",
      "Mask plates for the final paint coat",
      "Light fittings, fans and exhausts per the lighting layout",
      "Test: IR, polarity, earth and RCCB trip; record on the work card",
    ],
    crew: [
      { trade: "Electrical", count: 2 },
      { trade: "Helpers", count: 1 },
    ],
    tools: ["Insulation tester", "Earth tester", "RCCB tester", "Multimeter"],
    safety: [PPE, "Work dead: supply isolated and locked off", LADDER],
    avoid: ["Plates fixed before the final coat without masking", "Skipping the RCCB trip test"],
  },
  {
    key: "plumb1",
    label: "Plumbing stage 1: CPVC, SWR and concealed items",
    steps: [
      "Mark points from the plumbing drawings: heights and spacing",
      "CPVC in the walls; SWR hung below the slab with slope",
      "Concealed cistern frames and shower valve bodies set to the tile level",
      "Pressure test at 1.5 × working pressure; hold 2 hours, no drop",
      "Cap every open end before the walls close",
    ],
    crew: [
      { trade: "Plumbing", count: 2 },
      { trade: "Helpers", count: 2 },
    ],
    tools: ["Pressure test pump with gauge", "Pipe cutter", "Solvent cement", "Spirit level"],
    safety: [PPE, LADDER, "Solvent cement used with ventilation, away from flames"],
    avoid: [
      "Concealing pipes before the pressure test passes",
      "Valve bodies set to the wrong tile depth",
      "SWR without slope or without cleaning eyes",
    ],
  },
  {
    key: "plumb2",
    label: "Plumbing stage 2 and 3: sanitary ware and CP fittings",
    steps: [
      "Fix wall-hung WCs, basins and sinks after the tiling",
      "Traps, angle valves and drain connections; check for leaks",
      "CP fittings: mixers, shower trims, health faucets, flush plates",
      "Fill and run every point for 24 hours; no leaks",
    ],
    crew: [
      { trade: "Plumbing", count: 2 },
      { trade: "Helpers", count: 1 },
    ],
    tools: ["Spirit level", "Drill with tile bits", "Silicone gun", "Spanner set"],
    safety: [PPE, "Heavy sanitary ware lifted by two people"],
    avoid: [
      "Drilling tiles without a tile bit (cracks)",
      "Silicone only where specified; no gaps behind fittings",
    ],
  },
  {
    key: "waterproofing",
    label: "Waterproofing",
    steps: [
      "Surface clean, dry and repaired; coves at floor–wall corners",
      "Primer, then the coats as specified",
      "Upturns 1′ on walls (1′6″ on the terrace), 7′ in showers",
      "Seal around every pipe and drain",
      "HOLD: 48-hour ponding test; no leak below",
      "Protect with screed before anyone walks on it",
    ],
    crew: [
      { trade: "Waterproofing", count: 2 },
      { trade: "Helpers", count: 2 },
    ],
    tools: ["Wire brush", "Roller and brushes", "Grinder for coves", "Ponding bunds"],
    safety: [PPE, "Ventilation while applying", "No flames or smoking near the products"],
    avoid: [
      "Coating a damp surface",
      "Low upturns or missed pipe collars",
      "Screed laid before the ponding test passes",
    ],
  },
  {
    key: "punning",
    label: "Gypsum punning and plaster",
    steps: [
      "Walls dry; chases filled and meshed; services tested",
      "Level dots and screeds for line and plumb",
      "Gypsum punning on AAC (no internal cement plaster)",
      "Ceiling skim; corners straight with beads",
      "Check with a 2 m straight edge",
    ],
    crew: [
      { trade: "Plastering", count: 4 },
      { trade: "Helpers", count: 3 },
    ],
    tools: ["2 m straight edge", "Corner beads", "Mixing drill", "Scaffold / tables"],
    safety: [PPE, LADDER, "Goggles for ceiling work"],
    avoid: [
      "Punning over open chases",
      "Thick coats (cracks and hollow sound)",
      "Plastering before the services are tested",
    ],
  },
  {
    key: "ceiling",
    label: "False ceiling",
    steps: [
      "Ceiling levels and light positions from the ceiling plan",
      "GI framing level; hangers at the specified spacing",
      "Ceiling conduits and cut-outs before boarding",
      "Boards fixed, joints taped and finished",
    ],
    crew: [
      { trade: "Carpentry", count: 3, note: "ceiling fixers" },
      { trade: "Helpers", count: 2 },
    ],
    tools: ["Laser level", "Drill", "Board cutter", "Scaffold / tables"],
    safety: [PPE, LADDER, "Goggles while drilling overhead"],
    avoid: [
      "Boarding before the AC copper and conduits are in",
      "Uneven framing (shows after painting)",
    ],
  },
  {
    key: "paint",
    label: "Painting",
    steps: [
      "Putty on ceilings only; sand smooth",
      "Primer on walls and ceilings",
      "Final coats after all trades; anti-fungal on toilet ceilings",
      "Touch-up after fittings; check in raking light",
    ],
    crew: [
      { trade: "Painting", count: 4 },
      { trade: "Helpers", count: 1 },
    ],
    tools: ["Rollers and brushes", "Sanding blocks", "Masking tape", "Torch for raking light"],
    safety: [PPE, LADDER, "Ventilation; dust mask while sanding"],
    avoid: [
      "Putty on walls over punning",
      "Final coats before all trades finish",
      "Paint on switch plates, tiles and frames",
    ],
  },
  {
    key: "windows",
    label: "Windows and sliders",
    steps: [
      "Check openings against the window schedule",
      "Fix frames plumb and level; pack and seal",
      "Silicone outside, foam inside",
      "Hose test; protective film stays on until the end",
    ],
    crew: [
      { trade: "Carpentry", count: 2, note: "UPVC fabricator's team" },
      { trade: "Helpers", count: 1 },
    ],
    tools: ["Spirit level", "Drill", "Silicone gun", "Hose"],
    safety: [PPE, "Harness when fixing from the outside", "Glass carried upright by two people"],
    avoid: ["Removing the protective film early", "Gaps without sealant"],
  },
  {
    key: "tiling",
    label: "Screed and tiling",
    steps: [
      "Ponding test passed and primer done before tiling starts",
      "Screed to falls in toilets and balconies",
      "Tiles from one batch; layout dry-laid first",
      "Adhesive full bed; joints and levels checked (±2 mm in 2 m)",
      "Grout after 24 hours; protect the floor",
    ],
    crew: [
      { trade: "Flooring / Tiling", count: 3 },
      { trade: "Helpers", count: 3 },
    ],
    tools: ["Tile cutter", "Spirit level 2 m", "Notched trowel", "Spacers", "Rubber mallet"],
    safety: [PPE, "Knee pads; dust mask while cutting"],
    avoid: [
      "Hollow tiles (tap test every tile)",
      "Wrong falls (water standing)",
      "Mixed batches or shades",
    ],
  },
  {
    key: "snag",
    label: "Snag list and handover check",
    steps: [
      "Walk every room with the snag list",
      "Assign each snag to its trade with a date",
      "Deep clean after the snags are closed",
      "Handover inspection; photos room by room",
    ],
    crew: [
      { trade: "Helpers", count: 4, note: "cleaning" },
      { trade: "Carpentry", count: 1 },
      { trade: "Painting", count: 1 },
    ],
    tools: ["Snag list", "Torch", "Spirit level", "Camera"],
    safety: [PPE, "Cleaning chemicals with gloves and ventilation"],
    avoid: ["Cleaning before the snags are closed"],
  },
  {
    key: "water",
    label: "Water system",
    steps: [
      "Rising mains and headers per the drawings",
      "Down-takes and stacks in the ducts, clamped",
      "Pumps installed and wired",
      "Pressure test and flow test at every floor",
    ],
    crew: [
      { trade: "Plumbing", count: 3 },
      { trade: "Helpers", count: 2 },
    ],
    tools: ["Pressure test pump", "Pipe cutter", "Scaffold in the duct"],
    safety: [PPE, LADDER, "Harness in open ducts", ELEC_SAFE],
    avoid: ["Unclamped stacks", "No isolation valves per floor"],
  },
  {
    key: "terrace",
    label: "Terrace",
    steps: [
      "Parapet, then surface preparation",
      "PU waterproofing; upturns 1′6″",
      "HOLD: 48-hour flood test",
      "Screed to falls; tiles; khurras clear",
    ],
    crew: [
      { trade: "Waterproofing", count: 2 },
      { trade: "Masonry", count: 2 },
      { trade: "Flooring / Tiling", count: 2 },
      { trade: "Helpers", count: 3 },
    ],
    tools: ["Roller and brushes", "Spirit level", "Ponding bunds"],
    safety: [PPE, "Edge protection at the parapet until it is built", "Harness near the edge"],
    avoid: ["Screed before the flood test", "Blocked khurras"],
  },
  {
    key: "facade",
    label: "Facade",
    steps: [
      "Scaffolding checked and tagged",
      "External plaster in panels with grooves",
      "Curing; then exterior primer and paint",
      "Cladding and fins per the facade drawings",
    ],
    crew: [
      { trade: "Plastering", count: 4 },
      { trade: "Painting", count: 2 },
      { trade: "Helpers", count: 4 },
    ],
    tools: ["Scaffold", "Straight edge", "Rollers"],
    safety: [
      PPE,
      "Harness tied off on the scaffold",
      "Scaffold inspected weekly",
      "Barricade below",
    ],
    avoid: ["Painting uncured plaster", "Plaster without grooves (cracks)"],
  },
  {
    key: "external",
    label: "External services",
    steps: [
      "Routes marked from the drawings",
      "Trenches, chambers and slopes",
      "Earthing pits; test the earth resistance",
      "Test lines and record on the work card",
    ],
    crew: [
      { trade: "Electrical", count: 2 },
      { trade: "Plumbing", count: 2 },
      { trade: "Helpers", count: 4 },
    ],
    tools: ["Earth tester", "Dumpy level", "Test plugs"],
    safety: [PPE, "Barricade trenches", ELEC_SAFE],
    avoid: ["Sewer without slope", "Earth pits not tested"],
  },
  {
    key: "site",
    label: "Site works",
    steps: ["Levels and drainage first", "Compound wall and gates", "Paving last"],
    crew: [
      { trade: "Masonry", count: 3 },
      { trade: "Helpers", count: 4 },
    ],
    tools: ["Dumpy level", "Plate compactor"],
    safety: [PPE, "Traffic and pedestrian barricades"],
    avoid: ["Paving before the external drains are tested"],
  },
  {
    key: "lift",
    label: "Lift",
    steps: [
      "Shaft size and plumb checked with the lift company",
      "Rails, car, landing doors, machine and controller",
      "Testing and the Electrical Inspectorate licence",
    ],
    crew: [{ trade: "Helpers", count: 2, note: "lift company's own team installs" }],
    tools: ["Plumb lines", "Shaft lighting"],
    safety: [PPE, "Landing openings barricaded", "Nobody in the shaft while work is overhead"],
    avoid: ["Starting before the shaft is checked", "Handing over without the licence"],
  },
  {
    key: "handover",
    label: "Occupancy and handover",
    steps: [
      "Documents ready: drawings, test records, warranties",
      "GHMC inspection and occupancy certificate",
      "Utility connections",
      "Flat handover with the owner pack",
    ],
    crew: [{ trade: "Helpers", count: 2 }],
    tools: ["Handover pack", "Keys register"],
    safety: [PPE],
    avoid: ["Handing over keys before the certificate"],
  },
];

const byKey = new Map(JOB_GUIDES.map((g) => [g.key, g]));

/** The job guide for a programme stage, by its code and name. */
export function jobGuideOf(code: string, name = ""): JobGuide | undefined {
  const p = code.replace(/\d+$/, "").toUpperCase();
  const n = name.toLowerCase();
  const map: Record<string, string> = {
    C: "rcc",
    S: "rcc",
    T: "rcc",
    G: "rcc",
    M: "masonry",
    DF: "doors",
    DS: "doors",
    EA: "elec1",
    EW: "elec2",
    ES: "elec3",
    EF: "elec3",
    PA: "plumb1",
    PS: "plumb2",
    PC: "plumb2",
    WP: "waterproofing",
    PL: "punning",
    CO: "punning",
    FC: "ceiling",
    PU: "paint",
    PR: "paint",
    FP: "paint",
    WN: "windows",
    TL: "tiling",
    SN: "snag",
    WS: "water",
    TR: "terrace",
    FA: "facade",
    EX: "external",
    SW: "site",
    LF: "lift",
    HO: "handover",
  };
  if (p === "F") return byKey.get(/excavat|backfill/.test(n) ? "earthwork" : "rcc");
  if (map[p]) return byKey.get(map[p]);
  if (/excavat|backfill/.test(n)) return byKey.get("earthwork");
  if (/slab|column|beam|footing|rcc|concrete/.test(n)) return byKey.get("rcc");
  return undefined;
}
