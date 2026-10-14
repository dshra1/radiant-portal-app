import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  FileText,
  HardHat,
  Loader2,
  Package,
  Search,
  Send,
  ShieldAlert,
} from "lucide-react";
import { Shell } from "@/components/saha/Shell";
import { useActiveProject } from "@/hooks/useActiveProject";
import { supabase } from "@/integrations/supabase/client";
import { useSessionUser } from "@/lib/access";
import { fmtDay } from "@/lib/programme-progress";
import { stageName, useSiteWeek, type PlanStage } from "@/lib/site-week";
import { pushStageTasks } from "@/lib/site-week-actions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/execution-manual")({
  head: () => ({
    meta: [
      { title: "Execution Manual | Saha OS" },
      {
        name: "description",
        content:
          "How each programme stage is built: directions, material, steel and the inspection checks / hold points, from the project's own PMC programme.",
      },
      { property: "og:title", content: "Execution Manual | Saha OS" },
      { property: "og:type", content: "website" },
    ],
  }),
  component: Page,
});

const pointLabel: Record<string, string> = { H: "Hold", W: "Witness", R: "Record" };
const pointTone: Record<string, string> = {
  H: "border-red-300 bg-red-100 text-red-800",
  W: "border-amber-300 bg-amber-100 text-amber-900",
  R: "border-slate-300 bg-slate-100 text-slate-700",
};

type QcRow = {
  id: string;
  itp_id: string;
  check_name: string;
  point: string;
  floor: string;
  planned_date: string | null;
  inspected_on: string | null;
  result: string;
  inspector: string;
  ncr_no: string;
  remarks: string;
};

