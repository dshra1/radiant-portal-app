import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/qa-inspection")({
  head: () => ({
    meta: [
      { title: "AI Visual QA/QC Inspection & Defect Audit | Saha OS" },
      { name: "description", content: "Edge-inference visual compliance scoring, defect ledger and IS 456 governing code checks." },
      { property: "og:title", content: "AI Visual QA/QC Inspection & Defect Audit | Saha OS" },
      { property: "og:description", content: "Edge-inference visual compliance scoring, defect ledger and IS 456 governing code checks." },
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

<div className="flex flex-col xl:flex-row xl:items-center justify-between gap-space-md mb-space-base">
<div className="flex flex-col">
<div className="flex items-center gap-space-xs text-on-surface-variant font-label-sm text-label-sm mb-space-2xs">
<span>PROJECTS</span>
<span className="material-symbols-outlined text-space-xs leading-none">chevron_right</span>
<span>CYBER ENCLAVE - PHASE 2</span>
<span className="material-symbols-outlined text-space-xs leading-none">chevron_right</span>
<span className="text-primary font-semibold">STAGE 07: RCC SLAB POUR QA/QC</span>
</div>
<div className="flex flex-wrap items-center gap-space-sm">
<h1 className="font-headline-lg text-headline-lg text-on-surface font-bold tracking-tight">AI Visual QA/QC Inspection &amp; Defect Audit</h1>
<span className="px-space-xs py-space-2xs rounded bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider flex items-center gap-1">
<span className="material-symbols-outlined text-space-xs text-tertiary leading-none">terminal</span> RUN #QA-VIS-2026-0904
        </span>
<span className="px-space-xs py-space-2xs rounded bg-primary-container text-on-primary-container font-label-sm text-label-sm uppercase tracking-wider font-semibold flex items-center gap-1">
<span className="w-1.5 h-1.5 rounded-full bg-on-primary-container animate-pulse"></span> Pass with 1 Advisory
        </span>
</div>
<div className="flex items-center gap-space-md text-on-surface-variant font-body-sm text-body-sm mt-space-2xs">
<span className="flex items-center gap-1"><span className="material-symbols-outlined text-space-xs leading-none">person</span> Inspector: <strong>Rajesh K. (Senior Lead QC)</strong></span>
<span>•</span>
<span className="flex items-center gap-1"><span className="material-symbols-outlined text-space-xs leading-none">event</span> 18 Oct 2026, 11:42 IST</span>
<span>•</span>
<span className="flex items-center gap-1"><span className="material-symbols-outlined text-space-xs leading-none">bolt</span> Inference Latency: 1.28s (Edge NPU)</span>
</div>
</div>

<div className="flex items-center flex-wrap gap-space-xs">
<button className="px-space-md py-space-xs rounded bg-surface-container-lowest text-on-surface hover:bg-surface-container transition-colors font-title-md text-title-md shadow-sm flex items-center gap-space-xs">
<span className="material-symbols-outlined leading-none text-space-base">refresh</span>
<span>Run Scan (3 New)</span>
</button>
<button className="px-space-md py-space-xs rounded bg-surface-container-lowest text-on-surface hover:bg-surface-container transition-colors font-title-md text-title-md shadow-sm flex items-center gap-space-xs">
<span className="material-symbols-outlined leading-none text-space-base">table_view</span>
<span>Export Ledger (.CSV)</span>
</button>
<button className="px-space-md py-space-xs rounded bg-primary text-on-primary hover:bg-primary-container transition-colors font-title-md text-title-md shadow-sm flex items-center gap-space-xs">
<span className="material-symbols-outlined leading-none text-space-base">picture_as_pdf</span>
<span id="downloadBtnText">Download QA/QC Audit Report</span>
</button>
</div>
</div>

<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-space-md mb-space-base">

<div className="p-space-md rounded bg-surface-container-lowest shadow-sm flex flex-col justify-between">
<div className="flex items-center justify-between text-on-surface-variant">
<span className="font-label-sm text-label-sm uppercase tracking-wider">Visual Compliance</span>
<span className="material-symbols-outlined text-primary leading-none text-space-base">verified</span>
</div>
<div className="flex items-baseline gap-space-xs mt-space-xs">
<span className="font-display-lg text-display-lg font-bold text-on-surface">94.2%</span>
<span className="px-space-2xs py-0.5 rounded bg-surface-container-high text-primary font-label-sm text-label-sm font-semibold">+4.2% vs target</span>
</div>
<div className="w-full bg-surface-container rounded-full h-1.5 mt-space-sm overflow-hidden">
<div className="bg-primary h-full rounded-full" style={{ width: "94.2%" }}></div>
</div>
<span className="font-label-sm text-label-sm text-on-surface-variant mt-space-2xs">Benchmark: ≥90% IS 456 Pass</span>
</div>

<div className="p-space-md rounded bg-surface-container-lowest shadow-sm flex flex-col justify-between">
<div className="flex items-center justify-between text-on-surface-variant">
<span className="font-label-sm text-label-sm uppercase tracking-wider">Inspected Imagery</span>
<span className="material-symbols-outlined text-tertiary leading-none text-space-base">photo_library</span>
</div>
<div className="flex items-baseline gap-space-xs mt-space-xs">
<span className="font-display-lg text-display-lg font-bold text-on-surface">18</span>
<span className="font-label-sm text-label-sm text-on-surface-variant">photos processed</span>
</div>
<div className="flex items-center gap-1 mt-space-sm">
<span className="h-1.5 flex-1 rounded bg-primary"></span>
<span className="h-1.5 flex-1 rounded bg-primary"></span>
<span className="h-1.5 flex-1 rounded bg-primary"></span>
<span className="h-1.5 flex-1 rounded bg-secondary-container"></span>
</div>
<span className="font-label-sm text-label-sm text-on-surface-variant mt-space-2xs">Grid Sectors C1 to C6 Slab Deck</span>
</div>

<div className="p-space-md rounded bg-surface-container-lowest shadow-sm flex flex-col justify-between">
<div className="flex items-center justify-between text-on-surface-variant">
<span className="font-label-sm text-label-sm uppercase tracking-wider">Defects &amp; Snags</span>
<span className="material-symbols-outlined text-error leading-none text-space-base">flag</span>
</div>
<div className="flex items-baseline gap-space-xs mt-space-xs">
<span className="font-display-lg text-display-lg font-bold text-on-surface">3</span>
<span className="px-space-2xs py-0.5 rounded bg-error-container text-on-error-container font-label-sm text-label-sm font-semibold">0 Critical</span>
</div>
<div className="flex items-center gap-space-xs text-body-sm font-body-sm text-on-surface-variant mt-space-sm">
<span className="text-error font-semibold">0 Major</span>
<span>•</span>
<span className="text-tertiary font-semibold">1 Advisory</span>
<span>•</span>
<span>2 Minor Cleanups</span>
</div>
<span className="font-label-sm text-label-sm text-on-surface-variant mt-space-2xs">Conduit clearance needs wedge</span>
</div>

<div className="p-space-md rounded bg-surface-container-lowest shadow-sm flex flex-col justify-between">
<div className="flex items-center justify-between text-on-surface-variant">
<span className="font-label-sm text-label-sm uppercase tracking-wider">Governing Codes</span>
<span className="material-symbols-outlined text-secondary leading-none text-space-base">menu_book</span>
</div>
<div className="mt-space-xs">
<div className="font-headline-sm text-headline-sm font-bold text-on-surface leading-tight">IS 456:2000</div>
<div className="font-body-sm text-body-sm text-on-surface-variant">SP:34 &amp; IRC 112 Handbook</div>
</div>
<div className="flex items-center gap-space-xs mt-space-sm">
<span className="px-space-xs py-0.5 rounded bg-surface-container text-on-surface-variant font-label-sm text-label-sm">Cl. 26.5 Reinforce</span>
<span className="px-space-xs py-0.5 rounded bg-surface-container text-on-surface-variant font-label-sm text-label-sm">Cl. 26.4 Cover</span>
</div>
<span className="font-label-sm text-label-sm text-on-surface-variant mt-space-2xs">Tolerance: ±5mm mesh spacing</span>
</div>

<div className="p-space-md rounded bg-primary-container text-on-primary-container shadow-sm flex flex-col justify-between">
<div className="flex items-center justify-between text-on-primary-container/80">
<span className="font-label-sm text-label-sm uppercase tracking-wider font-semibold">Pre-Pour Readiness</span>
<span className="material-symbols-outlined text-primary-fixed leading-none text-space-base">check_circle</span>
</div>
<div className="mt-space-xs">
<span className="font-headline-md text-headline-md font-bold text-on-primary-container leading-tight">CONDITIONAL PASS</span>
</div>
<div className="font-body-sm text-body-sm text-on-primary-container/90 mt-space-xs">
        RMC Batching cleared for 14:00 hrs. Rectify Grid C3 conduit bundle before discharge.
      </div>
<span className="font-label-sm text-label-sm uppercase tracking-wider text-primary-fixed font-bold mt-space-sm flex items-center gap-1">
<span className="material-symbols-outlined text-space-xs leading-none">lock_open</span> Pour Card Unlocked
      </span>
</div>
</div>

<div className="grid grid-cols-1 xl:grid-cols-12 gap-space-lg">

<div className="xl:col-span-7 flex flex-col gap-space-md">

<div className="bg-surface-container-lowest rounded shadow-sm p-space-md flex flex-col">

<div className="flex flex-wrap items-center justify-between gap-space-sm pb-space-sm mb-space-sm">
<div className="flex items-center gap-space-xs">
<span className="material-symbols-outlined text-primary leading-none text-space-base">camera_indoor</span>
<span className="font-title-md text-title-md text-on-surface">CAM-04: Bay C2-C3 Main Rebar Grid &amp; Shuttering</span>
<span className="px-space-xs py-0.5 rounded bg-surface-container font-label-sm text-label-sm text-on-surface-variant font-mono">24.2 MP RAW</span>
</div>

<div className="flex items-center gap-space-xs bg-surface-container-low p-1 rounded">
<button className="px-space-xs py-0.5 rounded bg-surface-container-lowest text-on-surface font-label-sm text-label-sm shadow-xs transition-all flex items-center gap-1 font-semibold" id="toggleBoxes">
<span className="w-2 h-2 rounded-full bg-primary"></span> Bounding Boxes
            </button>
<button className="px-space-xs py-0.5 rounded text-on-surface-variant hover:text-on-surface font-label-sm text-label-sm transition-all flex items-center gap-1" id="toggleHeatmap">
<span className="w-2 h-2 rounded-full bg-tertiary"></span> Heatmap
            </button>
<button className="px-space-xs py-0.5 rounded text-on-surface-variant hover:text-on-surface font-label-sm text-label-sm transition-all flex items-center gap-1" id="toggleDrawing">
<span className="material-symbols-outlined text-space-xs leading-none">layers</span> CAD Overlay
            </button>
<button className="p-1 rounded text-on-surface-variant hover:bg-surface-container-high transition-colors" title="Zoom In">
<span className="material-symbols-outlined text-space-sm leading-none">zoom_in</span>
</button>
<button className="p-1 rounded text-on-surface-variant hover:bg-surface-container-high transition-colors" title="Full Frame">
<span className="material-symbols-outlined text-space-sm leading-none">fullscreen</span>
</button>
</div>
</div>

<div className="relative w-full aspect-[16/10] bg-inverse-surface rounded overflow-hidden select-none group">

<img className="w-full h-full object-cover" data-alt="Overhead high-angle construction shot of an engineered concrete floor slab reinforcement cage with steel Fe500D rebars placed in orthogonal grid, cement cover blocks supporting the rebar, PVC electrical conduits running across, clean film-faced plywood shuttering in daylight, civil site engineering inspection." id="mainInspectionImage" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAiaus5GM9KjfANTfysihYzNzXe8xtBR_CDHsIXh0O1aIR0FPAfnjpMdsATiooU7WRW7jixW_UJjMbFu3ODWImQh2OTVNa5agtR0tkXFCo66moOdREGEv5CUIBSSajYDKB2VhoXVo8pyx2auX1WoTXIGszBmbyS_mfxlbNfj-NwLFXMRq2LZr4uVWhh5l6olWCdhhaY9F3gOTMfLDHD5Tu1Fm5sDToJCKIVQ5aIsvojzMG7ei3KPQMx" />

<div className="absolute top-space-sm left-space-sm right-space-sm flex justify-between items-start pointer-events-none">
<div className="bg-inverse-surface/85 backdrop-blur-sm text-inverse-on-surface px-space-sm py-1 rounded flex items-center gap-space-sm">
<span className="w-2 h-2 rounded-full bg-primary animate-ping"></span>
<span className="font-label-sm text-label-sm font-mono tracking-wide">YOLO-Civil-v5.8 • INFERENCE ACTIVE</span>
<span className="text-outline-variant font-mono text-[10px]">Conf: 98.4%</span>
</div>
<div className="bg-inverse-surface/85 backdrop-blur-sm text-inverse-on-surface px-space-xs py-1 rounded font-label-sm text-label-sm font-mono">
              FOCAL: 28mm • F/5.6 • GSD: 1.1mm/px
            </div>
</div>

<div className="absolute inset-0 bg-gradient-to-tr from-tertiary-container/30 via-transparent to-primary/20 mix-blend-color-dodge pointer-events-none hidden transition-opacity duration-300" id="heatmapLayer"></div>

<div className="absolute inset-0 pointer-events-none opacity-40 hidden transition-opacity duration-300" id="drawingLayer">
<svg className="w-full h-full stroke-tertiary-fixed fill-none" xmlns="http://www.w3.org/2000/svg">
<line strokeDasharray="4 4" strokeWidth="0.75" x1="10%" x2="10%" y1="0" y2="100%"></line>
<line strokeDasharray="4 4" strokeWidth="0.75" x1="35%" x2="35%" y1="0" y2="100%"></line>
<line strokeDasharray="4 4" strokeWidth="0.75" x1="60%" x2="60%" y1="0" y2="100%"></line>
<line strokeDasharray="4 4" strokeWidth="0.75" x1="85%" x2="85%" y1="0" y2="100%"></line>
<line strokeDasharray="4 4" strokeWidth="0.75" x1="0" x2="100%" y1="25%" y2="25%"></line>
<line strokeDasharray="4 4" strokeWidth="0.75" x1="0" x2="100%" y1="55%" y2="55%"></line>
<line strokeDasharray="4 4" strokeWidth="0.75" x1="0" x2="100%" y1="85%" y2="85%"></line>
<circle cx="35%" cy="55%" fill="none" r="18" stroke="#85f8c4" strokeWidth="1.5"></circle>
<text fill="#85f8c4" fontFamily="monospace" font-size={10} x="36%" y="54%">GRID C-2/B-4</text>
</svg>
</div>

<div className="absolute inset-0 pointer-events-auto" id="boundingBoxesContainer">

<div className="absolute top-[22%] left-[12%] w-[38%] h-[42%] rounded-xs cursor-pointer transition-all duration-150 bg-primary/10 hover:bg-primary/20 shadow-[0_0_0_1.5px_#006948]">
<div className="absolute -top-6 left-0 bg-primary text-on-primary px-1.5 py-0.5 rounded-xs font-label-sm text-label-sm font-mono flex items-center gap-1 whitespace-nowrap shadow-xs">
<span className="material-symbols-outlined text-[12px] leading-none">check_circle</span>
<span>Main Rebar Spacing: 150mm c/c Fe500D 12mm [Pass]</span>
</div>
<div className="absolute bottom-1 right-1 bg-inverse-surface/90 text-inverse-on-surface px-1 rounded-xs font-mono text-[10px]">
                99.1% conf
              </div>
</div>

<div className="absolute top-[35%] right-[14%] w-[30%] h-[32%] rounded-xs cursor-pointer transition-all duration-150 bg-tertiary-container/15 hover:bg-tertiary-container/30 shadow-[0_0_0_2px_#007cb1]">
<div className="absolute -top-7 left-0 bg-tertiary-container text-on-tertiary-container px-1.5 py-0.5 rounded-xs font-label-sm text-label-sm font-mono flex items-center gap-1 whitespace-nowrap shadow-xs">
<span className="material-symbols-outlined text-[12px] leading-none">warning</span>
<span>MEP Conduit Bundling: 3 touching w/o 50mm spacer [Advisory]</span>
</div>

<span className="absolute -top-1 -right-1 flex h-3 w-3">
<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-tertiary opacity-75"></span>
<span className="relative inline-flex rounded-full h-3 w-3 bg-tertiary"></span>
</span>
<div className="absolute bottom-1 right-1 bg-inverse-surface/90 text-inverse-on-surface px-1 rounded-xs font-mono text-[10px]">
                IS 456 Cl.26.5 • 97.8% conf
              </div>
</div>

<div className="absolute bottom-[10%] left-[24%] w-[22%] h-[20%] rounded-xs cursor-pointer transition-all duration-150 bg-primary/10 hover:bg-primary/20 shadow-[0_0_0_1.5px_#006948]">
<div className="absolute -top-6 left-0 bg-primary text-on-primary px-1.5 py-0.5 rounded-xs font-label-sm text-label-sm font-mono flex items-center gap-1 whitespace-nowrap shadow-xs">
<span className="material-symbols-outlined text-[12px] leading-none">check_circle</span>
<span>Cover Block: 25mm FRP @ 850mm c/c [Pass]</span>
</div>
</div>

<div className="absolute top-[8%] right-[8%] w-[20%] h-[22%] rounded-xs cursor-pointer transition-all duration-150 bg-primary/10 hover:bg-primary/20 shadow-[0_0_0_1.5px_#006948]">
<div className="absolute -top-6 right-0 bg-primary text-on-primary px-1.5 py-0.5 rounded-xs font-label-sm text-label-sm font-mono flex items-center gap-1 whitespace-nowrap shadow-xs">
<span className="material-symbols-outlined text-[12px] leading-none">check_circle</span>
<span>Debris/Wood Shaving: Zero Detected [Pass]</span>
</div>
</div>
</div>

<div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-inverse-surface/90 via-inverse-surface/50 to-transparent p-space-sm flex justify-between items-end text-inverse-on-surface">
<div className="flex items-center gap-space-md font-mono font-body-sm text-body-sm">
<span className="text-primary-fixed flex items-center gap-1">
<span className="material-symbols-outlined text-space-xs leading-none">straighten</span> Calibrated Grid Scale: 100mm = 91px
              </span>
<span>SLAB: L4-POD-C</span>
<span>ELEV: +14.200 M</span>
</div>
<div className="flex items-center gap-space-xs">
<span className="px-space-xs py-0.5 rounded bg-surface-variant/20 text-inverse-on-surface font-label-sm text-label-sm font-mono">IS 456 Auto-Audit</span>
</div>
</div>
</div>

<div className="flex flex-wrap items-center justify-between gap-space-sm pt-space-sm text-on-surface-variant font-label-sm text-label-sm">
<div className="flex items-center gap-space-md">
<span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-xs bg-primary"></span> Compliant (14 detections)</span>
<span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-xs bg-tertiary-container"></span> Advisory (1 warning)</span>
<span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-xs bg-error"></span> Critical Snag (0 detected)</span>
</div>
<span className="text-on-surface-variant italic">Click any bounding box to jump to specification ledger</span>
</div>
</div>

<div className="bg-surface-container-lowest rounded shadow-sm p-space-md flex flex-col">
<div className="flex items-center justify-between mb-space-xs">
<div className="flex items-center gap-space-xs">
<span className="material-symbols-outlined text-secondary leading-none text-space-base">collections</span>
<span className="font-title-md text-title-md text-on-surface">Stage 07 Photo Evidence Reel (18 Total)</span>
</div>
<span className="font-label-sm text-label-sm text-on-surface-variant">Showing active sector 01 to 06</span>
</div>
<div className="grid grid-cols-6 gap-space-xs">

<button className="relative rounded overflow-hidden aspect-[4/3] bg-surface-container shadow-xs ring-2 ring-primary transition-all">
<img className="w-full h-full object-cover" data-alt="High angle view of structural reinforcement slab top rebar mesh with concrete cover blocks and chalk measurement lines, daylight civil engineering site photo." src="https://lh3.googleusercontent.com/aida-public/AB6AXuDKh9C5rmKAz-lTpyM2_-htILXKmnRU7c2s3f8hDc9AZRP-CqvdVXmjH9DW_J807lDzvzuId5TLGVhapHebc-0oEcNkN92kTU_oX2XJMVyHJYq_ePMq0RvkCd3cIGHqe0ZXbMa1hSobGvhlCStwrI6aJl9euUCQgAWl6qdN4f5H6mViAgYGJSAaJWv7kIwreOoAxRBRNqUjHhb3W9MVX0QEoyHXkMi3l4RG06WfEodbluUJLUWSZG2X" />
<div className="absolute top-1 left-1 bg-primary text-on-primary px-1 rounded-xs font-label-sm text-[9px] font-bold">ACTIVE</div>
<div className="absolute bottom-0 inset-x-0 bg-inverse-surface/80 text-inverse-on-surface text-[10px] font-mono px-1 truncate">Mesh Bay C2</div>
</button>

<button className="relative rounded overflow-hidden aspect-[4/3] bg-surface-container shadow-xs opacity-80 hover:opacity-100 transition-all">
<img className="w-full h-full object-cover" data-alt="Close up civil site engineering photograph of 25mm round fiber reinforced concrete cover blocks resting beneath rebars on plywood shuttering deck." src="https://lh3.googleusercontent.com/aida-public/AB6AXuAjIBgeJ3v-z1ZR9eRac193MDQiC0JJUbMMVq_hi6vmUoYTxfD95UyoOr78Rqtii9xLzI4QLo1NlSkUxARbZCPF3vuLL4UyfRAkZy872L5nhOYgtdwESbatoER3o_WP0dhXwpFCi012KfRY51k4vV5n2mfwiN4TXO4aV9TelOmMU14LZ3FbGmkErB3R_MkNKpG-0KWh4kIVNCy8SNdlQDLgHDp_GHeR3vaawBB3TRwmoYd_CNp3v9fF" />
<div className="absolute top-1 right-1 bg-primary text-on-primary w-2 h-2 rounded-full"></div>
<div className="absolute bottom-0 inset-x-0 bg-inverse-surface/80 text-inverse-on-surface text-[10px] font-mono px-1 truncate">Cover Blocks</div>
</button>

<button className="relative rounded overflow-hidden aspect-[4/3] bg-surface-container shadow-xs opacity-80 hover:opacity-100 transition-all">
<img className="w-full h-full object-cover" data-alt="Quality control concrete slump cone test on metallic base plate on construction site, engineer measuring slump with steel scale, workability test 120mm." src="https://lh3.googleusercontent.com/aida-public/AB6AXuAUwloeeBIwSbyCkWFOoaUz8Z_kKQjRXe1m3IKIciK0FpNwsj298vp5u2OVl5y39CBN6cGiG-BZdEIFC4lfEkpDtXpiyxVwhduOgFDP098utBLe520ggGV-bFpltE1jgtfiRFCdyjeAx_AQyd0JDvBhf9Hj9A8iknOHorP6H4jvvyklUqgu54ZafScJZu-rO-fcUJnbf2HGaz6cldmq1ixNeM1yhJDKs-39WogOd94Tz3eJeGamuebL" />
<div className="absolute top-1 right-1 bg-primary text-on-primary w-2 h-2 rounded-full"></div>
<div className="absolute bottom-0 inset-x-0 bg-inverse-surface/80 text-inverse-on-surface text-[10px] font-mono px-1 truncate">Slump 125mm</div>
</button>

<button className="relative rounded overflow-hidden aspect-[4/3] bg-surface-container shadow-xs opacity-80 hover:opacity-100 transition-all">
<img className="w-full h-full object-cover" data-alt="Construction site photograph of vertical concrete column starter rebars with 135 degree seismic stirrup hooks and master ring alignment." src="https://lh3.googleusercontent.com/aida-public/AB6AXuD5ndxUflYLSBq7IITF7jmjOJ1kRBNGIhJz9vqL8SdoPjlWTM8V-ZSIWFV3c4iSauyT9-MApdSkFMBeAf96Xhdkqsp74qyqBwSPxW7-M_U2Ij-INBi28m9mAJSNjU5r2KVG8YcrUQmNWYmhkdWrfTCbsyTa99q_rYcSg2E_ZDFvcFL-BtoSHnl0yTWEHKDan94GfrkBR89rIdrBqtNWdjPbirdqoYEkmMzZoMVTSR9cnAKeyffeNWVq" />
<div className="absolute top-1 right-1 bg-primary text-on-primary w-2 h-2 rounded-full"></div>
<div className="absolute bottom-0 inset-x-0 bg-inverse-surface/80 text-inverse-on-surface text-[10px] font-mono px-1 truncate">Col C-14 Starter</div>
</button>

<button className="relative rounded overflow-hidden aspect-[4/3] bg-surface-container shadow-xs opacity-80 hover:opacity-100 transition-all">
<img className="w-full h-full object-cover" data-alt="Sunken toilet slab area in building construction under 72 hour water ponding test with polymer waterproofing coating applied along vertical corner fillets." src="https://lh3.googleusercontent.com/aida-public/AB6AXuAfrXMJlXAUjjXdg-gqnrj6_jN4u92U4NZQv7eEUtR2DC_Vg2jF_pnurrC5codpPiobf6-LTqjxJ3qOg-FpFXfnmMZ0iQ3Uj3eLRO_d6JEa2gtSNTY3aZlIJtjohseT_b_g1eQ7fQI13Uw63Z3AmLp6j71hqesjpnsR_vsVygO_IoUfrQnc9KKPTZknO3gYtgSRgoaa4pDX8Id3umQxsJ1wawyrr9i4bBmDFvTEpW4qQMMaO2QqZcL0" />
<div className="absolute top-1 right-1 bg-tertiary-container text-on-tertiary-container w-2 h-2 rounded-full"></div>
<div className="absolute bottom-0 inset-x-0 bg-inverse-surface/80 text-inverse-on-surface text-[10px] font-mono px-1 truncate">Sunken Ponding</div>
</button>

<button className="relative rounded overflow-hidden aspect-[4/3] bg-surface-container shadow-xs opacity-80 hover:opacity-100 transition-all">
<img className="w-full h-full object-cover" data-alt="Underside and edge beam formwork shuttering secured with adjustable steel props and bracing jacks on a modern civil building construction floor." src="https://lh3.googleusercontent.com/aida-public/AB6AXuBA1m_b_p49Q1CLdmUfp5Ezkgbn2t4KpgQATLJB1X7G8ZsKRxa-fNoTTatEMWLCSCUop63vTm8cry85ezdpE2fZXodHOs9IKkq-7SjZ2nBwuWBAfawcm9CR9m5LknWQt3lR-kG5gOY9Wpn40q-6XJ385bUf5D2lDmKHQomYdns5llmWSNcYHraJEAoZRXaaFMWzDx1EEvlwNqeSza844hzCIGdycQyuSUSiuKLVUm3qE6HhVZxGC3uD" />
<div className="absolute top-1 right-1 bg-primary text-on-primary w-2 h-2 rounded-full"></div>
<div className="absolute bottom-0 inset-x-0 bg-inverse-surface/80 text-inverse-on-surface text-[10px] font-mono px-1 truncate">Beam Edge Deck</div>
</button>
</div>
</div>
</div>

<div className="xl:col-span-5 flex flex-col gap-space-md">

<div className="bg-surface-container-lowest rounded shadow-sm p-space-md flex flex-col">
<div className="flex items-center justify-between pb-space-xs border-b border-surface-container-high mb-space-sm">
<div className="flex items-center gap-space-xs">
<span className="material-symbols-outlined text-primary leading-none text-space-base">fact_check</span>
<span className="font-headline-sm text-headline-sm text-on-surface">Execution SOP Verification</span>
</div>
<span className="px-space-xs py-0.5 rounded bg-surface-container text-on-surface-variant font-label-sm text-label-sm font-mono">IS 456 • SP 34</span>
</div>

<div className="flex flex-col gap-space-xs">

<div className="p-space-sm rounded bg-surface-container-low hover:bg-surface-container transition-colors flex items-start justify-between gap-space-sm cursor-pointer" id="defectRow-1">
<div className="flex items-start gap-space-sm">
<span className="material-symbols-outlined text-primary leading-none text-space-base shrink-0 mt-0.5">check_circle</span>
<div className="flex flex-col">
<div className="flex items-center gap-space-xs">
<span className="font-title-md text-title-md text-on-surface">Rebar Dia &amp; BBS Spacing</span>
<span className="font-label-sm text-label-sm text-on-surface-variant">Fe500D (TMT)</span>
</div>
<p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                  Main: 12mm @ 150mm c/c; Dist: 10mm @ 175mm c/c. Lap length = 600mm (≥50d verified).
                </p>
</div>
</div>
<span className="px-space-xs py-0.5 rounded bg-primary-container text-on-primary-container font-label-sm text-label-sm uppercase font-semibold shrink-0">Pass</span>
</div>

<div className="p-space-sm rounded bg-surface-container-low hover:bg-surface-container transition-colors flex items-start justify-between gap-space-sm cursor-pointer" id="defectRow-3">
<div className="flex items-start gap-space-sm">
<span className="material-symbols-outlined text-primary leading-none text-space-base shrink-0 mt-0.5">check_circle</span>
<div className="flex flex-col">
<div className="flex items-center gap-space-xs">
<span className="font-title-md text-title-md text-on-surface">Cover Blocks &amp; Thickness</span>
<span className="font-label-sm text-label-sm text-on-surface-variant">25mm FRP</span>
</div>
<p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                  Density measured at 4.8 blocks/m². Tied securely with 18-gauge binding wire.
                </p>
</div>
</div>
<span className="px-space-xs py-0.5 rounded bg-primary-container text-on-primary-container font-label-sm text-label-sm uppercase font-semibold shrink-0">Pass</span>
</div>

<div className="p-space-sm rounded bg-tertiary-container/10 border-l-4 border-tertiary-container flex items-start justify-between gap-space-sm cursor-pointer" id="defectRow-2">
<div className="flex items-start gap-space-sm">
<span className="material-symbols-outlined text-tertiary leading-none text-space-base shrink-0 mt-0.5">warning</span>
<div className="flex flex-col">
<div className="flex items-center gap-space-xs">
<span className="font-title-md text-title-md text-on-surface">MEP Conduit Bundling Clearance</span>
<span className="px-1 rounded bg-secondary-container text-on-secondary-container font-label-sm text-[10px] font-mono">GRID C3</span>
</div>
<p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                  Three 25mm PVC electrical conduits bundled tight with zero separation. Concrete slurry penetration compromised (Honeycombing risk).
                </p>
</div>
</div>
<span className="px-space-xs py-0.5 rounded bg-tertiary text-on-tertiary font-label-sm text-label-sm uppercase font-semibold shrink-0">Advisory</span>
</div>

<div className="p-space-sm rounded bg-surface-container-low hover:bg-surface-container transition-colors flex items-start justify-between gap-space-sm">
<div className="flex items-start gap-space-sm">
<span className="material-symbols-outlined text-primary leading-none text-space-base shrink-0 mt-0.5">check_circle</span>
<div className="flex flex-col">
<div className="flex items-center gap-space-xs">
<span className="font-title-md text-title-md text-on-surface">Shuttering Tightness &amp; Props</span>
<span className="font-label-sm text-label-sm text-on-surface-variant">Film Plywood</span>
</div>
<p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                  Joint gaps taped with PVC tape. Zero slurry leak avenues. Props vertical plumb verified.
                </p>
</div>
</div>
<span className="px-space-xs py-0.5 rounded bg-primary-container text-on-primary-container font-label-sm text-label-sm uppercase font-semibold shrink-0">Pass</span>
</div>

<div className="p-space-sm rounded bg-surface-container-low hover:bg-surface-container transition-colors flex items-start justify-between gap-space-sm cursor-pointer" id="defectRow-4">
<div className="flex items-start gap-space-sm">
<span className="material-symbols-outlined text-primary leading-none text-space-base shrink-0 mt-0.5">check_circle</span>
<div className="flex flex-col">
<div className="flex items-center gap-space-xs">
<span className="font-title-md text-title-md text-on-surface">Cleanliness &amp; Slurry Washout</span>
<span className="font-label-sm text-label-sm text-on-surface-variant">Compressor</span>
</div>
<p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                  High-pressure air cleaning executed. No binding wire cuttings, dust, or wood shavings.
                </p>
</div>
</div>
<span className="px-space-xs py-0.5 rounded bg-primary-container text-on-primary-container font-label-sm text-label-sm uppercase font-semibold shrink-0">Pass</span>
</div>
</div>
</div>

<div className="bg-surface-container-lowest rounded shadow-sm p-space-md flex flex-col">
<div className="flex items-center justify-between pb-space-xs mb-space-sm">
<div className="flex items-center gap-space-xs">
<span className="material-symbols-outlined text-tertiary leading-none text-space-base">handyman</span>
<span className="font-title-md text-title-md text-on-surface">Immediate Pre-Pour Action Item</span>
</div>
<span className="font-label-sm text-label-sm text-on-surface-variant">SLA: 60 mins</span>
</div>
<div className="p-space-sm rounded bg-surface-container-low flex flex-col gap-space-sm">
<div className="flex items-start justify-between">
<div className="flex flex-col">
<span className="font-title-md text-title-md text-on-surface font-semibold">Install PVC Separation Spacers in Grid C3</span>
<span className="font-body-sm text-body-sm text-on-surface-variant">Assigned to: <strong>Apex Electrical MEP Subcontractor</strong></span>
</div>
<span className="px-space-xs py-0.5 rounded bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-semibold">Priority 1</span>
</div>
<p className="font-body-sm text-body-sm text-on-surface-variant">
            Separate the three touching conduits with minimum 40mm mortar spacers to ensure 20mm aggregate passage during pump pour.
          </p>
<div className="flex items-center justify-between pt-space-xs">
<div className="flex items-center gap-space-xs text-body-sm text-on-surface-variant font-label-sm">
<span className="material-symbols-outlined text-space-xs text-primary leading-none">notifications_active</span>
<span>Dispatched via WhatsApp Bot</span>
</div>
<button className="px-space-md py-space-xs rounded bg-surface-container-highest hover:bg-primary hover:text-on-primary text-on-surface font-title-md text-title-md transition-colors shadow-xs flex items-center gap-1" id="resolveBtn">
<span className="material-symbols-outlined text-space-sm leading-none">done_all</span>
<span id="resolveBtnLabel">Mark Rectified On-Site</span>
</button>
</div>
</div>
</div>

<div className="bg-surface-container-lowest rounded shadow-sm p-space-md flex flex-col">
<div className="flex items-center justify-between mb-space-sm">
<div className="flex items-center gap-space-xs">
<span className="material-symbols-outlined text-primary leading-none text-space-base">draw</span>
<span className="font-headline-sm text-headline-sm text-on-surface">Digital QA/QC Pour Clearance</span>
</div>
<span className="px-space-xs py-0.5 rounded bg-surface-container font-label-sm text-label-sm text-primary font-bold">READY TO SIGN</span>
</div>

<div className="p-space-sm rounded bg-surface-container-low text-body-sm text-on-surface-variant mb-space-md leading-relaxed font-body-sm">
<strong>AI Executive Summary:</strong> Inspection run <code className="text-on-surface font-mono">#QA-VIS-2026-0904</code> confirms slab reinforcement configuration fully complies with structural drawing <em>SE-402-R3</em> and <em>IS 456:2000</em>. 14 critical parameters verified within tolerance (+4mm/-2mm). Pre-pour release granted subject to subcontractor clearing the MEP conduit separator advisory.
        </div>

<div className="grid grid-cols-3 gap-space-xs mb-space-md">

<div className="p-space-xs rounded bg-surface-container-low flex flex-col justify-between h-24">
<div className="flex items-center justify-between">
<span className="font-label-sm text-label-sm text-on-surface-variant">NEURAL ENGINE</span>
<span className="material-symbols-outlined text-primary text-space-xs leading-none">verified</span>
</div>
<div className="flex flex-col items-center justify-center my-auto">
<span className="font-mono text-primary font-bold text-xs tracking-wider">SHA-256 VERIFIED</span>
<span className="text-[9px] text-on-surface-variant font-mono">11:42:09 UTC+5.5</span>
</div>
<span className="font-label-sm text-[10px] text-on-surface-variant truncate">Saha Vision v5.8</span>
</div>

<div className="p-space-xs rounded bg-surface-container-low flex flex-col justify-between h-24">
<div className="flex items-center justify-between">
<span className="font-label-sm text-label-sm text-on-surface-variant">SITE QC ENG</span>
<span className="material-symbols-outlined text-primary text-space-xs leading-none">fingerprint</span>
</div>
<div className="flex flex-col items-center justify-center my-auto">
<span className="font-serif italic font-bold text-on-surface text-sm">Rajesh Kumar</span>
<span className="text-[9px] text-on-surface-variant">Biometric Sync ID: 8841</span>
</div>
<span className="font-label-sm text-[10px] text-on-surface-variant truncate">Site QC Lead</span>
</div>

<div className="p-space-xs rounded bg-surface-container-low flex flex-col justify-between h-24 border-dashed border-2 border-surface-container-highest" id="pmcSigBox">
<div className="flex items-center justify-between">
<span className="font-label-sm text-label-sm text-on-surface-variant">PMC STRUCTURAL</span>
<span className="material-symbols-outlined text-on-surface-variant text-space-xs leading-none">hourglass_top</span>
</div>
<div className="flex flex-col items-center justify-center my-auto" id="pmcSigContent">
<button className="px-2 py-1 rounded bg-secondary-container hover:bg-primary hover:text-on-primary text-on-secondary-container font-label-sm text-label-sm font-semibold transition-colors">
                Apply Stamp
              </button>
</div>
<span className="font-label-sm text-[10px] text-on-surface-variant truncate">Tata Consulting PMC</span>
</div>
</div>

<button className="w-full py-space-sm px-space-md rounded bg-primary hover:bg-primary-container text-on-primary font-title-md text-title-md font-bold shadow-md transition-all flex items-center justify-center gap-space-sm" id="releaseCertBtn">
<span className="material-symbols-outlined leading-none text-space-base">task_alt</span>
<span>Generate &amp; Seal Pour Release Certificate</span>
</button>
</div>
</div>
</div>


</div></main></div>
    </div>
  );
}
