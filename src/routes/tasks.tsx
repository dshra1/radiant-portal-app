import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarClock, ListChecks, Plus, User, X, Trash2 } from "lucide-react";
import { Shell } from "@/components/saha/Shell";
import { supabase } from "@/integrations/supabase/client";
import { useSessionUser } from "@/lib/access";
import { useActiveProject } from "@/hooks/useActiveProject";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/tasks")({
  head: () => ({
    meta: [
      { title: "Task Tracker — Saha OS" },
      {
        name: "description",
        content:
          "Track every active site task in one list: who it is assigned to, when it is due, how far it has progressed and its current status.",
      },
      { property: "og:title", content: "Task Tracker — Saha OS" },
      {
        property: "og:description",
        content: "Assignees, due dates, progress bars and status updates for all active Saha OS tasks.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TaskTracker;
});

type Task = {
  id: string;
  body: string;
  author_name: string;
  created_at: string;
  due_date: string | null;
  recipient_id: string | null;
  sender_id: string | null;
  project_id: string | null;
  status: string;
  progress: number;
};

type Member = { id: string; full_name: string; email: string };

const STATUSES = ["Open", "In Progress", "Blocked", "Done"] as const;

const statusTone: Record<string, string> = {
  Open: "bg-secondary text-secondary-foreground",
  "In Progress": "bg-info-soft text-info",
  Blocked: "bg-destructive/10 text-destructive",
  Done: "bg-primary-soft text-primary",
};

function dueLabel(due: string | null) {
  if (!due) return { text: "No due date", tone: "text-muted-foreground" };
  const d = new Date(`${due}T00:00:00`);
  const days = Math.round((d.getTime() - new Date().setHours(0, 0, 0, 0)) / 86400000);
  const text = d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  if (days < 0) return { text: `${text} · overdue`, tone: "text-destructive" };
  if (days === 0) return { text: `${text} · due today`, tone: "text-destructive" };
  if (days <= 3) return { text: `${text} · in ${days}d`, tone: "text-warning" };
  return { text, tone: "text-muted-foreground" };
}

function TaskTracker() {
  const qc = useQueryClient();
  const user = useSessionUser();
  const activeProject = useActiveProject();
  const [filter, setFilter] = useState<"active" | "mine" | "all">("active");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ body: "", recipient_id: "", due_date: "" });

  const { data: members = [] } = useQuery({
    queryKey: ["profiles", "approved-members"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id,full_name,email")
        .eq("status", "approved")
        .order("full_name", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Member[];
    },
  });

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["tasks", activeProject.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("team_messages")
        .select(
          "id,body,author_name,created_at,due_date,recipient_id,sender_id,project_id,status,progress",
        )
        .eq("is_task", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      const rows = (data ?? []) as Task[];
      if (!activeProject.id) return rows;
      return rows.filter((t) => !t.project_id || t.project_id === activeProject.id);
    },
    refetchInterval: 15000,
  });

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ["tasks"] });
    void qc.invalidateQueries({ queryKey: ["messages"] });
  };

  const update = useMutation({
    mutationFn: async (patch: { id: string; status?: string; progress?: number }) => {
      const { id, ...fields } = patch;
      const { error } = await supabase.from("team_messages").update(fields).eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("team_messages").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const create = useMutation({
    mutationFn: async () => {
      if (!form.body.trim()) throw new Error("Describe the task first");
      const { error } = await supabase.from("team_messages").insert({
        channel: "direct",
        author_name: user?.email ?? "Workspace",
        author_role: "",
        body: form.body.trim(),
        is_task: true,
        due_date: form.due_date || null,
        sender_id: user?.id ?? null,
        recipient_id: form.recipient_id || null,
        project_id: activeProject.id || null,
        status: "Open",
        progress: 0,
      });
      if (error) throw error;
      if (form.recipient_id) {
        await supabase.from("notifications").insert({
          title: "New task assigned",
          body: form.body.trim(),
          category: "Task",
          priority: "Normal",
          link: "/tasks",
          sender_id: user?.id ?? null,
          recipient_id: form.recipient_id,
          project_id: activeProject.id || null,
        });
      }
    },
    onSuccess: () => {
      setForm({ body: "", recipient_id: "", due_date: "" });
      setShowForm(false);
      invalidate();
    },
  });

  const rows = useMemo(() => {
    if (filter === "mine") return tasks.filter((t) => t.recipient_id === user?.id);
    if (filter === "active") return tasks.filter((t) => t.status !== "Done");
    return tasks;
  }, [tasks, filter, user?.id]);

  const nameOf = (id: string | null) => {
    if (!id) return "Unassigned";
    const m = members.find((x) => x.id === id);
    return m ? m.full_name || m.email : "Unassigned";
  };

  const done = tasks.filter((t) => t.status === "Done").length;
  const overdue = tasks.filter(
    (t) => t.status !== "Done" && t.due_date && new Date(`${t.due_date}T00:00:00`) < new Date(new Date().setHours(0, 0, 0, 0)),
  ).length;

  return (
    <Shell
      title="Task Tracker"
      subtitle={`${tasks.length - done} active · ${done} completed · ${overdue} overdue`}
      actions={
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-2.5 py-1.5 text-[12px] font-semibold text-primary-foreground"
        >
          {showForm ? <X className="size-3.5" /> : <Plus className="size-3.5" />}
          {showForm ? "Cancel" : "New task"}
        </button>
      }
    >
      {showForm && (
        <form
          className="mb-4 grid gap-3 rounded-xl border border-border bg-card p-4 md:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            create.mutate();
          }}
        >
          <label className="text-[12px] font-semibold text-muted-foreground md:col-span-2">
            Task
            <input
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              placeholder="Complete slab shuttering check on Tower A"
              className="mt-1 w-full rounded-md border border-input bg-background px-2.5 py-2 text-[13.5px] font-normal text-foreground"
            />
          </label>
          <label className="text-[12px] font-semibold text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <User className="size-3.5" /> Assign to
            </span>
            <select
              value={form.recipient_id}
              onChange={(e) => setForm({ ...form, recipient_id: e.target.value })}
              className="mt-1 w-full rounded-md border border-input bg-background px-2.5 py-2 text-[13.5px] font-normal text-foreground"
            >
              <option value="">Unassigned</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.full_name || m.email}
                </option>
              ))}
            </select>
          </label>
          <label className="text-[12px] font-semibold text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <CalendarClock className="size-3.5" /> Due date
            </span>
            <input
              type="date"
              value={form.due_date}
              onChange={(e) => setForm({ ...form, due_date: e.target.value })}
              className="mt-1 w-full rounded-md border border-input bg-background px-2.5 py-2 text-[13.5px] font-normal text-foreground"
            />
          </label>
          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={create.isPending}
              className="rounded-md bg-primary px-3 py-2 text-[12.5px] font-semibold text-primary-foreground disabled:opacity-50"
            >
              Add task
            </button>
            {create.isError && (
              <span className="ml-2 text-[12px] text-destructive">
                {(create.error as Error).message}
              </span>
            )}
          </div>
        </form>
      )}

      <div className="mb-3 flex flex-wrap items-center gap-2">
        {(
          [
            ["active", "Active"],
            ["mine", "Assigned to me"],
            ["all", "All"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setFilter(id)}
            className={cn(
              "rounded-full px-3 py-1 text-[12px] font-semibold",
              filter === id
                ? "bg-primary text-primary-foreground"
                : "border border-input text-muted-foreground hover:bg-secondary",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {isLoading && <p className="text-[13px] text-muted-foreground">Loading tasks…</p>}

      {!isLoading && rows.length === 0 && (
        <div className="rounded-xl border border-border bg-card p-6 text-center">
          <ListChecks className="mx-auto size-6 text-muted-foreground" />
          <p className="mt-2 text-[13px] text-muted-foreground">
            No tasks here yet. Create one above, or assign a task from{" "}
            <Link to="/messages" className="font-semibold text-primary underline">
              Team Chat
            </Link>
            .
          </p>
        </div>
      )}

      <div className="space-y-2">
        {rows.map((t) => {
          const due = dueLabel(t.due_date);
          const progress = Math.max(0, Math.min(100, Number(t.progress) || 0));
          return (
            <article
              key={t.id}
              className="grid gap-3 rounded-xl border border-border bg-card p-3.5 lg:grid-cols-[1fr_auto] lg:items-center"
            >
              <div className="min-w-0">
                <p className="text-[14px] font-semibold text-foreground">{t.body}</p>
                <div className="mt-1 flex flex-wrap items-center gap-3 text-[11.5px]">
                  <span className="inline-flex items-center gap-1 text-muted-foreground">
                    <User className="size-3" /> {nameOf(t.recipient_id)}
                  </span>
                  <span className={cn("inline-flex items-center gap-1", due.tone)}>
                    <CalendarClock className="size-3" /> {due.text}
                  </span>
                  <span
                    className={cn(
                      "rounded px-1.5 py-0.5 text-[10px] font-bold uppercase",
                      statusTone[t.status] ?? statusTone['Open'],
                    )}
                  >
                    {t.status}
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <div className="h-1.5 w-full max-w-sm overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <span className="tnum text-[11.5px] font-semibold text-muted-foreground">
                    {progress}%
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={progress}
                  aria-label="Progress"
                  onChange={(e) => update.mutate({ id: t.id, progress: Number(e.target.value) })}
                  className="w-32 accent-[hsl(var(--primary))]"
                />
                <select
                  value={t.status}
                  aria-label="Status"
                  onChange={(e) => {
                    const status = e.target.value;
                    update.mutate({
                      id: t.id,
                      status,
                      ...(status === "Done" ? { progress: 100 } : {}),
                    });
                  }}
                  className="rounded-md border border-input bg-background px-2 py-1.5 text-[12.5px] font-semibold text-foreground"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => remove.mutate(t.id)}
                  title="Delete task"
                  aria-label="Delete task"
                  className="rounded-md border border-input bg-card p-1.5 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </Shell>
  );
}
