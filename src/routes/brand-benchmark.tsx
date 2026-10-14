import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Shell } from "@/components/saha/Shell";
import { MetricTile, Section, StatusBadge } from "@/components/saha/ui";
import { supabase } from "@/integrations/supabase/client";
import { useSessionUser } from "@/lib/access";
import { useActiveProject } from "@/hooks/useActiveProject";
import { inr, inrCompact } from "@/data/saha";
import { RATE_BASIS_NOTE, cheapestQuote, compareRate, quoteRateExclGst } from "@/lib/rate-compare";
import { Download, ScanLine, Sparkles, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/brand-benchmark")({
  head: () => ({
    meta: [
      { title: "Brand Benchmark — Your Brands vs Market Rates | Saha OS" },
      {
        name: "description",
        content:
          "Compares the brands you chose for the project against live quoted and BOQ rates to show if you are overpaying.",
      },
      { property: "og:title", content: "Brand Benchmark — Your Brands vs Market Rates | Saha OS" },
      {
        property: "og:description",
        content:
          "Compares the brands you chose for the project against live quoted and BOQ rates to show if you are overpaying.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

type Pref = { material: string; brand: string; series: string; supplier: string; notes: string };
type BoqLine = {
  id: string;
  description: string;
  brand: string;
  category: string;
  unit: string;
  rate: number;
  quantity: number;
};
type QItem = {
  id: string;
  quote_id: string;
  description: string;
  brand: string;
  unit: string;
  net_rate: number;
  gst_pct: number | null;
};
type QHead = { id: string; vendor_name: string };

function norm(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
function tokens(s: string) {
  return norm(s)
    .split(" ")
    .filter((t) => t.length > 2);
}
function score(a: string, b: string) {
  const ta = new Set(tokens(a));
  const tb = tokens(b);
  if (!ta.size || !tb.length) return 0;
  return tb.filter((t) => ta.has(t)).length / tb.length;
}

function Page() {
  const project = useActiveProject();
  const user = useSessionUser();
  const enabled = Boolean(user?.id) && Boolean(project.id);
  const [q, setQ] = useState("");

  const projQ = useQuery({
    queryKey: ["bb-project", project.id],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_projects")
        .select("brand_preferences")
        .eq("id", project.id!)
        .single();
      if (error) throw error;
      return data;
    },
  });
  const prefs: Pref[] = useMemo(() => {
    const raw = projQ.data?.brand_preferences;
    if (!Array.isArray(raw)) return [];
    return raw
      .map((r) => {
        const o = (r ?? {}) as Record<string, unknown>;
        return {
          material: String(o["material"] ?? "").trim(),
          brand: String(o["brand"] ?? "").trim(),
          series: String(o["series"] ?? "").trim(),
          supplier: String(o["supplier"] ?? "").trim(),
          notes: String(o["notes"] ?? "").trim(),
        };
      })
      .filter((r) => r.material !== "" || r.brand !== "");
  }, [projQ.data]);

  const boqQ = useQuery({
    queryKey: ["bb-boq", project.id],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("boq_items")
        .select("id,description,brand,category,unit,rate,quantity")
        .eq("project_id", project.id!);
      if (error) throw error;
      return (data ?? []) as BoqLine[];
    },
  });
  const quotesQ = useQuery({
    queryKey: ["bb-quotes", project.id],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("price_quotes")
        .select("id,vendor_name")
        .eq("project_id", project.id!);
      if (error) throw error;
      return (data ?? []) as QHead[];
    },
  });
  const quoteIds = (quotesQ.data ?? []).map((x) => x.id);
  const qItemsQ = useQuery({
    queryKey: ["bb-quote-items", project.id, quoteIds.length],
    enabled: enabled && quoteIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("price_quote_items")
        .select("id,quote_id,description,brand,unit,net_rate,gst_pct")
        .in("quote_id", quoteIds);
      if (error) throw error;
      return (data ?? []) as QItem[];
    },
  });
  const vendorByQuote = useMemo(
    () => Object.fromEntries((quotesQ.data ?? []).map((x) => [x.id, x.vendor_name])),
    [quotesQ.data],
  );

  const rows = useMemo(() => {
    const boq = boqQ.data ?? [];
    const quoted = qItemsQ.data ?? [];
    return prefs.map((p) => {
      const label = `${p.material} ${p.series}`;
      // BOQ line that matches this material + preferred brand.
      let boqLine: BoqLine | undefined;
      let boqScore = 0;
      for (const b of boq) {
        let s = score(`${b.description} ${b.category}`, label);
        if (p.brand && norm(b.brand).includes(norm(p.brand))) s += 0.4;
        if (s > boqScore) {
          boqScore = s;
          boqLine = b;
        }
      }
      if (boqScore < 0.5) boqLine = undefined;
      // Cheapest (excl. GST) quoted line among all lines matching the material (any
      // brand), preferring lines in the BOQ line's unit.
      const candidates = quoted.filter(
        (it) => score(`${it.description} ${it.brand}`, label) >= 0.5,
      );
      const cheapest = cheapestQuote(candidates, boqLine ? boqLine.unit : undefined);
      const best = cheapest
        ? { item: cheapest, vendor: vendorByQuote[cheapest.quote_id] ?? "" }
        : undefined;
      const cmp = best && boqLine ? compareRate(boqLine, best.item) : undefined;
      return {
        pref: p,
        boqLine,
        best,
        cmp,
        delta: cmp?.delta ?? null,
        saving: cmp?.saving ?? 0,
      };
    });
  }, [prefs, boqQ.data, qItemsQ.data, vendorByQuote]);

  const matched = rows.filter((r) => r.best || r.boqLine);
  const totalSaving = rows.reduce((s, r) => s + r.saving, 0);
  const quotedCount = rows.filter((r) => r.best).length;
  const filtered = rows.filter(
    (r) => !q || norm(`${r.pref.material} ${r.pref.brand} ${r.pref.series}`).includes(norm(q)),
  );

  function exportCsv() {
    const head = [
      "Material",
      "Preferred brand",
      "Series/Grade",
      "BOQ rate (excl. GST)",
      "Unit",
      "Best quoted rate (excl. GST)",
      "Quoted unit",
      "Quoted net rate (incl. GST)",
      "Best quoted brand",
      "Vendor",
      "Variance %",
      "Potential saving",
    ];
    const body = filtered.map((r) => [
      r.pref.material,
      r.pref.brand,
      r.pref.series,
      r.boqLine ? String(r.boqLine.rate) : "",
      r.boqLine?.unit ?? "",
      r.cmp ? r.cmp.quoteExcl.toFixed(2) : "",
      r.best?.item.unit ?? "",
      r.best ? String(r.best.item.net_rate) : "",
      r.best?.item.brand ?? "",
      r.best?.vendor ?? "",
      r.cmp && !r.cmp.unitsMatch ? "units differ" : r.delta === null ? "" : r.delta.toFixed(1),
      r.saving ? r.saving.toFixed(0) : "",
    ]);
    const csv = [head, ...body]
      .map((r) => r.map((c) => `"${String(c).replaceAll('"', '""')}"`).join(","))
      .join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "brand-benchmark.csv";
    a.click();
  }

  const loading = projQ.isLoading || boqQ.isLoading || qItemsQ.isLoading;

  return (
    <Shell title="Brand Benchmark">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground">Brand Benchmark</h1>
          <p className="text-sm text-muted-foreground">
            Takes the brands you picked in{" "}
            <Link to="/brand-preferences" className="font-medium text-primary">
              Brand Preferences
            </Link>{" "}
            for {project.name} and checks them against your BOQ rates and every scanned vendor quote
            — so you can see, brand by brand, whether you're paying the right price.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportCsv}
            disabled={!rows.length}
            className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm font-medium text-foreground disabled:opacity-50"
          >
            <Download className="h-4 w-4" /> Export
          </button>
          <Link
            to="/price-ocr"
            className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground"
          >
            <ScanLine className="h-4 w-4" /> Scan a quote
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Link to="/brand-preferences" className="transition-transform hover:-translate-y-0.5">
          <MetricTile
            label="Preferred brands"
            value={String(prefs.length)}
            delta="Tap to edit the list"
          />
        </Link>
        <MetricTile
          label="With quoted rates"
          value={String(quotedCount)}
          delta={`of ${prefs.length} preferences matched`}
        />
        <Link to="/price-intelligence" className="transition-transform hover:-translate-y-0.5">
          <MetricTile
            label="Benchmarked lines"
            value={String(matched.length)}
            delta="Tap for full rate analysis"
          />
        </Link>
        <Link to="/budget-fit" className="transition-transform hover:-translate-y-0.5">
          <MetricTile
            label="Potential saving"
            value={inrCompact(totalSaving)}
            tone={totalSaving > 0 ? "good" : "neutral"}
            delta="Excl. GST, same units only"
          />
        </Link>
      </div>

      <Section
        title="Brand-by-brand comparison"
        action={
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search material or brand"
            className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
          />
        }
      >
        <p className="px-4 pt-3 text-xs text-muted-foreground">{RATE_BASIS_NOTE}</p>
        {loading ? (
          <p className="p-4 text-sm text-muted-foreground">Benchmarking your brands…</p>
        ) : prefs.length === 0 ? (
          <div className="p-4 text-sm text-muted-foreground">
            No brand preferences set for this project yet.{" "}
            <Link to="/brand-preferences" className="font-semibold text-primary">
              Pick your brands first
            </Link>{" "}
            — then scan vendor quotes and this page benchmarks them automatically.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-left">
                  <th className="p-3 font-semibold text-foreground">Material</th>
                  <th className="p-3 font-semibold text-foreground">Your brand</th>
                  <th className="p-3 font-semibold text-foreground">BOQ rate (excl. GST)</th>
                  <th className="p-3 font-semibold text-foreground">Best quoted (excl. GST)</th>
                  <th className="p-3 font-semibold text-foreground">Quoted brand / vendor</th>
                  <th className="p-3 font-semibold text-foreground">Verdict</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => (
                  <tr key={i} className="border-b border-border/60">
                    <td className="p-3">
                      <div className="font-medium text-foreground">{r.pref.material || "—"}</div>
                      {r.pref.series && (
                        <div className="text-xs text-muted-foreground">{r.pref.series}</div>
                      )}
                    </td>
                    <td className="p-3 text-foreground">{r.pref.brand || "—"}</td>
                    <td className="p-3 text-foreground">
                      {r.boqLine ? `${inr(r.boqLine.rate)} / ${r.boqLine.unit}` : "—"}
                    </td>
                    <td className="p-3 text-foreground">
                      {r.best ? (
                        <>
                          <div>
                            {inr(quoteRateExclGst(r.best.item))} /{r.best.item.unit}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {inr(r.best.item.net_rate)} incl. {r.best.item.gst_pct ?? 18}% GST
                          </div>
                        </>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="p-3 text-muted-foreground">
                      {r.best ? `${r.best.item.brand || "—"} · ${r.best.vendor}` : "—"}
                    </td>
                    <td className="p-3">
                      {r.cmp && !r.cmp.unitsMatch ? (
                        <StatusBadge tone="slate">Units differ — not compared</StatusBadge>
                      ) : r.best && !r.boqLine ? (
                        <StatusBadge tone="slate">No BOQ line to compare</StatusBadge>
                      ) : r.delta === null ? (
                        <StatusBadge tone="slate">No quote yet</StatusBadge>
                      ) : r.delta < 0 ? (
                        <StatusBadge tone="emerald">
                          Quote cheaper {r.delta.toFixed(1)}%
                        </StatusBadge>
                      ) : r.delta > 5 ? (
                        <StatusBadge tone="red">Quote +{r.delta.toFixed(1)}%</StatusBadge>
                      ) : (
                        <StatusBadge tone="amber">On par</StatusBadge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {rows.length > 0 && (
          <div className="flex flex-wrap gap-2 border-t border-border p-4">
            <Link
              to="/budget-fit"
              className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground"
            >
              <Sparkles className="h-4 w-4" /> Apply savings in Budget Fit
            </Link>
            <Link
              to="/price-intelligence"
              className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm text-foreground"
            >
              Price Intelligence <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/boq-engine"
              className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm text-foreground"
            >
              BOQ Engine <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </Section>
    </Shell>
  );
}
