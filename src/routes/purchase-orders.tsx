import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/purchase-orders")({
  head: () => ({
    meta: [
      { title: "Smart Purchase Order & Guardrail Hub | Saha OS" },
      { name: "description", content: "PO register with price-variance guardrails, approvals and Tally/SAP export." },
      { property: "og:title", content: "Smart Purchase Order & Guardrail Hub | Saha OS" },
      { property: "og:description", content: "PO register with price-variance guardrails, approvals and Tally/SAP export." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <div className="m3">
<aside className="fixed left-0 top-0 h-screen w-64 bg-inverse-surface text-inverse-on-surface z-50 flex flex-col justify-between select-none shadow-[0_1px_8px_rgba(0,0,0,0.08)]"><div className="flex flex-col flex-1 overflow-y-auto"><div className="h-16 px-space-base flex items-center gap-space-sm bg-inverse-surface shrink-0"><img alt="Saha OS Emblem" className="h-8 w-auto object-contain" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDIQiSC0KLSVxHGr2B2_HfK3WQmBaHVVbmq-u81XZiKLvhto7v_DWxUH1vVZByfZCoeLirx8AViPVqPJ0FJRDGRFWFWsLghNOY9nj4bqxZ7rT-UKzcVgmCs9TbajK3ok-sisTorWnMQrhucRaI2ZV-9QGkzSk9yruIzwjAmlOgkM5ZRFYxvqw8znDu9UEaHuxwf5OTxhL7unhBh_Df3vWosa1GlSJws9Y9fS21e6qxn25xtZbXsGTUl" /><div className="flex flex-col"><span className="font-headline-sm text-headline-sm font-bold text-inverse-on-surface tracking-tight leading-none">Saha OS</span><span className="font-label-sm text-label-sm text-outline-variant uppercase tracking-wider mt-space-2xs">Project Lifecycle Suite</span></div></div><nav className="flex flex-col px-space-sm py-space-sm gap-space-2xs" data-active-classes="bg-primary text-on-primary font-title-md"><div className="px-space-sm pt-space-xs pb-space-2xs font-label-sm text-label-sm uppercase tracking-wider text-outline-variant">Lifecycle Core</div><a className="flex items-center px-space-sm py-space-sm rounded text-inverse-on-surface hover:bg-surface-variant hover:text-on-surface transition-colors font-body-md text-body-md" data-path="projects-setup" href="/projects-setup">Projects &amp; Setup</a><a className="flex items-center px-space-sm py-space-sm rounded text-inverse-on-surface hover:bg-surface-variant hover:text-on-surface transition-colors font-body-md text-body-md" data-path="boq-engine" href="/boq-engine">BOQ Engine</a><a className="flex items-center px-space-sm py-space-sm rounded text-inverse-on-surface hover:bg-surface-variant hover:text-on-surface transition-colors font-body-md text-body-md" data-path="stage-wise-planning" href="/execution-manual">Stage-Wise Planning Hub</a><div className="px-space-sm pt-space-md pb-space-2xs font-label-sm text-label-sm uppercase tracking-wider text-outline-variant">Site &amp; Operations</div><a className="flex items-center px-space-sm py-space-sm rounded text-inverse-on-surface hover:bg-surface-variant hover:text-on-surface transition-colors font-body-md text-body-md" data-path="site-execution" href="/site-execution">Site Execution &amp; Pour Cards</a><a className="flex items-center px-space-sm py-space-sm rounded text-inverse-on-surface hover:bg-surface-variant hover:text-on-surface transition-colors font-body-md text-body-md" data-path="procurement-inventory" href="/purchase-orders">Procurement &amp; Inventory</a><div className="px-space-sm pt-space-md pb-space-2xs font-label-sm text-label-sm uppercase tracking-wider text-outline-variant">Governance</div><a className="flex items-center px-space-sm py-space-sm rounded text-inverse-on-surface hover:bg-surface-variant hover:text-on-surface transition-colors font-body-md text-body-md" data-path="reports-audits" href="/qa-inspection">Reports &amp; Audits</a><div className="px-space-sm pt-space-md pb-space-2xs font-label-sm text-label-sm uppercase tracking-wider text-outline-variant">All Screens</div><a className="flex items-center px-space-sm py-space-sm rounded text-inverse-on-surface hover:bg-surface-variant hover:text-on-surface transition-colors font-body-md text-body-md" href="/boq-upload">BOQ Excel Upload</a><a className="flex items-center px-space-sm py-space-sm rounded text-inverse-on-surface hover:bg-surface-variant hover:text-on-surface transition-colors font-body-md text-body-md" href="/site-execution">Site Execution</a><a className="flex items-center px-space-sm py-space-sm rounded text-inverse-on-surface hover:bg-surface-variant hover:text-on-surface transition-colors font-body-md text-body-md" href="/qa-inspection">AI Visual QA/QC Inspection</a><a className="flex items-center px-space-sm py-space-sm rounded text-inverse-on-surface hover:bg-surface-variant hover:text-on-surface transition-colors font-body-md text-body-md" href="/execution-manual">Stage-Wise Field Execution Manual</a><a className="flex items-center px-space-sm py-space-sm rounded text-inverse-on-surface hover:bg-surface-variant hover:text-on-surface transition-colors font-body-md text-body-md" href="/site-media">Site Media</a><a className="flex items-center px-space-sm py-space-sm rounded text-inverse-on-surface hover:bg-surface-variant hover:text-on-surface transition-colors font-body-md text-body-md" href="/po-create">Smart Purchase Order Creation Engine</a><a className="flex items-center px-space-sm py-space-sm rounded text-inverse-on-surface hover:bg-surface-variant hover:text-on-surface transition-colors font-body-md text-body-md" href="/projects-setup">Project Setup</a><a className="flex items-center px-space-sm py-space-sm rounded text-inverse-on-surface hover:bg-surface-variant hover:text-on-surface transition-colors font-body-md text-body-md" href="/boq-engine">BOQ Master Engine</a><a className="flex items-center px-space-sm py-space-sm rounded text-inverse-on-surface hover:bg-surface-variant hover:text-on-surface transition-colors font-body-md text-body-md" href="/price-intelligence">Real-Time Multi-Brand Price Intelligence</a><a className="flex items-center px-space-sm py-space-sm rounded text-inverse-on-surface hover:bg-surface-variant hover:text-on-surface transition-colors font-body-md text-body-md" href="/brand-benchmark">Multi-Brand Equivalency</a><a className="flex items-center px-space-sm py-space-sm rounded text-inverse-on-surface hover:bg-surface-variant hover:text-on-surface transition-colors font-body-md text-body-md" href="/purchase-orders">Smart Purchase Order</a><a className="flex items-center px-space-sm py-space-sm rounded text-inverse-on-surface hover:bg-surface-variant hover:text-on-surface transition-colors font-body-md text-body-md" href="/tender-comparison">Multi-Vendor Tender Quotation Comparison</a></nav></div><div className="p-space-base bg-inverse-surface flex flex-col gap-space-xs shrink-0"><div className="flex items-center gap-space-xs px-space-sm py-space-xs rounded bg-surface-variant/20"><span className="h-2 w-2 rounded-full bg-primary animate-pulse"></span><span className="font-label-sm text-label-sm text-inverse-on-surface">99.8% Biometric &amp; IoT Sync • Online</span></div><div className="flex justify-between items-center px-space-sm text-outline-variant font-label-sm text-label-sm"><span>Civil Platform Engine</span><span>v3.4.0</span></div></div></aside><div className="pl-64"><header className="fixed top-0 left-64 right-0 h-16 bg-surface-container-lowest z-40 flex items-center justify-between px-space-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]"><div className="flex items-center gap-space-base"><div className="flex items-center gap-space-sm px-space-sm py-space-xs rounded bg-surface-container-low cursor-pointer hover:bg-surface-container transition-colors"><div className="flex flex-col"><div className="flex items-center gap-space-xs"><span className="font-title-md text-title-md text-on-surface">Cyber Enclave - Phase 2</span><span className="px-space-xs py-space-2xs rounded bg-primary-container text-on-primary-container font-label-sm text-label-sm uppercase">Active</span></div><span className="font-body-sm text-body-sm text-on-surface-variant">Plot 44/A, Madhapur, Hyderabad</span></div><span className="material-symbols-outlined text-on-surface-variant leading-none text-space-base">unfold_more</span></div></div><div className="flex-1 max-w-xl mx-space-xl"><div className="relative flex items-center w-full"><span className="material-symbols-outlined absolute left-space-md text-on-surface-variant leading-none text-space-base">search</span><input className="w-full pl-10 pr-space-base py-space-xs rounded bg-surface-container-low text-on-surface placeholder:text-on-surface-variant font-body-md text-body-md focus:outline-none focus:ring-1 focus:ring-primary" placeholder="Search stages, BOQs, pour cards, crews, drawings (\u2318K)" type="text" /></div></div><div className="flex items-center gap-space-base"><div className="hidden xl:flex items-center gap-space-xs px-space-sm py-space-xs rounded bg-surface-container-low"><span className="material-symbols-outlined text-tertiary leading-none text-space-base">wb_sunny</span><span className="font-label-md text-label-md text-on-surface">31°C Clear • Madhapur</span></div><button className="relative p-space-xs rounded hover:bg-surface-container-high transition-colors text-on-surface-variant"><span className="material-symbols-outlined leading-none text-space-lg">notifications</span><span className="absolute top-space-2xs right-space-2xs h-4 w-4 rounded-full bg-error text-on-error font-label-sm text-label-sm flex items-center justify-center font-bold">4</span></button><button className="flex items-center gap-space-xs px-space-md py-space-xs rounded bg-primary text-on-primary hover:bg-primary-container font-title-md text-title-md shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-colors"><span className="material-symbols-outlined leading-none text-space-base">add</span><span>Add Entry</span></button><div className="flex items-center gap-space-sm pl-space-sm cursor-pointer"><img alt="Profile" className="w-8 h-8 rounded-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBHDIpsNXEFI2Xxxf-9S-y5biCY9RMnl4nPozaFsEL_Sjocvh-XjX0DjJzNiFjiWthSfkkUHejkD-UL-cAPv-v530T1XgKmIU9w9baPyoLX2v_fu89-IMyCdxTnkWhXk5B65XiGZyUmvCbxGNzjOcT4lxo6ihkCSiqGE_2p5YzeFBFE0TgOGvPKmwV95HRnykA1yFFDes6A5XMUvbTT8RiMU9ptgueI9zdyg7HdxSmaQknEKI1ffxdp" /><div className="hidden 2xl:flex flex-col"><span className="font-title-md text-title-md text-on-surface leading-none">Shravan Kumar</span><span className="font-label-sm text-label-sm text-on-surface-variant mt-space-2xs">Site Chief</span></div></div></div></header><main className="relative pt-16 w-full px-space-xl pb-space-3xl min-h-screen bg-surface"><div className="flex flex-col w-full gap-space-lg">

<div className="flex flex-col xl:flex-row xl:items-center justify-between gap-space-md bg-surface-container-lowest p-space-lg rounded-xl shadow-sm">
<div className="flex flex-col gap-space-2xs">
<div className="flex items-center gap-space-sm flex-wrap">
<span className="font-label-sm text-label-sm uppercase tracking-widest text-secondary">Procurement &amp; Commercial Governance</span>
<span className="h-1.5 w-1.5 rounded-full bg-outline-variant"></span>
<span className="font-label-sm text-label-sm text-primary font-semibold">Live Site Node</span>
</div>
<div className="flex items-baseline gap-space-md flex-wrap">
<h1 className="font-headline-lg text-headline-lg text-on-surface">Smart Purchase Order &amp; Guardrail Hub</h1>
<div className="flex items-center gap-space-xs">
<span className="px-space-xs py-space-2xs rounded bg-primary text-on-primary font-label-sm text-label-sm flex items-center gap-1">
<span className="material-symbols-outlined text-[13px]">shield</span>Guardrail Engine Active
          </span>
<span className="px-space-xs py-space-2xs rounded bg-secondary-container text-on-secondary-fixed font-label-sm text-label-sm flex items-center gap-1">
<span className="material-symbols-outlined text-[13px]">sync_alt</span>Master Price Sync: 10m ago
          </span>
<span className="px-space-xs py-space-2xs rounded bg-surface-container text-on-surface-variant font-label-sm text-label-sm flex items-center gap-1">
<span className="material-symbols-outlined text-[13px]">cable</span>Tally &amp; SAP S/4 Ready
          </span>
</div>
</div>
<p className="font-body-sm text-body-sm text-on-surface-variant">
        Strict structural material rate compliance for Cyber Enclave Ph-2. Real-time OCR baseline checks mapped to Hyderabad West civil index.
      </p>
</div>

<div className="flex items-center gap-space-sm flex-wrap shrink-0">
<button className="flex items-center gap-space-xs px-space-md py-space-xs rounded bg-surface-container hover:bg-surface-container-high text-on-surface font-title-md text-title-md transition-colors">
<span className="material-symbols-outlined text-space-base">tune</span>
<span>Tolerance (+3%)</span>
</button>
<button className="flex items-center gap-space-xs px-space-md py-space-xs rounded bg-surface-container hover:bg-surface-container-high text-on-surface font-title-md text-title-md transition-colors">
<span className="material-symbols-outlined text-space-base">table_view</span>
<span>Export PO Register</span>
</button>
<button className="flex items-center gap-space-xs px-space-md py-space-xs rounded bg-secondary text-on-secondary hover:bg-secondary/90 font-title-md text-title-md transition-colors">
<span className="material-symbols-outlined text-space-base">send_and_archive</span>
<span>Bulk Release (6)</span>
</button>
<button className="flex items-center gap-space-xs px-space-md py-space-xs rounded bg-primary text-on-primary hover:bg-primary-container font-title-md text-title-md shadow-sm transition-colors">
<span className="material-symbols-outlined text-space-base">add_circle</span>
<span>Create Draft PO</span>
</button>
</div>
</div>

<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">

<div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col justify-between gap-space-sm">
<div className="flex items-center justify-between">
<span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary">Active POs Under Review</span>
<span className="material-symbols-outlined text-secondary text-space-lg">fact_check</span>
</div>
<div className="flex items-baseline justify-between">
<div>
<div className="font-display-lg text-display-lg text-on-surface leading-none">14</div>
<div className="font-body-sm text-body-sm text-on-surface-variant mt-space-2xs">Total value: ₹1.84 Cr</div>
</div>
<div className="flex flex-col items-end">
<span className="px-space-xs py-space-2xs rounded bg-secondary-container text-on-secondary-fixed font-label-sm text-label-sm font-semibold">
            8 At L2 Approval
          </span>
<span className="font-body-sm text-body-sm text-outline mt-1">4 Escalated</span>
</div>
</div>
<div className="w-full bg-surface-container h-1 rounded-full overflow-hidden">
<div className="bg-primary h-full rounded-full" style={{ width: "57%" }}></div>
</div>
</div>

<div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col justify-between gap-space-sm">
<div className="flex items-center justify-between">
<span className="font-label-sm text-label-sm uppercase tracking-wider text-error">Price Variance Blocked</span>
<span className="material-symbols-outlined text-error text-space-lg">gpp_bad</span>
</div>
<div className="flex items-baseline justify-between">
<div>
<div className="font-display-lg text-display-lg text-error leading-none">3 POs</div>
<div className="font-body-sm text-body-sm text-error mt-space-2xs">Exceeded +3% Threshold</div>
</div>
<div className="text-right">
<span className="font-tabular-metric-sm text-tabular-metric-sm text-primary font-bold block">₹3.12 Lakhs</span>
<span className="font-label-sm text-label-sm text-secondary">Saved Potential Leak</span>
</div>
</div>
<div className="flex items-center gap-space-xs text-error font-label-sm text-label-sm">
<span className="material-symbols-outlined text-[14px]">warning</span>
<span>Requires VP or Director Pin override</span>
</div>
</div>

<div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col justify-between gap-space-sm">
<div className="flex items-center justify-between">
<span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary">Avg. PO Cycle Time</span>
<span className="material-symbols-outlined text-tertiary text-space-lg">speed</span>
</div>
<div className="flex items-baseline justify-between">
<div>
<div className="font-display-lg text-display-lg text-on-surface leading-none">4.2 <span className="text-headline-md font-semibold text-secondary">Hours</span></div>
<div className="font-body-sm text-body-sm text-primary font-medium mt-space-2xs">↓ From 72h historical avg</div>
</div>
<span className="px-space-xs py-space-2xs rounded bg-surface-variant text-on-surface font-label-sm text-label-sm">
          -94% latency
        </span>
</div>
<div className="flex items-center gap-space-xs text-on-surface-variant font-label-sm text-label-sm">
<span className="material-symbols-outlined text-primary text-[14px]">bolt</span>
<span>OCR auto-reconciliation enabled</span>
</div>
</div>

<div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col justify-between gap-space-sm">
<div className="flex items-center justify-between">
<span className="font-label-sm text-label-sm uppercase tracking-wider text-primary">Approved &amp; Released (MTD)</span>
<span className="material-symbols-outlined text-primary text-space-lg">verified</span>
</div>
<div className="flex items-baseline justify-between">
<div>
<div className="font-display-lg text-display-lg text-on-surface leading-none">42 <span className="text-headline-md font-semibold text-secondary">POs</span></div>
<div className="font-body-sm text-body-sm text-on-surface-variant mt-space-2xs">₹5.68 Cr Delivered to Site</div>
</div>
<span className="px-space-xs py-space-2xs rounded bg-primary-container text-on-primary font-label-sm text-label-sm font-semibold">
          100% In Budget
        </span>
</div>
<div className="flex items-center justify-between text-outline font-label-sm text-label-sm">
<span>Weighbridge matched: 39</span>
<span>GRN Pending: 3</span>
</div>
</div>
</div>

<div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">

<div className="lg:col-span-8 flex flex-col gap-space-md">

<div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col gap-space-md">
<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm pb-space-sm border-b-0">
<div className="flex items-center gap-space-sm">
<div className="p-space-xs rounded bg-primary-container text-on-primary">
<span className="material-symbols-outlined text-space-lg">receipt_long</span>
</div>
<div>
<div className="flex items-center gap-space-xs">
<span className="font-headline-md text-headline-md text-on-surface font-bold tracking-tight">PO-HYD-CE2-2026-084</span>
<span className="px-space-xs py-space-2xs rounded bg-error-container text-on-error-container font-label-sm text-label-sm font-semibold">
                  1 Line Guardrail Flag
                </span>
</div>
<div className="font-body-sm text-body-sm text-secondary">Created today at 09:42 AM by Er. Rajesh M. (Tower C Lead)</div>
</div>
</div>
<div className="flex items-center gap-space-xs">
<button className="px-space-sm py-space-xs rounded bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md flex items-center gap-1 transition-colors">
<span className="material-symbols-outlined text-[15px]">print</span>Print / PDF
            </button>
<button className="px-space-sm py-space-xs rounded bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md flex items-center gap-1 transition-colors">
<span className="material-symbols-outlined text-[15px]">history</span>Audit Log
            </button>
</div>
</div>

<div className="grid grid-cols-1 md:grid-cols-2 gap-space-md p-space-md rounded-lg bg-surface-container-low">

<div className="flex flex-col gap-space-2xs">
<div className="flex items-center gap-space-xs">
<span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary">Vendor Entity</span>
<span className="px-1.5 py-0.5 rounded bg-primary text-on-primary font-label-sm text-[10px] font-bold">Tier-1</span>
</div>
<div className="font-title-md text-title-md text-on-surface font-bold">Tirumala Steel &amp; Infra Traders</div>
<div className="font-body-sm text-body-sm text-on-surface-variant flex flex-col gap-1">
<span>GSTIN: <strong className="text-on-surface">36AAACT9821R1ZC</strong> (Verified)</span>
<span>Credit Terms: <strong>30 Days Post Dated Cheque (PDC)</strong></span>
<span>Primary Contact: Srikanth Reddy (+91 98490 23118)</span>
</div>
</div>

<div className="flex flex-col gap-space-2xs">
<span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary">Delivery Destination</span>
<div className="font-title-md text-title-md text-on-surface font-bold">Cyber Enclave Ph-2 • Tower C Yard</div>
<div className="font-body-sm text-body-sm text-on-surface-variant flex flex-col gap-1">
<span>Unloading Slot: <strong>Tomorrow, 06:00 - 10:00 IST</strong></span>
<span>Weighbridge: Madhapur Internal Scale #2 (Calibrated)</span>
<span>Target Activity: Level 4 Slab &amp; Column Stilt Cage Pour</span>
</div>
</div>
</div>

<div className="flex flex-col gap-space-xs">
<div className="flex items-center justify-between">
<span className="font-title-md text-title-md text-on-surface font-semibold">Bill of Materials &amp; Rate Verification</span>
<span className="font-body-sm text-body-sm text-secondary">Hyderabad TMT Regional Benchmark: ₹58,400 / MT</span>
</div>
<div className="overflow-x-auto rounded-lg bg-surface-container-lowest">
<table className="w-full text-left border-collapse">
<thead>
<tr className="bg-surface-container-high text-on-surface font-label-md text-label-md uppercase tracking-wider">
<th className="py-space-sm px-space-md">Item &amp; Grade</th>
<th className="py-space-sm px-space-sm text-right">Quantity</th>
<th className="py-space-sm px-space-sm text-right">Quoted Rate</th>
<th className="py-space-sm px-space-sm text-right">Master Ref</th>
<th className="py-space-sm px-space-sm text-center">Variance</th>
<th className="py-space-sm px-space-sm text-right">Net Value</th>
<th className="py-space-sm px-space-md text-center">Status</th>
</tr>
</thead>
<tbody className="divide-y-0 text-on-surface font-body-sm text-body-sm">

<tr className="hover:bg-surface-container-low transition-colors">
<td className="py-space-sm px-space-md">
<div className="font-title-md text-title-md text-on-surface">Fe 500D TMT Rebar 16mm</div>
<div className="font-body-sm text-body-sm text-secondary">Tata Tiscon • IS 1786:2008 • 12m length</div>
</td>
<td className="py-space-sm px-space-sm text-right font-tabular-metric-sm text-tabular-metric-sm">40.00 MT</td>
<td className="py-space-sm px-space-sm text-right font-tabular-metric-sm text-tabular-metric-sm">₹56,200</td>
<td className="py-space-sm px-space-sm text-right font-body-sm text-body-sm text-secondary">₹58,400</td>
<td className="py-space-sm px-space-sm text-center">
<span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary font-label-sm text-label-sm font-semibold">
                      -3.76%
                    </span>
</td>
<td className="py-space-sm px-space-sm text-right font-tabular-metric-sm text-tabular-metric-sm font-bold">₹22,48,000</td>
<td className="py-space-sm px-space-md text-center">
<span className="inline-flex items-center gap-1 px-space-xs py-0.5 rounded bg-primary text-on-primary font-label-sm text-[11px] font-semibold">
<span className="material-symbols-outlined text-[12px]">check_circle</span>Approved
                    </span>
</td>
</tr>

<tr className="hover:bg-surface-container-low transition-colors">
<td className="py-space-sm px-space-md">
<div className="font-title-md text-title-md text-on-surface">Fe 500D TMT Rebar 12mm</div>
<div className="font-body-sm text-body-sm text-secondary">Tata Tiscon • Primary Heat Certified</div>
</td>
<td className="py-space-sm px-space-sm text-right font-tabular-metric-sm text-tabular-metric-sm">25.00 MT</td>
<td className="py-space-sm px-space-sm text-right font-tabular-metric-sm text-tabular-metric-sm">₹56,800</td>
<td className="py-space-sm px-space-sm text-right font-body-sm text-body-sm text-secondary">₹58,900</td>
<td className="py-space-sm px-space-sm text-center">
<span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary font-label-sm text-label-sm font-semibold">
                      -3.56%
                    </span>
</td>
<td className="py-space-sm px-space-sm text-right font-tabular-metric-sm text-tabular-metric-sm font-bold">₹14,20,000</td>
<td className="py-space-sm px-space-md text-center">
<span className="inline-flex items-center gap-1 px-space-xs py-0.5 rounded bg-primary text-on-primary font-label-sm text-[11px] font-semibold">
<span className="material-symbols-outlined text-[12px]">check_circle</span>Approved
                    </span>
</td>
</tr>

<tr className="bg-error-container/20 hover:bg-error-container/30 transition-colors">
<td className="py-space-sm px-space-md">
<div className="font-title-md text-title-md text-on-surface font-semibold flex items-center gap-1">
<span>Binding Wire (18 Gauge GI)</span>
<span className="material-symbols-outlined text-error text-[16px]">error</span>
</div>
<div className="font-body-sm text-body-sm text-error font-medium">Over company limit (+8.33% vs ₹72/Kg Master)</div>
</td>
<td className="py-space-sm px-space-sm text-right font-tabular-metric-sm text-tabular-metric-sm">800.00 Kg</td>
<td className="py-space-sm px-space-sm text-right font-tabular-metric-sm text-tabular-metric-sm text-error font-bold">₹78.00</td>
<td className="py-space-sm px-space-sm text-right font-body-sm text-body-sm text-secondary">₹72.00</td>
<td className="py-space-sm px-space-sm text-center">
<span className="px-1.5 py-0.5 rounded bg-error text-on-error font-label-sm text-label-sm font-bold">
                      +8.33%
                    </span>
</td>
<td className="py-space-sm px-space-sm text-right font-tabular-metric-sm text-tabular-metric-sm font-bold">₹62,400</td>
<td className="py-space-sm px-space-md text-center">
<span className="inline-flex items-center gap-1 px-space-xs py-0.5 rounded bg-error text-on-error font-label-sm text-[11px] font-bold">
<span className="material-symbols-outlined text-[12px]">block</span>Blocked
                    </span>
</td>
</tr>
</tbody>
</table>
</div>
</div>

<div className="p-space-md rounded-lg bg-surface-container flex flex-col gap-space-sm">
<div className="flex items-center justify-between">
<div className="flex items-center gap-space-xs text-tertiary">
<span className="material-symbols-outlined text-space-md">psychology</span>
<span className="font-title-md text-title-md font-bold">Smart AI Guardrail Assistant</span>
</div>
<span className="font-label-sm text-label-sm text-secondary">Based on 14 local supplier invoices (last 90 days)</span>
</div>
<p className="font-body-sm text-body-sm text-on-surface">
<strong>Price Alert on Line 3:</strong> 18 Gauge GI Binding Wire quoted rate (₹78/Kg) exceeds contract ceiling of ₹74.16/Kg (+3% ceiling). Average prevailing procurement rate in Kukatpally-Madhapur corridor is <strong>₹71.80 – ₹73.00/Kg</strong>. 
          </p>
<div className="flex items-center gap-space-xs flex-wrap pt-space-xs">
<button className="px-space-md py-space-xs rounded bg-primary text-on-primary hover:bg-primary-container font-label-md text-label-md flex items-center gap-1 transition-colors">
<span className="material-symbols-outlined text-[15px]">price_change</span>
<span>Apply Suggested Rate (₹73.00/Kg)</span>
</button>
<button className="px-space-md py-space-xs rounded bg-surface-container-lowest hover:bg-surface-container-high text-on-surface font-label-md text-label-md flex items-center gap-1 transition-colors">
<span className="material-symbols-outlined text-[15px]">chat</span>
<span>Request Vendor Justification</span>
</button>
<button className="px-space-md py-space-xs rounded bg-secondary-container hover:bg-surface-variant text-on-secondary-fixed font-label-md text-label-md flex items-center gap-1 transition-colors">
<span className="material-symbols-outlined text-[15px]">call_split</span>
<span>Split to Sri Rama Hardware</span>
</button>
</div>
</div>

<div className="flex flex-col sm:flex-row justify-between items-end gap-space-md pt-space-sm bg-surface-container-low p-space-md rounded-lg">
<div className="flex flex-col gap-1 w-full sm:w-auto">
<div className="font-label-sm text-label-sm uppercase tracking-wider text-secondary">Commercial Terms Note</div>
<div className="font-body-sm text-body-sm text-on-surface-variant max-w-sm">
              Freight included up to site unloader. Test certificates (MTC) required prior to vehicle weigh-in. 0.5% moisture tolerance.
            </div>
</div>
<div className="flex flex-col gap-1 text-right min-w-[240px]">
<div className="flex justify-between font-body-sm text-body-sm text-secondary">
<span>Base Subtotal:</span>
<span className="font-tabular-metric-sm text-tabular-metric-sm text-on-surface font-semibold">₹37,28,400.00</span>
</div>
<div className="flex justify-between font-body-sm text-body-sm text-secondary">
<span>GST (18% IGST / CGST):</span>
<span className="font-tabular-metric-sm text-tabular-metric-sm text-on-surface font-semibold">₹6,71,112.00</span>
</div>
<div className="flex justify-between font-body-sm text-body-sm text-primary">
<span>Total Price Guardrail Savings:</span>
<span className="font-tabular-metric-sm text-tabular-metric-sm font-bold">-₹1,38,700.00</span>
</div>
<div className="h-0.5 bg-surface-container-high my-1"></div>
<div className="flex justify-between items-baseline font-title-md text-title-md text-on-surface font-bold">
<span>Net PO Amount:</span>
<span className="font-tabular-metric text-tabular-metric text-primary leading-none">₹43,99,512.00</span>
</div>
</div>
</div>
</div>

<div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col gap-space-sm">
<div className="flex items-center justify-between cursor-pointer">
<div className="flex items-center gap-space-sm">
<span className="material-symbols-outlined text-primary text-space-base">document_scanner</span>
<span className="font-title-md text-title-md text-on-surface font-semibold">Vendor Quotation OCR Verification</span>
<span className="px-space-xs py-space-2xs rounded bg-surface-container text-on-surface-variant font-label-sm text-label-sm">
              OCR Match: 99.4%
            </span>
</div>
<span className="material-symbols-outlined text-secondary text-space-base">expand_more</span>
</div>
<div className="grid grid-cols-1 md:grid-cols-3 gap-space-sm pt-space-xs font-body-sm text-body-sm text-on-surface-variant">
<div className="p-space-sm rounded bg-surface-container-low flex flex-col">
<span className="font-label-sm text-label-sm text-secondary uppercase">Scanned Document</span>
<span className="font-title-md text-title-md text-on-surface">Tirumala_Quote_Q892.pdf</span>
<span className="text-primary font-medium mt-1">Uploaded 42 mins ago</span>
</div>
<div className="p-space-sm rounded bg-surface-container-low flex flex-col">
<span className="font-label-sm text-label-sm text-secondary uppercase">HSN Harmonization</span>
<span className="font-title-md text-title-md text-on-surface">7214 20 90 (Rebar)</span>
<span className="text-secondary mt-1">Verified with Central GST Master</span>
</div>
<div className="p-space-sm rounded bg-surface-container-low flex flex-col">
<span className="font-label-sm text-label-sm text-secondary uppercase">ERP Linkage ID</span>
<span className="font-title-md text-title-md text-on-surface">PR-2026-0992-TWR-C</span>
<span className="text-primary font-medium mt-1">Pre-Budget Allocated</span>
</div>
</div>
</div>
</div>

<div className="lg:col-span-4 flex flex-col gap-space-md">

<div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col gap-space-md">
<div className="flex items-center justify-between pb-space-xs">
<div className="flex items-center gap-space-xs">
<span className="material-symbols-outlined text-primary text-space-base">assignment_turned_in</span>
<span className="font-title-md text-title-md text-on-surface font-bold">Multi-Level Approval Matrix</span>
</div>
<span className="px-space-xs py-space-2xs rounded bg-surface-container text-secondary font-label-sm text-label-sm">
            Stage 3 of 4
          </span>
</div>

<div className="flex flex-col gap-space-md relative pl-space-sm">

<div className="flex gap-space-sm relative">
<div className="flex flex-col items-center">
<div className="w-7 h-7 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-label-sm shadow-sm z-10">
<span className="material-symbols-outlined text-[16px]">check</span>
</div>
<div className="w-0.5 bg-primary flex-1 my-1"></div>
</div>
<div className="flex flex-col pb-space-sm">
<span className="font-title-md text-title-md text-on-surface font-semibold">1. Site Engineer Indent</span>
<span className="font-body-sm text-body-sm text-secondary">Er. Rajesh M. • Tower C Civil</span>
<span className="font-label-sm text-label-sm text-primary font-medium mt-1 flex items-center gap-1">
<span className="material-symbols-outlined text-[13px]">pin_drop</span>Approved • Geo-Fence Tower C (09:42 AM)
              </span>
</div>
</div>

<div className="flex gap-space-sm relative">
<div className="flex flex-col items-center">
<div className="w-7 h-7 rounded-full bg-error text-on-error flex items-center justify-center font-bold text-label-sm shadow-sm z-10">
<span className="material-symbols-outlined text-[16px]">priority_high</span>
</div>
<div className="w-0.5 bg-primary flex-1 my-1"></div>
</div>
<div className="flex flex-col pb-space-sm">
<span className="font-title-md text-title-md text-on-surface font-semibold">2. Automated Guardrail Audit</span>
<span className="font-body-sm text-body-sm text-error font-medium">Rate Exception: Line 3 Flagged</span>
<span className="font-label-sm text-label-sm text-on-surface-variant mt-1">
                Triggered AI Overspend Alert. Overwrite token logged.
              </span>
</div>
</div>

<div className="flex gap-space-sm relative">
<div className="flex flex-col items-center">
<div className="w-7 h-7 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-label-sm shadow-sm z-10">
<span className="material-symbols-outlined text-[16px]">check</span>
</div>
<div className="w-0.5 bg-surface-container flex-1 my-1"></div>
</div>
<div className="flex flex-col pb-space-sm">
<span className="font-title-md text-title-md text-on-surface font-semibold">3. Procurement Lead</span>
<span className="font-body-sm text-body-sm text-secondary">Vikram Sharma • Commercial Head</span>
<span className="font-label-sm text-label-sm text-primary font-medium mt-1">
                Recommended with Condition (10:15 AM)
              </span>
</div>
</div>

<div className="flex gap-space-sm relative">
<div className="flex flex-col items-center">
<div className="w-7 h-7 rounded-full bg-primary-container text-on-primary flex items-center justify-center font-bold text-label-sm ring-4 ring-primary-container/20 shadow-sm z-10 animate-pulse">
                4
              </div>
</div>
<div className="flex flex-col">
<span className="font-title-md text-title-md text-on-surface font-bold">4. VP Civil &amp; Project Director</span>
<span className="font-body-sm text-body-sm text-on-surface font-semibold">Shravan Kumar • Director Authorization</span>
<span className="px-space-xs py-space-2xs rounded bg-surface-variant text-on-surface font-label-sm text-label-sm font-semibold w-fit mt-1">
                Action Required (Awaiting Sign-off)
              </span>
</div>
</div>
</div>

<div className="p-space-md rounded-lg bg-surface-container-low flex flex-col gap-space-xs">
<span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary">Milestone &amp; Release Stage</span>
<div className="font-title-md text-title-md text-on-surface font-bold">Pour 12: Stilt Level Cage Binding</div>
<div className="flex items-center justify-between text-body-sm font-body-sm text-on-surface-variant mt-1">
<span>Advance BG: <strong>20%</strong></span>
<span>Weighbridge Release: <strong>80%</strong></span>
</div>
</div>

<div className="flex flex-col gap-space-sm pt-space-xs">
<div className="flex flex-col gap-1">
<label className="font-label-sm text-label-sm uppercase tracking-wider text-secondary">Director PIN / Override Justification</label>
<input className="w-full px-space-sm py-space-xs rounded bg-surface-container-low text-on-surface font-body-md text-body-md focus:outline-none focus:ring-1 focus:ring-primary" placeholder="Enter 6-digit Safe PIN for Rate Override" type="password" />
</div>
<div className="flex flex-col gap-space-xs pt-space-xs">
<button className="w-full flex items-center justify-center gap-space-xs py-space-sm px-space-md rounded bg-primary text-on-primary hover:bg-primary-container font-title-md text-title-md shadow-sm transition-colors">
<span className="material-symbols-outlined text-space-base">draw</span>
<span>Sign &amp; Release PO (₹43.99L)</span>
</button>
<button className="w-full flex items-center justify-center gap-space-xs py-space-sm px-space-md rounded bg-surface-container hover:bg-surface-container-high text-on-surface font-title-md text-title-md transition-colors">
<span className="material-symbols-outlined text-space-base">rule</span>
<span>Reject with Counter-Offer (₹73/Kg)</span>
</button>
<button className="w-full flex items-center justify-center gap-space-xs py-space-xs px-space-md rounded text-error hover:bg-error-container/30 font-title-md text-title-md transition-colors">
<span className="material-symbols-outlined text-space-base">undo</span>
<span>Send Back to Site Engineer</span>
</button>
</div>
</div>
</div>

<div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col gap-space-sm">
<div className="flex items-center justify-between">
<span className="font-title-md text-title-md text-on-surface font-semibold">Tower C Steel Consumption</span>
<span className="font-label-sm text-label-sm text-primary font-bold">Within Budget</span>
</div>
<div className="flex items-center justify-between font-body-sm text-body-sm text-secondary">
<span>Allocated BoQ: 450 MT</span>
<span>Ordered to date: 310 MT</span>
</div>
<div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
<div className="bg-primary h-full rounded-full" style={{ width: "68.8%" }}></div>
</div>
<div className="font-label-sm text-label-sm text-outline text-right">68.8% Consumed • Balance: 140 MT</div>
</div>
</div>
</div>

<div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col gap-space-md">

<div className="flex flex-col md:flex-row md:items-center justify-between gap-space-sm">
<div className="flex items-center gap-space-xs flex-wrap">
<button className="px-space-md py-space-xs rounded bg-primary text-on-primary font-title-md text-title-md font-semibold">
          All Pending (14)
        </button>
<button className="px-space-md py-space-xs rounded bg-surface-container hover:bg-surface-container-high text-on-surface font-title-md text-title-md transition-colors flex items-center gap-1">
<span>Price Guardrail Exceptions</span>
<span className="px-1.5 py-0.2 rounded-full bg-error text-on-error font-label-sm text-[10px] font-bold">3</span>
</button>
<button className="px-space-md py-space-xs rounded bg-surface-container hover:bg-surface-container-high text-on-surface font-title-md text-title-md transition-colors">
          Ready for Release (6)
        </button>
<button className="px-space-md py-space-xs rounded bg-surface-container hover:bg-surface-container-high text-on-surface font-title-md text-title-md transition-colors">
          Fulfilled / Live (42)
        </button>
</div>
<div className="flex items-center gap-space-sm">
<div className="relative flex items-center">
<span className="material-symbols-outlined absolute left-space-xs text-secondary text-space-base">search</span>
<input className="pl-8 pr-space-sm py-1.5 rounded bg-surface-container-low text-on-surface placeholder:text-outline font-body-sm text-body-sm focus:outline-none focus:ring-1 focus:ring-primary w-64" placeholder="Filter POs, Vendors, Materials..." type="text" />
</div>
<button className="p-1.5 rounded bg-surface-container hover:bg-surface-container-high text-on-surface transition-colors">
<span className="material-symbols-outlined text-space-base">filter_list</span>
</button>
</div>
</div>

<div className="overflow-x-auto rounded-lg">
<table className="w-full text-left border-collapse">
<thead>
<tr className="bg-surface-container text-on-surface font-label-md text-label-md uppercase tracking-wider">
<th className="py-space-sm px-space-md">PO Reference &amp; Date</th>
<th className="py-space-sm px-space-sm">Vendor Name</th>
<th className="py-space-sm px-space-sm">Category / Trade</th>
<th className="py-space-sm px-space-sm text-right">Total (₹)</th>
<th className="py-space-sm px-space-sm text-center">Price Variance Check</th>
<th className="py-space-sm px-space-sm">Approval Level</th>
<th className="py-space-sm px-space-md text-right">Quick Action</th>
</tr>
</thead>
<tbody className="divide-y-0 text-on-surface font-body-sm text-body-sm">

<tr className="bg-primary/5 hover:bg-primary/10 transition-colors">
<td className="py-space-sm px-space-md">
<div className="font-title-md text-title-md text-on-surface font-bold">PO-HYD-CE2-2026-084</div>
<div className="font-body-sm text-body-sm text-secondary">Today, 09:42 AM</div>
</td>
<td className="py-space-sm px-space-sm">
<div className="font-title-md text-title-md text-on-surface">Tirumala Steel &amp; Infra</div>
<span className="font-label-sm text-label-sm text-primary font-semibold">Tier-1 Preferred</span>
</td>
<td className="py-space-sm px-space-sm font-body-sm text-body-sm">TMT Rebar &amp; Binding Wire</td>
<td className="py-space-sm px-space-sm text-right font-tabular-metric-sm text-tabular-metric-sm font-bold">₹43,99,512</td>
<td className="py-space-sm px-space-sm text-center">
<span className="px-space-xs py-0.5 rounded bg-error text-on-error font-label-sm text-label-sm font-bold">
                +8.33% (1 Line Blocked)
              </span>
</td>
<td className="py-space-sm px-space-sm">
<div className="flex items-center gap-1 font-body-sm text-body-sm text-error font-semibold">
<span className="h-2 w-2 rounded-full bg-error"></span>
<span>L4: VP Civil (Pending)</span>
</div>
</td>
<td className="py-space-sm px-space-md text-right">
<button className="px-space-sm py-1 rounded bg-primary text-on-primary hover:bg-primary-container font-label-md text-label-md font-medium transition-colors">
                Inspect Active
              </button>
</td>
</tr>

<tr className="hover:bg-surface-container-low transition-colors">
<td className="py-space-sm px-space-md">
<div className="font-title-md text-title-md text-on-surface">PO-HYD-CE2-2026-083</div>
<div className="font-body-sm text-body-sm text-secondary">Yesterday, 16:20 PM</div>
</td>
<td className="py-space-sm px-space-sm">
<div className="font-title-md text-title-md text-on-surface">Ultratech Ready-Mix Plant</div>
<span className="font-label-sm text-label-sm text-secondary">Contract Locked</span>
</td>
<td className="py-space-sm px-space-sm font-body-sm text-body-sm">M40 Grade RMC (180 Cum)</td>
<td className="py-space-sm px-space-sm text-right font-tabular-metric-sm text-tabular-metric-sm font-bold">₹9,82,400</td>
<td className="py-space-sm px-space-sm text-center">
<span className="px-space-xs py-0.5 rounded bg-primary text-on-primary font-label-sm text-label-sm font-semibold">
                -1.20% (Passed)
              </span>
</td>
<td className="py-space-sm px-space-sm">
<div className="flex items-center gap-1 font-body-sm text-body-sm text-primary font-medium">
<span className="h-2 w-2 rounded-full bg-primary"></span>
<span>Approved • Release Queue</span>
</div>
</td>
<td className="py-space-sm px-space-md text-right">
<button className="px-space-sm py-1 rounded bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md transition-colors">
                Release PO
              </button>
</td>
</tr>

<tr className="hover:bg-surface-container-low transition-colors">
<td className="py-space-sm px-space-md">
<div className="font-title-md text-title-md text-on-surface">PO-HYD-CE2-2026-082</div>
<div className="font-body-sm text-body-sm text-secondary">18 Mar, 11:15 AM</div>
</td>
<td className="py-space-sm px-space-sm">
<div className="font-title-md text-title-md text-on-surface">Sri Lakshmi Electricals</div>
<span className="font-label-sm text-label-sm text-secondary">Tier-2 Supplier</span>
</td>
<td className="py-space-sm px-space-sm font-body-sm text-body-sm">Conduits &amp; Embedded J-Boxes</td>
<td className="py-space-sm px-space-sm text-right font-tabular-metric-sm text-tabular-metric-sm font-bold">₹3,45,600</td>
<td className="py-space-sm px-space-sm text-center">
<span className="px-space-xs py-0.5 rounded bg-error text-on-error font-label-sm text-label-sm font-bold">
                +4.20% (Blocked)
              </span>
</td>
<td className="py-space-sm px-space-sm">
<div className="flex items-center gap-1 font-body-sm text-body-sm text-secondary">
<span className="h-2 w-2 rounded-full bg-error"></span>
<span>L3: Procurement Lead</span>
</div>
</td>
<td className="py-space-sm px-space-md text-right">
<button className="px-space-sm py-1 rounded bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md transition-colors">
                Review Rate
              </button>
</td>
</tr>

<tr className="hover:bg-surface-container-low transition-colors">
<td className="py-space-sm px-space-md">
<div className="font-title-md text-title-md text-on-surface">PO-HYD-CE2-2026-081</div>
<div className="font-body-sm text-body-sm text-secondary">17 Mar, 14:05 PM</div>
</td>
<td className="py-space-sm px-space-sm">
<div className="font-title-md text-title-md text-on-surface">Godrej &amp; Boyce Plywoods</div>
<span className="font-label-sm text-label-sm text-primary font-semibold">Tier-1 OEM</span>
</td>
<td className="py-space-sm px-space-sm font-body-sm text-body-sm">Film-Faced Shuttering Ply 12mm</td>
<td className="py-space-sm px-space-sm text-right font-tabular-metric-sm text-tabular-metric-sm font-bold">₹12,40,000</td>
<td className="py-space-sm px-space-sm text-center">
<span className="px-space-xs py-0.5 rounded bg-primary text-on-primary font-label-sm text-label-sm font-semibold">
                -0.85% (Passed)
              </span>
</td>
<td className="py-space-sm px-space-sm">
<div className="flex items-center gap-1 font-body-sm text-body-sm text-primary font-medium">
<span className="h-2 w-2 rounded-full bg-primary"></span>
<span>Released • Dispatched</span>
</div>
</td>
<td className="py-space-sm px-space-md text-right">
<button className="px-space-sm py-1 rounded bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md transition-colors">
                Track Gate Pass
              </button>
</td>
</tr>
</tbody>
</table>
</div>

<div className="flex flex-col sm:flex-row items-center justify-between gap-space-sm text-body-sm font-body-sm text-secondary pt-space-xs">
<div>Showing 1 to 4 of 14 Pending Purchase Orders • Auto-refreshed via Kafka Broker</div>
<div className="flex items-center gap-space-xs">
<button className="px-space-sm py-1 rounded bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md">Previous</button>
<span className="px-space-sm py-1 rounded bg-primary text-on-primary font-label-md text-label-md font-bold">1</span>
<button className="px-space-sm py-1 rounded bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md">2</button>
<button className="px-space-sm py-1 rounded bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md">Next</button>
</div>
</div>
</div>
</div></main></div>
    </div>
  );
}
