/**
 * Data lookups for the "Ask" assistant. Every number comes straight from the app's tables, read with the
 * signed-in user's own token (so row-level security and roles apply). Stock balances use the same rule as the
 * Inventory Control page: opening + receipts + returns − issues (± adjustments).
 */
import type { SupabaseClient } from "@supabase/supabase-js";

export type AskTable = {
  title: string;
  columns: string[];
  rows: (string | number)[][];
  note?: string;
};

type Sb = SupabaseClient;
type StockRow = {
  id: string;
  item_code: string;
  description: string;
  category: string;
  unit: string;
  opening_qty: number;
  reorder_level: number;
  rate: number;
  store_location: string;
  order_by: string | null;
};
type Mat = { material: string; unit: string; qty: number; orderBy?: string | null };

const n = (v: unknown) => Number(v ?? 0) || 0;
const fmt = (v: number) => (Math.round(v * 100) / 100).toLocaleString("en-IN");
const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, " ")
    .trim();
const words = (s: string) =>
  norm(s)
    .split(" ")
    .filter((w) => w.length > 1);

/** Loose name match between a stage material line and a stock item ("OPC 53 cement" ~ "Cement OPC 53 grade"). */
export function sameMaterial(a: string, b: string) {
  const A = norm(a),
    B = norm(b);
  if (!A || !B) return false;
  if (A.includes(B) || B.includes(A)) return true;
  const wa = words(a),
    wb = new Set(words(b));
  if (!wa.length) return false;
  const hit = wa.filter((w) => wb.has(w)).length;
  return hit / Math.min(wa.length, wb.size || 1) >= 0.6;
}

export async function projectsOf(sb: Sb) {
  const { data } = await sb
    .from("site_projects")
    .select("id,name,location")
    .order("created_at", { ascending: false });
  return (data ?? []) as { id: string; name: string; location: string }[];
}

async function stockBalances(sb: Sb, projectId: string) {
  const [items, moves] = await Promise.all([
    sb
      .from("stock_items")
      .select(
        "id,item_code,description,category,unit,opening_qty,reorder_level,rate,store_location,order_by",
      )
      .eq("project_id", projectId)
      .limit(2000),
    sb
      .from("stock_movements")
      .select("item_id,item_code,movement_type,quantity")
      .eq("project_id", projectId)
      .limit(20000),
  ]);
  const map = new Map<string, { r: number; i: number }>();
  for (const m of (moves.data ?? []) as {
    item_id: string | null;
    item_code: string;
    movement_type: string;
    quantity: number;
  }[]) {
    const key = m.item_id ?? (m.item_code || "").toLowerCase();
    const cur = map.get(key) ?? { r: 0, i: 0 };
    const q = n(m.quantity);
    if (m.movement_type === "receipt" || m.movement_type === "return") cur.r += q;
    else if (m.movement_type === "issue") cur.i += q;
    else if (q >= 0) cur.r += q;
    else cur.i += -q;
    map.set(key, cur);
  }
  return ((items.data ?? []) as StockRow[]).map((it) => {
    const b = map.get(it.id) ?? map.get((it.item_code || "").toLowerCase()) ?? { r: 0, i: 0 };
    const balance = n(it.opening_qty) + b.r - b.i;
    return { ...it, received: b.r, issued: b.i, balance };
  });
}

export async function stockLookup(sb: Sb, projectId: string, query: string): Promise<AskTable> {
  const all = await stockBalances(sb, projectId);
  const q = query.trim();
  const rows = (
    q
      ? all.filter(
          (s) =>
            sameMaterial(q, s.description) ||
            norm(s.item_code) === norm(q) ||
            norm(s.category).includes(norm(q)),
        )
      : all
  ).slice(0, 40);
  return {
    title: q ? `Stock: ${q}` : "Stock on hand",
    columns: ["Material", "Unit", "In stock", "Received", "Issued", "Reorder at", "Store"],
    rows: rows.map((s) => [
      s.description,
      s.unit,
      fmt(s.balance),
      fmt(s.received),
      fmt(s.issued),
      s.reorder_level ? fmt(n(s.reorder_level)) : "—",
      s.store_location || "—",
    ]),
    note: rows.length
      ? "From the stock register: opening + receipts − issues."
      : `No stock item matching "${q}" in this project's register.`,
  };
}

