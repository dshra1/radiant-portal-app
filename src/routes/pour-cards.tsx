import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CheckCircle2, ClipboardCheck, Clock, Layers, Plus, FileDown } from "lucide-react";
import { Shell } from "@/components/saha/Shell";
import { StatusBadge } from "@/components/saha/ui";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { useActiveProject } from "@/hooks/useActiveProject";
import { useAccess, useSessionUser } from "@/lib/access";

export const Route = createFileRoute("/pour-cards")({
  head: () => ({
    meta: [
      { title: "Pour Cards | Saha OS" },
      {
        name: "description",
        content:
          "Raise concrete pour cards with pre-pour checklist, grade, volume and cube details, and get engineer approval before every pour.",
      },
      { property: "og:title", content: "Pour Cards | Saha OS" },
      {
        property: "og:description",
        content: "Pre-pour checklist and approval record for every concrete pour on site.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

const CHECKS = [
  "Reinforcement as per drawing",
  "Cover blocks placed",
  "Shuttering line, level & props checked",
  "Formwork oiled and cleaned",
  "Conduits / sleeves / inserts in place",
  "Construction joint prepared",
  "Concrete pump & vibrators ready",
  "Curing arrangement ready",
];

type Card = {
  id: string;
  pour_ref: string;
  element: string;
  level: string;
  grade: string;
  quantity_cum: number;
  pour_date: string | null;
  slump: string;
  cubes_cast: number;
  checklist: Record<string, boolean>;
  status: string;
  requested_by_name: string;
  approved_by_name: string;
  approved_at: string | null;
  remarks: string;
};

type Draft = Omit<Card, "id" | "approved_by_name" | "approved_at">;

const num = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

function emptyDraft(name: string): Draft {
  return {
    pour_ref: "",
    element: "Slab",
    level: "",
    grade: "M25",
    quantity_cum: 0,
    pour_date: new Date().toISOString().slice(0, 10),
    slump: "",
    cubes_cast: 0,
    checklist: {},
    status: "draft",
    requested_by_name: name,
    remarks: "",
  };
}

function Page() {
  const project = useActiveProject();
  const user = useSessionUser();
  const { access } = useAccess();
  const canApprove = Boolean(
    access?.isAdmin || access?.roles.includes("pm") || access?.roles.includes("site_engineer"),
  );
  const canDelete = Boolean(access?.isAdmin || access?.roles.includes("pm"));
  const queryClient = useQueryClient();
  const enabled = Boolean(user?.id) && Boolean(project.id);

  const [draft, setDraft] = useState<Draft | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "draft" | "pending" | "approved" | "poured">("all");

  const { data: cards = [], isPending } = useQuery({
    queryKey: ["pour_cards", project.id],
    enabled,
    queryFn: async (): Promise<Card[]> => {
      const { data, error } = await supabase
        .from("pour_cards")
        .select(
          "id,pour_ref,element,level,grade,quantity_cum,pour_date,slump,cubes_cast,checklist,status,requested_by_name,approved_by_name,approved_at,remarks",
        )
        .eq("project_id", project.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((r) => ({
        ...r,
        quantity_cum: num(r.quantity_cum),
        cubes_cast: num(r.cubes_cast),
        checklist: (r.checklist ?? {}) as Record<string, boolean>,
      })) as Card[];
    },
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["pour_cards", project.id] });

  const save = useMutation({
    mutationFn: async (p: { draft: Draft; id: string | null }) => {
      const row = { ...p.draft, project_id: project.id, created_by: user?.id ?? null };
      if (p.id) {
        const { error } = await supabase.from("pour_cards").update(row).eq("id", p.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("pour_cards").insert(row);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Pour card saved");
      setDraft(null);
      setEditingId(null);
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const setStatus = useMutation({
    mutationFn: async (p: { id: string; status: string }) => {
      const patch: Database["public"]["Tables"]["pour_cards"]["Update"] = { status: p.status };
      if (p.status === "approved") {
        patch["approved_by"] = user?.id ?? null;
        patch["approved_by_name"] = user?.email ?? "PMC";
        patch["approved_at"] = new Date().toISOString();
      }
      const { error } = await supabase.from("pour_cards").update(patch).eq("id", p.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Pour card updated");
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("pour_cards").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Pour card removed");
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const stats = useMemo(
    () => ({
      pending: cards.filter((c) => c.status === "pending").length,
      approved: cards.filter((c) => c.status === "approved").length,
      drafts: cards.filter((c) => c.status === "draft").length,
      volume: cards
        .filter((c) => c.status === "poured" || c.status === "approved")
        .reduce((s, c) => s + c.quantity_cum, 0),
    }),
    [cards],
  );

  const filtered = useMemo(
    () => (filter === "all" ? cards : cards.filter((c) => c.status === filter)),
    [cards, filter],
  );

  function exportCsv() {
    const head = ["Ref", "Element", "Level", "Grade", "Cum", "Pour date", "Status", "Checks done", "Approved by"];
    const rows = filtered.map((c) =>
      [
        c.pour_ref,
        c.element,
        c.level,
        c.grade,
        c.quantity_cum,
        c.pour_date ?? "",
        c.status,
        `${CHECKS.filter((k) => c.checklist[k]).length}/${CHECKS.length}`,
        c.approved_by_name,
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(","),
    );
    const blob = new Blob([[head.join(","), ...rows].join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "pour-cards.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  const tone = (s: string) =>
    s === "approved" ? "emerald" : s === "pending" ? "amber" : s === "poured" ? "sky" : "slate";

  return (
    <Shell title="Pour Cards">
      <div className="flex flex-col gap-6 pb-16">
        <header className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 shadow-sm md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              {project.name} · {project.location}
            </p>
            <h1 className="text-2xl font-bold">Concrete pour cards</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Every pour needs a completed checklist and an approval before concreting starts.
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
                setDraft(emptyDraft(user?.email ?? ""));
                setEditingId(null);
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
            >
              <Plus className="h-4 w-4" /> New pour card
            </button>
          </div>
        </header>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Tile
            label="Awaiting approval"
            value={String(stats.pending)}
            icon={<Clock className="h-4 w-4 text-primary" />}
            active={filter === "pending"}
            onClick={() => setFilter("pending")}
          />
          <Tile
            label="Approved to pour"
            value={String(stats.approved)}
            icon={<CheckCircle2 className="h-4 w-4 text-primary" />}
            active={filter === "approved"}
            onClick={() => setFilter("approved")}
          />
          <Tile
            label="Drafts to complete"
            value={String(stats.drafts)}
            icon={<ClipboardCheck className="h-4 w-4 text-primary" />}
            active={filter === "draft"}
            onClick={() => setFilter("draft")}
          />
          <Tile
            label="Concrete cleared (cum)"
            value={stats.volume.toFixed(1)}
            icon={<Layers className="h-4 w-4 text-primary" />}
            active={filter === "all"}
            onClick={() => setFilter("all")}
          />
        </div>

        {draft ? (
          <section className="rounded-2xl border border-primary/40 bg-card p-5 shadow-sm">
            <h2 className="text-lg font-bold">{editingId ? "Edit pour card" : "New pour card"}</h2>
            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
              <Field label="Pour reference">
                <input
                  value={draft.pour_ref}
                  onChange={(e) => setDraft({ ...draft, pour_ref: e.target.value })}
                  placeholder="POUR-001"
                  className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
                />
              </Field>
              <Field label="Element">
                <select
                  value={draft.element}
                  onChange={(e) => setDraft({ ...draft, element: e.target.value })}
                  className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
                >
                  {["Footing", "Column", "Beam", "Slab", "Shear wall", "Staircase", "Raft", "Retaining wall"].map(
                    (o) => (
                      <option key={o}>{o}</option>
                    ),
                  )}
                </select>
              </Field>
              <Field label="Level / block">
                <input
                  value={draft.level}
                  onChange={(e) => setDraft({ ...draft, level: e.target.value })}
                  placeholder="Block A · 3rd floor"
                  className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
                />
              </Field>
              <Field label="Grade">
                <select
                  value={draft.grade}
                  onChange={(e) => setDraft({ ...draft, grade: e.target.value })}
                  className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
                >
                  {["M20", "M25", "M30", "M35", "M40"].map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              </Field>
              <Field label="Quantity (cum)">
                <input
                  type="number"
                  value={draft.quantity_cum}
                  onChange={(e) => setDraft({ ...draft, quantity_cum: num(e.target.value) })}
                  className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
                />
              </Field>
              <Field label="Pour date">
                <input
                  type="date"
                  value={draft.pour_date ?? ""}
                  onChange={(e) => setDraft({ ...draft, pour_date: e.target.value || null })}
                  className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
                />
              </Field>
              <Field label="Slump (mm)">
                <input
                  value={draft.slump}
                  onChange={(e) => setDraft({ ...draft, slump: e.target.value })}
                  className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
                />
              </Field>
              <Field label="Cubes cast">
                <input
                  type="number"
                  value={draft.cubes_cast}
                  onChange={(e) => setDraft({ ...draft, cubes_cast: num(e.target.value) })}
                  className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
                />
              </Field>
              <Field label="Remarks">
                <input
                  value={draft.remarks}
                  onChange={(e) => setDraft({ ...draft, remarks: e.target.value })}
                  className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
                />
              </Field>
            </div>

            <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Pre-pour checklist
            </p>
            <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2">
              {CHECKS.map((c) => (
                <label key={c} className="flex items-center gap-2 rounded-lg border border-border p-2 text-sm">
                  <input
                    type="checkbox"
                    checked={Boolean(draft.checklist[c])}
                    onChange={(e) =>
                      setDraft({ ...draft, checklist: { ...draft.checklist, [c]: e.target.checked } })
                    }
                  />
                  {c}
                </label>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                disabled={save.isPending}
                onClick={() => {
                  if (!draft.pour_ref.trim()) {
                    toast.error("Give the pour a reference");
                    return;
                  }
                  save.mutate({ draft, id: editingId });
                }}
                className="rounded-xl border border-border px-4 py-2 text-sm font-semibold"
              >
                Save as draft
              </button>
              <button
                disabled={save.isPending}
                onClick={() => {
                  if (!draft.pour_ref.trim()) {
                    toast.error("Give the pour a reference");
                    return;
                  }
                  const done = CHECKS.filter((c) => draft.checklist[c]).length;
                  if (done < CHECKS.length) {
                    toast.error("Complete all checklist items before sending for approval");
                    return;
                  }
                  save.mutate({ draft: { ...draft, status: "pending" }, id: editingId });
                }}
                className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
              >
                Send for approval
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
            <h2 className="text-lg font-bold">Pour register</h2>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as typeof filter)}
              className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm"
            >
              <option value="all">All</option>
              <option value="draft">Draft</option>
              <option value="pending">Awaiting approval</option>
              <option value="approved">Approved</option>
              <option value="poured">Poured</option>
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="p-3">Ref</th>
                  <th className="p-3">Element / level</th>
                  <th className="p-3">Grade</th>
                  <th className="p-3 text-right">Cum</th>
                  <th className="p-3">Pour date</th>
                  <th className="p-3">Checks</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isPending ? (
                  <tr>
                    <td colSpan={8} className="p-6 text-center text-muted-foreground">
                      Loading pour cards…
                    </td>
                  </tr>
                ) : null}
                {!isPending && filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-6 text-center text-muted-foreground">
                      No pour cards yet. Use “New pour card” before the next concreting.
                    </td>
                  </tr>
                ) : null}
                {filtered.map((c) => {
                  const done = CHECKS.filter((k) => c.checklist[k]).length;
                  return (
                    <tr key={c.id} className="hover:bg-muted/40">
                      <td className="p-3 font-semibold">{c.pour_ref}</td>
                      <td className="p-3">
                        {c.element}
                        <span className="block text-xs text-muted-foreground">{c.level || "—"}</span>
                      </td>
                      <td className="p-3">{c.grade}</td>
                      <td className="p-3 text-right">{c.quantity_cum}</td>
                      <td className="p-3">{c.pour_date ?? "—"}</td>
                      <td className="p-3">
                        {done}/{CHECKS.length}
                      </td>
                      <td className="p-3">
                        <StatusBadge tone={tone(c.status)}>{c.status}</StatusBadge>
                        {c.approved_by_name ? (
                          <span className="block text-[11px] text-muted-foreground">
                            by {c.approved_by_name}
                          </span>
                        ) : null}
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => {
                            const { id: _i, approved_by_name: _a, approved_at: _t, ...rest } = c;
                            setDraft(rest);
                            setEditingId(c.id);
                          }}
                          className="mr-3 font-semibold"
                        >
                          Open
                        </button>
                        {canApprove && c.status === "pending" ? (
                          <button
                            onClick={() => setStatus.mutate({ id: c.id, status: "approved" })}
                            className="mr-3 font-semibold text-primary"
                          >
                            Approve
                          </button>
                        ) : null}
                        {c.status === "approved" ? (
                          <button
                            onClick={() => setStatus.mutate({ id: c.id, status: "poured" })}
                            className="mr-3 font-semibold text-primary"
                          >
                            Mark poured
                          </button>
                        ) : null}
                        {canDelete ? (
                          <button
                            onClick={() => {
                              if (confirm("Remove this pour card?")) remove.mutate(c.id);
                            }}
                            className="font-semibold text-destructive"
                          >
                            Delete
                          </button>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <div className="flex flex-wrap gap-2 text-sm">
          <Link to="/qa-inspection" className="rounded-lg border border-border px-3 py-1.5 hover:bg-muted">
            QA inspections
          </Link>
          <Link to="/field-console" className="rounded-lg border border-border px-3 py-1.5 hover:bg-muted">
            Field console
          </Link>
          <Link to="/site-execution" className="rounded-lg border border-border px-3 py-1.5 hover:bg-muted">
            Site execution
          </Link>
        </div>
      </div>
    </Shell>
  );
}

function Tile({
  label,
  value,
  icon,
  active,
  onClick,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border bg-card p-5 text-left shadow-sm transition hover:bg-muted/50 ${active ? "border-primary ring-1 ring-primary" : "border-border"}`}
    >
      <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        <span>{label}</span>
        {icon}
      </div>
      <p className="mt-3 text-2xl font-bold">{value}</p>
    </button>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}
