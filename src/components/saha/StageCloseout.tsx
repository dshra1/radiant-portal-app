import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Camera, CheckCircle2, FileCheck2, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { fmtDay } from "@/lib/programme-progress";
import { stageName, type PlanStage } from "@/lib/site-week";
import { closeStage, closeoutGaps, recordCheck, uploadStageFiles } from "@/lib/site-week-actions";

const tone: Record<string, string> = {
  H: "bg-red-100 text-red-800 border-red-300",
  W: "bg-amber-100 text-amber-900 border-amber-300",
  R: "bg-slate-100 text-slate-700 border-slate-300",
};

/**
 * Closing a stage: every check recorded (hold points must be OK), photos of the
 * finished work, approvals / documents, then "Close and release the next stage".
 */
export function StageCloseout({
  projectId,
  stage,
  all,
  who,
  onClose,
}: {
  projectId: string;
  stage: PlanStage;
  all: PlanStage[];
  who: { id: string | null; name: string };
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [busy, setBusy] = useState("");
  const [inspector, setInspector] = useState(who.name);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [local, setLocal] = useState(stage);

  const media = useQuery({
    queryKey: ["stage_media", projectId, stage.code],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_media")
        .select("id,title,category,created_at")
        .eq("project_id", projectId)
        .eq("stage", stage.code)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
  const photos = (media.data ?? []).filter((m) => m.category !== "approval");
  const docs = (media.data ?? []).filter((m) => m.category === "approval");
  const gaps = closeoutGaps(local, photos.length);

  const refresh = async () => {
    await qc.invalidateQueries({ queryKey: ["site_week", projectId] });
    await qc.invalidateQueries({ queryKey: ["programme_flow", projectId] });
    await qc.invalidateQueries({ queryKey: ["site_stages", projectId] });
    await qc.invalidateQueries({ queryKey: ["stage_media", projectId, stage.code] });
  };

  async function check(id: string, result: "OK" | "NOT OK") {
    const c = local.checks.find((x) => x.id === id);
    if (!c) return;
    if (!inspector.trim()) {
      toast.error("Enter who inspected");
      return;
    }
    setBusy(id);
    try {
      await recordCheck(projectId, local, c, result, inspector.trim(), notes[id] ?? "", who);
      setLocal({
        ...local,
        evidence: {
          ...local.evidence,
          checks: {
            ...(local.evidence.checks ?? {}),
            [id]: { result, by: inspector.trim(), on: new Date().toISOString().slice(0, 10) },
          },
        },
      });
      toast.success(`${id} recorded ${result} (also in QA Inspection)`);
      await refresh();
    } catch (e) {
      toast.error((e as Error).message);
    }
    setBusy("");
  }

  async function upload(files: FileList | null, category: "progress" | "approval") {
    if (!files?.length) return;
    setBusy(category);
    try {
      await uploadStageFiles(projectId, local, Array.from(files), category, who);
      toast.success(`${files.length} file${files.length > 1 ? "s" : ""} added to ${stage.code}`);
      await refresh();
    } catch (e) {
      toast.error((e as Error).message);
    }
    setBusy("");
  }

  async function close() {
    setBusy("close");
    try {
      const next = await closeStage(projectId, local, all, who);
      toast.success(
        `${stage.code} closed.${next.length ? ` Instructions sent for ${next.map((s) => s.code).join(", ")}.` : ""}`,
      );
      await refresh();
      onClose();
    } catch (e) {
      toast.error((e as Error).message);
    }
    setBusy("");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4">
      <div className="w-full max-w-3xl rounded-2xl border border-border bg-card p-5 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Stage close-out
            </p>
            <h2 className="text-lg font-bold">
              {stage.code} · {stageName(stage.name)}
            </h2>
            <p className="text-xs text-muted-foreground">
              {stage.group}
              {stage.floor && ` · ${stage.floor}`} · planned {fmtDay(stage.plannedStart)} →{" "}
              {fmtDay(stage.plannedEnd)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 hover:bg-muted"
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
        </div>

        <section className="mt-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-bold">1 · Checks ({local.checks.length})</h3>
            <label className="flex items-center gap-2 text-xs">
              Inspected by
              <input
                value={inspector}
                onChange={(e) => setInspector(e.target.value)}
                className="h-8 rounded-lg border border-border bg-background px-2 text-sm"
              />
            </label>
          </div>
          {local.checks.length === 0 && (
            <p className="mt-1 text-sm text-muted-foreground">
              No inspection checks on this stage.
            </p>
          )}
          <ul className="mt-2 space-y-2">
            {local.checks.map((c) => {
              const r = local.evidence.checks?.[c.id];
              return (
                <li key={c.id} className="rounded-lg border border-border p-2 text-[13px]">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded border px-1.5 text-[11px] font-bold ${tone[c.point] ?? tone["R"]}`}
                    >
                      {c.point === "H" ? "HOLD" : c.point === "W" ? "WITNESS" : "RECORD"}
                    </span>
                    <b>
                      {c.id} · {c.check}
                    </b>
                    {r && (
                      <span
                        className={`ml-auto text-xs font-semibold ${r.result === "OK" ? "text-emerald-700" : "text-destructive"}`}
                      >
                        {r.result} · {r.by} · {fmtDay(r.on)}
                      </span>
                    )}
                  </div>
                  {c.criterion && <p className="mt-1">{c.criterion}</p>}
                  <p className="text-[12px] text-muted-foreground">
                    {[c.method, c.by && `signs: ${c.by}`, c.record && `record: ${c.record}`]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    <input
                      placeholder="Remarks (optional)"
                      value={notes[c.id] ?? ""}
                      onChange={(e) => setNotes({ ...notes, [c.id]: e.target.value })}
                      className="h-8 min-w-[200px] flex-1 rounded-lg border border-border bg-background px-2 text-sm"
                    />
                    <button
                      type="button"
                      disabled={Boolean(busy)}
                      onClick={() => void check(c.id, "OK")}
                      className="h-8 rounded-lg bg-emerald-600 px-3 text-xs font-semibold text-white disabled:opacity-50"
                    >
                      {busy === c.id ? "Saving…" : "OK"}
                    </button>
                    <button
                      type="button"
                      disabled={Boolean(busy)}
                      onClick={() => void check(c.id, "NOT OK")}
                      className="h-8 rounded-lg border border-destructive px-3 text-xs font-semibold text-destructive disabled:opacity-50"
                    >
                      Not OK
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="rounded-lg border border-border p-3">
            <h3 className="flex items-center gap-1.5 text-sm font-bold">
              <Camera className="size-4" /> 2 · Photos of the finished work ({photos.length})
            </h3>
            <label className="mt-2 inline-flex cursor-pointer items-center gap-2 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground">
              {busy === "progress" ? <Loader2 className="size-3.5 animate-spin" /> : null}
              Add photos
              <input
                type="file"
                accept="image/*,video/*"
                capture="environment"
                multiple
                className="hidden"
                onChange={(e) => {
                  void upload(e.target.files, "progress");
                  e.target.value = "";
                }}
              />
            </label>
            <ul className="mt-2 max-h-24 overflow-y-auto text-[12px] text-muted-foreground">
              {photos.map((m) => (
                <li key={m.id}>{m.title}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-lg border border-border p-3">
            <h3 className="flex items-center gap-1.5 text-sm font-bold">
              <FileCheck2 className="size-4" /> 3 · Approvals and documents ({docs.length})
            </h3>
            <p className="text-[12px] text-muted-foreground">
              Signed pour card, engineer's approval, test reports, delivery challans.
            </p>
            <label className="mt-2 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-primary px-3 py-1.5 text-xs font-semibold text-primary">
              {busy === "approval" ? <Loader2 className="size-3.5 animate-spin" /> : null}
              Add documents
              <input
                type="file"
                accept="image/*,application/pdf"
                multiple
                className="hidden"
                onChange={(e) => {
                  void upload(e.target.files, "approval");
                  e.target.value = "";
                }}
              />
            </label>
            <ul className="mt-2 max-h-24 overflow-y-auto text-[12px] text-muted-foreground">
              {docs.map((m) => (
                <li key={m.id}>{m.title}</li>
              ))}
            </ul>
          </div>
        </section>

        <section className="mt-4 rounded-lg border border-border p-3">
          <h3 className="text-sm font-bold">4 · Close and release the next stage</h3>
          <p className="text-[12px] text-muted-foreground">
            Then enter the stage's actual cost for approval:{" "}
            <Link
              to="/stage-budget"
              search={{ stage: stage.code }}
              className="text-primary underline"
            >
              Stage Budget
            </Link>{" "}
            · drawings:{" "}
            <Link
              to="/stage-drawings"
              search={{ stage: stage.code }}
              className="text-primary underline"
            >
              {stage.code} sheets
            </Link>
          </p>
          {gaps.length > 0 ? (
            <ul className="mt-1 list-disc pl-5 text-[13px] text-destructive">
              {gaps.map((g) => (
                <li key={g}>{g}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-1 flex items-center gap-1.5 text-[13px] text-emerald-700">
              <CheckCircle2 className="size-4" /> Ready to close.
            </p>
          )}
          <button
            type="button"
            disabled={gaps.length > 0 || Boolean(busy)}
            onClick={() => void close()}
            className="mt-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
          >
            {busy === "close" ? "Closing…" : `Close ${stage.code} and send the next instructions`}
          </button>
        </section>
      </div>
    </div>
  );
}
