import { useEffect, useRef, useState } from "react";
import { MessageCircleQuestion, Send, X, Loader2, Mic } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useActiveProject } from "@/hooks/useActiveProject";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

type Table = { title: string; columns: string[]; rows: (string | number)[][]; note?: string };
type Intent = {
  kind: "stock" | "low" | "stage" | "upcoming" | "now" | "boq" | "pos" | "verify";
  q?: string;
  days?: number;
};
type Proposal = {
  action: Record<string, unknown>;
  title: string;
  lines: [string, string][];
  warnings: string[];
  blocked?: string;
};
type Msg = {
  role: "user" | "assistant";
  text: string;
  tables?: Table[] | undefined;
  proposals?: Proposal[] | undefined;
  error?: boolean;
  done?: string;
};
type Mode = null | "stock" | "stage" | "boq" | "receipt" | "issue" | "progress" | "labour";

const QUICK: { label: string; intent?: Intent; mode?: Mode; hint?: string }[] = [
  { label: "Check entries (last 7 days)", intent: { kind: "verify", days: 7 } },
  {
    label: "Record a receipt…",
    mode: "receipt",
    hint: "e.g. 200 bags cement from Ultratech, PO-45",
  },
  { label: "Record an issue…", mode: "issue", hint: "e.g. 80 bags cement to 4th floor slab" },
  { label: "Update stage progress…", mode: "progress", hint: "e.g. 4th floor slab 60%" },
  {
    label: "Log labour…",
    mode: "labour",
    hint: "e.g. 12 masons, Ramesh contractor, block work 3rd floor",
  },
  { label: "What's low in stock?", intent: { kind: "low" } },
  { label: "Material needed in the next 2 weeks", intent: { kind: "upcoming", days: 14 } },
  { label: "What's on site now?", intent: { kind: "now" } },
  {
    label: "Stock of a material…",
    mode: "stock",
    hint: "Type a material, e.g. cement, 12 mm steel",
  },
  {
    label: "Material for an activity…",
    mode: "stage",
    hint: "Type a stage or activity, e.g. 3rd floor slab, plastering",
  },
  { label: "BOQ quantity of an item…", mode: "boq", hint: "Type a BOQ item, e.g. M25 concrete" },
  { label: "POs awaiting approval or delivery", intent: { kind: "pos" } },
];

/** Connect Alexa: a one-time 6-digit code ties an Echo to this login (read-only answers by voice). */
function AlexaConnect() {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState<{ code: string; minutes: number; say: string } | null>(null);
  const [err, setErr] = useState("");
  async function getCode() {
    setErr("");
    const { data } = await supabase.auth.getSession();
    const r = await fetch("/api/voice", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(data.session ? { Authorization: `Bearer ${data.session.access_token}` } : {}),
      },
      body: JSON.stringify({ action: "code" }),
    });
    const j = (await r.json().catch(() => ({}))) as {
      code?: string;
      minutes?: number;
      say?: string;
      error?: string;
    };
    if (!r.ok || !j.code) setErr(j.error || "Could not make a code. Try again.");
    else setCode({ code: j.code, minutes: j.minutes ?? 10, say: j.say ?? "" });
  }
  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-[12px] hover:bg-muted"
      >
        <Mic className="h-3.5 w-3.5 text-primary" /> Connect Alexa
      </button>
      {open && (
        <div className="mt-2 rounded-xl border border-border bg-card p-3 text-[12px]">
          <p className="text-muted-foreground">
            Ask about stock, stages and orders on your Echo. Alexa answers as you, read-only:
            nothing is saved by voice.
          </p>
          {code ? (
            <div className="mt-2">
              <p>Within {code.minutes} minutes, say to your Echo:</p>
              <p className="mt-1 rounded-lg bg-primary/10 px-3 py-2 text-sm font-semibold">
                “{code.say}”
              </p>
              <p className="mt-1 text-2xl font-bold tabular-nums tracking-[0.3em]">{code.code}</p>
            </div>
          ) : (
            <button
              type="button"
              onClick={getCode}
              className="mt-2 h-10 w-full rounded-full bg-primary text-sm font-semibold text-primary-foreground"
            >
              Get a link code
            </button>
          )}
          {err && <p className="mt-1 text-destructive">{err}</p>}
        </div>
      )}
    </div>
  );
}

