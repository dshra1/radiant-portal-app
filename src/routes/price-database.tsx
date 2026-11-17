import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Download,
  FileUp,
  Globe,
  Plus,
  RefreshCw,
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
import { readPriceList, type ReadList } from "@/lib/price-db.functions";
import {
  BUCKET,
  CSV_TEMPLATE,
  DUE_DAYS,
  LIB,
  STARTER_BRANDS,
  daysSince,
  discountFor,
  emptyRule,
  matchBoq,
  netExGst,
  parseCsv,
  slug,
  uid,
  type Brand,
  type BoqRow,
  type DiscountRule,
  type GstBasis,
  type PriceList,
} from "@/lib/price-db";

export const Route = createFileRoute("/price-database")({
  head: () => ({
    meta: [
      { title: "Price Database | SiteYantra" },
      {
        name: "description",
        content:
          "Brands' MRP price lists pulled from the internet or uploaded from dealers, with list number, effective date and GST basis; your vendor discounts on top; net rates into the BOQ.",
      },
    ],
  }),
  component: Page,
});

const inr = (n: number) => `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
const fmtDate = (iso: string) =>
  iso
    ? new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    : "";
const GST_LABEL: Record<GstBasis, string> = {
  incl: "MRP incl. GST",
  excl: "GST extra",
  unknown: "GST basis not stated",
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

function Page() {
  const project = useActiveProject();
  const pid = project.id;
  const user = useSessionUser();
  const qc = useQueryClient();
  const ai = useAiConfigured();
  const read = useServerFn(readPriceList);
  const [rules, setRules] = useState<DiscountRule[] | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [picked, setPicked] = useState<Set<string> | null>(null);
  const [newBrand, setNewBrand] = useState({ brand: "", category: "" });

  const db = useQuery({
    queryKey: ["price-db"],
    queryFn: async () => {
      const brands = (await readJson<{ brands: Brand[] }>(`${LIB}/brands.json`))?.brands ?? [];
      const disc =
        (await readJson<{ rules: DiscountRule[] }>(`${LIB}/discounts.json`))?.rules ?? [];
      const latest: Record<string, PriceList> = {};
      const versions: Record<string, number> = {};
      await Promise.all(
        brands.map(async (b) => {
          const ls = await supabase.storage.from(BUCKET).list(`${LIB}/lists/${b.id}`, {
            limit: 200,
            sortBy: { column: "name", order: "desc" },
          });
          const files = (ls.data ?? []).filter((f) => f.name.endsWith(".json"));
          versions[b.id] = files.length;
          if (files[0]) {
            const l = await readJson<PriceList>(`${LIB}/lists/${b.id}/${files[0].name}`);
            if (l) latest[b.id] = l;
          }
        }),
      );
      return { brands, rules: disc, latest, versions };
    },
  });
  const brands = db.data?.brands ?? [];
  const latest = db.data?.latest ?? {};
  const R = rules ?? db.data?.rules ?? [];
  const refresh = () => qc.invalidateQueries({ queryKey: ["price-db"] });

  const saveBrands = async (next: Brand[]) => {
    await putJson(`${LIB}/brands.json`, { brands: next });
    refresh();
  };

  const storeList = async (b: Brand, r: ReadList, source: string, gstOverride?: GstBasis) => {
    if (!r.lines.length) throw new Error("No priced lines were found");
    const list: PriceList = {
      id: uid(),
      brandId: b.id,
      brand: b.brand,
      listNo: r.listNo,
      effective: r.effective,
      gst: r.gst !== "unknown" ? r.gst : (gstOverride ?? "unknown"),
      source,
      fetchedAt: new Date().toISOString(),
      lines: r.lines.map((l) => ({ ...l, id: uid(), category: l.category || b.category })),
    };
    await putJson(`${LIB}/lists/${b.id}/${Date.now()}.json`, list);
    return list;
  };

  const fetchSource = async (b: Brand, url: string, gst: GstBasis) => {
    setBusy(`${b.id}:${url}`);
    try {
      const r = await read({ data: { url, brand: b.brand } });
      const l = await storeList(b, r, url, gst);
      toast.success(
        `${b.brand}: ${l.lines.length} MRP lines${l.listNo ? ` · ${l.listNo}` : ""}${r.partial ? " (long list: first part read)" : ""}`,
      );
      refresh();
    } catch (e) {
      toast.error(`${b.brand}: ${(e as Error).message}`);
    } finally {
      setBusy(null);
    }
  };

  const uploadList = async (b: Brand, file: File) => {
    setBusy(`${b.id}:upload`);
    try {
      if (file.name.toLowerCase().endsWith(".csv")) {
        const lines = parseCsv(await file.text());
        const l = await storeList(
          b,
          { listNo: "", effective: "", gst: "unknown", partial: false, lines },
          file.name,
        );
        toast.success(`${b.brand}: ${l.lines.length} lines imported from CSV`);
      } else {
        const mediaType =
          file.type ||
          (file.name.toLowerCase().endsWith(".pdf") ? "application/pdf" : "image/jpeg");
        const storagePath = `${user?.id ?? "anon"}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
        const up = await supabase.storage
          .from("price-proformas")
          .upload(storagePath, file, { contentType: mediaType, upsert: true });
        if (up.error) throw new Error(`Upload failed: ${up.error.message}`);
        const r = await read({
          data: { storagePath, fileName: file.name, mediaType, brand: b.brand },
        });
        const l = await storeList(b, r, file.name);
        toast.success(`${b.brand}: ${l.lines.length} MRP lines read from ${file.name}`);
      }
      refresh();
    } catch (e) {
      toast.error(`${b.brand}: ${(e as Error).message}`);
    } finally {
      setBusy(null);
    }
  };

  const due = brands.filter(
    (b) => b.sources.length && daysSince(latest[b.id]?.fetchedAt ?? "") > DUE_DAYS,
  );
  const refreshDue = async () => {
    for (const b of due) for (const s of b.sources) await fetchSource(b, s.url, s.gst);
  };

  const saveRules = useMutation({
    mutationFn: () =>
      putJson(`${LIB}/discounts.json`, { rules: R.filter((r) => r.vendor.trim() && r.pct > 0) }),
    onSuccess: () => {
      toast.success("Discounts saved");
      setRules(null);
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // BOQ of the active project
  const boq = useQuery({
    queryKey: ["pdb-boq", pid],
    enabled: Boolean(pid),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("boq_items")
        .select("id,item_code,description,brand,category,unit,quantity,rate,gst_pct,stage")
        .eq("project_id", pid)
        .limit(5000);
      if (error) throw error;
      return (data ?? []) as BoqRow[];
    },
  });
  const lists = Object.values(latest);
  const matches = useMemo(() => matchBoq(boq.data ?? [], lists, R), [boq.data, lists, R]);
  const changed = matches.filter((x) => Math.abs(x.net - x.boq.rate) > 0.005);
  const sel = picked ?? new Set(changed.map((x) => x.boq.id));
  const effect = changed
    .filter((x) => sel.has(x.boq.id))
    .reduce((s, x) => s + (x.net - x.boq.rate) * (x.boq.quantity || 0), 0);
  const apply = useMutation({
    mutationFn: async () => {
      const todo = changed.filter((x) => sel.has(x.boq.id));
      for (const x of todo) {
        const note = `rate: ${x.list.brand} MRP ${inr(x.line.mrp)}${x.list.gst === "incl" ? " incl. GST" : ""}${x.list.listNo ? ` (${x.list.listNo}${x.list.effective ? `, eff. ${fmtDate(x.list.effective)}` : ""})` : ""}${x.rule ? ` − ${x.rule.pct}% ${x.rule.vendor}` : ""}, ex-GST`;
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
      toast.success(`${n} BOQ rates updated from the price database`);
      setPicked(null);
      qc.invalidateQueries({ queryKey: ["pdb-boq", pid] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const input = "w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm";
  const btn =
    "inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm disabled:opacity-50";

  return (
    <Shell title="Price Database">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 p-4">
        <header className="rounded-2xl border border-border bg-card p-5">
          <p className="label-caps text-primary">Material cost basis · shared by all projects</p>
          <h1 className="text-2xl font-extrabold">Price Database</h1>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            Pull each brand's MRP price list from the internet, or upload your dealer's copy. The
            app reads the list number, effective date, GST basis and every product's MRP. Your
            vendor discounts apply on top, and the net rates (ex-GST) become the material rates in
            your{" "}
            <Link to="/boq-engine" className="text-primary underline">
              BOQ
            </Link>
            .
          </p>
          {ai === false && (
            <p className="mt-3 flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" /> {AI_OFF_REASON} CSV import works
              without it.
            </p>
          )}
          {due.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
              <span>
                {due.length} brand{due.length > 1 ? "s" : ""} not checked in {DUE_DAYS} days:{" "}
                {due.map((b) => b.brand).join(", ")}
              </span>
              <button
                type="button"
                disabled={Boolean(busy) || ai === false}
                onClick={refreshDue}
                className={`${btn} border-amber-300 bg-white`}
              >
                <RefreshCw className="size-4" /> Fetch latest lists
              </button>
            </div>
          )}
        </header>

        {/* Brands */}
        <section className="rounded-2xl border border-border bg-card p-4">
          <p className="label-caps text-muted-foreground">1 · Brands and their price lists</p>
          {brands.length === 0 && !db.isLoading && (
            <div className="mt-3 rounded-xl border border-dashed border-border p-4 text-sm">
              <p>
                No brands yet. Start with the common ones: the register notes how each brand
                publishes its MRPs.
              </p>
              <button
                type="button"
                onClick={() =>
                  saveBrands(STARTER_BRANDS).then(() => toast.success("Starter brands added"))
                }
                className="mt-2 rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground"
              >
                Add starter brands
              </button>
            </div>
          )}
          <div className="mt-3 flex flex-col gap-3">
            {brands.map((b) => {
              const l = latest[b.id];
              const age = daysSince(l?.fetchedAt ?? "");
              const isOpen = open === b.id;
              return (
                <div key={b.id} className="rounded-xl border border-border p-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold">
                        {b.brand}{" "}
                        <span className="text-sm font-normal text-muted-foreground">
                          · {b.category}
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground">{b.how}</p>
                    </div>
                    {l ? (
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${age > DUE_DAYS ? "bg-amber-100 text-amber-900" : "bg-emerald-50 text-emerald-800"}`}
                      >
                        {age > DUE_DAYS ? `Checked ${age} days ago` : "Up to date"}
                      </span>
                    ) : (
                      <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs text-foreground/70">
                        No list yet
                      </span>
                    )}
                  </div>
                  {l && (
                    <p className="mt-2 text-sm">
                      <span className="font-medium">{l.listNo || "Price list"}</span>
                      {l.effective && <> · effective {fmtDate(l.effective)}</>} · {l.lines.length}{" "}
                      products · {GST_LABEL[l.gst]} · read {fmtDate(l.fetchedAt)}
                      {db.data?.versions[b.id] ? (
                        <span className="text-muted-foreground">
                          {" "}
                          · {db.data.versions[b.id]} version
                          {(db.data.versions[b.id] ?? 0) > 1 ? "s" : ""} kept
                        </span>
                      ) : null}
                    </p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-2">
                    {b.sources.map((s) => (
                      <span key={s.id} className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          disabled={Boolean(busy) || ai === false}
                          onClick={() => fetchSource(b, s.url, s.gst)}
                          className={btn}
                          title={s.url}
                        >
                          <Globe className="size-4" />{" "}
                          {busy === `${b.id}:${s.url}` ? "Reading…" : `Fetch: ${s.label}`}
                        </button>
                        <button
                          type="button"
                          aria-label="Remove link"
                          onClick={() =>
                            saveBrands(
                              brands.map((x) =>
                                x.id === b.id
                                  ? { ...x, sources: x.sources.filter((y) => y.id !== s.id) }
                                  : x,
                              ),
                            )
                          }
                          className="rounded p-1 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </span>
                    ))}
                    <label className={`${btn} cursor-pointer`}>
                      <FileUp className="size-4" />{" "}
                      {busy === `${b.id}:upload` ? "Reading…" : "Upload dealer list"}
                      <input
                        type="file"
                        accept="application/pdf,image/*,.csv"
                        className="hidden"
                        disabled={Boolean(busy)}
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) uploadList(b, f);
                          e.target.value = "";
                        }}
                      />
                    </label>
                    <AddSource
                      onAdd={(s) =>
                        saveBrands(
                          brands.map((x) =>
                            x.id === b.id ? { ...x, sources: [...x.sources, s] } : x,
                          ),
                        )
                      }
                    />
                    {l && (
                      <button
                        type="button"
                        onClick={() => setOpen(isOpen ? null : b.id)}
                        className={btn}
                      >
                        <ChevronDown
                          className={`size-4 transition ${isOpen ? "rotate-180" : ""}`}
                        />{" "}
                        {isOpen ? "Hide" : "View"} prices
                      </button>
                    )}
                  </div>
                  {isOpen && l && <Lines list={l} rules={R} />}
                </div>
              );
            })}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2 [&>input]:min-w-[9rem] [&>input]:flex-1">
            <input
              className={input}
              placeholder="Add a brand (e.g. Havells)"
              value={newBrand.brand}
              onChange={(e) => setNewBrand({ ...newBrand, brand: e.target.value })}
            />
            <input
              className={input}
              placeholder="Category (e.g. Electrical)"
              value={newBrand.category}
              onChange={(e) => setNewBrand({ ...newBrand, category: e.target.value })}
            />
            <button
              type="button"
              disabled={!newBrand.brand.trim()}
              onClick={() => {
                const id = slug(newBrand.brand);
                if (brands.some((x) => x.id === id)) {
                  toast.error("That brand is already in the register");
                  return;
                }
                saveBrands([
                  ...brands,
                  {
                    id,
                    brand: newBrand.brand.trim(),
                    category: newBrand.category.trim(),
                    how: "",
                    sources: [],
                  },
                ]).then(() => setNewBrand({ brand: "", category: "" }));
              }}
              className={btn}
            >
              <Plus className="size-4" /> Add brand
            </button>
            <button
              type="button"
              className={btn}
              onClick={() => {
                const a = document.createElement("a");
                a.href = URL.createObjectURL(new Blob([CSV_TEMPLATE], { type: "text/csv" }));
                a.download = "price-list-template.csv";
                a.click();
              }}
            >
              <Download className="size-4" /> CSV template
            </button>
          </div>
        </section>

        {/* Discounts */}
        <section className="rounded-2xl border border-border bg-card p-4">
          <p className="label-caps text-muted-foreground">2 · Your discount on MRP</p>
          <p className="mt-1 text-sm text-muted-foreground">
            From each vendor's terms. Leave brand or category blank to apply to all; the best
            matching discount is used.
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
                  onChange={(e) =>
                    setRules(R.map((x) => (x.id === r.id ? { ...x, vendor: e.target.value } : x)))
                  }
                />
                <input
                  className={input}
                  placeholder="Brand (any)"
                  value={r.brand}
                  onChange={(e) =>
                    setRules(R.map((x) => (x.id === r.id ? { ...x, brand: e.target.value } : x)))
                  }
                />
                <input
                  className={input}
                  placeholder="Category (any)"
                  value={r.category}
                  onChange={(e) =>
                    setRules(R.map((x) => (x.id === r.id ? { ...x, category: e.target.value } : x)))
                  }
                />
                <input
                  className={`${input} !min-w-[5rem] !max-w-[7rem]`}
                  type="number"
                  placeholder="% off"
                  value={r.pct || ""}
                  onChange={(e) =>
                    setRules(
                      R.map((x) =>
                        x.id === r.id ? { ...x, pct: Number(e.target.value) || 0 } : x,
                      ),
                    )
                  }
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
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => setRules([...R, emptyRule()])} className={btn}>
                <Plus className="size-4" /> Add discount
              </button>
              <button
                type="button"
                disabled={rules === null || saveRules.isPending}
                onClick={() => saveRules.mutate()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
              >
                <Save className="size-4" /> Save discounts
              </button>
            </div>
          </div>
        </section>

        {/* Apply to BOQ */}
        <section className="rounded-2xl border border-border bg-card p-4">
          <p className="label-caps text-muted-foreground">
            3 · Net rates into the BOQ · {project.name}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Matched by product code, or same brand and product name in the same unit.{" "}
            {matches.length} of {boq.data?.length ?? 0} BOQ lines match; {changed.length} would
            change.
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
                        {x.list.brand} MRP {inr(x.line.mrp)} ({GST_LABEL[x.list.gst]})
                        {x.rule ? ` − ${x.rule.pct}% ${x.rule.vendor}` : " · no discount set"} · by{" "}
                        {x.how}
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
                  disabled={!sel.size || apply.isPending || rules !== null}
                  onClick={() => apply.mutate()}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
                >
                  <CheckCircle2 className="size-4" />{" "}
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
                {rules !== null && (
                  <p className="text-xs text-muted-foreground">Save the discounts first.</p>
                )}
              </div>
            </>
          )}
        </section>
      </div>
    </Shell>
  );
}

function AddSource({
  onAdd,
}: {
  onAdd: (s: { id: string; label: string; url: string; gst: GstBasis }) => void;
}) {
  const [show, setShow] = useState(false);
  const [s, setS] = useState({ label: "", url: "", gst: "unknown" as GstBasis });
  if (!show)
    return (
      <button
        type="button"
        onClick={() => setShow(true)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-border px-3 py-1.5 text-sm"
      >
        <Plus className="size-4" /> Add link
      </button>
    );
  const input = "rounded-md border border-border bg-background px-2 py-1.5 text-sm";
  return (
    <div className="flex w-full flex-wrap items-center gap-2 rounded-lg bg-muted/50 p-2 [&>input]:min-w-[8rem] [&>input]:flex-1">
      <input
        className={input}
        placeholder="Label (e.g. Wires LP 04/2026-27)"
        value={s.label}
        onChange={(e) => setS({ ...s, label: e.target.value })}
      />
      <input
        className={`${input} !flex-[2]`}
        placeholder="https://… price list PDF or product page"
        value={s.url}
        onChange={(e) => setS({ ...s, url: e.target.value })}
      />
      <select
        className={input}
        value={s.gst}
        onChange={(e) => setS({ ...s, gst: e.target.value as GstBasis })}
      >
        <option value="unknown">GST basis: as printed</option>
        <option value="incl">MRP includes GST</option>
        <option value="excl">GST extra</option>
      </select>
      <button
        type="button"
        disabled={!/^https?:\/\//.test(s.url)}
        onClick={() => {
          onAdd({ id: uid(), label: s.label || new URL(s.url).hostname, url: s.url, gst: s.gst });
          setShow(false);
          setS({ label: "", url: "", gst: "unknown" });
        }}
        className="rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
      >
        <Upload className="mr-1 inline size-4" /> Save link
      </button>
    </div>
  );
}

function Lines({ list, rules }: { list: PriceList; rules: DiscountRule[] }) {
  const [q, setQ] = useState("");
  const shown = list.lines
    .filter((l) => `${l.item_code} ${l.item} ${l.category}`.toLowerCase().includes(q.toLowerCase()))
    .slice(0, 80);
  return (
    <div className="mt-3">
      <input
        className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm"
        placeholder={`Search ${list.lines.length} products`}
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <div className="mt-2 flex flex-col divide-y divide-border rounded-lg border border-border">
        {shown.map((l) => {
          const r = discountFor(list.brand, l.category, rules);
          return (
            <div key={l.id} className="flex items-start gap-3 p-2 text-sm">
              <div className="min-w-0 flex-1">
                <p>{l.item}</p>
                <p className="text-xs text-muted-foreground">
                  {[l.item_code, l.category, l.unit && `per ${l.unit}`].filter(Boolean).join(" · ")}
                </p>
              </div>
              <p className="shrink-0 text-right tnum">
                MRP {inr(l.mrp)}
                <br />
                <span className="text-xs text-muted-foreground">
                  net {inr(netExGst(l.mrp, list.gst, l.gst_pct, r?.pct ?? 0))} ex-GST
                  {r ? ` (−${r.pct}%)` : ""}
                </span>
              </p>
            </div>
          );
        })}
        {list.lines.length > shown.length && (
          <p className="p-2 text-xs text-muted-foreground">
            Showing {shown.length} of {list.lines.length}. Search to find others.
          </p>
        )}
      </div>
    </div>
  );
}
