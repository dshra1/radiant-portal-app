import { createFileRoute } from "@tanstack/react-router";
import { MapPin, Layers, Ruler } from "lucide-react";
import { Shell } from "@/components/saha/Shell";
import { ActionButton, PhaseBar, StatusBadge } from "@/components/saha/ui";
import { inrCompact, num, projects } from "@/data/saha";

export const Route = createFileRoute("/projects")({
  head: () => ({
    meta: [
      { title: "Projects — Saha OS Next" },
      {
        name: "description",
        content:
          "Project setup and portfolio view: built-up area, slab take-offs, floor configuration, budget consumption and phase progress for every construction site.",
      },
      { property: "og:title", content: "Projects — Saha OS Next" },
      {
        property: "og:description",
        content: "Floor configuration, slab take-offs and budget burn for each construction site.",
      },
    ],
  }),
  component: Projects,
});

function Projects() {
  return (
    <Shell
      title="Projects"
      subtitle="Project setup, floor configuration and built-up take-offs"
      actions={<ActionButton>New project</ActionButton>}
    >
      <div className="grid gap-3 lg:grid-cols-2 2xl:grid-cols-3">
        {projects.map((p) => {
          const burn = Math.round((p.spend / p.targetBudget) * 100);
          return (
            <article key={p.id} className="panel p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="text-base font-semibold tracking-tight">{p.name}</h2>
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="size-3" /> {p.location}
                  </p>
                </div>
                <StatusBadge
                  tone={p.health === "On Track" ? "emerald" : p.health === "At Risk" ? "amber" : "red"}
                >
                  {p.health}
                </StatusBadge>
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                <StatusBadge tone="slate">{p.type}</StatusBadge>
                <StatusBadge tone="sky">
                  {p.cellarFloors}C + {p.stiltFloors}S + {p.typicalFloors}T
                </StatusBadge>
              </div>

              <dl className="mt-3 grid grid-cols-2 gap-px overflow-hidden rounded border border-border bg-border">
                <Cell
                  icon={<Ruler className="size-3" />}
                  label="Built-up"
                  value={`${num(p.totalBuiltUpSft)} sft`}
                />
                <Cell
                  icon={<Layers className="size-3" />}
                  label="Total slab"
                  value={`${num(p.totalSlabSft)} sft`}
                />
                <Cell label="Single floor slab" value={`${num(p.singleFloorSlabSft)} sft`} />
                <Cell label="Target budget" value={inrCompact(p.targetBudget)} />
              </dl>

              <div className="mt-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="label-caps text-muted-foreground">Budget consumed</span>
                  <span className="font-semibold tnum">{burn}%</span>
                </div>
                <div className="mt-1.5 h-1 w-full rounded-sm bg-border">
                  <div
                    className={burn > 80 ? "h-1 rounded-sm bg-destructive" : "h-1 rounded-sm bg-primary"}
                    style={{ width: `${burn}%` }}
                  />
                </div>
              </div>

              <div className="mt-3">
                <p className="label-caps mb-1.5 text-muted-foreground">Phase progress</p>
                <PhaseBar phases={p.phases} />
                <div className="mt-1.5 flex justify-between text-[10px] text-muted-foreground">
                  {p.phases.map((ph) => (
                    <span key={ph.name}>{ph.name}</span>
                  ))}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </Shell>
  );
}

function Cell({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="bg-card p-2.5">
      <dt className="label-caps flex items-center gap-1 text-muted-foreground">
        {icon}
        {label}
      </dt>
      <dd className="mt-1 text-sm font-semibold tnum">{value}</dd>
    </div>
  );
}
