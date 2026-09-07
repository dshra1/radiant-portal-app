import { createFileRoute } from "@tanstack/react-router";
import { Shell } from "@/components/saha/Shell";
import { supabase } from "@/integrations/supabase/client";
import { useSessionUser } from "@/lib/access";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
import { toast } from "sonner";

export const Route = createFileRoute("/vendor-directory")({
  head: () => ({
    meta: [
      { title: "Vendor Directory — Categorized Vendor Database | Saha OS" },
      { name: "description", content: "Categorized vendor database and procurement directory with trade-wise filters, bulk Excel ingestion and vendor performance ratings." },
      { property: "og:title", content: "Vendor Directory — Categorized Vendor Database | Saha OS" },
      { property: "og:description", content: "Categorized vendor database and procurement directory with trade-wise filters, bulk Excel ingestion and vendor performance ratings." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

type Vendor = {
  id: string;
  vendor_name: string;
  vendor_code: string;
  trade_category: string;
  brands_supplied: string;
  contact_person: string;
  phone: string;
  email: string;
  gstin: string;
  city: string;
  lead_time: string;
  on_time_pct: number;
  quality_rating: number;
  credit_terms: string;
  notes: string;
};

type VendorDraft = Omit<Vendor, "id">;

const COLUMNS: { key: keyof VendorDraft; label: string; numeric?: boolean }[] = [
  { key: "vendor_name", label: "Vendor_Name" },
  { key: "vendor_code", label: "Vendor_Code" },
  { key: "trade_category", label: "Trade_Category" },
  { key: "brands_supplied", label: "Brands_Supplied" },
  { key: "contact_person", label: "Contact_Person" },
  { key: "phone", label: "Phone" },
  { key: "email", label: "Email" },
  { key: "gstin", label: "GSTIN_PAN" },
  { key: "city", label: "City" },
  { key: "lead_time", label: "Lead_Time" },
  { key: "on_time_pct", label: "On_Time_Percent", numeric: true },
  { key: "quality_rating", label: "Quality_Rating", numeric: true },
  { key: "credit_terms", label: "Credit_Terms" },
  { key: "notes", label: "Notes" },
];

function emptyDraft(): VendorDraft {
  return {
    vendor_name: "",
    vendor_code: "",
    trade_category: "",
    brands_supplied: "",
    contact_person: "",
    phone: "",
    email: "",
    gstin: "",
    city: "",
    lead_time: "",
    on_time_pct: 0,
    quality_rating: 0,
    credit_terms: "",
    notes: "",
  };
}

function num(value: unknown): number {
  const n = Number(String(value ?? "").replace(/[^0-9.\-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function str(value: unknown): string {
  return String(value ?? "").trim();
}

function Page() {
  const user = useSessionUser();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [showImport, setShowImport] = useState(false);
  const [search, setSearch] = useState("");
  const [rating, setRating] = useState("");
  const [trade, setTrade] = useState("all");
  const [draft, setDraft] = useState<VendorDraft | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data: vendors = [], isPending } = useQuery({
    queryKey: ["vendors"],
    enabled: Boolean(user?.id),
    queryFn: async (): Promise<Vendor[]> => {
      const { data, error } = await supabase
        .from("vendors")
        .select(
          "id,vendor_name,vendor_code,trade_category,brands_supplied,contact_person,phone,email,gstin,city,lead_time,on_time_pct,quality_rating,credit_terms,notes",
        )
        .order("vendor_name", { ascending: true });
      if (error) throw error;
      return (data ?? []).map((r) => ({
        ...r,
        on_time_pct: num(r.on_time_pct),
        quality_rating: num(r.quality_rating),
      })) as Vendor[];
    },
  });

  const trades = useMemo(() => {
    const map = new Map<string, number>();
    for (const v of vendors) {
      const key = v.trade_category || "Uncategorised";
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [vendors]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    const min = rating ? Number(rating) : 0;
    return vendors.filter((v) => {
      if (trade !== "all" && (v.trade_category || "Uncategorised") !== trade) return false;
      if (min && v.quality_rating < min) return false;
      if (!q) return true;
      return [v.vendor_name, v.vendor_code, v.brands_supplied, v.gstin, v.city, v.contact_person]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [vendors, search, rating, trade]);

  const saveVendor = useMutation({
    mutationFn: async ({ id, values }: { id: string | null; values: VendorDraft }) => {
      if (!values.vendor_name.trim()) throw new Error("Vendor name is required");
      if (id) {
        const { error } = await supabase.from("vendors").update(values).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("vendors").insert({ ...values, created_by: user?.id ?? null });
        if (error) throw error;
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["vendors"] });
      setDraft(null);
      setEditingId(null);
      toast.success("Vendor saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeVendor = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("vendors").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["vendors"] });
      toast.success("Vendor removed");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const importRows = useMutation({
    mutationFn: async (rows: VendorDraft[]) => {
      if (!rows.length) throw new Error("No vendor rows found in that file");
      for (let i = 0; i < rows.length; i += 200) {
        const { error } = await supabase
          .from("vendors")
          .insert(rows.slice(i, i + 200).map((r) => ({ ...r, created_by: user?.id ?? null })));
        if (error) throw error;
      }
      return rows.length;
    },
    onSuccess: async (count) => {
      await queryClient.invalidateQueries({ queryKey: ["vendors"] });
      setShowImport(false);
      toast.success(`${count} vendor${count === 1 ? "" : "s"} imported`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function downloadTemplate() {
    const aoa = [
      COLUMNS.map((c) => c.label),
      [
        "Tata Steels Ltd",
        "VEN-STL-1004",
        "Steel & Rebar",
        "Fe550D TMT, Tiscon",
        "Rajesh Sharma",
        "+91 9848012345",
        "sales@example.com",
        "36AAACT2708Q1ZU",
        "Hyderabad",
        "24 Hours",
        98.5,
        4.8,
        "45 Days PDC",
        "Preferred supplier",
      ],
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(aoa), "Vendors");
    XLSX.writeFile(wb, "vendor-directory-template.xlsx");
    toast.success("Template downloaded");
  }

  function exportDirectory(format: "xlsx" | "csv") {
    if (!visible.length) {
      toast.error("Nothing to export yet");
      return;
    }
    const aoa = [
      COLUMNS.map((c) => c.label),
      ...visible.map((v) => COLUMNS.map((c) => v[c.key])),
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(aoa), "Vendors");
    XLSX.writeFile(wb, `vendor-directory.${format}`, { bookType: format });
    toast.success("Directory exported");
  }

  async function handleFile(file: File) {
    try {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: "array" });
      const first = wb.SheetNames[0];
      if (!first) throw new Error("That file has no sheets");
      const sheet = wb.Sheets[first];
      if (!sheet) throw new Error("That file has no sheets");
      const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
      const rows: VendorDraft[] = [];
      for (const r of raw) {
        const lookup = new Map<string, unknown>();
        for (const [k, val] of Object.entries(r)) {
          lookup.set(k.trim().toLowerCase().replace(/[^a-z0-9]/g, ""), val);
        }
        const pick = (label: string) => lookup.get(label.toLowerCase().replace(/[^a-z0-9]/g, ""));
        const next = emptyDraft();
        for (const c of COLUMNS) {
          const value = pick(c.label);
          if (c.numeric) next[c.key] = num(value) as never;
          else next[c.key] = str(value) as never;
        }
        if (next.vendor_name) rows.push(next);
      }
      importRows.mutate(rows);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not read that file");
    }
  }

  const editing = draft;

  return (
    <Shell title={"Vendor Directory"}>
      <div className="m3">
        <main className="relative pt-16 w-full px-space-xl pb-space-3xl bg-surface">
          <div className="flex flex-col w-full">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-base mb-space-xl">
              <div>
                <h1 className="font-headline-lg text-headline-lg text-on-surface font-bold tracking-tight">
                  Categorized Vendor Database &amp; Procurement Directory
                </h1>
                <p className="font-body-md text-body-md text-on-surface-variant mt-space-2xs">
                  Organized by material trades with bi-directional Excel template export and bulk upload ingestion.
                </p>
              </div>
              <div className="flex items-center gap-space-sm flex-wrap">
                <button
                  type="button"
                  onClick={() => setShowImport((s) => !s)}
                  className="flex items-center gap-space-xs px-space-md py-space-sm rounded bg-surface-container-low text-on-surface hover:bg-surface-container transition-colors font-title-md text-title-md shadow-sm"
                >
                  <span className="material-symbols-outlined text-space-base leading-none">upload_file</span>
                  <span>Upload &amp; Import</span>
                </button>
                <button
                  type="button"
                  onClick={downloadTemplate}
                  className="flex items-center gap-space-xs px-space-md py-space-sm rounded bg-surface-container-low text-on-surface hover:bg-surface-container transition-colors font-title-md text-title-md shadow-sm"
                >
                  <span className="material-symbols-outlined text-space-base leading-none">download</span>
                  <span>Download Template</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(null);
                    setDraft(emptyDraft());
                  }}
                  className="flex items-center gap-space-xs px-space-md py-space-sm rounded bg-primary text-on-primary hover:bg-primary-container transition-colors font-title-md text-title-md shadow-sm"
                >
                  <span className="material-symbols-outlined text-space-base leading-none">add</span>
                  <span>Add Vendor</span>
                </button>
              </div>
            </div>

            {showImport && (
              <div className="mb-space-2xl bg-surface-container-lowest rounded-xl p-space-xl shadow-md">
                <div className="flex items-center justify-between mb-space-base">
                  <div className="flex items-center gap-space-sm">
                    <span className="material-symbols-outlined text-primary text-space-lg">cloud_upload</span>
                    <h3 className="font-headline-md text-headline-md text-on-surface">Bulk Excel / CSV Ingestion Hub</h3>
                  </div>
                  <button type="button" onClick={() => setShowImport(false)} className="text-on-surface-variant hover:text-on-surface">
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-space-xl">
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const f = e.dataTransfer.files?.[0];
                      if (f) void handleFile(f);
                    }}
                    className="border-2 border-dashed border-outline-variant rounded-xl p-space-2xl flex flex-col items-center justify-center text-center hover:border-primary transition-colors bg-surface-container-low/50"
                  >
                    <span className="material-symbols-outlined text-4xl text-primary mb-space-sm">upload_file</span>
                    <span className="font-title-md text-title-md text-on-surface mb-space-2xs">Drag and drop your spreadsheet here</span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant mb-space-base">Supports .xlsx, .xls, .csv</span>
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      disabled={importRows.isPending}
                      className="px-space-md py-space-xs rounded bg-primary text-on-primary font-title-md text-title-md hover:bg-primary-container transition-colors disabled:opacity-60"
                    >
                      {importRows.isPending ? "Importing…" : "Browse Files"}
                    </button>
                    <input
                      ref={fileRef}
                      accept=".xlsx,.xls,.csv"
                      className="hidden"
                      type="file"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) void handleFile(f);
                        e.target.value = "";
                      }}
                    />
                  </div>
                  <div>
                    <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider block mb-space-sm">
                      Auto-Column Mapping Schema
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-space-xs font-body-sm text-body-sm">
                      {COLUMNS.map((c) => (
                        <span key={c.key} className="px-space-xs py-space-2xs rounded bg-surface-container text-on-surface truncate">
                          {c.label}
                        </span>
                      ))}
                    </div>
                    <p className="mt-space-base font-body-sm text-on-surface-variant">
                      Download the template first, fill it in and upload it back — column names are matched automatically.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {editing && (
              <div className="mb-space-2xl bg-surface-container-lowest rounded-xl p-space-xl shadow-md">
                <div className="flex items-center justify-between mb-space-base">
                  <h3 className="font-headline-md text-headline-md text-on-surface">
                    {editingId ? "Edit vendor" : "Add vendor"}
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      setDraft(null);
                      setEditingId(null);
                    }}
                    className="text-on-surface-variant hover:text-on-surface"
                  >
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-space-base">
                  {COLUMNS.map((c) => (
                    <label key={c.key} className="flex flex-col gap-space-2xs">
                      <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                        {c.label.replace(/_/g, " ")}
                      </span>
                      <input
                        type={c.numeric ? "number" : "text"}
                        value={String(editing[c.key] ?? "")}
                        onChange={(e) =>
                          setDraft((d) =>
                            d ? { ...d, [c.key]: c.numeric ? num(e.target.value) : e.target.value } : d,
                          )
                        }
                        className="px-space-sm py-space-xs rounded bg-surface-container text-on-surface font-body-md focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </label>
                  ))}
                </div>
                <div className="flex items-center gap-space-sm mt-space-base">
                  <button
                    type="button"
                    disabled={saveVendor.isPending}
                    onClick={() => saveVendor.mutate({ id: editingId, values: editing })}
                    className="px-space-md py-space-sm rounded bg-primary text-on-primary font-title-md shadow-sm disabled:opacity-60"
                  >
                    {saveVendor.isPending ? "Saving…" : "Save vendor"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDraft(null);
                      setEditingId(null);
                    }}
                    className="px-space-md py-space-sm rounded bg-surface-container text-on-surface font-title-md"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <div className="flex items-center gap-space-sm overflow-x-auto pb-space-base mb-space-xl scrollbar-none">
              <button
                type="button"
                onClick={() => setTrade("all")}
                className={`px-space-md py-space-xs rounded-full font-title-md text-title-md whitespace-nowrap shadow-sm transition-all ${trade === "all" ? "bg-primary text-on-primary" : "bg-surface-container-low text-on-surface hover:bg-surface-container"}`}
              >
                All Trades ({vendors.length})
              </button>
              {trades.map(([name, count]) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => setTrade(name)}
                  className={`px-space-md py-space-xs rounded-full font-title-md text-title-md whitespace-nowrap shadow-sm transition-all ${trade === name ? "bg-primary text-on-primary" : "bg-surface-container-low text-on-surface hover:bg-surface-container"}`}
                >
                  {name} ({count})
                </button>
              ))}
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-base mb-space-base">
              <div className="flex items-center gap-space-sm w-full md:w-auto flex-wrap">
                <div className="relative flex-1 md:w-80">
                  <span className="material-symbols-outlined absolute left-space-sm top-2.5 text-on-surface-variant text-space-base">search</span>
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-space-base py-space-xs rounded bg-surface-container-lowest text-on-surface placeholder:text-on-surface-variant font-body-md text-body-md shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="Search by vendor name, brand, or GSTIN..."
                    type="text"
                  />
                </div>
                <select
                  value={rating}
                  onChange={(e) => setRating(e.target.value)}
                  className="px-space-sm py-space-xs rounded bg-surface-container-lowest text-on-surface font-body-md shadow-sm focus:outline-none"
                >
                  <option value="">All Ratings</option>
                  <option value="4.5">4.5+ Stars</option>
                  <option value="4">4.0+ Stars</option>
                  <option value="3">3.0+ Stars</option>
                </select>
              </div>
              <div className="flex items-center gap-space-sm flex-wrap">
                <span className="font-label-sm text-label-sm text-on-surface-variant">
                  Showing {visible.length} of {vendors.length} vendors
                </span>
                <button
                  type="button"
                  onClick={() => exportDirectory("xlsx")}
                  className="flex items-center gap-space-xs px-space-md py-space-xs rounded bg-surface-container-lowest text-on-surface hover:bg-surface-container font-title-md text-title-md shadow-sm transition-colors"
                >
                  <span className="material-symbols-outlined text-space-base leading-none">ios_share</span>
                  <span>Export Excel</span>
                </button>
                <button
                  type="button"
                  onClick={() => exportDirectory("csv")}
                  className="flex items-center gap-space-xs px-space-md py-space-xs rounded bg-surface-container-lowest text-on-surface hover:bg-surface-container font-title-md text-title-md shadow-sm transition-colors"
                >
                  <span className="material-symbols-outlined text-space-base leading-none">description</span>
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

            <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-x-auto">
              <table className="w-full min-w-[1000px] text-left">
                <thead>
                  <tr className="border-b border-outline-variant">
                    {["Vendor", "Trade", "Brands", "Contact", "GSTIN / PAN", "City", "Lead time", "On-time %", "Rating", "Credit terms", ""].map(
                      (h) => (
                        <th key={h} className="px-space-sm py-space-sm font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant whitespace-nowrap">
                          {h}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {isPending && (
                    <tr>
                      <td colSpan={11} className="px-space-sm py-space-xl text-center font-body-md text-on-surface-variant">
                        Loading vendors…
                      </td>
                    </tr>
                  )}
                  {!isPending && !visible.length && (
                    <tr>
                      <td colSpan={11} className="px-space-sm py-space-xl text-center font-body-md text-on-surface-variant">
                        No vendors yet. Add one, or download the template, fill it in and upload it.
                      </td>
                    </tr>
                  )}
                  {visible.map((v) => (
                    <tr key={v.id} className="border-b border-outline-variant/40">
                      <td className="px-space-sm py-space-sm font-title-md text-on-surface">
                        {v.vendor_name}
                        {v.vendor_code && (
                          <span className="block font-body-sm text-on-surface-variant">{v.vendor_code}</span>
                        )}
                      </td>
                      <td className="px-space-sm py-space-sm font-body-md text-on-surface">{v.trade_category || "—"}</td>
                      <td className="px-space-sm py-space-sm font-body-md text-on-surface-variant max-w-[200px]">{v.brands_supplied || "—"}</td>
                      <td className="px-space-sm py-space-sm font-body-md text-on-surface">
                        {v.contact_person || "—"}
                        {v.phone && (
                          <a href={`tel:${v.phone}`} className="block font-body-sm text-primary">
                            {v.phone}
                          </a>
                        )}
                      </td>
                      <td className="px-space-sm py-space-sm font-body-sm text-on-surface-variant">{v.gstin || "—"}</td>
                      <td className="px-space-sm py-space-sm font-body-md text-on-surface">{v.city || "—"}</td>
                      <td className="px-space-sm py-space-sm font-body-md text-on-surface">{v.lead_time || "—"}</td>
                      <td className="px-space-sm py-space-sm font-body-md text-on-surface">{v.on_time_pct ? `${v.on_time_pct}%` : "—"}</td>
                      <td className="px-space-sm py-space-sm font-body-md text-on-surface">{v.quality_rating ? v.quality_rating.toFixed(1) : "—"}</td>
                      <td className="px-space-sm py-space-sm font-body-md text-on-surface">{v.credit_terms || "—"}</td>
                      <td className="px-space-sm py-space-sm whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => {
                            const { id, ...rest } = v;
                            void id;
                            setDraft(rest);
                            setEditingId(v.id);
                          }}
                          className="px-space-sm py-space-2xs rounded bg-surface-container text-on-surface font-title-md text-xs mr-space-2xs"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => removeVendor.mutate(v.id)}
                          className="px-space-sm py-space-2xs rounded bg-surface-container text-on-surface font-title-md text-xs"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </Shell>
  );
}
