import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Shell } from "@/components/saha/Shell";
import { StatusBadge } from "@/components/saha/ui";
import { supabase } from "@/integrations/supabase/client";
import { useActiveProject } from "@/hooks/useActiveProject";
import { useAccess, useSessionUser } from "@/lib/access";
import { todayIso } from "@/lib/dates";
import { useSiteWeek } from "@/lib/site-week";
import {
  TRADES,
  TRADE_PREFIX,
  readCard,
  testProblems,
  tradeByKey,
  tradeOfStage,
  type CardData,
} from "@/lib/work-cards";

export const Route = createFileRoute("/work-cards")({
  validateSearch: (s: Record<string, unknown>): { stage?: string } => {
    const out: { stage?: string } = {};
    if (typeof s["stage"] === "string") out.stage = s["stage"];
    return out;
  },
  head: () => ({
    meta: [
      { title: "Work Cards & Tests | SiteSutra" },
      {
        name: "description",
        content:
          "Pre-start checklists, test readings and approval for blockwork, plumbing, electrical, waterproofing, plaster, tiling, windows and every other trade.",
      },
    ],
  }),
  component: Page,
});

type Row = {
  id: string;
  pour_ref: string;
  element: string;
  level: string;
  pour_date: string | null;
  checklist: CardData;
  status: string;
  requested_by_name: string;
  approved_by_name: string;
  approved_at: string | null;
  remarks: string;
};

type Draft = {
  stage: string;
  trade: string;
  location: string;
  date: string;
  data: CardData;
  remarks: string;
};

const field = "h-10 w-full rounded-lg border border-border bg-background px-2 text-sm";

