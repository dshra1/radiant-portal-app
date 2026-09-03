import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/tender-comparison")({
  head: () => ({
    meta: [
      { title: "Multi-Vendor Tender Quotation Comparison | Saha OS" },
      { name: "description", content: "L-1/L-2/L-3 unit rate intelligence, logistics parity and compliance matrix." },
      { property: "og:title", content: "Multi-Vendor Tender Quotation Comparison | Saha OS" },
      { property: "og:description", content: "L-1/L-2/L-3 unit rate intelligence, logistics parity and compliance matrix." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <div className="m3">
<aside className="fixed left-0 top-0 h-screen w-64 bg-inverse-surface text-inverse-on-surface z-50 flex flex-col justify-between select-none shadow-[0_1px_8px_rgba(0,0,0,0.08)]"><div className="flex flex-col flex-1 overflow-y-auto"><div className="h-16 px-space-base flex items-center gap-space-sm bg-inverse-surface shrink-0"><img alt="Saha OS Emblem" className="h-8 w-auto object-contain" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDIQiSC0KLSVxHGr2B2_HfK3WQmBaHVVbmq-u81XZiKLvhto7v_DWxUH1vVZByfZCoeLirx8AViPVqPJ0FJRDGRFWFWsLghNOY9nj4bqxZ7rT-UKzcVgmCs9TbajK3ok-sisTorWnMQrhucRaI2ZV-9QGkzSk9yruIzwjAmlOgkM5ZRFYxvqw8znDu9UEaHuxwf5OTxhL7unhBh_Df3vWosa1GlSJws9Y9fS21e6qxn25xtZbXsGTUl" /><div className="flex flex-col"><span className="font-headline-sm text-headline-sm font-bold text-inverse-on-surface tracking-tight leading-none">Saha OS</span><span className="font-label-sm text-label-sm text-outline-variant uppercase tracking-wider mt-space-2xs">Project Lifecycle Suite</span></div></div><nav className="flex flex-col px-space-sm py-space-sm gap-space-2xs" data-active-classes="bg-primary text-on-primary font-title-md"><div className="px-space-sm pt-space-xs pb-space-2xs font-label-sm text-label-sm uppercase tracking-wider text-outline-variant">Lifecycle Core</div><a className="flex items-center px-space-sm py-space-sm rounded text-inverse-on-surface hover:bg-surface-variant hover:text-on-surface transition-colors font-body-md text-body-md" data-path="projects-setup" href="/projects-setup">Projects &amp; Setup</a><a className="flex items-center px-space-sm py-space-sm rounded text-inverse-on-surface hover:bg-surface-variant hover:text-on-surface transition-colors font-body-md text-body-md" data-path="boq-engine" href="/boq-engine">BOQ Engine</a><a className="flex items-center px-space-sm py-space-sm rounded text-inverse-on-surface hover:bg-surface-variant hover:text-on-surface transition-colors font-body-md text-body-md" data-path="stage-wise-planning" href="/execution-manual">Stage-Wise Planning Hub</a><div className="px-space-sm pt-space-md pb-space-2xs font-label-sm text-label-sm uppercase tracking-wider text-outline-variant">Site &amp; Operations</div><a className="flex items-center px-space-sm py-space-sm rounded text-inverse-on-surface hover:bg-surface-variant hover:text-on-surface transition-colors font-body-md text-body-md" data-path="site-execution" href="/site-execution">Site Execution &amp; Pour Cards</a><a className="flex items-center px-space-sm py-space-sm rounded text-inverse-on-surface hover:bg-surface-variant hover:text-on-surface transition-colors font-body-md text-body-md" data-path="procurement-inventory" href="/purchase-orders">Procurement &amp; Inventory</a><div className="px-space-sm pt-space-md pb-space-2xs font-label-sm text-label-sm uppercase tracking-wider text-outline-variant">Governance</div><a className="flex items-center px-space-sm py-space-sm rounded text-inverse-on-surface hover:bg-surface-variant hover:text-on-surface transition-colors font-body-md text-body-md" data-path="reports-audits" href="/qa-inspection">Reports &amp; Audits</a><div className="px-space-sm pt-space-md pb-space-2xs font-label-sm text-label-sm uppercase tracking-wider text-outline-variant">All Screens</div><a className="flex items-center px-space-sm py-space-sm rounded text-inverse-on-surface hover:bg-surface-variant hover:text-on-surface transition-colors font-body-md text-body-md" href="/boq-upload">BOQ Excel Upload</a><a className="flex items-center px-space-sm py-space-sm rounded text-inverse-on-surface hover:bg-surface-variant hover:text-on-surface transition-colors font-body-md text-body-md" href="/site-execution">Site Execution</a><a className="flex items-center px-space-sm py-space-sm rounded text-inverse-on-surface hover:bg-surface-variant hover:text-on-surface transition-colors font-body-md text-body-md" href="/qa-inspection">AI Visual QA/QC Inspection</a><a className="flex items-center px-space-sm py-space-sm rounded text-inverse-on-surface hover:bg-surface-variant hover:text-on-surface transition-colors font-body-md text-body-md" href="/execution-manual">Stage-Wise Field Execution Manual</a><a className="flex items-center px-space-sm py-space-sm rounded text-inverse-on-surface hover:bg-surface-variant hover:text-on-surface transition-colors font-body-md text-body-md" href="/site-media">Site Media</a><a className="flex items-center px-space-sm py-space-sm rounded text-inverse-on-surface hover:bg-surface-variant hover:text-on-surface transition-colors font-body-md text-body-md" href="/po-create">Smart Purchase Order Creation Engine</a><a className="flex items-center px-space-sm py-space-sm rounded text-inverse-on-surface hover:bg-surface-variant hover:text-on-surface transition-colors font-body-md text-body-md" href="/projects-setup">Project Setup</a><a className="flex items-center px-space-sm py-space-sm rounded text-inverse-on-surface hover:bg-surface-variant hover:text-on-surface transition-colors font-body-md text-body-md" href="/boq-engine">BOQ Master Engine</a><a className="flex items-center px-space-sm py-space-sm rounded text-inverse-on-surface hover:bg-surface-variant hover:text-on-surface transition-colors font-body-md text-body-md" href="/price-intelligence">Real-Time Multi-Brand Price Intelligence</a><a className="flex items-center px-space-sm py-space-sm rounded text-inverse-on-surface hover:bg-surface-variant hover:text-on-surface transition-colors font-body-md text-body-md" href="/brand-benchmark">Multi-Brand Equivalency</a><a className="flex items-center px-space-sm py-space-sm rounded text-inverse-on-surface hover:bg-surface-variant hover:text-on-surface transition-colors font-body-md text-body-md" href="/purchase-orders">Smart Purchase Order</a><a className="flex items-center px-space-sm py-space-sm rounded text-inverse-on-surface hover:bg-surface-variant hover:text-on-surface transition-colors font-body-md text-body-md" href="/tender-comparison">Multi-Vendor Tender Quotation Comparison</a></nav></div><div className="p-space-base bg-inverse-surface flex flex-col gap-space-xs shrink-0"><div className="flex items-center gap-space-xs px-space-sm py-space-xs rounded bg-surface-variant/20"><span className="h-2 w-2 rounded-full bg-primary animate-pulse"></span><span className="font-label-sm text-label-sm text-inverse-on-surface">99.8% Biometric &amp; IoT Sync • Online</span></div><div className="flex justify-between items-center px-space-sm text-outline-variant font-label-sm text-label-sm"><span>Civil Platform Engine</span><span>v3.4.0</span></div></div></aside><div className="pl-64"><header className="fixed top-0 left-64 right-0 h-16 bg-surface-container-lowest z-40 flex items-center justify-between px-space-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]"><div className="flex items-center gap-space-base"><div className="flex items-center gap-space-sm px-space-sm py-space-xs rounded bg-surface-container-low cursor-pointer hover:bg-surface-container transition-colors"><div className="flex flex-col"><div className="flex items-center gap-space-xs"><span className="font-title-md text-title-md text-on-surface">Cyber Enclave - Phase 2</span><span className="px-space-xs py-space-2xs rounded bg-primary-container text-on-primary-container font-label-sm text-label-sm uppercase">Active</span></div><span className="font-body-sm text-body-sm text-on-surface-variant">Plot 44/A, Madhapur, Hyderabad</span></div><span className="material-symbols-outlined text-on-surface-variant leading-none text-space-base">unfold_more</span></div></div><div className="flex-1 max-w-xl mx-space-xl"><div className="relative flex items-center w-full"><span className="material-symbols-outlined absolute left-space-md text-on-surface-variant leading-none text-space-base">search</span><input className="w-full pl-10 pr-space-base py-space-xs rounded bg-surface-container-low text-on-surface placeholder:text-on-surface-variant font-body-md text-body-md focus:outline-none focus:ring-1 focus:ring-primary" placeholder="Search stages, BOQs, pour cards, crews, drawings (\u2318K)" type="text" /></div></div><div className="flex items-center gap-space-base"><div className="hidden xl:flex items-center gap-space-xs px-space-sm py-space-xs rounded bg-surface-container-low"><span className="material-symbols-outlined text-tertiary leading-none text-space-base">wb_sunny</span><span className="font-label-md text-label-md text-on-surface">31°C Clear • Madhapur</span></div><button className="relative p-space-xs rounded hover:bg-surface-container-high transition-colors text-on-surface-variant"><span className="material-symbols-outlined leading-none text-space-lg">notifications</span><span className="absolute top-space-2xs right-space-2xs h-4 w-4 rounded-full bg-error text-on-error font-label-sm text-label-sm flex items-center justify-center font-bold">4</span></button><button className="flex items-center gap-space-xs px-space-md py-space-xs rounded bg-primary text-on-primary hover:bg-primary-container font-title-md text-title-md shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-colors"><span className="material-symbols-outlined leading-none text-space-base">add</span><span>Add Entry</span></button><div className="flex items-center gap-space-sm pl-space-sm cursor-pointer"><img alt="Profile" className="w-8 h-8 rounded-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBHDIpsNXEFI2Xxxf-9S-y5biCY9RMnl4nPozaFsEL_Sjocvh-XjX0DjJzNiFjiWthSfkkUHejkD-UL-cAPv-v530T1XgKmIU9w9baPyoLX2v_fu89-IMyCdxTnkWhXk5B65XiGZyUmvCbxGNzjOcT4lxo6ihkCSiqGE_2p5YzeFBFE0TgOGvPKmwV95HRnykA1yFFDes6A5XMUvbTT8RiMU9ptgueI9zdyg7HdxSmaQknEKI1ffxdp" /><div className="hidden 2xl:flex flex-col"><span className="font-title-md text-title-md text-on-surface leading-none">Shravan Kumar</span><span className="font-label-sm text-label-sm text-on-surface-variant mt-space-2xs">Site Chief</span></div></div></div></header><main className="relative pt-16 w-full px-space-xl pb-space-3xl min-h-screen bg-surface"><div className="flex flex-col w-full">

<div className="flex flex-col gap-space-sm mb-space-base">

<div className="flex items-center justify-between">
<div className="flex items-center gap-space-xs text-on-surface-variant font-label-md text-label-md">
<span>Civil Platform</span>
<span className="material-symbols-outlined text-space-base">chevron_right</span>
<span>Procurement &amp; Tenders</span>
<span className="material-symbols-outlined text-space-base">chevron_right</span>
<span className="text-on-surface font-title-md">Multi-Vendor Comparison</span>
</div>
<div className="flex items-center gap-space-xs text-on-surface-variant font-label-sm text-label-sm">
<span className="inline-block w-2 h-2 rounded-full bg-primary animate-ping"></span>
<span>Mandi Rates Live Sync: <strong>Today, 11:30 AM IST</strong></span>
</div>
</div>

<div className="flex flex-wrap items-center justify-between gap-space-md">
<div className="flex flex-col">
<div className="flex items-center gap-space-sm flex-wrap">
<h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">Multi-Vendor Tender Quotation Comparison Studio</h1>
<span className="px-space-xs py-space-2xs rounded bg-surface-container-high text-on-surface font-label-sm text-label-sm">RFQ #RFQ-2026-STEEL-09</span>
<span className="px-space-xs py-space-2xs rounded bg-secondary-container text-on-secondary-container font-label-sm text-label-sm">Hyderabad Region Benchmarked</span>
<span className="px-space-xs py-space-2xs rounded bg-primary-fixed text-on-primary-fixed font-label-sm text-label-sm font-semibold">3 Quotations Received</span>
</div>
<p className="font-body-sm text-body-sm text-on-surface-variant mt-space-2xs">High-density L-1 / L-2 / L-3 unit-rate intelligence, logistics parity analysis, and commercial compliance matrix.</p>
</div>

<div className="flex items-center gap-space-xs">
<button className="flex items-center gap-space-xs px-space-md py-space-xs rounded bg-surface-container-lowest shadow-sm hover:bg-surface-container transition-colors text-on-surface font-title-md text-title-md">
<span className="material-symbols-outlined text-space-base text-primary">download</span>
<span>Export Comparative (.xlsx)</span>
</button>
<button className="flex items-center gap-space-xs px-space-md py-space-xs rounded bg-surface-container-lowest shadow-sm hover:bg-surface-container transition-colors text-on-surface font-title-md text-title-md">
<span className="material-symbols-outlined text-space-base text-secondary">mail</span>
<span>Auto-Negotiation Letter</span>
</button>
<button className="flex items-center gap-space-xs px-space-md py-space-xs rounded bg-primary text-on-primary hover:bg-primary-container font-title-md text-title-md shadow-sm transition-colors">
<span className="material-symbols-outlined text-space-base">person_add</span>
<span>Invite Vendor (+)</span>
</button>
</div>
</div>

<div className="flex flex-wrap items-center justify-between gap-space-md bg-surface-container-lowest p-space-sm rounded-lg shadow-sm mt-space-xs">
<div className="flex items-center gap-space-md flex-1 min-w-[280px]">
<div className="flex items-center gap-space-xs text-on-surface-variant font-label-sm text-label-sm shrink-0">
<span className="material-symbols-outlined text-space-base">filter_alt</span>
<span>ACTIVE RFQ:</span>
</div>
<div className="relative flex-1 max-w-md">
<select className="w-full bg-surface-container-low text-on-surface font-title-md text-title-md py-space-xs pl-space-sm pr-space-xl rounded appearance-none focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer">
<option>Steel Rebar 12mm-25mm Fe 500D — 120 MT Total (Madhapur Plot 44/A)</option>
<option>Ready-Mix Concrete M30/M40 — 850 Cum (Tower B Raft)</option>
<option>Structural Steel Sections ISMB 200 — 45 MT</option>
</select>
<span className="material-symbols-outlined absolute right-space-sm top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none text-space-base">expand_more</span>
</div>
<div className="flex items-center gap-space-xs px-space-sm py-space-2xs rounded bg-surface-container text-on-surface-variant font-label-sm text-label-sm">
<span className="w-1.5 h-1.5 rounded-full bg-tertiary-container"></span>
<span>Status: <strong>Evaluation Phase (Active)</strong></span>
</div>
</div>
<div className="flex items-center gap-space-md text-body-sm text-on-surface-variant">
<span>Tender Ceiling: <strong className="text-on-surface font-tabular-metric-sm text-tabular-metric-sm">₹70,26,000</strong></span>
<span className="h-4 w-px bg-surface-container"></span>
<span>Submission Deadline: <strong className="text-on-surface">Yesterday, 17:00 IST</strong></span>
<span className="h-4 w-px bg-surface-container"></span>
<div className="flex items-center gap-space-2xs text-primary font-label-sm text-label-sm">
<span className="material-symbols-outlined text-space-base">verified</span>
<span>NABL Standard Validated</span>
</div>
</div>
</div>
</div>

<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-space-normal mb-space-base">

<div className="flex flex-col justify-between bg-surface-container-lowest p-space-base rounded-xl shadow-sm relative overflow-hidden">
<div className="absolute -right-4 -bottom-4 w-24 h-24 bg-primary/5 rounded-full pointer-events-none"></div>
<div className="flex items-start justify-between">
<div className="flex flex-col">
<span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Lowest Bid (L-1 Standard)</span>
<span className="font-display-lg text-display-lg font-bold text-on-surface mt-space-2xs">₹67,84,000</span>
</div>
<span className="px-space-xs py-space-2xs rounded bg-primary text-on-primary font-label-sm text-label-sm font-semibold tracking-wide uppercase">L-1 Active</span>
</div>
<div className="flex items-center gap-space-xs mt-space-md text-primary font-body-sm text-body-sm">
<span className="material-symbols-outlined text-space-base">trending_down</span>
<span><strong>₹2,42,000 below</strong> budgeted estimate</span>
</div>
<div className="font-label-sm text-label-sm text-on-surface-variant mt-space-2xs truncate">
        Vendor: <strong>Tirumala Steel &amp; Infra Traders</strong>
</div>
</div>

<div className="flex flex-col justify-between bg-surface-container-lowest p-space-base rounded-xl shadow-sm relative overflow-hidden">
<div className="absolute -right-4 -bottom-4 w-24 h-24 bg-primary-fixed/30 rounded-full pointer-events-none"></div>
<div className="flex items-start justify-between">
<div className="flex flex-col">
<span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Project Savings vs Mandi</span>
<span className="font-display-lg text-display-lg font-bold text-primary mt-space-2xs">₹3,16,000</span>
</div>
<span className="px-space-xs py-space-2xs rounded bg-primary-fixed text-on-primary-fixed font-label-sm text-label-sm font-semibold">-4.45% Spread</span>
</div>
<div className="flex items-center gap-space-xs mt-space-md text-on-surface-variant font-body-sm text-body-sm">
<span className="material-symbols-outlined text-space-base text-primary">analytics</span>
<span>Mandi Spot avg: <strong>₹59,166/MT</strong></span>
</div>
<div className="font-label-sm text-label-sm text-on-surface-variant mt-space-2xs">
        Effective weighted savings: <strong>₹2,633/MT</strong>
</div>
</div>

<div className="flex flex-col justify-between bg-surface-container-lowest p-space-base rounded-xl shadow-sm relative overflow-hidden">
<div className="flex items-start justify-between">
<div className="flex flex-col">
<span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Spread (L-1 vs L-3)</span>
<span className="font-display-lg text-display-lg font-bold text-secondary mt-space-2xs">₹4,12,000</span>
</div>
<span className="px-space-xs py-space-2xs rounded bg-surface-container text-on-secondary-container font-label-sm text-label-sm">6.07% Divergence</span>
</div>
<div className="flex items-center gap-space-xs mt-space-md text-on-surface-variant font-body-sm text-body-sm">
<span className="material-symbols-outlined text-space-base text-error">swap_vert</span>
<span>Delta between lowest and highest quote</span>
</div>
<div className="font-label-sm text-label-sm text-on-surface-variant mt-space-2xs">
        Max risk exposure mitigated via L-1 auto-lock
      </div>
</div>

<div className="flex flex-col justify-between bg-surface-container-lowest p-space-base rounded-xl shadow-sm relative overflow-hidden">
<div className="flex items-start justify-between">
<div className="flex flex-col">
<span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Compliance &amp; Delivery</span>
<span className="font-display-lg text-display-lg font-bold text-on-surface mt-space-2xs">98.2%</span>
</div>
<span className="px-space-xs py-space-2xs rounded bg-surface-container-high text-on-surface font-label-sm text-label-sm">BIS / NABL Pass</span>
</div>
<div className="flex items-center gap-space-xs mt-space-md text-on-surface-variant font-body-sm text-body-sm">
<span className="material-symbols-outlined text-space-base text-primary">fact_check</span>
<span>3 of 3 Vendors Certified IS 1786:2008</span>
</div>
<div className="font-label-sm text-label-sm text-on-surface-variant mt-space-2xs">
        Audit trail logged to Hyderabad QA registry
      </div>
</div>
</div>

<div className="bg-surface-container-low rounded-xl p-space-base mb-space-base shadow-sm">
<div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-space-base">
<div className="flex items-start gap-space-base">
<div className="w-10 h-10 rounded bg-primary text-on-primary flex items-center justify-center shrink-0 shadow-sm">
<span className="material-symbols-outlined text-space-lg">psychology</span>
</div>
<div className="flex flex-col">
<div className="flex items-center gap-space-xs">
<span className="font-title-md text-title-md text-on-surface font-bold">AI Rate Intelligence &amp; Split Procurement Recommendation</span>
<span className="px-space-xs py-space-2xs rounded bg-primary-fixed text-on-primary-fixed font-label-sm text-label-sm uppercase font-semibold">High Value Insight</span>
</div>
<p className="font-body-md text-body-md text-on-surface mt-space-2xs max-w-4xl">
<strong>Sagar Infra Steels (L-2)</strong> submitted a lower unit rate on <strong>12mm Rebar (₹56,600 vs ₹56,800/MT)</strong>. A split allocation saves ₹5,000 on steel, but consolidating 100% of order with <strong>Tirumala Steel (L-1)</strong> secures <span className="text-primary font-semibold">₹54,000 savings in unified logistics</span> (free direct trailers) plus <strong>30-day PDC terms</strong> vs 15-day LC. Single award recommended.
          </p>
</div>
</div>
<div className="flex items-center gap-space-xs shrink-0 w-full lg:w-auto justify-end">
<button className="px-space-md py-space-xs rounded bg-surface-container-lowest text-on-surface hover:bg-surface-container text-body-md font-title-md shadow-sm transition-colors">
          Award Split Tender
        </button>
<button className="px-space-md py-space-xs rounded bg-surface-container-lowest text-on-surface hover:bg-surface-container text-body-md font-title-md shadow-sm transition-colors">
          BAFO Request (L-2)
        </button>
<button className="px-space-md py-space-xs rounded bg-primary text-on-primary hover:bg-primary-container text-body-md font-title-md shadow-sm flex items-center gap-space-2xs transition-colors">
<span className="material-symbols-outlined text-space-base">task_alt</span>
<span>Award Complete to L-1</span>
</button>
</div>
</div>
</div>

<div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden mb-space-base">

<div className="px-space-base py-space-sm bg-surface-container-low flex flex-wrap items-center justify-between gap-space-base">
<div className="flex items-center gap-space-base">
<span className="font-title-md text-title-md text-on-surface uppercase tracking-wider">Line Item Parity Matrix</span>
<span className="text-on-surface-variant font-body-sm text-body-sm">All base rates in INR (₹) per Metric Tonne excl. GST</span>
</div>
<div className="flex items-center gap-space-md">
<div className="flex items-center gap-space-2xs font-label-sm text-label-sm text-on-surface-variant">
<span className="w-3 h-3 rounded-full bg-primary inline-block"></span>
<span>L-1 Lowest Line Rate</span>
</div>
<div className="flex items-center gap-space-2xs font-label-sm text-label-sm text-on-surface-variant">
<span className="w-3 h-3 rounded-full bg-secondary inline-block"></span>
<span>L-2 Competitive</span>
</div>
<div className="flex items-center gap-space-2xs font-label-sm text-label-sm text-on-surface-variant">
<span className="w-3 h-3 rounded-full bg-error inline-block"></span>
<span>L-3 Over Benchmark</span>
</div>
</div>
</div>

<div className="overflow-x-auto w-full">
<table className="w-full text-left table-fixed min-w-[1100px]">
<colgroup>
<col className="w-[28%]" />
<col className="w-[24%] bg-primary/5" />
<col className="w-[24%]" />
<col className="w-[24%]" />
</colgroup>
<thead>
<tr className="bg-surface-container-low text-on-surface font-title-md text-title-md">

<th className="p-space-base align-top">
<div className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Tender Specification &amp; Quantities</div>
<div className="font-headline-sm text-headline-sm text-on-surface mt-space-2xs">Steel Rebar BOQ Scope</div>
<div className="text-body-sm text-on-surface-variant mt-space-2xs">Estimated Budget: ₹70,26,000</div>
</th>

<th className="p-space-base align-top bg-primary text-on-primary relative">
<div className="flex items-center justify-between">
<span className="px-space-xs py-space-2xs rounded bg-primary-fixed text-on-primary-fixed font-label-sm text-label-sm font-bold uppercase tracking-wider">Recommended L-1</span>
<span className="material-symbols-outlined text-primary-fixed text-space-lg">stars</span>
</div>
<div className="font-headline-sm text-headline-sm font-bold text-on-primary mt-space-xs">Tirumala Steel &amp; Infra</div>
<div className="text-on-primary/80 font-body-sm text-body-sm mt-space-2xs">Nacharam Yard, Hyd • GSTIN: 36AAACT9821R1Z8</div>
<div className="mt-space-xs flex items-center gap-space-xs">
<span className="font-label-sm text-label-sm bg-primary-container px-space-xs py-space-2xs rounded">Score: 9.4 / 10</span>
<span className="font-label-sm text-label-sm bg-primary-container px-space-xs py-space-2xs rounded">BIS Certified</span>
</div>
</th>

<th className="p-space-base align-top bg-surface-container-lowest text-on-surface">
<div className="flex items-center justify-between">
<span className="px-space-xs py-space-2xs rounded bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm uppercase font-semibold">L-2 Bidder</span>
<span className="text-on-surface-variant font-label-sm text-label-sm">+2.18% Delta</span>
</div>
<div className="font-headline-sm text-headline-sm text-on-surface mt-space-xs">Sagar Infra Steels Ltd</div>
<div className="text-on-surface-variant font-body-sm text-body-sm mt-space-2xs">Balanagar Hub, Hyd • GSTIN: 36AABCS4412K1ZK</div>
<div className="mt-space-xs flex items-center gap-space-xs">
<span className="font-label-sm text-label-sm bg-surface-container px-space-xs py-space-2xs rounded">Score: 8.8 / 10</span>
<span className="font-label-sm text-label-sm bg-surface-container px-space-xs py-space-2xs rounded">TATA Tiscon Auth</span>
</div>
</th>

<th className="p-space-base align-top bg-surface-container-lowest text-on-surface">
<div className="flex items-center justify-between">
<span className="px-space-xs py-space-2xs rounded bg-error-container text-on-error-container font-label-sm text-label-sm uppercase font-semibold">L-3 Bidder - High</span>
<span className="text-error font-label-sm text-label-sm font-semibold">+6.07% Delta</span>
</div>
<div className="font-headline-sm text-headline-sm text-on-surface mt-space-xs">Deccan Iron &amp; Metal Corp</div>
<div className="text-on-surface-variant font-body-sm text-body-sm mt-space-2xs">Kukatpally Depot, Hyd • GSTIN: 36AACCD9182L1ZX</div>
<div className="mt-space-xs flex items-center gap-space-xs">
<span className="font-label-sm text-label-sm bg-surface-container px-space-xs py-space-2xs rounded">Score: 7.6 / 10</span>
<span className="font-label-sm text-label-sm bg-surface-container px-space-xs py-space-2xs rounded">Secondary Rolling</span>
</div>
</th>
</tr>
</thead>
<tbody className="divide-none text-body-md text-on-surface">

<tr className="hover:bg-surface-container/30 transition-colors">
<td className="p-space-base">
<div className="font-title-md text-title-md text-on-surface">Fe 500D TMT Rebar 16mm</div>
<div className="text-body-sm text-on-surface-variant">Tender Est Qty: <strong>50 MT</strong> • Benchmark: ₹58,000/MT</div>
<div className="text-label-sm text-label-sm text-outline mt-space-2xs">Primary reinforcement for Columns &amp; Raft beams</div>
</td>

<td className="p-space-base bg-primary/5">
<div className="flex items-baseline justify-between">
<span className="font-tabular-metric text-tabular-metric text-primary">₹56,200</span>
<span className="px-space-xs py-space-2xs rounded bg-primary-fixed text-on-primary-fixed font-label-sm text-label-sm font-semibold">L-1 (-₹1,800)</span>
</div>
<div className="text-body-sm text-on-surface-variant mt-space-2xs">Line Total: <strong>₹28,10,000</strong></div>
<div className="text-label-sm text-label-sm text-primary">Jindal Panther Primary Grade</div>
</td>

<td className="p-space-base">
<div className="flex items-baseline justify-between">
<span className="font-tabular-metric text-tabular-metric text-on-surface">₹57,100</span>
<span className="text-on-surface-variant font-label-sm text-label-sm">+₹900/MT</span>
</div>
<div className="text-body-sm text-on-surface-variant mt-space-2xs">Line Total: <strong>₹28,55,000</strong></div>
<div className="text-label-sm text-label-sm text-on-surface-variant">Tata Tiscon 500D</div>
</td>

<td className="p-space-base">
<div className="flex items-baseline justify-between">
<span className="font-tabular-metric text-tabular-metric text-error">₹59,400</span>
<span className="px-space-xs py-space-2xs rounded bg-error-container text-on-error-container font-label-sm text-label-sm">+₹1,400 Over Est</span>
</div>
<div className="text-body-sm text-on-surface-variant mt-space-2xs">Line Total: <strong>₹29,70,000</strong></div>
<div className="text-label-sm text-label-sm text-on-surface-variant">SAIL Commercial Batch</div>
</td>
</tr>

<tr className="bg-surface-container-low/40 hover:bg-surface-container/40 transition-colors">
<td className="p-space-base">
<div className="font-title-md text-title-md text-on-surface">Fe 500D TMT Rebar 20mm</div>
<div className="text-body-sm text-on-surface-variant">Tender Est Qty: <strong>45 MT</strong> • Benchmark: ₹58,500/MT</div>
<div className="text-label-sm text-label-sm text-outline mt-space-2xs">Core structural shear walls &amp; footing dowels</div>
</td>

<td className="p-space-base bg-primary/5">
<div className="flex items-baseline justify-between">
<span className="font-tabular-metric text-tabular-metric text-primary">₹56,500</span>
<span className="px-space-xs py-space-2xs rounded bg-primary-fixed text-on-primary-fixed font-label-sm text-label-sm font-semibold">L-1 (-₹2,000)</span>
</div>
<div className="text-body-sm text-on-surface-variant mt-space-2xs">Line Total: <strong>₹25,42,500</strong></div>
<div className="text-label-sm text-label-sm text-primary">Pre-tested rolling certificate attached</div>
</td>

<td className="p-space-base">
<div className="flex items-baseline justify-between">
<span className="font-tabular-metric text-tabular-metric text-on-surface">₹57,400</span>
<span className="text-on-surface-variant font-label-sm text-label-sm">+₹900/MT</span>
</div>
<div className="text-body-sm text-on-surface-variant mt-space-2xs">Line Total: <strong>₹25,83,000</strong></div>
<div className="text-label-sm text-label-sm text-on-surface-variant">Ex-stock available</div>
</td>

<td className="p-space-base">
<div className="flex items-baseline justify-between">
<span className="font-tabular-metric text-tabular-metric text-error">₹59,800</span>
<span className="px-space-xs py-space-2xs rounded bg-error-container text-on-error-container font-label-sm text-label-sm">+₹1,300 Over Est</span>
</div>
<div className="text-body-sm text-on-surface-variant mt-space-2xs">Line Total: <strong>₹26,91,000</strong></div>
<div className="text-label-sm text-label-sm text-on-surface-variant">Vizag Steel Primary</div>
</td>
</tr>

<tr className="hover:bg-surface-container/30 transition-colors">
<td className="p-space-base">
<div className="font-title-md text-title-md text-on-surface">Fe 500D TMT Rebar 12mm</div>
<div className="text-body-sm text-on-surface-variant">Tender Est Qty: <strong>25 MT</strong> • Benchmark: ₹58,900/MT</div>
<div className="text-label-sm text-label-sm text-outline mt-space-2xs">Floor slab distribution &amp; staircase reinforcement</div>
</td>

<td className="p-space-base bg-primary/5">
<div className="flex items-baseline justify-between">
<span className="font-tabular-metric text-tabular-metric text-on-surface">₹56,800</span>
<span className="text-on-surface-variant font-label-sm text-label-sm font-semibold">+₹200 diff vs Sagar</span>
</div>
<div className="text-body-sm text-on-surface-variant mt-space-2xs">Line Total: <strong>₹14,20,000</strong></div>
<div className="text-label-sm text-label-sm text-primary">Tied to bundle packing</div>
</td>

<td className="p-space-base bg-surface-container/20">
<div className="flex items-baseline justify-between">
<span className="font-tabular-metric text-tabular-metric text-primary">₹56,600</span>
<span className="px-space-xs py-space-2xs rounded bg-primary-fixed text-on-primary-fixed font-label-sm text-label-sm font-bold">Line L-1</span>
</div>
<div className="text-body-sm text-on-surface-variant mt-space-2xs">Line Total: <strong>₹14,15,000</strong></div>
<div className="text-label-sm text-label-sm text-primary">Special bulk promotional batch</div>
</td>

<td className="p-space-base">
<div className="flex items-baseline justify-between">
<span className="font-tabular-metric text-tabular-metric text-on-surface">₹58,900</span>
<span className="text-on-surface-variant font-label-sm text-label-sm">At Benchmark</span>
</div>
<div className="text-body-sm text-on-surface-variant mt-space-2xs">Line Total: <strong>₹14,72,500</strong></div>
<div className="text-label-sm text-label-sm text-on-surface-variant">Standard bundled</div>
</td>
</tr>

<tr className="bg-surface-container-low/40 hover:bg-surface-container/40 transition-colors">
<td className="p-space-base">
<div className="font-title-md text-title-md text-on-surface">Freight, Transit Insurance &amp; Unloading</div>
<div className="text-body-sm text-on-surface-variant">Madhapur Site (Plot 44/A) • Total 120 MT</div>
<div className="text-label-sm text-label-sm text-outline mt-space-2xs">Hydraulic crane crane offloading mandatory</div>
</td>

<td className="p-space-base bg-primary/5">
<div className="flex items-center gap-space-xs">
<span className="px-space-xs py-space-2xs rounded bg-primary-fixed text-on-primary-fixed font-label-sm text-label-sm font-bold">Free / Included</span>
<span className="text-primary font-body-sm text-body-sm">₹0 Additional</span>
</div>
<div className="text-label-sm text-label-sm text-on-surface-variant mt-space-2xs">Saves ₹54,000 in site unloading handling</div>
</td>

<td className="p-space-base">
<div className="font-tabular-metric text-tabular-metric text-error">+₹450 / MT</div>
<div className="text-body-sm text-on-surface-variant mt-space-2xs">Additional: <strong>₹54,000</strong> on consignment</div>
<div className="text-label-sm text-label-sm text-on-surface-variant">Site crane extra on client scope</div>
</td>

<td className="p-space-base">
<div className="flex items-center gap-space-xs">
<span className="px-space-xs py-space-2xs rounded bg-surface-container-high text-on-surface font-label-sm text-label-sm font-medium">Included</span>
<span className="text-on-surface-variant font-body-sm text-body-sm">₹0 Additional</span>
</div>
<div className="text-label-sm text-label-sm text-on-surface-variant mt-space-2xs">Unloading within 4 hours free</div>
</td>
</tr>

<tr className="hover:bg-surface-container/30 transition-colors">
<td className="p-space-base">
<div className="font-title-md text-title-md text-on-surface">Payment Terms &amp; Credit Window</div>
<div className="text-body-sm text-on-surface-variant">Financial Risk Assessment &amp; Working Capital</div>
<div className="text-label-sm text-label-sm text-outline mt-space-2xs">Client Treasury Preference: Min 30 Days Credit</div>
</td>

<td className="p-space-base bg-primary/5">
<div className="flex items-center gap-space-xs">
<span className="material-symbols-outlined text-primary text-space-base">verified</span>
<span className="font-title-md text-title-md text-primary">30 Days PDC</span>
</div>
<div className="text-body-sm text-on-surface-variant mt-space-2xs">Post-dated cheque post physical test slip</div>
<div className="text-label-sm text-label-sm text-primary font-semibold">Zero Treasury Strain</div>
</td>

<td className="p-space-base">
<div className="font-title-md text-title-md text-on-surface">15 Days Bank LC</div>
<div className="text-body-sm text-on-surface-variant mt-space-2xs">Requires bank limits lien (~0.75% fee)</div>
<div className="text-label-sm text-label-sm text-on-surface-variant">Moderate working capital tie-up</div>
</td>

<td className="p-space-base">
<div className="font-title-md text-title-md text-error">100% Against Proforma</div>
<div className="text-body-sm text-on-surface-variant mt-space-2xs">Immediate fund transfer prior to dispatch</div>
<div className="text-label-sm text-label-sm text-error font-semibold">High working capital friction</div>
</td>
</tr>

<tr className="bg-surface-container-low/40 hover:bg-surface-container/40 transition-colors">
<td className="p-space-base">
<div className="font-title-md text-title-md text-on-surface">Lead Time to Site Delivery</div>
<div className="text-body-sm text-on-surface-variant">Crucial for Foundation Pour Schedule (24-Apr)</div>
<div className="text-label-sm text-label-sm text-outline mt-space-2xs">Stockyard proximity &amp; fleet readiness</div>
</td>

<td className="p-space-base bg-primary/5">
<div className="flex items-center gap-space-xs">
<span className="material-symbols-outlined text-primary text-space-base">bolt</span>
<span className="font-tabular-metric-sm text-tabular-metric-sm text-primary">24 Hours Guaranteed</span>
</div>
<div className="text-body-sm text-on-surface-variant mt-space-2xs">Direct dispatch from Nacharam yard (14km)</div>
<div className="text-label-sm text-label-sm text-primary">Zero schedule slip risk</div>
</td>

<td className="p-space-base">
<div className="font-tabular-metric-sm text-tabular-metric-sm text-on-surface">48 Hours</div>
<div className="text-body-sm text-on-surface-variant mt-space-2xs">Balanagar central hub (26km)</div>
<div className="text-label-sm text-label-sm text-on-surface-variant">Acceptable buffer</div>
</td>

<td className="p-space-base">
<div className="font-tabular-metric-sm text-tabular-metric-sm text-error">3 to 4 Days</div>
<div className="text-body-sm text-on-surface-variant mt-space-2xs">Transit from secondary rolling mill outside city</div>
<div className="text-label-sm text-label-sm text-error">Pours at risk if delayed</div>
</td>
</tr>
</tbody>

<tfoot>

<tr className="bg-surface-container">
<td className="p-space-base font-title-md text-title-md text-on-surface">
<span>Total Material &amp; Freight Base Cost</span>
<div className="text-body-sm text-on-surface-variant font-normal">Excluding applicable Goods &amp; Service Tax</div>
</td>
<td className="p-space-base bg-primary/10">
<div className="font-display-lg text-display-lg text-primary font-bold">₹67.84 L</div>
<div className="text-label-sm text-label-sm text-primary font-semibold">L-1 (₹67,84,000)</div>
</td>
<td className="p-space-base">
<div className="font-display-lg text-display-lg text-on-surface font-bold">₹69.32 L</div>
<div className="text-label-sm text-label-sm text-on-surface-variant">Base + Logistics (₹69,32,000)</div>
</td>
<td className="p-space-base">
<div className="font-display-lg text-display-lg text-on-surface font-bold">₹71.96 L</div>
<div className="text-label-sm text-label-sm text-error font-semibold">L-3 (₹71,96,000)</div>
</td>
</tr>

<tr className="bg-surface-container-low/80 text-on-surface-variant">
<td className="p-space-base font-body-md text-body-md">
<span>Applicable GST @ 18% (Input Tax Credit Eligible)</span>
</td>
<td className="p-space-base bg-primary/5 font-tabular-metric-sm text-tabular-metric-sm text-on-surface">₹12,21,120</td>
<td className="p-space-base font-tabular-metric-sm text-tabular-metric-sm text-on-surface">₹12,47,760</td>
<td className="p-space-base font-tabular-metric-sm text-tabular-metric-sm text-on-surface">₹12,95,280</td>
</tr>

<tr className="bg-surface-container-high text-on-surface">
<td className="p-space-base">
<div className="font-headline-sm text-headline-sm font-bold">Gross Landed Cost (Project Total)</div>
<div className="text-body-sm text-on-surface-variant">Final contractual commitment value</div>
</td>
<td className="p-space-base bg-primary text-on-primary">
<div className="font-display-lg text-display-lg font-bold">₹80.05 L</div>
<div className="font-label-sm text-label-sm text-primary-fixed">₹80,05,120 All-Inclusive</div>
</td>
<td className="p-space-base">
<div className="font-display-lg text-display-lg font-bold">₹81.80 L</div>
<div className="text-label-sm text-label-sm text-on-surface-variant">₹81,79,760 (+₹1.74 L)</div>
</td>
<td className="p-space-base">
<div className="font-display-lg text-display-lg font-bold text-error">₹84.91 L</div>
<div className="text-label-sm text-label-sm text-error">₹84,91,280 (+₹4.86 L)</div>
</td>
</tr>

<tr className="bg-surface-container-lowest">
<td className="p-space-base align-middle">
<div className="font-title-md text-title-md text-on-surface">Vendor Final Composite Rating</div>
<div className="text-body-sm text-on-surface-variant">Score based on price (60%), terms (20%), QA (20%)</div>
</td>
<td className="p-space-base bg-primary/5 align-middle">
<div className="flex items-center justify-between">
<span className="font-headline-sm text-headline-sm font-bold text-primary">9.4 / 10</span>
<span className="px-space-xs py-space-2xs rounded bg-primary text-on-primary font-label-sm text-label-sm font-bold">RECOMMENDED</span>
</div>
<div className="w-full bg-surface-container rounded-full h-1.5 mt-space-xs overflow-hidden">
<div className="bg-primary h-1.5 rounded-full" style={{ width: "94%" }}></div>
</div>
</td>
<td className="p-space-base align-middle">
<div className="flex items-center justify-between">
<span className="font-headline-sm text-headline-sm font-bold text-on-surface">8.8 / 10</span>
<span className="px-space-xs py-space-2xs rounded bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm">BACKUP</span>
</div>
<div className="w-full bg-surface-container rounded-full h-1.5 mt-space-xs overflow-hidden">
<div className="bg-secondary h-1.5 rounded-full" style={{ width: "88%" }}></div>
</div>
</td>
<td className="p-space-base align-middle">
<div className="flex items-center justify-between">
<span className="font-headline-sm text-headline-sm font-bold text-on-surface-variant">7.6 / 10</span>
<span className="px-space-xs py-space-2xs rounded bg-error-container text-on-error-container font-label-sm text-label-sm">DISQUALIFIED</span>
</div>
<div className="w-full bg-surface-container rounded-full h-1.5 mt-space-xs overflow-hidden">
<div className="bg-outline h-1.5 rounded-full" style={{ width: "76%" }}></div>
</div>
</td>
</tr>
</tfoot>
</table>
</div>
</div>

<div className="grid grid-cols-1 lg:grid-cols-3 gap-space-normal">

<div className="bg-surface-container-lowest p-space-base rounded-xl shadow-sm flex flex-col justify-between">
<div className="flex items-center justify-between mb-space-sm">
<div className="flex flex-col">
<span className="font-title-md text-title-md text-on-surface">Price Deviation Spectrum</span>
<span className="font-body-sm text-body-sm text-on-surface-variant">Variance vs Tender Benchmark (₹70.26 L)</span>
</div>
<span className="material-symbols-outlined text-primary text-space-lg">insights</span>
</div>

<div className="py-space-md">
<svg className="w-full h-24" fill="none" viewBox="0 0 380 90" xmlns="http://www.w3.org/2000/svg">

<line stroke="#dce9ff" strokeLinecap="round" strokeWidth="4" x1="20" x2="360" y1="45" y2="45"></line>
<line stroke="#6d7a72" strokeDasharray="3 3" strokeWidth="2" x1="200" x2="200" y1="20" y2="70"></line>
<text fill="#6d7a72" fontFamily="Inter" font-size={10} font-weight="500" textAnchor="middle" x="200" y="85">Benchmark ₹70.26L</text>

<circle cx="85" cy="45" fill="#006948" r="10"></circle>
<circle cx="85" cy="45" r="16" stroke="#006948" stroke-opacity="0.2" strokeWidth="4"></circle>
<text fill="#006948" fontFamily="Inter" font-size={11} font-weight="700" textAnchor="middle" x="85" y="25">Tirumala (-₹2.42L)</text>

<circle cx="160" cy="45" fill="#565e74" r="8"></circle>
<text fill="#565e74" fontFamily="Inter" font-size={10} font-weight="600" textAnchor="middle" x="160" y="25">Sagar (-₹0.94L)</text>

<circle cx="280" cy="45" fill="#ba1a1a" r="8"></circle>
<text fill="#ba1a1a" fontFamily="Inter" font-size={10} font-weight="600" textAnchor="middle" x="280" y="25">Deccan (+₹1.70L)</text>
</svg>
</div>
<div className="bg-surface-container-low p-space-sm rounded-lg flex items-center justify-between text-body-sm">
<span className="text-on-surface-variant">Recommended Negotiated Target:</span>
<strong className="text-primary font-tabular-metric-sm text-tabular-metric-sm">₹67,00,000 (-1.2% further)</strong>
</div>
</div>

<div className="bg-surface-container-lowest p-space-base rounded-xl shadow-sm flex flex-col justify-between">
<div className="flex items-center justify-between mb-space-sm">
<div className="flex flex-col">
<span className="font-title-md text-title-md text-on-surface">L-1 Logistics Dispatch Radius</span>
<span className="font-body-sm text-body-sm text-on-surface-variant">Tirumala Yard to Site (Madhapur)</span>
</div>
<span className="px-space-xs py-space-2xs rounded bg-primary-fixed text-on-primary-fixed font-label-sm text-label-sm font-semibold">14.2 km Transit</span>
</div>

<div className="bg-surface-container-low p-space-sm rounded-lg flex flex-col gap-space-xs">
<div className="flex justify-between text-body-sm">
<span className="text-on-surface-variant">Yard Location:</span>
<span className="font-title-md text-title-md text-on-surface">Nacharam Industrial Phase 1</span>
</div>
<div className="flex justify-between text-body-sm">
<span className="text-on-surface-variant">Fleet Readiness:</span>
<span className="text-primary font-semibold">4 Dedicated Multi-Axle Trailers</span>
</div>
<div className="flex justify-between text-body-sm">
<span className="text-on-surface-variant">Batch Testing:</span>
<span className="text-on-surface font-semibold">NABL Accredited Lab on-site</span>
</div>
<div className="flex justify-between text-body-sm">
<span className="text-on-surface-variant">Weighbridge Cert:</span>
<span className="text-on-surface font-semibold">Electronic Direct Sync to Saha OS</span>
</div>
</div>
<div className="flex items-center gap-space-xs mt-space-sm text-label-sm text-label-sm text-on-surface-variant">
<span className="material-symbols-outlined text-primary text-space-base">local_shipping</span>
<span>Green Corridor transit approved via Nehru Outer Ring Road (ORR)</span>
</div>
</div>

<div className="bg-surface-container-lowest p-space-base rounded-xl shadow-sm flex flex-col justify-between">
<div className="flex items-center justify-between mb-space-sm">
<div className="flex flex-col">
<span className="font-title-md text-title-md text-on-surface">Contract Award Authorization</span>
<span className="font-body-sm text-body-sm text-on-surface-variant">Sign-off as Site Chief / Procurement Lead</span>
</div>
<span className="material-symbols-outlined text-space-lg text-primary">gavel</span>
</div>
<div className="space-y-space-xs my-space-xs">
<label className="flex items-start gap-space-xs cursor-pointer">
<input defaultChecked={true} className="mt-1 rounded text-primary focus:ring-primary accent-primary" type="checkbox" />
<span className="font-body-sm text-body-sm text-on-surface">Lock rates against price escalation clause for 60 calendar days</span>
</label>
<label className="flex items-start gap-space-xs cursor-pointer">
<input defaultChecked={true} className="mt-1 rounded text-primary focus:ring-primary accent-primary" type="checkbox" />
<span className="font-body-sm text-body-sm text-on-surface">Require mill test certificate before trailer uncoupling</span>
</label>
<label className="flex items-start gap-space-xs cursor-pointer">
<input className="mt-1 rounded text-primary focus:ring-primary accent-primary" type="checkbox" />
<span className="font-body-sm text-body-sm text-on-surface">Issue digital Letter of Intent (LOI) with OTP dual sign-off</span>
</label>
</div>
<div className="pt-space-xs">
<button className="w-full py-space-sm px-space-base bg-primary text-on-primary font-title-md text-title-md rounded hover:bg-primary-container shadow-sm flex items-center justify-center gap-space-xs transition-colors">
<span className="material-symbols-outlined text-space-base">done_all</span>
<span>Execute Purchase Order (₹80,05,120)</span>
</button>
</div>
</div>
</div>
</div></main></div>
    </div>
  );
}
