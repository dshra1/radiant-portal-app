import { Fragment, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  ChevronDown,
  ChevronRight,
  FileText,
  ShieldAlert,
  Package,
  Hammer,
  ListChecks,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  DAY,
  arr,
  fmtDay,
  n,
  plannedPctToday,
  toDay,
  todayDay,
  weightedProgress,
} from "@/lib/programme-progress";

/**
 * The construction programme the way the PMC control workbook lays it out:
 * every stage in its group, on a timeline, and for each stage the directions
 * (flow of events), the material it needs (stage ledger, with order-by dates),
 * the steel order and the inspection checks / hold points.
 */

type Check = {
  id: string;
  check: string;
  point: string;
  criterion?: string;
  method?: string;
  by?: string;
  record?: string;
  reference?: string;
};
type Material = { material: string; unit: string; qty: number; orderBy: string | null };
type Steel = {
  orderBy: string | null;
  totalKg: number;
  bindingWireKg: number;
  coverBlocks: number;
  bars: { dia: number; netKg: number; bars: number; orderKg: number }[];
};
type Direction = { title: string; steps: string[] };
type Notes = {
  flow?: { title: string; range: string; steps: string[] }[];
  beforeStart?: { item: string; neededBy: string | null; owner: string; why: string }[];
  principles?: string[];
};

export type FlowStage = {
  id: string;
  code: string;
  name: string;
  sort: number;
  stage_group: string;
  floor: string;
  duration_days: number;
  preds: string[];
  checks: Check[];
  hold_point: boolean;
  materials: Material[];
  steel: Steel | null;
  directions: Direction[];
  planned_start: string | null;
  planned_end: string | null;
  actual_pct: number;
  status: string;
};

const fmt = fmtDay;

const pointTone: Record<string, string> = {
  H: "bg-red-100 text-red-800 border-red-300",
  W: "bg-amber-100 text-amber-900 border-amber-300",
  R: "bg-slate-100 text-slate-700 border-slate-300",
};