function Page() {
  const project = useActiveProject();
  const user = useSessionUser();
  const { access } = useAccess();
  const search = Route.useSearch();
  const canApprove = Boolean(
    access?.isAdmin || access?.roles.includes("pm") || access?.roles.includes("site_engineer"),
  );
  const qc = useQueryClient();
  const plan = useSiteWeek(project.id);
  const stages = plan.data?.stages ?? [];
  const [draft, setDraft] = useState<Draft | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tradeFilter, setTradeFilter] = useState("");

  const cardsQ = useQuery({
    queryKey: ["work_cards", project.id],
    enabled: Boolean(project.id),
    queryFn: async (): Promise<Row[]> => {
      const { data, error } = await supabase
        .from("pour_cards")
        .select(
          "id,pour_ref,element,level,pour_date,checklist,status,requested_by_name,approved_by_name,approved_at,remarks",
        )
        .eq("project_id", project.id)
        .like("element", `${TRADE_PREFIX}%`)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((r) => ({ ...r, checklist: readCard(r.checklist) }));
    },
  });
  const cards = cardsQ.data ?? [];
  const refresh = () => qc.invalidateQueries({ queryKey: ["work_cards", project.id] });

  function start(stageCode = search.stage ?? "") {
    const st = stages.find((s) => s.code === stageCode);
    const trade = st ? tradeOfStage(st.code, st.name) : undefined;
    setEditingId(null);
    setDraft({
      stage: stageCode,
      trade: trade?.key ?? TRADES[0]!.key,
      location: st?.floor ?? "",
      date: todayIso(),
      data: { checks: {}, tests: {} },
      remarks: "",
    });
  }

  const save = useMutation({
    mutationFn: async (send: boolean) => {
      if (!draft) return;
      const trade = tradeByKey(draft.trade)!;
      if (!draft.stage) throw new Error("Pick the stage");
      if (!draft.location.trim()) throw new Error("Enter the location (floor, flat, wall, line)");
      if (send) {
        const open = trade.checks.filter((c) => !draft.data.checks[c]);
        if (open.length) throw new Error(`Tick every check first (${open.length} open)`);
        const bad = testProblems(trade, draft.data.tests);
        if (bad.length) throw new Error(`Tests: ${bad.join("; ")}`);
      }
      const row = {
        project_id: project.id,
        pour_ref: `${draft.stage} · ${draft.location.trim()}`,
        element: `${TRADE_PREFIX}${trade.key}`,
        level: draft.location.trim(),
        grade: trade.label,
        pour_date: draft.date,
        checklist: draft.data,
        status: send ? "pending" : "draft",
        requested_by_name: user?.email ?? "",
        remarks: draft.remarks,
        created_by: user?.id ?? null,
      };
      const { error } = editingId
        ? await supabase.from("pour_cards").update(row).eq("id", editingId)
        : await supabase.from("pour_cards").insert(row);
      if (error) throw error;
      if (send)
        await supabase.from("notifications").insert({
          title: `Work card to approve: ${row.pour_ref} · ${trade.label}`,
          body: `${user?.email ?? "Site"} has ticked every check${trade.tests.length ? " and recorded the tests" : ""}. ${trade.gate} needs your approval.`,
          category: "Site plan",
          priority: "High",
          link: "/work-cards",
          project_id: project.id,
          sender_id: user?.id ?? null,
        });
    },
    onSuccess: () => {
      toast.success("Work card saved");
      setDraft(null);
      setEditingId(null);
      void refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const setStatus = useMutation({
    mutationFn: async (p: { id: string; status: string }) => {
      const patch =
        p.status === "approved"
          ? {
              status: p.status,
              approved_by: user?.id ?? null,
              approved_by_name: user?.email ?? "PMC",
              approved_at: new Date().toISOString(),
            }
          : { status: p.status };
      const { error } = await supabase.from("pour_cards").update(patch).eq("id", p.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Work card updated");
      void refresh();
      void qc.invalidateQueries({ queryKey: ["stage_work_cards"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const shown = useMemo(
    () => cards.filter((c) => !tradeFilter || c.element === `${TRADE_PREFIX}${tradeFilter}`),
    [cards, tradeFilter],
  );
  const trade = draft ? tradeByKey(draft.trade) : undefined;

  return (
    <Shell title="Work Cards & Tests">
      <div className="flex flex-col gap-5 pb-16">
        <header className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{project.name}</p>
            <h1 className="text-2xl font-bold">Work cards and tests</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Like the pour card, for every other trade: tick the checks, record the test readings,
              and get the PMC / site engineer's approval before the work starts or is covered up. A
              stage cannot close without one.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 self-start">
            {search.stage && (
              <Link
                to="/job"
                search={{ stage: search.stage }}
                className="inline-flex items-center gap-2 rounded-xl border border-primary px-4 py-2 text-sm font-semibold text-primary"
              >
                ← {search.stage} job page
              </Link>
            )}
            <Link
              to="/pour-cards"
              className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-semibold"
            >
              Concrete? Pour cards
            </Link>
            <button
              type="button"
              onClick={() => start()}
              className="inline-flex items-center gap-2 self-start rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
            >
              <Plus className="h-4 w-4" /> New work card
            </button>
          </div>
        </header>

        {draft && trade && (
          <section className="rounded-2xl border border-primary/40 bg-card p-4">
            <div className="grid gap-3 md:grid-cols-4">
              <label className="text-xs font-semibold text-muted-foreground">
                Stage
                <select
                  className={field}
                  value={draft.stage}
                  onChange={(e) => {
                    const st = stages.find((s) => s.code === e.target.value);
                    const t = st ? tradeOfStage(st.code, st.name) : undefined;
                    setDraft({
                      ...draft,
                      stage: e.target.value,
                      trade: t?.key ?? draft.trade,
                      location: draft.location || st?.floor || "",
                      data: t && t.key !== draft.trade ? { checks: {}, tests: {} } : draft.data,
                    });
                  }}
                >
                  <option value="">Pick the stage…</option>
                  {stages
                    .filter((s) => tradeOfStage(s.code, s.name))
                    .map((s) => (
                      <option key={s.id} value={s.code}>
                        {s.code} · {s.name.replace(/^\S+ · /, "").slice(0, 50)}
                      </option>
                    ))}
                </select>
              </label>
              <label className="text-xs font-semibold text-muted-foreground">
                Trade
                <select
                  className={field}
                  value={draft.trade}
                  onChange={(e) =>
                    setDraft({ ...draft, trade: e.target.value, data: { checks: {}, tests: {} } })
                  }
                >
                  {TRADES.map((t) => (
                    <option key={t.key} value={t.key}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs font-semibold text-muted-foreground">
                Location (floor, flat, room, line)
                <input
                  className={field}
                  value={draft.location}
                  placeholder="e.g. Flat 101 toilets"
                  onChange={(e) => setDraft({ ...draft, location: e.target.value })}
                />
              </label>
              <label className="text-xs font-semibold text-muted-foreground">
                Date
                <input
                  type="date"
                  className={field}
                  value={draft.date}
                  onChange={(e) => setDraft({ ...draft, date: e.target.value })}
                />
              </label>
            </div>

            <h2 className="mt-4 text-sm font-bold">
              Checks ({trade.checks.filter((c) => draft.data.checks[c]).length}/
              {trade.checks.length})
            </h2>
            <ul className="mt-1 space-y-1">
              {trade.checks.map((c) => (
                <li key={c}>
                  <label className="flex items-start gap-2 rounded-lg p-1.5 text-sm hover:bg-muted">
                    <input
                      type="checkbox"
                      className="mt-0.5 size-5"
                      checked={Boolean(draft.data.checks[c])}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          data: {
                            ...draft.data,
                            checks: { ...draft.data.checks, [c]: e.target.checked },
                          },
                        })
                      }
                    />
                    {c}
                  </label>
                </li>
              ))}
            </ul>

            {trade.tests.length > 0 && (
              <>
                <h2 className="mt-4 text-sm font-bold">Test readings</h2>
                <div className="mt-1 grid gap-2 md:grid-cols-2">
                  {trade.tests.map((t) => {
                    const v = draft.data.tests[t.key] ?? "";
                    const bad =
                      v !== "" && testProblems({ ...trade, tests: [t] }, { [t.key]: v }).length;
                    return (
                      <label key={t.key} className="text-xs font-semibold text-muted-foreground">
                        {t.label} ({t.unit}
                        {t.min !== undefined ? `, ≥ ${t.min}` : ""}
                        {t.max !== undefined ? `, ≤ ${t.max}` : ""})
                        <input
                          inputMode="decimal"
                          className={`${field} ${bad ? "border-destructive text-destructive" : ""}`}
                          value={v}
                          placeholder={t.hint}
                          onChange={(e) =>
                            setDraft({
                              ...draft,
                              data: {
                                ...draft.data,
                                tests: { ...draft.data.tests, [t.key]: e.target.value },
                              },
                            })
                          }
                        />
                        {bad ? (
                          <span className="text-[11px] text-destructive">
                            Fails: redo, then record the new reading
                          </span>
                        ) : null}
                      </label>
                    );
                  })}
                </div>
              </>
            )}

            <label className="mt-3 block text-xs font-semibold text-muted-foreground">
              Remarks (gauge no., witness, photos taken…)
              <textarea
                className="mt-1 w-full rounded-lg border border-border bg-background p-2 text-sm"
                rows={2}
                value={draft.remarks}
                onChange={(e) => setDraft({ ...draft, remarks: e.target.value })}
              />
            </label>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={save.isPending}
                onClick={() => save.mutate(true)}
                className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
              >
                Send for approval
              </button>
              <button
                type="button"
                disabled={save.isPending}
                onClick={() => save.mutate(false)}
                className="rounded-xl border border-border px-4 py-2 text-sm font-semibold"
              >
                Save draft
              </button>
              <button
                type="button"
                onClick={() => setDraft(null)}
                className="px-3 py-2 text-sm text-muted-foreground"
              >
                Cancel
              </button>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Approval means: <b>{trade.gate}</b>. Until then the work waits.
            </p>
          </section>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <select
            aria-label="Filter by trade"
            className="h-9 rounded-lg border border-border bg-background px-2 text-sm"
            value={tradeFilter}
            onChange={(e) => setTradeFilter(e.target.value)}
          >
            <option value="">All trades ({cards.length})</option>
            {TRADES.map((t) => (
              <option key={t.key} value={t.key}>
                {t.label} ({cards.filter((c) => c.element === `${TRADE_PREFIX}${t.key}`).length})
              </option>
            ))}
          </select>
        </div>

        {cardsQ.isPending ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : shown.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
            No work cards yet. Raise one before blockwork starts, before pipes or conduits are
            covered, before waterproofing is screeded, before plaster, tiles and paint coats.
          </p>
        ) : (
          <ul className="grid gap-3 md:grid-cols-2">
            {shown.map((c) => {
              const t = tradeByKey(c.element.slice(TRADE_PREFIX.length));
              const done = t ? t.checks.filter((k) => c.checklist.checks[k]).length : 0;
              return (
                <li key={c.id} className="rounded-2xl border border-border bg-card p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold">{c.pour_ref}</p>
                      <p className="text-xs text-muted-foreground">
                        {t?.label} · {c.pour_date} · checks {done}/{t?.checks.length ?? 0}
                      </p>
                    </div>
                    <StatusBadge
                      tone={
                        c.status === "approved"
                          ? "emerald"
                          : c.status === "pending"
                            ? "amber"
                            : c.status === "done"
                              ? "sky"
                              : "slate"
                      }
                    >
                      {c.status === "approved"
                        ? (t?.gate ?? "approved")
                        : c.status === "pending"
                          ? "awaiting approval"
                          : c.status}
                    </StatusBadge>
                  </div>
                  {t && t.tests.length > 0 && (
                    <p className="mt-1 text-xs">
                      {t.tests
                        .map((x) => `${x.label}: ${c.checklist.tests[x.key] || "—"} ${x.unit}`)
                        .join(" · ")}
                    </p>
                  )}
                  {c.remarks && <p className="mt-1 text-xs text-muted-foreground">{c.remarks}</p>}
                  {c.approved_by_name && (
                    <p className="mt-1 text-xs text-emerald-700">
                      Approved by {c.approved_by_name}
                    </p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-2 text-xs">
                    {(c.status === "draft" || c.status === "rejected") && (
                      <button
                        type="button"
                        className="rounded-lg border border-border px-2 py-1 font-semibold"
                        onClick={() => {
                          const [stage = "", ...loc] = c.pour_ref.split(" · ");
                          setEditingId(c.id);
                          setDraft({
                            stage,
                            trade: t?.key ?? TRADES[0]!.key,
                            location: c.level || loc.join(" · "),
                            date: c.pour_date ?? todayIso(),
                            data: c.checklist,
                            remarks: c.remarks,
                          });
                        }}
                      >
                        Edit / send
                      </button>
                    )}
                    {c.status === "pending" && canApprove && (
                      <>
                        <button
                          type="button"
                          className="rounded-lg bg-emerald-600 px-2 py-1 font-semibold text-white"
                          onClick={() => setStatus.mutate({ id: c.id, status: "approved" })}
                        >
                          Approve: {t?.gate}
                        </button>
                        <button
                          type="button"
                          className="rounded-lg border border-destructive px-2 py-1 font-semibold text-destructive"
                          onClick={() => setStatus.mutate({ id: c.id, status: "rejected" })}
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {c.status === "approved" && (
                      <button
                        type="button"
                        className="rounded-lg border border-border px-2 py-1 font-semibold"
                        onClick={() => setStatus.mutate({ id: c.id, status: "done" })}
                      >
                        Mark work done
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Shell>
  );
}
