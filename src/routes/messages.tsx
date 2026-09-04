import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Send,
  Hash,
  Trash2,
  CheckSquare,
  Square,
  Calendar,
  User,
  AlertCircle,
  Paperclip,
  X,
  FileText,
  Users,
} from "lucide-react";
import { Shell } from "@/components/saha/Shell";
import { supabase } from "@/integrations/supabase/client";
import { roles } from "@/components/saha/nav";
import { useSessionUser } from "@/lib/access";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/messages")({
  head: () => ({
    meta: [
      { title: "Team Chat — Saha OS" },
      {
        name: "description",
        content:
          "Internal site chat for the Saha OS crew: message people directly, use groups, share files and assign tasks.",
      },
      { property: "og:title", content: "Team Chat — Saha OS" },
      {
        property: "og:description",
        content: "Direct messages, group channels, attachments and assigned tasks with instant alerts.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Messages,
});

type Attachment = { path: string; name: string; type: string; size: number };

type Message = {
  id: string;
  channel: string;
  author_name: string;
  author_role: string;
  body: string;
  created_at: string;
  recipient_id: string | null;
  sender_id: string | null;
  project_id: string | null;
  is_task: boolean;
  due_date: string | null;
  attachments: Attachment[] | null;
};

type Member = {
  id: string;
  full_name: string;
  email: string;
  status: string;
};

const groups = [
  { id: "general", label: "General" },
  { id: "site", label: "Site execution" },
  { id: "purchase", label: "Purchase & stores" },
  { id: "accounts", label: "Accounts" },
  { id: "qa", label: "QA & safety" },
];

const DIRECT = "direct";

type Conversation = { kind: "group"; id: string; label: string } | { kind: "dm"; id: string; label: string };

function timeOf(iso: string) {
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function isImage(a: Attachment) {
  return a.type.startsWith("image/");
}

function AttachmentChip({ file }: { file: Attachment }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    supabase.storage
      .from("chat-attachments")
      .createSignedUrl(file.path, 3600)
      .then(({ data }) => {
        if (active) setUrl(data?.signedUrl ?? null);
      });
    return () => {
      active = false;
    };
  }, [file.path]);

  if (isImage(file) && url) {
    return (
      <a href={url} target="_blank" rel="noreferrer" className="block">
        <img
          src={url}
          alt={file.name}
          className="max-h-44 rounded-lg border border-border object-cover"
          loading="lazy"
        />
      </a>
    );
  }
  return (
    <a
      href={url ?? undefined}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1.5 rounded-md border border-border bg-secondary px-2 py-1 text-[12px] font-medium text-secondary-foreground hover:bg-muted"
    >
      <FileText className="size-3.5" /> {file.name}
    </a>
  );
}

function Messages() {
  const qc = useQueryClient();
  const user = useSessionUser();
  const [conv, setConv] = useState<Conversation>({ kind: "group", id: "general", label: "General" });
  const [body, setBody] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<string>(roles[0]);
  const [isTask, setIsTask] = useState(false);
  const [dueDate, setDueDate] = useState("");
  const [projectId, setProjectId] = useState<string>("");
  const [files, setFiles] = useState<File[]>([]);
  const endRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setName(localStorage.getItem("saha.chat.name") ?? "Site user");
    setRole(localStorage.getItem("saha.role") ?? roles[0]);
    const storedProject = localStorage.getItem("saha-active-project-id");
    if (storedProject) setProjectId(storedProject);
    inputRef.current?.focus();
  }, []);

  const { data: members = [] } = useQuery({
    queryKey: ["profiles", "approved-members"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id,full_name,email,status")
        .eq("status", "approved")
        .order("full_name", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Member[];
    },
  });

  const people = useMemo(() => members.filter((m) => m.id !== user?.id), [members, user?.id]);

  const { data: projects = [] } = useQuery({
    queryKey: ["site_projects", "chat-selector"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_projects")
        .select("id,name")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: unreadBySender = {} } = useQuery({
    queryKey: ["notifications", "chat-unread-by-sender", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("sender_id,is_read,category")
        .eq("is_read", false)
        .eq("recipient_id", user!.id);
      if (error) throw error;
      const map: Record<string, number> = {};
      for (const n of data ?? []) {
        if (n.sender_id) map[n.sender_id] = (map[n.sender_id] ?? 0) + 1;
      }
      return map;
    },
    refetchInterval: 8000,
  });

  const { data = [], isLoading } = useQuery({
    queryKey: ["team_messages", conv.kind, conv.id, user?.id],
    queryFn: async () => {
      let q = supabase.from("team_messages").select("*");
      if (conv.kind === "group") {
        q = q.eq("channel", conv.id);
      } else {
        q = q
          .eq("channel", DIRECT)
          .or(
            `and(sender_id.eq.${user?.id},recipient_id.eq.${conv.id}),and(sender_id.eq.${conv.id},recipient_id.eq.${user?.id})`,
          );
      }
      const { data, error } = await q.order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Message[];
    },
    enabled: conv.kind === "group" || Boolean(user?.id),
    refetchInterval: 8000,
  });

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "nearest" });
  }, [data.length, conv.id]);

  const send = useMutation({
    mutationFn: async () => {
      const text = body.trim();
      if (!text && files.length === 0) return;
      const senderId = user?.id ?? null;

      const uploaded: Attachment[] = [];
      for (const f of files) {
        const path = `${senderId ?? "anon"}/${Date.now()}-${f.name.replace(/[^\w.\-]+/g, "_")}`;
        const { error } = await supabase.storage.from("chat-attachments").upload(path, f, {
          contentType: f.type || "application/octet-stream",
        });
        if (error) throw error;
        uploaded.push({ path, name: f.name, type: f.type, size: f.size });
      }

      const recipientId = conv.kind === "dm" ? conv.id : null;
      const insert = {
        channel: conv.kind === "dm" ? DIRECT : conv.id,
        author_name: name.trim() || "Site user",
        author_role: role,
        body: text,
        sender_id: senderId,
        recipient_id: recipientId,
        project_id: projectId || null,
        is_task: isTask,
        due_date: dueDate || null,
        attachments: uploaded,
      };
      const { data: msg, error } = await supabase
        .from("team_messages")
        .insert(insert)
        .select("id")
        .single();
      if (error) throw error;

      if (recipientId && recipientId !== senderId) {
        const project = projects.find((p) => p.id === projectId);
        const who = name.trim() || "Site user";
        await supabase.from("notifications").insert({
          title: isTask ? `New task assigned by ${who}` : `New message from ${who}`,
          body:
            (text || `${uploaded.length} attachment${uploaded.length === 1 ? "" : "s"}`) +
            (project ? ` · Project: ${project.name}` : "") +
            (isTask && dueDate ? ` · Due: ${dueDate}` : ""),
          category: isTask ? "Task" : "Chat",
          priority: isTask ? "High" : "Normal",
          link: "/messages",
          recipient_id: recipientId,
          sender_id: senderId,
          project_id: projectId || null,
        });
      }
      return msg;
    },
    onSuccess: () => {
      setBody("");
      setIsTask(false);
      setDueDate("");
      setFiles([]);
      void qc.invalidateQueries({ queryKey: ["team_messages"] });
      void qc.invalidateQueries({ queryKey: ["notifications"] });
      inputRef.current?.focus();
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("team_messages").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["team_messages"] }),
  });

  const canSend = (body.trim() || files.length > 0) && !send.isPending;

  return (
    <Shell
      title="Team Chat"
      subtitle="Message people directly or post in a group — recipients get notified instantly"
    >
      <div className="grid gap-4 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="rounded-xl border border-border bg-card p-2">
          <p className="label-caps flex items-center gap-1.5 px-2 py-1 text-muted-foreground">
            <User className="size-3" /> People
          </p>
          <div className="flex gap-1.5 overflow-x-auto lg:flex-col lg:overflow-visible">
            {people.map((m) => {
              const active = conv.kind === "dm" && conv.id === m.id;
              const unread = unreadBySender[m.id] ?? 0;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setConv({ kind: "dm", id: m.id, label: m.full_name || m.email })}
                  className={cn(
                    "flex shrink-0 items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[13px] font-medium transition-colors",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                  )}
                >
                  <span className="grid size-5 shrink-0 place-items-center rounded-full bg-primary-soft text-[9px] font-bold text-primary">
                    {(m.full_name || m.email).slice(0, 2).toUpperCase()}
                  </span>
                  <span className="truncate">{m.full_name || m.email}</span>
                  {unread > 0 && (
                    <span className="ml-auto grid size-4 shrink-0 place-items-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground">
                      {unread > 9 ? "9+" : unread}
                    </span>
                  )}
                </button>
              );
            })}
            {people.length === 0 && (
              <p className="px-2 py-1 text-[12px] text-muted-foreground">No approved teammates yet.</p>
            )}
          </div>

          <p className="label-caps mt-3 flex items-center gap-1.5 border-t border-border px-2 pb-1 pt-3 text-muted-foreground">
            <Users className="size-3" /> Groups
          </p>
          <div className="flex gap-1.5 overflow-x-auto lg:flex-col lg:overflow-visible">
            {groups.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setConv({ kind: "group", id: c.id, label: c.label })}
                className={cn(
                  "flex shrink-0 items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[13px] font-medium transition-colors",
                  conv.kind === "group" && conv.id === c.id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                )}
              >
                <Hash className="size-3.5" /> {c.label}
              </button>
            ))}
          </div>

          <div className="mt-3 border-t border-border px-2 pt-3">
            <label className="label-caps text-muted-foreground" htmlFor="chat-name">
              Your name
            </label>
            <input
              id="chat-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                localStorage.setItem("saha.chat.name", e.target.value);
              }}
              className="mt-1 w-full rounded-md border border-input bg-background px-2 py-1.5 text-[13px]"
              placeholder="Name"
            />
            <p className="mt-2 text-[11px] text-muted-foreground">Posting as {role}</p>
          </div>
        </aside>

        <section className="flex min-h-[60vh] flex-col rounded-xl border border-border bg-card">
          <header className="flex items-center gap-2 border-b border-border px-4 py-3">
            {conv.kind === "dm" ? <User className="size-4 text-primary" /> : <Hash className="size-4 text-primary" />}
            <h2 className="text-[14px] font-bold text-foreground">{conv.label}</h2>
            <span className="text-[11px] text-muted-foreground">
              {conv.kind === "dm" ? "Direct message" : "Group"}
            </span>
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {isLoading && <p className="text-[13px] text-muted-foreground">Loading messages…</p>}
            {!isLoading && data.length === 0 && (
              <p className="text-[13px] text-muted-foreground">
                No messages here yet — start the conversation below.
              </p>
            )}
            {data.map((m) => (
              <article
                key={m.id}
                className={cn(
                  "group rounded-lg border p-3",
                  m.is_task && m.recipient_id
                    ? "border-primary/40 bg-primary-soft/30"
                    : "border-border bg-background",
                )}
              >
                <header className="flex flex-wrap items-center gap-2">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary-soft text-[10px] font-bold text-primary">
                    {m.author_name.slice(0, 2).toUpperCase()}
                  </span>
                  <span className="text-[13px] font-semibold text-foreground">{m.author_name}</span>
                  <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] font-semibold text-secondary-foreground">
                    {m.author_role}
                  </span>
                  {m.is_task && (
                    <span className="inline-flex items-center gap-1 rounded bg-warning-soft px-1.5 py-0.5 text-[10px] font-semibold text-warning">
                      <CheckSquare className="size-3" /> Task
                    </span>
                  )}
                  <span className="text-[11px] text-muted-foreground">{timeOf(m.created_at)}</span>
                  <button
                    type="button"
                    onClick={() => remove.mutate(m.id)}
                    aria-label="Delete message"
                    className="ml-auto text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </header>
                {m.body && (
                  <p className="mt-1.5 whitespace-pre-wrap text-[13.5px] leading-relaxed text-foreground">
                    {m.body}
                  </p>
                )}
                {Array.isArray(m.attachments) && m.attachments.length > 0 && (
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {m.attachments.map((a) => (
                      <AttachmentChip key={a.path} file={a} />
                    ))}
                  </div>
                )}
                {m.due_date && (
                  <p className="mt-2 inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Calendar className="size-3" /> Due {new Date(m.due_date).toLocaleDateString("en-IN")}
                  </p>
                )}
              </article>
            ))}
            <div ref={endRef} />
          </div>

          <form
            className="flex flex-col gap-3 border-t border-border p-3"
            onSubmit={(e) => {
              e.preventDefault();
              send.mutate();
            }}
          >
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={projectId}
                onChange={(e) => {
                  setProjectId(e.target.value);
                  localStorage.setItem("saha-active-project-id", e.target.value);
                }}
                className="rounded-md border border-input bg-background px-2 py-1.5 text-[13px]"
              >
                <option value="">No project</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => setIsTask((v) => !v)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-[12px] font-medium transition-colors",
                  isTask
                    ? "border-warning bg-warning-soft text-warning"
                    : "border-input text-muted-foreground hover:bg-muted",
                )}
              >
                {isTask ? <CheckSquare className="size-3.5" /> : <Square className="size-3.5" />}
                Task
              </button>

              {isTask && (
                <div className="flex items-center gap-2">
                  <Calendar className="size-3.5 text-muted-foreground" />
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="rounded-md border border-input bg-background px-2 py-1.5 text-[13px]"
                  />
                </div>
              )}

              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="inline-flex items-center gap-1.5 rounded-md border border-input px-2.5 py-1.5 text-[12px] font-medium text-muted-foreground transition-colors hover:bg-muted"
              >
                <Paperclip className="size-3.5" /> Attach
              </button>
              <input
                ref={fileRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => {
                  setFiles((prev) => [...prev, ...Array.from(e.target.files ?? [])]);
                  e.target.value = "";
                }}
              />
            </div>

            {files.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {files.map((f, i) => (
                  <span
                    key={`${f.name}-${i}`}
                    className="inline-flex items-center gap-1.5 rounded-md border border-border bg-secondary px-2 py-1 text-[12px] text-secondary-foreground"
                  >
                    <FileText className="size-3.5" /> {f.name}
                    <button
                      type="button"
                      aria-label={`Remove ${f.name}`}
                      onClick={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {conv.kind === "group" && people.length === 0 && (
              <div className="flex items-center gap-2 rounded-md border border-warning/30 bg-warning-soft px-3 py-2 text-[12px] text-warning">
                <AlertCircle className="size-3.5" />
                <span>No approved teammates yet for direct messages.</span>
                <Link to="/access-control" className="ml-auto font-semibold underline">
                  Approve users
                </Link>
              </div>
            )}

            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                rows={2}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send.mutate();
                  }
                }}
                placeholder={
                  isTask
                    ? "Describe the task…"
                    : conv.kind === "dm"
                      ? `Message ${conv.label}… (Enter to send)`
                      : "Message the group… (Enter to send, Shift+Enter for a new line)"
                }
                className="min-h-[46px] flex-1 resize-y rounded-lg border border-input bg-background px-3 py-2 text-[13.5px]"
              />
              <button
                type="submit"
                disabled={!canSend}
                className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground disabled:opacity-50"
                aria-label="Send message"
              >
                <Send className="size-4" />
              </button>
            </div>
          </form>
          {send.isError && (
            <p className="px-3 pb-3 text-[12px] text-destructive">
              Could not send. Check the connection or file size and try again.
            </p>
          )}
        </section>
      </div>
    </Shell>
  );
}
