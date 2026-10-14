import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bot, MessageSquarePlus, Trash2 } from "lucide-react";
import { Shell } from "@/components/saha/Shell";
import { supabase } from "@/integrations/supabase/client";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputSubmit,
} from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/ai/$threadId")({
  head: () => ({
    meta: [
      { title: "Saha AI Assistant — Saha OS" },
      {
        name: "description",
        content:
          "Chat with the Saha AI Assistant about live projects, budgets, site alerts and team activity.",
      },
      { property: "og:title", content: "Saha AI Assistant — Saha OS" },
      {
        property: "og:description",
        content: "AI assistant grounded in your live Saha OS project data.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AiThread,
});

const suggestions = [
  "Which projects are behind on budget right now?",
  "Summarise today's unread site alerts",
  "What is the total committed spend across all projects?",
  "Any risks I should escalate from recent team chat?",
];

function AiThread() {
  const { threadId } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [pageError, setPageError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const threadsQuery = useQuery({
    queryKey: ["ai_threads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_threads")
        .select("id,title,updated_at")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
  const threads = threadsQuery.data ?? [];

  const historyQuery = useQuery({
    queryKey: ["ai_messages", threadId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_messages")
        .select("id,role,content")
        .eq("thread_id", threadId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []).map((m): UIMessage => ({
        id: m.id,
        role: m.role === "assistant" ? "assistant" : "user",
        parts: [{ type: "text", text: m.content }],
      }));
    },
    // the chat is seeded once from history; don't refetch it under a live chat
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });

  async function newThread() {
    setPageError(null);
    const { data, error } = await supabase
      .from("ai_threads")
      .insert({ title: "New conversation" })
      .select("id")
      .single();
    if (error || !data) {
      setPageError(`Could not start a new conversation: ${error?.message ?? "no reply"}`);
      return;
    }
    void qc.invalidateQueries({ queryKey: ["ai_threads"] });
    void navigate({ to: "/ai/$threadId", params: { threadId: data.id } });
  }

  async function deleteThread(id: string) {
    setPageError(null);
    setDeleting(true);
    try {
      const { error } = await supabase.from("ai_threads").delete().eq("id", id);
      if (error) throw error;
      setConfirmDelete(null);
      void qc.invalidateQueries({ queryKey: ["ai_threads"] });
      qc.removeQueries({ queryKey: ["ai_messages", id] });
      if (id === threadId) void navigate({ to: "/ai" });
    } catch (e) {
      setPageError(
        `Could not delete the conversation: ${e instanceof Error ? e.message : String(e)}`,
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Shell
      title="Saha AI Assistant"
      subtitle="Grounded in your live projects, budgets, alerts and team chat"
      actions={
        <button
          type="button"
          onClick={() => void newThread()}
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-[13px] font-semibold text-primary-foreground hover:bg-primary-hover"
        >
          <MessageSquarePlus className="size-4" /> New chat
        </button>
      }
    >
      {pageError && (
        <p className="mb-3 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {pageError}
        </p>
      )}
      <div className="grid gap-4 lg:grid-cols-[16rem_minmax(0,1fr)]">
        <aside className="hidden max-h-[70vh] overflow-y-auto rounded-xl border border-border bg-card p-2 lg:block">
          <p className="label-caps px-2 py-1 text-muted-foreground">Conversations</p>
          {threadsQuery.isError && (
            <p className="px-2 py-2 text-xs text-destructive">
              Could not load conversations.{" "}
              <button
                type="button"
                onClick={() => void threadsQuery.refetch()}
                className="font-semibold underline"
              >
                Retry
              </button>
            </p>
          )}
          {!threadsQuery.isError && threads.length === 0 && (
            <p className="px-2 py-2 text-xs text-muted-foreground">No conversations yet.</p>
          )}
          {threads.map((t) => (
            <div
              key={t.id}
              className={cn(
                "group rounded-lg px-2 py-1.5",
                t.id === threadId ? "bg-secondary" : "hover:bg-secondary/60",
              )}
            >
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => void navigate({ to: "/ai/$threadId", params: { threadId: t.id } })}
                  className="min-w-0 flex-1 truncate text-left text-[13px] font-medium"
                >
                  {t.title}
                </button>
                <button
                  type="button"
                  aria-label="Delete conversation"
                  onClick={() => setConfirmDelete(t.id)}
                  className="shrink-0 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
              {confirmDelete === t.id && (
                <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11.5px]">
                  <span className="font-semibold text-destructive">Delete this conversation?</span>
                  <button
                    type="button"
                    disabled={deleting}
                    onClick={() => void deleteThread(t.id)}
                    className="rounded bg-destructive px-2 py-0.5 font-semibold text-destructive-foreground disabled:opacity-50"
                  >
                    {deleting ? "Deleting…" : "Delete"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(null)}
                    className="rounded border border-border px-2 py-0.5 font-semibold text-muted-foreground"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          ))}
        </aside>

        {historyQuery.isPending ? (
          <section className="flex h-[70vh] min-h-[28rem] items-center justify-center rounded-xl border border-border bg-card text-sm text-muted-foreground">
            Loading conversation…
          </section>
        ) : historyQuery.isError ? (
          <section className="flex h-[70vh] min-h-[28rem] flex-col items-center justify-center gap-2 rounded-xl border border-border bg-card p-6 text-center text-sm">
            <p className="text-destructive">
              Could not load this conversation: {(historyQuery.error as Error).message}
            </p>
            <button
              type="button"
              onClick={() => void historyQuery.refetch()}
              className="rounded-md border border-border px-3 py-1.5 font-semibold hover:bg-secondary"
            >
              Retry
            </button>
          </section>
        ) : (
          // mounted only once history is loaded, so the chat starts with the past messages
          <ChatPane key={threadId} threadId={threadId} history={historyQuery.data} />
        )}
      </div>
    </Shell>
  );
}

function ChatPane({ threadId, history }: { threadId: string; history: UIMessage[] }) {
  const qc = useQueryClient();
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: { threadId },
        fetch: async (input, init) => {
          const { data } = await supabase.auth.getSession();
          const headers = new Headers(init?.headers);
          if (data.session) headers.set("Authorization", `Bearer ${data.session.access_token}`);
          return fetch(input, { ...init, headers });
        },
      }),
    [threadId],
  );

  const { messages, sendMessage, status } = useChat({
    id: threadId,
    messages: history,
    transport,
    onError: (e) => setError(e.message || "The assistant could not respond. Please try again."),
    onFinish: () => {
      void qc.invalidateQueries({ queryKey: ["ai_threads"] });
      textareaRef.current?.focus();
    },
  });

  useEffect(() => {
    textareaRef.current?.focus();
  }, [threadId]);

  const busy = status === "submitted" || status === "streaming";

  async function submit(text: string) {
    const value = text.trim();
    if (!value || busy) return;
    setError(null);
    setInput("");
    try {
      await sendMessage({ text: value });
    } catch (e) {
      setError(e instanceof Error ? e.message : "The assistant could not respond.");
    }
  }

  return (
    <section className="flex h-[70vh] min-h-[28rem] flex-col overflow-hidden rounded-xl border border-border bg-card">
      <Conversation className="flex-1">
        <ConversationContent>
          {messages.length === 0 && (
            <ConversationEmptyState
              icon={<Bot className="size-6 text-primary" />}
              title="Ask Saha AI"
              description="I can read your live projects, budgets, alerts and team chat."
            >
              <div className="mt-3 flex flex-wrap justify-center gap-2">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => void submit(s)}
                    className="rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </ConversationEmptyState>
          )}

          {messages.map((m) => {
            const text = m.parts.map((p) => (p.type === "text" ? p.text : "")).join("");
            return (
              <Message key={m.id} from={m.role}>
                <MessageContent>
                  <MessageResponse>{text}</MessageResponse>
                </MessageContent>
              </Message>
            );
          })}

          {status === "submitted" && <Shimmer>Thinking…</Shimmer>}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      {error && (
        <p className="border-t border-border bg-destructive/10 px-4 py-2 text-xs text-destructive">
          {error}
        </p>
      )}

      <div className="border-t border-border p-3">
        <PromptInput
          onSubmit={(_, e) => {
            e.preventDefault();
            void submit(input);
          }}
        >
          <PromptInputTextarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about projects, BOQ, budgets, vendors or site alerts…"
          />
          <PromptInputFooter className="justify-end">
            <PromptInputSubmit status={status} disabled={!input.trim() || busy} />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </section>
  );
}
