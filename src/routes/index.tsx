import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { inrCompact, num } from "@/data/saha";
import sahaLogo from "@/assets/saha-logo.jpeg.asset.json";




export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Saha OS — Civil Project Lifecycle Command Center" },
      {
        name: "description",
        content:
          "Command center for Cyber Enclave Phase 2: BOQ ingestion, stage execution, QA/QC audits, price intelligence and procurement guardrails.",
      },
      { property: "og:title", content: "Saha OS — Civil Project Lifecycle Command Center" },
      {
        property: "og:description",
        content:
          "BOQ ingestion, stage execution, QA/QC audits, price intelligence and procurement guardrails in one suite.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

type Tone = "green" | "blue" | "amber" | "violet" | "rose" | "teal";

const TONE: Record<Tone, { chip: string; title: string; rule: string; label: string }> = {
  green: {
    chip: "bg-primary-soft text-primary",
    title: "text-primary",
    rule: "bg-primary/25",
    label: "text-primary",
  },
  blue: {
    chip: "bg-info-soft text-info",
    title: "text-info",
    rule: "bg-info/25",
    label: "text-info",
  },
  amber: {
    chip: "bg-warning-soft text-[oklch(0.55_0.13_70)]",
    title: "text-[oklch(0.52_0.13_70)]",
    rule: "bg-warning/35",
    label: "text-[oklch(0.52_0.13_70)]",
  },
  violet: {
    chip: "bg-[oklch(0.95_0.04_300)] text-[oklch(0.48_0.16_300)]",
    title: "text-[oklch(0.48_0.16_300)]",
    rule: "bg-[oklch(0.48_0.16_300)]/25",
    label: "text-[oklch(0.48_0.16_300)]",
  },
  rose: {
    chip: "bg-destructive-soft text-[oklch(0.52_0.19_20)]",
    title: "text-[oklch(0.52_0.19_20)]",
    rule: "bg-destructive/25",
    label: "text-[oklch(0.52_0.19_20)]",
  },
  teal: {
    chip: "bg-[oklch(0.94_0.05_200)] text-[oklch(0.46_0.11_210)]",
    title: "text-[oklch(0.46_0.11_210)]",
    rule: "bg-[oklch(0.46_0.11_210)]/25",
    label: "text-[oklch(0.46_0.11_210)]",
  },
};

type Item = {
  to: string;
  title: string;
  desc: string;
  icon: string;
  pinned?: boolean;
};

const GROUPS: { group: string; tone: Tone; items: Item[] }[] = [
  {
    group: "Main Planning & Master Database",
    tone: "green",
    items: [
      { to: "/dashboard", title: "Command Center", desc: "Budget burn, spend trend, approval queue and site portfolio.", icon: "space_dashboard", pinned: true },
      { to: "/messages", title: "Team Chat", desc: "Internal channels for site, purchase, accounts and QA crews.", icon: "forum", pinned: true },
      { to: "/notifications", title: "Action Centre", desc: "Approvals, rate alerts, PO releases and payout reminders.", icon: "notifications_active", pinned: true },

      { to: "/projects", title: "Projects Portfolio", desc: "Built-up area, slab take-offs, budget and phase progress.", icon: "apartment", pinned: true },
      { to: "/boq-engine", title: "BOQ Master Engine", desc: "Line-item value engineering with spec compliance scoring.", icon: "receipt_long", pinned: true },
      { to: "/projects-setup", title: "Project Setup & Geometry", desc: "Project identity, floor geometry and CAD drawing ingestion.", icon: "domain" },
      { to: "/boq-upload", title: "BOQ Excel Upload", desc: "Spreadsheet ingestion with column mapping and unit validation.", icon: "upload_file" },
      { to: "/boq", title: "BOQ & Rate Intelligence", desc: "Dynamic bill of quantities with live Hyderabad market rates.", icon: "calculate" },
      { to: "/execution-manual", title: "Stage-Wise Execution Manual", desc: "14-stage SOP, QA hold gates and zero-tolerance guardrails.", icon: "account_tree" },
      { to: "/ai-programme", title: "AI Programme Scheduler", desc: "Timeline simulation from BOQ scale, lead times and constraints.", icon: "auto_graph" },
      { to: "/drawing-decipher", title: "Drawing Decipher & Take-Off", desc: "Drawing revisions, RFIs and BOQ-linked material take-off.", icon: "architecture" },
      { to: "/scope-brief", title: "Consultant Scope Brief", desc: "Engineering packages A\u2013K with drawing lists and quantities.", icon: "assignment" },
      { to: "/vendor-directory", title: "Vendor Master Directory", desc: "Trade-wise vendor database with ratings and bulk import.", icon: "storefront" },
      { to: "/system-directory", title: "System Master Directory", desc: "Index of every module across all pillars.", icon: "hub" },
      { to: "/roles-access", title: "Roles & Access Master", desc: "Role-based permissions with a live activity trail.", icon: "admin_panel_settings" },
    ],
  },
  {
    group: "Site Supervision",
    tone: "blue",
    items: [
      { to: "/site-execution", title: "Site Execution Hub", desc: "Stage progress, field roster and material runway.", icon: "foundation", pinned: true },
      { to: "/field-console", title: "Field Console", desc: "GRN receipts, pour cards, QC sign-offs and defect scans.", icon: "smartphone" },
      { to: "/command-operations", title: "Command Operations", desc: "Live telemetry, AI risk feed and site supervision.", icon: "bolt" },
      { to: "/project-controls", title: "Project Controls Cockpit", desc: "Earned value, baseline tracker and change orders.", icon: "monitoring" },
      { to: "/contractors-labour", title: "Contractors & Labour", desc: "Muster roll, RA bills and biometric gate sync.", icon: "engineering" },
      { to: "/site-media", title: "Site Media Ledger", desc: "Geo-tagged imagery, pour verification and drone orthos.", icon: "photo_library" },
      { to: "/media-upload-studio", title: "Media Upload Studio", desc: "Photo, video and drone uploads for site activity.", icon: "cloud_upload" },
    ],
  },
  {
    group: "QA & Inspect",
    tone: "teal",
    items: [
      { to: "/qa-inspection", title: "AI Visual QA/QC Audit", desc: "Edge-inference compliance scoring and defect ledger.", icon: "verified", pinned: true },
      { to: "/qa", title: "AI Visual QA", desc: "Photo-based defect detection with IS code findings.", icon: "visibility" },
      { to: "/pour-cards", title: "Daily Pour Cards", desc: "Pre-pour gates and concrete volume reconciliation.", icon: "water_drop" },
    ],
  },
  {
    group: "Stock & Inventory",
    tone: "amber",
    items: [
      { to: "/inventory-control", title: "Inventory & Material Control", desc: "Stock ledger, consumption vs BOQ and reorder alerts.", icon: "inventory_2", pinned: true },
      { to: "/procurement", title: "Procurement & PO Guardrails", desc: "Multi-vendor POs with price guardrails and approvals.", icon: "shopping_cart", pinned: true },
      { to: "/price-intelligence", title: "Price Intelligence", desc: "Live mandi-indexed brand matrices for rebar, cement and tiles.", icon: "insights" },
      { to: "/purchase-orders", title: "PO & Guardrail Hub", desc: "Price-variance guardrails, approvals and ERP export.", icon: "shield" },
      { to: "/po-create", title: "PO Creation Engine", desc: "Value-engineered drafting with BIS spec verification.", icon: "add_circle" },
      { to: "/tender-comparison", title: "Tender Comparison Studio", desc: "L-1/L-2/L-3 rates, logistics parity and compliance.", icon: "gavel" },
      { to: "/brand-benchmark", title: "Brand Equivalency Matrix", desc: "Arbitrage margins, vetted mills and auto-substitution.", icon: "layers" },
      { to: "/vendor-lifecycle", title: "Vendor Lifecycle", desc: "Onboarding, bulk uploader and compliance vetting.", icon: "handshake" },
      { to: "/purchasing-center", title: "Purchasing Command Center", desc: "PO pipeline, document OCR and price database.", icon: "shopping_bag" },
    ],
  },
  {
    group: "Accounts & Audit",
    tone: "rose",
    items: [
      { to: "/billing-expenditure", title: "Billing & Expenditure", desc: "Vendor bill OCR, approvals and expenditure tracking.", icon: "request_quote", pinned: true },
      { to: "/bills-payments", title: "Bills & Payments", desc: "RA bills, certified milestones and retentions.", icon: "receipt" },
      { to: "/financial-ingestion", title: "Financial Ingestion Hub", desc: "GSTR-2B telemetry, AI matching and bank reconciliation.", icon: "account_balance" },
      { to: "/financial-forecast", title: "Financial Forecasting", desc: "Cash-flow forecasts, cost-to-complete and project control.", icon: "trending_up" },
    ],
  },
  {
    group: "Money & Owners",
    tone: "violet",
    items: [
      { to: "/capital-ledger", title: "Capital Ledger", desc: "Equity shares, capital calls and cost apportionment.", icon: "account_balance_wallet", pinned: true },
      { to: "/landowners-investment", title: "Landowners & Investment", desc: "Owner scope, stake shares and funding progress.", icon: "real_estate_agent" },
      { to: "/pmc-scope", title: "PMC Scope & Investment", desc: "Work-package boundaries with cost allocation.", icon: "rule" },
    ],
  },
];


const PINNED = GROUPS.flatMap((g) => g.items.filter((i) => i.pinned).map((i) => ({ ...i, tone: g.tone })));
const ALL = GROUPS.flatMap((g) => g.items.map((i) => ({ ...i, tone: g.tone, group: g.group })));

function ModuleCard({ item, tone }: { item: Item; tone: Tone }) {
  const t = TONE[tone];
  return (
    <Link to={item.to} className="group surface-card flex flex-col gap-2 p-5">
      <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${t.chip}`}>
        <span className="material-symbols-outlined text-xl leading-none">{item.icon}</span>
      </span>
      <span className={`display-title text-lg leading-snug ${t.title}`}>{item.title}</span>
      <span className="text-sm text-muted-foreground">{item.desc}</span>
      <span className={`mt-auto flex items-center gap-1 pt-2 text-xs font-semibold uppercase tracking-wider ${t.label} opacity-0 transition-opacity group-hover:opacity-100`}>
        Open
        <span className="material-symbols-outlined text-base leading-none">chevron_right</span>
      </span>
    </Link>
  );
}

function Index() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<string | null>(null);

  const { data: liveProjects } = useQuery({
    queryKey: ["hub-projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_projects")
        .select("id,target_budget,total_staff,health");
      if (error) throw error;
      return data ?? [];
    },
  });

  const stats = useMemo(() => {
    const rows = liveProjects ?? [];
    const budget = rows.reduce((s, r) => s + Number(r.target_budget ?? 0), 0);
    const staff = rows.reduce((s, r) => s + Number(r.total_staff ?? 0), 0);
    const atRisk = rows.filter((r) => r.health !== "On Track").length;
    return [
      [String(rows.length), "Active sites"],
      [inrCompact(budget), "Committed budget"],
      [num(staff), "Workforce on site"],
      [String(atRisk), "Sites needing attention"],
    ] as [string, string][];
  }, [liveProjects]);


  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return ALL.filter(
      (i) => i.title.toLowerCase().includes(q) || i.desc.toLowerCase().includes(q) || i.group.toLowerCase().includes(q),
    );
  }, [query]);

  return (
    <div className="m3 min-h-screen bg-background text-foreground">
      <header className="hero-surface px-5 py-12 sm:px-10 sm:py-16">
        <div className="mx-auto grid w-full max-w-none gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:items-end">
          <div className="min-w-0">
            <img
              src={sahaLogo.url}
              alt="Saha Developers"
              className="mb-5 h-12 w-auto rounded-md bg-white/95 p-1.5 shadow-lg sm:h-14"
            />
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-brand-bright animate-pulse" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">
                Cyber Enclave · Phase 2 · Madhapur, Hyderabad
              </span>
            </div>

            <h1 className="mt-4 display-title text-4xl text-white sm:text-6xl">
              Saha <span className="italic text-brand-bright">OS</span>
            </h1>
            <p className="mt-3 max-w-2xl text-base text-white/70">
              One workspace for estimation, site execution, quality and money — pick a workspace below.
            </p>

            <div className="mt-7 max-w-xl">
              <div className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-3 backdrop-blur-sm">
                <span className="material-symbols-outlined text-base leading-none text-white/70">search</span>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search modules — BOQ, pour card, vendor, bills…"
                  aria-label="Search modules"
                  className="w-full bg-transparent text-sm text-white placeholder:text-white/50 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <dl className="grid grid-cols-2 gap-5 lg:mb-2">
            {stats.map(([v, l]) => (
              <div
                key={l}
                className="rounded-xl border border-white/12 bg-white/5 px-4 py-3 backdrop-blur-sm"
              >
                <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/50">{l}</dt>
                <dd className="mt-1 display-title text-xl text-white sm:text-2xl">{v}</dd>
              </div>
            ))}
          </dl>
        </div>

      </header>

      <main className="mx-auto flex max-w-none flex-col gap-14 px-5 py-12 sm:px-10">
        {query.trim() ? (
          <section className="flex flex-col gap-5">
            <h2 className="display-title text-2xl">
              {results.length} match{results.length === 1 ? "" : "es"} for “{query.trim()}”
            </h2>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((i) => (
                <ModuleCard key={i.to} item={i} tone={i.tone} />
              ))}
            </div>
          </section>
        ) : (
          <>
            <section className="flex flex-col gap-5">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Everyday workspaces
                  </p>
                  <h2 className="mt-1 heading-gradient display-title text-3xl sm:text-4xl">Start here</h2>
                </div>
              </div>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {PINNED.map((i) => (
                  <ModuleCard key={i.to} item={i} tone={i.tone} />
                ))}
              </div>
            </section>

            <section className="flex flex-col gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  {ALL.length} modules, grouped
                </p>
                <h2 className="mt-1 display-title text-2xl sm:text-3xl">Full suite</h2>
              </div>

              <div className="flex flex-col gap-3">
                {GROUPS.map((g) => {
                  const t = TONE[g.tone];
                  const isOpen = open === g.group;
                  return (
                    <div key={g.group} className="overflow-hidden rounded-2xl border border-border bg-card">
                      <button
                        type="button"
                        onClick={() => setOpen(isOpen ? null : g.group)}
                        aria-expanded={isOpen}
                        className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-muted/60"
                      >
                        <span className={`grid size-9 shrink-0 place-items-center rounded-xl ${t.chip}`}>
                          <span className="material-symbols-outlined text-lg leading-none">
                            {g.items[0]?.icon ?? "folder"}
                          </span>
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className={`block display-title text-xl ${t.title}`}>{g.group}</span>
                          <span className="block text-xs text-muted-foreground">{g.items.length} modules</span>
                        </span>
                        <span className="material-symbols-outlined shrink-0 text-muted-foreground">
                          {isOpen ? "expand_less" : "expand_more"}
                        </span>
                      </button>
                      {isOpen ? (
                        <div className="grid gap-4 border-t border-border bg-muted/30 p-4 sm:grid-cols-2 lg:grid-cols-3">
                          {g.items.map((i) => (
                            <ModuleCard key={i.to} item={i} tone={g.tone} />
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-2 border-t border-border px-5 py-3">
                          {g.items.slice(0, 5).map((i) => (
                            <Link
                              key={i.to}
                              to={i.to}
                              className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
                            >
                              {i.title}
                            </Link>
                          ))}
                          {g.items.length > 5 ? (
                            <span className="px-2 py-1 text-xs text-muted-foreground">
                              +{g.items.length - 5} more
                            </span>
                          ) : null}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
