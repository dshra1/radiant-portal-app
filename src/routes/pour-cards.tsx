import { createFileRoute } from "@tanstack/react-router";
import { Check, X } from "lucide-react";
import { Shell } from "@/components/saha/Shell";
import { ActionButton, StatusBadge } from "@/components/saha/ui";
import { num, pourCards, projects } from "@/data/saha";

export const Route = createFileRoute("/pour-cards")({
  head: () => ({
    meta: [
      { title: "Daily Pour Cards — Saha OS Next" },
      {
        name: "description",
        content:
          "Pre-pour checklists and concrete pour cards: rebar, shuttering and cover block verification with designed vs actual volume tracking.",
      },
      { property: "og:title", content: "Daily Pour Cards — Saha OS Next" },
      {
        property: "og:description",
        content: "Pre-pour checklists with designed vs actual concrete volume tracking per grid.",
      },
    ],
  }),
  component: PourCards,
});

const tone = {
  "Pre-Pour Pending": "amber",
  "Approved to Pour": "sky",
  "Poured & Curing": "amber",
  Completed: "emerald",
} as const;

function PourCards() {
  return (
    <Shell
      title="Daily Pour Cards"
      subtitle="Pre-pour verification gates and concrete volume reconciliation"
      actions={<ActionButton>New pour card</ActionButton>}
    >
      <div className="grid gap-3 lg:grid-cols-2 2xl:grid-cols-3">
        {pourCards.map((c) => {
          const checks = [
            ["Rebar & BBS", c.rebar],
            ["Shuttering", c.shuttering],
            ["Cover blocks", c.coverBlocks],
          ] as const;
          const ready = checks.every(([, v]) => v);
          return (
            <article key={c.id} className="panel p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="text-sm font-semibold tracking-tight">{c.locationTag}</h2>
                  <p className="text-xs text-muted-foreground">
                    {projects.find((p) => p.id === c.projectId)?.name} · {c.stage}
                  </p>
                </div>
                <StatusBadge tone={tone[c.status]}>{c.status}</StatusBadge>
              </div>

              <dl className="mt-3 grid grid-cols-3 gap-px overflow-hidden rounded border border-border bg-border">
                <div className="bg-card p-2.5">
                  <dt className="label-caps text-muted-foreground">Grade</dt>
                  <dd className="mt-1 text-sm font-semibold">{c.grade}</dd>
                </div>
                <div className="bg-card p-2.5">
                  <dt className="label-caps text-muted-foreground">Designed</dt>
                  <dd className="mt-1 text-sm font-semibold tnum">{num(c.designedVolume, 1)} cum</dd>
                </div>
                <div className="bg-card p-2.5">
                  <dt className="label-caps text-muted-foreground">Actual</dt>
                  <dd className="mt-1 text-sm font-semibold tnum">
                    {c.actualVolume === null ? "—" : `${num(c.actualVolume, 1)} cum`}
                  </dd>
                </div>
              </dl>

              <ul className="mt-3 space-y-1.5">
                {checks.map(([label, ok]) => (
                  <li key={label} className="flex items-center gap-2 text-[13px]">
                    <span
                      className={
                        ok
                          ? "grid size-4 place-items-center rounded-sm bg-primary text-primary-foreground"
                          : "grid size-4 place-items-center rounded-sm bg-destructive text-destructive-foreground"
                      }
                    >
                      {ok ? <Check className="size-3" /> : <X className="size-3" />}
                    </span>
                    <span className={ok ? "text-foreground" : "font-medium text-destructive"}>
                      {label}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                <p className="text-xs text-muted-foreground">
                  QA: {c.engineer} · {c.pourDate}
                </p>
                <ActionButton variant={ready ? "primary" : "secondary"}>
                  {ready ? "Approve to pour" : "Resolve gates"}
                </ActionButton>
              </div>
            </article>
          );
        })}
      </div>
    </Shell>
  );
}
