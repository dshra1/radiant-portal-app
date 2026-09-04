import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MapPin, Layers, Ruler, Trash2, Plus, X, ExternalLink, Pencil } from "lucide-react";
import { Shell } from "@/components/saha/Shell";
import { ActionButton, PhaseBar, StatusBadge } from "@/components/saha/ui";
import { inrCompact, num } from "@/data/saha";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/projects")({
  head: () => ({
    meta: [
      { title: "Projects — Saha OS Next" },
      {
        name: "description",
        content:
          "Project setup and portfolio view: capture geometry, timeline drivers, material specifications, staffing, owner and banking details for every construction site.",
      },
      { property: "og:title", content: "Projects — Saha OS Next" },
      {
        property: "og:description",
        content:
          "Add sites with schedule, material specification, staffing and owner inputs that drive timelines, BOQ and workflow generation.",
      },
    ],
  }),
  component: Projects,
});

type Phase = { name: string; state: "done" | "active" | "pending" };

export type Owner = { name: string; contact: string; share_pct: string };
export type Investor = { name: string; contact: string; amount: string };

const emptyOwner = (): Owner => ({ name: "", contact: "", share_pct: "" });
const emptyInvestor = (): Investor => ({ name: "", contact: "", amount: "" });

type Row = {
  id: string;
  name: string;
  location: string;
  type: string;
  single_floor_slab_sft: number;
  cellar_floors: number;
  stilt_floors: number;
  typical_floors: number;
  total_built_up_sft: number;
  total_slab_sft: number;
  target_budget: number;
  spend: number;
  health: string;
  phases: Phase[];
  latitude: number | null;
  longitude: number | null;
  map_link: string;
  start_date: string | null;
  target_handover_date: string | null;
  total_staff: number;
  landowner_name: string;
  investor_name: string;
  landowners: { name?: string; contact?: string; share_pct?: number | string }[] | null;
  investors: { name?: string; contact?: string; amount?: number | string }[] | null;
  steel_grade: string;
  blockwork_type: string;
  finishing_spec: string;
  drawings: { name: string; path: string }[];
  [key: string]: unknown;
};


const DEFAULT_PHASES: Phase[] = [
  { name: "Piling", state: "pending" },
  { name: "Foundation", state: "pending" },
  { name: "Structural", state: "pending" },
  { name: "MEP", state: "pending" },
  { name: "Finishing", state: "pending" },
];

const emptyForm = {
  // Identity & geometry
  name: "",
  location: "",
  type: "",
  health: "On Track",
  single_floor_slab_sft: "",
  cellar_floors: "",
  stilt_floors: "",
  typical_floors: "",
  target_budget: "",
  spend: "",
  // Map
  latitude: "",
  longitude: "",
  map_link: "",
  // Timeline drivers
  start_date: "",
  target_handover_date: "",
  working_days_per_week: "6",
  slab_cycle_days: "14",
  finishing_days_per_floor: "20",
  procurement_lead_days: "10",
  // Material BOQ specs
  concrete_grade: "M25",
  steel_grade: "Fe500D",
  steel_ratio_kg_per_sft: "4",
  cement_bags_per_sft: "0.4",
  blockwork_type: "AAC Blocks",
  flooring_spec: "Standard",
  paint_spec: "Standard",
  plumbing_spec: "Standard",
  electrical_spec: "Standard",
  doors_windows_spec: "Standard",
  sanitaryware_spec: "Standard",
  finishing_spec: "Standard",
  // Workflow
  contract_type: "Item Rate",
  workflow_template: "Standard RCC Framed",
  // Staff
  total_staff: "",
  engineers_count: "",
  labour_count: "",
  // Owners & investors (legacy single fields kept in sync with the lists)

  // Company & bank
  company_name: "",
  company_gstin: "",
  bank_name: "",
  bank_account_name: "",
  bank_account_last4: "",
  bank_ifsc: "",
};

const QUALITY = ["Standard", "Premium", "Luxury"];

