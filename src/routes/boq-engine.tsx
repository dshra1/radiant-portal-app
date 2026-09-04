import { createFileRoute } from "@tanstack/react-router";
import { Shell } from "@/components/saha/Shell";

export const Route = createFileRoute("/boq-engine")({
  head: () => ({
    meta: [
      { title: "BOQ Master Engine \u2014 Stage Optimization | Saha OS" },
      { name: "description", content: "Line-item BOQ optimization with AI value engineering and spec compliance scoring." },
      { property: "og:title", content: "BOQ Master Engine \u2014 Stage Optimization | Saha OS" },
      { property: "og:description", content: "Line-item BOQ optimization with AI value engineering and spec compliance scoring." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <Shell title={"BOQ Master Engine \\u2014 Stage Optimization | Saha OS"}>
      <div className="m3">
        <main className="relative pt-16 w-full px-space-xl pb-space-3xl  bg-surface"><div className="flex flex-col w-full">

<div className="flex flex-col gap-space-sm mb-space-base">
<div className="flex flex-wrap items-center justify-between gap-space-sm text-body-sm font-body-sm text-on-surface-variant">
<div className="flex items-center gap-space-xs">
<a className="text-tertiary hover:underline" href="#">Projects</a>
<span>/</span>
<span className="text-on-surface font-title-md text-title-md">Cyber Enclave - Phase 2</span>
<span>/</span>
<a className="text-tertiary hover:underline" href="#">BOQ Master Engine</a>
<span>/</span>
<span className="px-space-xs py-space-2xs rounded bg-surface-container-high text-on-surface font-label-sm text-label-sm">Stage 04: MEP &amp; Electrical</span>
</div>
<div className="flex items-center gap-space-sm text-label-sm font-label-sm">
<span className="flex items-center gap-space-2xs text-primary font-semibold">
<span className="h-2 w-2 rounded-full bg-primary animate-ping"></span>
          Hyderabad Electrical Wholesale Mandi Synced: 14 mins ago
        </span>
<span className="text-outline-variant">•</span>
<span className="text-on-surface-variant">Revision: R3-Final-Approved</span>
</div>
</div>

<div className="grid grid-cols-2 md:grid-cols-5 gap-space-sm">
<div className="p-space-sm rounded bg-surface-container-lowest shadow-sm flex flex-col justify-between">
<span className="text-label-sm font-label-sm uppercase text-on-surface-variant tracking-wider">Active Stage Items</span>
<div className="flex items-baseline gap-space-xs mt-space-2xs">
<span className="text-tabular-metric font-tabular-metric text-on-surface">48</span>
<span className="text-body-sm font-body-sm text-on-surface-variant">line items</span>
</div>
</div>
<div className="p-space-sm rounded bg-surface-container-lowest shadow-sm flex flex-col justify-between">
<span className="text-label-sm font-label-sm uppercase text-on-surface-variant tracking-wider">Original Baseline</span>
<div className="flex items-baseline gap-space-xs mt-space-2xs">
<span className="text-tabular-metric font-tabular-metric text-on-surface line-through decoration-error/50">₹54,82,400</span>
</div>
</div>
<div className="p-space-sm rounded bg-surface-container-lowest shadow-sm flex flex-col justify-between">
<span className="text-label-sm font-label-sm uppercase text-primary font-semibold tracking-wider">AI Optimized Total</span>
<div className="flex items-baseline gap-space-xs mt-space-2xs">
<span className="text-tabular-metric font-tabular-metric text-primary">₹48,36,200</span>
</div>
</div>
<div className="p-space-sm rounded bg-surface-container-lowest shadow-sm flex flex-col justify-between">
<span className="text-label-sm font-label-sm uppercase text-on-surface-variant tracking-wider">Net Line Savings (VE)</span>
<div className="flex items-center gap-space-xs mt-space-2xs">
<span className="text-tabular-metric font-tabular-metric text-primary">₹6,46,200</span>
<span className="px-space-xs py-space-2xs rounded bg-surface-variant text-on-primary-fixed-variant text-label-sm font-label-sm font-bold">-11.8%</span>
</div>
</div>
<div className="p-space-sm rounded bg-surface-container-lowest shadow-sm flex flex-col justify-between col-span-2 md:col-span-1">
<span className="text-label-sm font-label-sm uppercase text-on-surface-variant tracking-wider">Spec Compliance Score</span>
<div className="flex items-center justify-between mt-space-2xs">
<span className="text-tabular-metric font-tabular-metric text-tertiary">99.4%</span>
<span className="text-label-sm font-label-sm px-space-xs py-space-2xs rounded bg-secondary-container text-on-secondary-container">CPWD / IS Code Passed</span>
</div>
</div>
</div>
</div>

<div className="bg-surface-container-lowest p-space-sm rounded shadow-sm flex flex-wrap items-center justify-between gap-space-md mb-space-base">
<div className="flex flex-wrap items-center gap-space-xs">
<button className="px-space-sm py-space-xs rounded font-title-md text-title-md bg-surface-container text-on-surface-variant hover:bg-surface-container-high transition-colors">
        All Trades (128)
      </button>
<button className="px-space-sm py-space-xs rounded font-title-md text-title-md bg-primary text-on-primary shadow-sm flex items-center gap-space-xs">
<span>Electrical &amp; Conduits</span>
<span className="px-space-xs py-space-2xs rounded-full bg-primary-container text-on-primary-container text-label-sm font-label-sm">48</span>
</button>
<button className="px-space-sm py-space-xs rounded font-title-md text-title-md bg-surface-container text-on-surface-variant hover:bg-surface-container-high transition-colors">
        Steel &amp; TMT (Fe550D)
      </button>
<button className="px-space-sm py-space-xs rounded font-title-md text-title-md bg-surface-container text-on-surface-variant hover:bg-surface-container-high transition-colors">
        Plumbing &amp; Sanitary
      </button>
<button className="px-space-sm py-space-xs rounded font-title-md text-title-md bg-surface-container text-on-surface-variant hover:bg-surface-container-high transition-colors">
        Tiles &amp; Granite Flooring
      </button>
<button className="px-space-sm py-space-xs rounded font-title-md text-title-md bg-surface-container text-on-surface-variant hover:bg-surface-container-high transition-colors">
        RMC M25/M30 Concrete
      </button>
</div>

<div className="flex items-center gap-space-xs">
<button className="flex items-center gap-space-xs px-space-sm py-space-xs rounded bg-surface-container text-on-surface hover:bg-surface-container-high text-label-md font-label-md transition-colors" title="Sync live pricing feeds from wholesale mandis">
<span className="material-symbols-outlined text-space-base text-primary">sync</span>
<span>Mandi Refresh</span>
</button>
<button className="flex items-center gap-space-xs px-space-sm py-space-xs rounded bg-surface-container text-on-surface hover:bg-surface-container-high text-label-md font-label-md transition-colors">
<span className="material-symbols-outlined text-space-base text-secondary">download</span>
<span>Export .XLSX</span>
</button>
<button className="flex items-center gap-space-xs px-space-sm py-space-xs rounded bg-primary-container text-on-primary-container hover:bg-primary text-label-md font-label-md transition-colors">
<span className="material-symbols-outlined text-space-base">auto_fix_high</span>
<span>Auto-Substitute Approved (4)</span>
</button>
</div>
</div>

<div className="relative bg-surface-container-lowest rounded shadow-sm overflow-visible mb-space-2xl">
<div className="overflow-x-auto min-h-[720px]">
<table className="w-full text-left table-auto border-collapse">

<thead>
<tr className="bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider select-none">
<th className="py-space-sm px-space-md font-semibold">Material / Line Item</th>
<th className="py-space-sm px-space-sm font-semibold">Unit</th>
<th className="py-space-sm px-space-sm font-semibold text-right">Qty</th>
<th className="py-space-sm px-space-md font-semibold">Selected Brand &amp; Spec Tier</th>
<th className="py-space-sm px-space-md font-semibold">Primary Supplier / Channel</th>
<th className="py-space-sm px-space-sm font-semibold text-right">Baseline (₹)</th>
<th className="py-space-sm px-space-sm font-semibold text-right text-primary font-bold">Optimized (₹)</th>
<th className="py-space-sm px-space-md font-semibold text-right">Total Line (₹)</th>
<th className="py-space-sm px-space-sm font-semibold text-center">VE Action</th>
</tr>
</thead>
<tbody className="divide-y divide-surface-container font-body-md text-body-md text-on-surface">

<tr className="hover:bg-surface-container-low/50 transition-colors group">
<td className="py-space-sm px-space-md">
<div className="font-title-md text-title-md text-on-surface">PVC Conduits (Concealed)</div>
<span className="font-label-sm text-label-sm text-on-surface-variant">Electrical • Heavy Duty 25mm</span>
</td>
<td className="py-space-sm px-space-sm text-on-surface-variant font-tabular-metric-sm text-tabular-metric-sm">RFT</td>
<td className="py-space-sm px-space-sm text-right font-tabular-metric-sm text-tabular-metric-sm">42,000</td>
<td className="py-space-sm px-space-md">
<button className="flex items-center justify-between gap-space-xs px-space-sm py-space-xs rounded bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors font-body-md text-body-md w-full max-w-[210px]">
<span className="truncate">AKG / Precision FRLS</span>
<span className="material-symbols-outlined text-space-base text-on-surface-variant">expand_more</span>
</button>
</td>
<td className="py-space-sm px-space-md text-on-surface-variant font-body-sm text-body-sm">
              Electrical Distributor • Kukatpally
            </td>
<td className="py-space-sm px-space-sm text-right text-on-surface-variant font-tabular-metric-sm text-tabular-metric-sm">
<span className="line-through">22</span>
</td>
<td className="py-space-sm px-space-sm text-right font-tabular-metric-sm text-tabular-metric-sm text-primary font-bold">
              20
            </td>
<td className="py-space-sm px-space-md text-right font-tabular-metric font-tabular-metric text-on-surface">
              ₹8,40,000
            </td>
<td className="py-space-sm px-space-sm text-center">
<span className="material-symbols-outlined text-primary text-space-lg cursor-pointer hover:scale-110 transition-transform" title="AI Value Engineering Identified: Sudhakar Brand saves \u20b92,94,000">auto_awesome</span>
</td>
</tr>

<tr className="hover:bg-surface-container-low/50 transition-colors group">
<td className="py-space-sm px-space-md">
<div className="font-title-md text-title-md text-on-surface">FRLS Copper Wiring (Multi-strand)</div>
<span className="font-label-sm text-label-sm text-on-surface-variant">Electrical • 1.5 sq mm / 2.5 sq mm</span>
</td>
<td className="py-space-sm px-space-sm text-on-surface-variant font-tabular-metric-sm text-tabular-metric-sm">RFT</td>
<td className="py-space-sm px-space-sm text-right font-tabular-metric-sm text-tabular-metric-sm">1,02,000</td>
<td className="py-space-sm px-space-md">
<button className="flex items-center justify-between gap-space-xs px-space-sm py-space-xs rounded bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors font-body-md text-body-md w-full max-w-[210px]">
<span className="truncate">Polycab / Havells</span>
<span className="material-symbols-outlined text-space-base text-on-surface-variant">expand_more</span>
</button>
</td>
<td className="py-space-sm px-space-md text-on-surface-variant font-body-sm text-body-sm">
              Electrical Distributor • Ranigunj
            </td>
<td className="py-space-sm px-space-sm text-right text-on-surface-variant font-tabular-metric-sm text-tabular-metric-sm">
<span className="line-through">28</span>
</td>
<td className="py-space-sm px-space-sm text-right font-tabular-metric-sm text-tabular-metric-sm text-primary font-bold">
              25
            </td>
<td className="py-space-sm px-space-md text-right font-tabular-metric font-tabular-metric text-on-surface">
              ₹25,50,000
            </td>
<td className="py-space-sm px-space-sm text-center">
<span className="material-symbols-outlined text-primary text-space-lg cursor-pointer hover:scale-110 transition-transform" title="Bulk volume tier reached: Finolex price matching available">auto_awesome</span>
</td>
</tr>

<tr className="hover:bg-surface-container-low/50 transition-colors group">
<td className="py-space-sm px-space-md">
<div className="font-title-md text-title-md text-on-surface">Modular Switches (6A)</div>
<span className="font-label-sm text-label-sm text-on-surface-variant">Electrical • Flame-Retardant Polycarbonate</span>
</td>
<td className="py-space-sm px-space-sm text-on-surface-variant font-tabular-metric-sm text-tabular-metric-sm">NOS</td>
<td className="py-space-sm px-space-sm text-right font-tabular-metric-sm text-tabular-metric-sm">1,800</td>
<td className="py-space-sm px-space-md">
<button className="flex items-center justify-between gap-space-xs px-space-sm py-space-xs rounded bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors font-body-md text-body-md w-full max-w-[210px]">
<span className="truncate">Legrand Myrius</span>
<span className="material-symbols-outlined text-space-base text-on-surface-variant">expand_more</span>
</button>
</td>
<td className="py-space-sm px-space-md text-on-surface-variant font-body-sm text-body-sm">
              Electrical Distributor • Secunderabad
            </td>
<td className="py-space-sm px-space-sm text-right text-on-surface-variant font-tabular-metric-sm text-tabular-metric-sm">
<span className="line-through">190</span>
</td>
<td className="py-space-sm px-space-sm text-right font-tabular-metric-sm text-tabular-metric-sm text-primary font-bold">
              175
            </td>
<td className="py-space-sm px-space-md text-right font-tabular-metric font-tabular-metric text-on-surface">
              ₹3,15,000
            </td>
<td className="py-space-sm px-space-sm text-center">
<span className="material-symbols-outlined text-outline-variant text-space-lg cursor-pointer">check_circle</span>
</td>
</tr>

<tr className="bg-surface-container-low/80 relative">
<td className="py-space-sm px-space-md">
<div className="font-title-md text-title-md text-on-surface font-bold">Modular Sockets (16A)</div>
<span className="font-label-sm text-label-sm text-on-surface-variant">Electrical • Heavy Appliance 3-Pin Shuttered</span>
</td>
<td className="py-space-sm px-space-sm text-on-surface-variant font-tabular-metric-sm text-tabular-metric-sm">NOS</td>
<td className="py-space-sm px-space-sm text-right font-tabular-metric-sm text-tabular-metric-sm font-semibold">600</td>

<td className="py-space-sm px-space-md relative">
<button className="flex items-center justify-between gap-space-xs px-space-sm py-space-xs rounded bg-surface-container-highest text-on-surface font-title-md text-title-md shadow-sm w-full max-w-[210px] ring-2 ring-primary/40">
<span className="truncate font-semibold">Legrand Myrius</span>
<span className="material-symbols-outlined text-space-base text-primary">expand_less</span>
</button>

<div className="absolute left-space-md top-14 z-30 w-96 bg-surface-container-lowest rounded-xl shadow-2xl p-space-md flex flex-col gap-space-sm">

<div className="flex items-center justify-between pb-space-xs">
<div className="flex flex-col">
<span className="font-label-sm text-label-sm uppercase font-bold text-on-surface-variant tracking-wider">Brand Alternatives</span>
<span className="font-body-sm text-body-sm text-on-surface-variant">Value Engineering Mandi Benchmarks</span>
</div>
<span className="px-space-xs py-space-2xs rounded bg-surface-container-high text-primary font-label-sm text-label-sm font-semibold">Live Quotes</span>
</div>

<div className="flex flex-col gap-space-xs">

<div className="p-space-sm rounded bg-surface-container-low cursor-pointer hover:bg-surface-container transition-colors flex items-center justify-between">
<div className="flex items-start gap-space-sm">
<input className="mt-1 accent-primary" name="socket_alt" type="radio" />
<div className="flex flex-col">
<div className="flex items-center gap-space-xs">
<span className="font-title-md text-title-md text-on-surface">Legrand Myrius</span>
<span className="px-space-xs py-space-2xs rounded bg-surface-container-highest text-on-surface-variant font-label-sm text-label-sm">Current Spec</span>
</div>
<span className="font-body-sm text-body-sm text-on-surface-variant">Electrical Distributor • Hyderabad</span>
</div>
</div>
<div className="text-right">
<div className="font-tabular-metric-sm text-tabular-metric-sm font-bold text-primary">₹250</div>
<div className="font-label-sm text-label-sm text-on-surface-variant line-through">₹280</div>
</div>
</div>

<div className="p-space-sm rounded bg-surface-container-lowest hover:bg-surface-container-low transition-colors flex items-center justify-between">
<div className="flex items-start gap-space-sm">
<input className="mt-1 accent-primary" name="socket_alt" type="radio" />
<div className="flex flex-col">
<div className="flex items-center gap-space-xs">
<span className="font-title-md text-title-md text-on-surface">Legrand Myrius Black</span>
<span className="px-space-xs py-space-2xs rounded bg-surface-variant text-on-surface-variant font-label-sm text-label-sm">Architectural</span>
</div>
<span className="font-body-sm text-body-sm text-on-surface-variant">Electrical Distributor • Stock 1,200</span>
</div>
</div>
<div className="text-right">
<div className="font-tabular-metric-sm text-tabular-metric-sm font-bold text-on-surface">₹300</div>
<div className="font-label-sm text-label-sm text-on-surface-variant line-through">₹330</div>
</div>
</div>

<div className="p-space-sm rounded bg-surface-container-low ring-1 ring-primary cursor-pointer flex items-center justify-between">
<div className="flex items-start gap-space-sm">
<input defaultChecked={true} className="mt-1 accent-primary" name="socket_alt" type="radio" />
<div className="flex flex-col">
<div className="flex items-center gap-space-xs">
<span className="font-title-md text-title-md text-primary font-bold">Anchor Roma 16A</span>
<span className="px-space-xs py-space-2xs rounded bg-primary-container text-on-primary-container font-label-sm text-label-sm font-bold">VE Best Pick</span>
</div>
<span className="font-body-sm text-body-sm text-on-surface-variant">Panasonic Life Solutions Direct</span>
<div className="flex items-center gap-space-2xs mt-space-2xs text-primary font-label-sm text-label-sm">
<span className="material-symbols-outlined text-[13px]">verified</span>
<span>IS 1293:2019 Compliant • Lead 2 Days</span>
</div>
</div>
</div>
<div className="text-right">
<div className="font-tabular-metric-sm text-tabular-metric-sm font-bold text-primary">₹200</div>
<div className="font-label-sm text-label-sm text-on-surface-variant line-through">₹220</div>
<div className="font-label-sm text-label-sm text-primary font-semibold mt-space-2xs">Save ₹30,000</div>
</div>
</div>

<div className="p-space-sm rounded bg-surface-container-lowest hover:bg-surface-container-low transition-colors flex items-center justify-between">
<div className="flex items-start gap-space-sm">
<input className="mt-1 accent-primary" name="socket_alt" type="radio" />
<div className="flex flex-col">
<span className="font-title-md text-title-md text-on-surface">Havells Crabtree 16A</span>
<span className="font-body-sm text-body-sm text-on-surface-variant">Electrical Distributor • Sanathnagar</span>
</div>
</div>
<div className="text-right">
<div className="font-tabular-metric-sm text-tabular-metric-sm font-bold text-on-surface">₹220</div>
<div className="font-label-sm text-label-sm text-on-surface-variant line-through">₹240</div>
</div>
</div>
</div>

<div className="p-space-sm rounded bg-surface-container-high flex flex-col gap-space-2xs">
<div className="flex items-center justify-between font-label-sm text-label-sm">
<span className="text-on-surface-variant">Substitution Impact:</span>
<span className="font-bold text-primary">₹1,50,000 → ₹1,20,000</span>
</div>
<p className="font-body-sm text-body-sm text-on-surface-variant">
                    Switching to Anchor Roma unlocks ₹30,000 direct line savings with identical 100k cycles endurance rating.
                  </p>
</div>

<div className="flex items-center justify-between pt-space-xs">
<button className="font-label-md text-label-md text-on-surface-variant hover:text-on-surface px-space-xs py-space-xs">
                    View Spec Sheet (.PDF)
                  </button>
<div className="flex items-center gap-space-xs">
<button className="px-space-sm py-space-xs rounded bg-surface-container text-on-surface hover:bg-surface-container-high font-label-md text-label-md">
                      Dismiss
                    </button>
<button className="px-space-md py-space-xs rounded bg-primary text-on-primary hover:bg-primary-container font-title-md text-title-md shadow-sm">
                      Apply to BOQ
                    </button>
</div>
</div>
</div>
</td>
<td className="py-space-sm px-space-md text-on-surface-variant font-body-sm text-body-sm">
              Electrical Distributor • Secunderabad
            </td>
<td className="py-space-sm px-space-sm text-right text-on-surface-variant font-tabular-metric-sm text-tabular-metric-sm">
<span className="line-through">280</span>
</td>
<td className="py-space-sm px-space-sm text-right font-tabular-metric-sm text-tabular-metric-sm text-primary font-bold">
              250
            </td>
<td className="py-space-sm px-space-md text-right font-tabular-metric font-tabular-metric text-on-surface font-bold">
              ₹1,50,000
            </td>
<td className="py-space-sm px-space-sm text-center">
<span className="material-symbols-outlined text-primary text-space-lg" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
</td>
</tr>

<tr className="hover:bg-surface-container-low/50 transition-colors group">
<td className="py-space-sm px-space-md">
<div className="font-title-md text-title-md text-on-surface">MCB (Single/Double Pole)</div>
<span className="font-label-sm text-label-sm text-on-surface-variant">Electrical • 10kA Breaking Capacity C-Curve</span>
</td>
<td className="py-space-sm px-space-sm text-on-surface-variant font-tabular-metric-sm text-tabular-metric-sm">NOS</td>
<td className="py-space-sm px-space-sm text-right font-tabular-metric-sm text-tabular-metric-sm">40</td>
<td className="py-space-sm px-space-md">
<button className="flex items-center justify-between gap-space-xs px-space-sm py-space-xs rounded bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors font-body-md text-body-md w-full max-w-[210px]">
<span className="truncate">Havells / L&amp;T MCB</span>
<span className="material-symbols-outlined text-space-base text-on-surface-variant">expand_more</span>
</button>
</td>
<td className="py-space-sm px-space-md text-on-surface-variant font-body-sm text-body-sm">
              Electrical Distributor • Kukatpally
            </td>
<td className="py-space-sm px-space-sm text-right text-on-surface-variant font-tabular-metric-sm text-tabular-metric-sm">
<span className="line-through">320</span>
</td>
<td className="py-space-sm px-space-sm text-right font-tabular-metric-sm text-tabular-metric-sm text-primary font-bold">
              290
            </td>
<td className="py-space-sm px-space-md text-right font-tabular-metric font-tabular-metric text-on-surface">
              ₹11,600
            </td>
<td className="py-space-sm px-space-sm text-center">
<span className="material-symbols-outlined text-primary text-space-lg cursor-pointer">auto_awesome</span>
</td>
</tr>

<tr className="hover:bg-surface-container-low/50 transition-colors group">
<td className="py-space-sm px-space-md">
<div className="font-title-md text-title-md text-on-surface">Distribution Board (8-Way)</div>
<span className="font-label-sm text-label-sm text-on-surface-variant">Electrical • IP43 Double Door Enclosure</span>
</td>
<td className="py-space-sm px-space-sm text-on-surface-variant font-tabular-metric-sm text-tabular-metric-sm">NOS</td>
<td className="py-space-sm px-space-sm text-right font-tabular-metric-sm text-tabular-metric-sm">12</td>
<td className="py-space-sm px-space-md">
<button className="flex items-center justify-between gap-space-xs px-space-sm py-space-xs rounded bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors font-body-md text-body-md w-full max-w-[210px]">
<span className="truncate">Havells 8-Way DB</span>
<span className="material-symbols-outlined text-space-base text-on-surface-variant">expand_more</span>
</button>
</td>
<td className="py-space-sm px-space-md text-on-surface-variant font-body-sm text-body-sm">
              Electrical Distributor • Sanathnagar
            </td>
<td className="py-space-sm px-space-sm text-right text-on-surface-variant font-tabular-metric-sm text-tabular-metric-sm">
<span className="line-through">4,800</span>
</td>
<td className="py-space-sm px-space-sm text-right font-tabular-metric-sm text-tabular-metric-sm text-primary font-bold">
              4,400
            </td>
<td className="py-space-sm px-space-md text-right font-tabular-metric font-tabular-metric text-on-surface">
              ₹52,800
            </td>
<td className="py-space-sm px-space-sm text-center">
<span className="material-symbols-outlined text-primary text-space-lg cursor-pointer">auto_awesome</span>
</td>
</tr>

<tr className="hover:bg-surface-container-low/50 transition-colors group">
<td className="py-space-sm px-space-md">
<div className="font-title-md text-title-md text-on-surface">Meter Panel Board</div>
<span className="font-label-sm text-label-sm text-on-surface-variant">Electrical • Multi-Tenant Fabricated MS 16SWG</span>
</td>
<td className="py-space-sm px-space-sm text-on-surface-variant font-tabular-metric-sm text-tabular-metric-sm">NOS</td>
<td className="py-space-sm px-space-sm text-right font-tabular-metric-sm text-tabular-metric-sm">6</td>
<td className="py-space-sm px-space-md">
<button className="flex items-center justify-between gap-space-xs px-space-sm py-space-xs rounded bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors font-body-md text-body-md w-full max-w-[210px]">
<span className="truncate">L&amp;T / Havells Panel</span>
<span className="material-symbols-outlined text-space-base text-on-surface-variant">expand_more</span>
</button>
</td>
<td className="py-space-sm px-space-md text-on-surface-variant font-body-sm text-body-sm">
              Electrical Distributor • Jeedimetla
            </td>
<td className="py-space-sm px-space-sm text-right text-on-surface-variant font-tabular-metric-sm text-tabular-metric-sm">
<span className="line-through">45,000</span>
</td>
<td className="py-space-sm px-space-sm text-right font-tabular-metric-sm text-tabular-metric-sm text-primary font-bold">
              41,000
            </td>
<td className="py-space-sm px-space-md text-right font-tabular-metric font-tabular-metric text-on-surface">
              ₹2,46,000
            </td>
<td className="py-space-sm px-space-sm text-center">
<span className="material-symbols-outlined text-outline-variant text-space-lg">check_circle</span>
</td>
</tr>

<tr className="hover:bg-surface-container-low/50 transition-colors group">
<td className="py-space-sm px-space-md">
<div className="font-title-md text-title-md text-on-surface">Earthing Pit (Copper Plate)</div>
<span className="font-label-sm text-label-sm text-on-surface-variant">Electrical • 600x600x3mm Cu + Chemical Compound</span>
</td>
<td className="py-space-sm px-space-sm text-on-surface-variant font-tabular-metric-sm text-tabular-metric-sm">NOS</td>
<td className="py-space-sm px-space-sm text-right font-tabular-metric-sm text-tabular-metric-sm">3</td>
<td className="py-space-sm px-space-md">
<button className="flex items-center justify-between gap-space-xs px-space-sm py-space-xs rounded bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors font-body-md text-body-md w-full max-w-[210px]">
<span className="truncate">Copper Plate 600x600</span>
<span className="material-symbols-outlined text-space-base text-on-surface-variant">expand_more</span>
</button>
</td>
<td className="py-space-sm px-space-md text-on-surface-variant font-body-sm text-body-sm">
              Electrical Contractor • Site Fabrication
            </td>
<td className="py-space-sm px-space-sm text-right text-on-surface-variant font-tabular-metric-sm text-tabular-metric-sm">
<span className="line-through">12,500</span>
</td>
<td className="py-space-sm px-space-sm text-right font-tabular-metric-sm text-tabular-metric-sm text-primary font-bold">
              11,500
            </td>
<td className="py-space-sm px-space-md text-right font-tabular-metric font-tabular-metric text-on-surface">
              ₹34,500
            </td>
<td className="py-space-sm px-space-sm text-center">
<span className="material-symbols-outlined text-outline-variant text-space-lg">check_circle</span>
</td>
</tr>

<tr className="hover:bg-surface-container-low/50 transition-colors group">
<td className="py-space-sm px-space-md">
<div className="font-title-md text-title-md text-on-surface">Lightning Arrestor + Down Conductor</div>
<span className="font-label-sm text-label-sm text-on-surface-variant">Electrical • ESE Terminal 60μs Radius 107m</span>
</td>
<td className="py-space-sm px-space-sm text-on-surface-variant font-tabular-metric-sm text-tabular-metric-sm">LS</td>
<td className="py-space-sm px-space-sm text-right font-tabular-metric-sm text-tabular-metric-sm">1</td>
<td className="py-space-sm px-space-md">
<button className="flex items-center justify-between gap-space-xs px-space-sm py-space-xs rounded bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors font-body-md text-body-md w-full max-w-[210px]">
<span className="truncate">OBO Betterman ESE</span>
<span className="material-symbols-outlined text-space-base text-on-surface-variant">expand_more</span>
</button>
</td>
<td className="py-space-sm px-space-md text-on-surface-variant font-body-sm text-body-sm">
              Electrical Contractor • Specialist
            </td>
<td className="py-space-sm px-space-sm text-right text-on-surface-variant font-tabular-metric-sm text-tabular-metric-sm">
<span className="line-through">85,000</span>
</td>
<td className="py-space-sm px-space-sm text-right font-tabular-metric-sm text-tabular-metric-sm text-primary font-bold">
              78,000
            </td>
<td className="py-space-sm px-space-md text-right font-tabular-metric font-tabular-metric text-on-surface">
              ₹78,000
            </td>
<td className="py-space-sm px-space-sm text-center">
<span className="material-symbols-outlined text-outline-variant text-space-lg">check_circle</span>
</td>
</tr>

<tr className="hover:bg-surface-container-low/50 transition-colors group">
<td className="py-space-sm px-space-md">
<div className="font-title-md text-title-md text-on-surface">Cable Trays (Perforated GI)</div>
<span className="font-label-sm text-label-sm text-on-surface-variant">Electrical • 300mm x 50mm x 2mm Hot Dip</span>
</td>
<td className="py-space-sm px-space-sm text-on-surface-variant font-tabular-metric-sm text-tabular-metric-sm">RFT</td>
<td className="py-space-sm px-space-sm text-right font-tabular-metric-sm text-tabular-metric-sm">600</td>
<td className="py-space-sm px-space-md">
<button className="flex items-center justify-between gap-space-xs px-space-sm py-space-xs rounded bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors font-body-md text-body-md w-full max-w-[210px]">
<span className="truncate">Legrand Cablofil</span>
<span className="material-symbols-outlined text-space-base text-on-surface-variant">expand_more</span>
</button>
</td>
<td className="py-space-sm px-space-md text-on-surface-variant font-body-sm text-body-sm">
              Electrical Distributor • Balanagar
            </td>
<td className="py-space-sm px-space-sm text-right text-on-surface-variant font-tabular-metric-sm text-tabular-metric-sm">
<span className="line-through">220</span>
</td>
<td className="py-space-sm px-space-sm text-right font-tabular-metric-sm text-tabular-metric-sm text-primary font-bold">
              200
            </td>
<td className="py-space-sm px-space-md text-right font-tabular-metric font-tabular-metric text-on-surface">
              ₹1,20,000
            </td>
<td className="py-space-sm px-space-sm text-center">
<span className="material-symbols-outlined text-primary text-space-lg cursor-pointer">auto_awesome</span>
</td>
</tr>

<tr className="hover:bg-surface-container-low/50 transition-colors group">
<td className="py-space-sm px-space-md">
<div className="font-title-md text-title-md text-on-surface">Rising Main Cable (LT)</div>
<span className="font-label-sm text-label-sm text-on-surface-variant">Electrical • 3.5C x 185 sq mm XLPE Armoured Cu</span>
</td>
<td className="py-space-sm px-space-sm text-on-surface-variant font-tabular-metric-sm text-tabular-metric-sm">RFT</td>
<td className="py-space-sm px-space-sm text-right font-tabular-metric-sm text-tabular-metric-sm">36</td>
<td className="py-space-sm px-space-md">
<button className="flex items-center justify-between gap-space-xs px-space-sm py-space-xs rounded bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors font-body-md text-body-md w-full max-w-[210px]">
<span className="truncate">Polycab XLPE Cu</span>
<span className="material-symbols-outlined text-space-base text-on-surface-variant">expand_more</span>
</button>
</td>
<td className="py-space-sm px-space-md text-on-surface-variant font-body-sm text-body-sm">
              Electrical Distributor • Ranigunj
            </td>
<td className="py-space-sm px-space-sm text-right text-on-surface-variant font-tabular-metric-sm text-tabular-metric-sm">
<span className="line-through">950</span>
</td>
<td className="py-space-sm px-space-sm text-right font-tabular-metric-sm text-tabular-metric-sm text-primary font-bold">
              870
            </td>
<td className="py-space-sm px-space-md text-right font-tabular-metric font-tabular-metric text-on-surface">
              ₹31,320
            </td>
<td className="py-space-sm px-space-sm text-center">
<span className="material-symbols-outlined text-outline-variant text-space-lg">check_circle</span>
</td>
</tr>

<tr className="hover:bg-surface-container-low/50 transition-colors group">
<td className="py-space-sm px-space-md">
<div className="font-title-md text-title-md text-on-surface">Common Area Lighting (LED)</div>
<span className="font-label-sm text-label-sm text-on-surface-variant">Electrical • 18W Slim Recessed Downlight 4000K</span>
</td>
<td className="py-space-sm px-space-sm text-on-surface-variant font-tabular-metric-sm text-tabular-metric-sm">NOS</td>
<td className="py-space-sm px-space-sm text-right font-tabular-metric-sm text-tabular-metric-sm">240</td>
<td className="py-space-sm px-space-md">
<button className="flex items-center justify-between gap-space-xs px-space-sm py-space-xs rounded bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors font-body-md text-body-md w-full max-w-[210px]">
<span className="truncate">Philips / Wipro LED</span>
<span className="material-symbols-outlined text-space-base text-on-surface-variant">expand_more</span>
</button>
</td>
<td className="py-space-sm px-space-md text-on-surface-variant font-body-sm text-body-sm">
              Electrical Distributor • Hitech City
            </td>
<td className="py-space-sm px-space-sm text-right text-on-surface-variant font-tabular-metric-sm text-tabular-metric-sm">
<span className="line-through">850</span>
</td>
<td className="py-space-sm px-space-sm text-right font-tabular-metric-sm text-tabular-metric-sm text-primary font-bold">
              780
            </td>
<td className="py-space-sm px-space-md text-right font-tabular-metric font-tabular-metric text-on-surface">
              ₹1,87,200
            </td>
<td className="py-space-sm px-space-sm text-center">
<span className="material-symbols-outlined text-primary text-space-lg cursor-pointer">auto_awesome</span>
</td>
</tr>
</tbody>
</table>
</div>
</div>

<div className="sticky bottom-space-base w-full bg-inverse-surface text-inverse-on-surface p-space-md rounded-xl shadow-2xl flex flex-wrap items-center justify-between gap-space-base z-30">
<div className="flex items-center gap-space-xl">
<div className="flex flex-col">
<span className="font-label-sm text-label-sm uppercase text-outline-variant tracking-wider">Active View Summary</span>
<span className="font-title-md text-title-md text-inverse-on-surface font-semibold">Stage 04: 10 Electrical Line Items Filtered</span>
</div>
<div className="h-8 w-px bg-outline-variant/30 hidden md:block"></div>
<div className="flex flex-col">
<span className="font-label-sm text-label-sm uppercase text-outline-variant tracking-wider">Gross Stage Value</span>
<span className="font-tabular-metric font-tabular-metric text-inverse-on-surface">₹48,36,200</span>
</div>
<div className="h-8 w-px bg-outline-variant/30 hidden md:block"></div>
<div className="flex flex-col">
<span className="font-label-sm text-label-sm uppercase text-primary-fixed tracking-wider">Total Value Engineering Savings</span>
<div className="flex items-baseline gap-space-xs">
<span className="font-tabular-metric font-tabular-metric text-primary-fixed">₹6,46,200</span>
<span className="font-label-sm text-label-sm text-primary-fixed-dim font-bold">(-11.8% Saved)</span>
</div>
</div>
</div>

<div className="flex items-center gap-space-sm">
<button className="px-space-md py-space-xs rounded bg-surface-variant/20 hover:bg-surface-variant/30 text-inverse-on-surface font-title-md text-title-md transition-colors flex items-center gap-space-xs">
<span className="material-symbols-outlined text-space-base">tune</span>
<span>Configure Spec Thresholds</span>
</button>
<button className="px-space-md py-space-xs rounded bg-surface-variant/20 hover:bg-surface-variant/30 text-inverse-on-surface font-title-md text-title-md transition-colors flex items-center gap-space-xs">
<span className="material-symbols-outlined text-space-base">verified_user</span>
<span>Review QA/QC Tolerances</span>
</button>
<button className="px-space-lg py-space-xs rounded bg-primary text-on-primary hover:bg-primary-container font-headline-sm text-headline-sm shadow-md transition-transform active:scale-95 flex items-center gap-space-xs">
<span className="material-symbols-outlined text-space-lg">send</span>
<span>Bulk Push to Procurement RFQ</span>
</button>
</div>
</div>


</div></main>
      </div>
    </Shell>
  );
}
