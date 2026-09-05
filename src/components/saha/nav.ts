import {
  LayoutDashboard,
  Building2,
  Calculator,
  ShoppingCart,
  ClipboardCheck,
  ScanEye,
  Home,
  FileText,
  BarChart3,
  HardHat,
  Video,
  Store,
  Receipt,
  Landmark,
  Wallet,
  Boxes,
  Users,
  ShieldCheck,
  Settings2,
  Upload,
  Scale,
  Radio,
  BookOpen,
  Sparkles,
  Tags,
  Ruler,
  BadgeIndianRupee,
  FileSpreadsheet,
  MessagesSquare,
  BellRing,
  Bot,
  ListChecks,
} from "lucide-react";

export type NavItem = {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  adminOnly?: boolean;
};
export type NavGroup = { id: string; label: string; items: NavItem[] };

export const navGroups: NavGroup[] = [
  {
    id: "planning",
    label: "Main · Planning & Master Database",
    items: [
      { to: "/", label: "Saha OS Hub", icon: Home },
      { to: "/dashboard", label: "Command Dashboard", icon: LayoutDashboard },
      { to: "/messages", label: "Team Chat", icon: MessagesSquare },
      { to: "/ai", label: "Saha AI Assistant", icon: Bot },
      { to: "/notifications", label: "Action Centre", icon: BellRing },
      { to: "/tasks", label: "Task Tracker", icon: ListChecks },
      { to: "/command-operations", label: "Command Operations", icon: Radio },
      { to: "/projects", label: "Projects", icon: Building2 },
      { to: "/projects-setup", label: "Projects & Setup", icon: Settings2 },
      { to: "/boq-engine", label: "BOQ Engine", icon: Calculator },
      { to: "/boq-upload", label: "BOQ Upload", icon: Upload },
      { to: "/scope-brief", label: "Scope Brief", icon: BookOpen },
      { to: "/pmc-scope", label: "PMC Scope", icon: Ruler },
      { to: "/drawing-decipher", label: "Drawings & Documents", icon: FileText },
      { to: "/execution-manual", label: "Execution Manual", icon: BookOpen },
      { to: "/ai-programme", label: "AI Programme", icon: Sparkles },
      { to: "/project-controls", label: "Project Controls", icon: BarChart3 },
      { to: "/system-directory", label: "System Directory", icon: Settings2 },
      { to: "/access-control", label: "Access & Permissions", icon: ShieldCheck, adminOnly: true },
    ],
  },
  {
    id: "site",
    label: "Site Supervision",
    items: [
      { to: "/site-execution", label: "Site Execution", icon: HardHat },
      { to: "/pour-cards", label: "Pour Cards", icon: ClipboardCheck },
      { to: "/field-console", label: "Field Console", icon: Radio },
      { to: "/site-media", label: "Site Media", icon: Video },
      { to: "/media-upload-studio", label: "Media Upload Studio", icon: Upload },
      { to: "/contractors-labour", label: "Contractors & Labour", icon: Users },
    ],
  },
  {
    id: "stock",
    label: "Stock & Inventory",
    items: [
      { to: "/inventory-control", label: "Inventory Control", icon: Boxes },
      { to: "/procurement", label: "Procurement", icon: ShoppingCart },
      { to: "/purchasing-center", label: "Purchasing Center", icon: ShoppingCart },
      { to: "/purchase-orders", label: "Purchase Orders", icon: FileSpreadsheet },
      { to: "/po-create", label: "Create PO", icon: FileSpreadsheet },
      { to: "/tender-comparison", label: "Tender Comparison", icon: Scale },
      { to: "/price-intelligence", label: "Price Intelligence", icon: Tags },
      { to: "/vendor-directory", label: "Vendor Directory", icon: Store },
      { to: "/vendor-lifecycle", label: "Vendor Lifecycle", icon: Store },
      { to: "/brand-benchmark", label: "Brand Benchmark", icon: Tags },
    ],
  },
  {
    id: "accounts",
    label: "Accounts & Audit",
    items: [
      { to: "/bills-payments", label: "Bills & Payments", icon: Receipt },
      { to: "/billing-expenditure", label: "Billing & Expenditure", icon: Receipt },
      { to: "/financial-ingestion", label: "Financial Ingestion", icon: Upload },
      { to: "/financial-forecast", label: "Financial Forecast", icon: BarChart3 },
      { to: "/roles-access", label: "Roles & Access", icon: ShieldCheck },
    ],
  },
  {
    id: "money",
    label: "Money & Owners",
    items: [
      { to: "/capital-ledger", label: "Capital Ledger", icon: Wallet },
      { to: "/landowners-investment", label: "Landowners & Investment", icon: Landmark },
      { to: "/pmc-scope", label: "PMC Commercials", icon: BadgeIndianRupee },
    ],
  },
  {
    id: "qa",
    label: "QA & Inspect",
    items: [
      { to: "/qa", label: "AI Visual QA", icon: ScanEye },
      { to: "/qa-inspection", label: "QA Inspection", icon: ClipboardCheck },
    ],
  },
];

export const roles = [
  "Admin / Owner",
  "Project Manager (PM)",
  "Site Engineer",
  "Site Supervisor",
  "Purchase / Stores",
  "Accounts",
  "Landowner / Investor",
] as const;

export type Role = (typeof roles)[number];

/** Groups each role may see. Admin sees everything. */
const roleGroups: Record<Role, string[] | "all"> = {
  "Admin / Owner": "all",
  "Project Manager (PM)": ["planning", "site", "stock", "accounts", "qa"],
  "Site Engineer": ["site", "qa", "stock"],
  "Site Supervisor": ["site", "qa", "stock"],
  "Purchase / Stores": ["stock", "accounts"],
  Accounts: ["stock", "accounts", "money"],
  "Landowner / Investor": ["money", "accounts", "stock", "qa"],
};

/** Roles limited to read-only viewing. */
export const readOnlyRoles: Role[] = ["Landowner / Investor"];

export function isReadOnlyRole(role: string): boolean {
  return readOnlyRoles.includes(role as Role);
}

/** Extra always-visible items per role (home + dashboard entry points). */
const alwaysVisible = ["/", "/dashboard", "/messages", "/notifications", "/ai"];

export function navForRole(role: string, isAdmin = false): NavGroup[] {
  const allowed = roleGroups[role as Role] ?? "all";
  const strip = (group: NavGroup): NavGroup => ({
    ...group,
    items: group.items.filter((i) => !i.adminOnly || isAdmin),
  });
  if (allowed === "all") return navGroups.map(strip).filter((g) => g.items.length > 0);
  const result: NavGroup[] = [];
  for (const group of navGroups) {
    if (allowed.includes(group.id)) {
      result.push(strip(group));
      continue;
    }
    const items = strip(group).items.filter((i) => alwaysVisible.includes(i.to));
    if (items.length && !result.some((g) => g.id === "quick")) {
      result.push({ id: "quick", label: "Quick access", items });
    }
  }
  return result
    .filter((g) => g.items.length > 0)
    .sort((a, b) => (a.id === "quick" ? -1 : b.id === "quick" ? 1 : 0));
}

export function canAccess(role: string, path: string, isAdmin = false): boolean {
  return navForRole(role, isAdmin).some((g) => g.items.some((i) => i.to === path));
}

