import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Shell } from "@/components/saha/Shell";
import { useActiveProject } from "@/hooks/useActiveProject";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/execution-manual")({
  head: () => ({
    meta: [
      { title: "Stage-Wise Field Execution Manual & QA/QC Protocols | Saha OS" },
      { name: "description", content: "14-stage field execution SOP with QA hold gates, guardrails and curing regimens." },
      { property: "og:title", content: "Stage-Wise Field Execution Manual & QA/QC Protocols | Saha OS" },
      { property: "og:description", content: "14-stage field execution SOP with QA hold gates, guardrails and curing regimens." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

const LIFECYCLE_STAGES = [
  "Piling & Earthwork",
  "Raft & Isolated Footings",
  "Plinth Beams",
  "Columns & Shear Walls",
  "Shuttering & BBS",
  "Pre-Pour Clearance",
  "RCC Slab Casting & Curing",
  "AAC Block Masonry",
  "MEP Chasing & Wall Conduits",
  "Cement Plastering",
  "Waterproofing",
  "Tiling & Flooring",
  "Finishes & Joinery",
  "Final Snags & Handover",
];

const POCKET_CARD = [
  "SAHA OS — GANG POCKET CARD · RCC SLAB CASTING (SOP STAGE 07)",
  "",
  "BEFORE POUR (all 5 must be cleared)",
  "1. Slump 120 +/- 25 mm at spout; 6 cubes per 10 cum (3 x 7-day, 3 x 28-day).",
  "2. Cover blocks 20 mm slab / 25 mm beam, 4-5 nos per sqm, tied.",
  "3. Formwork line & level within +/- 3 mm; 1:500 camber over 6 m spans.",
  "4. Rebar laps 50d, max 50% staggered at one section.",
  "5. MEP conduits below top mesh, 50 mm clear between runs, boxes sealed.",
  "",
  "DURING POUR",
  "- Discharge height max 1.5 m. Layers max 450 mm.",
  "- Needle vibrator 10-15 s per poke at 400 mm centres. Never push concrete sideways.",
  "- Max gap between consecutive pours 90 minutes.",
  "",
  "CURING (Hyderabad, 31 C ambient)",
  "- OPC: 10 days ponding. PPC / fly-ash: 14 days ponding.",
  "- Bunds 50 mm high within 24 hours. Potable water only, pH 6-8.",
  "",
  "DESHUTTERING MINIMUMS",
  "- Column / wall / beam sides: 16-24 hours",
  "- Slab soffit: 3 days | Beam soffit: 7 days",
  "- Props: slab up to 4.5 m 7 days, over 4.5 m 14 days",
  "- Props: beams up to 6 m 14 days, over 6 m 21 days",
].join("\n");

function downloadText(name: string, body: string) {
  const url = URL.createObjectURL(new Blob([body], { type: "text/plain;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

function Page() {
  const project = useActiveProject();
  const [stage, setStage] = useState(7);
  const [term, setTerm] = useState("");
  const [note, setNote] = useState("");
  const [pushing, setPushing] = useState(false);

  const show = (haystack: string) =>
    term.trim() === "" || haystack.toLowerCase().includes(term.trim().toLowerCase());

  const pushToField = async () => {
    setPushing(true);
    setNote("");
    try {
      const stageName = LIFECYCLE_STAGES[stage - 1] ?? "RCC Slab Casting & Curing";
      const { data: auth } = await supabase.auth.getUser();
      const senderId = auth.user?.id ?? null;
      const body = `QA/QC pre-pour checklist for SOP Stage ${String(stage).padStart(2, "0")} — ${stageName}. Clear all 5 hold gates (slump, cover, line & level, laps, MEP) before the pour is released.`;
      const { error } = await supabase.from("team_messages").insert({
        channel: "QA & Inspection",
        author_name: "Execution Manual",
        author_role: "QA",
        body,
        is_task: true,
        status: "Open",
        progress: 0,
        project_id: project.id || null,
        sender_id: senderId,
      });
      if (error) throw error;
      await supabase.from("notifications").insert({
        title: `QA checklist pushed — Stage ${String(stage).padStart(2, "0")}`,
        body,
        category: "QA",
        priority: "High",
        link: "/tasks",
        project_id: project.id || null,
        sender_id: senderId,
      });
      setNote("Checklist sent to the field team — it now shows in Task Tracker and Action Centre on their phones.");
    } catch (e) {
      setNote(`Could not send: ${(e as Error).message}`);
    } finally {
      setPushing(false);
    }
  };
  return (
    <Shell title={"Stage-Wise Field Execution Manual & QA/QC Protocols | Saha OS"}>
      <div className="m3">
        <main className="relative pt-16 w-full px-space-xl pb-space-3xl  bg-surface"><div className="flex flex-col w-full">

<div className="flex flex-col lg:flex-row lg:items-center justify-between pb-space-md gap-space-sm">
<div className="flex flex-col gap-space-2xs min-w-0">
<div className="flex items-center gap-space-xs text-on-surface-variant font-body-sm text-body-sm flex-wrap">
<span className="hover:text-primary cursor-pointer">Projects</span>
<span className="material-symbols-outlined text-space-xs">chevron_right</span>
<span className="hover:text-primary cursor-pointer">{project.name}</span>
<span className="material-symbols-outlined text-space-xs">chevron_right</span>
<span className="hover:text-primary cursor-pointer">Engineering Governance</span>
<span className="material-symbols-outlined text-space-xs">chevron_right</span>
<span className="text-on-surface font-title-md text-title-md">Site Execution SOP &amp; QA/QC Manual</span>
</div>
<div className="flex items-center gap-space-sm flex-wrap">
<h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">Stage-Wise Field Execution Manual &amp; QA/QC Protocols</h1>
<span className="inline-flex items-center gap-space-2xs px-space-xs py-space-2xs rounded bg-surface-container text-on-surface font-label-sm text-label-sm uppercase font-semibold">
<span className="material-symbols-outlined text-primary text-[14px]">verified</span>
          IS 456:2000 • SP 34 • IS 1786 Compliant
        </span>
<span className="inline-flex items-center px-space-xs py-space-2xs rounded bg-primary-container text-on-primary-container font-label-sm text-label-sm">
          Rev 2.4 - Approved by Lead Consultant
        </span>
</div>
</div>

<div className="flex items-center gap-space-xs shrink-0 flex-wrap">
<button onClick={() => window.print()} className="inline-flex items-center gap-space-xs px-space-sm py-space-xs rounded bg-surface-container-lowest text-on-surface hover:bg-surface-container transition-colors shadow-sm font-title-md text-title-md">
<span className="material-symbols-outlined text-primary text-space-base">picture_as_pdf</span>
<span>Export Manual (.PDF)</span>
</button>
<button onClick={() => downloadText("Gang-Pocket-Card-Stage-07.txt", POCKET_CARD)} className="inline-flex items-center gap-space-xs px-space-sm py-space-xs rounded bg-surface-container-lowest text-on-surface hover:bg-surface-container transition-colors shadow-sm font-title-md text-title-md">
<span className="material-symbols-outlined text-tertiary text-space-base">print</span>
<span>Gang Pocket Card</span>
</button>
<button onClick={pushToField} disabled={pushing} className="inline-flex items-center gap-space-xs px-space-sm py-space-xs rounded bg-primary text-on-primary hover:bg-primary-container transition-colors font-title-md text-title-md shadow-sm disabled:opacity-60">
<span className="material-symbols-outlined text-space-base">sync</span>
<span>{pushing ? "Sending…" : "Push to Mobile QA App"}</span>
</button>
</div>
{note ? <p className="w-full mt-space-xs px-space-sm py-space-xs rounded bg-primary-container text-on-primary-container font-body-sm text-body-sm">{note}</p> : null}
<div className="hidden">
</div>
</div>

<div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-space-sm mb-space-base">
<div className="bg-surface-container-lowest p-space-sm rounded-lg shadow-sm flex flex-col justify-between">
<div className="flex items-center justify-between">
<span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Stages Mapped</span>
<span className="material-symbols-outlined text-tertiary text-space-base">account_tree</span>
</div>
<div className="mt-space-xs flex items-baseline gap-space-xs">
<span className="font-tabular-metric text-tabular-metric text-on-surface">14</span>
<span className="font-body-sm text-body-sm text-on-surface-variant">L1 to L14</span>
</div>
<span className="font-label-sm text-label-sm text-primary mt-space-2xs">Substructure to Snagging</span>
</div>
<div className="bg-surface-container-lowest p-space-sm rounded-lg shadow-sm flex flex-col justify-between">
<div className="flex items-center justify-between">
<span className="font-label-sm text-label-sm text-on-surface-variant uppercase">QA Hold Gates</span>
<span className="material-symbols-outlined text-primary text-space-base">verified_user</span>
</div>
<div className="mt-space-xs flex items-baseline gap-space-xs">
<span className="font-tabular-metric text-tabular-metric text-on-surface">42</span>
<span className="font-body-sm text-body-sm text-on-surface-variant">Total Points</span>
</div>
<span className="font-label-sm text-label-sm text-primary mt-space-2xs">100% Sign-off Mandate</span>
</div>
<div className="bg-surface-container-lowest p-space-sm rounded-lg shadow-sm flex flex-col justify-between">
<div className="flex items-center justify-between">
<span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Critical Guardrails</span>
<span className="material-symbols-outlined text-error text-space-base">gpp_maybe</span>
</div>
<div className="mt-space-xs flex items-baseline gap-space-xs">
<span className="font-tabular-metric text-tabular-metric text-on-surface">28</span>
<span className="font-body-sm text-body-sm text-on-surface-variant">Failure Triggers</span>
</div>
<span className="font-label-sm text-label-sm text-error mt-space-2xs">Zero Tolerance Codes</span>
</div>
<div className="bg-surface-container-lowest p-space-sm rounded-lg shadow-sm flex flex-col justify-between">
<div className="flex items-center justify-between">
<span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Madhapur Ambient</span>
<span className="material-symbols-outlined text-tertiary text-space-base">thermostat</span>
</div>
<div className="mt-space-xs flex items-baseline gap-space-xs">
<span className="font-tabular-metric text-tabular-metric text-on-surface">31.4°C</span>
<span className="font-body-sm text-body-sm text-on-surface-variant">Dry Air</span>
</div>
<span className="font-label-sm text-label-sm text-secondary mt-space-2xs">Hydration Loss Factor: High</span>
</div>
<div className="bg-surface-container-lowest p-space-sm rounded-lg shadow-sm flex flex-col justify-between">
<div className="flex items-center justify-between">
<span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Curing Regimen</span>
<span className="material-symbols-outlined text-primary text-space-base">water_drop</span>
</div>
<div className="mt-space-xs flex items-baseline gap-space-xs">
<span className="font-tabular-metric text-tabular-metric text-primary">14 Days</span>
<span className="font-body-sm text-body-sm text-on-surface-variant">PPC Blend</span>
</div>
<span className="font-label-sm text-label-sm text-on-surface-variant mt-space-2xs">Continuous Ponding 50mm</span>
</div>
<div className="bg-surface-container-lowest p-space-sm rounded-lg shadow-sm flex flex-col justify-between">
<div className="flex items-center justify-between">
<span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Active Superstructure</span>
<span className="material-symbols-outlined text-primary text-space-base">domain</span>
</div>
<div className="mt-space-xs flex items-baseline gap-space-xs">
<span className="font-tabular-metric text-tabular-metric text-on-surface">G+3 Slab</span>
<span className="font-body-sm text-body-sm text-primary font-semibold">Active</span>
</div>
<span className="font-label-sm text-label-sm text-primary mt-space-2xs">SOP Stage 07 Enacted</span>
</div>
</div>

<div className="bg-surface-container-lowest p-space-sm rounded-lg shadow-sm mb-space-base overflow-x-auto">
<div className="flex items-center justify-between pb-space-2xs">
<span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Project Lifecycle Sequence Selection</span>
<span className="font-label-sm text-label-sm text-primary font-semibold cursor-pointer">View Macro Workflow Matrix →</span>
</div>
<div className="flex items-center gap-space-xs whitespace-nowrap pt-space-2xs">
{LIFECYCLE_STAGES.map((label, i) => {
  const n = i + 1;
  const active = n === stage;
  return (
    <button key={label} onClick={() => setStage(n)} className={`px-space-sm py-space-2xs rounded text-left flex items-center gap-space-xs transition-colors ${active ? "bg-primary text-on-primary shadow-sm" : "bg-surface-container text-on-surface hover:bg-surface-variant"}`}>
      <span className={`font-label-sm text-label-sm ${active ? "opacity-80" : "text-on-surface-variant"}`}>{String(n).padStart(2, "0")}</span>
      <span className={active ? "font-title-md text-title-md font-bold" : "font-body-sm text-body-sm"}>{label}</span>
      {active ? <span className="w-2 h-2 rounded-full bg-primary-fixed animate-ping"></span> : null}
    </button>
  );
})}
</div>
</div>

<div className="mb-space-base px-space-sm py-space-xs rounded-lg bg-surface-container text-on-surface font-body-sm text-body-sm">
Selected stage: <strong>{String(stage).padStart(2, "0")} · {LIFECYCLE_STAGES[stage - 1]}</strong>{stage !== 7 ? " — the detailed written protocol below is authored for Stage 07 (RCC slab casting). Checklist pushes and pocket cards use the stage you selected." : ""}
</div>
<div className="grid grid-cols-1 xl:grid-cols-12 gap-space-base items-start">

<div className="xl:col-span-8 flex flex-col gap-space-base">

<div className="bg-surface-container-lowest p-space-base rounded-lg shadow-sm relative overflow-hidden">
<div className="flex flex-col md:flex-row md:items-center justify-between gap-space-sm pb-space-sm">
<div>
<div className="flex items-center gap-space-xs">
<span className="px-space-xs py-space-2xs rounded bg-surface-container text-primary font-label-sm text-label-sm font-bold">STAGE 07 EXECUTION</span>
<span className="text-on-surface-variant font-label-sm text-label-sm">Specification Ref: SEC-CIVIL-0456-A</span>
</div>
<h2 className="font-headline-md text-headline-md text-on-surface mt-space-2xs">
              RCC Superstructure Slab &amp; Beam Concreting, Compaction &amp; De-Shuttering Protocol
            </h2>
</div>
<div className="flex items-center gap-space-xs shrink-0">
<span className="px-space-xs py-space-2xs rounded bg-surface-container-high text-on-surface font-label-sm text-label-sm">
              Mix Design: M25 / M30 Ready-Mix
            </span>
</div>
</div>
<p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
          Operational methodology covering formwork verification, cover blocks, steel staging, MEP raceway clearances, concrete placement kinetics, needle vibrator application, and hydrational pond curing compliant with IS 456 (2000) Clauses 13, 14, and 15.
        </p>

<div className="grid grid-cols-5 gap-space-2xs pt-space-md text-center">
<div className="p-space-xs bg-surface-container rounded flex flex-col items-center">
<span className="font-label-sm text-label-sm text-primary font-bold">01. STAGING</span>
<span className="font-body-sm text-body-sm text-on-surface truncate w-full">Formwork &amp; Plumb</span>
</div>
<div className="p-space-xs bg-surface-container rounded flex flex-col items-center">
<span className="font-label-sm text-label-sm text-primary font-bold">02. REBAR</span>
<span className="font-body-sm text-body-sm text-on-surface truncate w-full">BBS &amp; Cover Blocks</span>
</div>
<div className="p-space-xs bg-surface-container rounded flex flex-col items-center">
<span className="font-label-sm text-label-sm text-primary font-bold">03. MEP PASS</span>
<span className="font-body-sm text-body-sm text-on-surface truncate w-full">Conduits &amp; Boxes</span>
</div>
<div className="p-space-xs bg-surface-container rounded flex flex-col items-center">
<span className="font-label-sm text-label-sm text-primary font-bold">04. PRE-CLEAN</span>
<span className="font-body-sm text-body-sm text-on-surface truncate w-full">Slurry Flush &amp; Sign</span>
</div>
<div className="p-space-xs bg-primary text-on-primary rounded flex flex-col items-center">
<span className="font-label-sm text-label-sm font-bold">05. POUR &amp; VIBE</span>
<span className="font-body-sm text-body-sm truncate w-full">Compaction &amp; Pond</span>
</div>
</div>
</div>

<div className="bg-surface-container-lowest p-space-base rounded-lg shadow-sm">
<div className="flex items-center justify-between pb-space-sm">
<div className="flex items-center gap-space-xs">
<span className="material-symbols-outlined text-primary text-space-lg">format_list_numbered</span>
<h3 className="font-title-md text-title-md text-on-surface uppercase tracking-wider">A. Step-by-Step Engineering Execution Sequence</h3>
</div>
<span className="font-label-sm text-label-sm text-on-surface-variant">Mandatory For Site Supervisors &amp; Gang Foremen</span>
</div>
<div className="flex flex-col gap-space-md">

<div className="flex gap-space-sm p-space-sm bg-surface-container-low rounded-lg">
<div className="w-8 h-8 rounded bg-primary text-on-primary font-tabular-metric-sm text-tabular-metric-sm flex items-center justify-center shrink-0">
              01
            </div>
<div className="flex flex-col gap-space-2xs min-w-0">
<div className="flex items-center justify-between flex-wrap">
<h4 className="font-title-md text-title-md text-on-surface">Shuttering, Formwork Leveling &amp; Rigidity Verification</h4>
<span className="px-space-xs py-space-2xs rounded bg-surface-container text-tertiary font-label-sm text-label-sm">Tolerance: ±3mm Line &amp; Level</span>
</div>
<p className="font-body-md text-body-md text-on-surface-variant">
                Use film-faced waterproof plywood (minimum thickness 12mm). Staging props must be spaced at maximum 1.0m c/c along both axes, anchored with horizontal tie runners at 1.2m heights. Mid-span upward camber of 1:500 must be built into beams exceeding 6.0m clear span. Seal all ply butt-joints with adhesive PVC flashing tape to prevent cement slurry leaks.
              </p>
<div className="flex items-center gap-space-base pt-space-2xs text-on-surface-variant font-label-sm text-label-sm">
<span className="flex items-center gap-space-2xs"><span className="material-symbols-outlined text-primary text-[14px]">check</span> IS 14687 Formwork Staging</span>
<span className="flex items-center gap-space-2xs"><span className="material-symbols-outlined text-primary text-[14px]">check</span> Zero Hollow Prop Base Plugs</span>
</div>
</div>
</div>

<div className="flex gap-space-sm p-space-sm bg-surface-container-low rounded-lg">
<div className="w-8 h-8 rounded bg-primary text-on-primary font-tabular-metric-sm text-tabular-metric-sm flex items-center justify-center shrink-0">
              02
            </div>
<div className="flex flex-col gap-space-2xs min-w-0">
<div className="flex items-center justify-between flex-wrap">
<h4 className="font-title-md text-title-md text-on-surface">Rebar Cage Binding, Chair Support &amp; Factory Cover Blocks</h4>
<span className="px-space-xs py-space-2xs rounded bg-surface-container text-tertiary font-label-sm text-label-sm">IS 1786 Fe550D TMT</span>
</div>
<p className="font-body-md text-body-md text-on-surface-variant">
                Arrange beam main tensile and compression reinforcement strictly per Bar Bending Schedule (BBS). Beam stirrups must feature 135° seismic hooks with minimum 10d extension. Install 12mm rebar chairs spaced maximum 1.0m c/c between bottom mesh and top cranked negative reinforcement. Install factory-molded 50MPa concrete cover blocks with embedded tie-wires: 20mm for slabs, 25mm for beams, 40mm for column starter stubs.
              </p>
<div className="flex items-center gap-space-base pt-space-2xs text-on-surface-variant font-label-sm text-label-sm">
<span className="flex items-center gap-space-2xs"><span className="material-symbols-outlined text-primary text-[14px]">check</span> Cover Blocks: 5 Nos/m²</span>
<span className="flex items-center gap-space-2xs"><span className="material-symbols-outlined text-primary text-[14px]">check</span> 16-Gauge Annealed GI Binding Wire</span>
</div>
</div>
</div>

<div className="flex gap-space-sm p-space-sm bg-surface-container-low rounded-lg">
<div className="w-8 h-8 rounded bg-primary text-on-primary font-tabular-metric-sm text-tabular-metric-sm flex items-center justify-center shrink-0">
              03
            </div>
<div className="flex flex-col gap-space-2xs min-w-0">
<div className="flex items-center justify-between flex-wrap">
<h4 className="font-title-md text-title-md text-on-surface">MEP Electrical Conduiting, Junction Boxes &amp; Sleeve Casts</h4>
<span className="px-space-xs py-space-2xs rounded bg-surface-container text-tertiary font-label-sm text-label-sm">Clearance ≥50mm Between Pipes</span>
</div>
<p className="font-body-md text-body-md text-on-surface-variant">
                Run Heavy Duty HMS PVC conduits beneath the top reinforcement layer. Never bunch multiple pipes into a single channel; maintain 50mm lateral clearance between parallel runs to allow 20mm aggregates to flow and eliminate honeycombing. Ceiling fan hook boxes must be mechanically welded or hooked directly over top structural rebar. Fill all conduit junction boxes with damp sand or thermocol and seal with duct tape to prevent concrete ingress.
              </p>
</div>
</div>

<div className="flex gap-space-sm p-space-sm bg-surface-container-low rounded-lg">
<div className="w-8 h-8 rounded bg-primary text-on-primary font-tabular-metric-sm text-tabular-metric-sm flex items-center justify-center shrink-0">
              04
            </div>
<div className="flex flex-col gap-space-2xs min-w-0">
<div className="flex items-center justify-between flex-wrap">
<h4 className="font-title-md text-title-md text-on-surface">Formwork Cleaning, Shutter Oil &amp; Slurry Flush</h4>
<span className="px-space-xs py-space-2xs rounded bg-surface-container text-tertiary font-label-sm text-label-sm">High-Pressure Jet Cleaned</span>
</div>
<p className="font-body-md text-body-md text-on-surface-variant">
                Blow out all wood sawdust, shavings, cut binding wires, and debris using an industrial high-pressure air compressor nozzle followed by fresh water flushing. Form release agent must be applied to plywood prior to rebar laying; if rebar becomes contaminated with chemical demoulding oil, scrub it clean immediately with industrial wire brushes before concrete pour approval.
              </p>
</div>
</div>

<div className="flex gap-space-sm p-space-sm bg-surface-container-low rounded-lg">
<div className="w-8 h-8 rounded bg-primary text-on-primary font-tabular-metric-sm text-tabular-metric-sm flex items-center justify-center shrink-0">
              05
            </div>
<div className="flex flex-col gap-space-2xs min-w-0">
<div className="flex items-center justify-between flex-wrap">
<h4 className="font-title-md text-title-md text-on-surface">Concrete Discharge, Layer Compaction &amp; Surface Leveling</h4>
<span className="px-space-xs py-space-2xs rounded bg-surface-container text-tertiary font-label-sm text-label-sm">Layer Thickness ≤450mm</span>
</div>
<p className="font-body-md text-body-md text-on-surface-variant">
                Cast concrete systematically from the farthest beam bays toward the pump boom staging. Discharge height must not exceed 1.5m to eliminate aggregate segregation. Submerge 40mm and 60mm needle vibrators vertically at 400mm centers into the layer beneath for 10-15 seconds per poke until the surface displays a uniform sheen. Never use vibrators to push concrete laterally. Strike off surface with an aluminum straight edge to predetermined laser benchmark pins.
              </p>
</div>
</div>
</div>
</div>

<div className="bg-surface-container-lowest p-space-base rounded-lg shadow-sm">
<div className="flex items-center justify-between pb-space-sm">
<div className="flex items-center gap-space-xs">
<span className="material-symbols-outlined text-error text-space-lg">report_problem</span>
<h3 className="font-title-md text-title-md text-on-surface uppercase tracking-wider">B. Failure Prevention Ledger: Critical Red Lines</h3>
</div>
<span className="px-space-xs py-space-2xs rounded bg-error-container text-on-error-container font-label-sm text-label-sm font-bold">Zero Tolerance</span>
</div>
<div className="grid grid-cols-1 md:grid-cols-2 gap-space-sm">

<div className="p-space-sm bg-surface-container-low rounded-lg flex flex-col justify-between">
<div>
<div className="flex items-center gap-space-xs text-error font-title-md text-title-md">
<span className="material-symbols-outlined text-space-base">block</span>
<span>Honeycombing &amp; Severe Voids</span>
</div>
<p className="font-body-sm text-body-sm text-on-surface-variant mt-space-xs leading-relaxed">
<strong>Root Cause:</strong> Aggregate jamming in dense rebar junctions (beam-column intersections) or inadequate vibrator penetration.<br />
<strong>Prevention Protocol:</strong> Minimum bar spacing must exceed maximum aggregate size + 5mm. Use 25mm down aggregates for congested beams. Rap the exterior of plywood with non-marking rubber mallets during pour to release entrapped air pockets.
              </p>
</div>
<div className="mt-space-sm pt-space-xs flex items-center justify-between text-on-surface font-label-sm text-label-sm">
<span>Remedy: High-build Micro-concrete</span>
<span className="text-error font-semibold">Severity: High</span>
</div>
</div>

<div className="p-space-sm bg-surface-container-low rounded-lg flex flex-col justify-between">
<div>
<div className="flex items-center gap-space-xs text-error font-title-md text-title-md">
<span className="material-symbols-outlined text-space-base">warning</span>
<span>Premature Prop Removal &amp; Sagging</span>
</div>
<p className="font-body-sm text-body-sm text-on-surface-variant mt-space-xs leading-relaxed">
<strong>Root Cause:</strong> Early stripping of props under tension zones leading to hairline cracks and permanent mid-span deflection.<br />
<strong>Prevention Protocol:</strong> Props beneath slabs must remain continuously secured for at least 7 days (&lt;4.5m) and 14 days (&gt;4.5m). When casting upper floors, maintain staged re-props across at least two lower consecutive floor slabs.
              </p>
</div>
<div className="mt-space-sm pt-space-xs flex items-center justify-between text-on-surface font-label-sm text-label-sm">
<span>IS 456 Table 10 Lock</span>
<span className="text-error font-semibold">Severity: Catastrophic</span>
</div>
</div>

<div className="p-space-sm bg-surface-container-low rounded-lg flex flex-col justify-between">
<div>
<div className="flex items-center gap-space-xs text-on-error-container font-title-md text-title-md">
<span className="material-symbols-outlined text-space-base">timer_off</span>
<span>Cold Joints from Delayed Pour Interval</span>
</div>
<p className="font-body-sm text-body-sm text-on-surface-variant mt-space-xs leading-relaxed">
<strong>Root Cause:</strong> RMC transit mixer delays exceeding initial concrete setting time under hot Hyderabad sunshine (&gt;30°C).<br />
<strong>Prevention Protocol:</strong> Maximum allowed interval between consecutive overlapping pours is 90 minutes. In the event of plant breakdown, create an engineered 45° construction joint along the center 1/3 of the slab span with an epoxy bonding agent.
              </p>
</div>
<div className="mt-space-sm pt-space-xs flex items-center justify-between text-on-surface font-label-sm text-label-sm">
<span>Max Time Delta: 90 Min</span>
<span className="text-error font-semibold">Severity: Structural Defect</span>
</div>
</div>

<div className="p-space-sm bg-surface-container-low rounded-lg flex flex-col justify-between">
<div>
<div className="flex items-center gap-space-xs text-error font-title-md text-title-md">
<span className="material-symbols-outlined text-space-base">cancel</span>
<span>Cover Loss &amp; Rebar Rust Shadow</span>
</div>
<p className="font-body-sm text-body-sm text-on-surface-variant mt-space-xs leading-relaxed">
<strong>Root Cause:</strong> Using broken floor tiles, brickbats, or wooden wedges instead of factory test-certified mortar blocks.<br />
<strong>Prevention Protocol:</strong> Strictly prohibit porous debris. Use 50MPa tested fiber-reinforced concrete blocks with integrated wire. Reinforcement bars must not touch outer shuttering at any point under pain of immediate pour stoppage.
              </p>
</div>
<div className="mt-space-sm pt-space-xs flex items-center justify-between text-on-surface font-label-sm text-label-sm">
<span>Density: 5 Blocks / m²</span>
<span className="text-error font-semibold">Severity: Durability Breach</span>
</div>
</div>
</div>
</div>

<div className="bg-surface-container-lowest p-space-base rounded-lg shadow-sm">
<div className="flex items-center justify-between pb-space-sm">
<div className="flex items-center gap-space-xs">
<span className="material-symbols-outlined text-primary text-space-lg">fact_check</span>
<h3 className="font-title-md text-title-md text-on-surface uppercase tracking-wider">C. Mandatory QA/QC Field Checklist &amp; Hold Gates</h3>
</div>
<span className="px-space-xs py-space-2xs rounded bg-surface-container text-on-surface font-label-sm text-label-sm">5 Points Mandatory Before Pour</span>
</div>

<div className="overflow-x-auto">
<table className="w-full text-left font-body-sm text-body-sm">
<thead>
<tr className="bg-surface-container text-on-surface-variant font-label-sm text-label-sm uppercase">
<th className="p-space-xs">Check Item &amp; Code Ref</th>
<th className="p-space-xs">Engineering Acceptance Criteria</th>
<th className="p-space-xs">Test Frequency</th>
<th className="p-space-xs">Inspector Gate</th>
<th className="p-space-xs text-right">Status</th>
</tr>
</thead>
<tbody className="divide-y-0">
<tr className="bg-surface-container-lowest hover:bg-surface-container-low transition-colors">
<td className="p-space-xs font-title-md text-title-md text-on-surface">
                  1. Concrete Slump (IS 1199)
                </td>
<td className="p-space-xs text-on-surface-variant">
                  120 ± 25 mm at discharge spout. 6 test cubes per 10m³ (3 for 7-day, 3 for 28-day).
                </td>
<td className="p-space-xs text-on-surface">Every Transit Mixer</td>
<td className="p-space-xs">
<span className="px-space-xs py-space-2xs rounded bg-surface-container text-on-surface font-label-sm text-label-sm">Site QC Lab</span>
</td>
<td className="p-space-xs text-right">
<span className="px-space-xs py-space-2xs rounded bg-primary-container text-on-primary-container font-label-sm text-label-sm font-semibold">VERIFIED</span>
</td>
</tr>
<tr className="bg-surface-container-low/50 hover:bg-surface-container-low transition-colors">
<td className="p-space-xs font-title-md text-title-md text-on-surface">
                  2. Cover Density &amp; Thickness
                </td>
<td className="p-space-xs text-on-surface-variant">
                  20mm slab / 25mm beam. Minimum 4-5 blocks per square meter securely tied.
                </td>
<td className="p-space-xs text-on-surface">100% Floor Area</td>
<td className="p-space-xs">
<span className="px-space-xs py-space-2xs rounded bg-surface-container text-on-surface font-label-sm text-label-sm">Site Engineer</span>
</td>
<td className="p-space-xs text-right">
<span className="px-space-xs py-space-2xs rounded bg-primary-container text-on-primary-container font-label-sm text-label-sm font-semibold">VERIFIED</span>
</td>
</tr>
<tr className="bg-surface-container-lowest hover:bg-surface-container-low transition-colors">
<td className="p-space-xs font-title-md text-title-md text-on-surface">
                  3. Formwork Line, Level &amp; Camber
                </td>
<td className="p-space-xs text-on-surface-variant">
                  Maximum deviation ±3mm from laser bench datum; 1:500 center camber on spans &gt; 6m.
                </td>
<td className="p-space-xs text-on-surface">Every Grid Bay</td>
<td className="p-space-xs">
<span className="px-space-xs py-space-2xs rounded bg-surface-container text-on-surface font-label-sm text-label-sm">Survey Chief</span>
</td>
<td className="p-space-xs text-right">
<span className="px-space-xs py-space-2xs rounded bg-primary-container text-on-primary-container font-label-sm text-label-sm font-semibold">VERIFIED</span>
</td>
</tr>
<tr className="bg-surface-container-low/50 hover:bg-surface-container-low transition-colors">
<td className="p-space-xs font-title-md text-title-md text-on-surface">
                  4. Rebar Lap Length &amp; Stagger
                </td>
<td className="p-space-xs text-on-surface-variant">
                  50d developed tension lap. Max 50% staggered laps at any single cross-section.
                </td>
<td className="p-space-xs text-on-surface">All Structural Beams</td>
<td className="p-space-xs">
<span className="px-space-xs py-space-2xs rounded bg-surface-container text-on-surface font-label-sm text-label-sm">Structural Consultant</span>
</td>
<td className="p-space-xs text-right">
<span className="px-space-xs py-space-2xs rounded bg-primary-container text-on-primary-container font-label-sm text-label-sm font-semibold">SIGNED</span>
</td>
</tr>
<tr className="bg-surface-container-lowest hover:bg-surface-container-low transition-colors">
<td className="p-space-xs font-title-md text-title-md text-on-surface">
                  5. MEP Conduits &amp; Box Seal
                </td>
<td className="p-space-xs text-on-surface-variant">
                  Pipes anchored below top steel mesh; zero floating boxes; ≥50mm space between runs.
                </td>
<td className="p-space-xs text-on-surface">Full Conduit Network</td>
<td className="p-space-xs">
<span className="px-space-xs py-space-2xs rounded bg-surface-container text-on-surface font-label-sm text-label-sm">MEP Coordinator</span>
</td>
<td className="p-space-xs text-right">
<span className="px-space-xs py-space-2xs rounded bg-primary-container text-on-primary-container font-label-sm text-label-sm font-semibold">VERIFIED</span>
</td>
</tr>
</tbody>
</table>
</div>

<div className="mt-space-base p-space-sm bg-surface-container-low rounded-lg">
<span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider block mb-space-xs">
            Mandatory 3-Tier Pour Release Digital Gate (RERA / PMC Compliance)
          </span>
<div className="grid grid-cols-1 md:grid-cols-3 gap-space-sm">
<div className="p-space-xs bg-surface-container-lowest rounded flex items-center gap-space-xs shadow-sm">
<span className="material-symbols-outlined text-primary text-space-lg">check_circle</span>
<div className="flex flex-col">
<span className="font-title-md text-title-md text-on-surface">K. Ramesh (Site QC)</span>
<span className="font-label-sm text-label-sm text-on-surface-variant">Cleared 08:30 AM • OTP Verified</span>
</div>
</div>
<div className="p-space-xs bg-surface-container-lowest rounded flex items-center gap-space-xs shadow-sm">
<span className="material-symbols-outlined text-primary text-space-lg">check_circle</span>
<div className="flex flex-col">
<span className="font-title-md text-title-md text-on-surface">Dr. V. Prasad (PMC)</span>
<span className="font-label-sm text-label-sm text-on-surface-variant">Approved 09:15 AM • Structural Pass</span>
</div>
</div>
<div className="p-space-xs bg-surface-container-lowest rounded flex items-center gap-space-xs shadow-sm">
<span className="material-symbols-outlined text-primary text-space-lg">check_circle</span>
<div className="flex flex-col">
<span className="font-title-md text-title-md text-on-surface">Shravan Kumar (Chief)</span>
<span className="font-label-sm text-label-sm text-on-surface-variant">Gate Released • Batch Mixer Unlocked</span>
</div>
</div>
</div>
</div>
</div>

<div className="bg-surface-container-lowest p-space-base rounded-lg shadow-sm">
<div className="flex items-center justify-between pb-space-sm flex-wrap gap-space-xs">
<div className="flex items-center gap-space-xs">
<span className="material-symbols-outlined text-tertiary text-space-lg">water</span>
<h3 className="font-title-md text-title-md text-on-surface uppercase tracking-wider">D. Hyderabad Weather-Calibrated Curing &amp; Formwork Stripping Safe Timelines</h3>
</div>
<span className="px-space-xs py-space-2xs rounded bg-surface-container text-tertiary font-label-sm text-label-sm">IS 456:2000 Clause 11.3 &amp; Table 10</span>
</div>
<div className="grid grid-cols-1 md:grid-cols-2 gap-space-base mb-space-base">

<div className="flex flex-col gap-space-xs bg-surface-container-low p-space-sm rounded-lg">
<span className="font-title-md text-title-md text-on-surface flex items-center gap-space-2xs">
<span className="material-symbols-outlined text-tertiary text-space-base">water_drop</span>
              Mandatory Curing Regimen (31°C Ambient)
            </span>
<ul className="font-body-sm text-body-sm text-on-surface-variant space-y-space-xs">
<li className="flex items-start gap-space-xs">
<span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0"></span>
<span><strong>OPC 43/53 Concrete:</strong> Minimum 10 days unbroken wet ponding. Construct 1:8 mortar bunds (50mm height) over entire slab surface within 24 hours.</span>
</li>
<li className="flex items-start gap-space-xs">
<span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0"></span>
<span><strong>Fly-ash Blended (PPC):</strong> Minimum 14 days wet ponding. Due to slower pozzolanic heat development, continuous immersion is mandatory to prevent micro-fissuring.</span>
</li>
<li className="flex items-start gap-space-xs">
<span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0"></span>
<span><strong>Vertical Columns &amp; Shear Walls:</strong> Wrap in clean hessian burlap immediately upon deshuttering. Saturated with automated drip/sprinkler pipes 3 times daily.</span>
</li>
<li className="flex items-start gap-space-xs">
<span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0"></span>
<span><strong>Water Quality Standards:</strong> Potable water with pH 6.0 to 8.0. Strictly prohibited to use brackish borewell water with chlorides &gt;500 mg/L (prevents rebar pitting).</span>
</li>
</ul>
</div>

<div className="flex flex-col gap-space-xs bg-surface-container-low p-space-sm rounded-lg">
<span className="font-title-md text-title-md text-on-surface flex items-center gap-space-2xs">
<span className="material-symbols-outlined text-primary text-space-base">alarm_on</span>
              Safe Formwork Stripping (Deshuttering Minimums)
            </span>
<table className="w-full text-left font-body-sm text-body-sm">
<thead>
<tr className="text-on-surface-variant font-label-sm text-label-sm uppercase">
<th className="py-space-2xs">Structural Element Type</th>
<th className="py-space-2xs text-right">Minimum Time</th>
</tr>
</thead>
<tbody className="divide-y-0">
<tr className="border-b-0">
<td className="py-space-2xs text-on-surface">Vertical formwork: Columns, Walls &amp; Beam sides</td>
<td className="py-space-2xs text-right font-tabular-metric-sm text-tabular-metric-sm text-on-surface">16 – 24 Hours</td>
</tr>
<tr className="border-b-0">
<td className="py-space-2xs text-on-surface">Slab soffits (props left standing underneath)</td>
<td className="py-space-2xs text-right font-tabular-metric-sm text-tabular-metric-sm text-on-surface">3 Days</td>
</tr>
<tr className="border-b-0">
<td className="py-space-2xs text-on-surface">Beam soffits (props left standing underneath)</td>
<td className="py-space-2xs text-right font-tabular-metric-sm text-tabular-metric-sm text-on-surface">7 Days</td>
</tr>
<tr className="border-b-0">
<td className="py-space-2xs text-on-surface">Props removal to Slabs (spans up to 4.5m)</td>
<td className="py-space-2xs text-right font-tabular-metric-sm text-tabular-metric-sm text-primary">7 Days</td>
</tr>
<tr className="border-b-0">
<td className="py-space-2xs text-on-surface">Props removal to Slabs (spans &gt; 4.5m)</td>
<td className="py-space-2xs text-right font-tabular-metric-sm text-tabular-metric-sm text-primary">14 Days</td>
</tr>
<tr className="border-b-0">
<td className="py-space-2xs text-on-surface">Props removal to Beams &amp; Arches (spans up to 6m)</td>
<td className="py-space-2xs text-right font-tabular-metric-sm text-tabular-metric-sm text-primary">14 Days</td>
</tr>
<tr className="border-b-0">
<td className="py-space-2xs text-on-surface">Props removal to Beams &amp; Arches (spans &gt; 6m)</td>
<td className="py-space-2xs text-right font-tabular-metric-sm text-tabular-metric-sm text-error">21 Days</td>
</tr>
</tbody>
</table>
</div>
</div>

<div className="p-space-sm bg-surface-container rounded-lg flex items-center justify-between">
<div className="flex items-center gap-space-sm">
<span className="material-symbols-outlined text-tertiary text-space-lg">sunny</span>
<div>
<span className="font-title-md text-title-md text-on-surface block">Hyderabad Heat Advisory: Extreme Plastic Shrinkage Hazard</span>
<span className="font-body-sm text-body-sm text-on-surface-variant">When temperatures exceed 35°C, fog misting or paraffin-based curing compound (ASTM C309) must be applied within 60 minutes of final finishing.</span>
</div>
</div>
<span className="px-space-xs py-space-2xs rounded bg-surface-container-high text-on-surface font-label-sm text-label-sm shrink-0">ASTM C309</span>
</div>
</div>
</div>

<div className="xl:col-span-4 flex flex-col gap-space-base">

<div className="bg-surface-container-lowest rounded-lg shadow-sm overflow-hidden">
<div className="relative h-44 w-full bg-cover bg-center" data-alt="Civil engineering site photo showing concrete pour on multi-story building floor slab with steel rebar, cover blocks, PVC electrical pipes, and construction workers using mechanical vibrators under bright daytime sunlight." style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDDQIjAnNElS9xeBIR85yI8Jda8x6S7VRt3SG_AHFNzUfo38drpcqwl9TORu0ALLSB6nP0KFRtxYMypZyR8UcO3YevK_czNtDEMhwjI9iBTB2XJD2QLtopF1N5owzbecnyLrkMy2j_QCpqmxmOfODg26IS6mtlA6365DBOn0gWN8a5Jez5Gw2vYkhKiEpANS37IuATsopnHhryvcQTZCSeTbnlgAuhN1wvG0ATIMasQ6m7K2xQlAE7m')" }}>
<div className="absolute inset-0 bg-gradient-to-t from-inverse-surface/90 via-inverse-surface/40 to-transparent p-space-sm flex flex-col justify-end">
<span className="font-label-sm text-label-sm text-primary-fixed uppercase font-bold tracking-wider">Site Inspection Feed</span>
<h4 className="font-title-md text-title-md text-inverse-on-surface">G+3 Superstructure Concrete Pouring</h4>
<span className="font-body-sm text-body-sm text-outline-variant">Live Cam 03 • Madhapur {project.name}</span>
</div>
</div>
<div className="p-space-sm flex items-center justify-between bg-surface-container-low text-on-surface font-body-sm text-body-sm">
<span className="flex items-center gap-space-2xs">
<span className="w-2 h-2 rounded-full bg-primary"></span>
            Boom Pump 01 Operating
          </span>
<span className="font-tabular-metric-sm text-tabular-metric-sm text-primary">64 m³ / 120 m³ Poured</span>
</div>
</div>

<div className="bg-surface-container-lowest p-space-base rounded-lg shadow-sm">
<div className="flex items-center justify-between pb-space-xs">
<span className="font-title-md text-title-md text-on-surface flex items-center gap-space-xs">
<span className="material-symbols-outlined text-primary text-space-base">manage_search</span>
            Fast SOP &amp; Code Search
          </span>
<span className="font-label-sm text-label-sm text-on-surface-variant">AI Index</span>
</div>
<div className="relative mt-space-xs">
<span className="material-symbols-outlined absolute left-space-xs top-2 text-on-surface-variant text-space-base">search</span>
<input value={term} onChange={(e) => setTerm(e.target.value)} className="w-full pl-8 pr-space-sm py-space-xs rounded bg-surface-container-low text-on-surface placeholder:text-on-surface-variant font-body-sm text-body-sm focus:outline-none focus:ring-1 focus:ring-primary" placeholder="e.g. Slump tolerance, Column lap length, PPC curing..." type="text" />
</div>
<div className="flex flex-wrap gap-space-2xs pt-space-sm">
<button onClick={() => setTerm("hook")} className="px-space-xs py-space-2xs rounded bg-surface-container text-on-surface-variant font-label-sm text-label-sm cursor-pointer hover:bg-surface-variant">Beam 135° Hook</button>
<button onClick={() => setTerm("cold joint")} className="px-space-xs py-space-2xs rounded bg-surface-container text-on-surface-variant font-label-sm text-label-sm cursor-pointer hover:bg-surface-variant">Cold Joint Remedy</button>
<button onClick={() => setTerm("lap")} className="px-space-xs py-space-2xs rounded bg-surface-container text-on-surface-variant font-label-sm text-label-sm cursor-pointer hover:bg-surface-variant">50d Tension Lap</button>
<button onClick={() => setTerm("ponding")} className="px-space-xs py-space-2xs rounded bg-surface-container text-on-surface-variant font-label-sm text-label-sm cursor-pointer hover:bg-surface-variant">Waterproofing Bunds</button>
</div>
</div>

<div className="bg-surface-container-lowest p-space-base rounded-lg shadow-sm">
<div className="flex items-center justify-between pb-space-sm">
<div className="flex items-center gap-space-xs text-error font-title-md text-title-md">
<span className="material-symbols-outlined text-space-base">contact_phone</span>
<span>Urgent Snag Escalation Hotline</span>
</div>
<span className="w-2 h-2 rounded-full bg-error animate-pulse"></span>
</div>
<p className="font-body-sm text-body-sm text-on-surface-variant mb-space-sm">
          For non-conformance incidents (Cold joints &gt;90m, honeycombing &gt;100cm², rebar dislocation, or slump test failure &lt;80mm):
        </p>
<div className="flex flex-col gap-space-xs">
<div className="p-space-xs bg-surface-container-low rounded flex items-center justify-between">
<div>
<span className="font-title-md text-title-md text-on-surface block">Dr. A. K. Varma (Structural Lead)</span>
<span className="font-body-sm text-body-sm text-on-surface-variant">+91 98480 23114 • Priority 1</span>
</div>
<a href="tel:+919848023114" className="px-space-sm py-space-2xs rounded bg-error text-on-error font-label-sm text-label-sm font-semibold">Call</a>
</div>
<div className="p-space-xs bg-surface-container-low rounded flex items-center justify-between">
<div>
<span className="font-title-md text-title-md text-on-surface block">N. Chandra (Chief QC Auditor)</span>
<span className="font-body-sm text-body-sm text-on-surface-variant">+91 94401 55902 • Lab Head</span>
</div>
<a href="tel:+919440155902" className="px-space-sm py-space-2xs rounded bg-surface-container text-on-surface font-label-sm text-label-sm">Call</a>
</div>
</div>
</div>

<div className="bg-surface-container-lowest p-space-base rounded-lg shadow-sm">
<div className="flex items-center justify-between pb-space-xs">
<span className="font-title-md text-title-md text-on-surface flex items-center gap-space-xs">
<span className="material-symbols-outlined text-primary text-space-base">cloud_download</span>
            Field Checksheet Documents
          </span>
<span className="font-label-sm text-label-sm text-on-surface-variant">SOP Forms</span>
</div>
<div className="flex flex-col divide-y-0 gap-space-2xs mt-space-xs">
<div className="flex items-center justify-between p-space-xs bg-surface-container-low rounded">
<div className="flex items-center gap-space-xs">
<span className="material-symbols-outlined text-error text-space-base">picture_as_pdf</span>
<div className="flex flex-col">
<span className="font-body-sm text-body-sm text-on-surface font-semibold">SOP-07-PrePour-Checklist.pdf</span>
<span className="font-label-sm text-label-sm text-on-surface-variant">Form 104 • 2.4 MB</span>
</div>
</div>
<span className="material-symbols-outlined text-on-surface-variant hover:text-primary cursor-pointer text-space-base">download</span>
</div>
<div className="flex items-center justify-between p-space-xs bg-surface-container-low rounded">
<div className="flex items-center gap-space-xs">
<span className="material-symbols-outlined text-tertiary text-space-base">description</span>
<div className="flex flex-col">
<span className="font-body-sm text-body-sm text-on-surface font-semibold">BBS-Tolerance-Audit-Sheet.xlsx</span>
<span className="font-label-sm text-label-sm text-on-surface-variant">SP-34 Code • 840 KB</span>
</div>
</div>
<span className="material-symbols-outlined text-on-surface-variant hover:text-primary cursor-pointer text-space-base">download</span>
</div>
<div className="flex items-center justify-between p-space-xs bg-surface-container-low rounded">
<div className="flex items-center gap-space-xs">
<span className="material-symbols-outlined text-primary text-space-base">fact_check</span>
<div className="flex flex-col">
<span className="font-body-sm text-body-sm text-on-surface font-semibold">Curing-Log-14Day-Ponding.pdf</span>
<span className="font-label-sm text-label-sm text-on-surface-variant">QC Field Track • 1.1 MB</span>
</div>
</div>
<span className="material-symbols-outlined text-on-surface-variant hover:text-primary cursor-pointer text-space-base">download</span>
</div>
</div>
</div>

<div className="bg-surface-container-lowest p-space-base rounded-lg shadow-sm">
<div className="flex items-center justify-between pb-space-xs">
<span className="font-title-md text-title-md text-on-surface flex items-center gap-space-xs">
<span className="material-symbols-outlined text-primary text-space-base">science</span>
            Concrete Strength Benchmarks
          </span>
<span className="font-label-sm text-label-sm text-primary font-bold">M25 Grade</span>
</div>
<div className="mt-space-sm flex flex-col gap-space-sm">
<div>
<div className="flex justify-between font-label-sm text-label-sm text-on-surface-variant mb-space-2xs">
<span>7-Day Target Compressive (65%): 16.5 MPa</span>
<span className="text-primary font-bold">Achieved: 18.2 MPa (±9%)</span>
</div>
<div className="w-full h-2 bg-surface-container rounded-full overflow-hidden">
<div className="bg-primary h-full rounded-full" style={{ width: "73%" }}></div>
</div>
</div>
<div>
<div className="flex justify-between font-label-sm text-label-sm text-on-surface-variant mb-space-2xs">
<span>28-Day Target Compressive (100%): 25.0 MPa</span>
<span className="text-tertiary font-bold">Estimated: 29.4 MPa</span>
</div>
<div className="w-full h-2 bg-surface-container rounded-full overflow-hidden">
<div className="bg-tertiary h-full rounded-full" style={{ width: "88%" }}></div>
</div>
</div>
</div>
<div className="mt-space-md p-space-xs bg-surface-container-low rounded text-center">
<span className="font-label-sm text-label-sm text-on-surface-variant">Last Cube Batch Tested: <strong>Batch #RMC-9941</strong> (Passed IS 516)</span>
</div>
</div>
</div>
</div>
</div></main>
      </div>
    </Shell>
  );
}
