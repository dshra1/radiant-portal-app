import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/price-intelligence")({
  head: () => ({
    meta: [
      { title: "Real-Time Multi-Brand Price Intelligence | Saha OS" },
      { name: "description", content: "Live mandi-indexed brand matrices for rebar, cement and tiles." },
      { property: "og:title", content: "Real-Time Multi-Brand Price Intelligence | Saha OS" },
      { property: "og:description", content: "Live mandi-indexed brand matrices for rebar, cement and tiles." },
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

<div className="flex flex-col md:flex-row md:items-center justify-between gap-space-sm pb-space-md">
<div className="flex flex-col">
<div className="flex items-center gap-space-xs text-on-surface-variant font-label-sm text-label-sm">
<span>Civil Platform</span>
<span className="material-symbols-outlined text-xs">chevron_right</span>
<span>Procurement &amp; Supply Chain</span>
<span className="material-symbols-outlined text-xs">chevron_right</span>
<span className="text-primary font-semibold">Brand Price Intelligence &amp; VE Hub</span>
</div>
<div className="flex items-center gap-space-sm mt-space-2xs">
<h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">Real-Time Multi-Brand Price Intelligence &amp; Alternative Engine</h1>
<span className="px-space-xs py-space-2xs rounded bg-primary text-on-primary font-label-sm text-label-sm uppercase flex items-center gap-1">
<span className="material-symbols-outlined text-xs">neurology</span>
          AI Value Engineering Active
        </span>
</div>
</div>
<div className="flex items-center gap-space-sm flex-wrap">
<button className="flex items-center gap-space-xs px-space-md py-space-xs rounded bg-surface-container-lowest text-on-surface shadow-sm hover:bg-surface-container transition-all font-title-md text-title-md" id="btn-sync-crawler">
<span className="material-symbols-outlined text-space-base text-primary animate-spin" style={{ animationDuration: "4s" }}>sync</span>
<span>Sync Online Mandi Crawlers</span>
</button>
<button className="flex items-center gap-space-xs px-space-md py-space-xs rounded bg-surface-container-lowest text-on-surface shadow-sm hover:bg-surface-container transition-all font-title-md text-title-md">
<span className="material-symbols-outlined text-space-base text-secondary">tune</span>
<span>VE Rule Matrix</span>
</button>
<button className="flex items-center gap-space-xs px-space-md py-space-xs rounded bg-primary text-on-primary hover:bg-primary-container transition-all font-title-md text-title-md shadow-sm">
<span className="material-symbols-outlined text-space-base">download</span>
<span>Export Benchmark (.xlsx)</span>
</button>
</div>
</div>

<div className="w-full bg-surface-container-lowest rounded-xl shadow-sm p-space-md mb-space-lg flex flex-col xl:flex-row xl:items-center justify-between gap-space-md">
<div className="flex items-center gap-space-sm min-w-0">
<span className="flex h-3 w-3 rounded-full bg-primary-container relative">
<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
</span>
<div className="flex items-center gap-space-xs overflow-x-auto whitespace-nowrap text-on-surface-variant font-label-md text-label-md py-space-2xs">
<span className="font-bold text-on-surface flex items-center gap-1">
<span className="material-symbols-outlined text-space-base text-primary">sensors</span>
          Live Data Crawl Engine:
        </span>
<span className="px-space-xs py-space-2xs rounded bg-surface-container text-on-surface">
          Steel Mandi: <strong className="text-on-surface">Hyderabad Hub</strong> (Sanathnagar/Nacharam) • <em className="not-italic text-primary font-medium">4m ago</em>
</span>
<span className="px-space-xs py-space-2xs rounded bg-surface-container text-on-surface">
          Ceramics: <strong className="text-on-surface">Morbi-Hyd Corridor</strong> • <em className="not-italic text-primary font-medium">12m ago</em>
</span>
<span className="px-space-xs py-space-2xs rounded bg-surface-container text-on-surface">
          Active Database: <strong className="text-on-surface">142 Brands</strong> across 18 Trade Categories
        </span>
</div>
</div>
<div className="flex items-center gap-space-md shrink-0 text-on-surface-variant font-label-sm text-label-sm">
<div className="flex items-center gap-space-xs">
<span className="material-symbols-outlined text-space-base text-tertiary">database</span>
<span>APIs: MetalJunction, SteelMint, MorbiExchange</span>
</div>
<div className="flex items-center gap-space-2xs">
<span className="w-2 h-2 rounded-full bg-primary"></span>
<span className="text-on-surface font-medium">99.8% Scraping Accuracy</span>
</div>
</div>
</div>

<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-space-md mb-space-xl">

<div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col justify-between relative overflow-hidden">
<div className="flex items-center justify-between mb-space-sm">
<span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary">Price Spread Tracking</span>
<span className="px-space-xs py-space-2xs rounded bg-secondary-container text-on-secondary-container font-label-sm text-label-sm">Delta Index</span>
</div>
<div className="flex items-baseline gap-space-sm">
<span className="font-tabular-metric text-display-lg text-on-surface">18.4%</span>
<span className="inline-flex items-center text-primary font-label-md text-label-md">
<span className="material-symbols-outlined text-space-base">trending_up</span> Tier-1 vs Regional
        </span>
</div>
<p className="font-body-sm text-body-sm text-on-surface-variant mt-space-xs">Tata/Jindal primary vs Kamdhenu/Jairaj regional billet spread in Hyderabad hub.</p>
<div className="w-full bg-surface-container rounded-full h-1.5 mt-space-md overflow-hidden">
<div className="bg-primary h-1.5 rounded-full" style={{ width: "72%" }}></div>
</div>
</div>

<div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col justify-between relative overflow-hidden">
<div className="flex items-center justify-between mb-space-sm">
<span className="font-label-sm text-label-sm uppercase tracking-wider text-primary">Real-Time VE Savings</span>
<span className="px-space-xs py-space-2xs rounded bg-primary-container text-on-primary-container font-label-sm text-label-sm">Actionable</span>
</div>
<div className="flex items-baseline gap-space-sm">
<span className="font-tabular-metric text-display-lg text-primary">₹14.85 L</span>
<span className="inline-flex items-center text-primary font-label-md text-label-md">
<span className="material-symbols-outlined text-space-base">savings</span> 4 Indents
        </span>
</div>
<p className="font-body-sm text-body-sm text-on-surface-variant mt-space-xs">Approved hybrid substitution potential across Cyber Enclave Ph-2 Tower A, B &amp; C.</p>
<div className="w-full bg-surface-container rounded-full h-1.5 mt-space-md overflow-hidden">
<div className="bg-primary-container h-1.5 rounded-full" style={{ width: "84%" }}></div>
</div>
</div>

<div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col justify-between relative overflow-hidden">
<div className="flex items-center justify-between mb-space-sm">
<span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary">Spec &amp; Code Compliance</span>
<span className="px-space-xs py-space-2xs rounded bg-secondary-container text-on-secondary-container font-label-sm text-label-sm">100% Guardrail</span>
</div>
<div className="flex items-baseline gap-space-sm">
<span className="font-tabular-metric text-display-lg text-on-surface">BIS Strict</span>
<span className="inline-flex items-center text-primary font-label-md text-label-md">
<span className="material-symbols-outlined text-space-base">verified</span> IS 1786 / 15622
        </span>
</div>
<p className="font-body-sm text-body-sm text-on-surface-variant mt-space-xs">All AI recommended alternatives pre-filtered against structural tender specifications.</p>
<div className="w-full bg-surface-container rounded-full h-1.5 mt-space-md overflow-hidden">
<div className="bg-tertiary h-1.5 rounded-full" style={{ width: "100%" }}></div>
</div>
</div>

<div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col justify-between relative overflow-hidden">
<div className="flex items-center justify-between mb-space-sm">
<span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary">Live Scraping Feeds</span>
<span className="px-space-xs py-space-2xs rounded bg-surface-container-high text-on-surface font-label-sm text-label-sm">8 Nodes</span>
</div>
<div className="flex items-baseline gap-space-sm">
<span className="font-tabular-metric text-display-lg text-on-surface">Online</span>
<span className="inline-flex items-center text-primary font-label-md text-label-md">
<span className="material-symbols-outlined text-space-base">speed</span> &lt; 0.4s Latency
        </span>
</div>
<p className="font-body-sm text-body-sm text-on-surface-variant mt-space-xs">Wholesale B2B indices &amp; Hyderabad factory gate invoice crawlers streaming.</p>
<div className="w-full bg-surface-container rounded-full h-1.5 mt-space-md overflow-hidden">
<div className="bg-primary h-1.5 rounded-full" style={{ width: "96%" }}></div>
</div>
</div>
</div>

<div className="flex items-center gap-space-xs overflow-x-auto pb-space-sm mb-space-md border-b-0">
<button className="flex items-center gap-space-xs px-space-md py-space-xs rounded bg-primary text-on-primary font-title-md text-title-md shrink-0 shadow-sm">
<span className="material-symbols-outlined text-space-base">view_column</span>
<span>TMT Structural Rebar (Fe 500D / 550D)</span>
<span className="ml-space-2xs px-1.5 py-0.5 rounded bg-surface-container-lowest text-primary text-label-sm font-bold">4 Brands</span>
</button>
<button className="flex items-center gap-space-xs px-space-md py-space-xs rounded bg-surface-container-lowest text-on-surface hover:bg-surface-container transition-all font-title-md text-title-md shrink-0 shadow-sm">
<span className="material-symbols-outlined text-space-base text-tertiary">grid_view</span>
<span>Vitrified &amp; Ceramic Tiles (GVT/PGVT)</span>
<span className="ml-space-2xs px-1.5 py-0.5 rounded bg-error-container text-on-error-container text-label-sm font-bold">VE Alert</span>
</button>
<button className="flex items-center gap-space-xs px-space-md py-space-xs rounded bg-surface-container-lowest text-on-surface hover:bg-surface-container transition-all font-title-md text-title-md shrink-0 shadow-sm">
<span className="material-symbols-outlined text-space-base text-secondary">domain</span>
<span>Cement (OPC 53 / PPC)</span>
<span className="ml-space-2xs px-1.5 py-0.5 rounded bg-surface-container text-secondary text-label-sm font-medium">UltraTech, Bharathi, Ramco</span>
</button>
<button className="flex items-center gap-space-xs px-space-md py-space-xs rounded bg-surface-container-lowest text-on-surface hover:bg-surface-container transition-all font-title-md text-title-md shrink-0 shadow-sm">
<span className="material-symbols-outlined text-space-base text-secondary">plumbing</span>
<span>CPVC &amp; SWR Pipes</span>
<span className="ml-space-2xs px-1.5 py-0.5 rounded bg-surface-container text-secondary text-label-sm font-medium">Ashirvad, Astral, Supreme</span>
</button>
<button className="flex items-center gap-space-xs px-space-md py-space-xs rounded bg-surface-container-lowest text-on-surface hover:bg-surface-container transition-all font-title-md text-title-md shrink-0 shadow-sm">
<span className="material-symbols-outlined text-space-base text-secondary">electrical_services</span>
<span>Electrical Cables &amp; MCBs</span>
<span className="ml-space-2xs px-1.5 py-0.5 rounded bg-surface-container text-secondary text-label-sm font-medium">Polycab, Havells, Finolex</span>
</button>
<button className="flex items-center gap-space-xs px-space-md py-space-xs rounded bg-surface-container-lowest text-on-surface hover:bg-surface-container transition-all font-title-md text-title-md shrink-0 shadow-sm">
<span className="material-symbols-outlined text-space-base text-secondary">format_paint</span>
<span>Paints &amp; Primers</span>
<span className="ml-space-2xs px-1.5 py-0.5 rounded bg-surface-container text-secondary text-label-sm font-medium">Asian Paints, Berger</span>
</button>
</div>

<div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg">

<div className="lg:col-span-8 flex flex-col gap-space-lg">

<div className="bg-surface-container-lowest rounded-xl shadow-sm p-space-lg flex flex-col">
<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm mb-space-md">
<div className="flex items-center gap-space-sm">
<div className="w-10 h-10 rounded bg-primary-container/20 text-primary flex items-center justify-center">
<span className="material-symbols-outlined text-space-lg">reorder</span>
</div>
<div>
<h2 className="font-headline-sm text-headline-sm text-on-surface">TMT Steel Rebar • Hyderabad Mandi Multi-Brand Matrix</h2>
<p className="font-body-sm text-body-sm text-on-surface-variant">Fe 500D Grade • Rate per Metric Ton (MT) • Freight to Madhapur/Balanagar included</p>
</div>
</div>
<div className="flex items-center gap-space-xs">
<span className="font-label-sm text-label-sm text-on-surface-variant">Standard Tender Spec:</span>
<span className="px-space-xs py-space-2xs rounded bg-surface-container font-label-md text-label-md text-on-surface font-semibold">TATA TISCON Fe500D</span>
</div>
</div>

<div className="overflow-x-auto rounded-lg bg-surface-container-low mb-space-md">
<table className="w-full text-left font-body-sm text-body-sm">
<thead>
<tr className="bg-surface-container text-on-surface-variant font-label-md text-label-md uppercase tracking-wider">
<th className="p-space-sm">Brand &amp; Mill Classification</th>
<th className="p-space-sm">Hyd Mandi Rate (MT)</th>
<th className="p-space-sm">Delta vs Tata</th>
<th className="p-space-sm">BIS &amp; Yield Strength</th>
<th className="p-space-sm">Saha OS Approved Structural Zone</th>
<th className="p-space-sm text-right">Quick Action</th>
</tr>
</thead>
<tbody className="divide-y-0">

<tr className="hover:bg-surface-container transition-colors">
<td className="p-space-sm">
<div className="flex items-center gap-space-sm">
<div className="w-7 h-7 rounded bg-secondary-container text-on-secondary-container flex items-center justify-center font-bold text-xs">TT</div>
<div>
<div className="font-title-md text-title-md text-on-surface flex items-center gap-1">
                        Tata Tiscon 500D
                        <span className="px-1.5 py-0.5 rounded bg-surface-container-highest text-on-surface font-label-sm text-label-sm text-[10px]">Benchmark</span>
</div>
<div className="text-on-surface-variant font-label-sm text-label-sm">Tier-1 Primary Integrated Mill • Jamshedpur</div>
</div>
</div>
</td>
<td className="p-space-sm">
<div className="font-tabular-metric text-tabular-metric text-on-surface">₹61,200</div>
<div className="text-[11px] text-on-surface-variant">+ 18% GST (₹72,216 Total)</div>
</td>
<td className="p-space-sm">
<span className="px-space-xs py-space-2xs rounded bg-surface-container text-on-surface font-label-sm text-label-sm font-semibold">Baseline (0%)</span>
</td>
<td className="p-space-sm">
<div className="font-medium text-on-surface">IS 1786:2008 Fe 500D</div>
<div className="text-[11px] text-primary">Yield 545 N/mm² • Elongation 18.5%</div>
</td>
<td className="p-space-sm">
<span className="px-space-xs py-space-2xs rounded bg-surface-container text-on-surface font-label-sm text-label-sm">High-Stress Transfer Girders &amp; Columns</span>
</td>
<td className="p-space-sm text-right">
<button className="px-space-sm py-space-2xs rounded bg-surface-container-highest text-on-surface hover:bg-surface-variant transition-colors font-label-md text-label-md">
                    Spec Locked
                  </button>
</td>
</tr>

<tr className="hover:bg-surface-container transition-colors">
<td className="p-space-sm">
<div className="flex items-center gap-space-sm">
<div className="w-7 h-7 rounded bg-tertiary-fixed text-on-tertiary-fixed flex items-center justify-center font-bold text-xs">JP</div>
<div>
<div className="font-title-md text-title-md text-on-surface flex items-center gap-1">
                        Jindal Panther
                        <span className="px-1.5 py-0.5 rounded bg-tertiary-container/30 text-tertiary font-label-sm text-label-sm text-[10px]">Tier 1 Mill</span>
</div>
<div className="text-on-surface-variant font-label-sm text-label-sm">Tier-1 Primary Integrated Mill • Bellary/Angul</div>
</div>
</div>
</td>
<td className="p-space-sm">
<div className="font-tabular-metric text-tabular-metric text-on-surface">₹58,400</div>
<div className="text-[11px] text-on-surface-variant">+ 18% GST (₹68,912 Total)</div>
</td>
<td className="p-space-sm">
<span className="px-space-xs py-space-2xs rounded bg-primary-container text-on-primary-container font-label-sm text-label-sm font-semibold">-4.57% (₹2,800/MT)</span>
</td>
<td className="p-space-sm">
<div className="font-medium text-on-surface">IS 1786:2008 Fe 500D</div>
<div className="text-[11px] text-primary">Yield 538 N/mm² • Elongation 17.8%</div>
</td>
<td className="p-space-sm">
<span className="px-space-xs py-space-2xs rounded bg-surface-container text-on-surface font-label-sm text-label-sm">Columns, Shear Walls &amp; Beams</span>
</td>
<td className="p-space-sm text-right">
<button className="px-space-sm py-space-2xs rounded bg-surface-container-highest text-on-surface hover:bg-surface-variant transition-colors font-label-md text-label-md">
                    Compare Chem
                  </button>
</td>
</tr>

<tr className="hover:bg-surface-container transition-colors">
<td className="p-space-sm">
<div className="flex items-center gap-space-sm">
<div className="w-7 h-7 rounded bg-secondary-fixed text-on-secondary-fixed flex items-center justify-center font-bold text-xs">KN</div>
<div>
<div className="font-title-md text-title-md text-on-surface flex items-center gap-1">
                        Kamdhenu Nxt PAS 10000
                        <span className="px-1.5 py-0.5 rounded bg-primary text-on-primary font-label-sm text-label-sm text-[10px]">VE Pick</span>
</div>
<div className="text-on-surface-variant font-label-sm text-label-sm">Tier-2 Certified Major Converter • Regional Yard</div>
</div>
</div>
</td>
<td className="p-space-sm">
<div className="font-tabular-metric text-tabular-metric text-primary">₹54,200</div>
<div className="text-[11px] text-on-surface-variant">+ 18% GST (₹63,956 Total)</div>
</td>
<td className="p-space-sm">
<span className="px-space-xs py-space-2xs rounded bg-primary text-on-primary font-label-sm text-label-sm font-semibold">-11.43% (₹7,000/MT)</span>
</td>
<td className="p-space-sm">
<div className="font-medium text-on-surface">IS 1786:2008 Fe 500D</div>
<div className="text-[11px] text-on-surface-variant">Yield 528 N/mm² • Elongation 16.2%</div>
</td>
<td className="p-space-sm">
<span className="px-space-xs py-space-2xs rounded bg-primary-container/20 text-primary font-label-sm text-label-sm">Beams, Raft Footing &amp; Retaining Walls</span>
</td>
<td className="p-space-sm text-right">
<button className="px-space-sm py-space-2xs rounded bg-primary text-on-primary hover:bg-primary-container transition-colors font-label-md text-label-md">
                    Apply VE
                  </button>
</td>
</tr>

<tr className="hover:bg-surface-container transition-colors">
<td className="p-space-sm">
<div className="flex items-center gap-space-sm">
<div className="w-7 h-7 rounded bg-primary-fixed-dim text-on-primary-fixed flex items-center justify-center font-bold text-xs">JS</div>
<div>
<div className="font-title-md text-title-md text-on-surface flex items-center gap-1">
                        Jairaj Steel Fe 500D
                        <span className="px-1.5 py-0.5 rounded bg-primary-container text-on-primary-container font-label-sm text-label-sm text-[10px]">Hyderabad Local Mill</span>
</div>
<div className="text-on-surface-variant font-label-sm text-label-sm">Primary Billet Route • Hyderabad Plant (Zero Long-Haul Freight)</div>
</div>
</div>
</td>
<td className="p-space-sm">
<div className="font-tabular-metric text-tabular-metric text-primary">₹51,800</div>
<div className="text-[11px] text-on-surface-variant">+ 18% GST (₹61,124 Total)</div>
</td>
<td className="p-space-sm">
<span className="px-space-xs py-space-2xs rounded bg-primary text-on-primary font-label-sm text-label-sm font-semibold">-15.35% (₹9,400/MT)</span>
</td>
<td className="p-space-sm">
<div className="font-medium text-on-surface">IS 1786 BIS Fe 500D</div>
<div className="text-[11px] text-on-surface-variant">Yield 522 N/mm² • Elongation 15.6%</div>
</td>
<td className="p-space-sm">
<span className="px-space-xs py-space-2xs rounded bg-surface-variant text-on-surface font-label-sm text-label-sm">Slab Mesh, Secondary Lintels, Staircases</span>
</td>
<td className="p-space-sm text-right">
<button className="px-space-sm py-space-2xs rounded bg-primary text-on-primary hover:bg-primary-container transition-colors font-label-md text-label-md">
                    Apply VE
                  </button>
</td>
</tr>
</tbody>
</table>
</div>

<div className="p-space-md rounded-xl bg-surface-container flex flex-col md:flex-row items-start md:items-center justify-between gap-space-md">
<div className="flex items-start gap-space-md">
<div className="p-space-xs rounded-full bg-primary text-on-primary shrink-0 mt-0.5">
<span className="material-symbols-outlined text-space-lg">auto_awesome</span>
</div>
<div>
<div className="flex items-center gap-space-xs">
<span className="font-title-md text-title-md text-on-surface font-bold">AI Hybrid Spec Recommendation: Cyber Enclave Ph-2 (Tower C)</span>
<span className="px-space-xs py-space-2xs rounded bg-primary text-on-primary font-label-sm text-label-sm">IS 456 Cl. 26.5 Compliant</span>
</div>
<p className="font-body-sm text-body-sm text-on-surface-variant mt-space-2xs max-w-2xl">
                Maintain <strong>Tata Tiscon / Jindal Panther</strong> for 120 MT of high-stress vertical columns &amp; transfer girders. Substitute with <strong>Jairaj Steel / Kamdhenu Nxt</strong> for 90 MT of slab distribution steel &amp; lintels.
                Direct procurement net saving: <strong className="text-primary font-bold">₹8,46,000</strong> without lowering structural factor of safety.
              </p>
</div>
</div>
<div className="flex items-center gap-space-xs shrink-0 w-full md:w-auto justify-end">
<button className="px-space-sm py-space-xs rounded bg-surface-container-lowest text-on-surface font-title-md text-title-md shadow-sm hover:bg-surface transition-all">
              Metallurgy Lab Tests
            </button>
<button className="px-space-md py-space-xs rounded bg-primary text-on-primary font-title-md text-title-md shadow-sm hover:bg-primary-container transition-all flex items-center gap-1">
<span className="material-symbols-outlined text-space-base">check_circle</span>
<span>Accept Hybrid Spec</span>
</button>
</div>
</div>
</div>

<div className="bg-surface-container-lowest rounded-xl shadow-sm p-space-lg flex flex-col">
<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm mb-space-md">
<div className="flex items-center gap-space-sm">
<div className="w-10 h-10 rounded bg-tertiary-container/20 text-tertiary flex items-center justify-center">
<span className="material-symbols-outlined text-space-lg">texture</span>
</div>
<div>
<h2 className="font-headline-sm text-headline-sm text-on-surface">Vitrified &amp; Ceramic Tiles • Morbi-Hyderabad B2B Benchmark</h2>
<p className="font-body-sm text-body-sm text-on-surface-variant">Size: 600x1200mm GVT (Glazed Vitrified Tile) • Living/Dining Typical Unit Finish • Rates in ₹ / Sq.Ft</p>
</div>
</div>
<div className="flex items-center gap-space-xs">
<span className="font-label-sm text-label-sm text-on-surface-variant">Tender Specified Brand:</span>
<span className="px-space-xs py-space-2xs rounded bg-surface-container font-label-md text-label-md text-on-surface font-semibold">Kajaria Eternity</span>
</div>
</div>

<div className="grid grid-cols-1 md:grid-cols-2 gap-space-md mb-space-md">

<div className="p-space-md rounded-lg bg-surface-container-low flex flex-col justify-between hover:bg-surface-container transition-all">
<div>
<div className="flex items-center justify-between">
<span className="font-title-md text-title-md text-on-surface font-bold">Kajaria Ceramics</span>
<span className="px-space-xs py-space-2xs rounded bg-surface-container text-on-surface-variant font-label-sm text-label-sm">Specified Base</span>
</div>
<div className="text-on-surface-variant font-label-sm text-label-sm mb-space-sm">National Market Leader • Depots at Somajiguda &amp; Kukatpally</div>
<div className="flex items-baseline gap-space-xs mb-space-xs">
<span className="font-tabular-metric text-headline-lg text-on-surface">₹62.50</span>
<span className="font-body-sm text-body-sm text-on-surface-variant">/ Sft (Landed Hyd)</span>
</div>
<div className="space-y-1 font-body-sm text-body-sm text-on-surface-variant">
<div className="flex justify-between">
<span>Water Absorption:</span>
<span className="font-medium text-on-surface">&lt; 0.05% (Group B1a)</span>
</div>
<div className="flex justify-between">
<span>Breaking Strength:</span>
<span className="font-medium text-on-surface">2,200 N</span>
</div>
<div className="flex justify-between">
<span>Abrasion PEI Rating:</span>
<span className="font-medium text-on-surface">Class IV (Heavy Traffic)</span>
</div>
</div>
</div>
<div className="mt-space-md pt-space-xs border-t-0 flex justify-between items-center text-on-surface-variant font-label-sm text-label-sm">
<span>Lead Time: 2 Days</span>
<span className="text-secondary font-medium">Standard Spec</span>
</div>
</div>

<div className="p-space-md rounded-lg bg-surface-container-low flex flex-col justify-between hover:bg-surface-container transition-all">
<div>
<div className="flex items-center justify-between">
<span className="font-title-md text-title-md text-on-surface font-bold">Simpolo Ceramics</span>
<span className="px-space-xs py-space-2xs rounded bg-primary-container text-on-primary-container font-label-sm text-label-sm">Save ₹3.50/sft</span>
</div>
<div className="text-on-surface-variant font-label-sm text-label-sm mb-space-sm">Tier 1 Premium • Surface High-Gloss &amp; Matte Anti-Stain</div>
<div className="flex items-baseline gap-space-xs mb-space-xs">
<span className="font-tabular-metric text-headline-lg text-primary">₹59.00</span>
<span className="font-body-sm text-body-sm text-on-surface-variant">/ Sft (-5.6% vs Kajaria)</span>
</div>
<div className="space-y-1 font-body-sm text-body-sm text-on-surface-variant">
<div className="flex justify-between">
<span>Water Absorption:</span>
<span className="font-medium text-on-surface">&lt; 0.05% (Group B1a)</span>
</div>
<div className="flex justify-between">
<span>Breaking Strength:</span>
<span className="font-medium text-on-surface">2,350 N (Superior)</span>
</div>
<div className="flex justify-between">
<span>Scratch Hardness:</span>
<span className="font-medium text-on-surface">MOHS 7</span>
</div>
</div>
</div>
<div className="mt-space-md pt-space-xs border-t-0 flex justify-between items-center text-on-surface-variant font-label-sm text-label-sm">
<span>Hyd Hub Depot: In Stock</span>
<button className="text-primary font-bold hover:underline">Select Spec</button>
</div>
</div>

<div className="p-space-md rounded-lg bg-primary/5 rounded-lg flex flex-col justify-between shadow-sm">
<div>
<div className="flex items-center justify-between">
<div className="flex items-center gap-1">
<span className="font-title-md text-title-md text-on-surface font-bold">Qutone Ceramic</span>
<span className="material-symbols-outlined text-primary text-space-base">verified</span>
</div>
<span className="px-space-xs py-space-2xs rounded bg-primary text-on-primary font-label-sm text-label-sm font-bold">AI Recommended</span>
</div>
<div className="text-on-surface-variant font-label-sm text-label-sm mb-space-sm">Direct Morbi Factory-To-Project Dispatches • Hyderabad Depot</div>
<div className="flex items-baseline gap-space-xs mb-space-xs">
<span className="font-tabular-metric text-headline-lg text-primary font-bold">₹52.00</span>
<span className="font-body-sm text-body-sm text-primary font-semibold">/ Sft (-16.8% | Save ₹10.50/sft)</span>
</div>
<div className="space-y-1 font-body-sm text-body-sm text-on-surface-variant">
<div className="flex justify-between">
<span>Water Absorption:</span>
<span className="font-medium text-on-surface">&lt; 0.06% (IS 15622 Full Pass)</span>
</div>
<div className="flex justify-between">
<span>Breaking Strength:</span>
<span className="font-medium text-on-surface">2,150 N</span>
</div>
<div className="flex justify-between">
<span>Chemical Resistance:</span>
<span className="font-medium text-on-surface">Class AA (Acid/Alkali)</span>
</div>
</div>
</div>
<div className="mt-space-md pt-space-xs border-t-0 flex justify-between items-center text-on-surface-variant font-label-sm text-label-sm">
<span className="text-primary font-medium">Batch Lab-Tested: Pass</span>
<button className="px-space-sm py-space-2xs rounded bg-primary text-on-primary font-label-md text-label-md">Apply Alternative</button>
</div>
</div>

<div className="p-space-md rounded-lg bg-surface-container-low flex flex-col justify-between hover:bg-surface-container transition-all">
<div>
<div className="flex items-center justify-between">
<span className="font-title-md text-title-md text-on-surface font-bold">H&amp;R Johnson</span>
<span className="px-space-xs py-space-2xs rounded bg-secondary-container text-on-secondary-container font-label-sm text-label-sm">Save ₹8.00/sft</span>
</div>
<div className="text-on-surface-variant font-label-sm text-label-sm mb-space-sm">Established Commercial Workhorse • Industrial Vitrified Master</div>
<div className="flex items-baseline gap-space-xs mb-space-xs">
<span className="font-tabular-metric text-headline-lg text-on-surface">₹54.50</span>
<span className="font-body-sm text-body-sm text-on-surface-variant">/ Sft (-12.8% vs Kajaria)</span>
</div>
<div className="space-y-1 font-body-sm text-body-sm text-on-surface-variant">
<div className="flex justify-between">
<span>Water Absorption:</span>
<span className="font-medium text-on-surface">&lt; 0.08% (IS 15622 Group B1a)</span>
</div>
<div className="flex justify-between">
<span>Breaking Strength:</span>
<span className="font-medium text-on-surface">2,100 N</span>
</div>
<div className="flex justify-between">
<span>Slip Resistance:</span>
<span className="font-medium text-on-surface">R10 (Anti-Skid Available)</span>
</div>
</div>
</div>
<div className="mt-space-md pt-space-xs border-t-0 flex justify-between items-center text-on-surface-variant font-label-sm text-label-sm">
<span>Sanathnagar Hub: 14,000 Sft</span>
<button className="text-primary font-bold hover:underline">Select Spec</button>
</div>
</div>
</div>

<div className="p-space-md rounded-xl bg-surface-container flex flex-col sm:flex-row items-start sm:items-center justify-between gap-space-md">
<div className="flex items-center gap-space-md">
<span className="material-symbols-outlined text-display-lg text-primary">price_change</span>
<div>
<div className="font-title-md text-title-md text-on-surface font-bold">Indent #IND-HYD-8820: 42,000 Sft Flooring (Ph-2 Typical Units)</div>
<div className="font-body-sm text-body-sm text-on-surface-variant">
                Switching Kajaria to <strong className="text-on-surface font-semibold">Qutone (or Simpolo hybrid)</strong> saves direct <strong className="text-primary font-bold">₹4,41,000</strong>. Physical visual sample mockups delivered at Madhapur site store.
              </div>
</div>
</div>
<div className="flex items-center gap-space-xs shrink-0">
<button className="px-space-md py-space-xs rounded bg-surface-container-lowest text-on-surface font-title-md text-title-md shadow-sm hover:bg-surface transition-all">
              Request Sample Kit
            </button>
<button className="px-space-md py-space-xs rounded bg-primary text-on-primary font-title-md text-title-md shadow-sm hover:bg-primary-container transition-all">
              Generate Spec Equivalent Form
            </button>
</div>
</div>
</div>
</div>

<div className="lg:col-span-4 flex flex-col gap-space-lg">

<div className="bg-surface-container-lowest rounded-xl shadow-sm p-space-lg flex flex-col">
<div className="flex items-center justify-between mb-space-md">
<div className="flex items-center gap-space-xs">
<span className="material-symbols-outlined text-primary text-space-base">radar</span>
<h3 className="font-headline-sm text-headline-sm text-on-surface">Regional Mandi Feeds</h3>
</div>
<span className="px-space-xs py-space-2xs rounded bg-primary text-on-primary font-label-sm text-label-sm animate-pulse">Streaming</span>
</div>

<div className="space-y-space-sm">
<div className="p-space-sm rounded-lg bg-surface-container-low flex flex-col gap-space-2xs">
<div className="flex items-center justify-between">
<span className="font-title-md text-title-md text-on-surface">Jindal Steel • Angul-Hyd Rail Yard</span>
<span className="font-label-sm text-label-sm text-primary font-semibold">Live Price</span>
</div>
<div className="flex items-center justify-between text-on-surface-variant font-body-sm text-body-sm">
<span>Source: SteelMint Mandi API</span>
<span className="font-tabular-metric-sm text-on-surface font-bold">₹58,400 / MT</span>
</div>
<div className="flex items-center justify-between font-label-sm text-label-sm pt-space-2xs border-t-0">
<span className="text-on-surface-variant">7-day change: <strong className="text-primary">-₹650 (-1.1%)</strong></span>

<svg className="w-20 h-4" fill="none" viewBox="0 0 100 20">
<path className="text-primary" d="M0 16 L20 14 L40 18 L60 10 L80 12 L100 4" stroke="currentColor" strokeLinecap="round" strokeWidth="2"></path>
</svg>
</div>
</div>

<div className="p-space-sm rounded-lg bg-surface-container-low flex flex-col gap-space-2xs">
<div className="flex items-center justify-between">
<span className="font-title-md text-title-md text-on-surface">Jairaj Steel • Bonthapally Plant Gate</span>
<span className="font-label-sm text-label-sm text-primary font-semibold">Direct Mill</span>
</div>
<div className="flex items-center justify-between text-on-surface-variant font-body-sm text-body-sm">
<span>Source: Wholesale Depot Invoicing</span>
<span className="font-tabular-metric-sm text-on-surface font-bold">₹51,800 / MT</span>
</div>
<div className="flex items-center justify-between font-label-sm text-label-sm pt-space-2xs border-t-0">
<span className="text-on-surface-variant">7-day change: <strong className="text-primary">-₹1,200 (-2.2%)</strong></span>

<svg className="w-20 h-4" fill="none" viewBox="0 0 100 20">
<path className="text-primary" d="M0 18 L25 15 L50 14 L75 9 L100 5" stroke="currentColor" strokeLinecap="round" strokeWidth="2"></path>
</svg>
</div>
</div>

<div className="p-space-sm rounded-lg bg-surface-container-low flex flex-col gap-space-2xs">
<div className="flex items-center justify-between">
<span className="font-title-md text-title-md text-on-surface">Morbi Tiles B2B Exchange</span>
<span className="font-label-sm text-label-sm text-secondary font-semibold">Freight + Gate</span>
</div>
<div className="flex items-center justify-between text-on-surface-variant font-body-sm text-body-sm">
<span>Source: Ceramic Chamber of Commerce</span>
<span className="font-tabular-metric-sm text-on-surface font-bold">₹48.00 + ₹4 Freight</span>
</div>
<div className="flex items-center justify-between font-label-sm text-label-sm pt-space-2xs border-t-0">
<span className="text-on-surface-variant">7-day trend: <strong className="text-on-surface">Stable (±0.2%)</strong></span>

<svg className="w-20 h-4" fill="none" viewBox="0 0 100 20">
<path className="text-secondary" d="M0 10 L25 10 L50 9 L75 11 L100 10" stroke="currentColor" strokeLinecap="round" strokeWidth="2"></path>
</svg>
</div>
</div>

<div className="p-space-sm rounded-lg bg-surface-container-low flex flex-col gap-space-2xs">
<div className="flex items-center justify-between">
<span className="font-title-md text-title-md text-on-surface">Cement Hyderabad Mandi</span>
<span className="font-label-sm text-label-sm text-error font-semibold">Upward</span>
</div>
<div className="flex items-center justify-between text-on-surface-variant font-body-sm text-body-sm">
<span>UltraTech OPC 53 • Nacharam Railhead</span>
<span className="font-tabular-metric-sm text-on-surface font-bold">₹375 / Bag</span>
</div>
<div className="flex items-center justify-between font-label-sm text-label-sm pt-space-2xs border-t-0">
<span className="text-on-surface-variant">7-day change: <strong className="text-error">+₹15 (+4.1%)</strong></span>

<svg className="w-20 h-4" fill="none" viewBox="0 0 100 20">
<path className="text-error" d="M0 16 L20 15 L40 14 L60 10 L80 6 L100 2" stroke="currentColor" strokeLinecap="round" strokeWidth="2"></path>
</svg>
</div>
</div>
</div>
</div>

<div className="bg-surface-container-lowest rounded-xl shadow-sm p-space-lg flex flex-col">
<div className="flex items-center justify-between mb-space-md">
<div className="flex items-center gap-space-xs">
<span className="material-symbols-outlined text-primary text-space-base">tune</span>
<h3 className="font-headline-sm text-headline-sm text-on-surface">Auto-VE Guardrails</h3>
</div>
<span className="font-label-sm text-label-sm text-on-surface-variant">Active Rules</span>
</div>
<div className="space-y-space-md">

<div className="p-space-sm rounded bg-surface-container-low flex items-start gap-space-sm">
<span className="material-symbols-outlined text-primary text-space-base shrink-0 mt-0.5">toggle_on</span>
<div className="flex flex-col flex-1">
<span className="font-title-md text-title-md text-on-surface font-semibold">Tier Delta &gt; 12% Auto-Alert</span>
<p className="font-body-sm text-body-sm text-on-surface-variant">When secondary/regional BIS brand price delta exceeds 12% vs Tata/Jindal, flag indent for value engineering approval.</p>
<div className="mt-space-2xs flex items-center justify-between font-label-sm text-label-sm">
<span className="text-primary font-bold">Status: Triggered (Delta 15.35%)</span>
<span className="text-on-surface-variant">Jairaj Rebar</span>
</div>
</div>
</div>

<div className="p-space-sm rounded bg-surface-container-low flex items-start gap-space-sm">
<span className="material-symbols-outlined text-primary text-space-base shrink-0 mt-0.5">toggle_on</span>
<div className="flex flex-col flex-1">
<span className="font-title-md text-title-md text-on-surface font-semibold">Architectural Non-Structural Fallback</span>
<p className="font-body-sm text-body-sm text-on-surface-variant">Auto-suggest Qutone/Simpolo whenever Kajaria quoted rate exceeds ₹60/sft on non-commercial projects.</p>
<div className="mt-space-2xs flex items-center justify-between font-label-sm text-label-sm">
<span className="text-primary font-bold">Status: Triggered (Kajaria @ ₹62.50)</span>
<span className="text-on-surface-variant">Qutone Suggested</span>
</div>
</div>
</div>

<div className="p-space-sm rounded bg-surface-container-low flex items-start gap-space-sm">
<span className="material-symbols-outlined text-secondary text-space-base shrink-0 mt-0.5">toggle_on</span>
<div className="flex flex-col flex-1">
<span className="font-title-md text-title-md text-on-surface font-semibold">Strict IS Code Hard Stop</span>
<p className="font-body-sm text-body-sm text-on-surface-variant">Block any secondary brand quotation that lacks online BIS License verification or third-party NABL test certificate.</p>
<div className="mt-space-2xs flex items-center justify-between font-label-sm text-label-sm">
<span className="text-primary font-bold">142 / 142 Brands Verified</span>
<span className="text-on-surface-variant">Zero Violations</span>
</div>
</div>
</div>
</div>
<button className="mt-space-md w-full py-space-xs rounded bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors font-title-md text-title-md text-center">
          + Add New Value Engineering Rule
        </button>
</div>

<div className="p-space-lg rounded-xl bg-primary text-on-primary flex flex-col justify-between shadow-sm">
<div>
<div className="flex items-center gap-space-xs mb-space-2xs">
<span className="material-symbols-outlined text-space-lg">handshake</span>
<span className="font-headline-sm text-headline-sm font-bold">Push VE To Purchase Order</span>
</div>
<p className="font-body-sm text-body-sm opacity-90 mb-space-md">
            Execute ₹12,87,000 procurement savings directly into pending ERP PO #PO-HYD-2024-091 with automated structural engineer endorsement.
          </p>
</div>
<div className="flex flex-col gap-space-xs">
<div className="flex justify-between font-label-sm text-label-sm opacity-80 pb-space-2xs border-b-0">
<span>Project:</span>
<span className="font-bold">Cyber Enclave Phase 2 (Tower C)</span>
</div>
<button className="w-full py-space-xs rounded bg-surface-container-lowest text-on-surface font-title-md text-title-md shadow-sm hover:bg-surface transition-all flex items-center justify-center gap-1">
<span className="material-symbols-outlined text-space-base text-primary">send</span>
<span>Approve &amp; Send to Billing</span>
</button>
</div>
</div>
</div>
</div>


</div></main></div>
    </div>
  );
}
