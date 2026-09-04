import { createFileRoute } from "@tanstack/react-router";
import { Shell } from "@/components/saha/Shell";
import { useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { generateBoqEstimate } from "@/lib/boq.functions";
import { inr, inrCompact, num } from "@/data/saha";
import { Download, Plus, RefreshCw, Sparkles, Trash2, Upload } from "lucide-react";

export const Route = createFileRoute("/boq-engine")({
  head: () => ({
    meta: [
      { title: "BOQ Master Engine — AI Project Estimate | Saha OS" },
      {
        name: "description",
        content:
          "Generate a complete stage-wise BOQ estimate from project inputs before drawings arrive, then upload, edit and export every trade line item.",
      },
      { property: "og:title", content: "BOQ Master Engine — AI Project Estimate | Saha OS" },
      {
        property: "og:description",
        content:
          "AI pre-drawing cost estimation from site preparation to handover, fully editable and uploadable.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

type BoqRow = {
  id: string;
  project_id: string;
  stage: string;
  category: string;
  item_code: string;
  description: string;
  unit: string;
  quantity: number | string;
  rate: number | string;
  brand: string;
  supplier: string;
  notes: string;
  source: string;
  sort_order: number;
};

const CSV_HEADERS = [
  "stage",
  "category",
  "item_code",
  "description",
  "unit",
  "quantity",
  "rate",
  "brand",
  "supplier",
  "notes",
];

function csvEscape(value: unknown) {
  const s = String(value ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i++;
        } else quoted = false;
      } else cell += ch;
      continue;
    }
    if (ch === '"') quoted = true;
    else if (ch === ",") {
      row.push(cell);
      cell = "";
    } else if (ch === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else if (ch !== "\r") cell += ch;
  }
  if (cell.length || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

function toNum(v: unknown) {
  const n = Number(String(v ?? "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function download(name: string, content: string, mime = "text/csv;charset=utf-8") {
  const url = URL.createObjectURL(new Blob([content], { type: mime }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

function Page() {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [projectId, setProjectId] = useState<string>("");
  const [stage, setStage] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("");
  const [brief, setBrief] = useState("");
  const generate = useServerFn(generateBoqEstimate);

  const projectsQuery = useQuery({
    queryKey: ["site_projects", "boq-engine"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_projects")
        .select("id,name,location,type,target_budget,total_built_up_sft")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const projects = projectsQuery.data ?? [];
  const activeId = projectId || projects[0]?.id || "";
  const activeProject = projects.find((p) => p.id === activeId);

  const itemsQuery = useQuery({
    queryKey: ["boq_items", activeId],
    enabled: Boolean(activeId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("boq_items")
        .select("*")
        .eq("project_id", activeId)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as BoqRow[];
    },
  });

  const items = itemsQuery.data ?? [];

  const refresh = async () => {
    await qc.invalidateQueries({ queryKey: ["boq_items", activeId] });
  };

  const generateMutation = useMutation({
    mutationFn: async () => generate({ data: { projectId: activeId, extraBrief: brief } }),
    onSuccess: async (res) => {
      setStatus(`AI estimate ready — ${res.inserted} line items generated.`);
      await refresh();
    },
    onError: (e: Error) => setStatus(`Generation failed: ${e.message}`),
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      patch,
    }: {
      id: string;
      patch: {
        category?: string;
        description?: string;
        unit?: string;
        quantity?: number;
        rate?: number;
        brand?: string;
        supplier?: string;
        stage?: string;
      };
    }) => {
      const { error } = await supabase.from("boq_items").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: refresh,
    onError: (e: Error) => setStatus(`Save failed: ${e.message}`),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("boq_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: refresh,
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("boq_items").insert({
        project_id: activeId,
        stage: stage === "ALL" ? "Stage 01: Site Preparation & Enabling Works" : stage,
        category: "General",
        item_code: `MAN-${String(items.length + 1).padStart(4, "0")}`,
        description: "New line item",
        unit: "NOS",
        quantity: 0,
        rate: 0,
        source: "manual",
        sort_order: items.length,
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      setStatus("Line item added — edit it inline.");
      await refresh();
    },
    onError: (e: Error) => setStatus(`Add failed: ${e.message}`),
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const rows = parseCsv(await file.text());
      if (rows.length < 2) throw new Error("CSV has no data rows");
      const header = rows[0]!.map((h) => h.trim().toLowerCase().replace(/\s+/g, "_"));
      const idx = (key: string) => header.indexOf(key);
      const payload = rows.slice(1).map((r, i) => ({
        project_id: activeId,
        stage: (r[idx("stage")] ?? "Uploaded Items").trim() || "Uploaded Items",
        category: (r[idx("category")] ?? "").trim(),
        item_code: (r[idx("item_code")] ?? `UPL-${String(i + 1).padStart(4, "0")}`).trim(),
        description: (r[idx("description")] ?? "").trim(),
        unit: (r[idx("unit")] ?? "NOS").trim(),
        quantity: toNum(r[idx("quantity")]),
        rate: toNum(r[idx("rate")]),
        brand: (r[idx("brand")] ?? "").trim(),
        supplier: (r[idx("supplier")] ?? "").trim(),
        notes: (r[idx("notes")] ?? "").trim(),
        source: "upload",
        sort_order: items.length + i,
      }));
      const chunk = 400;
      for (let i = 0; i < payload.length; i += chunk) {
        const { error } = await supabase.from("boq_items").insert(payload.slice(i, i + chunk));
        if (error) throw error;
      }
      return payload.length;
    },
    onSuccess: async (count) => {
      setStatus(`Uploaded ${count} line items.`);
      await refresh();
    },
    onError: (e: Error) => setStatus(`Upload failed: ${e.message}`),
  });

  const stages = useMemo(() => {
    const map = new Map<string, number>();
    for (const it of items) map.set(it.stage, (map.get(it.stage) ?? 0) + 1);
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [items]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter(
      (it) =>
        (stage === "ALL" || it.stage === stage) &&
        (q === "" ||
          `${it.description} ${it.category} ${it.brand} ${it.supplier} ${it.item_code}`
            .toLowerCase()
            .includes(q)),
    );
  }, [items, stage, search]);

  const lineTotal = (it: BoqRow) => toNum(it.quantity) * toNum(it.rate);
  const grandTotal = items.reduce((s, it) => s + lineTotal(it), 0);
  const viewTotal = visible.reduce((s, it) => s + lineTotal(it), 0);
  const budget = toNum(activeProject?.target_budget);
  const perSft = toNum(activeProject?.total_built_up_sft) > 0
    ? grandTotal / toNum(activeProject?.total_built_up_sft)
    : 0;

  const exportCsv = (scope: "view" | "all") => {
    const rows = scope === "view" ? visible : items;
    const body = rows.map((it) => [
      it.stage,
      it.category,
      it.item_code,
      it.description,
      it.unit,
      toNum(it.quantity),
      toNum(it.rate),
      it.brand,
      it.supplier,
      it.notes,
    ]);
    const csv = [
      [...CSV_HEADERS, "amount"].join(","),
      ...body.map((r, i) => [...r, lineTotal(rows[i]!)].map(csvEscape).join(",")),
    ].join("\n");
    download(`${activeProject?.name ?? "project"}-boq-${scope}.csv`, csv);
  };

  const tile = "rounded-xl border border-border bg-card p-3";

  return (
    <Shell title="BOQ Master Engine">
      <div className="flex flex-col gap-4">
        <header className="rounded-xl border border-border bg-card p-4">
          <h1 className="text-lg font-bold uppercase tracking-tight text-foreground">
            BOQ Master Engine
          </h1>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            Pre-drawing AI cost estimation — site preparation through handover — generated from the
            project inputs you saved. Every line item is editable, deletable and exportable, and you
            can upload your own complete trade list at any time.
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <select
              value={activeId}
              onChange={(e) => {
                setProjectId(e.target.value);
                setStage("ALL");
              }}
              className="h-9 rounded border border-input bg-background px-2 text-sm"
            >
              {projects.length === 0 && <option value="">No projects yet</option>}
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {p.location}
                </option>
              ))}
            </select>

            <button
              disabled={!activeId || generateMutation.isPending}
              onClick={() => {
                setStatus("Generating full stage-wise estimate with Saha AI…");
                generateMutation.mutate();
              }}
              className="inline-flex h-9 items-center gap-2 rounded bg-primary px-3 text-sm font-semibold text-primary-foreground disabled:opacity-50"
            >
              <Sparkles className="size-4" />
              {generateMutation.isPending ? "Generating…" : "Generate AI estimate"}
            </button>

            <button
              disabled={!activeId}
              onClick={() => fileRef.current?.click()}
              className="inline-flex h-9 items-center gap-2 rounded border border-input bg-background px-3 text-sm font-medium disabled:opacity-50"
            >
              <Upload className="size-4" />
              {uploadMutation.isPending ? "Uploading…" : "Upload BOQ (CSV)"}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) uploadMutation.mutate(f);
                e.target.value = "";
              }}
            />

            <button
              onClick={() => download("saha-boq-template.csv", CSV_HEADERS.join(",") + "\n")}
              className="inline-flex h-9 items-center gap-2 rounded border border-input bg-background px-3 text-sm font-medium"
            >
              <Download className="size-4" />
              CSV template
            </button>

            <button
              disabled={items.length === 0}
              onClick={() => exportCsv("all")}
              className="inline-flex h-9 items-center gap-2 rounded border border-input bg-background px-3 text-sm font-medium disabled:opacity-50"
            >
              <Download className="size-4" />
              Export all
            </button>
            <button
              disabled={visible.length === 0}
              onClick={() => exportCsv("view")}
              className="inline-flex h-9 items-center gap-2 rounded border border-input bg-background px-3 text-sm font-medium disabled:opacity-50"
            >
              <Download className="size-4" />
              Export view
            </button>
            <button
              disabled={!activeId}
              onClick={() => addMutation.mutate()}
              className="inline-flex h-9 items-center gap-2 rounded border border-input bg-background px-3 text-sm font-medium disabled:opacity-50"
            >
              <Plus className="size-4" />
              Add line item
            </button>
            <button
              onClick={refresh}
              className="inline-flex h-9 items-center gap-2 rounded border border-input bg-background px-3 text-sm font-medium"
            >
              <RefreshCw className="size-4" />
              Refresh
            </button>
          </div>

          <textarea
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
            rows={2}
            placeholder="Optional estimating instructions for the AI — e.g. include lift & DG set, exclude external compound wall, premium bathroom fittings…"
            className="mt-3 w-full rounded border border-input bg-background p-2 text-sm"
          />

          {status && <p className="mt-2 text-sm font-medium text-primary">{status}</p>}
        </header>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          <div className={tile}>
            <span className="label-caps text-muted-foreground">Line items</span>
            <div className="metric-figure mt-1">{num(items.length)}</div>
          </div>
          <div className={tile}>
            <span className="label-caps text-muted-foreground">Estimated project cost</span>
            <div className="metric-figure mt-1 text-primary">{inrCompact(grandTotal)}</div>
          </div>
          <div className={tile}>
            <span className="label-caps text-muted-foreground">Target budget</span>
            <div className="metric-figure mt-1">{inrCompact(budget)}</div>
          </div>
          <div className={tile}>
            <span className="label-caps text-muted-foreground">Variance vs budget</span>
            <div
              className={`metric-figure mt-1 ${grandTotal > budget && budget > 0 ? "text-destructive" : "text-primary"}`}
            >
              {budget > 0 ? `${(((grandTotal - budget) / budget) * 100).toFixed(1)}%` : "—"}
            </div>
          </div>
          <div className={tile}>
            <span className="label-caps text-muted-foreground">Cost per sft</span>
            <div className="metric-figure mt-1">{perSft > 0 ? inr(Math.round(perSft)) : "—"}</div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setStage("ALL")}
              className={`h-8 rounded px-3 text-[13px] font-medium ${stage === "ALL" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}
            >
              All stages ({items.length})
            </button>
            {stages.map(([name, count]) => (
              <button
                key={name}
                onClick={() => setStage(name)}
                className={`h-8 rounded px-3 text-[13px] font-medium ${stage === name ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}
              >
                {name} ({count})
              </button>
            ))}
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search item, trade, brand…"
              className="ml-auto h-8 w-56 rounded border border-input bg-background px-2 text-sm"
            />
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between gap-3 border-b border-border px-3 py-2.5">
            <h2 className="text-sm font-semibold">
              {stage === "ALL" ? "All line items" : stage} — {visible.length} shown
            </h2>
            <span className="text-sm font-semibold text-primary">{inr(viewTotal)}</span>
          </div>

          <div className="overflow-x-auto">
            {itemsQuery.isLoading ? (
              <p className="p-6 text-sm text-muted-foreground">Loading BOQ…</p>
            ) : visible.length === 0 ? (
              <div className="p-6 text-sm text-muted-foreground">
                {items.length === 0
                  ? "No BOQ yet for this project. Click “Generate AI estimate” to build a complete stage-wise estimate from your project inputs, or upload your own trade list."
                  : "No line items match this stage or search."}
              </div>
            ) : (
              <table className="w-full min-w-[1100px] text-sm">
                <thead className="bg-secondary/60 text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-2 py-2">Stage / Trade</th>
                    <th className="px-2 py-2">Item</th>
                    <th className="px-2 py-2">Unit</th>
                    <th className="px-2 py-2 text-right">Qty</th>
                    <th className="px-2 py-2 text-right">Rate ₹</th>
                    <th className="px-2 py-2 text-right">Amount</th>
                    <th className="px-2 py-2">Brand / Supplier</th>
                    <th className="px-2 py-2">Basis</th>
                    <th className="px-2 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((it) => (
                    <tr key={it.id} className="border-t border-border align-top">
                      <td className="px-2 py-2">
                        <div className="text-[11px] font-semibold uppercase text-primary">
                          {it.stage.replace(/^Stage \d+:\s*/, "")}
                        </div>
                        <input
                          defaultValue={it.category}
                          onBlur={(e) =>
                            e.target.value !== it.category &&
                            updateMutation.mutate({ id: it.id, patch: { category: e.target.value } })
                          }
                          className="mt-1 w-32 rounded border border-transparent bg-transparent px-1 text-xs text-muted-foreground hover:border-input focus:border-input"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <textarea
                          defaultValue={it.description}
                          rows={2}
                          onBlur={(e) =>
                            e.target.value !== it.description &&
                            updateMutation.mutate({
                              id: it.id,
                              patch: { description: e.target.value },
                            })
                          }
                          className="w-72 rounded border border-transparent bg-transparent px-1 py-0.5 hover:border-input focus:border-input"
                        />
                        <div className="px-1 text-[11px] text-muted-foreground">{it.item_code}</div>
                      </td>
                      <td className="px-2 py-2">
                        <input
                          defaultValue={it.unit}
                          onBlur={(e) =>
                            e.target.value !== it.unit &&
                            updateMutation.mutate({ id: it.id, patch: { unit: e.target.value } })
                          }
                          className="w-16 rounded border border-transparent bg-transparent px-1 hover:border-input focus:border-input"
                        />
                      </td>
                      <td className="px-2 py-2 text-right">
                        <input
                          defaultValue={String(toNum(it.quantity))}
                          onBlur={(e) =>
                            updateMutation.mutate({
                              id: it.id,
                              patch: { quantity: toNum(e.target.value) },
                            })
                          }
                          className="w-24 rounded border border-input bg-background px-1 text-right tnum"
                        />
                      </td>
                      <td className="px-2 py-2 text-right">
                        <input
                          defaultValue={String(toNum(it.rate))}
                          onBlur={(e) =>
                            updateMutation.mutate({
                              id: it.id,
                              patch: { rate: toNum(e.target.value) },
                            })
                          }
                          className="w-24 rounded border border-input bg-background px-1 text-right tnum"
                        />
                      </td>
                      <td className="px-2 py-2 text-right font-semibold tnum">
                        {inr(lineTotal(it))}
                      </td>
                      <td className="px-2 py-2">
                        <input
                          defaultValue={it.brand}
                          onBlur={(e) =>
                            e.target.value !== it.brand &&
                            updateMutation.mutate({ id: it.id, patch: { brand: e.target.value } })
                          }
                          className="w-40 rounded border border-transparent bg-transparent px-1 hover:border-input focus:border-input"
                        />
                        <input
                          defaultValue={it.supplier}
                          onBlur={(e) =>
                            e.target.value !== it.supplier &&
                            updateMutation.mutate({ id: it.id, patch: { supplier: e.target.value } })
                          }
                          className="mt-1 w-40 rounded border border-transparent bg-transparent px-1 text-xs text-muted-foreground hover:border-input focus:border-input"
                        />
                      </td>
                      <td className="px-2 py-2 text-xs text-muted-foreground">
                        <div className="max-w-[220px]">{it.notes}</div>
                        <span className="mt-1 inline-block rounded bg-secondary px-1.5 py-0.5 text-[10px] uppercase">
                          {it.source}
                        </span>
                      </td>
                      <td className="px-2 py-2">
                        <button
                          onClick={() => deleteMutation.mutate(it.id)}
                          className="rounded p-1.5 text-destructive hover:bg-destructive-soft"
                          aria-label="Delete line item"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {stages.length > 0 && (
          <div className="rounded-xl border border-border bg-card p-3">
            <h2 className="mb-2 text-sm font-semibold">Stage-wise estimate roll-up</h2>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {stages.map(([name]) => {
                const total = items
                  .filter((it) => it.stage === name)
                  .reduce((s, it) => s + lineTotal(it), 0);
                const pct = grandTotal > 0 ? (total / grandTotal) * 100 : 0;
                return (
                  <div key={name} className="rounded border border-border p-2">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-xs font-semibold uppercase text-foreground">{name}</span>
                      <span className="text-sm font-semibold tnum text-primary">
                        {inrCompact(total)}
                      </span>
                    </div>
                    <div className="mt-1.5 h-1.5 rounded bg-secondary">
                      <div className="h-1.5 rounded bg-primary" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-[11px] text-muted-foreground">
                      {pct.toFixed(1)}% of estimate
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </Shell>
  );
}