/** Floating "Ask" assistant: tap a question for an instant answer from the app's data, or type anything. */
export function AskPanel() {
  const project = useActiveProject();
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [mode, setMode] = useState<Mode>(null);
  const [busy, setBusy] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [msgs, busy]);

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
    const j = (await r.json().catch(() => ({}))) as {
      text?: string;
      tables?: Table[];
      error?: string;
    };
    if (!r.ok || j.error)
      throw Object.assign(new Error(j.error || "Something went wrong"), { tables: j.tables });
    return j;
  }

  async function ask(label: string, payload: Record<string, unknown>) {
    setMsgs((m) => [...m, { role: "user", text: label }]);
    setBusy(true);
    try {
      const j = (await call(payload)) as {
        text?: string;
        tables?: Table[];
        proposals?: Proposal[];
      };
      setMsgs((m) => [
        ...m,
        {
          role: "assistant",
          text: j.text || "",
          tables: j.tables ?? [],
          proposals: j.proposals ?? [],
        },
      ]);
    } catch (e) {
      setMsgs((m) => [
        ...m,
        {
          role: "assistant",
          text: (e as Error).message,
          tables: (e as { tables?: Table[] }).tables,
          error: true,
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

  function submit() {
    const v = text.trim();
    if (!v || busy) return;
    setText("");
    const PREFIX: Partial<Record<NonNullable<Mode>, string>> = {
      receipt: "Record a stock receipt: ",
      issue: "Record a stock issue: ",
      progress: "Update stage progress: ",
      labour: "Log today's labour: ",
    };
    if (mode && PREFIX[mode]) {
      const m = mode;
      setMode(null);
      const history = msgs
        .filter((x) => x.text && !x.error)
        .slice(-6)
        .map((x) => ({ role: x.role, text: x.text }));
      return ask(v, { question: PREFIX[m] + v, history });
    }
    if (mode) {
      const m = mode as "stock" | "stage" | "boq";
      setMode(null);
      return ask(v, { intent: { kind: m, q: v } });
    }
    const history = msgs
      .filter((m) => m.text && !m.error)
      .slice(-8)
      .map((m) => ({ role: m.role, text: m.text }));
    return ask(v, { question: v, history });
  }

  async function confirm(mi: number, pi: number, p: Proposal) {
    setBusy(true);
    try {
      const j = await call({ confirm: p.action });
      setMsgs((m) => m.map((x, i) => (i === mi ? { ...x, done: `${pi}:${j.text}` } : x)));
    } catch (e) {
      setMsgs((m) => [...m, { role: "assistant", text: (e as Error).message, error: true }]);
    } finally {
      setBusy(false);
    }
  }

  const hint = QUICK.find((q) => q.mode && q.mode === mode)?.hint;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Ask about stock, material and site"
        className="fixed bottom-20 right-4 z-30 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-card px-4 py-3 text-[13px] font-semibold text-foreground shadow-lg transition-colors hover:bg-secondary md:bottom-6"
      >
        <MessageCircleQuestion className="size-4 text-primary" />
        <span className="hidden sm:inline">Ask</span>
      </button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-lg">
          <SheetHeader className="border-b border-border px-4 py-3 text-left">
            <SheetTitle className="text-base">Ask</SheetTitle>
            <p className="text-[12px] text-muted-foreground">
              {project.name} · ask, record and check
            </p>
            <AlexaConnect />
          </SheetHeader>

          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
            {msgs.length === 0 && (
              <p className="text-[13px] text-muted-foreground">
                Tap a question for an instant answer from this project's data, or type your own
                below.
              </p>
            )}
            {msgs.map((m, i) => (
              <div
                key={i}
                className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}
              >
                <div
                  className={cn(
                    "max-w-[95%] rounded-2xl px-3 py-2 text-[13px]",
                    m.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-foreground",
                    m.error && "border border-destructive/40",
                  )}
                >
                  {m.text && <p className="whitespace-pre-wrap">{m.text}</p>}
                  {(m.proposals ?? []).map((p, k) => {
                    const done = m.done?.startsWith(`${k}:`)
                      ? m.done.slice(String(k).length + 1)
                      : "";
                    return (
                      <div
                        key={`p${k}`}
                        className="mt-2 rounded-xl border border-primary/30 bg-card p-3"
                      >
                        <p className="mb-1 text-[12px] font-semibold">{p.title}</p>
                        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-[12px]">
                          {p.lines.map(([a, b]) => (
                            <div key={a} className="contents">
                              <dt className="text-muted-foreground">{a}</dt>
                              <dd className="min-w-0 break-words">{b}</dd>
                            </div>
                          ))}
                        </dl>
                        {p.warnings.map((w) => (
                          <p key={w} className="mt-1 text-[12px] font-medium text-amber-700">
                            ⚠ {w}
                          </p>
                        ))}
                        {p.blocked ? (
                          <p className="mt-1 text-[12px] font-medium text-destructive">
                            {p.blocked}
                          </p>
                        ) : done ? (
                          <p className="mt-2 text-[12px] font-semibold text-emerald-700">
                            ✓ {done}
                          </p>
                        ) : (
                          <div className="mt-2 flex gap-2">
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => void confirm(i, k, p)}
                              className="h-10 flex-1 rounded-full bg-primary text-[13px] font-semibold text-primary-foreground disabled:opacity-50"
                            >
                              Confirm and save
                            </button>
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() =>
                                setMsgs((ms) =>
                                  ms.map((x, xi) =>
                                    xi === i ? { ...x, done: `${k}:Cancelled, nothing saved.` } : x,
                                  ),
                                )
                              }
                              className="h-10 rounded-full border border-border px-4 text-[13px]"
                            >
                              Cancel
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {(m.tables ?? []).map((t, k) => (
                    <div key={k} className="mt-2 first:mt-0">
                      <p className="mb-1 text-[12px] font-semibold">{t.title}</p>
                      {t.rows.length > 0 && (
                        <div className="overflow-x-auto rounded-lg border border-border bg-card">
                          <table className="w-full text-[12px]">
                            <thead>
                              <tr className="bg-muted/60">
                                {t.columns.map((c) => (
                                  <th
                                    key={c}
                                    className="whitespace-nowrap px-2 py-1.5 text-left font-medium"
                                  >
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
                                        ci > 0 &&
                                          typeof c === "string" &&
                                          /^[\d,.]+$/.test(c) &&
                                          "text-right tabular-nums",
                                        c === "enough" && "text-emerald-600",
                                        t.columns[ci] === "Short by" &&
                                          c !== "enough" &&
                                          c !== "—" &&
                                          "font-semibold text-destructive",
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
            <div className="-mx-4 mb-2 flex gap-1.5 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
              {QUICK.map((q) => (
                <button
                  key={q.label}
                  type="button"
                  disabled={busy || !project.id}
                  onClick={() =>
                    q.intent ? ask(q.label, { intent: q.intent }) : setMode(q.mode ?? null)
                  }
                  className={cn(
                    "shrink-0 whitespace-nowrap rounded-full border border-border px-3 py-2 text-[12px] transition-colors hover:bg-secondary disabled:opacity-50",
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
                placeholder={
                  hint ??
                  "Ask anything: how much cement is in stock? what does the 4th floor slab need?"
                }
                className="h-11 flex-1 rounded-full border border-border bg-background px-4 text-[14px] outline-none focus:border-primary"
                aria-label="Your question"
              />
              {mode && (
                <button
                  type="button"
                  onClick={() => setMode(null)}
                  aria-label="Cancel"
                  className="rounded-full p-2 hover:bg-secondary"
                >
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
