import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Boxes,
  Camera,
  CheckCircle2,
  ChevronDown,
  CircleDashed,
  ClipboardCheck,
  FileText,
  HardHat,
  Loader2,
  ShieldAlert,
  Users,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Shell } from "@/components/saha/Shell";
import { StageCloseout } from "@/components/saha/StageCloseout";
import { supabase } from "@/integrations/supabase/client";
import { useActiveProject } from "@/hooks/useActiveProject";
import { useSessionUser } from "@/lib/access";
import { fmtDay, toDay, todayDay } from "@/lib/programme-progress";
import {
  isClosed,
  isWorkQuantity,
  loadOrderedMaterial,
  stageName,
  successorsOf,
  useSiteWeek,
  type PlanStage,
} from "@/lib/site-week";
import { uploadStageFiles } from "@/lib/site-week-actions";
import { sheetsForStage, shortFile } from "@/lib/drawing-sheets";
import { TRADE_PREFIX, tradeOfStage } from "@/lib/work-cards";
import { jobGuideOf } from "@/lib/job-guide";

type Search = { stage?: string };

export const Route = createFileRoute("/job")({
  validateSearch: (s: Record<string, unknown>): Search => {
    const out: Search = {};
    if (typeof s["stage"] === "string") out.stage = s["stage"];
    return out;
  },
  head: () => ({
    meta: [
      { title: "Job | SiteYantra" },
      {
        name: "description",
        content:
          "Everything for one stage on one page: previous stage, readiness, method, precautions, checks, work card, material in stock, labour and drawings.",
      },
    ],
  }),
  component: Page,
});

type Tone = "ok" | "warn" | "bad" | "info";
type ReadyItem = { label: string; detail: string; tone: Tone; href?: string };

const toneCls: Record<Tone, string> = {
  ok: "text-emerald-700",
  warn: "text-amber-700",
  bad: "text-red-700",
  info: "text-slate-600",
};
function ToneIcon({ tone }: { tone: Tone }) {
  const c = `size-5 shrink-0 ${toneCls[tone]}`;
  if (tone === "ok") return <CheckCircle2 className={c} />;
  if (tone === "bad") return <XCircle className={c} />;
  if (tone === "warn") return <AlertTriangle className={c} />;
  return <CircleDashed className={c} />;
}

const fmtQty = (n: number) => n.toLocaleString("en-IN", { maximumFractionDigits: 2 });
const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

function statusOf(s: PlanStage) {
  if (isClosed(s)) return { label: "Closed", tone: "ok" as Tone };
  if (s.actualPct >= 100) return { label: "100% · close-out due", tone: "warn" as Tone };
  if (s.actualPct > 0) return { label: `${s.actualPct}% done`, tone: "info" as Tone };
  return { label: "Not started", tone: "info" as Tone };
}

