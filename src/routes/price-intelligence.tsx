import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Shell } from "@/components/saha/Shell";
import { MetricTile, Section, StatusBadge } from "@/components/saha/ui";
import { supabase } from "@/integrations/supabase/client";
import { useSessionUser } from "@/lib/access";
import { useActiveProject } from "@/hooks/useActiveProject";
import { inr, inrCompact } from "@/data/saha";
import { ScanLine, Scale, Sparkles, Download, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/price-intelligence")({
  head: () => ({
    meta: [
      { title: "Price Intelligence — Scanned Quotes vs BOQ Rates | Saha OS" },
      { name: "description", content: "Live material rates from scanned vendor quotes compared against your BOQ rates." },
      { property: "og:title", content: "Price Intelligence — Scanned Quotes vs BOQ Rates | Saha OS" },
      { property: "og:description", content: "Live material rates from scanned vendor quotes compared against your BOQ rates." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

type Quote = { id: string; vendor_name: string; quote_ref: string; quote_date: string | null; trade: string; source_file: string; created_at: string };
type QuoteItem = { id: string; quote_id: string; description: string; brand: string; trade: string; unit: string; quantity: number; rate: number; discount_pct: number; gst_pct: number; net_rate: number };
type BoqItem = { id: string; description: string; brand: string; trade: string; unit: string; rate: number; quantity: number };

function norm(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
}
function tokens(s: string) {
  return norm(s).split(" ").filter((t) => t.length > 2);
}
function similar(a: string, b: string) {
  const ta = new Set(tokens(a));
  const tb = tokens(b);
  if (!ta.size || !tb.length) return 0;
  const hit = tb.filter((t) => ta.has(t)).length;
  return hit / tb.length;
}

function Page() {
  const project = useActiveProject();
  const user = useSessionUser();
  const enabled = Boolean(user?.id) && Boolean(project.id);
  const [tradeFilter, setTradeFilter] = useState("all");
  const [q, setQ] = useState("");

  const quotesQ = useQuery({
    queryKey: ["price-quotes", project.id],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase.from("price_quotes").select("*").eq("project_id", project.id!).order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Quote[];
    },
  });
  const quoteIds = (quotesQ.data ?? []).map((x) => x.id);
  const itemsQ = useQuery({
    queryKey: ["price-quote-items", project.id, quoteIds.length],
    enabled: enabled && quoteIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase.from("price_quote_items").select("*").in("quote_id", quoteIds);
      if (error) throw error;
      return (data ?? []) as QuoteItem[];
    },
  });
  const boqQ = useQuery({
    queryKey: ["boq-rates", project.id],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase.from("boq_items").select("id,description,brand,trade,unit,rate,quantity").eq("project_id", project.id!);
      if (error) throw error;
      return (data ?? []) as BoqItem[];
    },
  });

  const quotes = quotesQ.data ?? [];
  const quoteItems = itemsQ.data ?? [];
  const boq = boqQ.data ?? [];
  const quoteById = useMemo(() => Object.fromEntries(quotes.map((x) => [x.id, x])), [quotes]);

  const trades = useMemo(() => Array.from(new Set(quoteItems.map((i) => i.trade).filter(Boolean))).sort(), [quoteItems]);

  // Best (lowest net) quoted rate per normalized description.
  const bestRates = useMemo(() => {
    const m = new Map<string, { item: QuoteItem; vendor: string }>();
    for (const it of quoteItems) {
      const key = norm(it.description);
      if (!key) continue;
      const cur = m.get(key);
      if (!cur || it.net_rate < cur.item.net_rate) m.set(key, { item: it, vendor: quoteById[it.quote_id]?.vendor_name ?? "" });
    }
    return m;
  }, [quoteItems, quoteById]);

  // Compare BOQ lines against quoted rates.
  const comparisons = useMemo(() => {
    const rows = boq.map((b) => {
      let best: { item: QuoteItem; vendor: string } | undefined;
      let bestScore = 0;
      for (const [key, v] of bestRates) {
        const score = similar(b.description, key);
        if (score > bestScore) { bestScore = score; best = v; }
      }
      const matched = bestScore >= 0.6 && best ? best : undefined;
      const delta = matched && b.rate > 0 ? ((matched.item.net_rate - b.rate) / b.rate) * 100 : null;
      return { boq: b, match: matched, delta };
    });
    return rows.filter((r) => r.match);
  }, [boq, bestRates]);

  const potentialSaving = comparisons.reduce((s, r) => {
    if (r.delta !== null && r.delta < 0 && r.match) s += (r.boq.rate - r.match.item.net_rate) * (r.boq.quantity || 0);
    return s;
  }, 0);
  const vendorCount = new Set(quotes.map((x) => x.vendor_name)).size;

  const filteredQuotes = quotes.filter((x) =>
    (tradeFilter === "all" || x.trade === tradeFilter) &&
    (!q || norm(`${x.vendor_name} ${x.quote_ref} ${x.trade}`).includes(norm(q))),
  );
  const filteredItems = quoteItems.filter((i) =>
    (tradeFilter === "all" || i.trade === tradeFilter) &&
    (!q || norm(`${i.description} ${i.brand} ${quoteById[i.quote_id]?.vendor_name ?? ""}`).includes(norm(q))),
  );

  function exportCsv() {
    const head = ["Description", "Brand", "Trade", "Unit", "Net rate", "Vendor", "Quote ref", "Quote date"];
    const rows = filteredItems.map((i) => [i.description, i.brand, i.trade, i.unit, String(i.net_rate), quoteById[i.quote_id]?.vendor_name ?? "", quoteById[i.quote_id]?.quote_ref ?? "", quoteById[i.quote_id]?.quote_date ?? ""]);
    const csv = [head, ...rows].map((r) => r.map((c) => `"${String(c).replaceAll('"', '""')}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "price-intelligence.csv";
    a.click();
  }

  return (
    <Shell title="Price Intelligence">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground">Price Intelligence</h1>
          <p className="text-sm text-muted-foreground">Every rate below comes from vendor quotes you scanned for {project.name} — compared live against your BOQ.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCsv} disabled={!filteredItems.length} className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm font-medium text-foreground disabled:opacity-50">
            <Download className="h-4 w-4" /> Export rates
          </button>
          <Link to="/price-ocr" className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground">
            <ScanLine className="h-4 w-4" /> Scan a new quote
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Link to="/price-ocr" className="transition-transform hover:-translate-y-0.5">
          <MetricTile label="Quotes scanned" value={String(quotes.length)} delta="Tap to scan another" />
        </Link>
        <Link to="/vendor-directory" className="transition-transform hover:-translate-y-0.5">
          <MetricTile label="Vendors quoting" value={String(vendorCount)} delta="Tap to open vendor directory" />
        </Link>
        <MetricTile label="Priced line items" value={String(quoteItems.length)} delta={`Across ${trades.length} trades`} />
        <Link to="/budget-fit" className="transition-transform hover:-translate-y-0.5">
          <MetricTile label="Potential BOQ saving" value={inrCompact(potentialSaving)} tone={potentialSaving > 0 ? "good" : "neutral"} delta="Tap to apply via Budget Fit" />
        </Link>
      </div>

      <Section
        title="Scanned quote register"
        action={
          <div className="flex flex-wrap items-center gap-2">
            <select value={tradeFilter} onChange={(e) => setTradeFilter(e.target.value)} className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground">
              <option value="all">All trades</option>
              {trades.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search vendor, item, ref" className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground" />
          </div>
        }
      >
        {quotes.length === 0 ? (
          <div className="p-4 text-sm text-muted-foreground">
            No quotes scanned yet for this project. <Link to="/price-ocr" className="font-semibold text-primary">Scan a proforma or price list</Link> and the rates appear here automatically.
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {filteredQuotes.map((x) => {
              const count = quoteItems.filter((i) => i.quote_id === x.id).length;
              return (
                <div key={x.id} className="flex flex-wrap items-center justify-between gap-2 p-4">
                  <div>
                    <div className="font-medium text-foreground">{x.vendor_name} <span className="text-xs text-muted-foreground">{x.quote_ref}</span></div>
                    <div className="text-xs text-muted-foreground">{x.trade || "General"} • {x.quote_date ?? "no date"} • {count} items</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge tone="sky">{count} rates</StatusBadge>
                    <Link to="/tender-comparison" className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-foreground"><Scale className="h-3 w-3" /> Compare</Link>
                  </div>
                </div>
              );
            })}
            {!filteredQuotes.length && <p className="p-4 text-sm text-muted-foreground">No quotes match this filter.</p>}
          </div>
        )}
      </Section>

      <Section title="BOQ vs quoted rates (auto-matched)">
        {comparisons.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">No matches yet — once scanned quote items resemble BOQ descriptions, the comparison appears here.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-left">
                  <th className="p-3 font-semibold text-foreground">BOQ line item</th>
                  <th className="p-3 font-semibold text-foreground">BOQ rate</th>
                  <th className="p-3 font-semibold text-foreground">Best quoted rate</th>
                  <th className="p-3 font-semibold text-foreground">Vendor</th>
                  <th className="p-3 font-semibold text-foreground">Variance</th>
                </tr>
              </thead>
              <tbody>
                {comparisons
                  .filter((r) => tradeFilter === "all" || r.match?.item.trade === tradeFilter)
                  .sort((a, b) => (a.delta ?? 0) - (b.delta ?? 0))
                  .slice(0, 50)
                  .map((r) => (
                    <tr key={r.boq.id} className="border-b border-border/60">
                      <td className="p-3">
                        <div className="font-medium text-foreground">{r.boq.description}</div>
                        <div className="text-xs text-muted-foreground">{r.boq.brand || r.boq.trade} • per {r.boq.unit}</div>
                      </td>
                      <td className="p-3 text-foreground">{inr(r.boq.rate)}</td>
                      <td className="p-3 text-foreground">{r.match ? inr(r.match.item.net_rate) : "—"}</td>
                      <td className="p-3 text-muted-foreground">{r.match?.vendor}</td>
                      <td className="p-3">
                        {r.delta === null ? "—" : (
                          <StatusBadge tone={r.delta < 0 ? "emerald" : r.delta > 5 ? "red" : "amber"}>
                            {r.delta < 0 ? "" : "+"}{r.delta.toFixed(1)}%
                          </StatusBadge>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
        {comparisons.length > 0 && (
          <div className="flex flex-wrap gap-2 border-t border-border p-4">
            <Link to="/budget-fit" className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground"><Sparkles className="h-4 w-4" /> Apply savings in Budget Fit</Link>
            <Link to="/boq-engine" className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm text-foreground">Open BOQ Engine <ArrowRight className="h-4 w-4" /></Link>
            <Link to="/brand-preferences" className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm text-foreground">Brand preferences <ArrowRight className="h-4 w-4" /></Link>
          </div>
        )}
      </Section>
    </Shell>
  );
}
