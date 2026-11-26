import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Check, PackageCheck, Plus, Send, Trash2, X } from "lucide-react";
import { Shell } from "@/components/saha/Shell";
import { StatusBadge } from "@/components/saha/ui";
import { StageSelect } from "@/components/saha/StageSelect";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { useAccess } from "@/lib/access";
import { useActiveProject } from "@/hooks/useActiveProject";
import {
  billedValue,
  matchOf,
  MR_VENDOR,
  orderedByKey,
  orderValue,
  RATE_KEY,
  receivedPct,
  stepOf,
  STEPS,
  useBudgetMaterials,
  useOrders,
  type Order,
  type Step,
} from "@/lib/material-requests";
import { cn } from "@/lib/utils";

type Search = { new?: string };

export const Route = createFileRoute("/material-requests")({
  validateSearch: (s: Record<string, unknown>): Search =>
    typeof s["new"] === "string" && s["new"] ? { new: s["new"] } : {},
  head: () => ({
    meta: [
      { title: "Material Requests — Request to Bill | SiteYantra" },
      {
        name: "description",
        content:
          "Site requests material against the BOQ budget; Purchase picks the vendor, the PM approves, stores receive and accounts bill, with the bill matched to PO and receipt.",
      },
    ],
  }),
  component: Page,
});

const inr = (v: number) => `₹${Math.round(v).toLocaleString("en-IN")}`;
const qty = (v: number) => v.toLocaleString("en-IN", { maximumFractionDigits: 2 });
const today = () => new Date().toISOString().slice(0, 10);

type Filter = "all" | Step;
const FILTER_LABEL: Record<Filter, string> = {
  all: "All",
  request: "Requested",
  vendor: "With Purchase",
  approval: "PM approval",
  receive: "To receive",
  bill: "To bill",
  done: "Done",
};

function Page() {
  const search = Route.useSearch();
  const project = useActiveProject();
  const pid = project.id;
  const { access } = useAccess();
  const roles = access?.roles ?? [];
  const admin = access?.isAdmin ?? false;
  const has = (...r: string[]) => admin || r.some((x) => roles.includes(x as never));
  const canRequest = has("pm", "site_engineer", "site_supervisor", "purchase_stores");
  const orders = useOrders(pid);
  const [form, setForm] = useState(search.new === "1");
  const [filter, setFilter] = useState<Filter>("all");

  const list = useMemo(() => orders.data ?? [], [orders.data]);
  const counts = useMemo(() => {
    const c: Record<string, number> = { all: list.length };
    for (const o of list) c[stepOf(o)] = (c[stepOf(o)] ?? 0) + 1;
    return c;
  }, [list]);
  const shown = filter === "all" ? list : list.filter((o) => stepOf(o) === filter);

  return (
    <Shell
      title="Material Requests"
      subtitle={`${project.name} · request → vendor → approval → received → billed, in one list`}
      actions={
        canRequest && !form ? (
          <button
            type="button"
            onClick={() => setForm(true)}
            className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground"
          >
            <Plus className="size-4" /> Request material
          </button>
        ) : null
      }
    >
      <div className="space-y-4">
        {form && pid && (
          <RequestForm
            projectId={pid}
            orders={list}
            byName={access?.profile?.full_name || access?.email || ""}
            onDone={() => setForm(false)}
          />
        )}

        <div className="flex gap-2 overflow-x-auto pb-1">
          {(["all", "vendor", "approval", "receive", "bill", "done"] as Filter[]).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={cn(
                "h-9 shrink-0 rounded-full px-3 text-xs font-semibold",
                filter === f
                  ? "bg-primary text-primary-foreground"
                  : "border border-border bg-card",
              )}
            >
              {FILTER_LABEL[f]} {counts[f] ? `(${counts[f]})` : ""}
            </button>
          ))}
        </div>

        {orders.isPending && <p className="text-sm text-muted-foreground">Loading…</p>}
        {!orders.isPending && shown.length === 0 && (
          <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            Nothing here. {canRequest ? "Tap Request material to ask Purchase for material." : ""}
          </p>
        )}

        <div className="grid gap-3 lg:grid-cols-2">
          {shown.map((o) => (
            <OrderCard key={o.id} o={o} has={has} />
          ))}
        </div>
      </div>
    </Shell>
  );
}

