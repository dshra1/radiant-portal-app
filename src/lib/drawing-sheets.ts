/**
 * Which drawing sheets go with which programme stage. The sheet list comes from
 * the PMC drawing PDFs (src/data/drawing-index.json, built by
 * scripts/build-drawing-index.py); the rules below pick the set for the stage's
 * floor (4BHK floors 1–2, 3BHK floors 3–5) and its trade, and group the wall
 * elevations room by room.
 */
import index from "@/data/drawing-index.json";

export type Sheet = {
  file: string;
  page: number;
  title: string;
  sub: string;
  flat?: number;
  room?: string;
  roomCode?: string;
  cont?: boolean;
};

export type SheetGroup = { label: string; sheets: Sheet[] };

const SHEETS = index as Sheet[];

const ELEC = (bhk: 4 | 3) =>
  bhk === 4
    ? "Cyber-Enclave-Electrical-Conduit-Drawings-4BHK-Floors-1-2.pdf"
    : "Cyber-Enclave-Electrical-Conduit-Drawings-3BHK-Floors-3-5.pdf";
const PLUMB = (bhk: 4 | 3) =>
  bhk === 4
    ? "Cyber-Enclave-Plumbing-Drawings-4BHK-Floors-1-2.pdf"
    : "Cyber-Enclave-Plumbing-Drawings-3BHK-Floors-3-5.pdf";
const PLAN = (bhk: 4 | 3) =>
  bhk === 4
    ? "Cyber-Enclave-Typical-Floor-Combined.pdf"
    : "Cyber-Enclave-Typical-Floor-3BHK-FINAL.pdf";
const STRUCT = "Cyber-Enclave-Stage-Reinforcement-Material-Drawings.pdf";
const FACADE = "Cyber-Enclave-Facade-Design-D128.pdf";
const HANDOVER = "Cyber-Enclave-Owners-Handover-Pack.pdf";

export function shortFile(file: string) {
  return file
    .replace(/^Cyber-Enclave-/, "")
    .replace(/\.pdf$/, "")
    .replace(/-/g, " ");
}

/** Floor number from the programme's floor text ("1st floor" → 1, "terrace" → 6, stilt → 0). */
export function floorNumber(floor: string, code = "") {
  const m = /(\d)/.exec(floor);
  if (m) return Number(m[1]);
  if (/terrace/i.test(floor)) return 6;
  if (/stilt/i.test(floor)) return 0;
  const c = /^[A-Z]{1,2}(\d)$/.exec(code);
  return c ? Number(c[1]) : NaN;
}

const bhkOf = (floor: number): 4 | 3 => (floor <= 2 ? 4 : 3);

/** Stage codes a sheet title names: "F02–F06", "C1–C6", "S1 (TB)", "T01, T02". */
function codesIn(text: string) {
  const out = new Set<string>();
  const norm = (p: string, n: string) => `${p}${Number(n)}`;
  for (const m of text.matchAll(/\b([A-Z]{1,2})(\d{1,2})\s*[–-]\s*(?:[A-Z]{1,2})?(\d{1,2})\b/g))
    for (let i = Number(m[2]); i <= Number(m[3]) && i - Number(m[2]) < 20; i++)
      out.add(norm(m[1]!, String(i)));
  for (const m of text.matchAll(/\b([A-Z]{1,2})(\d{1,2})\b/g)) out.add(norm(m[1]!, m[2]!));
  return out;
}

const key = (code: string) => {
  const m = /^([A-Z]{1,2})(\d{1,2})$/.exec(code);
  return m ? `${m[1]}${Number(m[2])}` : code;
};

function inFile(file: string, pred: (s: Sheet) => boolean = () => true) {
  return SHEETS.filter((s) => s.file === file && pred(s));
}

/** Room sheets of a set, one group per flat + room (continued sheets kept together). */
function roomGroups(file: string, prefix: string): SheetGroup[] {
  const groups = new Map<string, Sheet[]>();
  for (const s of inFile(file, (x) => Boolean(x.room))) {
    const label = `${prefix} · Flat-0${s.flat} · ${s.room}`;
    groups.set(label, [...(groups.get(label) ?? []), s]);
  }
  return [...groups.entries()].map(([label, sheets]) => ({ label, sheets }));
}

