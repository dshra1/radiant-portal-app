/**
 * Buy flow: one line from a site request to a paid bill.
 *
 *   Request (site) → Vendor & rate (Purchase) → Approved (PM) → Received (stores, GRN)
 *   → Billed (accounts) — with the bill checked against PO and receipt (three-way match).
 *
 * A material request is a purchase order whose vendor is still MR_VENDOR, raised with
 * quantities only; Purchase opens it in Create PO to pick the vendor and rate, so there is one
 * record from request to bill. Request lines carry material_key "rate:<key>" so the quantity can
 * be checked against the BOQ Budget (rate analysis) for that material.
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { costLine, DEFAULT_DIESEL, type LineState } from "@/lib/rate-analysis";

export const MR_VENDOR = "To be chosen by Purchase";
export const RATE_KEY = "rate:";

const num = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

export type BudgetMaterial = { key: string; name: string; unit: string; budgetQty: number };

/** Material quantities of the project's BOQ Budget (all lines, with the saved changes). */
export function useBudgetMaterials(projectId: string) {
  return useQuery({
    queryKey: ["budget-materials", projectId],
    enabled: Boolean(projectId),
    queryFn: async (): Promise<BudgetMaterial[]> => {
      const [{ data: rows, error }, dl] = await Promise.all([
        supabase
          .from("boq_items")
          .select("id,description,unit,quantity")
          .eq("project_id", projectId),
        supabase.storage.from("site-media").download(`_budget/${projectId}.json`),
      ]);
      if (error) throw error;
      let lines: Record<string, LineState> = {};
      if (dl.data) {
        try {
          lines =
            (JSON.parse(await dl.data.text()) as { lines?: Record<string, LineState> }).lines ?? {};
        } catch {
          lines = {};
        }
      }
      const ctx = { library: {}, po: {}, register: {}, diesel: DEFAULT_DIESEL };
      const m = new Map<string, BudgetMaterial>();
      for (const r of rows ?? []) {
        const b = costLine(
          { description: r.description ?? "", unit: r.unit ?? "" },
          lines[r.id],
          ctx,
        );
        for (const c of b.components) {
          if (c.kind !== "material") continue;
          const cur = m.get(c.key) ?? { key: c.key, name: c.name, unit: c.unit, budgetQty: 0 };
          cur.budgetQty += c.qty * num(r.quantity);
          m.set(c.key, cur);
        }
      }
      return [...m.values()].sort((a, b) => a.name.localeCompare(b.name));
    },
  });
}

export type OrderLine = {
  id: string;
  description: string;
  unit: string;
  quantity: number;
  rate: number;
  discount_pct: number;
  material_key: string;
  item_code: string;
};
export type Order = {
  id: string;
  po_number: string;
  vendor_name: string;
  status: string;
  po_date: string;
  delivery_date: string | null;
  stage_code: string;
  raised_by_name: string;
  notes: string;
  rejection_reason: string;
  lines: OrderLine[];
  received: Record<string, number>; // per line id
  receivedAny: number; // receipts that could not be matched to a line
  bills: { id: string; bill_number: string; basic_amount: number; status: string }[];
};

export type Step = "request" | "vendor" | "approval" | "receive" | "bill" | "done";
export const STEPS: { key: Step; label: string }[] = [
  { key: "request", label: "Requested" },
  { key: "vendor", label: "Vendor & rate" },
  { key: "approval", label: "PM approval" },
  { key: "receive", label: "Received" },
  { key: "bill", label: "Billed" },
];

export function orderValue(o: Order) {
  return o.lines.reduce((s, l) => s + l.quantity * l.rate * (1 - l.discount_pct / 100), 0);
}
export function receivedValue(o: Order) {
  return o.lines.reduce(
    (s, l) =>
      s + Math.min(o.received[l.id] ?? 0, l.quantity * 1.1) * l.rate * (1 - l.discount_pct / 100),
    0,
  );
}
export function receivedPct(o: Order) {
  const ordered = o.lines.reduce((s, l) => s + l.quantity, 0);
  const got = o.lines.reduce((s, l) => s + Math.min(o.received[l.id] ?? 0, l.quantity), 0);
  return ordered > 0 ? got / ordered : 0;
}
export function billedValue(o: Order) {
  return o.bills.filter((b) => b.status !== "rejected").reduce((s, b) => s + b.basic_amount, 0);
}

/** Where the order stands: the first step not yet done. */
export function stepOf(o: Order): Step {
  if (o.status === "rejected") return o.vendor_name === MR_VENDOR ? "vendor" : "approval";
  if (o.vendor_name === MR_VENDOR || o.status === "draft") return "vendor";
  if (o.status !== "approved") return "approval";
  if (receivedPct(o) < 0.98) return "receive";
  if (billedValue(o) <= 0) return "bill";
  return "done";
}

