import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, ChevronLeft, Pencil, Plus, Ruler, Save, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Database, Json } from "@/integrations/supabase/types";
import { useAccess, useSessionUser } from "@/lib/access";
import { StageSelect } from "@/components/saha/StageSelect";
import { StatusBadge } from "@/components/saha/ui";
import { todayIso } from "@/lib/dates";
import { cn } from "@/lib/utils";

/**
 * Subcontract work orders → work measured at site → RA (running account) bills.
 * A work order lists the scope as lines with quantity and rate. The site measures work done
 * against a line; an RA bill takes everything measured and not yet billed, deducts retention
 * and advance recovery, and once an admin / PM approves it, it is posted to Bills & Payments
 * (cost type labour) where it is paid like any other bill.
 */

type WO = Database["public"]["Tables"]["work_orders"]["Row"];
type Meas = Database["public"]["Tables"]["wo_measurements"]["Row"];
type Ra = Database["public"]["Tables"]["ra_bills"]["Row"];
type Item = { id: string; description: string; unit: string; qty: number; rate: number };

const num = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};
const inr = (v: number) => `₹${Math.round(v).toLocaleString("en-IN")}`;
const q2 = (v: number) => v.toLocaleString("en-IN", { maximumFractionDigits: 2 });
const itemsOf = (w: WO): Item[] =>
  Array.isArray(w.items)
    ? (w.items as unknown as Item[]).map((i) => ({ ...i, qty: num(i.qty), rate: num(i.rate) }))
    : [];
const woValue = (w: WO) => itemsOf(w).reduce((s, i) => s + i.qty * i.rate, 0);
const field = "h-10 w-full rounded-lg border border-border bg-background px-2 text-sm";
const btn =
  "inline-flex h-10 items-center justify-center gap-1.5 rounded-lg px-3 text-sm font-semibold";

