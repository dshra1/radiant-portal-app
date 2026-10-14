import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  FileSpreadsheet,
  FileText,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  CircleSlash,
} from "lucide-react";
import { Shell } from "@/components/saha/Shell";
import { Section, StatusBadge } from "@/components/saha/ui";
import { useActiveProject } from "@/hooks/useActiveProject";
import { useAccess } from "@/lib/access";
import { boqTotals } from "@/lib/boq-totals";
import {
  readWorkbook,
  detectKind,
  parseMasterBoq,
  parseSplit,
  parseControl,
  parseQuotation,
  buildBoqRows,
  type MasterBoq,
  type WorkbookKind,
  type AppBoqRow,
  type ControlData,
  type QuotePackage,
} from "@/lib/project-workbooks";
import {
  importBoq,
  importProgramme,
  importProjectDates,
  importProjectFigures,
  importMaterials,
  importTenders,
  importDrawings,
  drawingFileName,
  importQuality,
} from "@/lib/project-import";

export const Route = createFileRoute("/project-import")({
  head: () => ({
    meta: [
      { title: "Import PMC Workbooks — Saha OS" },
      {
        name: "description",
        content:
          "Bring the PMC master BOQ, common vs individual split, programme, material plan, quotation packages and drawing sets into the project.",
      },
      { property: "og:title", content: "Import PMC Workbooks — Saha OS" },
      {
        property: "og:description",
        content:
          "Load the PMC workbooks and drawing sets into BOQ, programme, stores, tenders and drawings.",
      },
    ],
  }),
  component: Page,
});

type Loaded = {
  name: string;
  kind: WorkbookKind | "pdf";
  error?: string;
};

type Parsed = {
  boq: {
    rows: AppBoqRow[];
    stale: string[];
    splitUsed: number;
    hasSplit: boolean;
    master: MasterBoq;
  } | null;
  control: ControlData | null;
  tenders: QuotePackage[] | null;
  pdfs: File[];
};

const KIND_LABEL: Record<Loaded["kind"], string> = {
  master: "Master BOQ (original specs)",
  "value-engineered": "Value-engineered BOQ",
  split: "Common vs individual split",
  quotation: "BOQ for quotation (vendor packages)",
  control: "Construction control (programme, materials, QA)",
  pdf: "Drawing set (PDF)",
  unknown: "Not recognised",
};

