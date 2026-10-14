/**
 * Stage finance: the budget each stage needs (from the BOQ, see stage-budget),
 * payment requests to the landowners by their share, and the actual cost of a
 * finished stage, sent to the landowners only after an admin / PM approves it.
 *
 * Requests appear in the existing Capital Ledger (one "capital call" per owner)
 * and in Owner Approvals (one request with the breakdown), plus the Action Centre.
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { arr, fmtDay, n } from "@/lib/programme-progress";
import { stageBudgets, type BudgetCategory, type StageBudget } from "@/lib/stage-budget";
import { splitToPayers, type FlatRow, type FlatTypeRow, type Payer } from "@/lib/flats";

export type Owner = { name: string; role: string; share: number };
export type Money4 = Record<BudgetCategory, number>;
export type FinanceRow = {
  id: string;
  stage_code: string;
  budget: { total?: number; creditApplied?: number; individual?: number } & Partial<Money4>;
  call_total: number;
  called_at: string | null;
  actual: Partial<Money4>;
  actual_total: number;
  actual_status: string;
  approved_by_name: string;
  approved_at: string | null;
  sent_at: string | null;
  credit_carried: number;
  notes: string;
};

export const CATS: { key: BudgetCategory; label: string }[] = [
  { key: "material", label: "Material" },
  { key: "machinery", label: "Machinery" },
  { key: "labour", label: "Labour" },
  { key: "misc", label: "Misc" },
];

export const rupees = (v: number) => `₹${Math.round(v).toLocaleString("en-IN")}`;
export const lakhs = (v: number) =>
  Math.abs(v) >= 1e7 ? `₹${(v / 1e7).toFixed(2)} Cr` : `₹${(v / 1e5).toFixed(2)} L`;

export function useStageFinance(projectId: string) {
  return useQuery({
    queryKey: ["stage_finance", projectId],
    enabled: Boolean(projectId),
    queryFn: async () => {
      const [bills, labour] = await Promise.all([
        supabase
          .from("bills")
          .select("stage_code,cost_type,basic_amount,gst_amount,other_charges,status")
          .eq("project_id", projectId)
          .neq("stage_code", ""),
        supabase
          .from("labour_entries")
          .select("stage_code,headcount,day_rate,hours")
          .eq("project_id", projectId)
          .neq("stage_code", ""),
      ]);
      // Costs already recorded against each stage (bills by cost type + the labour log).
      const recorded = new Map<string, Money4 & { bills: number; labourDays: number }>();
      const rec = (code: string) => {
        let r = recorded.get(code);
        if (!r) {
          r = { material: 0, machinery: 0, labour: 0, misc: 0, bills: 0, labourDays: 0 };
          recorded.set(code, r);
        }
        return r;
      };
      for (const b of bills.data ?? []) {
        if (/reject|cancel/i.test(b.status ?? "")) continue;
        const r = rec(b.stage_code);
        const k = (
          ["material", "machinery", "labour", "misc"].includes(b.cost_type)
            ? b.cost_type
            : "material"
        ) as BudgetCategory;
        r[k] += n(b.basic_amount) + n(b.gst_amount) + n(b.other_charges);
        r.bills++;
      }
      for (const l of labour.data ?? []) {
        const r = rec(l.stage_code);
        r.labour += n(l.headcount) * n(l.day_rate) * (n(l.hours) ? n(l.hours) / 8 : 1);
        r.labourDays += n(l.headcount);
      }
      const [boq, st, pr, fin] = await Promise.all([
        supabase
          .from("boq_items")
          .select("item_code,description,package_no,line_group,quantity,rate,gst_pct,work_scope")
          .eq("project_id", projectId),
        supabase
          .from("site_stages")
          .select("code,name,duration_days,planned_start,materials,steel,closed_at,actual_pct")
          .eq("project_id", projectId)
          .neq("code", "")
          .order("sort", { ascending: true }),
        supabase.from("site_projects").select("name,landowners").eq("id", projectId).maybeSingle(),
        supabase.from("stage_finance").select("*").eq("project_id", projectId),
      ]);
      for (const r of [boq, st, pr, fin]) if (r.error) throw r.error;
      const [ft, fl] = await Promise.all([
        supabase.from("flat_types").select("code,label,indiv_incl").eq("project_id", projectId),
        supabase.from("flats").select("flat_no,type_code,owner_name").eq("project_id", projectId),
      ]);
      // Flats are optional (older projects have none): everything then goes by share.
      const flatInfo: FlatInfo = { types: ft.data ?? [], flats: fl.data ?? [] };
      const stages = (st.data ?? []).map((s) => ({
        code: s.code,
        name: (s.name ?? "").replace(/^[A-Z]{1,3}\d{0,3} · /, ""),
        durationDays: n(s.duration_days),
        plannedStart: s.planned_start,
        materials: arr<{ material: string; unit: string; qty: number; orderBy?: string | null }>(
          s.materials,
        ),
        steel: (s.steel as { totalKg: number; orderBy?: string | null } | null) ?? null,
        closed: Boolean(s.closed_at) || n(s.actual_pct) >= 100,
      }));
      const budget = stageBudgets(
        (boq.data ?? []).map((l) => ({
          item_code: l.item_code ?? "",
          description: l.description ?? "",
          package_no: n(l.package_no),
          line_group: l.line_group ?? "",
          quantity: n(l.quantity),
          rate: n(l.rate),
          gst_pct: l.gst_pct === null || l.gst_pct === undefined ? 18 : n(l.gst_pct),
          work_scope: l.work_scope ?? "common",
        })),
        stages,
      );
      const raw = arr<Record<string, unknown>>(pr.data?.landowners);
      const owners: Owner[] = raw
        .map((o) => ({
          name: String(o["name"] ?? "").trim(),
          role: String(o["role"] ?? "Land Holder"),
          share: n(o["share_pct"]),
        }))
        .filter((o) => o.name);
      const finance = new Map(
        (fin.data ?? []).map((r) => [r.stage_code, r as unknown as FinanceRow]),
      );
      const credit = [...finance.values()].reduce(
        (t, r) => t + n(r.credit_carried) - n(r.budget?.creditApplied),
        0,
      );
      return {
        budget,
        stages,
        owners,
        finance,
        credit,
        recorded,
        flatInfo,
        projectName: pr.data?.name ?? "",
      };
    },
  });
}

/** When the money must be in hand: a week before the stage, or before its first order-by date. */
export function dueDateFor(stage: {
  plannedStart: string | null;
  materials: { orderBy?: string | null }[];
  steel: { orderBy?: string | null } | null;
}) {
  const dates = [
    stage.plannedStart
      ? new Date(Date.parse(`${stage.plannedStart}T00:00:00Z`) - 7 * 86_400_000)
          .toISOString()
          .slice(0, 10)
      : null,
    ...stage.materials.map((m) => m.orderBy ?? null),
    stage.steel?.orderBy ?? null,
  ].filter((d): d is string => Boolean(d));
  const today = new Date().toISOString().slice(0, 10);
  const d = dates.sort()[0] ?? today;
  return d < today ? today : d;
}

