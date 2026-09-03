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
];

function Index() {
  return (
    <div className="m3 min-h-screen bg-surface text-on-surface font-body-md text-body-md">
      <header className="bg-inverse-surface text-inverse-on-surface px-space-2xl py-space-2xl">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-center gap-space-xs">
            <span className="h-2 w-2 rounded-full bg-primary-fixed-dim animate-pulse" />
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline-variant">
              Civil Platform Engine v3.4.0 • 99.8% Biometric &amp; IoT Sync
            </span>
          </div>
          <h1 className="mt-space-md font-display-lg text-display-lg tracking-tight">Saha OS</h1>
          <p className="mt-space-xs font-body-lg text-body-lg text-secondary-fixed-dim max-w-2xl">
            Project lifecycle suite for Cyber Enclave - Phase 2, Plot 44/A, Madhapur, Hyderabad.
            BOQ ingestion, stage execution, QA/QC governance and procurement intelligence.
          </p>
          <div className="mt-space-lg flex flex-wrap gap-space-sm">
            <Link
              to="/site-execution"
              className="flex items-center gap-space-xs px-space-base py-space-sm rounded bg-primary text-on-primary font-title-md text-title-md hover:bg-primary-container transition-colors"
            >
              <span className="material-symbols-outlined text-space-base leading-none">foundation</span>
              Open Site Execution
            </Link>
            <Link
              to="/boq-engine"
              className="flex items-center gap-space-xs px-space-base py-space-sm rounded bg-surface-variant/20 text-inverse-on-surface font-title-md text-title-md hover:bg-surface-variant/30 transition-colors"
            >
              <span className="material-symbols-outlined text-space-base leading-none">receipt_long</span>
              BOQ Master Engine
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-space-2xl py-space-2xl flex flex-col gap-space-2xl">
        {GROUPS.map((g) => (
          <section key={g.group} className="flex flex-col gap-space-md">
            <h2 className="font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">
              {g.group}
            </h2>
            <div className="grid gap-space-base sm:grid-cols-2 lg:grid-cols-3">
              {g.items.map((it) => (
                <Link
                  key={it.to}
                  to={it.to}
                  className="group flex flex-col gap-space-sm p-space-base rounded-xl bg-surface-container-lowest border border-surface-container-high hover:border-primary transition-colors shadow-[0_1px_8px_rgba(0,0,0,0.04)]"
                >
                  <span className="material-symbols-outlined text-primary text-space-lg leading-none">
                    {it.icon}
                  </span>
                  <span className="font-headline-sm text-headline-sm text-on-surface">{it.title}</span>
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
