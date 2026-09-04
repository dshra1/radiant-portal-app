import { createFileRoute } from "@tanstack/react-router";
import { Shell } from "@/components/saha/Shell";

export const Route = createFileRoute("/system-directory")({
  head: () => ({
    meta: [
      { title: "System Master Directory — Saha OS" },
      { name: "description", content: "Index of all Saha OS modules across governance, procurement and site execution pillars with role-based access." },
      { property: "og:title", content: "System Master Directory — Saha OS" },
      { property: "og:description", content: "Index of all Saha OS modules across governance, procurement and site execution pillars with role-based access." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <Shell title={"System Master Directory"}>
      <div className="m3">
        <main className="relative pt-16 w-full px-space-xl pb-space-3xl  bg-surface"><div className="flex flex-col w-full">

<div className="mb-space-2xl bg-surface-container-low rounded-xl p-space-2xl relative overflow-hidden shadow-sm">
<div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-primary-container/20 to-transparent pointer-events-none"></div>
<div className="max-w-3xl relative z-10">
<div className="flex items-center gap-space-xs mb-space-xs">
<span className="px-space-xs py-space-2xs rounded bg-primary text-on-primary font-label-sm uppercase tracking-wider">System Master Directory</span>
<span className="text-on-surface-variant font-body-sm">• 15 Modules Active Across 3 Pillars</span>
</div>
<h1 className="font-headline-lg text-headline-lg text-on-surface font-bold tracking-tight mb-space-sm">
        Saha OS Enterprise Architecture &amp; Navigation
      </h1>
<p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
        Comprehensive index of all core operational pillars, site intelligence engines, and administrative modules. Select any module below to launch its dedicated command canvas.
      </p>
<div className="flex items-center gap-space-md mt-space-lg">
<div className="flex items-center gap-space-xs bg-surface-container-lowest px-space-md py-space-sm rounded shadow-sm">
<span className="material-symbols-outlined text-primary text-space-lg">hub</span>
<span className="font-tabular-metric-sm text-tabular-metric-sm text-on-surface">3 Core Pillars</span>
</div>
<div className="flex items-center gap-space-xs bg-surface-container-lowest px-space-md py-space-sm rounded shadow-sm">
<span className="material-symbols-outlined text-tertiary text-space-lg">developer_board</span>
<span className="font-tabular-metric-sm text-tabular-metric-sm text-on-surface">15 Sub-Modules</span>
</div>
<div className="flex items-center gap-space-xs bg-surface-container-lowest px-space-md py-space-sm rounded shadow-sm">
<span className="material-symbols-outlined text-primary-container text-space-lg">verified_user</span>
<span className="font-tabular-metric-sm text-tabular-metric-sm text-on-surface">RBAC Secured</span>
</div>
</div>
</div>
</div>

<div className="flex flex-wrap items-center justify-between gap-space-base mb-space-xl">
<div className="flex items-center gap-space-xs">
<button className="px-space-md py-space-sm rounded bg-primary text-on-primary font-title-md text-title-md shadow-sm">All Pillars</button>
<button className="px-space-md py-space-sm rounded bg-surface-container-low text-on-surface hover:bg-surface-container font-title-md text-title-md transition-colors">Governance &amp; Core</button>
<button className="px-space-md py-space-sm rounded bg-surface-container-low text-on-surface hover:bg-surface-container font-title-md text-title-md transition-colors">Procurement &amp; Accounts</button>
<button className="px-space-md py-space-sm rounded bg-surface-container-low text-on-surface hover:bg-surface-container font-title-md text-title-md transition-colors">Site &amp; Execution</button>
</div>
<div className="flex items-center gap-space-sm">
<span className="text-on-surface-variant font-label-md">Sort by:</span>
<select className="px-space-md py-space-sm rounded bg-surface-container-low text-on-surface font-title-md border-0 focus:outline-none focus:ring-1 focus:ring-primary">
<option>Default Order</option>
<option>Module Activity</option>
<option>Alphabetical</option>
</select>
</div>
</div>

<div className="mb-space-3xl">
<div className="flex items-center justify-between mb-space-lg border-b border-outline-variant/30 pb-space-sm">
<div className="flex items-center gap-space-sm">
<div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-primary font-bold">01</div>
<div>
<h2 className="font-headline-md text-headline-md text-on-surface font-bold">PILLAR 1: GOVERNANCE &amp; CORE</h2>
<span className="font-body-sm text-on-surface-variant">System oversight, multi-tenant workspace administration, and high-level command</span>
</div>
</div>
<span className="px-space-md py-space-xs rounded bg-surface-container-low text-on-surface font-label-md">5 Modules</span>
</div>
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-lg">

<div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
<div>
<div className="flex items-center justify-between mb-space-md">
<div className="w-10 h-10 rounded bg-primary/10 text-primary flex items-center justify-center">
<span className="material-symbols-outlined">space_dashboard</span>
</div>
<span className="px-space-xs py-space-2xs rounded bg-primary-container/20 text-primary font-label-sm">Active</span>
</div>
<h3 className="font-headline-sm text-headline-sm text-on-surface font-bold mb-space-xs">Dashboard</h3>
<p className="font-body-sm text-body-sm text-on-surface-variant mb-space-lg">High-level executive telemetry, project progress gauges, live weather, and rapid metric summaries.</p>
</div>
<div className="flex items-center justify-between pt-space-sm border-t border-outline-variant/20">
<span className="font-label-sm text-outline">Core View</span>
<a className="flex items-center gap-space-2xs font-title-md text-primary hover:underline" href="#"><span>View Module</span><span className="material-symbols-outlined text-space-base">arrow_forward</span></a>
</div>
</div>

<div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
<div>
<div className="flex items-center justify-between mb-space-md">
<div className="w-10 h-10 rounded bg-primary/10 text-primary flex items-center justify-center">
<span className="material-symbols-outlined">notifications_active</span>
</div>
<span className="px-space-xs py-space-2xs rounded bg-error/10 text-error font-label-sm font-bold">4 Pending</span>
</div>
<h3 className="font-headline-sm text-headline-sm text-on-surface font-bold mb-space-xs">Notifications &amp; Action Centre</h3>
<p className="font-body-sm text-body-sm text-on-surface-variant mb-space-lg">Real-time alerts, safety halts, pending approvals queue, and critical site discrepancy flags.</p>
</div>
<div className="flex items-center justify-between pt-space-sm border-t border-outline-variant/20">
<span className="font-label-sm text-outline">Alert Queue</span>
<a className="flex items-center gap-space-2xs font-title-md text-primary hover:underline" href="#"><span>View Module</span><span className="material-symbols-outlined text-space-base">arrow_forward</span></a>
</div>
</div>

<div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
<div>
<div className="flex items-center justify-between mb-space-md">
<div className="w-10 h-10 rounded bg-primary/10 text-primary flex items-center justify-center">
<span className="material-symbols-outlined">business</span>
</div>
<span className="px-space-xs py-space-2xs rounded bg-surface-container-low text-on-surface font-label-sm">Secured</span>
</div>
<h3 className="font-headline-sm text-headline-sm text-on-surface font-bold mb-space-xs">Company &amp; Access</h3>
<p className="font-body-sm text-body-sm text-on-surface-variant mb-space-lg">Enterprise settings, branch locations, organizational hierarchies, and global security policies.</p>
</div>
<div className="flex items-center justify-between pt-space-sm border-t border-outline-variant/20">
<span className="font-label-sm text-outline">Admin Panel</span>
<a className="flex items-center gap-space-2xs font-title-md text-primary hover:underline" href="#"><span>View Module</span><span className="material-symbols-outlined text-space-base">arrow_forward</span></a>
</div>
</div>

<div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
<div>
<div className="flex items-center justify-between mb-space-md">
<div className="w-10 h-10 rounded bg-primary/10 text-primary flex items-center justify-center">
<span className="material-symbols-outlined">group</span>
</div>
<span className="px-space-xs py-space-2xs rounded bg-surface-container-low text-on-surface font-label-sm">48 Users</span>
</div>
<h3 className="font-headline-sm text-headline-sm text-on-surface font-bold mb-space-xs">Users &amp; Management</h3>
<p className="font-body-sm text-body-sm text-on-surface-variant mb-space-lg">Role-based access control (RBAC), engineer assignments, biometric ID linking, and contractor portals.</p>
</div>
<div className="flex items-center justify-between pt-space-sm border-t border-outline-variant/20">
<span className="font-label-sm text-outline">Directory</span>
<a className="flex items-center gap-space-2xs font-title-md text-primary hover:underline" href="#"><span>View Module</span><span className="material-symbols-outlined text-space-base">arrow_forward</span></a>
</div>
</div>

<div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
<div>
<div className="flex items-center justify-between mb-space-md">
<div className="w-10 h-10 rounded bg-primary/10 text-primary flex items-center justify-center">
<span className="material-symbols-outlined">terminal</span>
</div>
<span className="px-space-xs py-space-2xs rounded bg-primary text-on-primary font-label-sm">Omni</span>
</div>
<h3 className="font-headline-sm text-headline-sm text-on-surface font-bold mb-space-xs">Master Command Workspace</h3>
<p className="font-body-sm text-body-sm text-on-surface-variant mb-space-lg">Unified multi-project console for rapid cross-site resource allocation and emergency overrides.</p>
</div>
<div className="flex items-center justify-between pt-space-sm border-t border-outline-variant/20">
<span className="font-label-sm text-outline">Advanced</span>
<a className="flex items-center gap-space-2xs font-title-md text-primary hover:underline" href="#"><span>View Module</span><span className="material-symbols-outlined text-space-base">arrow_forward</span></a>
</div>
</div>
</div>
</div>

<div className="mb-space-3xl">
<div className="flex items-center justify-between mb-space-lg border-b border-outline-variant/30 pb-space-sm">
<div className="flex items-center gap-space-sm">
<div className="w-8 h-8 rounded bg-tertiary/10 flex items-center justify-center text-tertiary font-bold">02</div>
<div>
<h2 className="font-headline-md text-headline-md text-on-surface font-bold">PILLAR 2: PROCUREMENT &amp; ACCOUNTS</h2>
<span className="font-body-sm text-on-surface-variant">Bill of quantities, smart purchase orders, RA bills, vendor ledgers, and GST audits</span>
</div>
</div>
<span className="px-space-md py-space-xs rounded bg-surface-container-low text-on-surface font-label-md">5 Modules</span>
</div>
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-lg">

<div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
<div>
<div className="flex items-center justify-between mb-space-md">
<div className="w-10 h-10 rounded bg-tertiary/10 text-tertiary flex items-center justify-center">
<span className="material-symbols-outlined">inventory_2</span>
</div>
<span className="px-space-xs py-space-2xs rounded bg-tertiary/10 text-tertiary font-label-sm">1,240 Items</span>
</div>
<h3 className="font-headline-sm text-headline-sm text-on-surface font-bold mb-space-xs">BOQ Engine &amp; Excel Ingestion</h3>
<p className="font-body-sm text-body-sm text-on-surface-variant mb-space-lg">Structured bill of quantities parsing, rate analysis, variance tracking, and rapid spreadsheet import.</p>
</div>
<div className="flex items-center justify-between pt-space-sm border-t border-outline-variant/20">
<span className="font-label-sm text-outline">Inventory Master</span>
<a className="flex items-center gap-space-2xs font-title-md text-tertiary hover:underline" href="#"><span>View Module</span><span className="material-symbols-outlined text-space-base">arrow_forward</span></a>
</div>
</div>

<div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
<div>
<div className="flex items-center justify-between mb-space-md">
<div className="w-10 h-10 rounded bg-tertiary/10 text-tertiary flex items-center justify-center">
<span className="material-symbols-outlined">shopping_cart_checkout</span>
</div>
<span className="px-space-xs py-space-2xs rounded bg-primary/10 text-primary font-label-sm">12 Active POs</span>
</div>
<h3 className="font-headline-sm text-headline-sm text-on-surface font-bold mb-space-xs">Purchasing &amp; Smart POs</h3>
<p className="font-body-sm text-body-sm text-on-surface-variant mb-space-lg">Automated purchase orders, material indent approvals, delivery tracking, and GRN verification.</p>
</div>
<div className="flex items-center justify-between pt-space-sm border-t border-outline-variant/20">
<span className="font-label-sm text-outline">Procurement</span>
<a className="flex items-center gap-space-2xs font-title-md text-tertiary hover:underline" href="#"><span>View Module</span><span className="material-symbols-outlined text-space-base">arrow_forward</span></a>
</div>
</div>

<div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
<div>
<div className="flex items-center justify-between mb-space-md">
<div className="w-10 h-10 rounded bg-tertiary/10 text-tertiary flex items-center justify-center">
<span className="material-symbols-outlined">storefront</span>
</div>
<span className="px-space-xs py-space-2xs rounded bg-surface-container-low text-on-surface font-label-sm">34 Vendors</span>
</div>
<h3 className="font-headline-sm text-headline-sm text-on-surface font-bold mb-space-xs">Vendor Directory &amp; Pricing</h3>
<p className="font-body-sm text-body-sm text-on-surface-variant mb-space-lg">Supplier ratings, comparative rate quotes, credit terms, and performance scorecard tracking.</p>
</div>
<div className="flex items-center justify-between pt-space-sm border-t border-outline-variant/20">
<span className="font-label-sm text-outline">Directory</span>
<a className="flex items-center gap-space-2xs font-title-md text-tertiary hover:underline" href="#"><span>View Module</span><span className="material-symbols-outlined text-space-base">arrow_forward</span></a>
</div>
</div>

<div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
<div>
<div className="flex items-center justify-between mb-space-md">
<div className="w-10 h-10 rounded bg-tertiary/10 text-tertiary flex items-center justify-center">
<span className="material-symbols-outlined">receipt_long</span>
</div>
<span className="px-space-xs py-space-2xs rounded bg-warning text-on-surface font-label-sm">₹ 1.8 Cr Due</span>
</div>
<h3 className="font-headline-sm text-headline-sm text-on-surface font-bold mb-space-xs">Subcontractor RA Bills &amp; Payments</h3>
<p className="font-body-sm text-body-sm text-on-surface-variant mb-space-lg">Running Account bill measurements, deduction tracking (retention, TDS), and milestone disbursals.</p>
</div>
<div className="flex items-center justify-between pt-space-sm border-t border-outline-variant/20">
<span className="font-label-sm text-outline">Accounts</span>
<a className="flex items-center gap-space-2xs font-title-md text-tertiary hover:underline" href="#"><span>View Module</span><span className="material-symbols-outlined text-space-base">arrow_forward</span></a>
</div>
</div>

<div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
<div>
<div className="flex items-center justify-between mb-space-md">
<div className="w-10 h-10 rounded bg-tertiary/10 text-tertiary flex items-center justify-center">
<span className="material-symbols-outlined">account_balance</span>
</div>
<span className="px-space-xs py-space-2xs rounded bg-primary/10 text-primary font-label-sm">GST Compliant</span>
</div>
<h3 className="font-headline-sm text-headline-sm text-on-surface font-bold mb-space-xs">Billing, GST &amp; Audit Hub</h3>
<p className="font-body-sm text-body-sm text-on-surface-variant mb-space-lg">Tax reconciliation, e-invoicing generation, audit trails, and financial ledger export.</p>
</div>
<div className="flex items-center justify-between pt-space-sm border-t border-outline-variant/20">
<span className="font-label-sm text-outline">Audit Trail</span>
<a className="flex items-center gap-space-2xs font-title-md text-tertiary hover:underline" href="#"><span>View Module</span><span className="material-symbols-outlined text-space-base">arrow_forward</span></a>
</div>
</div>
</div>
</div>

<div className="mb-space-xl">
<div className="flex items-center justify-between mb-space-lg border-b border-outline-variant/30 pb-space-sm">
<div className="flex items-center gap-space-sm">
<div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-primary font-bold">03</div>
<div>
<h2 className="font-headline-md text-headline-md text-on-surface font-bold">PILLAR 3: SITE &amp; EXECUTION</h2>
<span className="font-body-sm text-on-surface-variant">Stage-wise scheduling, pour cards, QA/QC visual AI, live CCTV, and attendance sync</span>
</div>
</div>
<span className="px-space-md py-space-xs rounded bg-surface-container-low text-on-surface font-label-md">5 Modules</span>
</div>
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-lg">

<div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
<div>
<div className="flex items-center justify-between mb-space-md">
<div className="w-10 h-10 rounded bg-primary/10 text-primary flex items-center justify-center">
<span className="material-symbols-outlined">timeline</span>
</div>
<span className="px-space-xs py-space-2xs rounded bg-primary/10 text-primary font-label-sm">Phase 2 Active</span>
</div>
<h3 className="font-headline-sm text-headline-sm text-on-surface font-bold mb-space-xs">Stage-Wise Planning &amp; Programme</h3>
<p className="font-body-sm text-body-sm text-on-surface-variant mb-space-lg">Gantt master schedules, critical path milestones, baseline tracking, and progress forecasts.</p>
</div>
<div className="flex items-center justify-between pt-space-sm border-t border-outline-variant/20">
<span className="font-label-sm text-outline">Planning</span>
<a className="flex items-center gap-space-2xs font-title-md text-primary hover:underline" href="#"><span>View Module</span><span className="material-symbols-outlined text-space-base">arrow_forward</span></a>
</div>
</div>

<div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
<div>
<div className="flex items-center justify-between mb-space-md">
<div className="w-10 h-10 rounded bg-primary/10 text-primary flex items-center justify-center">
<span className="material-symbols-outlined">engineering</span>
</div>
<span className="px-space-xs py-space-2xs rounded bg-primary text-on-primary font-label-sm">18 Pours</span>
</div>
<h3 className="font-headline-sm text-headline-sm text-on-surface font-bold mb-space-xs">Site Execution &amp; Pour Cards</h3>
<p className="font-body-sm text-body-sm text-on-surface-variant mb-space-lg">Concrete pour clearance workflows, cube test registers, slump test logs, and supervisor sign-offs.</p>
</div>
<div className="flex items-center justify-between pt-space-sm border-t border-outline-variant/20">
<span className="font-label-sm text-outline">Execution</span>
<a className="flex items-center gap-space-2xs font-title-md text-primary hover:underline" href="#"><span>View Module</span><span className="material-symbols-outlined text-space-base">arrow_forward</span></a>
</div>
</div>

<div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
<div>
<div className="flex items-center justify-between mb-space-md">
<div className="w-10 h-10 rounded bg-primary/10 text-primary flex items-center justify-center">
<span className="material-symbols-outlined">verified</span>
</div>
<span className="px-space-xs py-space-2xs rounded bg-surface-container-low text-on-surface font-label-sm">AI Enabled</span>
</div>
<h3 className="font-headline-sm text-headline-sm text-on-surface font-bold mb-space-xs">QA/QC &amp; Visual Defect AI</h3>
<p className="font-body-sm text-body-sm text-on-surface-variant mb-space-lg">Automated crack and honeycombing detection, inspection checklists, and NCR management.</p>
</div>
<div className="flex items-center justify-between pt-space-sm border-t border-outline-variant/20">
<span className="font-label-sm text-outline">Quality</span>
<a className="flex items-center gap-space-2xs font-title-md text-primary hover:underline" href="#"><span>View Module</span><span className="material-symbols-outlined text-space-base">arrow_forward</span></a>
</div>
</div>

<div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
<div>
<div className="flex items-center justify-between mb-space-md">
<div className="w-10 h-10 rounded bg-primary/10 text-primary flex items-center justify-center">
<span className="material-symbols-outlined">videocam</span>
</div>
<span className="px-space-xs py-space-2xs rounded bg-surface-container-low text-on-surface font-label-sm">Live Feed</span>
</div>
<h3 className="font-headline-sm text-headline-sm text-on-surface font-bold mb-space-xs">Site Media &amp; WhatsApp Archive</h3>
<p className="font-body-sm text-body-sm text-on-surface-variant mb-space-lg">CCTV monitoring links, drone progress captures, and automated WhatsApp site media synchronization.</p>
</div>
<div className="flex items-center justify-between pt-space-sm border-t border-outline-variant/20">
<span className="font-label-sm text-outline">Site Intel</span>
<a className="flex items-center gap-space-2xs font-title-md text-primary hover:underline" href="#"><span>View Module</span><span className="material-symbols-outlined text-space-base">arrow_forward</span></a>
</div>
</div>

<div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
<div>
<div className="flex items-center justify-between mb-space-md">
<div className="w-10 h-10 rounded bg-primary/10 text-primary flex items-center justify-center">
<span className="material-symbols-outlined">fingerprint</span>
</div>
<span className="px-space-xs py-space-2xs rounded bg-primary/10 text-primary font-label-sm">342 Headcount</span>
</div>
<h3 className="font-headline-sm text-headline-sm text-on-surface font-bold mb-space-xs">Contractors &amp; Biometric Attendance</h3>
<p className="font-body-sm text-body-sm text-on-surface-variant mb-space-lg">IoT turnstile sync, trade-wise headcount distributions, shift overtime, and labor wage logs.</p>
</div>
<div className="flex items-center justify-between pt-space-sm border-t border-outline-variant/20">
<span className="font-label-sm text-outline">Workforce</span>
<a className="flex items-center gap-space-2xs font-title-md text-primary hover:underline" href="#"><span>View Module</span><span className="material-symbols-outlined text-space-base">arrow_forward</span></a>
</div>
</div>
</div>
</div>

<div className="mt-space-2xl bg-surface-container-lowest rounded-xl p-space-lg flex flex-wrap items-center justify-between gap-space-base shadow-sm">
<div className="flex items-center gap-space-md">
<div className="w-3 h-3 rounded-full bg-primary animate-ping"></div>
<div>
<span className="font-title-md text-on-surface">Saha OS Kernel v3.2.0 Operational</span>
<p className="font-body-sm text-on-surface-variant">All 3 pillars synchronized with Cloud DB • Zero latency issues reported</p>
</div>
</div>
<div className="flex items-center gap-space-sm">
<button className="px-space-md py-space-sm rounded bg-surface-container-low text-on-surface hover:bg-surface-container font-title-md text-title-md transition-colors">Export Directory JSON</button>
<button className="px-space-md py-space-sm rounded bg-primary text-on-primary hover:bg-primary-container font-title-md text-title-md transition-colors">System Diagnostics</button>
</div>
</div>
</div><div className="fixed bottom-space-2xl right-space-2xl z-50 flex items-center gap-space-sm"><button className="flex items-center gap-space-xs px-space-md py-space-sm rounded-full bg-tertiary text-on-tertiary shadow-lg hover:bg-tertiary-container transition-all font-title-md"><span className="material-symbols-outlined text-space-base">mic</span><span>Voice Memo</span></button><button className="flex items-center gap-space-xs px-space-md py-space-sm rounded-full bg-primary text-on-primary shadow-lg hover:bg-primary-container transition-all font-title-md"><span className="material-symbols-outlined text-space-base">add_a_photo</span><span>Photo Upload</span></button></div></main>
      </div>
    </Shell>
  );
}
