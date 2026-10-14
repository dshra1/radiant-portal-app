import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Camera, ExternalLink, FileText, Loader2, ScanSearch } from "lucide-react";
import { toast } from "sonner";
import { Shell } from "@/components/saha/Shell";
import { supabase } from "@/integrations/supabase/client";
import { useActiveProject } from "@/hooks/useActiveProject";
import { useSessionUser } from "@/lib/access";
import { fmtDay } from "@/lib/programme-progress";
import { sheetsForStage, shortFile, type Sheet } from "@/lib/drawing-sheets";
import { checkPhotoAgainstDrawing, type DrawingCheck } from "@/lib/drawing-check.functions";

type Search = { stage?: string; file?: string; page?: number };

export const Route = createFileRoute("/stage-drawings")({
  validateSearch: (s: Record<string, unknown>): Search => {
    const out: Search = {};
    if (typeof s["stage"] === "string") out.stage = s["stage"];
    if (typeof s["file"] === "string") out.file = s["file"];
    const p = Number(s["page"]);
    if (Number.isFinite(p) && p > 0) out.page = p;
    return out;
  },
  head: () => ({
    meta: [
      { title: "Stage Drawings | Saha OS" },
      {
        name: "description",
        content:
          "The drawing sheets for each programme stage, room by room, with a photo check against the drawing.",
      },
    ],
  }),
  component: Page,
});

const verdictTone: Record<string, string> = {
  "in sync": "border-emerald-300 bg-emerald-50 text-emerald-900",
  partly: "border-amber-300 bg-amber-50 text-amber-950",
  "not in sync": "border-red-300 bg-red-50 text-red-900",
  "cannot tell": "border-slate-300 bg-slate-50 text-slate-800",
};

