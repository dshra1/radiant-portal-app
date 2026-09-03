import { createFileRoute, Link } from "@tanstack/react-router";

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

const GROUPS: { group: string; items: { to: string; title: string; desc: string; icon: string }[] }[] = [
  {
    group: "Lifecycle Core",
    items: [
      {
        to: "/projects-setup",
        title: "Project Setup & Geometry Wizard",
        desc: "Project identity, floor geometry and CAD drawing ingestion.",
        icon: "domain",
      },
      {
        to: "/boq-upload",
        title: "BOQ Excel Upload Studio",
        desc: "Ingest spreadsheets with column auto-mapping and IS 456 unit validation.",
        icon: "upload_file",
      },
      {
        to: "/boq-engine",
        title: "BOQ Master Engine",
        desc: "Line-item value engineering with spec compliance scoring.",
        icon: "receipt_long",
      },
      {
        to: "/execution-manual",
        title: "Stage-Wise Execution Manual",
        desc: "14-stage SOP, QA hold gates and zero-tolerance guardrails.",
        icon: "account_tree",
      },
    ],
  },
  {
    group: "Site & Operations",
    items: [
      {
        to: "/site-execution",
        title: "Site Execution & Planning Hub",
        desc: "Stage progress, field roster and material runway.",
        icon: "foundation",
      },
      {
        to: "/site-media",
        title: "Site Media & Upload Ledger",
        desc: "Geo-tagged imagery, AI pour verification and drone orthos.",
        icon: "photo_library",
      },
      {
        to: "/qa-inspection",
        title: "AI Visual QA/QC Audit",
        desc: "Edge-inference compliance scoring and defect ledger.",
        icon: "verified",
      },
    ],
  },
  {
    group: "Saha OS Next (from Build It Bright)",
    items: [
      {
        to: "/dashboard",
        title: "Command Center Dashboard",
        desc: "Budget burn, spend trend, approval queue and site portfolio.",
        icon: "dashboard",
      },
      {
        to: "/projects",
        title: "Projects Portfolio",
        desc: "Built-up area, slab take-offs, budget consumption and phase progress.",
        icon: "apartment",
      },
      {
        to: "/boq",
        title: "BOQ & Rate Intelligence",
        desc: "Dynamic bill of quantities with live Hyderabad market rates.",
        icon: "calculate",
      },
      {
        to: "/procurement",
        title: "Procurement & PO Guardrails",
        desc: "Multi-vendor POs with market price guardrails and approvals.",
        icon: "shopping_cart",
      },
      {
        to: "/pour-cards",
        title: "Daily Pour Cards",
        desc: "Pre-pour verification gates and concrete volume reconciliation.",
        icon: "water_drop",
      },
      {
        to: "/qa",
        title: "AI Visual QA",
        desc: "Photo-based defect detection with IS code compliance findings.",
        icon: "visibility",
      },
    ],
  },
  {
    group: "Procurement & Commercial",
    items: [
      {
        to: "/price-intelligence",
        title: "Price Intelligence",
        desc: "Live mandi-indexed brand matrices for rebar, cement and tiles.",
        icon: "insights",
      },
      {
        to: "/brand-benchmark",
        title: "Brand Equivalency Matrix",
        desc: "Arbitrage margins, vetted mills and auto-substitution.",
        icon: "layers",
      },
      {
        to: "/tender-comparison",
        title: "Tender Comparison Studio",
        desc: "L-1/L-2/L-3 unit rates, logistics parity and compliance.",
        icon: "gavel",
      },
      {
        to: "/po-create",
        title: "PO Creation Engine",
        desc: "Value-engineered drafting with BIS spec verification.",
        icon: "add_circle",
      },
      {
        to: "/purchase-orders",
        title: "PO & Guardrail Hub",
        desc: "Price-variance guardrails, approvals and ERP export.",
        icon: "shield",
      },
    ],
  },
  {
    group: "Vendor, Bills & Inventory (New)",
    items: [
      {
        to: "/vendor-lifecycle",
        title: "Purchase & Vendor Lifecycle Hub",
        desc: "Vendor onboarding, bulk uploader and compliance vetting.",
        icon: "handshake",
      },
      {
        to: "/bills-payments",
        title: "Bills & Payments",
        desc: "Subcontractor RA bills, certified milestones and retentions.",
        icon: "receipt",
      },
      {
        to: "/inventory-control",
        title: "Inventory & Material Control",
        desc: "Stock ledger, consumption vs BOQ and reorder alerts.",
        icon: "inventory_2",
      },
      {
        to: "/media-upload-studio",
        title: "Site Media Upload Studio",
        desc: "Geo-tagged photo, video and drone uploads for site activity.",
        icon: "cloud_upload",
      },
      {
        to: "/field-console",
        title: "Field Console",
        desc: "GRN receipts, pour cards, QC sign-offs and AI defect scans.",
        icon: "smartphone",
      },
      {
        to: "/financial-forecast",
        title: "Executive Financial Forecasting",
        desc: "Cash-flow forecasts, cost-to-complete and executive project control.",
        icon: "trending_up",
      },
      {
        to: "/financial-ingestion",
        title: "Financial Ingestion Hub",
        desc: "GSTR-2B telemetry, AI transaction matching and bank reconciliation.",
        icon: "account_balance",
      },
      {
        to: "/vendor-directory",
        title: "Categorized Vendor Directory",
        desc: "Trade-wise vendor database with bulk Excel ingestion and ratings.",
        icon: "storefront",
      },
      {
        to: "/purchasing-center",
        title: "Purchasing & Vendor Command Center",
        desc: "PO pipeline, document OCR, price database and contractor registry.",
        icon: "shopping_bag",
      },
      {
        to: "/contractors-labour",
        title: "Contractors, Labour & Biometric Attendance",
        desc: "Trade subcontractors, muster roll, RA bills and biometric gate sync.",
        icon: "engineering",
      },
      {
        to: "/roles-access",
        title: "Roles & Access Activity",
        desc: "Role-based permissions with a live activity trail.",
        icon: "admin_panel_settings",
      },

    ],
  },
];

