import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Landmark, Plus, Trash2, IndianRupee, Users } from "lucide-react";
import { Shell } from "@/components/saha/Shell";
import { supabase } from "@/integrations/supabase/client";
import { useAccess, useSessionUser } from "@/lib/access";

export const Route = createFileRoute("/common-expenses")({
  head: () => ({
    meta: [
      { title: "Common & Statutory Expenses — Permissions, LRS, HMWSSB | Saha OS" },
      {
        name: "description",
        content:
          "Track building permission charges, LRS per landowner, electrical connection, HMWSSB and architectural fees as common project expenses shared with owners.",
      },
      { property: "og:title", content: "Common & Statutory Expenses — Saha OS" },
      {
        property: "og:description",
        content:
          "Permissions, LRS, electricity connection, HMWSSB and architect fees recorded as common expenses with owner-wise share.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

const CATEGORIES = [
  { value: "permissions", label: "Permission / Approval charges" },
  { value: "lrs", label: "LRS charges (owner land wise)" },
  { value: "electrical", label: "Electrical connection charges" },
  { value: "hmwssb", label: "HMWSSB water & sewerage charges" },
  { value: "architectural", label: "Architectural / consultant fees" },
  { value: "other", label: "Other common charge" },
] as const;

const categoryLabel = (v: string) =>
  CATEGORIES.find((c) => c.value === v)?.label ?? "Other common charge";

const num = (v: unknown) => {
  const n = typeof v === "number" ? v : Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
};
const inr = (v: number) => `₹${Math.round(v).toLocaleString("en-IN")}`;

type Owner = { name?: string; contact?: string; share_pct?: number | string };
type OwnerSplit = { name: string; amount: number };

type ChargeRow = {
  id: string;
  project_id: string;
  category: string;
  description: string;
  authority: string;
  amount: number | string | null;
  charge_date: string | null;
  status: string;
  allocation: string;
  owner_splits: unknown;
  notes: string;
};

const emptyDraft = {
  category: "permissions",
  description: "",
  authority: "",
  amount: "",
  charge_date: "",
  status: "planned",
  allocation: "common",
  notes: "",
};

function Page() {
  const qc = useQueryClient();
  const user = useSessionUser();
  const access = useAccess();
  const canDelete = Boolean(access.access?.isAdmin || access.access?.roles.includes("pm"));
  const [projectId, setProjectId] = useState("");
  const [draft, setDraft] = useState({ ...emptyDraft });
  const [showForm, setShowForm] = useState(false);

  const projectsQuery = useQuery({
    queryKey: ["site_projects", "common-expenses"],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_projects")
        .select("id,name,location,total_built_up_sft,landowners")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
  const projects = projectsQuery.data ?? [];
  const activeId = projectId || projects[0]?.id || "";
  const project = projects.find((p) => p.id === activeId);
  const owners: Owner[] = Array.isArray(project?.landowners)
    ? (project?.landowners as Owner[])
    : [];
  const sft = num(project?.total_built_up_sft);

  const chargesQuery = useQuery({
    queryKey: ["project_charges", activeId],
    enabled: Boolean(activeId && user?.id),
    refetchOnWindowFocus: true,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_charges")
        .select("*")
        .eq("project_id", activeId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as ChargeRow[];
    },
  });
  const charges = chargesQuery.data ?? [];

  const addCharge = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("project_charges").insert({
        project_id: activeId,
        category: draft.category,
        description: draft.description.trim(),
        authority: draft.authority.trim(),
        amount: num(draft.amount),
        charge_date: draft.charge_date || null,
        status: draft.status,
        allocation: draft.allocation,
        notes: draft.notes.trim(),
        created_by: user?.id ?? null,
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      setDraft({ ...emptyDraft });
      setShowForm(false);
      await qc.invalidateQueries({ queryKey: ["project_charges", activeId] });
    },
  });

  const updateCharge = useMutation({
    mutationFn: async (patch: { id: string; values: { status?: string } }) => {
      const { error } = await supabase
        .from("project_charges")
        .update(patch.values)
        .eq("id", patch.id);
      if (error) throw error;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["project_charges", activeId] });
    },
  });

  const removeCharge = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("project_charges").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["project_charges", activeId] });
    },
  });

  const totals = useMemo(() => {
    const byCategory = new Map<string, number>();
    let total = 0;
    let paid = 0;
    let perOwnerTotal = 0;
    for (const c of charges) {
      const amt = num(c.amount);
      total += amt;
      if (String(c.status) === "paid") paid += amt;
      if (String(c.allocation) === "per_owner") perOwnerTotal += amt;
      byCategory.set(c.category, (byCategory.get(c.category) ?? 0) + amt);
    }
    return { byCategory, total, paid, perOwnerTotal, commonTotal: total - perOwnerTotal };
  }, [charges]);

  const shareBase = owners.reduce((s, o) => s + num(o.share_pct), 0);
  const ownerAllocation = owners.map((o) => {
    const pct = shareBase > 0 ? (num(o.share_pct) / shareBase) * 100 : 0;
    const common = (totals.commonTotal * pct) / 100;
    const land = (totals.perOwnerTotal * pct) / 100;
    return {
      name: o.name || "Unnamed owner",
      pct,
      common,
      land,
      total: common + land,
    };
  });

  const ownerSplitsFor = (row: ChargeRow): OwnerSplit[] => {
    const saved = Array.isArray(row.owner_splits) ? (row.owner_splits as OwnerSplit[]) : [];
    if (saved.length > 0) return saved;
    const amt = num(row.amount);
    return owners.map((o) => ({
      name: o.name || "Unnamed owner",
      amount: shareBase > 0 ? (amt * num(o.share_pct)) / shareBase : 0,
    }));
  };

  return (
    <Shell title="Common & Statutory Expenses">
      <div className="space-y-6">
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/80">
            Money &amp; owners
          </p>
          <h1 className="flex items-center gap-3 text-2xl font-extrabold uppercase tracking-tight text-foreground sm:text-3xl">
            <Landmark className="h-7 w-7 text-primary" />
            Common &amp; Statutory Expenses
          </h1>
          <p className="max-w-3xl text-sm text-muted-foreground">
            Permission charges, LRS (land wise, per owner), electrical connection, HMWSSB water &amp;
            sewerage and architectural fees. These sit outside the material BOQ and are shared with
            the landowners as common project expenses.
          </p>
        </header>

        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Project
          </span>
          <select
            value={activeId}
            onChange={(e) => setProjectId(e.target.value)}
            className="min-w-[220px] rounded-xl border border-border bg-background px-3 py-2 text-sm"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} {p.location ? `· ${p.location}` : ""}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            disabled={!activeId}
            className="ml-auto inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            Add charge
          </button>
        </div>

        {projects.length === 0 ? (
          <p className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
            Add a project first — then record its permission, LRS, electricity, water board and
            architect charges here.
          </p>
        ) : null}

        {showForm ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!activeId) return;
              addCharge.mutate();
            }}
            className="grid gap-3 rounded-2xl border border-sky-500/40 bg-sky-500/5 p-4 sm:grid-cols-2 xl:grid-cols-3"
          >
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Charge type
              <select
                value={draft.category}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    category: e.target.value,
                    allocation: e.target.value === "lrs" ? "per_owner" : d.allocation,
                  }))
                }
                className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-normal normal-case tracking-normal text-foreground"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Description
              <input
                value={draft.description}
                onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
                placeholder="e.g. GHMC building permission fee"
                className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-normal normal-case tracking-normal text-foreground"
              />
            </label>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Authority / consultant
              <input
                value={draft.authority}
                onChange={(e) => setDraft((d) => ({ ...d, authority: e.target.value }))}
                placeholder="GHMC / TGSPDCL / HMWSSB / Architect"
                className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-normal normal-case tracking-normal text-foreground"
              />
            </label>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Amount (₹)
              <input
                value={draft.amount}
                onChange={(e) => setDraft((d) => ({ ...d, amount: e.target.value }))}
                inputMode="decimal"
                className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-normal tabular-nums text-foreground"
              />
            </label>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Date
              <input
                type="date"
                value={draft.charge_date}
                onChange={(e) => setDraft((d) => ({ ...d, charge_date: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-normal text-foreground"
              />
            </label>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Shared how?
              <select
                value={draft.allocation}
                onChange={(e) => setDraft((d) => ({ ...d, allocation: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-normal normal-case tracking-normal text-foreground"
              >
                <option value="common">Common to all owners</option>
                <option value="per_owner">Split per owner as per land</option>
              </select>
            </label>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Status
              <select
                value={draft.status}
                onChange={(e) => setDraft((d) => ({ ...d, status: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-normal normal-case tracking-normal text-foreground"
              >
                <option value="planned">Planned</option>
                <option value="paid">Paid</option>
              </select>
            </label>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground xl:col-span-2">
              Notes
              <input
                value={draft.notes}
                onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-normal normal-case tracking-normal text-foreground"
              />
            </label>
            <div className="flex items-end gap-2">
              <button
                type="submit"
                disabled={addCharge.isPending}
                className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
              >
                {addCharge.isPending ? "Saving…" : "Save charge"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-xl border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Total common expenses", value: totals.total, tone: "border-primary/40 bg-primary/5" },
            { label: "Paid so far", value: totals.paid, tone: "border-emerald-600/30 bg-emerald-600/5" },
            {
              label: "Yet to pay",
              value: totals.total - totals.paid,
              tone: "border-amber-500/40 bg-amber-500/5",
            },
            {
              label: "LRS / land-wise share",
              value: totals.perOwnerTotal,
              tone: "border-violet-500/40 bg-violet-500/5",
            },
          ].map((c) => (
            <div key={c.label} className={`rounded-2xl border p-4 ${c.tone}`}>
              <div className="flex items-center gap-2">
                <IndianRupee className="h-4 w-4 text-primary" />
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {c.label}
                </p>
              </div>
              <p className="mt-1 text-xl font-bold text-foreground">{inr(c.value)}</p>
              <p className="text-xs text-muted-foreground">
                {sft > 0 ? `${(c.value / sft).toFixed(1)} /sft` : "—"}
              </p>
            </div>
          ))}
        </div>

        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border bg-muted/40 px-4 py-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-primary">
              Charges recorded
            </h2>
            <span className="text-xs text-muted-foreground">{charges.length} entries</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-3">Charge type</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3">Authority</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Shared</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {charges.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-sm text-muted-foreground">
                      No common charges yet. Use <strong>Add charge</strong> to record permission
                      fees, LRS, electricity connection, HMWSSB and architect fees.
                    </td>
                  </tr>
                ) : (
                  charges.map((c) => (
                    <tr key={c.id}>
                      <td className="px-4 py-3 font-semibold text-foreground">
                        {categoryLabel(c.category)}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{c.description || "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{c.authority || "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{c.charge_date ?? "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {c.allocation === "per_owner" ? "Per owner (land)" : "Common"}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold tabular-nums text-foreground">
                        {inr(num(c.amount))}
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={c.status}
                          onChange={(e) =>
                            updateCharge.mutate({ id: c.id, values: { status: e.target.value } })
                          }
                          className="rounded-lg border border-border bg-background px-2 py-1 text-xs"
                        >
                          <option value="planned">Planned</option>
                          <option value="paid">Paid</option>
                        </select>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {canDelete ? (
                          <button
                            type="button"
                            onClick={() => removeCharge.mutate(c.id)}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete
                          </button>
                        ) : null}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="flex items-center gap-2 border-b border-border bg-muted/40 px-4 py-3">
            <Users className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-primary">
              Owner-wise share of common expenses
            </h2>
          </div>
          {owners.length === 0 ? (
            <p className="px-4 py-6 text-sm text-muted-foreground">
              Add landowners to this project (in Project Details) to see each owner's share.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <th className="px-4 py-3">Owner</th>
                    <th className="px-4 py-3 text-right">Land share</th>
                    <th className="px-4 py-3 text-right">Common charges</th>
                    <th className="px-4 py-3 text-right">LRS / land-wise</th>
                    <th className="px-4 py-3 text-right">Total payable</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {ownerAllocation.map((o) => (
                    <tr key={o.name}>
                      <td className="px-4 py-3 font-semibold text-foreground">{o.name}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                        {o.pct.toFixed(2)}%
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-foreground">
                        {inr(o.common)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-foreground">
                        {inr(o.land)}
                      </td>
                      <td className="px-4 py-3 text-right font-bold tabular-nums text-foreground">
                        {inr(o.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="border-t border-border px-4 py-3 text-xs text-muted-foreground">
            Shares are worked out from each landowner's land share recorded in Project Details. LRS
            charges are split land-wise; permission, electricity, water board and architect fees are
            shared as common expenses.
          </p>
        </div>

        {charges.some((c) => c.allocation === "per_owner") && owners.length > 0 ? (
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            <div className="border-b border-border bg-muted/40 px-4 py-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-primary">
                Land-wise charge breakdown
              </h2>
            </div>
            <div className="divide-y divide-border">
              {charges
                .filter((c) => c.allocation === "per_owner")
                .map((c) => (
                  <div key={c.id} className="px-4 py-3">
                    <p className="text-sm font-semibold text-foreground">
                      {categoryLabel(c.category)}
                      {c.description ? ` · ${c.description}` : ""} — {inr(num(c.amount))}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {ownerSplitsFor(c).map((s) => (
                        <span
                          key={`${c.id}-${s.name}`}
                          className="rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground"
                        >
                          {s.name}: <strong className="text-foreground">{inr(num(s.amount))}</strong>
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ) : null}
      </div>
    </Shell>
  );
}
