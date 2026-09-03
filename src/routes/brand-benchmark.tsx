import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/brand-benchmark")({
  head: () => ({
    meta: [
      { title: "Multi-Brand Equivalency & Savings Matrix | Saha OS" },
      { name: "description", content: "Brand arbitrage margins, vetted mills and auto-substitution in active POs." },
      { property: "og:title", content: "Multi-Brand Equivalency & Savings Matrix | Saha OS" },
      { property: "og:description", content: "Brand arbitrage margins, vetted mills and auto-substitution in active POs." },
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

<div className="flex flex-col gap-space-sm">
<div className="flex flex-wrap items-center justify-between gap-space-sm">
<div className="flex flex-col">
<div className="flex items-center gap-space-xs text-on-surface-variant font-label-sm">
<span className="hover:text-primary cursor-pointer">Procurement &amp; Accounts</span>
<span>/</span>
<span className="hover:text-primary cursor-pointer">Master Price Intelligence</span>
<span>/</span>
<span className="text-primary font-bold">Multi-Brand Equivalency &amp; Savings Matrix</span>
</div>
<div className="flex items-center gap-space-sm mt-space-2xs">
<h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">Multi-Brand Price Intelligence &amp; Alternative Recommender</h1>
<span className="px-space-xs py-space-2xs rounded bg-surface-container text-tertiary font-label-sm flex items-center gap-space-2xs">
<span className="material-symbols-outlined text-[13px]">verified</span> AI Real-Time Index: LIVE
          </span>
</div>
</div>
<div className="flex items-center gap-space-sm">
<button className="flex items-center gap-space-xs px-space-md py-space-xs rounded bg-surface-container hover:bg-surface-container-high text-on-surface font-title-md transition-colors shadow-sm">
<span className="material-symbols-outlined text-[18px] text-tertiary">upload_file</span>
<span>Import Rate Sheet (.xlsx)</span>
</button>
<button className="flex items-center gap-space-xs px-space-md py-space-xs rounded bg-surface-container hover:bg-surface-container-high text-on-surface font-title-md transition-colors shadow-sm">
<span className="material-symbols-outlined text-[18px] text-secondary">tune</span>
<span>Configure Equivalency Tiers</span>
</button>
<button className="flex items-center gap-space-xs px-space-md py-space-xs rounded bg-primary text-on-primary hover:bg-primary-container font-title-md transition-colors shadow-sm">
<span className="material-symbols-outlined text-[18px]">bolt</span>
<span>Auto-Substitute in Active POs</span>
</button>
</div>
</div>

<div className="flex flex-wrap items-center justify-between gap-space-sm px-space-md py-space-xs rounded bg-surface-container-lowest shadow-sm">
<div className="flex flex-wrap items-center gap-space-sm">
<span className="font-label-sm uppercase text-on-surface-variant">Active Benchmarking Scope:</span>
<div className="flex items-center gap-space-2xs px-space-xs py-space-2xs rounded bg-surface-container-low font-label-md text-on-surface">
<span className="material-symbols-outlined text-[15px] text-primary">apartment</span>
<span>Cyber Enclave - Phase 2</span>
</div>
<div className="flex items-center gap-space-2xs px-space-xs py-space-2xs rounded bg-surface-container-low font-label-md text-on-surface">
<span className="material-symbols-outlined text-[15px] text-tertiary">location_on</span>
<span>Hyderabad / Telangana Mandi Index (Updated: 2h ago)</span>
</div>
<div className="flex items-center gap-space-2xs px-space-xs py-space-2xs rounded bg-surface-container-low font-label-md text-on-surface">
<span className="material-symbols-outlined text-[15px] text-primary">gavel</span>
<span>BIS Strict: IS 1786 | IS 269 | IS 694 | IS 13920 Compliant</span>
</div>
</div>
<div className="flex items-center gap-space-md text-on-surface-variant font-label-sm">
<span className="flex items-center gap-space-2xs"><span className="h-2 w-2 rounded-full bg-primary"></span> Primary Mills Verified</span>
<span className="flex items-center gap-space-2xs"><span className="h-2 w-2 rounded-full bg-secondary"></span> Secondary Tracked</span>
</div>
</div>
</div>

<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-space-base">

<div className="p-space-base rounded bg-surface-container-lowest shadow-sm flex flex-col justify-between relative overflow-hidden">
<div className="flex justify-between items-start">
<div>
<span className="font-label-sm uppercase text-on-surface-variant">Active Brand SKUs Tracked</span>
<div className="font-tabular-metric text-tabular-metric text-on-surface mt-space-2xs">3,420 <span className="font-body-sm text-body-sm font-normal text-on-surface-variant">SKUs</span></div>
</div>
<div className="p-space-xs rounded bg-surface-container-low text-tertiary">
<span className="material-symbols-outlined text-[20px]">layers</span>
</div>
</div>
<div className="flex items-center justify-between mt-space-sm pt-space-xs bg-surface-container-low px-space-xs rounded">
<span className="font-label-sm text-on-surface-variant">48 Vetted Manufacturer Mills</span>
<span className="font-label-sm text-primary font-bold">100% Geo-Mandi Synced</span>
</div>
</div>

<div className="p-space-base rounded bg-surface-container-lowest shadow-sm flex flex-col justify-between">
<div className="flex justify-between items-start">
<div>
<span className="font-label-sm uppercase text-on-surface-variant">Avg Brand Arbitrage Margin</span>
<div className="font-tabular-metric text-tabular-metric text-primary mt-space-2xs">8.4% – 14.2%</div>
</div>
<div className="p-space-xs rounded bg-primary-container/20 text-primary">
<span className="material-symbols-outlined text-[20px]">trending_down</span>
</div>
</div>
<div className="flex items-center justify-between mt-space-sm pt-space-xs bg-surface-container-low px-space-xs rounded">
<span className="font-label-sm text-on-surface-variant">Procurement Batch Level</span>
<span className="font-label-sm text-primary font-bold">+₹1,420/MT Rebar Avg</span>
</div>
</div>

<div className="p-space-base rounded bg-surface-container-lowest shadow-sm flex flex-col justify-between">
<div className="flex justify-between items-start">
<div>
<span className="font-label-sm uppercase text-on-surface-variant">Identified Active Phase Savings</span>
<div className="font-tabular-metric text-tabular-metric text-on-surface mt-space-2xs">₹4,82,500</div>
</div>
<div className="p-space-xs rounded bg-surface-container-low text-primary">
<span className="material-symbols-outlined text-[20px]">savings</span>
</div>
</div>
<div className="flex items-center justify-between mt-space-sm pt-space-xs bg-surface-container-low px-space-xs rounded">
<span className="font-label-sm text-on-surface-variant">Steel, Cement, Plumbing, Wires</span>
<span className="font-label-sm text-primary font-bold">Ready for PO Release</span>
</div>
</div>

<div className="p-space-base rounded bg-surface-container-lowest shadow-sm flex flex-col justify-between">
<div className="flex justify-between items-start">
<div>
<span className="font-label-sm uppercase text-on-surface-variant">Structural Consultant Sign-off</span>
<div className="font-tabular-metric text-tabular-metric text-on-surface mt-space-2xs">92.4% <span className="font-body-sm text-body-sm text-primary font-bold">Approved</span></div>
</div>
<div className="p-space-xs rounded bg-surface-container-low text-tertiary">
<span className="material-symbols-outlined text-[20px]">draw</span>
</div>
</div>
<div className="flex items-center justify-between mt-space-sm pt-space-xs bg-surface-container-low px-space-xs rounded">
<span className="font-label-sm text-on-surface-variant">Zero Red Flag Rejections</span>
<span className="font-label-sm text-on-surface font-semibold">18 Automated MTCs</span>
</div>
</div>
</div>

<div className="flex flex-col gap-space-sm rounded bg-surface-container-lowest p-space-lg shadow-sm">

<div className="flex flex-wrap items-center justify-between gap-space-md p-space-md rounded bg-surface-container-low">
<div className="flex items-center gap-space-base">
<div className="w-12 h-12 rounded bg-primary text-on-primary flex items-center justify-center font-bold">
<span className="material-symbols-outlined text-[28px]">token</span>
</div>
<div className="flex flex-col">
<div className="flex items-center gap-space-xs">
<span className="font-headline-sm text-headline-sm text-on-surface">Active Indent #IND-CE2-0941:</span>
<span className="font-headline-sm text-headline-sm text-primary">Fe 500D Primary TMT Rebar (16mm)</span>
<span className="px-space-xs py-space-2xs rounded bg-primary/10 text-primary font-label-sm">Pour Ready: Stilt Columns &amp; Transfer Beams</span>
</div>
<div className="flex items-center gap-space-md text-on-surface-variant font-body-sm mt-space-2xs">
<span>Required Quantity: <strong className="text-on-surface">45.00 MT</strong></span>
<span>•</span>
<span>Delivery Yard: <strong className="text-on-surface">Batching Area 2, Madhapur</strong></span>
<span>•</span>
<span>Target Delivery: <strong className="text-on-surface">Within 72 Hours</strong></span>
</div>
</div>
</div>
<div className="flex items-center gap-space-xl bg-surface-container-lowest px-space-base py-space-sm rounded shadow-sm">
<div className="flex flex-col text-right">
<span className="font-label-sm uppercase text-on-surface-variant">Current Indent Baseline Brand</span>
<span className="font-title-md text-title-md text-on-surface font-bold">Tata Tiscon Fe 500D</span>
<span className="font-tabular-metric-sm text-tabular-metric-sm text-on-surface">₹58,200 / MT • <span className="text-secondary font-bold">₹26,19,000 Total</span></span>
</div>
<div className="px-space-xs py-space-sm rounded bg-secondary-container text-on-secondary-container font-label-sm uppercase font-bold flex flex-col items-center">
<span>Super</span>
<span>Premium</span>
</div>
</div>
</div>

<div className="grid grid-cols-1 lg:grid-cols-3 gap-space-base mt-space-xs">

<div className="flex flex-col justify-between rounded bg-surface p-space-base hover:shadow-md transition-shadow relative">
<div className="absolute top-0 right-0 px-space-sm py-space-2xs bg-primary text-on-primary font-label-sm rounded-bl font-bold flex items-center gap-space-2xs">
<span className="material-symbols-outlined text-[14px]">verified</span>
          RECOMMENDED BEST VALUE
        </div>
<div className="flex flex-col gap-space-xs">
<div className="font-label-sm text-primary font-bold uppercase tracking-wider mt-space-xs">Primary Integrated Mill • Tier 1</div>
<h2 className="font-headline-sm text-headline-sm text-on-surface">Jindal Panther Fe 500D</h2>
<div className="flex items-baseline gap-space-xs mt-space-xs">
<span className="font-tabular-metric text-tabular-metric text-on-surface">₹55,400</span>
<span className="font-body-sm text-on-surface-variant">/ MT</span>
<span className="ml-auto px-space-xs py-space-2xs rounded bg-primary-container/20 text-primary font-label-md font-bold">
              -₹2,800/MT (-4.81%)
            </span>
</div>
<div className="p-space-sm rounded bg-surface-container-lowest my-space-xs flex flex-col gap-space-xs">
<div className="flex justify-between text-body-sm">
<span className="text-on-surface-variant">Net Phase Savings:</span>
<span className="font-tabular-metric-sm text-primary font-bold">₹1,26,000</span>
</div>
<div className="flex justify-between text-body-sm">
<span className="text-on-surface-variant">Total Indent Cost:</span>
<span className="font-tabular-metric-sm text-on-surface font-semibold">₹24,93,000</span>
</div>
</div>

<div className="flex flex-col gap-space-2xs text-body-sm">
<div className="flex justify-between py-space-2xs">
<span className="text-on-surface-variant font-label-sm uppercase">Yield Strength</span>
<span className="text-on-surface font-semibold">540 N/mm² (IS 1786 Matches Tiscon)</span>
</div>
<div className="flex justify-between py-space-2xs">
<span className="text-on-surface-variant font-label-sm uppercase">Elongation / Ductility</span>
<span className="text-on-surface font-semibold">18.5% (Ratio 1.28 &gt; 1.25 IS Req)</span>
</div>
<div className="flex justify-between py-space-2xs">
<span className="text-on-surface-variant font-label-sm uppercase">Consultant Approval</span>
<span className="text-primary font-bold flex items-center gap-space-2xs">
<span className="material-symbols-outlined text-[15px]">check_circle</span> Pre-Approved
              </span>
</div>
<div className="flex justify-between py-space-2xs">
<span className="text-on-surface-variant font-label-sm uppercase">Stock Availability</span>
<span className="text-on-surface font-medium">Immediate • Nacharam Yard</span>
</div>
</div>
</div>
<div className="flex flex-col gap-space-xs mt-space-base pt-space-xs">
<button className="w-full py-space-xs px-space-sm rounded bg-primary text-on-primary hover:bg-primary-container font-title-md transition-colors flex items-center justify-center gap-space-xs">
<span className="material-symbols-outlined text-[18px]">swap_horiz</span>
<span>Switch to Jindal Panther (-₹1.26L)</span>
</button>
<div className="text-center font-label-sm text-on-surface-variant">Includes Auto-MTC Verification &amp; Invoice Linkage</div>
</div>
</div>

<div className="flex flex-col justify-between rounded bg-surface-container-lowest p-space-base shadow-sm hover:shadow-md transition-shadow relative">
<div className="absolute top-0 right-0 px-space-sm py-space-2xs bg-tertiary text-on-tertiary font-label-sm rounded-bl font-bold flex items-center gap-space-2xs">
<span className="material-symbols-outlined text-[14px]">payments</span>
          MAX TIER-1 SAVINGS
        </div>
<div className="flex flex-col gap-space-xs">
<div className="font-label-sm text-tertiary font-bold uppercase tracking-wider mt-space-xs">Primary Blast Furnace • Tier 1</div>
<h2 className="font-headline-sm text-headline-sm text-on-surface">JSW Neosteel Fe 500D</h2>
<div className="flex items-baseline gap-space-xs mt-space-xs">
<span className="font-tabular-metric text-tabular-metric text-on-surface">₹54,800</span>
<span className="font-body-sm text-on-surface-variant">/ MT</span>
<span className="ml-auto px-space-xs py-space-2xs rounded bg-primary-container/20 text-primary font-label-md font-bold">
              -₹3,400/MT (-5.84%)
            </span>
</div>
<div className="p-space-sm rounded bg-surface-container-low my-space-xs flex flex-col gap-space-xs">
<div className="flex justify-between text-body-sm">
<span className="text-on-surface-variant">Net Phase Savings:</span>
<span className="font-tabular-metric-sm text-primary font-bold">₹1,53,000</span>
</div>
<div className="flex justify-between text-body-sm">
<span className="text-on-surface-variant">Total Indent Cost:</span>
<span className="font-tabular-metric-sm text-on-surface font-semibold">₹24,66,000</span>
</div>
</div>

<div className="flex flex-col gap-space-2xs text-body-sm">
<div className="flex justify-between py-space-2xs">
<span className="text-on-surface-variant font-label-sm uppercase">Yield Strength</span>
<span className="text-on-surface font-semibold">545 N/mm² (Superior Weldability)</span>
</div>
<div className="flex justify-between py-space-2xs">
<span className="text-on-surface-variant font-label-sm uppercase">Carbon Equivalent</span>
<span className="text-on-surface font-semibold">&lt; 0.42% (Ultra-pure virgin ore)</span>
</div>
<div className="flex justify-between py-space-2xs">
<span className="text-on-surface-variant font-label-sm uppercase">Consultant Approval</span>
<span className="text-primary font-bold flex items-center gap-space-2xs">
<span className="material-symbols-outlined text-[15px]">check_circle</span> Pre-Approved
              </span>
</div>
<div className="flex justify-between py-space-2xs">
<span className="text-on-surface-variant font-label-sm uppercase">Stock Availability</span>
<span className="text-on-surface font-medium">Ready Stock • Sanathnagar Rail Yard</span>
</div>
</div>
</div>
<div className="flex flex-col gap-space-xs mt-space-base pt-space-xs">
<button className="w-full py-space-xs px-space-sm rounded bg-tertiary text-on-tertiary hover:bg-tertiary-container font-title-md transition-colors flex items-center justify-center gap-space-xs">
<span className="material-symbols-outlined text-[18px]">verified</span>
<span>Switch to JSW Neosteel (Save ₹1.53L)</span>
</button>
<div className="text-center font-label-sm text-on-surface-variant">NABL Calibration Cert Uploaded</div>
</div>
</div>

<div className="flex flex-col justify-between rounded bg-surface p-space-base relative">
<div className="absolute top-0 right-0 px-space-sm py-space-2xs bg-secondary text-on-secondary font-label-sm rounded-bl font-bold flex items-center gap-space-2xs">
<span className="material-symbols-outlined text-[14px]">warning</span>
          CONDITIONAL / TIER 2
        </div>
<div className="flex flex-col gap-space-xs">
<div className="font-label-sm text-secondary font-bold uppercase tracking-wider mt-space-xs">Secondary Induction Furnace • Tier 2</div>
<h2 className="font-headline-sm text-headline-sm text-on-surface">Radha / Kamdhenu TMT Fe 500D</h2>
<div className="flex items-baseline gap-space-xs mt-space-xs">
<span className="font-tabular-metric text-tabular-metric text-on-surface">₹51,500</span>
<span className="font-body-sm text-on-surface-variant">/ MT</span>
<span className="ml-auto px-space-xs py-space-2xs rounded bg-surface-container-high text-on-surface font-label-md font-bold">
              -₹6,700/MT (-11.51%)
            </span>
</div>
<div className="p-space-sm rounded bg-surface-container-lowest my-space-xs flex flex-col gap-space-xs">
<div className="flex justify-between text-body-sm">
<span className="text-on-surface-variant">Theoretical Savings:</span>
<span className="font-tabular-metric-sm text-primary font-bold">₹3,01,500</span>
</div>
<div className="flex justify-between text-body-sm">
<span className="text-on-surface-variant">Total Indent Cost:</span>
<span className="font-tabular-metric-sm text-on-surface font-semibold">₹23,17,500</span>
</div>
</div>

<div className="p-space-xs rounded bg-error-container/40 text-on-error-container flex flex-col gap-space-2xs font-body-sm">
<div className="flex items-center gap-space-xs font-bold text-error">
<span className="material-symbols-outlined text-[16px]">block</span>
<span>Engineering Policy Restriction</span>
</div>
<p className="font-label-sm text-on-surface leading-tight">
              IS 13920 restricts secondary rerolled rebar in high-stress heavy columns &amp; seismic transfer beams. Approved only for non-structural plinth apron or boundary retaining walls.
            </p>
</div>

<div className="flex flex-col gap-space-2xs text-body-sm mt-space-xs">
<div className="flex justify-between py-space-2xs">
<span className="text-on-surface-variant font-label-sm uppercase">Yield Strength</span>
<span className="text-on-surface font-semibold">510 N/mm² (Wide Variance)</span>
</div>
<div className="flex justify-between py-space-2xs">
<span className="text-on-surface-variant font-label-sm uppercase">Consultant Clearance</span>
<span className="text-error font-bold flex items-center gap-space-2xs">
<span className="material-symbols-outlined text-[15px]">cancel</span> Requires OTP Exception
              </span>
</div>
</div>
</div>
<div className="flex flex-col gap-space-xs mt-space-base pt-space-xs">
<button className="w-full py-space-xs px-space-sm rounded bg-surface-container hover:bg-surface-container-high text-on-surface font-title-md transition-colors flex items-center justify-center gap-space-xs">
<span className="material-symbols-outlined text-[18px]">lock</span>
<span>Request Consultant OTP Clearance</span>
</button>
<div className="text-center font-label-sm text-on-surface-variant">Ductility test coupon mandatory</div>
</div>
</div>
</div>

<div className="flex flex-wrap items-center justify-between gap-space-md mt-space-sm p-space-sm rounded bg-surface-container-high">
<div className="flex items-center gap-space-sm">
<span className="material-symbols-outlined text-primary text-[22px]">lightbulb</span>
<span className="font-body-md text-on-surface">
<strong>Smart Negotiator Playbook:</strong> Tata Tiscon dealer is currently charging a ₹3,400/MT premium above JSW Neosteel.
        </span>
</div>
<div className="flex items-center gap-space-sm">
<button className="px-space-sm py-space-xs rounded bg-surface-container-lowest text-on-surface hover:bg-surface text-title-md font-title-md shadow-sm transition-colors flex items-center gap-space-2xs">
<span className="material-symbols-outlined text-[16px] text-tertiary">send</span>
<span>Generate Auto-Counter Offer to Tata Tiscon @ ₹55,200</span>
</button>
</div>
</div>
</div>

<div className="flex flex-col gap-space-md rounded bg-surface-container-lowest p-space-lg shadow-sm">
<div className="flex flex-wrap items-center justify-between gap-space-base">
<div className="flex flex-col">
<h3 className="font-headline-md text-headline-md text-on-surface">Cross-Category Multi-Brand Price Matrix</h3>
<p className="font-body-sm text-on-surface-variant">Live benchmark catalog across Hyderabad dealer networks, certified BIS tolerances, and equivalent substitution grades.</p>
</div>

<div className="flex flex-wrap items-center gap-space-xs bg-surface-container-low p-space-2xs rounded">
<button className="px-space-sm py-space-xs rounded bg-surface-container-lowest text-primary font-title-md shadow-sm">Cement (OPC 53 / PPC)</button>
<button className="px-space-sm py-space-xs rounded hover:bg-surface-container text-on-surface-variant font-title-md transition-colors">Steel Rebar (Fe 500D)</button>
<button className="px-space-sm py-space-xs rounded hover:bg-surface-container text-on-surface-variant font-title-md transition-colors">Plumbing (CPVC/SWR)</button>
<button className="px-space-sm py-space-xs rounded hover:bg-surface-container text-on-surface-variant font-title-md transition-colors">Electrical Wires (FR-LSH)</button>
<button className="px-space-sm py-space-xs rounded hover:bg-surface-container text-on-surface-variant font-title-md transition-colors">Paints &amp; Primers</button>
</div>
</div>

<div className="overflow-x-auto">
<table className="w-full text-left">
<thead>
<tr className="bg-surface-container-low text-on-surface-variant font-label-sm uppercase tracking-wider">
<th className="py-space-sm px-space-md">Brand &amp; Grade</th>
<th className="py-space-sm px-space-md">Manufacturer Mill Tier</th>
<th className="py-space-sm px-space-md">Hyderabad Mandi Price / 50kg</th>
<th className="py-space-sm px-space-md">Arbitrage Margin vs Baseline</th>
<th className="py-space-sm px-space-md">Compressive Strength (28-Day)</th>
<th className="py-space-sm px-space-md">IS Standards &amp; Quality</th>
<th className="py-space-sm px-space-md">Approved Application Scope</th>
<th className="py-space-sm px-space-md text-right">Action</th>
</tr>
</thead>
<tbody className="text-body-sm font-body-sm divide-y-0">

<tr className="hover:bg-surface-container-low/50 transition-colors bg-surface-container-low/30">
<td className="py-space-sm px-space-md">
<div className="flex items-center gap-space-sm">
<div className="w-8 h-8 rounded bg-surface-container flex items-center justify-center font-bold text-on-surface">
                  UT
                </div>
<div className="flex flex-col">
<span className="font-title-md text-on-surface font-bold">UltraTech OPC 53</span>
<span className="font-label-sm text-on-surface-variant">Aditya Birla • Bulk Rail Siding</span>
</div>
</div>
</td>
<td className="py-space-sm px-space-md">
<span className="px-space-xs py-space-2xs rounded bg-surface-container text-on-surface font-label-sm font-bold">
                Tier 1 Premium
              </span>
</td>
<td className="py-space-sm px-space-md">
<span className="font-tabular-metric-sm text-on-surface font-bold">₹385.00</span>
<span className="font-label-sm text-on-surface-variant">/ Bag</span>
</td>
<td className="py-space-sm px-space-md">
<span className="px-space-xs py-space-2xs rounded bg-surface-container text-on-surface-variant font-label-sm font-semibold">
                BASELINE 0.0%
              </span>
</td>
<td className="py-space-sm px-space-md font-semibold text-on-surface">58.5 MPa</td>
<td className="py-space-sm px-space-md">
<span className="px-space-xs py-space-2xs rounded bg-surface-container text-primary font-label-sm">IS 269:2015</span>
</td>
<td className="py-space-sm px-space-md">
<span className="text-on-surface font-medium">All Heavy Structural / PT Slabs</span>
</td>
<td className="py-space-sm px-space-md text-right">
<span className="text-on-surface-variant font-label-sm">Current Spec</span>
</td>
</tr>

<tr className="hover:bg-surface-container-low transition-colors">
<td className="py-space-sm px-space-md">
<div className="flex items-center gap-space-sm">
<div className="w-8 h-8 rounded bg-primary-container/20 text-primary flex items-center justify-center font-bold">
                  SG
                </div>
<div className="flex flex-col">
<span className="font-title-md text-on-surface font-bold">Sagar Cements OPC 53</span>
<span className="font-label-sm text-primary font-semibold">Regional Clinker • Mattampally</span>
</div>
</div>
</td>
<td className="py-space-sm px-space-md">
<span className="px-space-xs py-space-2xs rounded bg-primary-container/10 text-primary font-label-sm font-bold">
                Tier 1 Regional
              </span>
</td>
<td className="py-space-sm px-space-md">
<span className="font-tabular-metric-sm text-on-surface font-bold">₹355.00</span>
<span className="font-label-sm text-on-surface-variant">/ Bag</span>
</td>
<td className="py-space-sm px-space-md">
<span className="px-space-xs py-space-2xs rounded bg-primary-container/20 text-primary font-label-sm font-bold">
                -₹30 / Bag (-7.79%)
              </span>
</td>
<td className="py-space-sm px-space-md font-semibold text-on-surface">57.8 MPa</td>
<td className="py-space-sm px-space-md">
<span className="px-space-xs py-space-2xs rounded bg-surface-container text-primary font-label-sm">IS 269:2015</span>
</td>
<td className="py-space-sm px-space-md">
<span className="text-primary font-semibold">RCC Columns, Slabs, Pavements</span>
</td>
<td className="py-space-sm px-space-md text-right">
<button className="px-space-sm py-space-2xs rounded bg-primary text-on-primary hover:bg-primary-container font-label-md transition-colors">
                Apply Alt
              </button>
</td>
</tr>

<tr className="hover:bg-surface-container-low transition-colors">
<td className="py-space-sm px-space-md">
<div className="flex items-center gap-space-sm">
<div className="w-8 h-8 rounded bg-surface-container text-tertiary flex items-center justify-center font-bold">
                  MC
                </div>
<div className="flex flex-col">
<span className="font-title-md text-on-surface font-bold">Maha Cement (My Home) OPC 53</span>
<span className="font-label-sm text-on-surface-variant">Mellacheruvu Works</span>
</div>
</div>
</td>
<td className="py-space-sm px-space-md">
<span className="px-space-xs py-space-2xs rounded bg-surface-container text-tertiary font-label-sm font-bold">
                Tier 1 Regional
              </span>
</td>
<td className="py-space-sm px-space-md">
<span className="font-tabular-metric-sm text-on-surface font-bold">₹350.00</span>
<span className="font-label-sm text-on-surface-variant">/ Bag</span>
</td>
<td className="py-space-sm px-space-md">
<span className="px-space-xs py-space-2xs rounded bg-primary-container/20 text-primary font-label-sm font-bold">
                -₹35 / Bag (-9.09%)
              </span>
</td>
<td className="py-space-sm px-space-md font-semibold text-on-surface">57.0 MPa</td>
<td className="py-space-sm px-space-md">
<span className="px-space-xs py-space-2xs rounded bg-surface-container text-primary font-label-sm">IS 269:2015</span>
</td>
<td className="py-space-sm px-space-md">
<span className="text-on-surface font-medium">All RCC Works &amp; Pre-cast</span>
</td>
<td className="py-space-sm px-space-md text-right">
<button className="px-space-sm py-space-2xs rounded bg-surface-container text-on-surface hover:bg-surface-container-high font-label-md transition-colors">
                Apply Alt
              </button>
</td>
</tr>

<tr className="hover:bg-surface-container-low transition-colors">
<td className="py-space-sm px-space-md">
<div className="flex items-center gap-space-sm">
<div className="w-8 h-8 rounded bg-surface-container text-secondary flex items-center justify-center font-bold">
                  CC
                </div>
<div className="flex flex-col">
<span className="font-title-md text-on-surface font-bold">Chettinad Cement OPC 53</span>
<span className="font-label-sm text-on-surface-variant">Kallur Line</span>
</div>
</div>
</td>
<td className="py-space-sm px-space-md">
<span className="px-space-xs py-space-2xs rounded bg-surface-container text-on-surface font-label-sm font-bold">
                Tier 1 South
              </span>
</td>
<td className="py-space-sm px-space-md">
<span className="font-tabular-metric-sm text-on-surface font-bold">₹345.00</span>
<span className="font-label-sm text-on-surface-variant">/ Bag</span>
</td>
<td className="py-space-sm px-space-md">
<span className="px-space-xs py-space-2xs rounded bg-primary-container/20 text-primary font-label-sm font-bold">
                -₹40 / Bag (-10.38%)
              </span>
</td>
<td className="py-space-sm px-space-md font-semibold text-on-surface">56.5 MPa</td>
<td className="py-space-sm px-space-md">
<span className="px-space-xs py-space-2xs rounded bg-surface-container text-primary font-label-sm">IS 269:2015</span>
</td>
<td className="py-space-sm px-space-md">
<span className="text-on-surface font-medium">Standard Structural &amp; Slabs</span>
</td>
<td className="py-space-sm px-space-md text-right">
<button className="px-space-sm py-space-2xs rounded bg-surface-container text-on-surface hover:bg-surface-container-high font-label-md transition-colors">
                Apply Alt
              </button>
</td>
</tr>
</tbody>
</table>
</div>

<div className="grid grid-cols-1 xl:grid-cols-2 gap-space-base pt-space-sm">

<div className="p-space-base rounded bg-surface flex flex-col gap-space-sm">
<div className="flex justify-between items-center">
<div className="flex items-center gap-space-xs">
<span className="material-symbols-outlined text-tertiary text-[20px]">plumbing</span>
<span className="font-title-md text-title-md text-on-surface">Plumbing: 110mm SWR Drainage Pipes (3m Type B)</span>
</div>
<span className="font-label-sm text-on-surface-variant">Baseline: Supreme Industries</span>
</div>
<div className="flex flex-col gap-space-2xs">

<div className="flex items-center justify-between p-space-xs rounded bg-surface-container-lowest">
<div className="flex items-center gap-space-sm">
<span className="font-title-md text-on-surface">1. Supreme Industries (Baseline)</span>
<span className="font-label-sm text-on-surface-variant">IS 13592</span>
</div>
<div className="flex items-center gap-space-base">
<span className="font-tabular-metric-sm text-on-surface font-bold">₹760 / length</span>
<span className="px-space-xs py-space-2xs rounded bg-surface-container text-on-surface-variant font-label-sm">Benchmark</span>
</div>
</div>

<div className="flex items-center justify-between p-space-xs rounded bg-surface-container-lowest">
<div className="flex items-center gap-space-sm">
<span className="font-title-md text-on-surface">2. Ashirvad Pipes SWR</span>
<span className="font-label-sm text-primary font-bold">Ringfit IS 13592</span>
</div>
<div className="flex items-center gap-space-base">
<span className="font-tabular-metric-sm text-on-surface font-bold">₹740 / length</span>
<span className="px-space-xs py-space-2xs rounded bg-primary-container/20 text-primary font-label-sm font-bold">-2.63% Save</span>
</div>
</div>

<div className="flex items-center justify-between p-space-xs rounded bg-surface-container-lowest">
<div className="flex items-center gap-space-sm">
<span className="font-title-md text-on-surface">3. Finolex Plasson SWR</span>
<span className="font-label-sm text-primary font-bold">Heavy Duty ISI Marked</span>
</div>
<div className="flex items-center gap-space-base">
<span className="font-tabular-metric-sm text-on-surface font-bold">₹715 / length</span>
<span className="px-space-xs py-space-2xs rounded bg-primary-container/20 text-primary font-label-sm font-bold">-5.92% Save</span>
</div>
</div>
</div>
</div>

<div className="p-space-base rounded bg-surface flex flex-col gap-space-sm">
<div className="flex justify-between items-center">
<div className="flex items-center gap-space-xs">
<span className="material-symbols-outlined text-primary text-[20px]">bolt</span>
<span className="font-title-md text-title-md text-on-surface">Electrical: 2.5 sq.mm FR-LSH Copper Wire (90m)</span>
</div>
<span className="font-label-sm text-on-surface-variant">Baseline: Polycab</span>
</div>
<div className="flex flex-col gap-space-2xs">

<div className="flex items-center justify-between p-space-xs rounded bg-surface-container-lowest">
<div className="flex items-center gap-space-sm">
<span className="font-title-md text-on-surface">1. Polycab Green Wire (Baseline)</span>
<span className="font-label-sm text-on-surface-variant">IS 694 FR-LSH</span>
</div>
<div className="flex items-center gap-space-base">
<span className="font-tabular-metric-sm text-on-surface font-bold">₹2,450 / coil</span>
<span className="px-space-xs py-space-2xs rounded bg-surface-container text-on-surface-variant font-label-sm">Benchmark</span>
</div>
</div>

<div className="flex items-center justify-between p-space-xs rounded bg-surface-container-lowest">
<div className="flex items-center gap-space-sm">
<span className="font-title-md text-on-surface">2. Havells LifeLine Plus</span>
<span className="font-label-sm text-on-surface-variant">IS 694 Certified</span>
</div>
<div className="flex items-center gap-space-base">
<span className="font-tabular-metric-sm text-on-surface font-bold">₹2,420 / coil</span>
<span className="px-space-xs py-space-2xs rounded bg-primary-container/10 text-primary font-label-sm font-bold">-1.22% Save</span>
</div>
</div>

<div className="flex items-center justify-between p-space-xs rounded bg-surface-container-lowest">
<div className="flex items-center gap-space-sm">
<span className="font-title-md text-on-surface">3. RR Kabel Flamex</span>
<span className="font-label-sm text-primary font-bold">Dual Layer Flame Retardant</span>
</div>
<div className="flex items-center gap-space-base">
<span className="font-tabular-metric-sm text-on-surface font-bold">₹2,280 / coil</span>
<span className="px-space-xs py-space-2xs rounded bg-primary-container/20 text-primary font-label-sm font-bold">-6.94% Save</span>
</div>
</div>
</div>
</div>
</div>
</div>

<div className="grid grid-cols-1 lg:grid-cols-3 gap-space-base">

<div className="p-space-base rounded bg-surface-container-lowest shadow-sm flex flex-col gap-space-sm">
<div className="flex items-center gap-space-xs text-primary">
<span className="material-symbols-outlined text-[20px]">security</span>
<span className="font-title-md text-title-md text-on-surface">Rule 1: Structural Criticality Shield</span>
</div>
<p className="font-body-sm text-body-sm text-on-surface-variant">
        Structural Core, Transfer Slabs, and Heavy Shear Columns are strictly restricted to <strong>Primary Steel Producers</strong> (Tata, JSW, SAIL, Jindal). Secondary or rerolled mills are hard-blocked by Saha OS policy.
      </p>
<div className="mt-auto pt-space-xs flex items-center justify-between text-on-surface-variant font-label-sm">
<span>Enforced via BIS IS 13920</span>
<span className="text-primary font-bold">Active • Non-Bypassable</span>
</div>
</div>

<div className="p-space-base rounded bg-surface-container-lowest shadow-sm flex flex-col gap-space-sm">
<div className="flex items-center gap-space-xs text-tertiary">
<span className="material-symbols-outlined text-[20px]">autorenew</span>
<span className="font-title-md text-title-md text-on-surface">Rule 2: Smart Non-Structural Auto-Swap</span>
</div>
<p className="font-body-sm text-body-sm text-on-surface-variant">
        Masonry, internal partition walls, screed beds, and boundary works can automatically substitute expensive Tier-1 OPC 53 to high-grade PPC or blended regional cements, capturing up to <strong>14.2% savings</strong>.
      </p>
<div className="mt-auto pt-space-xs flex items-center justify-between text-on-surface-variant font-label-sm">
<span>Tolerance: 33/43 Grade PPC</span>
<span className="text-tertiary font-bold">Auto-Trigger Active</span>
</div>
</div>

<div className="p-space-base rounded bg-surface-container-lowest shadow-sm flex flex-col gap-space-sm">
<div className="flex items-center gap-space-xs text-primary">
<span className="material-symbols-outlined text-[20px]">fact_check</span>
<span className="font-title-md text-title-md text-on-surface">Rule 3: Automated QA &amp; NABL Testing</span>
</div>
<p className="font-body-sm text-body-sm text-on-surface-variant">
        Whenever an alternative brand switch is confirmed, Saha OS automatically generates gate-pass verification instructions and schedules a mandatory 3rd-party lab coupon test prior to pour card clearance.
      </p>
<div className="mt-auto pt-space-xs flex items-center justify-between text-on-surface-variant font-label-sm">
<span>MTC Pre-Validation</span>
<span className="text-primary font-bold">100% Traceability</span>
</div>
</div>
</div>
</div></main></div>
    </div>
  );
}
