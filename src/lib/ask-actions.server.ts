/**
 * Ask: entries (stock receipt / issue, stage progress, labour) and checks on what supervisors and accounts entered.
 * Entries are never saved by the AI: it proposes one, the app checks it against the records, the user sees a card
 * with any warnings and taps Confirm; only then is the row written, with the user's own login (roles apply).
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { sameMaterial, type AskTable } from "@/lib/ask-data.server";

type Sb = SupabaseClient;
const n = (v: unknown) => Number(v ?? 0) || 0;
const fmt = (v: number) => (Math.round(v * 100) / 100).toLocaleString("en-IN");
/** Today in India (the server runs in UTC). */
const today = () => new Date(Date.now() + 5.5 * 36e5).toISOString().slice(0, 10);

export type StockAction = {
  type: "stock";
  movement: "receipt" | "issue";
  material: string;
  quantity: number;
  date?: string;
  po_number?: string;
  party?: string;
  stage?: string;
  remarks?: string;
};
export type StageAction = { type: "stage"; stage: string; percent: number };
export type LabourAction = {
  type: "labour";
  date?: string;
  contractor: string;
  trade: string;
  headcount: number;
  work_done?: string;
  area?: string;
};
export type AskAction = StockAction | StageAction | LabourAction;
export type Proposal = {
  action: AskAction & { resolved?: Record<string, unknown> };
  title: string;
  lines: [string, string][];
  warnings: string[];
  blocked?: string;
};

async function balances(sb: Sb, pid: string) {
  const [items, moves] = await Promise.all([
    sb
      .from("stock_items")
      .select("id,item_code,description,unit,opening_qty")
      .eq("project_id", pid)
      .limit(2000),
    sb
      .from("stock_movements")
      .select("item_id,item_code,movement_type,quantity,stage_code")
      .eq("project_id", pid)
      .limit(20000),
  ]);
  const mv = (moves.data ?? []) as {
    item_id: string | null;
    item_code: string;
    movement_type: string;
    quantity: number;
    stage_code: string;
  }[];
  return {
    moves: mv,
    items: (
      (items.data ?? []) as {
        id: string;
        item_code: string;
        description: string;
        unit: string;
        opening_qty: number;
      }[]
    ).map((it) => {
      let b = n(it.opening_qty);
      for (const m of mv) {
        if (
          m.item_id !== it.id &&
          !(
            m.item_id === null &&
            m.item_code &&
            m.item_code.toLowerCase() === it.item_code.toLowerCase()
          )
        )
          continue;
        const q = n(m.quantity);
        if (m.movement_type === "receipt" || m.movement_type === "return") b += q;
        else if (m.movement_type === "issue") b -= q;
        else b += q;
      }
      return { ...it, balance: b };
    }),
  };
}

type StageRow = {
  id: string;
  code: string;
  name: string;
  floor: string;
  planned_start: string | null;
  planned_end: string | null;
  actual_pct: number;
  actual_start: string | null;
  closed_at: string | null;
  hold_point: boolean;
  materials: { material: string; unit: string; qty: number }[] | null;
};
async function stageList(sb: Sb, pid: string) {
  const { data } = await sb
    .from("site_stages")
    .select(
      "id,code,name,floor,planned_start,planned_end,actual_pct,actual_start,closed_at,hold_point,materials",
    )
    .eq("project_id", pid)
    .order("sort")
    .limit(2000);
  return (data ?? []) as unknown as StageRow[];
}
function findStage(st: StageRow[], q: string) {
  const k = q.trim().toLowerCase();
  return (
    st.find((s) => s.code.toLowerCase() === k) ??
    st.find((s) => `${s.code} ${s.name} ${s.floor}`.toLowerCase().includes(k))
  );
}

