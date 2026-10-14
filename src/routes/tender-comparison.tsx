import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Shell } from "@/components/saha/Shell";
import { MetricTile, Section, StatusBadge } from "@/components/saha/ui";
import { supabase } from "@/integrations/supabase/client";
import { useSessionUser, useAccess } from "@/lib/access";
import { useActiveProject } from "@/hooks/useActiveProject";
import { inr, inrCompact } from "@/data/saha";
import { Download, Plus, Trophy, Trash2, FilePlus2, Gavel } from "lucide-react";
import { toast } from "sonner";
import { DEPARTMENTS, deptAppliesTo, loadDepartmentTenders } from "@/lib/tender-departments";
import {
  MIN_QUOTES,
  awardSummary,
  awardTender,
  lineQuotes,
  lowestPicks,
  quoteCount,
  type ItemAward,
} from "@/lib/tender-award";

export const Route = createFileRoute("/tender-comparison")({
  head: () => ({
    meta: [
      { title: "Tender Comparison — L1/L2/L3 Vendor Quotes | Saha OS" },
      {
        name: "description",
        content: "Compare vendor quotations line by line, rank L1/L2/L3 and award the tender.",
      },
      { property: "og:title", content: "Tender Comparison — L1/L2/L3 Vendor Quotes | Saha OS" },
      {
        property: "og:description",
        content: "Compare vendor quotations line by line, rank L1/L2/L3 and award the tender.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

// The rfq tables were added after the generated types; query through an untyped handle.
const db = supabase as any;

type Rfq = {
  id: string;
  project_id: string;
  rfq_number: string;
  title: string;
  spec: string;
  status: "open" | "evaluating" | "awarded";
  deadline: string | null;
  budget_estimate: number;
  awarded_bid_id: string | null;
  awarded_vendor_name: string;
  created_at: string;
  item_awards?: Record<string, ItemAward>;
  award_note?: string;
  awarded_by_name?: string;
  awarded_at?: string | null;
  po_numbers?: string[];
};
type RfqItem = {
  id: string;
  rfq_id: string;
  description: string;
  qty: number;
  unit: string;
  benchmark_rate: number;
  sort: number;
  item_code?: string;
  gst_pct?: number;
};
type RfqBid = {
  id: string;
  rfq_id: string;
  vendor_name: string;
  rates: Record<string, number>;
  freight_total: number;
  payment_terms: string;
  lead_time: string;
  notes: string;
  created_at: string;
};

const STATUS_TONE: Record<string, "emerald" | "amber" | "sky"> = {
  open: "amber",
  evaluating: "sky",
  awarded: "emerald",
};

function bidLineTotal(bid: RfqBid, item: RfqItem) {
  const rate = Number(bid.rates?.[item.id] ?? 0);
  return rate * Number(item.qty || 0);
}
function bidGrandTotal(bid: RfqBid, items: RfqItem[]) {
  return items.reduce((s, it) => s + bidLineTotal(bid, it), 0) + Number(bid.freight_total || 0);
}

type NewItem = { description: string; qty: string; unit: string; benchmark_rate: string };

function Page() {
  const project = useActiveProject();
  const user = useSessionUser();
  const access = useAccess();
  const qc = useQueryClient();
  const canManage = Boolean(
    access.access?.isAdmin ||
    access.access?.roles?.some((r: string) => ["admin", "pm", "purchase"].includes(r)),
  );

  /** Admin and PM award tenders (the database enforces it too). */
  const canAward = Boolean(access.access?.isAdmin || access.access?.roles?.includes("pm"));
  const isAdmin = Boolean(access.access?.isAdmin);
  const [selectedRfq, setSelectedRfq] = useState<string>("");
  const [loadingDepts, setLoadingDepts] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showBid, setShowBid] = useState(false);
  const enabled = Boolean(user?.id) && Boolean(project.id);

  const rfqsQ = useQuery({
    queryKey: ["rfqs", project.id],
    enabled,
    queryFn: async () => {
      const { data, error } = await db
        .from("rfqs")
        .select("*")
        .eq("project_id", project.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Rfq[];
    },
  });
  const rfqs = rfqsQ.data ?? [];
  const rfq = rfqs.find((r) => r.id === selectedRfq) ?? rfqs[0];

  useEffect(() => {
    if (rfq && rfq.id !== selectedRfq) setSelectedRfq(rfq.id);
  }, [rfq?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const itemsQ = useQuery({
    queryKey: ["rfq-items", rfq?.id],
    enabled: Boolean(rfq?.id),
    queryFn: async () => {
      const { data, error } = await db
        .from("rfq_items")
        .select("*")
        .eq("rfq_id", rfq!.id)
        .order("sort");
      if (error) throw error;
      return (data ?? []) as RfqItem[];
    },
  });
  const bidsQ = useQuery({
    queryKey: ["rfq-bids", rfq?.id],
    enabled: Boolean(rfq?.id),
    queryFn: async () => {
      const { data, error } = await db
        .from("rfq_bids")
        .select("*")
        .eq("rfq_id", rfq!.id)
        .order("created_at");
      if (error) throw error;
      return (data ?? []) as RfqBid[];
    },
  });
  const vendorsQ = useQuery({
    queryKey: ["vendors-list"],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vendors")
        .select("vendor_name")
        .order("vendor_name")
        .limit(200);
      if (error) throw error;
      return (data ?? []).map((v) => ({ name: v.vendor_name }));
    },
  });

  const items = itemsQ.data ?? [];
  const bids = bidsQ.data ?? [];

  const ranked = useMemo(
    () =>
      [...bids]
        .map((b) => ({ bid: b, total: bidGrandTotal(b, items) }))
        .sort((a, b) => a.total - b.total),
    [bids, items],
  );
  const l1 = ranked[0];
  const l3 = ranked[ranked.length - 1];
  const spread = l1 && l3 && ranked.length > 1 ? l3.total - l1.total : 0;
  const savingsVsBudget = rfq && l1 ? Number(rfq.budget_estimate || 0) - l1.total : 0;
  const lowestRatePerItem = useMemo(() => {
    const m: Record<string, number> = {};
    for (const it of items) {
      const rs = bids.map((b) => Number(b.rates?.[it.id] ?? 0)).filter((r) => r > 0);
      m[it.id] = rs.length ? Math.min(...rs) : 0;
    }
    return m;
  }, [items, bids]);

  const [picks, setPicks] = useState<Record<string, string>>({});
  useEffect(() => {
    if (!rfq) return;
    const saved = rfq.item_awards ?? {};
    setPicks(
      Object.keys(saved).length
        ? Object.fromEntries(Object.entries(saved).map(([k, v]) => [k, v.bid_id]))
        : lowestPicks(items, bids),
    );
  }, [rfq?.id, rfq?.item_awards, itemsQ.dataUpdatedAt, bidsQ.dataUpdatedAt]); // eslint-disable-line react-hooks/exhaustive-deps
  const quotes = quoteCount(bids);
  const awarded = rfq?.status === "awarded";
  function pickAll(bid: RfqBid) {
    const next: Record<string, string> = {};
    for (const it of items) if (Number(bid.rates?.[it.id] ?? 0) > 0) next[it.id] = bid.id;
    setPicks(next);
  }

  async function removeBid(id: string) {
    const { error } = await db.from("rfq_bids").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Bid removed");
    qc.invalidateQueries({ queryKey: ["rfq-bids", rfq?.id] });
  }

  function exportCsv() {
    if (!rfq) return;
    const head = [
      "Line item",
      "Qty",
      "Unit",
      "Benchmark",
      ...ranked.map((r, i) => `L${i + 1} ${r.bid.vendor_name} rate`),
      ...ranked.map((r, i) => `L${i + 1} ${r.bid.vendor_name} total`),
    ];
    const rows = items.map((it) => [
      it.description,
      String(it.qty),
      it.unit,
      String(it.benchmark_rate),
      ...ranked.map((r) => String(r.bid.rates?.[it.id] ?? "")),
      ...ranked.map((r) => String(bidLineTotal(r.bid, it))),
    ]);
    rows.push([
      "Freight / logistics",
      "",
      "",
      "",
      ...ranked.map(() => ""),
      ...ranked.map((r) => String(r.bid.freight_total)),
    ]);
    rows.push([
      "GRAND TOTAL",
      "",
      "",
      "",
      ...ranked.map(() => ""),
      ...ranked.map((r) => String(r.total)),
    ]);
    const csv = [head, ...rows]
      .map((r) => r.map((c) => `"${String(c).replaceAll('"', '""')}"`).join(","))
      .join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `${rfq.rfq_number || "rfq"}-comparison.csv`;
    a.click();
  }

  return (
    <Shell title="Tender Comparison">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground">Multi-Vendor Tender Comparison</h1>
          <p className="text-sm text-muted-foreground">
            Live L1/L2/L3 ranking of vendor quotations for {project.name}.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportCsv}
            disabled={!rfq || !bids.length}
            className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm font-medium text-foreground disabled:opacity-50"
          >
            <Download className="h-4 w-4" /> Export comparative
          </button>
          {canAward && deptAppliesTo(project.name) && (
            <button
              onClick={async () => {
                setLoadingDepts(true);
                try {
                  await loadDepartmentTenders(project.id, user?.id ?? null, (t) =>
                    toast.success(t),
                  );
                  await qc.invalidateQueries({ queryKey: ["rfqs", project.id] });
                  await qc.invalidateQueries({ queryKey: ["rfq-overview"] });
                } catch (e) {
                  toast.error((e as Error).message);
                }
                setLoadingDepts(false);
              }}
              disabled={loadingDepts}
              title="Create or refresh the 25 department tenders (every material incl. fixings) issued to dealers as Excel files"
              className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm font-medium text-foreground disabled:opacity-50"
            >
              <FilePlus2 className="h-4 w-4" />
              {loadingDepts
                ? "Loading…"
                : rfqs.some((r) => r.rfq_number.startsWith("CE-D"))
                  ? "Refresh department tenders"
                  : `Load ${DEPARTMENTS.length} department tenders`}
            </button>
          )}
          <button
            onClick={() => setShowNew((v) => !v)}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground"
          >
            <FilePlus2 className="h-4 w-4" /> New tender (RFQ)
          </button>
        </div>
      </div>

      {showNew && (
        <NewRfqForm
          projectId={project.id}
          userId={user?.id}
          onDone={(id) => {
            setShowNew(false);
            setSelectedRfq(id);
            qc.invalidateQueries({ queryKey: ["rfqs", project.id] });
          }}
        />
      )}

      <TenderOverview
        projectId={project.id}
        rfqs={rfqs}
        selected={rfq?.id ?? ""}
        onSelect={setSelectedRfq}
      />

      <Section title="Active tender">
        {rfqs.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">
            No tenders yet for this project. Create one with “New tender (RFQ)”, add its line items,
            then record each vendor's quote.
          </p>
        ) : (
          <div className="flex flex-wrap items-center gap-3 p-4">
            <select
              value={rfq?.id ?? ""}
              onChange={(e) => setSelectedRfq(e.target.value)}
              className="min-w-[280px] rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
            >
              {rfqs.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.rfq_number} — {r.title}
                </option>
              ))}
            </select>
            {rfq && (
              <>
                <StatusBadge tone={STATUS_TONE[rfq.status] ?? "slate"}>
                  {rfq.status.toUpperCase()}
                </StatusBadge>
                <span className="text-sm text-muted-foreground">
                  Budget estimate:{" "}
                  <strong className="text-foreground">
                    {inr(Number(rfq.budget_estimate || 0))}
                  </strong>
                </span>
                {rfq.deadline && (
                  <span className="text-sm text-muted-foreground">
                    Deadline: <strong className="text-foreground">{rfq.deadline}</strong>
                  </span>
                )}
                {rfq.status === "awarded" && (
                  <span className="text-sm text-primary font-semibold">
                    Awarded to {rfq.awarded_vendor_name}
                  </span>
                )}
              </>
            )}
          </div>
        )}
      </Section>

      {rfq && (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <MetricTile
              label="Lowest bid (L1)"
              value={l1 ? inrCompact(l1.total) : "—"}
              delta={l1 ? `Vendor: ${l1.bid.vendor_name}` : "No bids yet"}
              tone={l1 ? "good" : "neutral"}
            />
            <MetricTile
              label="Savings vs budget"
              value={l1 ? inrCompact(savingsVsBudget) : "—"}
              tone={savingsVsBudget >= 0 ? "good" : "bad"}
              delta={rfq ? `Budget ${inrCompact(Number(rfq.budget_estimate || 0))}` : ""}
            />
            <MetricTile
              label="Spread (L1 vs highest)"
              value={ranked.length > 1 ? inrCompact(spread) : "—"}
              delta={
                ranked.length > 1
                  ? `${((spread / ((l1?.total ?? 0) || 1)) * 100).toFixed(2)}% divergence`
                  : "Need 2+ bids"
              }
              tone="warn"
            />
            <MetricTile
              label="Quotations received"
              value={String(bids.length)}
              delta={`${items.length} line items`}
            />
          </div>

          <Section
            title="Line item parity matrix"
            action={
              <button
                onClick={() => setShowBid((v) => !v)}
                disabled={!items.length}
                className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
              >
                <Plus className="h-4 w-4" /> Add vendor quote
              </button>
            }
          >
            {showBid && (
              <AddBidForm
                rfq={rfq}
                items={items}
                vendors={vendorsQ.data ?? []}
                userId={user?.id}
                onDone={() => {
                  setShowBid(false);
                  qc.invalidateQueries({ queryKey: ["rfq-bids", rfq.id] });
                }}
              />
            )}

            {items.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">
                This tender has no line items yet.
              </p>
            ) : ranked.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">
                No vendor quotes recorded yet — add the first quote above.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/40 text-left">
                      <th className="p-3 font-semibold text-foreground">Tender specification</th>
                      {ranked.map((r, i) => (
                        <th key={r.bid.id} className="p-3">
                          <div className="flex items-center gap-2">
                            {i === 0 && <Trophy className="h-4 w-4 text-primary" />}
                            <span className="font-semibold text-foreground">
                              {r.bid.vendor_name}
                            </span>
                            <StatusBadge
                              tone={
                                i === 0
                                  ? "emerald"
                                  : i === ranked.length - 1 && ranked.length > 1
                                    ? "red"
                                    : "slate"
                              }
                            >
                              L{i + 1}
                            </StatusBadge>
                          </div>
                          <div className="mt-1 text-xs font-normal text-muted-foreground">
                            {r.bid.payment_terms || "Terms n/a"} • {r.bid.lead_time || "Lead n/a"}
                          </div>
                          {canManage && rfq.status !== "awarded" && (
                            <div className="mt-2 flex gap-2">
                              <button
                                onClick={() => pickAll(r.bid)}
                                title="Pick this vendor for every line they quoted"
                                className="inline-flex items-center gap-1 rounded border border-primary px-2 py-1 text-xs font-semibold text-primary"
                              >
                                <Gavel className="h-3 w-3" /> Pick all lines
                              </button>
                              <button
                                onClick={() => removeBid(r.bid.id)}
                                className="inline-flex items-center gap-1 rounded border border-border px-2 py-1 text-xs text-muted-foreground"
                              >
                                <Trash2 className="h-3 w-3" /> Remove
                              </button>
                            </div>
                          )}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((it) => (
                      <tr key={it.id} className="border-b border-border/60">
                        <td className="p-3">
                          <div className="font-medium text-foreground">{it.description}</div>
                          <div className="text-xs text-muted-foreground">
                            Qty {it.qty} {it.unit} • Benchmark {inr(Number(it.benchmark_rate || 0))}
                          </div>
                          {lineQuotes(it, bids) < MIN_QUOTES && (
                            <div className="text-xs font-semibold text-amber-700">
                              {lineQuotes(it, bids)} of {MIN_QUOTES} quotes on this line
                            </div>
                          )}
                        </td>
                        {ranked.map((r) => {
                          const rate = Number(r.bid.rates?.[it.id] ?? 0);
                          const isLow =
                            rate > 0 && rate === lowestRatePerItem[it.id] && ranked.length > 1;
                          const picked = picks[it.id] === r.bid.id;
                          return (
                            <td
                              key={r.bid.id}
                              onClick={() =>
                                !awarded &&
                                canAward &&
                                rate > 0 &&
                                setPicks((p) => ({ ...p, [it.id]: r.bid.id }))
                              }
                              title={
                                !awarded && canAward && rate > 0
                                  ? "Award this line to this vendor"
                                  : undefined
                              }
                              className={`p-3 ${isLow ? "bg-primary/5" : ""} ${picked ? "outline outline-2 -outline-offset-2 outline-primary" : ""} ${!awarded && canAward && rate > 0 ? "cursor-pointer" : ""}`}
                            >
                              <div className="font-semibold text-foreground">
                                {rate ? inr(rate) : "—"}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Line total {rate ? inr(bidLineTotal(r.bid, it)) : "—"}
                              </div>
                              {isLow && (
                                <div className="text-xs font-semibold text-primary">
                                  Lowest line rate
                                </div>
                              )}
                              {picked && (
                                <div className="text-xs font-bold text-primary">
                                  {awarded ? "✓ Awarded" : "✓ Picked"}
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                    <tr className="border-b border-border/60 bg-muted/30">
                      <td className="p-3 font-medium text-foreground">
                        Freight, insurance &amp; unloading
                      </td>
                      {ranked.map((r) => (
                        <td key={r.bid.id} className="p-3 text-foreground">
                          {inr(Number(r.bid.freight_total || 0))}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr className="bg-muted/50">
                      <td className="p-3 font-bold text-foreground">
                        Grand total (material + freight)
                      </td>
                      {ranked.map((r, i) => (
                        <td
                          key={r.bid.id}
                          className={`p-3 font-bold ${i === 0 ? "text-primary" : "text-foreground"}`}
                        >
                          {inr(r.total)}
                          <div className="text-xs font-semibold">
                            {i === 0
                              ? "L1 — recommended"
                              : `+${inrCompact(r.total - (l1?.total ?? 0))} vs L1`}
                          </div>
                        </td>
                      ))}
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
            {awarded && (
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border p-4">
                <p className="text-sm text-foreground">
                  Awarded to <strong>{rfq.awarded_vendor_name}</strong>
                  {rfq.awarded_by_name ? ` by ${rfq.awarded_by_name}` : ""}
                  {rfq.awarded_at
                    ? ` on ${new Date(rfq.awarded_at).toLocaleDateString("en-IN")}`
                    : ""}
                  .{" "}
                  {(rfq.po_numbers ?? []).length > 0
                    ? `Purchase orders raised: ${(rfq.po_numbers ?? []).join(", ")} (waiting for approval).`
                    : "Raise the purchase order from the winning quote."}
                  {rfq.award_note ? ` Award note: ${rfq.award_note}` : ""}
                </p>
                <Link
                  to={(rfq.po_numbers ?? []).length ? "/purchase-orders" : "/po-create"}
                  className="rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground"
                >
                  {(rfq.po_numbers ?? []).length ? "Open purchase orders" : "Create PO"}
                </Link>
              </div>
            )}
            {!awarded && items.length > 0 && (
              <AwardPanel
                quotes={quotes}
                canAward={canAward}
                isAdmin={isAdmin}
                summary={awardSummary(items, bids, picks)}
                onAward={async (note) => {
                  await awardTender({
                    rfq,
                    project: { id: project.id, name: project.name, location: null },
                    items,
                    bids,
                    picks,
                    note,
                    who: {
                      id: user?.id ?? null,
                      name: access.access?.profile?.full_name || access.access?.email || "PMC",
                    },
                  });
                  await qc.invalidateQueries({ queryKey: ["rfqs", project.id] });
                  await qc.invalidateQueries({ queryKey: ["purchase_orders"] });
                }}
              />
            )}
            {ranked.length > 1 && rfq.status !== "awarded" && l1 && (
              <div className="border-t border-border p-4 text-sm text-muted-foreground">
                Recommendation: award to{" "}
                <strong className="text-foreground">{l1.bid.vendor_name}</strong> (L1) at{" "}
                <strong className="text-foreground">{inr(l1.total)}</strong>
                {savingsVsBudget >= 0
                  ? ` — ${inrCompact(savingsVsBudget)} under the budget estimate.`
                  : ` — ${inrCompact(-savingsVsBudget)} over budget; negotiate before award.`}
                {l1.bid.notes ? ` Note: ${l1.bid.notes}` : ""}
              </div>
            )}
          </Section>
        </>
      )}
    </Shell>
  );
}

function NewRfqForm({
  projectId,
  userId,
  onDone,
}: {
  projectId: string | null;
  userId: string | undefined;
  onDone: (id: string) => void;
}) {
  const [title, setTitle] = useState("");
  const [spec, setSpec] = useState("");
  const [deadline, setDeadline] = useState("");
  const [budget, setBudget] = useState("");
  const [items, setItems] = useState<NewItem[]>([
    { description: "", qty: "", unit: "MT", benchmark_rate: "" },
  ]);
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!projectId) {
      toast.error("Select a project first");
      return;
    }
    if (!title.trim()) {
      toast.error("Tender title is required");
      return;
    }
    const rows = items.filter((i) => i.description.trim() && Number(i.qty) > 0);
    if (!rows.length) {
      toast.error("Add at least one line item with quantity");
      return;
    }
    setSaving(true);
    // sequential per project: RFQ-0001, RFQ-0002 … (imported CE-PKG-/CE-D packages are numbered apart)
    const { data: existingNos, error: noErr } = await db
      .from("rfqs")
      .select("rfq_number")
      .eq("project_id", projectId);
    if (noErr) {
      setSaving(false);
      toast.error(noErr.message);
      return;
    }
    const lastNo = Math.max(
      0,
      ...((existingNos ?? []) as { rfq_number: string }[])
        .map((r) => r.rfq_number ?? "")
        .filter((no) => !/^CE-(PKG|D)/i.test(no))
        .map((no) => Number(/^RFQ-(\d+)$/i.exec(no.trim())?.[1] ?? 0)),
    );
    const rfqNumber = `RFQ-${String(lastNo + 1).padStart(4, "0")}`;
    const { data, error } = await db
      .from("rfqs")
      .insert({
        project_id: projectId,
        rfq_number: rfqNumber,
        title: title.trim(),
        spec: spec.trim(),
        deadline: deadline || null,
        budget_estimate: Number(budget) || 0,
        created_by: userId ?? null,
        created_by_name: "",
      })
      .select("id")
      .single();
    if (error) {
      setSaving(false);
      toast.error(error.message);
      return;
    }
    const { error: ie } = await db.from("rfq_items").insert(
      rows.map((i, idx) => ({
        rfq_id: data.id,
        description: i.description.trim(),
        qty: Number(i.qty),
        unit: i.unit || "MT",
        benchmark_rate: Number(i.benchmark_rate) || 0,
        sort: idx,
      })),
    );
    setSaving(false);
    if (ie) {
      toast.error(ie.message);
      return;
    }
    toast.success(`Tender ${rfqNumber} created`);
    onDone(data.id as string);
  }

  return (
    <Section title="New tender (RFQ)">
      <div className="grid gap-3 p-4 md:grid-cols-2">
        <label className="text-sm text-foreground">
          Title
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Steel Rebar Fe500D — 120 MT"
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2"
          />
        </label>
        <label className="text-sm text-foreground">
          Specification
          <input
            value={spec}
            onChange={(e) => setSpec(e.target.value)}
            placeholder="Sizes, grade, delivery location"
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2"
          />
        </label>
        <label className="text-sm text-foreground">
          Submission deadline
          <input
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2"
          />
        </label>
        <label className="text-sm text-foreground">
          Budget estimate (₹)
          <input
            type="number"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2"
          />
        </label>
      </div>
      <div className="px-4 pb-2 text-sm font-semibold text-foreground">Line items</div>
      <div className="flex flex-col gap-2 px-4 pb-4">
        {items.map((it, idx) => (
          <div key={idx} className="grid gap-2 md:grid-cols-[1fr_110px_90px_150px_40px]">
            <input
              value={it.description}
              onChange={(e) =>
                setItems((p) =>
                  p.map((x, i) => (i === idx ? { ...x, description: e.target.value } : x)),
                )
              }
              placeholder="Fe 500D TMT Rebar 16mm"
              className="rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
            <input
              type="number"
              value={it.qty}
              onChange={(e) =>
                setItems((p) => p.map((x, i) => (i === idx ? { ...x, qty: e.target.value } : x)))
              }
              placeholder="Qty"
              className="rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
            <input
              value={it.unit}
              onChange={(e) =>
                setItems((p) => p.map((x, i) => (i === idx ? { ...x, unit: e.target.value } : x)))
              }
              placeholder="Unit"
              className="rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
            <input
              type="number"
              value={it.benchmark_rate}
              onChange={(e) =>
                setItems((p) =>
                  p.map((x, i) => (i === idx ? { ...x, benchmark_rate: e.target.value } : x)),
                )
              }
              placeholder="Benchmark rate"
              className="rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
            <button
              onClick={() => setItems((p) => p.filter((_, i) => i !== idx))}
              className="text-muted-foreground"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
        <div className="flex gap-2 pt-1">
          <button
            onClick={() =>
              setItems((p) => [...p, { description: "", qty: "", unit: "MT", benchmark_rate: "" }])
            }
            className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-2 text-sm text-foreground"
          >
            <Plus className="h-4 w-4" /> Add line
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
          >
            {saving ? "Saving…" : "Create tender"}
          </button>
        </div>
      </div>
    </Section>
  );
}

function AddBidForm({
  rfq,
  items,
  vendors,
  userId,
  onDone,
}: {
  rfq: Rfq;
  items: RfqItem[];
  vendors: { name: string }[];
  userId: string | undefined;
  onDone: () => void;
}) {
  const [vendor, setVendor] = useState("");
  const [rates, setRates] = useState<Record<string, string>>({});
  const [freight, setFreight] = useState("");
  const [terms, setTerms] = useState("");
  const [lead, setLead] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!vendor.trim()) {
      toast.error("Vendor name is required");
      return;
    }
    const rateMap: Record<string, number> = {};
    for (const it of items) {
      const v = Number(rates[it.id]);
      if (v > 0) rateMap[it.id] = v;
    }
    if (!Object.keys(rateMap).length) {
      toast.error("Enter at least one line rate");
      return;
    }
    setSaving(true);
    const { error } = await db.from("rfq_bids").insert({
      rfq_id: rfq.id,
      vendor_name: vendor.trim(),
      rates: rateMap,
      freight_total: Number(freight) || 0,
      payment_terms: terms.trim(),
      lead_time: lead.trim(),
      notes: notes.trim(),
      created_by: userId ?? null,
      created_by_name: "",
    });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (rfq.status === "open")
      await db.from("rfqs").update({ status: "evaluating" }).eq("id", rfq.id);
    toast.success("Vendor quote recorded");
    onDone();
  }

  return (
    <div className="border-b border-border p-4">
      <div className="grid gap-3 md:grid-cols-3">
        <label className="text-sm text-foreground">
          Vendor
          <input
            list="rfq-vendors"
            value={vendor}
            onChange={(e) => setVendor(e.target.value)}
            placeholder="Vendor name"
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2"
          />
          <datalist id="rfq-vendors">
            {vendors.map((v) => (
              <option key={v.name} value={v.name} />
            ))}
          </datalist>
        </label>
        <label className="text-sm text-foreground">
          Payment terms
          <input
            value={terms}
            onChange={(e) => setTerms(e.target.value)}
            placeholder="30 days PDC"
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2"
          />
        </label>
        <label className="text-sm text-foreground">
          Lead time
          <input
            value={lead}
            onChange={(e) => setLead(e.target.value)}
            placeholder="48 hours"
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2"
          />
        </label>
      </div>
      <div className="mt-3 grid gap-2">
        {items.map((it) => (
          <div key={it.id} className="grid items-center gap-2 md:grid-cols-[1fr_160px]">
            <span className="text-sm text-foreground">
              {it.description}{" "}
              <span className="text-xs text-muted-foreground">
                ({it.qty} {it.unit})
              </span>
            </span>
            <input
              type="number"
              value={rates[it.id] ?? ""}
              onChange={(e) => setRates((p) => ({ ...p, [it.id]: e.target.value }))}
              placeholder={`Rate per ${it.unit}`}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
          </div>
        ))}
      </div>
      <div className="mt-3 grid gap-3 md:grid-cols-3">
        <label className="text-sm text-foreground">
          Freight total (₹)
          <input
            type="number"
            value={freight}
            onChange={(e) => setFreight(e.target.value)}
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2"
          />
        </label>
        <label className="text-sm text-foreground md:col-span-2">
          Notes
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Brand offered, certificates, conditions"
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2"
          />
        </label>
      </div>
      <button
        onClick={save}
        disabled={saving}
        className="mt-3 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save quote"}
      </button>
    </div>
  );
}

function AwardPanel({
  quotes,
  canAward,
  isAdmin,
  summary,
  onAward,
}: {
  quotes: number;
  canAward: boolean;
  isAdmin: boolean;
  summary: ReturnType<typeof awardSummary>;
  onAward: (note: string) => Promise<void>;
}) {
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const enough = quotes >= MIN_QUOTES;
  const blocked = !enough && !(isAdmin && note.trim());
  return (
    <div className="border-t border-border p-4">
      <h3 className="text-sm font-bold text-foreground">Award</h3>
      <p
        className={`mt-1 text-sm ${enough ? "text-muted-foreground" : "font-semibold text-amber-700"}`}
      >
        {quotes} of {MIN_QUOTES} vendor quotes received.{" "}
        {enough
          ? "Click a rate in the table to award that line to another vendor; the lowest rate is picked by default."
          : isAdmin
            ? "Award is locked until three quotes are in. As admin you can award with fewer only with a written reason (e.g. single OEM, rate contract)."
            : "Award is locked until three quotes are in. Ask more vendors for quotes."}
      </p>
      {summary.vendors.length > 0 && (
        <table className="mt-2 w-full max-w-2xl text-sm">
          <tbody>
            {summary.vendors.map((v) => (
              <tr key={v.bid.id} className="border-t border-border/60">
                <td className="py-1 pr-3 font-medium text-foreground">{v.bid.vendor_name}</td>
                <td className="py-1 pr-3 text-muted-foreground">
                  {v.lines.length} line{v.lines.length > 1 ? "s" : ""}
                </td>
                <td className="py-1 text-right font-semibold text-foreground">{inr(v.value)}</td>
              </tr>
            ))}
            <tr className="border-t-2 border-border">
              <td className="py-1 pr-3 font-bold text-foreground">Award total, excl. GST</td>
              <td className="py-1 pr-3 text-muted-foreground">
                PMC benchmark {inr(summary.benchmark)}
              </td>
              <td className="py-1 text-right font-bold text-foreground">{inr(summary.total)}</td>
            </tr>
          </tbody>
        </table>
      )}
      {summary.unpicked.length > 0 && (
        <p className="mt-1 text-xs text-amber-700">
          {summary.unpicked.length} line{summary.unpicked.length > 1 ? "s have" : " has"} no quote
          yet and will not be ordered.
        </p>
      )}
      {canAward ? (
        <div className="mt-3 flex flex-wrap items-end gap-2">
          <label className="min-w-[260px] flex-1 text-sm text-foreground">
            Award note {enough ? "(optional)" : "(reason, required for fewer than 3 quotes)"}
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. L1 on all lines; negotiated 2% off"
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2"
            />
          </label>
          <button
            type="button"
            disabled={busy || blocked || !summary.vendors.length}
            onClick={async () => {
              setBusy(true);
              try {
                await onAward(note);
                toast.success(
                  `Awarded. ${summary.vendors.length} purchase order${summary.vendors.length > 1 ? "s" : ""} raised for approval.`,
                );
              } catch (e) {
                toast.error((e as Error).message);
              }
              setBusy(false);
            }}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
          >
            <Gavel className="h-4 w-4" />
            {busy
              ? "Awarding…"
              : `Award and raise ${summary.vendors.length || ""} PO${summary.vendors.length === 1 ? "" : "s"}`}
          </button>
        </div>
      ) : (
        <p className="mt-2 text-xs text-muted-foreground">Only an admin or PM can award.</p>
      )}
    </div>
  );
}

/** Every tender of the project with its quote count, L1 total and enquiry date. */
function TenderOverview({
  projectId,
  rfqs,
  selected,
  onSelect,
}: {
  projectId: string;
  rfqs: Rfq[];
  selected: string;
  onSelect: (id: string) => void;
}) {
  const q = useQuery({
    queryKey: ["rfq-overview", projectId, rfqs.length],
    enabled: rfqs.length > 0,
    queryFn: async () => {
      const ids = rfqs.map((r) => r.id);
      const [bids, items] = await Promise.all([
        db.from("rfq_bids").select("rfq_id,rates").in("rfq_id", ids),
        db.from("rfq_items").select("id,rfq_id,qty").in("rfq_id", ids),
      ]);
      if (bids.error) throw bids.error;
      if (items.error) throw items.error;
      return {
        bids: (bids.data ?? []) as { rfq_id: string; rates: Record<string, number> }[],
        items: (items.data ?? []) as { id: string; rfq_id: string; qty: number }[],
      };
    },
  });
  if (!rfqs.length) return null;
  const today = new Date().toISOString().slice(0, 10);
  const enquiryOf = (r: Rfq) =>
    r.deadline
      ? new Date(Date.parse(`${r.deadline}T00:00:00Z`) - 14 * 86_400_000).toISOString().slice(0, 10)
      : null;
  const rows = [...rfqs]
    .map((r) => {
      const bids = (q.data?.bids ?? []).filter((b) => b.rfq_id === r.id);
      const quoted = bids.filter((b) =>
        Object.values(b.rates ?? {}).some((v) => Number(v) > 0),
      ).length;
      const its = (q.data?.items ?? []).filter((i) => i.rfq_id === r.id);
      let l1 = 0;
      for (const it of its) {
        const rs = bids.map((b) => Number(b.rates?.[it.id] ?? 0)).filter((v) => v > 0);
        if (rs.length) l1 += Math.min(...rs) * Number(it.qty);
      }
      return { r, quoted, l1, enquiry: enquiryOf(r) };
    })
    .sort((a, b) => (a.enquiry ?? "9999").localeCompare(b.enquiry ?? "9999"));
  return (
    <Section title={`All tenders (${rfqs.length})`}>
      <div className="max-h-80 overflow-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="sticky top-0 bg-muted/60 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="p-2">Tender</th>
              <th className="p-2">Send enquiry by</th>
              <th className="p-2">Quotes due</th>
              <th className="p-2 text-right">Quotes</th>
              <th className="p-2 text-right">L1 total</th>
              <th className="p-2 text-right">Benchmark</th>
              <th className="p-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ r, quoted, l1, enquiry }) => {
              const late =
                r.status !== "awarded" && quoted < MIN_QUOTES && r.deadline && r.deadline < today;
              return (
                <tr
                  key={r.id}
                  onClick={() => onSelect(r.id)}
                  className={`cursor-pointer border-t border-border/60 hover:bg-muted/30 ${r.id === selected ? "bg-primary/5" : ""}`}
                >
                  <td className="p-2 font-medium text-foreground">
                    {r.rfq_number} · {r.title.replace(/^Pkg \d+ · /, "")}
                  </td>
                  <td className="p-2">{enquiry ?? "—"}</td>
                  <td className={`p-2 ${late ? "font-semibold text-red-600" : ""}`}>
                    {r.deadline ?? "—"}
                  </td>
                  <td
                    className={`p-2 text-right font-semibold ${quoted >= MIN_QUOTES ? "text-primary" : "text-amber-700"}`}
                  >
                    {quoted} / {MIN_QUOTES}
                  </td>
                  <td className="p-2 text-right">{l1 ? inrCompact(l1) : "—"}</td>
                  <td className="p-2 text-right text-muted-foreground">
                    {inrCompact(Number(r.budget_estimate || 0))}
                  </td>
                  <td className="p-2">
                    <StatusBadge tone={STATUS_TONE[r.status] ?? "slate"}>
                      {r.status.toUpperCase()}
                    </StatusBadge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Section>
  );
}
