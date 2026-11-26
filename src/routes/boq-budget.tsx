import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Boxes,
  ChevronDown,
  ChevronRight,
  Download,
  HardHat,
  Library,
  ListChecks,
  Plus,
  Save,
  Scale,
  Sparkles,
  Truck,
  X,
} from "lucide-react";
import { Shell } from "@/components/saha/Shell";
import { cn } from "@/lib/utils";
import { MetricTile, PageTabs, Section, StatusBadge } from "@/components/saha/ui";
import { supabase } from "@/integrations/supabase/client";
import { useAccess, useSessionUser } from "@/lib/access";
import { useActiveProject, useActiveProjectSetter } from "@/hooks/useActiveProject";
import { AI_OFF_REASON, useAiConfigured } from "@/hooks/useAiStatus";
import {
  costLine,
  DEFAULT_DIESEL,
  DEFAULT_RATES,
  KIND_LABEL,
  lineFlag,
  matchKey,
  poRates,
  registerRates,
  resolveRate,
  slug,
  type Component,
  type Kind,
  type LibraryRate,
  type LineBudget,
  type LineState,
  type RateCtx,
} from "@/lib/rate-analysis";
import { suggestRateAnalysis } from "@/lib/rate-analysis.functions";
import { RATE_KEY } from "@/lib/material-requests";

export const Route = createFileRoute("/boq-budget")({
  head: () => ({
    meta: [
      { title: "BOQ Budget — Rate Analysis per Line | SiteYantra" },
      {
        name: "description",
        content:
          "Every BOQ line split into material, labour and equipment with quantities per unit, your own rates and visible assumptions; know your margin before you start.",
      },
      { property: "og:title", content: "BOQ Budget — Rate Analysis per Line | SiteYantra" },
      { property: "og:type", content: "website" },
    ],
  }),
  component: Page,
});

const BUCKET = "site-media";
const NO_LIB: Record<string, LibraryRate> = {};
const NO_PO: RateCtx["po"] = {};
const NO_REG: RateCtx["register"] = {};
const NO_ROWS: BoqRow[] = [];
const LIB_PATH = "_library/RATES/rates.json";
const budgetPath = (pid: string) => `_budget/${pid}.json`;

type BudgetFile = {
  version: 1;
  savedAt: string;
  savedBy: string;
  diesel?: number;
  lines: Record<string, LineState>;
};

type BoqRow = {
  id: string;
  item_code: string;
  description: string;
  unit: string;
  quantity: number;
  rate: number;
  stage: string;
  package: string;
  package_no: number;
  sort_order: number;
};

async function readJson<T>(path: string): Promise<T | null> {
  const dl = await supabase.storage.from(BUCKET).download(path);
  if (!dl.data) return null;
  try {
    return JSON.parse(await dl.data.text()) as T;
  } catch {
    return null;
  }
}
async function putJson(path: string, body: unknown) {
  const blob = new Blob([JSON.stringify(body)], { type: "application/json" });
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, blob, { upsert: true, contentType: "application/json" });
  if (error) throw error;
}

const num = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};
const inr = (v: number) => `₹${Math.round(v).toLocaleString("en-IN")}`;
const inr2 = (v: number) =>
  `₹${v.toLocaleString("en-IN", { maximumFractionDigits: v < 100 ? 2 : 0 })}`;
const lakh = (v: number) =>
  Math.abs(v) >= 1e7 ? `₹${(v / 1e7).toFixed(2)} Cr` : `₹${(v / 1e5).toFixed(1)} L`;
const qtyFmt = (v: number) =>
  v.toLocaleString("en-IN", { maximumFractionDigits: v < 1 ? 4 : v < 100 ? 2 : 0 });
const groupOf = (l: BoqRow) =>
  l.package ? `${String(l.package_no ?? 0).padStart(2, "0")} ${l.package}` : l.stage || "Other";

const SRC_TONE: Record<string, "emerald" | "sky" | "amber" | "slate"> = {
  library: "emerald",
  po: "emerald",
  register: "emerald",
  line: "sky",
  "77:76 BOQ": "sky",
  indicative: "amber",
};

type Tab = "lines" | "material" | "labour" | "equipment" | "actual" | "library";
type Filter = "all" | "look" | "closer" | "done";