function inr(n: number) {
  if (Math.abs(n) >= 1e7) return `₹${(n / 1e7).toFixed(2)} Cr`;
  if (Math.abs(n) >= 1e5) return `₹${(n / 1e5).toFixed(2)} L`;
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(`${iso}T12:00:00`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function Page() {
  const project = useActiveProject();
  const qc = useQueryClient();
  const { access } = useAccess();
  const canImport = Boolean(access?.isAdmin || access?.roles.includes("pm"));

  const [loaded, setLoaded] = useState<Loaded[]>([]);
  const [parsed, setParsed] = useState<Parsed>({
    boq: null,
    control: null,
    tenders: null,
    pdfs: [],
  });
  const [reading, setReading] = useState(false);
  const [pick, setPick] = useState({
    boq: true,
    programme: true,
    dates: true,
    materials: true,
    tenders: true,
    drawings: true,
  });
  const [running, setRunning] = useState(false);
  const [log, setLog] = useState<{ text: string; tone: "ok" | "err" }[]>([]);
  const [done, setDone] = useState(false);

  async function readFiles(list: FileList) {
    setReading(true);
    setDone(false);
    setLog([]);
    const found: Loaded[] = [];
    let master: ReturnType<typeof parseMasterBoq> | null = null;
    let split: ReturnType<typeof parseSplit> | null = null;
    let control: ControlData | null = null;
    let tenders: QuotePackage[] | null = null;
    const pdfs: File[] = [];

    for (const f of Array.from(list)) {
      if (/\.pdf$/i.test(f.name)) {
        found.push({ name: f.name, kind: "pdf" });
        pdfs.push(f);
        continue;
      }
      if (!/\.xlsx?$/i.test(f.name)) {
        found.push({
          name: f.name,
          kind: "unknown",
          error: "Only .xlsx workbooks and .pdf drawings are read here.",
        });
        continue;
      }
      try {
        const wb = readWorkbook(await f.arrayBuffer());
        const kind = detectKind(wb, f.name);
        found.push({ name: f.name, kind });
        if (kind === "master") master = parseMasterBoq(wb);
        if (kind === "split") split = parseSplit(wb);
        if (kind === "control") control = parseControl(wb);
        if (kind === "quotation") tenders = parseQuotation(wb);
      } catch (e) {
        found.push({ name: f.name, kind: "unknown", error: (e as Error).message });
      }
    }

    // Two copies of the same PDF (Downloads adds _1): keep one per clean name.
    const uniquePdfs = [...new Map(pdfs.map((p) => [drawingFileName(p.name), p])).values()];
    const boq = master
      ? { ...buildBoqRows(master, split), hasSplit: Boolean(split), master }
      : null;
    setLoaded(found);
    setParsed({ boq, control, tenders, pdfs: uniquePdfs });
    setReading(false);
  }

  const boqSums = useMemo(
    () => boqTotals(parsed.boq?.rows ?? [], parsed.boq?.master.contingencyPct || 5),
    [parsed.boq],
  );

  const tenderSums = useMemo(() => {
    const t = parsed.tenders ?? [];
    return {
      items: t.reduce((s, p) => s + p.items.length, 0),
      benchmark: t.reduce(
        (s, p) => s + p.items.reduce((a, i) => a + i.qty * i.benchmarkRate, 0),
        0,
      ),
    };
  }, [parsed.tenders]);

  const stockedCount = parsed.control?.materials.filter((m) => m.stocked).length ?? 0;
  const anything =
    (pick.boq && parsed.boq) ||
    (pick.programme && parsed.control) ||
    (pick.materials && parsed.control) ||
    (pick.tenders && parsed.tenders) ||
    (pick.drawings && parsed.pdfs.length > 0);

  async function run() {
    if (!project.id) return;
    setRunning(true);
    setDone(false);
    const lines: { text: string; tone: "ok" | "err" }[] = [];
    const say = (text: string, tone: "ok" | "err" = "ok") => {
      lines.push({ text, tone });
      setLog([...lines]);
    };
    const step = async (label: string, fn: () => Promise<void>) => {
      try {
        await fn();
      } catch (e) {
        say(`${label} stopped: ${(e as Error).message}`, "err");
      }
    };
    if (pick.boq && parsed.boq) {
      await step("BOQ", () => importBoq(project.id, parsed.boq!.rows, say));
      await step("Project figures", () =>
        importProjectFigures(project.id, parsed.boq!.master, parsed.boq!.rows, say),
      );
    }
    if (pick.programme && parsed.control)
      await step("Programme", () => importProgramme(project.id, parsed.control!, say));
    if (pick.dates && pick.programme && parsed.control)
      await step("Project dates", () => importProjectDates(project.id, parsed.control!, say));
    if (pick.programme && parsed.control)
      await step("Quality", () => importQuality(project.id, parsed.control!, say));
    if (pick.materials && parsed.control)
      await step("Materials", () => importMaterials(project.id, parsed.control!, say));
    if (pick.tenders && parsed.tenders)
      await step("Tenders", () =>
        importTenders(project.id, parsed.tenders!, access?.userId ?? undefined, say),
      );
    if (pick.drawings && parsed.pdfs.length)
      await step("Drawings", () => importDrawings(project.id, parsed.pdfs, say));
    await qc.invalidateQueries();
    setRunning(false);
    setDone(true);
  }

  const Check = ({ k, label }: { k: keyof typeof pick; label: string }) => (
    <label className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
      <input
        type="checkbox"
        className="h-4 w-4 accent-[var(--color-primary)]"
        checked={pick[k]}
        onChange={(e) => setPick({ ...pick, [k]: e.target.checked })}
      />
      {label}
    </label>
  );

  return (
    <Shell title="Import PMC Workbooks">
      <div className="space-y-6">
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/80">
            Project data · {project.name}
          </p>
          <h1 className="flex items-center gap-3 text-2xl font-extrabold uppercase tracking-tight text-foreground sm:text-3xl">
            <FileSpreadsheet className="h-7 w-7 text-primary" />
            Import PMC workbooks
          </h1>
          <p className="max-w-3xl text-sm text-muted-foreground">
            Load the PMC master BOQ, the common vs individual split, the construction control
            workbook, the BOQ for quotation and the drawing PDFs. Each part goes into the module
            that uses it: BOQ Engine, Site Execution, Inventory, Tender Comparison and the drawing
            register. You can run it again whenever a workbook is revised; site progress, stock
            movements and vendor bids are kept.
          </p>
        </header>

        <Section title="1 · Choose the files">
          <div className="space-y-4 p-4">
            <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-primary/40 bg-primary/5 px-4 py-8 text-center">
              {reading ? (
                <Loader2 className="h-7 w-7 animate-spin text-primary" />
              ) : (
                <Upload className="h-7 w-7 text-primary" />
              )}
              <span className="text-sm font-semibold text-foreground">
                {reading ? "Reading workbooks…" : "Select all the workbooks and PDFs together"}
              </span>
              <span className="max-w-xl text-xs text-muted-foreground">
                Cyber-Enclave-Master-BOQ, -Common-vs-Individual, -Construction-Control,
                -BOQ-for-Quotation (.xlsx) and the drawing sets (.pdf). Files are read in your
                browser; nothing is saved until you press Import.
              </span>
              <input
                type="file"
                multiple
                accept=".xlsx,.xls,.pdf"
                className="hidden"
                disabled={reading || running}
                onChange={(e) => {
                  if (e.target.files?.length) void readFiles(e.target.files);
                  e.target.value = "";
                }}
              />
            </label>

            {loaded.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[520px] text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                      <th className="py-2 pr-3">File</th>
                      <th className="py-2">Recognised as</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loaded.map((f) => (
                      <tr key={f.name} className="border-b border-border/60">
                        <td className="py-2 pr-3 font-medium text-foreground">
                          <span className="inline-flex items-center gap-2">
                            {f.kind === "pdf" ? (
                              <FileText className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                            )}
                            {f.name}
                          </span>
                        </td>
                        <td className="py-2">
                          <StatusBadge
                            tone={
                              f.kind === "unknown"
                                ? "red"
                                : f.kind === "value-engineered"
                                  ? "amber"
                                  : "emerald"
                            }
                          >
                            {KIND_LABEL[f.kind]}
                          </StatusBadge>
                          {f.kind === "value-engineered" && (
                            <span className="ml-2 text-xs text-muted-foreground">
                              kept as a scenario; the BOQ Engine takes the original-spec master BOQ
                            </span>
                          )}
                          {f.error && <span className="ml-2 text-xs text-rose-600">{f.error}</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </Section>

        {loaded.length > 0 && (
          <Section title="2 · Check what will be imported">
            <div className="grid gap-4 p-4 lg:grid-cols-2">
              <Card
                title="BOQ Engine"
                ok={Boolean(parsed.boq)}
                missing="Add the master BOQ workbook."
                check={<Check k="boq" label="Import" />}
              >
                {parsed.boq && (
                  <>
                    <Fact label="Lines" value={parsed.boq.rows.length.toLocaleString("en-IN")} />
                    <Fact label="Packages" value={String(parsed.boq.master.packages.length)} />
                    <Fact label="Sub-total excl. GST" value={inr(boqSums.subtotal.excl)} />
                    <Fact label="Sub-total incl. GST" value={inr(boqSums.subtotal.incl)} />
                    <Fact
                      label={`Project cost incl. GST + ${boqSums.contingencyPct}% contingency`}
                      value={inr(boqSums.project.incl)}
                    />
                    <Fact label="Common works incl. GST" value={inr(boqSums.common.incl)} />
                    <Fact
                      label="Individual (all flats) incl. GST"
                      value={inr(boqSums.individual.incl)}
                    />
                    {parsed.boq.master.budget > 0 && (
                      <Fact
                        label={`Budget (₹${parsed.boq.master.budgetRatePerSft.toLocaleString("en-IN")}/sft × ${parsed.boq.master.saleableSft.toLocaleString("en-IN")} sft)`}
                        value={inr(parsed.boq.master.budget)}
                      />
                    )}
                    <p className="pt-1 text-xs text-muted-foreground">
                      {parsed.boq.hasSplit
                        ? `${parsed.boq.splitUsed} lines split into common and individual rows.`
                        : "No split workbook: every line goes in as common."}{" "}
                      Replaces the previous workbook import; rows added by hand, AI rows and labour
                      rows stay.
                    </p>
                    {parsed.boq.stale.length > 0 && (
                      <p className="text-xs text-amber-700">
                        Kept whole as common (the split workbook is older than these lines):{" "}
                        {parsed.boq.stale.join(", ")}.
                      </p>
                    )}
                  </>
                )}
              </Card>

              <Card
                title="Programme (Site Execution)"
                ok={Boolean(parsed.control)}
                missing="Add the construction control workbook."
                check={<Check k="programme" label="Import" />}
              >
                {parsed.control && (
                  <>
                    <Fact label="Stages" value={String(parsed.control.stages.length)} />
                    <Fact label="Ground work starts" value={fmtDate(parsed.control.startDate)} />
                    <Fact
                      label="Last finish (handover)"
                      value={fmtDate(parsed.control.completion)}
                    />
                    <div className="pt-1">
                      <Check k="dates" label="Also set the project's start and handover dates" />
                    </div>
                  </>
                )}
              </Card>

              <Card
                title="Materials (Inventory)"
                ok={Boolean(parsed.control)}
                missing="Comes from the construction control workbook."
                check={<Check k="materials" label="Import" />}
              >
                {parsed.control && (
                  <>
                    <Fact label="Stocked materials" value={String(stockedCount)} />
                    <p className="pt-1 text-xs text-muted-foreground">
                      Each with its reorder level, first-need date and order-by date. Opening stock
                      and movements are not changed.
                    </p>
                  </>
                )}
              </Card>

              <Card
                title="Tenders (RFQs)"
                ok={Boolean(parsed.tenders)}
                missing="Add the BOQ for quotation workbook."
                check={<Check k="tenders" label="Import" />}
              >
                {parsed.tenders && (
                  <>
                    <Fact label="Vendor packages" value={String(parsed.tenders.length)} />
                    <Fact label="Items" value={String(tenderSums.items)} />
                    <Fact label="PMC benchmark, excl. GST" value={inr(tenderSums.benchmark)} />
                    <p className="pt-1 text-xs text-muted-foreground">
                      One RFQ per package (CE-PKG-01 …) with the PMC rate as the benchmark. RFQs
                      that already have bids or are awarded are not changed.
                    </p>
                  </>
                )}
              </Card>

              <Card
                title="Drawings"
                ok={parsed.pdfs.length > 0}
                missing="Add the drawing PDFs."
                check={<Check k="drawings" label="Upload" />}
              >
                {parsed.pdfs.length > 0 && (
                  <ul className="space-y-1 text-xs text-foreground">
                    {parsed.pdfs.map((p) => (
                      <li key={p.name}>
                        {drawingFileName(p.name)}{" "}
                        <span className="text-muted-foreground">
                          ({(p.size / 1024 / 1024).toFixed(1)} MB)
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </div>
          </Section>
        )}

        {loaded.length > 0 && (
          <Section title="3 · Import">
            <div className="space-y-4 p-4">
              {!project.id ? (
                <p className="text-sm text-rose-600">Select a project first (top bar).</p>
              ) : !canImport ? (
                <p className="text-sm text-muted-foreground">
                  Only an admin or project manager can import into the project.
                </p>
              ) : (
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    disabled={!anything || running}
                    onClick={() => void run()}
                    className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
                  >
                    {running ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    {running ? "Importing…" : `Import into ${project.name}`}
                  </button>
                  {!/cyber/i.test(project.name) && (
                    <span className="inline-flex items-center gap-1 text-xs text-amber-700">
                      <AlertTriangle className="h-4 w-4" /> The selected project is not Cyber
                      Enclave. Check before importing.
                    </span>
                  )}
                </div>
              )}

              {log.length > 0 && (
                <ul className="space-y-1 rounded-xl border border-border bg-card p-3 text-sm">
                  {log.map((l, i) => (
                    <li key={i} className={l.tone === "err" ? "text-rose-600" : "text-foreground"}>
                      {l.tone === "err" ? "✕ " : "✓ "}
                      {l.text}
                    </li>
                  ))}
                </ul>
              )}

              {done && (
                <div className="flex flex-wrap gap-2 text-sm">
                  <span className="text-muted-foreground">Open:</span>
                  <Link to="/boq-engine" className="font-semibold text-primary underline">
                    BOQ Engine
                  </Link>
                  <Link to="/site-execution" className="font-semibold text-primary underline">
                    Site Execution
                  </Link>
                  <Link to="/inventory-control" className="font-semibold text-primary underline">
                    Inventory
                  </Link>
                  <Link to="/tender-comparison" className="font-semibold text-primary underline">
                    Tender Comparison
                  </Link>
                  <Link to="/drawing-decipher" className="font-semibold text-primary underline">
                    Drawings
                  </Link>
                </div>
              )}
            </div>
          </Section>
        )}
      </div>
    </Shell>
  );
}

function Card({
  title,
  ok,
  missing,
  check,
  children,
}: {
  title: string;
  ok: boolean;
  missing: string;
  check: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2 rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-sm font-bold text-foreground">
          {ok ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          ) : (
            <CircleSlash className="h-4 w-4 text-muted-foreground" />
          )}
          {title}
        </h3>
        {ok && check}
      </div>
      {ok ? children : <p className="text-xs text-muted-foreground">{missing}</p>}
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-border/50 py-1 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold tabular-nums text-foreground">{value}</span>
    </div>
  );
}
