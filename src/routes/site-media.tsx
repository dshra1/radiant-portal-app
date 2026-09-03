import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/site-media")({
  head: () => ({
    meta: [
      { title: "Site Media & Upload Ledger | Saha OS" },
      { name: "description", content: "Geo-tagged progress imagery, AI pour verification and drone ortho scans." },
      { property: "og:title", content: "Site Media & Upload Ledger | Saha OS" },
      { property: "og:description", content: "Geo-tagged progress imagery, AI pour verification and drone ortho scans." },
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

<div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-space-md pb-space-lg">
<div className="flex flex-col gap-space-2xs">
<div className="flex items-center gap-space-sm flex-wrap">
<span className="font-headline-lg text-headline-lg text-on-surface tracking-tight">Site Media &amp; Uploads</span>
<span className="px-space-sm py-space-2xs rounded bg-secondary-container text-on-secondary-container font-label-sm text-label-sm">Cyber Enclave - Phase 2</span>
<span className="inline-flex items-center gap-space-2xs px-space-sm py-space-2xs rounded bg-primary-container text-on-primary-container font-label-sm text-label-sm">
<span className="w-1.5 h-1.5 rounded-full bg-primary-fixed animate-pulse"></span>
          Stage 07: RCC 4th Floor Slab Casting
        </span>
</div>
<p className="font-body-md text-body-md text-on-surface-variant">
        Geo-tagged &amp; Timestamped Visual Progress, AI Pour Verification &amp; Site Inspection Ledger
      </p>
</div>

<div className="flex items-center gap-space-sm flex-wrap">
<div className="hidden sm:flex items-center gap-space-md px-space-md py-space-xs rounded bg-surface-container-lowest shadow-sm">
<div className="flex flex-col">
<span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Total Media</span>
<span className="font-tabular-metric-sm text-tabular-metric-sm text-on-surface">1,428 files</span>
</div>
<div className="w-px h-6 bg-outline-variant/30"></div>
<div className="flex flex-col">
<span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Cloud Vault</span>
<span className="font-tabular-metric-sm text-tabular-metric-sm text-on-surface">42.4 GB</span>
</div>
<div className="w-px h-6 bg-outline-variant/30"></div>
<div className="flex items-center gap-space-2xs text-primary font-label-sm text-label-sm" title="SHA-256 Ledger Stamp">
<span className="material-symbols-outlined text-space-base">lock</span>
<span>Blockchain Stamped</span>
</div>
</div>
<button className="inline-flex items-center gap-space-xs px-space-md py-space-xs rounded bg-surface-container-high text-on-surface hover:bg-surface-variant transition-colors font-title-md text-title-md">
<span className="material-symbols-outlined text-space-base">view_in_ar</span>
<span>Start 360° Walk</span>
</button>
<button className="inline-flex items-center gap-space-xs px-space-md py-space-xs rounded bg-surface-container-high text-on-surface hover:bg-surface-variant transition-colors font-title-md text-title-md">
<span className="material-symbols-outlined text-space-base">flight</span>
<span>Drone Sync</span>
</button>
<button className="inline-flex items-center gap-space-xs px-space-md py-space-xs rounded bg-primary text-on-primary hover:bg-primary-container font-title-md text-title-md shadow-sm transition-colors">
<span className="material-symbols-outlined text-space-base">add_a_photo</span>
<span>Upload Media</span>
</button>
</div>
</div>

<div className="mb-space-lg rounded-xl bg-surface-container-lowest p-space-base shadow-sm relative overflow-hidden">
<div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary"></div>
<div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-space-base pl-space-xs">
<div className="flex items-start gap-space-md">
<div className="p-space-sm rounded bg-primary-container/10 text-primary shrink-0">
<span className="material-symbols-outlined text-headline-sm">fact_check</span>
</div>
<div className="flex flex-col">
<div className="flex items-center gap-space-xs flex-wrap">
<span className="font-headline-sm text-headline-sm text-on-surface">AI Visual Pour Verification Check: Pass (98.4%)</span>
<span className="px-space-xs py-space-2xs rounded bg-primary-container text-on-primary-container font-label-sm text-label-sm">Pour Card #PC-048 Ready</span>
<span className="font-label-sm text-label-sm text-on-surface-variant">Analyzed 14 High-Res Rebar Scans</span>
</div>
<p className="font-body-sm text-body-sm text-on-surface-variant mt-space-2xs">
            Beam junctions, 25mm PVC spacer cover blocks verified across grid C1-C9. Electrical conduit bundling clear of reinforcement cages. Ready for RMC transit mixer discharge at 11:30 AM IST.
          </p>
</div>
</div>
<div className="flex items-center gap-space-sm self-end lg:self-center shrink-0">
<button className="inline-flex items-center gap-space-2xs px-space-sm py-space-xs rounded bg-surface-container text-primary hover:bg-surface-variant font-label-md text-label-md transition-colors">
<span className="material-symbols-outlined text-space-base">description</span>
<span>View Pour Dossier</span>
</button>
<button className="inline-flex items-center gap-space-2xs px-space-sm py-space-xs rounded bg-primary text-on-primary hover:bg-primary-container font-label-md text-label-md transition-colors">
<span className="material-symbols-outlined text-space-base">verified</span>
<span>Approve RMC Batch</span>
</button>
</div>
</div>
</div>

<div className="flex flex-col gap-space-sm mb-space-lg p-space-base rounded-xl bg-surface-container-lowest shadow-sm">

<div className="flex items-center justify-between gap-space-base pb-space-xs overflow-x-auto">
<div className="flex items-center gap-space-xs shrink-0">
<button className="px-space-sm py-space-xs rounded bg-primary text-on-primary font-label-md text-label-md whitespace-nowrap">
          All Media (1,428)
        </button>
<button className="px-space-sm py-space-xs rounded bg-surface-container-low text-on-surface hover:bg-surface-container font-label-md text-label-md whitespace-nowrap">
          Pour Verification (342)
        </button>
<button className="px-space-sm py-space-xs rounded bg-surface-container-low text-on-surface hover:bg-surface-container font-label-md text-label-md whitespace-nowrap">
          Drone Scans &amp; Orthos (48)
        </button>
<button className="px-space-sm py-space-xs rounded bg-surface-container-low text-on-surface hover:bg-surface-container font-label-md text-label-md whitespace-nowrap">
          QA/QC Slump &amp; Cubes (186)
        </button>
<button className="px-space-sm py-space-xs rounded bg-surface-container-low text-on-surface hover:bg-surface-container font-label-md text-label-md whitespace-nowrap">
          360° Floor Tours (24)
        </button>
<button className="px-space-sm py-space-xs rounded bg-surface-container-low text-on-surface hover:bg-surface-container font-label-md text-label-md whitespace-nowrap">
          Snag &amp; Safety Tickets (85)
        </button>
<button className="px-space-sm py-space-xs rounded bg-surface-container-low text-on-surface hover:bg-surface-container font-label-md text-label-md whitespace-nowrap">
          CCTV Timelapses (14)
        </button>
</div>
<div className="flex items-center gap-space-xs shrink-0">
<button className="p-space-xs rounded bg-surface-container-low text-on-surface hover:bg-surface-container" title="Grid Layout">
<span className="material-symbols-outlined text-space-base">grid_view</span>
</button>
<button className="p-space-xs rounded text-on-surface-variant hover:bg-surface-container" title="Timeline Stream">
<span className="material-symbols-outlined text-space-base">view_timeline</span>
</button>
<button className="p-space-xs rounded text-on-surface-variant hover:bg-surface-container" title="BIM 3D Model Overlap">
<span className="material-symbols-outlined text-space-base">layers</span>
</button>
</div>
</div>

<div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-space-sm pt-space-xs">
<div className="relative md:col-span-2">
<span className="material-symbols-outlined absolute left-space-sm top-1/2 -translate-y-1/2 text-on-surface-variant text-space-base">search</span>
<input className="w-full pl-9 pr-space-sm py-space-xs rounded bg-surface-container-low text-body-sm font-body-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-1 focus:ring-primary" placeholder="Search rebar tags, slump test, beam B4, drawing mark..." type="text" />
</div>
<div>
<select className="w-full px-space-sm py-space-xs rounded bg-surface-container-low text-body-sm font-body-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer">
<option>Stage 07: RCC Slab (Active)</option>
<option>Stage 01: Substructure &amp; Piling</option>
<option>Stage 02: Plinth Beam</option>
<option>Stage 10: MEP In-Wall Conduiting</option>
<option>Stage 14: Final Snagging</option>
</select>
</div>
<div>
<select className="w-full px-space-sm py-space-xs rounded bg-surface-container-low text-body-sm font-body-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer">
<option>Tower A - 4th Floor Slab</option>
<option>Tower B - 2nd Floor</option>
<option>Basement UG Sump</option>
<option>Stilt Parking Ramp</option>
<option>Transformer Yard Zone</option>
</select>
</div>
<div>
<div className="flex items-center gap-space-2xs px-space-sm py-space-xs rounded bg-surface-container-low text-body-sm font-body-sm text-on-surface cursor-pointer">
<span className="material-symbols-outlined text-space-base text-on-surface-variant">calendar_today</span>
<span>Today • 03 Sept</span>
</div>
</div>
<div className="flex items-center justify-end gap-space-xs">
<button className="w-full flex items-center justify-center gap-space-2xs px-space-sm py-space-xs rounded bg-surface-container text-tertiary hover:bg-surface-variant font-label-md text-label-md transition-colors">
<span className="material-symbols-outlined text-space-base">picture_as_pdf</span>
<span>Export Dossier</span>
</button>
</div>
</div>
</div>

<div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">

<div className="lg:col-span-8 flex flex-col gap-space-lg">

<div className="flex items-center justify-between">
<div className="flex items-center gap-space-xs">
<span className="font-title-md text-title-md text-on-surface font-bold">Today’s Site Feeds</span>
<span className="font-label-sm text-label-sm text-on-surface-variant">(03 Sept 2026 • Madhapur Block A)</span>
</div>
<span className="font-label-sm text-label-sm text-primary font-semibold">18 Items Synced from Site Tablets</span>
</div>

<div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">

<div className="flex flex-col rounded-xl bg-surface-container-lowest shadow-md overflow-hidden relative group cursor-pointer transition-transform hover:-translate-y-0.5">
<div className="relative h-48 w-full bg-surface-container">
<img className="w-full h-full object-cover" data-alt="Indian construction site slab casting pre-pour inspection photo showing dense high-tensile steel rebar mesh, PVC electrical conduit runs, and concrete spacer cover blocks in Hyderabad sunlight" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDnlUnzyxXNL9N6EOamXon5G9cOV9BYG_DK2nrtIW3PnbA7eM6wTICLobWkkMPEFiO24XU_CL4kfYCevkOm_QBA1u1yoaeTsnBhpiKM1UIdsRzEN_fzZe2M316guRYhhZbogybF32NM9svfZxbaWxa-2YHa301td3MO1MXb71mWZ_PxSQA1JQOGmPvpmn-cjii9T3tDHWnndPGwwp8Iw515RqOiJ2pVqm8T4Yw6I_qVCA7k00tOemef" />
<div className="absolute inset-0 bg-gradient-to-t from-inverse-surface/80 via-transparent to-black/30"></div>

<div className="absolute top-space-sm left-space-sm flex items-center gap-space-xs">
<span className="px-space-xs py-space-2xs rounded bg-primary text-on-primary font-label-sm text-label-sm font-semibold flex items-center gap-space-2xs">
<span className="material-symbols-outlined text-[14px]">check_circle</span>
                AI Verified Pass
              </span>
<span className="px-space-xs py-space-2xs rounded bg-surface-container-lowest/90 text-on-surface font-label-sm text-label-sm">
                4K LiDAR
              </span>
</div>
<div className="absolute top-space-sm right-space-sm">
<button className="p-1 rounded bg-inverse-surface/70 text-inverse-on-surface hover:bg-inverse-surface">
<span className="material-symbols-outlined text-space-base">bookmark</span>
</button>
</div>

<div className="absolute bottom-space-xs left-space-sm right-space-sm flex items-center justify-between text-inverse-on-surface font-label-sm text-label-sm">
<span>Grid C3-C7 • Beam B14</span>
<span className="flex items-center gap-space-2xs"><span className="material-symbols-outlined text-[14px]">location_on</span> 17.4485° N, 78.3742° E</span>
</div>
</div>
<div className="p-space-md flex flex-col gap-space-xs">
<div className="flex items-start justify-between gap-space-sm">
<div className="flex flex-col">
<span className="font-title-md text-title-md text-on-surface group-hover:text-primary transition-colors">4th Floor Slab Reinforcement &amp; Chairs</span>
<span className="font-body-sm text-body-sm text-on-surface-variant">By Site Engg. Rajesh K. • 24 mins ago</span>
</div>
<span className="px-space-xs py-space-2xs rounded bg-surface-container text-tertiary font-label-sm text-label-sm">Stage 07</span>
</div>

<div className="flex items-center gap-space-xs flex-wrap pt-space-xs">
<span className="px-space-xs py-space-2xs rounded bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm">Cover: 25mm Spec</span>
<span className="px-space-xs py-space-2xs rounded bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm">Rebar: Fe500D</span>
<span className="px-space-xs py-space-2xs rounded bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm">Spacers: 88 units</span>
</div>
<div className="flex items-center justify-between pt-space-sm">
<div className="flex items-center gap-space-2xs text-on-surface-variant font-label-sm text-label-sm">
<span className="material-symbols-outlined text-space-base text-primary">verified_user</span>
<span>Pour Card #PC-048</span>
</div>
<div className="flex items-center gap-space-xs">
<button className="p-1 rounded text-on-surface-variant hover:text-primary hover:bg-surface-container" title="Compare with Drawing">
<span className="material-symbols-outlined text-space-base">compare</span>
</button>
<button className="p-1 rounded text-on-surface-variant hover:text-primary hover:bg-surface-container" title="Add Snag Markup">
<span className="material-symbols-outlined text-space-base">edit_note</span>
</button>
<button className="p-1 rounded text-on-surface-variant hover:text-primary hover:bg-surface-container" title="WhatsApp Sync">
<span className="material-symbols-outlined text-space-base">share</span>
</button>
</div>
</div>
</div>
</div>

<div className="flex flex-col rounded-xl bg-surface-container-lowest shadow-sm hover:shadow-md overflow-hidden relative group cursor-pointer transition-transform hover:-translate-y-0.5">
<div className="relative h-48 w-full bg-surface-container">
<img className="w-full h-full object-cover" data-alt="Civil engineering quality technician measuring fresh concrete slump cone test with steel scale in Madhapur Hyderabad high-rise construction site, M30 concrete sample" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDsI3iVh8kwWbqZ3owmnykCxMMqQ8BT9YRB5i8zDVc8vkIoPnHwyRM1m21iA5gnRj6h-8cTiovyX8hEcnZZO0BUIaw-Yw-RQPQJ7co-7b5aFLCXe7XcA1_ce9d36pMLnVDmAulzzGEM_TeVIOyR23df5IEaOkYKWILP9G56GhnBxN8hVxQHYF0itCJdNWX2rsw4_kW4PDzW1Mc3TmpwTaZUtt2u10gLP-qgXBNv6blfG_Xp9_h9PUQs" />
<div className="absolute inset-0 bg-gradient-to-t from-inverse-surface/80 via-transparent to-black/30"></div>
<div className="absolute top-space-sm left-space-sm flex items-center gap-space-xs">
<span className="px-space-xs py-space-2xs rounded bg-tertiary-container text-on-tertiary-container font-label-sm text-label-sm font-semibold">
                QA/QC Slump: 125mm
              </span>
<span className="px-space-xs py-space-2xs rounded bg-surface-container-lowest/90 text-on-surface font-label-sm text-label-sm">
                Transit Mixer #09
              </span>
</div>
<div className="absolute bottom-space-xs left-space-sm right-space-sm flex items-center justify-between text-inverse-on-surface font-label-sm text-label-sm">
<span>Batch #MH-42 • M30 Grade</span>
<span>1 hr ago • 29°C</span>
</div>
</div>
<div className="p-space-md flex flex-col gap-space-xs">
<div className="flex items-start justify-between gap-space-sm">
<div className="flex flex-col">
<span className="font-title-md text-title-md text-on-surface group-hover:text-primary transition-colors">RMC Slump Cone &amp; Cube Sampling</span>
<span className="font-body-sm text-body-sm text-on-surface-variant">By QA Tech Suresh V. • 6 Cubes Cast</span>
</div>
<span className="px-space-xs py-space-2xs rounded bg-primary-container/20 text-primary font-label-sm text-label-sm">Pass (120±25mm)</span>
</div>
<div className="flex items-center gap-space-xs flex-wrap pt-space-xs">
<span className="px-space-xs py-space-2xs rounded bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm">Mix: UltraTech M30</span>
<span className="px-space-xs py-space-2xs rounded bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm">Water-Cement: 0.42</span>
</div>
<div className="flex items-center justify-between pt-space-sm">
<div className="flex items-center gap-space-2xs text-on-surface-variant font-label-sm text-label-sm">
<span className="material-symbols-outlined text-space-base text-tertiary">science</span>
<span>Cube IDs #CB-112..117</span>
</div>
<button className="px-space-sm py-space-2xs rounded bg-surface-container text-on-surface hover:bg-surface-variant font-label-sm text-label-sm">
                View Lab Certificate
              </button>
</div>
</div>
</div>

<div className="flex flex-col rounded-xl bg-surface-container-lowest shadow-sm hover:shadow-md overflow-hidden relative group cursor-pointer transition-transform hover:-translate-y-0.5">
<div className="relative h-48 w-full bg-surface-container">
<img className="w-full h-full object-cover" data-alt="High-resolution aerial drone survey orthomosaic mapping of a twin-tower high-rise construction site in Hyderabad showing tower crane radius, concrete batching zone, and structural floor slab progress" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDLOumc2G4cFHVK6fsYtOQ4nUvVeIaKiPny2bxRcxvsCkdiom1L7fKUSj8Vc6d7WY1lAX6auPxDdHE4d1uADo374j19GKpTby37HZS-F_p-EeEYd-w32Jkn5zgzB4DkId1r552gfxU1BDYYMaL__Yt5V08YBZclZZV8K98W_0p2lCtZAx-wHxxu9CCW1wEHzDKAo2s0bRVeR5z-6cXKQ0sqvwlEbx_4gkujMzmEYiuhsPtabDO0Isk1" />
<div className="absolute inset-0 bg-gradient-to-t from-inverse-surface/80 via-transparent to-black/30"></div>
<div className="absolute top-space-sm left-space-sm flex items-center gap-space-xs">
<span className="px-space-xs py-space-2xs rounded bg-secondary text-on-secondary font-label-sm text-label-sm font-semibold flex items-center gap-space-2xs">
<span className="material-symbols-outlined text-[14px]">flight_takeoff</span>
                Drone Flight #DF-18
              </span>
<span className="px-space-xs py-space-2xs rounded bg-surface-container-lowest/90 text-on-surface font-label-sm text-label-sm">
                Week 34 Ortho
              </span>
</div>
<div className="absolute bottom-space-xs left-space-sm right-space-sm flex items-center justify-between text-inverse-on-surface font-label-sm text-label-sm">
<span>Altitude 85m • GSD 1.4 cm/px</span>
<span className="text-primary-fixed font-bold">+4.2% WoW Progress</span>
</div>
</div>
<div className="p-space-md flex flex-col gap-space-xs">
<div className="flex items-start justify-between gap-space-sm">
<div className="flex flex-col">
<span className="font-title-md text-title-md text-on-surface group-hover:text-primary transition-colors">Site Aerial Photogrammetry Orthomosaic</span>
<span className="font-body-sm text-body-sm text-on-surface-variant">Piloted by SkyCivil • 08:30 AM</span>
</div>
<span className="px-space-xs py-space-2xs rounded bg-surface-container text-on-surface font-label-sm text-label-sm">CAD Grid Overlay</span>
</div>
<div className="flex items-center gap-space-xs flex-wrap pt-space-xs">
<span className="px-space-xs py-space-2xs rounded bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm">3.8 Acre Perimeter</span>
<span className="px-space-xs py-space-2xs rounded bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm">Earthwork Cut/Fill Calc</span>
</div>
<div className="flex items-center justify-between pt-space-sm">
<div className="flex items-center gap-space-2xs text-on-surface-variant font-label-sm text-label-sm">
<span className="material-symbols-outlined text-space-base">layers</span>
<span>GeoTIFF / DXF Synced</span>
</div>
<button className="px-space-sm py-space-2xs rounded bg-surface-container text-on-surface hover:bg-surface-variant font-label-sm text-label-sm">
                Launch 3D Point Cloud
              </button>
</div>
</div>
</div>

<div className="flex flex-col rounded-xl bg-surface-container-lowest shadow-sm hover:shadow-md overflow-hidden relative group cursor-pointer transition-transform hover:-translate-y-0.5">
<div className="relative h-48 w-full bg-surface-container">
<img className="w-full h-full object-cover" data-alt="360 degree panoramic view of semi-finished apartment interior showing electrical conduits, plumbing pipes in brick walls, and concrete ceiling before plastering in high-rise building" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDIpewzELxcUYM-3v8NDmhRNQGqwMEhovk3YAyKsxpyAJQvdVesHSfrrt1biu4YArPWguN3xgbb7Aq8vTjqBevW6uTLI4PqBgBTwQQLfZwKytXH5yC4cEASxTxO2cWqwMg8lt9QefbwJsgIvUaSV40yNWN8ZI10PCXJHUeO6b9Np_BkYsos5Y4LaV3WYIrmuEt-d6g6uuv702u9U-LMu70MmtQ-UCW8qFgTXRNjJHBqHu5K8M6owCVx" />
<div className="absolute inset-0 bg-gradient-to-t from-inverse-surface/80 via-transparent to-black/30"></div>
<div className="absolute top-space-sm left-space-sm flex items-center gap-space-xs">
<span className="px-space-xs py-space-2xs rounded bg-tertiary text-on-tertiary font-label-sm text-label-sm font-semibold flex items-center gap-space-2xs">
<span className="material-symbols-outlined text-[14px]">360</span>
                360° Sphere
              </span>
<span className="px-space-xs py-space-2xs rounded bg-surface-container-lowest/90 text-on-surface font-label-sm text-label-sm">
                Insta360 Pro 2
              </span>
</div>

<div className="absolute inset-0 flex items-center justify-center">
<div className="w-12 h-12 rounded-full bg-inverse-surface/80 text-inverse-on-surface flex items-center justify-center backdrop-blur-sm group-hover:scale-110 transition-transform">
<span className="material-symbols-outlined text-headline-sm">screen_rotation_alt</span>
</div>
</div>
<div className="absolute bottom-space-xs left-space-sm right-space-sm flex items-center justify-between text-inverse-on-surface font-label-sm text-label-sm">
<span>Flat 402 • 3BHK Unit</span>
<span>Stage 10: MEP In-Wall</span>
</div>
</div>
<div className="p-space-md flex flex-col gap-space-xs">
<div className="flex items-start justify-between gap-space-sm">
<div className="flex flex-col">
<span className="font-title-md text-title-md text-on-surface group-hover:text-primary transition-colors">Living &amp; Utility Conduits As-Built Walk</span>
<span className="font-body-sm text-body-sm text-on-surface-variant">By MEP Supervisor Anji Reddy • Yesterday</span>
</div>
<span className="px-space-xs py-space-2xs rounded bg-surface-container text-on-surface font-label-sm text-label-sm">Pre-Plaster Sign</span>
</div>
<div className="flex items-center gap-space-xs flex-wrap pt-space-xs">
<span className="px-space-xs py-space-2xs rounded bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm">18 Conduits Mapped</span>
<span className="px-space-xs py-space-2xs rounded bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm">DB Box Alignment OK</span>
</div>
<div className="flex items-center justify-between pt-space-sm">
<div className="flex items-center gap-space-2xs text-on-surface-variant font-label-sm text-label-sm">
<span className="material-symbols-outlined text-space-base">view_in_ar</span>
<span>BIM Overlay Linked</span>
</div>
<button className="px-space-sm py-space-2xs rounded bg-surface-container text-on-surface hover:bg-surface-variant font-label-sm text-label-sm">
                Open Virtual Tour
              </button>
</div>
</div>
</div>

<div className="flex flex-col rounded-xl bg-surface-container-lowest shadow-sm hover:shadow-md overflow-hidden relative group cursor-pointer transition-transform hover:-translate-y-0.5">
<div className="relative h-48 w-full bg-surface-container">
<img className="w-full h-full object-cover" data-alt="Close-up construction inspection of minor honeycombing on newly deshuttered reinforced concrete column base in commercial building site, marked with red chalk for non-shrink grouting" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAHFlct58PZ2tooit1DAN0vwCYjig0JsNQPBkymiivL0pIKZvD-qDu44I6JCk3c_vSuiuiBtGgg_litPfkTMayVQrupEVLM8jkK-xE5ihRIgGp098PNEb572XidmMd1XBGd4RvOfJpVfYuPGuZiYcQbDHfYjKOLIGMGhnbMBGF6OwoQc4M7hLJ6H42FJPs0wRYEZDZjFQ5i96LLr7VbYUFaZnAZSBdQLZX6PbZLboA9eHB4wzX_IPXs" />
<div className="absolute inset-0 bg-gradient-to-t from-inverse-surface/80 via-transparent to-black/30"></div>
<div className="absolute top-space-sm left-space-sm flex items-center gap-space-xs">
<span className="px-space-xs py-space-2xs rounded bg-error text-on-error font-label-sm text-label-sm font-semibold flex items-center gap-space-2xs">
<span className="material-symbols-outlined text-[14px]">warning</span>
                Snag: Rectification Req.
              </span>
</div>
<div className="absolute bottom-space-xs left-space-sm right-space-sm flex items-center justify-between text-inverse-on-surface font-label-sm text-label-sm">
<span>Column C3 • Stilt Floor</span>
<span className="text-error-container bg-inverse-surface/60 px-space-xs rounded">Due in 24h</span>
</div>
</div>
<div className="p-space-md flex flex-col gap-space-xs">
<div className="flex items-start justify-between gap-space-sm">
<div className="flex flex-col">
<span className="font-title-md text-title-md text-on-surface group-hover:text-primary transition-colors">Column Honeycombing Post-Deshuttering</span>
<span className="font-body-sm text-body-sm text-on-surface-variant">Logged by QC Inspector Venkat • 3 hrs ago</span>
</div>
<span className="px-space-xs py-space-2xs rounded bg-error-container text-on-error-container font-label-sm text-label-sm">High Priority</span>
</div>
<p className="font-body-sm text-body-sm text-on-surface-variant">
              Non-structural surface honeycombing at column base. Prescribed Fosroc Renderoc non-shrink polymer grout repair before load transfer.
            </p>
<div className="flex items-center justify-between pt-space-sm">
<div className="flex items-center gap-space-2xs text-on-surface-variant font-label-sm text-label-sm">
<span className="material-symbols-outlined text-space-base">person</span>
<span>Assigned: Raju Shuttering</span>
</div>
<button className="px-space-sm py-space-2xs rounded bg-error-container text-on-error-container hover:bg-error/20 font-label-sm text-label-sm font-medium">
                Verify Rectification
              </button>
</div>
</div>
</div>

<div className="flex flex-col rounded-xl bg-surface-container-lowest shadow-sm hover:shadow-md overflow-hidden relative group cursor-pointer transition-transform hover:-translate-y-0.5">
<div className="relative h-48 w-full bg-surface-container">
<img className="w-full h-full object-cover" data-alt="Heavy truck trailer loaded with bundles of Fe500D steel rebar arriving at Indian construction material yard with security weighbridge slip and bundle barcode tag verification" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDIiUFMsiZxB5PNKl3YI02PnMdnRN_jNWhLxtgq81uTuR7B9cPA8cC6nyb_qN-EjyLEaT5SccddF9JcbrMw2sxB3ZDLFZpsC4r8LvURtTA-xQ7kb7OEdN-hiN5WXKX49X9uVddBf2sJZzV5UJ6nGSozDoTBn1dW6gTH8wFpHI51R8hXWm1oZ1z-GZOL86gCf2AAxaj4DnEdTe5MEenBoZbySWoKRueUu8_IlpUAdgNNsMd9BMcttc3g" />
<div className="absolute inset-0 bg-gradient-to-t from-inverse-surface/80 via-transparent to-black/30"></div>
<div className="absolute top-space-sm left-space-sm flex items-center gap-space-xs">
<span className="px-space-xs py-space-2xs rounded bg-primary-container text-on-primary-container font-label-sm text-label-sm font-semibold flex items-center gap-space-2xs">
<span className="material-symbols-outlined text-[14px]">local_shipping</span>
                Store Inward Verified
              </span>
</div>
<div className="absolute bottom-space-xs left-space-sm right-space-sm flex items-center justify-between text-inverse-on-surface font-label-sm text-label-sm">
<span>Weighbridge Slip #WB-4902</span>
<span>24.8 Metric Tonnes</span>
</div>
</div>
<div className="p-space-md flex flex-col gap-space-xs">
<div className="flex items-start justify-between gap-space-sm">
<div className="flex flex-col">
<span className="font-title-md text-title-md text-on-surface group-hover:text-primary transition-colors">Jairaj Fe500D 16mm Rebar Heat Tag Ingest</span>
<span className="font-body-sm text-body-sm text-on-surface-variant">By Store Mgr. Naresh B. • 4 hrs ago</span>
</div>
<span className="px-space-xs py-space-2xs rounded bg-surface-container text-on-surface font-label-sm text-label-sm">PO #8842</span>
</div>
<div className="flex items-center gap-space-xs flex-wrap pt-space-xs">
<span className="px-space-xs py-space-2xs rounded bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm">Heat No. #H-7781</span>
<span className="px-space-xs py-space-2xs rounded bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm">Mill Test Cert Attached</span>
</div>
<div className="flex items-center justify-between pt-space-sm">
<div className="flex items-center gap-space-2xs text-on-surface-variant font-label-sm text-label-sm">
<span className="material-symbols-outlined text-space-base">receipt_long</span>
<span>Auto-Updated Inventory</span>
</div>
<button className="px-space-sm py-space-2xs rounded bg-surface-container text-on-surface hover:bg-surface-variant font-label-sm text-label-sm">
                View Gate Pass
              </button>
</div>
</div>
</div>
</div>

<div className="flex flex-col sm:flex-row items-center justify-between gap-space-sm p-space-base rounded-xl bg-surface-container-lowest shadow-sm">
<div className="flex items-center gap-space-sm">
<input className="rounded accent-primary w-4 h-4 cursor-pointer" type="checkbox" />
<span className="font-body-sm text-body-sm text-on-surface">Select all 18 visible items</span>
<span className="font-label-sm text-label-sm text-on-surface-variant">• 1 file selected</span>
</div>
<div className="flex items-center gap-space-xs">
<button className="px-space-sm py-space-xs rounded bg-surface-container-low text-on-surface hover:bg-surface-container font-label-md text-label-md">
            Download Selected (.ZIP)
          </button>
<button className="px-space-sm py-space-xs rounded bg-surface-container-low text-on-surface hover:bg-surface-container font-label-md text-label-md">
            Assign to Snag
          </button>
<button className="px-space-sm py-space-xs rounded bg-primary text-on-primary hover:bg-primary-container font-label-md text-label-md">
            Batch AI Verify
          </button>
</div>
</div>
</div>

<div className="lg:col-span-4 flex flex-col gap-space-base sticky top-20">

<div className="rounded-xl bg-surface-container-lowest p-space-base shadow-sm flex flex-col gap-space-base">

<div className="flex items-center justify-between pb-space-xs">
<div className="flex items-center gap-space-xs">
<span className="font-title-md text-title-md text-on-surface font-bold">Asset Inspector</span>
<span className="px-space-xs py-space-2xs rounded bg-primary-container text-on-primary-container font-label-sm text-label-sm">#IMG-4892</span>
</div>
<div className="flex items-center gap-space-2xs">
<button className="p-1 rounded text-on-surface-variant hover:text-on-surface hover:bg-surface-container" title="Open Fullscreen">
<span className="material-symbols-outlined text-space-base">fullscreen</span>
</button>
<button className="p-1 rounded text-on-surface-variant hover:text-on-surface hover:bg-surface-container" title="Options">
<span className="material-symbols-outlined text-space-base">more_vert</span>
</button>
</div>
</div>

<div className="relative rounded-lg overflow-hidden bg-surface-container">
<img className="w-full h-52 object-cover" data-alt="Annotated technical view of slab rebar mesh with green overlay boxes highlighting verified concrete cover spacer blocks and steel diameter compliance tags" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAy1VLoJPWbTmIV3LWocLTW9qsD9XJrWZ0OJ_WAWIy5sxKj1mT_qkhomZopKTtqzxKUr64f9R5RgVt_ev9euN5UNcfvoViRMMDzbp2R_PYj29bMhjWDyPx8jI6pGwdQ2-TCl62788HikpIHM6e8uD_JPcYnMKdNjoYmYpNwwZdpy7D1M9F8cb3cwrzRVCWEtIV72PTpk0zlYFpWxaLaZOTkisBEXLHw_br9P3azaUc2srfs0nY7GSDA" />
<div className="absolute inset-0 bg-black/10"></div>

<div className="absolute top-12 left-10 w-24 h-16 border-2 border-primary-fixed bg-primary/20 rounded flex items-start justify-start p-1 pointer-events-none">
<span className="bg-inverse-surface text-inverse-on-surface font-label-sm text-[9px] px-1 rounded">25mm Spacer [99%]</span>
</div>
<div className="absolute bottom-6 right-12 w-28 h-20 border-2 border-tertiary-fixed bg-tertiary/20 rounded flex items-start justify-start p-1 pointer-events-none">
<span className="bg-inverse-surface text-inverse-on-surface font-label-sm text-[9px] px-1 rounded">Fe500D 16mm TMT</span>
</div>
<div className="absolute bottom-2 left-2 px-space-xs py-space-2xs rounded bg-inverse-surface/80 text-inverse-on-surface font-label-sm text-[10px]">
            AI Computer Vision v4.2 Active
          </div>
</div>

<div className="flex flex-col gap-space-xs p-space-sm rounded bg-surface-container-low">
<div className="flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm">
<span>Original Captured</span>
<span className="text-on-surface font-semibold">Today • 09:42:18 AM IST</span>
</div>
<div className="flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm">
<span>GPS Fix</span>
<span className="text-on-surface font-tabular-metric-sm text-tabular-metric-sm">17.4485° N, 78.3742° E (±1.1m)</span>
</div>
<div className="flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm">
<span>Capture Device</span>
<span className="text-on-surface">Apple iPad Pro 12.9" (LiDAR)</span>
</div>
<div className="flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm">
<span>On-Site Weather</span>
<span className="text-on-surface">31°C Madhapur, 62% RH, Clear</span>
</div>
<div className="flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm">
<span>Cryptographic Hash</span>
<span className="text-primary font-mono text-[10px] truncate max-w-[170px]">e3b0c44298fc1c149afbf4c8996fb92427ae</span>
</div>
</div>

<div className="flex flex-col gap-space-xs">
<span className="font-label-md text-label-md text-on-surface font-bold uppercase tracking-wider">Project Linkage &amp; BOQ Mapping</span>
<div className="flex flex-col gap-space-2xs">
<div className="flex items-center justify-between p-space-xs rounded bg-surface hover:bg-surface-container transition-colors">
<div className="flex items-center gap-space-xs">
<span className="material-symbols-outlined text-space-base text-primary">account_tree</span>
<div className="flex flex-col">
<span className="font-label-sm text-label-sm text-on-surface font-semibold">Stage 07: RCC 4th Floor Slab</span>
<span className="font-body-sm text-[11px] text-on-surface-variant">Current Target Milestones</span>
</div>
</div>
<span className="material-symbols-outlined text-space-base text-on-surface-variant">arrow_forward</span>
</div>
<div className="flex items-center justify-between p-space-xs rounded bg-surface hover:bg-surface-container transition-colors">
<div className="flex items-center gap-space-xs">
<span className="material-symbols-outlined text-space-base text-tertiary">receipt_long</span>
<div className="flex flex-col">
<span className="font-label-sm text-label-sm text-on-surface font-semibold">BOQ Line 04-201</span>
<span className="font-body-sm text-[11px] text-on-surface-variant">RCC M25 Slabs (420 m³ total)</span>
</div>
</div>
<span className="material-symbols-outlined text-space-base text-on-surface-variant">arrow_forward</span>
</div>
<div className="flex items-center justify-between p-space-xs rounded bg-surface hover:bg-surface-container transition-colors">
<div className="flex items-center gap-space-xs">
<span className="material-symbols-outlined text-space-base text-primary">verified</span>
<div className="flex flex-col">
<span className="font-label-sm text-label-sm text-on-surface font-semibold">Pour Card #PC-048</span>
<span className="font-body-sm text-[11px] text-on-surface-variant">Consultant: Spatial Structural</span>
</div>
</div>
<span className="px-space-xs py-space-2xs rounded bg-primary-container text-on-primary-container font-label-sm text-[10px]">Verified</span>
</div>
<div className="flex items-center justify-between p-space-xs rounded bg-surface hover:bg-surface-container transition-colors">
<div className="flex items-center gap-space-xs">
<span className="material-symbols-outlined text-space-base text-secondary">groups</span>
<div className="flex flex-col">
<span className="font-label-sm text-label-sm text-on-surface font-semibold">Master Shuttering Gang</span>
<span className="font-body-sm text-[11px] text-on-surface-variant">Subcontractor: Raju Bar-benders</span>
</div>
</div>
<span className="font-label-sm text-[11px] text-on-surface-variant">32 Workers</span>
</div>
</div>
</div>

<div className="flex flex-col gap-space-xs">
<div className="flex items-center justify-between">
<span className="font-label-md text-label-md text-on-surface font-bold uppercase tracking-wider">AI Computer Vision Tags</span>
<span className="font-label-sm text-label-sm text-primary font-semibold">4 Detections</span>
</div>
<div className="space-y-1.5">
<div className="flex items-center justify-between text-body-sm font-body-sm">
<span className="flex items-center gap-space-2xs text-on-surface">
<span className="w-2 h-2 rounded-full bg-primary"></span>
                25mm Concrete Cover Spacers
              </span>
<span className="text-on-surface-variant font-medium">88 count (98.4% spec)</span>
</div>
<div className="flex items-center justify-between text-body-sm font-body-sm">
<span className="flex items-center gap-space-2xs text-on-surface">
<span className="w-2 h-2 rounded-full bg-primary"></span>
                Fe500D Reinforcement Lap Length
              </span>
<span className="text-on-surface-variant font-medium">50d (800mm) OK</span>
</div>
<div className="flex items-center justify-between text-body-sm font-body-sm">
<span className="flex items-center gap-space-2xs text-on-surface">
<span className="w-2 h-2 rounded-full bg-primary"></span>
                PVC Conduits &amp; Fan Hook Anchors
              </span>
<span className="text-on-surface-variant font-medium">12 runs bound firmly</span>
</div>
<div className="flex items-center justify-between text-body-sm font-body-sm">
<span className="flex items-center gap-space-2xs text-on-surface">
<span className="w-2 h-2 rounded-full bg-primary"></span>
                Foreign Debris / Sawdust Check
              </span>
<span className="text-primary font-semibold">Zero debris detected</span>
</div>
</div>
</div>

<div className="flex flex-col gap-space-xs pt-space-xs">
<span className="font-label-md text-label-md text-on-surface font-bold uppercase tracking-wider">Chain of Custody</span>
<div className="relative pl-6 space-y-3 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-surface-container-high">
<div className="relative">
<div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-primary ring-2 ring-surface-container-lowest"></div>
<div className="flex flex-col">
<span className="font-label-sm text-label-sm text-on-surface font-bold">Uploaded &amp; Geo-stamped</span>
<span className="font-body-sm text-[11px] text-on-surface-variant">Rajesh K. (Site Engineer) • 09:42 AM</span>
</div>
</div>
<div className="relative">
<div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-primary ring-2 ring-surface-container-lowest"></div>
<div className="flex flex-col">
<span className="font-label-sm text-label-sm text-on-surface font-bold">AI Structural Verification Complete</span>
<span className="font-body-sm text-[11px] text-on-surface-variant">Saha Neural Vision Engine • 09:43 AM</span>
</div>
</div>
<div className="relative">
<div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-primary ring-2 ring-surface-container-lowest"></div>
<div className="flex flex-col">
<span className="font-label-sm text-label-sm text-on-surface font-bold">Approved for Pouring</span>
<span className="font-body-sm text-[11px] text-on-surface-variant">Shravan Kumar (Site Chief) • 10:04 AM</span>
</div>
</div>
</div>
</div>

<div className="flex items-center gap-space-xs pt-space-sm">
<button className="flex-1 flex items-center justify-center gap-space-2xs px-space-sm py-space-xs rounded bg-surface-container-high text-on-surface hover:bg-surface-variant font-label-md text-label-md transition-colors">
<span className="material-symbols-outlined text-space-base">draw</span>
<span>Markup / Snag</span>
</button>
<button className="flex-1 flex items-center justify-center gap-space-2xs px-space-sm py-space-xs rounded bg-primary text-on-primary hover:bg-primary-container font-label-md text-label-md transition-colors">
<span className="material-symbols-outlined text-space-base">share</span>
<span>Sign &amp; Share</span>
</button>
</div>
</div>

<div className="rounded-xl bg-surface-container-lowest p-space-base shadow-sm flex flex-col gap-space-sm">
<div className="flex items-center justify-between">
<span className="font-label-md text-label-md text-on-surface font-bold uppercase tracking-wider">Site Media System Reference</span>
<span className="px-space-xs py-space-2xs rounded bg-secondary-container text-on-secondary-container font-label-sm text-label-sm">Active Module</span>
</div>
<div className="rounded-lg overflow-hidden relative">
<img alt="Site media active navigation reference screenshot" className="w-full h-auto object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD0WatAgr0JtJeoJteW3aqxdq-eHmaIceYDElPSkcV8fNPq6AGaI82zD5bk4DASrYEtSfCd8g2uTH2yWiA0NuC06Yt3O3oCUoOszBncjq2raUzadSiO_PD0DsHu6tPHDc0d-Kv14DQ5UltK98Z6SMFlTA0cX4n73rvmzNTuC3ecgz2aXeHvwGA495bFHPfoGibgnKGNt3UaNopfmTmwxz3tQeP0ICK_se1tZBYUI0T1C9N96x6AWf9tfUoE4JCFMCbbfw" />
</div>
<div className="flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm pt-space-2xs">
<span>Module: Site Work &gt; Site Media &amp; Uploads</span>
<span className="text-primary font-medium">Sync Rate: 100%</span>
</div>
</div>
</div>
</div>


</div></main></div>
    </div>
  );
}