function Page() {
  const user = useSessionUser();
  const { access } = useAccess();
  const canEdit = !!access && access.roles.some((r) => r !== "landowner_investor");
  const qc = useQueryClient();
  const aiOn = useAiConfigured();
  const runAi = useServerFn(suggestRateAnalysis);
  const active = useActiveProject();
  const setActive = useActiveProjectSetter();

  const projectsQ = useQuery({
    queryKey: ["site_projects", "boq-budget"],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_projects")
        .select("id,name,location")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
  const projects = projectsQ.data ?? [];
  const pid = projects.find((p) => p.id === active.id)?.id || projects[0]?.id || "";
  const project = projects.find((p) => p.id === pid);

  const boqQ = useQuery({
    queryKey: ["boq_items", "boq-budget", pid],
    enabled: Boolean(pid),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("boq_items")
        .select("id,item_code,description,unit,quantity,rate,stage,package,package_no,sort_order")
        .eq("project_id", pid)
        .order("sort_order");
      if (error) throw error;
      return (data ?? []).map((r) => ({
        ...r,
        quantity: num(r.quantity),
        rate: num(r.rate),
        package: r.package ?? "",
        package_no: num(r.package_no),
        stage: r.stage ?? "",
      })) as BoqRow[];
    },
  });

  const poQ = useQuery({
    queryKey: ["po-rates", "boq-budget"],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("purchase_order_items")
        .select("description,unit,rate,discount_pct,purchase_orders(po_number,po_date)")
        .order("created_at", { ascending: false })
        .limit(3000);
      if (error) throw error;
      type Row = {
        description: string;
        unit: string;
        rate: number;
        discount_pct: number | null;
        purchase_orders: { po_number: string; po_date: string } | null;
      };
      return poRates(
        ((data ?? []) as unknown as Row[])
          .filter((r) => r.purchase_orders)
          .map((r) => ({
            description: r.description,
            unit: r.unit,
            rate: num(r.rate),
            discount_pct: r.discount_pct,
            po_number: r.purchase_orders!.po_number,
            po_date: r.purchase_orders!.po_date,
          })),
      );
    },
  });

  const regQ = useQuery({
    queryKey: ["labour-register-rates", "boq-budget"],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("labour_entries")
        .select("trade,day_rate")
        .order("work_date", { ascending: false })
        .limit(3000);
      if (error) throw error;
      return registerRates(
        (data ?? []).map((r) => ({ trade: r.trade, day_rate: num(r.day_rate) })),
      );
    },
  });

  const libQ = useQuery({
    queryKey: ["rate-library"],
    enabled: Boolean(user?.id),
    queryFn: async () =>
      (await readJson<{ rates: Record<string, LibraryRate> }>(LIB_PATH))?.rates ?? {},
  });

  const fileQ = useQuery({
    queryKey: ["boq-budget-file", pid],
    enabled: Boolean(pid),
    queryFn: async () => readJson<BudgetFile>(budgetPath(pid)),
  });

  // Working copy: edits stay on this phone until "Save budget".
  const [lines, setLines] = useState<Record<string, LineState>>({});
  const [diesel, setDiesel] = useState<number | null>(null);
  const [dirty, setDirty] = useState(false);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState("");
  useEffect(() => {
    setLines(fileQ.data?.lines ?? {});
    setDiesel(fileQ.data?.diesel ?? null);
    setDirty(false);
  }, [fileQ.data, pid]);

  const library = libQ.data ?? NO_LIB;
  const po = poQ.data ?? NO_PO;
  const dieselAuto = library["diesel"]
    ? { rate: library["diesel"].rate, note: "your rate library" }
    : po["diesel"]
      ? { rate: po["diesel"].rate, note: `your last purchase, ${po["diesel"].ref}` }
      : { rate: DEFAULT_DIESEL, note: "indicative, set yours" };
  const dieselRate = diesel ?? dieselAuto.rate;

  const ctx: RateCtx = useMemo(
    () => ({ library, po, register: regQ.data ?? NO_REG, diesel: dieselRate }),
    [library, po, regQ.data, dieselRate],
  );

  const rows = boqQ.data ?? NO_ROWS;
  const costed = useMemo(() => {
    const m = new Map<string, LineBudget>();
    for (const r of rows) m.set(r.id, costLine(r, lines[r.id], ctx));
    return m;
  }, [rows, lines, ctx]);

  const totals = useMemo(() => {
    let boq = 0,
      boqBudgeted = 0,
      budget = 0,
      done = 0,
      closer = 0,
      look = 0,
      assumed = 0;
    const byKind: Record<Kind, number> = { material: 0, labour: 0, equipment: 0 };
    for (const r of rows) {
      const b = costed.get(r.id)!;
      const amt = r.quantity * r.rate;
      boq += amt;
      if (lines[r.id]?.skip) continue;
      if (!b.budgeted) {
        closer++;
        continue;
      }
      done++;
      boqBudgeted += amt;
      budget += r.quantity * b.budgetRate;
      for (const k of Object.keys(byKind) as Kind[]) byKind[k] += r.quantity * b.perUnit[k];
      if (lineFlag(r.rate, b.budgetRate, true)) look++;
      assumed += b.analysis?.assumptions.filter((a) => a.assumed).length ?? 0;
    }
    const skipped = rows.filter((r) => lines[r.id]?.skip).length;
    return { boq, boqBudgeted, budget, done, closer, look, assumed, byKind, skipped };
  }, [rows, costed, lines]);
  const margin = totals.boqBudgeted - totals.budget;
  const marginPct = totals.boqBudgeted > 0 ? (margin / totals.boqBudgeted) * 100 : 0;

  const update = (id: string, fn: (s: LineState) => LineState) => {
    setLines((cur) => ({ ...cur, [id]: fn({ ...(cur[id] ?? {}) }) }));
    setDirty(true);
  };

  const save = async () => {
    if (!pid || !user) return;
    setBusy("save");
    setStatus("");
    try {
      const clean: Record<string, LineState> = {};
      for (const [k, v] of Object.entries(lines)) {
        const has =
          v.skip ||
          (v.added?.length ?? 0) > 0 ||
          (v.removed?.length ?? 0) > 0 ||
          Object.keys(v.edits ?? {}).length > 0 ||
          Object.keys(v.choices ?? {}).length > 0;
        if (has && rows.some((r) => r.id === k)) clean[k] = v;
      }
      const body: BudgetFile = {
        version: 1,
        savedAt: new Date().toISOString(),
        savedBy: user.email,
        ...(diesel !== null ? { diesel } : {}),
        lines: clean,
      };
      await putJson(budgetPath(pid), body);
      await qc.invalidateQueries({ queryKey: ["boq-budget-file", pid] });
      setStatus(`Budget saved: ${totals.done} of ${rows.length} lines budgeted.`);
    } catch (e) {
      setStatus(`Could not save: ${(e as Error).message}`);
    } finally {
      setBusy("");
    }
  };

  const saveToLibrary = async (c: Component, rate: number) => {
    if (!user) return;
    setBusy(`lib:${c.key}`);
    try {
      const cur = (await readJson<{ rates: Record<string, LibraryRate> }>(LIB_PATH))?.rates ?? {};
      const key = c.origin === "ai" || c.origin === "manual" ? slug(c.name) : c.key;
      cur[key] = {
        key,
        name: c.name,
        kind: c.kind,
        unit: c.unit,
        rate,
        at: new Date().toISOString(),
        by: user.email,
      };
      await putJson(LIB_PATH, { rates: cur });
      await qc.invalidateQueries({ queryKey: ["rate-library"] });
      setStatus(`${c.name} saved to your rate library at ${inr2(rate)} per ${c.unit}.`);
    } catch (e) {
      setStatus(`Could not save the rate: ${(e as Error).message}`);
    } finally {
      setBusy("");
    }
  };

  const askAi = async () => {
    const todo = rows.filter((r) => !costed.get(r.id)?.budgeted && !lines[r.id]?.skip);
    if (todo.length === 0) return;
    setBusy("ai");
    setStatus("");
    try {
      const known = Object.values({ ...DEFAULT_RATES, ...library }).map((d) => ({
        name: d.name,
        unit: d.unit,
        rate: d.rate,
      }));
      const { results } = await runAi({
        data: {
          lines: todo.slice(0, 40).map((r) => ({
            id: r.id,
            description: r.description,
            unit: r.unit,
            rate: r.rate,
          })),
          known,
        },
      });
      setLines((cur) => {
        const next = { ...cur };
        for (const r of results)
          next[r.id] = {
            ...(next[r.id] ?? {}),
            added: [...(next[r.id]?.added ?? []), ...r.components],
          };
        return next;
      });
      setDirty(true);
      setStatus(
        `AI suggested a breakdown for ${results.length} of ${Math.min(40, todo.length)} lines. Check the parts marked "AI estimate", then Save budget.`,
      );
    } catch (e) {
      setStatus(`AI could not run: ${(e as Error).message}`);
    } finally {
      setBusy("");
    }
  };

  const [tab, setTab] = useState<Tab>("lines");
  const [filter, setFilter] = useState<Filter>("all");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const [stage, setStage] = useState("");

  const groups = useMemo(() => {
    const term = q.trim().toLowerCase();
    const m = new Map<string, BoqRow[]>();
    for (const r of rows) {
      const b = costed.get(r.id)!;
      const skip = !!lines[r.id]?.skip;
      if (filter === "done" && (!b.budgeted || skip)) continue;
      if (filter === "closer" && (b.budgeted || skip)) continue;
      if (filter === "look" && !(b.budgeted && !skip && lineFlag(r.rate, b.budgetRate, true)))
        continue;
      if (term && !`${r.item_code} ${r.description}`.toLowerCase().includes(term)) continue;
      const g = groupOf(r);
      m.set(g, [...(m.get(g) ?? []), r]);
    }
    return [...m.entries()];
  }, [rows, costed, lines, filter, q]);

  const stages = useMemo(() => [...new Set(rows.map(groupOf))], [rows]);

  /** Totals of one kind across lines (optionally one package/stage) — the purchase & planning list. */
  const schedule = (kind: Kind) => {
    const m = new Map<
      string,
      {
        key: string;
        name: string;
        unit: string;
        qty: number;
        amount: number;
        rate: number;
        note: string;
        src: string;
        lines: number;
        diesel: number;
        lph?: number | undefined;
      }
    >();
    for (const r of rows) {
      if (stage && groupOf(r) !== stage) continue;
      if (lines[r.id]?.skip) continue;
      const b = costed.get(r.id)!;
      for (const c of b.components) {
        if (c.kind !== kind) continue;
        const k = `${c.key}|${c.unit}`;
        const cur = m.get(k) ?? {
          key: c.key,
          name: c.name,
          unit: c.unit,
          qty: 0,
          amount: 0,
          rate: c.rate,
          note: c.note,
          src: c.src,
          lines: 0,
          diesel: 0,
          lph: c.dieselLph,
        };
        cur.qty += c.qty * r.quantity;
        cur.amount += c.amountPerUnit * r.quantity;
        cur.diesel += c.dieselPerUnit * r.quantity;
        cur.lines += 1;
        m.set(k, cur);
      }
    }
    return [...m.values()].sort((a, b) => b.amount - a.amount);
  };

  const exportCsv = (kind: Kind) => {
    const list = schedule(kind);
    const head = ["Item", "Unit", "Quantity", "Rate", "Amount", "On lines", "Rate from"];
    const body = list.map((s) => [
      s.name,
      s.unit,
      s.qty.toFixed(2),
      s.rate.toFixed(2),
      s.amount.toFixed(0),
      s.lines,
      s.note,
    ]);
    const csv = [head, ...body]
      .map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `${project?.name ?? "project"}-${kind}-budget${stage ? `-${stage}` : ""}.csv`;
    a.click();
  };

  return (
    <Shell
      title="BOQ Budget"
      subtitle="What each BOQ line costs to build: material, labour and equipment, from your own rates"
    >
      <div className="space-y-4 pb-24">
        <div className="flex flex-wrap items-center gap-2">
          <select
            className="h-9 rounded border border-input bg-card px-2 text-sm"
            value={pid}
            onChange={(e) => setActive(e.target.value)}
            aria-label="Project"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          {fileQ.data?.savedAt && (
            <span className="text-xs text-muted-foreground">
              Last saved {new Date(fileQ.data.savedAt).toLocaleString("en-IN")} by{" "}
              {fileQ.data.savedBy}
            </span>
          )}
        </div>

        {rows.length === 0 && !boqQ.isPending && (
          <Section title="No BOQ yet">
            <p className="p-3 text-sm">
              This project has no BOQ lines. Build or upload one in the{" "}
              <Link to="/boq-engine" className="font-semibold text-primary underline">
                BOQ Engine
              </Link>{" "}
              first; this page then works out what each line costs to build.
            </p>
          </Section>
        )}

        {rows.length > 0 && (
          <>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
              <MetricTile label="BOQ value" value={lakh(totals.boq)} unit="ex-GST" />
              <MetricTile
                label="Budget (cost to build)"
                value={lakh(totals.budget)}
                unit={`${totals.done} lines`}
              />
              <MetricTile
                label="Margin in BOQ rates"
                value={lakh(margin)}
                delta={`${marginPct.toFixed(1)}% on budgeted lines`}
                tone={marginPct < 0 ? "bad" : marginPct < 8 ? "warn" : "good"}
              />
              <MetricTile
                label="Lines budgeted"
                value={`${totals.done} / ${rows.length - totals.skipped}`}
                delta={totals.closer ? `${totals.closer} need a closer look` : "all lines"}
                tone={totals.closer ? "warn" : "good"}
              />
              <MetricTile label="Material budget" value={lakh(totals.byKind.material)} />
              <MetricTile label="Labour budget" value={lakh(totals.byKind.labour)} />
              <MetricTile
                label="Equipment budget"
                value={lakh(totals.byKind.equipment)}
                unit="incl. diesel"
              />
              <MetricTile
                label="Assumptions"
                value={String(totals.assumed)}
                delta={totals.look ? `${totals.look} lines worth a look` : "each one changeable"}
                tone={totals.look ? "warn" : "neutral"}
              />
            </div>

            <PageTabs<Tab>
              tabs={[
                { key: "lines", label: "BOQ lines", icon: <ListChecks className="size-4" /> },
                { key: "material", label: "Materials", icon: <Boxes className="size-4" /> },
                { key: "labour", label: "Labour", icon: <HardHat className="size-4" /> },
                { key: "equipment", label: "Equipment", icon: <Truck className="size-4" /> },
                { key: "actual", label: "Budget vs actual", icon: <Scale className="size-4" /> },
                { key: "library", label: "Rate library", icon: <Library className="size-4" /> },
              ]}
              active={tab}
              onChange={setTab}
            />

            {status && (
              <p
                className="rounded border border-border bg-secondary px-3 py-2 text-sm"
                role="status"
              >
                {status}
              </p>
            )}

            {tab === "lines" && (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  {(
                    [
                      ["all", "All"],
                      ["look", `Worth a look (${totals.look})`],
                      ["closer", `Closer look (${totals.closer})`],
                      ["done", `Budgeted (${totals.done})`],
                    ] as [Filter, string][]
                  ).map(([k, label]) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setFilter(k)}
                      className={`h-8 rounded-full px-3 text-xs font-semibold ${filter === k ? "bg-primary text-primary-foreground" : "border border-border bg-card"}`}
                    >
                      {label}
                    </button>
                  ))}
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search lines"
                    className="h-8 min-w-[10rem] flex-1 rounded border border-input bg-card px-2 text-sm"
                  />
                  {canEdit && totals.closer > 0 && (
                    <button
                      type="button"
                      disabled={busy === "ai" || aiOn === false}
                      title={aiOn === false ? AI_OFF_REASON : "Uses AI credits (BOQ AI)"}
                      onClick={askAi}
                      className="inline-flex h-8 items-center gap-1.5 rounded bg-primary px-3 text-xs font-semibold text-primary-foreground disabled:opacity-50"
                    >
                      <Sparkles className="size-3.5" />
                      {busy === "ai"
                        ? "Working out…"
                        : `AI: break down ${Math.min(40, totals.closer)} closer-look lines`}
                    </button>
                  )}
                </div>

                {groups.map(([g, list]) => (
                  <Section key={g} title={g}>
                    <ul className="divide-y divide-border">
                      {list.map((r) => (
                        <LineRow
                          key={r.id}
                          row={r}
                          b={costed.get(r.id)!}
                          state={lines[r.id]}
                          open={open === r.id}
                          onToggle={() => setOpen(open === r.id ? null : r.id)}
                          canEdit={canEdit}
                          update={(fn) => update(r.id, fn)}
                          ctx={ctx}
                          onSaveRate={saveToLibrary}
                          busy={busy}
                        />
                      ))}
                    </ul>
                  </Section>
                ))}
              </div>
            )}

            {(tab === "material" || tab === "labour" || tab === "equipment") && (
              <Section
                title={`${KIND_LABEL[tab]} list${stage ? ` · ${stage}` : " · whole project"}`}
                action={
                  <div className="flex items-center gap-2">
                    <select
                      className="h-8 max-w-[12rem] rounded border border-input bg-card px-2 text-xs"
                      value={stage}
                      onChange={(e) => setStage(e.target.value)}
                      aria-label="Package"
                    >
                      <option value="">Whole project</option>
                      {stages.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => exportCsv(tab)}
                      className="inline-flex h-8 items-center gap-1 rounded border border-input bg-card px-2 text-xs font-semibold"
                    >
                      <Download className="size-3.5" /> CSV
                    </button>
                  </div>
                }
              >
                {tab === "equipment" && (
                  <div className="flex flex-wrap items-center gap-2 border-b border-border px-3 py-2 text-sm">
                    <label htmlFor="diesel">Diesel ₹/litre</label>
                    <input
                      id="diesel"
                      type="number"
                      inputMode="decimal"
                      className="h-8 w-24 rounded border border-input bg-card px-2"
                      value={dieselRate}
                      disabled={!canEdit}
                      onChange={(e) => {
                        setDiesel(num(e.target.value));
                        setDirty(true);
                      }}
                    />
                    <span className="text-xs text-muted-foreground">
                      {diesel === null ? `from ${dieselAuto.note}` : "set for this project"}
                    </span>
                  </div>
                )}
                <Schedule kind={tab} list={schedule(tab)} />
                {tab === "material" && (
                  <p className="px-3 py-2 text-xs text-muted-foreground">
                    Ready for purchase: raise the orders in{" "}
                    <Link to="/po-create" className="font-semibold text-primary underline">
                      Create PO
                    </Link>
                    . Quantities are BOQ quantity × quantity per unit (wastage as stated on each
                    line).
                  </p>
                )}
              </Section>
            )}

            {tab === "actual" && (
              <BudgetVsActual
                projectId={pid}
                materials={schedule("material")}
                budget={totals.byKind}
                diesel={dieselRate}
              />
            )}

            {tab === "library" && (
              <RateLibrary ctx={ctx} canEdit={canEdit} busy={busy} onSave={saveToLibrary} />
            )}
          </>
        )}
      </div>

      {rows.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 px-3 py-2 backdrop-blur">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-1 text-xs">
            <span>
              BOQ <b>{lakh(totals.boqBudgeted)}</b>
            </span>
            <span>
              Budget <b>{lakh(totals.budget)}</b>
            </span>
            <span className={margin < 0 ? "text-destructive" : "text-primary"}>
              Margin{" "}
              <b>
                {lakh(margin)} · {marginPct.toFixed(0)}%
              </b>
            </span>
            <span className="text-muted-foreground">on {totals.done} budgeted lines</span>
            {canEdit && (
              <button
                type="button"
                onClick={save}
                disabled={busy === "save" || !dirty}
                className="ml-auto inline-flex h-9 items-center gap-1.5 rounded bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-50"
              >
                <Save className="size-4" />
                {busy === "save" ? "Saving…" : dirty ? "Save budget" : "Saved"}
              </button>
            )}
          </div>
        </div>
      )}
    </Shell>
  );
}

