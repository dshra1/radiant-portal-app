export type Trend = "UP" | "DOWN" | "STABLE";

export type Project = {
  id: string;
  name: string;
  location: string;
  type: string;
  singleFloorSlabSft: number;
  cellarFloors: number;
  stiltFloors: number;
  typicalFloors: number;
  totalBuiltUpSft: number;
  totalSlabSft: number;
  targetBudget: number;
  spend: number;
  phases: { name: string; state: "done" | "active" | "pending" }[];
  health: "On Track" | "At Risk" | "Delayed";
};

export const projects: Project[] = [
  {
    id: "prj-cyber-a",
    name: "Cyber Enclave A",
    location: "Madhapur, Hyderabad",
    type: "G+5 Commercial",
    singleFloorSlabSft: 2000,
    cellarFloors: 1,
    stiltFloors: 1,
    typicalFloors: 5,
    totalBuiltUpSft: 12000,
    totalSlabSft: 14000,
    targetBudget: 30000000,
    spend: 18420000,
    health: "On Track",
    phases: [
      { name: "Piling", state: "done" },
      { name: "Foundation", state: "done" },
      { name: "Structural", state: "active" },
      { name: "MEP", state: "pending" },
      { name: "Finishing", state: "pending" },
    ],
  },
  {
    id: "prj-tarnaka-5",
    name: "Tarnaka Block 5",
    location: "Tarnaka, Hyderabad",
    type: "Apartment Building",
    singleFloorSlabSft: 3200,
    cellarFloors: 0,
    stiltFloors: 1,
    typicalFloors: 7,
    totalBuiltUpSft: 22400,
    totalSlabSft: 25600,
    targetBudget: 52000000,
    spend: 41800000,
    health: "At Risk",
    phases: [
      { name: "Piling", state: "done" },
      { name: "Foundation", state: "done" },
      { name: "Structural", state: "done" },
      { name: "MEP", state: "active" },
      { name: "Finishing", state: "pending" },
    ],
  },
  {
    id: "prj-kokapet-t2",
    name: "Kokapet Tower 2",
    location: "Kokapet, Hyderabad",
    type: "G+12 Residential",
    singleFloorSlabSft: 4100,
    cellarFloors: 2,
    stiltFloors: 1,
    typicalFloors: 12,
    totalBuiltUpSft: 49200,
    totalSlabSft: 61500,
    targetBudget: 145000000,
    spend: 39250000,
    health: "Delayed",
    phases: [
      { name: "Piling", state: "done" },
      { name: "Foundation", state: "active" },
      { name: "Structural", state: "pending" },
      { name: "MEP", state: "pending" },
      { name: "Finishing", state: "pending" },
    ],
  },
];

export type BoqItem = {
  id: string;
  projectId: string;
  stage: string;
  itemCode: string;
  description: string;
  unit: string;
  quantity: number;
  estimatedRate: number;
  marketRate: number;
  selectedBrand: string;
  alternatives: { brand: string; rate: number; variancePct: number; supplier: string }[];
};