export async function lowStock(sb: Sb, projectId: string): Promise<AskTable> {
  const today = new Date().toISOString().slice(0, 10);
  const all = await stockBalances(sb, projectId);
  const low = all
    .filter((s) => n(s.reorder_level) > 0 && s.balance <= n(s.reorder_level))
    .filter((s) => !s.order_by || s.order_by <= today)
    .sort((a, b) => a.balance / (n(a.reorder_level) || 1) - b.balance / (n(b.reorder_level) || 1));
  return {
    title: "Low stock (at or below reorder level)",
    columns: ["Material", "Unit", "In stock", "Reorder at", "Order by"],
    rows: low
      .slice(0, 40)
      .map((s) => [
        s.description,
        s.unit,
        fmt(s.balance),
        fmt(n(s.reorder_level)),
        s.order_by ?? "—",
      ]),
    note: low.length
      ? "Same rule as Inventory Control: only materials already due are flagged."
      : "Nothing is below its reorder level right now.",
  };
}

type StageRow = {
  code: string;
  name: string;
  floor: string;
  stage_group: string;
  planned_start: string | null;
  planned_end: string | null;
  actual_pct: number;
  closed_at: string | null;
  materials: Mat[] | null;
};

async function stages(sb: Sb, projectId: string) {
  const { data } = await sb
    .from("site_stages")
    .select("code,name,floor,stage_group,planned_start,planned_end,actual_pct,closed_at,materials")
    .eq("project_id", projectId)
    .order("sort")
    .limit(2000);
  return (data ?? []) as unknown as StageRow[];
}

function needVsStock(mats: Mat[], stock: Awaited<ReturnType<typeof stockBalances>>) {
  const agg = new Map<string, Mat & { orderBy?: string | null }>();
  for (const m of mats) {
    const k = norm(m.material) + "|" + norm(m.unit);
    const cur = agg.get(k);
    if (cur) {
      cur.qty += n(m.qty);
      if (m.orderBy && (!cur.orderBy || m.orderBy < cur.orderBy)) cur.orderBy = m.orderBy;
    } else
      agg.set(k, { material: m.material, unit: m.unit, qty: n(m.qty), orderBy: m.orderBy ?? null });
  }
  return [...agg.values()].map((m) => {
    const s = stock.find((x) => sameMaterial(m.material, x.description));
    const have = s ? s.balance : null;
    const short = have === null ? null : Math.max(0, m.qty - have);
    return [
      m.material,
      m.unit,
      fmt(m.qty),
      have === null ? "not in register" : fmt(have),
      short === null ? "—" : short > 0 ? fmt(short) : "enough",
      m.orderBy ?? "—",
    ] as (string | number)[];
  });
}

export async function stageNeeds(sb: Sb, projectId: string, query: string): Promise<AskTable> {
  const [st, stock] = await Promise.all([stages(sb, projectId), stockBalances(sb, projectId)]);
  const q = norm(query);
  const hit = st.filter(
    (s) =>
      norm(s.code) === q ||
      (q && (norm(s.name).includes(q) || norm(`${s.code} ${s.name} ${s.floor}`).includes(q))),
  );
  if (!hit.length)
    return {
      title: `Stage: ${query}`,
      columns: ["Stage"],
      rows: [],
      note: `No programme stage matches "${query}". Try the stage code (for example the one shown in Site Today) or part of its name.`,
    };
  const mats = hit.flatMap((s) => (Array.isArray(s.materials) ? s.materials : []));
  return {
    title:
      hit.length === 1
        ? `Material for ${hit[0]!.code} ${hit[0]!.name}`
        : `Material for ${hit.length} stages matching "${query}"`,
    columns: ["Material", "Unit", "Needed", "In stock", "Short by", "Order by"],
    rows: needVsStock(mats, stock),
    note: mats.length
      ? "Needed = the stage ledger from the project programme. In stock = the stock register today."
      : "This stage has no material lines in the programme.",
  };
}

export async function upcomingNeeds(sb: Sb, projectId: string, days: number): Promise<AskTable> {
  const [st, stock] = await Promise.all([stages(sb, projectId), stockBalances(sb, projectId)]);
  const today = new Date();
  const end = new Date(today.getTime() + Math.max(1, Math.min(days, 120)) * 864e5)
    .toISOString()
    .slice(0, 10);
  const t = today.toISOString().slice(0, 10);
  const due = st.filter(
    (s) => !s.closed_at && (s.planned_start ?? "9999") <= end && (s.planned_end ?? "0000") >= t,
  );
  const mats = due.flatMap((s) => (Array.isArray(s.materials) ? s.materials : []));
  return {
    title: `Material needed for work in the next ${days} days (${due.length} stages)`,
    columns: ["Material", "Unit", "Needed", "In stock", "Short by", "Order by"],
    rows: needVsStock(mats, stock),
    note: due.length
      ? `Stages: ${due
          .slice(0, 8)
          .map((s) => s.code || s.name)
          .join(", ")}${due.length > 8 ? "…" : ""}`
      : "No stages are planned in this window.",
  };
}