function Stepper({ step }: { step: Step }) {
  const at = step === "done" ? STEPS.length : STEPS.findIndex((s) => s.key === step);
  return (
    <ol className="flex items-center gap-1" aria-label="Progress">
      {STEPS.map((s, i) => (
        <li key={s.key} className="flex flex-1 flex-col items-center gap-1">
          <span
            className={cn(
              "grid size-6 place-items-center rounded-full text-[10px] font-bold",
              i < at
                ? "bg-primary text-primary-foreground"
                : i === at
                  ? "bg-warning-soft text-[oklch(0.55_0.13_70)] ring-2 ring-warning"
                  : "bg-muted text-muted-foreground",
            )}
          >
            {i < at ? <Check className="size-3.5" /> : i + 1}
          </span>
          <span className="text-center text-[10px] leading-tight text-muted-foreground">
            {s.label}
          </span>
        </li>
      ))}
    </ol>
  );
}

function OrderCard({ o, has }: { o: Order; has: (...r: string[]) => boolean }) {
  const step = stepOf(o);
  const isRequest = o.vendor_name === MR_VENDOR;
  const match = matchOf(o);
  const pct = receivedPct(o);
  const value = orderValue(o);
  return (
    <article className="space-y-3 rounded-xl border border-border bg-card p-3">
      <header className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-bold">
            {o.po_number}{" "}
            <span className="font-normal text-muted-foreground">
              · {isRequest ? "Request" : o.vendor_name}
            </span>
          </p>
          <p className="text-xs text-muted-foreground">
            {o.raised_by_name || "—"} · {o.po_date}
            {o.stage_code ? ` · stage ${o.stage_code}` : ""}
            {o.delivery_date ? ` · needed by ${o.delivery_date}` : ""}
          </p>
        </div>
        {o.status === "rejected" ? (
          <StatusBadge tone="red">Rejected</StatusBadge>
        ) : step === "done" ? (
          <StatusBadge tone="emerald">Closed</StatusBadge>
        ) : null}
      </header>
      <Stepper step={step} />
      <ul className="space-y-0.5 text-sm">
        {o.lines.slice(0, 4).map((l) => (
          <li key={l.id} className="flex justify-between gap-2">
            <span className="truncate">{l.description}</span>
            <span className="shrink-0 tnum text-muted-foreground">
              {qty(l.quantity)} {l.unit}
              {o.received[l.id] ? ` · got ${qty(o.received[l.id] ?? 0)}` : ""}
            </span>
          </li>
        ))}
        {o.lines.length > 4 && (
          <li className="text-xs text-muted-foreground">+ {o.lines.length - 4} more lines</li>
        )}
      </ul>
      <div className="flex flex-wrap items-center gap-2 text-xs">
        {value > 0 && <span>Order {inr(value)}</span>}
        {pct > 0 && <span>· {Math.round(pct * 100)}% received</span>}
        {billedValue(o) > 0 && <span>· billed {inr(billedValue(o))}</span>}
        {match && (
          <StatusBadge
            tone={match.tone === "good" ? "emerald" : match.tone === "warn" ? "amber" : "red"}
          >
            {match.text}
          </StatusBadge>
        )}
        {o.status === "rejected" && o.rejection_reason && (
          <span className="text-destructive">Reason: {o.rejection_reason}</span>
        )}
      </div>
      <NextAction o={o} step={step} has={has} />
    </article>
  );
}

const btn =
  "inline-flex h-10 items-center justify-center gap-1.5 rounded-lg px-3 text-sm font-semibold";