function Page() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/job" });
  const project = useActiveProject();
  const user = useSessionUser();
  const qc = useQueryClient();
  const who = { id: user?.id ?? null, name: user?.email ?? "Site team" };
  const week = useSiteWeek(project.id);
  const stages = useMemo(() => week.data?.stages ?? [], [week.data]);
  const s =
    stages.find((x) => x.code === search.stage) ?? week.data?.now[0] ?? stages[0] ?? undefined;
  const [closing, setClosing] = useState(false);
  const [busy, setBusy] = useState(false);

  const go = (code: string) => {
    void navigate({ search: { stage: code } });
    window.scrollTo({ top: 0 });
  };

  return (
    <Shell title="Job">
      <div className="mx-auto flex w-full max-w-xl flex-col gap-3 px-3 pb-10 pt-3">
        <div className="flex items-center gap-2">
          <Link to="/site-today" className="rounded-lg border border-border p-2" aria-label="Back">
            <ArrowLeft className="size-5" />
          </Link>
          <select
            aria-label="Stage"
            value={s?.code ?? ""}
            onChange={(e) => go(e.target.value)}
            className="h-11 min-w-0 flex-1 rounded-xl border border-border bg-background px-3 text-[15px]"
          >
            {week.data && week.data.now.length > 0 && (
              <optgroup label="On now">
                {week.data.now.map((x) => (
                  <option key={`n-${x.code}`} value={x.code}>
                    {x.code} · {stageName(x.name).slice(0, 48)}
                  </option>
                ))}
              </optgroup>
            )}
            <optgroup label="All stages">
              {stages.map((x) => (
                <option key={x.code} value={x.code}>
                  {x.code} · {stageName(x.name).slice(0, 48)}
                </option>
              ))}
            </optgroup>
          </select>
        </div>

        {week.isPending && <p className="text-sm text-muted-foreground">Loading…</p>}
        {week.data && !s && (
          <p className="rounded-2xl border border-border bg-card p-4 text-sm">
            No stages in this project yet.
          </p>
        )}
        {s && (
          <Job
            key={s.code}
            s={s}
            all={stages}
            projectId={project.id}
            projectName={project.name}
            onGo={go}
            actions={
              <div className="mt-3 flex gap-2 [&>*]:min-w-0 [&>*]:flex-1 [&>*]:basis-0">
                <label className="flex h-12 cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground">
                  {busy ? (
                    <Loader2 className="size-5 animate-spin" />
                  ) : (
                    <Camera className="size-5" />
                  )}
                  Photo
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    multiple
                    className="hidden"
                    onChange={async (e) => {
                      const files = e.target.files;
                      if (!files?.length) return;
                      setBusy(true);
                      try {
                        await uploadStageFiles(project.id, s, Array.from(files), "progress", who);
                        toast.success(`${files.length} photo(s) saved to ${s.code}`);
                        void qc.invalidateQueries({
                          queryKey: ["stage_media", project.id, s.code],
                        });
                      } catch (err) {
                        toast.error((err as Error).message);
                      }
                      setBusy(false);
                      e.target.value = "";
                    }}
                  />
                </label>
                {jobGuideOf(s.code, s.name)?.pour ? (
                  <Link
                    to="/pour-cards"
                    className="flex h-12 items-center justify-center gap-2 rounded-xl border border-border text-sm font-semibold"
                  >
                    <ClipboardCheck className="size-5" /> Pour card
                  </Link>
                ) : (
                  <Link
                    to="/work-cards"
                    search={{ stage: s.code }}
                    className="flex h-12 items-center justify-center gap-2 rounded-xl border border-border text-sm font-semibold"
                  >
                    <ClipboardCheck className="size-5" /> Work card
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => setClosing(true)}
                  className="flex h-12 items-center justify-center gap-2 rounded-xl border border-primary text-sm font-semibold text-primary"
                >
                  <CheckCircle2 className="size-5" /> Checks
                </button>
              </div>
            }
          />
        )}
      </div>

      {closing && s && week.data && (
        <StageCloseout
          projectId={project.id}
          stage={s}
          all={week.data.stages}
          who={who}
          onClose={() => setClosing(false)}
        />
      )}
    </Shell>
  );
}