function Projects() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [owners, setOwners] = useState<Owner[]>([emptyOwner()]);
  const [investors, setInvestors] = useState<Investor[]>([]);

  const [error, setError] = useState<string | null>(null);
  const [drawings, setDrawings] = useState<{ name: string; path: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const set = (k: keyof typeof emptyForm) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  const uploadDrawings = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const added: { name: string; path: string }[] = [];
      for (const file of Array.from(files)) {
        const path = `${crypto.randomUUID()}-${file.name.replace(/[^\w.\-]/g, "_")}`;
        const { error: upErr } = await supabase.storage.from("project-drawings").upload(path, file);
        if (upErr) throw upErr;
        added.push({ name: file.name, path });
      }
      setDrawings((d) => [...d, ...added]);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Drawing upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const openDrawing = async (path: string) => {
    const { data, error: sErr } = await supabase.storage
      .from("project-drawings")
      .createSignedUrl(path, 3600);
    if (sErr || !data) {
      setError(sErr?.message ?? "Could not open drawing.");
      return;
    }
    window.open(data.signedUrl, "_blank", "noreferrer");
  };


  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["site_projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_projects")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as Row[];
    },
  });

  // Derived (app-calculated) preview values
  const derived = useMemo(() => {
    const single = Number(form.single_floor_slab_sft) || 0;
    const cellar = Number(form.cellar_floors) || 0;
    const stilt = Number(form.stilt_floors) || 0;
    const typical = Number(form.typical_floors) || 0;
    const totalFloors = cellar + stilt + typical;
    const builtUp = single * typical;
    const slab = single * totalFloors;
    const structuralDays = totalFloors * (Number(form.slab_cycle_days) || 0);
    const finishingDays = typical * (Number(form.finishing_days_per_floor) || 0);
    const totalDays = structuralDays + finishingDays + (Number(form.procurement_lead_days) || 0);
    const perWeek = Math.max(1, Number(form.working_days_per_week) || 6);
    const calendarDays = Math.round((totalDays / perWeek) * 7);
    let handover = "—";
    if (form.start_date) {
      const d = new Date(form.start_date);
      if (!Number.isNaN(d.getTime())) {
        d.setDate(d.getDate() + calendarDays);
        handover = d.toISOString().slice(0, 10);
      }
    }
    return {
      builtUp,
      slab,
      totalFloors,
      structuralDays,
      finishingDays,
      calendarDays,
      handover,
      steelTon: (slab * (Number(form.steel_ratio_kg_per_sft) || 0)) / 1000,
      cementBags: slab * (Number(form.cement_bags_per_sft) || 0),
    };
  }, [form]);

  const buildPayload = () => {
    const n = (v: string) => Number(v) || 0;
    const cleanOwners = owners
      .filter((o) => o.name.trim() || o.contact.trim())
      .map((o) => ({ name: o.name.trim(), contact: o.contact.trim(), share_pct: n(o.share_pct) }));
    const cleanInvestors = investors
      .filter((i) => i.name.trim() || i.contact.trim())
      .map((i) => ({ name: i.name.trim(), contact: i.contact.trim(), amount: n(i.amount) }));
    return {
      name: form.name.trim(),
      location: form.location.trim(),
      type: form.type.trim(),
      single_floor_slab_sft: n(form.single_floor_slab_sft),
      cellar_floors: n(form.cellar_floors),
      stilt_floors: n(form.stilt_floors),
      typical_floors: n(form.typical_floors),
      total_built_up_sft: derived.builtUp,
      total_slab_sft: derived.slab,
      target_budget: n(form.target_budget),
      spend: n(form.spend),
      health: form.health,
      latitude: form.latitude === "" ? null : n(form.latitude),
      longitude: form.longitude === "" ? null : n(form.longitude),
      map_link: form.map_link.trim(),
      start_date: form.start_date || null,
      target_handover_date:
        form.target_handover_date || (derived.handover !== "—" ? derived.handover : null),
      working_days_per_week: n(form.working_days_per_week),
      slab_cycle_days: n(form.slab_cycle_days),
      finishing_days_per_floor: n(form.finishing_days_per_floor),
      procurement_lead_days: n(form.procurement_lead_days),
      concrete_grade: form.concrete_grade,
      steel_grade: form.steel_grade,
      steel_ratio_kg_per_sft: n(form.steel_ratio_kg_per_sft),
      cement_bags_per_sft: n(form.cement_bags_per_sft),
      blockwork_type: form.blockwork_type,
      flooring_spec: form.flooring_spec,
      paint_spec: form.paint_spec,
      plumbing_spec: form.plumbing_spec,
      electrical_spec: form.electrical_spec,
      doors_windows_spec: form.doors_windows_spec,
      sanitaryware_spec: form.sanitaryware_spec,
      finishing_spec: form.finishing_spec,
      contract_type: form.contract_type,
      workflow_template: form.workflow_template,
      total_staff: n(form.total_staff),
      engineers_count: n(form.engineers_count),
      labour_count: n(form.labour_count),
      landowners: cleanOwners,
      investors: cleanInvestors,
      landowner_name: cleanOwners[0]?.name ?? "",
      landowner_contact: cleanOwners[0]?.contact ?? "",
      landowner_share_pct: cleanOwners[0]?.share_pct ?? 0,
      investor_name: cleanInvestors[0]?.name ?? "",
      investor_contact: cleanInvestors[0]?.contact ?? "",
      investor_amount: cleanInvestors[0]?.amount ?? 0,
      company_name: form.company_name.trim(),
      company_gstin: form.company_gstin.trim(),
      bank_name: form.bank_name.trim(),
      bank_account_name: form.bank_account_name.trim(),
      bank_account_last4: form.bank_account_last4.trim().slice(-4),
      bank_ifsc: form.bank_ifsc.trim(),
      drawings,
    };
  };

  const resetForm = () => {
    setForm(emptyForm);
    setOwners([emptyOwner()]);
    setInvestors([]);
    setDrawings([]);
    setEditingId(null);
  };

  const startEdit = (p: Row) => {
    const s = (v: unknown) => (v === null || v === undefined ? "" : String(v));
    setEditingId(p.id);
    setForm({
      ...emptyForm,
      name: s(p.name),
      location: s(p.location),
      type: s(p.type),
      health: s(p.health) || "On Track",
      single_floor_slab_sft: s(p.single_floor_slab_sft),
      cellar_floors: s(p.cellar_floors),
      stilt_floors: s(p.stilt_floors),
      typical_floors: s(p.typical_floors),
      target_budget: s(p.target_budget),
      spend: s(p.spend),
      latitude: s(p.latitude),
      longitude: s(p.longitude),
      map_link: s(p.map_link),
      start_date: s(p.start_date),
      target_handover_date: s(p.target_handover_date),
      working_days_per_week: s(p['working_days_per_week']) || "6",
      slab_cycle_days: s(p['slab_cycle_days']) || "14",
      finishing_days_per_floor: s(p['finishing_days_per_floor']) || "20",
      procurement_lead_days: s(p['procurement_lead_days']) || "10",
      concrete_grade: s(p['concrete_grade']) || "M25",
      steel_grade: s(p.steel_grade) || "Fe500D",
      steel_ratio_kg_per_sft: s(p['steel_ratio_kg_per_sft']) || "4",
      cement_bags_per_sft: s(p['cement_bags_per_sft']) || "0.4",
      blockwork_type: s(p.blockwork_type) || "AAC Blocks",
      flooring_spec: s(p['flooring_spec']) || "Standard",
      paint_spec: s(p['paint_spec']) || "Standard",
      plumbing_spec: s(p['plumbing_spec']) || "Standard",
      electrical_spec: s(p['electrical_spec']) || "Standard",
      doors_windows_spec: s(p['doors_windows_spec']) || "Standard",
      sanitaryware_spec: s(p['sanitaryware_spec']) || "Standard",
      finishing_spec: s(p.finishing_spec) || "Standard",
      contract_type: s(p['contract_type']) || "Item Rate",
      workflow_template: s(p['workflow_template']) || "Standard RCC Framed",
      total_staff: s(p.total_staff),
      engineers_count: s(p['engineers_count']),
      labour_count: s(p['labour_count']),
      company_name: s(p['company_name']),
      company_gstin: s(p['company_gstin']),
      bank_name: s(p['bank_name']),
      bank_account_name: s(p['bank_account_name']),
      bank_account_last4: s(p['bank_account_last4']),
      bank_ifsc: s(p['bank_ifsc']),
    });
    const ol = Array.isArray(p.landowners) ? p.landowners : [];
    setOwners(
      ol.length
        ? ol.map((o) => ({ name: s(o.name), contact: s(o.contact), share_pct: s(o.share_pct) }))
        : [{ name: s(p.landowner_name), contact: "", share_pct: "" }],
    );
    const il = Array.isArray(p.investors) ? p.investors : [];
    setInvestors(
      il.map((i) => ({ name: s(i.name), contact: s(i.contact), amount: s(i.amount) })),
    );
    setDrawings(Array.isArray(p.drawings) ? p.drawings : []);
    setOpen(true);
    setError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const saveProject = useMutation({
    mutationFn: async () => {
      const payload = buildPayload();
      if (editingId) {
        const { error } = await supabase.from("site_projects").update(payload).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("site_projects")
          .insert({ ...payload, phases: DEFAULT_PHASES });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      resetForm();
      setOpen(false);
      setError(null);
      void qc.refetchQueries({ queryKey: ["site_projects"] });
    },
    onError: (e: Error) => setError(e.message),
  });


  const removeProject = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("site_projects").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, id) => {
      qc.setQueryData(["site_projects"], (prev: Row[] | undefined) =>
        (prev ?? []).filter((r) => r.id !== id),
      );
      void qc.refetchQueries({ queryKey: ["site_projects"] });
    },
    onError: (e: Error) => setError(e.message),
  });

  return (
    <Shell
      title="Projects"
      subtitle="Project setup: geometry, timeline drivers, material specs, staffing, owners and banking"
      actions={
        <ActionButton
          onClick={() => {
            if (open) {
              setOpen(false);
              resetForm();
            } else {
              resetForm();
              setOpen(true);
            }
          }}
        >
          {open ? (
            <>
              <X className="size-3.5" /> Close
            </>
          ) : (
            <>
              <Plus className="size-3.5" /> New project
            </>
          )}
        </ActionButton>
      }

    >
      {error && (
        <div className="mb-3 rounded border border-destructive/40 bg-destructive-soft px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      {open && (
        <form
          className="panel mb-4 p-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!form.name.trim()) {
              setError("Project name is required.");
              return;
            }
            saveProject.mutate();
          }}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold tracking-tight">{editingId ? "Edit project" : "Add a project"}</h2>
            <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-sm bg-secondary" /> Your input
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-sm bg-primary" /> App result
              </span>
            </div>
          </div>

          <Section title="Project identity">
            <Field label="Project name" value={form.name} onChange={set("name")} />
            <Field label="Location / address" value={form.location} onChange={set("location")} />
            <Field label="Type (e.g. G+5 Commercial)" value={form.type} onChange={set("type")} />
            <SelectField
              label="Health"
              value={form.health}
              onChange={set("health")}
              options={["On Track", "At Risk", "Delayed"]}
            />
          </Section>

          <Section title="Map location">
            <Field label="Latitude" value={form.latitude} onChange={set("latitude")} numeric />
            <Field label="Longitude" value={form.longitude} onChange={set("longitude")} numeric />
            <Field label="Google Maps link" value={form.map_link} onChange={set("map_link")} />
          </Section>

          <Section title="Geometry & budget">
            <Field
              label="Single floor slab (sft)"
              value={form.single_floor_slab_sft}
              onChange={set("single_floor_slab_sft")}
              numeric
            />
            <Field label="Cellar floors" value={form.cellar_floors} onChange={set("cellar_floors")} numeric />
            <Field label="Stilt floors" value={form.stilt_floors} onChange={set("stilt_floors")} numeric />
            <Field
              label="Typical floors"
              value={form.typical_floors}
              onChange={set("typical_floors")}
              numeric
            />
            <Field label="Target budget (₹)" value={form.target_budget} onChange={set("target_budget")} numeric />
            <Field label="Spend to date (₹)" value={form.spend} onChange={set("spend")} numeric />
          </Section>

          <Section title="Timeline drivers">
            <Field label="Start date" value={form.start_date} onChange={set("start_date")} type="date" />
            <Field
              label="Target handover date"
              value={form.target_handover_date}
              onChange={set("target_handover_date")}
              type="date"
            />
            <Field
              label="Working days / week"
              value={form.working_days_per_week}
              onChange={set("working_days_per_week")}
              numeric
            />
            <Field
              label="Slab cycle (days / floor)"
              value={form.slab_cycle_days}
              onChange={set("slab_cycle_days")}
              numeric
            />
            <Field
              label="Finishing (days / floor)"
              value={form.finishing_days_per_floor}
              onChange={set("finishing_days_per_floor")}
              numeric
            />
            <Field
              label="Procurement lead (days)"
              value={form.procurement_lead_days}
              onChange={set("procurement_lead_days")}
              numeric
            />
          </Section>

          <Section title="Material specification (drives BOQ)">
            <SelectField
              label="Concrete grade"
              value={form.concrete_grade}
              onChange={set("concrete_grade")}
              options={["M20", "M25", "M30", "M35", "M40"]}
            />
            <SelectField
              label="Steel grade"
              value={form.steel_grade}
              onChange={set("steel_grade")}
              options={["Fe500", "Fe500D", "Fe550", "Fe550D"]}
            />
            <SelectField
              label="Blockwork / masonry"
              value={form.blockwork_type}
              onChange={set("blockwork_type")}
              options={["AAC Blocks", "Red Brick", "Fly Ash Brick", "Concrete Solid Block"]}
            />
            <SelectField
              label="Flooring"
              value={form.flooring_spec}
              onChange={set("flooring_spec")}
              options={["Standard Vitrified", "Premium Vitrified", "Italian Marble", "Wooden / Luxury"]}
            />
            <SelectField label="Paint quality" value={form.paint_spec} onChange={set("paint_spec")} options={QUALITY} />
            <SelectField
              label="Plumbing"
              value={form.plumbing_spec}
              onChange={set("plumbing_spec")}
              options={QUALITY}
            />
            <SelectField
              label="Electrical"
              value={form.electrical_spec}
              onChange={set("electrical_spec")}
              options={QUALITY}
            />
            <SelectField
              label="Doors & windows"
              value={form.doors_windows_spec}
              onChange={set("doors_windows_spec")}
              options={QUALITY}
            />
            <SelectField
              label="Sanitaryware"
              value={form.sanitaryware_spec}
              onChange={set("sanitaryware_spec")}
              options={QUALITY}
            />
            <SelectField
              label="Overall finishing spec"
              value={form.finishing_spec}
              onChange={set("finishing_spec")}
              options={QUALITY}
            />
            <Field
              label="Steel ratio (kg / sft)"
              value={form.steel_ratio_kg_per_sft}
              onChange={set("steel_ratio_kg_per_sft")}
              numeric
            />
            <Field
              label="Cement (bags / sft)"
              value={form.cement_bags_per_sft}
              onChange={set("cement_bags_per_sft")}
              numeric
            />
          </Section>

          <Section title="Workflow">
            <SelectField
              label="Contract type"
              value={form.contract_type}
              onChange={set("contract_type")}
              options={["Item Rate", "Lump Sum", "Labour Only", "Turnkey / EPC"]}
            />
            <SelectField
              label="Workflow template"
              value={form.workflow_template}
              onChange={set("workflow_template")}
              options={[
                "Standard RCC Framed",
                "High-Rise with Cellar",
                "Villa / Low-Rise",
                "Interior Fit-out",
              ]}
            />
          </Section>

          <Section title="Staffing">
            <Field label="Total staff" value={form.total_staff} onChange={set("total_staff")} numeric />
            <Field label="Engineers" value={form.engineers_count} onChange={set("engineers_count")} numeric />
            <Field label="Labour strength" value={form.labour_count} onChange={set("labour_count")} numeric />
          </Section>

          <fieldset className="mt-4">
            <legend className="label-caps text-secondary-foreground">Landowners</legend>
            <div className="mt-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <label className="block">
                <span className="label-caps text-muted-foreground">How many landowners?</span>
                <input
                  type="number"
                  min={0}
                  max={20}
                  value={owners.length}
                  onChange={(e) => {
                    const c = Math.max(0, Math.min(20, Number(e.target.value) || 0));
                    setOwners((prev) =>
                      c > prev.length
                        ? [...prev, ...Array.from({ length: c - prev.length }, emptyOwner)]
                        : prev.slice(0, c),
                    );
                  }}
                  className="mt-1 h-9 w-full rounded border border-secondary/40 bg-secondary/10 px-2 text-sm"
                />
              </label>
            </div>
            <div className="mt-3 space-y-3">
              {owners.map((o, i) => (
                <div key={i} className="rounded border border-secondary/40 bg-secondary/10 p-3">
                  <div className="flex items-center justify-between">
                    <p className="label-caps text-secondary-foreground">Landowner {i + 1}</p>
                    <button
                      type="button"
                      onClick={() => setOwners((prev) => prev.filter((_, x) => x !== i))}
                      className="text-xs text-muted-foreground hover:text-destructive"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="mt-2 grid gap-3 sm:grid-cols-3">
                    <Field
                      label="Name"
                      value={o.name}
                      onChange={(v) =>
                        setOwners((prev) => prev.map((x, xi) => (xi === i ? { ...x, name: v } : x)))
                      }
                    />
                    <Field
                      label="Contact"
                      value={o.contact}
                      onChange={(v) =>
                        setOwners((prev) => prev.map((x, xi) => (xi === i ? { ...x, contact: v } : x)))
                      }
                    />
                    <Field
                      label="Share (%)"
                      numeric
                      value={o.share_pct}
                      onChange={(v) =>
                        setOwners((prev) => prev.map((x, xi) => (xi === i ? { ...x, share_pct: v } : x)))
                      }
                    />
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setOwners((prev) => [...prev, emptyOwner()])}
                className="inline-flex h-8 items-center gap-1.5 rounded border border-input bg-card px-3 text-[13px] font-medium"
              >
                <Plus className="size-3.5" /> Add landowner
              </button>
              <p className="text-xs text-muted-foreground">
                Total share entered: {owners.reduce((s, o) => s + (Number(o.share_pct) || 0), 0)}%
              </p>
            </div>
          </fieldset>

          <fieldset className="mt-4">
            <legend className="label-caps text-secondary-foreground">Investors</legend>
            <div className="mt-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <label className="block">
                <span className="label-caps text-muted-foreground">How many investors?</span>
                <input
                  type="number"
                  min={0}
                  max={20}
                  value={investors.length}
                  onChange={(e) => {
                    const c = Math.max(0, Math.min(20, Number(e.target.value) || 0));
                    setInvestors((prev) =>
                      c > prev.length
                        ? [...prev, ...Array.from({ length: c - prev.length }, emptyInvestor)]
                        : prev.slice(0, c),
                    );
                  }}
                  className="mt-1 h-9 w-full rounded border border-secondary/40 bg-secondary/10 px-2 text-sm"
                />
              </label>
            </div>
            <div className="mt-3 space-y-3">
              {investors.map((iv, i) => (
                <div key={i} className="rounded border border-secondary/40 bg-secondary/10 p-3">
                  <div className="flex items-center justify-between">
                    <p className="label-caps text-secondary-foreground">Investor {i + 1}</p>
                    <button
                      type="button"
                      onClick={() => setInvestors((prev) => prev.filter((_, x) => x !== i))}
                      className="text-xs text-muted-foreground hover:text-destructive"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="mt-2 grid gap-3 sm:grid-cols-3">
                    <Field
                      label="Name"
                      value={iv.name}
                      onChange={(v) =>
                        setInvestors((prev) => prev.map((x, xi) => (xi === i ? { ...x, name: v } : x)))
                      }
                    />
                    <Field
                      label="Contact"
                      value={iv.contact}
                      onChange={(v) =>
                        setInvestors((prev) => prev.map((x, xi) => (xi === i ? { ...x, contact: v } : x)))
                      }
                    />
                    <Field
                      label="Amount (₹)"
                      numeric
                      value={iv.amount}
                      onChange={(v) =>
                        setInvestors((prev) => prev.map((x, xi) => (xi === i ? { ...x, amount: v } : x)))
                      }
                    />
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setInvestors((prev) => [...prev, emptyInvestor()])}
                className="inline-flex h-8 items-center gap-1.5 rounded border border-input bg-card px-3 text-[13px] font-medium"
              >
                <Plus className="size-3.5" /> Add investor
              </button>
            </div>
          </fieldset>


          <fieldset className="mt-4">
            <legend className="label-caps text-secondary-foreground">Floor plan drawings (if any)</legend>
            <div className="mt-2 rounded border border-secondary/40 bg-secondary/10 p-3">
              <input
                type="file"
                multiple
                accept=".pdf,.dwg,.dxf,image/*"
                onChange={(e) => {
                  void uploadDrawings(e.target.files);
                  e.target.value = "";
                }}
                className="text-sm"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                {uploading ? "Uploading…" : "PDF, DWG/DXF or images — stored privately in cloud storage."}
              </p>
              {drawings.length > 0 && (
                <ul className="mt-2 flex flex-wrap gap-2">
                  {drawings.map((d) => (
                    <li key={d.path} className="flex items-center gap-2 rounded border border-input bg-card px-2 py-1 text-xs">
                      <button
                        type="button"
                        onClick={() => void openDrawing(d.path)}
                        className="font-medium text-primary hover:underline"
                      >
                        {d.name}
                      </button>
                      <button
                        type="button"
                        aria-label={`Remove ${d.name}`}
                        onClick={() => setDrawings((prev) => prev.filter((x) => x.path !== d.path))}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <X className="size-3" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </fieldset>

          <Section title="Company & bank (optional)">

            <Field label="Company name" value={form.company_name} onChange={set("company_name")} />
            <Field label="GSTIN" value={form.company_gstin} onChange={set("company_gstin")} />
            <Field label="Bank name" value={form.bank_name} onChange={set("bank_name")} />
            <Field label="Account holder" value={form.bank_account_name} onChange={set("bank_account_name")} />
            <Field
              label="Account last 4 digits"
              value={form.bank_account_last4}
              onChange={set("bank_account_last4")}
              numeric
            />
            <Field label="IFSC" value={form.bank_ifsc} onChange={set("bank_ifsc")} />
          </Section>

          <div className="mt-4">
            <p className="label-caps mb-2 text-primary">App results from your inputs</p>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <Result label="Total built-up" value={`${num(derived.builtUp)} sft`} />
              <Result label="Total slab area" value={`${num(derived.slab)} sft`} />
              <Result label="Total floors" value={num(derived.totalFloors)} />
              <Result label="Structural duration" value={`${num(derived.structuralDays)} work days`} />
              <Result label="Finishing duration" value={`${num(derived.finishingDays)} work days`} />
              <Result label="Programme (calendar)" value={`${num(derived.calendarDays)} days`} />
              <Result label="Projected handover" value={derived.handover} />
              <Result label="Indicative steel" value={`${num(derived.steelTon, 1)} TON`} />
              <Result label="Indicative cement" value={`${num(derived.cementBags)} bags`} />
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <button
              type="submit"
              disabled={saveProject.isPending}
              className="inline-flex h-8 items-center gap-1.5 rounded bg-primary px-3 text-[13px] font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-60"
            >
              {saveProject.isPending ? "Saving…" : editingId ? "Update project" : "Save project"}
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                resetForm();
              }}
              className="inline-flex h-8 items-center rounded border border-input bg-card px-3 text-[13px] font-medium"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading projects…</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No projects yet — use “New project” to add your first site.
        </p>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2 2xl:grid-cols-3">
          {rows.map((p) => {
            const n = (v: unknown) => Number(v ?? 0) || 0;
            const floors = n(p.cellar_floors) + n(p.stilt_floors) + n(p.typical_floors);
            const builtUp = n(p.total_built_up_sft) || n(p.single_floor_slab_sft) * floors;
            const slab =
              n(p.total_slab_sft) || n(p.single_floor_slab_sft) * (floors ? floors + 1 : 0);
            const burn = n(p.target_budget) ? Math.round((n(p.spend) / n(p.target_budget)) * 100) : 0;
            const phases = Array.isArray(p.phases) ? p.phases : DEFAULT_PHASES;
            const ownerList = (Array.isArray(p.landowners) ? p.landowners : [])
              .map((o) => ({ name: String(o?.name ?? "").trim() }))
              .filter((o) => o.name);
            if (!ownerList.length && p.landowner_name) ownerList.push({ name: p.landowner_name });
            const investorList = (Array.isArray(p.investors) ? p.investors : [])
              .map((o) => ({ name: String(o?.name ?? "").trim() }))
              .filter((o) => o.name);
            if (!investorList.length && p.investor_name) investorList.push({ name: p.investor_name });
            const mapHref =
              p.map_link ||
              (p.latitude != null && p.longitude != null
                ? `https://www.google.com/maps?q=${p.latitude},${p.longitude}`
                : "");
            return (
              <article key={p.id} className="panel p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h2 className="text-base font-semibold tracking-tight">{p.name}</h2>
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="size-3" /> {p.location || "—"}
                    </p>
                    {mapHref && (
                      <a
                        href={mapHref}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                      >
                        View on Google Maps <ExternalLink className="size-3" />
                      </a>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <StatusBadge
                      tone={
                        p.health === "On Track" ? "emerald" : p.health === "At Risk" ? "amber" : "red"
                      }
                    >
                      {p.health}
                    </StatusBadge>
                    <button
                      type="button"
                      aria-label={`Edit ${p.name}`}
                      onClick={() => startEdit(p)}
                      className="grid size-7 place-items-center rounded border border-input text-muted-foreground hover:bg-primary-soft hover:text-primary"
                    >
                      <Pencil className="size-3.5" />
                    </button>
                    <button

                      type="button"
                      aria-label={`Delete ${p.name}`}
                      onClick={() => {
                        if (confirm(`Delete “${p.name}”? This cannot be undone.`)) {
                          removeProject.mutate(p.id);
                        }
                      }}
                      className="grid size-7 place-items-center rounded border border-input text-muted-foreground hover:bg-destructive-soft hover:text-destructive"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {p.type && <StatusBadge tone="slate">{p.type}</StatusBadge>}
                  <StatusBadge tone="sky">
                    {n(p.cellar_floors)}C + {n(p.stilt_floors)}S + {n(p.typical_floors)}T
                  </StatusBadge>
                  {p.steel_grade && <StatusBadge tone="slate">{p.steel_grade}</StatusBadge>}
                  {p.blockwork_type && <StatusBadge tone="slate">{p.blockwork_type}</StatusBadge>}
                  {p.finishing_spec && <StatusBadge tone="slate">{p.finishing_spec}</StatusBadge>}
                  {Array.isArray(p.drawings) && p.drawings.length > 0 && (
                    <StatusBadge tone="sky">{p.drawings.length} drawing(s)</StatusBadge>
                  )}

                </div>

                <dl className="mt-3 grid grid-cols-2 gap-px overflow-hidden rounded border border-border bg-border">
                  <Cell
                    icon={<Ruler className="size-3" />}
                    label="Built-up"
                    value={`${num(builtUp)} sft`}
                  />
                  <Cell
                    icon={<Layers className="size-3" />}
                    label="Total slab"
                    value={`${num(slab)} sft`}
                  />
                  <Cell label="Start" value={p.start_date || "—"} />
                  <Cell label="Target handover" value={p.target_handover_date || "—"} />
                  <Cell label="Target budget" value={inrCompact(p.target_budget)} />
                  <Cell label="Total staff" value={num(p.total_staff)} />
                  <Cell
                    label={`Landowners (${ownerList.length})`}
                    value={ownerList.length ? ownerList.map((o) => o.name).join(", ") : "—"}
                  />
                  <Cell
                    label={`Investors (${investorList.length})`}
                    value={investorList.length ? investorList.map((o) => o.name).join(", ") : "—"}
                  />
                </dl>

                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="label-caps text-muted-foreground">Budget consumed</span>
                    <span className="font-semibold tnum">{burn}%</span>
                  </div>
                  <div className="mt-1.5 h-1 w-full rounded-sm bg-border">
                    <div
                      className={burn > 80 ? "h-1 rounded-sm bg-destructive" : "h-1 rounded-sm bg-primary"}
                      style={{ width: `${Math.min(burn, 100)}%` }}
                    />
                  </div>
                </div>

                <div className="mt-3">
                  <p className="label-caps mb-1.5 text-muted-foreground">Phase progress</p>
                  <PhaseBar phases={phases} />
                  <div className="mt-1.5 flex justify-between text-[10px] text-muted-foreground">
                    {phases.map((ph) => (
                      <span key={ph.name}>{ph.name}</span>
                    ))}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </Shell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="mt-4">
      <legend className="label-caps text-secondary-foreground">{title}</legend>
      <div className="mt-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{children}</div>
    </fieldset>
  );
}

function Field({
  label,
  value,
  onChange,
  numeric,
  type,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  numeric?: boolean;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="label-caps text-muted-foreground">{label}</span>
      <input
        value={value}
        type={type ?? "text"}
        inputMode={numeric ? "decimal" : "text"}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 h-9 w-full rounded border border-secondary/40 bg-secondary/10 px-2 text-sm"
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <label className="block">
      <span className="label-caps text-muted-foreground">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 h-9 w-full rounded border border-secondary/40 bg-secondary/10 px-2 text-sm"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}

function Result({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-primary/30 bg-primary/10 p-2.5">
      <p className="label-caps text-primary">{label}</p>
      <p className="mt-1 text-sm font-semibold tnum">{value}</p>
    </div>
  );
}

function Cell({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="bg-card p-2.5">
      <dt className="label-caps flex items-center gap-1 text-muted-foreground">
        {icon}
        {label}
      </dt>
      <dd className="mt-1 text-sm font-semibold tnum">{value}</dd>
    </div>
  );
}