export function WorkOrders({ projectId }: { projectId: string }) {
  const user = useSessionUser();
  const { access } = useAccess();
  const canWrite = !!access && access.roles.some((r) => r !== "landowner_investor");
  const isManager = !!access && (access.isAdmin || access.roles.includes("pm"));
  const qc = useQueryClient();
  const [open, setOpen] = useState<string | null>(null);
  const [editing, setEditing] = useState<Partial<WO> | null>(null);

  const q = useQuery({
    queryKey: ["work-orders", projectId],
    enabled: Boolean(projectId && user?.id),
    queryFn: async () => {
      const [w, m, r] = await Promise.all([
        supabase
          .from("work_orders")
          .select("*")
          .eq("project_id", projectId)
          .order("created_at", { ascending: false }),
        supabase
          .from("wo_measurements")
          .select("*")
          .eq("project_id", projectId)
          .order("measured_on", { ascending: false }),
        supabase.from("ra_bills").select("*").eq("project_id", projectId).order("ra_no"),
      ]);
      for (const x of [w, m, r]) if (x.error) throw x.error;
      return { wos: w.data ?? [], meas: m.data ?? [], ras: r.data ?? [] };
    },
  });
  const refresh = () => void qc.invalidateQueries({ queryKey: ["work-orders", projectId] });
  const wos = q.data?.wos ?? [];
  const meas = useMemo(() => q.data?.meas ?? [], [q.data]);
  const ras = useMemo(() => q.data?.ras ?? [], [q.data]);

  const summary = (w: WO) => {
    const items = itemsOf(w);
    const m = meas.filter((x) => x.work_order_id === w.id);
    const done = m.reduce(
      (s, x) => s + num(x.qty) * (items.find((i) => i.id === x.item_id)?.rate ?? 0),
      0,
    );
    const r = ras.filter((x) => x.work_order_id === w.id && x.status !== "rejected");
    const billed = r.reduce((s, x) => s + num(x.gross), 0);
    const retention = r.reduce((s, x) => s + num(x.retention), 0);
    const recovered = r.reduce((s, x) => s + num(x.advance_recovery), 0);
    return { value: woValue(w), done, billed, retention, advanceLeft: num(w.advance) - recovered };
  };

  if (editing)
    return (
      <WoForm
        projectId={projectId}
        value={editing}
        nextNo={`WO-${String(wos.length + 1).padStart(3, "0")}`}
        userId={user?.id ?? null}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          refresh();
        }}
      />
    );

  const sel = wos.find((w) => w.id === open);
  if (sel)
    return (
      <WoDetail
        w={sel}
        meas={meas.filter((m) => m.work_order_id === sel.id)}
        ras={ras.filter((r) => r.work_order_id === sel.id)}
        canWrite={canWrite}
        isManager={isManager}
        byName={access?.profile?.full_name || access?.email || ""}
        userId={user?.id ?? null}
        onBack={() => setOpen(null)}
        onEdit={() => setEditing(sel)}
        onChanged={refresh}
      />
    );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Work order → measure work at site → RA bill (retention and advance deducted) → Bills &
          Payments.
        </p>
        {canWrite && (
          <button
            type="button"
            onClick={() => setEditing({})}
            className={cn(btn, "shrink-0 bg-primary text-primary-foreground")}
          >
            <Plus className="size-4" /> New work order
          </button>
        )}
      </div>
      {q.isError && <p className="text-sm text-destructive">{(q.error as Error).message}</p>}
      {!q.isPending && wos.length === 0 && (
        <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          No work orders yet. Create one for each subcontractor (shuttering, masonry, plastering…).
        </p>
      )}
      <div className="grid gap-3 md:grid-cols-2">
        {wos.map((w) => {
          const s = summary(w);
          const pct = s.value > 0 ? Math.min(100, (s.done / s.value) * 100) : 0;
          return (
            <button
              key={w.id}
              type="button"
              onClick={() => setOpen(w.id)}
              className="space-y-2 rounded-xl border border-border bg-card p-3 text-left hover:border-primary/40"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-bold">
                    {w.contractor}{" "}
                    <span className="font-normal text-muted-foreground">· {w.trade}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {w.wo_no} · {itemsOf(w).length} lines · {inr(s.value)}
                  </p>
                </div>
                <StatusBadge tone={w.status === "active" ? "emerald" : "slate"}>
                  {w.status}
                </StatusBadge>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
              </div>
              <p className="text-xs text-muted-foreground">
                Done {inr(s.done)} ({pct.toFixed(0)}%) · billed {inr(s.billed)} · retention held{" "}
                {inr(s.retention)}
                {num(w.advance) > 0 ? ` · advance left ${inr(s.advanceLeft)}` : ""}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function WoForm({
  projectId,
  value,
  nextNo,
  userId,
  onClose,
  onSaved,
}: {
  projectId: string;
  value: Partial<WO>;
  nextNo: string;
  userId: string | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [f, setF] = useState<Partial<WO>>({
    wo_no: nextNo,
    status: "active",
    retention_pct: 5,
    advance_recovery_pct: 10,
    gst_pct: 0,
    advance: 0,
    start_date: todayIso(),
    ...value,
  });
  const [items, setItems] = useState<Item[]>(
    value.id
      ? itemsOf(value as WO)
      : [{ id: crypto.randomUUID(), description: "", unit: "sft", qty: 0, rate: 0 }],
  );
  const boq = useQuery({
    queryKey: ["boq_items", "wo-picker", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("boq_items")
        .select("description,unit,quantity")
        .eq("project_id", projectId)
        .order("sort_order");
      if (error) throw error;
      return data ?? [];
    },
  });
  const set = (p: Partial<WO>) => setF((x) => ({ ...x, ...p }));
  const total = items.reduce((s, i) => s + i.qty * i.rate, 0);
  const save = async () => {
    if (!f.contractor?.trim()) return void toast.error("Enter the contractor's name.");
    const lines = items.filter((i) => i.description.trim());
    if (lines.length === 0) return void toast.error("Add at least one line of scope.");
    const body = {
      project_id: projectId,
      wo_no: f.wo_no ?? nextNo,
      contractor: f.contractor.trim(),
      contractor_phone: f.contractor_phone ?? "",
      contractor_gstin: f.contractor_gstin ?? "",
      trade: f.trade ?? "",
      scope: f.scope ?? "",
      items: lines as unknown as Json,
      gst_pct: num(f.gst_pct),
      retention_pct: num(f.retention_pct),
      advance: num(f.advance),
      advance_recovery_pct: num(f.advance_recovery_pct),
      start_date: f.start_date || null,
      end_date: f.end_date || null,
      status: f.status ?? "active",
      notes: f.notes ?? "",
      updated_at: new Date().toISOString(),
    };
    const { error } = f.id
      ? await supabase.from("work_orders").update(body).eq("id", f.id)
      : await supabase.from("work_orders").insert({ ...body, created_by: userId });
    if (error) return void toast.error(error.message);
    toast.success("Work order saved");
    onSaved();
  };
  return (
    <section className="space-y-3 rounded-xl border-2 border-primary/40 bg-card p-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold">{f.id ? `Edit ${f.wo_no}` : "New work order"}</h2>
        <button type="button" aria-label="Close" onClick={onClose}>
          <X className="size-5" />
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        <input
          className={cn(field, "col-span-2")}
          placeholder="Contractor name"
          value={f.contractor ?? ""}
          onChange={(e) => set({ contractor: e.target.value })}
        />
        <input
          className={field}
          placeholder="Trade (e.g. Shuttering)"
          value={f.trade ?? ""}
          onChange={(e) => set({ trade: e.target.value })}
        />
        <input
          className={field}
          placeholder="Phone"
          inputMode="tel"
          value={f.contractor_phone ?? ""}
          onChange={(e) => set({ contractor_phone: e.target.value })}
        />
        <input
          className={cn(field, "col-span-2")}
          placeholder="Scope in one line"
          value={f.scope ?? ""}
          onChange={(e) => set({ scope: e.target.value })}
        />
        <input
          className={field}
          placeholder="GSTIN (if any)"
          value={f.contractor_gstin ?? ""}
          onChange={(e) => set({ contractor_gstin: e.target.value })}
        />
        <select
          className={field}
          value={f.status ?? "active"}
          onChange={(e) => set({ status: e.target.value })}
        >
          <option value="active">Active</option>
          <option value="draft">Draft</option>
          <option value="closed">Closed</option>
        </select>
        <label className="text-xs">
          Retention %
          <input
            type="number"
            inputMode="decimal"
            className={field}
            value={f.retention_pct ?? 0}
            onChange={(e) => set({ retention_pct: num(e.target.value) })}
          />
        </label>
        <label className="text-xs">
          GST % on bills
          <input
            type="number"
            inputMode="decimal"
            className={field}
            value={f.gst_pct ?? 0}
            onChange={(e) => set({ gst_pct: num(e.target.value) })}
          />
        </label>
        <label className="text-xs">
          Advance paid ₹
          <input
            type="number"
            inputMode="decimal"
            className={field}
            value={f.advance ?? 0}
            onChange={(e) => set({ advance: num(e.target.value) })}
          />
        </label>
        <label className="text-xs">
          Recover advance % per bill
          <input
            type="number"
            inputMode="decimal"
            className={field}
            value={f.advance_recovery_pct ?? 0}
            onChange={(e) => set({ advance_recovery_pct: num(e.target.value) })}
          />
        </label>
      </div>

      <datalist id="wo-boq">
        {(boq.data ?? []).map((b, i) => (
          <option key={i} value={b.description} />
        ))}
      </datalist>
      <p className="text-sm font-semibold">
        Scope lines (rate is per unit, labour only unless stated)
      </p>
      {items.map((it) => (
        <div key={it.id} className="grid grid-cols-6 gap-2 rounded-lg border border-border p-2">
          <input
            list="wo-boq"
            className={cn(field, "col-span-6 md:col-span-3")}
            placeholder="Work item (pick from BOQ or type)"
            value={it.description}
            onChange={(e) => {
              const b = (boq.data ?? []).find((x) => x.description === e.target.value);
              setItems((p) =>
                p.map((x) =>
                  x.id === it.id
                    ? {
                        ...x,
                        description: e.target.value,
                        unit: b?.unit ?? x.unit,
                        qty: b && !x.qty ? num(b.quantity) : x.qty,
                      }
                    : x,
                ),
              );
            }}
          />
          <input
            className={field}
            placeholder="Unit"
            value={it.unit}
            onChange={(e) =>
              setItems((p) => p.map((x) => (x.id === it.id ? { ...x, unit: e.target.value } : x)))
            }
          />
          <input
            type="number"
            inputMode="decimal"
            className={field}
            placeholder="Qty"
            value={it.qty || ""}
            onChange={(e) =>
              setItems((p) =>
                p.map((x) => (x.id === it.id ? { ...x, qty: num(e.target.value) } : x)),
              )
            }
          />
          <div className="flex gap-1">
            <input
              type="number"
              inputMode="decimal"
              className={field}
              placeholder="Rate"
              value={it.rate || ""}
              onChange={(e) =>
                setItems((p) =>
                  p.map((x) => (x.id === it.id ? { ...x, rate: num(e.target.value) } : x)),
                )
              }
            />
            <button
              type="button"
              aria-label="Remove line"
              onClick={() => setItems((p) => (p.length > 1 ? p.filter((x) => x.id !== it.id) : p))}
            >
              <Trash2 className="size-4 text-muted-foreground" />
            </button>
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={() =>
          setItems((p) => [
            ...p,
            { id: crypto.randomUUID(), description: "", unit: "sft", qty: 0, rate: 0 },
          ])
        }
        className={cn(btn, "w-full border border-dashed border-border")}
      >
        <Plus className="size-4" /> Add a line
      </button>
      <div className="flex items-center justify-between">
        <p className="text-sm">
          Work order value <b>{inr(total)}</b>
        </p>
        <button
          type="button"
          onClick={save}
          className={cn(btn, "bg-primary px-6 text-primary-foreground")}
        >
          <Save className="size-4" /> Save
        </button>
      </div>
    </section>
  );
}

function WoDetail({
  w,
  meas,
  ras,
  canWrite,
  isManager,
  byName,
  userId,
  onBack,
  onEdit,
  onChanged,
}: {
  w: WO;
  meas: Meas[];
  ras: Ra[];
  canWrite: boolean;
  isManager: boolean;
  byName: string;
  userId: string | null;
  onBack: () => void;
  onEdit: () => void;
  onChanged: () => void;
}) {
  const items = itemsOf(w);
  const [m, setM] = useState({
    item_id: items[0]?.id ?? "",
    qty: "",
    location: "",
    stage_code: "",
    remarks: "",
    measured_on: todayIso(),
  });
  const [editId, setEditId] = useState<string | null>(null);
  const [other, setOther] = useState("");
  const [busy, setBusy] = useState(false);
  const rateOf = (id: string) => items.find((i) => i.id === id)?.rate ?? 0;
  const unbilled = meas.filter((x) => !x.ra_bill_id);
  const gross = unbilled.reduce((s, x) => s + num(x.qty) * rateOf(x.item_id), 0);
  const live = ras.filter((r) => r.status !== "rejected");
  const advLeft = num(w.advance) - live.reduce((s, r) => s + num(r.advance_recovery), 0);
  const gst = (gross * num(w.gst_pct)) / 100;
  const retention = (gross * num(w.retention_pct)) / 100;
  const recovery = Math.max(0, Math.min(advLeft, (gross * num(w.advance_recovery_pct)) / 100));
  const net = gross + gst - retention - recovery - num(other);

  const saveMeasure = async () => {
    if (!m.item_id || !(num(m.qty) > 0))
      return void toast.error("Pick the work line and enter the quantity.");
    const body = {
      work_order_id: w.id,
      project_id: w.project_id,
      item_id: m.item_id,
      qty: num(m.qty),
      location: m.location.trim(),
      stage_code: m.stage_code,
      remarks: m.remarks.trim(),
      measured_on: m.measured_on,
      measured_by_name: byName,
    };
    const { error } = editId
      ? await supabase.from("wo_measurements").update(body).eq("id", editId)
      : await supabase.from("wo_measurements").insert({ ...body, created_by: userId });
    if (error) return void toast.error(error.message);
    toast.success(editId ? "Measurement updated" : "Measurement saved");
    setEditId(null);
    setM({ ...m, qty: "", location: "", remarks: "" });
    onChanged();
  };
  const delMeasure = async (id: string) => {
    if (!window.confirm("Delete this measurement?")) return;
    const { error } = await supabase.from("wo_measurements").delete().eq("id", id);
    if (error) return void toast.error(error.message);
    onChanged();
  };

  const makeRa = async () => {
    if (unbilled.length === 0) return;
    setBusy(true);
    try {
      const raNo = (ras.reduce((s, r) => Math.max(s, num(r.ra_no)), 0) || 0) + 1;
      const { data, error } = await supabase
        .from("ra_bills")
        .insert({
          work_order_id: w.id,
          project_id: w.project_id,
          ra_no: raNo,
          gross,
          gst,
          retention,
          advance_recovery: recovery,
          other_deductions: num(other),
          net,
          status: "submitted",
          created_by: userId,
        })
        .select("id")
        .single();
      if (error) throw error;
      const { error: e2 } = await supabase
        .from("wo_measurements")
        .update({ ra_bill_id: data.id })
        .in(
          "id",
          unbilled.map((x) => x.id),
        );
      if (e2) throw e2;
      toast.success(`RA bill ${raNo} sent for approval`);
      setOther("");
      onChanged();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const decide = async (r: Ra, ok: boolean) => {
    setBusy(true);
    try {
      if (ok) {
        const { data: bill, error } = await supabase
          .from("bills")
          .insert({
            project_id: w.project_id,
            bill_number: `${w.wo_no}/RA-${r.ra_no}`,
            bill_date: r.bill_date,
            vendor_name: w.contractor,
            vendor_gstin: w.contractor_gstin,
            category: "Subcontract RA bill",
            cost_type: "labour",
            description: `${w.trade} · ${w.scope}`.slice(0, 200),
            basic_amount: num(r.gross),
            gst_amount: num(r.gst),
            retention_amount: num(r.retention),
            deductions: num(r.advance_recovery) + num(r.other_deductions),
            status: "approved",
            notes: `From work order ${w.wo_no}, RA bill ${r.ra_no}`,
          })
          .select("id")
          .single();
        if (error) throw error;
        const { error: e2 } = await supabase
          .from("ra_bills")
          .update({ status: "approved", bill_id: bill.id, approved_by_name: byName })
          .eq("id", r.id);
        if (e2) throw e2;
        toast.success("Approved and sent to Bills & Payments");
      } else {
        const { error } = await supabase
          .from("ra_bills")
          .update({ status: "rejected" })
          .eq("id", r.id);
        if (error) throw error;
        await supabase.from("wo_measurements").update({ ra_bill_id: null }).eq("ra_bill_id", r.id);
        toast.success("Rejected; its measurements can be billed again");
      }
      onChanged();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <button type="button" onClick={onBack} className={cn(btn, "border border-border bg-card")}>
          <ChevronLeft className="size-4" /> All work orders
        </button>
        {canWrite && (
          <button
            type="button"
            onClick={onEdit}
            className={cn(btn, "border border-border bg-card")}
          >
            <Pencil className="size-4" /> Edit
          </button>
        )}
      </div>
      <header className="rounded-xl border border-border bg-card p-3">
        <p className="text-lg font-bold">
          {w.contractor}{" "}
          <span className="text-sm font-normal text-muted-foreground">
            · {w.trade} · {w.wo_no}
          </span>
        </p>
        <p className="text-xs text-muted-foreground">
          {w.scope} · retention {num(w.retention_pct)}% · GST {num(w.gst_pct)}%
          {num(w.advance) > 0 ? ` · advance ${inr(num(w.advance))}, left ${inr(advLeft)}` : ""}
          {w.contractor_phone ? ` · ${w.contractor_phone}` : ""}
        </p>
      </header>

      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full min-w-[36rem] text-sm">
          <thead className="text-xs text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-left">Work line</th>
              <th className="px-3 py-2 text-right">Order qty</th>
              <th className="px-3 py-2 text-right">Done</th>
              <th className="px-3 py-2 text-right">Billed</th>
              <th className="px-3 py-2 text-right">Left</th>
              <th className="px-3 py-2 text-right">Rate</th>
            </tr>
          </thead>
          <tbody>
            {items.map((i) => {
              const done = meas
                .filter((x) => x.item_id === i.id)
                .reduce((s, x) => s + num(x.qty), 0);
              const billed = meas
                .filter((x) => x.item_id === i.id && x.ra_bill_id)
                .reduce((s, x) => s + num(x.qty), 0);
              return (
                <tr key={i.id} className="border-t border-border">
                  <td className="px-3 py-2">{i.description}</td>
                  <td className="px-3 py-2 text-right">
                    {q2(i.qty)} {i.unit}
                  </td>
                  <td className="px-3 py-2 text-right font-semibold">{q2(done)}</td>
                  <td className="px-3 py-2 text-right">{q2(billed)}</td>
                  <td
                    className={cn(
                      "px-3 py-2 text-right",
                      done > i.qty && "font-semibold text-destructive",
                    )}
                  >
                    {q2(i.qty - done)}
                  </td>
                  <td className="px-3 py-2 text-right">{inr(i.rate)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {canWrite && (
        <section className="space-y-2 rounded-xl border-2 border-primary/40 bg-card p-3">
          <h3 className="flex items-center gap-1.5 text-sm font-bold">
            <Ruler className="size-4" /> {editId ? "Edit measurement" : "Measure work done"}
          </h3>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            <select
              className={cn(field, "col-span-2")}
              value={m.item_id}
              onChange={(e) => setM({ ...m, item_id: e.target.value })}
            >
              {items.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.description} ({i.unit})
                </option>
              ))}
            </select>
            <input
              type="number"
              inputMode="decimal"
              className={field}
              placeholder="Qty done"
              value={m.qty}
              onChange={(e) => setM({ ...m, qty: e.target.value })}
            />
            <input
              type="date"
              className={field}
              value={m.measured_on}
              onChange={(e) => setM({ ...m, measured_on: e.target.value })}
            />
            <input
              className={field}
              placeholder="Where (floor, flat, grid)"
              value={m.location}
              onChange={(e) => setM({ ...m, location: e.target.value })}
            />
            <StageSelect
              projectId={w.project_id ?? ""}
              value={m.stage_code}
              onChange={(v) => setM({ ...m, stage_code: v })}
              className={field}
            />
            <input
              className={cn(field, "col-span-2")}
              placeholder="Remarks"
              value={m.remarks}
              onChange={(e) => setM({ ...m, remarks: e.target.value })}
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={saveMeasure}
              className={cn(btn, "flex-1 bg-primary text-primary-foreground")}
            >
              <Save className="size-4" /> {editId ? "Update" : "Save measurement"}
            </button>
            {editId && (
              <button
                type="button"
                onClick={() => setEditId(null)}
                className={cn(btn, "border border-border")}
              >
                Cancel
              </button>
            )}
          </div>
        </section>
      )}

      <section className="rounded-xl border border-border bg-card">
        <h3 className="border-b border-border px-3 py-2 text-sm font-bold">
          Measurements ({meas.length})
        </h3>
        <ul className="divide-y divide-border">
          {meas.map((x) => {
            const it = items.find((i) => i.id === x.item_id);
            return (
              <li key={x.id} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
                <span className="min-w-0">
                  <span className="block truncate">
                    {x.measured_on} · {it?.description ?? "?"} ·{" "}
                    <b>
                      {q2(num(x.qty))} {it?.unit}
                    </b>
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {[x.location, x.remarks, x.measured_by_name].filter(Boolean).join(" · ")}
                  </span>
                </span>
                {x.ra_bill_id ? (
                  <StatusBadge tone="sky">In RA bill</StatusBadge>
                ) : (
                  canWrite && (
                    <span className="flex shrink-0 gap-2">
                      <button
                        type="button"
                        aria-label="Edit measurement"
                        onClick={() => {
                          setEditId(x.id);
                          setM({
                            item_id: x.item_id,
                            qty: String(x.qty),
                            location: x.location,
                            stage_code: x.stage_code,
                            remarks: x.remarks,
                            measured_on: x.measured_on,
                          });
                        }}
                      >
                        <Pencil className="size-4 text-muted-foreground" />
                      </button>
                      {isManager && (
                        <button
                          type="button"
                          aria-label="Delete measurement"
                          onClick={() => delMeasure(x.id)}
                        >
                          <Trash2 className="size-4 text-muted-foreground" />
                        </button>
                      )}
                    </span>
                  )
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <section className="space-y-2 rounded-xl border border-border bg-card p-3">
        <h3 className="text-sm font-bold">RA bills</h3>
        {ras.map((r) => (
          <div
            key={r.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-2 text-sm"
          >
            <span>
              <b>RA {r.ra_no}</b> · {r.bill_date} · gross {inr(num(r.gross))} − retention{" "}
              {inr(num(r.retention))} − advance {inr(num(r.advance_recovery))}
              {num(r.other_deductions) ? ` − other ${inr(num(r.other_deductions))}` : ""} ={" "}
              <b>{inr(num(r.net))}</b>
            </span>
            {r.status === "submitted" && isManager ? (
              <span className="flex gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => decide(r, true)}
                  className={cn(btn, "h-9 bg-primary text-primary-foreground")}
                >
                  <Check className="size-4" /> Approve
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => decide(r, false)}
                  className={cn(btn, "h-9 border border-border")}
                >
                  Reject
                </button>
              </span>
            ) : (
              <StatusBadge
                tone={
                  r.status === "approved" ? "emerald" : r.status === "rejected" ? "red" : "amber"
                }
              >
                {r.status === "approved"
                  ? `Approved · in Bills`
                  : r.status === "submitted"
                    ? "Waiting PM approval"
                    : r.status}
              </StatusBadge>
            )}
          </div>
        ))}
        {canWrite && unbilled.length > 0 && (
          <div className="space-y-2 rounded-lg bg-secondary p-2 text-sm">
            <p>
              Next RA bill from {unbilled.length} measurement{unbilled.length === 1 ? "" : "s"}:
              gross <b>{inr(gross)}</b>
              {gst ? ` + GST ${inr(gst)}` : ""} − retention {inr(retention)} − advance{" "}
              {inr(recovery)}
            </p>
            <div className="flex gap-2">
              <input
                type="number"
                inputMode="decimal"
                className={field}
                placeholder="Other deductions ₹ (material, penalty)"
                value={other}
                onChange={(e) => setOther(e.target.value)}
              />
              <button
                type="button"
                disabled={busy}
                onClick={makeRa}
                className={cn(btn, "shrink-0 bg-primary text-primary-foreground")}
              >
                Make RA bill · net {inr(net)}
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
