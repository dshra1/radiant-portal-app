/**
 * What the site plan does on its own: sends each stage's instructions to the
 * field as a task, raises alerts (order-by dates, stages starting, hold points,
 * close-outs due), records check results and closes a stage, then releases the
 * next one.
 */
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { fmtDay, toDay } from "@/lib/programme-progress";
import {
  stageInstructions,
  stageName,
  successorsOf,
  type CheckResult,
  type PlanStage,
  type SiteWeek,
  type StageCheck,
} from "@/lib/site-week";

const CHANNEL = "Site plan";

type Who = { id: string | null; name: string };

/** Creates one task per stage (skipped if that stage already has an open task). */
export async function pushStageTasks(projectId: string, stages: PlanStage[], who: Who) {
  if (!stages.length) return 0;
  const existing = await supabase
    .from("team_messages")
    .select("body,status")
    .eq("project_id", projectId)
    .eq("is_task", true)
    .eq("channel", CHANNEL);
  if (existing.error) throw existing.error;
  const have = new Set(
    (existing.data ?? []).map((t) => /^\[([A-Z0-9]+)\]/.exec(t.body ?? "")?.[1]).filter(Boolean),
  );
  const rows = stages
    .filter((s) => !have.has(s.code))
    .map((s) => ({
      channel: CHANNEL,
      author_name: "Site plan",
      author_role: "PMC",
      body: stageInstructions(s),
      is_task: true,
      status: "Open",
      progress: 0,
      due_date: s.plannedEnd,
      project_id: projectId,
      sender_id: who.id,
    }));
  if (!rows.length) return 0;
  const ins = await supabase.from("team_messages").insert(rows);
  if (ins.error) throw ins.error;
  await supabase.from("notifications").insert({
    title: `Site instructions sent: ${rows.length} stage${rows.length > 1 ? "s" : ""}`,
    body: stages
      .filter((s) => !have.has(s.code))
      .map((s) => `${s.code} ${stageName(s.name)}`)
      .join(" · "),
    category: "Site plan",
    priority: "High",
    link: "/tasks",
    project_id: projectId,
    sender_id: who.id,
  });
  return rows.length;
}

type Alert = { title: string; body: string; priority: "High" | "Normal"; link: string };

/** The alerts the plan should raise today. Titles are stable so they are raised once. */
export function alertsFor(week: SiteWeek): Alert[] {
  const out: Alert[] = [];
  const today = week.today;
  if (week.beforeStart) {
    for (const p of week.preStart) {
      const due = toDay(p.neededBy);
      if (Number.isFinite(due) && due <= today + 14)
        out.push({
          title: `${due < today ? "Overdue" : "Due"} before the start: ${p.item}`,
          body: `Needed by ${fmtDay(p.neededBy)} · ${p.owner}${p.why ? ` · ${p.why}` : ""}. Ground work starts ${fmtDay(week.startDate)}.`,
          priority: "High",
          link: "/",
        });
    }
  }
  const byDate = new Map<string, typeof week.orders>();
  for (const o of week.orders) {
    if (o.po || toDay(o.orderBy) > today + 3) continue;
    byDate.set(o.orderBy, [...(byDate.get(o.orderBy) ?? []), o]);
  }
  for (const [date, items] of byDate) {
    const late = toDay(date) < today;
    out.push({
      title: `${late ? "Order overdue" : "Order now"}: ${items.length} item${items.length > 1 ? "s" : ""} by ${fmtDay(date)}`,
      body: items
        .slice(0, 8)
        .map(
          (o) =>
            `${o.code}: ${o.steel ? "steel" : o.what} ${o.qty.toLocaleString("en-IN")} ${o.unit}`,
        )
        .join(" · "),
      priority: "High",
      link: "/procurement",
    });
  }
  for (const s of [...week.now, ...week.next]) {
    const start = toDay(s.plannedStart);
    if (start >= today && start <= today + 3)
      out.push({
        title: `Starts ${fmtDay(s.plannedStart)}: ${s.code} ${stageName(s.name)}`,
        body: `${s.group}${s.floor ? ` · ${s.floor}` : ""} · ${s.durationDays} working days. Material, directions and checks are in Site Execution.`,
        priority: "Normal",
        link: "/site-execution",
      });
  }
  for (const h of week.holds)
    out.push({
      title: `Hold point this week: ${h.stage.code} ${h.check.id} ${h.check.check}`,
      body: `${h.check.criterion ?? ""}${h.check.by ? ` · signs: ${h.check.by}` : ""}. Work stops until it is signed.`,
      priority: "High",
      link: "/qa-inspection",
    });
  for (const s of week.behind)
    out.push({
      title: `Behind plan: ${s.code} ${stageName(s.name)}`,
      body: `Planned to finish ${fmtDay(s.plannedEnd)}; ${s.actualPct}% done.`,
      priority: "High",
      link: "/site-execution",
    });
  for (const s of week.awaitingCloseout)
    out.push({
      title: `Close out ${s.code}: photos, checks, approvals`,
      body: `${stageName(s.name)} is at 100%. Upload photos, record the check results and approvals to release the next stage.`,
      priority: "High",
      link: "/site-execution",
    });
  return out;
}

