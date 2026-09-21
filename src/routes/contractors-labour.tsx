import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Users, IndianRupee, HardHat, CalendarDays, FileDown, Plus } from "lucide-react";
import { Shell } from "@/components/saha/Shell";
import { supabase } from "@/integrations/supabase/client";
import { useActiveProject } from "@/hooks/useActiveProject";
import { useAccess, useSessionUser } from "@/lib/access";

export const Route = createFileRoute("/contractors-labour")({
  head: () => ({
    meta: [
      { title: "Contractors & Labour | Saha OS" },
      {
        name: "description",
        content:
          "Daily labour log per contractor and trade with headcount, man-days, day rates and labour cost for the selected project.",
      },
      { property: "og:title", content: "Contractors & Labour | Saha OS" },
      {
        property: "og:description",
        content: "Daily contractor and labour deployment with man-days and labour cost per project.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

type Entry = {
  id: string;
  work_date: string;
  contractor: string;
  trade: string;
  headcount: number;
  hours: number;
  day_rate: number;
  work_done: string;
  area: string;
  supervisor: string;
  notes: string;
};

type Draft = Omit<Entry, "id">;

const TRADES = [
  "Masonry",
  "RCC / Shuttering",
  "Bar bending",
  "Plastering",
  "Plumbing",
  "Electrical",
  "Painting",
  "Flooring / Tiling",
  "Carpentry",
  "Helpers",
];

const today = () => new Date().toISOString().slice(0, 10);

function emptyDraft(): Draft {
  return {
    work_date: today(),
    contractor: "",
    trade: TRADES[0]!,
    headcount: 0,
    hours: 8,
    day_rate: 0,
    work_done: "",
    area: "",
    supervisor: "",
    notes: "",
  };
}

const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;
const num = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

function Page() {
  const project = useActiveProject();
  const user = useSessionUser();
  const { access } = useAccess();
  const canDelete = Boolean(access?.isAdmin || access?.roles.includes("pm"));
  const queryClient = useQueryClient();
  const enabled = Boolean(user?.id) && Boolean(project.id);

  const [draft, setDraft] = useState<Draft | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [range, setRange] = useState<"today" | "month" | "all">("month");

  const { data: entries = [], isPending } = useQuery({
    queryKey: ["labour_entries", project.id],
    enabled,
    queryFn: async (): Promise<Entry[]> => {
      const { data, error } = await supabase
        .from("labour_entries")
        .select(
          "id,work_date,contractor,trade,headcount,hours,day_rate,work_done,area,supervisor,notes",
        )
        .eq("project_id", project.id)
        .order("work_date", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((r) => ({
        ...r,
        headcount: num(r.headcount),
        hours: num(r.hours),
        day_rate: num(r.day_rate),
      })) as Entry[];
    },
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["labour_entries", project.id] });

  const save = useMutation({
    mutationFn: async (p: { draft: Draft; id: string | null }) => {
      const row = { ...p.draft, project_id: project.id, created_by: user?.id ?? null };
      if (p.id) {
        const { error } = await supabase.from("labour_entries").update(row).eq("id", p.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("labour_entries").insert(row);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Labour entry saved");
      setDraft(null);
      setEditingId(null);
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("labour_entries").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Entry removed");
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const monthKey = today().slice(0, 7);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return entries.filter((e) => {
      if (range === "today" && e.work_date !== today()) return false;
      if (range === "month" && !e.work_date.startsWith(monthKey)) return false;
      if (!q) return true;
      return [e.contractor, e.trade, e.work_done, e.area, e.supervisor]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [entries, search, range, monthKey]);

  const stats = useMemo(() => {
    const todays = entries.filter((e) => e.work_date === today());
    const month = entries.filter((e) => e.work_date.startsWith(monthKey));
    return {
      todayHeads: todays.reduce((s, e) => s + e.headcount, 0),
      monthManDays: month.reduce((s, e) => s + e.headcount * (e.hours / 8), 0),
      monthCost: month.reduce((s, e) => s + e.headcount * e.day_rate, 0),
      contractors: new Set(entries.map((e) => e.contractor).filter(Boolean)).size,
    };
  }, [entries, monthKey]);

  const byContractor = useMemo(() => {
    const map = new Map<string, { manDays: number; cost: number; trades: Set<string> }>();
    for (const e of filtered) {
      const key = e.contractor || "Unassigned";
      const cur = map.get(key) ?? { manDays: 0, cost: 0, trades: new Set<string>() };
      cur.manDays += e.headcount * (e.hours / 8);
      cur.cost += e.headcount * e.day_rate;
      if (e.trade) cur.trades.add(e.trade);
      map.set(key, cur);
    }
    return [...map.entries()].sort((a, b) => b[1].cost - a[1].cost);
  }, [filtered]);

  function exportCsv() {
    const head = [
      "Date",
      "Contractor",
      "Trade",
      "Headcount",
      "Hours",
      "Day rate",
      "Labour cost",
      "Area",
      "Work done",
      "Supervisor",
    ];
    const rows = filtered.map((e) =>
      [
        e.work_date,
        e.contractor,
        e.trade,
        e.headcount,
        e.hours,
        e.day_rate,
        Math.round(e.headcount * e.day_rate),
        e.area,
        e.work_done,
        e.supervisor,
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(","),
    );
    const blob = new Blob([[head.join(","), ...rows].join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `labour-${(project.name || "project").replace(/\s+/g, "-").toLowerCase()}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <Shell title="Contractors & Labour">
      <div className="flex flex-col gap-6 pb-16">
        <header className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 shadow-sm md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              {project.name} · {project.location}
            </p>
            <h1 className="text-2xl font-bold text-foreground">Contractors &amp; labour</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Log who worked on site each day, and the man-days and labour cost build up here.
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
                setDraft(emptyDraft());
                setEditingId(null);
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
            >
              <Plus className="h-4 w-4" /> Add labour entry
            </button>
          </div>
        </header>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <button
            type="button"
            onClick={() => setRange("today")}
            className={`rounded-2xl border bg-card p-5 text-left shadow-sm transition hover:bg-muted/50 ${range === "today" ? "border-primary ring-1 ring-primary" : "border-border"}`}
          >
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <span>On site today</span>
              <Users className="h-4 w-4 text-primary" />
            </div>
            <p className="mt-3 text-2xl font-bold">{Math.round(stats.todayHeads)}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">Show today&apos;s entries</p>
          </button>
          <button
            type="button"
            onClick={() => setRange("month")}
            className={`rounded-2xl border bg-card p-5 text-left shadow-sm transition hover:bg-muted/50 ${range === "month" ? "border-primary ring-1 ring-primary" : "border-border"}`}
          >
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <span>Man-days this month</span>
              <CalendarDays className="h-4 w-4 text-primary" />
            </div>
            <p className="mt-3 text-2xl font-bold">{Math.round(stats.monthManDays)}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">Show this month</p>
          </button>
          <Link
            to="/cost-dashboard"
            className="rounded-2xl border border-border bg-card p-5 shadow-sm transition hover:border-primary hover:bg-muted/50"
          >
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <span>Labour cost this month</span>
              <IndianRupee className="h-4 w-4 text-primary" />
            </div>
            <p className="mt-3 text-2xl font-bold">{inr(stats.monthCost)}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">Open cost dashboard</p>
          </Link>
          <button
            type="button"
            onClick={() => setRange("all")}
            className={`rounded-2xl border bg-card p-5 text-left shadow-sm transition hover:bg-muted/50 ${range === "all" ? "border-primary ring-1 ring-primary" : "border-border"}`}
          >
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <span>Contractors engaged</span>
              <HardHat className="h-4 w-4 text-primary" />
            </div>
            <p className="mt-3 text-2xl font-bold">{stats.contractors}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">Show all entries</p>
          </button>
        </div>

        {draft ? (
          <section className="rounded-2xl border border-primary/40 bg-card p-5 shadow-sm">
            <h2 className="text-lg font-bold">{editingId ? "Edit labour entry" : "New labour entry"}</h2>
            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
              <Field label="Date">
                <input
                  type="date"
                  value={draft.work_date}
                  onChange={(e) => setDraft({ ...draft, work_date: e.target.value })}
                  className="input"
                />
              </Field>
              <Field label="Contractor">
                <input
                  value={draft.contractor}
                  onChange={(e) => setDraft({ ...draft, contractor: e.target.value })}
                  className="input"
                  placeholder="e.g. Ramesh Masonry Works"
                />
              </Field>
              <Field label="Trade">
                <select
                  value={draft.trade}
                  onChange={(e) => setDraft({ ...draft, trade: e.target.value })}
                  className="input"
                >
                  {TRADES.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </Field>
              <Field label="Headcount">
                <input
                  type="number"
                  value={draft.headcount}
                  onChange={(e) => setDraft({ ...draft, headcount: num(e.target.value) })}
                  className="input"
                />
              </Field>
              <Field label="Hours worked">
                <input
                  type="number"
                  value={draft.hours}
                  onChange={(e) => setDraft({ ...draft, hours: num(e.target.value) })}
                  className="input"
                />
              </Field>
              <Field label="Day rate (₹ per person)">
                <input
                  type="number"
                  value={draft.day_rate}
                  onChange={(e) => setDraft({ ...draft, day_rate: num(e.target.value) })}
                  className="input"
                />
              </Field>
              <Field label="Area / location">
                <input
                  value={draft.area}
                  onChange={(e) => setDraft({ ...draft, area: e.target.value })}
                  className="input"
                  placeholder="e.g. Block A · 3rd floor"
                />
              </Field>
              <Field label="Supervisor">
                <input
                  value={draft.supervisor}
                  onChange={(e) => setDraft({ ...draft, supervisor: e.target.value })}
                  className="input"
                />
              </Field>
              <Field label="Work done">
                <input
                  value={draft.work_done}
                  onChange={(e) => setDraft({ ...draft, work_done: e.target.value })}
                  className="input"
                />
              </Field>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                disabled={save.isPending}
                onClick={() => {
                  if (!draft.contractor.trim()) {
                    toast.error("Enter the contractor name");
                    return;
                  }
                  save.mutate({ draft, id: editingId });
                }}
                className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
              >
                {save.isPending ? "Saving…" : "Save entry"}
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
            placeholder="Search contractor, trade, area or work done…"
            className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
          <select
            value={range}
            onChange={(e) => setRange(e.target.value as typeof range)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="today">Today</option>
            <option value="month">This month</option>
            <option value="all">All entries</option>
          </select>
        </div>

        {!project.id ? (
          <p className="text-sm text-muted-foreground">Add a project first to log labour.</p>
        ) : null}

        <section className="rounded-2xl border border-border bg-card shadow-sm">
          <div className="border-b border-border p-4">
            <h2 className="text-lg font-bold">Daily labour log</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="p-3">Date</th>
                  <th className="p-3">Contractor</th>
                  <th className="p-3">Trade</th>
                  <th className="p-3 text-right">Heads</th>
                  <th className="p-3 text-right">Man-days</th>
                  <th className="p-3 text-right">Labour cost</th>
                  <th className="p-3">Area / work</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isPending ? (
                  <tr>
                    <td className="p-6 text-center text-muted-foreground" colSpan={8}>
                      Loading labour log…
                    </td>
                  </tr>
                ) : null}
                {!isPending && filtered.length === 0 ? (
                  <tr>
                    <td className="p-6 text-center text-muted-foreground" colSpan={8}>
                      No labour entries for this period yet. Use “Add labour entry”.
                    </td>
                  </tr>
                ) : null}
                {filtered.map((e) => (
                  <tr key={e.id} className="hover:bg-muted/40">
                    <td className="p-3">{e.work_date}</td>
                    <td className="p-3 font-semibold">{e.contractor || "—"}</td>
                    <td className="p-3">{e.trade}</td>
                    <td className="p-3 text-right">{e.headcount}</td>
                    <td className="p-3 text-right">{(e.headcount * (e.hours / 8)).toFixed(1)}</td>
                    <td className="p-3 text-right font-semibold">{inr(e.headcount * e.day_rate)}</td>
                    <td className="p-3 text-muted-foreground">
                      {[e.area, e.work_done].filter(Boolean).join(" · ") || "—"}
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => {
                          const { id: _id, ...rest } = e;
                          setDraft(rest);
                          setEditingId(e.id);
                        }}
                        className="mr-3 font-semibold"
                      >
                        Edit
                      </button>
                      {canDelete ? (
                        <button
                          onClick={() => {
                            if (confirm("Remove this labour entry?")) remove.mutate(e.id);
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

        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h2 className="text-lg font-bold">Contractor-wise summary</h2>
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {byContractor.length === 0 ? (
              <p className="text-sm text-muted-foreground">No entries in the selected period.</p>
            ) : null}
            {byContractor.map(([name, v]) => (
              <div key={name} className="rounded-xl border border-border p-4">
                <p className="text-sm font-semibold">{name}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {[...v.trades].join(", ") || "—"}
                </p>
                <div className="mt-2 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{v.manDays.toFixed(1)} man-days</span>
                  <span className="font-bold">{inr(v.cost)}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap gap-2 text-sm">
            <Link to="/field-console" className="rounded-lg border border-border px-3 py-1.5 hover:bg-muted">
              Field console
            </Link>
            <Link to="/site-execution" className="rounded-lg border border-border px-3 py-1.5 hover:bg-muted">
              Site execution
            </Link>
            <Link to="/cost-dashboard" className="rounded-lg border border-border px-3 py-1.5 hover:bg-muted">
              Cost dashboard
            </Link>
          </div>
        </section>
      </div>
    </Shell>
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
