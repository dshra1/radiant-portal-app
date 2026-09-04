import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MapPin, Layers, Ruler, Trash2, Plus, X } from "lucide-react";
import { Shell } from "@/components/saha/Shell";
import { ActionButton, PhaseBar, StatusBadge } from "@/components/saha/ui";
import { inrCompact, num } from "@/data/saha";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/projects")({
  head: () => ({
    meta: [
      { title: "Projects — Saha OS Next" },
      {
        name: "description",
        content:
          "Project setup and portfolio view: add or remove sites, track built-up area, slab take-offs, floor configuration, budget consumption and phase progress.",
      },
      { property: "og:title", content: "Projects — Saha OS Next" },
      {
        property: "og:description",
        content: "Add, edit and remove construction sites with budget burn and phase progress.",
      },
    ],
  }),
  component: Projects,
});

type Phase = { name: string; state: "done" | "active" | "pending" };

type Row = {
  id: string;
  name: string;
  location: string;
  type: string;
  single_floor_slab_sft: number;
  cellar_floors: number;
  stilt_floors: number;
  typical_floors: number;
  total_built_up_sft: number;
  total_slab_sft: number;
  target_budget: number;
  spend: number;
  health: string;
  phases: Phase[];
};

const DEFAULT_PHASES: Phase[] = [
  { name: "Piling", state: "pending" },
  { name: "Foundation", state: "pending" },
  { name: "Structural", state: "pending" },
  { name: "MEP", state: "pending" },
  { name: "Finishing", state: "pending" },
];

const emptyForm = {
  name: "",
  location: "",
  type: "",
  single_floor_slab_sft: "",
  cellar_floors: "",
  stilt_floors: "",
  typical_floors: "",
  target_budget: "",
  spend: "",
  health: "On Track",
};