function NextAction({ o, step, has }: { o: Order; step: Step; has: (...r: string[]) => boolean }) {
  if (step === "vendor" && has("pm", "purchase_stores"))
    return (
      <Link
        to="/po-create"
        search={{ edit: o.id } as never}
        className={cn(btn, "w-full bg-primary text-primary-foreground")}
      >
        Choose vendor & rate
      </Link>
    );
  if (step === "approval" && has("pm"))
    return (
      <Link
        to="/purchase-orders"
        search={{ po: o.po_number } as never}
        className={cn(btn, "w-full bg-primary text-primary-foreground")}
      >
        Review & approve
      </Link>
    );
  if (step === "receive" && has("pm", "site_engineer", "site_supervisor", "purchase_stores"))
    return (
      <Link to="/inventory-control" className={cn(btn, "w-full border border-border bg-card")}>
        <PackageCheck className="size-4" /> Receive at site (GRN against {o.po_number})
      </Link>
    );
  if (step === "bill" && has("pm", "accounts"))
    return (
      <Link to="/bills-payments" className={cn(btn, "w-full border border-border bg-card")}>
        Enter the vendor's bill for {o.po_number}
      </Link>
    );
  const waiting: Record<Step, string> = {
    request: "",
    vendor: "Waiting for Purchase to choose the vendor",
    approval: "Waiting for PM approval",
    receive: "Waiting for delivery",
    bill: "Waiting for the bill",
    done: "",
  };
  return waiting[step] ? <p className="text-xs text-muted-foreground">{waiting[step]}</p> : null;
}

type Row = { id: string; key: string; name: string; unit: string; qty: string };