/** Check a proposed entry against the records. Nothing is written here. */
export async function propose(sb: Sb, pid: string, a: AskAction): Promise<Proposal> {
  const warnings: string[] = [];
  if (a.type === "stock") {
    const { items } = await balances(sb, pid);
    const it = items.find(
      (x) =>
        sameMaterial(a.material, x.description) ||
        x.item_code.toLowerCase() === a.material.toLowerCase(),
    );
    if (!it)
      return {
        action: a,
        title: "Stock entry",
        lines: [["Material", a.material]],
        warnings,
        blocked: `"${a.material}" is not in this project's stock register. Add it in Inventory Control first, or use the exact name from the register.`,
      };
    if (!(a.quantity > 0))
      return {
        action: a,
        title: "Stock entry",
        lines: [["Material", it.description]],
        warnings,
        blocked: "The quantity must be more than zero.",
      };
    let stageCode = "";
    if (a.stage) {
      const st = findStage(await stageList(sb, pid), a.stage);
      if (st) {
        stageCode = st.code;
        const need = (st.materials ?? [])
          .filter((m) => sameMaterial(m.material, it.description))
          .reduce((s, m) => s + n(m.qty), 0);
        if (a.movement === "issue" && need > 0) {
          const issued = (await balances(sb, pid)).moves
            .filter(
              (m) => m.movement_type === "issue" && m.stage_code === st.code && m.item_id === it.id,
            )
            .reduce((s, m) => s + n(m.quantity), 0);
          if (issued + a.quantity > need * 1.1)
            warnings.push(
              `${st.code} needs ${fmt(need)} ${it.unit} in the programme; with this issue ${fmt(issued + a.quantity)} will have gone to it.`,
            );
        }
      } else
        warnings.push(`No stage matches "${a.stage}"; the entry will not be linked to a stage.`);
    }
    if (a.movement === "issue" && a.quantity > it.balance)
      warnings.push(
        `Only ${fmt(it.balance)} ${it.unit} in stock; this issue would take it below zero.`,
      );
    if (a.movement === "receipt" && !a.po_number)
      warnings.push("No PO number given for this receipt.");
    if (a.movement === "issue" && !stageCode)
      warnings.push("Not linked to a stage: say which activity it is for.");
    const date = a.date || today();
    if (date > today()) warnings.push("The date is in the future.");
    return {
      action: {
        ...a,
        resolved: {
          item_id: it.id,
          item_code: it.item_code,
          description: it.description,
          unit: it.unit,
          stage_code: stageCode,
          date,
        },
      },
      title: a.movement === "receipt" ? "Record a stock receipt" : "Record a stock issue",
      lines: [
        ["Material", it.description],
        ["Quantity", `${fmt(a.quantity)} ${it.unit}`],
        ["Date", date],
        ...(a.po_number ? ([["PO", a.po_number]] as [string, string][]) : []),
        ...(a.party
          ? ([[a.movement === "receipt" ? "From" : "To", a.party]] as [string, string][])
          : []),
        ...(stageCode ? ([["Stage", stageCode]] as [string, string][]) : []),
        [
          "Stock after",
          `${fmt(it.balance + (a.movement === "receipt" ? a.quantity : -a.quantity))} ${it.unit} (now ${fmt(it.balance)})`,
        ],
      ],
      warnings,
    };
  }
  if (a.type === "stage") {
    const st = findStage(await stageList(sb, pid), a.stage);
    if (!st)
      return {
        action: a,
        title: "Stage progress",
        lines: [["Stage", a.stage]],
        warnings,
        blocked: `No stage matches "${a.stage}".`,
      };
    const pct = Math.max(0, Math.min(100, Math.round(a.percent)));
    if (st.closed_at) warnings.push("This stage is already closed.");
    if (pct < n(st.actual_pct))
      warnings.push(`Progress goes DOWN from ${n(st.actual_pct)}% to ${pct}%.`);
    if ((st.planned_start ?? "9999") > today() && pct > 0)
      warnings.push(`The stage is planned to start on ${st.planned_start}.`);
    if (pct === 100 && st.hold_point)
      warnings.push("This is a hold point: its inspection must be passed before it is closed.");
    const { moves } = await balances(sb, pid);
    if (
      pct > n(st.actual_pct) &&
      (st.materials ?? []).length &&
      !moves.some((m) => m.movement_type === "issue" && m.stage_code === st.code)
    )
      warnings.push("No material has been issued to this stage in the stock register yet.");
    return {
      action: {
        ...a,
        percent: pct,
        resolved: { id: st.id, code: st.code, first: !st.actual_start && pct > 0 },
      },
      title: "Update stage progress",
      lines: [
        ["Stage", `${st.code} ${st.name}${st.floor ? " · " + st.floor : ""}`],
        ["Progress", `${n(st.actual_pct)}% → ${pct}%`],
        ["Planned", `${st.planned_start ?? "—"} → ${st.planned_end ?? "—"}`],
      ],
      warnings,
    };
  }
  const date = a.date || today();
  if (!(a.headcount > 0))
    return {
      action: a,
      title: "Labour",
      lines: [],
      warnings,
      blocked: "Headcount must be more than zero.",
    };
  if (a.headcount > 300) warnings.push("That is a very large headcount for one day.");
  const { data } = await sb
    .from("labour_entries")
    .select("id")
    .eq("project_id", pid)
    .eq("work_date", date)
    .ilike("contractor", a.contractor)
    .ilike("trade", a.trade)
    .limit(1);
  if ((data ?? []).length)
    warnings.push("A labour entry for this contractor and trade already exists for this date.");
  return {
    action: { ...a, resolved: { date } },
    title: "Log labour",
    lines: [
      ["Date", date],
      ["Contractor", a.contractor],
      ["Trade", a.trade],
      ["Headcount", String(a.headcount)],
      ...(a.work_done ? ([["Work", a.work_done]] as [string, string][]) : []),
      ...(a.area ? ([["Area", a.area]] as [string, string][]) : []),
    ],
    warnings,
  };
}

