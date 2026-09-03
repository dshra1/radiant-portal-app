import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/projects-setup")({
  head: () => ({
    meta: [
      { title: "Project Setup & Structural Geometry Wizard | Saha OS" },
      { name: "description", content: "Configure project identity, floor geometry and CAD drawing ingestion." },
      { property: "og:title", content: "Project Setup & Structural Geometry Wizard | Saha OS" },
      { property: "og:description", content: "Configure project identity, floor geometry and CAD drawing ingestion." },
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

<div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md mb-space-lg">
<div className="flex flex-col">
<div className="flex items-center gap-space-xs font-label-md text-label-md text-on-surface-variant mb-space-2xs">
<a className="hover:text-primary transition-colors" href="#">Projects</a>
<span className="material-symbols-outlined text-space-sm leading-none">chevron_right</span>
<span className="text-on-surface-variant font-medium">New Project Setup</span>
<span className="material-symbols-outlined text-space-sm leading-none">chevron_right</span>
<span className="text-primary font-semibold">Cyber Enclave (Madhapur)</span>
</div>
<div className="flex items-center gap-space-sm">
<h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">Project Setup &amp; Structural Geometry Wizard</h1>
<span className="px-space-xs py-space-2xs rounded bg-surface-container-high text-tertiary font-label-sm text-label-sm uppercase font-bold tracking-wider">Civil Matrix Engine v3.4</span>
</div>
</div>

<div className="flex items-center gap-space-sm self-start md:self-auto">
<div className="flex items-center gap-space-xs bg-surface-container-lowest px-space-md py-space-xs rounded shadow-sm">
<span className="relative flex h-2 w-2">
<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
<span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
</span>
<span className="font-label-md text-label-md text-on-surface">Auto-Derivation: <span className="text-primary font-bold">Synchronized</span></span>
</div>
<button className="flex items-center gap-space-xs px-space-md py-space-xs rounded bg-surface-container-lowest text-on-surface hover:bg-surface-container transition-colors font-title-md text-title-md shadow-sm">
<span className="material-symbols-outlined text-space-base leading-none text-on-surface-variant">history</span>
<span>Version 1.02</span>
</button>
</div>
</div>

<div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm mb-space-xl">
<div className="grid grid-cols-1 md:grid-cols-4 gap-space-sm relative">

<div className="flex items-center gap-space-sm p-space-sm rounded-lg bg-surface-container-low transition-colors">
<div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary text-on-primary font-label-md text-label-md">
<span className="material-symbols-outlined text-space-base leading-none">check</span>
</div>
<div className="flex flex-col min-w-0">
<span className="font-label-sm text-label-sm uppercase tracking-wider text-primary font-bold">Step 01</span>
<span className="font-title-md text-title-md text-on-surface truncate">Project Info &amp; Location</span>
</div>
</div>

<div className="flex items-center gap-space-sm p-space-sm rounded-lg bg-primary-container text-on-primary-container shadow-sm transition-colors">
<div className="flex items-center justify-center w-7 h-7 rounded-full bg-surface-container-lowest text-primary font-label-md text-label-md font-bold">
          2
        </div>
<div className="flex flex-col min-w-0">
<span className="font-label-sm text-label-sm uppercase tracking-wider text-on-primary-container/80 font-bold">Step 02 • Active</span>
<span className="font-title-md text-title-md text-on-primary-container truncate font-bold">Building Geometry &amp; SFT</span>
</div>
</div>

<div className="flex items-center gap-space-sm p-space-sm rounded-lg bg-surface-container-low/60 transition-colors opacity-80">
<div className="flex items-center justify-center w-7 h-7 rounded-full bg-surface-container text-on-surface-variant font-label-md text-label-md font-bold">
          3
        </div>
<div className="flex flex-col min-w-0">
<span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold">Step 03</span>
<span className="font-title-md text-title-md text-on-surface truncate">Drawing Notes &amp; CAD</span>
</div>
</div>

<div className="flex items-center gap-space-sm p-space-sm rounded-lg bg-surface-container-low/60 transition-colors opacity-80">
<div className="flex items-center justify-center w-7 h-7 rounded-full bg-surface-container text-on-surface-variant font-label-md text-label-md font-bold">
          4
        </div>
<div className="flex flex-col min-w-0">
<span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold">Step 04</span>
<span className="font-title-md text-title-md text-on-surface truncate">Milestones &amp; BOQ Output</span>
</div>
</div>
</div>
</div>

<div className="grid grid-cols-1 lg:grid-cols-12 gap-space-xl items-start mb-space-2xl">

<div className="lg:col-span-5 flex flex-col gap-space-xl">

<div className="bg-surface-container-lowest p-space-xl rounded-xl shadow-sm flex flex-col gap-space-lg">
<div className="flex items-center justify-between pb-space-sm">
<div className="flex items-center gap-space-sm">
<div className="p-space-xs rounded bg-surface-container text-primary">
<span className="material-symbols-outlined leading-none text-space-lg">domain</span>
</div>
<div>
<h2 className="font-headline-sm text-headline-sm text-on-surface">Project Identity &amp; Master Metadata</h2>
<p className="font-body-sm text-body-sm text-on-surface-variant">Core civil registry and target contract parameters</p>
</div>
</div>
<span className="px-space-xs py-space-2xs rounded bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm font-semibold">PRJ-HYD-044</span>
</div>
<div className="space-y-space-md">

<div className="flex flex-col gap-space-2xs">
<label className="font-label-md text-label-md text-on-surface font-semibold flex items-center justify-between">
<span>Project Name</span>
<span className="text-on-surface-variant font-normal font-label-sm text-label-sm">Official RERA Name</span>
</label>
<input className="w-full px-space-md py-space-xs rounded bg-surface-container-low text-on-surface font-body-md text-body-md focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary focus:outline-none transition-all" type="text" defaultValue="Cyber Enclave - Phase 2" />
<span className="font-body-sm text-body-sm text-on-surface-variant">Subtitle: Multi-Unit Luxury Residential Development</span>
</div>

<div className="flex flex-col gap-space-2xs">
<label className="font-label-md text-label-md text-on-surface font-semibold">Location &amp; Geozoning</label>
<div className="relative flex items-center">
<span className="material-symbols-outlined absolute left-space-md text-on-surface-variant leading-none text-space-base">location_on</span>
<input className="w-full pl-10 pr-space-md py-space-xs rounded bg-surface-container-low text-on-surface font-body-md text-body-md focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary focus:outline-none transition-all" type="text" defaultValue="Madhapur, Hyderabad, Telangana, India" />
</div>
<div className="flex items-center gap-space-xs text-tertiary font-label-sm text-label-sm mt-space-2xs">
<span className="material-symbols-outlined leading-none text-space-sm">info</span>
<span>GHMC Municipal Circle 20 (Serilingampally) • Seismic Zone II</span>
</div>
</div>

<div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md pt-space-xs">
<div className="flex flex-col gap-space-2xs">
<label className="font-label-md text-label-md text-on-surface font-semibold">Project Typology</label>
<select className="w-full px-space-md py-space-xs rounded bg-surface-container-low text-on-surface font-body-md text-body-md focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary focus:outline-none transition-all cursor-pointer">
<option>Apartment Building</option>
<option>Gated Villa Community</option>
<option>Commercial Office Tower</option>
<option>Mixed-Use Retail/Office</option>
</select>
</div>
<div className="flex flex-col gap-space-2xs">
<label className="font-label-md text-label-md text-on-surface font-semibold">Total Habitable Units</label>
<div className="relative flex items-center">
<input className="w-full px-space-md py-space-xs rounded bg-surface-container-low text-on-surface font-body-md text-body-md focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary focus:outline-none transition-all" id="inputTotalUnits" type="number" defaultValue="20" />
<span className="absolute right-space-md text-on-surface-variant font-label-sm text-label-sm">4 units/floor</span>
</div>
</div>
</div>

<div className="flex flex-col gap-space-2xs pt-space-xs">
<label className="font-label-md text-label-md text-on-surface font-semibold flex justify-between items-center">
<span>Target Construction Budget</span>
<span className="text-primary font-bold font-label-sm text-label-sm">Target ₹2,500/SFT</span>
</label>
<div className="relative flex items-center">
<span className="material-symbols-outlined absolute left-space-md text-primary leading-none text-space-base">currency_rupee</span>
<input className="w-full pl-10 pr-space-md py-space-xs rounded bg-surface-container-low text-on-surface font-headline-sm text-headline-sm font-bold tracking-tight focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary focus:outline-none transition-all" type="text" defaultValue="3,00,00,000" />
<span className="absolute right-space-md font-label-md text-label-md px-space-xs py-space-2xs rounded bg-primary text-on-primary font-semibold">₹3.00 Cr</span>
</div>
<p className="font-body-sm text-body-sm text-on-surface-variant">Excludes land acquisition cost and pre-construction licensing fees.</p>
</div>
</div>
</div>

<div className="bg-surface-container-lowest p-space-xl rounded-xl shadow-sm flex flex-col gap-space-lg">
<div className="flex items-center justify-between pb-space-sm">
<div className="flex items-center gap-space-sm">
<div className="p-space-xs rounded bg-surface-container text-tertiary">
<span className="material-symbols-outlined leading-none text-space-lg">architecture</span>
</div>
<div>
<h2 className="font-headline-sm text-headline-sm text-on-surface">Drawing Ingestion &amp; CAD Extractor</h2>
<p className="font-body-sm text-body-sm text-on-surface-variant">OCR parsing and structural schedule rules</p>
</div>
</div>
<span className="px-space-xs py-space-2xs rounded bg-surface-container-low text-tertiary font-label-sm text-label-sm font-semibold flex items-center gap-space-2xs">
<span className="material-symbols-outlined text-space-sm leading-none">auto_awesome</span>
            AI OCR Active
          </span>
</div>
<div className="space-y-space-md">

<div className="flex flex-col gap-space-2xs">
<label className="font-label-md text-label-md text-on-surface font-semibold flex items-center justify-between">
<span>Drawing Parsing Directives &amp; Internal Notes</span>
<span className="text-on-surface-variant font-label-sm text-label-sm font-normal">Auto-indexes to Stage BOQs</span>
</label>
<textarea className="w-full p-space-md rounded bg-surface-container-low text-on-surface font-body-sm text-body-sm leading-relaxed focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary focus:outline-none transition-all" rows="4">Windows shown as blue rectangles; doors are 3'x7' single-leaf flush doors. Each typical floor has 4 3BHK units with 8 doors + 12 windows per unit. Roof has open terrace slab with 3' parapet wall and overhead water tank, no internal partition walls.</textarea>
</div>

<div className="flex flex-col gap-space-sm">
<label className="font-label-md text-label-md text-on-surface font-semibold">Attached Architectural &amp; Structural Assets</label>
<div className="flex flex-col gap-space-xs">

<div className="flex items-center justify-between p-space-sm rounded bg-surface-container-low hover:bg-surface-container transition-colors">
<div className="flex items-center gap-space-sm min-w-0">
<span className="material-symbols-outlined text-tertiary text-space-lg leading-none">layers</span>
<div className="flex flex-col min-w-0">
<span className="font-title-md text-title-md text-on-surface truncate">architectural_floorplan_v3.dwg</span>
<span className="font-label-sm text-label-sm text-on-surface-variant">14.8 MB • Extracted 12 layers • Layer: WALL_STRUCT</span>
</div>
</div>
<div className="flex items-center gap-space-xs shrink-0">
<span className="px-space-xs py-space-2xs rounded bg-primary-container text-on-primary-container font-label-sm text-label-sm">Parsed</span>
<button className="p-space-2xs text-on-surface-variant hover:text-error transition-colors">
<span className="material-symbols-outlined text-space-base leading-none">delete</span>
</button>
</div>
</div>

<div className="flex items-center justify-between p-space-sm rounded bg-surface-container-low hover:bg-surface-container transition-colors">
<div className="flex items-center gap-space-sm min-w-0">
<span className="material-symbols-outlined text-error text-space-lg leading-none">picture_as_pdf</span>
<div className="flex flex-col min-w-0">
<span className="font-title-md text-title-md text-on-surface truncate">structural_framing_plan.pdf</span>
<span className="font-label-sm text-label-sm text-on-surface-variant">8.4 MB • Column grid C1-C18 • Beams B1-B34</span>
</div>
</div>
<div className="flex items-center gap-space-xs shrink-0">
<span className="px-space-xs py-space-2xs rounded bg-primary-container text-on-primary-container font-label-sm text-label-sm">Parsed</span>
<button className="p-space-2xs text-on-surface-variant hover:text-error transition-colors">
<span className="material-symbols-outlined text-space-base leading-none">delete</span>
</button>
</div>
</div>
</div>

<button className="flex items-center justify-center gap-space-sm py-space-md px-space-base rounded bg-surface-container-low hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-all">
<span className="material-symbols-outlined text-space-base leading-none">upload_file</span>
<span className="font-title-md text-title-md">Drop revisions or click to attach (DWG, DXF, PDF up to 100MB)</span>
</button>
</div>
</div>
</div>
</div>

<div className="lg:col-span-7 flex flex-col gap-space-xl">

<div className="bg-surface-container-lowest p-space-xl rounded-xl shadow-sm relative overflow-hidden">

<div className="absolute -right-12 -top-12 w-48 h-48 rounded-full bg-primary/5 blur-2xl pointer-events-none"></div>
<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm pb-space-lg">
<div className="flex items-center gap-space-sm">
<div className="p-space-xs rounded bg-primary text-on-primary">
<span className="material-symbols-outlined leading-none text-space-lg">apartment</span>
</div>
<div>
<h2 className="font-headline-md text-headline-md text-on-surface font-bold tracking-tight">Building Breakdown &amp; Structural Geometry Engine</h2>
<p className="font-body-sm text-body-sm text-on-surface-variant">Configures structural floor count, casting boundaries, and concrete volumes</p>
</div>
</div>
<div className="flex items-center gap-space-xs px-space-sm py-space-xs rounded-full bg-primary-container/10 text-primary self-start sm:self-auto">
<span className="material-symbols-outlined text-space-base leading-none animate-spin" style={{ animationDuration: "6s" }}>cyclone</span>
<span className="font-label-sm text-label-sm font-bold uppercase tracking-wider">Dynamic Formula Active</span>
</div>
</div>

<div className="grid grid-cols-1 sm:grid-cols-2 gap-space-lg mb-space-xl">

<div className="flex flex-col p-space-md rounded-xl bg-surface-container-low transition-all">
<div className="flex items-center justify-between mb-space-2xs">
<label className="font-label-md text-label-md text-on-surface font-bold" htmlFor="inputSlabSft">Single-Floor Slab (SFT)</label>
<span className="font-label-sm text-label-sm px-space-xs py-space-2xs rounded bg-surface-container text-primary font-bold">Footprint</span>
</div>
<div className="relative flex items-center my-space-xs">
<input className="w-full px-space-md py-space-xs rounded bg-surface-container-lowest text-on-surface font-headline-md text-headline-md font-bold focus:outline-none focus:ring-2 focus:ring-primary transition-all" id="inputSlabSft" type="number" defaultValue="2000" />
<span className="absolute right-space-md font-label-md text-label-md text-on-surface-variant font-bold">SQ FT</span>
</div>
<span className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-space-2xs mt-space-2xs">
<span className="material-symbols-outlined text-space-sm leading-none text-primary">draw</span>
<span>From drawing — ONE floor slab boundary</span>
</span>
</div>

<div className="flex flex-col p-space-md rounded-xl bg-surface-container-low transition-all">
<div className="flex items-center justify-between mb-space-2xs">
<label className="font-label-md text-label-md text-on-surface font-bold" htmlFor="inputCellarFloors">Cellar Floors (Basement)</label>
<span className="font-label-sm text-label-sm px-space-xs py-space-2xs rounded bg-surface-container text-secondary font-bold">Substructure</span>
</div>
<div className="relative flex items-center my-space-xs">
<input className="w-full px-space-md py-space-xs rounded bg-surface-container-lowest text-on-surface font-headline-md text-headline-md font-bold focus:outline-none focus:ring-2 focus:ring-primary transition-all" id="inputCellarFloors" min="0" type="number" defaultValue="0" />
<span className="absolute right-space-md font-label-md text-label-md text-on-surface-variant font-bold">LEVELS</span>
</div>
<span className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-space-2xs mt-space-2xs">
<span className="material-symbols-outlined text-space-sm leading-none text-secondary">foundation</span>
<span>Basement / semi-basement excavation</span>
</span>
</div>

<div className="flex flex-col p-space-md rounded-xl bg-surface-container-low transition-all">
<div className="flex items-center justify-between mb-space-2xs">
<label className="font-label-md text-label-md text-on-surface font-bold" htmlFor="inputStiltFloors">Parking / Stilt Floors</label>
<span className="font-label-sm text-label-sm px-space-xs py-space-2xs rounded bg-surface-container text-tertiary font-bold">Grade</span>
</div>
<div className="relative flex items-center my-space-xs">
<input className="w-full px-space-md py-space-xs rounded bg-surface-container-lowest text-on-surface font-headline-md text-headline-md font-bold focus:outline-none focus:ring-2 focus:ring-primary transition-all" id="inputStiltFloors" min="0" type="number" defaultValue="1" />
<span className="absolute right-space-md font-label-md text-label-md text-on-surface-variant font-bold">LEVELS</span>
</div>
<span className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-space-2xs mt-space-2xs">
<span className="material-symbols-outlined text-space-sm leading-none text-tertiary">local_parking</span>
<span>Open stilt parking — columns, no structural brick walls</span>
</span>
</div>

<div className="flex flex-col p-space-md rounded-xl bg-surface-container-low transition-all">
<div className="flex items-center justify-between mb-space-2xs">
<label className="font-label-md text-label-md text-on-surface font-bold" htmlFor="inputTypicalFloors">Sellable / Typical Floors</label>
<span className="font-label-sm text-label-sm px-space-xs py-space-2xs rounded bg-surface-container text-primary font-bold">Superstructure</span>
</div>
<div className="relative flex items-center my-space-xs">
<input className="w-full px-space-md py-space-xs rounded bg-surface-container-lowest text-on-surface font-headline-md text-headline-md font-bold focus:outline-none focus:ring-2 focus:ring-primary transition-all" id="inputTypicalFloors" min="1" type="number" defaultValue="5" />
<span className="absolute right-space-md font-label-md text-label-md text-on-surface-variant font-bold">LEVELS</span>
</div>
<span className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-space-2xs mt-space-2xs">
<span className="material-symbols-outlined text-space-sm leading-none text-primary">holiday_village</span>
<span>Habitable apartment floors 1 to 5</span>
</span>
</div>
</div>

<div className="p-space-lg rounded-xl bg-surface-container-low mb-space-xl">
<div className="flex items-center justify-between mb-space-md">
<div className="flex items-center gap-space-xs">
<span className="material-symbols-outlined text-primary text-space-base leading-none">calculate</span>
<span className="font-label-sm text-label-sm font-bold uppercase tracking-wider text-on-surface">Calculated Civil Quantities</span>
</div>
<span className="font-label-sm text-label-sm text-on-surface-variant">IS 456:2000 Structural Estimation Model</span>
</div>
<div className="grid grid-cols-2 sm:grid-cols-3 gap-space-md">

<div className="flex flex-col p-space-sm rounded-lg bg-surface-container-lowest shadow-sm">
<span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Total Floors</span>
<div className="flex items-baseline gap-space-xs mt-space-2xs">
<span className="font-tabular-metric text-tabular-metric text-on-surface" id="metricTotalFloors">6</span>
<span className="font-label-sm text-label-sm text-on-surface-variant">Floors</span>
</div>
<span className="font-body-sm text-body-sm text-primary font-medium mt-space-2xs truncate" id="metricFloorBreakdown">1 Stilt + 5 Typical</span>
</div>

<div className="flex flex-col p-space-sm rounded-lg bg-surface-container-lowest shadow-sm">
<span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Slab Count (+ Terrace)</span>
<div className="flex items-baseline gap-space-xs mt-space-2xs">
<span className="font-tabular-metric text-tabular-metric text-primary" id="metricSlabCount">7</span>
<span className="font-label-sm text-label-sm text-on-surface-variant">Slabs</span>
</div>
<span className="font-body-sm text-body-sm text-on-surface-variant mt-space-2xs truncate">Stilt top, F1-5 + Terrace</span>
</div>

<div className="flex flex-col p-space-sm rounded-lg bg-surface-container-lowest shadow-sm">
<span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Total Built-up Area</span>
<div className="flex items-baseline gap-space-xs mt-space-2xs">
<span className="font-tabular-metric text-tabular-metric text-on-surface" id="metricBuiltupArea">12,000</span>
<span className="font-label-sm text-label-sm text-on-surface-variant">SFT</span>
</div>
<span className="font-body-sm text-body-sm text-on-surface-variant mt-space-2xs truncate" id="metricBuiltupCalc">6 floors × 2,000 SFT</span>
</div>

<div className="flex flex-col p-space-sm rounded-lg bg-surface-container-lowest shadow-sm">
<span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Slab Casting Area</span>
<div className="flex items-baseline gap-space-xs mt-space-2xs">
<span className="font-tabular-metric text-tabular-metric text-on-surface" id="metricCastingArea">14,000</span>
<span className="font-label-sm text-label-sm text-on-surface-variant">SFT</span>
</div>
<span className="font-body-sm text-body-sm text-on-surface-variant mt-space-2xs truncate" id="metricCastingCalc">7 slabs × 2,000 SFT</span>
</div>

<div className="flex flex-col p-space-sm rounded-lg bg-surface-container-lowest shadow-sm">
<span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Concrete Volume (M25)</span>
<div className="flex items-baseline gap-space-xs mt-space-2xs">
<span className="font-tabular-metric text-tabular-metric text-tertiary" id="metricConcreteVol">~490</span>
<span className="font-label-sm text-label-sm text-on-surface-variant">CUM</span>
</div>
<span className="font-body-sm text-body-sm text-on-surface-variant mt-space-2xs truncate">@ 5″ slab + beams + col</span>
</div>

<div className="flex flex-col p-space-sm rounded-lg bg-surface-container-lowest shadow-sm">
<span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Estimated TMT Rebar</span>
<div className="flex items-baseline gap-space-xs mt-space-2xs">
<span className="font-tabular-metric text-tabular-metric text-on-surface" id="metricRebarWeight">~42</span>
<span className="font-label-sm text-label-sm text-on-surface-variant">MT</span>
</div>
<span className="font-body-sm text-body-sm text-on-surface-variant mt-space-2xs truncate">@ 3.0 kg/SFT structural density</span>
</div>
</div>
</div>

<div className="flex flex-col gap-space-md">
<div className="flex items-center justify-between">
<div className="flex items-center gap-space-xs">
<span className="material-symbols-outlined text-primary text-space-base leading-none">account_tree</span>
<h3 className="font-title-md text-title-md text-on-surface font-bold">Automated 14-Stage Schedule Calibration</h3>
</div>
<span className="font-label-sm text-label-sm text-primary font-bold">14 Stages Configured</span>
</div>

<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-space-sm">

<div className="p-space-sm rounded-lg bg-surface-container-low flex flex-col gap-space-2xs">
<div className="flex items-center justify-between">
<span className="font-label-sm text-label-sm font-bold text-primary">Stage 01</span>
<span className="material-symbols-outlined text-space-sm leading-none text-on-surface-variant">check_circle</span>
</div>
<span className="font-title-md text-title-md text-on-surface truncate">Substructure</span>
<span className="font-body-sm text-body-sm text-on-surface-variant">Piling &amp; Footings (18 Col)</span>
</div>

<div className="p-space-sm rounded-lg bg-primary/10 flex flex-col gap-space-2xs">
<div className="flex items-center justify-between">
<span className="font-label-sm text-label-sm font-bold text-primary">Stage 07</span>
<span className="px-space-2xs py-0.5 rounded bg-primary text-on-primary font-label-sm text-[10px] uppercase font-bold">7 Slabs</span>
</div>
<span className="font-title-md text-title-md text-on-surface truncate font-bold">RCC Superstructure</span>
<span className="font-body-sm text-body-sm text-on-surface-variant" id="badgeStageRCC">14,000 SFT pour cards</span>
</div>

<div className="p-space-sm rounded-lg bg-surface-container-low flex flex-col gap-space-2xs">
<div className="flex items-center justify-between">
<span className="font-label-sm text-label-sm font-bold text-tertiary">Stage 10</span>
<span className="font-label-sm text-label-sm text-on-surface-variant">20 Flats</span>
</div>
<span className="font-title-md text-title-md text-on-surface truncate">MEP In-Wall Rough-in</span>
<span className="font-body-sm text-body-sm text-on-surface-variant">Concealed conduits &amp; pipes</span>
</div>

<div className="p-space-sm rounded-lg bg-surface-container-low flex flex-col gap-space-2xs">
<div className="flex items-center justify-between">
<span className="font-label-sm text-label-sm font-bold text-secondary">Stage 14</span>
<span className="font-label-sm text-label-sm text-on-surface-variant">Final QA</span>
</div>
<span className="font-title-md text-title-md text-on-surface truncate">Snagging &amp; Handover</span>
<span className="font-body-sm text-body-sm text-on-surface-variant">Terrace waterproofing check</span>
</div>
</div>

<div className="flex flex-col gap-space-2xs pt-space-xs">
<div className="flex items-center justify-between font-label-sm text-label-sm text-on-surface-variant">
<span>Dynamic Construction Milestones Alignment</span>
<span className="text-primary font-bold">Ready to Compile BOQ</span>
</div>
<div className="flex items-center gap-0.5 w-full h-2 rounded-full overflow-hidden bg-surface-container">
<div className="h-full bg-primary flex-1"></div>
<div className="h-full bg-primary flex-1"></div>
<div className="h-full bg-primary flex-1"></div>
<div className="h-full bg-primary-container flex-1 animate-pulse"></div>
<div className="h-full bg-surface-container-highest flex-1"></div>
<div className="h-full bg-surface-container-highest flex-1"></div>
<div className="h-full bg-surface-container-highest flex-1"></div>
</div>
</div>
</div>
</div>
</div>
</div>

<div className="sticky bottom-4 z-30 bg-surface-container-lowest p-space-base rounded-xl shadow-xl flex flex-col sm:flex-row items-center justify-between gap-space-base">
<div className="flex items-center gap-space-sm">
<div className="flex items-center gap-space-xs text-on-surface-variant font-label-md text-label-md">
<span className="material-symbols-outlined text-primary text-space-base leading-none">check_circle</span>
<span>Validation: SFT &amp; Floor Geometry Constraints Verified</span>
</div>
<span className="hidden md:inline-block text-outline-variant">•</span>
<span className="hidden md:inline-block font-label-sm text-label-sm text-on-surface-variant">Last autosaved 12s ago</span>
</div>
<div className="flex items-center gap-space-sm w-full sm:w-auto justify-end">
<button className="px-space-md py-space-xs rounded bg-surface-container-low hover:bg-surface-container text-on-surface font-title-md text-title-md transition-colors">
        Save as Draft
      </button>
<button className="flex items-center gap-space-xs px-space-md py-space-xs rounded bg-surface-container-low hover:bg-surface-container text-on-surface font-title-md text-title-md transition-colors" id="btnRecalculate">
<span className="material-symbols-outlined text-space-base leading-none text-primary">sync</span>
<span>Recalculate</span>
</button>
<button className="flex items-center gap-space-xs px-space-lg py-space-xs rounded bg-primary text-on-primary hover:bg-primary-container font-title-md text-title-md shadow-sm transition-all" id="btnGenerateBOQ">
<span className="material-symbols-outlined text-space-base leading-none">rocket_launch</span>
<span>Generate Stage-Wise BOQ &amp; Execution Blueprint</span>
</button>
</div>
</div>


</div></main></div>
    </div>
  );
}
