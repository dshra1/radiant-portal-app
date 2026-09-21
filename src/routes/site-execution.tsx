import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Activity, Users, Layers, TrendingUp, Plus, FileDown } from "lucide-react";
import { Shell } from "@/components/saha/Shell";
import { StatusBadge } from "@/components/saha/ui";
import { supabase } from "@/integrations/supabase/client";
import { useActiveProject } from "@/hooks/useActiveProject";
import { useAccess, useSessionUser } from "@/lib/access";

export const Route = createFileRoute("/site-execution")({
  head: () => ({
    meta: [
      { title: "Site Execution | Saha OS" },
      {
        name: "description",
        content:
          "Stage-wise execution progress with planned vs actual percentages, labour deployed, concrete poured and open quality issues.",
      },
      { property: "og:title", content: "Site Execution | Saha OS" },
      {
        property: "og:description",
        content: "Track stage-wise site progress against plan, with labour, pours and quality in one view.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

type Stage = {
  id: string;
  name: string;
  sort: number;
  planned_pct: number;
  actual_pct: number;
  planned_start: string | null;
  planned_end: string | null;
  actual_start: string | null;
  actual_end: string | null;
  status: string;
  notes: string;
};

type Draft = Omit<Stage, "id">;

const DEFAULT_STAGES = [
  "Site mobilisation",
  "Excavation & earthwork",
  "Foundation & footings",
  "Cellar / retaining walls",
  "RCC superstructure",
  "Blockwork",
  "Plastering",
  "Plumbing rough-in",
  "Electrical rough-in",
  "Flooring & tiling",
  "Doors & windows",
  "Painting",
  "External development",
  "Handover",
];

const num = (v: unknown) => (Number.isFinite(Number(v)) ? Number(v) : 0);
const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

function emptyDraft(sort: number): Draft {
  return {
    name: "",
    sort,
    planned_pct: 0,
    actual_pct: 0,
    planned_start: null,
    planned_end: null,
    actual_start: null,
    actual_end: null,
    status: "not started",
    notes: "",
  };
}

function Page() {
  const project = useActiveProject();
  const user = useSessionUser();
  const { access } = useAccess();
  const canDelete = Boolean(access?.isAdmin || access?.roles.includes("pm"));
  const queryClient = useQueryClient();
  const enabled = Boolean(user?.id) && Boolean(project.id);

  const [draft, setDraft] = useState<Draft | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const stagesQuery = useQuery({
    queryKey: ["site_stages", project.id],
    enabled,
    queryFn: async (): Promise<Stage[]> => {
      const { data, error } = await supabase
        .from("site_stages")
        .select(
          "id,name,sort,planned_pct,actual_pct,planned_start,planned_end,actual_start,actual_end,status,notes",
        )
        .eq("project_id", project.id)
        .order("sort", { ascending: true });
      if (error) throw error;
      return (data ?? []).map((s) => ({
        ...s,
        sort: num(s.sort),
        planned_pct: num(s.planned_pct),
        actual_pct: num(s.actual_pct),
      })) as Stage[];
    },
  });

  const labour = useQuery({
    queryKey: ["site_exec_labour", project.id],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("labour_entries")
        .select("work_date,headcount,hours,day_rate")
        .eq("project_id", project.id);
      if (error) throw error;
      return data ?? [];
    },
  });

  const pours = useQuery({
    queryKey: ["site_exec_pours", project.id],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pour_cards")
        .select("quantity_cum,status")
        .eq("project_id", project.id);
      if (error) throw error;
      return data ?? [];
    },
  });

  const qa = useQuery({
    queryKey: ["site_exec_qa", project.id],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("qa_inspections")
        .select("resolution,severity")
        .eq("project_id", project.id);
      if (error) throw error;
      return data ?? [];
    },
  });

  const stages = stagesQuery.data ?? [];
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["site_stages", project.id] });

  const save = useMutation({
    mutationFn: async (p: { draft: Draft; id: string | null }) => {
      const row = { ...p.draft, project_id: project.id, created_by: user?.id ?? null };
      if (p.id) {
        const { error } = await supabase.from("site_stages").update(row).eq("id", p.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("site_stages").insert(row);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Stage saved");
      setDraft(null);
      setEditingId(null);
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const seed = useMutation({
    mutationFn: async () => {
      const rows = DEFAULT_STAGES.map((name, i) => ({
        project_id: project.id,
        name,
        sort: i + 1,
        created_by: user?.id ?? null,
      }));
      const { error } = await supabase.from("site_stages").insert(rows);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Standard construction stages added");
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const patch = useMutation({
    mutationFn: async (p: { id: string; values: Database["public"]["Tables"]["site_stages"]["Update"] }) => {
      const { error } = await supabase.from("site_stages").update(p.values).eq("id", p.id);
      if (error) throw error;
    },
    onSuccess: () => refresh(),
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("site_stages").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Stage removed");
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const totals = useMemo(() => {
    const plannedAvg = stages.length
      ? stages.reduce((s, x) => s + x.planned_pct, 0) / stages.length
      : 0;
    const actualAvg = stages.length
      ? stages.reduce((s, x) => s + x.actual_pct, 0) / stages.length
      : 0;
    const manDays = (labour.data ?? []).reduce(
      (s, l) => s + num(l.headcount) * (num(l.hours) / 8),
      0,
    );
    const labourCost = (labour.data ?? []).reduce(
      (s, l) => s + num(l.headcount) * num(l.day_rate),
      0,
    );
    const concrete = (pours.data ?? [])
      .filter((p) => p.status === "poured" || p.status === "approved")
      .reduce((s, p) => s + num(p.quantity_cum), 0);
    const openQa = (qa.data ?? []).filter((r) => r.resolution !== "Closed").length;
    return { plannedAvg, actualAvg, manDays, labourCost, concrete, openQa };
  }, [stages, labour.data, pours.data, qa.data]);

  function exportCsv() {
    const head = ["#", "Stage", "Planned %", "Actual %", "Status", "Planned start", "Planned end", "Notes"];
    const rows = stages.map((s) =>
      [s.sort, s.name, s.planned_pct, s.actual_pct, s.status, s.planned_start ?? "", s.planned_end ?? "", s.notes]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(","),
    );
    const blob = new Blob([[head.join(","), ...rows].join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "site-execution.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  const inputCls = "rounded-lg border border-border bg-background px-3 py-2 text-sm";

  return (
    <Shell title="Site Execution">
      <div className="flex flex-col gap-6 pb-16">
        <header className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 shadow-sm md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              {project.name} · {project.location}
            </p>
            <h1 className="text-2xl font-bold">Site execution</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Update each stage as work moves, and the whole app reflects the same progress.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={exportCsv}
              className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-semibold hover:bg-muted"
            >
              <FileDown className="h-4 w-4" /> Export
            </button>
            <button
              onClick={() => {
                setDraft(emptyDraft(stages.length + 1));
                setEditingId(null);
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
            >
              <Plus className="h-4 w-4" /> Add stage
            </button>
          </div>
        </header>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Kpi
            label="Overall progress"
            value={`${totals.actualAvg.toFixed(1)}%`}
            note={`Plan ${totals.plannedAvg.toFixed(1)}%`}
            icon={<TrendingUp className="h-4 w-4 text-primary" />}
            to="/cost-dashboard"
          />
          <Kpi
            label="Man-days deployed"
            value={Math.round(totals.manDays).toLocaleString("en-IN")}
            note={`Labour cost ${inr(totals.labourCost)}`}
            icon={<Users className="h-4 w-4 text-primary" />}
            to="/contractors-labour"
          />
          <Kpi
            label="Concrete cleared"
            value={`${totals.concrete.toFixed(1)} cum`}
            note="Open pour cards"
            icon={<Layers className="h-4 w-4 text-primary" />}
            to="/pour-cards"
          />
          <Kpi
            label="Open quality issues"
            value={String(totals.openQa)}
            note="Open inspections"
            icon={<Activity className="h-4 w-4 text-primary" />}
            to="/qa-inspection"
          />
        </div>

        {draft ? (
          <section className="rounded-2xl border border-primary/40 bg-card p-5 shadow-sm">
            <h2 className="text-lg font-bold">{editingId ? "Edit stage" : "Add stage"}</h2>
            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
              <label className="flex flex-col gap-1 text-sm md:col-span-2">
                <span className="text-xs font-semibold uppercase text-muted-foreground">Stage name</span>
                <input
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  className={inputCls}
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-xs font-semibold uppercase text-muted-foreground">Sequence</span>
                <input
                  type="number"
                  value={draft.sort}
                  onChange={(e) => setDraft({ ...draft, sort: num(e.target.value) })}
                  className={inputCls}
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-xs font-semibold uppercase text-muted-foreground">Planned %</span>
                <input
                  type="number"
                  value={draft.planned_pct}
                  onChange={(e) => setDraft({ ...draft, planned_pct: num(e.target.value) })}
                  className={inputCls}
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-xs font-semibold uppercase text-muted-foreground">Actual %</span>
                <input
                  type="number"
                  value={draft.actual_pct}
                  onChange={(e) => setDraft({ ...draft, actual_pct: num(e.target.value) })}
                  className={inputCls}
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-xs font-semibold uppercase text-muted-foreground">Status</span>
                <select
                  value={draft.status}
                  onChange={(e) => setDraft({ ...draft, status: e.target.value })}
                  className={inputCls}
                >
                  {["not started", "in progress", "delayed", "completed"].map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-xs font-semibold uppercase text-muted-foreground">Planned start</span>
                <input
                  type="date"
                  value={draft.planned_start ?? ""}
                  onChange={(e) => setDraft({ ...draft, planned_start: e.target.value || null })}
                  className={inputCls}
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-xs font-semibold uppercase text-muted-foreground">Planned end</span>
                <input
                  type="date"
                  value={draft.planned_end ?? ""}
                  onChange={(e) => setDraft({ ...draft, planned_end: e.target.value || null })}
                  className={inputCls}
                />
              </label>
              <label className="flex flex-col gap-1 text-sm md:col-span-3">
                <span className="text-xs font-semibold uppercase text-muted-foreground">Notes</span>
                <input
                  value={draft.notes}
                  onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
                  className={inputCls}
                />
              </label>
            </div>
            <div className="mt-4 flex gap-2">
              <button
                disabled={save.isPending}
                onClick={() => {
                  if (!draft.name.trim()) {
                    toast.error("Enter the stage name");
                    return;
                  }
                  save.mutate({ draft, id: editingId });
                }}
                className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
              >
                {save.isPending ? "Saving…" : "Save stage"}
              </button>
              <button
                onClick={() => {
                  setDraft(null);
                  setEditingId(null);
                }}
                className="rounded-xl border border-border px-4 py-2 text-sm font-semibold"
              >
                Cancel
              </button>
            </div>
          </section>
        ) : null}

        <section className="rounded-2xl border border-border bg-card shadow-sm">
          <div className="flex items-center justify-between border-b border-border p-4">
            <h2 className="text-lg font-bold">Stage-wise progress</h2>
            {stages.length === 0 && project.id ? (
              <button
                onClick={() => seed.mutate()}
                disabled={seed.isPending}
                className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
              >
                {seed.isPending ? "Adding…" : "Add standard stages"}
              </button>
            ) : null}
          </div>
          <div className="divide-y divide-border">
            {stagesQuery.isPending ? (
              <p className="p-6 text-center text-sm text-muted-foreground">Loading stages…</p>
            ) : null}
            {!stagesQuery.isPending && stages.length === 0 ? (
              <p className="p-6 text-center text-sm text-muted-foreground">
                No stages set up yet. Use “Add standard stages” for the usual construction sequence.
              </p>
            ) : null}
            {stages.map((s) => (
              <div key={s.id} className="p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold">
                      {s.sort}. {s.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {[s.planned_start, s.planned_end].filter(Boolean).join(" → ") || "Dates not set"}
                      {s.notes ? ` · ${s.notes}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge
                      tone={
                        s.status === "completed"
                          ? "emerald"
                          : s.status === "delayed"
                            ? "red"
                            : s.status === "in progress"
                              ? "sky"
                              : "slate"
                      }
                    >
                      {s.status}
                    </StatusBadge>
                    <label className="flex items-center gap-2 text-xs">
                      Actual %
                      <input
                        type="number"
                        defaultValue={s.actual_pct}
                        onBlur={(e) => {
                          const v = Math.max(0, Math.min(100, num(e.target.value)));
                          if (v !== s.actual_pct)
                            patch.mutate({
                              id: s.id,
                              values: {
                                actual_pct: v,
                                status:
                                  v >= 100 ? "completed" : v > 0 ? "in progress" : "not started",
                              },
                            });
                        }}
                        className="w-20 rounded-lg border border-border bg-background px-2 py-1 text-sm"
                      />
                    </label>
                    <button
                      onClick={() => {
                        const { id: _i, ...rest } = s;
                        setDraft(rest);
                        setEditingId(s.id);
                      }}
                      className="text-sm font-semibold"
                    >
                      Edit
                    </button>
                    {canDelete ? (
                      <button
                        onClick={() => {
                          if (confirm(`Remove ${s.name}?`)) remove.mutate(s.id);
                        }}
                        className="text-sm font-semibold text-destructive"
                      >
                        Delete
                      </button>
                    ) : null}
                  </div>
                </div>
                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${Math.max(0, Math.min(100, s.actual_pct))}%` }}
                  />
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Actual {s.actual_pct}% · Plan {s.planned_pct}%
                  {s.actual_pct < s.planned_pct
                    ? ` · behind by ${(s.planned_pct - s.actual_pct).toFixed(1)}%`
                    : ""}
                </p>
              </div>
            ))}
          </div>
        </section>

        <div className="flex flex-wrap gap-2 text-sm">
          <Link to="/contractors-labour" className="rounded-lg border border-border px-3 py-1.5 hover:bg-muted">
            Contractors &amp; labour
          </Link>
          <Link to="/pour-cards" className="rounded-lg border border-border px-3 py-1.5 hover:bg-muted">
            Pour cards
          </Link>
          <Link to="/qa-inspection" className="rounded-lg border border-border px-3 py-1.5 hover:bg-muted">
            QA inspections
          </Link>
          <Link to="/field-console" className="rounded-lg border border-border px-3 py-1.5 hover:bg-muted">
            Field console
          </Link>
        </div>
      </div>
    </Shell>
  );
}

function Kpi({
  label,
  value,
  note,
  icon,
  to,
}: {
  label: string;
  value: string;
  note: string;
  icon: React.ReactNode;
  to: "/cost-dashboard" | "/contractors-labour" | "/pour-cards" | "/qa-inspection";
}) {
  return (
    <Link
      to={to}
      className="rounded-2xl border border-border bg-card p-5 shadow-sm transition hover:border-primary hover:bg-muted/50"
    >
      <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        <span>{label}</span>
        {icon}
      </div>
      <p className="mt-3 text-2xl font-bold">{value}</p>
      <p className="mt-1 text-[11px] text-muted-foreground">{note}</p>
    </Link>
  );
}