export type FlatInfo = {
  types: Pick<FlatTypeRow, "code" | "label" | "indiv_incl">[];
  flats: Pick<FlatRow, "flat_no" | "type_code" | "owner_name">[];
};

/** Who pays an amount whose individual (flat owners') part is `individual`. */
export function payersFor(amount: number, individual: number, owners: Owner[], info: FlatInfo) {
  if (!info.flats.length) individual = 0;
  const indiv = Math.max(0, Math.min(amount, individual));
  return splitToPayers(amount - indiv, indiv, owners, info.flats, info.types);
}

function payerNote(p: Payer) {
  const parts = [];
  if (p.common) parts.push(`common ${rupees(p.common)}`);
  if (p.individual)
    parts.push(
      `flat${p.flats.length > 1 ? "s" : ""} ${p.flats.join(", ")} ${rupees(p.individual)}`,
    );
  if (p.unallotted) parts.push(`unallotted flats ${rupees(p.unallotted)}`);
  return parts.join(" + ");
}

function shares(owners: Owner[]) {
  const total = owners.reduce((t, o) => t + o.share, 0);
  if (total <= 0) throw new Error("Set each landowner's share % on Landowners & Investment first");
  return owners.map((o) => ({ ...o, frac: o.share / total }));
}

type Who = { id: string | null; name: string };