function Index() {
  return (
    <div className="m3 min-h-screen bg-surface text-on-surface font-body-md text-body-md">
      <header className="hero-surface px-space-2xl py-space-3xl">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-center gap-space-xs">
            <span className="h-2 w-2 rounded-full bg-brand-bright animate-pulse" />
            <span className="font-label-sm text-label-sm uppercase tracking-[0.14em] text-white/60">
              Civil Platform Engine v3.4.0 • 99.8% Biometric &amp; IoT Sync
            </span>
          </div>
          <h1 className="mt-space-md display-title text-5xl md:text-6xl">
            Saha <span className="italic text-brand-bright">OS</span>
          </h1>
          <div className="mt-space-md h-px w-24 accent-rule" />
          <p className="mt-space-base font-body-lg text-body-lg text-white/70 max-w-2xl">
            Project lifecycle suite for Cyber Enclave - Phase 2, Plot 44/A, Madhapur, Hyderabad.
            BOQ ingestion, stage execution, QA/QC governance and procurement intelligence.
          </p>
          <div className="mt-space-xl flex flex-wrap gap-space-sm">
            <Link
              to="/site-execution"
              className="flex items-center gap-space-xs px-space-lg py-space-md rounded-full bg-brand-bright text-[oklch(0.22_0.05_158)] font-title-md text-title-md shadow-[var(--shadow-glow)] hover:brightness-110 transition-all"
            >
              <span className="material-symbols-outlined text-space-base leading-none">foundation</span>
              Open Site Execution
            </Link>
            <Link
              to="/dashboard"
              className="flex items-center gap-space-xs px-space-lg py-space-md rounded-full border border-white/25 bg-white/5 text-white font-title-md text-title-md hover:bg-white/15 transition-colors backdrop-blur-sm"
            >
              <span className="material-symbols-outlined text-space-base leading-none">space_dashboard</span>
              Command Center
            </Link>
            <Link
              to="/boq-engine"
              className="flex items-center gap-space-xs px-space-lg py-space-md rounded-full border border-white/15 text-white/80 font-title-md text-title-md hover:text-white hover:border-white/35 transition-colors"
            >
              <span className="material-symbols-outlined text-space-base leading-none">receipt_long</span>
              BOQ Master Engine
            </Link>
          </div>
          <dl className="mt-space-2xl grid grid-cols-2 gap-space-base sm:grid-cols-4 max-w-3xl">
            {[
              ["3", "Active sites"],
              ["₹22.70 Cr", "Committed budget"],
              ["412", "Workforce on site"],
              ["8", "Open QA defects"],
            ].map(([v, l]) => (
              <div key={l} className="border-l border-white/15 pl-space-md">
                <dt className="font-label-sm text-label-sm uppercase tracking-[0.12em] text-white/50">{l}</dt>
                <dd className="mt-space-2xs display-title text-2xl text-white">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-space-2xl py-space-3xl flex flex-col gap-space-3xl">
        {GROUPS.map((g) => (
          <section key={g.group} className="flex flex-col gap-space-md">
            <div className="flex items-center gap-space-md">
              <h2 className="font-label-md text-label-md uppercase tracking-[0.14em] text-on-surface-variant">
                {g.group}
              </h2>
              <span className="h-px flex-1 bg-outline-variant/60" />
            </div>
            <div className="grid gap-space-base sm:grid-cols-2 lg:grid-cols-3">
              {g.items.map((it) => (
                <Link
                  key={it.to}
                  to={it.to}
                  className="group surface-card flex flex-col gap-space-sm p-space-lg"
                >
                  <span className="grid size-10 place-items-center rounded-full bg-primary-soft text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <span className="material-symbols-outlined text-space-lg leading-none">{it.icon}</span>
                  </span>
                  <span className="display-title text-xl text-on-surface">{it.title}</span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">{it.desc}</span>
                  <span className="mt-auto flex items-center gap-space-2xs font-label-md text-label-md text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                    Open
                    <span className="material-symbols-outlined text-space-base leading-none">
                      chevron_right
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </main>
    </div>
  );
}