export async function siteNow(sb: Sb, projectId: string): Promise<AskTable> {
  const st = await stages(sb, projectId);
  const t = new Date().toISOString().slice(0, 10);
  const on = st.filter(
    (s) => !s.closed_at && (s.planned_start ?? "9999") <= t && (s.planned_end ?? "0000") >= t,
  );
  const late = st.filter((s) => !s.closed_at && (s.planned_end ?? "9999") < t);
  return {
    title: "Work on now",
    columns: ["Stage", "Floor", "Planned", "Done"],
    rows: [...late.slice(0, 10), ...on]
      .slice(0, 30)
      .map((s) => [
        `${s.code} ${s.name}${(s.planned_end ?? "9999") < t ? " (late)" : ""}`,
        s.floor || "—",
        `${s.planned_start ?? "—"} → ${s.planned_end ?? "—"}`,
        `${n(s.actual_pct)}%`,
      ]),
    note: `${on.length} on now, ${late.length} past their planned finish and not closed.`,
  };
}

export async function boqLookup(sb: Sb, projectId: string, query: string): Promise<AskTable> {
  const { data } = await sb
    .from("boq_items")
    .select("package,stage,item_code,description,unit,quantity,rate,gst_pct")
    .eq("project_id", projectId)
    .limit(5000);
  const rows = (
    (data ?? []) as {
      package: string;
      stage: string;
      item_code: string;
      description: string;
      unit: string;
      quantity: number;
      rate: number;
      gst_pct: number | null;
    }[]
  )
    .filter(
      (b) =>
        b.item_code !== "CONT" &&
        (sameMaterial(query, b.description) || norm(b.item_code) === norm(query)),
    )
    .slice(0, 40);
  return {
    title: `BOQ: ${query}`,
    columns: ["Item", "Package / stage", "Qty", "Unit", "Rate ₹", "Amount ₹ (excl. GST)"],
    rows: rows.map((b) => [
      b.description,
      b.package || b.stage || "—",
      fmt(n(b.quantity)),
      b.unit,
      fmt(n(b.rate)),
      fmt(n(b.quantity) * n(b.rate)),
    ]),
    note: rows.length ? "From the project BOQ." : `No BOQ line matching "${query}".`,
  };
}

export async function pendingPOs(sb: Sb, projectId: string): Promise<AskTable> {
  const { data } = await sb
    .from("purchase_orders")
    .select(
      "po_number,vendor_name,po_date,delivery_date,status,purchase_order_items(description,quantity,unit)",
    )
    .eq("project_id", projectId)
    .in("status", ["pending", "approved"])
    .order("po_date", { ascending: false })
    .limit(30);
  const rows = (data ?? []) as unknown as {
    po_number: string;
    vendor_name: string;
    po_date: string;
    delivery_date: string | null;
    status: string;
    purchase_order_items: { description: string; quantity: number; unit: string }[];
  }[];
  return {
    title: "Purchase orders awaiting approval or delivery",
    columns: ["PO", "Vendor", "Status", "Delivery", "Items"],
    rows: rows.map((p) => [
      p.po_number,
      p.vendor_name,
      p.status,
      p.delivery_date ?? "—",
      (p.purchase_order_items ?? [])
        .slice(0, 3)
        .map((i) => `${i.description} ${fmt(n(i.quantity))} ${i.unit}`)
        .join("; "),
    ]),
    note: rows.length ? "" : "No pending or approved purchase orders for this project.",
  };
}

const REQ_VENDOR = "To be chosen by Purchase";

/** Material requests and orders still open: waiting for Purchase, PM, delivery or bill. */
export async function openRequests(sb: Sb, projectId: string): Promise<AskTable> {
  const { data } = await sb
    .from("purchase_orders")
    .select(
      "po_number,vendor_name,status,delivery_date,raised_by_name,purchase_order_items(description,quantity,unit)",
    )
    .eq("project_id", projectId)
    .eq("vendor_name", REQ_VENDOR)
    .in("status", ["draft", "pending", "rejected"])
    .order("created_at", { ascending: false })
    .limit(30);
  const rows = (data ?? []) as unknown as {
    po_number: string;
    status: string;
    delivery_date: string | null;
    raised_by_name: string;
    purchase_order_items: { description: string; quantity: number; unit: string }[];
  }[];
  return {
    title: "Material requests waiting for Purchase",
    columns: ["Request", "Raised by", "Needed by", "Status", "Items"],
    rows: rows.map((r) => [
      r.po_number,
      r.raised_by_name || "—",
      r.delivery_date ?? "—",
      r.status === "rejected" ? "rejected" : "with Purchase",
      (r.purchase_order_items ?? [])
        .slice(0, 3)
        .map((i) => `${i.description} ${fmt(n(i.quantity))} ${i.unit}`)
        .join("; "),
    ]),
    note: rows.length
      ? "Open in Material Requests to pick the vendor."
      : "No material requests waiting.",
  };
}

