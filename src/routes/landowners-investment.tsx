import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, Landmark, Plus, Save, Trash2, Upload, Users } from "lucide-react";
import * as XLSX from "xlsx";
import { Shell } from "@/components/saha/Shell";
import { supabase } from "@/integrations/supabase/client";
import { useAccess, useSessionUser } from "@/lib/access";

export const Route = createFileRoute("/landowners-investment")({
  head: () => ({
    meta: [
      { title: "Landowners & Investment Hub — Saha OS" },
      {
        name: "description",
        content:
          "Owner scope, investment responsibility, stage-wise payment schedules and funding progress visibility.",
      },
      { property: "og:title", content: "Landowners & Investment Hub — Saha OS" },
      {
        property: "og:description",
        content:
          "Owner scope, investment responsibility, stage payments and funding progress for every landowner and investor.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

type Owner = {
  name?: string;
  role?: string;
  contact?: string;
  share_pct?: number | string;
  invested?: number | string;
  paid?: number | string;
  units?: string;
  notes?: string;
};

const num = (v: unknown) => {
  const n = typeof v === "number" ? v : Number(String(v ?? "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
};
const inr = (v: number) => `₹${Math.round(v).toLocaleString("en-IN")}`;
const cr = (v: number) => (v >= 10000000 ? `₹${(v / 10000000).toFixed(2)} Cr` : inr(v));
const initials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("") || "—";

const ROLES = ["Land Holder", "Primary Investor", "Co-Developer", "Strategic Partner", "Investor"];

const emptyOwner: Owner = {
  name: "",
  role: "Land Holder",
  contact: "",
  share_pct: "",
  invested: "",
  paid: "",
  units: "",
  notes: "",
};

function Page() {
  const qc = useQueryClient();
  const user = useSessionUser();
  const access = useAccess();
  const canEdit = Boolean(access.access?.isAdmin || access.access?.roles.includes("pm"));

  const [projectId, setProjectId] = useState("");
  const [rows, setRows] = useState<Owner[]>([]);
  const [dirty, setDirty] = useState(false);
  const [status, setStatus] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const projectsQuery = useQuery({
    queryKey: ["site_projects", "landowners-hub"],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_projects")
        .select("id,name,location,target_budget,total_built_up_sft,landowners,investors")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
  const projects = projectsQuery.data ?? [];
  const activeId = projectId || projects[0]?.id || "";
  const project = projects.find((p) => p.id === activeId);

  useEffect(() => {
    if (!project) return;
    const owners = Array.isArray(project.landowners) ? (project.landowners as Owner[]) : [];
    const investors = Array.isArray(project.investors) ? (project.investors as Owner[]) : [];
    const merged: Owner[] = [
      ...owners.map((o) => ({ role: "Land Holder", ...o })),
      ...investors
        .filter((i) => i && (i.name ?? "").toString().trim())
        .map((i) => ({ role: "Investor", ...i })),
    ];
    setRows(merged);
    setDirty(false);
    setStatus("");
  }, [activeId, projectsQuery.dataUpdatedAt]);

  const chargesQuery = useQuery({
    queryKey: ["project_charges", "owners-hub", activeId],
    enabled: Boolean(activeId && user?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_charges")
        .select("amount,allocation,status")
        .eq("project_id", activeId);
      if (error) throw error;
      return data ?? [];
    },
  });
  const charges = chargesQuery.data ?? [];
  const statutoryTotal = charges.reduce((s, c) => s + num(c.amount), 0);

  const save = useMutation({
    mutationFn: async (next: Owner[]) => {
      const clean = next
        .filter((o) => (o.name ?? "").toString().trim())
        .map((o) => ({
          name: (o.name ?? "").toString().trim(),
          role: o.role || "Land Holder",
          contact: (o.contact ?? "").toString().trim(),
          share_pct: num(o.share_pct),
          invested: num(o.invested),
          paid: num(o.paid),
          units: (o.units ?? "").toString().trim(),
          notes: (o.notes ?? "").toString().trim(),
        }));
      const { error } = await supabase
        .from("site_projects")
        .update({ landowners: clean, investors: [] })
        .eq("id", activeId);
      if (error) throw error;
      return clean;
    },
    onSuccess: async () => {
      setDirty(false);
      setStatus("Saved to the project record.");
      await qc.invalidateQueries({ queryKey: ["site_projects"] });
    },
    onError: (e: unknown) => setStatus(e instanceof Error ? e.message : "Could not save"),
  });

  const budget = num(project?.target_budget);
  const totals = useMemo(() => {
    const share = rows.reduce((s, o) => s + num(o.share_pct), 0);
    const invested = rows.reduce((s, o) => s + num(o.invested), 0);
    const paid = rows.reduce((s, o) => s + num(o.paid), 0);
    return { share, invested, paid, outstanding: Math.max(budget - paid, 0) };
  }, [rows, budget]);

  const update = (i: number, patch: Partial<Owner>) => {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
    setDirty(true);
  };

  const exportExcel = () => {
    const sheet = XLSX.utils.json_to_sheet(
      rows.map((o) => ({
        Name: o.name ?? "",
        Role: o.role ?? "",
        Contact: o.contact ?? "",
        "Share %": num(o.share_pct),
        "Investment committed": num(o.invested),
        "Amount paid": num(o.paid),
        "Assigned units": o.units ?? "",
        Notes: o.notes ?? "",
      })),
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, sheet, "Owners");
    XLSX.writeFile(wb, `owners-${(project?.name || "project").replace(/\s+/g, "-")}.xlsx`);
    setStatus("Owner sheet downloaded.");
  };

  const downloadTemplate = () => {
    const sheet = XLSX.utils.json_to_sheet([
      {
        Name: "Vijay Kumar",
        Role: "Primary Investor",
        Contact: "98xxxxxxx",
        "Share %": 30,
        "Investment committed": 5000000,
        "Amount paid": 2500000,
        "Assigned units": "Flat 302, 304",
        Notes: "Land sharing agreement",
      },
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, sheet, "Owners");
    XLSX.writeFile(wb, "owners-template.xlsx");
    setStatus("Template downloaded.");
  };

  const importExcel = async (file: File) => {
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf);
      const first = wb.SheetNames[0];
      if (!first) throw new Error("Empty file");
      const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets[first]!);
      const imported: Owner[] = json
        .map((r) => ({
          name: String(r["Name"] ?? r["name"] ?? "").trim(),
          role: String(r["Role"] ?? r["role"] ?? "Land Holder"),
          contact: String(r["Contact"] ?? r["contact"] ?? ""),
          share_pct: num(r["Share %"] ?? r["share_pct"]),
          invested: num(r["Investment committed"] ?? r["invested"]),
          paid: num(r["Amount paid"] ?? r["paid"]),
          units: String(r["Assigned units"] ?? r["units"] ?? ""),
          notes: String(r["Notes"] ?? r["notes"] ?? ""),
        }))
        .filter((o) => o.name);
      if (imported.length === 0) throw new Error("No owner rows found");
      setRows(imported);
      setDirty(true);
      setStatus(`${imported.length} owners loaded — press Save to store them.`);
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Could not read that file");
    }
  };

  const shareWarning = rows.length > 0 && Math.abs(totals.share - 100) > 0.01;

  return (
    <Shell title="Landowners & Investment Hub">
      <div className="w-full px-4 pb-10 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
              Governance / Landowners & Investment
            </p>
            <h1 className="text-2xl font-bold text-slate-900">Landowners & Investment Hub</h1>
            <p className="text-sm text-slate-500">
              Owner scope, share, investment committed, payments received and outstanding funding.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={downloadTemplate}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <Download className="h-4 w-4" /> Template
            </button>
            <button
              type="button"
              onClick={exportExcel}
              disabled={rows.length === 0}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              <Download className="h-4 w-4" /> Export Excel
            </button>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={!canEdit}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              <Upload className="h-4 w-4" /> Import Excel
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void importExcel(f);
                e.target.value = "";
              }}
            />
            <button
              type="button"
              onClick={() => {
                setRows((prev) => [...prev, { ...emptyOwner }]);
                setDirty(true);
              }}
              disabled={!canEdit}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              <Plus className="h-4 w-4" /> Add Owner
            </button>
            <button
              type="button"
              onClick={() => save.mutate(rows)}
              disabled={!canEdit || !dirty || !activeId || save.isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
            >
              <Save className="h-4 w-4" /> {save.isPending ? "Saving…" : "Save"}
            </button>
          </div>
        </div>

        {!canEdit && (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
            You have view-only access here. Ask an Admin or PM to change owner records.
          </p>
        )}
        {status && (
          <p className="rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-700">{status}</p>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Active project
            </p>
            <select
              value={activeId}
              onChange={(e) => setProjectId(e.target.value)}
              className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-sm"
            >
              {projects.length === 0 && <option value="">No projects yet</option>}
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <p className="mt-3 text-sm text-slate-500">{project?.location || "—"}</p>
            <p className="mt-1 text-xs text-slate-400">
              Statutory & common charges recorded: {cr(statutoryTotal)}
            </p>
          </div>
          <div className="lg:col-span-9 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Project budget", value: cr(budget), tone: "text-slate-900" },
              {
                label: "Share allocated",
                value: `${totals.share.toFixed(1)}%`,
                tone: shareWarning ? "text-rose-600" : "text-emerald-600",
              },
              { label: "Investment committed", value: cr(totals.invested), tone: "text-slate-900" },
              { label: "Paid / outstanding", value: `${cr(totals.paid)} · ${cr(totals.outstanding)}`, tone: "text-slate-900" },
            ].map((c) => (
              <div
                key={c.label}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  {c.label}
                </p>
                <p className={`mt-1 text-lg font-bold ${c.tone}`}>{c.value}</p>
              </div>
            ))}
          </div>
        </div>

        {shareWarning && (
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
            Shares add up to {totals.share.toFixed(1)}% — adjust so the total is 100%.
          </p>
        )}

        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 p-4">
            <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
              <Users className="h-4 w-4 text-emerald-600" /> Stakeholders / Owners
            </h2>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
              {rows.length} active
            </span>
          </div>

          {rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-10 text-center">
              <Landmark className="h-8 w-8 text-slate-300" />
              <p className="mt-2 text-sm font-medium text-slate-600">No owners recorded yet</p>
              <p className="text-xs text-slate-400">
                Use Add Owner or import an Excel sheet to build the stakeholder list.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {rows.map((o, i) => {
                const share = num(o.share_pct);
                const suggested = (budget * share) / 100;
                const due = Math.max(suggested - num(o.paid), 0);
                return (
                  <div key={i} className="p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-700">
                        {initials(String(o.name ?? ""))}
                      </div>
                      <input
                        value={String(o.name ?? "")}
                        onChange={(e) => update(i, { name: e.target.value })}
                        disabled={!canEdit}
                        placeholder="Owner name"
                        className="flex-1 rounded-lg border border-blue-200 bg-blue-50/50 px-3 py-2 text-sm font-semibold text-slate-900"
                      />
                      <select
                        value={String(o.role ?? "Land Holder")}
                        onChange={(e) => update(i, { role: e.target.value })}
                        disabled={!canEdit}
                        className="rounded-lg border border-blue-200 bg-blue-50/50 px-2 py-2 text-sm"
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => {
                          setRows((prev) => prev.filter((_, idx) => idx !== i));
                          setDirty(true);
                        }}
                        disabled={!canEdit}
                        title="Remove owner"
                        className="rounded-lg border border-slate-200 p-2 text-rose-600 hover:bg-rose-50 disabled:opacity-40"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
                      <Field
                        label="Contact"
                        value={String(o.contact ?? "")}
                        onChange={(v) => update(i, { contact: v })}
                        disabled={!canEdit}
                      />
                      <Field
                        label="Share %"
                        value={String(o.share_pct ?? "")}
                        onChange={(v) => update(i, { share_pct: v })}
                        disabled={!canEdit}
                      />
                      <Field
                        label="Committed ₹"
                        value={String(o.invested ?? "")}
                        onChange={(v) => update(i, { invested: v })}
                        disabled={!canEdit}
                      />
                      <Field
                        label="Paid ₹"
                        value={String(o.paid ?? "")}
                        onChange={(v) => update(i, { paid: v })}
                        disabled={!canEdit}
                      />
                      <Field
                        label="Assigned units"
                        value={String(o.units ?? "")}
                        onChange={(v) => update(i, { units: v })}
                        disabled={!canEdit}
                      />
                      <Field
                        label="Notes"
                        value={String(o.notes ?? "")}
                        onChange={(v) => update(i, { notes: v })}
                        disabled={!canEdit}
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2 rounded-lg bg-emerald-50/60 p-3 text-sm">
                      <Metric label="Suggested share of budget" value={cr(suggested)} />
                      <Metric label="Common charges share" value={cr((statutoryTotal * share) / 100)} />
                      <Metric label="Balance due" value={cr(due)} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Shell>
  );
}

function Field({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <label className="block">
      <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="mt-1 w-full rounded-lg border border-blue-200 bg-blue-50/50 px-2 py-1.5 text-sm"
      />
    </label>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-800/70">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-bold text-emerald-900">{value}</p>
    </div>
  );
}