export const boqItems: BoqItem[] = [
  {
    id: "boq-1",
    projectId: "prj-cyber-a",
    stage: "Stage 01: Substructure & Plinth",
    itemCode: "SUB-014",
    description: "RCC M25 Isolated Footings incl. shuttering & curing",
    unit: "CUM",
    quantity: 186.5,
    estimatedRate: 6450,
    marketRate: 6610,
    selectedBrand: "UltraTech",
    alternatives: [
      { brand: "Ramco", rate: 6380, variancePct: -3.5, supplier: "Sri Balaji Traders" },
      { brand: "Dalmia", rate: 6520, variancePct: -1.4, supplier: "Kukatpally Cement Depot" },
    ],
  },
  {
    id: "boq-2",
    projectId: "prj-cyber-a",
    stage: "Stage 02: RCC Superstructure",
    itemCode: "SUP-002",
    description: "TMT Reinforcement Steel Fe500D — cut, bent & placed (BBS)",
    unit: "TON",
    quantity: 92.4,
    estimatedRate: 68500,
    marketRate: 71200,
    selectedBrand: "Jairaj Fe500D",
    alternatives: [
      { brand: "Tata Tiscon", rate: 74800, variancePct: 5.1, supplier: "Metro Steel Hyd" },
      { brand: "Kamdhenu", rate: 69900, variancePct: -1.8, supplier: "AS Steel Syndicate" },
    ],
  },
  {
    id: "boq-3",
    projectId: "prj-cyber-a",
    stage: "Stage 02: RCC Superstructure",
    itemCode: "SUP-021",
    description: "M25 RMC slab pour incl. pumping charges",
    unit: "CUM",
    quantity: 640,
    estimatedRate: 5980,
    marketRate: 5875,
    selectedBrand: "ACC RMX",
    alternatives: [{ brand: "RDC Concrete", rate: 5810, variancePct: -1.1, supplier: "RDC Gachibowli" }],
  },
  {
    id: "boq-4",
    projectId: "prj-tarnaka-5",
    stage: "Stage 03: Finishing & MEP",
    itemCode: "MEP-108",
    description: "FRLS Copper Wiring 2.5 sqmm concealed in PVC conduit",
    unit: "RFT",
    quantity: 18400,
    estimatedRate: 42,
    marketRate: 46,
    selectedBrand: "Polycab",
    alternatives: [
      { brand: "Finolex", rate: 44, variancePct: -4.3, supplier: "Secunderabad Electricals" },
      { brand: "AKG", rate: 39, variancePct: -15.2, supplier: "AKG Direct" },
    ],
  },
  {
    id: "boq-5",
    projectId: "prj-tarnaka-5",
    stage: "Stage 03: Finishing & MEP",
    itemCode: "FIN-044",
    description: "Vitrified floor tiles 800x800 double charged",
    unit: "SQFT",
    quantity: 21600,
    estimatedRate: 96,
    marketRate: 104,
    selectedBrand: "Simpolo",
    alternatives: [{ brand: "Kajaria", rate: 112, variancePct: 7.7, supplier: "Tile Bazaar Attapur" }],
  },
  {
    id: "boq-6",
    projectId: "prj-kokapet-t2",
    stage: "Stage 01: Substructure & Plinth",
    itemCode: "SUB-002",
    description: "Bored cast in-situ piles 600mm dia incl. boring & concreting",
    unit: "RFT",
    quantity: 7420,
    estimatedRate: 1180,
    marketRate: 1245,
    selectedBrand: "Nagarjuna Foundations",
    alternatives: [{ brand: "SRC Piling", rate: 1205, variancePct: -3.2, supplier: "SRC Infra" }],
  },
];

export type MaterialRate = {
  id: string;
  category: string;
  brand: string;
  unitPrice: number;
  unit: string;
  trend: Trend;
  changePct: number;
  updated: string;
};

export const materialRates: MaterialRate[] = [
  { id: "m1", category: "Steel", brand: "Jairaj Fe500D", unitPrice: 71200, unit: "TON", trend: "UP", changePct: 3.9, updated: "2h ago" },
  { id: "m2", category: "Steel", brand: "Tata Tiscon", unitPrice: 74800, unit: "TON", trend: "UP", changePct: 2.1, updated: "2h ago" },
  { id: "m3", category: "Steel", brand: "Kamdhenu", unitPrice: 69900, unit: "TON", trend: "STABLE", changePct: 0.2, updated: "5h ago" },
  { id: "m4", category: "Cement", brand: "UltraTech", unitPrice: 402, unit: "BAG", trend: "DOWN", changePct: -1.7, updated: "1h ago" },
  { id: "m5", category: "Cement", brand: "Ramco", unitPrice: 388, unit: "BAG", trend: "DOWN", changePct: -2.4, updated: "1h ago" },
  { id: "m6", category: "Electrical", brand: "Polycab", unitPrice: 46, unit: "RFT", trend: "UP", changePct: 4.5, updated: "6h ago" },
  { id: "m7", category: "Electrical", brand: "Legrand", unitPrice: 58, unit: "RFT", trend: "STABLE", changePct: 0, updated: "6h ago" },
  { id: "m8", category: "Tiles", brand: "Simpolo", unitPrice: 104, unit: "SQFT", trend: "UP", changePct: 1.2, updated: "1d ago" },
];

