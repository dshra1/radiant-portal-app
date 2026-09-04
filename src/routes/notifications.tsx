import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BellRing, Check, CheckCheck, Plus, Trash2, X } from "lucide-react";
import { Shell } from "@/components/saha/Shell";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/notifications")({
  head: () => ({
    meta: [
      { title: "Action Centre — Saha OS Next" },
      {
        name: "description",
        content:
          "Notification and action centre for approvals, rate alerts, purchase releases and payout reminders across every Saha OS site.",
      },
      { property: "og:title", content: "Action Centre — Saha OS Next" },
      {
        property: "og:description",
        content: "Approvals, rate alerts and payment reminders in one shared action centre.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Notifications,
});

type Note = {
  id: string;
  title: string;
  body: string;
  category: string;
  priority: string;
  link: string;
  is_read: boolean;
  created_at: string;
};

const priorityTone: Record<string, string> = {
  High: "bg-destructive/10 text-destructive",
  Normal: "bg-primary-soft text-primary",
  Low: "bg-secondary text-secondary-foreground",
};

function Notifications() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: "",
    body: "",
    category: "General",
    priority: "Normal",
    link: "",
  });

  const { data = [], isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Note[];
    },
    refetchInterval: 15000,
  });

  const invalidate = () => void qc.invalidateQueries({ queryKey: ["notifications"] });

  const toggleRead = useMutation({
    mutationFn: async (n: Note) => {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: !n.is_read })
        .eq("id", n.id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const markAll = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("is_read", false);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("notifications").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const create = useMutation({
    mutationFn: async () => {
      if (!form.title.trim()) throw new Error("Title is required");
      const { error } = await supabase.from("notifications").insert({
        title: form.title.trim(),
        body: form.body.trim(),
        category: form.category,
        priority: form.priority,
        link: form.link.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setForm({ title: "", body: "", category: "General", priority: "Normal", link: "" });
      setShowForm(false);
      invalidate();
    },
  });

  const unread = data.filter((n) => !n.is_read).length;
  const rows = filter === "unread" ? data.filter((n) => !n.is_read) : data;

  return (
    <Shell
      title="Action Centre"
      subtitle="Approvals, alerts and reminders shared across the workspace"
      actions={
        <>
          <button
            type="button"
            onClick={() => markAll.mutate()}
            disabled={unread === 0 || markAll.isPending}
            className="inline-flex items-center gap-1.5 rounded-md border border-input bg-card px-2.5 py-1.5 text-[12px] font-semibold hover:bg-secondary disabled:opacity-50"
          >
            <CheckCheck className="size-3.5" /> Mark all read
          </button>
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-2.5 py-1.5 text-[12px] font-semibold text-primary-foreground"
          >
            {showForm ? <X className="size-3.5" /> : <Plus className="size-3.5" />}
            {showForm ? "Cancel" : "New alert"}
          </button>
        </>
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
            Title
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="mt-1 w-full rounded-md border border-input bg-background px-2.5 py-2 text-[13.5px] font-normal text-foreground"
              placeholder="Pour card awaiting approval"
            />
          </label>
          <label className="text-[12px] font-semibold text-muted-foreground md:col-span-2">
            Details
            <textarea
              rows={2}
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              className="mt-1 w-full rounded-md border border-input bg-background px-2.5 py-2 text-[13.5px] font-normal text-foreground"
            />
          </label>
          <label className="text-[12px] font-semibold text-muted-foreground">
            Category
            <input
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="mt-1 w-full rounded-md border border-input bg-background px-2.5 py-2 text-[13.5px] font-normal text-foreground"
            />
          </label>
          <label className="text-[12px] font-semibold text-muted-foreground">
            Priority
            <select
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
              className="mt-1 w-full rounded-md border border-input bg-background px-2.5 py-2 text-[13.5px] font-normal text-foreground"
            >
              <option>High</option>
              <option>Normal</option>
              <option>Low</option>
            </select>
          </label>
          <label className="text-[12px] font-semibold text-muted-foreground md:col-span-2">
            Link to a screen (optional, e.g. /pour-cards)
            <input
              value={form.link}
              onChange={(e) => setForm({ ...form, link: e.target.value })}
              className="mt-1 w-full rounded-md border border-input bg-background px-2.5 py-2 text-[13.5px] font-normal text-foreground"
              placeholder="/pour-cards"
            />
          </label>
          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={create.isPending}
              className="rounded-md bg-primary px-3 py-2 text-[12.5px] font-semibold text-primary-foreground disabled:opacity-50"
            >
              Add alert
            </button>
            {create.isError && (
              <span className="ml-2 text-[12px] text-destructive">
                {(create.error as Error).message}
              </span>
            )}
          </div>
        </form>
      )}

      <div className="mb-3 flex items-center gap-2">
        {(["all", "unread"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`rounded-full px-3 py-1 text-[12px] font-semibold capitalize ${
              filter === f
                ? "bg-primary text-primary-foreground"
                : "border border-input text-muted-foreground hover:bg-secondary"
            }`}
          >
            {f} {f === "unread" ? `(${unread})` : `(${data.length})`}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {isLoading && <p className="text-[13px] text-muted-foreground">Loading alerts…</p>}
        {!isLoading && rows.length === 0 && (
          <p className="rounded-xl border border-border bg-card p-4 text-[13px] text-muted-foreground">
            Nothing pending here.
          </p>
        )}
        {rows.map((n) => (
          <article
            key={n.id}
            className={`flex flex-wrap items-start gap-3 rounded-xl border p-3.5 ${
              n.is_read ? "border-border bg-card" : "border-primary/30 bg-primary-soft/40"
            }`}
          >
            <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-card text-primary">
              <BellRing className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-[14px] font-semibold text-foreground">{n.title}</h2>
                <span
                  className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                    priorityTone[n.priority] ?? priorityTone['Normal']
                  }`}
                >
                  {n.priority}
                </span>
                <span className="label-caps text-muted-foreground">{n.category}</span>
              </div>
              {n.body && <p className="mt-1 text-[13px] text-muted-foreground">{n.body}</p>}
              <div className="mt-1.5 flex flex-wrap items-center gap-3 text-[11.5px] text-muted-foreground">
                <span>{new Date(n.created_at).toLocaleString("en-IN")}</span>
                {n.link && (
                  <Link to={n.link} className="font-semibold text-primary underline">
                    Open screen
                  </Link>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => toggleRead.mutate(n)}
                title={n.is_read ? "Mark unread" : "Mark read"}
                className="rounded-md border border-input bg-card p-1.5 text-muted-foreground hover:text-foreground"
              >
                <Check className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={() => remove.mutate(n.id)}
                title="Delete"
                className="rounded-md border border-input bg-card p-1.5 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          </article>
        ))}
      </div>
    </Shell>
  );
}