/** Save a confirmed entry. It is checked again first, so a stale or edited card can't bypass the checks. */
export async function commit(
  sb: Sb,
  pid: string,
  a: AskAction,
  user: { id: string; name: string },
) {
  const p = await propose(sb, pid, a);
  if (p.blocked) throw new Error(p.blocked);
  const r = (p.action.resolved ?? {}) as Record<string, string | boolean>;
  if (a.type === "stock") {
    const { error } = await sb.from("stock_movements").insert({
      project_id: pid,
      item_id: r["item_id"],
      item_code: r["item_code"],
      description: r["description"],
      unit: r["unit"],
      movement_type: a.movement,
      quantity: a.quantity,
      movement_date: r["date"],
      reference: "Entered with Ask",
      party: a.party ?? "",
      handled_by: user.name,
      remarks: a.remarks ?? "",
      po_number: a.po_number ?? "",
      stage_code: r["stage_code"] ?? "",
      created_by: user.id,
    } as never);
    if (error) throw new Error(error.message);
    return `Saved: ${p.lines[1]?.[1]} ${a.movement === "receipt" ? "received" : "issued"}.`;
  }
  if (a.type === "stage") {
    const values: Record<string, unknown> = { actual_pct: (p.action as StageAction).percent };
    if (r["first"]) values["actual_start"] = today();
    const { error } = await sb
      .from("site_stages")
      .update(values as never)
      .eq("id", r["id"] as string);
    if (error) throw new Error(error.message);
    return `Saved: ${r["code"]} at ${(p.action as StageAction).percent}%.`;
  }
  const { error } = await sb.from("labour_entries").insert({
    project_id: pid,
    work_date: r["date"],
    contractor: a.contractor,
    trade: a.trade,
    headcount: a.headcount,
    work_done: a.work_done ?? "",
    area: a.area ?? "",
    supervisor: user.name,
    notes: "Entered with Ask",
    created_by: user.id,
  } as never);
  if (error) throw new Error(error.message);
  return `Saved: ${a.headcount} ${a.trade} (${a.contractor}).`;
}

