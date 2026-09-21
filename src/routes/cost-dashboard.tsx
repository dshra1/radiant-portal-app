import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { IndianRupee, PieChart, ShieldCheck, HardHat, Ruler, Landmark, Wallet } from "lucide-react";
import { Shell } from "@/components/saha/Shell";
import { supabase } from "@/integrations/supabase/client";
import { LABOUR_SECTION } from "@/lib/boq.functions";
import { useChangeRequests, num } from "@/lib/approvals";
import { useSessionUser } from "@/lib/access";


export const Route = createFileRoute("/cost-dashboard")({
  head: () => ({
    meta: [
      { title: "Cost Dashboard — BOQ, PMC Fee, Labour & Remaining Budget | Saha OS" },
      {
        name: "description",
        content:
          "Live project cost picture: material BOQ, labour contracts, PMC fee, committed purchase orders and the budget you still have left.",
      },
      { property: "og:title", content: "Cost Dashboard — BOQ, PMC Fee, Labour & Remaining Budget" },
      {
        property: "og:description",
        content: "One page showing total project cost against target budget, updating as cheaper options are approved.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function inr(v: number) {
  return `₹${Math.round(v).toLocaleString("en-IN")}`;
}
function crore(v: number) {
  return `₹${(v / 10000000).toFixed(2)} Cr`;
}

type SavedScope = { feePct?: number; includedTrades?: string[]; mode?: string };

function Page() {
  const [projectId, setProjectId] = useState("");
  const user = useSessionUser();

  const projectsQuery = useQuery({
    queryKey: ["site_projects", "cost-dashboard"],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase

        .from("site_projects")
        .select("id,name,location,target_budget,total_built_up_sft,spend,pmc_scope")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
  const projects = projectsQuery.data ?? [];
  const activeId = projectId || projects[0]?.id || "";
  const project = projects.find((p) => p.id === activeId);

  const boqQuery = useQuery({
    queryKey: ["boq_items", "cost-dashboard", activeId],
    enabled: Boolean(activeId),
    refetchOnWindowFocus: true,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("boq_items")
        .select("id,stage,quantity,rate")
        .eq("project_id", activeId);
      if (error) throw error;
      return data ?? [];
    },
  });

  const poQuery = useQuery({
    queryKey: ["purchase_orders", "cost-dashboard", activeId],
    enabled: Boolean(activeId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("purchase_orders")
        .select("id,status,freight_charges,other_charges,purchase_order_items(quantity,rate,discount_pct,gst_pct)")
        .eq("project_id", activeId);
      if (error) throw error;
      return data ?? [];
    },
  });

  const chargesQuery = useQuery({
    queryKey: ["project_charges", "cost-dashboard", activeId],
    enabled: Boolean(activeId),
    refetchOnWindowFocus: true,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_charges")
        .select("id,category,amount")
        .eq("project_id", activeId);
      if (error) throw error;
      return data ?? [];
    },
  });
  const statutory = (chargesQuery.data ?? []).reduce((s, c) => s + num(c.amount), 0);

  const capitalQuery = useQuery({
    queryKey: ["capital_entries", "cost-dashboard", activeId],
    enabled: Boolean(activeId && user?.id),
    refetchOnWindowFocus: true,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("capital_entries")
        .select("amount,entry_type,status")
        .eq("project_id", activeId);
      if (error) throw error;
      return data ?? [];
    },
  });
  const ownerFunds = (capitalQuery.data ?? [])
    .filter((e) => e.entry_type === "receipt")
    .reduce((s, e) => s + num(e.amount), 0);
  const openCalls = (capitalQuery.data ?? [])
    .filter((e) => e.entry_type !== "receipt" && e.status !== "received")
    .reduce((s, e) => s + num(e.amount), 0);



  const pending = useChangeRequests(activeId, "pending");

  const rows = boqQuery.data ?? [];
  const material = useMemo(
    () =>
      rows
        .filter((r) => r.stage !== LABOUR_SECTION)
        .reduce((s, r) => s + num(r.quantity) * num(r.rate), 0),
    [rows],
  );
  const labour = useMemo(
    () =>
      rows
        .filter((r) => r.stage === LABOUR_SECTION)
        .reduce((s, r) => s + num(r.quantity) * num(r.rate), 0),
    [rows],
  );

  const scope = (project?.pmc_scope ?? {}) as SavedScope;
  const feePct = num(scope.feePct) || 3;
  const included = Array.isArray(scope.includedTrades) ? scope.includedTrades.map(String) : null;
  const inScope = useMemo(() => {
    if (!included) return material;
    return rows
      .filter((r) => r.stage !== LABOUR_SECTION && included.includes(String(r.stage)))
      .reduce((s, r) => s + num(r.quantity) * num(r.rate), 0);
  }, [rows, included, material]);
  const pmcFee = (inScope * feePct) / 100;

  const committed = useMemo(() => {
    const orders = (poQuery.data ?? []) as Array<{
      status: string;
      freight_charges: number | null;
      other_charges: number | null;
      purchase_order_items:
        | Array<{ quantity: number | null; rate: number | null; discount_pct: number | null; gst_pct: number | null }>
        | null;
    }>;
    return orders
      .filter((o) => String(o.status).toLowerCase() === "approved")
      .reduce((sum, o) => {
        const lines = (o.purchase_order_items ?? []).reduce((s, li) => {
          const base = num(li.quantity) * num(li.rate);
          const afterDisc = base * (1 - num(li.discount_pct) / 100);
          return s + afterDisc * (1 + num(li.gst_pct) / 100);
        }, 0);
        return sum + lines + num(o.freight_charges) + num(o.other_charges);
      }, 0);
  }, [poQuery.data]);

  const pendingSaving = (pending.data ?? []).reduce((s, r) => s + num(r.saving), 0);

  const budget = num(project?.target_budget);
  const sft = num(project?.total_built_up_sft);
  const projectCost = material + labour + pmcFee + statutory;
  const remaining = budget - projectCost;
  const remainingAfterPending = budget - (projectCost - pendingSaving);

  const cards: Array<{ label: string; value: string; sub: string; icon: typeof IndianRupee; tone: string }> = [
    {
      label: "Material BOQ",
      value: crore(material),
      sub: sft > 0 ? `${(material / sft).toFixed(0)} /sft` : "—",
      icon: PieChart,
      tone: "border-sky-500/40 bg-sky-500/5",
    },
    {
      label: "Labour contracts",
      value: crore(labour),
      sub: sft > 0 ? `${(labour / sft).toFixed(0)} /sft` : "—",
      icon: HardHat,
      tone: "border-amber-500/40 bg-amber-500/5",
    },
    {
      label: `PMC fee @ ${feePct}%`,
      value: crore(pmcFee),
      sub: `on ${crore(inScope)} in scope`,
      icon: Ruler,
      tone: "border-violet-500/40 bg-violet-500/5",
    },
    {
      label: "Common & statutory charges",
      value: crore(statutory),
      sub: "Permissions, LRS, HMWSSB, electricity, architect",
      icon: Landmark,
      tone: "border-rose-500/40 bg-rose-500/5",
    },
    {
      label: "Total project cost",
      value: crore(projectCost),
      sub: sft > 0 ? `${(projectCost / sft).toFixed(0)} /sft` : "—",
      icon: IndianRupee,
      tone: "border-primary/40 bg-primary/5",
    },
    {
      label: "Owner funds received",
      value: crore(ownerFunds),
      sub: openCalls > 0 ? `Open capital calls ${crore(openCalls)}` : "No open capital calls",
      icon: Wallet,
      tone: "border-emerald-600/40 bg-emerald-600/5",
    },
  ];


  return (
    <Shell title="Cost Dashboard">
      <div className="space-y-6">
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/80">
            Money control
          </p>
          <h1 className="flex items-center gap-3 text-2xl font-extrabold uppercase tracking-tight text-foreground sm:text-3xl">
            <IndianRupee className="h-7 w-7 text-primary" />
            Project Cost &amp; Remaining Budget
          </h1>
          <p className="max-w-3xl text-sm text-muted-foreground">
            Live from your BOQ, labour contracts and PMC commercials. Numbers move the moment an
            approved cheaper option is committed.
          </p>
        </header>

        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Project
          </span>
          <select
            value={activeId}
            onChange={(e) => setProjectId(e.target.value)}
            className="min-w-[220px] rounded-xl border border-border bg-background px-3 py-2 text-sm"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} {p.location ? `· ${p.location}` : ""}
              </option>
            ))}
          </select>
          <div className="ml-auto flex flex-wrap gap-2">
            <Link
              to="/approvals"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
            >
              <ShieldCheck className="h-4 w-4" />
              Approvals ({(pending.data ?? []).length})
            </Link>
            <Link
              to="/budget-fit"
              className="inline-flex items-center gap-2 rounded-xl border border-primary/40 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary"
            >
              Find cheaper options
            </Link>
            <Link
              to="/boq-engine"
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground"
            >
              BOQ Engine
            </Link>
          </div>
        </div>

        {projects.length === 0 ? (
          <p className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
            Add a project first — this page then fills in from its BOQ, labour and PMC numbers.
          </p>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map((c) => (
            <div key={c.label} className={`rounded-2xl border p-4 ${c.tone}`}>
              <div className="flex items-center gap-2">
                <c.icon className="h-4 w-4 text-primary" />
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {c.label}
                </p>
              </div>
              <p className="mt-1 text-xl font-bold text-foreground">{c.value}</p>
              <p className="text-xs text-muted-foreground">{c.sub}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <div
            className={`rounded-2xl border p-5 ${
              remaining < 0
                ? "border-destructive/40 bg-destructive/5"
                : "border-emerald-600/30 bg-emerald-600/5"
            }`}
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {remaining < 0 ? "Over target budget by" : "Budget remaining"}
            </p>
            <p className="mt-1 text-2xl font-extrabold text-foreground">
              {budget > 0 ? inr(Math.abs(remaining)) : "Target budget not set"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Target {budget > 0 ? crore(budget) : "—"} · cost {crore(projectCost)}
            </p>
            {budget > 0 ? (
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full ${remaining < 0 ? "bg-destructive" : "bg-primary"}`}
                  style={{ width: `${Math.min(100, (projectCost / budget) * 100).toFixed(1)}%` }}
                />
              </div>
            ) : null}
          </div>

          <div className="rounded-2xl border border-sky-500/40 bg-sky-500/5 p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-sky-700">
              If pending approvals are cleared
            </p>
            <p className="mt-1 text-2xl font-extrabold text-foreground">
              {budget > 0 ? inr(Math.abs(remainingAfterPending)) : crore(projectCost - pendingSaving)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {(pending.data ?? []).length} change{(pending.data ?? []).length === 1 ? "" : "s"}{" "}
              waiting · {pendingSaving >= 0 ? "saves" : "adds"} {inr(Math.abs(pendingSaving))}
            </p>
            <Link to="/approvals" className="mt-3 inline-block text-xs font-semibold text-primary underline">
              Review and decide
            </Link>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Committed on approved purchase orders
            </p>
            <p className="mt-1 text-2xl font-extrabold text-foreground">{crore(committed)}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Recorded spend {crore(num(project?.spend))}
            </p>
            <Link
              to="/purchase-orders"
              search={{ po: undefined }}
              className="mt-3 inline-block text-xs font-semibold text-primary underline"
            >
              Open purchase orders
            </Link>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="border-b border-border bg-muted/40 px-4 py-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-primary">
              Where the money sits
            </h2>
          </div>
          <table className="w-full text-sm">
            <tbody className="divide-y divide-border">
              {[
                ["Material BOQ", material],
                ["Labour contracts", labour],
                 [`PMC fee @ ${feePct}%`, pmcFee],
                 ["Permissions, LRS, HMWSSB, electricity & architect fees", statutory],
                 ["Total project cost", projectCost],
              ].map(([label, value]) => (
                <tr key={String(label)}>
                  <td className="px-4 py-3 font-semibold text-foreground">{String(label)}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-foreground">
                    {inr(Number(value))}
                  </td>
                  <td className="px-4 py-3 text-right text-xs text-muted-foreground">
                    {sft > 0 ? `${(Number(value) / sft).toFixed(0)} /sft` : "—"}
                  </td>
                  <td className="px-4 py-3 text-right text-xs text-muted-foreground">
                    {projectCost > 0 ? `${((Number(value) / projectCost) * 100).toFixed(1)}%` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Shell>
  );
}
