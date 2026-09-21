import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertTriangle, CheckCircle2, ClipboardList, ShieldCheck, Plus, FileDown } from "lucide-react";
import { Shell } from "@/components/saha/Shell";
import { StatusBadge } from "@/components/saha/ui";
import { supabase } from "@/integrations/supabase/client";
import { useActiveProject } from "@/hooks/useActiveProject";
import { useAccess, useSessionUser } from "@/lib/access";

export const Route = createFileRoute("/qa-inspection")({
  head: () => ({
    meta: [
      { title: "QA Inspections | Saha OS" },
      {
        name: "description",
        content:
          "Record site quality inspections with severity, IS code reference, defect counts and closure status for the selected project.",
      },
      { property: "og:title", content: "QA Inspections | Saha OS" },
      {
        property: "og:description",
        content: "Quality inspection register with open defects, severity and closure tracking.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

export type Inspection = {
  id: string;
  inspected_on: string;
  location_tag: string;
  category: string;
  code_ref: string;
  severity: string;
  findings: string;
  defect_count: number;
  resolution: string;
  inspector_name: string;
  notes: string;
};

type Draft = Omit<Inspection, "id">;

const CATEGORIES = [
  "Reinforcement",
  "Shuttering",
  "Concrete",
  "Blockwork",
  "Plaster",
  "Waterproofing",
  "Plumbing",
  "Electrical",
  "Flooring",
  "Painting",
  "Safety",
  "Housekeeping",
];

const num = (v: unknown) => (Number.isFinite(Number(v)) ? Number(v) : 0);

function emptyDraft(inspector: string): Draft {
  return {
    inspected_on: new Date().toISOString().slice(0, 10),
    location_tag: "",
    category: CATEGORIES[0]!,
    code_ref: "",
    severity: "Low",
    findings: "",
    defect_count: 1,
    resolution: "Open",
    inspector_name: inspector,
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
  const [filter, setFilter] = useState<"all" | "open" | "closed" | "high">("all");
  const [search, setSearch] = useState("");

  const { data: rows = [], isPending } = useQuery({
    queryKey: ["qa_inspections", project.id],
    enabled,
    queryFn: async (): Promise<Inspection[]> => {
      const { data, error } = await supabase
        .from("qa_inspections")
        .select(
          "id,inspected_on,location_tag,category,code_ref,severity,findings,defect_count,resolution,inspector_name,notes",
        )
        .eq("project_id", project.id)
        .order("inspected_on", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((r) => ({ ...r, defect_count: num(r.defect_count) })) as Inspection[];
    },
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["qa_inspections", project.id] });

  const save = useMutation({
    mutationFn: async (p: { draft: Draft; id: string | null }) => {
      const row = { ...p.draft, project_id: project.id, created_by: user?.id ?? null };
      if (p.id) {
        const { error } = await supabase.from("qa_inspections").update(row).eq("id", p.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("qa_inspections").insert(row);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Inspection saved");
      setDraft(null);
      setEditingId(null);
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const setResolution = useMutation({
    mutationFn: async (p: { id: string; resolution: string }) => {
      const { error } = await supabase
        .from("qa_inspections")
        .update({ resolution: p.resolution })
        .eq("id", p.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Status updated");
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("qa_inspections").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Inspection removed");
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const stats = useMemo(() => {
    const open = rows.filter((r) => r.resolution !== "Closed");
    const closed = rows.filter((r) => r.resolution === "Closed");
    const high = rows.filter((r) => r.severity === "High" && r.resolution !== "Closed");
    const pass = rows.length ? (closed.length / rows.length) * 100 : 0;
    return { open: open.length, closed: closed.length, high: high.length, pass };
  }, [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (filter === "open" && r.resolution === "Closed") return false;
      if (filter === "closed" && r.resolution !== "Closed") return false;
      if (filter === "high" && !(r.severity === "High" && r.resolution !== "Closed")) return false;
      if (!q) return true;
      return [r.location_tag, r.category, r.findings, r.inspector_name, r.code_ref]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [rows, filter, search]);

  function exportCsv() {
    const head = ["Date", "Location", "Category", "Code", "Severity", "Defects", "Status", "Inspector", "Findings"];
    const body = filtered.map((r) =>
      [r.inspected_on, r.location_tag, r.category, r.code_ref, r.severity, r.defect_count, r.resolution, r.inspector_name, r.findings]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(","),
    );
    const blob = new Blob([[head.join(","), ...body].join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "qa-inspections.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  const inputCls = "rounded-lg border border-border bg-background px-3 py-2 text-sm";

  return (
    <Shell title="QA Inspections">
      <div className="flex flex-col gap-6 pb-16">
        <header className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 shadow-sm md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              {project.name} · {project.location}
            </p>
            <h1 className="text-2xl font-bold">Quality inspections</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Log what was checked, what was found, and close it once rectified.
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
              <Plus className="h-4 w-4" /> Record inspection
            </button>
          </div>
        </header>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Tile
            label="Open issues"
            value={String(stats.open)}
            icon={<AlertTriangle className="h-4 w-4 text-primary" />}
            active={filter === "open"}
            onClick={() => setFilter("open")}
          />
          <Tile
            label="High severity open"
            value={String(stats.high)}
            icon={<ShieldCheck className="h-4 w-4 text-primary" />}
            active={filter === "high"}
            onClick={() => setFilter("high")}
          />
          <Tile
            label="Closed"
            value={String(stats.closed)}
            icon={<CheckCircle2 className="h-4 w-4 text-primary" />}
            active={filter === "closed"}
            onClick={() => setFilter("closed")}
          />
          <Tile
            label="Closure rate"
            value={`${stats.pass.toFixed(0)}%`}
            icon={<ClipboardList className="h-4 w-4 text-primary" />}
            active={filter === "all"}
            onClick={() => setFilter("all")}
          />
        </div>

        {draft ? (
          <section className="rounded-2xl border border-primary/40 bg-card p-5 shadow-sm">
            <h2 className="text-lg font-bold">{editingId ? "Edit inspection" : "Record inspection"}</h2>
            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-xs font-semibold uppercase text-muted-foreground">Date</span>
                <input
                  type="date"
                  value={draft.inspected_on}
                  onChange={(e) => setDraft({ ...draft, inspected_on: e.target.value })}
                  className={inputCls}
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-xs font-semibold uppercase text-muted-foreground">Location</span>
                <input
                  value={draft.location_tag}
                  onChange={(e) => setDraft({ ...draft, location_tag: e.target.value })}
                  placeholder="Block A · Flat 302"
                  className={inputCls}
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-xs font-semibold uppercase text-muted-foreground">Category</span>
                <select
                  value={draft.category}
                  onChange={(e) => setDraft({ ...draft, category: e.target.value })}
                  className={inputCls}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-xs font-semibold uppercase text-muted-foreground">Code reference</span>
                <input
                  value={draft.code_ref}
                  onChange={(e) => setDraft({ ...draft, code_ref: e.target.value })}
                  placeholder="IS 456 / IS 2502"
                  className={inputCls}
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-xs font-semibold uppercase text-muted-foreground">Severity</span>
                <select
                  value={draft.severity}
                  onChange={(e) => setDraft({ ...draft, severity: e.target.value })}
                  className={inputCls}
                >
                  {["Low", "Medium", "High"].map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-xs font-semibold uppercase text-muted-foreground">Defects found</span>
                <input
                  type="number"
                  value={draft.defect_count}
                  onChange={(e) => setDraft({ ...draft, defect_count: num(e.target.value) })}
                  className={inputCls}
                />
              </label>
              <label className="flex flex-col gap-1 text-sm md:col-span-2">
                <span className="text-xs font-semibold uppercase text-muted-foreground">Findings</span>
                <input
                  value={draft.findings}
                  onChange={(e) => setDraft({ ...draft, findings: e.target.value })}
                  className={inputCls}
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-xs font-semibold uppercase text-muted-foreground">Inspector</span>
                <input
                  value={draft.inspector_name}
                  onChange={(e) => setDraft({ ...draft, inspector_name: e.target.value })}
                  className={inputCls}
                />
              </label>
            </div>
            <div className="mt-4 flex gap-2">
              <button
                disabled={save.isPending}
                onClick={() => {
                  if (!draft.findings.trim()) {
                    toast.error("Write what you found");
                    return;
                  }
                  save.mutate({ draft, id: editingId });
                }}
                className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
              >
                {save.isPending ? "Saving…" : "Save inspection"}
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

        <div className="flex flex-col gap-3 md:flex-row">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search location, category, findings…"
            className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as typeof filter)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="all">All inspections</option>
            <option value="open">Open</option>
            <option value="high">High severity open</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        <section className="rounded-2xl border border-border bg-card shadow-sm">
          <div className="border-b border-border p-4">
            <h2 className="text-lg font-bold">Inspection register</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="p-3">Date</th>
                  <th className="p-3">Location</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Severity</th>
                  <th className="p-3 text-right">Defects</th>
                  <th className="p-3">Findings</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isPending ? (
                  <tr>
                    <td colSpan={8} className="p-6 text-center text-muted-foreground">
                      Loading inspections…
                    </td>
                  </tr>
                ) : null}
                {!isPending && filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-6 text-center text-muted-foreground">
                      Nothing recorded yet. Use “Record inspection”.
                    </td>
                  </tr>
                ) : null}
                {filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-muted/40">
                    <td className="p-3">{r.inspected_on}</td>
                    <td className="p-3 font-semibold">{r.location_tag || "—"}</td>
                    <td className="p-3">
                      {r.category}
                      {r.code_ref ? (
                        <span className="block text-xs text-muted-foreground">{r.code_ref}</span>
                      ) : null}
                    </td>
                    <td className="p-3">
                      <StatusBadge
                        tone={r.severity === "High" ? "red" : r.severity === "Medium" ? "amber" : "slate"}
                      >
                        {r.severity}
                      </StatusBadge>
                    </td>
                    <td className="p-3 text-right">{r.defect_count}</td>
                    <td className="p-3 text-muted-foreground">{r.findings}</td>
                    <td className="p-3">
                      <StatusBadge tone={r.resolution === "Closed" ? "emerald" : "amber"}>
                        {r.resolution}
                      </StatusBadge>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => {
                          const { id: _i, ...rest } = r;
                          setDraft(rest);
                          setEditingId(r.id);
                        }}
                        className="mr-3 font-semibold"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() =>
                          setResolution.mutate({
                            id: r.id,
                            resolution: r.resolution === "Closed" ? "Open" : "Closed",
                          })
                        }
                        className="mr-3 font-semibold text-primary"
                      >
                        {r.resolution === "Closed" ? "Reopen" : "Close"}
                      </button>
                      {canDelete ? (
                        <button
                          onClick={() => {
                            if (confirm("Remove this inspection?")) remove.mutate(r.id);
                          }}
                          className="font-semibold text-destructive"
                        >
                          Delete
                        </button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <div className="flex flex-wrap gap-2 text-sm">
          <Link to="/qa" className="rounded-lg border border-border px-3 py-1.5 hover:bg-muted">
            QA overview
          </Link>
          <Link to="/pour-cards" className="rounded-lg border border-border px-3 py-1.5 hover:bg-muted">
            Pour cards
          </Link>
          <Link to="/site-media" className="rounded-lg border border-border px-3 py-1.5 hover:bg-muted">
            Site photos
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
