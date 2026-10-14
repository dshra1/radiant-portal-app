import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  CalendarClock,
  ClipboardCheck,
  FileText,
  HardHat,
  Loader2,
  Send,
  ShoppingCart,
  ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";
import { useSessionUser } from "@/lib/access";
import { DAY, fmtDay, toDay } from "@/lib/programme-progress";
import { dayIso, stageName, useSiteWeek, type PlanStage } from "@/lib/site-week";
import { pushStageTasks, raiseAlerts } from "@/lib/site-week-actions";
import { StageCloseout } from "@/components/saha/StageCloseout";
import { useActiveProject } from "@/hooks/useActiveProject";

export type WeekFocus = "all" | "materials" | "qa" | "tasks";

/**
 * "This week on site": the programme stage(s) the site is on, driving every
 * module. Shown at the top of the Action Centre, Command Dashboard, Field
 * Console, Inventory, Purchases, QA and Tasks, each with the part it needs.
 */
export function SiteWeekPanel({
  projectId,
  focus = "all",
}: {
  projectId: string;
  focus?: WeekFocus;
}) {
  const user = useSessionUser();
  const qc = useQueryClient();
  const q = useSiteWeek(projectId);
  const [closing, setClosing] = useState<PlanStage | null>(null);
  const [sending, setSending] = useState(false);
  const who = { id: user?.id ?? null, name: user?.email ?? "Site team" };

  // Raise today's alerts once a day per project (also deduplicated in the database).
  useEffect(() => {
    if (!q.data || !user?.id || !projectId) return;
    const k = `saha-site-alerts-${projectId}`;
    const today = dayIso(q.data.today);
    try {
      if (window.localStorage.getItem(k) === today) return;
    } catch {
      /* storage blocked: rely on the database check */
    }
    void raiseAlerts(projectId, q.data, { id: user.id, name: user.email })
      .then((n) => {
        try {
          window.localStorage.setItem(k, today);
        } catch {
          /* ignore */
        }
        if (n) void qc.invalidateQueries({ queryKey: ["notifications"] });
      })
      .catch(() => undefined);
  }, [q.data, user?.id, user?.email, projectId, qc]);

  if (!projectId) return null;
  if (q.isPending)
    return (
      <div className="rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground">
        Loading this week's site plan…
      </div>
    );
  if (q.isError || !q.data) return null;
  const w = q.data;
  if (!w.stages.length)
    return (
      <div className="rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground">
        No programme for this project yet. Import the Construction Control workbook (Import PMC
        Workbooks) and the app will run the site week by week.
      </div>
    );

  const windowLabel = `${fmtDay(dayIso(w.anchor))} – ${fmtDay(dayIso(w.anchor + 6))}`;
  const sendInstructions = async () => {
    setSending(true);
    try {
      const soon = w.next.filter((s) => toDay(s.plannedStart) <= w.anchor + 13);
      const n = await pushStageTasks(projectId, [...w.now, ...soon], who);
      toast.success(
        n
          ? `${n} stage instruction${n > 1 ? "s" : ""} sent to Task Tracker`
          : "Instructions for these stages were already sent",
      );
      await qc.invalidateQueries({ queryKey: ["team_messages"] });
    } catch (e) {
      toast.error((e as Error).message);
    }
    setSending(false);
  };

  const showStages = focus === "all" || focus === "tasks";
  const showOrders = focus === "all" || focus === "materials";
  const showQa = focus === "all" || focus === "qa";

  return (
    <section className="rounded-2xl border border-primary/30 bg-card shadow-sm">
      <div className="flex flex-wrap items-center gap-2 border-b border-border p-4">
        <HardHat className="size-5 text-primary" />
        <div>
          <h2 className="text-base font-bold">
            {w.beforeStart
              ? `Before the start · ground work in ${w.daysToStart} days`
              : "This week on site"}
          </h2>
          <p className="text-xs text-muted-foreground">
            {w.beforeStart
              ? `Site starts ${fmtDay(w.startDate)} · first week ${windowLabel}`
              : `${windowLabel} · handover ${fmtDay(w.handover)}`}
          </p>
        </div>
        <div className="ml-auto flex flex-wrap gap-2">
          {(focus === "all" || focus === "tasks") && (
            <button
              type="button"
              onClick={() => void sendInstructions()}
              disabled={sending}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-50"
            >
              {sending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Send className="size-3.5" />
              )}
              Send instructions to the field
            </button>
          )}
          <Link
            to="/site-execution"
            className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold"
          >
            Programme
          </Link>
        </div>
      </div>

      <div className="grid gap-4 p-4 lg:grid-cols-2">
        {w.beforeStart && w.preStart.length > 0 && (focus === "all" || focus === "tasks") && (
          <Block
            icon={<CalendarClock className="size-4" />}
            title="Must be in hand before the start"
          >
            <ul className="space-y-1">
              {w.preStart.map((p) => {
                const late = toDay(p.neededBy) < w.today;
                return (
                  <li key={p.item} className="text-[13px]">
                    <b className={late ? "text-destructive" : ""}>{fmtDay(p.neededBy)}</b> ·{" "}
                    {p.item} <span className="text-muted-foreground">· {p.owner}</span>
                  </li>
                );
              })}
            </ul>
          </Block>
        )}

        {showStages && (
          <Block
            icon={<HardHat className="size-4" />}
            title={`${w.beforeStart ? "First week" : "On now"} (${w.now.length})`}
          >
            {w.now.length === 0 ? (
              <p className="text-[13px] text-muted-foreground">No stage planned this week.</p>
            ) : (
              <ul className="space-y-2">
                {w.now.map((s) => (
                  <StageCard
                    key={s.id}
                    s={s}
                    onClose={() => setClosing(s)}
                    detailed={focus === "tasks"}
                  />
                ))}
              </ul>
            )}
          </Block>
        )}

        {showStages && w.behind.length > 0 && (
          <Block
            icon={<AlertTriangle className="size-4 text-destructive" />}
            title={`Behind plan (${w.behind.length})`}
          >
            <ul className="space-y-2">
              {w.behind.map((s) => (
                <StageCard key={s.id} s={s} onClose={() => setClosing(s)} />
              ))}
            </ul>
          </Block>
        )}

        {(showStages || showQa) && w.awaitingCloseout.length > 0 && (
          <Block
            icon={<ClipboardCheck className="size-4" />}
            title={`Close-out due (${w.awaitingCloseout.length})`}
          >
            <ul className="space-y-1 text-[13px]">
              {w.awaitingCloseout.map((s) => (
                <li key={s.id} className="flex items-center gap-2">
                  <b>{s.code}</b> {stageName(s.name).slice(0, 50)}
                  <button
                    type="button"
                    onClick={() => setClosing(s)}
                    className="ml-auto rounded bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground"
                  >
                    Close out
                  </button>
                </li>
              ))}
            </ul>
          </Block>
        )}

        {showQa && (
          <Block
            icon={<ShieldAlert className="size-4 text-red-600" />}
            title={`Hold points this week (${w.holds.length})`}
          >
            {w.holds.length === 0 ? (
              <p className="text-[13px] text-muted-foreground">None open this week.</p>
            ) : (
              <ul className="space-y-1.5 text-[13px]">
                {w.holds.map((h) => (
                  <li key={`${h.stage.id}-${h.check.id}`}>
                    <b className="text-red-700">
                      {h.stage.code} · {h.check.id}
                    </b>{" "}
                    {h.check.check}
                    {h.check.criterion && (
                      <span className="block text-[12px] text-muted-foreground">
                        {h.check.criterion}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => setClosing(h.stage)}
                      className="text-xs font-semibold text-primary underline"
                    >
                      Record result
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Block>
        )}

        {showOrders && (
          <Block
            icon={<ShoppingCart className="size-4" />}
            title={`To order (order-by within 2 weeks: ${w.orders.length})`}
          >
            {w.orders.length === 0 ? (
              <p className="text-[13px] text-muted-foreground">Nothing due to order.</p>
            ) : (
              <>
                <table className="w-full text-[12px]">
                  <tbody>
                    {w.orders.slice(0, focus === "materials" ? 60 : 10).map((o, i) => (
                      <tr key={i} className="border-t border-border/50 align-top">
                        <td
                          className={`whitespace-nowrap pr-2 font-semibold ${o.overdue ? "text-destructive" : ""}`}
                        >
                          {fmtDay(o.orderBy)}
                        </td>
                        <td className="pr-2">{o.code}</td>
                        <td className="pr-2">{o.steel ? "TMT steel (all sizes)" : o.what}</td>
                        <td className="whitespace-nowrap text-right">
                          {o.qty.toLocaleString("en-IN")} {o.unit}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="mt-2 flex gap-2">
                  <Link
                    to="/po-create"
                    className="rounded-lg bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground"
                  >
                    Raise purchase order
                  </Link>
                  <Link
                    to="/inventory-control"
                    className="rounded-lg border border-border px-3 py-1 text-xs font-semibold"
                  >
                    Check stock
                  </Link>
                </div>
              </>
            )}
          </Block>
        )}

        {(focus === "all" || focus === "tasks" || focus === "materials") && w.next.length > 0 && (
          <Block icon={<CalendarClock className="size-4" />} title="Coming next (5 weeks)">
            <ul className="space-y-1 text-[13px]">
              {w.next.map((s) => (
                <li key={s.id}>
                  <b>{fmtDay(s.plannedStart)}</b> · {s.code} {stageName(s.name).slice(0, 60)}
                  {s.holdPoint && (
                    <span className="ml-1 text-[11px] font-bold text-red-700">HOLD</span>
                  )}{" "}
                  <DrawingsLink code={s.code} />
                </li>
              ))}
            </ul>
          </Block>
        )}
      </div>

      {closing && (
        <StageCloseout
          projectId={projectId}
          stage={closing}
          all={w.stages}
          who={who}
          onClose={() => setClosing(null)}
        />
      )}
    </section>
  );
}

function Block({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border p-3">
      <h3 className="mb-2 flex items-center gap-1.5 text-sm font-bold">
        {icon} {title}
      </h3>
      {children}
    </div>
  );
}

export function DrawingsLink({ code, label = "Drawings" }: { code: string; label?: string }) {
  return (
    <Link
      to="/stage-drawings"
      search={{ stage: code }}
      className="inline-flex items-center gap-0.5 text-xs font-semibold text-primary underline"
    >
      <FileText className="size-3" />
      {label}
    </Link>
  );
}

function StageCard({
  s,
  onClose,
  detailed = false,
}: {
  s: PlanStage;
  onClose: () => void;
  detailed?: boolean;
}) {
  const [open, setOpen] = useState(detailed);
  const holds = s.checks.filter((c) => c.point === "H");
  const days = Math.max(1, toDay(s.plannedEnd) - toDay(s.plannedStart) + 1);
  const elapsed = Math.round(((Date.now() / DAY - toDay(s.plannedStart)) / days) * 100);
  return (
    <li className="rounded-lg border border-border p-2 text-[13px]">
      <div className="flex flex-wrap items-center gap-2">
        <b className={s.holdPoint ? "text-red-700" : "text-primary"}>{s.code}</b>
        <span className="min-w-0 flex-1">{stageName(s.name)}</span>
        <span className="text-[11px] text-muted-foreground">
          {fmtDay(s.plannedStart)} → {fmtDay(s.plannedEnd)} · {s.actualPct}% done
          {elapsed > 0 && elapsed < 200 ? ` · ${Math.min(100, elapsed)}% of time` : ""}
        </span>
      </div>
      <div className="mt-1 flex flex-wrap items-center gap-3 text-xs">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="font-semibold text-primary underline"
        >
          {open ? "Hide" : "How to do it"}
        </button>
        <DrawingsLink code={s.code} />
        <Link
          to="/stage-budget"
          search={{ stage: s.code }}
          className="text-xs font-semibold text-primary underline"
        >
          Budget
        </Link>
        <span className="text-muted-foreground">
          {s.materials.length} materials
          {s.steel ? ` · steel ${(s.steel.totalKg / 1000).toFixed(1)} t` : ""}
          {holds.length ? ` · ${holds.length} hold point${holds.length > 1 ? "s" : ""}` : ""}
        </span>
        <button
          type="button"
          onClick={onClose}
          className="ml-auto rounded bg-primary/10 px-2 py-0.5 font-semibold text-primary"
        >
          Photos, checks, close-out
        </button>
      </div>
      {open && (
        <div className="mt-2 space-y-1 text-[12px]">
          {s.directions.map((d) => (
            <div key={d.title}>
              <p className="font-semibold">{d.title}</p>
              <ol className="space-y-0.5">
                {d.steps.map((t) => (
                  <li key={t} className={/HOLD/.test(t) ? "text-red-800" : ""}>
                    {t}
                  </li>
                ))}
              </ol>
            </div>
          ))}
          {holds.map((c) => (
            <p key={c.id} className="text-red-800">
              HOLD {c.id} {c.check}: {c.criterion}
            </p>
          ))}
          {s.materials.length > 0 && (
            <p className="text-muted-foreground">
              Material:{" "}
              {s.materials
                .slice(0, 8)
                .map((m) => `${m.material} ${m.qty.toLocaleString("en-IN")} ${m.unit}`)
                .join(" · ")}
              {s.materials.length > 8 ? ` · +${s.materials.length - 8} more` : ""}
            </p>
          )}
        </div>
      )}
    </li>
  );
}

/** The panel for the project selected at the top of the app. */
export function ActiveSiteWeek({ focus = "all" }: { focus?: WeekFocus }) {
  const project = useActiveProject();
  if (!project.id) return null;
  return (
    <div className="px-4 pt-4 md:px-6">
      <SiteWeekPanel projectId={project.id} focus={focus} />
    </div>
  );
}