export type PurchaseOrder = {
  id: string;
  poNumber: string;
  projectId: string;
  vendor: string;
  material: string;
  status: "Draft" | "Pending Approval" | "Approved" | "Dispatched" | "Delivered";
  totalValue: number;
  guardrail: "Within Budget" | "Exceeds Market +3%" | "Approved Variance";
  raised: string;
};

export const purchaseOrders: PurchaseOrder[] = [
  { id: "po1", poNumber: "PO-2026-089", projectId: "prj-cyber-a", vendor: "Metro Steel Hyd", material: "TMT Fe500D — 24 TON", status: "Pending Approval", totalValue: 1795200, guardrail: "Exceeds Market +3%", raised: "3 Sep 2026" },
  { id: "po2", poNumber: "PO-2026-088", projectId: "prj-cyber-a", vendor: "ACC RMX Gachibowli", material: "M25 RMC — 180 CUM", status: "Dispatched", totalValue: 1057500, guardrail: "Within Budget", raised: "1 Sep 2026" },
  { id: "po3", poNumber: "PO-2026-085", projectId: "prj-tarnaka-5", vendor: "Secunderabad Electricals", material: "FRLS 2.5 sqmm — 6000 RFT", status: "Approved", totalValue: 264000, guardrail: "Approved Variance", raised: "29 Aug 2026" },
  { id: "po4", poNumber: "PO-2026-081", projectId: "prj-kokapet-t2", vendor: "SRC Infra", material: "Piling 600mm — 1200 RFT", status: "Delivered", totalValue: 1446000, guardrail: "Within Budget", raised: "24 Aug 2026" },
  { id: "po5", poNumber: "PO-2026-090", projectId: "prj-tarnaka-5", vendor: "Tile Bazaar Attapur", material: "Vitrified 800x800 — 4200 SQFT", status: "Draft", totalValue: 470400, guardrail: "Exceeds Market +3%", raised: "3 Sep 2026" },
];

export type PourCard = {
  id: string;
  projectId: string;
  stage: string;
  locationTag: string;
  pourDate: string;
  grade: string;
  designedVolume: number;
  actualVolume: number | null;
  rebar: boolean;
  shuttering: boolean;
  coverBlocks: boolean;
  engineer: string;
  status: "Pre-Pour Pending" | "Approved to Pour" | "Poured & Curing" | "Completed";
};

export const pourCards: PourCard[] = [
  { id: "pc1", projectId: "prj-cyber-a", stage: "Stage 02: RCC Superstructure", locationTag: "3rd Floor Slab — Grid A-F", pourDate: "2026-09-04", grade: "M25 RMC", designedVolume: 96, actualVolume: null, rebar: true, shuttering: true, coverBlocks: false, engineer: "K. Ramesh", status: "Pre-Pour Pending" },
  { id: "pc2", projectId: "prj-cyber-a", stage: "Stage 02: RCC Superstructure", locationTag: "2nd Floor Columns — Grid C-H", pourDate: "2026-09-02", grade: "M30 RMC", designedVolume: 34, actualVolume: 35.5, rebar: true, shuttering: true, coverBlocks: true, engineer: "K. Ramesh", status: "Poured & Curing" },
  { id: "pc3", projectId: "prj-tarnaka-5", stage: "Stage 03: Finishing & MEP", locationTag: "Terrace Parapet — Full", pourDate: "2026-09-05", grade: "M20", designedVolume: 12.5, actualVolume: null, rebar: true, shuttering: false, coverBlocks: true, engineer: "S. Prasad", status: "Pre-Pour Pending" },
  { id: "pc4", projectId: "prj-kokapet-t2", stage: "Stage 01: Substructure & Plinth", locationTag: "Raft Foundation — Zone 2", pourDate: "2026-09-03", grade: "M35 RMC", designedVolume: 410, actualVolume: null, rebar: true, shuttering: true, coverBlocks: true, engineer: "A. Fatima", status: "Approved to Pour" },
  { id: "pc5", projectId: "prj-tarnaka-5", stage: "Stage 02: RCC Superstructure", locationTag: "7th Floor Slab — Grid A-K", pourDate: "2026-08-27", grade: "M25 RMC", designedVolume: 148, actualVolume: 151.2, rebar: true, shuttering: true, coverBlocks: true, engineer: "S. Prasad", status: "Completed" },
];

