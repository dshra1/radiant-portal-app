import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ClipboardCheck,
  ClipboardList,
  FlaskConical,
  ShieldAlert,
  ListChecks,
  Plus,
} from "lucide-react";
import { QaInspections } from "@/components/saha/quality/QaInspections";
import { toast } from "sonner";
import { Shell } from "@/components/saha/Shell";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { useActiveProject } from "@/hooks/useActiveProject";
import { useSessionUser } from "@/lib/access";
import { fmtDay } from "@/lib/programme-progress";
import { useSiteWeek, type StageCheck } from "@/lib/site-week";
import { groupResults, sampleResult } from "@/lib/cube-acceptance";

type Tab = "checks" | "inspections" | "cubes" | "ncr" | "itp";
type Search = { tab?: Tab };

export const Route = createFileRoute("/quality")({
  validateSearch: (s: Record<string, unknown>): Search =>
    ["checks", "inspections", "cubes", "ncr", "itp"].includes(String(s["tab"]))
      ? { tab: s["tab"] as Tab }
      : {},
  head: () => ({
    meta: [
      { title: "Quality Control | Saha OS" },
      {
        name: "description",
        content:
          "Checklist log, cube-test register, NCR log and the inspection and test plan from the PMC control workbook.",
      },
    ],
  }),
  component: Page,
});

const today = () => new Date().toISOString().slice(0, 10);
const addDays = (iso: string | null, d: number) =>
  iso ? new Date(Date.parse(`${iso}T00:00:00Z`) + d * 86_400_000).toISOString().slice(0, 10) : null;
/** IS 456 Table 11 individual criterion for one pour (see src/lib/cube-acceptance.ts). */
const cubeResult = sampleResult;