/** Requests the money for one or more stages from the landowners, by share. */
export async function requestStagePayment(
  projectId: string,
  items: { budget: StageBudget; due: string }[],
  owners: Owner[],
  creditAvailable: number,
  who: Who,
  flatInfo: FlatInfo = { types: [], flats: [] },
) {
  shares(owners);
  const owed = new Map<string, Payer>();
  let credit = Math.max(0, creditAvailable);
  const due = items.map((i) => i.due).sort()[0]!;
  const lines: string[] = [];
  let grand = 0;
  for (const { budget: b, due: stageDue } of items) {
    const applied = Math.min(credit, b.total);
    credit -= applied;
    const call = Math.round(b.total - applied);
    grand += call;
    lines.push(
      `${b.code} ${b.name}: ${lakhs(b.total)} (material ${lakhs(b.material)}, machinery ${lakhs(b.machinery)}, labour ${lakhs(b.labour)}, misc ${lakhs(b.misc)})${applied ? `, less credit ${lakhs(applied)}` : ""}, needed by ${fmtDay(stageDue)}`,
    );
    // Credit reduces the common and individual parts in proportion.
    const indivPart = b.total > 0 ? (call * (b.individual ?? 0)) / b.total : 0;
    const payers = payersFor(call, indivPart, owners, flatInfo);
    for (const p of payers) {
      const t = owed.get(p.name) ?? {
        ...p,
        common: 0,
        individual: 0,
        unallotted: 0,
        total: 0,
        flats: [],
      };
      t.common += p.common;
      t.individual += p.individual;
      t.unallotted += p.unallotted;
      t.total += p.total;
      t.flats = [...new Set([...t.flats, ...p.flats])];
      owed.set(p.name, t);
    }
    const calls = payers
      .map((p) => ({ p, amt: Math.round(p.total) }))
      .filter((x) => x.amt > 0)
      .map(({ p, amt }) => ({
        project_id: projectId,
        entry_type: "call",
        status: "pending",
        owner_name: p.name,
        owner_role: p.role,
        amount: amt,
        milestone: `${b.code} · ${b.name}`.slice(0, 120),
        entry_date: stageDue,
        reference: `STAGE-${b.code}`,
        mode: "",
        notes: `Stage budget ${lakhs(b.total)} incl. GST; ${payerNote(p)}`.slice(0, 500),
        created_by: who.id,
      }));
    if (calls.length) {
      const ins = await supabase.from("capital_entries").insert(calls);
      if (ins.error) throw ins.error;
    }
    const up = await supabase.from("stage_finance").upsert(
      {
        project_id: projectId,
        stage_code: b.code,
        budget: {
          total: Math.round(b.total),
          material: Math.round(b.material),
          machinery: Math.round(b.machinery),
          labour: Math.round(b.labour),
          misc: Math.round(b.misc),
          individual: Math.round(b.individual ?? 0),
          creditApplied: Math.round(applied),
        } as unknown as Json,
        call_total: call,
        called_at: new Date().toISOString(),
        called_by: who.id,
      },
      { onConflict: "project_id,stage_code" },
    );
    if (up.error) throw up.error;
  }
  const perOwner = [...owed.values()].map((p) => `${p.name}: ${rupees(p.total)} (${payerNote(p)})`);
  const body = [
    `Payment needed by ${fmtDay(due)} for the next stage${items.length > 1 ? "s" : ""}:`,
    ...lines.map((l) => `• ${l}`),
    "",
    `Total ${rupees(grand)} incl. GST. Common works are shared by your share %; individual works go to each flat's owner. Your part:`,
    ...perOwner.map((l) => `• ${l}`),
    "",
    "After each stage the actual cost is sent to you once the PMC has approved it; any difference is adjusted in the next request.",
  ].join("\n");
  const title = `Payment request: ${items.map((i) => i.budget.code).join(", ")} · ${lakhs(grand)} by ${fmtDay(due)}`;
  await supabase.from("owner_requests").insert({
    project_id: projectId,
    title,
    body,
    category: "note",
    priority: "High",
    status: "open",
    audience: "all",
    due_date: due,
    raised_by: who.id,
    raised_by_name: who.name,
  });
  await supabase.from("notifications").insert({
    title,
    body: perOwner.join(" · "),
    category: "Payment",
    priority: "High",
    link: "/capital-ledger",
    project_id: projectId,
    sender_id: who.id,
  });
  return grand;
}