export type Inspection = {
  id: string;
  projectId: string;
  category: "Electrical Conduiting" | "Plumbing Lines" | "Rebar Lapping" | "Finishing";
  locationTag: string;
  defectCount: number;
  severity: "High" | "Medium" | "Low" | "Passed";
  code: string;
  findings: string[];
  resolution: "Open" | "Rectified" | "Approved";
  captured: string;
};

export const inspections: Inspection[] = [
  { id: "qa1", projectId: "prj-cyber-a", category: "Rebar Lapping", locationTag: "3rd Floor Slab — Grid B4", defectCount: 3, severity: "High", code: "IS 456", findings: ["Lap length 38d against required 50d at 3 bars", "Cover blocks missing along east edge", "Chair spacing exceeds 1.0m"], resolution: "Open", captured: "3 Sep, 09:14" },
  { id: "qa2", projectId: "prj-cyber-a", category: "Electrical Conduiting", locationTag: "2nd Floor Slab — Grid D2", defectCount: 1, severity: "Medium", code: "IS 732", findings: ["Conduit crossing exceeds 1/3 slab depth at one junction"], resolution: "Rectified", captured: "2 Sep, 16:40" },
  { id: "qa3", projectId: "prj-tarnaka-5", category: "Plumbing Lines", locationTag: "Toilet Shaft — Block B", defectCount: 0, severity: "Passed", code: "IS 1172", findings: ["Slope and alignment within tolerance"], resolution: "Approved", captured: "1 Sep, 11:02" },
  { id: "qa4", projectId: "prj-kokapet-t2", category: "Finishing", locationTag: "Sample Flat — Living", defectCount: 5, severity: "Medium", code: "IS 15622", findings: ["Tile lippage >1mm in 4 locations", "Skirting gap at north wall"], resolution: "Open", captured: "31 Aug, 15:20" },
];

export const spendTrend = [
  { month: "Apr", planned: 42, actual: 39 },
  { month: "May", planned: 58, actual: 61 },
  { month: "Jun", planned: 74, actual: 79 },
  { month: "Jul", planned: 91, actual: 88 },
  { month: "Aug", planned: 108, actual: 116 },
  { month: "Sep", planned: 124, actual: 131 },
];

const toNum = (v: unknown) => {
  const n = typeof v === "number" ? v : Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
};

export const inr = (v: number | string | null | undefined) =>
  "₹" + new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(toNum(v));

export const inrCompact = (value: number | string | null | undefined) => {
  const v = toNum(value);
  if (v >= 10000000) return "₹" + (v / 10000000).toFixed(2) + " Cr";
  if (v >= 100000) return "₹" + (v / 100000).toFixed(1) + " L";
  return inr(v);
};

export const num = (v: number | string | null | undefined, d = 0) =>
  new Intl.NumberFormat("en-IN", { minimumFractionDigits: d, maximumFractionDigits: d }).format(
    toNum(v),
  );