function Projects() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["site_projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_projects")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as Row[];
    },
  });

  const createProject = useMutation({
    mutationFn: async () => {
      const single = Number(form.single_floor_slab_sft) || 0;
      const cellar = Number(form.cellar_floors) || 0;
      const stilt = Number(form.stilt_floors) || 0;
      const typical = Number(form.typical_floors) || 0;
      const { error } = await supabase.from("site_projects").insert({
        name: form.name.trim(),
        location: form.location.trim(),
        type: form.type.trim(),
        single_floor_slab_sft: single,
        cellar_floors: cellar,
        stilt_floors: stilt,
        typical_floors: typical,
        total_built_up_sft: single * typical,
        total_slab_sft: single * (cellar + stilt + typical),
        target_budget: Number(form.target_budget) || 0,
        spend: Number(form.spend) || 0,
        health: form.health,
        phases: DEFAULT_PHASES,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setForm(emptyForm);
      setOpen(false);
      setError(null);
      void qc.invalidateQueries({ queryKey: ["site_projects"] });
    },
    onError: (e: Error) => setError(e.message),
  });

  const removeProject = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("site_projects").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["site_projects"] }),
    onError: (e: Error) => setError(e.message),
  });

  return (
    <Shell
      title="Projects"
      subtitle="Project setup, floor configuration and built-up take-offs"
      actions={
        <ActionButton onClick={() => setOpen((v) => !v)}>
          {open ? (
            <>
              <X className="size-3.5" /> Close
            </>
          ) : (
            <>
              <Plus className="size-3.5" /> New project
            </>
          )}
        </ActionButton>
      }
    >
      {error && (
        <div className="mb-3 rounded border border-destructive/40 bg-destructive-soft px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      {open && (
        <form
          className="panel mb-4 p-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!form.name.trim()) {
              setError("Project name is required.");
              return;
            }
            createProject.mutate();
          }}
        >
          <h2 className="text-sm font-semibold tracking-tight">Add a project</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Project name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
            <Field
              label="Location"
              value={form.location}
              onChange={(v) => setForm({ ...form, location: v })}
            />
            <Field
              label="Type (e.g. G+5 Commercial)"
              value={form.type}
              onChange={(v) => setForm({ ...form, type: v })}
            />
            <label className="block">
              <span className="label-caps text-muted-foreground">Health</span>
              <select
                value={form.health}
                onChange={(e) => setForm({ ...form, health: e.target.value })}
                className="mt-1 h-9 w-full rounded border border-input bg-card px-2 text-sm"
              >
                <option>On Track</option>
                <option>At Risk</option>
                <option>Delayed</option>
              </select>
            </label>
            <Field
              label="Single floor slab (sft)"
              value={form.single_floor_slab_sft}
              onChange={(v) => setForm({ ...form, single_floor_slab_sft: v })}
              numeric
            />
            <Field
              label="Cellar floors"
              value={form.cellar_floors}
              onChange={(v) => setForm({ ...form, cellar_floors: v })}
              numeric
            />
            <Field
              label="Stilt floors"
              value={form.stilt_floors}
              onChange={(v) => setForm({ ...form, stilt_floors: v })}
              numeric
            />
            <Field
              label="Typical floors"
              value={form.typical_floors}
              onChange={(v) => setForm({ ...form, typical_floors: v })}
              numeric
            />
            <Field
              label="Target budget (₹)"
              value={form.target_budget}
              onChange={(v) => setForm({ ...form, target_budget: v })}
              numeric
            />
            <Field
              label="Spend to date (₹)"
              value={form.spend}
              onChange={(v) => setForm({ ...form, spend: v })}
              numeric
            />
          </div>
          <div className="mt-4 flex gap-2">
            <button
              type="submit"
              disabled={createProject.isPending}
              className="inline-flex h-8 items-center gap-1.5 rounded bg-primary px-3 text-[13px] font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-60"
            >
              {createProject.isPending ? "Saving…" : "Save project"}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="inline-flex h-8 items-center rounded border border-input bg-card px-3 text-[13px] font-medium"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading projects…</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No projects yet — use “New project” to add your first site.
        </p>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2 2xl:grid-cols-3">
          {rows.map((p) => {
            const burn = p.target_budget ? Math.round((p.spend / p.target_budget) * 100) : 0;
            const phases = Array.isArray(p.phases) ? p.phases : DEFAULT_PHASES;
            return (
              <article key={p.id} className="panel p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h2 className="text-base font-semibold tracking-tight">{p.name}</h2>
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="size-3" /> {p.location || "—"}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <StatusBadge
                      tone={
                        p.health === "On Track" ? "emerald" : p.health === "At Risk" ? "amber" : "red"
                      }
                    >
                      {p.health}
                    </StatusBadge>
                    <button
                      type="button"
                      aria-label={`Delete ${p.name}`}
                      onClick={() => {
                        if (confirm(`Delete “${p.name}”? This cannot be undone.`)) {
                          removeProject.mutate(p.id);
                        }
                      }}
                      className="grid size-7 place-items-center rounded border border-input text-muted-foreground hover:bg-destructive-soft hover:text-destructive"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {p.type && <StatusBadge tone="slate">{p.type}</StatusBadge>}
                  <StatusBadge tone="sky">
                    {p.cellar_floors}C + {p.stilt_floors}S + {p.typical_floors}T
                  </StatusBadge>
                </div>

                <dl className="mt-3 grid grid-cols-2 gap-px overflow-hidden rounded border border-border bg-border">
                  <Cell
                    icon={<Ruler className="size-3" />}
                    label="Built-up"
                    value={`${num(p.total_built_up_sft)} sft`}
                  />
                  <Cell
                    icon={<Layers className="size-3" />}
                    label="Total slab"
                    value={`${num(p.total_slab_sft)} sft`}
                  />
                  <Cell label="Single floor slab" value={`${num(p.single_floor_slab_sft)} sft`} />
                  <Cell label="Target budget" value={inrCompact(p.target_budget)} />
                </dl>

                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="label-caps text-muted-foreground">Budget consumed</span>
                    <span className="font-semibold tnum">{burn}%</span>
                  </div>
                  <div className="mt-1.5 h-1 w-full rounded-sm bg-border">
                    <div
                      className={burn > 80 ? "h-1 rounded-sm bg-destructive" : "h-1 rounded-sm bg-primary"}
                      style={{ width: `${Math.min(burn, 100)}%` }}
                    />
                  </div>
                </div>

                <div className="mt-3">
                  <p className="label-caps mb-1.5 text-muted-foreground">Phase progress</p>
                  <PhaseBar phases={phases} />
                  <div className="mt-1.5 flex justify-between text-[10px] text-muted-foreground">
                    {phases.map((ph) => (
                      <span key={ph.name}>{ph.name}</span>
                    ))}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </Shell>
  );
}

function Field({
  label,
  value,
  onChange,
  numeric,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  numeric?: boolean;
}) {
  return (
    <label className="block">
      <span className="label-caps text-muted-foreground">{label}</span>
      <input
        value={value}
        inputMode={numeric ? "numeric" : "text"}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 h-9 w-full rounded border border-input bg-card px-2 text-sm"
      />
    </label>
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
