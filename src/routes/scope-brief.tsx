import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { BookOpen, FileDown, Printer, CheckSquare, Square } from "lucide-react";
import { Shell } from "@/components/saha/Shell";
import { useActiveProject } from "@/hooks/useActiveProject";

export const Route = createFileRoute("/scope-brief")({
  head: () => ({
    meta: [
      { title: "Architect & Consultant Scope Brief — Saha OS" },
      { name: "description", content: "Pick engineering packages, build the consultant drawing list and export it as CSV or a printable brief." },
      { property: "og:title", content: "Architect & Consultant Scope Brief — Saha OS" },
      { property: "og:description", content: "Pick engineering packages, build the consultant drawing list and export it as CSV or a printable brief." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

type Drawing = { code: string; title: string; scale: string; format: string; boq: string };
type Pkg = { key: string; name: string; note: string; drawings: Drawing[] };

const PACKAGES: Pkg[] = [
  {
    key: "A",
    name: "Package A: Architectural",
    note: "Floor plans, elevations, sections, finish specs",
    drawings: [
      { code: "A01", title: "Master Site Plan", scale: "1:500", format: "DWG / PDF", boq: "BOQ-CIV-01" },
      { code: "A02", title: "Typical Floor Plan", scale: "1:100", format: "DWG / Revit", boq: "BOQ-CIV-04" },
      { code: "A03", title: "Elevations & Sections", scale: "1:100", format: "DWG / PDF", boq: "BOQ-CIV-05" },
      { code: "A04", title: "Finish Schedule", scale: "NTS", format: "PDF / XLSX", boq: "BOQ-FIN-01" },
    ],
  },
  {
    key: "B",
    name: "Package B: Structural",
    note: "Foundations, columns, slabs, bar bending schedule",
    drawings: [
      { code: "S01", title: "Piling Layout & Pile Cap Details", scale: "1:50", format: "DWG / IFC", boq: "BOQ-STR-01" },
      { code: "S02", title: "Foundation Excavation & Raft Slab", scale: "1:100", format: "DWG / IFC", boq: "BOQ-STR-02" },
      { code: "S03", title: "Column Layout & Schedule", scale: "1:100", format: "DWG", boq: "BOQ-STR-04" },
      { code: "S04", title: "Bar Bending Schedule", scale: "NTS", format: "XLSX", boq: "BOQ-STR-06" },
    ],
  },
  {
    key: "C",
    name: "Package C: Electrical",
    note: "HT/LT schematics, lighting layouts, DB schedules",
    drawings: [
      { code: "E01", title: "HT Incoming Substation Layout", scale: "1:50", format: "DWG / PDF", boq: "BOQ-ELC-01" },
      { code: "E02", title: "LT Panel & DB Schedule", scale: "NTS", format: "PDF", boq: "BOQ-ELC-03" },
      { code: "E03", title: "Lighting & Power Layout", scale: "1:100", format: "DWG", boq: "BOQ-ELC-05" },
    ],
  },
  {
    key: "D",
    name: "Package D: Plumbing & Fire",
    note: "Water supply, drainage, sprinklers, riser diagrams",
    drawings: [
      { code: "P01", title: "Basement Drainage & Sump Sizing", scale: "1:100", format: "DWG / PDF", boq: "BOQ-PLU-01" },
      { code: "P02", title: "Water Supply Riser Diagram", scale: "NTS", format: "DWG", boq: "BOQ-PLU-03" },
      { code: "F01", title: "Fire Sprinkler & Hydrant Layout", scale: "1:100", format: "DWG", boq: "BOQ-FIR-01" },
    ],
  },
  {
    key: "E",
    name: "Package E: Waterproofing",
    note: "Basement, podium, terrace, toilet wet areas",
    drawings: [
      { code: "W01", title: "Basement & Retaining Wall Waterproofing", scale: "1:20", format: "PDF", boq: "BOQ-WPF-01" },
      { code: "W02", title: "Terrace & Toilet Wet Area Details", scale: "1:20", format: "PDF", boq: "BOQ-WPF-02" },
    ],
  },
  {
    key: "F",
    name: "Package F: Flooring & Tiling",
    note: "Stone layouts, skirting details, tile patterns",
    drawings: [
      { code: "FL01", title: "Flooring Layout — Typical Unit", scale: "1:50", format: "DWG", boq: "BOQ-FLR-01" },
      { code: "FL02", title: "Lobby Stone Setting & Skirting", scale: "1:20", format: "DWG", boq: "BOQ-FLR-03" },
    ],
  },
  {
    key: "G",
    name: "Package G: Masonry & Plaster",
    note: "AAC blockwork, lintel levels, external plaster grooves",
    drawings: [
      { code: "M01", title: "Blockwork Layout & Lintel Levels", scale: "1:100", format: "DWG", boq: "BOQ-MAS-01" },
      { code: "M02", title: "External Plaster Groove Details", scale: "1:10", format: "PDF", boq: "BOQ-MAS-03" },
    ],
  },
  {
    key: "H",
    name: "Package H: Painting & Finishes",
    note: "Internal / external colour schedules, texture specs",
    drawings: [
      { code: "PT01", title: "External Colour Scheme", scale: "NTS", format: "PDF", boq: "BOQ-PNT-01" },
      { code: "PT02", title: "Internal Paint Schedule", scale: "NTS", format: "XLSX", boq: "BOQ-PNT-02" },
    ],
  },
  {
    key: "I",
    name: "Package I: False Ceiling",
    note: "Gypsum / grid ceiling levels, cove details, HVAC integration",
    drawings: [
      { code: "FC01", title: "Ceiling Level & Layout Plan", scale: "1:50", format: "DWG", boq: "BOQ-CLG-01" },
      { code: "FC02", title: "Cove & Service Integration Details", scale: "1:10", format: "PDF", boq: "BOQ-CLG-02" },
    ],
  },
  {
    key: "J",
    name: "Package J: External Development",
    note: "Paving, compound wall, landscape, storm water drains",
    drawings: [
      { code: "X01", title: "Compound Wall & Gate Details", scale: "1:50", format: "DWG", boq: "BOQ-EXT-01" },
      { code: "X02", title: "Paving & Storm Water Drain Layout", scale: "1:200", format: "DWG", boq: "BOQ-EXT-03" },
      { code: "X03", title: "Landscape & Planting Plan", scale: "1:200", format: "PDF", boq: "BOQ-EXT-05" },
    ],
  },
  {
    key: "K",
    name: "Package K: Specialist / Vendor",
    note: "Facade glazing, elevators, solar panels, STP unit",
    drawings: [
      { code: "SP01", title: "Facade Glazing Shop Drawings", scale: "1:20", format: "DWG", boq: "BOQ-SPL-01" },
      { code: "SP02", title: "Elevator Shaft & Machine Room", scale: "1:50", format: "DWG", boq: "BOQ-SPL-02" },
      { code: "SP03", title: "STP & Solar Layout", scale: "1:100", format: "DWG", boq: "BOQ-SPL-04" },
    ],
  },
];

const CONSULTANTS = [
  "Ar. Vikram Aditya (Architecture)",
  "Er. Rajesh Sharma (Structural)",
  "Mr. K. S. Rao (Electrical / MEP)",
  "Ms. Ananya Desai (Landscape)",
];

function download(name: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

function esc(v: string) {
  return `"${String(v).replace(/"/g, '""')}"`;
}

function Page() {
  const project = useActiveProject();
  const [selected, setSelected] = useState<string[]>(["A", "B", "C", "D"]);
  const [consultant, setConsultant] = useState(CONSULTANTS[0]);
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("");

  const rows = useMemo(
    () =>
      PACKAGES.filter((p) => selected.includes(p.key)).flatMap((p) =>
        p.drawings.map((d) => ({ pkg: p.name, ...d })),
      ),
    [selected],
  );

  const toggle = (key: string) =>
    setSelected((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));

  const exportCsv = () => {
    if (rows.length === 0) {
      setStatus("Select at least one package before exporting.");
      return;
    }
    const head = ["Package", "Code", "Title", "Scale", "Format", "BOQ Link"];
    const csv = [
      head.map(esc).join(","),
      ...rows.map((r) => [r.pkg, r.code, r.title, r.scale, r.format, r.boq].map(esc).join(",")),
    ].join("\n");
    download(`scope-brief-${(project.name || "project").replace(/\s+/g, "-")}.csv`, csv, "text/csv");
    setStatus(`Exported ${rows.length} drawing lines as CSV.`);
  };

  const printBrief = () => {
    if (rows.length === 0) {
      setStatus("Select at least one package before generating the brief.");
      return;
    }
    const w = window.open("", "_blank");
    if (!w) {
      setStatus("Your browser blocked the print window — allow pop-ups and try again.");
      return;
    }
    const body = rows
      .map(
        (r) =>
          `<tr><td>${r.pkg}</td><td>${r.code}</td><td>${r.title}</td><td>${r.scale}</td><td>${r.format}</td><td>${r.boq}</td></tr>`,
      )
      .join("");
    w.document.write(`<!doctype html><html><head><title>Scope Brief — ${project.name}</title>
      <style>body{font-family:system-ui,sans-serif;padding:32px;color:#111}h1{font-size:20px}
      table{width:100%;border-collapse:collapse;margin-top:16px;font-size:12px}
      th,td{border:1px solid #ccc;padding:6px;text-align:left}th{background:#f1f5f9}</style></head><body>
      <h1>Architect &amp; Consultant Scope Brief</h1>
      <p><strong>Project:</strong> ${project.name} · ${project.location}<br/>
      <strong>Consultant:</strong> ${consultant}<br/>
      <strong>Packages:</strong> ${selected.sort().join(", ")} · <strong>Drawings:</strong> ${rows.length}<br/>
      <strong>Date:</strong> ${new Date().toLocaleDateString("en-IN")}</p>
      ${notes ? `<p><strong>Instructions:</strong> ${notes}</p>` : ""}
      <table><thead><tr><th>Package</th><th>Code</th><th>Title</th><th>Scale</th><th>Format</th><th>BOQ Link</th></tr></thead>
      <tbody>${body}</tbody></table></body></html>`);
    w.document.close();
    w.focus();
    w.print();
    setStatus("Brief opened in a new tab — use Save as PDF in the print dialog.");
  };

  return (
    <Shell title="Architect & Consultant Scope Brief">
      <div className="space-y-6">
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/80">
            Scope brief hub · packages A to K
          </p>
          <h1 className="flex items-center gap-3 text-2xl font-extrabold uppercase tracking-tight text-foreground sm:text-3xl">
            <BookOpen className="h-7 w-7 text-primary" />
            Architect & Consultant Scope Brief
          </h1>
          <p className="max-w-3xl text-sm text-muted-foreground">
            Tick the engineering packages for {project.name}. The drawing list below builds itself and
            can be exported as a spreadsheet or a printable brief for your consultant.
          </p>
        </header>

        <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-border bg-card p-4">
          <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Consultant
            <select
              value={consultant}
              onChange={(e) => setConsultant(e.target.value)}
              className="min-w-[260px] rounded-xl border border-border bg-background px-3 py-2 text-sm font-normal normal-case text-foreground"
            >
              {CONSULTANTS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-1 flex-col gap-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Instructions to consultant (optional)
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. issue Rev 03 for tender by 20th"
              className="rounded-xl border border-border bg-background px-3 py-2 text-sm font-normal normal-case text-foreground"
            />
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={printBrief}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
            >
              <Printer className="h-4 w-4" />
              Generate PDF brief
            </button>
            <button
              type="button"
              onClick={exportCsv}
              className="inline-flex items-center gap-2 rounded-xl border border-primary/40 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary"
            >
              <FileDown className="h-4 w-4" />
              Export CSV
            </button>
          </div>
        </div>

        {status ? (
          <p className="rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-foreground">
            {status}
          </p>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider text-primary">
                Select engineering packages
              </h2>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelected(PACKAGES.map((p) => p.key))}
                  className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold"
                >
                  Select all
                </button>
                <button
                  type="button"
                  onClick={() => setSelected([])}
                  className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold"
                >
                  Clear
                </button>
              </div>
            </div>
            <div className="divide-y divide-border rounded-2xl border border-border bg-card">
              {PACKAGES.map((p) => {
                const on = selected.includes(p.key);
                return (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => toggle(p.key)}
                    className="flex w-full items-center justify-between gap-3 p-3 text-left"
                  >
                    <span className="flex items-start gap-3">
                      {on ? (
                        <CheckSquare className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                      ) : (
                        <Square className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
                      )}
                      <span>
                        <span className="block text-sm font-semibold text-foreground">{p.name}</span>
                        <span className="block text-xs text-muted-foreground">{p.note}</span>
                      </span>
                    </span>
                    <span className="shrink-0 rounded-lg bg-muted px-2 py-1 text-xs font-semibold text-muted-foreground">
                      {p.drawings.length} dwg
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="overflow-hidden rounded-2xl border border-border bg-card">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-muted/40 px-4 py-3">
                <h2 className="text-sm font-bold uppercase tracking-wider text-primary">
                  Generated brief itemization
                </h2>
                <span className="text-xs text-muted-foreground">
                  {selected.length} packages · <strong className="text-foreground">{rows.length} drawings</strong>
                </span>
              </div>
              {rows.length === 0 ? (
                <p className="p-6 text-sm text-muted-foreground">
                  Pick a package on the left to build the drawing list.
                </p>
              ) : (
                <div className="max-h-[520px] overflow-auto">
                  <table className="w-full min-w-[560px] text-sm">
                    <thead className="sticky top-0 bg-card">
                      <tr className="border-b border-border text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        <th className="px-4 py-2">Code & title</th>
                        <th className="px-4 py-2">Scale</th>
                        <th className="px-4 py-2">Format</th>
                        <th className="px-4 py-2">BOQ link</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((r) => (
                        <tr key={r.code} className="border-b border-border/60">
                          <td className="px-4 py-2">
                            <span className="block font-semibold text-foreground">
                              {r.code} — {r.title}
                            </span>
                            <span className="block text-xs text-muted-foreground">{r.pkg}</span>
                          </td>
                          <td className="px-4 py-2">{r.scale}</td>
                          <td className="px-4 py-2">{r.format}</td>
                          <td className="px-4 py-2 font-semibold text-primary">{r.boq}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Shell>
  );
}