function Page() {
  const { tab = "checks" } = Route.useSearch();
  const navigate = useNavigate({ from: "/quality" });
  const setTab = (t: Tab) =>
    void navigate({ search: { tab: t === "checks" ? undefined : t }, replace: true });
  const project = useActiveProject();
  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "checks", label: "Checklist log", icon: <ListChecks className="size-4" /> },
    { key: "inspections", label: "Inspections", icon: <ClipboardList className="size-4" /> },
    { key: "cubes", label: "Cube register", icon: <FlaskConical className="size-4" /> },
    { key: "ncr", label: "NCR log", icon: <ShieldAlert className="size-4" /> },
    { key: "itp", label: "Inspection & test plan", icon: <ClipboardCheck className="size-4" /> },
  ];
  return (
    <Shell title="Quality Control">
      <div className="flex flex-col gap-4 px-4 pb-16 pt-4 md:px-6">
        <header className="rounded-2xl border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{project.name}</p>
          <h1 className="text-xl font-bold">Quality control</h1>
          <p className="text-sm text-muted-foreground">
            From the PMC control workbook: every ITP check per stage, site inspections (severity, IS
            code, defects, closure), every pour's cubes (IS 456) and non-conformances. Results
            recorded at a stage close-out or a photo check appear here too.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {tabs.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold ${tab === t.key ? "bg-primary text-primary-foreground" : "border border-border"}`}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        </header>
        {project.id && tab === "checks" && <Checks projectId={project.id} />}
        {tab === "inspections" && <QaInspections />}
        {project.id && tab === "cubes" && <Cubes projectId={project.id} />}
        {project.id && tab === "ncr" && <Ncrs projectId={project.id} />}
        {project.id && tab === "itp" && <Itp projectId={project.id} />}
      </div>
    </Shell>
  );
}

function Checks({ projectId }: { projectId: string }) {
  const qc = useQueryClient();
  const user = useSessionUser();
  const [filter, setFilter] = useState<"due" | "open" | "all" | "done">("due");
  const q = useQuery({
    queryKey: ["quality_checks", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quality_checks")
        .select("*")
        .eq("project_id", projectId)
        .order("planned_date", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
  const rows = (q.data ?? []).filter((r) => {
    if (filter === "done") return Boolean(r.result);
    if (filter === "open") return !r.result;
    if (filter === "due")
      return !r.result && (r.planned_date ?? "9999") <= (addDays(today(), 14) ?? "");
    return true;
  });
  async function record(id: string, result: "OK" | "NOT OK") {
    const { error } = await supabase
      .from("quality_checks")
      .update({ result, inspected_on: today(), inspector: user?.email ?? "" })
      .eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success(
        `Recorded ${result}${result === "NOT OK" ? ": raise an NCR in the NCR log" : ""}`,
      );
      await qc.invalidateQueries({ queryKey: ["quality_checks", projectId] });
    }
  }
  return (
    <section className="rounded-2xl border border-border bg-card">
      <div className="flex flex-wrap items-center gap-2 border-b border-border p-3 text-sm">
        {(["due", "open", "done", "all"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`rounded-lg px-2.5 py-1 font-semibold ${filter === f ? "bg-secondary" : ""}`}
          >
            {f === "due"
              ? "Due in 2 weeks"
              : f === "open"
                ? "Not inspected"
                : f === "done"
                  ? "Inspected"
                  : "All"}
          </button>
        ))}
        <span className="ml-auto text-muted-foreground">
          {(q.data ?? []).filter((r) => r.result).length} of {(q.data ?? []).length} inspected
        </span>
      </div>
      {q.isPending ? (
        <p className="p-4 text-sm text-muted-foreground">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="p-4 text-sm text-muted-foreground">
          Nothing here.{" "}
          {(q.data ?? []).length === 0 &&
            "Re-run Import PMC Workbooks (control workbook) to load the checklist log."}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-[13px]">
            <thead className="text-[11px] uppercase text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left">Planned</th>
                <th className="text-left">Stage</th>
                <th className="text-left">Check</th>
                <th className="text-left">Point</th>
                <th className="text-left">Result</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-border/60">
                  <td className="px-3 py-1.5 whitespace-nowrap">{fmtDay(r.planned_date)}</td>
                  <td>
                    <Link
                      to="/stage-drawings"
                      search={{ stage: r.stage_code }}
                      className="font-semibold text-primary"
                    >
                      {r.stage_code}
                    </Link>
                  </td>
                  <td>
                    {r.itp_id} · {r.check_name}
                  </td>
                  <td>
                    <span
                      className={`rounded px-1.5 text-[11px] font-bold ${r.point === "H" ? "bg-red-100 text-red-800" : r.point === "W" ? "bg-amber-100 text-amber-900" : "bg-slate-100"}`}
                    >
                      {r.point === "H" ? "HOLD" : r.point === "W" ? "WITNESS" : "RECORD"}
                    </span>
                  </td>
                  <td
                    className={
                      r.result === "OK"
                        ? "text-emerald-700"
                        : r.result
                          ? "text-destructive"
                          : "text-muted-foreground"
                    }
                  >
                    {r.result ? `${r.result} · ${r.inspector} · ${fmtDay(r.inspected_on)}` : "—"}
                  </td>
                  <td className="whitespace-nowrap px-2 text-right">
                    {!r.result && (
                      <>
                        <button
                          type="button"
                          onClick={() => void record(r.id, "OK")}
                          className="mr-2 rounded bg-emerald-600 px-2 py-0.5 text-xs font-semibold text-white"
                        >
                          OK
                        </button>
                        <button
                          type="button"
                          onClick={() => void record(r.id, "NOT OK")}
                          className="rounded border border-destructive px-2 py-0.5 text-xs font-semibold text-destructive"
                        >
                          Not OK
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function Cubes({ projectId }: { projectId: string }) {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["cube_tests", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cube_tests")
        .select("*")
        .eq("project_id", projectId)
        .order("planned_pour_date", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
  async function save(id: string, patch: Database["public"]["Tables"]["cube_tests"]["Update"]) {
    const { error } = await supabase.from("cube_tests").update(patch).eq("id", id);
    if (error) toast.error(error.message);
    else await qc.invalidateQueries({ queryKey: ["cube_tests", projectId] });
  }
  const rows = q.data ?? [];
  const totalM3 = rows.reduce((t, r) => t + Number(r.volume_m3), 0);
  const failed = rows.filter((r) => cubeResult(r).status === "fail").length;
  const groups = groupResults(rows);
  const groupsFailed = groups.groups.filter((g) => g.status === "fail").length;
  return (
    <section className="rounded-2xl border border-border bg-card">
      <div className="flex flex-wrap gap-3 border-b border-border p-3 text-sm">
        <b>{rows.length} pours</b> · {Math.round(totalM3)} m³ RMC ·{" "}
        {rows.filter((r) => cubeResult(r).status === "pass").length} samples pass (individual) ·{" "}
        <span className={failed ? "font-semibold text-destructive" : ""}>{failed} failed</span> ·{" "}
        {groups.groups.length} groups of 4 checked
        {groupsFailed > 0 && (
          <span className="font-semibold text-destructive"> · {groupsFailed} group(s) fail</span>
        )}
        <span className="basis-full text-muted-foreground">
          IS 456:2000 Table 11 (M20 and above). Test result = mean of the 3 cubes of one sample.
          Individual: each test result ≥ fck − 4 N/mm². Group: mean of 4 non-overlapping consecutive
          test results of the same grade ≥ max(fck + 0.825 × s, fck + 4), with s = 5 N/mm² for M25+
          until the site's standard deviation is established — i.e. fck + 4.125 (e.g. M25 ≥ 29.1,
          M30 ≥ 34.1).
        </span>
      </div>
      {rows.length === 0 ? (
        <p className="p-4 text-sm text-muted-foreground">
          Re-run Import PMC Workbooks (control workbook) to load the pours.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-[12px]">
            <thead className="text-[11px] uppercase text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left">Stage · pour</th>
                <th>Grade</th>
                <th className="text-right">m³</th>
                <th>Samples / cubes</th>
                <th>Pour date</th>
                <th>7-day due</th>
                <th>7-day mean</th>
                <th>28-day due</th>
                <th>28-day cubes (N/mm²)</th>
                <th>Result (individual)</th>
                <th>Group of 4</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const pourDate = r.actual_pour_date ?? r.planned_pour_date;
                const res = cubeResult(r);
                const d7 = addDays(pourDate, 7);
                const d28 = addDays(pourDate, 28);
                const late7 = r.actual_pour_date && !r.mean_7 && (d7 ?? "") < today();
                const late28 =
                  r.actual_pour_date && res.status === "pending" && (d28 ?? "") < today();
                const num = (v: string) => (v === "" ? null : Number(v));
                return (
                  <tr key={r.id} className="border-t border-border/60">
                    <td className="px-3 py-1.5">
                      <b>{r.stage_code}</b> · {r.pour}
                    </td>
                    <td className="text-center">{r.grade}</td>
                    <td className="text-right">{Number(r.volume_m3).toFixed(1)}</td>
                    <td className="text-center">
                      {r.samples} / {r.cubes}
                    </td>
                    <td className="text-center">
                      <input
                        type="date"
                        defaultValue={r.actual_pour_date ?? ""}
                        onBlur={(e) =>
                          e.target.value !== (r.actual_pour_date ?? "") &&
                          void save(r.id, { actual_pour_date: e.target.value || null })
                        }
                        className="h-7 rounded border border-border bg-background px-1"
                        title={`Planned ${fmtDay(r.planned_pour_date)}`}
                      />
                    </td>
                    <td className={`text-center ${late7 ? "font-semibold text-destructive" : ""}`}>
                      {fmtDay(d7)}
                    </td>
                    <td className="text-center">
                      <input
                        type="number"
                        step="0.1"
                        defaultValue={r.mean_7 ?? ""}
                        onBlur={(e) => void save(r.id, { mean_7: num(e.target.value) })}
                        className="h-7 w-16 rounded border border-border bg-background px-1"
                      />
                    </td>
                    <td className={`text-center ${late28 ? "font-semibold text-destructive" : ""}`}>
                      {fmtDay(d28)}
                    </td>
                    <td className="text-center">
                      {(["cube_28_1", "cube_28_2", "cube_28_3"] as const).map((k) => (
                        <input
                          key={k}
                          type="number"
                          step="0.1"
                          defaultValue={r[k] ?? ""}
                          onBlur={(e) => void save(r.id, { [k]: num(e.target.value) })}
                          className="mr-1 h-7 w-14 rounded border border-border bg-background px-1"
                        />
                      ))}
                    </td>
                    <td
                      className={`text-center font-semibold ${res.status === "pass" ? "text-emerald-700" : res.status === "fail" ? "text-destructive" : "text-muted-foreground"}`}
                    >
                      {res.status}
                      {res.mean !== null ? ` (${res.mean.toFixed(1)} vs ≥ ${res.min})` : ""}
                    </td>
                    {(() => {
                      const g = groups.byId.get(r.id);
                      if (!g)
                        return (
                          <td className="px-2 text-center text-muted-foreground">
                            {res.mean === null
                              ? "—"
                              : `waiting (${groups.waiting.get(r.grade) ?? 0}/4 tested)`}
                          </td>
                        );
                      return (
                        <td
                          className={`px-2 text-center font-semibold ${g.status === "pass" ? "text-emerald-700" : "text-destructive"}`}
                          title={`Pours in group: ${g.ids.length}; mean ${g.mean.toFixed(2)} vs required ${g.required.toFixed(3)}`}
                        >
                          {g.grade} G{g.index}: {g.status} ({g.mean.toFixed(1)} vs ≥{" "}
                          {g.required.toFixed(2)})
                        </td>
                      );
                    })()}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function Ncrs({ projectId }: { projectId: string }) {
  const qc = useQueryClient();
  const user = useSessionUser();
  const [draft, setDraft] = useState({
    stage_code: "",
    location: "",
    itp_id: "",
    what_wrong: "",
    cause: "",
    correction: "",
    target_date: "",
  });
  const q = useQuery({
    queryKey: ["ncrs", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ncrs")
        .select("*")
        .eq("project_id", projectId)
        .order("raised_on", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
  async function raise() {
    if (!draft.what_wrong.trim()) {
      toast.error("Describe what is wrong");
      return;
    }
    // next number after the highest existing NCR-### (row count repeats after deletes)
    const { data: existing, error: noErr } = await supabase
      .from("ncrs")
      .select("ncr_no")
      .eq("project_id", projectId);
    if (noErr) {
      toast.error(noErr.message);
      return;
    }
    const n =
      Math.max(0, ...(existing ?? []).map((r) => Number(/NCR-(\d+)/i.exec(r.ncr_no)?.[1] ?? 0))) +
      1;
    const { error } = await supabase.from("ncrs").insert({
      project_id: projectId,
      ncr_no: `NCR-${String(n).padStart(3, "0")}`,
      ...draft,
      target_date: draft.target_date || null,
      raised_by: user?.email ?? "",
      created_by: user?.id ?? null,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    const { error: noteErr } = await supabase.from("notifications").insert({
      title: `NCR raised${draft.stage_code ? ` on ${draft.stage_code}` : ""}: ${draft.what_wrong.slice(0, 60)}`,
      body: `Correction: ${draft.correction || "to agree"} · close before the next hold point on this area.`,
      category: "Site plan",
      priority: "High",
      link: "/quality",
      project_id: projectId,
      sender_id: user?.id ?? null,
    });
    if (noteErr) toast.error(`NCR saved, but the team alert failed: ${noteErr.message}`);
    else toast.success(`NCR-${String(n).padStart(3, "0")} raised`);
    setDraft({
      stage_code: "",
      location: "",
      itp_id: "",
      what_wrong: "",
      cause: "",
      correction: "",
      target_date: "",
    });
    await qc.invalidateQueries({ queryKey: ["ncrs", projectId] });
  }
  async function close(id: string) {
    const { error } = await supabase
      .from("ncrs")
      .update({ status: "CLOSED", closed_on: today() })
      .eq("id", id);
    if (error) toast.error(error.message);
    else await qc.invalidateQueries({ queryKey: ["ncrs", projectId] });
  }
  const field = "h-9 rounded-lg border border-border bg-background px-2 text-sm";
  return (
    <section className="flex flex-col gap-3">
      <div className="rounded-2xl border border-border bg-card p-3">
        <h3 className="text-sm font-bold">Raise a non-conformance</h3>
        <div className="mt-2 grid gap-2 md:grid-cols-3">
          <input
            className={field}
            placeholder="Stage (e.g. F03)"
            value={draft.stage_code}
            onChange={(e) => setDraft({ ...draft, stage_code: e.target.value.toUpperCase() })}
          />
          <input
            className={field}
            placeholder="Location (e.g. footing F5)"
            value={draft.location}
            onChange={(e) => setDraft({ ...draft, location: e.target.value })}
          />
          <input
            className={field}
            placeholder="ITP check (e.g. Q03)"
            value={draft.itp_id}
            onChange={(e) => setDraft({ ...draft, itp_id: e.target.value.toUpperCase() })}
          />
          <input
            className={`${field} md:col-span-3`}
            placeholder="What is wrong"
            value={draft.what_wrong}
            onChange={(e) => setDraft({ ...draft, what_wrong: e.target.value })}
          />
          <input
            className={field}
            placeholder="Cause"
            value={draft.cause}
            onChange={(e) => setDraft({ ...draft, cause: e.target.value })}
          />
          <input
            className={field}
            placeholder="Correction agreed"
            value={draft.correction}
            onChange={(e) => setDraft({ ...draft, correction: e.target.value })}
          />
          <input
            className={field}
            type="date"
            value={draft.target_date}
            onChange={(e) => setDraft({ ...draft, target_date: e.target.value })}
          />
        </div>
        <button
          type="button"
          onClick={() => void raise()}
          className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground"
        >
          <Plus className="size-4" /> Raise NCR
        </button>
      </div>
      <div className="rounded-2xl border border-border bg-card">
        {(q.data ?? []).length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">No NCRs. Good.</p>
        ) : (
          <table className="w-full text-[13px]">
            <tbody>
              {(q.data ?? []).map((r) => (
                <tr key={r.id} className="border-t border-border/60 align-top">
                  <td className="px-3 py-2 whitespace-nowrap font-semibold">{r.ncr_no}</td>
                  <td className="py-2">
                    {r.stage_code} {r.location && `· ${r.location}`} {r.itp_id && `· ${r.itp_id}`}
                    <span className="block">{r.what_wrong}</span>
                    <span className="block text-[12px] text-muted-foreground">
                      {[
                        r.cause && `cause: ${r.cause}`,
                        r.correction && `fix: ${r.correction}`,
                        `raised ${fmtDay(r.raised_on)} by ${r.raised_by}`,
                        r.target_date && `target ${fmtDay(r.target_date)}`,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right whitespace-nowrap">
                    {r.status === "OPEN" ? (
                      <button
                        type="button"
                        onClick={() => void close(r.id)}
                        className="rounded bg-emerald-600 px-2 py-0.5 text-xs font-semibold text-white"
                      >
                        Close
                      </button>
                    ) : (
                      <span className="text-xs text-emerald-700">Closed {fmtDay(r.closed_on)}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}

function Itp({ projectId }: { projectId: string }) {
  const w = useSiteWeek(projectId);
  const list = useMemo(() => {
    const m = new Map<string, StageCheck & { stages: string[] }>();
    for (const s of w.data?.stages ?? [])
      for (const c of s.checks) {
        const e = m.get(c.id) ?? { ...c, stages: [] };
        e.stages.push(s.code);
        m.set(c.id, e);
      }
    return [...m.values()].sort((a, b) => Number(a.id.slice(1)) - Number(b.id.slice(1)));
  }, [w.data]);
  return (
    <section className="rounded-2xl border border-border bg-card">
      <table className="w-full text-[13px]">
        <tbody>
          {list.map((c) => (
            <tr key={c.id} className="border-t border-border/60 align-top">
              <td className="px-3 py-2 font-semibold">{c.id}</td>
              <td className="py-2">
                <b>{c.check}</b>{" "}
                <span
                  className={`rounded px-1.5 text-[11px] font-bold ${c.point === "H" ? "bg-red-100 text-red-800" : c.point === "W" ? "bg-amber-100 text-amber-900" : "bg-slate-100"}`}
                >
                  {c.point === "H" ? "HOLD" : c.point === "W" ? "WITNESS" : "RECORD"}
                </span>
                <span className="block">{c.criterion}</span>
                <span className="block text-[12px] text-muted-foreground">
                  {[
                    c.method,
                    c.reference,
                    c.by && `signs: ${c.by}`,
                    c.record && `record: ${c.record}`,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
                <span className="block text-[12px] text-muted-foreground">
                  Stages: {c.stages.join(", ")}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
