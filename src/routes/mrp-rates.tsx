import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileUp,
  Plus,
  Save,
  Trash2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { Shell } from "@/components/saha/Shell";
import { supabase } from "@/integrations/supabase/client";
import { useActiveProject } from "@/hooks/useActiveProject";
import { useAiConfigured, AI_OFF_REASON } from "@/hooks/useAiStatus";
import { useSessionUser } from "@/lib/access";
import { extractQuoteFromFile } from "@/lib/price-ocr.functions";
import {
  CSV_TEMPLATE,
  RATES_DIR,
  discountFor,
  emptyLine,
  emptyRule,
  matchBoq,
  monthFile,
  monthLabel,
  netRate,
  parseCsv,
  thisMonth,
  uid,
  type BoqRow,
  type DiscountRule,
  type MrpLine,
  type MrpMonth,
} from "@/lib/mrp";

export const Route = createFileRoute("/mrp-rates")({
  head: () => ({
    meta: [
      { title: "MRP Rates & Discounts | Saha OS" },
      {
        name: "description",
        content:
          "Upload each month's MRP price lists, set your discount on MRP per vendor, brand or category, and push the net rates into your BOQ as the material cost.",
      },
    ],
  }),
  component: Page,
});

const BUCKET = "site-media";
const inr = (n: number) => `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

function Page() {
  const project = useActiveProject();
  const pid = project.id;
  const user = useSessionUser();
  const qc = useQueryClient();
  const ai = useAiConfigured();
  const extract = useServerFn(extractQuoteFromFile);
  const [month, setMonth] = useState<string | null>(null);
  const [lines, setLines] = useState<MrpLine[] | null>(null);
  const [rules, setRules] = useState<DiscountRule[] | null>(null);
  const [sources, setSources] = useState<string[] | null>(null);
  const [picked, setPicked] = useState<Set<string> | null>(null);

  const lib = useQuery({
    queryKey: ["mrp-lib", pid],
    enabled: Boolean(pid),
    queryFn: async () => {
      const list = await supabase.storage.from(BUCKET).list(RATES_DIR(pid), { limit: 200 });
      const months = (list.data ?? [])
        .map((f) => /^mrp-(\d{4}-\d{2})\.json$/.exec(f.name)?.[1])
        .filter((m): m is string => Boolean(m))
        .sort()
        .reverse();
      const read = async <T,>(name: string): Promise<T | null> => {
        const dl = await supabase.storage.from(BUCKET).download(`${RATES_DIR(pid)}/${name}`);
        if (!dl.data) return null;
        try {
          return JSON.parse(await dl.data.text()) as T;
        } catch {
          return null;
        }
      };
      const disc = (await read<{ rules: DiscountRule[] }>("discounts.json"))?.rules ?? [];
      const byMonth: Record<string, MrpMonth> = {};
      for (const m of months) {
        const d = await read<MrpMonth>(monthFile(m));
        if (d) byMonth[m] = d;
      }
      return { months, byMonth, rules: disc };
    },
  });

  const boq = useQuery({
    queryKey: ["mrp-boq", pid],
    enabled: Boolean(pid),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("boq_items")
        .select("id,item_code,description,brand,category,unit,quantity,rate,stage")
        .eq("project_id", pid)
        .limit(5000);
      if (error) throw error;
      return (data ?? []) as BoqRow[];
    },
  });

  const latest = lib.data?.months[0] ?? null;
  const m = month ?? latest ?? thisMonth();
  const saved = lib.data?.byMonth[m];
  const L = lines ?? saved?.lines ?? [];
  const R = rules ?? lib.data?.rules ?? [];
  const S = sources ?? saved?.sources ?? [];
  const stale = !latest || latest < thisMonth();

  const pickMonth = (v: string) => {
    setMonth(v);
    setLines(null);
    setSources(null);
    setPicked(null);
  };
  const editLine = (id: string, patch: Partial<MrpLine>) =>
    setLines(L.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  const editRule = (id: string, patch: Partial<DiscountRule>) =>
    setRules(R.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const putJson = async (name: string, body: unknown) => {
    const blob = new Blob([JSON.stringify(body)], { type: "application/json" });
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(`${RATES_DIR(pid)}/${name}`, blob, { upsert: true, contentType: "application/json" });
    if (error) throw error;
  };

  const save = useMutation({
    mutationFn: async () => {
      if (!pid) throw new Error("Choose a project first");
      const clean = L.filter((l) => l.item.trim() && l.mrp > 0);
      await putJson(monthFile(m), {
        month: m,
        updatedAt: new Date().toISOString(),
        sources: S,
        lines: clean,
      } satisfies MrpMonth);
      await putJson("discounts.json", { rules: R.filter((r) => r.vendor.trim() && r.pct > 0) });
      return clean.length;
    },
    onSuccess: (n) => {
      toast.success(`${monthLabel(m)} MRP list saved (${n} lines) with your discounts`);
      setLines(null);
      setRules(null);
      setSources(null);
      qc.invalidateQueries({ queryKey: ["mrp-lib", pid] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const readList = useMutation({
    mutationFn: async (file: File) => {
      const mediaType =
        file.type || (file.name.toLowerCase().endsWith(".pdf") ? "application/pdf" : "image/jpeg");
      const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const storagePath = `${user?.id ?? "anon"}/${Date.now()}-${safe}`;
      const { error } = await supabase.storage
        .from("price-proformas")
        .upload(storagePath, file, { contentType: mediaType, upsert: true });
      if (error) throw new Error(`Upload failed: ${error.message}`);
      const r = await extract({ data: { fileName: file.name, mediaType, storagePath } });
      const got: MrpLine[] = r.items
        .filter((i) => i.description && i.rate > 0)
        .map((i) => ({
          id: uid(),
          item_code: i.item_code,
          brand: i.brand,
          item: i.description,
          category: i.trade || r.trade,
          unit: i.unit,
          mrp: i.rate,
        }));
      return { got, name: file.name };
    },
    onSuccess: ({ got, name }) => {
      setLines([...L, ...got]);
      setSources([...S, name]);
      toast.success(`${got.length} MRP lines read from ${name}. Check them, then Save.`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const importCsv = async (file: File) => {
    try {
      const got = parseCsv(await file.text());
      setLines([...L, ...got]);
      setSources([...S, file.name]);
      toast.success(`${got.length} MRP lines imported. Check them, then Save.`);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const matches = useMemo(() => matchBoq(boq.data ?? [], L, R), [boq.data, L, R]);
  const changed = matches.filter((x) => Math.abs(x.net - x.boq.rate) > 0.005);
  const sel = picked ?? new Set(changed.map((x) => x.boq.id));
  const effect = changed
    .filter((x) => sel.has(x.boq.id))
    .reduce((s, x) => s + (x.net - x.boq.rate) * (x.boq.quantity || 0), 0);

  const apply = useMutation({
    mutationFn: async () => {
      const todo = changed.filter((x) => sel.has(x.boq.id));
      for (const x of todo) {
        const note = `rate: MRP ${inr(x.line.mrp)}${x.rule ? ` − ${x.rule.pct}% (${x.rule.vendor})` : ""} · ${monthLabel(m)} list`;
        const { error } = await supabase
          .from("boq_items")
          .update({
            rate: x.net,
            ...(x.rule ? { supplier: x.rule.vendor } : {}),
            notes: note,
          } as never)
          .eq("id", x.boq.id);
        if (error) throw error;
      }
      return todo.length;
    },
    onSuccess: (n) => {
      toast.success(`${n} BOQ rates updated from the ${monthLabel(m)} MRP list`);
      setPicked(null);
      qc.invalidateQueries({ queryKey: ["mrp-boq", pid] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const dirty = lines !== null || rules !== null || sources !== null;
  const input = "w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm";

  return (
    <Shell title="MRP Rates & Discounts">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 p-4">
        <header className="rounded-2xl border border-border bg-card p-5">
          <p className="label-caps text-primary">Material cost basis</p>
          <h1 className="text-2xl font-extrabold">MRP rates and your discounts</h1>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            1 · Each month, upload the manufacturers' MRP price lists (PDF or photo, read by the
            app) or import a CSV. 2 · Enter the discount on MRP each vendor gives you, by brand or
            category. 3 · Net rate = MRP − your discount, and it becomes the material rate in your{" "}
            <Link to="/boq-engine" className="text-primary underline">
              BOQ
            </Link>
            .
          </p>
          {stale && (
            <p className="mt-3 flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              {latest
                ? `MRPs were last updated for ${monthLabel(latest)}. Upload the ${monthLabel(thisMonth())} price lists so your BOQ follows this month's rates.`
                : "No MRP list yet. Upload this month's price lists to start."}
            </p>
          )}
          {ai === false && (
            <p className="mt-3 flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" /> {AI_OFF_REASON} CSV import and
              typing the lines work without it.
            </p>
          )}
        </header>

        {/* Step 1: MRP list for the month */}
        <section className="rounded-2xl border border-border bg-card p-4">
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <p className="label-caps text-muted-foreground">1 · MRP list for</p>
              <input
                type="month"
                value={m}
                onChange={(e) => e.target.value && pickMonth(e.target.value)}
                className="mt-1 rounded-md border border-border bg-background px-2 py-1.5 text-sm"
              />
            </div>
            {lib.data?.months.length ? (
              <p className="text-xs text-muted-foreground">
                Saved months: {lib.data.months.map(monthLabel).join(" · ")}
              </p>
            ) : null}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground">
              <FileUp className="size-4" />
              {readList.isPending ? "Reading…" : "Upload price list (PDF / photo)"}
              <input
                type="file"
                accept="application/pdf,image/*"
                className="hidden"
                disabled={readList.isPending || ai === false}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) readList.mutate(f);
                  e.target.value = "";
                }}
              />
            </label>
            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-semibold">
              <Upload className="size-4" /> Import CSV
              <input
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) importCsv(f);
                  e.target.value = "";
                }}
              />
            </label>
            <button
              type="button"
              onClick={() => {
                const a = document.createElement("a");
                a.href = URL.createObjectURL(new Blob([CSV_TEMPLATE], { type: "text/csv" }));
                a.download = "mrp-price-list-template.csv";
                a.click();
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm"
            >
              <Download className="size-4" /> CSV template
            </button>
            <button
              type="button"
              onClick={() => setLines([...L, emptyLine()])}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm"
            >
              <Plus className="size-4" /> Add line
            </button>
          </div>
          {S.length > 0 && (
            <p className="mt-2 text-xs text-muted-foreground">From: {S.join(", ")}</p>
          )}

          {L.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">
              No MRP lines for {monthLabel(m)} yet.
            </p>
          ) : (
            <div className="mt-4 flex flex-col gap-2">
              {L.map((l) => {
                const r = discountFor(l, R);
                return (
                  <div key={l.id} className="rounded-xl border border-border p-3">
                    <div className="flex flex-wrap gap-2 [&>*]:min-w-[8rem] [&>*]:flex-1">
                      <input
                        className={input}
                        placeholder="Brand"
                        value={l.brand}
                        onChange={(e) => editLine(l.id, { brand: e.target.value })}
                      />
                      <input
                        className={`${input} !min-w-[14rem] !flex-[3]`}
                        placeholder="Item"
                        value={l.item}
                        onChange={(e) => editLine(l.id, { item: e.target.value })}
                      />
                      <input
                        className={input}
                        placeholder="Category"
                        value={l.category}
                        onChange={(e) => editLine(l.id, { category: e.target.value })}
                      />
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2 [&>input]:min-w-[6rem] [&>input]:flex-1">
                      <input
                        className={input}
                        placeholder="Code"
                        value={l.item_code}
                        onChange={(e) => editLine(l.id, { item_code: e.target.value })}
                      />
                      <input
                        className={input}
                        placeholder="Unit"
                        value={l.unit}
                        onChange={(e) => editLine(l.id, { unit: e.target.value })}
                      />
                      <input
                        className={input}
                        type="number"
                        placeholder="MRP ₹"
                        value={l.mrp || ""}
                        onChange={(e) => editLine(l.id, { mrp: Number(e.target.value) || 0 })}
                      />
                      <p className="shrink-0 text-sm">
                        Net{" "}
                        <span className="font-semibold tnum">
                          {inr(netRate(l.mrp, r?.pct ?? 0))}
                        </span>
                        {r && (
                          <span className="text-muted-foreground">
                            {" "}
                            · −{r.pct}% {r.vendor}
                          </span>
                        )}
                      </p>
                      <button
                        type="button"
                        aria-label="Remove line"
                        onClick={() => setLines(L.filter((x) => x.id !== l.id))}
                        className="shrink-0 rounded p-1.5 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Step 2: discounts */}
        <section className="rounded-2xl border border-border bg-card p-4">
          <p className="label-caps text-muted-foreground">2 · Your discount on MRP</p>
          <p className="mt-1 text-sm text-muted-foreground">
            From each vendor's price terms. Leave brand or category blank to apply to all. Where
            several apply, the best discount is used.
          </p>
          <div className="mt-3 flex flex-col gap-2">
            {R.map((r) => (
              <div
                key={r.id}
                className="flex flex-wrap items-center gap-2 rounded-xl border border-border p-2 [&>input]:min-w-[7rem] [&>input]:flex-1"
              >
                <input
                  className={input}
                  placeholder="Vendor"
                  value={r.vendor}
                  onChange={(e) => editRule(r.id, { vendor: e.target.value })}
                />
                <input
                  className={input}
                  placeholder="Brand (any)"
                  value={r.brand}
                  onChange={(e) => editRule(r.id, { brand: e.target.value })}
                />
                <input
                  className={input}
                  placeholder="Category (any)"
                  value={r.category}
                  onChange={(e) => editRule(r.id, { category: e.target.value })}
                />
                <input
                  className={`${input} !min-w-[5rem] !max-w-[7rem]`}
                  type="number"
                  placeholder="% off"
                  value={r.pct || ""}
                  onChange={(e) => editRule(r.id, { pct: Number(e.target.value) || 0 })}
                />
                <button
                  type="button"
                  aria-label="Remove discount"
                  onClick={() => setRules(R.filter((x) => x.id !== r.id))}
                  className="rounded p-1.5 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setRules([...R, emptyRule()])}
              className="inline-flex w-fit items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm"
            >
              <Plus className="size-4" /> Add discount
            </button>
          </div>
          <button
            type="button"
            disabled={!dirty || save.isPending}
            onClick={() => save.mutate()}
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
          >
            <Save className="size-4" />{" "}
            {save.isPending ? "Saving…" : `Save ${monthLabel(m)} list and discounts`}
          </button>
        </section>

        {/* Step 3: apply to BOQ */}
        <section className="rounded-2xl border border-border bg-card p-4">
          <p className="label-caps text-muted-foreground">3 · Net rates into your BOQ</p>
          <p className="mt-1 text-sm text-muted-foreground">
            BOQ lines are matched by item code, or by the same brand and item name in the same unit.{" "}
            {matches.length} of {boq.data?.length ?? 0} BOQ lines match this list; {changed.length}{" "}
            would change.
          </p>
          {changed.length > 0 && (
            <>
              <div className="mt-3 flex flex-col divide-y divide-border rounded-xl border border-border">
                {changed.map((x) => (
                  <label key={x.boq.id} className="flex cursor-pointer items-start gap-3 p-3">
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={sel.has(x.boq.id)}
                      onChange={(e) => {
                        const n = new Set(sel);
                        if (e.target.checked) n.add(x.boq.id);
                        else n.delete(x.boq.id);
                        setPicked(n);
                      }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{x.boq.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {x.boq.stage} · {x.boq.brand} · matched by {x.how} · MRP {inr(x.line.mrp)}
                        {x.rule ? ` − ${x.rule.pct}% (${x.rule.vendor})` : " · no discount set"}
                      </p>
                    </div>
                    <p className="shrink-0 text-right text-sm tnum">
                      <span className="text-muted-foreground line-through">{inr(x.boq.rate)}</span>
                      <br />
                      <span className="font-semibold">{inr(x.net)}</span>
                    </p>
                  </label>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  disabled={!sel.size || apply.isPending || dirty}
                  onClick={() => apply.mutate()}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
                >
                  <CheckCircle2 className="size-4" />
                  {apply.isPending ? "Updating…" : `Update ${sel.size} BOQ rates`}
                </button>
                <p className="text-sm">
                  Effect on BOQ:{" "}
                  <span
                    className={
                      effect <= 0
                        ? "font-semibold text-emerald-700"
                        : "font-semibold text-amber-700"
                    }
                  >
                    {effect <= 0 ? "−" : "+"}
                    {inr(Math.abs(Math.round(effect)))}
                  </span>
                </p>
                {dirty && <p className="text-xs text-muted-foreground">Save the list first.</p>}
              </div>
            </>
          )}
        </section>
      </div>
    </Shell>
  );
}
