import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Camera,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  Loader2,
  Minus,
  Plus,
  Send,
} from "lucide-react";
import { toast } from "sonner";
import { Shell } from "@/components/saha/Shell";
import { StageCloseout } from "@/components/saha/StageCloseout";
import { supabase } from "@/integrations/supabase/client";
import { useActiveProject } from "@/hooks/useActiveProject";
import { useSessionUser } from "@/lib/access";
import { fmtDay } from "@/lib/programme-progress";
import { stageName, useSiteWeek, type PlanStage } from "@/lib/site-week";
import { uploadStageFiles } from "@/lib/site-week-actions";

export const Route = createFileRoute("/site-today")({
  head: () => ({
    meta: [
      { title: "Site Today | Saha OS" },
      {
        name: "description",
        content:
          "Phone view for the site team: today's stages, how to do them, photos, checks and the daily report.",
      },
    ],
  }),
  component: Page,
});

const TRADES = [
  "RCC / Shuttering",
  "Bar bending",
  "Masonry",
  "Plastering",
  "Plumbing",
  "Electrical",
  "Waterproofing",
  "Painting",
  "Flooring / Tiling",
  "Carpentry",
  "Helpers",
];

function Page() {
  const project = useActiveProject();
  const user = useSessionUser();
  const qc = useQueryClient();
  const q = useSiteWeek(project.id);
  const [closing, setClosing] = useState<PlanStage | null>(null);
  const who = { id: user?.id ?? null, name: user?.email ?? "Site team" };
  const w = q.data;
  const today = w
    ? w.now.filter(
        (s) => (s.plannedStart ?? "") <= new Date().toISOString().slice(0, 10) || s.actualPct > 0,
      )
    : [];
  const list = w ? (today.length ? today : w.now) : [];

  return (
    <Shell title="Site Today">
      <div className="mx-auto flex w-full max-w-xl flex-col gap-4 px-3 pb-24 pt-3">
        <header>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{project.name}</p>
          <h1 className="text-2xl font-extrabold">
            {new Date().toLocaleDateString("en-IN", {
              weekday: "long",
              day: "numeric",
              month: "short",
            })}
          </h1>
          {w?.beforeStart && (
            <p className="text-sm text-muted-foreground">
              Site starts {fmtDay(w.startDate)} ({w.daysToStart} days). Showing the first week.
            </p>
          )}
        </header>

        {q.isPending && <p className="text-sm text-muted-foreground">Loading…</p>}
        {w && list.length === 0 && (
          <p className="rounded-2xl border border-border bg-card p-4 text-sm">
            No stage planned for today.
          </p>
        )}

        {w &&
          list.map((s) => (
            <StageCard
              key={s.id}
              s={s}
              projectId={project.id}
              who={who}
              onCloseout={() => setClosing(s)}
              onChanged={() => void qc.invalidateQueries({ queryKey: ["site_week", project.id] })}
            />
          ))}

        {w && <DailyReport projectId={project.id} stages={list} who={who} />}

        {w && w.holds.length > 0 && (
          <section className="rounded-2xl border border-red-300 bg-red-50 p-4">
            <h2 className="text-base font-bold text-red-900">Stop: hold points this week</h2>
            <ul className="mt-1 space-y-2 text-[15px] text-red-950">
              {w.holds.map((h) => (
                <li key={`${h.stage.id}-${h.check.id}`}>
                  <b>
                    {h.stage.code} {h.check.check}
                  </b>
                  <span className="block text-sm">{h.check.criterion}</span>
                  <span className="block text-xs">Signs: {h.check.by}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
      {closing && w && (
        <StageCloseout
          projectId={project.id}
          stage={closing}
          all={w.stages}
          who={who}
          onClose={() => setClosing(null)}
        />
      )}
    </Shell>
  );
}

function StageCard({
  s,
  projectId,
  who,
  onCloseout,
  onChanged,
}: {
  s: PlanStage;
  projectId: string;
  who: { id: string | null; name: string };
  onCloseout: () => void;
  onChanged: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState("");
  const [pct, setPct] = useState(s.actualPct);

  async function savePct(v: number) {
    const next = Math.max(0, Math.min(100, v));
    setPct(next);
    setBusy("pct");
    const { error } = await supabase
      .from("site_stages")
      .update({
        actual_pct: next,
        status: next >= 100 ? "completed" : next > 0 ? "in progress" : "not started",
        ...(s.actualPct === 0 && next > 0
          ? { actual_start: new Date().toISOString().slice(0, 10) }
          : {}),
      })
      .eq("id", s.id);
    setBusy("");
    if (error) toast.error(error.message);
    else {
      onChanged();
      if (next >= 100) toast.success("100%: now do the close-out (photos, checks)");
    }
  }

  async function photos(files: FileList | null) {
    if (!files?.length) return;
    setBusy("photo");
    try {
      await uploadStageFiles(projectId, s, Array.from(files), "progress", who);
      toast.success(`${files.length} photo${files.length > 1 ? "s" : ""} saved to ${s.code}`);
    } catch (e) {
      toast.error((e as Error).message);
    }
    setBusy("");
  }

  const holds = s.checks.filter((c) => c.point === "H");
  return (
    <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-start gap-2">
        <span
          className={`rounded-lg px-2 py-1 text-sm font-bold ${s.holdPoint ? "bg-red-100 text-red-800" : "bg-primary/10 text-primary"}`}
        >
          {s.code}
        </span>
        <div>
          <h2 className="text-lg font-bold leading-tight">{stageName(s.name)}</h2>
          <p className="text-sm text-muted-foreground">
            {fmtDay(s.plannedStart)} → {fmtDay(s.plannedEnd)}
            {s.floor ? ` · ${s.floor}` : ""}
          </p>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          onClick={() => void savePct(pct - 10)}
          className="flex size-12 items-center justify-center rounded-xl border border-border"
          aria-label="Less"
        >
          <Minus className="size-5" />
        </button>
        <div className="flex-1">
          <div className="h-3 overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-1 text-center text-sm font-semibold">
            {busy === "pct" ? "Saving…" : `${pct}% done`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void savePct(pct + 10)}
          className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground"
          aria-label="More"
        >
          <Plus className="size-5" />
        </button>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex h-14 items-center justify-center gap-2 rounded-xl border border-border text-[15px] font-semibold"
        >
          <ClipboardCheck className="size-5" /> {open ? "Hide steps" : "How to do it"}
        </button>
        <Link
          to="/stage-drawings"
          search={{ stage: s.code }}
          className="flex h-14 items-center justify-center gap-2 rounded-xl border border-border text-[15px] font-semibold"
        >
          <FileText className="size-5" /> Drawings
        </Link>
        <label className="flex h-14 cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary text-[15px] font-semibold text-primary-foreground">
          {busy === "photo" ? (
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
            onChange={(e) => {
              void photos(e.target.files);
              e.target.value = "";
            }}
          />
        </label>
        <button
          type="button"
          onClick={onCloseout}
          className="flex h-14 items-center justify-center gap-2 rounded-xl border border-primary text-[15px] font-semibold text-primary"
        >
          <CheckCircle2 className="size-5" /> Checks
        </button>
      </div>

      {open && (
        <div className="mt-3 space-y-2 text-[15px]">
          {s.directions.map((d) => (
            <div key={d.title}>
              <p className="font-semibold">{d.title}</p>
              <ol className="mt-1 space-y-1">
                {d.steps.map((t) => (
                  <li key={t} className={/HOLD/.test(t) ? "font-semibold text-red-800" : ""}>
                    {t}
                  </li>
                ))}
              </ol>
            </div>
          ))}
          {holds.map((c) => (
            <p key={c.id} className="rounded-lg bg-red-50 p-2 text-red-900">
              <b>HOLD {c.check}:</b> {c.criterion}
            </p>
          ))}
          {s.materials.length > 0 && (
            <div>
              <p className="font-semibold">Material for this stage</p>
              <ul className="text-sm">
                {s.materials.map((m, i) => (
                  <li key={i} className="flex justify-between border-b border-border/50 py-1">
                    <span>{m.material}</span>
                    <span className="whitespace-nowrap pl-2 font-semibold">
                      {m.qty.toLocaleString("en-IN")} {m.unit}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function DailyReport({
  projectId,
  stages,
  who,
}: {
  projectId: string;
  stages: PlanStage[];
  who: { id: string | null; name: string };
}) {
  const qc = useQueryClient();
  const [stage, setStage] = useState(stages[0]?.code ?? "");
  const [contractor, setContractor] = useState("");
  const [trade, setTrade] = useState(TRADES[0]!);
  const [headcount, setHeadcount] = useState(0);
  const [rate, setRate] = useState(0);
  const [done, setDone] = useState("");
  const [issues, setIssues] = useState("");
  const [weather, setWeather] = useState("Clear");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!done.trim()) {
      toast.error("Write what was done today");
      return;
    }
    setBusy(true);
    const date = new Date().toISOString().slice(0, 10);
    try {
      if (headcount > 0) {
        const { error } = await supabase.from("labour_entries").insert({
          project_id: projectId,
          work_date: date,
          contractor,
          trade,
          headcount,
          hours: 8,
          day_rate: rate,
          work_done: done,
          area: stage,
          stage_code: stage,
          supervisor: who.name,
          notes: `Weather: ${weather}${issues ? ` · Issues: ${issues}` : ""}`,
          created_by: who.id,
        });
        if (error) throw error;
      }
      await supabase.from("team_messages").insert({
        channel: "Daily report",
        author_name: who.name,
        author_role: "Site",
        body: [
          `Daily report ${date} · stage ${stage || "—"}`,
          `Weather: ${weather}`,
          headcount ? `Labour: ${headcount} (${trade}${contractor ? `, ${contractor}` : ""})` : "",
          `Done: ${done}`,
          issues ? `Issues / needs: ${issues}` : "",
        ]
          .filter(Boolean)
          .join("\n"),
        is_task: false,
        project_id: projectId,
        sender_id: who.id,
      });
      if (issues.trim())
        await supabase.from("notifications").insert({
          title: `Site issue ${date}${stage ? ` (${stage})` : ""}`,
          body: issues,
          category: "Site plan",
          priority: "High",
          link: "/site-today",
          project_id: projectId,
          sender_id: who.id,
        });
      toast.success("Daily report saved");
      setDone("");
      setIssues("");
      setHeadcount(0);
      await qc.invalidateQueries({ queryKey: ["labour_entries", projectId] });
    } catch (e) {
      toast.error((e as Error).message);
    }
    setBusy(false);
  }

  const field = "h-12 w-full rounded-xl border border-border bg-background px-3 text-[15px]";
  return (
    <section className="rounded-2xl border border-border bg-card p-4">
      <h2 className="text-lg font-bold">Daily report</h2>
      <div className="mt-2 grid gap-2">
        <select value={stage} onChange={(e) => setStage(e.target.value)} className={field}>
          <option value="">Stage…</option>
          {stages.map((s) => (
            <option key={s.id} value={s.code}>
              {s.code} · {stageName(s.name).slice(0, 40)}
            </option>
          ))}
        </select>
        <div className="grid grid-cols-2 gap-2">
          <select value={trade} onChange={(e) => setTrade(e.target.value)} className={field}>
            {TRADES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
          <select value={weather} onChange={(e) => setWeather(e.target.value)} className={field}>
            {["Clear", "Cloudy", "Light rain", "Heavy rain", "Very hot"].map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </div>
        <input
          value={contractor}
          onChange={(e) => setContractor(e.target.value)}
          placeholder="Contractor"
          className={field}
        />
        <div className="grid grid-cols-2 gap-2">
          <label className="text-xs text-muted-foreground">
            Labour today
            <input
              type="number"
              inputMode="numeric"
              value={headcount || ""}
              onChange={(e) => setHeadcount(Number(e.target.value) || 0)}
              className={field}
            />
          </label>
          <label className="text-xs text-muted-foreground">
            Day rate ₹
            <input
              type="number"
              inputMode="numeric"
              value={rate || ""}
              onChange={(e) => setRate(Number(e.target.value) || 0)}
              className={field}
            />
          </label>
        </div>
        <textarea
          value={done}
          onChange={(e) => setDone(e.target.value)}
          rows={3}
          placeholder="Work done today"
          className="w-full rounded-xl border border-border bg-background p-3 text-[15px]"
        />
        <textarea
          value={issues}
          onChange={(e) => setIssues(e.target.value)}
          rows={2}
          placeholder="Issues / material or help needed (alerts the PM)"
          className="w-full rounded-xl border border-border bg-background p-3 text-[15px]"
        />
        <button
          type="button"
          disabled={busy}
          onClick={() => void submit()}
          className="flex h-14 items-center justify-center gap-2 rounded-xl bg-primary text-base font-bold text-primary-foreground disabled:opacity-50"
        >
          {busy ? <Loader2 className="size-5 animate-spin" /> : <Send className="size-5" />}
          Send daily report
        </button>
      </div>
    </section>
  );
}
