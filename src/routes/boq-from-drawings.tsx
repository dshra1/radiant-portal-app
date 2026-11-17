import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileUp,
  Loader2,
  Lock,
  Save,
  Send,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { Shell } from "@/components/saha/Shell";
import { supabase } from "@/integrations/supabase/client";
import { useActiveProject } from "@/hooks/useActiveProject";
import { useAiConfigured, AI_OFF_REASON } from "@/hooks/useAiStatus";
import { useSessionUser } from "@/lib/access";
import { inrShort } from "@/lib/boq-totals";
import {
  computeBoq,
  DRAWING_SLOTS,
  emptyTakeoff,
  sampleTakeoff,
  SLOT_FIELDS,
  STAGES,
  type Opening,
  type Room,
  type SlotKey,
  type Takeoff,
} from "@/lib/takeoff";
import { readDrawing } from "@/lib/takeoff.functions";

export const Route = createFileRoute("/boq-from-drawings")({
  head: () => ({
    meta: [
      { title: "BOQ from Drawings | Saha OS" },
      {
        name: "description",
        content:
          "Upload the architectural and structural drawings; the app reads them and works out a complete stage-wise BOQ before the project starts.",
      },
    ],
  }),
  component: Page,
});

const BUCKET = "site-media";
const ROOM_TYPE_OPTIONS = [
  "bed",
  "living",
  "kitchen",
  "toilet",
  "balcony",
  "utility",
  "passage",
  "store",
  "stair",
  "lift",
  "parking",
  "other",
];
const OPENING_KIND_OPTIONS = ["main-door", "door", "toilet-door", "window", "ventilator", "slider"];
const DIR = (pid: string) => `${pid}/TAKEOFF`;
const fmtN = (n: number, d = 2) => n.toLocaleString("en-IN", { maximumFractionDigits: d });

type Upload = { id: string; path: string; title: string; slot: SlotKey; created_at: string };