/** What the project owes a vendor or contractor (bills − payments), or the top balances. */
export async function partyBalance(sb: Sb, projectId: string, query: string): Promise<AskTable> {
  const [bills, pays] = await Promise.all([
    sb
      .from("bills")
      .select("id,vendor_name,basic_amount,gst_amount,other_charges,retention_amount,deductions")
      .eq("project_id", projectId),
    sb.from("bill_payments").select("bill_id,amount").eq("project_id", projectId),
  ]);
  const paid = new Map<string, number>();
  for (const p of (pays.data ?? []) as { bill_id: string; amount: number }[])
    paid.set(p.bill_id, (paid.get(p.bill_id) ?? 0) + n(p.amount));
  const by = new Map<
    string,
    { name: string; billed: number; retention: number; paid: number; due: number }
  >();
  for (const b of (bills.data ?? []) as {
    id: string;
    vendor_name: string;
    basic_amount: number;
    gst_amount: number;
    other_charges: number;
    retention_amount: number;
    deductions: number;
  }[]) {
    const k = norm(b.vendor_name);
    if (!k) continue;
    const cur = by.get(k) ?? { name: b.vendor_name, billed: 0, retention: 0, paid: 0, due: 0 };
    const gross = n(b.basic_amount) + n(b.gst_amount) + n(b.other_charges);
    cur.billed += gross;
    cur.retention += n(b.retention_amount);
    cur.paid += paid.get(b.id) ?? 0;
    cur.due += gross - n(b.retention_amount) - n(b.deductions) - (paid.get(b.id) ?? 0);
    by.set(k, cur);
  }
  const q = norm(query);
  const list = [...by.values()]
    .filter((r) => (q ? norm(r.name).includes(q) || q.includes(norm(r.name)) : Math.abs(r.due) > 1))
    .sort((a, b) => b.due - a.due)
    .slice(0, 15);
  return {
    title: q ? `Balance with ${query}` : "Who we owe (top balances)",
    columns: ["Party", "Billed ₹", "Paid ₹", "Retention held ₹", "To pay ₹"],
    rows: list.map((r) => [r.name, fmt(r.billed), fmt(r.paid), fmt(r.retention), fmt(r.due)]),
    note: list.length
      ? "From Bills & Payments."
      : q
        ? `No bills for a party matching "${query}".`
        : "Nothing due.",
  };
}

/** Machines on site: hours and diesel today and this month. */
export async function machinesToday(sb: Sb, projectId: string): Promise<AskTable> {
  const today = new Date(Date.now() + 5.5 * 3600e3).toISOString().slice(0, 10);
  const month = today.slice(0, 8) + "01";
  const [m, l] = await Promise.all([
    sb
      .from("machines")
      .select("id,name,kind,status")
      .eq("project_id", projectId)
      .neq("status", "returned"),
    sb
      .from("machine_logs")
      .select("machine_id,log_date,hours,diesel_l")
      .eq("project_id", projectId)
      .gte("log_date", month),
  ]);
  const logs = (l.data ?? []) as {
    machine_id: string;
    log_date: string;
    hours: number;
    diesel_l: number;
  }[];
  const rows = ((m.data ?? []) as { id: string; name: string; kind: string; status: string }[]).map(
    (x) => {
      const mine = logs.filter((g) => g.machine_id === x.id);
      const t = mine.filter((g) => g.log_date === today);
      const h = (a: typeof mine) => a.reduce((s, g) => s + n(g.hours), 0);
      const d = (a: typeof mine) => a.reduce((s, g) => s + n(g.diesel_l), 0);
      return [
        x.name,
        x.kind,
        fmt(h(t)),
        fmt(d(t)),
        fmt(h(mine)),
        fmt(d(mine)),
        t.length ? x.status : "no log today",
      ];
    },
  );
  return {
    title: "Machines on site",
    columns: [
      "Machine",
      "Type",
      "Hours today",
      "Diesel today (l)",
      "Hours this month",
      "Diesel this month (l)",
      "Status",
    ],
    rows,
    note: rows.length ? "From Machines & Diesel." : "No machines registered on this site.",
  };
}
