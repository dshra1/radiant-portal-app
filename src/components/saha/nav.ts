import {
  LayoutDashboard,
  Building2,
  Calculator,
  IndianRupee,
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
  Upload,
  Scale,
  Radio,
  BookOpen,
  LifeBuoy,
  Sparkles,
  Tags,
  Ruler,
  BadgeIndianRupee,
  FileSpreadsheet,
  MessagesSquare,
  BellRing,
  Bot,
  ListChecks,
  CalendarClock,
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
      { to: "/manual", label: "Staff Manual (how to use)", icon: LifeBuoy },
      { to: "/messages", label: "Team Chat", icon: MessagesSquare },
      { to: "/ai", label: "Saha AI Assistant", icon: Bot },
      { to: "/notifications", label: "Action Centre", icon: BellRing },
      { to: "/tasks", label: "Task Tracker", icon: ListChecks },
      { to: "/projects", label: "Projects", icon: Building2 },
      { to: "/brand-preferences", label: "Brand Preferences", icon: Tags },
      { to: "/boq-engine", label: "BOQ Engine", icon: Calculator },
      { to: "/project-import", label: "Import PMC Workbooks", icon: FileSpreadsheet },
      { to: "/stage-budget", label: "Stage Budget & Owner Payments", icon: IndianRupee },
      { to: "/budget-fit", label: "Budget Fit", icon: IndianRupee },
      { to: "/drawing-decipher", label: "Drawings & Documents", icon: FileText },
      { to: "/stage-drawings", label: "Stage Drawings & Photo Check", icon: FileText },
      { to: "/execution-manual", label: "Execution Manual", icon: BookOpen },
      { to: "/access-control", label: "Access & Permissions", icon: ShieldCheck, adminOnly: true },
      { to: "/database-backup", label: "Database Backup", icon: Boxes, adminOnly: true },
    ],
  },
  {
    id: "site",
    label: "Site Supervision",
    items: [
      { to: "/site-today", label: "Site Today (phone)", icon: HardHat },
      { to: "/site-execution", label: "Site Execution", icon: HardHat },
      { to: "/replan", label: "Programme Re-plan (forecast)", icon: CalendarClock },
      { to: "/pour-cards", label: "Pour Cards", icon: ClipboardCheck },
      { to: "/site-media", label: "Site Media", icon: Video },
      { to: "/contractors-labour", label: "Contractors & Labour", icon: Users },
    ],
  },
  {
    id: "stock",
    label: "Stock & Inventory",
    items: [
      { to: "/inventory-control", label: "Inventory Control", icon: Boxes },
      { to: "/procurement", label: "Procurement", icon: ShoppingCart },
      { to: "/purchase-orders", label: "Purchase Orders", icon: FileSpreadsheet },
      { to: "/po-create", label: "Create PO", icon: FileSpreadsheet },
      { to: "/tender-comparison", label: "Tender Comparison", icon: Scale },
      { to: "/price-intelligence", label: "Price Intelligence & Brands", icon: Tags },
      { to: "/vendor-directory", label: "Vendor Directory", icon: Store },
    ],
  },
  {
    id: "accounts",
    label: "Accounts & Audit",
    items: [
      { to: "/price-ocr", label: "Price OCR (Proformas)", icon: ScanEye },
      { to: "/bills-payments", label: "Bills & Payments", icon: Receipt },
      { to: "/financial-ingestion", label: "Cash Ledger", icon: Upload },
      { to: "/financial-forecast", label: "Financial Forecast", icon: BarChart3 },
    ],
  },
  {
    id: "money",
    label: "Money & Owners",
    items: [
      { to: "/owner", label: "Owner's Portal (my flat & costs)", icon: Home },
      { to: "/capital-ledger", label: "Capital Ledger", icon: Wallet },
      { to: "/landowners-investment", label: "Landowners & Investment", icon: Landmark },
      { to: "/flats", label: "Flats & Individual Works", icon: Building2 },
      { to: "/common-expenses", label: "Common & Statutory Expenses", icon: Landmark },
      { to: "/pmc-scope", label: "PMC Scope & Commercials", icon: BadgeIndianRupee },
      { to: "/cost-dashboard", label: "Cost Dashboard", icon: BadgeIndianRupee },
      { to: "/approvals", label: "Approvals", icon: ShieldCheck },
    ],
  },
  {
    id: "qa",
    label: "QA & Inspect",
    items: [{ to: "/quality", label: "Quality & Inspections", icon: ClipboardCheck }],
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
export const roleGroups: Record<Role, string[] | "all"> = {
  "Admin / Owner": "all",
  "Project Manager (PM)": ["planning", "site", "stock", "accounts", "money", "qa"],
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
export const alwaysVisible = ["/", "/manual", "/dashboard", "/messages", "/notifications", "/ai"];

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
