import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as XLSX from "xlsx";
import { supabase } from "@/integrations/supabase/client";
import { useSessionUser } from "@/lib/access";
import { Shell } from "@/components/saha/Shell";
import { Plus, Trash2, Save, Calculator, Tags, Download, Upload, Sparkles } from "lucide-react";
import { useActiveProject, useActiveProjectSetter } from "@/hooks/useActiveProject";

export const Route = createFileRoute("/brand-preferences")({
  head: () => ({
    meta: [
      { title: "Brand Preferences — Saha OS Next" },
      {
        name: "description",
        content:
          "Lock the makes you actually buy — cement, steel, CP & sanitaryware, CPVC, paint, wiring, switches — before the BOQ is estimated.",
      },
      { property: "og:title", content: "Brand Preferences — Saha OS Next" },
      {
        property: "og:description",
        content: "Set your preferred brands per material before generating the BOQ.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

export type BrandPref = {
  material: string;
  brand: string;
  series: string;
  supplier: string;
  notes: string;
};

type MaterialSpec = {
  material: string;
  hint: string;
  brand?: string;
  series?: string;
  notes?: string;
};

/** Cyber Enclave, Madhapur: the makes and specs in the PMC report (D-118 plans, master BOQ). */
const DEFAULT_MATERIALS: MaterialSpec[] = [
  {
    material: "Ready Mix Concrete (RMC)",
    hint: "Report: Nuvoco",
    brand: "Nuvoco",
    series: "M30 for all RCC; M25 only the stilt slab on grade",
    notes: "RMC by pour, pumped (D-91)",
  },
  {
    material: "TMT steel",
    hint: "Report: Jairaj",
    brand: "Jairaj",
    series: "Fe550D, IS 1786, 8\u201325 mm",
    notes: "Ordered by stage and bar size (steel order schedule)",
  },
  {
    material: "Cement",
    hint: "Report: Maha Cement",
    brand: "Maha Cement",
    series: "OPC 53",
    notes: "Masonry first course, plaster, screed",
  },
  {
    material: "AAC blocks",
    hint: "Report: Magicrete / Biltech / UltraTech Xtralite",
    brand: "Magicrete / Biltech / UltraTech Xtralite",
    series: "600\u00d7200\u00d7200 (8\u2033) external, 150 / 100 internal",
    notes: "To quote; density 551\u2013650 kg/m\u00b3 (D-57)",
  },
  {
    material: "Block adhesive",
    hint: "Report: Block maker's thin-bed adhesive",
    brand: "Block maker's thin-bed adhesive",
    series: "40 kg bags",
    notes: "Thin-bed 2\u20133 mm (D-57)",
  },
  {
    material: "Gypsum plaster",
    hint: "Report: Saint-Gobain Gyproc or equal",
    brand: "Saint-Gobain Gyproc or equal",
    series: "Dry rooms and reveals",
    notes: "Cement plaster in wet rooms",
  },
  {
    material: "Interior paint",
    hint: "Report: Asian Paints / Berger",
    brand: "Asian Paints / Berger",
    series: "Putty 2 coats, primer, 2 coats premium emulsion",
    notes: "To quote",
  },
  {
    material: "Exterior paint",
    hint: "Report: Asian Paints Apex Ultima / Berger WeatherCoat",
    brand: "Asian Paints Apex Ultima / Berger WeatherCoat",
    series: "Facade texture field ivory (D-128)",
    notes: "To quote",
  },
  {
    material: "Waterproofing",
    hint: "Report: Dr. Fixit / Fosroc",
    brand: "Dr. Fixit / Fosroc",
    series: "Cementitious 2 coats (toilets, balconies); PU membrane terrace",
    notes: "48 h ponding / flood test",
  },
  {
    material: "Floor tiles",
    hint: "Report: To quote",
    brand: "To quote",
    series: "Vitrified 800\u00d71600 (living, bedrooms); 600\u00d7600 anti-skid wet areas",
    notes: "D-118 specs",
  },
  {
    material: "Wall tiles",
    hint: "Report: To quote",
    brand: "To quote",
    series: "600\u00d71200 bathroom walls and shower accent",
    notes: "D-118 specs",
  },
  {
    material: "Main door",
    hint: "Report: Teak frame, teak-veneer flush shutter",
    brand: "Teak frame, teak-veneer flush shutter",
    series: "Yale YDME 100 NxT digital lock",
    notes: "D-118",
  },
  {
    material: "Internal doors",
    hint: "Report: Elegant / Kelvin Craft",
    brand: "Elegant / Kelvin Craft",
    series: "Veneer shutters, Europa locks, Jolly hinges; toilet doors WPC",
    notes: "D-118",
  },
  {
    material: "Windows",
    hint: "Report: Kelvin Craft / Jamex",
    brand: "Kelvin Craft / Jamex",
    series: "UPVC sliders, 5 mm black-tinted glass",
    notes: "Hose test each window",
  },
  {
    material: "Sanitaryware",
    hint: "Report: Kohler",
    brand: "Kohler",
    series:
      "Trace K-20217IN wall-hung WC on concealed cistern frame; Forefront / ModernLife basins",
    notes: "D-92 (Trace throughout)",
  },
  {
    material: "CP fittings",
    hint: "Report: Kohler",
    brand: "Kohler",
    series: "July shower sets, Accliv mixers, health faucets",
    notes: "D-91 vendor quotes",
  },
  {
    material: "Plumbing pipes",
    hint: "Report: Ashirvad",
    brand: "Ashirvad",
    series: "CPVC SDR 11 (water), SWR Type B (drainage)",
    notes: "No sunk slabs (D-84)",
  },
  {
    material: "Electrical wires",
    hint: "Report: Polycab",
    brand: "Polycab",
    series: "FR-LSH copper 1.5 / 2.5 / 4 sq mm",
    notes: "Navakar quote (D-91)",
  },
  {
    material: "Switches and sockets",
    hint: "Report: Legrand",
    brand: "Legrand",
    series: "Myrius",
    notes: "Boards per D-119",
  },
  {
    material: "Conduits",
    hint: "Report: ISI FRLS PVC",
    brand: "ISI FRLS PVC",
    series: "20 / 25 mm",
    notes: "Make to quote",
  },
  {
    material: "False ceiling",
    hint: "Report: Saint-Gobain Gyproc (Oman board)",
    brand: "Saint-Gobain Gyproc (Oman board)",
    series: "MR board in toilets",
    notes: "Cove LED bands",
  },
  {
    material: "Balcony ceilings",
    hint: "Report: Kelvin Craft / Jamex",
    brand: "Kelvin Craft / Jamex",
    series: "UPVC / PVC panels",
    notes: "D-77",
  },
  {
    material: "Lift",
    hint: "Report: Kone / Schindler / Johnson / Otis",
    brand: "Kone / Schindler / Johnson / Otis",
    series: "MRL, 8 persons / 544 kg, 6 stops",
    notes: "To quote",
  },
  {
    material: "Facade cladding",
    hint: "Report: Aludecor / Alstrong / Eurobond",
    brand: "Aludecor / Alstrong / Eurobond",
    series: "4 mm PVDF ACP champagne grey fins, portal frames (Option A)",
    notes: "D-128",
  },
  {
    material: "Common area granite",
    hint: "Report: Sadarahalli",
    brand: "Sadarahalli",
    series: "Lappato 18\u201320 mm",
    notes: "To quote",
  },
  {
    material: "Lights",
    hint: "Report: Philips / Wipro",
    brand: "Philips / Wipro",
    series: "LED downlights, bollards, gate lights",
    notes: "To quote",
  },
  {
    material: "Pumps",
    hint: "Report: Kirloskar / CRI; boosters Grundfos / CRI",
    brand: "Kirloskar / CRI; boosters Grundfos / CRI",
    series: "2 HP transfer pumps, booster sets floors 4\u20135",
    notes: "To quote",
  },
  {
    material: "LT panel",
    hint: "Report: L&T / Schneider",
    brand: "L&T / Schneider",
    series: "Common LT panel with MCCB",
    notes: "To quote",
  },
  {
    material: "DG set",
    hint: "Report: Kirloskar / Cummins",
    brand: "Kirloskar / Cummins",
    series: "25 kVA acoustic (lift, pumps, common)",
    notes: "To quote",
  },
  {
    material: "CCTV",
    hint: "Report: Hikvision / CP Plus",
    brand: "Hikvision / CP Plus",
    series: "11 cameras + NVR",
    notes: "D-73",
  },
];

const COLUMNS = [
  "Material",
  "Brand / Make",
  "Series / Grade",
  "Supplier / Dealer",
  "Notes",
] as const;

function emptyRow(material = ""): BrandPref {
  return { material, brand: "", series: "", supplier: "", notes: "" };
}

function specRow(spec: MaterialSpec): BrandPref {
  return {
    material: spec.material,
    brand: spec.brand ?? "",
    series: spec.series ?? "",
    supplier: "",
    notes: spec.notes ?? "",
  };
}

function normalise(raw: unknown): BrandPref[] {
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
}

function Page() {
  const user = useSessionUser();
  const qc = useQueryClient();
  const [projectId, setProjectId] = useState("");
  const [rows, setRows] = useState<BrandPref[]>([]);
  const [loadedFor, setLoadedFor] = useState("");
  const [status, setStatus] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const projectsQuery = useQuery({
    queryKey: ["site_projects", "brand-preferences"],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_projects")
        .select("id,name,location,brand_preferences")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const projects = projectsQuery.data ?? [];
  const globalProject = useActiveProject();
  const setGlobalProject = useActiveProjectSetter();
  const activeId =
    projectId || projects.find((p) => p.id === globalProject.id)?.id || projects[0]?.id || "";
  const activeProject = projects.find((p) => p.id === activeId);

  useEffect(() => {
    if (!activeId || loadedFor === activeId) return;
    const saved = normalise(activeProject?.brand_preferences);
    const byMaterial = new Map(saved.map((r) => [r.material.toLowerCase(), r]));
    const merged = DEFAULT_MATERIALS.map(
      (d) => byMaterial.get(d.material.toLowerCase()) ?? specRow(d),
    );
    const extras = saved.filter(
      (r) => !DEFAULT_MATERIALS.some((d) => d.material.toLowerCase() === r.material.toLowerCase()),
    );
    setRows([...merged, ...extras]);
    setLoadedFor(activeId);
  }, [activeId, activeProject, loadedFor]);

  const filledCount = useMemo(() => rows.filter((r) => r.brand.trim() !== "").length, [rows]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = rows
        .map((r) => ({
          material: r.material.trim(),
          brand: r.brand.trim(),
          series: r.series.trim(),
          supplier: r.supplier.trim(),
          notes: r.notes.trim(),
        }))
        .filter((r) => r.material !== "" && r.brand !== "");
      const { error } = await supabase
        .from("site_projects")
        .update({ brand_preferences: payload })
        .eq("id", activeId);
      if (error) throw error;
      return payload.length;
    },
    onSuccess: async (count) => {
      setStatus(`Saved ${count} brand preference(s). The BOQ estimate will now use these makes.`);
      await qc.invalidateQueries({ queryKey: ["site_projects"] });
    },
    onError: (e: Error) => setStatus(`Save failed: ${e.message}`),
  });

  const update = (index: number, patch: Partial<BrandPref>) =>
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));

  const hintFor = (material: string) =>
    DEFAULT_MATERIALS.find((d) => d.material.toLowerCase() === material.trim().toLowerCase())
      ?.hint ?? "Brand / make you want to use";

  const loadStandardSpec = () => {
    setRows((prev) => {
      const extras = prev.filter(
        (r) =>
          r.material.trim() !== "" &&
          !DEFAULT_MATERIALS.some(
            (d) => d.material.toLowerCase() === r.material.trim().toLowerCase(),
          ),
      );
      const byMaterial = new Map(prev.map((r) => [r.material.trim().toLowerCase(), r]));
      const merged = DEFAULT_MATERIALS.map((d) => {
        const existing = byMaterial.get(d.material.toLowerCase());
        const base = specRow(d);
        return {
          material: base.material,
          brand: base.brand || existing?.brand || "",
          series: base.series || existing?.series || "",
          supplier: existing?.supplier ?? "",
          notes: base.notes || existing?.notes || "",
        };
      });
      return [...merged, ...extras];
    });
    setStatus("Loaded the Cyber Enclave standard specification. Review, edit, then save.");
  };

  const downloadSheet = () => {
    const aoa = [
      [...COLUMNS],
      ...rows.map((r) => [r.material, r.brand, r.series, r.supplier, r.notes]),
    ];
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    ws["!cols"] = [{ wch: 42 }, { wch: 34 }, { wch: 44 }, { wch: 26 }, { wch: 48 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Brand Preferences");
    const name = (activeProject?.name || "project").replace(/[^\w\-]+/g, "-").toLowerCase();
    XLSX.writeFile(wb, `brand-preferences-${name}.xlsx`);
    setStatus("Excel sheet downloaded. Fill the Brand / Make column and upload it back.");
  };

  const uploadSheet = async (file: File) => {
    try {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: "array" });
      const sheetName = wb.SheetNames[0];
      if (!sheetName) throw new Error("The file has no sheets.");
      const sheet = wb.Sheets[sheetName];
      if (!sheet) throw new Error("The first sheet could not be read.");
      const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
      const pick = (row: Record<string, unknown>, keys: string[]) => {
        for (const key of Object.keys(row)) {
          const k = key.trim().toLowerCase();
          if (keys.some((cand) => k === cand || k.startsWith(cand)))
            return String(row[key] ?? "").trim();
        }
        return "";
      };
      const parsed = raw
        .map((row) => ({
          material: pick(row, ["material"]),
          brand: pick(row, ["brand"]),
          series: pick(row, ["series"]),
          supplier: pick(row, ["supplier", "dealer"]),
          notes: pick(row, ["notes", "remark"]),
        }))
        .filter((r) => r.material !== "");
      if (parsed.length === 0) {
        setStatus("No rows found. Keep the Material column heading and try again.");
        return;
      }
      setRows(parsed);
      setStatus(
        `Loaded ${parsed.length} row(s) from ${file.name}. Press Save preferences to keep them.`,
      );
    } catch (e) {
      setStatus(`Upload failed: ${(e as Error).message}`);
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <Shell title="Brand Preferences">
      <div className="space-y-6">
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/80">
            Step before the BOQ
          </p>
          <h1 className="flex items-center gap-3 text-2xl font-extrabold uppercase tracking-tight text-foreground sm:text-3xl">
            <Tags className="h-7 w-7 text-primary" />
            Brand Preferences
          </h1>
          <p className="max-w-3xl text-sm text-muted-foreground">
            Pre-filled with your Cyber Enclave technical specification — Jairaj Fe-550 steel, Nuvoco
            M25, AAC blocks, RAK / Johnson tiles, Kohler July series, Hindware Truflo, Polycab,
            Legrand Myrius and more. Edit anything, leave a row blank to let the estimate suggest an
            option, or download the Excel sheet, fill it and upload it back.
          </p>
        </header>

        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-4">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Project
          </label>
          <select
            value={activeId}
            onChange={(e) => {
              {
                setProjectId(e.target.value);
                setGlobalProject(e.target.value);
              }
              setLoadedFor("");
              setStatus("");
            }}
            className="min-w-[220px] rounded-xl border border-border bg-background px-3 py-2 text-sm"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} {p.location ? `· ${p.location}` : ""}
              </option>
            ))}
          </select>
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            {filledCount} brand{filledCount === 1 ? "" : "s"} set
          </span>
          <div className="ml-auto flex flex-wrap gap-2">
            <button
              type="button"
              onClick={loadStandardSpec}
              className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-semibold text-foreground"
            >
              <Sparkles className="h-4 w-4" />
              Load standard spec
            </button>
            <button
              type="button"
              onClick={downloadSheet}
              className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-semibold text-foreground"
            >
              <Download className="h-4 w-4" />
              Download Excel
            </button>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-semibold text-foreground"
            >
              <Upload className="h-4 w-4" />
              Upload Excel
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void uploadSheet(file);
              }}
            />
            <button
              type="button"
              onClick={() => saveMutation.mutate()}
              disabled={!activeId || saveMutation.isPending}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              {saveMutation.isPending ? "Saving…" : "Save preferences"}
            </button>
            <Link
              to="/boq-engine"
              className="inline-flex items-center gap-2 rounded-xl border border-primary/40 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary"
            >
              <Calculator className="h-4 w-4" />
              Continue to BOQ Engine
            </Link>
          </div>
        </div>

        {status ? (
          <p className="rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-foreground">
            {status}
          </p>
        ) : null}

        {projects.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
            Add a project first, then set its brands here.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-border bg-card">
            <table className="w-full min-w-[860px] text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-3">Material</th>
                  <th className="px-4 py-3">Brand / make</th>
                  <th className="px-4 py-3">Series / grade</th>
                  <th className="px-4 py-3">Supplier / dealer</th>
                  <th className="px-4 py-3">Notes</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={`${row.material}-${index}`} className="border-b border-border/60">
                    <td className="px-4 py-2 align-middle">
                      <input
                        value={row.material}
                        onChange={(e) => update(index, { material: e.target.value })}
                        placeholder="Material"
                        className="w-full min-w-[150px] rounded-lg border border-border bg-background px-2 py-1.5 text-sm font-semibold"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        value={row.brand}
                        onChange={(e) => update(index, { brand: e.target.value })}
                        placeholder={hintFor(row.material)}
                        className="w-full min-w-[180px] rounded-lg border border-sky-500/40 bg-sky-500/5 px-2 py-1.5 text-sm"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        value={row.series}
                        onChange={(e) => update(index, { series: e.target.value })}
                        placeholder="Series / grade / finish"
                        className="w-full min-w-[150px] rounded-lg border border-border bg-background px-2 py-1.5 text-sm"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        value={row.supplier}
                        onChange={(e) => update(index, { supplier: e.target.value })}
                        placeholder="Dealer / supplier"
                        className="w-full min-w-[150px] rounded-lg border border-border bg-background px-2 py-1.5 text-sm"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        value={row.notes}
                        onChange={(e) => update(index, { notes: e.target.value })}
                        placeholder="Rate agreed, area of use…"
                        className="w-full min-w-[160px] rounded-lg border border-border bg-background px-2 py-1.5 text-sm"
                      />
                    </td>
                    <td className="px-4 py-2 text-right">
                      <button
                        type="button"
                        onClick={() => setRows((prev) => prev.filter((_, i) => i !== index))}
                        className="rounded-lg border border-border p-1.5 text-muted-foreground hover:text-destructive"
                        aria-label="Remove row"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {projects.length > 0 ? (
          <button
            type="button"
            onClick={() => setRows((prev) => [...prev, emptyRow("")])}
            className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-semibold text-foreground"
          >
            <Plus className="h-4 w-4" />
            Add another material
          </button>
        ) : null}
      </div>
    </Shell>
  );
}
