import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { IndianRupee, Sparkles, Check, ShieldCheck } from "lucide-react";
import { Shell } from "@/components/saha/Shell";
import { supabase } from "@/integrations/supabase/client";
import { suggestBudgetFit, type BudgetSwap } from "@/lib/budget.functions";
import { raiseChangeRequest, useApprovalGate } from "@/lib/approvals";

export const Route = createFileRoute("/budget-fit")({
  head: () => ({
    meta: [
      { title: "Budget Fit — Suggested Brands to Stay Within Budget | Saha OS" },
      {
        name: "description",
        content:
          "See app-suggested items and brands with cheaper Hyderabad rates, how much each saves, and apply only the ones your partners approve.",
      },
      { property: "og:title", content: "Budget Fit — Suggested Brands to Stay Within Budget" },
      {
        property: "og:description",
        content: "Cheaper brand options with savings against your target budget. Nothing changes until you apply.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

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

function Page() {
  const qc = useQueryClient();
  const runSuggest = useServerFn(suggestBudgetFit);
  const [projectId, setProjectId] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [status, setStatus] = useState("");
  const { gateOn, decider } = useApprovalGate();

  const projectsQuery = useQuery({
    queryKey: ["site_projects", "budget-fit"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_projects")
        .select("id,name,location,target_budget,total_built_up_sft")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
  const projects = projectsQuery.data ?? [];
  const activeId = projectId || projects[0]?.id || "";
  const project = projects.find((p) => p.id === activeId);

  const boqQuery = useQuery({
    queryKey: ["boq_items", "budget-fit", activeId],
    enabled: Boolean(activeId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("boq_items")
        .select("id,quantity,rate")
        .eq("project_id", activeId);
      if (error) throw error;
      return data ?? [];
    },
  });

  const liveTotal = useMemo(
    () => (boqQuery.data ?? []).reduce((s, r) => s + toNum(r.quantity) * toNum(r.rate), 0),
    [boqQuery.data],
  );
  const budget = toNum(project?.target_budget);
  const sft = toNum(project?.total_built_up_sft);
  const gap = budget > 0 ? liveTotal - budget : 0;

  const [swaps, setSwaps] = useState<BudgetSwap[]>([]);

  const scan = useMutation({
    mutationFn: async () => runSuggest({ data: { projectId: activeId } }),
    onMutate: () => setStatus("Looking for cheaper options across your biggest cost lines…"),
    onSuccess: (res) => {
      setSwaps(res.swaps);
      setPicked([]);
      setStatus(
        res.swaps.length === 0
          ? "No credible cheaper option found for the biggest lines — rates already look tight."
          : `${res.swaps.length} suggestions found. Nothing is changed until you apply.`,
      );
    },
    onError: (e: Error) => setStatus(`Could not get suggestions: ${e.message}`),
  });

  const apply = useMutation({
    mutationFn: async () => {
      const chosen = swaps.filter((s) => picked.includes(s.itemId));
      for (const s of chosen) {
        if (gateOn) {
          await raiseChangeRequest({
            projectId: activeId,
            itemId: s.itemId,
            trade: s.trade,
            description: s.description,
            unit: s.unit,
            quantity: s.quantity,
            currentValues: {
              quantity: s.quantity,
              rate: s.currentRate,
              brand: s.currentBrand,
              supplier: "",
            },
            proposedValues: {
              quantity: s.quantity,
              rate: s.suggestedRate,
              brand: s.suggestedBrand,
              supplier: s.suggestedSupplier || s.suggestedBrand,
            },
            source: "budget-fit",
            note: s.why,
            requestedBy: decider.id,
            requestedByName: decider.name,
          });
          continue;
        }
        const { error } = await supabase
          .from("boq_items")
          .update({
            brand: s.suggestedBrand,
            supplier: s.suggestedSupplier || s.suggestedBrand,
            rate: s.suggestedRate,
          })
          .eq("id", s.itemId);
        if (error) throw error;
      }
      return chosen.length;
    },
    onSuccess: async (n) => {
      setStatus(
        gateOn
          ? `${n} suggestion${n === 1 ? "" : "s"} sent to partners for approval — the BOQ is unchanged until they approve.`
          : `${n} change${n === 1 ? "" : "s"} applied to the BOQ.`,
      );
      setSwaps((prev) => prev.filter((s) => !picked.includes(s.itemId)));
      setPicked([]);
      await qc.invalidateQueries({ queryKey: ["boq_items"] });
      await qc.invalidateQueries({ queryKey: ["boq_change_requests"] });
    },
    onError: (e: Error) => setStatus(`Could not apply: ${e.message}`),
  });

  const pickedSaving = swaps
    .filter((s) => picked.includes(s.itemId))
    .reduce((sum, s) => sum + s.saving, 0);
  const allSaving = swaps.reduce((sum, s) => sum + s.saving, 0);
  const projected = liveTotal - pickedSaving;

  return (
    <Shell title="Budget Fit — Suggested Brands">
      <div className="space-y-6">
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/80">
            Cost control
          </p>
          <h1 className="flex items-center gap-3 text-2xl font-extrabold uppercase tracking-tight text-foreground sm:text-3xl">
            <IndianRupee className="h-7 w-7 text-primary" />
            Stay Within Budget
          </h1>
          <p className="max-w-3xl text-sm text-muted-foreground">
            The app suggests cheaper but buildable items and brands for your highest-cost lines.
            These are suggestions only — your entered quantities, units and rates stay untouched
            until you tick the ones your partners approve and press Apply.
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
              setSwaps([]);
              setPicked([]);
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
          <div className="ml-auto flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => scan.mutate()}
              disabled={!activeId || scan.isPending}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
            >
              <Sparkles className="h-4 w-4" />
              {scan.isPending ? "Finding options…" : "Suggest cheaper options"}
            </button>
            <Link
              to="/boq-engine"
              className="inline-flex items-center gap-2 rounded-xl border border-primary/40 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary"
            >
              Open BOQ Engine
            </Link>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-border bg-card p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Current BOQ total
            </p>
            <p className="mt-1 text-xl font-bold text-foreground">{crore(liveTotal)}</p>
            <p className="text-xs text-muted-foreground">
              {sft > 0 ? `${(liveTotal / sft).toFixed(0)} /sft` : "—"}
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Target budget
            </p>
            <p className="mt-1 text-xl font-bold text-foreground">
              {budget > 0 ? crore(budget) : "Not set"}
            </p>
          </div>
          <div
            className={`rounded-2xl border p-4 ${
              gap > 0 ? "border-destructive/40 bg-destructive/5" : "border-emerald-600/30 bg-emerald-600/5"
            }`}
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {gap > 0 ? "Over budget by" : "Under budget by"}
            </p>
            <p className="mt-1 text-xl font-bold text-foreground">{inr(Math.abs(gap))}</p>
            <p className="text-xs text-muted-foreground">
              All suggestions together save {inr(allSaving)}
            </p>
          </div>
          <div className="rounded-2xl border border-sky-500/40 bg-sky-500/5 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-sky-700">
              If you apply the ticked ones
            </p>
            <p className="mt-1 text-xl font-bold text-foreground">{crore(projected)}</p>
            <p className="text-xs text-muted-foreground">Saving {inr(pickedSaving)}</p>
          </div>
        </div>

        {status ? (
          <p className="rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-foreground">
            {status}
          </p>
        ) : null}

        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-muted/40 px-4 py-3">
            <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-primary">
              <ShieldCheck className="h-4 w-4" />
              Suggested items & brands ({swaps.length})
            </h2>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setPicked(swaps.map((s) => s.itemId))}
                disabled={swaps.length === 0}
                className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
              >
                Tick all
              </button>
              <button
                type="button"
                onClick={() => setPicked([])}
                disabled={picked.length === 0}
                className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => apply.mutate()}
                disabled={picked.length === 0 || apply.isPending}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-50"
              >
                <Check className="h-4 w-4" />
                {apply.isPending ? "Applying…" : `Apply ${picked.length} approved`}
              </button>
            </div>
          </div>

          {swaps.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">
              No suggestions yet — press “Suggest cheaper options”. Your BOQ is never changed by
              this scan.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <th className="px-4 py-2">Approve</th>
                    <th className="px-4 py-2">Trade / item</th>
                    <th className="px-4 py-2">Now</th>
                    <th className="px-4 py-2">Suggested</th>
                    <th className="px-4 py-2 text-right">Rate now</th>
                    <th className="px-4 py-2 text-right">New rate</th>
                    <th className="px-4 py-2 text-right">Saving</th>
                  </tr>
                </thead>
                <tbody>
                  {swaps.map((s) => {
                    const on = picked.includes(s.itemId);
                    return (
                      <tr key={s.itemId} className="border-b border-border/60 align-top">
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={on}
                            onChange={() =>
                              setPicked((prev) =>
                                prev.includes(s.itemId)
                                  ? prev.filter((x) => x !== s.itemId)
                                  : [...prev, s.itemId],
                              )
                            }
                            className="h-5 w-5 accent-emerald-600"
                            aria-label={`Approve ${s.suggestedBrand} for ${s.description}`}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                            {s.trade}
                          </p>
                          <p className="font-medium text-foreground">{s.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {s.quantity} {s.unit}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{s.currentBrand || "—"}</td>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-foreground">{s.suggestedBrand}</p>
                          {s.suggestedSupplier ? (
                            <p className="text-xs text-muted-foreground">{s.suggestedSupplier}</p>
                          ) : null}
                          {s.tier ? (
                            <span className="mt-1 inline-block rounded-full bg-sky-500/10 px-2 py-0.5 text-xs font-semibold text-sky-700">
                              {s.tier}
                            </span>
                          ) : null}
                          {s.why ? (
                            <p className="mt-1 max-w-xs text-xs text-muted-foreground">{s.why}</p>
                          ) : null}
                        </td>
                        <td className="px-4 py-3 text-right">{inr(s.currentRate)}</td>
                        <td className="px-4 py-3 text-right font-semibold text-emerald-700">
                          {inr(s.suggestedRate)}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-emerald-700">
                          {inr(s.saving)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Shell>
  );
}
