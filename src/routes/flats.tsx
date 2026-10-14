import { createFileRoute, Link } from "@tanstack/react-router";
import { Fragment, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, ChevronDown, ChevronRight, Plus, Save } from "lucide-react";
import { toast } from "sonner";
import { Shell } from "@/components/saha/Shell";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { useActiveProject } from "@/hooks/useActiveProject";
import { useAccess } from "@/lib/access";
import { boqTotals } from "@/lib/boq-totals";
import { useFlats, type FlatLineRow, type FlatRow, type FlatTypeRow } from "@/lib/flats";

export const Route = createFileRoute("/flats")({
  head: () => ({
    meta: [
      { title: "Flats & Individual Works | Saha OS" },
      {
        name: "description",
        content:
          "Flat types, each flat's owner and individual works (owner's scope) against the common works carried by the landowners.",
      },
    ],
  }),
  component: Page,
});

const n = (v: unknown) => {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
};
const rs = (v: number) => `₹${Math.round(v).toLocaleString("en-IN")}`;
const cr = (v: number) =>
  Math.abs(v) >= 1e7 ? `₹${(v / 1e7).toFixed(2)} Cr` : `₹${(v / 1e5).toFixed(2)} L`;

function Page() {
  const project = useActiveProject();
  const { access } = useAccess();
  const canEdit = Boolean(access?.isAdmin || access?.roles.includes("pm"));
  const q = useFlats(project.id);
  const qc = useQueryClient();
  const refresh = () => qc.invalidateQueries({ queryKey: ["flats", project.id] });

  const extra = useQuery({
    queryKey: ["flats-context", project.id],
    enabled: Boolean(project.id),
    queryFn: async () => {
      const [pr, boq] = await Promise.all([
        supabase
          .from("site_projects")
          .select("landowners,contingency_pct,saleable_sft")
          .eq("id", project.id)
          .maybeSingle(),
        supabase
          .from("boq_items")
          .select("quantity,rate,gst_pct,work_scope,package,package_no,item_code")
          .eq("project_id", project.id),
      ]);
      if (pr.error) throw pr.error;
      if (boq.error) throw boq.error;
      const c = pr.data?.contingency_pct ?? 5;
      const t = boqTotals(boq.data ?? [], n(c));
      const owners = (Array.isArray(pr.data?.landowners) ? pr.data.landowners : []) as {
        name?: string;
      }[];
      return {
        owners: owners.map((o) => String(o.name ?? "").trim()).filter(Boolean),
        contingency: n(c),
        common: t.common.incl * (1 + n(c) / 100),
        individualBoq: t.individual.incl * (1 + n(c) / 100),
        project: t.project.incl,
        saleable: n(pr.data?.saleable_sft),
      };
    },
  });

  const types = q.data?.types ?? [];
  const flats = q.data?.flats ?? [];
  const typeOf = useMemo(() => new Map(types.map((t) => [t.code, t])), [types]);
  const indivFlats = flats.reduce(
    (s, f) => s + n(typeOf.get(f.type_code)?.indiv_total) + n(f.owner_extra),
    0,
  );

  return (
    <Shell title="Flats & Individual Works">
      <div className="flex flex-col gap-4 px-4 pb-16 pt-4 md:px-6">
        <header className="rounded-2xl border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            {project.name} · PMC
          </p>
          <h1 className="flex items-center gap-2 text-xl font-bold">
            <Building2 className="size-5 text-primary" /> Flats and individual works
          </h1>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            Common works (structure, external walls, windows, lift, common areas, services to each
            flat's handover point) are the landowners' PMC, shared by their %. Individual works (4″
            walls, tiles, sanitary and CP, paint, wiring from the common points, doors, false
            ceilings) belong to each flat and go to its owner. Set each flat's owner here; stage
            payment requests and the{" "}
            <Link to="/landowners-investment" className="text-primary underline">
              landowner break-up
            </Link>{" "}
            follow it.
          </p>
          {extra.data && (
            <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
              <Tile
                label={`Common works (incl. GST + ${extra.data.contingency}%)`}
                value={cr(extra.data.common)}
              />
              <Tile
                label={`Individual works, ${flats.length} flats`}
                value={cr(flats.length ? indivFlats : extra.data.individualBoq)}
              />
              <Tile
                label="Common + individual"
                value={cr(
                  extra.data.common + (flats.length ? indivFlats : extra.data.individualBoq),
                )}
              />
              <Tile label="BOQ project cost" value={cr(extra.data.project)} />
            </div>
          )}
        </header>

        {q.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : types.length === 0 && flats.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-6 text-sm">
            No flats yet. Run{" "}
            <Link to="/project-import" className="text-primary underline">
              Import PMC Workbooks
            </Link>{" "}
            with the common vs individual workbook, or add a flat type below.
          </div>
        ) : null}

        <TypesCard
          projectId={project.id}
          types={types}
          flats={flats}
          canEdit={canEdit}
          onSaved={refresh}
        />
        <FlatsCard
          projectId={project.id}
          types={types}
          flats={flats}
          owners={extra.data?.owners ?? []}
          canEdit={canEdit}
          onSaved={refresh}
        />
      </div>
    </Shell>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-background p-3">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-bold tnum">{value}</p>
    </div>
  );
}

