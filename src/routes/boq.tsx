import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronDown, Download, Upload } from "lucide-react";
import { Shell } from "@/components/saha/Shell";
import { ActionButton, MetricTile, Section, StatusBadge, TrendPill } from "@/components/saha/ui";
import { boqItems, inr, inrCompact, materialRates, num, projects } from "@/data/saha";

export const Route = createFileRoute("/boq")({
  head: () => ({
    meta: [
      { title: "BOQ & Rate Intelligence — Saha OS Next" },
      {
        name: "description",
        content:
          "Dynamic bill of quantities with live Hyderabad market rates, brand alternatives, variance analysis and stage-wise cost roll-ups.",
      },
      { property: "og:title", content: "BOQ & Rate Intelligence — Saha OS Next" },
      {
        property: "og:description",
        content: "Stage-wise BOQ with live Hyderabad market rates and brand-level variance analysis.",
      },
    ],
  }),
  component: Boq,
});

type BoqRow = (typeof boqItems)[number];

function Boq() {
  const [projectId, setProjectId] = useState<string>("all");
  const [openRow, setOpenRow] = useState<string | null>(null);
  const [uploaded, setUploaded] = useState<BoqRow[]>([]);
  const [notice, setNotice] = useState<string | null>(null);

  const items = [...boqItems, ...uploaded].filter(
    (i) => projectId === "all" || i.projectId === projectId,
  );
  const estTotal = items.reduce((s, i) => s + i.quantity * i.estimatedRate, 0);
  const mktTotal = items.reduce((s, i) => s + i.quantity * i.marketRate, 0);
  const variance = ((mktTotal - estTotal) / estTotal) * 100;

  const stages = [...new Set(items.map((i) => i.stage))];

  const exportStage = (stage: string) => {
    const rows = items.filter((i) => i.stage === stage);
    const header = ["Code", "Description", "Unit", "Qty", "Est rate", "Market rate", "Amount"];
    const csv = [
      header.join(","),
      ...rows.map((i) =>
        [
          i.itemCode,
          `"${i.description.replace(/"/g, '""')}"`,
          i.unit,
          i.quantity,
          i.estimatedRate,
          i.marketRate,
          i.quantity * i.marketRate,
        ].join(","),
      ),
    ].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `BOQ-${stage.replace(/\s+/g, "-").toLowerCase()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setNotice(`Exported ${rows.length} line items from ${stage}.`);
  };

  const uploadStage = async (stage: string, file: File) => {
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    const body = lines.slice(/code/i.test(lines[0] ?? "") ? 1 : 0);
    const parsed: BoqRow[] = body.map((line, idx) => {
      const cells = line.match(/("([^"]|"")*"|[^,]*)/g)?.filter((_, k) => k % 2 === 0) ?? [];
      const cell = (n: number) => (cells[n] ?? "").replace(/^"|"$/g, "").replace(/""/g, '"').trim();
      const est = Number(cell(4)) || 0;
      const mkt = Number(cell(5)) || est;
      return {
        ...(boqItems[0] as BoqRow),
        id: `upl-${stage}-${Date.now()}-${idx}`,
        projectId: projectId === "all" ? boqItems[0]!.projectId : projectId,
        stage,
        itemCode: cell(0) || `NEW-${idx + 1}`,
        description: cell(1) || "Uploaded line item",
        unit: cell(2) || "nos",
        quantity: Number(cell(3)) || 0,
        estimatedRate: est,
        marketRate: mkt,
        alternatives: [],
      } as BoqRow;
    });
    setUploaded((prev) => [...prev, ...parsed]);
    setNotice(`Uploaded ${parsed.length} line items into ${stage}.`);
  };


  return (
    <Shell
      title="BOQ & Rate Intelligence"
      subtitle="Dynamic bill of quantities benchmarked against live Hyderabad market rates"
      actions={
        <>
          <select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="h-8 rounded border border-input bg-card px-2 text-[13px]"
          >
            <option value="all">All projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <ActionButton variant="secondary">Import proforma (OCR)</ActionButton>
          <ActionButton>Export BOQ</ActionButton>
        </>
      }
    >
      {notice && (
        <div className="mb-3 flex items-center justify-between gap-2 rounded-lg border border-primary/30 bg-primary-soft px-3 py-2 text-[13px] text-primary">
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice(null)} className="text-xs font-semibold underline">
            Dismiss
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricTile label="Estimated value" value={inrCompact(estTotal)} />
        <MetricTile label="At market rate" value={inrCompact(mktTotal)} />
        <MetricTile
          label="Rate variance"
          value={`${variance > 0 ? "+" : ""}${variance.toFixed(1)}%`}
          delta={variance > 0 ? "Above estimate" : "Under estimate"}
          tone={variance > 0 ? "bad" : "good"}
        />
        <MetricTile label="Line items" value={String(items.length)} delta={`${stages.length} stages`} />
      </div>

      <div className="mt-3 grid gap-3 xl:grid-cols-[2fr_1fr]">
        <Section title="Bill of quantities">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-[13px]">
              <thead>
                <tr className="border-b border-border bg-secondary/60">
                  {["Code", "Description", "Unit", "Qty", "Est. rate", "Market", "Amount", ""].map(
                    (h) => (
                      <th
                        key={h}
                        className="label-caps px-3 py-2 text-left font-medium text-muted-foreground"
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              {stages.map((stage) => (
                <tbody key={stage}>
                  <tr>
                    <td
                      colSpan={8}
                      className="border-y border-border bg-secondary/40 px-3 py-1.5"
                    >
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="label-caps text-muted-foreground">{stage}</span>
                        <div className="flex items-center gap-1.5">
                          <label className="inline-flex cursor-pointer items-center gap-1 rounded border border-input bg-card px-2 py-1 text-[11px] font-semibold hover:bg-secondary">
                            <Upload className="size-3" /> Upload
                            <input
                              type="file"
                              accept=".csv,text/csv"
                              className="hidden"
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) void uploadStage(stage, f);
                                e.target.value = "";
                              }}
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() => exportStage(stage)}
                            className="inline-flex items-center gap-1 rounded border border-input bg-card px-2 py-1 text-[11px] font-semibold hover:bg-secondary"
                          >
                            <Download className="size-3" /> Export
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>

                  {items
                    .filter((i) => i.stage === stage)
                    .map((i) => {
                      const varPct = ((i.marketRate - i.estimatedRate) / i.estimatedRate) * 100;
                      const open = openRow === i.id;
                      return (
                        <>
                          <tr
                            key={i.id}
                            className="border-b border-border hover:bg-secondary/40"
                          >
                            <td className="px-3 py-2 font-medium tnum">{i.itemCode}</td>
                            <td className="px-3 py-2">
                              <p className="max-w-xs truncate">{i.description}</p>
                              <StatusBadge tone="slate">{i.selectedBrand}</StatusBadge>
                            </td>
                            <td className="px-3 py-2 text-muted-foreground">{i.unit}</td>
                            <td className="px-3 py-2 tnum">{num(i.quantity, 2)}</td>
                            <td className="px-3 py-2 tnum">{inr(i.estimatedRate)}</td>
                            <td className="px-3 py-2">
                              <span className="tnum">{inr(i.marketRate)}</span>{" "}
                              <TrendPill
                                tone={varPct > 0 ? "bad" : "good"}
                                label={`${varPct > 0 ? "+" : ""}${varPct.toFixed(1)}%`}
                              />
                            </td>
                            <td className="px-3 py-2 font-semibold tnum">
                              {inrCompact(i.quantity * i.marketRate)}
                            </td>
                            <td className="px-3 py-2">
                              <button
                                onClick={() => setOpenRow(open ? null : i.id)}
                                className="grid size-6 place-items-center rounded border border-input hover:bg-secondary"
                                aria-label="Toggle brand alternatives"
                              >
                                <ChevronDown
                                  className={`size-3 transition-transform ${open ? "rotate-180" : ""}`}
                                />
                              </button>
                            </td>
                          </tr>
                          {open && (
                            <tr key={i.id + "-alt"} className="border-b border-border bg-secondary/30">
                              <td colSpan={8} className="px-3 py-2">
                                <p className="label-caps mb-1.5 text-muted-foreground">
                                  Alternative brands
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {i.alternatives.map((a) => (
                                    <div
                                      key={a.brand}
                                      className="rounded border border-border bg-card px-2.5 py-1.5"
                                    >
                                      <p className="text-xs font-semibold">{a.brand}</p>
                                      <p className="text-[11px] text-muted-foreground">
                                        {a.supplier}
                                      </p>
                                      <div className="mt-1 flex items-center gap-1.5">
                                        <span className="text-xs font-semibold tnum">
                                          {inr(a.rate)}
                                        </span>
                                        <TrendPill
                                          tone={a.variancePct < 0 ? "good" : "bad"}
                                          label={`${a.variancePct > 0 ? "+" : ""}${a.variancePct}%`}
                                        />
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </td>
                            </tr>
                          )}
                        </>
                      );
                    })}
                </tbody>
              ))}
            </table>
          </div>
        </Section>

        <Section title="Market rate feed — Hyderabad / Telangana">
          <ul className="divide-y divide-border">
            {materialRates.map((m) => (
              <li key={m.id} className="flex items-center justify-between gap-2 px-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-medium">{m.brand}</p>
                  <p className="label-caps text-muted-foreground">
                    {m.category} · {m.updated}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[13px] font-semibold tnum">
                    {inr(m.unitPrice)}
                    <span className="text-[10px] font-normal text-muted-foreground">/{m.unit}</span>
                  </p>
                  <TrendPill
                    tone={m.trend === "UP" ? "bad" : m.trend === "DOWN" ? "good" : "neutral"}
                    label={`${m.changePct > 0 ? "+" : ""}${m.changePct}%`}
                  />
                </div>
              </li>
            ))}
          </ul>
        </Section>
      </div>
    </Shell>
  );
}
