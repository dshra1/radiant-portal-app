import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/po-create")({
  head: () => ({
    meta: [
      { title: "Smart Purchase Order Creation Engine | Saha OS" },
      { name: "description", content: "Value-engineered PO drafting with BIS spec verification and brand alternatives." },
      { property: "og:title", content: "Smart Purchase Order Creation Engine | Saha OS" },
      { property: "og:description", content: "Value-engineered PO drafting with BIS spec verification and brand alternatives." },
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

<div className="flex flex-col bg-surface-container-lowest p-space-lg rounded shadow-sm gap-space-md">

<div className="flex flex-wrap items-center justify-between gap-space-sm">
<div className="flex items-center gap-space-xs text-on-surface-variant font-label-sm text-label-sm">
<span className="hover:text-primary cursor-pointer transition-colors">Projects</span>
<span className="material-symbols-outlined text-space-sm leading-none">chevron_right</span>
<span className="hover:text-primary cursor-pointer transition-colors">Cyber Enclave - Phase 2</span>
<span className="material-symbols-outlined text-space-sm leading-none">chevron_right</span>
<span className="hover:text-primary cursor-pointer transition-colors">Procurement &amp; Supply Chain</span>
<span className="material-symbols-outlined text-space-sm leading-none">chevron_right</span>
<span className="text-on-surface font-title-md text-title-md">PO Creation Engine</span>
</div>
<div className="flex items-center gap-space-xs px-space-sm py-space-2xs bg-primary/10 text-primary rounded font-label-sm text-label-sm font-medium">
<span className="material-symbols-outlined text-space-sm leading-none">sync</span>
<span>AI Guardrails &amp; Mandi Sync Active • Spot Index: Madhapur H-4</span>
</div>
</div>

<div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md">
<div>
<div className="flex items-center gap-space-sm">
<span className="font-headline-lg text-headline-lg font-bold text-on-surface tracking-tight">Smart Purchase Order Creation — Value Engineering &amp; Brand Alternative Integration</span>
<span className="px-space-xs py-space-2xs rounded bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wide">PO-DRAFT-HYD-8842</span>
</div>
<p className="font-body-md text-body-md text-on-surface-variant mt-space-2xs">
          Binding purchase contract generation with real-time BIS/NABL spec verification and algorithmic BOQ baseline reconciliation.
        </p>
</div>
<div className="flex items-center gap-space-sm self-start lg:self-auto shrink-0">
<button className="flex items-center gap-space-xs px-space-md py-space-xs rounded bg-surface-container text-on-surface hover:bg-surface-container-high font-title-md text-title-md transition-colors">
<span className="material-symbols-outlined text-space-base leading-none">compare_arrows</span>
<span>Diff Against Baseline BOQ</span>
</button>
<button className="flex items-center gap-space-xs px-space-md py-space-xs rounded bg-surface-container text-on-surface hover:bg-surface-container-high font-title-md text-title-md transition-colors">
<span className="material-symbols-outlined text-space-base leading-none">history</span>
<span>Version 3.2</span>
</button>
</div>
</div>

<div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-space-sm pt-space-xs">

<div className="flex flex-col p-space-sm rounded bg-surface-container-low">
<div className="flex items-center justify-between">
<span className="font-label-sm text-label-sm uppercase text-on-surface-variant tracking-wider">Total PO Draft Value</span>
<span className="material-symbols-outlined text-space-base text-on-surface-variant leading-none">request_quote</span>
</div>
<div className="flex items-baseline gap-space-xs mt-space-2xs">
<span className="font-tabular-metric text-tabular-metric text-on-surface">₹38,42,800</span>
</div>
<div className="flex items-center gap-space-2xs mt-space-2xs text-on-surface-variant font-body-sm text-body-sm">
<span>Orig:</span>
<span className="line-through">₹44,18,000</span>
<span className="text-primary font-label-sm text-label-sm font-semibold ml-space-2xs">Landed Net</span>
</div>
</div>

<div className="flex flex-col p-space-sm rounded bg-primary/5">
<div className="flex items-center justify-between">
<span className="font-label-sm text-label-sm uppercase text-primary font-semibold tracking-wider">Direct VE Savings Locked</span>
<span className="material-symbols-outlined text-space-base text-primary leading-none">trending_down</span>
</div>
<div className="flex items-baseline gap-space-xs mt-space-2xs">
<span className="font-tabular-metric text-tabular-metric text-primary">₹5,75,200</span>
<span className="px-space-xs py-space-2xs rounded bg-primary text-on-primary font-label-sm text-label-sm font-bold">-13.0%</span>
</div>
<span className="font-body-sm text-body-sm text-on-surface-variant mt-space-2xs">Reallocated to Contingency</span>
</div>

<div className="flex flex-col p-space-sm rounded bg-surface-container-low">
<div className="flex items-center justify-between">
<span className="font-label-sm text-label-sm uppercase text-on-surface-variant tracking-wider">Substituted Brand Items</span>
<span className="material-symbols-outlined text-space-base text-on-surface-variant leading-none">alt_route</span>
</div>
<div className="flex items-baseline gap-space-xs mt-space-2xs">
<span className="font-tabular-metric text-tabular-metric text-on-surface">6 <span className="font-headline-sm text-headline-sm font-normal text-on-surface-variant">of 18 lines</span></span>
</div>
<div className="w-full bg-surface-container-high h-1.5 rounded-full mt-space-xs overflow-hidden">
<div className="bg-primary h-full rounded-full" style={{ width: "33.3%" }}></div>
</div>
</div>

<div className="flex flex-col p-space-sm rounded bg-surface-container-low">
<div className="flex items-center justify-between">
<span className="font-label-sm text-label-sm uppercase text-on-surface-variant tracking-wider">IS Code &amp; Spec Lock</span>
<span className="material-symbols-outlined text-space-base text-primary leading-none">verified</span>
</div>
<div className="flex items-baseline gap-space-xs mt-space-2xs">
<span className="font-tabular-metric text-tabular-metric text-primary">100% Certified</span>
</div>
<span className="font-body-sm text-body-sm text-on-surface-variant mt-space-2xs">BIS • NABL Lab Validated</span>
</div>

<div className="flex flex-col p-space-sm rounded bg-surface-container-low">
<div className="flex items-center justify-between">
<span className="font-label-sm text-label-sm uppercase text-on-surface-variant tracking-wider">Primary Vendor</span>
<span className="material-symbols-outlined text-space-base text-on-surface-variant leading-none">storefront</span>
</div>
<div className="truncate font-title-md text-title-md text-on-surface mt-space-2xs" title="Sri Balaji Electricals & Distribution">
          Sri Balaji Electricals
        </div>
<span className="font-body-sm text-body-sm text-on-surface-variant truncate">Sanathnagar, HYD • L1 Bid</span>
</div>
</div>
</div>

<div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">

<div className="lg:col-span-8 flex flex-col gap-space-md">

<div className="flex flex-col bg-surface-container-lowest rounded shadow-sm overflow-hidden">

<div className="p-space-base bg-surface-container-lowest flex flex-wrap items-center justify-between gap-space-sm">
<div className="flex items-center gap-space-sm">
<div className="p-space-xs bg-primary/10 text-primary rounded">
<span className="material-symbols-outlined text-space-md leading-none">fact_check</span>
</div>
<div className="flex flex-col">
<span className="font-headline-sm text-headline-sm text-on-surface">Procurement Line Items &amp; VE Substitutions</span>
<span className="font-body-sm text-body-sm text-on-surface-variant">Validated against MEP Stage 04 Bill of Quantities</span>
</div>
</div>

<div className="flex items-center gap-space-xs">
<div className="flex items-center px-space-xs py-space-2xs rounded bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm">
<span className="px-space-xs py-space-2xs rounded bg-surface-container-lowest text-on-surface font-semibold shadow-xs">All (18)</span>
<span className="px-space-xs py-space-2xs rounded hover:text-on-surface cursor-pointer">VE Substituted (6)</span>
<span className="px-space-xs py-space-2xs rounded hover:text-on-surface cursor-pointer">Original Spec (12)</span>
</div>
<button className="p-space-xs rounded hover:bg-surface-container-low text-on-surface-variant" title="Download Excel Sheet">
<span className="material-symbols-outlined text-space-base leading-none">download</span>
</button>
</div>
</div>

<div className="overflow-x-auto">
<table className="w-full text-left border-collapse">
<thead>
<tr className="bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider">
<th className="py-space-sm px-space-base">Item &amp; Category</th>
<th className="py-space-sm px-space-base">BOQ Spec (Base)</th>
<th className="py-space-sm px-space-base">PO Spec (Substituted)</th>
<th className="py-space-sm px-space-base text-right">Order Qty</th>
<th className="py-space-sm px-space-base text-right">Negotiated Rate</th>
<th className="py-space-sm px-space-base text-right">PO Total</th>
<th className="py-space-sm px-space-base text-center">IS Spec / Status</th>
<th className="py-space-sm px-space-base text-center">Actions</th>
</tr>
</thead>
<tbody className="divide-y-0 text-on-surface font-body-sm text-body-sm">

<tr className="hover:bg-surface-container-low/50 transition-colors">
<td className="py-space-sm px-space-base">
<div className="flex flex-col">
<span className="font-title-md text-title-md text-on-surface">Modular Sockets 16A</span>
<span className="text-on-surface-variant font-label-sm text-label-sm">Electrical • Tower A &amp; B</span>
</div>
</td>
<td className="py-space-sm px-space-base text-on-surface-variant">
<div className="flex flex-col">
<span className="line-through">Legrand Myrius</span>
<span className="font-tabular-metric-sm text-tabular-metric-sm">₹250 / NOS</span>
</div>
</td>
<td className="py-space-sm px-space-base">
<div className="flex flex-col">
<div className="flex items-center gap-space-2xs">
<span className="font-title-md text-title-md text-primary">Anchor Roma 16A</span>
<span className="px-space-2xs py-0.5 rounded bg-primary/10 text-primary font-label-sm text-label-sm font-semibold">VE Best</span>
</div>
<span className="font-body-sm text-body-sm text-on-surface-variant">Polycarbonate UV Grade</span>
</div>
</td>
<td className="py-space-sm px-space-base text-right font-tabular-metric-sm text-tabular-metric-sm text-on-surface">
                  600 NOS
                </td>
<td className="py-space-sm px-space-base text-right">
<span className="font-tabular-metric-sm text-tabular-metric-sm text-on-surface">₹200</span>
<span className="block text-primary font-label-sm text-label-sm">-20.0%</span>
</td>
<td className="py-space-sm px-space-base text-right font-tabular-metric text-tabular-metric text-on-surface">
                  ₹1,20,000
                </td>
<td className="py-space-sm px-space-base text-center">
<div className="flex flex-col items-center">
<span className="px-space-xs py-space-2xs rounded bg-surface-container text-on-surface font-label-sm text-label-sm font-medium">IS 1293:2019</span>
<span className="text-primary font-label-sm text-label-sm font-semibold flex items-center gap-space-2xs mt-0.5">
<span className="material-symbols-outlined text-space-xs leading-none">check_circle</span> NABL OK
                    </span>
</div>
</td>
<td className="py-space-sm px-space-base text-center">
<div className="flex items-center justify-center gap-space-2xs">
<button className="p-space-2xs rounded hover:bg-surface-container text-on-surface-variant" title="View Technical Data Sheet">
<span className="material-symbols-outlined text-space-base leading-none">description</span>
</button>
<button className="p-space-2xs rounded hover:bg-surface-container text-on-surface-variant" title="Revert to Original Spec">
<span className="material-symbols-outlined text-space-base leading-none">undo</span>
</button>
</div>
</td>
</tr>

<tr className="hover:bg-surface-container-low/50 transition-colors bg-surface-container-low/20">
<td className="py-space-sm px-space-base">
<div className="flex flex-col">
<span className="font-title-md text-title-md text-on-surface">PVC Conduits 25mm Heavy</span>
<span className="text-on-surface-variant font-label-sm text-label-sm">Electrical • Slab Casting</span>
</div>
</td>
<td className="py-space-sm px-space-base text-on-surface-variant">
<div className="flex flex-col">
<span className="line-through">Precision FRLS</span>
<span className="font-tabular-metric-sm text-tabular-metric-sm">₹20 / RFT</span>
</div>
</td>
<td className="py-space-sm px-space-base">
<div className="flex flex-col">
<div className="flex items-center gap-space-2xs">
<span className="font-title-md text-title-md text-primary">Sudhakar ISI Heavy</span>
<span className="px-space-2xs py-0.5 rounded bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm">Regional</span>
</div>
<span className="font-body-sm text-body-sm text-on-surface-variant">Flame Retardant Grade B</span>
</div>
</td>
<td className="py-space-sm px-space-base text-right font-tabular-metric-sm text-tabular-metric-sm text-on-surface">
                  42,000 RFT
                </td>
<td className="py-space-sm px-space-base text-right">
<span className="font-tabular-metric-sm text-tabular-metric-sm text-on-surface">₹13</span>
<span className="block text-primary font-label-sm text-label-sm">-35.0%</span>
</td>
<td className="py-space-sm px-space-base text-right font-tabular-metric text-tabular-metric text-on-surface">
                  ₹5,46,000
                </td>
<td className="py-space-sm px-space-base text-center">
<div className="flex flex-col items-center">
<span className="px-space-xs py-space-2xs rounded bg-surface-container text-on-surface font-label-sm text-label-sm font-medium">IS 9537-3</span>
<span className="text-primary font-label-sm text-label-sm font-semibold flex items-center gap-space-2xs mt-0.5">
<span className="material-symbols-outlined text-space-xs leading-none">check_circle</span> Lab Passed
                    </span>
</div>
</td>
<td className="py-space-sm px-space-base text-center">
<div className="flex items-center justify-center gap-space-2xs">
<button className="p-space-2xs rounded hover:bg-surface-container text-on-surface-variant" title="View Technical Data Sheet">
<span className="material-symbols-outlined text-space-base leading-none">description</span>
</button>
<button className="p-space-2xs rounded hover:bg-surface-container text-on-surface-variant" title="Revert to Original Spec">
<span className="material-symbols-outlined text-space-base leading-none">undo</span>
</button>
</div>
</td>
</tr>

<tr className="hover:bg-surface-container-low/50 transition-colors">
<td className="py-space-sm px-space-base">
<div className="flex flex-col">
<span className="font-title-md text-title-md text-on-surface">FRLS Copper Wire 2.5 mm²</span>
<span className="text-on-surface-variant font-label-sm text-label-sm">Electrical Wiring • Power Circuit</span>
</div>
</td>
<td className="py-space-sm px-space-base text-on-surface-variant">
<div className="flex flex-col">
<span className="line-through">Finolex FRLS-H</span>
<span className="font-tabular-metric-sm text-tabular-metric-sm">₹29 / RFT</span>
</div>
</td>
<td className="py-space-sm px-space-base">
<div className="flex flex-col">
<div className="flex items-center gap-space-2xs">
<span className="font-title-md text-title-md text-primary">Polycab Green Wire</span>
<span className="px-space-2xs py-0.5 rounded bg-primary/10 text-primary font-label-sm text-label-sm font-semibold">Equivalent</span>
</div>
<span className="font-body-sm text-body-sm text-on-surface-variant">Class 5 Annealed Copper</span>
</div>
</td>
<td className="py-space-sm px-space-base text-right font-tabular-metric-sm text-tabular-metric-sm text-on-surface">
                  1,02,000 RFT
                </td>
<td className="py-space-sm px-space-base text-right">
<span className="font-tabular-metric-sm text-tabular-metric-sm text-on-surface">₹25</span>
<span className="block text-primary font-label-sm text-label-sm">-13.8%</span>
</td>
<td className="py-space-sm px-space-base text-right font-tabular-metric text-tabular-metric text-on-surface">
                  ₹25,50,000
                </td>
<td className="py-space-sm px-space-base text-center">
<div className="flex flex-col items-center">
<span className="px-space-xs py-space-2xs rounded bg-surface-container text-on-surface font-label-sm text-label-sm font-medium">IS 694:2010</span>
<span className="text-primary font-label-sm text-label-sm font-semibold flex items-center gap-space-2xs mt-0.5">
<span className="material-symbols-outlined text-space-xs leading-none">check_circle</span> NABL OK
                    </span>
</div>
</td>
<td className="py-space-sm px-space-base text-center">
<div className="flex items-center justify-center gap-space-2xs">
<button className="p-space-2xs rounded hover:bg-surface-container text-on-surface-variant" title="View Technical Data Sheet">
<span className="material-symbols-outlined text-space-base leading-none">description</span>
</button>
<button className="p-space-2xs rounded hover:bg-surface-container text-on-surface-variant" title="Revert to Original Spec">
<span className="material-symbols-outlined text-space-base leading-none">undo</span>
</button>
</div>
</td>
</tr>

<tr className="hover:bg-surface-container-low/50 transition-colors bg-surface-container-low/20">
<td className="py-space-sm px-space-base">
<div className="flex flex-col">
<span className="font-title-md text-title-md text-on-surface">TMT Fe500D 12mm Rebar</span>
<span className="text-on-surface-variant font-label-sm text-label-sm">Civil • Secondary Distribution</span>
</div>
</td>
<td className="py-space-sm px-space-base text-on-surface-variant">
<div className="flex flex-col">
<span className="line-through">Tata Tiscon Fe500D</span>
<span className="font-tabular-metric-sm text-tabular-metric-sm">₹61,200 / MT</span>
</div>
</td>
<td className="py-space-sm px-space-base">
<div className="flex flex-col">
<div className="flex items-center gap-space-2xs">
<span className="font-title-md text-title-md text-primary">Jairaj Fe500D</span>
<span className="px-space-2xs py-0.5 rounded bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm">Local Primary</span>
</div>
<span className="font-body-sm text-body-sm text-on-surface-variant">Approved for Non-Critical Beams</span>
</div>
</td>
<td className="py-space-sm px-space-base text-right font-tabular-metric-sm text-tabular-metric-sm text-on-surface">
                  28 MT
                </td>
<td className="py-space-sm px-space-base text-right">
<span className="font-tabular-metric-sm text-tabular-metric-sm text-on-surface">₹51,800</span>
<span className="block text-primary font-label-sm text-label-sm">-15.3%</span>
</td>
<td className="py-space-sm px-space-base text-right font-tabular-metric text-tabular-metric text-on-surface">
                  ₹14,50,400
                </td>
<td className="py-space-sm px-space-base text-center">
<div className="flex flex-col items-center">
<span className="px-space-xs py-space-2xs rounded bg-surface-container text-on-surface font-label-sm text-label-sm font-medium">IS 1786:2008</span>
<span className="text-primary font-label-sm text-label-sm font-semibold flex items-center gap-space-2xs mt-0.5">
<span className="material-symbols-outlined text-space-xs leading-none">check_circle</span> UTS/YS Cert
                    </span>
</div>
</td>
<td className="py-space-sm px-space-base text-center">
<div className="flex items-center justify-center gap-space-2xs">
<button className="p-space-2xs rounded hover:bg-surface-container text-on-surface-variant" title="View Technical Data Sheet">
<span className="material-symbols-outlined text-space-base leading-none">description</span>
</button>
<button className="p-space-2xs rounded hover:bg-surface-container text-on-surface-variant" title="Revert to Original Spec">
<span className="material-symbols-outlined text-space-base leading-none">undo</span>
</button>
</div>
</td>
</tr>

<tr className="hover:bg-surface-container-low/50 transition-colors">
<td className="py-space-sm px-space-base">
<div className="flex flex-col">
<span className="font-title-md text-title-md text-on-surface">GVT Glazed Tiles 600x1200</span>
<span className="text-on-surface-variant font-label-sm text-label-sm">Finishing • Typical Floor Lobbies</span>
</div>
</td>
<td className="py-space-sm px-space-base text-on-surface-variant">
<div className="flex flex-col">
<span className="line-through">Kajaria Eternity</span>
<span className="font-tabular-metric-sm text-tabular-metric-sm">₹62.50 / SFT</span>
</div>
</td>
<td className="py-space-sm px-space-base">
<div className="flex flex-col">
<div className="flex items-center gap-space-2xs">
<span className="font-title-md text-title-md text-primary">Simpolo Marvel Series</span>
<span className="px-space-2xs py-0.5 rounded bg-primary/10 text-primary font-label-sm text-label-sm font-semibold">Tier 1 Matched</span>
</div>
<span className="font-body-sm text-body-sm text-on-surface-variant">Stain Resistant Group 5</span>
</div>
</td>
<td className="py-space-sm px-space-base text-right font-tabular-metric-sm text-tabular-metric-sm text-on-surface">
                  14,000 SFT
                </td>
<td className="py-space-sm px-space-base text-right">
<span className="font-tabular-metric-sm text-tabular-metric-sm text-on-surface">₹59.00</span>
<span className="block text-primary font-label-sm text-label-sm">-5.6%</span>
</td>
<td className="py-space-sm px-space-base text-right font-tabular-metric text-tabular-metric text-on-surface">
                  ₹8,26,000
                </td>
<td className="py-space-sm px-space-base text-center">
<div className="flex flex-col items-center">
<span className="px-space-xs py-space-2xs rounded bg-surface-container text-on-surface font-label-sm text-label-sm font-medium">IS 15622:2017</span>
<span className="text-primary font-label-sm text-label-sm font-semibold flex items-center gap-space-2xs mt-0.5">
<span className="material-symbols-outlined text-space-xs leading-none">check_circle</span> MOR Pass
                    </span>
</div>
</td>
<td className="py-space-sm px-space-base text-center">
<div className="flex items-center justify-center gap-space-2xs">
<button className="p-space-2xs rounded hover:bg-surface-container text-on-surface-variant" title="View Technical Data Sheet">
<span className="material-symbols-outlined text-space-base leading-none">description</span>
</button>
<button className="p-space-2xs rounded hover:bg-surface-container text-on-surface-variant" title="Revert to Original Spec">
<span className="material-symbols-outlined text-space-base leading-none">undo</span>
</button>
</div>
</td>
</tr>
</tbody>
</table>
</div>

<div className="p-space-sm bg-surface-container-low flex flex-col sm:flex-row items-center justify-between text-on-surface-variant font-label-sm text-label-sm gap-space-sm">
<div className="flex items-center gap-space-xs">
<span className="material-symbols-outlined text-primary text-space-base leading-none">gavel</span>
<span>All 6 VE substitutions are architect-reviewed and verified to maintain zero impact on structural durability and 10-year warranty covenants.</span>
</div>
<button className="text-primary hover:underline font-title-md text-title-md shrink-0">
            Export VE Audit Dossier (.PDF)
          </button>
</div>
</div>

<div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">

<div className="flex flex-col p-space-base rounded bg-surface-container-lowest shadow-sm gap-space-sm">
<div className="flex items-center justify-between">
<span className="font-headline-sm text-headline-sm text-on-surface">Material Physical Testing Log</span>
<span className="px-space-xs py-space-2xs rounded bg-primary/10 text-primary font-label-sm text-label-sm font-bold">4 of 4 Batches Passed</span>
</div>
<div className="flex flex-col gap-space-xs mt-space-2xs">
<div className="flex items-center justify-between p-space-xs rounded bg-surface-container-low">
<div className="flex items-center gap-space-xs">
<span className="material-symbols-outlined text-primary text-space-base leading-none">check_box</span>
<span className="font-title-md text-title-md text-on-surface">Jairaj Fe500D Tensile Stress</span>
</div>
<span className="font-tabular-metric-sm text-tabular-metric-sm text-primary">545 N/mm² (Min 500)</span>
</div>
<div className="flex items-center justify-between p-space-xs rounded bg-surface-container-low">
<div className="flex items-center gap-space-xs">
<span className="material-symbols-outlined text-primary text-space-base leading-none">check_box</span>
<span className="font-title-md text-title-md text-on-surface">Sudhakar Conduit Impact Strength</span>
</div>
<span className="font-tabular-metric-sm text-tabular-metric-sm text-primary">Heavy Class OK</span>
</div>
<div className="flex items-center justify-between p-space-xs rounded bg-surface-container-low">
<div className="flex items-center gap-space-xs">
<span className="material-symbols-outlined text-primary text-space-base leading-none">check_box</span>
<span className="font-title-md text-title-md text-on-surface">Polycab FRLS Oxygen Index</span>
</div>
<span className="font-tabular-metric-sm text-tabular-metric-sm text-primary">31.4% (Min 29%)</span>
</div>
</div>
<div className="mt-space-2xs flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm">
<span>External NABL Lab: Vimta Labs Hyderabad</span>
<span className="text-primary cursor-pointer hover:underline">View Test Certificates #9822</span>
</div>
</div>

<div className="flex flex-col p-space-base rounded bg-surface-container-lowest shadow-sm gap-space-sm">
<div className="flex items-center justify-between">
<span className="font-headline-sm text-headline-sm text-on-surface">Hyd Wholesale Mandi Benchmark</span>
<span className="px-space-xs py-space-2xs rounded bg-surface-container-high text-on-surface font-label-sm text-label-sm">Weekly Spot Avg</span>
</div>
<p className="font-body-sm text-body-sm text-on-surface-variant">
            Negotiated bundle price is ₹5,75,200 below benchmark spot quotes across Sanathnagar &amp; Ranigunj market yards.
          </p>

<div className="h-28 w-full flex items-end gap-space-xs pt-space-xs">
<div className="flex-1 flex flex-col items-center gap-space-2xs h-full justify-end">
<div className="w-full bg-surface-container-high rounded-t" style={{ height: "85%" }}></div>
<span className="font-label-sm text-label-sm text-on-surface-variant">Mandi Avg</span>
</div>
<div className="flex-1 flex flex-col items-center gap-space-2xs h-full justify-end">
<div className="w-full bg-error/20 rounded-t" style={{ height: "100%" }}></div>
<span className="font-label-sm text-label-sm text-on-surface-variant">BOQ Orig</span>
</div>
<div className="flex-1 flex flex-col items-center gap-space-2xs h-full justify-end">
<div className="w-full bg-primary rounded-t" style={{ height: "68%" }}></div>
<span className="font-label-sm text-label-sm text-primary font-bold">This PO Draft</span>
</div>
</div>
<div className="flex items-center justify-between font-label-sm text-label-sm text-on-surface-variant mt-space-2xs">
<span>Mandi Base: ₹40,12,000</span>
<span className="text-primary font-bold">PO Delta: -₹1,69,200 vs Mandi</span>
</div>
</div>
</div>
</div>

<div className="lg:col-span-4 flex flex-col gap-space-md">

<div className="flex flex-col p-space-base rounded bg-surface-container-lowest shadow-sm gap-space-md">
<div className="flex items-start justify-between">
<div className="flex items-center gap-space-sm">
<div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center text-primary font-bold">
              SB
            </div>
<div className="flex flex-col">
<span className="font-headline-sm text-headline-sm text-on-surface leading-tight">Sri Balaji Electricals</span>
<span className="font-label-sm text-label-sm text-on-surface-variant">GSTIN: 36AAACS1234F1Z5 • Reg. L1</span>
</div>
</div>
<span className="px-space-xs py-space-2xs rounded bg-primary text-on-primary font-label-sm text-label-sm font-semibold">Verified Vendor</span>
</div>
<div className="divide-y-0 flex flex-col gap-space-sm pt-space-xs">

<div className="flex flex-col p-space-sm rounded bg-surface-container-low gap-space-2xs">
<div className="flex items-center justify-between">
<span className="font-label-sm text-label-sm uppercase text-on-surface-variant tracking-wider font-semibold">Delivery Schedule</span>
<span className="font-label-sm text-label-sm text-primary font-bold">2-Stage Call-Off</span>
</div>
<p className="font-body-sm text-body-sm text-on-surface">
              • <strong className="text-on-surface">Stage 1 (40%):</strong> Immediate dispatch within 48h to Madhapur Site Yard.<br />
              • <strong className="text-on-surface">Stage 2 (60%):</strong> Balance triggered upon Slab 06 casting sign-off.
            </p>
</div>

<div className="flex flex-col p-space-sm rounded bg-surface-container-low gap-space-2xs">
<div className="flex items-center justify-between">
<span className="font-label-sm text-label-sm uppercase text-on-surface-variant tracking-wider font-semibold">Payment Milestones</span>
<span className="material-symbols-outlined text-space-sm text-on-surface-variant leading-none">account_balance_wallet</span>
</div>
<div className="grid grid-cols-3 gap-space-xs mt-space-2xs text-center font-body-sm text-body-sm">
<div className="p-space-xs bg-surface-container-lowest rounded">
<span className="font-bold text-on-surface">30%</span>
<span className="block font-label-sm text-label-sm text-on-surface-variant">PO Issuance</span>
</div>
<div className="p-space-xs bg-surface-container-lowest rounded">
<span className="font-bold text-on-surface">60%</span>
<span className="block font-label-sm text-label-sm text-on-surface-variant">Site GRN Check</span>
</div>
<div className="p-space-xs bg-surface-container-lowest rounded">
<span className="font-bold text-on-surface">10%</span>
<span className="block font-label-sm text-label-sm text-on-surface-variant">30d Retention</span>
</div>
</div>
</div>

<div className="flex items-center justify-between px-space-xs text-on-surface-variant font-label-sm text-label-sm">
<span>Freight &amp; Unloading</span>
<span className="text-on-surface font-title-md text-title-md">Included (Landed Madhapur Yard)</span>
</div>
<div className="flex items-center justify-between px-space-xs text-on-surface-variant font-label-sm text-label-sm">
<span>Price Validity</span>
<span className="text-on-surface font-title-md text-title-md">Firm till Dec 31, 2025</span>
</div>
</div>
</div>

<div className="flex flex-col p-space-base rounded bg-surface-container-lowest shadow-sm gap-space-sm">
<div className="flex items-center gap-space-xs">
<span className="material-symbols-outlined text-primary text-space-md leading-none">shield</span>
<span className="font-headline-sm text-headline-sm text-on-surface">Automated Guardrail Checks</span>
</div>
<div className="flex flex-col gap-space-xs mt-space-xs">
<div className="flex items-start gap-space-sm p-space-xs rounded bg-surface-container-low">
<span className="material-symbols-outlined text-primary text-space-base shrink-0 leading-tight">check_circle</span>
<div className="flex flex-col">
<span className="font-title-md text-title-md text-on-surface">Mandi Spot Index Price Cap</span>
<span className="font-body-sm text-body-sm text-on-surface-variant">Current price is 4.2% under prevailing Hyderabad Wholesale Spot Index.</span>
</div>
</div>
<div className="flex items-start gap-space-sm p-space-xs rounded bg-surface-container-low">
<span className="material-symbols-outlined text-primary text-space-base shrink-0 leading-tight">check_circle</span>
<div className="flex flex-col">
<span className="font-title-md text-title-md text-on-surface">Zero Phantom Inventory Lock</span>
<span className="font-body-sm text-body-sm text-on-surface-variant">Quantities perfectly reconcile with Stage 04 MEP execution forecast.</span>
</div>
</div>
<div className="flex items-start gap-space-sm p-space-xs rounded bg-surface-container-low">
<span className="material-symbols-outlined text-primary text-space-base shrink-0 leading-tight">check_circle</span>
<div className="flex flex-col">
<span className="font-title-md text-title-md text-on-surface">Mandatory Gate Pass QA Gate</span>
<span className="font-body-sm text-body-sm text-on-surface-variant">Vendor batch mill test certificates required before gate barrier release.</span>
</div>
</div>
</div>
</div>

<div className="flex flex-col p-space-base rounded bg-surface-container-lowest shadow-sm gap-space-md">
<div className="flex items-center justify-between">
<span className="font-headline-sm text-headline-sm text-on-surface">Approval Hierarchy &amp; Sign-off</span>
<span className="px-space-xs py-space-2xs rounded bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm">Stage 3 of 3</span>
</div>

<div className="flex flex-col gap-space-sm">

<div className="flex items-center justify-between">
<div className="flex items-center gap-space-sm">
<span className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-space-xs">
<span className="material-symbols-outlined text-space-base">done</span>
</span>
<div className="flex flex-col">
<span className="font-title-md text-title-md text-on-surface">Vikram Rao</span>
<span className="font-label-sm text-label-sm text-on-surface-variant">Project MEP Lead</span>
</div>
</div>
<span className="font-label-sm text-label-sm text-primary font-medium">Auto-Approved (Oct 24)</span>
</div>

<div className="flex items-center justify-between">
<div className="flex items-center gap-space-sm">
<span className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-space-xs">
<span className="material-symbols-outlined text-space-base">done</span>
</span>
<div className="flex flex-col">
<span className="font-title-md text-title-md text-on-surface">Kavitha Reddy</span>
<span className="font-label-sm text-label-sm text-on-surface-variant">QS &amp; Value Eng. Lead</span>
</div>
</div>
<span className="font-label-sm text-label-sm text-primary font-medium">Auto-Approved (Oct 24)</span>
</div>

<div className="flex items-center justify-between p-space-xs rounded bg-surface-container-low">
<div className="flex items-center gap-space-sm">
<span className="w-7 h-7 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-space-xs">
<span className="material-symbols-outlined text-space-base">hourglass_top</span>
</span>
<div className="flex flex-col">
<span className="font-title-md text-title-md text-on-surface">Shravan Saha</span>
<span className="font-label-sm text-label-sm text-on-surface-variant">Project Director (Your Account)</span>
</div>
</div>
<span className="px-space-xs py-space-2xs rounded bg-primary/20 text-primary font-label-sm text-label-sm font-bold">Pending Action</span>
</div>
</div>

<div className="flex flex-col gap-space-xs pt-space-xs">
<button className="w-full flex items-center justify-center gap-space-xs px-space-md py-space-sm rounded bg-primary text-on-primary hover:bg-primary-container font-title-md text-title-md font-semibold shadow-sm transition-all transform active:scale-[0.99]" id="authorizePoBtn">
<span className="material-symbols-outlined text-space-base leading-none">lock</span>
<span>Authorize &amp; Issue PO (₹38,42,800)</span>
</button>
<button className="w-full flex items-center justify-center gap-space-xs px-space-md py-space-xs rounded bg-surface-container text-on-surface hover:bg-surface-container-high font-title-md text-title-md transition-colors">
<span className="material-symbols-outlined text-space-base leading-none">picture_as_pdf</span>
<span>Download PO (.PDF with Digital Stamp)</span>
</button>
<button className="w-full flex items-center justify-center gap-space-xs px-space-md py-space-xs rounded bg-surface-container-low text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors font-body-sm text-body-sm">
<span className="material-symbols-outlined text-space-base leading-none">send_to_mobile</span>
<span>Push to Vendor WhatsApp &amp; Saha Vendor Portal</span>
</button>
</div>
<span className="font-label-sm text-label-sm text-on-surface-variant text-center">
          Secured by 256-bit Saha OS Cryptographic Ledger • Immutable PO Hash
        </span>
</div>
</div>
</div>


</div></main></div>
    </div>
  );
}