export async function saveActual(projectId: string, code: string, actual: Money4, notes: string) {
  const total = CATS.reduce((t, c) => t + n(actual[c.key]), 0);
  const { error } = await supabase.from("stage_finance").upsert(
    {
      project_id: projectId,
      stage_code: code,
      actual: actual as unknown as Json,
      actual_total: Math.round(total),
      actual_status: "draft",
      notes,
    },
    { onConflict: "project_id,stage_code" },
  );
  if (error) throw error;
}

export async function approveActual(projectId: string, code: string, who: Who) {
  const { error } = await supabase
    .from("stage_finance")
    .update({
      actual_status: "approved",
      approved_by: who.id,
      approved_by_name: who.name,
      approved_at: new Date().toISOString(),
    })
    .eq("project_id", projectId)
    .eq("stage_code", code);
  if (error) throw error;
}

/** Sends an approved actual cost to the landowners; a shortfall becomes a top-up request, a saving a credit. */
export async function sendActual(
  projectId: string,
  row: FinanceRow,
  stageName: string,
  budgetTotal: number,
  owners: Owner[],
  who: Who,
  flatInfo: FlatInfo = { types: [], flats: [] },
) {
  if (row.actual_status !== "approved") throw new Error("Approve the actual cost first");
  shares(owners);
  const diff = Math.round(n(row.actual_total) - n(row.call_total));
  const bud = row.budget ?? {};
  const indivFrac =
    n(bud.total) > 0 ? n((bud as { individual?: number }).individual) / n(bud.total) : 0;
  const topUp = diff > 0 ? payersFor(diff, diff * indivFrac, owners, flatInfo) : [];
  if (diff > 0) {
    const calls = topUp
      .map((p) => ({ o: p, amt: Math.round(p.total) }))
      .filter((x) => x.amt > 0)
      .map(({ o, amt }) => ({
        project_id: projectId,
        entry_type: "call",
        status: "pending",
        owner_name: o.name,
        owner_role: o.role,
        amount: amt,
        milestone: `${row.stage_code} · actual cost top-up`,
        entry_date: new Date().toISOString().slice(0, 10),
        reference: `STAGE-${row.stage_code}-ACTUAL`,
        mode: "",
        notes: `Actual ${lakhs(row.actual_total)} vs requested ${lakhs(row.call_total)}`,
        created_by: who.id,
      }));
    if (calls.length) {
      const ins = await supabase.from("capital_entries").insert(calls);
      if (ins.error) throw ins.error;
    }
  }
  const a = row.actual;
  const body = [
    `Stage ${row.stage_code} ${stageName} is complete. Cost statement approved by ${row.approved_by_name} on ${fmtDay(row.approved_at)}:`,
    ...CATS.map((c) => `• ${c.label}: ${rupees(n(a[c.key]))}`),
    `• Total actual: ${rupees(row.actual_total)} (budget ${rupees(budgetTotal)}, requested ${rupees(row.call_total)})`,
    "",
    diff > 0
      ? `Shortfall ${rupees(diff)}: requested — ${topUp.map((p) => `${p.name} ${rupees(p.total)}`).join(", ")}.`
      : diff < 0
        ? `Saving ${rupees(-diff)}: carried as a credit against the next payment request.`
        : "Actual equals the amount requested.",
    row.notes ? `\nNotes: ${row.notes}` : "",
  ].join("\n");
  await supabase.from("owner_requests").insert({
    project_id: projectId,
    title: `Cost statement ${row.stage_code}: actual ${lakhs(row.actual_total)}${diff > 0 ? `, top-up ${lakhs(diff)}` : diff < 0 ? `, credit ${lakhs(-diff)}` : ""}`,
    body,
    category: "note",
    priority: diff > 0 ? "High" : "Normal",
    status: "open",
    audience: "all",
    raised_by: who.id,
    raised_by_name: who.name,
  });
  const { error } = await supabase
    .from("stage_finance")
    .update({
      actual_status: "sent",
      sent_at: new Date().toISOString(),
      credit_carried: diff < 0 ? -diff : 0,
    })
    .eq("id", row.id);
  if (error) throw error;
  await supabase.from("notifications").insert({
    title: `Cost statement sent to landowners: ${row.stage_code}`,
    body: `Actual ${lakhs(row.actual_total)}; ${diff > 0 ? `top-up ${lakhs(diff)} requested` : diff < 0 ? `credit ${lakhs(-diff)}` : "no difference"}.`,
    category: "Payment",
    priority: "Normal",
    link: "/stage-budget",
    project_id: projectId,
    sender_id: who.id,
  });
}
