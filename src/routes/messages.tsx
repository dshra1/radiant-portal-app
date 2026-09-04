import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Send, Hash, Trash2 } from "lucide-react";
import { Shell } from "@/components/saha/Shell";
import { supabase } from "@/integrations/supabase/client";
import { roles } from "@/components/saha/nav";

export const Route = createFileRoute("/messages")({
  head: () => ({
    meta: [
      { title: "Team Chat — Saha OS Next" },
      {
        name: "description",
        content:
          "Internal site chat for the Saha OS crew: general, site, purchase and accounts channels shared live across every device.",
      },
      { property: "og:title", content: "Team Chat — Saha OS Next" },
      {
        property: "og:description",
        content: "Channel-based internal chat for site, purchase and accounts teams.",
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
  const [channel, setChannel] = useState("general");
  const [body, setBody] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<string>(roles[0]);
  const endRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setName(localStorage.getItem("saha.chat.name") ?? "Site user");
    setRole(localStorage.getItem("saha.role") ?? roles[0]);
    inputRef.current?.focus();
  }, []);

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
      const { error } = await supabase.from("team_messages").insert({
        channel,
        author_name: name.trim() || "Site user",
        author_role: role,
        body: text,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setBody("");
      void qc.invalidateQueries({ queryKey: ["team_messages", channel] });
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

  return (
    <Shell title="Team Chat" subtitle="Internal chat shared live across every device on this workspace">
      <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="rounded-xl border border-border bg-card p-2">
          <p className="label-caps px-2 py-1 text-muted-foreground">Channels</p>
          <div className="flex gap-1.5 overflow-x-auto lg:flex-col lg:overflow-visible">
            {channels.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setChannel(c.id)}
                className={`flex shrink-0 items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[13px] font-medium transition-colors ${
                  channel === c.id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
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
              <article key={m.id} className="group rounded-lg border border-border bg-background p-3">
                <header className="flex flex-wrap items-center gap-2">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary-soft text-[10px] font-bold text-primary">
                    {m.author_name.slice(0, 2).toUpperCase()}
                  </span>
                  <span className="text-[13px] font-semibold text-foreground">{m.author_name}</span>
                  <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] font-semibold text-secondary-foreground">
                    {m.author_role}
                  </span>
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
              </article>
            ))}
            <div ref={endRef} />
          </div>

          <form
            className="flex items-end gap-2 border-t border-border p-3"
            onSubmit={(e) => {
              e.preventDefault();
              send.mutate();
            }}
          >
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
              placeholder="Message the team… (Enter to send, Shift+Enter for a new line)"
              className="min-h-[46px] flex-1 resize-y rounded-lg border border-input bg-background px-3 py-2 text-[13.5px]"
            />
            <button
              type="submit"
              disabled={!body.trim() || send.isPending}
              className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground disabled:opacity-50"
              aria-label="Send message"
            >
              <Send className="size-4" />
            </button>
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