export function ProgrammeFlow({ projectId }: { projectId: string }) {
  const [group, setGroup] = useState("ALL");
  const [floor, setFloor] = useState("ALL");
  const [view, setView] = useState<"timeline" | "week">("timeline");
  const [open, setOpen] = useState("");
  const [closedGroups, setClosedGroups] = useState<Record<string, boolean>>({});
  const [showStart, setShowStart] = useState(false);

  const q = useQuery({
    queryKey: ["programme_flow", projectId],
    enabled: Boolean(projectId),
    queryFn: async () => {
      const st = await supabase
        .from("site_stages")
        .select(
          "id,code,name,sort,stage_group,floor,duration_days,preds,checks,hold_point,materials,steel,directions,planned_start,planned_end,actual_pct,status",
        )
        .eq("project_id", projectId)
        .order("sort", { ascending: true });
      if (st.error) throw st.error;
      const pr = await supabase
        .from("site_projects")
        .select("control_notes,start_date,target_handover_date")
        .eq("id", projectId)
        .maybeSingle();
      if (pr.error) throw pr.error;
      const stages: FlowStage[] = (st.data ?? []).map((s) => ({
        id: s.id,
        code: s.code ?? "",
        name: (s.name ?? "").replace(/^[A-Z]{1,3}\d{0,3} · /, ""),
        sort: n(s.sort),
        stage_group: s.stage_group || "Other",
        floor: s.floor ?? "",
        duration_days: n(s.duration_days),
        preds: arr<string>(s.preds),
        checks: arr<Check>(s.checks),
        hold_point: Boolean(s.hold_point),
        materials: arr<Material>(s.materials),
        steel: (s.steel as Steel | null) ?? null,
        directions: arr<Direction>(s.directions),
        planned_start: s.planned_start,
        planned_end: s.planned_end,
        actual_pct: n(s.actual_pct),
        status: s.status ?? "",
      }));
      return {
        stages,
        notes: ((pr.data?.control_notes ?? {}) as Notes) || {},
        start: pr.data?.start_date ?? null,
        handover: pr.data?.target_handover_date ?? null,
      };
    },
  });

  const stages = q.data?.stages ?? [];
  const fromWorkbook = stages.filter((s) => s.code);
  const notes = q.data?.notes ?? {};
  const today = todayDay();

  const groups = useMemo(
    () => [...new Set(fromWorkbook.map((s) => s.stage_group))],
    [fromWorkbook],
  );
  const floors = useMemo(
    () => [...new Set(fromWorkbook.map((s) => s.floor).filter(Boolean))],
    [fromWorkbook],
  );
  const byCode = useMemo(() => new Map(fromWorkbook.map((s) => [s.code, s])), [fromWorkbook]);

  const shown = fromWorkbook.filter(
    (s) =>
      (group === "ALL" || s.stage_group === group) &&
      (floor === "ALL" || s.floor === floor) &&
      (view === "timeline" ||
        (toDay(s.planned_start) <= today + 6 && toDay(s.planned_end) >= today)),
  );

  const span = useMemo(() => {
    const a = Math.min(...fromWorkbook.map((s) => toDay(s.planned_start)).filter(Number.isFinite));
    const b = Math.max(...fromWorkbook.map((s) => toDay(s.planned_end)).filter(Number.isFinite));
    return Number.isFinite(a) && Number.isFinite(b) ? { a, b: b + 1 } : null;
  }, [fromWorkbook]);

  const months = useMemo(() => {
    if (!span) return [];
    const out: { label: string; left: number }[] = [];
    const d = new Date(span.a * DAY);
    d.setUTCDate(1);
    for (;;) {
      d.setUTCMonth(d.getUTCMonth() + 1);
      const day = Math.floor(d.getTime() / DAY);
      if (day >= span.b) break;
      out.push({
        label: d.toLocaleDateString("en-IN", { month: "short", year: "2-digit", timeZone: "UTC" }),
        left: ((day - span.a) / (span.b - span.a)) * 100,
      });
    }
    return out;
  }, [span]);

  const progress = weightedProgress(fromWorkbook);
  const nextHold = fromWorkbook
    .filter((s) => s.hold_point && s.actual_pct < 100 && toDay(s.planned_end) >= today)
    .sort((x, y) => toDay(x.planned_start) - toDay(y.planned_start))[0];
  const orderSoon = fromWorkbook
    .flatMap((s) => [
      ...s.materials
        .filter(
          (m) => m.orderBy && toDay(m.orderBy) <= today + 14 && toDay(s.planned_start) >= today - 7,
        )
        .map((m) => ({
          code: s.code,
          what: `${m.material} · ${m.qty.toLocaleString("en-IN")} ${m.unit}`,
          by: m.orderBy,
        })),
      ...(s.steel &&
      s.steel.orderBy &&
      toDay(s.steel.orderBy) <= today + 14 &&
      toDay(s.planned_start) >= today - 7
        ? [
            {
              code: s.code,
              what: `Steel ${(s.steel.totalKg / 1000).toFixed(2)} t (all bar sizes)`,
              by: s.steel.orderBy,
            },
          ]
        : []),
    ])
    .sort((x, y) => toDay(x.by) - toDay(y.by));

  if (q.isPending)
    return <p className="p-4 text-sm text-muted-foreground">Loading the programme…</p>;
  if (q.isError)
    return (
      <p className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
        The programme needs the latest database update (stage materials, checks and directions).
        Apply it, then re-run Import PMC Workbooks. ({(q.error as Error).message})
      </p>
    );
  if (!fromWorkbook.length)
    return (
      <p className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
        No programme for this project yet. Import the Construction Control workbook on “Import PMC
        Workbooks” to load every stage with its dates, material, steel and checks.
      </p>
    );

  const bar = (s: FlowStage) => {
    if (!span) return null;
    const a = toDay(s.planned_start);
    const b = toDay(s.planned_end) + 1;
    if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
    const total = span.b - span.a;
    const left = ((a - span.a) / total) * 100;
    const width = Math.max(0.4, ((b - a) / total) * 100);
    const late = plannedPctToday(s) > s.actual_pct + 10;
    return (
      <div
        className={`absolute top-1/2 h-3 -translate-y-1/2 overflow-hidden rounded ${s.hold_point ? "bg-red-200" : "bg-primary/25"} ${late ? "ring-1 ring-destructive" : ""}`}
        style={{ left: `${left}%`, width: `${width}%` }}
        title={`${fmt(s.planned_start)} → ${fmt(s.planned_end)} · ${s.duration_days} working days`}
      >
        <div
          className={`h-full ${s.hold_point ? "bg-red-500" : "bg-primary"}`}
          style={{ width: `${s.actual_pct}%` }}
        />
      </div>
    );
  };
  const todayLeft =
    span && today >= span.a && today <= span.b
      ? ((today - span.a) / (span.b - span.a)) * 100
      : null;

  return (
    <div className="flex flex-col gap-4">
      {/* headline */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Tile
          label="Programme"
          value={`${fmt(q.data?.start ?? fromWorkbook[0]?.planned_start ?? null)} → ${fmt(q.data?.handover ?? null)}`}
          note={`${fromWorkbook.length} stages · ${groups.length} groups`}
        />
        <Tile
          label="Progress today (by duration)"
          value={`${progress.actual.toFixed(1)}%`}
          note={`Planned ${progress.planned.toFixed(1)}%`}
          tone={progress.actual + 2 < progress.planned ? "text-destructive" : "text-primary"}
        />
        <Tile
          label="Next hold point"
          value={nextHold ? nextHold.code : "—"}
          note={
            nextHold
              ? `${nextHold.name.slice(0, 48)} · ${fmt(nextHold.planned_start)}`
              : "None pending"
          }
        />
        <Tile
          label="Order in the next 14 days"
          value={String(orderSoon.length)}
          note={
            orderSoon[0]
              ? `First: ${orderSoon[0].what.slice(0, 40)} by ${fmt(orderSoon[0].by)}`
              : "Nothing due"
          }
        />
      </div>

      {/* before the start + principles */}
      {(notes.beforeStart?.length || notes.flow?.length) && (
        <div className="rounded-xl border border-border bg-card">
          <button
            type="button"
            onClick={() => setShowStart(!showStart)}
            className="flex w-full items-center gap-2 p-3 text-left text-sm font-semibold"
          >
            {showStart ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
            Flow of events, and what must be in hand before the site starts
          </button>
          {showStart && (
            <div className="grid gap-4 border-t border-border p-3 text-[13px] lg:grid-cols-2">
              <div>
                <h4 className="mb-1 text-xs font-semibold uppercase text-muted-foreground">
                  Before the start
                </h4>
                <ul className="space-y-1.5">
                  {(notes.beforeStart ?? []).map((b) => (
                    <li key={b.item} className="flex gap-2">
                      <span className="shrink-0 tnum text-muted-foreground">{fmt(b.neededBy)}</span>
                      <span>
                        <b>{b.item}</b> · {b.owner}
                        {b.why && <span className="text-muted-foreground"> · {b.why}</span>}
                      </span>
                    </li>
                  ))}
                </ul>
                {(notes.principles ?? []).map((p) => (
                  <p key={p} className="mt-3 rounded-lg bg-secondary/60 p-2 text-[12px]">
                    {p}
                  </p>
                ))}
              </div>
              <div className="space-y-3">
                {(notes.flow ?? []).map((f) => (
                  <div key={f.title}>
                    <h4 className="text-xs font-semibold uppercase text-muted-foreground">
                      {f.title}
                      {f.range && ` · ${f.range}`}
                    </h4>
                    <ol className="mt-1 space-y-0.5">
                      {f.steps.map((s) => (
                        <Step key={s} text={s} />
                      ))}
                    </ol>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex overflow-hidden rounded-lg border border-border text-sm">
          {(["timeline", "week"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className={`px-3 py-1.5 font-semibold ${view === v ? "bg-primary text-primary-foreground" : "bg-background"}`}
            >
              {v === "timeline" ? "Whole programme" : "This week"}
            </button>
          ))}
        </div>
        <select
          value={group}
          onChange={(e) => setGroup(e.target.value)}
          className="h-9 rounded-lg border border-border bg-background px-2 text-sm"
        >
          <option value="ALL">All groups</option>
          {groups.map((g) => (
            <option key={g}>{g}</option>
          ))}
        </select>
        <select
          value={floor}
          onChange={(e) => setFloor(e.target.value)}
          className="h-9 rounded-lg border border-border bg-background px-2 text-sm"
        >
          <option value="ALL">All floors</option>
          {floors.map((f) => (
            <option key={f}>{f}</option>
          ))}
        </select>
        <span className="text-xs text-muted-foreground">
          Click a stage for its directions, material, steel and checks. Red = hold point.
        </span>
      </div>

      {view === "week" && orderSoon.length > 0 && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-[13px] text-amber-950">
          <h4 className="mb-1 font-semibold">Order now (order-by date within 14 days)</h4>
          <ul className="grid gap-1 md:grid-cols-2">
            {orderSoon.slice(0, 30).map((o, i) => (
              <li key={i}>
                <b className="tnum">{fmt(o.by)}</b> · {o.code} · {o.what}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* timeline */}
      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <div className="min-w-[860px]">
          <div className="sticky top-0 z-10 grid grid-cols-[320px_1fr] border-b border-border bg-card text-[11px] text-muted-foreground">
            <div className="px-3 py-1.5 font-semibold uppercase">Stage</div>
            <div className="relative h-7">
              {months.map((m) => (
                <span
                  key={m.left}
                  className="absolute top-1.5 border-l border-border pl-1"
                  style={{ left: `${m.left}%` }}
                >
                  {m.label}
                </span>
              ))}
            </div>
          </div>
          {groups
            .filter((g) => shown.some((s) => s.stage_group === g))
            .map((g) => {
              const list = shown.filter((s) => s.stage_group === g);
              const closed = closedGroups[g];
              const gp = weightedProgress(list);
              return (
                <Fragment key={g}>
                  <button
                    type="button"
                    onClick={() => setClosedGroups({ ...closedGroups, [g]: !closed })}
                    className="flex w-full items-center gap-2 border-b border-border bg-secondary/50 px-3 py-1.5 text-left text-xs font-semibold uppercase"
                  >
                    {closed ? (
                      <ChevronRight className="size-3.5" />
                    ) : (
                      <ChevronDown className="size-3.5" />
                    )}
                    {g} · {list.length} stages
                    <span className="ml-auto font-normal normal-case text-muted-foreground">
                      actual {gp.actual.toFixed(0)}% · plan {gp.planned.toFixed(0)}%
                    </span>
                  </button>
                  {!closed &&
                    list.map((s) => {
                      const isOpen = open === s.id;
                      return (
                        <Fragment key={s.id}>
                          <button
                            type="button"
                            onClick={() => setOpen(isOpen ? "" : s.id)}
                            className={`grid w-full grid-cols-[320px_1fr] border-b border-border/60 text-left hover:bg-secondary/40 ${isOpen ? "bg-secondary/40" : ""}`}
                          >
                            <div className="flex min-w-0 items-center gap-2 px-3 py-1.5 text-[12px]">
                              <span
                                className={`w-10 shrink-0 font-semibold ${s.hold_point ? "text-red-700" : "text-primary"}`}
                              >
                                {s.code}
                              </span>
                              <span className="truncate">{s.name}</span>
                              <span className="ml-auto shrink-0 text-[11px] text-muted-foreground">
                                {s.floor && `${s.floor} · `}
                                {s.duration_days}d
                              </span>
                            </div>
                            <div className="relative h-8">
                              {months.map((m) => (
                                <span
                                  key={m.left}
                                  className="absolute inset-y-0 border-l border-border/40"
                                  style={{ left: `${m.left}%` }}
                                />
                              ))}
                              {todayLeft !== null && (
                                <span
                                  className="absolute inset-y-0 z-[1] border-l-2 border-destructive/70"
                                  style={{ left: `${todayLeft}%` }}
                                />
                              )}
                              {bar(s)}
                            </div>
                          </button>
                          {isOpen && <StageDetail s={s} byCode={byCode} />}
                        </Fragment>
                      );
                    })}
                </Fragment>
              );
            })}
          {shown.length === 0 && (
            <p className="p-4 text-sm text-muted-foreground">
              No stage is planned for this week with these filters.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function Tile({
  label,
  value,
  note,
  tone,
}: {
  label: string;
  value: string;
  note: string;
  tone?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <div className={`mt-1 text-lg font-bold ${tone ?? ""}`}>{value}</div>
      <span className="text-[11px] text-muted-foreground">{note}</span>
    </div>
  );
}

function Step({ text }: { text: string }) {
  const hold = /HOLD/.test(text);
  return <li className={hold ? "font-medium text-red-800" : ""}>{text}</li>;
}

function StageDetail({ s, byCode }: { s: FlowStage; byCode: Map<string, FlowStage> }) {
  const plan = plannedPctToday(s);
  return (
    <div className="grid gap-4 border-b border-border bg-background p-4 text-[13px] lg:grid-cols-2">
      <div className="space-y-3">
        <div>
          <h4 className="text-sm font-bold">
            {s.code} · {s.name}
          </h4>
          <p className="text-[12px] text-muted-foreground">
            {s.stage_group}
            {s.floor && ` · ${s.floor}`} · {fmt(s.planned_start)} → {fmt(s.planned_end)} ·{" "}
            {s.duration_days} working days · planned today {plan}% · actual {s.actual_pct}%
          </p>
          <p className="mt-1">
            <Link
              to="/stage-drawings"
              search={{ stage: s.code }}
              className="inline-flex items-center gap-1 rounded-lg bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground"
            >
              <FileText className="size-3.5" /> Drawings for {s.code} · check a site photo
            </Link>
          </p>
          {s.preds.length > 0 && (
            <p className="mt-1 text-[12px]">
              <b>Starts after:</b>{" "}
              {s.preds.map((p) => {
                const ps = byCode.get(p);
                return (
                  <span key={p} className="mr-2">
                    {p}
                    {ps && (
                      <span className="text-muted-foreground">
                        {" "}
                        ({ps.name.slice(0, 40)}, ends {fmt(ps.planned_end)})
                      </span>
                    )}
                  </span>
                );
              })}
            </p>
          )}
        </div>

        {s.directions.length > 0 && (
          <div>
            <h5 className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase text-muted-foreground">
              <Hammer className="size-3.5" /> Directions
            </h5>
            {s.directions.map((d) => (
              <div key={d.title} className="mb-2">
                <p className="text-[12px] font-semibold">{d.title}</p>
                <ol className="mt-0.5 space-y-0.5">
                  {d.steps.map((t) => (
                    <Step key={t} text={t} />
                  ))}
                </ol>
              </div>
            ))}
          </div>
        )}

        {s.checks.length > 0 && (
          <div>
            <h5 className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase text-muted-foreground">
              <ListChecks className="size-3.5" /> Checks before sign-off
            </h5>
            <ul className="space-y-2">
              {s.checks.map((c) => (
                <li key={c.id} className="rounded-lg border border-border p-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded border px-1.5 text-[11px] font-bold ${pointTone[c.point] ?? pointTone["R"]}`}
                    >
                      {c.point === "H" ? "HOLD" : c.point === "W" ? "WITNESS" : "RECORD"}
                    </span>
                    <b>
                      {c.id} · {c.check}
                    </b>
                  </div>
                  {c.criterion && <p className="mt-1">{c.criterion}</p>}
                  <p className="mt-0.5 text-[12px] text-muted-foreground">
                    {[
                      c.method,
                      c.by && `signed by ${c.by}`,
                      c.record && `record: ${c.record}`,
                      c.reference,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="space-y-3">
        {s.steel && s.steel.bars.length > 0 && (
          <div>
            <h5 className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase text-muted-foreground">
              <ShieldAlert className="size-3.5" /> Steel order · order by {fmt(s.steel.orderBy)}
            </h5>
            <table className="w-full text-[12px]">
              <thead className="text-muted-foreground">
                <tr>
                  <th className="text-left">Bar</th>
                  <th className="text-right">Net kg</th>
                  <th className="text-right">12 m bars</th>
                  <th className="text-right">Order kg</th>
                </tr>
              </thead>
              <tbody>
                {s.steel.bars.map((b) => (
                  <tr key={b.dia} className="border-t border-border/50">
                    <td>{b.dia} mm</td>
                    <td className="text-right tnum">{b.netKg.toLocaleString("en-IN")}</td>
                    <td className="text-right tnum">{b.bars.toLocaleString("en-IN")}</td>
                    <td className="text-right tnum">{b.orderKg.toLocaleString("en-IN")}</td>
                  </tr>
                ))}
                <tr className="border-t border-border font-semibold">
                  <td>Total</td>
                  <td />
                  <td />
                  <td className="text-right tnum">{s.steel.totalKg.toLocaleString("en-IN")}</td>
                </tr>
              </tbody>
            </table>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Binding wire {s.steel.bindingWireKg} kg · cover blocks{" "}
              {s.steel.coverBlocks.toLocaleString("en-IN")} nos
            </p>
          </div>
        )}

        <div>
          <h5 className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase text-muted-foreground">
            <Package className="size-3.5" /> Material needed for this stage ({s.materials.length})
          </h5>
          {s.materials.length === 0 ? (
            <p className="text-[12px] text-muted-foreground">
              No material in the stage ledger (inspection or handover step).
            </p>
          ) : (
            <table className="w-full text-[12px]">
              <thead className="text-muted-foreground">
                <tr>
                  <th className="text-left">Material</th>
                  <th className="text-right">Qty</th>
                  <th className="text-right">Order by</th>
                </tr>
              </thead>
              <tbody>
                {s.materials.map((m, i) => (
                  <tr key={i} className="border-t border-border/50 align-top">
                    <td className="pr-2">{m.material}</td>
                    <td className="whitespace-nowrap text-right tnum">
                      {m.qty.toLocaleString("en-IN")} {m.unit}
                    </td>
                    <td className="whitespace-nowrap pl-2 text-right tnum">
                      {m.orderBy ? (
                        fmt(m.orderBy)
                      ) : (
                        <span className="text-muted-foreground">in stock plan</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <p className="mt-1 text-[11px] text-muted-foreground">
            Order-by shows where this stage is the first to use the material; later stages draw on
            the same stock (reorder levels on Inventory).
          </p>
        </div>
      </div>
    </div>
  );
}