/** Three-way match: bill (basic) vs value of what was received at PO rates. */
export function matchOf(o: Order): { tone: "good" | "warn" | "bad"; text: string } | null {
  const billed = billedValue(o);
  if (billed <= 0) return null;
  const rec = receivedValue(o);
  if (rec <= 0) return { tone: "bad", text: "Billed, but nothing received against this PO" };
  const diff = billed - rec;
  if (Math.abs(diff) <= Math.max(1, rec * 0.01))
    return { tone: "good", text: "Bill = PO rate × received ✓" };
  return diff > 0
    ? {
        tone: "bad",
        text: `Bill is ₹${Math.round(diff).toLocaleString("en-IN")} more than received at PO rates`,
      }
    : {
        tone: "warn",
        text: `Bill is ₹${Math.round(-diff).toLocaleString("en-IN")} less than received (part bill?)`,
      };
}

const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

/** All orders of a project with their lines, receipts (GRN) and bills. */
export function useOrders(projectId: string) {
  return useQuery({
    queryKey: ["buy-flow", projectId],
    enabled: Boolean(projectId),
    refetchInterval: 30000,
    queryFn: async (): Promise<Order[]> => {
      const { data: pos, error } = await supabase
        .from("purchase_orders")
        .select(
          "id,po_number,vendor_name,status,po_date,delivery_date,stage_code,raised_by_name,notes,rejection_reason,created_at",
        )
        .eq("project_id", projectId)
        .order("created_at", { ascending: false })
        .limit(300);
      if (error) throw error;
      const list = pos ?? [];
      if (list.length === 0) return [];
      const ids = list.map((p) => p.id);
      const numbers = list.map((p) => p.po_number);
      const [items, moves, bills] = await Promise.all([
        supabase
          .from("purchase_order_items")
          .select("id,po_id,description,unit,quantity,rate,discount_pct,material_key,item_code")
          .in("po_id", ids),
        supabase
          .from("stock_movements")
          .select("po_number,description,item_code,quantity,movement_type")
          .eq("project_id", projectId)
          .in("po_number", numbers),
        supabase.from("bills").select("id,bill_number,basic_amount,status,po_id").in("po_id", ids),
      ]);
      if (items.error) throw items.error;
      if (moves.error) throw moves.error;
      if (bills.error) throw bills.error;
      return list.map((p) => {
        const lines: OrderLine[] = (items.data ?? [])
          .filter((i) => i.po_id === p.id)
          .map((i) => ({
            id: i.id,
            description: i.description ?? "",
            unit: i.unit ?? "",
            quantity: num(i.quantity),
            rate: num(i.rate),
            discount_pct: num(i.discount_pct),
            material_key: i.material_key ?? "",
            item_code: i.item_code ?? "",
          }));
        const received: Record<string, number> = {};
        let receivedAny = 0;
        for (const m of (moves.data ?? []).filter(
          (x) => x.po_number === p.po_number && x.movement_type === "receipt",
        )) {
          const q = num(m.quantity);
          const hit =
            lines.find((l) => l.item_code && l.item_code === m.item_code) ??
            lines.find((l) => norm(l.description) === norm(m.description ?? "")) ??
            (lines.length === 1 ? lines[0] : undefined);
          if (hit) received[hit.id] = (received[hit.id] ?? 0) + q;
          else receivedAny += q;
        }
        return {
          id: p.id,
          po_number: p.po_number,
          vendor_name: p.vendor_name ?? "",
          status: p.status ?? "draft",
          po_date: p.po_date,
          delivery_date: p.delivery_date,
          stage_code: p.stage_code ?? "",
          raised_by_name: p.raised_by_name ?? "",
          notes: p.notes ?? "",
          rejection_reason: p.rejection_reason ?? "",
          lines,
          received,
          receivedAny,
          bills: (bills.data ?? [])
            .filter((b) => b.po_id === p.id)
            .map((b) => ({
              id: b.id,
              bill_number: b.bill_number ?? "",
              basic_amount: num(b.basic_amount),
              status: b.status ?? "",
            })),
        };
      });
    },
  });
}

/** Quantity already requested / ordered per BOQ Budget material (not rejected). */
export function orderedByKey(orders: Order[]) {
  const m = new Map<string, number>();
  for (const o of orders) {
    if (o.status === "rejected") continue;
    for (const l of o.lines) {
      if (!l.material_key.startsWith(RATE_KEY)) continue;
      const k = l.material_key.slice(RATE_KEY.length);
      m.set(k, (m.get(k) ?? 0) + l.quantity);
    }
  }
  return m;
}
