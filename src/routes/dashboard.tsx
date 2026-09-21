import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { IndianRupee, HardHat, Boxes, AlertTriangle, ArrowUpRight } from "lucide-react";
import { Shell } from "@/components/saha/Shell";
import {
  ActionButton,
  MetricTile,
  PhaseBar,
  Section,
  StatusBadge,
  TrendPill,
} from "@/components/saha/ui";
import { inrCompact, materialRates } from "@/data/saha";
import { QuickAccess } from "@/components/saha/QuickAccess";
import { useSessionUser } from "@/lib/access";


export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Saha OS Next — Construction Command Center" },
      {
        name: "description",
        content:
          "Live command center for civil construction: budget burn, BOQ rates, procurement guardrails, pour cards and AI visual QA across Hyderabad sites.",
      },
      { property: "og:title", content: "Saha OS Next — Construction Command Center" },
      {
        property: "og:description",
        content:
          "Track budget burn, market rate intelligence, PO approvals, pour readiness and QA defects across every site.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const user = useSessionUser();
  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["site_projects", "full"],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_projects")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: alerts = [] } = useQuery({
    queryKey: ["notifications", "dashboard"],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(6);
      if (error) throw error;
      return data ?? [];
    },
  });

  const n = (v: unknown) => Number(v ?? 0) || 0;
  const totalBudget = rows.reduce((s, p) => s + n(p.target_budget), 0);
  const totalSpend = rows.reduce((s, p) => s + n(p.spend), 0);
  const workforce = rows.reduce((s, p) => s + n(p.total_staff), 0);
  const attention = rows.filter((p) => p.health !== "On Track").length;
  const burn = totalBudget ? Math.round((totalSpend / totalBudget) * 100) : 0;
  const openAlerts = alerts.filter((a) => !a.is_read);

  return (
    <Shell
      title="Command Center"
      subtitle={
        isLoading
          ? "Loading live project data…"
          : `${rows.length} active site${rows.length === 1 ? "" : "s"} · live from your workspace`
      }
      actions={
        <>
          <ActionButton variant="secondary">Export snapshot</ActionButton>
          <ActionButton>
            New pour card <ArrowUpRight className="size-3.5" />
          </ActionButton>
        </>
      }
    >
      {!isLoading && rows.length === 0 && (
        <div className="panel mb-3 p-4">
          <h2 className="text-sm font-semibold">No projects yet</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Command Center metrics, portfolio and suggestions are generated from your live projects.
            Add your first site to populate this screen.
          </p>
          <Link
            to="/projects"
            className="mt-3 inline-flex h-8 items-center rounded bg-primary px-3 text-[13px] font-medium text-primary-foreground"
          >
            Add a project
          </Link>
        </div>
      )}

      <QuickAccess />

      <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricTile

          label="Committed budget"
          value={inrCompact(totalBudget)}
          delta={`${rows.length} project${rows.length === 1 ? "" : "s"}`}
          tone="neutral"
          icon={<IndianRupee className="size-3.5" />}
        />
        <MetricTile
          label="Spend to date"
          value={inrCompact(totalSpend)}
          delta={`${burn}% burn`}
          tone={burn > 60 ? "bad" : "good"}
          icon={<Boxes className="size-3.5" />}
        />
        <MetricTile
          label="Workforce on site"
          value={String(workforce)}
          unit="staff"
          delta={workforce ? "from project staffing" : "no staffing entered"}
          tone="neutral"
          icon={<HardHat className="size-3.5" />}
        />
        <MetricTile
          label="Sites needing attention"
          value={String(attention)}
          delta={`${openAlerts.length} unread alert${openAlerts.length === 1 ? "" : "s"}`}
          tone={attention ? "bad" : "good"}
          icon={<AlertTriangle className="size-3.5" />}
        />
      </div>

      <div className="mt-3 grid gap-3 xl:grid-cols-3">
        <Section
          title="Site portfolio"
          className="xl:col-span-2"
          action={
            <Link to="/projects" className="text-xs font-medium text-primary hover:underline">
              View all
            </Link>
          }
        >
          {rows.length === 0 ? (
            <p className="p-3 text-sm text-muted-foreground">No sites to show yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {rows.map((p) => {
                const phases = Array.isArray(p.phases)
                  ? (p.phases as { name: string; state: "done" | "active" | "pending" }[])
                  : [];
                const consumed = n(p.target_budget)
                  ? Math.round((n(p.spend) / n(p.target_budget)) * 100)
                  : 0;
                return (
                  <li key={p.id} className="grid gap-2 p-3 sm:grid-cols-[1fr_auto] sm:items-center">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-[13px] font-semibold">{p.name}</p>
                        <StatusBadge
                          tone={
                            p.health === "On Track"
                              ? "emerald"
                              : p.health === "At Risk"
                                ? "amber"
                                : "red"
                          }
                        >
                          {p.health}
                        </StatusBadge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {p.location || "—"} · {p.type || "—"}
                      </p>
                      {phases.length > 0 && (
                        <div className="mt-2 max-w-sm">
                          <PhaseBar phases={phases} />
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-[13px] font-semibold tnum">
                        {inrCompact(n(p.spend))}{" "}
                        <span className="font-normal text-muted-foreground">
                          / {inrCompact(n(p.target_budget))}
                        </span>
                      </p>
                      <p className="label-caps text-muted-foreground">{consumed}% consumed</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Section>

        <Section
          title="Action queue"
          action={<StatusBadge tone="amber">{openAlerts.length} open</StatusBadge>}
        >
          {alerts.length === 0 ? (
            <p className="p-3 text-sm text-muted-foreground">No alerts yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {alerts.map((a) => (
                <li key={a.id} className="p-3">
                  <p className="text-[13px] font-semibold">{a.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{a.body}</p>
                  <div className="mt-2">
                    <StatusBadge tone={a.is_read ? "slate" : "amber"}>
                      {a.category}
                    </StatusBadge>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>

      <div className="mt-3 grid gap-3 xl:grid-cols-3">
        <Section
          title="Hyderabad rate intelligence (market reference)"
          className="xl:col-span-3"
          action={
            <Link to="/boq" className="text-xs font-medium text-primary hover:underline">
              Open BOQ
            </Link>
          }
        >
          <ul className="divide-y divide-border">
            {materialRates.slice(0, 6).map((m) => (
              <li key={m.id} className="flex items-center justify-between gap-2 px-3 py-2">
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-medium">{m.brand}</p>
                  <p className="label-caps text-muted-foreground">{m.category}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-semibold tnum">
                    {inrCompact(m.unitPrice)}
                    <span className="text-[10px] font-normal text-muted-foreground">/{m.unit}</span>
                  </span>
                  <TrendPill
                    tone={m.trend === "UP" ? "bad" : m.trend === "DOWN" ? "good" : "neutral"}
                    label={`${m.changePct > 0 ? "+" : ""}${m.changePct}%`}
                  />
                </div>
              </li>
            ))}
          </ul>
        </Section>
      </div>
    </Shell>
  );
}