const input =
  "w-full rounded-md border border-border bg-background px-2 py-1 text-[13px] disabled:opacity-70";

function TypesCard({
  projectId,
  types,
  flats,
  canEdit,
  onSaved,
}: {
  projectId: string;
  types: FlatTypeRow[];
  flats: FlatRow[];
  canEdit: boolean;
  onSaved: () => Promise<void>;
}) {
  const [open, setOpen] = useState("");
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({
    label: "",
    bhk: "3",
    saleable: "",
    total: "",
    copyFrom: "",
  });

  async function add() {
    const label = form.label.trim();
    if (!label) {
      toast.error("Give the flat type a name");
      return;
    }
    const src = types.find((t) => t.code === form.copyFrom);
    const code = label.replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const total = n(form.total) || n(src?.indiv_total);
    const { error } = await supabase.from("flat_types").insert({
      project_id: projectId,
      code,
      label,
      bhk: n(form.bhk),
      saleable_sft: n(form.saleable) || n(src?.saleable_sft),
      indiv_excl: src && !n(form.total) ? n(src.indiv_excl) : 0,
      indiv_incl: src && !n(form.total) ? n(src.indiv_incl) : 0,
      indiv_total: total,
      lines: (src?.lines ?? []) as Json,
      sort: types.length,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`Flat type ${label} added`);
    setAdding(false);
    setForm({ label: "", bhk: "3", saleable: "", total: "", copyFrom: "" });
    await onSaved();
  }

  async function save(t: FlatTypeRow, patch: Partial<FlatTypeRow>) {
    const { error } = await supabase
      .from("flat_types")
      .update(patch as never)
      .eq("id", t.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    await onSaved();
  }

  return (
    <section className="rounded-xl border border-border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border p-4">
        <div>
          <h2 className="text-base font-semibold">Flat types</h2>
          <p className="text-[12px] text-muted-foreground">
            Individual works for one flat of each type, at our specification (the report's master
            BOQ rates). Sizes and specs can change per type; the principles stay the same.
          </p>
        </div>
        {canEdit && (
          <button
            type="button"
            onClick={() => setAdding(!adding)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold"
          >
            <Plus className="size-3.5" /> Add flat type
          </button>
        )}
      </div>
      {adding && (
        <div className="grid gap-2 border-b border-border bg-muted/30 p-4 md:grid-cols-6">
          <label className="text-[12px] md:col-span-2">
            Name (e.g. Flat-03 · 2BHK)
            <input
              className={input}
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
            />
          </label>
          <label className="text-[12px]">
            BHK
            <input
              className={input}
              value={form.bhk}
              onChange={(e) => setForm({ ...form, bhk: e.target.value })}
            />
          </label>
          <label className="text-[12px]">
            Saleable sft per flat
            <input
              className={input}
              value={form.saleable}
              onChange={(e) => setForm({ ...form, saleable: e.target.value })}
            />
          </label>
          <label className="text-[12px]">
            Individual works per flat ₹ (incl. GST + contingency)
            <input
              className={input}
              value={form.total}
              onChange={(e) => setForm({ ...form, total: e.target.value })}
            />
          </label>
          <label className="text-[12px]">
            Copy lines from
            <select
              className={input}
              value={form.copyFrom}
              onChange={(e) => setForm({ ...form, copyFrom: e.target.value })}
            >
              <option value="">—</option>
              {types.map((t) => (
                <option key={t.code} value={t.code}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>
          <div className="md:col-span-6">
            <button
              type="button"
              onClick={() => void add()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
            >
              <Save className="size-3.5" /> Save flat type
            </button>
          </div>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] text-[13px]">
          <thead className="bg-muted/40 text-left text-[11px] uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-3 py-2">Type</th>
              <th className="px-3 py-2">Floors</th>
              <th className="px-3 py-2 text-right">Flats</th>
              <th className="px-3 py-2 text-right">Saleable sft</th>
              <th className="px-3 py-2 text-right">Excl. GST</th>
              <th className="px-3 py-2 text-right">With GST</th>
              <th className="px-3 py-2 text-right">With contingency</th>
              <th className="px-3 py-2 text-right">All flats of type</th>
            </tr>
          </thead>
          <tbody>
            {types.map((t) => {
              const count = flats.filter((f) => f.type_code === t.code).length;
              const isOpen = open === t.code;
              const lines = (Array.isArray(t.lines) ? t.lines : []) as unknown as FlatLineRow[];
              return (
                <Fragment key={t.id}>
                  <tr
                    className="cursor-pointer border-t border-border hover:bg-muted/30"
                    onClick={() => setOpen(isOpen ? "" : t.code)}
                  >
                    <td className="px-3 py-2 font-semibold">
                      <span className="inline-flex items-center gap-1">
                        {isOpen ? (
                          <ChevronDown className="size-3.5" />
                        ) : (
                          <ChevronRight className="size-3.5" />
                        )}
                        {t.label}
                      </span>
                    </td>
                    <td className="px-3 py-2">{t.floors}</td>
                    <td className="px-3 py-2 text-right tnum">{count}</td>
                    <td className="px-3 py-2 text-right" onClick={(e) => e.stopPropagation()}>
                      <input
                        className={`${input} w-24 text-right`}
                        defaultValue={String(n(t.saleable_sft))}
                        disabled={!canEdit}
                        onBlur={(e) =>
                          n(e.target.value) !== n(t.saleable_sft) &&
                          void save(t, { saleable_sft: n(e.target.value) })
                        }
                      />
                    </td>
                    <td className="px-3 py-2 text-right tnum">{rs(n(t.indiv_excl))}</td>
                    <td className="px-3 py-2 text-right tnum">{rs(n(t.indiv_incl))}</td>
                    <td className="px-3 py-2 text-right font-semibold tnum">
                      {rs(n(t.indiv_total))}
                    </td>
                    <td className="px-3 py-2 text-right tnum">{cr(n(t.indiv_total) * count)}</td>
                  </tr>
                  {isOpen && (
                    <tr>
                      <td colSpan={8} className="bg-background px-4 py-3">
                        <TypeLines lines={lines} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function TypeLines({ lines }: { lines: FlatLineRow[] }) {
  if (!lines.length)
    return (
      <p className="text-[12px] text-muted-foreground">
        No line detail for this type (added by hand). Import the workbook or copy lines from a type
        to see the detail.
      </p>
    );
  const groups = new Map<string, FlatLineRow[]>();
  for (const l of lines) groups.set(l.pkg, [...(groups.get(l.pkg) ?? []), l]);
  return (
    <div className="max-h-96 overflow-y-auto">
      <table className="w-full text-[12px]">
        <thead className="text-left text-muted-foreground">
          <tr>
            <th className="pr-2 font-medium">Code</th>
            <th className="pr-2 font-medium">Item</th>
            <th className="pr-2 font-medium">Make</th>
            <th className="pr-2 text-right font-medium">Qty</th>
            <th className="pr-2 text-right font-medium">Rate</th>
            <th className="text-right font-medium">With GST</th>
          </tr>
        </thead>
        <tbody>
          {[...groups.entries()].map(([pkg, ls]) => (
            <Fragment key={pkg}>
              <tr className="border-t border-border">
                <td colSpan={5} className="pt-2 font-semibold">
                  {pkg}
                </td>
                <td className="pt-2 text-right font-semibold tnum">
                  {rs(ls.reduce((s, l) => s + n(l.incl), 0))}
                </td>
              </tr>
              {ls.map((l) => (
                <tr key={l.code} className="border-t border-border/40 align-top">
                  <td className="pr-2 text-muted-foreground">{l.code}</td>
                  <td className="pr-2">{l.item}</td>
                  <td className="pr-2 text-muted-foreground">{l.make}</td>
                  <td className="whitespace-nowrap pr-2 text-right tnum">
                    {n(l.qty).toLocaleString("en-IN")} {l.unit}
                  </td>
                  <td className="pr-2 text-right tnum">{rs(n(l.rate))}</td>
                  <td className="text-right tnum">{rs(n(l.incl))}</td>
                </tr>
              ))}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FlatsCard({
  projectId,
  types,
  flats,
  owners,
  canEdit,
  onSaved,
}: {
  projectId: string;
  types: FlatTypeRow[];
  flats: FlatRow[];
  owners: string[];
  canEdit: boolean;
  onSaved: () => Promise<void>;
}) {
  const typeOf = new Map(types.map((t) => [t.code, t]));
  const [newFlat, setNewFlat] = useState({ no: "", type: "" });

  async function save(f: FlatRow, patch: Partial<FlatRow>) {
    const { error } = await supabase
      .from("flats")
      .update(patch as never)
      .eq("id", f.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`Flat ${f.flat_no} saved`);
    await onSaved();
  }

  async function add() {
    const no = newFlat.no.trim();
    if (!no || !newFlat.type) {
      toast.error("Give the flat number and its type");
      return;
    }
    const t = typeOf.get(newFlat.type);
    const { error } = await supabase.from("flats").insert({
      project_id: projectId,
      flat_no: no,
      floor: Math.floor(Number(no) / 100) || 0,
      type_code: newFlat.type,
      saleable_sft: n(t?.saleable_sft),
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    setNewFlat({ no: "", type: "" });
    await onSaved();
  }

  const byOwner = new Map<string, number>();
  for (const f of flats) {
    const k = f.owner_name.trim() || "Not allotted";
    byOwner.set(k, (byOwner.get(k) ?? 0) + 1);
  }

  return (
    <section className="rounded-xl border border-border bg-card">
      <div className="border-b border-border p-4">
        <h2 className="text-base font-semibold">Flats</h2>
        <p className="text-[12px] text-muted-foreground">
          {[...byOwner.entries()].map(([k, v]) => `${k}: ${v}`).join(" · ") || "No flats yet."}{" "}
          Owner's extras are upgrades the owner chose over our specification (incl. GST); they are
          added to that flat's individual works.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-[13px]">
          <thead className="bg-muted/40 text-left text-[11px] uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-3 py-2">Flat</th>
              <th className="px-3 py-2">Type</th>
              <th className="px-3 py-2">Owner</th>
              <th className="px-3 py-2 text-right">Saleable sft</th>
              <th className="px-3 py-2 text-right">Individual works</th>
              <th className="px-3 py-2 text-right">Owner's extras ₹</th>
              <th className="px-3 py-2 text-right">Flat total</th>
              <th className="px-3 py-2">Notes</th>
            </tr>
          </thead>
          <tbody>
            {flats.map((f) => (
              <FlatRowEdit
                key={`${f.id}-${f.updated_at}`}
                f={f}
                types={types}
                owners={owners}
                base={n(typeOf.get(f.type_code)?.indiv_total)}
                canEdit={canEdit}
                onSave={(p) => save(f, p)}
              />
            ))}
          </tbody>
        </table>
      </div>
      {canEdit && types.length > 0 && (
        <div className="flex flex-wrap items-end gap-2 border-t border-border p-4">
          <label className="text-[12px]">
            Flat no.
            <input
              className={`${input} w-24`}
              value={newFlat.no}
              onChange={(e) => setNewFlat({ ...newFlat, no: e.target.value })}
            />
          </label>
          <label className="text-[12px]">
            Type
            <select
              className={input}
              value={newFlat.type}
              onChange={(e) => setNewFlat({ ...newFlat, type: e.target.value })}
            >
              <option value="">—</option>
              {types.map((t) => (
                <option key={t.code} value={t.code}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={() => void add()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold"
          >
            <Plus className="size-3.5" /> Add flat
          </button>
        </div>
      )}
    </section>
  );
}

function FlatRowEdit({
  f,
  types,
  owners,
  base,
  canEdit,
  onSave,
}: {
  f: FlatRow;
  types: FlatTypeRow[];
  owners: string[];
  base: number;
  canEdit: boolean;
  onSave: (p: Partial<FlatRow>) => Promise<void>;
}) {
  const [row, setRow] = useState({
    type_code: f.type_code,
    owner_name: f.owner_name,
    saleable_sft: String(n(f.saleable_sft)),
    owner_extra: String(n(f.owner_extra)),
    notes: f.notes,
  });
  const dirty =
    row.type_code !== f.type_code ||
    row.owner_name !== f.owner_name ||
    n(row.saleable_sft) !== n(f.saleable_sft) ||
    n(row.owner_extra) !== n(f.owner_extra) ||
    row.notes !== f.notes;
  const known = owners.includes(row.owner_name) || !row.owner_name;
  return (
    <tr className="border-t border-border align-top">
      <td className="px-3 py-2 font-semibold">{f.flat_no}</td>
      <td className="px-3 py-2">
        <select
          className={input}
          value={row.type_code}
          disabled={!canEdit}
          onChange={(e) => setRow({ ...row, type_code: e.target.value })}
        >
          {types.map((t) => (
            <option key={t.code} value={t.code}>
              {t.label}
            </option>
          ))}
        </select>
      </td>
      <td className="px-3 py-2">
        <select
          className={input}
          value={known ? row.owner_name : "__other"}
          disabled={!canEdit}
          onChange={(e) =>
            setRow({ ...row, owner_name: e.target.value === "__other" ? " " : e.target.value })
          }
        >
          <option value="">Not allotted</option>
          {owners.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
          <option value="__other">Other owner…</option>
        </select>
        {!known && (
          <input
            className={`${input} mt-1`}
            placeholder="Owner's name"
            value={row.owner_name.trim()}
            disabled={!canEdit}
            onChange={(e) => setRow({ ...row, owner_name: e.target.value || " " })}
          />
        )}
      </td>
      <td className="px-3 py-2">
        <input
          className={`${input} w-24 text-right`}
          value={row.saleable_sft}
          disabled={!canEdit}
          onChange={(e) => setRow({ ...row, saleable_sft: e.target.value })}
        />
      </td>
      <td className="px-3 py-2 text-right tnum">{rs(base)}</td>
      <td className="px-3 py-2">
        <input
          className={`${input} w-28 text-right`}
          value={row.owner_extra}
          disabled={!canEdit}
          onChange={(e) => setRow({ ...row, owner_extra: e.target.value })}
        />
      </td>
      <td className="px-3 py-2 text-right font-semibold tnum">{rs(base + n(row.owner_extra))}</td>
      <td className="px-3 py-2">
        <div className="flex items-start gap-1">
          <input
            className={input}
            value={row.notes}
            disabled={!canEdit}
            onChange={(e) => setRow({ ...row, notes: e.target.value })}
          />
          {canEdit && dirty && (
            <button
              type="button"
              title="Save"
              onClick={() =>
                void onSave({
                  type_code: row.type_code,
                  owner_name: row.owner_name.trim(),
                  saleable_sft: n(row.saleable_sft),
                  owner_extra: n(row.owner_extra),
                  notes: row.notes,
                })
              }
              className="rounded-md bg-primary p-1.5 text-primary-foreground"
            >
              <Save className="size-3.5" />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}
