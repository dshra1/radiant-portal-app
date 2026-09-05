import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as XLSX from "xlsx";
import { supabase } from "@/integrations/supabase/client";
import { Shell } from "@/components/saha/Shell";
import { Plus, Trash2, Save, Calculator, Tags, Download, Upload, Sparkles } from "lucide-react";

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

/** Cyber Enclave, Madhapur — Annexure B technical specifications. */
const DEFAULT_MATERIALS: MaterialSpec[] = [
  {
    material: "Cement",
    hint: "e.g. Maha Cement OPC 53 / Ramco",
    brand: "Maha Cement / Ramco",
    series: "OPC 53 grade",
  },
  {
    material: "Ready Mix Concrete (RMC)",
    hint: "e.g. Nuvoco M25",
    brand: "Nuvoco or similar",
    series: "M25 grade",
    notes: "RCC framed structure — slabs & beams",
  },
  {
    material: "Steel (TMT)",
    hint: "e.g. Jairaj Fe 550",
    brand: "Jairaj / Shree",
    series: "Fe-550 grade",
  },
  { material: "Aggregate & Sand", hint: "e.g. local 20mm / robo sand" },
  {
    material: "Blocks / Bricks",
    hint: "e.g. AAC blocks",
    brand: "AAC blocks",
    series: '6" external, 4"–6" internal',
    notes: 'Internal walls reinforced with steel at 4\' height',
  },
  {
    material: "Plaster & Punning",
    hint: "e.g. single coat cement plaster",
    brand: "Cement plaster + gypsum punning",
    series: "Single coat internal / external / ceiling",
  },
  { material: "Shuttering / Formwork", hint: "e.g. MS shuttering / film ply" },
  {
    material: "Waterproofing",
    hint: "e.g. Dr. Fixit / Fosroc",
    brand: "Dr. Fixit / Fosroc",
    notes: "All bathrooms — horizontal & vertical coats",
  },
  { material: "Tile Adhesive & Grout", hint: "e.g. Roff / MYK Laticrete" },
  {
    material: "Flooring Tiles — Living / Dining / Bedroom / Kitchen",
    hint: "e.g. RAK / Johnson",
    brand: "RAK / Johnson",
    series: "1200 x 800 mm vitrified",
    notes: "Sourced directly from Morbi, Gujarat",
  },
  {
    material: "Balcony & Utility Tiles",
    hint: "e.g. RAK / Johnson anti-skid",
    brand: "RAK / Johnson",
    series: "Anti-skid ceramic",
    notes: "Utility dado up to sill height",
  },
  {
    material: "Bathroom Tiles (Dado)",
    hint: "e.g. RAK / Johnson",
    brand: "RAK / Johnson",
    series: "Glazed / matt vitrified",
    notes: 'Dado up to 8\'-0" height',
  },
  {
    material: "Kitchen Dado Tiles",
    hint: "e.g. RAK / Johnson",
    brand: "RAK / Johnson",
    series: "Vitrified",
    notes: 'Dado 2\'-0" above platform',
  },
  {
    material: "Corridor & Staircase Granite",
    hint: "e.g. Sagarhelli / black granite",
    brand: "Sagarhelli + Black granite mix",
  },
  {
    material: "Kitchen Platform Granite",
    hint: "e.g. Black Galaxy",
    brand: "Black Galaxy granite",
    series: "18 mm polished slab",
  },
  {
    material: "Window Sills",
    hint: "e.g. black granite / composite",
    brand: "Black granite / composite stone",
  },
  {
    material: "Parking Tiles",
    hint: "e.g. rough anti-skid parking tile",
    brand: "Approved sample",
    notes: "Sample approved with owners on inspection",
  },
  {
    material: "Main Door",
    hint: "e.g. Elegant teak frame + veneer shutter",
    brand: "Elegant",
    series: "African teak frame 125x75, 35mm walnut veneer double core",
    notes: "2135 x 1070 mm, PU polish, both-side grooves",
  },
  {
    material: "Bedroom Doors",
    hint: "e.g. Elegant teak frame + veneer shutter",
    brand: "Elegant",
    series: "African teak frame, 35mm walnut veneer double core",
    notes: "2135 x 950 mm, PU polish, no threshold",
  },
  {
    material: "Bathroom / Wash Area Doors",
    hint: "e.g. Elegant moulded panel door",
    brand: "Elegant",
    series: "32mm masonite moulded panel, Ecolax infill",
    notes: "2135 x 765 mm, pigment PU polish, PVC bottom banding",
  },
  {
    material: "French Doors (Aluminium)",
    hint: "e.g. Jimex",
    brand: "Jimex or similar",
    series: "Reinforced aluminium frame",
  },
  {
    material: "Windows & Glazing",
    hint: "e.g. Jimex UPVC",
    brand: "Jimex",
    series: "3-track UPVC, GI reinforced",
    notes: "SS mosquito mesh",
  },
  {
    material: "Hardware (Hinges & Bolts)",
    hint: "e.g. Jolly SS / brass",
    brand: "Jolly",
    series: "SS / brass SS coated",
    notes: "Or as provided by door manufacturer",
  },
  {
    material: "Main Door Lock",
    hint: "e.g. Yale digital lock",
    brand: "Yale",
    series: "100NXT digital lock",
  },
  {
    material: "Bedroom / Bathroom Locks",
    hint: "e.g. Godrej / Dorset",
    brand: "Godrej / Dorset",
    series: "Handle locks — with keys (bedroom), without keys (bathroom)",
  },
  {
    material: "Sanitaryware — EWC",
    hint: "e.g. Kohler Trace rimless",
    brand: "Kohler",
    series: "Trace series rimless wall hung",
    notes: "Concealed flush tank, health faucet, angle stopcocks",
  },
  {
    material: "Wash Basins",
    hint: "e.g. Kohler Kankara / Ribana",
    brand: "Kohler",
    series: "Kankara / Ribana / Modernlife / Forefront",
    notes: "Vanity is owner / interiors scope",
  },
  {
    material: "CP Fittings",
    hint: "e.g. Kohler July series",
    brand: "Kohler",
    series: "July series",
    notes: "Basin mixer, concealed diverter, overhead shower, spout, health faucet",
  },
  {
    material: "Kitchen Sink",
    hint: "e.g. Carysil quartz",
    brand: "Carysil",
    series: '24" x 18" single bowl with drain board',
    notes: "RO dispenser + hot & cold mixer (optional)",
  },
  {
    material: "CPVC / UPVC Plumbing",
    hint: "e.g. Hindware Truflo",
    brand: "Hindware Truflo",
    series: "CPVC water supply",
  },
  {
    material: "Drainage / SWR",
    hint: "e.g. Hindware Truflo SWR",
    brand: "Hindware Truflo",
    series: "SWR pipes",
    notes: "Slopes, inspection chambers, watertight joints",
  },
  {
    material: "Geyser Provision",
    hint: "e.g. Kohler July angle cocks",
    brand: "Kohler July series angle cocks",
    notes: "All toilets; kitchen from utility or nearest washroom",
  },
  { material: "Paint", hint: "e.g. Asian Paints — Royale / Apex" },
  {
    material: "Electrical Wiring",
    hint: "e.g. Polycab FRLS",
    brand: "Polycab",
    series: "FRLS PVC insulated copper",
    notes: "Concealed copper wiring",
  },
  {
    material: "Switches & Sockets",
    hint: "e.g. Legrand Myrius",
    brand: "Legrand",
    series: "Myrius series + modular plates",
  },
  {
    material: "MCB / DB / Panels",
    hint: "e.g. Legrand DB",
    brand: "Legrand",
    series: "63A DP isolator, 63A/30mA ELCB, SP & DP MCBs",
  },
  {
    material: "Light Fittings",
    hint: "e.g. Philips / Wipro / Havells",
    brand: "Philips / Wipro / Havells or equivalent",
    series: "LED panel, downlight, strip, batten, wall, street",
  },
  {
    material: "False Ceiling",
    hint: "e.g. Gypsum / calcium silicate",
    brand: "Gypsum board / calcium silicate",
    notes: "Under-deck plumbing lines; POP + LED in common areas",
  },
  {
    material: "Lift",
    hint: "e.g. Schindler / Kone",
    brand: "Schindler / Kone",
    series: "6 passenger / 408 kg, VFD, automatic door",
  },
  {
    material: "DG Set (Power Backup)",
    hint: "e.g. 45 KVA",
    brand: "45 KVA DG set",
    notes: "AMF panel with auto start — 100% common area backup",
  },
  {
    material: "Transformer",
    hint: "e.g. 160 kVA",
    brand: "160 kVA",
    series: "11kV / 433V",
  },
  {
    material: "CCTV & Intercom",
    hint: "e.g. 8 channel DVR + VDP",
    brand: "8 channel DVR, HD cameras, video door phone",
    notes: "Parking, lift, terrace, common areas; flat-to-flat intercom",
  },
  {
    material: "Paving & Landscape",
    hint: "e.g. interlocking pavers",
    brand: "Heavy duty interlocking pavers",
    notes: "Non-skid finish; landscaped green area with drip irrigation",
  },
  {
    material: "Rainwater Harvesting",
    hint: "e.g. recharge pit",
    brand: "Terrace & driveway collection with recharge pit",
  },
  { material: "Fire Fighting", hint: "e.g. HD Fire / Newage" },
];

const COLUMNS = ["Material", "Brand / Make", "Series / Grade", "Supplier / Dealer", "Notes"] as const;

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
  const qc = useQueryClient();
  const [projectId, setProjectId] = useState("");
  const [rows, setRows] = useState<BrandPref[]>([]);
  const [loadedFor, setLoadedFor] = useState("");
  const [status, setStatus] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const projectsQuery = useQuery({
    queryKey: ["site_projects", "brand-preferences"],
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
  const activeId = projectId || projects[0]?.id || "";
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
    DEFAULT_MATERIALS.find((d) => d.material.toLowerCase() === material.trim().toLowerCase())?.hint ??
    "Brand / make you want to use";

  const loadStandardSpec = () => {
    setRows((prev) => {
      const extras = prev.filter(
        (r) =>
          r.material.trim() !== "" &&
          !DEFAULT_MATERIALS.some((d) => d.material.toLowerCase() === r.material.trim().toLowerCase()),
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
          if (keys.some((cand) => k === cand || k.startsWith(cand))) return String(row[key] ?? "").trim();
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
      setStatus(`Loaded ${parsed.length} row(s) from ${file.name}. Press Save preferences to keep them.`);
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
            setProjectId(e.target.value);
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