function Page() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/stage-drawings" });
  const project = useActiveProject();
  const user = useSessionUser();
  const qc = useQueryClient();
  const check = useServerFn(checkPhotoAgainstDrawing);

  const stages = useQuery({
    queryKey: ["stage_drawings_stages", project.id],
    enabled: Boolean(project.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_stages")
        .select("id,code,name,floor,stage_group,planned_start,planned_end")
        .eq("project_id", project.id)
        .neq("code", "")
        .order("sort", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
  const list = stages.data ?? [];
  const stage = list.find((s) => s.code === search.stage) ?? list[0];
  const groups = useMemo(
    () => (stage ? sheetsForStage(stage.code, stage.floor ?? "") : []),
    [stage],
  );
  const firstSheet = groups[0]?.sheets[0];
  const sheet: Sheet | undefined =
    groups.flatMap((g) => g.sheets).find((s) => s.file === search.file && s.page === search.page) ??
    firstSheet;

  const [url, setUrl] = useState<string>("");
  useEffect(() => {
    let live = true;
    setUrl("");
    if (!sheet || !project.id) return;
    void supabase.storage
      .from("project-drawings")
      .createSignedUrl(`${project.id}/${sheet.file}`, 3600)
      .then(({ data }) => {
        if (live && data?.signedUrl) setUrl(`${data.signedUrl}#page=${sheet.page}&view=FitH`);
      });
    return () => {
      live = false;
    };
  }, [sheet, project.id]);

  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [result, setResult] = useState<DrawingCheck | null>(null);

  const history = useQuery({
    queryKey: ["drawing_checks", project.id, stage?.code],
    enabled: Boolean(project.id && stage),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("qa_inspections")
        .select("id,inspected_on,findings,resolution,code_ref,inspector_name")
        .eq("project_id", project.id)
        .eq("notes", `Drawing check ${stage!.code}`)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data ?? [];
    },
  });

  async function runCheck(file: File) {
    if (!stage || !sheet) return;
    setBusy(true);
    setResult(null);
    try {
      const safe = file.name.replace(/[^\w.-]+/g, "_");
      const path = `${project.id}/${stage.code}/check-${Date.now()}-${safe}`;
      const up = await supabase.storage
        .from("site-media")
        .upload(path, file, { contentType: file.type || "image/jpeg" });
      if (up.error) throw up.error;
      await supabase.from("project_media").insert({
        project_id: project.id,
        path,
        title: file.name,
        caption: `Photo check against ${shortFile(sheet.file)} p.${sheet.page}`,
        stage: stage.code,
        category: "quality",
        captured_on: new Date().toISOString().slice(0, 10),
        uploaded_by: user?.id ?? null,
        uploaded_by_name: user?.email ?? "",
      });
      const r = await check({
        data: {
          projectId: project.id,
          drawingFile: sheet.file,
          page: sheet.page,
          sheetTitle: sheet.title,
          photoPath: path,
          photoType: file.type || "image/jpeg",
          stage: `${stage.code} ${stage.name}`,
          note,
        },
      });
      setResult(r);
      await supabase.from("qa_inspections").insert({
        project_id: project.id,
        inspected_on: new Date().toISOString().slice(0, 10),
        location_tag: `${stage.code}${stage.floor ? ` · ${stage.floor}` : ""}${sheet.room ? ` · Flat-0${sheet.flat} ${sheet.room}` : ""}`,
        category: /Electrical/.test(sheet.file)
          ? "Electrical"
          : /Plumbing/.test(sheet.file)
            ? "Plumbing"
            : "Concrete",
        code_ref: `${shortFile(sheet.file)} p.${sheet.page}`,
        severity: r.verdict === "in sync" ? "Low" : r.verdict === "partly" ? "Medium" : "High",
        findings: `Photo vs drawing: ${r.verdict} (${r.score}%). ${r.differences.join("; ")}`.slice(
          0,
          1000,
        ),
        defect_count: r.differences.length,
        resolution: r.verdict === "in sync" ? "Closed" : "Open",
        inspector_name: "AI drawing check",
        notes: `Drawing check ${stage.code}`,
        created_by: user?.id ?? null,
      });
      await qc.invalidateQueries({ queryKey: ["drawing_checks", project.id, stage.code] });
    } catch (e) {
      toast.error((e as Error).message);
    }
    setBusy(false);
  }

  const go = (s: Search) => void navigate({ search: s });

  return (
    <Shell title="Stage Drawings">
      <div className="flex flex-col gap-4 pb-16">
        <header className="rounded-2xl border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            {project.name} · drawings for each stage
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold">
              {stage
                ? `${stage.code} · ${stage.name.replace(/^[A-Z0-9]+ · /, "")}`
                : "Stage drawings"}
            </h1>
            <select
              value={stage?.code ?? ""}
              onChange={(e) => go({ stage: e.target.value })}
              className="ml-auto h-9 max-w-[260px] rounded-lg border border-border bg-background px-2 text-sm"
            >
              {list.map((s) => (
                <option key={s.id} value={s.code}>
                  {s.code} · {(s.name ?? "").replace(/^[A-Z0-9]+ · /, "").slice(0, 40)}
                </option>
              ))}
            </select>
          </div>
          {stage && (
            <p className="text-xs text-muted-foreground">
              {stage.stage_group}
              {stage.floor && ` · ${stage.floor}`} · {fmtDay(stage.planned_start)} →{" "}
              {fmtDay(stage.planned_end)} ·{" "}
              <Link to="/site-execution" className="text-primary underline">
                directions, material and checks
              </Link>
            </p>
          )}
        </header>

        {stages.isPending ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : groups.length === 0 ? (
          <p className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
            No drawing sheets are linked to this stage.
          </p>
        ) : (
          <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
            <nav className="max-h-[75vh] overflow-y-auto rounded-xl border border-border bg-card p-2 text-[13px]">
              {groups.map((g) => (
                <div key={g.label} className="mb-2">
                  <p className="px-1 text-[11px] font-semibold uppercase text-muted-foreground">
                    {g.label}
                  </p>
                  {g.sheets.map((s) => {
                    const on = sheet && s.file === sheet.file && s.page === sheet.page;
                    return (
                      <button
                        key={`${s.file}-${s.page}`}
                        type="button"
                        onClick={() =>
                          go({
                            ...(stage ? { stage: stage.code } : {}),
                            file: s.file,
                            page: s.page,
                          })
                        }
                        className={`flex w-full items-start gap-1.5 rounded px-1.5 py-1 text-left hover:bg-secondary ${on ? "bg-primary/10 font-semibold text-primary" : ""}`}
                      >
                        <FileText className="mt-0.5 size-3.5 shrink-0" />
                        <span>
                          {s.room ? `${s.room}${s.cont ? " (cont.)" : ""}` : s.title.slice(0, 70)}
                          <span className="block text-[11px] font-normal text-muted-foreground">
                            {shortFile(s.file)} · p.{s.page}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              ))}
            </nav>

            <div className="flex flex-col gap-3">
              {sheet && (
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <b>{sheet.title}</b>
                  <span className="text-muted-foreground">
                    {shortFile(sheet.file)} · page {sheet.page}
                  </span>
                  {url && (
                    <a
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="ml-auto inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-xs font-semibold"
                    >
                      <ExternalLink className="size-3.5" /> Open full screen
                    </a>
                  )}
                </div>
              )}
              <div className="h-[60vh] overflow-hidden rounded-xl border border-border bg-muted">
                {url ? (
                  <iframe key={url} src={url} title="Drawing sheet" className="h-full w-full" />
                ) : (
                  <p className="p-4 text-sm text-muted-foreground">
                    Opening the sheet… (if it does not open, the drawing set is not uploaded yet:
                    Import PMC Workbooks → drawings)
                  </p>
                )}
              </div>

              <section className="rounded-xl border border-border bg-card p-3">
                <h2 className="flex items-center gap-1.5 text-sm font-bold">
                  <ScanSearch className="size-4" /> Check site work against this sheet
                </h2>
                <p className="text-[12px] text-muted-foreground">
                  Take a photo of the same wall / element as this sheet (whole wall, square on, in
                  good light). The app compares it with the drawing and records the result in QA
                  Inspection.
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <input
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Which wall? e.g. north wall of Bedroom-02"
                    className="h-9 min-w-[220px] flex-1 rounded-lg border border-border bg-background px-2 text-sm"
                  />
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground">
                    {busy ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Camera className="size-4" />
                    )}
                    {busy ? "Checking…" : "Photo → check"}
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      disabled={busy || !sheet}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) void runCheck(f);
                        e.target.value = "";
                      }}
                    />
                  </label>
                </div>
                {result && (
                  <div
                    className={`mt-3 rounded-lg border p-3 text-[13px] ${verdictTone[result.verdict]}`}
                  >
                    <p className="text-base font-bold">
                      {result.verdict === "in sync"
                        ? "In sync with the drawing"
                        : result.verdict === "partly"
                          ? "Partly in sync"
                          : result.verdict === "not in sync"
                            ? "Not in sync with the drawing"
                            : "Cannot tell from this photo"}{" "}
                      · {result.score}%
                    </p>
                    {result.matches.length > 0 && (
                      <>
                        <p className="mt-1 font-semibold">Agrees</p>
                        <ul className="list-disc pl-5">
                          {result.matches.map((m) => (
                            <li key={m}>{m}</li>
                          ))}
                        </ul>
                      </>
                    )}
                    {result.differences.length > 0 && (
                      <>
                        <p className="mt-1 font-semibold">Differs / missing</p>
                        <ul className="list-disc pl-5">
                          {result.differences.map((m) => (
                            <li key={m}>{m}</li>
                          ))}
                        </ul>
                      </>
                    )}
                    {result.advice && <p className="mt-1">{result.advice}</p>}
                  </div>
                )}
                {(history.data ?? []).length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-semibold uppercase text-muted-foreground">
                      Earlier checks on this stage
                    </p>
                    <ul className="mt-1 space-y-1 text-[12px]">
                      {(history.data ?? []).map((h) => (
                        <li key={h.id}>
                          <b>{fmtDay(h.inspected_on)}</b> · {h.code_ref} ·{" "}
                          {h.findings.slice(0, 160)}
                          <span
                            className={
                              h.resolution === "Closed" ? " text-emerald-700" : " text-destructive"
                            }
                          >
                            {" "}
                            · {h.resolution}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </section>
            </div>
          </div>
        )}
      </div>
    </Shell>
  );
}