const titled = (file: string, re: RegExp) => inFile(file, (s) => re.test(s.title));

export function sheetsForStage(code: string, floor: string): SheetGroup[] {
  const groups: SheetGroup[] = [];
  const add = (label: string, sheets: Sheet[]) => {
    if (sheets.length) groups.push({ label, sheets });
  };
  const prefix = code.replace(/\d+$/, "");
  const fl = floorNumber(floor, code);
  const bhk = Number.isFinite(fl) && fl >= 1 && fl <= 5 ? bhkOf(fl) : 4;
  const floorLabel = bhk === 4 ? "4BHK floors 1–2" : "3BHK floors 3–5";

  // Structure / material sheets that name this stage.
  const k = key(code);
  const named = SHEETS.filter(
    (s) => s.file === STRUCT && (codesIn(s.sub).has(k) || storeListFor(s, prefix, bhk)),
  );
  add("Structure and material (stage sheets)", named);

  if (["EA", "EW", "ES", "EF"].includes(prefix)) {
    const f = ELEC(bhk);
    add(
      `Electrical · ${floorLabel} · scope and floor plans`,
      titled(f, /WHAT IN THIS SET|POINTS AND CONDUIT/),
    );
    add("Electrical · ceiling lights", titled(f, /CEILING LIGHT/));
    add("Electrical · AC routes", titled(f, /AC OUTDOOR|AC PIPE/));
    groups.push(...roomGroups(f, "Wall elevations"));
  }
  if (["PA", "PS", "PC", "WP"].includes(prefix)) {
    const f = PLUMB(bhk);
    add(
      `Plumbing · ${floorLabel} · scope and floor plans`,
      titled(f, /WHAT IN THIS SET|DRAINAGE PLAN/),
    );
    add("Plumbing · slab sleeves", titled(f, /SLEEVE SCHEDULE/));
    groups.push(...roomGroups(f, "Room sheets"));
  }
  if (prefix === "S" && Number.isFinite(fl)) {
    const n = Number(/\d+/.exec(code)?.[0] ?? fl);
    if (n >= 1 && n <= 5)
      add("Slab sleeves for the pour (drains)", titled(PLUMB(bhkOf(n)), /SLEEVE SCHEDULE/));
    add("AC pipe sleeves in beams", titled(ELEC(n <= 2 ? 4 : 3), /AC PIPE SLEEVES/));
    if (n - 1 >= 1)
      add(
        `Ceiling points cast in this slab (floor ${n - 1})`,
        titled(ELEC(bhkOf(n - 1)), /CEILING LIGHT/),
      );
  }
  if (["M", "DF", "WN", "PL", "TL", "FC", "PU", "PR", "FP", "DS", "SN"].includes(prefix)) {
    add(`Floor plan · ${floorLabel}`, inFile(PLAN(bhk)));
  }
  if (prefix === "FA") add("Facade design (D-128)", inFile(FACADE));
  if (code === "WS1") add("Water system", titled(PLUMB(4), /WATER SYSTEM/));
  if (["EX", "SW"].includes(prefix)) {
    add("External and common electrical", titled(ELEC(4), /EXTERNAL AND COMMON/));
    add("External plumbing", titled(PLUMB(4), /EXTERNAL PLUMBING/));
  }
  if (["SN", "HO"].includes(prefix)) add("Owners' handover pack", inFile(HANDOVER));
  return groups;
}

/** Store lists name trade prefixes (M · DF · EA …) per floor type. */
function storeListFor(s: Sheet, prefix: string, bhk: 4 | 3) {
  if (!/^STORE LIST: ONE (\d)BHK/.test(s.title)) return false;
  if (!s.title.includes(`${bhk}BHK`)) return false;
  return new RegExp(`(^|[ ·:])${prefix}( |·|$)`).test(s.sub);
}

export function allSheets() {
  return SHEETS;
}