function Page() {
  const project = useActiveProject();
  const pid = project.id;
  const user = useSessionUser();
  const qc = useQueryClient();
  const ai = useAiConfigured();
  const read = useServerFn(readDrawing);
  const [draft, setDraft] = useState<Takeoff | null>(null);
  const [busySlot, setBusySlot] = useState<SlotKey | null>(null);
  const [view, setView] = useState<"stages" | "lock" | "materials">("stages");

  // Saved takeoff (newest JSON in the project's TAKEOFF folder) and uploaded drawings.
  const saved = useQuery({
    queryKey: ["takeoff", pid],
    enabled: Boolean(pid),
    queryFn: async () => {
      const [list, media] = await Promise.all([
        supabase.storage
          .from(BUCKET)
          .list(DIR(pid), { limit: 100, sortBy: { column: "name", order: "desc" } }),
        supabase
          .from("project_media")
          .select("id,path,title,caption,created_at")
          .eq("project_id", pid)
          .eq("stage", "TAKEOFF")
          .order("created_at", { ascending: false }),
      ]);
      let takeoff: Takeoff = emptyTakeoff();
      const latest = (list.data ?? []).find((f) => /^takeoff-\d+\.json$/.test(f.name));
      if (latest) {
        const dl = await supabase.storage.from(BUCKET).download(`${DIR(pid)}/${latest.name}`);
        if (dl.data) {
          try {
            takeoff = { ...emptyTakeoff(), ...(JSON.parse(await dl.data.text()) as Takeoff) };
          } catch {
            /* keep empty */
          }
        }
      }
      const uploads: Upload[] = (media.data ?? []).map((m) => ({
        id: m.id,
        path: m.path,
        title: m.title,
        slot: m.caption as SlotKey,
        created_at: m.created_at,
      }));
      return { takeoff, uploads, savedAt: latest?.name ?? null };
    },
  });
  const t = draft ?? saved.data?.takeoff ?? emptyTakeoff();
  const uploads = saved.data?.uploads ?? [];
  const edit = (patch: Partial<Takeoff>) => setDraft({ ...t, ...patch });

  const present = useMemo(() => {
    const s = new Set<SlotKey>();
    for (const k of Object.keys(t.sources) as SlotKey[]) s.add(k);
    if (t.floors.length) s.add("plans");
    if (t.footings.length) s.add("footings");
    if (t.columns.length) s.add("columns");
    if (t.beams.length) s.add("beams");
    if (t.slabs.length) s.add("slabs");
    if (t.openings.length) s.add("schedule");
    return s;
  }, [t]);
  const boq = useMemo(() => computeBoq(t, present), [t, present]);

  const save = useMutation({
    mutationFn: async (next: Takeoff) => {
      const blob = new Blob([JSON.stringify(next)], { type: "application/json" });
      const up = await supabase.storage
        .from(BUCKET)
        .upload(`${DIR(pid)}/takeoff-${Date.now()}.json`, blob, {
          contentType: "application/json",
        });
      if (up.error) throw up.error;
    },
    onSuccess: async () => {
      toast.success("Takeoff saved");
      setDraft(null);
      await qc.invalidateQueries({ queryKey: ["takeoff", pid] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const upload = async (slot: SlotKey, files: FileList | null) => {
    if (!files?.length) return;
    setBusySlot(slot);
    try {
      for (const file of Array.from(files)) {
        const safe = file.name.replace(/[^\w.-]+/g, "_");
        const path = `${DIR(pid)}/${slot}/${Date.now()}-${safe}`;
        const up = await supabase.storage
          .from(BUCKET)
          .upload(path, file, { contentType: file.type || "application/pdf" });
        if (up.error) throw up.error;
        const ins = await supabase.from("project_media").insert({
          project_id: pid,
          path,
          title: file.name,
          caption: slot,
          stage: "TAKEOFF",
          category: "takeoff",
          uploaded_by: user?.id ?? null,
          uploaded_by_name: user?.email ?? "",
        });
        if (ins.error) throw ins.error;
      }
      toast.success(`${files.length} drawing(s) uploaded`);
      await qc.invalidateQueries({ queryKey: ["takeoff", pid] });
    } catch (e) {
      toast.error((e as Error).message);
    }
    setBusySlot(null);
  };

  const readSlot = async (slot: SlotKey) => {
    const files = uploads.filter((u) => u.slot === slot);
    if (!files.length) return;
    setBusySlot(slot);
    try {
      let next: Takeoff = { ...t };
      // the slot's fields are replaced by what its drawings show (several sheets are merged)
      const merged: Partial<Takeoff> = {};
      const notes: string[] = [];
      for (const f of files) {
        const ext = f.path.split(".").pop()?.toLowerCase() ?? "";
        const mediaType =
          ext === "pdf" ? "application/pdf" : ext === "png" ? "image/png" : "image/jpeg";
        const res = await read({
          data: { slot, fileName: f.title, mediaType, storagePath: f.path },
        });
        notes.push(...res.notes.map((n) => `${f.title}: ${n}`));
        for (const [k, v] of Object.entries(res.data) as [keyof Takeoff, unknown][]) {
          const prev = merged[k];
          (merged as Record<string, unknown>)[k] =
            Array.isArray(prev) && Array.isArray(v) ? [...prev, ...v] : v;
        }
      }
      for (const k of SLOT_FIELDS[slot]) if (k in merged) next = { ...next, [k]: merged[k] };
      next.sources = {
        ...next.sources,
        [slot]: {
          file: files.map((f) => f.title).join(", "),
          read_at: new Date().toISOString(),
          notes,
        },
      };
      setDraft(next);
      toast.success("Read. Check the numbers below, then save.");
    } catch (e) {
      toast.error((e as Error).message);
    }
    setBusySlot(null);
  };

  const exportCsv = () => {
    const head = [
      "stage",
      "work_scope",
      "category",
      "item_code",
      "description",
      "unit",
      "quantity",
      "rate",
      "brand",
      "supplier",
      "notes",
    ];
    const esc = (v: unknown) => {
      const s = String(v ?? "");
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const rows = boq.lines.map((l, i) =>
      [
        l.stage,
        "common",
        l.stage.replace(/^\d+ · /, ""),
        `DRW-${String(i + 1).padStart(4, "0")}`,
        l.item,
        l.unit,
        l.qty,
        l.rate,
        "",
        "",
        `${l.basis}${l.lockBeforeStart ? " · lock before start" : ""} · rate: ${l.rateSource}`,
      ]
        .map(esc)
        .join(","),
    );
    const blob = new Blob([[head.join(","), ...rows].join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${project.name}-boq-from-drawings.csv`;
    a.click();
  };

  const send = useMutation({
    mutationFn: async () => {
      const payload = boq.lines.map((l, i) => ({
        project_id: pid,
        stage: `Drawings · ${l.stage}`,
        work_scope: "common",
        category: l.stage.replace(/^\d+ · /, ""),
        item_code: `DRW-${String(i + 1).padStart(4, "0")}`,
        description: l.item,
        unit: l.unit,
        quantity: l.qty,
        rate: l.rate,
        brand: "",
        supplier: "",
        notes: `${l.basis} · rate: ${l.rateSource}`,
        source: "drawings",
        sort_order: 5000 + i,
      }));
      for (let i = 0; i < payload.length; i += 400) {
        const { error } = await supabase.from("boq_items").insert(payload.slice(i, i + 400));
        if (error) throw error;
      }
      return payload.length;
    },
    onSuccess: (n) => toast.success(`${n} lines added to the BOQ Engine`),
    onError: (e: Error) => toast.error(e.message),
  });

  const missingReq = DRAWING_SLOTS.filter((s) => s.required && !present.has(s.key));

  return (
    <Shell title="BOQ from Drawings">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 p-4">
        <header className="rounded-2xl border border-border bg-card p-5">
          <p className="label-caps text-primary">Before you start</p>
          <h1 className="text-2xl font-extrabold">Your complete BOQ from your drawings</h1>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            1 · Upload the drawings on the list. 2 · The app reads the sizes, schedules and counts —
            you check them. 3 · Every quantity is worked out stage by stage with the formula shown:
            bricks or blocks, cement, sand, RMC, steel, centering, tiles, granite, doors, windows,
            wires, pipes, paint. Lock the rates for everything marked{" "}
            <Lock className="inline size-3.5" /> before the site starts.
          </p>
          <button
            type="button"
            onClick={() => {
              setDraft(sampleTakeoff());
              toast.success("Sample building loaded (not saved). See step 3.");
            }}
            className="mt-3 rounded-lg border border-primary px-3 py-1.5 text-sm font-semibold text-primary"
          >
            Try a sample building (stilt + 5, 10 flats)
          </button>
          {ai === false && (
            <p className="mt-3 flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" /> {AI_OFF_REASON} You can still
              type the numbers into the tables below; the BOQ works the same.
            </p>
          )}
        </header>

        {/* Step 1: checklist */}
        <section className="rounded-2xl border border-border bg-card p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-lg font-bold">1 · Drawings the BOQ needs</h2>
            <p className="text-sm text-muted-foreground">
              {DRAWING_SLOTS.filter((s) => present.has(s.key)).length} of {DRAWING_SLOTS.length}{" "}
              read ·{" "}
              {missingReq.length
                ? `${missingReq.length} required still missing`
                : "all required drawings in"}
            </p>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            PDF or photo, up to 20 MB per file. CAD files: export the sheets to PDF first.
          </p>
          {(["Architectural", "Structural", "Services", "Finishes"] as const).map((g) => (
            <div key={g} className="mt-4">
              <p className="label-caps text-muted-foreground">{g}</p>
              <ul className="mt-2 grid gap-2 md:grid-cols-2">
                {DRAWING_SLOTS.filter((s) => s.group === g).map((s) => {
                  const files = uploads.filter((u) => u.slot === s.key);
                  const src = t.sources[s.key];
                  const done = present.has(s.key);
                  return (
                    <li
                      key={s.key}
                      className={`rounded-xl border p-3 ${done ? "border-emerald-300 bg-emerald-50/40" : s.required ? "border-amber-300" : "border-border"}`}
                    >
                      <div className="flex items-start gap-2">
                        {done ? (
                          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-700" />
                        ) : (
                          <FileUp className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold">
                            {s.title}{" "}
                            {s.required && (
                              <span className="rounded bg-amber-100 px-1.5 text-[11px] font-bold text-amber-900">
                                REQUIRED
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground">Reads: {s.gives}</p>
                          {!done && (
                            <p className="text-xs text-amber-800">Without it: {s.without}</p>
                          )}
                          {files.length > 0 && (
                            <p className="mt-1 truncate text-xs">
                              {files.length} file(s): {files.map((f) => f.title).join(", ")}
                            </p>
                          )}
                          {src?.notes?.length ? (
                            <details className="mt-1 text-xs">
                              <summary className="cursor-pointer text-muted-foreground">
                                Reader notes ({src.notes.length})
                              </summary>
                              <ul className="list-disc pl-4">
                                {src.notes.map((n) => (
                                  <li key={n}>{n}</li>
                                ))}
                              </ul>
                            </details>
                          ) : null}
                        </div>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <label className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-sm font-medium">
                          <FileUp className="size-4" /> Upload
                          <input
                            type="file"
                            multiple
                            accept="application/pdf,image/*"
                            className="hidden"
                            onChange={(e) => {
                              void upload(s.key, e.target.files);
                              e.target.value = "";
                            }}
                          />
                        </label>
                        <button
                          type="button"
                          disabled={!files.length || busySlot !== null || ai === false}
                          onClick={() => void readSlot(s.key)}
                          className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground disabled:opacity-40"
                        >
                          {busySlot === s.key ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <Sparkles className="size-4" />
                          )}
                          {src ? "Read again" : "Read with AI"}
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </section>

        {/* Step 2: check what was read */}
        <section className="rounded-2xl border border-border bg-card p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-lg font-bold">2 · Check what was read</h2>
            <button
              type="button"
              disabled={!draft || save.isPending}
              onClick={() => draft && save.mutate(draft)}
              className="inline-flex items-center gap-1 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-40"
            >
              {save.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}{" "}
              {draft ? "Save changes" : "Saved"}
            </button>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Every number can be corrected here. Feet and inches as decimals (12′6″ = 12.5).
          </p>

          <Fields
            title="Heights and specification"
            values={{ ...t.heights, ...t.finishes, pcc_in: t.pcc_in, staircase_m3: t.staircase_m3 }}
            fields={[
              ["floor_to_floor_ft", "Floor to floor (ft)"],
              ["slab_in", "Slab (in)"],
              ["beam_depth_in", "Beam depth (in)"],
              ["plinth_ft", "Plinth (ft)"],
              ["founding_depth_ft", "Founding depth (ft)"],
              ["pcc_in", "PCC (in)"],
              ["external_wall_in", "Outer wall (in)"],
              ["internal_wall_in", "Inner wall (in)"],
              ["toilet_dado_ft", "Toilet dado (ft)"],
              ["kitchen_counter_rft", "Kitchen counter (rft, all)"],
              ["staircase_m3", "Staircase concrete (m³)"],
            ]}
            onChange={(k, v) => {
              if (k in t.heights) edit({ heights: { ...t.heights, [k]: v } });
              else if (k === "pcc_in") edit({ pcc_in: v });
              else if (k === "staircase_m3") edit({ staircase_m3: v });
              else edit({ finishes: { ...t.finishes, [k]: v } });
            }}
            extra={
              <div className="flex flex-wrap gap-3 text-sm">
                <Choice
                  label="Walls"
                  value={t.finishes.masonry}
                  options={[
                    ["aac", "AAC blocks"],
                    ["brick", "Red bricks"],
                  ]}
                  onChange={(v) =>
                    edit({ finishes: { ...t.finishes, masonry: v as "aac" | "brick" } })
                  }
                />
                <Choice
                  label="Inside walls"
                  value={t.finishes.internal_finish}
                  options={[
                    ["gypsum", "Gypsum punning"],
                    ["cement", "Cement plaster"],
                  ]}
                  onChange={(v) =>
                    edit({ finishes: { ...t.finishes, internal_finish: v as "gypsum" | "cement" } })
                  }
                />
                <Choice
                  label="Concrete"
                  value={t.finishes.concrete_grade}
                  options={[
                    ["M25", "M25"],
                    ["M30", "M30"],
                  ]}
                  onChange={(v) => edit({ finishes: { ...t.finishes, concrete_grade: v } })}
                />
              </div>
            }
          />

          <h3 className="mt-5 font-semibold">Floors and rooms</h3>
          {t.floors.length === 0 && (
            <p className="text-sm text-muted-foreground">No floor plans read yet.</p>
          )}
          {t.floors.map((f, fi) => (
            <div key={fi} className="mt-2 rounded-xl border border-border p-3">
              <div className="flex flex-wrap gap-2 text-sm">
                <Cell
                  label="Floor"
                  value={f.name}
                  onChange={(v) =>
                    edit({ floors: t.floors.map((x, i) => (i === fi ? { ...x, name: v } : x)) })
                  }
                />
                <Cell
                  label="Identical floors"
                  num
                  value={f.repeat}
                  onChange={(v) =>
                    edit({
                      floors: t.floors.map((x, i) => (i === fi ? { ...x, repeat: Number(v) } : x)),
                    })
                  }
                />
                <Cell
                  label="Built-up sft"
                  num
                  value={f.built_up_sft}
                  onChange={(v) =>
                    edit({
                      floors: t.floors.map((x, i) =>
                        i === fi ? { ...x, built_up_sft: Number(v) } : x,
                      ),
                    })
                  }
                />
                <Cell
                  label="Outer perimeter ft"
                  num
                  value={f.external_perimeter_ft}
                  onChange={(v) =>
                    edit({
                      floors: t.floors.map((x, i) =>
                        i === fi ? { ...x, external_perimeter_ft: Number(v) } : x,
                      ),
                    })
                  }
                />
                <span className="self-end text-xs text-muted-foreground">{f.kind}</span>
              </div>
              <Table
                rows={f.rooms}
                cols={[
                  ["name", "Room"],
                  ["type", "Type", false, ROOM_TYPE_OPTIONS],
                  ["length_ft", "L (ft)", true],
                  ["width_ft", "B (ft)", true],
                  ["count", "Nos", true],
                ]}
                onChange={(rows) =>
                  edit({ floors: t.floors.map((x, i) => (i === fi ? { ...x, rooms: rows } : x)) })
                }
                blank={{ name: "", type: "bed", length_ft: 0, width_ft: 0, count: 1 } as Room}
              />
            </div>
          ))}

          <button
            type="button"
            onClick={() =>
              edit({
                floors: [
                  ...t.floors,
                  {
                    name: `Floor ${t.floors.length + 1}`,
                    repeat: 1,
                    kind: "typical",
                    built_up_sft: 0,
                    external_perimeter_ft: 0,
                    rooms: [],
                  },
                ],
              })
            }
            className="mt-2 text-sm font-semibold text-primary"
          >
            + Add floor
          </button>

          <h3 className="mt-5 font-semibold">Doors and windows</h3>
          <Table
            rows={t.openings}
            cols={[
              ["mark", "Mark"],
              ["kind", "Kind", false, OPENING_KIND_OPTIONS],
              ["width_ft", "W (ft)", true],
              ["height_ft", "H (ft)", true],
              ["count", "Nos (all floors)", true],
            ]}
            onChange={(rows) => edit({ openings: rows })}
            blank={{ mark: "", kind: "window", width_ft: 0, height_ft: 0, count: 0 } as Opening}
          />
          <h3 className="mt-5 font-semibold">Footings</h3>
          <Table
            rows={t.footings}
            cols={[
              ["mark", "Mark"],
              ["length_ft", "L (ft)", true],
              ["width_ft", "B (ft)", true],
              ["depth_ft", "D (ft)", true],
              ["count", "Nos", true],
            ]}
            onChange={(rows) => edit({ footings: rows })}
            blank={{ mark: "", length_ft: 0, width_ft: 0, depth_ft: 0, count: 0 }}
          />
          <h3 className="mt-5 font-semibold">Columns</h3>
          <Table
            rows={t.columns}
            cols={[
              ["mark", "Mark"],
              ["b_in", "b (in)", true],
              ["d_in", "d (in)", true],
              ["count", "Nos per floor", true],
              ["levels", "Floors (0 = all)", true],
            ]}
            onChange={(rows) => edit({ columns: rows })}
            blank={{ mark: "", b_in: 9, d_in: 18, count: 0, levels: 0 }}
          />
          <h3 className="mt-5 font-semibold">Beams</h3>
          <Table
            rows={t.beams}
            cols={[
              ["level", "Level"],
              ["b_in", "b (in)", true],
              ["d_in", "d (in)", true],
              ["length_ft", "Total length (ft)", true],
              ["repeat", "Identical levels", true],
            ]}
            onChange={(rows) => edit({ beams: rows })}
            blank={{ level: "", b_in: 9, d_in: 18, length_ft: 0, repeat: 1 }}
          />
          <h3 className="mt-5 font-semibold">Slabs</h3>
          <Table
            rows={t.slabs}
            cols={[
              ["level", "Level"],
              ["area_sft", "Area (sft)", true],
              ["thickness_in", "Thickness (in)", true],
              ["repeat", "Identical levels", true],
            ]}
            onChange={(rows) => edit({ slabs: rows })}
            blank={{ level: "", area_sft: 0, thickness_in: 5, repeat: 1 }}
          />
          <h3 className="mt-5 font-semibold">Steel from the BBS (optional)</h3>
          <Table
            rows={t.steel_kg_by_dia}
            cols={[
              ["dia_mm", "Dia (mm)", true],
              ["kg", "kg", true],
            ]}
            onChange={(rows) => edit({ steel_kg_by_dia: rows })}
            blank={{ dia_mm: 8, kg: 0 }}
          />
          <Fields
            title="Electrical points (whole building)"
            values={t.electrical}
            fields={[
              ["light", "Light"],
              ["fan", "Fan"],
              ["socket_6a", "6A"],
              ["socket_16a", "16A"],
              ["ac", "AC"],
              ["tv_data", "TV / data"],
              ["dbs", "DBs"],
            ]}
            onChange={(k, v) => edit({ electrical: { ...t.electrical, [k]: v } })}
          />
          <Fields
            title="Plumbing fixtures (whole building)"
            values={t.plumbing}
            fields={[
              ["wc", "WC"],
              ["basin", "Basin"],
              ["shower", "Shower"],
              ["kitchen_sink", "Kitchen sink"],
              ["utility_tap", "Utility"],
            ]}
            onChange={(k, v) => edit({ plumbing: { ...t.plumbing, [k]: v } })}
          />
          <Fields
            title="Site"
            values={t.site}
            fields={[
              ["compound_wall_rft", "Compound wall (rft)"],
              ["paving_sft", "Paving (sft)"],
            ]}
            onChange={(k, v) => edit({ site: { ...t.site, [k]: v } })}
          />
        </section>

        {/* Step 3: the BOQ */}
        <section className="rounded-2xl border border-border bg-card p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold">3 · Your BOQ, stage by stage</h2>
              <p className="text-3xl font-extrabold">{inrShort(boq.total)}</p>
              <p className="text-sm text-muted-foreground">
                {boq.builtUpSft
                  ? `${fmtN(boq.builtUpSft, 0)} sft built-up · ₹${fmtN(boq.perSft, 0)}/sft · `
                  : ""}
                {fmtN(boq.concreteM3, 0)} m³ RCC · {fmtN(boq.steelKg / 1000, 1)} t steel · before
                GST
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={exportCsv}
                disabled={!boq.lines.length}
                className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-sm font-semibold disabled:opacity-40"
              >
                <Download className="size-4" /> Export (BOQ Engine CSV)
              </button>
              <button
                type="button"
                onClick={() => send.mutate()}
                disabled={!boq.lines.length || send.isPending || Boolean(draft)}
                title={draft ? "Save the takeoff first" : ""}
                className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-40"
              >
                {send.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Send className="size-4" />
                )}{" "}
                Send to BOQ Engine
              </button>
            </div>
          </div>
          {missingReq.length > 0 && (
            <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
              Not complete yet: {missingReq.map((s) => s.title).join(" · ")}. Lines marked “assumed”
              use a stated rule until the drawing is read.
            </p>
          )}
          <p className="mt-2 text-xs text-muted-foreground">
            Rates: “77:76 BOQ” = the rate in the Cyber Enclave 77:76 BOQ (Nov 2026); “indicative” =
            confirm with quotes. Not in this BOQ: approvals, consultants, site set-up, common
            electrical (transformer, DG, meters), facade features and owners’ extras — add them in
            the{" "}
            <Link to="/boq-engine" className="text-primary underline">
              BOQ Engine
            </Link>
            .
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            {(
              [
                ["stages", "By stage"],
                [
                  "lock",
                  `Lock before start (${boq.lines.filter((l) => l.lockBeforeStart).length})`,
                ],
                ["materials", "Materials summary"],
              ] as const
            ).map(([k, l]) => (
              <button
                key={k}
                type="button"
                onClick={() => setView(k)}
                className={`rounded-full border px-3 py-1.5 text-sm font-medium ${view === k ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}
              >
                {l}
              </button>
            ))}
          </div>

          {view === "materials" && (
            <table className="mt-3 w-full text-sm">
              <tbody>
                {boq.materials.map((m) => (
                  <tr key={m.name} className="border-b border-border/60">
                    <td className="py-1.5">{m.name}</td>
                    <td className="py-1.5 text-right font-semibold tnum">
                      {fmtN(m.qty, 1)} {m.unit}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {view !== "materials" &&
            STAGES.map((stage) => {
              const ls = boq.lines.filter(
                (l) => l.stage === stage && (view === "stages" || l.lockBeforeStart),
              );
              if (!ls.length) return null;
              const sum = ls.reduce((s, l) => s + l.amount, 0);
              return (
                <details key={stage} open className="mt-3 rounded-xl border border-border">
                  <summary className="flex cursor-pointer items-center justify-between p-3 font-semibold">
                    <span>{stage}</span>
                    <span className="tnum">{inrShort(sum)}</span>
                  </summary>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[760px] text-sm">
                      <thead>
                        <tr className="border-y border-border text-left text-xs text-muted-foreground">
                          <th className="p-2">Item</th>
                          <th className="p-2 text-right">Qty</th>
                          <th className="p-2">Unit</th>
                          <th className="p-2 text-right">Rate</th>
                          <th className="p-2 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ls.map((l, i) => (
                          <tr key={i} className="border-b border-border/60 align-top">
                            <td className="p-2">
                              <p className="font-medium">
                                {l.lockBeforeStart && (
                                  <Lock className="mr-1 inline size-3.5 text-primary" />
                                )}
                                {l.item}
                                {l.assumed && (
                                  <span className="ml-1 rounded bg-amber-100 px-1 text-[11px] text-amber-900">
                                    assumed
                                  </span>
                                )}
                              </p>
                              <p className="text-xs text-muted-foreground">{l.basis}</p>
                            </td>
                            <td className="p-2 text-right tnum">{fmtN(l.qty)}</td>
                            <td className="p-2">{l.unit}</td>
                            <td className="p-2 text-right tnum">
                              {l.rate ? fmtN(l.rate) : "—"}
                              <span
                                className={`block text-[10px] ${l.rateSource === "indicative" ? "text-amber-700" : "text-muted-foreground"}`}
                              >
                                {l.rate ? l.rateSource : "in contract"}
                              </span>
                            </td>
                            <td className="p-2 text-right font-semibold tnum">
                              {l.amount ? inrShort(l.amount) : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </details>
              );
            })}
          {!boq.lines.length && (
            <p className="mt-3 text-sm text-muted-foreground">
              Upload and read the drawings (or type the numbers in step 2) to see the BOQ.
            </p>
          )}
        </section>
      </div>
    </Shell>
  );
}

function Fields<T extends Record<string, unknown>>({
  title,
  values,
  fields,
  onChange,
  extra,
}: {
  title: string;
  values: T;
  fields: [string, string][];
  onChange: (key: string, value: number) => void;
  extra?: React.ReactNode;
}) {
  return (
    <div className="mt-4">
      <h3 className="font-semibold">{title}</h3>
      <div className="mt-2 flex flex-wrap gap-2">
        {fields.map(([k, l]) => (
          <Cell
            key={k}
            label={l}
            num
            value={Number(values[k] ?? 0)}
            onChange={(v) => onChange(k, Number(v))}
          />
        ))}
      </div>
      {extra && <div className="mt-2">{extra}</div>}
    </div>
  );
}

function Cell({
  label,
  value,
  onChange,
  num,
}: {
  label: string;
  value: string | number;
  onChange: (v: string) => void;
  num?: boolean;
}) {
  return (
    <label className="flex w-36 flex-col text-xs text-muted-foreground">
      {label}
      <input
        type={num ? "number" : "text"}
        inputMode={num ? "decimal" : undefined}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-0.5 rounded-lg border border-border bg-background px-2 py-1.5 text-sm text-foreground"
      />
    </label>
  );
}

function Choice({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: [string, string][];
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex items-center gap-2">
      <span className="text-muted-foreground">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-border bg-background px-2 py-1.5"
      >
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </label>
  );
}

function Table<R extends Record<string, string | number>>({
  rows,
  cols,
  onChange,
  blank,
}: {
  rows: R[];
  cols: [keyof R & string, string, boolean?, string[]?][];
  onChange: (rows: R[]) => void;
  blank: R;
}) {
  return (
    <div className="mt-2 overflow-x-auto">
      <table className="w-full min-w-[520px] text-sm">
        <thead>
          <tr className="text-left text-xs text-muted-foreground">
            {cols.map(([, l]) => (
              <th key={l} className="px-1 pb-1">
                {l}
              </th>
            ))}
            <th />
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              {cols.map(([k, , n, opts]) => (
                <td key={k} className="px-1 py-0.5">
                  {opts ? (
                    <select
                      value={String(r[k])}
                      onChange={(e) =>
                        onChange(rows.map((x, j) => (j === i ? { ...x, [k]: e.target.value } : x)))
                      }
                      className="w-full rounded border border-border bg-background px-2 py-1"
                    >
                      {opts.map((o) => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={n ? "number" : "text"}
                      value={r[k]}
                      onChange={(e) =>
                        onChange(
                          rows.map((x, j) =>
                            j === i
                              ? { ...x, [k]: n ? Number(e.target.value) : e.target.value }
                              : x,
                          ),
                        )
                      }
                      className={`w-full rounded border border-border bg-background px-2 py-1 ${n ? "text-right" : ""}`}
                    />
                  )}
                </td>
              ))}
              <td className="px-1">
                <button
                  type="button"
                  onClick={() => onChange(rows.filter((_, j) => j !== i))}
                  className="text-xs text-muted-foreground hover:text-destructive"
                >
                  Remove
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button
        type="button"
        onClick={() => onChange([...rows, { ...blank }])}
        className="mt-1 text-sm font-semibold text-primary"
      >
        + Add row
      </button>
    </div>
  );
}
