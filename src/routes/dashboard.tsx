import { createFileRoute, Link } from "@tanstack/react-router";
import {
  IndianRupee,
  HardHat,
  Boxes,
  AlertTriangle,
  ArrowUpRight,
  Check,
  X,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Shell } from "@/components/saha/Shell";
import {
  ActionButton,
  MetricTile,
  PhaseBar,
  Section,
  StatusBadge,
  TrendPill,
} from "@/components/saha/ui";
import {
  inrCompact,
  inspections,
  materialRates,
  pourCards,
  projects,
  purchaseOrders,
  spendTrend,
} from "@/data/saha";

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
  const totalBudget = projects.reduce((s, p) => s + p.targetBudget, 0);
  const totalSpend = projects.reduce((s, p) => s + p.spend, 0);
  const pendingPOs = purchaseOrders.filter((p) => p.status === "Pending Approval");
  const openDefects = inspections
    .filter((i) => i.resolution === "Open")
    .reduce((s, i) => s + i.defectCount, 0);
  const prePour = pourCards.filter((p) => p.status === "Pre-Pour Pending");

  return (
    <Shell
      title="Command Center"
      subtitle="3 active sites · Hyderabad / Telangana · synced 2 minutes ago"
      actions={
        <>
          <ActionButton variant="secondary">Export snapshot</ActionButton>
          <ActionButton>
            New pour card <ArrowUpRight className="size-3.5" />
          </ActionButton>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricTile
          label="Committed budget"
          value={inrCompact(totalBudget)}
          delta="3 projects"
          tone="neutral"
          icon={<IndianRupee className="size-3.5" />}
        />
        <MetricTile
          label="Spend to date"
          value={inrCompact(totalSpend)}
          delta={`${Math.round((totalSpend / totalBudget) * 100)}% burn`}
          tone={totalSpend / totalBudget > 0.6 ? "bad" : "good"}
          icon={<Boxes className="size-3.5" />}
        />
        <MetricTile
          label="Active workforce"
          value="412"
          unit="on site"
          delta="+18 vs yesterday"
          tone="good"
          icon={<HardHat className="size-3.5" />}
        />
        <MetricTile
          label="Open safety / QA defects"
          value={String(openDefects)}
          delta={`${prePour.length} pours awaiting sign-off`}
          tone="bad"
          icon={<AlertTriangle className="size-3.5" />}
        />
      </div>

      <div className="mt-3 grid gap-3 xl:grid-cols-3">
        <Section
          title="Planned vs actual spend (₹ lakh)"
          className="xl:col-span-2"
          action={<TrendPill tone="bad" label="+5.6% variance" />}
        >
          <div className="h-64 p-3">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={spendTrend}>
                <defs>
                  <linearGradient id="gPlanned" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-chart-2)" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="var(--color-chart-2)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gActual" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--color-border)" vertical={false} />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  width={32}
                  tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid var(--color-border)",
                    fontSize: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="planned"
                  stroke="var(--color-chart-2)"
                  fill="url(#gPlanned)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="actual"
                  stroke="var(--color-chart-1)"
                  fill="url(#gActual)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Section>

        <Section
          title="Approval queue"
          action={<StatusBadge tone="amber">{pendingPOs.length} pending</StatusBadge>}
        >
          <ul className="divide-y divide-border">
            {pendingPOs.concat(purchaseOrders.filter((p) => p.status === "Draft")).map((po) => (
              <li key={po.id} className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-semibold text-foreground tnum">
                      {po.poNumber}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">{po.material}</p>
                  </div>
                  <span className="text-[13px] font-semibold tnum">{inrCompact(po.totalValue)}</span>
                </div>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <StatusBadge tone={po.guardrail === "Within Budget" ? "emerald" : "red"}>
                    {po.guardrail}
                  </StatusBadge>
                  <div className="flex gap-1.5">
                    <button className="grid size-6 place-items-center rounded border border-input text-muted-foreground hover:bg-secondary">
                      <X className="size-3" />
                    </button>
                    <button className="grid size-6 place-items-center rounded bg-primary text-primary-foreground hover:bg-primary-hover">
                      <Check className="size-3" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </Section>
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
          <ul className="divide-y divide-border">
            {projects.map((p) => (
              <li key={p.id} className="grid gap-2 p-3 sm:grid-cols-[1fr_auto] sm:items-center">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-[13px] font-semibold">{p.name}</p>
                    <StatusBadge
                      tone={
                        p.health === "On Track" ? "emerald" : p.health === "At Risk" ? "amber" : "red"
                      }
                    >
                      {p.health}
                    </StatusBadge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {p.location} · {p.type}
                  </p>
                  <div className="mt-2 max-w-sm">
                    <PhaseBar phases={p.phases} />
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[13px] font-semibold tnum">
                    {inrCompact(p.spend)}{" "}
                    <span className="font-normal text-muted-foreground">
                      / {inrCompact(p.targetBudget)}
                    </span>
                  </p>
                  <p className="label-caps text-muted-foreground">
                    {Math.round((p.spend / p.targetBudget) * 100)}% consumed
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </Section>

        <Section
          title="Hyderabad rate intelligence"
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
