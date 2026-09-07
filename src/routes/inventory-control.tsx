import { createFileRoute } from "@tanstack/react-router";
import { Shell } from "@/components/saha/Shell";
import { supabase } from "@/integrations/supabase/client";
import { useActiveProject } from "@/hooks/useActiveProject";
import { useSessionUser } from "@/lib/access";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
import { toast } from "sonner";

export const Route = createFileRoute("/inventory-control")({
  head: () => ({
    meta: [
      { title: "Stock & Inventory Control | Saha OS" },
      { name: "description", content: "Site stock register with material receipts, issues, live balances, reorder alerts and Excel import or export." },
      { property: "og:title", content: "Stock & Inventory Control | Saha OS" },
      { property: "og:description", content: "Site stock register with material receipts, issues, live balances, reorder alerts and Excel import or export." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

type Item = {
  id: string;
  project_id: string | null;
  item_code: string;
  description: string;
  category: string;
  unit: string;
  opening_qty: number;
  reorder_level: number;
  rate: number;
  store_location: string;
  notes: string;
};

type Movement = {
  id: string;
  project_id: string | null;
  item_id: string | null;
  item_code: string;
  description: string;
  unit: string;
  movement_type: string;
  quantity: number;
  rate: number;
  movement_date: string;
  reference: string;
  party: string;
  handled_by: string;
  remarks: string;
};

type ItemDraft = Omit<Item, "id" | "project_id">;
type MoveDraft = Omit<Movement, "id" | "project_id">;

const MOVEMENT_TYPES = ["receipt", "issue", "return", "adjustment"] as const;

const ITEM_COLUMNS: { key: keyof ItemDraft; label: string; numeric?: boolean }[] = [
  { key: "item_code", label: "Item_Code" },
  { key: "description", label: "Description" },
  { key: "category", label: "Category" },
  { key: "unit", label: "Unit" },
  { key: "opening_qty", label: "Opening_Qty", numeric: true },
  { key: "reorder_level", label: "Reorder_Level", numeric: true },
  { key: "rate", label: "Rate", numeric: true },
  { key: "store_location", label: "Store_Location" },
  { key: "notes", label: "Notes" },
];

function num(v: unknown): number {
  const n = Number(String(v ?? "").replace(/[^0-9.\-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}
function str(v: unknown): string {
  return String(v ?? "").trim();
}
function inr(n: number): string {
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}
function qty(n: number): string {
  return n.toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

function emptyItem(): ItemDraft {
  return {
    item_code: "",
    description: "",
    category: "",
    unit: "",
    opening_qty: 0,
    reorder_level: 0,
    rate: 0,
    store_location: "",
    notes: "",
  };
}

function emptyMove(type: string): MoveDraft {
  return {
    item_id: null,
    item_code: "",
    description: "",
    unit: "",
    movement_type: type,
    quantity: 0,
    rate: 0,
    movement_date: new Date().toISOString().slice(0, 10),
    reference: "",
    party: "",
    handled_by: "",
    remarks: "",
  };
}

function Page() {
  const project = useActiveProject();
  const user = useSessionUser();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [itemDraft, setItemDraft] = useState<ItemDraft | null>(null);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [moveDraft, setMoveDraft] = useState<MoveDraft | null>(null);
  const [tab, setTab] = useState<"stock" | "ledger">("stock");

  const enabled = Boolean(user?.id) && Boolean(project.id);

  const { data: items = [], isPending } = useQuery({
    queryKey: ["stock_items", project.id],
    enabled,
    queryFn: async (): Promise<Item[]> => {
      const { data, error } = await supabase
        .from("stock_items")
        .select("id,project_id,item_code,description,category,unit,opening_qty,reorder_level,rate,store_location,notes")
        .eq("project_id", project.id)
        .order("item_code", { ascending: true });
      if (error) throw error;
      return (data ?? []).map((r) => ({
        ...r,
        opening_qty: num(r.opening_qty),
        reorder_level: num(r.reorder_level),
        rate: num(r.rate),
      })) as Item[];
    },
  });

  const { data: movements = [] } = useQuery({
    queryKey: ["stock_movements", project.id],
    enabled,
    queryFn: async (): Promise<Movement[]> => {
      const { data, error } = await supabase
        .from("stock_movements")
        .select("id,project_id,item_id,item_code,description,unit,movement_type,quantity,rate,movement_date,reference,party,handled_by,remarks")
        .eq("project_id", project.id)
        .order("movement_date", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((r) => ({ ...r, quantity: num(r.quantity), rate: num(r.rate) })) as Movement[];
    },
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["stock_items", project.id] });
    queryClient.invalidateQueries({ queryKey: ["stock_movements", project.id] });
  };

  const saveItem = useMutation({
    mutationFn: async (payload: { draft: ItemDraft; id: string | null }) => {
      const row = { ...payload.draft, project_id: project.id, created_by: user?.id ?? null };
      if (payload.id) {
        const { error } = await supabase.from("stock_items").update(row).eq("id", payload.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("stock_items").insert(row);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Stock item saved");
      setItemDraft(null);
      setEditingItem(null);
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("stock_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Item removed");
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const saveMove = useMutation({
    mutationFn: async (draft: MoveDraft) => {
      const { error } = await supabase.from("stock_movements").insert({
        ...draft,
        project_id: project.id,
        created_by: user?.id ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Entry recorded");
      setMoveDraft(null);
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("stock_movements").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Entry deleted");
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const balances = useMemo(() => {
    const map = new Map<string, { received: number; issued: number }>();
    for (const m of movements) {
      const key = m.item_id ?? m.item_code.toLowerCase();
      const cur = map.get(key) ?? { received: 0, issued: 0 };
      if (m.movement_type === "receipt" || m.movement_type === "return") cur.received += m.quantity;
      else if (m.movement_type === "issue") cur.issued += m.quantity;
      else cur.received += m.quantity;
      map.set(key, cur);
    }
    return items.map((it) => {
      const b = map.get(it.id) ?? map.get(it.item_code.toLowerCase()) ?? { received: 0, issued: 0 };
      const balance = it.opening_qty + b.received - b.issued;
      return { ...it, received: b.received, issued: b.issued, balance, value: balance * it.rate };
    });
  }, [items, movements]);

  const categories = useMemo(() => {
    const set = new Set(items.map((i) => i.category).filter(Boolean));
    return Array.from(set).sort();
  }, [items]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return balances.filter((b) => {
      if (category !== "all" && b.category !== category) return false;
      if (!q) return true;
      return [b.item_code, b.description, b.category, b.store_location].join(" ").toLowerCase().includes(q);
    });
  }, [balances, search, category]);

  const filteredLedger = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return movements;
    return movements.filter((m) =>
      [m.item_code, m.description, m.reference, m.party, m.movement_type, m.remarks].join(" ").toLowerCase().includes(q),
    );
  }, [movements, search]);

  const totals = useMemo(() => {
    const value = balances.reduce((s, b) => s + b.value, 0);
    const low = balances.filter((b) => b.reorder_level > 0 && b.balance <= b.reorder_level).length;
    const receipts = movements.filter((m) => m.movement_type === "receipt").length;
    const issues = movements.filter((m) => m.movement_type === "issue").length;
    return { value, low, receipts, issues };
  }, [balances, movements]);

  const exportStock = () => {
    const rows = balances.map((b) => ({
      Item_Code: b.item_code,
      Description: b.description,
      Category: b.category,
      Unit: b.unit,
      Opening_Qty: b.opening_qty,
      Received: b.received,
      Issued: b.issued,
      Balance: b.balance,
      Reorder_Level: b.reorder_level,
      Rate: b.rate,
      Stock_Value: Math.round(b.value),
      Store_Location: b.store_location,
      Notes: b.notes,
    }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows.length ? rows : [Object.fromEntries(ITEM_COLUMNS.map((c) => [c.label, ""]))]), "Stock");
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(
        movements.length
          ? movements.map((m) => ({
              Date: m.movement_date,
              Type: m.movement_type,
              Item_Code: m.item_code,
              Description: m.description,
              Unit: m.unit,
              Quantity: m.quantity,
              Rate: m.rate,
              Reference: m.reference,
              Party: m.party,
              Handled_By: m.handled_by,
              Remarks: m.remarks,
            }))
          : [{ Date: "", Type: "", Item_Code: "", Quantity: "" }],
      ),
      "Ledger",
    );
    XLSX.writeFile(wb, `stock-${(project.name || "project").replace(/\s+/g, "-").toLowerCase()}.xlsx`);
    toast.success("Stock exported");
  };

  const importStock = async (file: File) => {
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf);
      const sheet = wb.Sheets[wb.SheetNames[0]!];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet!);
      const payload = rows
        .map((r) => {
          const draft = emptyItem();
          for (const col of ITEM_COLUMNS) {
            const raw = r[col.label] ?? r[col.key] ?? r[col.label.replace(/_/g, " ")];
            if (col.numeric) (draft[col.key] as number) = num(raw);
            else (draft[col.key] as string) = str(raw);
          }
          return { ...draft, project_id: project.id, created_by: user?.id ?? null };
        })
        .filter((d) => d.item_code || d.description);
      if (!payload.length) {
        toast.error("No rows found in the file");
        return;
      }
      const { error } = await supabase.from("stock_items").insert(payload);
      if (error) throw error;
      toast.success(`${payload.length} items imported`);
      refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Import failed");
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const pickItem = (draft: MoveDraft, id: string): MoveDraft => {
    const it = items.find((i) => i.id === id);
    if (!it) return { ...draft, item_id: null };
    return { ...draft, item_id: it.id, item_code: it.item_code, description: it.description, unit: it.unit, rate: draft.rate || it.rate };
  };

  return (
    <Shell title="Stock & Inventory Control">
      <div className="w-full px-4 md:px-8 py-6 flex flex-col gap-6">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-primary tracking-tight">Stock &amp; Inventory</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {project.name} · live balances from receipts and issues, reorder alerts, Excel import &amp; export.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void importStock(f); }} />
            <button onClick={() => fileRef.current?.click()} className="px-3 py-2 rounded-lg border border-border text-sm font-semibold hover:bg-muted">Upload Excel</button>
            <button onClick={exportStock} className="px-3 py-2 rounded-lg border border-border text-sm font-semibold hover:bg-muted">Export</button>
            <button onClick={() => setMoveDraft(emptyMove("issue"))} className="px-3 py-2 rounded-lg bg-secondary text-secondary-foreground text-sm font-semibold">Issue Material</button>
            <button onClick={() => setMoveDraft(emptyMove("receipt"))} className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold">Receive Material</button>
            <button onClick={() => { setItemDraft(emptyItem()); setEditingItem(null); }} className="px-3 py-2 rounded-lg border border-primary text-primary text-sm font-semibold">Add Item</button>
          </div>
        </header>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Stock lines", value: String(items.length) },
            { label: "Stock value", value: inr(totals.value) },
            { label: "Receipts logged", value: String(totals.receipts) },
            { label: "Below reorder", value: String(totals.low) },
          ].map((k) => (
            <div key={k.label} className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">{k.label}</p>
              <p className="text-2xl font-extrabold mt-1">{k.value}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col md:flex-row gap-3 md:items-center">
          <div className="flex rounded-lg border border-border overflow-hidden text-sm font-semibold">
            <button onClick={() => setTab("stock")} className={`px-4 py-2 ${tab === "stock" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>Stock register</button>
            <button onClick={() => setTab("ledger")} className={`px-4 py-2 ${tab === "ledger" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>Movement ledger</button>
          </div>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search item, code, vendor, GRN…" className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-sm" />
          {tab === "stock" && (
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="px-3 py-2 rounded-lg border border-border bg-background text-sm">
              <option value="all">All categories</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          )}
        </div>

        {!project.id && <p className="text-sm text-muted-foreground">Add a project first to keep stock records.</p>}

        {tab === "stock" ? (
          <div className="rounded-xl border border-border bg-card overflow-x-auto">
            <table className="w-full text-sm min-w-[900px]">
              <thead className="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="text-left p-3">Item</th>
                  <th className="text-left p-3">Category</th>
                  <th className="text-right p-3">Opening</th>
                  <th className="text-right p-3">Received</th>
                  <th className="text-right p-3">Issued</th>
                  <th className="text-right p-3">Balance</th>
                  <th className="text-right p-3">Rate</th>
                  <th className="text-right p-3">Value</th>
                  <th className="text-right p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isPending && <tr><td className="p-4 text-muted-foreground" colSpan={9}>Loading stock…</td></tr>}
                {!isPending && !filtered.length && <tr><td className="p-4 text-muted-foreground" colSpan={9}>No stock items yet. Add an item or upload an Excel sheet.</td></tr>}
                {filtered.map((b) => {
                  const low = b.reorder_level > 0 && b.balance <= b.reorder_level;
                  return (
                    <tr key={b.id} className="border-t border-border">
                      <td className="p-3">
                        <p className="font-semibold">{b.item_code || "—"}</p>
                        <p className="text-xs text-muted-foreground">{b.description} {b.store_location && `· ${b.store_location}`}</p>
                      </td>
                      <td className="p-3">{b.category || "—"}</td>
                      <td className="p-3 text-right">{qty(b.opening_qty)}</td>
                      <td className="p-3 text-right">{qty(b.received)}</td>
                      <td className="p-3 text-right">{qty(b.issued)}</td>
                      <td className={`p-3 text-right font-bold ${low ? "text-destructive" : ""}`}>{qty(b.balance)} {b.unit}</td>
                      <td className="p-3 text-right">{inr(b.rate)}</td>
                      <td className="p-3 text-right">{inr(b.value)}</td>
                      <td className="p-3 text-right whitespace-nowrap">
                        <button onClick={() => { setItemDraft({ item_code: b.item_code, description: b.description, category: b.category, unit: b.unit, opening_qty: b.opening_qty, reorder_level: b.reorder_level, rate: b.rate, store_location: b.store_location, notes: b.notes }); setEditingItem(b.id); }} className="text-primary font-semibold mr-3">Edit</button>
                        <button onClick={() => { if (confirm(`Delete ${b.item_code || b.description}?`)) deleteItem.mutate(b.id); }} className="text-destructive font-semibold">Delete</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card overflow-x-auto">
            <table className="w-full text-sm min-w-[900px]">
              <thead className="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="text-left p-3">Date</th>
                  <th className="text-left p-3">Type</th>
                  <th className="text-left p-3">Item</th>
                  <th className="text-right p-3">Qty</th>
                  <th className="text-right p-3">Rate</th>
                  <th className="text-left p-3">Reference / Party</th>
                  <th className="text-right p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {!filteredLedger.length && <tr><td className="p-4 text-muted-foreground" colSpan={7}>No receipts or issues recorded yet.</td></tr>}
                {filteredLedger.map((m) => (
                  <tr key={m.id} className="border-t border-border">
                    <td className="p-3">{m.movement_date}</td>
                    <td className="p-3 capitalize font-semibold">{m.movement_type}</td>
                    <td className="p-3">
                      <p className="font-semibold">{m.item_code || "—"}</p>
                      <p className="text-xs text-muted-foreground">{m.description}</p>
                    </td>
                    <td className="p-3 text-right">{qty(m.quantity)} {m.unit}</td>
                    <td className="p-3 text-right">{inr(m.rate)}</td>
                    <td className="p-3">
                      <p>{m.reference || "—"}</p>
                      <p className="text-xs text-muted-foreground">{m.party} {m.handled_by && `· ${m.handled_by}`}</p>
                    </td>
                    <td className="p-3 text-right">
                      <button onClick={() => { if (confirm("Delete this entry?")) deleteMove.mutate(m.id); }} className="text-destructive font-semibold">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {itemDraft && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-start md:items-center justify-center p-4 overflow-y-auto">
          <div className="bg-card rounded-xl border border-border w-full max-w-2xl p-5">
            <h2 className="text-lg font-bold mb-4">{editingItem ? "Edit stock item" : "New stock item"}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {ITEM_COLUMNS.map((c) => (
                <label key={c.key} className="text-sm">
                  <span className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">{c.label.replace(/_/g, " ")}</span>
                  <input
                    className="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-background"
                    type={c.numeric ? "number" : "text"}
                    value={String(itemDraft[c.key] ?? "")}
                    onChange={(e) => setItemDraft({ ...itemDraft, [c.key]: c.numeric ? num(e.target.value) : e.target.value })}
                  />
                </label>
              ))}
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => { setItemDraft(null); setEditingItem(null); }} className="px-4 py-2 rounded-lg border border-border text-sm font-semibold">Cancel</button>
              <button disabled={saveItem.isPending} onClick={() => saveItem.mutate({ draft: itemDraft, id: editingItem })} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold">
                {saveItem.isPending ? "Saving…" : "Save item"}
              </button>
            </div>
          </div>
        </div>
      )}

      {moveDraft && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-start md:items-center justify-center p-4 overflow-y-auto">
          <div className="bg-card rounded-xl border border-border w-full max-w-2xl p-5">
            <h2 className="text-lg font-bold mb-4 capitalize">{moveDraft.movement_type} entry</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <label>
                <span className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">Type</span>
                <select className="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-background capitalize" value={moveDraft.movement_type} onChange={(e) => setMoveDraft({ ...moveDraft, movement_type: e.target.value })}>
                  {MOVEMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </label>
              <label>
                <span className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">Item</span>
                <select className="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-background" value={moveDraft.item_id ?? ""} onChange={(e) => setMoveDraft(pickItem(moveDraft, e.target.value))}>
                  <option value="">Select item…</option>
                  {items.map((i) => <option key={i.id} value={i.id}>{i.item_code} · {i.description}</option>)}
                </select>
              </label>
              <label>
                <span className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">Quantity ({moveDraft.unit || "unit"})</span>
                <input type="number" className="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-background" value={moveDraft.quantity} onChange={(e) => setMoveDraft({ ...moveDraft, quantity: num(e.target.value) })} />
              </label>
              <label>
                <span className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">Rate</span>
                <input type="number" className="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-background" value={moveDraft.rate} onChange={(e) => setMoveDraft({ ...moveDraft, rate: num(e.target.value) })} />
              </label>
              <label>
                <span className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">Date</span>
                <input type="date" className="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-background" value={moveDraft.movement_date} onChange={(e) => setMoveDraft({ ...moveDraft, movement_date: e.target.value })} />
              </label>
              <label>
                <span className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">GRN / PO / Challan</span>
                <input className="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-background" value={moveDraft.reference} onChange={(e) => setMoveDraft({ ...moveDraft, reference: e.target.value })} />
              </label>
              <label>
                <span className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">Vendor / issued to</span>
                <input className="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-background" value={moveDraft.party} onChange={(e) => setMoveDraft({ ...moveDraft, party: e.target.value })} />
              </label>
              <label>
                <span className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">Handled by</span>
                <input className="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-background" value={moveDraft.handled_by} onChange={(e) => setMoveDraft({ ...moveDraft, handled_by: e.target.value })} />
              </label>
              <label className="md:col-span-2">
                <span className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">Remarks</span>
                <input className="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-background" value={moveDraft.remarks} onChange={(e) => setMoveDraft({ ...moveDraft, remarks: e.target.value })} />
              </label>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setMoveDraft(null)} className="px-4 py-2 rounded-lg border border-border text-sm font-semibold">Cancel</button>
              <button
                disabled={saveMove.isPending}
                onClick={() => {
                  if (!moveDraft.item_code) { toast.error("Select an item"); return; }
                  if (moveDraft.quantity <= 0) { toast.error("Enter a quantity"); return; }
                  saveMove.mutate(moveDraft);
                }}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold"
              >
                {saveMove.isPending ? "Saving…" : "Record entry"}
              </button>
            </div>
          </div>
        </div>
      )}
    </Shell>
  );
}
