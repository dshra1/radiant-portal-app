import { useEffect, useRef, useState } from "react";
import { MessageCircleQuestion, Send, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useActiveProject } from "@/hooks/useActiveProject";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

type Table = { title: string; columns: string[]; rows: (string | number)[][]; note?: string };
type Intent = { kind: "stock" | "low" | "stage" | "upcoming" | "now" | "boq" | "pos"; q?: string; days?: number };
type Msg = { role: "user" | "assistant"; text: string; tables?: Table[] | undefined; error?: boolean };
type Mode = null | "stock" | "stage" | "boq";

const QUICK: { label: string; intent?: Intent; mode?: Mode; hint?: string }[] = [
  { label: "What's low in stock?", intent: { kind: "low" } },
  { label: "Material needed in the next 2 weeks", intent: { kind: "upcoming", days: 14 } },
  { label: "What's on site now?", intent: { kind: "now" } },
  { label: "Stock of a material…", mode: "stock", hint: "Type a material, e.g. cement, 12 mm steel" },
  { label: "Material for an activity…", mode: "stage", hint: "Type a stage or activity, e.g. 3rd floor slab, plastering" },
  { label: "BOQ quantity of an item…", mode: "boq", hint: "Type a BOQ item, e.g. M25 concrete" },
  { label: "POs awaiting approval or delivery", intent: { kind: "pos" } },
];

/** Floating "Ask" assistant: tap a question for an instant answer from the app's data, or type anything. */
export function AskPanel() {
  const project = useActiveProject();
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [mode, setMode] = useState<Mode>(null);
  const [busy, setBusy] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => end.current?.scrollIntoView({ behavior: "smooth", block: "end" }), [msgs, busy]);

  async function call(body: Record<string, unknown>) {
    const { data } = await supabase.auth.getSession();
    const r = await fetch("/api/ask", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(data.session ? { Authorization: `Bearer ${data.session.access_token}` } : {}),
      },
      body: JSON.stringify({ projectId: project.id, ...body }),
    });
    const j = (await r.json().catch(() => ({}))) as { text?: string; tables?: Table[]; error?: string };
    if (!r.ok || j.error) throw Object.assign(new Error(j.error || "Something went wrong"), { tables: j.tables });
    return j;
  }

  async function ask(label: string, payload: Record<string, unknown>) {
    setMsgs((m) => [...m, { role: "user", text: label }]);
    setBusy(true);
    try {
      const j = await call(payload);
      setMsgs((m) => [...m, { role: "assistant", text: j.text || "", tables: j.tables ?? [] }]);
    } catch (e) {
      setMsgs((m) => [...m, { role: "assistant", text: (e as Error).message, tables: (e as { tables?: Table[] }).tables, error: true }]);
    } finally {
      setBusy(false);
    }
  }

  function submit() {
    const v = text.trim();
    if (!v || busy) return;
    setText("");
    if (mode) {
      const m = mode;
      setMode(null);
      return ask(v, { intent: { kind: m, q: v } });
    }
    const history = msgs.filter((m) => m.text && !m.error).slice(-8).map((m) => ({ role: m.role, text: m.text }));
    return ask(v, { question: v, history });
  }

  const hint = QUICK.find((q) => q.mode && q.mode === mode)?.hint;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Ask about stock, material and site"
        className="fixed bottom-36 right-4 z-30 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-card px-4 py-3 text-[13px] font-semibold text-foreground shadow-lg transition-colors hover:bg-secondary md:bottom-[8.5rem]"
      >
        <MessageCircleQuestion className="size-4 text-primary" />
        <span className="hidden sm:inline">Ask</span>
      </button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-lg">
          <SheetHeader className="border-b border-border px-4 py-3 text-left">
            <SheetTitle className="text-base">Ask</SheetTitle>
            <p className="text-[12px] text-muted-foreground">
              {project.name} · stock, material per activity, BOQ, site and POs
            </p>
          </SheetHeader>

          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
            {msgs.length === 0 && (
              <p className="text-[13px] text-muted-foreground">
                Tap a question for an instant answer from this project's data, or type your own below.
              </p>
            )}
            {msgs.map((m, i) => (
              <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[95%] rounded-2xl px-3 py-2 text-[13px]",
                    m.role === "user" ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground",
                    m.error && "border border-destructive/40",
                  )}
                >
                  {m.text && <p className="whitespace-pre-wrap">{m.text}</p>}
                  {(m.tables ?? []).map((t, k) => (
                    <div key={k} className="mt-2 first:mt-0">
                      <p className="mb-1 text-[12px] font-semibold">{t.title}</p>
                      {t.rows.length > 0 && (
                        <div className="overflow-x-auto rounded-lg border border-border bg-card">
                          <table className="w-full text-[12px]">
                            <thead>
                              <tr className="bg-muted/60">
                                {t.columns.map((c) => (
                                  <th key={c} className="whitespace-nowrap px-2 py-1.5 text-left font-medium">
                                    {c}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {t.rows.map((r, ri) => (
                                <tr key={ri} className="border-t border-border">
                                  {r.map((c, ci) => (
                                    <td
                                      key={ci}
                                      className={cn(
                                        "px-2 py-1.5",
                                        ci > 0 && typeof c === "string" && /^[\d,.]+$/.test(c) && "text-right tabular-nums",
                                        c === "enough" && "text-emerald-600",
                                        t.columns[ci] === "Short by" && c !== "enough" && c !== "—" && "font-semibold text-destructive",
                                      )}
                                    >
                                      {c}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                      {t.note && <p className="mt-1 text-[11px] text-muted-foreground">{t.note}</p>}
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {busy && (
              <p className="flex items-center gap-2 text-[12px] text-muted-foreground">
                <Loader2 className="size-3.5 animate-spin" /> Checking the app…
              </p>
            )}
            <div ref={end} />
          </div>

          <div className="border-t border-border px-4 py-3">
            <div className="mb-2 flex flex-wrap gap-1.5">
              {QUICK.map((q) => (
                <button
                  key={q.label}
                  type="button"
                  disabled={busy || !project.id}
                  onClick={() => (q.intent ? ask(q.label, { intent: q.intent }) : setMode(q.mode ?? null))}
                  className={cn(
                    "rounded-full border border-border px-3 py-1.5 text-[12px] transition-colors hover:bg-secondary disabled:opacity-50",
                    q.mode && q.mode === mode && "border-primary bg-primary/10",
                  )}
                >
                  {q.label}
                </button>
              ))}
            </div>
            <form
              className="flex items-center gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                void submit();
              }}
            >
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={hint ?? "Ask anything: how much cement is in stock? what does the 4th floor slab need?"}
                className="h-11 flex-1 rounded-full border border-border bg-background px-4 text-[14px] outline-none focus:border-primary"
                aria-label="Your question"
              />
              {mode && (
                <button type="button" onClick={() => setMode(null)} aria-label="Cancel" className="rounded-full p-2 hover:bg-secondary">
                  <X className="size-4" />
                </button>
              )}
              <button
                type="submit"
                disabled={busy || !text.trim()}
                aria-label="Send"
                className="inline-flex size-11 items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-50"
              >
                <Send className="size-4" />
              </button>
            </form>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
