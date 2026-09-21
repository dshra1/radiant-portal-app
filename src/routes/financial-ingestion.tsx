import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Upload,
  FileDown,
  Trash2,
  ExternalLink,
  ArrowDownCircle,
  ArrowUpCircle,
  Landmark,
  Wallet,
} from "lucide-react";
import { Shell } from "@/components/saha/Shell";
import { supabase } from "@/integrations/supabase/client";
import { useActiveProject } from "@/hooks/useActiveProject";
import { useAccess, useSessionUser } from "@/lib/access";

export const Route = createFileRoute("/financial-ingestion")({
  head: () => ({
    meta: [
      { title: "Financial Ingestion — Statements & Cash Ledger | Saha OS" },
      {
        name: "description",
        content:
          "Upload bank statements, expense sheets and vouchers, and review the project's real cash ledger of owner funding, vendor payments and statutory charges.",
      },
      { property: "og:title", content: "Financial Ingestion — Saha OS" },
      {
        property: "og:description",
        content:
          "Upload financial documents and review real inflows, vendor payments and statutory charges for the project.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

const BUCKET = "financial-docs";

function num(v: unknown): number {
  const n = Number(String(v ?? "").replace(/[^0-9.\-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}
function inr(n: number): string {
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}
function fmtSize(bytes: number) {
  if (!bytes) return "—";
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
function esc(v: string) {
  return `"${String(v).replace(/"/g, '""')}"`;
}

const CHARGE_LABELS: Record<string, string> = {
  permissions: "Permission / Approval charges",
  lrs: "LRS charges",
  electrical: "Electrical connection charges",
  hmwssb: "HMWSSB water & sewerage charges",
  architectural: "Architectural / consultant fees",
  other: "Other common charge",
};

type Txn = {
  id: string;
  date: string;
  direction: "in" | "out";
  source: "Owner funding" | "Vendor payment" | "Statutory charge";
  party: string;
  detail: string;
  amount: number;
  mode: string;
  reference: string;
};

function Page() {
  const project = useActiveProject();
  const user = useSessionUser();
  const { access } = useAccess();
  const canEdit = Boolean(
    access?.isAdmin || access?.roles.some((r) => r === "pm" || r === "accounts"),
  );
  const qc = useQueryClient();
  const enabled = Boolean(user?.id) && Boolean(project.id);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [status, setStatus] = useState("");

  const paymentsQuery = useQuery({
    queryKey: ["bill_payments", "ingestion", project.id],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bill_payments")
        .select("id,payment_date,amount,mode,reference,paid_from,remarks,bill_id")
        .eq("project_id", project.id)
        .order("payment_date", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const billsQuery = useQuery({
    queryKey: ["bills", "ingestion", project.id],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bills")
        .select("id,bill_number,vendor_name,category")
        .eq("project_id", project.id);
      if (error) throw error;
      return data ?? [];
    },
  });

  const capitalQuery = useQuery({
    queryKey: ["capital_entries", "ingestion", project.id],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("capital_entries")
        .select("id,owner_name,owner_role,entry_type,amount,entry_date,mode,reference,status,notes")
        .eq("project_id", project.id)
        .order("entry_date", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const chargesQuery = useQuery({
    queryKey: ["project_charges", "ingestion", project.id],
    enabled,
    refetchOnWindowFocus: true,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_charges")
        .select("id,category,description,authority,amount,charge_date,status,allocation")
        .eq("project_id", project.id)
        .order("charge_date", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const filesQuery = useQuery({
    queryKey: [BUCKET, project.id],
    enabled: Boolean(project.id),
    queryFn: async () => {
      const { data, error } = await supabase.storage
        .from(BUCKET)
        .list(project.id, { limit: 200, sortBy: { column: "created_at", order: "desc" } });
      if (error) throw error;
      return (data ?? []).filter((f) => f.name !== ".emptyFolderPlaceholder");
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (list: FileList) => {
      for (const file of Array.from(list)) {
        const path = `${project.id}/${Date.now()}-${file.name.replace(/[^\w.\-]+/g, "_")}`;
        const { error } = await supabase.storage.from(BUCKET).upload(path, file);
        if (error) throw error;
      }
      return list.length;
    },
    onSuccess: async (n) => {
      setStatus(`${n} document${n > 1 ? "s" : ""} uploaded for ${project.name}.`);
      await qc.invalidateQueries({ queryKey: [BUCKET, project.id] });
    },
    onError: (e: Error) => setStatus(`Upload failed: ${e.message}`),
  });

  const deleteMutation = useMutation({
    mutationFn: async (name: string) => {
      const { error } = await supabase.storage.from(BUCKET).remove([`${project.id}/${name}`]);
      if (error) throw error;
    },
    onSuccess: async () => {
      setStatus("Document removed.");
      await qc.invalidateQueries({ queryKey: [BUCKET, project.id] });
    },
    onError: (e: Error) => setStatus(`Delete failed: ${e.message}`),
  });

  const openFile = async (name: string) => {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(`${project.id}/${name}`, 3600);
    if (error || !data) {
      setStatus(error?.message ?? "Could not open this document.");
      return;
    }
    window.open(data.signedUrl, "_blank", "noreferrer");
  };

  const txns = useMemo<Txn[]>(() => {
    const billById = new Map((billsQuery.data ?? []).map((b) => [b.id, b]));
    const out: Txn[] = [];
    for (const p of paymentsQuery.data ?? []) {
      const bill = billById.get(p.bill_id);
      out.push({
        id: `pay-${p.id}`,
        date: String(p.payment_date ?? ""),
        direction: "out",
        source: "Vendor payment",
        party: bill?.vendor_name || "Vendor",
        detail: [bill?.bill_number ? `Bill ${bill.bill_number}` : "", bill?.category, p.remarks]
          .filter(Boolean)
          .join(" · "),
        amount: num(p.amount),
        mode: String(p.mode ?? ""),
        reference: String(p.reference || p.paid_from || ""),
      });
    }
    for (const c of capitalQuery.data ?? []) {
      const isOut = String(c.entry_type) === "withdrawal" || String(c.entry_type) === "refund";
      out.push({
        id: `cap-${c.id}`,
        date: String(c.entry_date ?? ""),
        direction: isOut ? "out" : "in",
        source: "Owner funding",
        party: `${c.owner_name || "Owner"}${c.owner_role ? ` (${c.owner_role})` : ""}`,
        detail: [String(c.entry_type ?? ""), String(c.status ?? ""), c.notes]
          .filter(Boolean)
          .join(" · "),
        amount: num(c.amount),
        mode: String(c.mode ?? ""),
        reference: String(c.reference ?? ""),
      });
    }
    for (const c of chargesQuery.data ?? []) {
      out.push({
        id: `chg-${c.id}`,
        date: String(c.charge_date ?? ""),
        direction: "out",
        source: "Statutory charge",
        party: c.authority || "Authority",
        detail: [CHARGE_LABELS[String(c.category)] ?? String(c.category), c.description, String(c.status)]
          .filter(Boolean)
          .join(" · "),
        amount: num(c.amount),
        mode: String(c.allocation) === "per_owner" ? "owner-wise" : "common",
        reference: "",
      });
    }
    return out.sort((a, b) => b.date.localeCompare(a.date));
  }, [paymentsQuery.data, billsQuery.data, capitalQuery.data, chargesQuery.data]);

  const filtered = txns.filter((t) => {
    if (filter === "in" && t.direction !== "in") return false;
    if (filter === "out" && t.direction !== "out") return false;
    if (filter !== "all" && filter !== "in" && filter !== "out" && t.source !== filter) return false;
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return [t.party, t.detail, t.reference, t.mode, String(t.amount)].some((v) =>
      String(v).toLowerCase().includes(q),
    );
  });

  const totals = useMemo(() => {
    let inflow = 0;
    let vendorOut = 0;
    let statutoryOut = 0;
    for (const t of txns) {
      if (t.direction === "in") inflow += t.amount;
      else if (t.source === "Statutory charge") statutoryOut += t.amount;
      else vendorOut += t.amount;
    }
    return { inflow, vendorOut, statutoryOut, balance: inflow - vendorOut - statutoryOut };
  }, [txns]);

  const exportCsv = () => {
    if (filtered.length === 0) {
      setStatus("Nothing to export for this filter yet.");
      return;
    }
    const csv = [
      ["Date", "Flow", "Source", "Party", "Details", "Amount", "Mode", "Reference"]
        .map(esc)
        .join(","),
      ...filtered.map((t) =>
        [
          t.date || "—",
          t.direction === "in" ? "Inflow" : "Outflow",
          t.source,
          t.party,
          t.detail,
          String(Math.round(t.amount)),
          t.mode,
          t.reference,
        ]
          .map(esc)
          .join(","),
      ),
    ].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `cash-ledger-${(project.name || "project").replace(/\s+/g, "-")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setStatus(`Exported ${filtered.length} rows.`);
  };

  const loading =
    paymentsQuery.isPending || capitalQuery.isPending || chargesQuery.isPending;
  const files = filesQuery.data ?? [];

  return (
    <Shell title="Financial Ingestion">
      <div className="space-y-6">
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/80">
            Cash ledger · {project.name}
          </p>
          <h1 className="text-2xl font-extrabold uppercase tracking-tight text-foreground sm:text-3xl">
            Financial Ingestion
          </h1>
          <p className="max-w-3xl text-sm text-muted-foreground">
            Upload bank statements, expense sheets and vouchers for this project, and review every
            recorded inflow, vendor payment and statutory charge in one ledger.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              label: "Owner funding received",
              value: totals.inflow,
              Icon: ArrowDownCircle,
              to: "/capital-ledger" as const,
              note: "Open the capital ledger",
            },
            {
              label: "Paid to vendors",
              value: totals.vendorOut,
              Icon: ArrowUpCircle,
              to: "/bills-payments" as const,
              note: "Open bills & payments",
            },
            {
              label: "Statutory charges",
              value: totals.statutoryOut,
              Icon: Landmark,
              to: "/common-expenses" as const,
              note: "Open common & statutory expenses",
            },
            {
              label: "Funds in hand",
              value: totals.balance,
              Icon: Wallet,
              to: "/cost-dashboard" as const,
              note: "Open the cost dashboard",
            },
          ].map(({ label, value, Icon, to, note }) => (
            <Link
              key={label}
              to={to}
              className="rounded-2xl border border-border bg-card p-5 shadow-sm transition hover:border-primary hover:bg-muted/50"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {label}
                </span>
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <p className="mt-3 text-2xl font-bold text-foreground">{inr(value)}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">{note}</p>
            </Link>
          ))}
        </div>


        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="text-lg font-bold text-foreground">Upload financial documents</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Bank statements (PDF/CSV), expense sheets (XLSX) or scanned vouchers, up to 50 MB each.
            Files stay private to this project.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            {canEdit ? (
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
                <Upload className="h-4 w-4" />
                {uploadMutation.isPending ? "Uploading…" : "Upload documents"}
                <input
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      uploadMutation.mutate(e.target.files);
                      e.target.value = "";
                    }
                  }}
                />
              </label>
            ) : (
              <p className="text-sm text-muted-foreground">
                Uploads are limited to Admin, PM and Accounts users.
              </p>
            )}
            <button
              type="button"
              onClick={exportCsv}
              className="inline-flex items-center gap-2 rounded-xl border border-primary/40 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary"
            >
              <FileDown className="h-4 w-4" />
              Export ledger CSV
            </button>
          </div>
          {status ? <p className="mt-3 text-sm text-primary">{status}</p> : null}

          <div className="mt-4 divide-y divide-border rounded-xl border border-border">
            {files.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">No documents uploaded yet.</p>
            ) : (
              files.map((f) => (
                <div key={f.name} className="flex flex-wrap items-center justify-between gap-3 p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{f.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {fmtSize(Number(f.metadata?.['size'] ?? 0))} ·{" "}
                      {f.created_at ? new Date(f.created_at).toLocaleString("en-IN") : "—"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openFile(f.name)}
                      className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold"
                    >
                      <ExternalLink className="h-3.5 w-3.5" /> Open
                    </button>
                    {canEdit ? (
                      <button
                        type="button"
                        onClick={() => deleteMutation.mutate(f.name)}
                        className="inline-flex items-center gap-1 rounded-lg border border-destructive/40 px-3 py-1.5 text-xs font-semibold text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Remove
                      </button>
                    ) : null}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card">
          <div className="flex flex-col gap-3 border-b border-border p-5 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-bold text-foreground">Recorded money movement</h2>
              <p className="text-sm text-muted-foreground">
                {txns.length} entries from owner funding, bill payments and statutory charges.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search party, reference, amount…"
                className="w-full min-w-[200px] rounded-xl border border-border bg-background px-3 py-2 text-sm md:w-64"
              />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="rounded-xl border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="all">All entries</option>
                <option value="in">Inflows only</option>
                <option value="out">Outflows only</option>
                <option value="Owner funding">Owner funding</option>
                <option value="Vendor payment">Vendor payments</option>
                <option value="Statutory charge">Statutory charges</option>
              </select>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Source</th>
                  <th className="px-4 py-3">Party</th>
                  <th className="px-4 py-3">Details</th>
                  <th className="px-4 py-3">Mode</th>
                  <th className="px-4 py-3">Reference</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                      Loading ledger…
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                      Nothing recorded yet for this project. Add owner funds in Capital Ledger, bills
                      in Bills & Payments or charges in Common & Statutory Expenses.
                    </td>
                  </tr>
                ) : (
                  filtered.map((t) => (
                    <tr key={t.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3">{t.date || "—"}</td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                          {t.source}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-foreground">{t.party}</td>
                      <td className="px-4 py-3 text-muted-foreground">{t.detail || "—"}</td>
                      <td className="px-4 py-3 capitalize">{t.mode || "—"}</td>
                      <td className="px-4 py-3 font-mono text-xs">{t.reference || "—"}</td>
                      <td
                        className={`px-4 py-3 text-right font-semibold ${
                          t.direction === "in" ? "text-primary" : "text-foreground"
                        }`}
                      >
                        {t.direction === "in" ? "+" : "−"}
                        {inr(t.amount)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </Shell>
  );
}