function LineRow({
  row,
  b,
  state,
  open,
  onToggle,
  canEdit,
  update,
  ctx,
  onSaveRate,
  busy,
}: {
  row: BoqRow;
  b: LineBudget;
  state?: LineState | undefined;
  open: boolean;
  onToggle: () => void;
  canEdit: boolean;
  update: (fn: (s: LineState) => LineState) => void;
  ctx: RateCtx;
  onSaveRate: (c: Component, rate: number) => void | Promise<void>;
  busy: string;
}) {
  const skip = !!state?.skip;
  const flag = skip ? null : lineFlag(row.rate, b.budgetRate, b.budgeted);
  const m = row.rate > 0 && b.budgeted ? ((row.rate - b.budgetRate) / row.rate) * 100 : null;
  const [adding, setAdding] = useState(false);

  return (
    <li className="px-3 py-2">
      <button type="button" onClick={onToggle} className="flex w-full items-start gap-2 text-left">
        {open ? (
          <ChevronDown className="mt-0.5 size-4 shrink-0" />
        ) : (
          <ChevronRight className="mt-0.5 size-4 shrink-0" />
        )}
        <span className="min-w-0 flex-1">
          <span className="line-clamp-2 text-sm">
            <b className="mr-1 text-muted-foreground">{row.item_code}</b>
            {row.description}
          </span>
          <span className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
            <span>
              {qtyFmt(row.quantity)} {row.unit} × {inr2(row.rate)}
            </span>
            {skip ? (
              <StatusBadge tone="slate">Not budgeted</StatusBadge>
            ) : b.budgeted ? (
              <>
                <span className="font-semibold text-foreground">budget {inr2(b.budgetRate)}</span>
                {m !== null && <span>· {m.toFixed(0)}% margin</span>}
                {b.analysis && <StatusBadge tone="sky">{b.analysis.normLabel}</StatusBadge>}
                {b.components.some((c) => c.origin === "ai") && (
                  <StatusBadge tone="amber">AI estimate</StatusBadge>
                )}
              </>
            ) : (
              <StatusBadge tone="amber">Needs a closer look</StatusBadge>
            )}
            {flag && (
              <StatusBadge tone={flag.tone === "bad" ? "red" : "amber"}>{flag.text}</StatusBadge>
            )}
          </span>
        </span>
      </button>

      {open && (
        <div className="mt-2 space-y-3 pl-6">
          {b.analysis && b.analysis.assumptions.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {b.analysis.assumptions.map((a) => (
                <label
                  key={a.id}
                  className="inline-flex items-center gap-1 rounded border border-border bg-secondary px-2 py-1 text-xs"
                >
                  {a.assumed && (
                    <span className="rounded bg-warning-soft px-1 font-bold text-[oklch(0.55_0.13_70)]">
                      ASSUMED
                    </span>
                  )}
                  <span className="text-muted-foreground">{a.label}:</span>
                  <select
                    className="bg-transparent font-semibold"
                    value={a.value}
                    disabled={!canEdit}
                    onChange={(e) =>
                      update((s) => ({
                        ...s,
                        choices: { ...(s.choices ?? {}), [a.id]: e.target.value },
                      }))
                    }
                  >
                    {a.options.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
          )}

          {(["material", "labour", "equipment"] as Kind[]).map((kind) => {
            const list = b.components.filter((c) => c.kind === kind);
            if (list.length === 0) return null;
            return (
              <div key={kind} className="overflow-x-auto rounded border border-border">
                <div className="flex items-center justify-between bg-secondary px-2 py-1 text-xs font-semibold">
                  <span>{KIND_LABEL[kind]}</span>
                  <span>
                    {inr2(b.perUnit[kind])} per {row.unit}
                  </span>
                </div>
                <table className="w-full min-w-[34rem] text-xs">
                  <thead className="text-muted-foreground">
                    <tr>
                      <th className="px-2 py-1 text-left">Item</th>
                      <th className="px-2 py-1 text-right">Per {row.unit}</th>
                      <th className="px-2 py-1 text-right">Rate</th>
                      <th className="px-2 py-1 text-right">Amount</th>
                      <th className="px-2 py-1 text-left">Where it came from</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {list.map((c) => (
                      <tr key={c.key} className="border-t border-border align-top">
                        <td className="px-2 py-1">
                          <div className="font-medium">{c.name}</div>
                          <div className="text-muted-foreground">{c.basis}</div>
                        </td>
                        <td className="px-2 py-1 text-right whitespace-nowrap">
                          <input
                            type="number"
                            inputMode="decimal"
                            step="any"
                            className="h-7 w-20 rounded border border-input bg-card px-1 text-right"
                            value={Number(c.qty.toFixed(4))}
                            disabled={!canEdit}
                            onChange={(e) =>
                              update((s) => ({
                                ...s,
                                edits: {
                                  ...(s.edits ?? {}),
                                  [c.key]: {
                                    ...(s.edits?.[c.key] ?? {}),
                                    qty: num(e.target.value),
                                  },
                                },
                              }))
                            }
                          />{" "}
                          {c.unit}
                        </td>
                        <td className="px-2 py-1 text-right whitespace-nowrap">
                          ₹
                          <input
                            type="number"
                            inputMode="decimal"
                            step="any"
                            className="h-7 w-20 rounded border border-input bg-card px-1 text-right"
                            value={c.rate}
                            disabled={!canEdit}
                            onChange={(e) =>
                              update((s) => ({
                                ...s,
                                edits: {
                                  ...(s.edits ?? {}),
                                  [c.key]: {
                                    ...(s.edits?.[c.key] ?? {}),
                                    rate: num(e.target.value),
                                  },
                                },
                              }))
                            }
                          />
                          {c.dieselLph ? (
                            <div className="text-muted-foreground">
                              + {c.dieselLph} l/h diesel = {inr2(c.dieselPerUnit)}
                            </div>
                          ) : null}
                        </td>
                        <td className="px-2 py-1 text-right font-semibold">
                          {inr2(c.amountPerUnit)}
                        </td>
                        <td className="px-2 py-1">
                          <StatusBadge tone={SRC_TONE[c.src] ?? "slate"}>{c.note}</StatusBadge>
                          {canEdit &&
                            (c.src === "line" || c.src === "indicative") &&
                            c.rate > 0 && (
                              <button
                                type="button"
                                className="ml-1 text-primary underline disabled:opacity-50"
                                disabled={busy === `lib:${c.key}`}
                                onClick={() => onSaveRate(c, c.rate)}
                              >
                                Save to rate library
                              </button>
                            )}
                        </td>
                        <td className="px-1 py-1">
                          {canEdit && (
                            <button
                              type="button"
                              aria-label={`Remove ${c.name}`}
                              onClick={() =>
                                update((s) =>
                                  c.origin === "norm"
                                    ? { ...s, removed: [...new Set([...(s.removed ?? []), c.key])] }
                                    : {
                                        ...s,
                                        added: (s.added ?? []).filter((x) => x.key !== c.key),
                                      },
                                )
                              }
                            >
                              <X className="size-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })}

          {b.analysis?.notes.map((n) => (
            <p key={n} className="text-xs text-muted-foreground">
              Note: {n}
            </p>
          ))}

          {canEdit && (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setAdding(!adding)}
                className="inline-flex h-8 items-center gap-1 rounded border border-input bg-card px-2 text-xs font-semibold"
              >
                <Plus className="size-3.5" /> Add material, labour or equipment
              </button>
              {(state?.removed?.length ?? 0) > 0 && (
                <button
                  type="button"
                  onClick={() => update((s) => ({ ...s, removed: [] }))}
                  className="h-8 rounded border border-input bg-card px-2 text-xs"
                >
                  Restore removed parts
                </button>
              )}
              <button
                type="button"
                onClick={() => update((s) => ({ ...s, skip: !s.skip }))}
                className="h-8 rounded border border-input bg-card px-2 text-xs"
              >
                {skip ? "Budget this line" : "Don't budget this line (provisional / lump sum)"}
              </button>
            </div>
          )}
          {adding && (
            <AddPart
              unit={row.unit}
              ctx={ctx}
              onAdd={(c) => {
                update((s) => ({ ...s, skip: false, added: [...(s.added ?? []), c] }));
                setAdding(false);
              }}
            />
          )}
        </div>
      )}
    </li>
  );
}

function AddPart({
  unit,
  ctx,
  onAdd,
}: {
  unit: string;
  ctx: RateCtx;
  onAdd: (c: Component) => void;
}) {
  const [kind, setKind] = useState<Kind>("material");
  const [key, setKey] = useState("");
  const [name, setName] = useState("");
  const [u, setU] = useState("");
  const [qty, setQty] = useState("");
  const [rate, setRate] = useState("");
  const [lph, setLph] = useState("");
  const options = Object.entries({ ...DEFAULT_RATES, ...ctx.library }).filter(
    ([, d]) => d.kind === kind,
  );
  return (
    <div className="grid grid-cols-2 gap-2 rounded border border-border p-2 text-xs md:grid-cols-6">
      <select
        className="h-8 rounded border border-input bg-card px-1"
        value={kind}
        onChange={(e) => setKind(e.target.value as Kind)}
      >
        <option value="material">Material</option>
        <option value="labour">Labour</option>
        <option value="equipment">Equipment</option>
      </select>
      <select
        className="h-8 rounded border border-input bg-card px-1 md:col-span-2"
        value={key}
        onChange={(e) => {
          setKey(e.target.value);
          const d = e.target.value ? { ...DEFAULT_RATES, ...ctx.library }[e.target.value] : null;
          if (d) {
            setName(d.name);
            setU(d.unit);
            setRate(
              String(
                resolveRate(
                  { key: e.target.value, kind, name: d.name, unit: d.unit, qty: 0, basis: "" },
                  ctx,
                ).rate,
              ),
            );
          }
        }}
      >
        <option value="">From your list… (or type below)</option>
        {options.map(([k, d]) => (
          <option key={k} value={k}>
            {d.name} ({d.unit})
          </option>
        ))}
      </select>
      <input
        className="h-8 rounded border border-input bg-card px-1 md:col-span-3"
        placeholder="Name"
        value={name}
        onChange={(e) => {
          setName(e.target.value);
          setKey("");
        }}
      />
      <input
        className="h-8 rounded border border-input bg-card px-1"
        placeholder="Rate unit (bags, day…)"
        value={u}
        onChange={(e) => setU(e.target.value)}
      />
      <input
        className="h-8 rounded border border-input bg-card px-1"
        type="number"
        inputMode="decimal"
        step="any"
        placeholder={`Qty per ${unit}`}
        value={qty}
        onChange={(e) => setQty(e.target.value)}
      />
      <input
        className="h-8 rounded border border-input bg-card px-1"
        type="number"
        inputMode="decimal"
        step="any"
        placeholder="Rate ₹"
        value={rate}
        onChange={(e) => setRate(e.target.value)}
      />
      {kind === "equipment" && (
        <input
          className="h-8 rounded border border-input bg-card px-1"
          type="number"
          inputMode="decimal"
          step="any"
          placeholder="Diesel l/hour"
          value={lph}
          onChange={(e) => setLph(e.target.value)}
        />
      )}
      <button
        type="button"
        disabled={!name.trim() || !(num(qty) > 0)}
        className="h-8 rounded bg-primary px-2 font-semibold text-primary-foreground disabled:opacity-50"
        onClick={() =>
          onAdd({
            key: key || slug(name),
            kind,
            name: name.trim(),
            unit: u.trim() || "nos",
            qty: num(qty),
            rate: num(rate),
            basis: "added on this line",
            origin: "manual",
            ...(kind === "equipment" && num(lph) > 0 ? { dieselLph: num(lph) } : {}),
          })
        }
      >
        Add
      </button>
    </div>
  );
}

function Schedule({
  kind,
  list,
}: {
  kind: Kind;
  list: {
    name: string;
    unit: string;
    qty: number;
    amount: number;
    rate: number;
    note: string;
    src: string;
    lines: number;
    diesel: number;
    lph?: number | undefined;
  }[];
}) {
  if (list.length === 0)
    return <p className="p-3 text-sm text-muted-foreground">Nothing budgeted here yet.</p>;
  const total = list.reduce((s, x) => s + x.amount, 0);
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[36rem] text-sm">
        <thead className="text-xs text-muted-foreground">
          <tr>
            <th className="px-3 py-1.5 text-left">{KIND_LABEL[kind]}</th>
            <th className="px-3 py-1.5 text-right">Quantity</th>
            <th className="px-3 py-1.5 text-right">Rate</th>
            {kind === "equipment" && <th className="px-3 py-1.5 text-right">Diesel</th>}
            <th className="px-3 py-1.5 text-right">Amount</th>
            <th className="px-3 py-1.5 text-right">On lines</th>
            <th className="px-3 py-1.5 text-left">Rate from</th>
          </tr>
        </thead>
        <tbody>
          {list.map((s) => (
            <tr key={`${s.name}|${s.unit}`} className="border-t border-border">
              <td className="px-3 py-1.5 font-medium">{s.name}</td>
              <td className="px-3 py-1.5 text-right whitespace-nowrap">
                {qtyFmt(s.qty)} {s.unit}
                {kind === "equipment" && s.unit === "hour" && (
                  <div className="text-xs text-muted-foreground">{(s.qty / 8).toFixed(1)} days</div>
                )}
              </td>
              <td className="px-3 py-1.5 text-right">{inr2(s.rate)}</td>
              {kind === "equipment" && (
                <td className="px-3 py-1.5 text-right text-xs">
                  {s.lph ? `${s.lph} l/h · ${inr(s.diesel)}` : "in the rate"}
                </td>
              )}
              <td className="px-3 py-1.5 text-right font-semibold">{inr(s.amount)}</td>
              <td className="px-3 py-1.5 text-right">{s.lines}</td>
              <td className="px-3 py-1.5">
                <StatusBadge tone={SRC_TONE[s.src] ?? "slate"}>{s.note}</StatusBadge>
              </td>
            </tr>
          ))}
          <tr className="border-t-2 border-border font-semibold">
            <td className="px-3 py-1.5">Total</td>
            <td colSpan={kind === "equipment" ? 3 : 2} />
            <td className="px-3 py-1.5 text-right">{inr(total)}</td>
            <td colSpan={2} />
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function RateLibrary({
  ctx,
  canEdit,
  busy,
  onSave,
}: {
  ctx: RateCtx;
  canEdit: boolean;
  busy: string;
  onSave: (c: Component, rate: number) => void;
}) {
  const [draft, setDraft] = useState<Record<string, string>>({});
  const entries = Object.entries({ ...DEFAULT_RATES, ...ctx.library });
  return (
    <Section title="Rate library (shared by every project)">
      <p className="px-3 pt-2 text-xs text-muted-foreground">
        Rates are taken in this order: your library → your latest PO → your labour register day
        rates → the 77:76 BOQ → indicative. Amber means indicative: replace it with your own.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[34rem] text-sm">
          <thead className="text-xs text-muted-foreground">
            <tr>
              <th className="px-3 py-1.5 text-left">Item</th>
              <th className="px-3 py-1.5 text-left">Type</th>
              <th className="px-3 py-1.5 text-right">Rate in use</th>
              <th className="px-3 py-1.5 text-left">From</th>
              {canEdit && <th className="px-3 py-1.5 text-left">Set your rate</th>}
            </tr>
          </thead>
          <tbody>
            {entries.map(([key, d]) => {
              const c: Component = {
                key,
                kind: d.kind,
                name: d.name,
                unit: d.unit,
                qty: 0,
                basis: "",
              };
              const r = resolveRate(c, ctx);
              return (
                <tr key={key} className="border-t border-border">
                  <td className="px-3 py-1.5">
                    {d.name} <span className="text-xs text-muted-foreground">/ {d.unit}</span>
                  </td>
                  <td className="px-3 py-1.5 text-xs">{KIND_LABEL[d.kind]}</td>
                  <td className="px-3 py-1.5 text-right font-semibold">{inr2(r.rate)}</td>
                  <td className="px-3 py-1.5">
                    <StatusBadge tone={SRC_TONE[r.src] ?? "slate"}>{r.note}</StatusBadge>
                  </td>
                  {canEdit && (
                    <td className="px-3 py-1.5 whitespace-nowrap">
                      <input
                        type="number"
                        inputMode="decimal"
                        step="any"
                        className="h-7 w-24 rounded border border-input bg-card px-1 text-right"
                        value={draft[key] ?? ""}
                        placeholder={String(r.rate)}
                        onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
                      />{" "}
                      <button
                        type="button"
                        disabled={!(num(draft[key]) > 0) || busy === `lib:${key}`}
                        className="text-xs font-semibold text-primary underline disabled:opacity-40"
                        onClick={() => onSave(c, num(draft[key]))}
                      >
                        Save
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Section>
  );
}

/**
 * Budget vs actual: what is committed (approved POs) and spent (labour register, machine log)
 * against the BOQ Budget, by material and by kind.
 */
function BudgetVsActual({
  projectId,
  materials,
  budget,
  diesel,
}: {
  projectId: string;
  materials: { key: string; name: string; unit: string; qty: number; amount: number }[];
  budget: Record<Kind, number>;
  diesel: number;
}) {
  const q = useQuery({
    queryKey: ["budget-vs-actual", projectId],
    enabled: Boolean(projectId),
    queryFn: async () => {
      const [pos, labour, machines, logs] = await Promise.all([
        supabase
          .from("purchase_orders")
          .select(
            "id,status,purchase_order_items(description,unit,quantity,rate,discount_pct,material_key)",
          )
          .eq("project_id", projectId)
          .in("status", ["approved", "pending"]),
        supabase
          .from("labour_entries")
          .select("headcount,day_rate,hours")
          .eq("project_id", projectId),
        supabase
          .from("machines")
          .select("id,ownership,hire_rate,rate_unit,min_hours_per_day,diesel_in_hire"),
        supabase
          .from("machine_logs")
          .select("machine_id,log_date,hours,diesel_l")
          .eq("project_id", projectId),
      ]);
      for (const r of [pos, labour, machines, logs]) if (r.error) throw r.error;
      type Item = {
        description: string;
        unit: string;
        quantity: number;
        rate: number;
        discount_pct: number;
        material_key: string;
      };
      const byKey = new Map<string, { qty: number; amount: number; pendingAmount: number }>();
      let other = 0;
      let pending = 0;
      for (const po of (pos.data ?? []) as unknown as {
        status: string;
        purchase_order_items: Item[];
      }[]) {
        for (const it of po.purchase_order_items ?? []) {
          const amount = num(it.quantity) * num(it.rate) * (1 - num(it.discount_pct) / 100);
          const fromKey = it.material_key?.startsWith(RATE_KEY)
            ? { key: it.material_key.slice(RATE_KEY.length), factor: 1 }
            : null;
          const k = fromKey ?? matchKey(it.description, it.unit);
          if (po.status === "pending") pending += amount;
          if (!k) {
            if (po.status === "approved") other += amount;
            continue;
          }
          const cur = byKey.get(k.key) ?? { qty: 0, amount: 0, pendingAmount: 0 };
          if (po.status === "approved") {
            cur.qty += num(it.quantity) / k.factor;
            cur.amount += amount;
          } else cur.pendingAmount += amount;
          byKey.set(k.key, cur);
        }
      }
      const labourSpent = (labour.data ?? []).reduce(
        (s, l) => s + num(l.headcount) * num(l.day_rate) * (num(l.hours || 8) / 8),
        0,
      );
      const mById = new Map((machines.data ?? []).map((m) => [m.id, m]));
      const days = new Map<string, number>();
      let fuel = 0;
      for (const l of logs.data ?? []) {
        const k = `${l.machine_id}|${l.log_date}`;
        days.set(k, (days.get(k) ?? 0) + num(l.hours));
        const m = mById.get(l.machine_id);
        if (!m?.diesel_in_hire) fuel += num(l.diesel_l);
      }
      let hire = 0;
      for (const [k, h] of days) {
        const m = mById.get(k.split("|")[0] ?? "");
        if (!m || m.ownership !== "hired") continue;
        hire +=
          m.rate_unit === "day"
            ? num(m.hire_rate)
            : m.rate_unit === "month"
              ? num(m.hire_rate) / 26
              : Math.max(h, num(m.min_hours_per_day)) * num(m.hire_rate);
      }
      return { byKey, other, pending, labourSpent, hire, fuel };
    },
  });
  const d = q.data;
  const materialActual = d ? [...d.byKey.values()].reduce((s, x) => s + x.amount, 0) + d.other : 0;
  const rows: { kind: string; budget: number; actual: number; note: string }[] = [
    {
      kind: "Material (approved POs)",
      budget: budget.material,
      actual: materialActual,
      note: d && d.pending ? `+ ${inr(d.pending)} awaiting approval` : "",
    },
    {
      kind: "Labour (labour register)",
      budget: budget.labour,
      actual: d?.labourSpent ?? 0,
      note: "headcount × day rate",
    },
    {
      kind: "Equipment (machine log)",
      budget: budget.equipment,
      actual: (d?.hire ?? 0) + (d?.fuel ?? 0) * diesel,
      note: d ? `hire ${inr(d.hire)} + ${Math.round(d.fuel)} l diesel` : "",
    },
  ];
  return (
    <div className="space-y-4">
      <Section title="By kind">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[32rem] text-sm">
            <thead className="text-xs text-muted-foreground">
              <tr>
                <th className="px-3 py-1.5 text-left">Kind</th>
                <th className="px-3 py-1.5 text-right">Budget</th>
                <th className="px-3 py-1.5 text-right">Committed / spent</th>
                <th className="px-3 py-1.5 text-right">Used</th>
                <th className="px-3 py-1.5 text-left" />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const pct = r.budget > 0 ? (r.actual / r.budget) * 100 : 0;
                return (
                  <tr key={r.kind} className="border-t border-border">
                    <td className="px-3 py-1.5 font-medium">{r.kind}</td>
                    <td className="px-3 py-1.5 text-right">{lakh(r.budget)}</td>
                    <td className="px-3 py-1.5 text-right font-semibold">{lakh(r.actual)}</td>
                    <td className="px-3 py-1.5 text-right">
                      <StatusBadge tone={pct > 100 ? "red" : pct > 85 ? "amber" : "emerald"}>
                        {pct.toFixed(0)}%
                      </StatusBadge>
                    </td>
                    <td className="px-3 py-1.5 text-xs text-muted-foreground">{r.note}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Section>
      <Section title="Materials: budget quantity vs ordered">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[36rem] text-sm">
            <thead className="text-xs text-muted-foreground">
              <tr>
                <th className="px-3 py-1.5 text-left">Material</th>
                <th className="px-3 py-1.5 text-right">Budget qty</th>
                <th className="px-3 py-1.5 text-right">Ordered</th>
                <th className="px-3 py-1.5 text-right">Left</th>
                <th className="px-3 py-1.5 text-right">Budget ₹</th>
                <th className="px-3 py-1.5 text-right">Ordered ₹</th>
              </tr>
            </thead>
            <tbody>
              {materials.map((m) => {
                const a = d?.byKey.get(m.key);
                const left = m.qty - (a?.qty ?? 0);
                const over = (a?.amount ?? 0) > m.amount * 1.001 || left < -1e-6;
                return (
                  <tr
                    key={m.key + m.unit}
                    className={cn("border-t border-border", over && "bg-destructive-soft")}
                  >
                    <td className="px-3 py-1.5 font-medium">{m.name}</td>
                    <td className="px-3 py-1.5 text-right">
                      {qtyFmt(m.qty)} {m.unit}
                    </td>
                    <td className="px-3 py-1.5 text-right">{qtyFmt(a?.qty ?? 0)}</td>
                    <td
                      className={cn(
                        "px-3 py-1.5 text-right",
                        left < 0 && "font-semibold text-destructive",
                      )}
                    >
                      {qtyFmt(left)}
                    </td>
                    <td className="px-3 py-1.5 text-right">{inr(m.amount)}</td>
                    <td className="px-3 py-1.5 text-right font-semibold">{inr(a?.amount ?? 0)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {d && d.other > 0 && (
          <p className="px-3 py-2 text-xs text-muted-foreground">
            {inr(d.other)} of approved POs are for items not in the budget breakdown (fixtures,
            lift, etc.).
          </p>
        )}
      </Section>
    </div>
  );
}