function RequestForm({
  projectId,
  orders,
  byName,
  onDone,
}: {
  projectId: string;
  orders: Order[];
  byName: string;
  onDone: () => void;
}) {
  const qc = useQueryClient();
  const budget = useBudgetMaterials(projectId);
  const ordered = useMemo(() => orderedByKey(orders), [orders]);
  const [stage, setStage] = useState("");
  const [needBy, setNeedBy] = useState(today());
  const [note, setNote] = useState("");
  const [rows, setRows] = useState<Row[]>([
    { id: crypto.randomUUID(), key: "", name: "", unit: "", qty: "" },
  ]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const mats = budget.data ?? [];

  const check = (r: Row) => {
    const m = mats.find((x) => x.key === r.key);
    if (!m) return null;
    const done = ordered.get(r.key) ?? 0;
    const left = m.budgetQty - done;
    return { budget: m.budgetQty, done, left, over: Number(r.qty) > left + 1e-6 };
  };
  const anyOver = rows.some((r) => check(r)?.over);

  const submit = async () => {
    setMsg("");
    const lines = rows.filter((r) => r.name.trim() && Number(r.qty) > 0);
    if (!stage) return setMsg("Pick the stage the material is for.");
    if (lines.length === 0) return setMsg("Add at least one material with a quantity.");
    if (anyOver && note.trim().length < 5)
      return setMsg("Some lines are over the BOQ budget quantity: write the reason in the note.");
    setBusy(true);
    try {
      const { error } = await supabase.rpc("save_purchase_order", {
        p_header: {
          project_id: projectId,
          vendor_name: MR_VENDOR,
          po_date: today(),
          delivery_date: needBy || null,
          stage_code: stage,
          notes: note.trim() || "Material request from site",
          status: "pending",
          raised_by_name: byName,
        } as unknown as Json,
        p_items: lines.map((r, i) => ({
          description: r.name.trim(),
          unit: r.unit.trim(),
          quantity: Number(r.qty),
          rate: 0,
          sort_order: i,
          stage_code: stage,
          material_key: r.key ? `${RATE_KEY}${r.key}` : "",
        })) as unknown as Json,
      });
      if (error) throw error;
      // Alerts Purchase (and every member) on the phone through the existing push trigger.
      await supabase.from("notifications").insert({
        title: `Material request: ${lines.length} item${lines.length > 1 ? "s" : ""} for stage ${stage}`,
        body: lines
          .slice(0, 4)
          .map((r) => `${r.name.trim()} ${r.qty} ${r.unit}`.trim())
          .join(" · "),
        category: "Purchase",
        priority: anyOver ? "High" : "Medium",
        link: "/material-requests",
        project_id: projectId,
      });
      await qc.invalidateQueries({ queryKey: ["buy-flow", projectId] });
      await qc.invalidateQueries({ queryKey: ["today-strip"] });
      onDone();
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="space-y-3 rounded-xl border-2 border-primary/40 bg-card p-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold">Request material</h2>
        <button type="button" aria-label="Close" onClick={onDone}>
          <X className="size-5" />
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <label className="text-xs">
          <span className="text-muted-foreground">For stage</span>
          <StageSelect
            projectId={projectId}
            value={stage}
            onChange={setStage}
            className="mt-1 block h-10 w-full rounded-lg border border-border bg-background px-2 text-sm"
          />
        </label>
        <label className="text-xs">
          <span className="text-muted-foreground">Needed by</span>
          <input
            type="date"
            value={needBy}
            onChange={(e) => setNeedBy(e.target.value)}
            className="mt-1 block h-10 w-full rounded-lg border border-border bg-background px-2 text-sm"
          />
        </label>
      </div>

      <datalist id="budget-materials">
        {mats.map((m) => (
          <option key={m.key} value={m.name} />
        ))}
      </datalist>

      {rows.map((r) => {
        const c = check(r);
        return (
          <div key={r.id} className="space-y-1 rounded-lg border border-border p-2">
            <div className="flex gap-2">
              <input
                list="budget-materials"
                placeholder="Material (pick from BOQ budget or type)"
                value={r.name}
                onChange={(e) => {
                  const m = mats.find((x) => x.name === e.target.value);
                  setRows((p) =>
                    p.map((x) =>
                      x.id === r.id
                        ? { ...x, name: e.target.value, key: m?.key ?? "", unit: m?.unit ?? x.unit }
                        : x,
                    ),
                  );
                }}
                className="h-10 min-w-0 flex-1 rounded-lg border border-border bg-background px-2 text-sm"
              />
              <button
                type="button"
                aria-label="Remove line"
                onClick={() => setRows((p) => (p.length > 1 ? p.filter((x) => x.id !== r.id) : p))}
              >
                <Trash2 className="size-4 text-muted-foreground" />
              </button>
            </div>
            <div className="flex gap-2">
              <input
                type="number"
                inputMode="decimal"
                placeholder="Qty"
                value={r.qty}
                onChange={(e) =>
                  setRows((p) => p.map((x) => (x.id === r.id ? { ...x, qty: e.target.value } : x)))
                }
                className="h-10 w-28 rounded-lg border border-border bg-background px-2 text-sm"
              />
              <input
                placeholder="Unit"
                value={r.unit}
                onChange={(e) =>
                  setRows((p) => p.map((x) => (x.id === r.id ? { ...x, unit: e.target.value } : x)))
                }
                className="h-10 w-24 rounded-lg border border-border bg-background px-2 text-sm"
              />
            </div>
            {c && (
              <p
                className={cn(
                  "text-xs",
                  c.over ? "font-semibold text-destructive" : "text-muted-foreground",
                )}
              >
                BOQ budget {qty(c.budget)} {r.unit} · already asked {qty(c.done)} · left{" "}
                {qty(Math.max(0, c.left))}
                {c.over ? " — over the budget quantity" : ""}
              </p>
            )}
          </div>
        );
      })}
      <button
        type="button"
        onClick={() =>
          setRows((p) => [...p, { id: crypto.randomUUID(), key: "", name: "", unit: "", qty: "" }])
        }
        className={cn(btn, "w-full border border-dashed border-border")}
      >
        <Plus className="size-4" /> Add another material
      </button>
      <textarea
        placeholder={
          anyOver ? "Why more than the budget? (required)" : "Note for Purchase (optional)"
        }
        value={note}
        onChange={(e) => setNote(e.target.value)}
        className="min-h-16 w-full rounded-lg border border-border bg-background p-2 text-sm"
      />
      {mats.length === 0 && !budget.isPending && (
        <p className="text-xs text-muted-foreground">
          No BOQ Budget yet for this project, so quantities can't be checked. Set it up in{" "}
          <Link to="/boq-budget" className="font-semibold text-primary underline">
            BOQ Budget
          </Link>
          .
        </p>
      )}
      {msg && <p className="text-sm text-destructive">{msg}</p>}
      <button
        type="button"
        disabled={busy}
        onClick={submit}
        className={cn(btn, "w-full bg-primary text-primary-foreground disabled:opacity-50")}
      >
        <Send className="size-4" /> {busy ? "Sending…" : "Send to Purchase"}
      </button>
    </section>
  );
}
