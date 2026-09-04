import { createFileRoute } from "@tanstack/react-router";
import { Shell } from "@/components/saha/Shell";
import { useActiveProject } from "@/hooks/useActiveProject";

export const Route = createFileRoute("/site-execution")({
  head: () => ({
    meta: [
      { title: "Site Execution & Next-Stage Planning Hub | Saha OS" },
      { name: "description", content: "Live stage progress, field roster, material runway and next-stage readiness for Cyber Enclave Phase 2." },
      { property: "og:title", content: "Site Execution & Next-Stage Planning Hub | Saha OS" },
      { property: "og:description", content: "Live stage progress, field roster, material runway and next-stage readiness for Cyber Enclave Phase 2." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  const project = useActiveProject();
  return (
    <Shell title={"Site Execution & Next-Stage Planning Hub | Saha OS"}>
      <div className="m3">
        <main className="w-full  px-gutter-normal pb-gutter-expanded bg-surface"><div className="flex flex-col w-full gap-space-lg">

<div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md pb-space-xs">
<div className="flex flex-col gap-space-2xs">
<div className="flex items-center gap-space-xs">
<span className="px-space-xs py-0.5 rounded-lg bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider font-semibold">TOWER A • SUPERSTRUCTURE</span>
<span className="w-1 h-1 rounded-full bg-outline"></span>
<span className="text-on-surface-variant font-body-sm text-body-sm">{project.location}</span>
<span className="w-1 h-1 rounded-full bg-outline"></span>
<span className="font-label-sm text-label-sm text-primary font-medium flex items-center gap-0.5">
<span className="material-symbols-outlined text-[14px]">cell_tower</span> Telemetry Active
        </span>
</div>
<div className="flex items-baseline gap-space-sm">
<h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">Site Execution &amp; Next-Stage Planning Hub</h1>
<span className="hidden sm:inline font-body-sm text-body-sm text-on-surface-variant">{project.name} (G+5 Superstructure)</span>
</div>
</div>

<div className="flex items-center gap-space-sm self-start md:self-auto">
<button className="px-space-md py-1.5 rounded-lg bg-surface-container-lowest text-on-surface font-title-md text-title-md hover:bg-surface-container transition-all flex items-center gap-space-xs shadow-sm" type="button">
<span className="material-symbols-outlined text-[16px]">history</span>
<span>Timeline Simulation</span>
</button>
<button className="px-space-md py-1.5 rounded-lg bg-surface-container-lowest text-on-surface font-title-md text-title-md hover:bg-surface-container transition-all flex items-center gap-space-xs shadow-sm" type="button">
<span className="material-symbols-outlined text-[16px]">file_download</span>
<span>Export Stage Audit</span>
</button>
<button className="px-space-md py-1.5 rounded-lg bg-primary text-on-primary font-title-md text-title-md hover:bg-primary-container transition-all flex items-center gap-space-xs shadow-sm" type="button">
<span className="material-symbols-outlined text-[16px]">done_all</span>
<span>Approve Stage 08 Transition</span>
</button>
</div>
</div>

<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">

<div className="p-space-md rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between">
<div className="flex items-start justify-between gap-space-xs">
<span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider">Current Cycle Stage</span>
<span className="px-1.5 py-0.5 rounded bg-secondary-container text-on-secondary-fixed font-label-sm text-label-sm">Stage 07</span>
</div>
<div className="my-space-xs">
<div className="font-title-md text-title-md text-on-surface truncate">RCC 4th Floor Slab &amp; Beams</div>
<div className="flex items-center justify-between text-on-surface-variant font-body-sm text-body-sm mt-1">
<span>Completion Progress</span>
<span className="font-tabular-metric-sm text-tabular-metric-sm text-primary">74.2%</span>
</div>
<div className="w-full h-1.5 rounded-full bg-surface-container mt-1.5 overflow-hidden">
<div className="h-full bg-primary rounded-full" style={{ width: "74.2%" }}></div>
</div>
</div>
<div className="pt-space-xs bg-surface-container-low rounded-lg p-2 flex items-center justify-between">
<span className="font-label-sm text-label-sm text-on-surface-variant truncate">Next: Stage 08 (AAC Blockwork)</span>
<span className="font-label-sm text-label-sm text-primary-container font-semibold whitespace-nowrap">Ready in 4d</span>
</div>
</div>

<div className="p-space-md rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between">
<div className="flex items-start justify-between gap-space-xs">
<span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider">Site Execution Queue</span>
<span className="flex items-center gap-1 font-label-sm text-label-sm text-primary">
<span className="w-1.5 h-1.5 rounded-full bg-primary"></span> Live Today
        </span>
</div>
<div className="my-space-xs">
<div className="flex items-baseline gap-space-xs">
<span className="font-tabular-metric text-tabular-metric text-on-surface">6</span>
<span className="font-body-sm text-body-sm text-on-surface-variant">Active Operations</span>
</div>
<div className="flex items-center gap-2 mt-2">
<span className="px-2 py-0.5 rounded-md bg-error-container text-on-error-container font-label-sm text-label-sm flex items-center gap-1 font-semibold">
<span className="material-symbols-outlined text-[13px]">pause_circle</span> 2 QA Hold
          </span>
<span className="px-2 py-0.5 rounded-md bg-secondary-container text-on-secondary-container font-label-sm text-label-sm flex items-center gap-1">
<span className="material-symbols-outlined text-[13px]">check_circle</span> 1 Done
          </span>
</div>
</div>
<div className="text-on-surface-variant font-label-sm text-label-sm flex items-center justify-between pt-space-2xs">
<span>Daily Target Velocity</span>
<span className="text-on-surface font-semibold">92% on critical path</span>
</div>
</div>

<div className="p-space-md rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between">
<div className="flex items-start justify-between gap-space-xs">
<span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider">Field Command Roster</span>
<span className="material-symbols-outlined text-secondary text-[18px]">badge</span>
</div>
<div className="my-space-xs">
<div className="flex items-baseline gap-space-xs">
<span className="font-tabular-metric text-tabular-metric text-on-surface">4</span>
<span className="font-body-sm text-body-sm text-on-surface-variant">Supervisors on Deck</span>
</div>
<div className="font-body-sm text-body-sm text-on-surface-variant mt-1">
<span className="font-semibold text-on-surface">34 Active Tradesmen</span> (22 Rebar, 8 Shuttering, 4 MEP)
        </div>
</div>
<div className="pt-space-xs flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm">
<span className="flex items-center gap-1">
<span className="w-1.5 h-1.5 rounded-full bg-primary-fixed-dim"></span> Biometrics Synced
        </span>
<span className="text-primary font-medium">08:00 AM Shift</span>
</div>
</div>

<div className="p-space-md rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between">
<div className="flex items-start justify-between gap-space-xs">
<span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider">Critical Material Runway</span>
<span className="px-1.5 py-0.5 rounded bg-error-container text-on-error-container font-label-sm text-label-sm font-semibold">Action Required</span>
</div>
<div className="my-space-xs">
<div className="flex items-baseline gap-space-xs">
<span className="font-tabular-metric text-tabular-metric text-error">2 Items</span>
<span className="font-body-sm text-body-sm text-on-surface-variant">Below Stage Buffer</span>
</div>
<p className="font-body-sm text-body-sm text-on-surface-variant mt-1 truncate">
          OPC 53 Cement (-240 bags), 25mm PVC (-1.2k Rft)
        </p>
</div>
<div className="pt-space-xs flex items-center justify-between">
<span className="font-label-sm text-label-sm text-on-surface-variant">Reorder Gap: 48 hrs</span>
<a className="font-label-sm text-label-sm text-primary font-semibold hover:underline" href="#requisitions">Review Deficit →</a>
</div>
</div>
</div>

<div className="p-space-lg rounded-xl bg-inverse-surface text-inverse-on-surface shadow-md relative overflow-hidden">
<div className="absolute right-0 top-0 bottom-0 w-96 opacity-10 pointer-events-none flex items-center justify-center">
<span className="material-symbols-outlined text-[180px]">precision_manufacturing</span>
</div>
<div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-space-lg">
<div className="flex flex-col gap-space-xs max-w-2xl">
<div className="flex items-center gap-space-sm">
<span className="px-space-xs py-0.5 rounded bg-primary text-on-primary font-label-sm text-label-sm font-semibold tracking-wide uppercase">AI Stage Gate Engine</span>
<span className="text-secondary-fixed-dim font-label-sm text-label-sm">Predictive Handoff Pipeline</span>
</div>
<h2 className="font-headline-md text-headline-md text-inverse-on-surface">Stage 08 Readiness Score: 88% on Schedule</h2>
<p className="font-body-md text-body-md text-secondary-fixed-dim">
          Next Phase <span className="text-inverse-on-surface font-semibold">"4th Floor AAC Block Masonry &amp; Perimeter De-shuttering"</span> will unlock once structural curing validation meets standard IS 456 criteria.
        </p>

<div className="grid grid-cols-1 sm:grid-cols-3 gap-space-sm mt-space-xs">
<div className="p-space-sm rounded-lg bg-surface-container-lowest/10 backdrop-blur-sm flex flex-col gap-1">
<div className="flex items-center gap-1.5 text-primary-fixed">
<span className="material-symbols-outlined text-[16px]">water_drop</span>
<span className="font-title-md text-title-md">Ponding Curing</span>
</div>
<span className="font-body-sm text-body-sm text-inverse-on-surface">Day 3 of 14 Completed</span>
<div className="w-full bg-surface-container-highest/20 h-1 rounded-full overflow-hidden mt-1">
<div className="bg-primary-fixed h-full rounded-full" style={{ width: "21%" }}></div>
</div>
</div>
<div className="p-space-sm rounded-lg bg-surface-container-lowest/10 backdrop-blur-sm flex flex-col gap-1">
<div className="flex items-center gap-1.5 text-secondary-fixed">
<span className="material-symbols-outlined text-[16px]">timer</span>
<span className="font-title-md text-title-md">Slab De-shuttering</span>
</div>
<span className="font-body-sm text-body-sm text-inverse-on-surface">72 hrs to Cube Test #2</span>
<div className="w-full bg-surface-container-highest/20 h-1 rounded-full overflow-hidden mt-1">
<div className="bg-secondary-fixed h-full rounded-full" style={{ width: "65%" }}></div>
</div>
</div>
<div className="p-space-sm rounded-lg bg-surface-container-lowest/10 backdrop-blur-sm flex flex-col gap-1">
<div className="flex items-center gap-1.5 text-error-container">
<span className="material-symbols-outlined text-[16px]">local_shipping</span>
<span className="font-title-md text-title-md">AAC Block Indent</span>
</div>
<span className="font-body-sm text-body-sm text-inverse-on-surface">Dispatch PO needed in 48h</span>
<div className="w-full bg-surface-container-highest/20 h-1 rounded-full overflow-hidden mt-1">
<div className="bg-error-container h-full rounded-full" style={{ width: "40%" }}></div>
</div>
</div>
</div>
</div>

<div className="flex flex-col sm:flex-row lg:flex-col gap-space-sm items-stretch lg:items-end justify-center">
<button className="px-space-lg py-2.5 rounded-lg bg-primary-fixed text-on-primary-fixed font-title-md text-title-md hover:bg-primary-fixed-dim transition-colors flex items-center justify-center gap-space-xs font-semibold shadow-md" type="button">
<span className="material-symbols-outlined text-[18px]">verified</span>
<span>Fast-Track Stage 08 Requisition</span>
</button>
<button className="px-space-md py-2 rounded-lg bg-surface-container-lowest/15 text-inverse-on-surface hover:bg-surface-container-lowest/25 transition-colors font-body-sm text-body-sm flex items-center justify-center gap-space-xs" type="button">
<span className="material-symbols-outlined text-[16px]">analytics</span>
<span>Simulate 48h Rain Lag</span>
</button>
</div>
</div>
</div>

<div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">

<div className="lg:col-span-7 flex flex-col gap-space-md">

<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm bg-surface-container-lowest p-space-sm rounded-xl shadow-sm">
<div className="flex items-center gap-space-xs overflow-x-auto pb-1 sm:pb-0">
<button className="px-space-md py-1.5 rounded-lg bg-primary text-on-primary font-title-md text-title-md whitespace-nowrap shadow-sm" type="button">
            Today (04 Sept)
          </button>
<button className="px-space-md py-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface font-title-md text-title-md whitespace-nowrap transition-colors" type="button">
            Week Horizon (01-07 Sept)
          </button>
<button className="px-space-md py-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface font-title-md text-title-md whitespace-nowrap transition-colors" type="button">
            By Supervisor
          </button>
<button className="px-space-md py-1.5 rounded-lg text-error hover:bg-error-container/20 font-title-md text-title-md whitespace-nowrap transition-colors flex items-center gap-1" type="button">
<span className="w-2 h-2 rounded-full bg-error"></span> QA Gates (2)
          </button>
</div>
<div className="flex items-center gap-space-xs self-end sm:self-auto text-on-surface-variant">
<span className="font-label-sm text-label-sm">Sort: Priority Path</span>
<span className="material-symbols-outlined text-[18px]">sort</span>
</div>
</div>

<div className="flex flex-col gap-space-md">

<div className="p-space-lg rounded-xl bg-surface-container-lowest shadow-sm flex flex-col gap-space-md">

<div className="flex flex-col sm:flex-row sm:items-start justify-between gap-space-sm">
<div className="flex flex-col gap-1">
<div className="flex items-center gap-space-xs flex-wrap">
<span className="px-2 py-0.5 rounded bg-surface-container font-label-md text-label-md text-on-surface font-mono">Act #07-B</span>
<span className="px-2 py-0.5 rounded bg-primary-container text-on-primary-container font-label-sm text-label-sm font-semibold">Critical Path • Priority 1</span>
<span className="px-2 py-0.5 rounded bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm">Grid C1 to C9</span>
</div>
<h3 className="font-headline-sm text-headline-sm text-on-surface mt-1">4th Floor Slab Top Mesh Rebar Binding &amp; Chair Fixation</h3>
<div className="flex items-center gap-space-md text-on-surface-variant font-body-sm text-body-sm flex-wrap">
<span className="flex items-center gap-1">
<span className="material-symbols-outlined text-[16px] text-primary">person</span>
                  Rajesh K. (Senior Foreman) • Gang 03 (12 Bar Benders)
                </span>
<span className="flex items-center gap-1">
<span className="material-symbols-outlined text-[16px] text-secondary">schedule</span>
                  08:00 AM - 05:30 PM (On Track)
                </span>
<span className="flex items-center gap-1">
<span className="material-symbols-outlined text-[16px] text-secondary">aspect_ratio</span>
                  3,200 Sft Area
                </span>
</div>
</div>

<div className="flex sm:flex-col items-center sm:items-end justify-between gap-1 bg-surface-container-low p-2 rounded-lg sm:bg-transparent sm:p-0">
<span className="font-label-sm text-label-sm text-on-surface-variant">Task Progress</span>
<span className="font-tabular-metric text-tabular-metric text-primary">82%</span>
<span className="font-label-sm text-label-sm text-primary-container">Est. Finish: 04:30 PM</span>
</div>
</div>

<div className="p-space-md rounded-xl bg-surface-container-low flex flex-col gap-space-sm">
<span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider">Sub-Component Milestones &amp; Work Breakdown</span>
<div className="grid grid-cols-2 sm:grid-cols-4 gap-space-sm">
<div className="p-space-sm rounded-lg bg-surface-container-lowest flex flex-col gap-1">
<div className="flex justify-between items-center">
<span className="font-label-sm text-label-sm text-on-surface-variant">Main Bottom Steel</span>
<span className="material-symbols-outlined text-primary text-[14px]">check_circle</span>
</div>
<span className="font-tabular-metric-sm text-tabular-metric-sm text-on-surface">100% Complete</span>
<div className="w-full bg-surface-container h-1 rounded-full overflow-hidden">
<div className="bg-primary h-full rounded-full" style={{ width: "100%" }}></div>
</div>
</div>
<div className="p-space-sm rounded-lg bg-surface-container-lowest flex flex-col gap-1">
<div className="flex justify-between items-center">
<span className="font-label-sm text-label-sm text-on-surface-variant">Distribution Bars</span>
<span className="text-primary font-tabular-metric-sm text-tabular-metric-sm">90%</span>
</div>
<span className="font-tabular-metric-sm text-tabular-metric-sm text-on-surface">Tying Final Spans</span>
<div className="w-full bg-surface-container h-1 rounded-full overflow-hidden">
<div className="bg-primary h-full rounded-full" style={{ width: "90%" }}></div>
</div>
</div>
<div className="p-space-sm rounded-lg bg-surface-container-lowest flex flex-col gap-1">
<div className="flex justify-between items-center">
<span className="font-label-sm text-label-sm text-on-surface-variant">Negative Chairs</span>
<span className="text-secondary font-tabular-metric-sm text-tabular-metric-sm">70%</span>
</div>
<span className="font-tabular-metric-sm text-tabular-metric-sm text-on-surface">84 / 120 Installed</span>
<div className="w-full bg-surface-container h-1 rounded-full overflow-hidden">
<div className="bg-secondary h-full rounded-full" style={{ width: "70%" }}></div>
</div>
</div>
<div className="p-space-sm rounded-lg bg-surface-container-lowest flex flex-col gap-1">
<div className="flex justify-between items-center">
<span className="font-label-sm text-label-sm text-on-surface-variant">Cover Blocks (25mm)</span>
<span className="text-secondary font-tabular-metric-sm text-tabular-metric-sm">65%</span>
</div>
<span className="font-tabular-metric-sm text-tabular-metric-sm text-on-surface">Under placement</span>
<div className="w-full bg-surface-container h-1 rounded-full overflow-hidden">
<div className="bg-secondary h-full rounded-full" style={{ width: "65%" }}></div>
</div>
</div>
</div>
</div>

<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-space-md pt-space-xs">

<div className="flex items-center gap-space-xs">
<div className="flex -space-x-2 overflow-hidden">
<img className="inline-block h-8 w-8 rounded-lg object-cover ring-2 ring-surface-container-lowest" data-alt="Close up photograph of ribbed steel reinforcement rebar mesh tied neatly on a concrete slab deck with spacer chairs at construction site" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCRabxmS50VL5kN4Hy4CxB14O0TBon6OE_dR_ApgWlBVfPuZ0Jq7fSvp6nd_KlWmauShzB8bv5_srMuunkWkAlFSq4-_s-JiZyOqE63nMlKYpGeJRP44dAW73W7uL3HoNzHApRjYkPFsLM5ndn2Qf0g5-tw5-TLjc-cU0PZi-62yPMbshIGa3MAQcJP9z-D4GFWQi111FbNissJ3Qqr2t0AtBlWAZVSJRvaaSAzJXxhTmv0eb-STgDC" />
<img className="inline-block h-8 w-8 rounded-lg object-cover ring-2 ring-surface-container-lowest" data-alt="Construction site engineer with clipboard checking rebar spacing on a newly laid suspended concrete slab deck" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAx8Qy5HbiG7P4zvgVvCdtGWfHQD5obZPjEJ-eUQXWhWgmba0NotXzjx-Buyo6y7Woi17nmPwYfd0V_GvAYB-xNnOGwapTEGWLofsHx1s0qHZ4mOA7b1kj7a7FKBBFSjw6DOSRexrba19gZn-Ik6tQRviB1FjA6LVIaJ4zu9WB-ZpNYJeA0MRdkWxcSScx576Q5VME04nUcs1bTRRAc5THkwbMe11miWDj_GHVJKfo6BwP9P6ON9T7-" />
<img className="inline-block h-8 w-8 rounded-lg object-cover ring-2 ring-surface-container-lowest" data-alt="Detailed view of rebar binding wire tie and concrete cover spacer blocks under heavy steel bars on deck" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDDH2YyCWPeVthLdno_yBO8zJnaM0tVbE8odDUJTW1Z1fDyGIa1RDCBWYHrbJn6mXmoWh-54v3KfGuB7v4uQKTOK6mIhcBdljBqm7czboQBkg0l7f0VmHWhrSQNZODlyTVeXK60UcDKLm8jwX0hAXxw0O4zpQT_djLhiRJc4uxtzGCgWqdWNuvFlMcRwUMQGoiJUisPS1HEUKjwBIVg5H-kpZW8Hnav922U1fmaEE04fkHWymqu8Cdx" />
</div>
<button className="font-label-sm text-label-sm text-tertiary font-semibold hover:underline ml-1" type="button">
                View Site Photos (6)
              </button>
</div>

<div className="flex items-center gap-space-xs flex-wrap">
<button className="px-space-sm py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-title-md text-title-md transition-colors flex items-center gap-1" type="button">
<span className="material-symbols-outlined text-[15px]">edit_document</span> Log M-Book
              </button>
<button className="px-space-sm py-1.5 rounded-lg bg-error-container hover:bg-error-container/80 text-on-error-container font-title-md text-title-md transition-colors flex items-center gap-1" type="button">
<span className="material-symbols-outlined text-[15px]">report</span> Flag Snag
              </button>
<button className="px-space-md py-1.5 rounded-lg bg-primary text-on-primary font-title-md text-title-md hover:bg-primary-container transition-all flex items-center gap-1 shadow-sm" type="button">
<span className="material-symbols-outlined text-[15px]">assignment_turned_in</span> Request QA Hold Sign-off
              </button>
</div>
</div>
</div>

<div className="p-space-md rounded-xl bg-surface-container-lowest shadow-sm flex flex-col gap-space-sm">
<div className="flex flex-col sm:flex-row sm:items-start justify-between gap-space-xs">
<div className="flex flex-col gap-1">
<div className="flex items-center gap-space-xs">
<span className="px-2 py-0.5 rounded bg-surface-container font-label-md text-label-md text-on-surface font-mono">Act #07-C</span>
<span className="px-2 py-0.5 rounded bg-error-container text-on-error-container font-label-sm text-label-sm font-semibold flex items-center gap-1">
<span className="material-symbols-outlined text-[12px]">pause</span> QA HOLD GATE
                </span>
<span className="text-on-surface-variant font-label-sm text-label-sm">Electrical MEP In-Slab</span>
</div>
<h4 className="font-headline-sm text-headline-sm text-on-surface">Electrical In-Slab Fan Box &amp; PVC Conduit Laying</h4>
<p className="font-body-sm text-body-sm text-on-surface-variant">
                Supervisor: <span className="text-on-surface font-medium">Anji Reddy (MEP Lead • Apex Electricals)</span> • 6 Electricians
              </p>
</div>
<div className="sm:text-right">
<span className="font-label-sm text-label-sm text-error font-semibold">Blocked: 3h 15m</span>
<div className="font-tabular-metric-sm text-tabular-metric-sm text-on-surface">50% Placed</div>
</div>
</div>

<div className="p-space-sm rounded-lg bg-error-container/25 text-on-surface flex items-start gap-space-sm">
<span className="material-symbols-outlined text-error text-[18px] mt-0.5">warning</span>
<div className="flex-1">
<span className="font-title-md text-title-md text-error block">Consultant Sign-off Pending: Grid C3 Bunching</span>
<p className="font-body-sm text-body-sm text-on-surface-variant">
                Conduit bundle exceeds 3-pipe cluster rule at main corridor junction. Requires spacer saddles per structural advisory note #SN-88.
              </p>
</div>
<button className="px-space-sm py-1 rounded bg-error text-on-error font-title-md text-title-md hover:bg-on-error-container transition-colors whitespace-nowrap self-center" type="button">
              Re-Inspect &amp; Clear
            </button>
</div>
</div>

<div className="p-space-md rounded-xl bg-surface-container-lowest shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm opacity-90">
<div className="flex items-center gap-space-md">
<div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary shrink-0">
<span className="material-symbols-outlined text-[24px]">task_alt</span>
</div>
<div className="flex flex-col">
<div className="flex items-center gap-space-xs">
<span className="font-label-md text-label-md text-on-surface font-mono">Act #07-D</span>
<span className="px-2 py-0.2 rounded bg-surface-container text-primary font-label-sm text-label-sm font-semibold">Verified 100%</span>
</div>
<h4 className="font-title-md text-title-md text-on-surface">Edge Shuttering &amp; Plumb Line Benchmark Verification</h4>
<span className="font-body-sm text-body-sm text-on-surface-variant">Suresh V. (Lead Surveyor) • Sign-off by Quality Head @ 11:20 AM</span>
</div>
</div>
<div className="flex items-center gap-space-sm">
<span className="font-label-sm text-label-sm text-on-surface-variant">Tolerance: ±2mm (Pass)</span>
<button className="p-1 rounded text-on-surface-variant hover:bg-surface-container" type="button">
<span className="material-symbols-outlined text-[18px]">attachment</span>
</button>
</div>
</div>

<div className="p-space-md rounded-xl bg-surface-container-low shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm">
<div className="flex items-center gap-space-md">
<div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center text-on-surface-variant shrink-0">
<span className="material-symbols-outlined text-[22px]">calendar_clock</span>
</div>
<div className="flex flex-col">
<div className="flex items-center gap-space-xs">
<span className="font-label-md text-label-md text-on-surface-variant font-mono">Act #08-A</span>
<span className="px-2 py-0.2 rounded bg-secondary-container text-on-secondary-fixed font-label-sm text-label-sm">Stage 08 Queued</span>
<span className="font-label-sm text-label-sm text-on-surface-variant">Scheduled: Tomorrow 08:30 AM</span>
</div>
<h4 className="font-title-md text-title-md text-on-surface">AAC Block Stacking &amp; Mortar Mixer Staging at Stilt Floor</h4>
<span className="font-body-sm text-body-sm text-on-surface-variant">Assigned: Naresh B. (Logistics &amp; Inventory Lead) • Unloading bay cleared</span>
</div>
</div>
<button className="px-space-md py-1.5 rounded-lg bg-surface-container-lowest hover:bg-surface-container text-on-surface font-title-md text-title-md transition-colors self-start sm:self-auto shadow-sm" type="button">
            Review Staging Plan
          </button>
</div>
</div>
</div>

<div className="lg:col-span-5 flex flex-col gap-space-md">
<div className="p-space-lg rounded-xl bg-surface-container-lowest shadow-sm flex flex-col gap-space-md">

<div className="flex flex-col gap-space-2xs">
<div className="flex items-center justify-between">
<span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider">Predictive BOM &amp; Procurement</span>
<span className="px-2 py-0.5 rounded bg-primary-container text-on-primary-container font-label-sm text-label-sm font-semibold">Auto-Synced with BOQ</span>
</div>
<h3 className="font-headline-sm text-headline-sm text-on-surface">Material Runway for Stage 08 Onset</h3>
<p className="font-body-sm text-body-sm text-on-surface-variant">
            Forecasting combined deficit for Stage 07 completion + Stage 08 AAC Blockwork initiation (Target date: 08 Sept).
          </p>
</div>

<div className="p-space-md rounded-xl bg-surface-container-low flex items-center justify-between gap-space-sm">
<div className="flex flex-col">
<span className="font-label-sm text-label-sm text-on-surface-variant">Projected Outlay (Next Phase)</span>
<span className="font-tabular-metric text-tabular-metric text-on-surface">₹2,84,600</span>
</div>
<div className="flex flex-col items-end">
<span className="font-label-sm text-label-sm text-on-surface-variant">PO Clearance Lead Time</span>
<span className="font-title-md text-title-md text-primary font-semibold">48h Delivery Window</span>
</div>
</div>

<div className="flex flex-col gap-space-sm overflow-hidden">

<div className="p-space-md rounded-xl bg-surface-container-lowest hover:bg-surface-container-low transition-colors flex flex-col gap-space-xs shadow-sm">
<div className="flex items-start justify-between gap-space-xs">
<div className="flex flex-col">
<span className="font-title-md text-title-md text-on-surface">AAC Blocks 600x200x150mm</span>
<span className="font-body-sm text-body-sm text-on-surface-variant">Grade 1 • Biltech / Ultratech</span>
</div>
<span className="px-2 py-0.5 rounded bg-error-container text-on-error-container font-label-sm text-label-sm font-bold">Deficit -2,050 Nos</span>
</div>

<div className="grid grid-cols-3 gap-space-xs py-1 text-on-surface-variant font-body-sm text-body-sm">
<div>
<span className="block font-label-sm text-label-sm">Stage Need</span>
<span className="font-tabular-metric-sm text-tabular-metric-sm text-on-surface">2,400 Nos</span>
</div>
<div>
<span className="block font-label-sm text-label-sm">Site Stock</span>
<span className="font-tabular-metric-sm text-tabular-metric-sm text-on-surface">350 Nos</span>
</div>
<div>
<span className="block font-label-sm text-label-sm">Rate Benchmark</span>
<span className="font-tabular-metric-sm text-tabular-metric-sm text-on-surface">₹62 / Block</span>
</div>
</div>
<div className="flex items-center justify-between pt-space-xs">
<span className="font-label-sm text-label-sm text-on-surface-variant">AI Rec: Order 2,500 (+Buffer)</span>
<button className="px-space-md py-1 rounded-lg bg-primary text-on-primary font-title-md text-title-md hover:bg-primary-container transition-colors flex items-center gap-1 shadow-sm" type="button">
<span className="material-symbols-outlined text-[14px]">shopping_cart_checkout</span> Generate PO
              </button>
</div>
</div>

<div className="p-space-md rounded-xl bg-surface-container-lowest hover:bg-surface-container-low transition-colors flex flex-col gap-space-xs shadow-sm">
<div className="flex items-start justify-between gap-space-xs">
<div className="flex flex-col">
<span className="font-title-md text-title-md text-on-surface">Polymer Thin-Bed Jointing Mortar</span>
<span className="font-body-sm text-body-sm text-on-surface-variant">40kg Bags • Saint-Gobain Weber</span>
</div>
<span className="px-2 py-0.5 rounded bg-error-container text-on-error-container font-label-sm text-label-sm font-bold">Deficit -102 Bags</span>
</div>
<div className="grid grid-cols-3 gap-space-xs py-1 text-on-surface-variant font-body-sm text-body-sm">
<div>
<span className="block font-label-sm text-label-sm">Stage Need</span>
<span className="font-tabular-metric-sm text-tabular-metric-sm text-on-surface">120 Bags</span>
</div>
<div>
<span className="block font-label-sm text-label-sm">Site Stock</span>
<span className="font-tabular-metric-sm text-tabular-metric-sm text-on-surface">18 Bags</span>
</div>
<div>
<span className="block font-label-sm text-label-sm">Rate Benchmark</span>
<span className="font-tabular-metric-sm text-tabular-metric-sm text-on-surface">₹380 / Bag</span>
</div>
</div>
<div className="flex items-center justify-between pt-space-xs">
<span className="font-label-sm text-label-sm text-on-surface-variant">AI Rec: Indent 110 Bags</span>
<button className="px-space-sm py-1 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-title-md text-title-md transition-colors flex items-center gap-1" type="button">
<span className="material-symbols-outlined text-[14px]">add</span> Add to Batch
              </button>
</div>
</div>

<div className="p-space-md rounded-xl bg-surface-container-lowest hover:bg-surface-container-low transition-colors flex flex-col gap-space-xs shadow-sm">
<div className="flex items-start justify-between gap-space-xs">
<div className="flex flex-col">
<span className="font-title-md text-title-md text-on-surface">OPC 53 Grade Cement</span>
<span className="font-body-sm text-body-sm text-on-surface-variant">UltraTech • 50kg Bags</span>
</div>
<span className="px-2 py-0.5 rounded bg-error-container text-on-error-container font-label-sm text-label-sm font-bold">Deficit -240 Bags</span>
</div>
<div className="grid grid-cols-3 gap-space-xs py-1 text-on-surface-variant font-body-sm text-body-sm">
<div>
<span className="block font-label-sm text-label-sm">Target Batch</span>
<span className="font-tabular-metric-sm text-tabular-metric-sm text-on-surface">450 Bags</span>
</div>
<div>
<span className="block font-label-sm text-label-sm">Silo Stock</span>
<span className="font-tabular-metric-sm text-tabular-metric-sm text-on-surface">210 Bags</span>
</div>
<div>
<span className="block font-label-sm text-label-sm">Batching Slip</span>
<span className="font-tabular-metric-sm text-tabular-metric-sm text-on-surface">M25 RMC</span>
</div>
</div>
<div className="flex items-center justify-between pt-space-xs">
<span className="font-label-sm text-label-sm text-on-surface-variant">AI Rec: Order 300 Bags (Buffer)</span>
<button className="px-space-sm py-1 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-title-md text-title-md transition-colors flex items-center gap-1" type="button">
<span className="material-symbols-outlined text-[14px]">add</span> Add to Batch
              </button>
</div>
</div>

<div className="p-space-md rounded-xl bg-surface-container-lowest hover:bg-surface-container-low transition-colors flex flex-col gap-space-xs shadow-sm opacity-80">
<div className="flex items-start justify-between gap-space-xs">
<div className="flex flex-col">
<span className="font-title-md text-title-md text-on-surface">Fe500D 10mm TMT Rebar</span>
<span className="font-body-sm text-body-sm text-on-surface-variant">Jairaj / Jindal Panther</span>
</div>
<span className="px-2 py-0.5 rounded bg-primary-container text-on-primary-container font-label-sm text-label-sm font-semibold">+2.6 MT Surplus</span>
</div>
<div className="grid grid-cols-3 gap-space-xs py-1 text-on-surface-variant font-body-sm text-body-sm">
<div>
<span className="block font-label-sm text-label-sm">Stage Need</span>
<span className="font-tabular-metric-sm text-tabular-metric-sm text-on-surface">3.2 MT</span>
</div>
<div>
<span className="block font-label-sm text-label-sm">Yard Stock</span>
<span className="font-tabular-metric-sm text-tabular-metric-sm text-primary">5.8 MT</span>
</div>
<div>
<span className="block font-label-sm text-label-sm">Stock Status</span>
<span className="font-tabular-metric-sm text-tabular-metric-sm text-primary">Healthy</span>
</div>
</div>
</div>

<div className="p-space-md rounded-xl bg-surface-container-lowest hover:bg-surface-container-low transition-colors flex flex-col gap-space-xs shadow-sm">
<div className="flex items-start justify-between gap-space-xs">
<div className="flex flex-col">
<span className="font-title-md text-title-md text-on-surface">25mm Heavy Duty PVC Conduits</span>
<span className="font-body-sm text-body-sm text-on-surface-variant">Precision Pipes • Black</span>
</div>
<span className="px-2 py-0.5 rounded bg-error-container text-on-error-container font-label-sm text-label-sm font-bold">Deficit -1,200 Rft</span>
</div>
<div className="flex items-center justify-between pt-space-xs">
<span className="font-label-sm text-label-sm text-on-surface-variant">AI Rec: Indent 1,500 Rft</span>
<button className="px-space-sm py-1 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-title-md text-title-md transition-colors flex items-center gap-1" type="button">
<span className="material-symbols-outlined text-[14px]">add</span> Add to Batch
              </button>
</div>
</div>
</div>

<div className="pt-space-sm flex flex-col gap-space-xs">
<button className="w-full py-2.5 rounded-lg bg-primary-container text-on-primary-container hover:bg-primary font-headline-sm text-headline-sm transition-all flex items-center justify-center gap-space-xs shadow-md" id="requisitions" type="button">
<span className="material-symbols-outlined text-[18px]">receipt_long</span>
<span>Consolidate into Requisition (#PR-2026-104)</span>
</button>
<div className="flex items-center justify-between px-space-xs text-on-surface-variant font-label-sm text-label-sm">
<span>Direct PO release via Enterprise ERP</span>
<span className="text-primary font-medium">Estimated arrival: Sept 06</span>
</div>
</div>
</div>

<div className="p-space-md rounded-xl bg-surface-container-lowest shadow-sm flex flex-col gap-space-sm">
<div className="flex items-center justify-between">
<span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider">Quality Assurance Feed</span>
<span className="material-symbols-outlined text-primary text-[18px]">biotech</span>
</div>
<div className="flex items-center justify-between bg-surface-container-low p-space-sm rounded-lg">
<div className="flex flex-col">
<span className="font-title-md text-title-md text-on-surface">3-Day Compressive Strength Test</span>
<span className="font-body-sm text-body-sm text-on-surface-variant">Cube ID: #TWR-A-4F-082 (Set of 3)</span>
</div>
<div className="text-right">
<span className="font-tabular-metric-sm text-tabular-metric-sm text-primary font-bold">18.4 N/mm²</span>
<span className="block font-label-sm text-label-sm text-on-surface-variant">Min Target: 16.5</span>
</div>
</div>
<div className="flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm">
<span>7-Day Demould Test Scheduled</span>
<span className="text-on-surface font-semibold">Sept 07, 10:00 AM</span>
</div>
</div>
</div>
</div>

<div className="p-space-lg rounded-xl bg-surface-container-lowest shadow-sm flex flex-col gap-space-md">
<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm">
<div className="flex flex-col">
<h3 className="font-headline-sm text-headline-sm text-on-surface">Field Supervisors &amp; Shift Crew Roster</h3>
<p className="font-body-sm text-body-sm text-on-surface-variant">Live telemetry, biometric gate sync, and active assigned gang capacity for Tower A.</p>
</div>
<div className="flex items-center gap-space-sm">
<span className="font-label-sm text-label-sm text-on-surface-variant">Shift: 08:00 AM – 06:00 PM</span>
<button className="px-space-md py-1.5 rounded-lg bg-surface-container text-on-surface font-title-md text-title-md hover:bg-surface-container-high transition-colors flex items-center gap-1" type="button">
<span className="material-symbols-outlined text-[16px]">groups</span> Rebalance Gangs
        </button>
</div>
</div>

<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">

<div className="p-space-md rounded-xl bg-surface-container-low flex flex-col justify-between gap-space-md">
<div className="flex items-start gap-space-sm">
<img className="w-10 h-10 rounded-full object-cover shrink-0" data-alt="Close up portrait photograph of an Indian civil construction foreman in a yellow hard hat and safety vest smiling outdoors at building site" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC6EzscboN25dlW9Ne-DeCik6lXFz4DU8-jmkQg3P4h5YTu8Eb26yQgpUSmH27a1TAFPjmt6w5tUhQIGLIiKZU-vnO62IdI2FSUVh0ySnByU9CLIozuMTL22_2NNARzdsrhM5LoK_AT51ApjGYVxAibyCu7ho18ElwEPDeaN7da20_CI_fCiNxHqyN3n2u08dJA_L6xERygLJ2uia5aHmspBZ5HdXcX7s6-1Cg8pS-Hv4lbD6uJMuz7" />
<div className="flex flex-col min-w-0">
<span className="font-title-md text-title-md text-on-surface truncate">Rajesh Kumar</span>
<span className="font-label-sm text-label-sm text-secondary truncate">Senior Rebar &amp; RCC Foreman</span>
<span className="font-label-sm text-label-sm text-primary font-medium mt-0.5 flex items-center gap-0.5">
<span className="w-1.5 h-1.5 rounded-full bg-primary"></span> On Site • Gate 2 (07:48 AM)
            </span>
</div>
</div>
<div className="flex flex-col gap-1.5 bg-surface-container-lowest p-2.5 rounded-lg">
<div className="flex justify-between font-label-sm text-label-sm text-on-surface-variant">
<span>Tasks: 3 Assigned</span>
<span className="text-primary font-bold">84% Velocity</span>
</div>
<div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
<div className="bg-primary h-full rounded-full" style={{ width: "84%" }}></div>
</div>
<div className="flex justify-between items-center text-on-surface-variant font-label-sm text-label-sm mt-1">
<span>Gang 03: 12 Bar Benders</span>
<span className="text-on-surface font-medium">Grid C1-C9</span>
</div>
</div>
<div className="flex items-center justify-between pt-1">
<button className="font-title-md text-title-md text-tertiary flex items-center gap-1 hover:underline" type="button">
<span className="material-symbols-outlined text-[16px]">call</span> Call Lead
          </button>
<span className="px-2 py-0.5 rounded bg-surface-container font-label-sm text-label-sm text-on-surface">No Blockers</span>
</div>
</div>

<div className="p-space-md rounded-xl bg-surface-container-low flex flex-col justify-between gap-space-md">
<div className="flex items-start gap-space-sm">
<img className="w-10 h-10 rounded-full object-cover shrink-0" data-alt="Portrait of an Indian MEP electrical site supervisor wearing white hard hat and safety glasses on active construction deck" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCnzLZOU_yrWN_KUTiGisjikIvgI2qRXziGPH2BFEq1yzrwc8Y1QktaToaYHBsKGCwAtX3b0uG1zJBBsgayW7Il3oiYtmKKONdt2OezoV_ocqcP0iAeNWm5XmpSaokwWP3rpTujTGIlmuNddYtkwZKtRYE7_1iPRH3ZHySYLDKNEaIeNJY1blXCt9JcOqRr5ibTqtNPiAo3NLtwjYAz-eG_3mUaSxDNkF35A5ajOn-nExTrGYVh47J3" />
<div className="flex flex-col min-w-0">
<span className="font-title-md text-title-md text-on-surface truncate">Anji Reddy</span>
<span className="font-label-sm text-label-sm text-secondary truncate">MEP In-Slab Supervisor</span>
<span className="font-label-sm text-label-sm text-primary font-medium mt-0.5 flex items-center gap-0.5">
<span className="w-1.5 h-1.5 rounded-full bg-primary"></span> On Site • Gate 1 (08:02 AM)
            </span>
</div>
</div>
<div className="flex flex-col gap-1.5 bg-surface-container-lowest p-2.5 rounded-lg">
<div className="flex justify-between font-label-sm text-label-sm text-on-surface-variant">
<span>Tasks: 2 Assigned</span>
<span className="text-error font-bold">50% Velocity</span>
</div>
<div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
<div className="bg-error h-full rounded-full" style={{ width: "50%" }}></div>
</div>
<div className="flex justify-between items-center text-on-surface-variant font-label-sm text-label-sm mt-1">
<span>Apex Gang: 6 Electricians</span>
<span className="text-error font-medium">1 QA Hold</span>
</div>
</div>
<div className="flex items-center justify-between pt-1">
<button className="font-title-md text-title-md text-tertiary flex items-center gap-1 hover:underline" type="button">
<span className="material-symbols-outlined text-[16px]">call</span> Call Lead
          </button>
<span className="px-2 py-0.5 rounded bg-error-container font-label-sm text-label-sm text-on-error-container font-semibold">Hold Active</span>
</div>
</div>

<div className="p-space-md rounded-xl bg-surface-container-low flex flex-col justify-between gap-space-md">
<div className="flex items-start gap-space-sm">
<img className="w-10 h-10 rounded-full object-cover shrink-0" data-alt="Portrait of an experienced Indian surveyor standing with optical leveling total station on construction floor with yellow helmet" src="https://lh3.googleusercontent.com/aida-public/AB6AXuA_K6ftW-sn_vA_VhA_5xr5kbmHLlhrvfAAFZdLogO0d9Se-by90VMzJ6jj6nWQN7SR1Tb-FdsxQp2Cjik0dSuA-1wmysWb9eAV3iscMZzqGLV75tUnRLGZWsvns_M6PrTr_0SYpV8RS2JErE8xbsrJsJz8peQsjwZU9xfCgUEBDrSBafC78jOCCZCdXJsLoMlPMMWQApPSjgtVZObSQFNmlcHRSRTrIxjxqnFDkHVkK4CFNC9wA5Pa" />
<div className="flex flex-col min-w-0">
<span className="font-title-md text-title-md text-on-surface truncate">Suresh Varma</span>
<span className="font-label-sm text-label-sm text-secondary truncate">Surveyor &amp; Formwork Lead</span>
<span className="font-label-sm text-label-sm text-primary font-medium mt-0.5 flex items-center gap-0.5">
<span className="w-1.5 h-1.5 rounded-full bg-primary"></span> On Site • Gate 2 (07:35 AM)
            </span>
</div>
</div>
<div className="flex flex-col gap-1.5 bg-surface-container-lowest p-2.5 rounded-lg">
<div className="flex justify-between font-label-sm text-label-sm text-on-surface-variant">
<span>Tasks: 2 Assigned</span>
<span className="text-primary font-bold">95% Velocity</span>
</div>
<div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
<div className="bg-primary h-full rounded-full" style={{ width: "95%" }}></div>
</div>
<div className="flex justify-between items-center text-on-surface-variant font-label-sm text-label-sm mt-1">
<span>Gang 01: 10 Carpenters</span>
<span className="text-on-surface font-medium">De-shuttering Prep</span>
</div>
</div>
<div className="flex items-center justify-between pt-1">
<button className="font-title-md text-title-md text-tertiary flex items-center gap-1 hover:underline" type="button">
<span className="material-symbols-outlined text-[16px]">call</span> Call Lead
          </button>
<span className="px-2 py-0.5 rounded bg-surface-container font-label-sm text-label-sm text-on-surface">Target Met</span>
</div>
</div>

<div className="p-space-md rounded-xl bg-surface-container-low flex flex-col justify-between gap-space-md">
<div className="flex items-start gap-space-sm">
<img className="w-10 h-10 rounded-full object-cover shrink-0" data-alt="Portrait of an Indian stores inventory manager in blue work shirt and orange helmet with digital tablet inside raw building material store" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDOUGCPG7Uu1Zw51ta28_UZCR1F1vvi1VpCXfrQ_CK51mgxf21J6ID88zFEU8rsKbFNasr35nN9AQg1E7SYFcB19CE0XFD3rEzspR7FWA4n9sxpzsvPygfxQBN_1fh3Lqq_wVQUqRqzs15bb2JF9KQf-J2vXA6TYjck2uCahQhmq61WW81_6OdnKTQP-FfMw81mk_13pVji6TNnfGaw89UHKCXcfDwX1ss7TthnCwvrmP_mkraDW8gX" />
<div className="flex flex-col min-w-0">
<span className="font-title-md text-title-md text-on-surface truncate">Naresh Babu</span>
<span className="font-label-sm text-label-sm text-secondary truncate">Yard Logistics &amp; Material Stores</span>
<span className="font-label-sm text-label-sm text-primary font-medium mt-0.5 flex items-center gap-0.5">
<span className="w-1.5 h-1.5 rounded-full bg-primary"></span> On Site • Yard Gate (08:10 AM)
            </span>
</div>
</div>
<div className="flex flex-col gap-1.5 bg-surface-container-lowest p-2.5 rounded-lg">
<div className="flex justify-between font-label-sm text-label-sm text-on-surface-variant">
<span>Tasks: 4 Assigned</span>
<span className="text-secondary font-bold">70% Velocity</span>
</div>
<div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
<div className="bg-secondary h-full rounded-full" style={{ width: "70%" }}></div>
</div>
<div className="flex justify-between items-center text-on-surface-variant font-label-sm text-label-sm mt-1">
<span>Stores Gang: 6 Handlers</span>
<span className="text-on-surface font-medium">Stilt Staging Area</span>
</div>
</div>
<div className="flex items-center justify-between pt-1">
<button className="font-title-md text-title-md text-tertiary flex items-center gap-1 hover:underline" type="button">
<span className="material-symbols-outlined text-[16px]">call</span> Call Lead
          </button>
<span className="px-2 py-0.5 rounded bg-surface-container font-label-sm text-label-sm text-on-surface">Stage 08 Staging</span>
</div>
</div>
</div>
</div>
</div>

</main>
      </div>
    </Shell>
  );
}