function Section({
  id,
  icon,
  title,
  badge,
  children,
  open: initial = true,
}: {
  id: string;
  icon: React.ReactNode;
  title: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
  open?: boolean;
}) {
  const [open, setOpen] = useState(initial);
  return (
    <section id={id} className="scroll-mt-28 rounded-2xl border border-border bg-card">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2 p-4 text-left"
      >
        {icon}
        <h2 className="flex-1 text-base font-bold">{title}</h2>
        {badge}
        <ChevronDown className={`size-5 transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="px-4 pb-4 text-[15px]">{children}</div>}
    </section>
  );
}

function Job({
  s,
  all,
  projectId,
  projectName,
  onGo,
  actions,
}: {
  s: PlanStage;
  all: PlanStage[];
  projectId: string;
  projectName: string;
  onGo: (code: string) => void;
  actions: React.ReactNode;
}) {
  const guide = jobGuideOf(s.code, s.name);
  const trade = tradeOfStage(s.code, s.name);
  const preds = s.preds.map((c) => all.find((x) => x.code === c)).filter(Boolean) as PlanStage[];
  const next = successorsOf(all, s.code);
  const sheets = useMemo(
    () => sheetsForStage(s.code, s.floor, projectName),
    [s.code, s.floor, projectName],
  );
  const sheetCount = sheets.reduce((n, g) => n + g.sheets.length, 0);

  // Everything recorded against this stage, in one go.
  const data = useQuery({
    queryKey: ["job", projectId, s.code],
    enabled: Boolean(projectId),
    queryFn: async () => {
      const [items, moves, labour, cards, media, cubes, ordered] = await Promise.all([
        supabase
          .from("stock_items")
          .select("id,item_code,description,unit,opening_qty")
          .eq("project_id", projectId),
        supabase
          .from("stock_movements")
          .select("item_id,item_code,movement_type,quantity,stage_code")
          .eq("project_id", projectId),
        supabase
          .from("labour_entries")
          .select("work_date,trade,headcount,contractor")
          .eq("project_id", projectId)
          .eq("stage_code", s.code),
        supabase
          .from("pour_cards")
          .select("id,pour_ref,element,status")
          .eq("project_id", projectId)
          .like("pour_ref", `${s.code} · %`),
        supabase
          .from("project_media")
          .select("id,category")
          .eq("project_id", projectId)
          .eq("stage", s.code),
        supabase
          .from("cube_tests")
          .select("pour")
          .eq("project_id", projectId)
          .eq("stage_code", s.code),
        loadOrderedMaterial(projectId),
      ]);
      return {
        items: items.data ?? [],
        moves: moves.data ?? [],
        labour: labour.data ?? [],
        cards: cards.data ?? [],
        media: media.data ?? [],
        pours: (cubes.data ?? []).map((c) => c.pour),
        ordered,
      };
    },
  });
  const d = data.data;

  // Before the stage is near, missing items are "to do", not faults.
  const soon = s.actualPct > 0 || !s.plannedStart || toDay(s.plannedStart) <= todayDay() + 7;
  const missTone: Tone = soon ? "bad" : "warn";

  // Material: each line against the store balance, what is issued to this stage, and POs.
  const material = useMemo(() => {
    if (!d) return [];
    const bal = new Map<string, { balance: number; issuedHere: number }>();
    for (const it of d.items) bal.set(it.id, { balance: it.opening_qty, issuedHere: 0 });
    const codeToId = new Map(d.items.map((it) => [it.item_code.toLowerCase(), it.id]));
    for (const m of d.moves) {
      const id = m.item_id ?? codeToId.get(m.item_code.toLowerCase());
      const b = id ? bal.get(id) : undefined;
      if (!b) continue;
      const q = Number(m.quantity) || 0;
      if (m.movement_type === "issue") {
        b.balance -= q;
        if (m.stage_code === s.code) b.issuedHere += q;
      } else if (m.movement_type === "receipt" || m.movement_type === "return") b.balance += q;
      else b.balance += q; // signed adjustment
    }
    const lines = s.materials
      .filter((m) => !isWorkQuantity(m.material))
      .map((m) => {
        const it =
          d.items.find(
            (x) => norm(x.description) === norm(m.material) && norm(x.unit) === norm(m.unit),
          ) ?? d.items.find((x) => norm(x.description) === norm(m.material));
        const b = it ? bal.get(it.id) : undefined;
        const issued = b?.issuedHere ?? 0;
        const stillNeeded = Math.max(0, m.qty - issued);
        const po = d.ordered.get(`${s.code}|${m.material}`);
        let tone: Tone = "info";
        let state = "Not in the stock register";
        if (b) {
          if (stillNeeded === 0) {
            tone = "ok";
            state = "Fully issued to this stage";
          } else if (b.balance >= stillNeeded) {
            tone = "ok";
            state = `In store: ${fmtQty(b.balance)} ${m.unit}`;
          } else {
            const lateOrder = Boolean(m.orderBy) && toDay(m.orderBy as string) < todayDay();
            tone = po ? "warn" : lateOrder || soon ? "bad" : "warn";
            state = `Short ${fmtQty(stillNeeded - Math.max(0, b.balance))} ${m.unit} (store ${fmtQty(b.balance)})`;
          }
        }
        if (tone !== "ok" && po) state += ` · on ${po}`;
        else if (tone !== "ok" && m.orderBy)
          state += ` · order by ${fmtDay(m.orderBy)}${toDay(m.orderBy) < todayDay() ? " (late)" : ""}`;
        return { ...m, issued, state, tone, itemId: it?.id };
      });
    return lines;
  }, [d, s.materials, s.code, soon]);
  const workQty = s.materials.filter((m) => isWorkQuantity(m.material));
  const short = material.filter((m) => m.tone === "bad").length;
  const pending = material.filter((m) => m.tone === "warn" || m.tone === "info").length;
  const firstOrderBy = material
    .filter((m) => m.tone !== "ok" && m.orderBy)
    .map((m) => m.orderBy as string)
    .sort()[0];

  // Cards for this stage: trade work cards, or concrete pour cards.
  const workCards = (d?.cards ?? []).filter((c) => c.element.startsWith(TRADE_PREFIX));
  const pourCards = (d?.cards ?? []).filter((c) => !c.element.startsWith(TRADE_PREFIX));
  const okCard = (st: string) => st === "approved" || st === "done" || st === "poured";
  const poursOk = new Set(pourCards.filter((c) => okCard(c.status)).map((c) => c.pour_ref));
  const poursMissing = (d?.pours ?? []).filter((p) => !poursOk.has(`${s.code} · ${p}`));

  // Labour booked against this stage.
  const booked = useMemo(() => {
    const m = new Map<string, number>();
    for (const l of d?.labour ?? [])
      m.set(l.trade, (m.get(l.trade) ?? 0) + (Number(l.headcount) || 0));
    return m;
  }, [d]);
  const bookedTotal = [...booked.values()].reduce((a, b) => a + b, 0);
  const days = new Set((d?.labour ?? []).map((l) => l.work_date)).size;
  const photos = (d?.media ?? []).filter((m) => m.category !== "approval").length;

  const openHolds = s.checks.filter(
    (c) => c.point === "H" && s.evidence.checks?.[c.id]?.result !== "OK",
  );
  const doneChecks = s.checks.filter((c) => s.evidence.checks?.[c.id]?.result === "OK").length;

  // Can I start / carry on? One list, worst first.
  const ready: ReadyItem[] = [];
  const predsOpen = preds.filter((p) => !isClosed(p));
  ready.push(
    preds.length === 0
      ? { label: "Previous stage", detail: "None — this is a first stage", tone: "ok" }
      : predsOpen.length === 0
        ? {
            label: "Previous stage",
            detail: `${preds.map((p) => p.code).join(", ")} closed`,
            tone: "ok",
          }
        : {
            label: "Previous stage",
            detail: `${predsOpen.map((p) => `${p.code} ${p.actualPct >= 100 ? "(close-out due)" : `(${p.actualPct}%)`}`).join(", ")} not closed yet`,
            tone: missTone,
          },
  );
  ready.push(
    sheetCount
      ? { label: "Drawings", detail: `${sheetCount} sheets for this stage`, tone: "ok" }
      : { label: "Drawings", detail: "No sheets linked — ask the PM", tone: "warn" },
  );
  if (material.length)
    ready.push(
      short
        ? { label: "Material", detail: `${short} item(s) short and not on a PO`, tone: "bad" }
        : pending
          ? {
              label: "Material",
              detail: `${pending} item(s) to order or receive${firstOrderBy ? ` · first by ${fmtDay(firstOrderBy)}` : ""}`,
              tone: "warn",
            }
          : { label: "Material", detail: "All in store or issued", tone: "ok" },
    );
  if (trade) {
    const ok = workCards.some((c) => okCard(c.status));
    const open = workCards.filter((c) => c.status === "pending" || c.status === "draft").length;
    ready.push(
      ok
        ? { label: "Work card", detail: `${trade.gate}`, tone: "ok" }
        : open
          ? { label: "Work card", detail: `${open} awaiting approval`, tone: "warn" }
          : {
              label: "Work card",
              detail: "Not raised yet — fill checks and readings",
              tone: missTone,
            },
    );
  }
  if (guide?.pour || (d?.pours.length ?? 0) > 0)
    ready.push(
      (d?.pours.length ?? 0) === 0
        ? { label: "Pour card", detail: "Raise one before every pour", tone: "info" }
        : poursMissing.length
          ? {
              label: "Pour card",
              detail: `${poursMissing.length} pour(s) not approved: ${poursMissing.join(", ")}`,
              tone: missTone,
            }
          : { label: "Pour card", detail: "All pours approved", tone: "ok" },
    );
  ready.push(
    openHolds.length
      ? {
          label: "Hold points",
          detail: `${openHolds.length} to be signed before work goes on`,
          tone: "warn",
        }
      : {
          label: "Hold points",
          detail: s.checks.some((c) => c.point === "H") ? "All signed" : "None in this stage",
          tone: "ok",
        },
  );
  const bad = ready.filter((r) => r.tone === "bad").length;
  const warns = ready.filter((r) => r.tone === "warn").length;
  const st = statusOf(s);
  const late =
    !isClosed(s) && s.plannedEnd && toDay(s.plannedEnd) < todayDay() && s.actualPct < 100;

  const chips = [
    ["ready", "Ready?"],
    ["how", "How"],
    ["safety", "Safety"],
    ["checks", "Checks"],
    ["material", "Material"],
    ["labour", "Labour"],
    ["drawings", "Drawings"],
    ["next", "Next"],
  ] as const;

  return (
    <>
      <header className="rounded-2xl border border-border bg-card p-4">
        <div className="flex items-start gap-2">
          <span
            className={`rounded-lg px-2 py-1 text-sm font-bold ${s.holdPoint ? "bg-red-100 text-red-800" : "bg-primary/10 text-primary"}`}
          >
            {s.code}
          </span>
          <div className="min-w-0">
            <h1 className="text-lg font-extrabold leading-tight">{stageName(s.name)}</h1>
            <p className="text-sm text-muted-foreground">
              {s.floor && !s.name.toLowerCase().startsWith(s.floor.toLowerCase())
                ? `${s.floor} · `
                : ""}
              {guide?.label ?? s.group}
            </p>
          </div>
        </div>
        <div className="mt-3 flex gap-2 text-center text-sm [&>*]:min-w-0 [&>*]:flex-1 [&>*]:basis-0">
          <div className="rounded-xl bg-muted/50 p-2">
            <p className="text-xs text-muted-foreground">Plan</p>
            <p className="font-semibold">
              {fmtDay(s.plannedStart)}–{fmtDay(s.plannedEnd)}
            </p>
          </div>
          <div className="rounded-xl bg-muted/50 p-2">
            <p className="text-xs text-muted-foreground">Days</p>
            <p className="font-semibold">{s.durationDays} working</p>
          </div>
          <div className={`rounded-xl p-2 ${late ? "bg-red-50" : "bg-muted/50"}`}>
            <p className="text-xs text-muted-foreground">Status</p>
            <p className={`font-semibold ${late ? "text-red-700" : toneCls[st.tone]}`}>
              {late ? `Late · ${s.actualPct}%` : st.label}
            </p>
          </div>
        </div>
        {actions}
      </header>

      <div className="sticky top-16 z-20 -mx-3 flex gap-2 overflow-x-auto bg-background/95 px-3 py-2 backdrop-blur">
        {chips.map(([id, label]) => (
          <a
            key={id}
            href={`#${id}`}
            className="whitespace-nowrap rounded-full border border-border px-3 py-1.5 text-sm font-medium"
          >
            {label}
          </a>
        ))}
      </div>

      <Section
        id="ready"
        icon={<CheckCircle2 className="size-5 text-primary" />}
        title={isClosed(s) ? "Stage closed" : s.actualPct > 0 ? "Can work go on?" : "Can I start?"}
        badge={
          data.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-bold ${bad ? "bg-red-100 text-red-800" : warns ? "bg-amber-100 text-amber-900" : "bg-emerald-100 text-emerald-800"}`}
            >
              {bad ? `${bad} to fix` : warns ? `${warns} to do` : "Ready"}
            </span>
          )
        }
      >
        <ul className="divide-y divide-border/60">
          {ready.map((r) => (
            <li key={r.label} className="flex items-start gap-2 py-2">
              <ToneIcon tone={r.tone} />
              <div>
                <p className="font-semibold">{r.label}</p>
                <p className={`text-sm ${toneCls[r.tone]}`}>{r.detail}</p>
              </div>
            </li>
          ))}
        </ul>
        {preds.length > 0 && (
          <div className="mt-2">
            <p className="text-sm font-semibold text-muted-foreground">Previous stages</p>
            <div className="mt-1 flex flex-wrap gap-2">
              {preds.map((p) => (
                <StageChip key={p.code} p={p} onGo={onGo} />
              ))}
            </div>
          </div>
        )}
      </Section>

      <Section id="how" icon={<HardHat className="size-5 text-primary" />} title="How to do it">
        {guide ? (
          <ol className="list-decimal space-y-1 pl-5">
            {guide.steps.map((t) => (
              <li key={t} className={/HOLD/.test(t) ? "font-semibold text-red-800" : ""}>
                {t}
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-sm text-muted-foreground">Follow the phase directions below.</p>
        )}
        {guide && guide.tools.length > 0 && (
          <>
            <p className="mt-3 font-semibold">Tools and equipment</p>
            <p className="text-sm">{guide.tools.join(" · ")}</p>
          </>
        )}
        {s.directions.length > 0 && (
          <details className="mt-3 rounded-xl bg-muted/40 p-3 text-sm">
            <summary className="cursor-pointer font-semibold">
              Phase directions ({s.directions[0]?.title})
            </summary>
            {s.directions.map((dr) => (
              <ol key={dr.title} className="mt-2 space-y-1">
                {dr.steps.map((t) => (
                  <li key={t} className={/HOLD/.test(t) ? "font-semibold text-red-800" : ""}>
                    {t}
                  </li>
                ))}
              </ol>
            ))}
          </details>
        )}
      </Section>

      {guide && (
        <Section
          id="safety"
          icon={<ShieldAlert className="size-5 text-red-700" />}
          title="Precautions"
        >
          <p className="font-semibold text-red-800">Safety</p>
          <ul className="mt-1 list-disc space-y-1 pl-5">
            {guide.safety.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
          <p className="mt-3 font-semibold text-amber-800">Avoid (costs rework)</p>
          <ul className="mt-1 list-disc space-y-1 pl-5">
            {guide.avoid.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </Section>
      )}

      <Section
        id="checks"
        icon={<ClipboardCheck className="size-5 text-primary" />}
        title="Checks, hold points and cards"
        badge={
          s.checks.length ? (
            <span className="text-sm text-muted-foreground">
              {doneChecks}/{s.checks.length}
            </span>
          ) : undefined
        }
      >
        {s.checks.length === 0 && <p className="text-sm text-muted-foreground">No stage checks.</p>}
        <ul className="space-y-2">
          {s.checks.map((c) => {
            const r = s.evidence.checks?.[c.id];
            return (
              <li key={c.id} className="flex items-start gap-2">
                <ToneIcon
                  tone={r?.result === "OK" ? "ok" : r ? "bad" : c.point === "H" ? "warn" : "info"}
                />
                <div>
                  <p className="font-semibold">
                    <span
                      className={`mr-1 rounded px-1 text-xs ${c.point === "H" ? "bg-red-100 text-red-800" : "bg-muted"}`}
                    >
                      {c.point === "H" ? "HOLD" : c.point === "W" ? "WITNESS" : "RECORD"}
                    </span>
                    {c.check}
                  </p>
                  {c.criterion && <p className="text-sm">{c.criterion}</p>}
                  <p className="text-xs text-muted-foreground">
                    {r
                      ? `${r.result} · ${r.by} · ${fmtDay(r.on)}${r.at ? ` · ${r.at}` : ""}`
                      : `Signs: ${c.by ?? "PMC"}`}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
        {trade && (
          <div className="mt-3 rounded-xl border border-border p-3">
            <p className="font-semibold">Work card · {trade.label}</p>
            {workCards.length === 0 ? (
              <p className="text-sm text-red-700">
                None yet. {trade.checks.length} checks
                {trade.tests.length ? ` and ${trade.tests.length} test reading(s)` : ""} to fill.
              </p>
            ) : (
              <ul className="text-sm">
                {workCards.map((c) => (
                  <li key={c.id}>
                    {c.pour_ref.replace(`${s.code} · `, "")}:{" "}
                    <b className={okCard(c.status) ? "text-emerald-700" : "text-amber-700"}>
                      {c.status}
                    </b>
                  </li>
                ))}
              </ul>
            )}
            <Link
              to="/work-cards"
              search={{ stage: s.code }}
              className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-primary"
            >
              Open work card <ArrowRight className="size-4" />
            </Link>
          </div>
        )}
        {(guide?.pour || pourCards.length > 0) && (
          <div className="mt-3 rounded-xl border border-border p-3">
            <p className="font-semibold">Pour cards</p>
            {pourCards.length === 0 ? (
              <p className="text-sm text-muted-foreground">None raised for {s.code} yet.</p>
            ) : (
              <ul className="text-sm">
                {pourCards.map((c) => (
                  <li key={c.id}>
                    {c.pour_ref.replace(`${s.code} · `, "")}:{" "}
                    <b className={okCard(c.status) ? "text-emerald-700" : "text-amber-700"}>
                      {c.status}
                    </b>
                  </li>
                ))}
              </ul>
            )}
            <Link
              to="/pour-cards"
              className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-primary"
            >
              Open pour cards <ArrowRight className="size-4" />
            </Link>
          </div>
        )}
        <p className="mt-3 text-sm text-muted-foreground">
          {photos} photo(s) saved. Sign checks and close the stage with the Checks button below.
        </p>
      </Section>

      <Section
        id="material"
        icon={<Boxes className="size-5 text-primary" />}
        title="Material"
        badge={
          short ? (
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-800">
              {short} short
            </span>
          ) : undefined
        }
      >
        {material.length === 0 && !s.steel && (
          <p className="text-sm text-muted-foreground">No material listed for this stage.</p>
        )}
        <ul className="divide-y divide-border/60">
          {material.map((m, i) => (
            <li key={i} className="py-2">
              <div className="flex justify-between gap-2">
                <span className="font-medium">{m.material}</span>
                <span className="whitespace-nowrap font-semibold">
                  {fmtQty(m.qty)} {m.unit}
                </span>
              </div>
              <p className={`text-sm ${toneCls[m.tone]}`}>
                {m.issued > 0 ? `Issued ${fmtQty(m.issued)} · ` : ""}
                {m.state}
              </p>
            </li>
          ))}
        </ul>
        {s.steel && (
          <div className="mt-2 rounded-xl bg-muted/40 p-3 text-sm">
            <p className="font-semibold">Steel: {fmtQty(Math.round(s.steel.totalKg))} kg</p>
            <p>{s.steel.bars.map((b) => `${b.dia} mm ${fmtQty(b.orderKg)} kg`).join(" · ")}</p>
            <p>
              Binding wire {s.steel.bindingWireKg} kg · cover blocks {s.steel.coverBlocks}
              {s.steel.orderBy ? ` · order by ${fmtDay(s.steel.orderBy)}` : ""}
            </p>
          </div>
        )}
        {workQty.length > 0 && (
          <p className="mt-2 text-sm text-muted-foreground">
            Work quantities:{" "}
            {workQty.map((m) => `${m.material} ${fmtQty(m.qty)} ${m.unit}`).join(" · ")}
          </p>
        )}
        <div className="mt-3 flex flex-wrap gap-3 text-sm font-semibold text-primary">
          <Link to="/inventory-control">Issue from store</Link>
          <Link to="/po-create">Raise PO</Link>
        </div>
      </Section>

      <Section
        id="labour"
        icon={<Users className="size-5 text-primary" />}
        title="Labour"
        badge={
          bookedTotal ? (
            <span className="text-sm text-muted-foreground">{bookedTotal} man-days booked</span>
          ) : undefined
        }
      >
        {guide ? (
          <>
            <p className="text-sm text-muted-foreground">
              Typical crew for {s.durationDays} working days (adjust to the contractor's gang)
            </p>
            <ul className="mt-1 divide-y divide-border/60">
              {guide.crew.map((c) => (
                <li key={c.trade + (c.note ?? "")} className="flex justify-between gap-2 py-1.5">
                  <span>
                    {c.trade}
                    {c.note && <span className="text-sm text-muted-foreground"> · {c.note}</span>}
                  </span>
                  <span className="whitespace-nowrap font-semibold">
                    {c.count}
                    {booked.has(c.trade) ? (
                      <span className="ml-2 text-xs font-normal text-muted-foreground">
                        {booked.get(c.trade)} booked
                      </span>
                    ) : null}
                  </span>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">No standard crew for this stage.</p>
        )}
        <p className="mt-2 text-sm">
          {bookedTotal
            ? `Booked so far: ${bookedTotal} man-days over ${days} day(s).`
            : "No labour booked against this stage yet."}
        </p>
        <div className="mt-2 flex flex-wrap gap-3 text-sm font-semibold text-primary">
          <Link to="/site-today" hash="report">
            Book in the daily report
          </Link>
          <Link to="/contractors-labour">Labour register</Link>
        </div>
      </Section>

      <Section
        id="drawings"
        icon={<FileText className="size-5 text-primary" />}
        title="Drawings and documents"
        badge={<span className="text-sm text-muted-foreground">{sheetCount}</span>}
      >
        {sheets.length === 0 && (
          <p className="text-sm text-muted-foreground">No drawing sheets linked to this stage.</p>
        )}
        {sheets.map((g, gi) => (
          <details key={g.label} open={gi === 0} className="border-b border-border/60 py-1.5">
            <summary className="cursor-pointer text-sm font-semibold">
              {g.label}{" "}
              <span className="font-normal text-muted-foreground">({g.sheets.length})</span>
            </summary>
            <ul>
              {g.sheets.map((sh) => (
                <li key={`${sh.file}-${sh.page}`}>
                  <Link
                    to="/stage-drawings"
                    search={{ stage: s.code, file: sh.file, page: sh.page }}
                    className="flex justify-between gap-2 py-1 text-sm text-primary"
                  >
                    <span>{sh.title}</span>
                    <span className="whitespace-nowrap text-xs text-muted-foreground">
                      {shortFile(sh.file)} p{sh.page}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </details>
        ))}
        <div className="mt-2 flex flex-wrap gap-3 text-sm font-semibold text-primary">
          <Link to="/stage-drawings" search={{ stage: s.code }}>
            Drawings + photo check
          </Link>
          <Link to="/execution-manual">Execution manual</Link>
        </div>
      </Section>

      <Section
        id="next"
        icon={<ArrowRight className="size-5 text-primary" />}
        title="What this unlocks"
      >
        {next.length === 0 ? (
          <p className="text-sm text-muted-foreground">No later stage waits on this one.</p>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              These start only after {s.code} is closed:
            </p>
            <div className="mt-1 flex flex-wrap gap-2">
              {next.map((p) => (
                <StageChip key={p.code} p={p} onGo={onGo} />
              ))}
            </div>
          </>
        )}
      </Section>
    </>
  );
}

function StageChip({ p, onGo }: { p: PlanStage; onGo: (code: string) => void }) {
  const st = statusOf(p);
  return (
    <button
      type="button"
      onClick={() => onGo(p.code)}
      className="flex items-center gap-1 rounded-xl border border-border px-3 py-2 text-left text-sm"
    >
      <ToneIcon tone={isClosed(p) ? "ok" : p.actualPct >= 100 ? "warn" : "info"} />
      <span>
        <b>{p.code}</b> {stageName(p.name).slice(0, 28)}
        <span className={`block text-xs ${toneCls[st.tone]}`}>{st.label}</span>
      </span>
    </button>
  );
}
