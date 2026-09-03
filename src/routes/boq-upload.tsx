import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/boq-upload")({
  head: () => ({
    meta: [
      { title: "BOQ Excel Upload & Ingestion Studio | Saha OS" },
      { name: "description", content: "Upload, validate and auto-map Excel BOQ catalogs with IS 456 and CPWD rate mapping." },
      { property: "og:title", content: "BOQ Excel Upload & Ingestion Studio | Saha OS" },
      { property: "og:description", content: "Upload, validate and auto-map Excel BOQ catalogs with IS 456 and CPWD rate mapping." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <div className="">


<header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50 text-white" data-purpose="enterprise-top-nav">
<div className="px-6 py-2.5 flex items-center justify-between gap-4">

<div className="flex items-center gap-4">
<div className="flex items-center gap-2.5">
<div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center font-bold text-lg text-white shadow-md shadow-emerald-900/50">
            S
          </div>
<div className="leading-none">
<span className="text-sm font-bold tracking-tight text-white">SAHA <span className="text-emerald-400">OS</span></span>
<span className="block text-[10px] uppercase font-semibold tracking-wider text-slate-400">Enterprise Build v4.2</span>
</div>
</div>
<div className="h-5 w-[1px] bg-slate-700 hidden md:block"></div>

<nav className="flex items-center text-xs space-x-2 text-slate-300">
<span className="hover:text-white cursor-pointer transition-colors">BOQ Management</span>
<span className="text-slate-500">/</span>
<span className="text-white font-medium">Upload Excel Catalog &amp; Rates</span>
<span className="text-slate-500">/</span>
<div className="inline-flex items-center gap-1.5 bg-slate-800 border border-slate-700 rounded-md px-2.5 py-1 text-slate-200">
<span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
<span className="font-semibold text-white">Cyber Enclave A (Madhapur, HYD)</span>
<svg className="w-3.5 h-3.5 text-slate-400 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
</div>
<a className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-100 hover:bg-slate-800 transition-colors" href="/">All Screens Hub</a></nav>
</div>

<div className="flex items-center gap-3">

<div className="hidden lg:flex items-center gap-2 bg-emerald-950/70 border border-emerald-800/80 rounded-md px-3 py-1 text-[11px] text-emerald-300">
<svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
<span>Hyd Wholesale Index: <strong>Updated 2h ago</strong></span>
</div>
<button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-medium border border-slate-700 transition" type="button">
<svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
<span>Download Master Template (.xlsx)</span>
</button>

<div className="flex items-center gap-2.5 pl-2 border-l border-slate-800">
<div className="w-7 h-7 rounded-full bg-slate-700 border border-emerald-500/40 flex items-center justify-center font-bold text-xs text-emerald-300">
            SH
          </div>
<div className="text-left hidden sm:block">
<div className="text-xs font-semibold text-white leading-tight">Shravan K.</div>
<div className="text-[10px] text-slate-400">Admin / Project Director</div>
</div>
</div>
</div>
</div>
</header>


<main className="flex-1 px-4 sm:px-6 py-4 max-w-[1920px] mx-auto w-full flex flex-col gap-4">

<section className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-4 sm:p-5" data-purpose="excel-ingestion-card">
<div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">

<div className="lg:col-span-8 flex flex-col sm:flex-row items-start sm:items-center gap-4">

<div className="w-14 h-14 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 flex-shrink-0 shadow-inner">
<svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
<path d="M14 2H6C4.89 2 4 2.89 4 4v16c0 1.11.89 2 2 2h12c1.11 0 2-.89 2-2V8l-6-6zm-1 7V3.5L18.5 9H13zM9.5 12.5l1.5 2.5-1.5 2.5h1.5l.8-1.5.8 1.5h1.5l-1.5-2.5 1.5-2.5h-1.5l-.8 1.4-.8-1.4H9.5z"></path>
</svg>
</div>
<div className="space-y-1.5">
<div className="flex flex-wrap items-center gap-2">
<h1 className="text-base font-bold text-slate-900 flex items-center gap-2">
                Cyber_Enclave_Block5_Master_BOQ_v2.4.xlsx
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
<svg className="w-3 h-3 text-emerald-600" fill="currentColor" viewBox="0 0 20 20"><path clipRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" fillRule="evenodd"></path></svg>
                  Ingestion Verified (98.4% Confidence)
                </span>
</h1>
</div>
<p className="text-xs text-slate-500 flex flex-wrap items-center gap-x-3 gap-y-1">
<span><strong>Size:</strong> 2.8 MB</span>
<span className="text-slate-300">•</span>
<span><strong>Line Items:</strong> 348 Total Rows</span>
<span className="text-slate-300">•</span>
<span><strong>Trades Detected:</strong> 22 Sub-categories</span>
<span className="text-slate-300">•</span>
<span className="text-emerald-700 font-medium">IS 456 &amp; CPWD Rates Mapped</span>
</p>

<div className="flex items-center gap-2 pt-1">
<button className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md border border-slate-300 transition" id="uploadTriggerBtn">
<svg className="w-3 h-3 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
                Upload Different File
              </button>
<button className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md border border-slate-300 transition">
<svg className="w-3 h-3 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
                Re-map Columns
              </button>
<button className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-md border border-emerald-200 transition">
<svg className="w-3 h-3 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
                Validate IS 456 Units (Passed)
              </button>
</div>
</div>
</div>

<div className="lg:col-span-4 border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50/40 rounded-xl p-3.5 text-center cursor-pointer transition group flex flex-col items-center justify-center">
<input accept=".xlsx, .xls, .csv" className="hidden" id="boqFileInput" type="file" />
<div className="flex items-center gap-2 text-emerald-800 font-semibold text-xs group-hover:text-emerald-900">
<svg className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
<span>Drop new spreadsheet or click to replace</span>
</div>
<p className="text-[10px] text-slate-500 mt-1">Supports multi-tab .xlsx, .xls, and raw contractor CSVs up to 50MB</p>
</div>
</div>
</section>


<details className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden group" open={true}>
<summary className="px-5 py-3 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between cursor-pointer select-none">
<div className="flex items-center gap-2">
<span className="w-2 h-2 rounded-full bg-emerald-500"></span>
<h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">Schema Ingestion &amp; Column Auto-Mapping Preview</h2>
<span className="text-[11px] text-slate-400 font-normal">(5/5 Critical Headers matched with Saha OS Construction Data Dictionary)</span>
</div>
<span className="text-xs text-emerald-700 font-semibold group-open:rotate-180 transition-transform inline-block">▼</span>
</summary>
<div className="p-4 grid grid-cols-2 md:grid-cols-5 gap-3 bg-slate-50/30 text-xs">

<div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-xs">
<div className="text-[10px] uppercase font-bold text-slate-400">Excel Column</div>
<div className="font-mono font-semibold text-slate-800 text-[11px] truncate">Category_Name</div>
<div className="my-1 text-emerald-500 font-bold">↓ mapped to</div>
<div className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded inline-block">trade_category</div>
</div>

<div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-xs">
<div className="text-[10px] uppercase font-bold text-slate-400">Excel Column</div>
<div className="font-mono font-semibold text-slate-800 text-[11px] truncate">Item Specification</div>
<div className="my-1 text-emerald-500 font-bold">↓ mapped to</div>
<div className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded inline-block">item_description</div>
</div>

<div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-xs">
<div className="text-[10px] uppercase font-bold text-slate-400">Excel Column</div>
<div className="font-mono font-semibold text-slate-800 text-[11px] truncate">Unit (RFT/CUM/SFT)</div>
<div className="my-1 text-emerald-500 font-bold">↓ mapped to</div>
<div className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded inline-block">measurement_unit</div>
</div>

<div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-xs">
<div className="text-[10px] uppercase font-bold text-slate-400">Excel Column</div>
<div className="font-mono font-semibold text-slate-800 text-[11px] truncate">In-House / Contractor</div>
<div className="my-1 text-emerald-500 font-bold">↓ mapped to</div>
<div className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded inline-block">base_rate_inr</div>
</div>

<div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-xs">
<div className="text-[10px] uppercase font-bold text-slate-400">Live AI Benchmark</div>
<div className="font-mono font-semibold text-emerald-800 text-[11px] truncate">Hyd Wholesale Index</div>
<div className="my-1 text-emerald-500 font-bold">↓ calculated</div>
<div className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded inline-block">potential_delta_savings</div>
</div>
</div>
</details>


<section className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-3.5 space-y-3" data-purpose="trade-navigation-strip">

<div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
<div className="flex items-center gap-2">
<svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
<span className="text-xs font-bold text-slate-800 uppercase tracking-wide">Construction Trade Categories (25 Trades)</span>
<span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-semibold">Click to filter table view</span>
</div>

<div className="flex items-center gap-1.5 text-xs font-medium">
<button className="inline-flex items-center gap-1 px-2.5 py-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition border border-transparent">
<svg className="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
<span>Template</span>
</button>
<button className="inline-flex items-center gap-1 px-2.5 py-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition">
<svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
<span>Upload Catalog</span>
</button>
<button className="inline-flex items-center gap-1 px-2.5 py-1 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-md transition font-semibold">
<svg className="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
<span>Cheapest Alternate Mode</span>
</button>
<button className="inline-flex items-center gap-1 px-2.5 py-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition">
<svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
<span>Regen</span>
</button>
<button className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md transition font-semibold shadow-xs">
<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
<span>Export</span>
<svg className="w-3 h-3 ml-0.5" fill="currentColor" viewBox="0 0 20 20"><path clipRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" fillRule="evenodd"></path></svg>
</button>
<button className="inline-flex items-center gap-1 px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-md transition font-semibold shadow-xs">
<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
<span>Row</span>
</button>
</div>
</div>

<div className="flex flex-wrap items-center gap-x-2 gap-y-2 text-[12px]" id="tradeCategoryContainer">
<button className="trade-pill px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition" data-trade="all">All Items · 348</button>
<button className="trade-pill px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition" data-trade="preliminaries">Preliminaries · 18</button>
<button className="trade-pill px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition" data-trade="earthwork">Earthwork · 13</button>
<button className="trade-pill px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition" data-trade="pcc">Plain Cement Concrete (PCC) · 5</button>
<button className="trade-pill px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition" data-trade="rcc">RCC Works · 16</button>
<button className="trade-pill px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition">Reinforcement (Steel) · 14</button>
<button className="trade-pill px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition">Shuttering / Formwork · 10</button>
<button className="trade-pill px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition">Masonry · 6</button>
<button className="trade-pill px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition">Plastering · 7</button>
<button className="trade-pill px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition">Waterproofing · 8</button>
<button className="trade-pill px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition">Flooring · 13</button>
<button className="trade-pill px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition">Wall Tiling · 3</button>
<button className="trade-pill px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition">Granite Works · 7</button>
<button className="trade-pill px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition">False Ceiling · 4</button>
<button className="trade-pill px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition">Doors · 17</button>
<button className="trade-pill px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition">Windows &amp; Glazing · 6</button>
<button className="trade-pill px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition">Painting · 8</button>
<button className="trade-pill px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition">Sanitaryware · 11</button>
<button className="trade-pill px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition">CP Fittings · 8</button>
<button className="trade-pill px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition">Plumbing · 10</button>

<button className="trade-pill px-3 py-1 rounded-md bg-amber-500 hover:bg-amber-600 text-white font-bold shadow-sm transition scale-105" data-trade="electrical">Electrical · 12</button>
<button className="trade-pill px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition">Fire Fighting · 7</button>
<button className="trade-pill px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition">Lift Works · 4</button>
<button className="trade-pill px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition">External Development · 9</button>
<button className="trade-pill px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition">Services (Transformer / DG / STP) · 8</button>
<button className="trade-pill px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition">Miscellaneous · 10</button>
</div>
</section>


<section className="bg-white rounded-xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col" data-purpose="excel-data-grid">

<div className="px-5 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
<div className="flex items-center gap-3">
<span className="font-bold text-slate-800">Previewing Electrical &amp; Core Structural Trades</span>
<span className="text-slate-400">|</span>
<span className="text-slate-600">Showing <strong>14</strong> high-priority BOQ line items</span>
</div>
<div className="flex items-center gap-3">
<label className="flex items-center gap-1.5 text-slate-600 cursor-pointer text-[11px]">
<input defaultChecked={true} className="rounded text-emerald-600 focus:ring-emerald-500 border-slate-300" type="checkbox" />
<span>Highlight Hyderabad Wholesale Discrepancies (&gt;5%)</span>
</label>
<button className="text-emerald-700 hover:text-emerald-800 font-semibold text-[11px] underline">Reset Filter</button>
</div>
</div>

<div className="overflow-x-auto">
<table className="w-full text-left text-xs text-slate-700 border-collapse">

<thead className="bg-slate-100/90 text-slate-700 font-semibold border-b border-slate-200 select-none uppercase tracking-wider text-[11px]">
<tr>
<th className="py-3 px-3 w-10 text-center" scope="col">
<input defaultChecked={true} className="rounded text-emerald-600 focus:ring-emerald-500 border-slate-300" type="checkbox" />
</th>
<th className="py-3 px-3 min-w-[130px]" scope="col">Code &amp; Category</th>
<th className="py-3 px-4 min-w-[280px]" scope="col">Item Specification / Description</th>
<th className="py-3 px-2 text-center w-16" scope="col">Unit</th>
<th className="py-3 px-3 text-right min-w-[90px]" scope="col">Est. Qty</th>
<th className="py-3 px-3 text-right min-w-[130px]" scope="col">Excel Rate (₹)</th>
<th className="py-3 px-3 text-right min-w-[130px] bg-emerald-50/50 text-emerald-900" scope="col">Hyd Market (₹)</th>
<th className="py-3 px-3 text-right min-w-[120px]" scope="col">Total Amount (₹)</th>
<th className="py-3 px-3 min-w-[190px]" scope="col">AI Brand / Spec Match</th>
<th className="py-3 px-3 text-center min-w-[100px]" scope="col">Savings Delta</th>
</tr>
</thead>
<tbody className="divide-y divide-slate-200/80 font-normal">


<tr className="hover:bg-slate-50/80 transition-colors">
<td className="py-2.5 px-3 text-center">
<input defaultChecked={true} className="rounded text-emerald-600 focus:ring-emerald-500 border-slate-300" type="checkbox" />
</td>
<td className="py-2.5 px-3">
<span className="font-mono font-semibold text-slate-900 block">ELE-0101</span>
<span className="text-[10px] text-slate-500 uppercase">Electrical</span>
</td>
<td className="py-2.5 px-4 font-medium text-slate-900">
                PVC Conduits (Concealed Heavy Duty 25mm)
                <span className="block text-[10px] text-slate-500">IS:9537 Part 3 approved with pull wire</span>
</td>
<td className="py-2.5 px-2 text-center font-mono font-medium">RFT</td>
<td className="py-2.5 px-3 text-right font-mono">42,000</td>
<td className="py-2.5 px-3 text-right font-mono text-slate-600">₹22.00</td>
<td className="py-2.5 px-3 text-right font-mono font-bold text-amber-600 bg-amber-50/30">₹20.00</td>
<td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">₹8,40,000</td>
<td className="py-2.5 px-3">
<span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                  AKG / Precision F.
                </span>
</td>
<td className="py-2.5 px-3 text-center">
<span className="inline-flex items-center text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                  -9.1% Saved
                </span>
</td>
</tr>

<tr className="hover:bg-slate-50/80 transition-colors">
<td className="py-2.5 px-3 text-center">
<input defaultChecked={true} className="rounded text-emerald-600 focus:ring-emerald-500 border-slate-300" type="checkbox" />
</td>
<td className="py-2.5 px-3">
<span className="font-mono font-semibold text-slate-900 block">ELE-0102</span>
<span className="text-[10px] text-slate-500 uppercase">Electrical</span>
</td>
<td className="py-2.5 px-4 font-medium text-slate-900">
                FRLS Copper Wiring (Multi-strand 1.5/2.5 sq mm)
                <span className="block text-[10px] text-slate-500">Flame Retardant Low Smoke IS:694</span>
</td>
<td className="py-2.5 px-2 text-center font-mono font-medium">RFT</td>
<td className="py-2.5 px-3 text-right font-mono">102,000</td>
<td className="py-2.5 px-3 text-right font-mono text-slate-600">₹28.00</td>
<td className="py-2.5 px-3 text-right font-mono font-bold text-amber-600 bg-amber-50/30">₹25.00</td>
<td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">₹25,50,000</td>
<td className="py-2.5 px-3">
<span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                  Polycab / Havells
                </span>
</td>
<td className="py-2.5 px-3 text-center">
<span className="inline-flex items-center text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                  -10.7% Saved
                </span>
</td>
</tr>

<tr className="hover:bg-slate-50/80 transition-colors">
<td className="py-2.5 px-3 text-center">
<input defaultChecked={true} className="rounded text-emerald-600 focus:ring-emerald-500 border-slate-300" type="checkbox" />
</td>
<td className="py-2.5 px-3">
<span className="font-mono font-semibold text-slate-900 block">ELE-0103</span>
<span className="text-[10px] text-slate-500 uppercase">Electrical</span>
</td>
<td className="py-2.5 px-4 font-medium text-slate-900">
                Modular Switches (6A Single Pole 1-Way)
                <span className="block text-[10px] text-slate-500">Includes grid plate &amp; clip-on front cover</span>
</td>
<td className="py-2.5 px-2 text-center font-mono font-medium">NOS</td>
<td className="py-2.5 px-3 text-right font-mono">1,800</td>
<td className="py-2.5 px-3 text-right font-mono text-slate-600">₹190.00</td>
<td className="py-2.5 px-3 text-right font-mono font-bold text-amber-600 bg-amber-50/30">₹175.00</td>
<td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">₹3,15,000</td>
<td className="py-2.5 px-3">
<span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                  Legrand Myrius
                </span>
</td>
<td className="py-2.5 px-3 text-center">
<span className="inline-flex items-center text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                  -7.8% Saved
                </span>
</td>
</tr>

<tr className="hover:bg-slate-50/80 transition-colors">
<td className="py-2.5 px-3 text-center">
<input defaultChecked={true} className="rounded text-emerald-600 focus:ring-emerald-500 border-slate-300" type="checkbox" />
</td>
<td className="py-2.5 px-3">
<span className="font-mono font-semibold text-slate-900 block">ELE-0104</span>
<span className="text-[10px] text-slate-500 uppercase">Electrical</span>
</td>
<td className="py-2.5 px-4 font-medium text-slate-900">
                Modular Sockets (16A 3-Pin Universal with Shutter)
                <span className="block text-[10px] text-slate-500">Heavy appliance load rated</span>
</td>
<td className="py-2.5 px-2 text-center font-mono font-medium">NOS</td>
<td className="py-2.5 px-3 text-right font-mono">600</td>
<td className="py-2.5 px-3 text-right font-mono text-slate-600">₹280.00</td>
<td className="py-2.5 px-3 text-right font-mono font-bold text-amber-600 bg-amber-50/30">₹250.00</td>
<td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">₹1,50,000</td>
<td className="py-2.5 px-3">
<span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                  Legrand Myrius
                </span>
</td>
<td className="py-2.5 px-3 text-center">
<span className="inline-flex items-center text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                  -10.7% Saved
                </span>
</td>
</tr>

<tr className="hover:bg-slate-50/80 transition-colors">
<td className="py-2.5 px-3 text-center">
<input defaultChecked={true} className="rounded text-emerald-600 focus:ring-emerald-500 border-slate-300" type="checkbox" />
</td>
<td className="py-2.5 px-3">
<span className="font-mono font-semibold text-slate-900 block">ELE-0105</span>
<span className="text-[10px] text-slate-500 uppercase">Electrical</span>
</td>
<td className="py-2.5 px-4 font-medium text-slate-900">
                MCB (Single / Double Pole 10kA C-Curve)
                <span className="block text-[10px] text-slate-500">Distribution breaker board integration</span>
</td>
<td className="py-2.5 px-2 text-center font-mono font-medium">NOS</td>
<td className="py-2.5 px-3 text-right font-mono">40</td>
<td className="py-2.5 px-3 text-right font-mono text-slate-600">₹320.00</td>
<td className="py-2.5 px-3 text-right font-mono font-bold text-amber-600 bg-amber-50/30">₹290.00</td>
<td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">₹11,600</td>
<td className="py-2.5 px-3">
<span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                  Havells / L&amp;T MC
                </span>
</td>
<td className="py-2.5 px-3 text-center">
<span className="inline-flex items-center text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                  -9.3% Saved
                </span>
</td>
</tr>

<tr className="hover:bg-slate-50/80 transition-colors">
<td className="py-2.5 px-3 text-center">
<input defaultChecked={true} className="rounded text-emerald-600 focus:ring-emerald-500 border-slate-300" type="checkbox" />
</td>
<td className="py-2.5 px-3">
<span className="font-mono font-semibold text-slate-900 block">ELE-0106</span>
<span className="text-[10px] text-slate-500 uppercase">Electrical</span>
</td>
<td className="py-2.5 px-4 font-medium text-slate-900">
                Distribution Board (8–Way VTPN Double Door IP43)
              </td>
<td className="py-2.5 px-2 text-center font-mono font-medium">NOS</td>
<td className="py-2.5 px-3 text-right font-mono">12</td>
<td className="py-2.5 px-3 text-right font-mono text-slate-600">₹4,800.00</td>
<td className="py-2.5 px-3 text-right font-mono font-bold text-amber-600 bg-amber-50/30">₹4,400.00</td>
<td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">₹52,800</td>
<td className="py-2.5 px-3">
<span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                  Havells 8-Way D
                </span>
</td>
<td className="py-2.5 px-3 text-center">
<span className="inline-flex items-center text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                  -8.3% Saved
                </span>
</td>
</tr>


<tr className="hover:bg-slate-50/80 transition-colors bg-slate-50/30">
<td className="py-2.5 px-3 text-center">
<input defaultChecked={true} className="rounded text-emerald-600 focus:ring-emerald-500 border-slate-300" type="checkbox" />
</td>
<td className="py-2.5 px-3">
<span className="font-mono font-semibold text-slate-900 block">PRE-0001</span>
<span className="text-[10px] text-slate-500 uppercase">Preliminaries</span>
</td>
<td className="py-2.5 px-4 font-medium text-slate-900">
                Site Mobilization (Plant, Machinery &amp; Manpower Set Up)
              </td>
<td className="py-2.5 px-2 text-center font-mono font-medium">LS</td>
<td className="py-2.5 px-3 text-right font-mono">1</td>
<td className="py-2.5 px-3 text-right font-mono text-slate-600">₹1,50,000</td>
<td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 bg-slate-50">₹1,40,000</td>
<td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">₹1,40,000</td>
<td className="py-2.5 px-3">
<span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                  Site Contractor
                </span>
</td>
<td className="py-2.5 px-3 text-center">
<span className="inline-flex items-center text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                  -6.7% Saved
                </span>
</td>
</tr>

<tr className="hover:bg-slate-50/80 transition-colors bg-slate-50/30">
<td className="py-2.5 px-3 text-center">
<input defaultChecked={true} className="rounded text-emerald-600 focus:ring-emerald-500 border-slate-300" type="checkbox" />
</td>
<td className="py-2.5 px-3">
<span className="font-mono font-semibold text-slate-900 block">PRE-0002</span>
<span className="text-[10px] text-slate-500 uppercase">Preliminaries</span>
</td>
<td className="py-2.5 px-4 font-medium text-slate-900">
                Site Office (Temporary MS Portacabin Structure)
              </td>
<td className="py-2.5 px-2 text-center font-mono font-medium">Sft</td>
<td className="py-2.5 px-3 text-right font-mono">600</td>
<td className="py-2.5 px-3 text-right font-mono text-slate-600">₹550.00</td>
<td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 bg-slate-50">₹500.00</td>
<td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">₹3,00,000</td>
<td className="py-2.5 px-3">
<span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                  Local Fabricator
                </span>
</td>
<td className="py-2.5 px-3 text-center">
<span className="inline-flex items-center text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                  -9.1% Saved
                </span>
</td>
</tr>

<tr className="hover:bg-slate-50/80 transition-colors bg-slate-50/30">
<td className="py-2.5 px-3 text-center">
<input defaultChecked={true} className="rounded text-emerald-600 focus:ring-emerald-500 border-slate-300" type="checkbox" />
</td>
<td className="py-2.5 px-3">
<span className="font-mono font-semibold text-slate-900 block">PRE-0005</span>
<span className="text-[10px] text-slate-500 uppercase">Preliminaries</span>
</td>
<td className="py-2.5 px-4 font-medium text-slate-900">
                Site Barricading (GI Sheet 8ft Height with MS Support)
              </td>
<td className="py-2.5 px-2 text-center font-mono font-medium">Rft</td>
<td className="py-2.5 px-3 text-right font-mono">1,250</td>
<td className="py-2.5 px-3 text-right font-mono text-slate-600">₹380.00</td>
<td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 bg-slate-50">₹340.00</td>
<td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">₹4,25,000</td>
<td className="py-2.5 px-3">
<span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                  GI Sheet 8ft Local
                </span>
</td>
<td className="py-2.5 px-3 text-center">
<span className="inline-flex items-center text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                  -10.5% Saved
                </span>
</td>
</tr>

<tr className="hover:bg-slate-50/80 transition-colors">
<td className="py-2.5 px-3 text-center">
<input defaultChecked={true} className="rounded text-emerald-600 focus:ring-emerald-500 border-slate-300" type="checkbox" />
</td>
<td className="py-2.5 px-3">
<span className="font-mono font-semibold text-slate-900 block">EAW-0003</span>
<span className="text-[10px] text-slate-500 uppercase">Earthwork</span>
</td>
<td className="py-2.5 px-4 font-medium text-slate-900">
                Excavation for Isolated Footings &amp; Plinth Trenches
              </td>
<td className="py-2.5 px-2 text-center font-mono font-medium">Cft</td>
<td className="py-2.5 px-3 text-right font-mono">54,000</td>
<td className="py-2.5 px-3 text-right font-mono text-slate-600">₹22.00</td>
<td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 bg-slate-50">₹19.00</td>
<td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">₹10,26,000</td>
<td className="py-2.5 px-3">
<span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                  JCB / Poclain + Manual
                </span>
</td>
<td className="py-2.5 px-3 text-center">
<span className="inline-flex items-center text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                  -13.6% Saved
                </span>
</td>
</tr>

<tr className="hover:bg-slate-50/80 transition-colors">
<td className="py-2.5 px-3 text-center">
<input defaultChecked={true} className="rounded text-emerald-600 focus:ring-emerald-500 border-slate-300" type="checkbox" />
</td>
<td className="py-2.5 px-3">
<span className="font-mono font-semibold text-slate-900 block">PCC-0001</span>
<span className="text-[10px] text-slate-500 uppercase">PCC Works</span>
</td>
<td className="py-2.5 px-4 font-medium text-slate-900">
                PCC 1:4:8 below Foundation Footings (40mm Aggregate)
              </td>
<td className="py-2.5 px-2 text-center font-mono font-medium">CUM</td>
<td className="py-2.5 px-3 text-right font-mono">380</td>
<td className="py-2.5 px-3 text-right font-mono text-slate-600">₹6,885.00</td>
<td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 bg-slate-50">₹6,355.00</td>
<td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">₹24,14,900</td>
<td className="py-2.5 px-3">
<span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                  OPC 43 + 40mm Agg
                </span>
</td>
<td className="py-2.5 px-3 text-center">
<span className="inline-flex items-center text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                  -7.7% Saved
                </span>
</td>
</tr>

<tr className="hover:bg-slate-50/80 transition-colors">
<td className="py-2.5 px-3 text-center">
<input defaultChecked={true} className="rounded text-emerald-600 focus:ring-emerald-500 border-slate-300" type="checkbox" />
</td>
<td className="py-2.5 px-3">
<span className="font-mono font-semibold text-slate-900 block">RCC-0001</span>
<span className="text-[10px] text-slate-500 uppercase">RCC Works</span>
</td>
<td className="py-2.5 px-4 font-medium text-slate-900">
                RCC M25 - Foundation / Isolated Footings (RMC Ready Mix)
              </td>
<td className="py-2.5 px-2 text-center font-mono font-medium">CUM</td>
<td className="py-2.5 px-3 text-right font-mono">820</td>
<td className="py-2.5 px-3 text-right font-mono text-slate-600">₹8,475.00</td>
<td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700 bg-emerald-50/40">₹7,770.00</td>
<td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">₹63,71,400</td>
<td className="py-2.5 px-3">
<span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                  RMC M25 Batching
                </span>
</td>
<td className="py-2.5 px-3 text-center">
<span className="inline-flex items-center text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                  -8.3% Saved
                </span>
</td>
</tr>

<tr className="hover:bg-slate-50/80 transition-colors">
<td className="py-2.5 px-3 text-center">
<input defaultChecked={true} className="rounded text-emerald-600 focus:ring-emerald-500 border-slate-300" type="checkbox" />
</td>
<td className="py-2.5 px-3">
<span className="font-mono font-semibold text-slate-900 block">RCC-0005</span>
<span className="text-[10px] text-slate-500 uppercase">RCC Works</span>
</td>
<td className="py-2.5 px-4 font-medium text-slate-900">
                RCC M30 - Superstructure Columns &amp; Plinth Beams
              </td>
<td className="py-2.5 px-2 text-center font-mono font-medium">CUM</td>
<td className="py-2.5 px-3 text-right font-mono">640</td>
<td className="py-2.5 px-3 text-right font-mono text-slate-600">₹9,360.00</td>
<td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700 bg-emerald-50/40">₹8,650.00</td>
<td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">₹55,36,000</td>
<td className="py-2.5 px-3">
<span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                  RMC Supplier Hyderabad
                </span>
</td>
<td className="py-2.5 px-3 text-center">
<span className="inline-flex items-center text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                  -7.6% Saved
                </span>
</td>
</tr>

<tr className="hover:bg-slate-50/80 transition-colors">
<td className="py-2.5 px-3 text-center">
<input defaultChecked={true} className="rounded text-emerald-600 focus:ring-emerald-500 border-slate-300" type="checkbox" />
</td>
<td className="py-2.5 px-3">
<span className="font-mono font-semibold text-slate-900 block">ELE-0108</span>
<span className="text-[10px] text-slate-500 uppercase">Electrical</span>
</td>
<td className="py-2.5 px-4 font-medium text-slate-900">
                Lightning Arrestor + Down Conductor Complete Setup
              </td>
<td className="py-2.5 px-2 text-center font-mono font-medium">LS</td>
<td className="py-2.5 px-3 text-right font-mono">1</td>
<td className="py-2.5 px-3 text-right font-mono text-slate-600">₹85,000.00</td>
<td className="py-2.5 px-3 text-right font-mono font-bold text-amber-600 bg-amber-50/30">₹78,000.00</td>
<td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">₹78,000</td>
<td className="py-2.5 px-3">
<span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                  OBO Bettermann
                </span>
</td>
<td className="py-2.5 px-3 text-center">
<span className="inline-flex items-center text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                  -8.2% Saved
                </span>
</td>
</tr>
</tbody>
</table>
</div>


<div className="px-5 py-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
<div className="flex items-center gap-2">
<span>Displaying 1 to 14 of 348 entries</span>
</div>
<div className="flex items-center gap-1 font-medium">
<button className="px-2 py-1 bg-white border border-slate-300 rounded text-slate-600 hover:bg-slate-100 disabled:opacity-50" disabled={true}>Previous</button>
<button className="px-2.5 py-1 bg-emerald-600 text-white rounded font-bold">1</button>
<button className="px-2.5 py-1 bg-white border border-slate-300 rounded text-slate-700 hover:bg-slate-100">2</button>
<button className="px-2.5 py-1 bg-white border border-slate-300 rounded text-slate-700 hover:bg-slate-100">3</button>
<span className="px-1 text-slate-400">...</span>
<button className="px-2.5 py-1 bg-white border border-slate-300 rounded text-slate-700 hover:bg-slate-100">25</button>
<button className="px-2 py-1 bg-white border border-slate-300 rounded text-slate-600 hover:bg-slate-100">Next</button>
</div>
</div>
</section>

</main>


<aside className="fixed bottom-0 inset-x-0 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 text-white py-3 px-6 z-40 shadow-2xl" data-purpose="sticky-bottom-summary">
<div className="max-w-[1920px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4">

<div className="flex flex-wrap items-center gap-6 text-xs divide-x divide-slate-800">
<div className="flex items-center gap-2">
<span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
<div>
<div className="text-[10px] uppercase text-slate-400 tracking-wider">Total Ingested Items</div>
<div className="font-bold text-sm text-white font-mono">348 Lines</div>
</div>
</div>
<div className="pl-6">
<div className="text-[10px] uppercase text-slate-400 tracking-wider">Projected BOQ Total</div>
<div className="font-bold text-sm text-white font-mono">₹2,48,60,450</div>
</div>
<div className="pl-6">
<div className="text-[10px] uppercase text-emerald-400 font-semibold tracking-wider flex items-center gap-1">
<svg className="w-3 h-3 text-emerald-400" fill="currentColor" viewBox="0 0 20 20"><path clipRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" fillRule="evenodd"></path></svg>
            Identified Alternative Savings
          </div>
<div className="font-bold text-sm text-emerald-400 font-mono">₹18,42,800 <span className="text-xs font-medium text-emerald-300">(-7.4%)</span></div>
</div>
</div>

<div className="flex items-center gap-3">
<button className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition" type="button">
          Cancel
        </button>
<button className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition flex items-center gap-1.5" id="saveDraftBtn" type="button">
<svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
<span>Save Draft v2.4</span>
</button>
<button className="px-5 py-2 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition shadow-lg shadow-emerald-900/40 flex items-center gap-2" id="commitBoqBtn" type="button">
<svg className="w-4 h-4 text-emerald-200" fill="currentColor" viewBox="0 0 20 20"><path clipRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" fillRule="evenodd"></path></svg>
<span>Commit &amp; Merge to Master Project BOQ</span>
</button>
</div>
</div>
</aside>


<div className="fixed top-16 right-6 transform translate-y-[-20px] opacity-0 pointer-events-none transition-all duration-300 z-50 bg-slate-900 text-white border border-emerald-500/50 shadow-2xl rounded-xl p-4 flex items-center gap-3 max-w-md" id="actionToast">
<div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
</div>
<div>
<h4 className="text-xs font-bold text-white" id="toastTitle">Action Completed</h4>
<p className="text-[11px] text-slate-300" id="toastMessage">File catalog synchronized successfully.</p>
</div>
</div>





    </div>
  );
}
