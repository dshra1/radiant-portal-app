import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Shell } from "@/components/saha/Shell";
import { Plus, Trash2, Save, Calculator, Tags } from "lucide-react";

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

const DEFAULT_MATERIALS: { material: string; hint: string }[] = [
  { material: "Cement", hint: "e.g. Maha Cement OPC 53 / Ramco" },
  { material: "Steel (TMT)", hint: "e.g. Jairaj Fe 550D" },
  { material: "Aggregate & Sand", hint: "e.g. local 20mm / robo sand" },
  { material: "Blocks / Bricks", hint: "e.g. AAC — Biltech / red brick" },
  { material: "Shuttering / Formwork", hint: "e.g. MS shuttering / film ply" },
  { material: "Waterproofing", hint: "e.g. Dr. Fixit / Fosroc" },
  { material: "Tile Adhesive & Grout", hint: "e.g. Roff / MYK Laticrete" },
  { material: "Flooring Tiles", hint: "e.g. Kajaria / Somany" },
  { material: "Granite / Stone", hint: "e.g. local black galaxy" },
  { material: "Paint", hint: "e.g. Asian Paints — Royale / Apex" },
  { material: "CP Fittings", hint: "e.g. KOHLER — July series" },
  { material: "Sanitaryware", hint: "e.g. KOHLER / Jaquar" },
  { material: "CPVC / UPVC Plumbing", hint: "e.g. Ashirvad / Astral" },
  { material: "Drainage / SWR", hint: "e.g. Supreme / Prince" },
  { material: "Electrical Wiring", hint: "e.g. Polycab FRLS" },
  { material: "Switches & Sockets", hint: "e.g. Legrand Myrius — Black" },
  { material: "MCB / DB / Panels", hint: "e.g. Schneider / Legrand" },
  { material: "Doors", hint: "e.g. teak main / WPC flush" },
  { material: "Windows & Glazing", hint: "e.g. UPVC — Fenesta / Encraft" },
  { material: "Hardware & Locks", hint: "e.g. Godrej / Dorset" },
  { material: "False Ceiling", hint: "e.g. Gyproc / Saint-Gobain" },
  { material: "Lift", hint: "e.g. Johnson / Kone" },
  { material: "Fire Fighting", hint: "e.g. HD Fire / Newage" },
];

function emptyRow(material = ""): BrandPref {
  return { material, brand: "", series: "", supplier: "", notes: "" };
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
      (d) => byMaterial.get(d.material.toLowerCase()) ?? emptyRow(d.material),
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
          Write in the makes you actually buy — anything you type here is used as-is. Nothing is
          forced: leave a row blank and the estimate will suggest an option for it, or add your own
          material at the bottom if it is missing from the list.
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
