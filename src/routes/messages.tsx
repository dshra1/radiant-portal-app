import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Send, Hash, Trash2, CheckSquare, Square, Calendar, User, AlertCircle } from "lucide-react";
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
          "Internal site chat for the Saha OS crew: assign tasks, share updates and get notified across devices.",
      },
      { property: "og:title", content: "Team Chat — Saha OS" },
      {
        property: "og:description",
        content: "Channel-based internal chat with user-assigned tasks and notifications.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Messages,
});

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
};

type Member = {
  id: string;
  full_name: string;
  email: string;
  status: string;
};

const channels = [
  { id: "general", label: "General" },
  { id: "site", label: "Site execution" },
  { id: "purchase", label: "Purchase & stores" },
  { id: "accounts", label: "Accounts" },
  { id: "qa", label: "QA & safety" },
];

function timeOf(iso: string) {
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Messages() {
  const qc = useQueryClient();
  const user = useSessionUser();
  const [channel, setChannel] = useState("general");
  const [body, setBody] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<string>(roles[0]);
  const [recipientId, setRecipientId] = useState<string>("");
  const [isTask, setIsTask] = useState(false);
  const [dueDate, setDueDate] = useState("");
  const [projectId, setProjectId] = useState<string>("");
  const endRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

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

  const { data = [], isLoading } = useQuery({
    queryKey: ["team_messages", channel],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("team_messages")
        .select("*")
        .eq("channel", channel)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Message[];
    },
    refetchInterval: 8000,
  });

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "nearest" });
  }, [data.length, channel]);

  const send = useMutation({
    mutationFn: async () => {
      const text = body.trim();
      if (!text) return;
      const senderId = user?.id;
      const insert: Record<string, unknown> = {
        channel,
        author_name: name.trim() || "Site user",
        author_role: role,
        body: text,
        sender_id: senderId,
        recipient_id: recipientId || null,
        project_id: projectId || null,
        is_task: isTask,
        due_date: dueDate || null,
      };
      const { data: msg, error } = await supabase.from("team_messages").insert(insert).select("id").single();
      if (error) throw error;

      // Notify the assigned user
      if (recipientId && recipientId !== senderId) {
        const recipient = members.find((m) => m.id === recipientId);
        const project = projects.find((p) => p.id === projectId);
        await supabase.from("notifications").insert({
          title: isTask ? `New task assigned by ${name.trim() || "Site user"}` : `New message from ${name.trim() || "Site user"}`,
          body: isTask
            ? `${text}${project ? ` · Project: ${project.name}` : ""}${dueDate ? ` · Due: ${dueDate}` : ""}`
            : text,
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
      setRecipientId("");
      void qc.invalidateQueries({ queryKey: ["team_messages", channel] });
      void qc.invalidateQueries({ queryKey: ["notifications"] });
      inputRef.current?.focus();
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("team_messages").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["team_messages", channel] }),
  });

  const canSend = body.trim() && !send.isPending;

  return (
    <Shell title="Team Chat" subtitle="Assign tasks and share updates — recipients get notified instantly">
      <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="rounded-xl border border-border bg-card p-2">
          <p className="label-caps px-2 py-1 text-muted-foreground">Channels</p>
          <div className="flex gap-1.5 overflow-x-auto lg:flex-col lg:overflow-visible">
            {channels.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setChannel(c.id)}
                className={cn(
                  "flex shrink-0 items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[13px] font-medium transition-colors",
                  channel === c.id
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
          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {isLoading && <p className="text-[13px] text-muted-foreground">Loading messages…</p>}
            {!isLoading && data.length === 0 && (
              <p className="text-[13px] text-muted-foreground">
                No messages in this channel yet — start the conversation below.
              </p>
            )}
            {data.map((m) => (
              <article
                key={m.id}
                className={cn(
                  "group rounded-lg border p-3",
                  m.is_task && m.recipient_id ? "border-primary/40 bg-primary-soft/30" : "border-border bg-background",
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
                  {(() => {
                    const r = members.find((x) => x.id === m.recipient_id);
                    return r ? (
                      <span className="inline-flex items-center gap-1 rounded bg-info-soft px-1.5 py-0.5 text-[10px] font-semibold text-info">
                        <User className="size-3" /> For {r.full_name || r.email}
                      </span>
                    ) : null;
                  })()}
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
                <p className="mt-1.5 whitespace-pre-wrap text-[13.5px] leading-relaxed text-foreground">
                  {m.body}
                </p>
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
            {members.length > 0 && (
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <User className="size-3.5 text-muted-foreground" />
                  <select
                    value={recipientId}
                    onChange={(e) => setRecipientId(e.target.value)}
                    className="rounded-md border border-input bg-background px-2 py-1.5 text-[13px]"
                  >
                    <option value="">Workspace-wide</option>
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.full_name || m.email}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
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
                </div>

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
              </div>
            )}

            {members.length === 0 && (
              <div className="flex items-center gap-2 rounded-md border border-warning/30 bg-warning-soft px-3 py-2 text-[12px] text-warning">
                <AlertCircle className="size-3.5" />
                <span>No approved members available for assignment yet.</span>
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
                placeholder={isTask ? "Describe the task…" : "Message the team… (Enter to send, Shift+Enter for a new line)"}
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
              Could not send the message. Check the connection and try again.
            </p>
          )}
        </section>
      </div>
    </Shell>
  );
}
