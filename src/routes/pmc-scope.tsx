import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Ruler, Save, Calculator, CheckSquare, Square } from "lucide-react";
import { Shell } from "@/components/saha/Shell";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/pmc-scope")({
  head: () => ({
    meta: [
      { title: "PMC Appointment Scope & Investment — Saha OS" },
      {
        name: "description",
        content:
          "Pick the work packages your PMC handles, set the fee and see allocated, committed and balance cost against your live BOQ.",
      },
      { property: "og:title", content: "PMC Appointment Scope & Investment — Saha OS" },
      {
        property: "og:description",
        content: "Live PMC scope, fee and cost allocation driven by your project BOQ.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

const SCOPE_MODES = ["Common only", "Individual only", "Common + Individual"] as const;

function toNum(v: unknown) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function inr(v: number) {
  return `₹${Math.round(v).toLocaleString("en-IN")}`;
}

function crore(v: number) {
  return `₹${(v / 10000000).toFixed(2)} Cr`;
}

type SavedScope = {
  mode?: string;
  feePct?: number;
  includedTrades?: string[];
};

function Page() {
  const qc = useQueryClient();
  const [projectId, setProjectId] = useState("");
  const [mode, setMode] = useState<string>(SCOPE_MODES[0]);
  const [feePct, setFeePct] = useState(3);
  const [included, setIncluded] = useState<string[]>([]);
  const [loadedFor, setLoadedFor] = useState("");
  const [status, setStatus] = useState("");

  const projectsQuery = useQuery({
    queryKey: ["site_projects", "pmc-scope"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_projects")
        .select("id,name,location,target_budget,total_built_up_sft,pmc_scope")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const projects = projectsQuery.data ?? [];
  const activeId = projectId || projects[0]?.id || "";
  const project = projects.find((p) => p.id === activeId);

  const boqQuery = useQuery({
    queryKey: ["boq_items", "pmc-scope", activeId],
    enabled: Boolean(activeId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("boq_items")
        .select("stage,quantity,rate")
        .eq("project_id", activeId);
      if (error) throw error;
      return data ?? [];
    },
  });

  const poQuery = useQuery({
    queryKey: ["purchase_orders", "pmc-scope", activeId],
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

  const packages = useMemo(() => {
    const map = new Map<string, { cost: number; items: number }>();
    for (const it of boqQuery.data ?? []) {
      const key = String(it.stage ?? "Miscellaneous");
      const prev = map.get(key) ?? { cost: 0, items: 0 };
      map.set(key, {
        cost: prev.cost + toNum(it.quantity) * toNum(it.rate),
        items: prev.items + 1,
      });
    }
    return [...map.entries()]
      .map(([trade, v]) => ({ trade, ...v }))
      .sort((a, b) => b.cost - a.cost);
  }, [boqQuery.data]);

  useEffect(() => {
    if (!project || loadedFor === activeId) return;
    const saved = (project.pmc_scope ?? {}) as SavedScope;
    setMode(saved.mode && SCOPE_MODES.includes(saved.mode as never) ? saved.mode : SCOPE_MODES[0]);
    setFeePct(toNum(saved.feePct) || 3);
    setIncluded(Array.isArray(saved.includedTrades) ? saved.includedTrades.map(String) : []);
    setLoadedFor(activeId);
  }, [project, activeId, loadedFor]);

  // Default to everything in scope the first time, once the BOQ has loaded.
  useEffect(() => {
    if (loadedFor !== activeId) return;
    const saved = (project?.pmc_scope ?? {}) as SavedScope;
    if (!Array.isArray(saved.includedTrades) && packages.length > 0 && included.length === 0) {
      setIncluded(packages.map((p) => p.trade));
    }
  }, [packages, loadedFor, activeId, project, included.length]);

  const committed = useMemo(() => {
    let total = 0;
    for (const po of poQuery.data ?? []) {
      if (String(po.status ?? "").toLowerCase() === "rejected") continue;
      const lines = (po.purchase_order_items ?? []) as {
        quantity: number;
        rate: number;
        discount_pct: number;
        gst_pct: number;
      }[];
      for (const l of lines) {
        const base = toNum(l.quantity) * toNum(l.rate);
        const afterDisc = base * (1 - toNum(l.discount_pct) / 100);
        total += afterDisc * (1 + toNum(l.gst_pct) / 100);
      }
      total += toNum(po.freight_charges) + toNum(po.other_charges);
    }
    return total;
  }, [poQuery.data]);

  const inScopeCost = packages
    .filter((p) => included.includes(p.trade))
    .reduce((sum, p) => sum + p.cost, 0);
  const totalBoq = packages.reduce((sum, p) => sum + p.cost, 0);
  const pmcFee = (inScopeCost * feePct) / 100;
  const budget = toNum(project?.target_budget);
  const sft = toNum(project?.total_built_up_sft);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("site_projects")
        .update({ pmc_scope: { mode, feePct, includedTrades: included } })
        .eq("id", activeId);
      if (error) throw error;
    },
    onSuccess: async () => {
      setStatus("PMC scope saved for this project.");
      await qc.invalidateQueries({ queryKey: ["site_projects"] });
    },
    onError: (e: Error) => setStatus(`Save failed: ${e.message}`),
  });

  const toggle = (trade: string) =>
    setIncluded((prev) =>
      prev.includes(trade) ? prev.filter((t) => t !== trade) : [...prev, trade],
    );

  return (
    <Shell title="PMC Appointment Scope & Investment">
      <div className="space-y-6">
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/80">
            Cost planning & scope
          </p>
          <h1 className="flex items-center gap-3 text-2xl font-extrabold uppercase tracking-tight text-foreground sm:text-3xl">
            <Ruler className="h-7 w-7 text-primary" />
            PMC Appointment Scope
          </h1>
          <p className="max-w-3xl text-sm text-muted-foreground">
            Tick the work packages your PMC is appointed for. Costs come straight from this
            project's BOQ, and committed value from its approved purchase orders.
          </p>
        </header>

        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Project
          </span>
          <select
            value={activeId}
            onChange={(e) => {
              setProjectId(e.target.value);
              setLoadedFor("");
              setIncluded([]);
              setStatus("");
            }}
            className="min-w-[220px] rounded-xl border border-border bg-background px-3 py-2 text-sm"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} {p.location ? `· ${p.location}` : ""}
              </option>
            ))}
          </select>

          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Assigned scope
          </span>
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value)}
            className="rounded-xl border border-sky-500/40 bg-sky-500/5 px-3 py-2 text-sm"
          >
            {SCOPE_MODES.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>

          <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            PMC fee %
            <input
              type="number"
              step="0.1"
              min={0}
              value={feePct}
              onChange={(e) => setFeePct(toNum(e.target.value))}
              className="w-20 rounded-xl border border-sky-500/40 bg-sky-500/5 px-2 py-1.5 text-sm font-normal normal-case text-foreground"
            />
          </label>

          <div className="ml-auto flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => saveMutation.mutate()}
              disabled={!activeId || saveMutation.isPending}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              {saveMutation.isPending ? "Saving…" : "Save scope"}
            </button>
            <Link
              to="/boq-engine"
              className="inline-flex items-center gap-2 rounded-xl border border-primary/40 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary"
            >
              <Calculator className="h-4 w-4" />
              Open BOQ Engine
            </Link>
          </div>
        </div>

        {status ? (
          <p className="rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-foreground">
            {status}
          </p>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: "Cost in PMC scope",
              value: crore(inScopeCost),
              sub: `${included.length} of ${packages.length} packages`,
            },
            {
              label: `PMC fee @ ${feePct}%`,
              value: inr(pmcFee),
              sub: sft > 0 ? `${(pmcFee / sft).toFixed(2)} /sft` : "—",
            },
            {
              label: "Committed via POs",
              value: crore(committed),
              sub: totalBoq > 0 ? `${((committed / totalBoq) * 100).toFixed(1)}% of BOQ` : "No BOQ yet",
            },
            {
              label: "Balance vs budget",
              value: budget > 0 ? crore(budget - committed) : "—",
              sub: budget > 0 ? `Budget ${crore(budget)}` : "Set a target budget",
            },
          ].map((c) => (
            <div key={c.label} className="rounded-2xl border border-emerald-600/30 bg-emerald-600/5 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
                {c.label}
              </p>
              <p className="mt-1 text-xl font-bold text-foreground">{c.value}</p>
              <p className="text-xs text-muted-foreground">{c.sub}</p>
            </div>
          ))}
        </div>

        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-muted/40 px-4 py-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-primary">
              Work packages
            </h2>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIncluded(packages.map((p) => p.trade))}
                className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold"
              >
                Select all
              </button>
              <button
                type="button"
                onClick={() => setIncluded([])}
                className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold"
              >
                Clear
              </button>
            </div>
          </div>

          {packages.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">
              No BOQ items for this project yet — generate or upload the BOQ and the work packages
              appear here with their costs.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <th className="px-4 py-2">In PMC scope</th>
                    <th className="px-4 py-2">Work package</th>
                    <th className="px-4 py-2 text-right">Line items</th>
                    <th className="px-4 py-2 text-right">Est. cost</th>
                    <th className="px-4 py-2 text-right">₹/sft</th>
                    <th className="px-4 py-2 text-right">Share</th>
                  </tr>
                </thead>
                <tbody>
                  {packages.map((p) => {
                    const on = included.includes(p.trade);
                    return (
                      <tr key={p.trade} className="border-b border-border/60">
                        <td className="px-4 py-2">
                          <button
                            type="button"
                            onClick={() => toggle(p.trade)}
                            className="inline-flex items-center gap-2 text-sm font-semibold text-foreground"
                          >
                            {on ? (
                              <CheckSquare className="h-5 w-5 text-primary" />
                            ) : (
                              <Square className="h-5 w-5 text-muted-foreground" />
                            )}
                            {on ? "Included" : "Excluded"}
                          </button>
                        </td>
                        <td className="px-4 py-2 font-medium text-foreground">{p.trade}</td>
                        <td className="px-4 py-2 text-right">{p.items}</td>
                        <td className="px-4 py-2 text-right font-semibold">{inr(p.cost)}</td>
                        <td className="px-4 py-2 text-right">
                          {sft > 0 ? (p.cost / sft).toFixed(2) : "—"}
                        </td>
                        <td className="px-4 py-2 text-right">
                          {totalBoq > 0 ? `${((p.cost / totalBoq) * 100).toFixed(1)}%` : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-muted/30 font-bold">
                    <td className="px-4 py-3" />
                    <td className="px-4 py-3">Total BOQ</td>
                    <td className="px-4 py-3 text-right">
                      {packages.reduce((s, p) => s + p.items, 0)}
                    </td>
                    <td className="px-4 py-3 text-right">{inr(totalBoq)}</td>
                    <td className="px-4 py-3 text-right">
                      {sft > 0 ? (totalBoq / sft).toFixed(2) : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">100%</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </div>
    </Shell>
  );
}
