import { createFileRoute } from "@tanstack/react-router";
import { Shell } from "@/components/saha/Shell";
import { supabase } from "@/integrations/supabase/client";
import { useSessionUser } from "@/lib/access";
import { useActiveProject } from "@/hooks/useActiveProject";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { extractQuoteFromFile, type ExtractedQuote, type ExtractedQuoteItem } from "@/lib/price-ocr.functions";
import { Loader2, ScanText, Trash2, Upload, Download, Plus } from "lucide-react";

export const Route = createFileRoute("/price-ocr")({
  head: () => ({
    meta: [
      { title: "Price OCR — Proforma Scanning & Price Database | Saha OS" },
      {
        name: "description",
        content:
          "Upload vendor proformas and quotations, auto-extract item, brand, unit and rate lines, and build a searchable construction price database.",
      },
      { property: "og:title", content: "Price OCR — Proforma Scanning & Price Database | Saha OS" },
      {
        property: "og:description",
        content: "Scan vendor quotations into a searchable rate database for BOQ and purchase decisions.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

type QuoteRow = {
  id: string;
  vendor_name: string;
  vendor_gstin: string;
  vendor_contact: string;
  quote_ref: string;
  quote_date: string | null;
  trade: string;
  source_file: string;
  notes: string;
  created_at: string;
};

type ItemRow = {
  id: string;
  quote_id: string;
  item_code: string;
  description: string;
  brand: string;
  trade: string;
  unit: string;
  quantity: number;
  rate: number;
  discount_pct: number;
  gst_pct: number;
  net_rate: number;
};

const inputCls =
  "w-full rounded-lg border border-blue-200 bg-blue-50/60 px-2.5 py-1.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-400";

function netRate(i: { rate: number; discount_pct: number; gst_pct: number }) {
  return i.rate * (1 - (i.discount_pct || 0) / 100) * (1 + (i.gst_pct || 0) / 100);
}

function money(n: number) {
  return `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

function emptyItem(): ExtractedQuoteItem {
  return {
    item_code: "",
    description: "",
    brand: "",
    trade: "",
    unit: "",
    quantity: 0,
    rate: 0,
    discount_pct: 0,
    gst_pct: 18,
  };
}

function Page() {
  const user = useSessionUser();
  const project = useActiveProject();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const extract = useServerFn(extractQuoteFromFile);

  const [draft, setDraft] = useState<ExtractedQuote | null>(null);
  const [fileName, setFileName] = useState("");
  const [search, setSearch] = useState("");
  const [trade, setTrade] = useState("all");

  const { data: quotes = [] } = useQuery({
    queryKey: ["price_quotes"],
    enabled: Boolean(user?.id),
    queryFn: async (): Promise<QuoteRow[]> => {
      const { data, error } = await supabase
        .from("price_quotes")
        .select("id,vendor_name,vendor_gstin,vendor_contact,quote_ref,quote_date,trade,source_file,notes,created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as QuoteRow[];
    },
  });

  const { data: items = [], isPending } = useQuery({
    queryKey: ["price_quote_items"],
    enabled: Boolean(user?.id),
    queryFn: async (): Promise<ItemRow[]> => {
      const { data, error } = await supabase
        .from("price_quote_items")
        .select("id,quote_id,item_code,description,brand,trade,unit,quantity,rate,discount_pct,gst_pct,net_rate")
        .order("created_at", { ascending: false })
        .limit(1000);
      if (error) throw error;
      return (data ?? []).map((r) => ({ ...r, quantity: Number(r.quantity), rate: Number(r.rate), discount_pct: Number(r.discount_pct), gst_pct: Number(r.gst_pct), net_rate: Number(r.net_rate) })) as ItemRow[];
    },
  });

  const quoteById = useMemo(() => new Map(quotes.map((q) => [q.id, q])), [quotes]);

  const trades = useMemo(
    () => [...new Set(items.map((i) => i.trade || "Uncategorised"))].sort((a, b) => a.localeCompare(b)),
    [items],
  );

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((i) => {
      if (trade !== "all" && (i.trade || "Uncategorised") !== trade) return false;
      if (!q) return true;
      const vendor = quoteById.get(i.quote_id)?.vendor_name ?? "";
      return [i.description, i.brand, i.item_code, i.unit, vendor].join(" ").toLowerCase().includes(q);
    });
  }, [items, search, trade, quoteById]);

  const scan = useMutation({
    mutationFn: async (file: File) => {
      const buf = await file.arrayBuffer();
      let binary = "";
      const bytes = new Uint8Array(buf);
      for (let i = 0; i < bytes.length; i += 8192) {
        binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
      }
      return extract({
        data: {
          fileName: file.name,
          mediaType: file.type || (file.name.toLowerCase().endsWith(".pdf") ? "application/pdf" : "image/jpeg"),
          dataBase64: btoa(binary),
        },
      });
    },
    onSuccess: (result) => {
      setDraft(result.items.length ? result : { ...result, items: [emptyItem()] });
      toast.success(`${result.items.length} price line${result.items.length === 1 ? "" : "s"} read from the document`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const saveQuote = useMutation({
    mutationFn: async (q: ExtractedQuote) => {
      const rows = q.items.filter((i) => i.description.trim() || i.item_code.trim());
      if (!rows.length) throw new Error("Add at least one priced line before saving");
      const { data: inserted, error } = await supabase
        .from("price_quotes")
        .insert({
          project_id: project.id && project.id !== "fallback" ? project.id : null,
          vendor_name: q.vendor_name,
          vendor_gstin: q.vendor_gstin,
          vendor_contact: q.vendor_contact,
          quote_ref: q.quote_ref,
          quote_date: q.quote_date || null,
          trade: q.trade,
          source_file: fileName,
          notes: q.notes,
          created_by: user?.id ?? null,
        })
        .select("id")
        .single();
      if (error) throw error;
      const { error: itemErr } = await supabase.from("price_quote_items").insert(
        rows.map((i, idx) => ({
          quote_id: inserted.id,
          item_code: i.item_code,
          description: i.description,
          brand: i.brand,
          trade: i.trade || q.trade,
          unit: i.unit,
          quantity: i.quantity,
          rate: i.rate,
          discount_pct: i.discount_pct,
          gst_pct: i.gst_pct,
          net_rate: netRate(i),
          sort_order: idx,
        })),
      );
      if (itemErr) throw itemErr;
      return rows.length;
    },
    onSuccess: async (count) => {
      await queryClient.invalidateQueries({ queryKey: ["price_quotes"] });
      await queryClient.invalidateQueries({ queryKey: ["price_quote_items"] });
      setDraft(null);
      setFileName("");
      toast.success(`${count} price line${count === 1 ? "" : "s"} added to the price database`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeQuote = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("price_quotes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["price_quotes"] });
      await queryClient.invalidateQueries({ queryKey: ["price_quote_items"] });
      toast.success("Quotation removed");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function patchItem(idx: number, patch: Partial<ExtractedQuoteItem>) {
    setDraft((d) =>
      d ? { ...d, items: d.items.map((i, n) => (n === idx ? { ...i, ...patch } : i)) } : d,
    );
  }

  function exportDatabase() {
    const aoa = [
      ["Vendor", "Quote_Ref", "Quote_Date", "Trade", "Item_Code", "Description", "Brand", "Unit", "Qty", "Rate", "Discount_%", "GST_%", "Net_Rate"],
      ...visible.map((i) => {
        const q = quoteById.get(i.quote_id);
        return [
          q?.vendor_name ?? "",
          q?.quote_ref ?? "",
          q?.quote_date ?? "",
          i.trade,
          i.item_code,
          i.description,
          i.brand,
          i.unit,
          i.quantity,
          i.rate,
          i.discount_pct,
          i.gst_pct,
          Number(i.net_rate.toFixed(2)),
        ];
      }),
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(aoa), "Price Database");
    XLSX.writeFile(wb, "saha-price-database.xlsx");
  }

  return (
    <Shell title="Price OCR & Rate Database">
      <div className="mx-auto w-full max-w-[1400px] space-y-6 p-4 sm:p-6">
        <header>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Price OCR — Proforma Scanner</h1>
          <p className="mt-1 text-sm text-slate-500">
            Upload a vendor proforma, quotation or price list (photo or PDF). The app reads the vendor, items, units
            and rates, you confirm them, and they are saved into the shared price database.
          </p>
        </header>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <ScanText className="h-4 w-4 text-emerald-600" />
              Scan a proforma / quotation
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <input
                ref={fileRef}
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  e.target.value = "";
                  if (!file) return;
                  if (file.size > 20 * 1024 * 1024) {
                    toast.error("Please upload a file under 20 MB");
                    return;
                  }
                  setFileName(file.name);
                  scan.mutate(file);
                }}
              />
              <button
                type="button"
                disabled={scan.isPending}
                onClick={() => fileRef.current?.click()}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                {scan.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {scan.isPending ? "Reading document…" : "Upload proforma"}
              </button>
              <button
                type="button"
                onClick={exportDatabase}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <Download className="h-4 w-4" /> Export price database
              </button>
            </div>
          </div>
          {fileName ? <p className="mt-2 text-xs text-slate-500">File: {fileName}</p> : null}
          {scan.isPending ? (
            <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              Reading “{fileName}” — this can take up to a minute for a multi-page document.
            </p>
          ) : null}
          {scan.isError ? (
            <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
              Could not read this file: {(scan.error as Error).message}. Try a clearer photo or a single-page PDF.
            </p>
          ) : null}
          {saveQuote.isError ? (
            <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
              Could not save: {(saveQuote.error as Error).message}
            </p>
          ) : null}
        </section>


        {draft ? (
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-900">Check the extracted data</h2>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {([
                ["vendor_name", "Vendor"],
                ["quote_ref", "Quote reference"],
                ["quote_date", "Quote date (YYYY-MM-DD)"],
                ["trade", "Trade"],
                ["vendor_gstin", "GSTIN"],
                ["vendor_contact", "Contact"],
              ] as const).map(([key, label]) => (
                <label key={key} className="block">
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</span>
                  <input
                    className={inputCls}
                    value={draft[key]}
                    onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
                  />
                </label>
              ))}
            </div>

            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    <th className="py-2 pr-2">Code</th>
                    <th className="py-2 pr-2">Description</th>
                    <th className="py-2 pr-2">Brand</th>
                    <th className="py-2 pr-2">Trade</th>
                    <th className="py-2 pr-2">Unit</th>
                    <th className="py-2 pr-2">Rate</th>
                    <th className="py-2 pr-2">Disc %</th>
                    <th className="py-2 pr-2">GST %</th>
                    <th className="py-2 pr-2">Net rate</th>
                    <th className="py-2" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {draft.items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="py-1.5 pr-2"><input className={inputCls} value={item.item_code} onChange={(e) => patchItem(idx, { item_code: e.target.value })} /></td>
                      <td className="py-1.5 pr-2 min-w-[240px]"><input className={inputCls} value={item.description} onChange={(e) => patchItem(idx, { description: e.target.value })} /></td>
                      <td className="py-1.5 pr-2"><input className={inputCls} value={item.brand} onChange={(e) => patchItem(idx, { brand: e.target.value })} /></td>
                      <td className="py-1.5 pr-2"><input className={inputCls} value={item.trade} onChange={(e) => patchItem(idx, { trade: e.target.value })} /></td>
                      <td className="py-1.5 pr-2 w-24"><input className={inputCls} value={item.unit} onChange={(e) => patchItem(idx, { unit: e.target.value })} /></td>
                      <td className="py-1.5 pr-2 w-28"><input className={inputCls} type="number" value={item.rate} onChange={(e) => patchItem(idx, { rate: Number(e.target.value) })} /></td>
                      <td className="py-1.5 pr-2 w-20"><input className={inputCls} type="number" value={item.discount_pct} onChange={(e) => patchItem(idx, { discount_pct: Number(e.target.value) })} /></td>
                      <td className="py-1.5 pr-2 w-20"><input className={inputCls} type="number" value={item.gst_pct} onChange={(e) => patchItem(idx, { gst_pct: Number(e.target.value) })} /></td>
                      <td className="py-1.5 pr-2 whitespace-nowrap font-semibold text-emerald-700">{money(netRate(item))}</td>
                      <td className="py-1.5">
                        <button
                          type="button"
                          onClick={() => setDraft({ ...draft, items: draft.items.filter((_, n) => n !== idx) })}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-rose-600"
                          aria-label="Remove line"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setDraft({ ...draft, items: [...draft.items, emptyItem()] })}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <Plus className="h-4 w-4" /> Add line
              </button>
              <button
                type="button"
                disabled={saveQuote.isPending}
                onClick={() => saveQuote.mutate(draft)}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                {saveQuote.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Save to price database
              </button>
              <button
                type="button"
                onClick={() => setDraft(null)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100"
              >
                Discard
              </button>
            </div>
          </section>
        ) : null}

        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-200 p-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-900">Price database</h2>
              <p className="text-xs text-slate-500">
                {items.length} rate line{items.length === 1 ? "" : "s"} from {quotes.length} quotation
                {quotes.length === 1 ? "" : "s"}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search item, brand or vendor"
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm md:w-72"
              />
              <select
                value={trade}
                onChange={(e) => setTrade(e.target.value)}
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
              >
                <option value="all">All trades</option>
                {trades.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-3">Item</th>
                  <th className="px-4 py-3">Brand</th>
                  <th className="px-4 py-3">Trade</th>
                  <th className="px-4 py-3">Unit</th>
                  <th className="px-4 py-3 text-right">Rate</th>
                  <th className="px-4 py-3 text-right">Net rate</th>
                  <th className="px-4 py-3">Vendor</th>
                  <th className="px-4 py-3">Quote</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isPending ? (
                  <tr><td colSpan={9} className="px-4 py-10 text-center text-slate-400">Loading price lines…</td></tr>
                ) : visible.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center text-slate-400">
                      No rates yet — upload a proforma above to start the price database.
                    </td>
                  </tr>
                ) : (
                  visible.map((i) => {
                    const q = quoteById.get(i.quote_id);
                    return (
                      <tr key={i.id} className="hover:bg-slate-50/60">
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-800">{i.description || i.item_code || "—"}</p>
                          {i.item_code && i.description ? <p className="text-xs text-slate-400">{i.item_code}</p> : null}
                        </td>
                        <td className="px-4 py-3 text-slate-600">{i.brand || "—"}</td>
                        <td className="px-4 py-3 text-slate-600">{i.trade || "—"}</td>
                        <td className="px-4 py-3 text-slate-600">{i.unit || "—"}</td>
                        <td className="px-4 py-3 text-right text-slate-700">{money(i.rate)}</td>
                        <td className="px-4 py-3 text-right font-semibold text-emerald-700">{money(i.net_rate)}</td>
                        <td className="px-4 py-3 text-slate-600">{q?.vendor_name || "—"}</td>
                        <td className="px-4 py-3 text-xs text-slate-500">
                          {q?.quote_ref || q?.source_file || "—"}
                          {q?.quote_date ? <span className="block">{q.quote_date}</span> : null}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => q && removeQuote.mutate(q.id)}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-rose-600"
                            aria-label="Delete this quotation"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </Shell>
  );
}
