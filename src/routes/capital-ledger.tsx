import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BadgeIndianRupee,
  Download,
  Landmark,
  Plus,
  Trash2,
  Users,
  Wallet,
} from "lucide-react";
import * as XLSX from "xlsx";
import { Shell } from "@/components/saha/Shell";
import { supabase } from "@/integrations/supabase/client";
import { useAccess, useSessionUser } from "@/lib/access";

export const Route = createFileRoute("/capital-ledger")({
  head: () => ({
    meta: [
      { title: "Capital Ledger & Landowner Contributions — Saha OS" },
      {
        name: "description",
        content:
          "Record owner capital calls and money received, with share-wise liability, paid-to-date and pending dues per landowner.",
      },
      { property: "og:title", content: "Capital Ledger & Landowner Contributions — Saha OS" },
      {
        property: "og:description",
        content:
          "Owner-wise capital calls, receipts, liability and pending dues for every project in Saha OS.",
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
};

type Entry = {
  id: string;
  project_id: string | null;
  owner_name: string;
  owner_role: string;
  entry_type: string;
  amount: number;
  entry_date: string | null;
  milestone: string;
  mode: string;
  reference: string;
  status: string;
  notes: string;
};

const num = (v: unknown) => {
  const n = typeof v === "number" ? v : Number(String(v ?? "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
};
const inr = (v: number) => `₹${Math.round(v).toLocaleString("en-IN")}`;
const cr = (v: number) =>
  v >= 10000000 ? `₹${(v / 10000000).toFixed(2)} Cr` : v >= 100000 ? `₹${(v / 100000).toFixed(2)} L` : inr(v);
const initials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("") || "—";
const today = () => new Date().toISOString().slice(0, 10);

const MODES = ["Bank transfer", "Cheque", "UPI", "Cash", "Adjustment"];

type FormState = {
  owner_name: string;
  entry_type: "receipt" | "call";
  amount: string;
  entry_date: string;
  milestone: string;
  mode: string;
  reference: string;
  status: string;
  notes: string;
};

const emptyForm = (): FormState => ({
  owner_name: "",
  entry_type: "receipt",
  amount: "",
  entry_date: today(),
  milestone: "",
  mode: "Bank transfer",
  reference: "",
  status: "received",
  notes: "",
});

function Page() {
  const qc = useQueryClient();
  const user = useSessionUser();
  const access = useAccess();
  const canEdit = Boolean(
    access.access?.isAdmin ||
      access.access?.roles.some((r) => ["pm", "accounts"].includes(r)),
  );
  const canDelete = Boolean(access.access?.isAdmin || access.access?.roles.includes("pm"));

  const [projectId, setProjectId] = useState("");
  const [form, setForm] = useState<FormState>(emptyForm());
  const [showForm, setShowForm] = useState(false);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const formRef = useRef<HTMLDivElement>(null);

  const projectsQuery = useQuery({
    queryKey: ["site_projects", "capital-ledger"],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_projects")
        .select("id,name,location,target_budget,landowners,investors")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
  const projects = projectsQuery.data ?? [];
  const activeId = projectId || projects[0]?.id || "";
  const project = projects.find((p) => p.id === activeId);

  const owners: Owner[] = useMemo(() => {
    if (!project) return [];
    const a = Array.isArray(project.landowners) ? (project.landowners as Owner[]) : [];
    const b = Array.isArray(project.investors) ? (project.investors as Owner[]) : [];
    return [...a, ...b].filter((o) => (o?.name ?? "").toString().trim());
  }, [project]);

  const entriesQuery = useQuery({
    queryKey: ["capital_entries", activeId],
    enabled: Boolean(activeId && user?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("capital_entries")
        .select("*")
        .eq("project_id", activeId)
        .order("entry_date", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Entry[];
    },
  });
  const entries = entriesQuery.data ?? [];

  const addEntry = useMutation({
    mutationFn: async (f: FormState) => {
      if (!activeId) throw new Error("Select a project first");
      if (!f.owner_name.trim()) throw new Error("Choose the owner / investor");
      if (num(f.amount) <= 0) throw new Error("Enter an amount greater than zero");
      const owner = owners.find((o) => (o.name ?? "") === f.owner_name);
      const { error } = await supabase.from("capital_entries").insert({
        project_id: activeId,
        owner_name: f.owner_name.trim(),
        owner_role: (owner?.role ?? "").toString(),
        entry_type: f.entry_type,
        amount: num(f.amount),
        entry_date: f.entry_date || today(),
        milestone: f.milestone.trim(),
        mode: f.entry_type === "receipt" ? f.mode : "",
        reference: f.reference.trim(),
        status: f.entry_type === "receipt" ? "received" : f.status,
        notes: f.notes.trim(),
        created_by: user?.id ?? null,
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      setStatus("Entry saved to the capital ledger.");
      setForm(emptyForm());
      setShowForm(false);
      await qc.invalidateQueries({ queryKey: ["capital_entries"] });
    },
    onError: (e: unknown) => setStatus(e instanceof Error ? e.message : "Could not save the entry"),
  });

  const removeEntry = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("capital_entries").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: async () => {
      setStatus("Entry deleted.");
      await qc.invalidateQueries({ queryKey: ["capital_entries"] });
    },
    onError: (e: unknown) => setStatus(e instanceof Error ? e.message : "Could not delete"),
  });

  const markReceived = useMutation({
    mutationFn: async (row: Entry) => {
      const { error } = await supabase
        .from("capital_entries")
        .update({ entry_type: "receipt", status: "received", entry_date: row.entry_date || today() })
        .eq("id", row.id);
      if (error) throw error;
    },
    onSuccess: async () => {
      setStatus("Capital call marked as received.");
      await qc.invalidateQueries({ queryKey: ["capital_entries"] });
    },
    onError: (e: unknown) => setStatus(e instanceof Error ? e.message : "Could not update"),
  });

  const budget = num(project?.target_budget);

  const ownerRows = useMemo(() => {
    const byOwner = new Map<string, { received: number; called: number }>();
    for (const e of entries) {
      const key = e.owner_name || "Unassigned";
      const cur = byOwner.get(key) ?? { received: 0, called: 0 };
      if (e.entry_type === "receipt") cur.received += num(e.amount);
      else cur.called += num(e.amount);
      byOwner.set(key, cur);
    }
    const names = new Set<string>([
      ...owners.map((o) => (o.name ?? "").toString()),
      ...Array.from(byOwner.keys()),
    ]);
    return Array.from(names)
      .filter(Boolean)
      .map((name) => {
        const owner = owners.find((o) => (o.name ?? "") === name);
        const share = num(owner?.share_pct);
        const agg = byOwner.get(name) ?? { received: 0, called: 0 };
        const committed = num(owner?.invested) || (budget * share) / 100;
        const received = agg.received + num(owner?.paid);
        return {
          name,
          role: (owner?.role ?? "Investor").toString(),
          contact: (owner?.contact ?? "").toString(),
          share,
          liability: committed,
          received,
          pending: Math.max(committed - received, 0),
          called: agg.called,
        };
      })
      .filter((r) => !search || r.name.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => b.share - a.share);
  }, [entries, owners, budget, search]);

  const totals = useMemo(() => {
    const share = ownerRows.reduce((s, r) => s + r.share, 0);
    const liability = ownerRows.reduce((s, r) => s + r.liability, 0);
    const received = ownerRows.reduce((s, r) => s + r.received, 0);
    const pending = ownerRows.reduce((s, r) => s + r.pending, 0);
    const openCalls = entries
      .filter((e) => e.entry_type === "call" && e.status !== "received")
      .reduce((s, e) => s + num(e.amount), 0);
    return { share, liability, received, pending, openCalls };
  }, [ownerRows, entries]);

  const exportExcel = () => {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(
        ownerRows.map((r) => ({
          Owner: r.name,
          Role: r.role,
          "Share %": r.share,
          Liability: r.liability,
          Received: r.received,
          Pending: r.pending,
          "Open calls": r.called,
        })),
      ),
      "Owner summary",
    );
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(
        entries.map((e) => ({
          Date: e.entry_date ?? "",
          Owner: e.owner_name,
          Type: e.entry_type === "call" ? "Capital call" : "Money received",
          Amount: num(e.amount),
          Milestone: e.milestone,
          Mode: e.mode,
          Reference: e.reference,
          Status: e.status,
          Notes: e.notes,
        })),
      ),
      "Ledger",
    );
    XLSX.writeFile(wb, `capital-ledger-${(project?.name || "project").replace(/\s+/g, "-")}.xlsx`);
    setStatus("Capital ledger downloaded.");
  };

  const openFor = (owner: string, type: "receipt" | "call") => {
    setForm({ ...emptyForm(), owner_name: owner, entry_type: type, status: type === "call" ? "pending" : "received" });
    setShowForm(true);
    setStatus("");
    window.setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 50);
  };

  const set = (patch: Partial<FormState>) => setForm((p) => ({ ...p, ...patch }));

  return (
    <Shell title="Capital Ledger & Landowner Contributions">
      <div className="w-full px-4 pb-10 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
              Money &amp; Owners / Capital Ledger
            </p>
            <h1 className="text-2xl font-bold text-slate-900">Capital Ledger &amp; Landowner Contributions</h1>
            <p className="text-sm text-slate-500">
              Record every rupee called and received from landowners and investors, share-wise.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={activeId}
              onChange={(e) => setProjectId(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
            >
              {projects.length === 0 && <option value="">No projects yet</option>}
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={exportExcel}
              disabled={ownerRows.length === 0}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              <Download className="h-4 w-4" /> Export Excel
            </button>
            <button
              type="button"
              onClick={() => {
                setForm(emptyForm());
                setShowForm((v) => !v);
                setStatus("");
              }}
              disabled={!canEdit || !activeId}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              <Plus className="h-4 w-4" /> Add owner entry
            </button>
          </div>
        </div>

        {!canEdit && (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
            You can view this ledger. Adding entries needs Admin, PM or Accounts rights.
          </p>
        )}
        {status && (
          <p className="rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-700">{status}</p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          {[
            { label: "Owners / Investors", value: `${ownerRows.length}`, sub: `${totals.share.toFixed(1)}% share mapped`, icon: Users },
            { label: "Total liability", value: cr(totals.liability), sub: `Project budget ${cr(budget)}`, icon: BadgeIndianRupee },
            { label: "Received to date", value: cr(totals.received), sub: `${entries.filter((e) => e.entry_type === "receipt").length} receipts`, icon: Wallet },
            { label: "Pending dues", value: cr(totals.pending), sub: `Open calls ${cr(totals.openCalls)}`, icon: Landmark },
          ].map((c) => (
            <div key={c.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{c.label}</span>
                <c.icon className="h-4 w-4 text-emerald-600" />
              </div>
              <div className="mt-2 text-xl font-bold text-slate-900">{c.value}</div>
              <div className="text-xs text-slate-500">{c.sub}</div>
            </div>
          ))}
        </div>

        {showForm && (
          <div ref={formRef} className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 space-y-3">
            <h2 className="text-base font-bold text-slate-900">New capital entry</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium text-slate-700">Owner / investor</span>
                {owners.length > 0 ? (
                  <select
                    value={form.owner_name}
                    onChange={(e) => set({ owner_name: e.target.value })}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2"
                  >
                    <option value="">Select owner</option>
                    {owners.map((o) => (
                      <option key={String(o.name)} value={String(o.name)}>
                        {String(o.name)}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    value={form.owner_name}
                    onChange={(e) => set({ owner_name: e.target.value })}
                    placeholder="Owner name"
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2"
                  />
                )}
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium text-slate-700">Entry type</span>
                <select
                  value={form.entry_type}
                  onChange={(e) =>
                    set({
                      entry_type: e.target.value as "receipt" | "call",
                      status: e.target.value === "call" ? "pending" : "received",
                    })
                  }
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2"
                >
                  <option value="receipt">Money received</option>
                  <option value="call">Capital call (demand)</option>
                </select>
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium text-slate-700">Amount (₹)</span>
                <input
                  type="number"
                  value={form.amount}
                  onChange={(e) => set({ amount: e.target.value })}
                  placeholder="500000"
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium text-slate-700">Date</span>
                <input
                  type="date"
                  value={form.entry_date}
                  onChange={(e) => set({ entry_date: e.target.value })}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium text-slate-700">Milestone / stage</span>
                <input
                  value={form.milestone}
                  onChange={(e) => set({ milestone: e.target.value })}
                  placeholder="Call #3 — Foundation"
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2"
                />
              </label>
              {form.entry_type === "receipt" && (
                <label className="flex flex-col gap-1 text-sm">
                  <span className="font-medium text-slate-700">Payment mode</span>
                  <select
                    value={form.mode}
                    onChange={(e) => set({ mode: e.target.value })}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2"
                  >
                    {MODES.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium text-slate-700">Reference / UTR</span>
                <input
                  value={form.reference}
                  onChange={(e) => set({ reference: e.target.value })}
                  placeholder="UTR / cheque no."
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm xl:col-span-2">
                <span className="font-medium text-slate-700">Notes</span>
                <input
                  value={form.notes}
                  onChange={(e) => set({ notes: e.target.value })}
                  placeholder="Optional remark"
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2"
                />
              </label>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => addEntry.mutate(form)}
                disabled={addEntry.isPending || !canEdit}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {addEntry.isPending ? "Saving…" : "Save entry"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 p-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Owner &amp; investor directory</h2>
              <p className="text-xs text-slate-500">
                Share, liability, money received and pending dues — owners come from the project record.
              </p>
            </div>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter owners…"
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="p-3">Owner</th>
                  <th className="p-3 text-center">Share</th>
                  <th className="p-3 text-right">Liability</th>
                  <th className="p-3 text-right">Received</th>
                  <th className="p-3 text-right">Pending</th>
                  <th className="p-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ownerRows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-slate-500">
                      No owners yet. Add landowners and investors on the Landowners &amp; Investment page, then
                      record their money here.
                    </td>
                  </tr>
                )}
                {ownerRows.map((r) => (
                  <tr key={r.name} className="hover:bg-slate-50/70">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">
                          {initials(r.name)}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">{r.name}</div>
                          <div className="text-xs text-slate-500">{r.role}{r.contact ? ` • ${r.contact}` : ""}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-center font-medium text-slate-700">{r.share.toFixed(1)}%</td>
                    <td className="p-3 text-right text-slate-800">{inr(r.liability)}</td>
                    <td className="p-3 text-right font-medium text-emerald-700">{inr(r.received)}</td>
                    <td className={`p-3 text-right font-medium ${r.pending > 0 ? "text-rose-600" : "text-slate-500"}`}>
                      {inr(r.pending)}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => openFor(r.name, "receipt")}
                          disabled={!canEdit}
                          className="rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                        >
                          Add receipt
                        </button>
                        <button
                          type="button"
                          onClick={() => openFor(r.name, "call")}
                          disabled={!canEdit}
                          className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                        >
                          Raise call
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-slate-200 p-4">
            <h2 className="text-base font-bold text-slate-900">Capital ledger entries</h2>
            <p className="text-xs text-slate-500">
              {entriesQuery.isLoading ? "Loading…" : `${entries.length} entries for ${project?.name ?? "this project"}`}
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="p-3">Date</th>
                  <th className="p-3">Owner</th>
                  <th className="p-3">Type</th>
                  <th className="p-3 text-right">Amount</th>
                  <th className="p-3">Milestone</th>
                  <th className="p-3">Mode / Ref</th>
                  <th className="p-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {entries.length === 0 && !entriesQuery.isLoading && (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-slate-500">
                      No entries yet. Use “Add owner entry” to record a receipt or raise a capital call.
                    </td>
                  </tr>
                )}
                {entries.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50/70">
                    <td className="p-3 text-slate-700">{e.entry_date ?? "—"}</td>
                    <td className="p-3 font-medium text-slate-900">{e.owner_name}</td>
                    <td className="p-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                          e.entry_type === "receipt"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {e.entry_type === "receipt" ? "Received" : `Call · ${e.status}`}
                      </span>
                    </td>
                    <td className="p-3 text-right font-medium text-slate-800">{inr(num(e.amount))}</td>
                    <td className="p-3 text-slate-600">{e.milestone || "—"}</td>
                    <td className="p-3 text-slate-600">
                      {[e.mode, e.reference].filter(Boolean).join(" • ") || "—"}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-center gap-2">
                        {e.entry_type === "call" && e.status !== "received" && (
                          <button
                            type="button"
                            onClick={() => markReceived.mutate(e)}
                            disabled={!canEdit}
                            className="rounded-lg border border-emerald-300 bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
                          >
                            Mark received
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => removeEntry.mutate(e.id)}
                          disabled={!canDelete}
                          title="Delete entry"
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-40"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Shell>
  );
}
