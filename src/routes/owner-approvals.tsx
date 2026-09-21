import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  FileText,
  MessageSquare,
  Paperclip,
  Plus,
  ShieldCheck,
  Trash2,
  XCircle,
} from "lucide-react";
import { Shell } from "@/components/saha/Shell";
import { supabase } from "@/integrations/supabase/client";
import { useAccess, useSessionUser } from "@/lib/access";

export const Route = createFileRoute("/owner-approvals")({
  head: () => ({
    meta: [
      { title: "Owner Approvals & Suggestions — Saha OS" },
      {
        name: "description",
        content:
          "Send notes, drawings, photos and decisions to landowners and investors, and record their approve or reject response with comments.",
      },
      { property: "og:title", content: "Owner Approvals & Suggestions — Saha OS" },
      {
        property: "og:description",
        content:
          "A written trail of every owner decision: what was asked, what was attached, who approved and when.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

type Owner = { name?: string; role?: string; contact?: string; share_pct?: number | string };

type Attachment = { path: string; name: string; type: string };

type Request = {
  id: string;
  project_id: string | null;
  title: string;
  body: string;
  category: string;
  priority: string;
  attachments: Attachment[] | null;
  due_date: string | null;
  status: string;
  raised_by_name: string;
  created_at: string;
};

type Decision = {
  id: string;
  request_id: string;
  owner_name: string;
  owner_role: string;
  decision: string;
  comment: string;
  decided_at: string | null;
};

const CATEGORIES = [
  { value: "decision", label: "Decision to make" },
  { value: "suggestion", label: "Suggestion" },
  { value: "change", label: "Change / variation" },
  { value: "note", label: "Note / information" },
];

const today = () => new Date().toISOString().slice(0, 10);

const emptyForm = () => ({
  title: "",
  body: "",
  category: "decision",
  priority: "normal",
  due_date: "",
});

function Page() {
  const qc = useQueryClient();
  const user = useSessionUser();
  const access = useAccess();
  const roles = access.access?.roles ?? [];
  const canRaise = Boolean(access.access?.isAdmin || roles.some((r) => ["pm", "accounts"].includes(r)));
  const canDelete = Boolean(access.access?.isAdmin || roles.includes("pm"));

  const [projectId, setProjectId] = useState("");
  const [form, setForm] = useState(emptyForm());
  const [files, setFiles] = useState<File[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [note, setNote] = useState("");
  const [comments, setComments] = useState<Record<string, string>>({});

  const projectsQuery = useQuery({
    queryKey: ["site_projects", "owner-approvals"],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_projects")
        .select("id,name,location,landowners,investors")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
  const projects = projectsQuery.data ?? [];
  const activeId = projectId || projects[0]?.id || "";
  const project = projects.find((p) => p.id === activeId);

  const owners: Owner[] = useMemo(() => {
    const land = Array.isArray(project?.landowners) ? (project?.landowners as Owner[]) : [];
    const inv = Array.isArray(project?.investors) ? (project?.investors as Owner[]) : [];
    return [...land, ...inv].filter((o) => String(o?.name ?? "").trim().length > 0);
  }, [project]);

  const requestsQuery = useQuery({
    queryKey: ["owner_requests", activeId],
    enabled: Boolean(activeId && user?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("owner_requests")
        .select("id,project_id,title,body,category,priority,attachments,due_date,status,raised_by_name,created_at")
        .eq("project_id", activeId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Request[];
    },
  });
  const requests = requestsQuery.data ?? [];

  const decisionsQuery = useQuery({
    queryKey: ["owner_decisions", activeId],
    enabled: Boolean(activeId && user?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("owner_decisions")
        .select("id,request_id,owner_name,owner_role,decision,comment,decided_at")
        .eq("project_id", activeId)
        .order("owner_name", { ascending: true });

      if (error) throw error;
      return (data ?? []) as Decision[];
    },
  });
  const decisions = decisionsQuery.data ?? [];
  const byRequest = (id: string) => decisions.filter((d) => d.request_id === id);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["owner_requests", activeId] });
    qc.invalidateQueries({ queryKey: ["owner_decisions", activeId] });
  };

  const addRequest = useMutation({
    mutationFn: async () => {
      if (!activeId) throw new Error("Choose a project first");
      if (!form.title.trim()) throw new Error("Add a short title");
      const uploaded: Attachment[] = [];
      for (const f of files) {
        const path = `${activeId}/${Date.now()}-${f.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
        const { error } = await supabase.storage.from("owner-approvals").upload(path, f, {
          upsert: false,
          contentType: f.type || "application/octet-stream",
        });
        if (error) throw error;
        uploaded.push({ path, name: f.name, type: f.type || "file" });
      }
      const { data, error } = await supabase
        .from("owner_requests")
        .insert({
          project_id: activeId,
          title: form.title.trim(),
          body: form.body.trim(),
          category: form.category,
          priority: form.priority,
          due_date: form.due_date || null,
          attachments: uploaded,
          status: "open",
          raised_by: user?.id ?? null,
          raised_by_name: user?.email ?? "",
        })
        .select("id")
        .single();
      if (error) throw error;

      if (owners.length > 0) {
        const rows = owners.map((o) => ({
          request_id: data.id,
          project_id: activeId,
          owner_name: String(o.name),
          owner_role: String(o.role ?? "Land Holder"),
          decision: "pending",
        }));
        const { error: dErr } = await supabase.from("owner_decisions").insert(rows);
        if (dErr) throw dErr;
        const notes = owners.map((o) => ({
          title: `Owner approval needed: ${form.title.trim()}`,
          body: `${o.name} — please approve or reject this ${form.category}.`,
          category: "approval",
          priority: form.priority === "high" ? "high" : "normal",
          link: "/owner-approvals",
          project_id: activeId,
          sender_id: user?.id ?? null,
        }));
        await supabase.from("notifications").insert(notes);
      }
      return data.id;
    },
    onSuccess: () => {
      setForm(emptyForm());
      setFiles([]);
      setShowForm(false);
      setNote("Sent to owners for approval.");
      invalidate();
    },
    onError: (e: Error) => setNote(e.message),
  });

  const decide = useMutation({
    mutationFn: async (args: { id: string; decision: "approved" | "rejected" }) => {
      const { error } = await supabase
        .from("owner_decisions")
        .update({
          decision: args.decision,
          comment: comments[args.id] ?? "",
          decided_by: user?.id ?? null,
          decided_at: new Date().toISOString(),
        })
        .eq("id", args.id);
      if (error) throw error;
    },
    onSuccess: () => {
      setNote("Decision recorded.");
      invalidate();
    },
    onError: (e: Error) => setNote(e.message),
  });

  const setStatus = useMutation({
    mutationFn: async (args: { id: string; status: string }) => {
      const { error } = await supabase
        .from("owner_requests")
        .update({ status: args.status })
        .eq("id", args.id);
      if (error) throw error;
    },
    onSuccess: () => {
      setNote("Status updated.");
      invalidate();
    },
    onError: (e: Error) => setNote(e.message),
  });

  const removeRequest = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("owner_requests").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      setNote("Item removed.");
      invalidate();
    },
    onError: (e: Error) => setNote(e.message),
  });

  async function openAttachment(path: string) {
    const { data, error } = await supabase.storage.from("owner-approvals").createSignedUrl(path, 3600);
    if (error || !data?.signedUrl) {
      setNote(error?.message ?? "Could not open the file");
      return;
    }
    window.open(data.signedUrl, "_blank");
  }

  const openCount = requests.filter((r) => r.status === "open").length;
  const approvedCount = requests.filter((r) => r.status === "approved").length;
  const rejectedCount = requests.filter((r) => r.status === "rejected").length;
  const pendingOwners = decisions.filter((d) => d.decision === "pending").length;

  return (
    <Shell title="Owner Approvals">
      <div className="space-y-6">
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/80">
            Money &amp; owners
          </p>
          <h1 className="flex items-center gap-3 text-2xl font-extrabold uppercase tracking-tight text-foreground sm:text-3xl">
            <ShieldCheck className="h-7 w-7 text-primary" />
            Owner Approvals &amp; Suggestions
          </h1>
          <p className="max-w-3xl text-sm text-muted-foreground">
            Push a note, drawing, photo, PDF or a decision to the owners. Each owner gets an
            approve or reject button, and every response is kept as a written record.
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
          <span className="text-xs text-muted-foreground">
            {owners.length} owner{owners.length === 1 ? "" : "s"} on this project
          </span>
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            disabled={!activeId || !canRaise}
            className="ml-auto inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            Send to owners
          </button>
        </div>

        {note ? (
          <p className="rounded-2xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-foreground">
            {note}
          </p>
        ) : null}

        {projects.length === 0 ? (
          <p className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
            Add a project first — then you can send items to its owners here.
          </p>
        ) : null}

        {owners.length === 0 && activeId ? (
          <p className="rounded-2xl border border-amber-500/40 bg-amber-500/5 p-4 text-sm text-foreground">
            This project has no owners listed yet. Add them on Landowners &amp; Investment so their
            approve / reject buttons appear here.
          </p>
        ) : null}

        {showForm ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              addRequest.mutate();
            }}
            className="grid gap-3 rounded-2xl border border-sky-500/40 bg-sky-500/5 p-4 sm:grid-cols-2"
          >
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:col-span-2">
              Title
              <input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Approve AAC blocks instead of red brick"
                className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-normal normal-case tracking-normal text-foreground"
              />
            </label>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:col-span-2">
              Details / note for the owners
              <textarea
                value={form.body}
                onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                rows={4}
                placeholder="Explain the decision, cost impact and your recommendation."
                className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-normal normal-case tracking-normal text-foreground"
              />
            </label>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Type
              <select
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-normal normal-case tracking-normal text-foreground"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Priority
              <select
                value={form.priority}
                onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-normal normal-case tracking-normal text-foreground"
              >
                <option value="normal">Normal</option>
                <option value="high">Urgent</option>
              </select>
            </label>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Reply needed by
              <input
                type="date"
                value={form.due_date}
                min={today()}
                onChange={(e) => setForm((f) => ({ ...f, due_date: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-normal text-foreground"
              />
            </label>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Attach images / PDF
              <input
                type="file"
                multiple
                accept="image/*,application/pdf"
                onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
                className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-normal normal-case tracking-normal text-foreground"
              />
            </label>
            {files.length > 0 ? (
              <p className="text-xs text-muted-foreground sm:col-span-2">
                {files.length} file{files.length === 1 ? "" : "s"} ready:{" "}
                {files.map((f) => f.name).join(", ")}
              </p>
            ) : null}
            <div className="flex items-end gap-2 sm:col-span-2">
              <button
                type="submit"
                disabled={addRequest.isPending}
                className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
              >
                {addRequest.isPending ? "Sending…" : "Send to owners"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-xl border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Awaiting owners", value: openCount, tone: "border-amber-500/40 bg-amber-500/5" },
            { label: "Approved", value: approvedCount, tone: "border-emerald-600/30 bg-emerald-600/5" },
            { label: "Rejected", value: rejectedCount, tone: "border-destructive/40 bg-destructive/5" },
            { label: "Owner replies pending", value: pendingOwners, tone: "border-primary/40 bg-primary/5" },
          ].map((c) => (
            <div key={c.label} className={`rounded-2xl border p-4 ${c.tone}`}>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {c.label}
              </p>
              <p className="mt-1 text-2xl font-bold text-foreground">{c.value}</p>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          {requestsQuery.isLoading ? (
            <p className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
              Loading owner items…
            </p>
          ) : null}
          {!requestsQuery.isLoading && requests.length === 0 ? (
            <p className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
              Nothing sent to the owners yet. Use <strong>Send to owners</strong> to share a note,
              drawing or a decision.
            </p>
          ) : null}

          {requests.map((r) => {
            const rows = byRequest(r.id);
            const approved = rows.filter((d) => d.decision === "approved").length;
            const rejected = rows.filter((d) => d.decision === "rejected").length;
            return (
              <article key={r.id} className="space-y-4 rounded-2xl border border-border bg-card p-5">
                <div className="flex flex-wrap items-start gap-3">
                  <div className="min-w-[220px] flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-primary/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-primary">
                        {CATEGORIES.find((c) => c.value === r.category)?.label ?? r.category}
                      </span>
                      {r.priority === "high" ? (
                        <span className="rounded-full bg-destructive/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-destructive">
                          Urgent
                        </span>
                      ) : null}
                      <span className="rounded-full border border-border px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        {r.status}
                      </span>
                    </div>
                    <h2 className="text-lg font-bold text-foreground">{r.title}</h2>
                    {r.body ? <p className="text-sm text-muted-foreground">{r.body}</p> : null}
                    <p className="text-xs text-muted-foreground">
                      Raised {new Date(r.created_at).toLocaleDateString("en-IN")}
                      {r.raised_by_name ? ` by ${r.raised_by_name}` : ""}
                      {r.due_date ? ` · reply by ${r.due_date}` : ""} · {approved} approved,{" "}
                      {rejected} rejected of {rows.length}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {canRaise && r.status === "open" ? (
                      <>
                        <button
                          type="button"
                          onClick={() => setStatus.mutate({ id: r.id, status: "approved" })}
                          className="rounded-xl border border-emerald-600/40 bg-emerald-600/10 px-3 py-2 text-xs font-semibold text-emerald-700"
                        >
                          Close as approved
                        </button>
                        <button
                          type="button"
                          onClick={() => setStatus.mutate({ id: r.id, status: "rejected" })}
                          className="rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs font-semibold text-destructive"
                        >
                          Close as rejected
                        </button>
                      </>
                    ) : null}
                    {canDelete ? (
                      <button
                        type="button"
                        onClick={() => removeRequest.mutate(r.id)}
                        className="rounded-xl border border-border bg-background p-2 text-muted-foreground"
                        aria-label="Delete item"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    ) : null}
                  </div>
                </div>

                {(r.attachments ?? []).length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {(r.attachments ?? []).map((a) => (
                      <button
                        key={a.path}
                        type="button"
                        onClick={() => openAttachment(a.path)}
                        className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground"
                      >
                        {a.type.includes("pdf") ? (
                          <FileText className="h-4 w-4 text-primary" />
                        ) : (
                          <Paperclip className="h-4 w-4 text-primary" />
                        )}
                        {a.name}
                      </button>
                    ))}
                  </div>
                ) : null}

                <div className="overflow-x-auto rounded-xl border border-border">
                  <table className="min-w-full text-sm">
                    <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                      <tr>
                        <th className="px-4 py-2 text-left">Owner</th>
                        <th className="px-4 py-2 text-left">Decision</th>
                        <th className="px-4 py-2 text-left">Comment</th>
                        <th className="px-4 py-2 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {rows.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-4 py-4 text-sm text-muted-foreground">
                            No owners were attached to this item.
                          </td>
                        </tr>
                      ) : null}
                      {rows.map((d) => (
                        <tr key={d.id}>
                          <td className="px-4 py-3">
                            <p className="font-semibold text-foreground">{d.owner_name}</p>
                            <p className="text-xs text-muted-foreground">{d.owner_role}</p>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider ${
                                d.decision === "approved"
                                  ? "bg-emerald-600/10 text-emerald-700"
                                  : d.decision === "rejected"
                                    ? "bg-destructive/10 text-destructive"
                                    : "bg-muted text-muted-foreground"
                              }`}
                            >
                              {d.decision === "approved" ? (
                                <CheckCircle2 className="h-3 w-3" />
                              ) : d.decision === "rejected" ? (
                                <XCircle className="h-3 w-3" />
                              ) : (
                                <MessageSquare className="h-3 w-3" />
                              )}
                              {d.decision}
                            </span>
                            {d.decided_at ? (
                              <p className="mt-1 text-xs text-muted-foreground">
                                {new Date(d.decided_at).toLocaleString("en-IN")}
                              </p>
                            ) : null}
                          </td>
                          <td className="px-4 py-3">
                            {d.decision === "pending" ? (
                              <input
                                value={comments[d.id] ?? ""}
                                onChange={(e) =>
                                  setComments((c) => ({ ...c, [d.id]: e.target.value }))
                                }
                                placeholder="Owner remark (optional)"
                                className="w-full min-w-[160px] rounded-xl border border-border bg-background px-3 py-2 text-sm"
                              />
                            ) : (
                              <span className="text-sm text-muted-foreground">{d.comment || "—"}</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => decide.mutate({ id: d.id, decision: "approved" })}
                                className={`rounded-xl px-3 py-2 text-xs font-semibold ${
                                  d.decision === "approved"
                                    ? "border border-border bg-background text-muted-foreground"
                                    : "bg-emerald-600 text-white"
                                }`}
                              >
                                Approve
                              </button>
                              <button
                                type="button"
                                onClick={() => decide.mutate({ id: d.id, decision: "rejected" })}
                                className={`rounded-xl px-3 py-2 text-xs font-semibold ${
                                  d.decision === "rejected"
                                    ? "border border-border bg-background text-muted-foreground"
                                    : "border border-destructive/40 bg-destructive/10 text-destructive"
                                }`}
                              >
                                Reject
                              </button>

                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </Shell>
  );
}