/** Raises today's alerts that were not raised in the last 14 days. */
export async function raiseAlerts(projectId: string, week: SiteWeek, who: Who) {
  const alerts = alertsFor(week);
  if (!alerts.length) return 0;
  const since = new Date(Date.now() - 14 * 86_400_000).toISOString();
  const prev = await supabase
    .from("notifications")
    .select("title")
    .eq("project_id", projectId)
    .eq("category", "Site plan")
    .gte("created_at", since);
  if (prev.error) throw prev.error;
  const seen = new Set((prev.data ?? []).map((r) => r.title));
  const fresh = alerts.filter((a) => !seen.has(a.title));
  if (!fresh.length) return 0;
  const ins = await supabase.from("notifications").insert(
    fresh.map((a) => ({
      ...a,
      category: "Site plan",
      project_id: projectId,
      sender_id: who.id,
    })),
  );
  if (ins.error) throw ins.error;
  return fresh.length;
}

const QA_CATEGORY: Record<string, string> = {
  Foundation: "Concrete",
  Frame: "Concrete",
  Stilt: "Concrete",
  Masonry: "Blockwork",
  Terrace: "Waterproofing",
};

/** Records one check result as a QA inspection and on the stage's evidence. */
export async function recordCheck(
  projectId: string,
  stage: PlanStage,
  check: StageCheck,
  result: "OK" | "NOT OK",
  inspector: string,
  notes: string,
  who: Who,
) {
  const on = new Date().toISOString().slice(0, 10);
  const ins = await supabase
    .from("qa_inspections")
    .insert({
      project_id: projectId,
      inspected_on: on,
      location_tag: `${stage.code}${stage.floor ? ` · ${stage.floor}` : ""}`,
      category: QA_CATEGORY[stage.group] ?? "Housekeeping",
      code_ref: [check.id, check.reference].filter(Boolean).join(" · "),
      severity: check.point === "H" ? "High" : check.point === "W" ? "Medium" : "Low",
      findings: `${check.check}${check.criterion ? `: ${check.criterion}` : ""}${notes ? ` · ${notes}` : ""}`,
      defect_count: result === "OK" ? 0 : 1,
      resolution: result === "OK" ? "Closed" : "Open",
      inspector_name: inspector,
      notes: `Stage close-out ${stage.code}`,
      created_by: who.id,
    })
    .select("id")
    .single();
  if (ins.error) throw ins.error;
  // The checklist log line for this stage and check.
  await supabase
    .from("quality_checks")
    .update({ inspected_on: on, result, inspector, remarks: notes })
    .eq("project_id", projectId)
    .eq("stage_code", stage.code)
    .eq("itp_id", check.id);
  const checks: Record<string, CheckResult> = { ...(stage.evidence.checks ?? {}) };
  checks[check.id] = { result, by: inspector, on, inspectionId: ins.data.id };
  const up = await supabase
    .from("site_stages")
    .update({ evidence: { ...stage.evidence, checks } as unknown as Json })
    .eq("id", stage.id);
  if (up.error) throw up.error;
  if (result === "NOT OK")
    await supabase.from("notifications").insert({
      title: `Check failed: ${stage.code} ${check.id} ${check.check}`,
      body: `${inspector}: ${notes || "not accepted"}. Raise an NCR and fix before the next step.`,
      category: "Site plan",
      priority: "High",
      link: "/qa-inspection",
      project_id: projectId,
      sender_id: who.id,
    });
}

/** Uploads photos or documents for a stage to the project record. */
export async function uploadStageFiles(
  projectId: string,
  stage: PlanStage,
  files: File[],
  category: "progress" | "quality" | "approval",
  who: Who,
) {
  for (const file of files) {
    const safe = file.name.replace(/[^\w.-]+/g, "_");
    const path = `${projectId}/${stage.code}/${Date.now()}-${safe}`;
    const up = await supabase.storage.from("site-media").upload(path, file, {
      upsert: false,
      contentType: file.type || "application/octet-stream",
    });
    if (up.error) throw up.error;
    const ins = await supabase.from("project_media").insert({
      project_id: projectId,
      path,
      title: file.name,
      caption: `${stage.code} ${stageName(stage.name)}`,
      stage: stage.code,
      category,
      captured_on: new Date().toISOString().slice(0, 10),
      uploaded_by: who.id,
      uploaded_by_name: who.name,
    });
    if (ins.error) throw ins.error;
  }
}

/** Closes a stage and releases the stages that follow it (tasks + alert). */
export async function closeStage(projectId: string, stage: PlanStage, all: PlanStage[], who: Who) {
  const on = new Date().toISOString().slice(0, 10);
  const up = await supabase
    .from("site_stages")
    .update({
      status: "completed",
      actual_pct: 100,
      actual_end: on,
      closed_at: new Date().toISOString(),
      closed_by: who.id,
      closed_by_name: who.name,
    })
    .eq("id", stage.id);
  if (up.error) throw up.error;
  const next = successorsOf(all, stage.code).filter((s) => s.id !== stage.id);
  await supabase.from("notifications").insert({
    title: `${stage.code} closed: next ${next.map((s) => s.code).join(", ") || "stages per programme"}`,
    body: `${stageName(stage.name)} signed off by ${who.name}. ${next
      .map((s) => `${s.code} ${stageName(s.name)} (planned ${fmtDay(s.plannedStart)})`)
      .join(" · ")}`,
    category: "Site plan",
    priority: "High",
    link: "/site-execution",
    project_id: projectId,
    sender_id: who.id,
  });
  await pushStageTasks(projectId, next, who);
  return next;
}

/** What is still missing before a stage can be closed. */
export function closeoutGaps(stage: PlanStage, photos: number) {
  const gaps: string[] = [];
  for (const c of stage.checks) {
    const r = stage.evidence.checks?.[c.id];
    if (c.point === "H" && r?.result !== "OK")
      gaps.push(`Hold point ${c.id} ${c.check} not signed OK`);
  }
  if (photos < 1) gaps.push("No photos uploaded for this stage");
  return gaps;
}
