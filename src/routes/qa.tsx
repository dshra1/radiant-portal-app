import { createFileRoute } from "@tanstack/react-router";
import { ScanEye, AlertTriangle } from "lucide-react";
import { Shell } from "@/components/saha/Shell";
import { ActionButton, MetricTile, Section, StatusBadge } from "@/components/saha/ui";
import { inspections, projects } from "@/data/saha";

export const Route = createFileRoute("/qa")({
  head: () => ({
    meta: [
      { title: "AI Visual QA & Defect Log — Saha OS Next" },
      {
        name: "description",
        content:
          "AI visual QA/QC inspections: site photo analysis against CAD overlays, IS code compliance findings, defect severity and rectification status.",
      },
      { property: "og:title", content: "AI Visual QA & Defect Log — Saha OS Next" },
      {
        property: "og:description",
        content: "Photo-based defect detection with IS code compliance findings and rectification tracking.",
      },
    ],
  }),
  component: Qa,
});

const sevTone = { High: "red", Medium: "amber", Low: "sky", Passed: "emerald" } as const;
const resTone = { Open: "red", Rectified: "amber", Approved: "emerald" } as const;

function Qa() {
  const open = inspections.filter((i) => i.resolution === "Open");
  const defects = inspections.reduce((s, i) => s + i.defectCount, 0);

  return (
    <Shell
      title="AI Visual QA"
      subtitle="Site photos analysed against CAD overlays and IS code compliance rules"
      actions={<ActionButton>Upload site photo</ActionButton>}
    >
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricTile label="Inspections logged" value={String(inspections.length)} icon={<ScanEye className="size-3.5" />} />
        <MetricTile label="Total defects" value={String(defects)} tone="bad" delta="Across 3 sites" />
        <MetricTile label="Open items" value={String(open.length)} tone="warn" delta="Awaiting rectification" icon={<AlertTriangle className="size-3.5" />} />
        <MetricTile label="Pass rate" value={`${Math.round(((inspections.length - open.length) / inspections.length) * 100)}%`} tone="good" />
      </div>

      <Section title="Inspection log" className="mt-3">
        <ul className="divide-y divide-border">
          {inspections.map((i) => (
            <li key={i.id} className="grid gap-3 p-3 lg:grid-cols-[1fr_auto]">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-[13px] font-semibold">{i.locationTag}</p>
                  <StatusBadge tone={sevTone[i.severity]}>{i.severity}</StatusBadge>
                  <StatusBadge tone="slate">{i.category}</StatusBadge>
                  <StatusBadge tone="sky">{i.code}</StatusBadge>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {projects.find((p) => p.id === i.projectId)?.name} · captured {i.captured}
                </p>
                <ul className="mt-2 space-y-1">
                  {i.findings.map((f) => (
                    <li key={f} className="flex gap-2 text-[13px] text-foreground">
                      <span className="mt-1.5 size-1 shrink-0 rounded-full bg-muted-foreground" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex items-start gap-2 lg:flex-col lg:items-end">
                <StatusBadge tone={resTone[i.resolution]}>{i.resolution}</StatusBadge>
                <span className="text-[13px] font-semibold tnum">{i.defectCount} defects</span>
              </div>
            </li>
          ))}
        </ul>
      </Section>
    </Shell>
  );
}