function Page() {
  const project = useActiveProject();
  const user = useSessionUser();
  const week = useSiteWeek(project.id);
  const stages = useMemo(() => week.data?.stages ?? [], [week.data]);

  const [term, setTerm] = useState("");
  const [picked, setPicked] = useState<string | null>(null);
  const [closed, setClosed] = useState<Record<string, boolean>>({});
  const [pushing, setPushing] = useState(false);

  const principles = useQuery({
    queryKey: ["site_projects", "control-principles", project.id],
    enabled: Boolean(project.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_projects")
        .select("control_notes")
        .eq("id", project.id)
        .maybeSingle();
      if (error) throw error;
      const notes = (data?.control_notes ?? {}) as { principles?: unknown };
      return Array.isArray(notes.principles)
        ? notes.principles.filter((p): p is string => typeof p === "string" && p.trim() !== "")
        : [];
    },
  });

  const filtered = useMemo(() => {
    const t = term.trim().toLowerCase();
    if (!t) return stages;
    return stages.filter((s) =>
      `${s.code} ${s.name} ${s.group} ${s.floor}`.toLowerCase().includes(t),
    );
  }, [stages, term]);

  const grouped = useMemo(() => {
    const m = new Map<string, PlanStage[]>();
    for (const s of filtered) {
      const list = m.get(s.group) ?? [];
      list.push(s);
      m.set(s.group, list);
    }
    return [...m.entries()];
  }, [filtered]);

  const current = stages.find((s) => s.code === picked) ?? week.data?.now[0] ?? stages[0] ?? null;

  const qc = useQuery({
    queryKey: ["quality_checks", project.id, current?.code ?? ""],
    enabled: Boolean(project.id && current?.code),
    queryFn: async (): Promise<QcRow[]> => {
      const { data, error } = await supabase
        .from("quality_checks")
        .select(
          "id,itp_id,check_name,point,floor,planned_date,inspected_on,result,inspector,ncr_no,remarks",
        )
        .eq("project_id", project.id)
        .eq("stage_code", current!.code)
        .order("planned_date", { ascending: true });
      if (error) throw error;
      return (data ?? []) as QcRow[];
    },
  });

  const push = async () => {
    if (!current || !project.id) return;
    setPushing(true);
    try {
      const n = await pushStageTasks(project.id, [current], {
        id: user?.id ?? null,
        name: user?.email ?? "Site team",
      });
      if (n) toast.success(`${current.code} instructions sent to Team Chat (Site plan) as a task.`);
      else toast.info(`${current.code} already has an open task in Team Chat (Site plan).`);
    } catch (e) {
      toast.error(`Could not send: ${(e as Error).message}`);
    } finally {
      setPushing(false);
    }
  };

  return (
    <Shell
      title="Execution Manual"
      subtitle={`${project.name} · how each programme stage is built, checked and closed`}
    >
      {!project.id ? (
        <Empty text="No active project. Add or pick a project first." />
      ) : week.isPending ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Loading programme stages…
        </div>
      ) : week.error ? (
        <Empty text={`Could not load the programme: ${(week.error as Error).message}`} />
      ) : stages.length === 0 ? (
        <Empty text="No programme stages yet. Import the PMC control workbook in Import PMC Workbooks to load the stages, directions and checks." />
      ) : (
        <div className="space-y-4">
          {principles.data && principles.data.length > 0 && (
            <section className="rounded-xl border border-border bg-card p-4">
              <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold">
                <BookOpen className="size-4 text-primary" /> General rules
              </h2>
              <ul className="space-y-1.5 text-[13px]">
                {principles.data.map((p) => (
                  <li key={p} className="rounded-lg bg-secondary/60 p-2">
                    {p}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <div className="grid gap-4 lg:grid-cols-[22rem_minmax(0,1fr)]">
            <aside className="rounded-xl border border-border bg-card">
              <div className="border-b border-border p-3">
                <label className="flex items-center gap-2 rounded-md border border-input bg-background px-2 py-1.5">
                  <Search className="size-3.5 text-muted-foreground" />
                  <input
                    value={term}
                    onChange={(e) => setTerm(e.target.value)}
                    placeholder={`Filter ${stages.length} stages by code, name, floor…`}
                    className="w-full bg-transparent text-[13px] outline-none"
                  />
                </label>
              </div>
              <div className="max-h-[70vh] overflow-y-auto p-2">
                {grouped.length === 0 && (
                  <p className="p-2 text-xs text-muted-foreground">No stage matches.</p>
                )}
                {grouped.map(([group, list]) => {
                  const isClosed = closed[group] ?? false;
                  return (
                    <div key={group} className="mb-1">
                      <button
                        type="button"
                        onClick={() => setClosed((p) => ({ ...p, [group]: !isClosed }))}
                        className="flex w-full items-center gap-1.5 rounded px-2 py-1.5 text-left text-xs font-semibold uppercase text-muted-foreground hover:bg-secondary"
                      >
                        {isClosed ? (
                          <ChevronRight className="size-3.5" />
                        ) : (
                          <ChevronDown className="size-3.5" />
                        )}
                        <span className="flex-1 truncate">{group}</span>
                        <span className="tnum">{list.length}</span>
                      </button>
                      {!isClosed && (
                        <ul className="space-y-0.5">
                          {list.map((s) => (
                            <li key={s.id}>
                              <button
                                type="button"
                                onClick={() => setPicked(s.code)}
                                className={cn(
                                  "flex w-full items-start gap-2 rounded px-2 py-1.5 text-left text-[13px]",
                                  current?.id === s.id
                                    ? "bg-primary text-primary-foreground"
                                    : "hover:bg-secondary",
                                )}
                              >
                                <b className="w-12 shrink-0">{s.code}</b>
                                <span className="min-w-0 flex-1">
                                  <span className="block truncate">{stageName(s.name)}</span>
                                  <span className="block text-[11px] opacity-75">
                                    {s.floor ? `${s.floor} · ` : ""}
                                    {fmtDay(s.plannedStart)} → {fmtDay(s.plannedEnd)}
                                  </span>
                                </span>
                                {s.holdPoint && (
                                  <ShieldAlert className="mt-0.5 size-3.5 shrink-0" />
                                )}
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  );
                })}
              </div>
            </aside>

            {current && (
              <StageDetail
                s={current}
                qc={qc.data ?? []}
                qcLoading={qc.isPending}
                pushing={pushing}
                onPush={push}
              />
            )}
          </div>
        </div>
      )}
    </Shell>
  );
}

function StageDetail({
  s,
  qc,
  qcLoading,
  pushing,
  onPush,
}: {
  s: PlanStage;
  qc: QcRow[];
  qcLoading: boolean;
  pushing: boolean;
  onPush: () => void;
}) {
  return (
    <article className="min-w-0 space-y-4 rounded-xl border border-border bg-card p-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="label-caps text-muted-foreground">
            {s.group}
            {s.floor ? ` · ${s.floor}` : ""}
          </p>
          <h2 className="text-xl font-bold">
            {s.code} · {stageName(s.name)}
          </h2>
          <p className="text-[13px] text-muted-foreground">
            Planned {fmtDay(s.plannedStart)} → {fmtDay(s.plannedEnd)} · {s.durationDays} working
            days
            {s.preds.length > 0 && ` · starts after ${s.preds.join(", ")}`}
            {s.status && ` · ${s.status}`} · {s.actualPct}% done
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/site-execution"
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-[12px] font-semibold text-primary-foreground hover:bg-primary-hover"
          >
            <HardHat className="size-3.5" /> Open in Site Execution
          </Link>
          <Link
            to="/stage-drawings"
            search={{ stage: s.code }}
            className="inline-flex items-center gap-1.5 rounded-md border border-input px-3 py-1.5 text-[12px] font-semibold hover:bg-secondary"
          >
            <FileText className="size-3.5" /> Drawings
          </Link>
          <Link
            to="/quality"
            search={{ tab: "checks" }}
            className="inline-flex items-center gap-1.5 rounded-md border border-input px-3 py-1.5 text-[12px] font-semibold hover:bg-secondary"
          >
            <ClipboardCheck className="size-3.5" /> Checks log
          </Link>
          <button
            type="button"
            onClick={onPush}
            disabled={pushing}
            className="inline-flex items-center gap-1.5 rounded-md border border-input px-3 py-1.5 text-[12px] font-semibold hover:bg-secondary disabled:opacity-60"
          >
            {pushing ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Send className="size-3.5" />
            )}
            Send to Team Chat
          </button>
        </div>
      </header>

      <section>
        <h3 className="mb-1.5 text-sm font-semibold">How to do it</h3>
        {s.directions.length === 0 ? (
          <p className="text-[13px] text-muted-foreground">
            No directions recorded for this stage in the programme.
          </p>
        ) : (
          <div className="space-y-3">
            {s.directions.map((d) => (
              <div key={d.title}>
                <h4 className="text-xs font-semibold uppercase text-muted-foreground">{d.title}</h4>
                <ol className="mt-1 space-y-1 text-[13px]">
                  {d.steps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h3 className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold">
          <ShieldAlert className="size-4" /> Inspection checks (ITP) and hold points
        </h3>
        {s.checks.length === 0 ? (
          <p className="text-[13px] text-muted-foreground">No checks listed for this stage.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead className="text-[11px] uppercase text-muted-foreground">
                <tr>
                  <th className="py-1 pr-2">Point</th>
                  <th className="py-1 pr-2">ID</th>
                  <th className="py-1 pr-2">Check</th>
                  <th className="py-1 pr-2">Acceptance</th>
                  <th className="py-1 pr-2">Method</th>
                  <th className="py-1 pr-2">Signs</th>
                  <th className="py-1">Result</th>
                </tr>
              </thead>
              <tbody>
                {s.checks.map((c) => {
                  const r = s.evidence.checks?.[c.id];
                  return (
                    <tr key={c.id} className="border-t border-border align-top">
                      <td className="py-1.5 pr-2">
                        <span
                          className={cn(
                            "rounded border px-1.5 py-0.5 text-[11px] font-semibold",
                            pointTone[c.point] ?? pointTone["R"],
                          )}
                        >
                          {pointLabel[c.point] ?? c.point}
                        </span>
                      </td>
                      <td className="py-1.5 pr-2 font-semibold">{c.id}</td>
                      <td className="py-1.5 pr-2">
                        {c.check}
                        {c.reference && (
                          <span className="block text-[11px] text-muted-foreground">
                            {c.reference}
                          </span>
                        )}
                      </td>
                      <td className="py-1.5 pr-2">{c.criterion ?? "—"}</td>
                      <td className="py-1.5 pr-2">{c.method ?? "—"}</td>
                      <td className="py-1.5 pr-2">{c.by ?? "—"}</td>
                      <td className="py-1.5">
                        {r ? (
                          <span className={r.result === "OK" ? "text-green-700" : "text-red-700"}>
                            {r.result} · {r.by} · {fmtDay(r.on)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">Open</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {(qcLoading || qc.length > 0) && (
          <div className="mt-3">
            <h4 className="text-xs font-semibold uppercase text-muted-foreground">
              Checks log entries for {s.code}
            </h4>
            {qcLoading ? (
              <p className="text-[13px] text-muted-foreground">Loading…</p>
            ) : (
              <ul className="mt-1 space-y-1 text-[13px]">
                {qc.map((r) => (
                  <li key={r.id} className="rounded border border-border px-2 py-1">
                    <b>{r.itp_id}</b> {r.check_name}
                    {r.floor && ` · ${r.floor}`} · {r.result || "Pending"}
                    {r.inspected_on
                      ? ` · inspected ${fmtDay(r.inspected_on)}`
                      : r.planned_date
                        ? ` · planned ${fmtDay(r.planned_date)}`
                        : ""}
                    {r.inspector && ` · ${r.inspector}`}
                    {r.ncr_no && ` · NCR ${r.ncr_no}`}
                    {r.remarks && <span className="text-muted-foreground"> · {r.remarks}</span>}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <div>
          <h3 className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold">
            <Package className="size-4" /> Material for this stage
          </h3>
          {s.materials.length === 0 ? (
            <p className="text-[13px] text-muted-foreground">No material listed.</p>
          ) : (
            <table className="w-full text-left text-[13px]">
              <thead className="text-[11px] uppercase text-muted-foreground">
                <tr>
                  <th className="py-1 pr-2">Material</th>
                  <th className="py-1 pr-2 text-right">Qty</th>
                  <th className="py-1">Order by</th>
                </tr>
              </thead>
              <tbody>
                {s.materials.map((m) => (
                  <tr key={`${m.material}|${m.unit}`} className="border-t border-border">
                    <td className="py-1 pr-2">{m.material}</td>
                    <td className="tnum py-1 pr-2 text-right">
                      {m.qty.toLocaleString("en-IN")} {m.unit}
                    </td>
                    <td className="py-1">{fmtDay(m.orderBy)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div>
          <h3 className="mb-1.5 text-sm font-semibold">Steel</h3>
          {!s.steel ? (
            <p className="text-[13px] text-muted-foreground">No steel in this stage.</p>
          ) : (
            <div className="text-[13px]">
              <p>
                Total order {Math.round(s.steel.totalKg).toLocaleString("en-IN")} kg · binding wire{" "}
                {s.steel.bindingWireKg} kg · cover blocks {s.steel.coverBlocks} · order by{" "}
                {fmtDay(s.steel.orderBy)}
              </p>
              <table className="mt-1 w-full text-left">
                <thead className="text-[11px] uppercase text-muted-foreground">
                  <tr>
                    <th className="py-1 pr-2">Dia</th>
                    <th className="py-1 pr-2 text-right">Net kg</th>
                    <th className="py-1 pr-2 text-right">Bars</th>
                    <th className="py-1 text-right">Order kg</th>
                  </tr>
                </thead>
                <tbody>
                  {s.steel.bars.map((b) => (
                    <tr key={b.dia} className="tnum border-t border-border">
                      <td className="py-1 pr-2">{b.dia} mm</td>
                      <td className="py-1 pr-2 text-right">{b.netKg.toLocaleString("en-IN")}</td>
                      <td className="py-1 pr-2 text-right">{b.bars}</td>
                      <td className="py-1 text-right">{b.orderKg.toLocaleString("en-IN")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </article>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-card p-6 text-sm text-muted-foreground">
      {text}
    </div>
  );
}