/** The confirming check: what supervisors and accounts entered in the last N days that does not add up. */
export async function verify(sb: Sb, pid: string, days = 7): Promise<AskTable> {
  const since = new Date(Date.now() - days * 864e5).toISOString().slice(0, 10);
  const t = today();
  const out: (string | number)[][] = [];
  const [{ items, moves }, st, mv, bills, pos] = await Promise.all([
    balances(sb, pid),
    stageList(sb, pid),
    sb
      .from("stock_movements")
      .select(
        "description,unit,movement_type,quantity,movement_date,po_number,stage_code,handled_by,item_id",
      )
      .eq("project_id", pid)
      .gte("movement_date", since)
      .limit(3000),
    sb
      .from("bills")
      .select("bill_number,bill_date,vendor_name,basic_amount,gst_amount,po_id,status,created_at")
      .eq("project_id", pid)
      .limit(3000),
    sb
      .from("purchase_orders")
      .select("id,po_number,vendor_name,purchase_order_items(quantity,rate,discount_pct)")
      .eq("project_id", pid)
      .limit(1000),
  ]);
  const issuedStages = new Set(
    moves.filter((m) => m.movement_type === "issue" && m.stage_code).map((m) => m.stage_code),
  );
  for (const it of items)
    if (it.balance < 0)
      out.push([
        "Stock",
        it.description,
        `Register shows ${fmt(it.balance)} ${it.unit}: more was issued than received.`,
        "Stores",
      ]);
  for (const m of (mv.data ?? []) as {
    description: string;
    unit: string;
    movement_type: string;
    quantity: number;
    movement_date: string;
    po_number: string;
    stage_code: string;
    handled_by: string;
  }[]) {
    if (m.movement_type === "receipt" && !m.po_number)
      out.push([
        "Receipt",
        `${m.description} ${fmt(n(m.quantity))} ${m.unit} · ${m.movement_date}`,
        "No PO number.",
        m.handled_by || "—",
      ]);
    if (m.movement_type === "issue" && !m.stage_code)
      out.push([
        "Issue",
        `${m.description} ${fmt(n(m.quantity))} ${m.unit} · ${m.movement_date}`,
        "Not linked to a stage.",
        m.handled_by || "—",
      ]);
  }
  for (const s of st) {
    if (n(s.actual_pct) > 0 && (s.planned_start ?? "9999") > t)
      out.push([
        "Stage",
        `${s.code} ${s.name}`,
        `Shows ${n(s.actual_pct)}% but is planned to start ${s.planned_start}.`,
        "Supervisor",
      ]);
    if (n(s.actual_pct) >= 100 && !s.closed_at)
      out.push([
        "Stage",
        `${s.code} ${s.name}`,
        "100% done but not closed (inspection / close-out pending).",
        "Supervisor",
      ]);
    if (n(s.actual_pct) >= 50 && (s.materials ?? []).length && !issuedStages.has(s.code))
      out.push([
        "Stage",
        `${s.code} ${s.name}`,
        `Shows ${n(s.actual_pct)}% but no material has been issued to it.`,
        "Supervisor / Stores",
      ]);
  }
  const poVal = new Map<string, { no: string; v: number }>();
  for (const p of (pos.data ?? []) as {
    id: string;
    po_number: string;
    purchase_order_items: { quantity: number; rate: number; discount_pct: number }[];
  }[])
    poVal.set(p.id, {
      no: p.po_number,
      v: (p.purchase_order_items ?? []).reduce(
        (s, i) => s + n(i.quantity) * n(i.rate) * (1 - n(i.discount_pct) / 100),
        0,
      ),
    });
  const B = (bills.data ?? []) as {
    bill_number: string;
    bill_date: string | null;
    vendor_name: string;
    basic_amount: number;
    gst_amount: number;
    po_id: string | null;
    created_at: string;
  }[];
  const billedPerPo = new Map<string, number>();
  for (const b of B)
    if (b.po_id) billedPerPo.set(b.po_id, (billedPerPo.get(b.po_id) ?? 0) + n(b.basic_amount));
  for (const [po, v] of billedPerPo) {
    const P = poVal.get(po);
    if (P && P.v > 0 && v > P.v * 1.02)
      out.push([
        "Bills",
        `PO ${P.no}`,
        `Billed ₹${fmt(v)} (basic) against a PO value of ₹${fmt(P.v)}.`,
        "Accounts",
      ]);
  }
  const seen = new Map<string, number>();
  const label = new Map<string, string>();
  for (const b of B) {
    const k = `${b.vendor_name.trim().toLowerCase()}|${b.bill_number.trim().toLowerCase()}`;
    if (b.bill_number) {
      seen.set(k, (seen.get(k) ?? 0) + 1);
      label.set(k, `${b.vendor_name} ${b.bill_number}`);
    }
    if ((b.created_at ?? "").slice(0, 10) >= since) {
      if (!b.po_id)
        out.push([
          "Bill",
          `${b.vendor_name} ${b.bill_number}`,
          "Not linked to a purchase order.",
          "Accounts",
        ]);
      const g = n(b.gst_amount),
        base = n(b.basic_amount);
      if (
        base > 0 &&
        g > 0 &&
        ![0.05, 0.12, 0.18, 0.28].some((r) => Math.abs(g - base * r) <= Math.max(2, base * 0.005))
      )
        out.push([
          "Bill",
          `${b.vendor_name} ${b.bill_number}`,
          `GST ₹${fmt(g)} is not 5/12/18/28% of ₹${fmt(base)}.`,
          "Accounts",
        ]);
    }
  }
  for (const [k, c] of seen)
    if (c > 1)
      out.push([
        "Bill",
        label.get(k) ?? k,
        `Entered ${c} times (same vendor and bill number).`,
        "Accounts",
      ]);
  return {
    title: `Check of entries (last ${days} days)`,
    columns: ["Area", "Entry", "What doesn't add up", "Who to ask"],
    rows: out.slice(0, 80),
    note: out.length
      ? "Checked against the stock register, programme, purchase orders and bills."
      : "Everything checked adds up: stock, stages, receipts, issues and bills.",
  };
}
