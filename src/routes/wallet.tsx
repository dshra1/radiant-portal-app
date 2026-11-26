import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Camera, Check, HandCoins, Pencil, Receipt, Send, Trash2, Wallet, X } from "lucide-react";
import { toast } from "sonner";
import { Shell } from "@/components/saha/Shell";
import { StatusBadge } from "@/components/saha/ui";
import { StageSelect } from "@/components/saha/StageSelect";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { useAccess, useSessionUser } from "@/lib/access";
import { useActiveProject } from "@/hooks/useActiveProject";
import { todayIso } from "@/lib/dates";
import { cn } from "@/lib/utils";

/**
 * Site Wallet: money requests, advances and site expenses per person.
 * Site asks for money or logs what it spent (with the bill photo); the PM approves; accounts
 * pays requests or gives advances. Each person's balance = money received − money spent.
 */

type Entry = Database["public"]["Tables"]["wallet_entries"]["Row"];
type Search = { new?: "request" | "expense" };

export const Route = createFileRoute("/wallet")({
  validateSearch: (s: Record<string, unknown>): Search =>
    s["new"] === "request" || s["new"] === "expense" ? { new: s["new"] } : {},
  head: () => ({
    meta: [
      { title: "Site Wallet — Money Requests, Advances & Site Expenses | SiteYantra" },
      {
        name: "description",
        content:
          "Site staff ask for money or log site expenses with the bill photo; the PM approves, accounts pays, and every person's balance is always known.",
      },
    ],
  }),
  component: Page,
});

const num = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};
const inr = (v: number) => `₹${Math.round(v).toLocaleString("en-IN")}`;
const field = "h-11 w-full rounded-lg border border-border bg-background px-3 text-sm";
const btn =
  "inline-flex h-11 items-center justify-center gap-1.5 rounded-lg px-3 text-sm font-semibold";
const CATEGORIES = [
  "Tea & snacks",
  "Transport / auto",
  "Small material",
  "Hardware & tools",
  "Repairs",
  "Water / tanker",
  "Labour advance",
  "Printing & stationery",
  "Other",
];
const TYPE_LABEL: Record<string, string> = {
  request: "Money request",
  advance: "Advance given",
  expense: "Expense",
};

/** Received (paid requests + advances) and spent (pending + approved expenses). */
function balanceOf(list: Entry[]) {
  let got = 0;
  let spent = 0;
  for (const e of list) {
    if ((e.entry_type === "request" || e.entry_type === "advance") && e.status === "paid")
      got += num(e.amount);
    if (e.entry_type === "expense" && (e.status === "pending" || e.status === "approved"))
      spent += num(e.amount);
  }
  return { got, spent, balance: got - spent };
}

type View = "mine" | "approve" | "pay" | "people";

function Page() {
  const search = Route.useSearch();
  const user = useSessionUser();
  const { access } = useAccess();
  const project = useActiveProject();
  const pid = project.id;
  const qc = useQueryClient();
  const roles = access?.roles ?? [];
  const isMgr = !!access && (access.isAdmin || roles.includes("pm"));
  const isMoney = isMgr || roles.includes("accounts");
  const canWrite = !!access && roles.some((r) => r !== "landowner_investor");
  const myName = access?.profile?.full_name || access?.email || "";
  const [form, setForm] = useState<"request" | "expense" | "advance" | null>(search.new ?? null);
  const [editing, setEditing] = useState<Entry | null>(null);
  const [view, setView] = useState<View>("mine");

  const q = useQuery({
    queryKey: ["wallet", pid],
    enabled: Boolean(pid && user?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wallet_entries")
        .select("*")
        .eq("project_id", pid)
        .order("entry_date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(1000);
      if (error) throw error;
      return data ?? [];
    },
  });
  const all = useMemo(() => q.data ?? [], [q.data]);
  const mine = all.filter((e) => e.person_id === user?.id);
  const me = balanceOf(mine);
  const toApprove = all.filter((e) => e.status === "pending" && e.entry_type !== "advance");
  const toPay = all.filter((e) => e.entry_type === "request" && e.status === "approved");
  const people = useMemo(() => {
    const m = new Map<string, { name: string; list: Entry[] }>();
    for (const e of all) {
      const k = e.person_id ?? e.person_name;
      const cur = m.get(k) ?? { name: e.person_name, list: [] };
      cur.list.push(e);
      m.set(k, cur);
    }
    return [...m.values()]
      .map((p) => ({ ...p, ...balanceOf(p.list) }))
      .sort((a, b) => b.balance - a.balance);
  }, [all]);
  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ["wallet", pid] });
    void qc.invalidateQueries({ queryKey: ["today-strip"] });
  };

  const shown =
    view === "approve" ? toApprove : view === "pay" ? toPay : view === "mine" ? mine : [];
  const tabs: { key: View; label: string; n?: number; show: boolean }[] = [
    { key: "mine", label: "My wallet", show: true },
    { key: "approve", label: "To approve", n: toApprove.length, show: isMgr },
    { key: "pay", label: "To pay", n: toPay.length, show: isMoney },
    { key: "people", label: "Everyone's balance", show: isMgr || isMoney },
  ];

  return (
    <Shell
      title="Site Wallet"
      subtitle={`${project.name} · money requests, advances and site expenses`}
    >
      <div className="space-y-4 pb-16">
        <section className="grid grid-cols-3 gap-2">
          {[
            ["Received", me.got],
            ["Spent", me.spent],
            ["In hand", me.balance],
          ].map(([l, v]) => (
            <div
              key={l as string}
              className="rounded-xl border border-border bg-card p-3 text-center"
            >
              <p className="text-xs text-muted-foreground">{l}</p>
              <p
                className={cn(
                  "text-lg font-bold tnum",
                  l === "In hand" && num(v) < 0 && "text-destructive",
                )}
              >
                {inr(num(v))}
              </p>
            </div>
          ))}
        </section>

        {canWrite && !form && !editing && (
          <div className={cn("grid gap-2", isMoney ? "grid-cols-3" : "grid-cols-2")}>
            <button
              type="button"
              onClick={() => setForm("request")}
              className={cn(btn, "bg-primary text-primary-foreground")}
            >
              <HandCoins className="size-4" /> Ask for money
            </button>
            <button
              type="button"
              onClick={() => setForm("expense")}
              className={cn(btn, "border border-border bg-card")}
            >
              <Receipt className="size-4" /> Log expense
            </button>
            {isMoney && (
              <button
                type="button"
                onClick={() => setForm("advance")}
                className={cn(btn, "border border-border bg-card")}
              >
                <Wallet className="size-4" /> Give advance
              </button>
            )}
          </div>
        )}

        {(form || editing) && pid && (
          <EntryForm
            kind={editing ? (editing.entry_type as "request" | "expense" | "advance") : form!}
            value={editing}
            projectId={pid}
            userId={user?.id ?? null}
            myName={myName}
            onClose={() => {
              setForm(null);
              setEditing(null);
            }}
            onSaved={() => {
              setForm(null);
              setEditing(null);
              refresh();
            }}
          />
        )}

        <div className="flex gap-2 overflow-x-auto pb-1">
          {tabs
            .filter((t) => t.show)
            .map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setView(t.key)}
                className={cn(
                  "h-9 shrink-0 rounded-full px-3 text-xs font-semibold",
                  view === t.key
                    ? "bg-primary text-primary-foreground"
                    : "border border-border bg-card",
                )}
              >
                {t.label}
                {t.n ? ` (${t.n})` : ""}
              </button>
            ))}
        </div>

        {q.isError && <p className="text-sm text-destructive">{(q.error as Error).message}</p>}

        {view === "people" ? (
          <ul className="divide-y divide-border rounded-xl border border-border bg-card">
            {people.map((p) => (
              <li
                key={p.name}
                className="flex items-center justify-between gap-2 px-3 py-3 text-sm"
              >
                <span>
                  <b>{p.name || "—"}</b>
                  <span className="block text-xs text-muted-foreground">
                    received {inr(p.got)} · spent {inr(p.spent)}
                  </span>
                </span>
                <span className={cn("font-bold tnum", p.balance < 0 && "text-destructive")}>
                  {inr(p.balance)}
                </span>
              </li>
            ))}
            {people.length === 0 && (
              <li className="p-6 text-center text-muted-foreground">No entries yet.</li>
            )}
          </ul>
        ) : (
          <div className="space-y-2">
            {shown.map((e) => (
              <EntryCard
                key={e.id}
                e={e}
                isMgr={isMgr}
                isMoney={isMoney}
                mineId={user?.id ?? ""}
                myName={myName}
                onEdit={() => setEditing(e)}
                onChanged={refresh}
              />
            ))}
            {!q.isPending && shown.length === 0 && (
              <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                {view === "approve"
                  ? "Nothing waiting for approval."
                  : view === "pay"
                    ? "Nothing to pay."
                    : "No entries yet."}
              </p>
            )}
          </div>
        )}
      </div>
    </Shell>
  );
}

function EntryCard({
  e,
  isMgr,
  isMoney,
  mineId,
  myName,
  onEdit,
  onChanged,
}: {
  e: Entry;
  isMgr: boolean;
  isMoney: boolean;
  mineId: string;
  myName: string;
  onEdit: () => void;
  onChanged: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [pay, setPay] = useState<{ mode: string; ref: string } | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const tone =
    e.status === "paid" || e.status === "approved"
      ? "emerald"
      : e.status === "rejected"
        ? "red"
        : "amber";

  const set = async (
    patch: Database["public"]["Tables"]["wallet_entries"]["Update"],
    ok: string,
  ) => {
    setBusy(true);
    const { error } = await supabase.from("wallet_entries").update(patch).eq("id", e.id);
    setBusy(false);
    if (error) return void toast.error(error.message);
    toast.success(ok);
    onChanged();
  };
  const reject = () => {
    const why = window.prompt("Reason for rejecting (shown to the person)") ?? "";
    if (!why.trim()) return;
    void set(
      {
        status: "rejected",
        rejection_reason: why.trim(),
        decided_by_name: myName,
        decided_at: new Date().toISOString(),
      },
      "Rejected",
    );
  };
  const del = async () => {
    if (!window.confirm("Delete this entry?")) return;
    const { error } = await supabase.from("wallet_entries").delete().eq("id", e.id);
    if (error) return void toast.error(error.message);
    onChanged();
  };
  const showPhoto = async () => {
    if (!e.photo_path) return;
    const { data } = await supabase.storage.from("site-media").createSignedUrl(e.photo_path, 600);
    setPhoto(data?.signedUrl ?? null);
  };

  return (
    <article className="space-y-2 rounded-xl border border-border bg-card p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-bold">
            {TYPE_LABEL[e.entry_type]} · {inr(num(e.amount))}
          </p>
          <p className="text-xs text-muted-foreground">
            {e.person_name} · {e.entry_date}
            {e.stage_code ? ` · stage ${e.stage_code}` : ""}
          </p>
          <p className="mt-1 text-sm">
            {[e.category, e.purpose, e.payee && `to ${e.payee}`].filter(Boolean).join(" · ") || "—"}
          </p>
          {e.status === "rejected" && e.rejection_reason && (
            <p className="text-xs text-destructive">Rejected: {e.rejection_reason}</p>
          )}
          {e.status === "paid" && e.entry_type === "request" && (
            <p className="text-xs text-muted-foreground">
              Paid {e.paid_on} {e.pay_mode} {e.pay_reference}{" "}
              {e.paid_by_name && `by ${e.paid_by_name}`}
            </p>
          )}
        </div>
        <StatusBadge tone={tone}>{e.status}</StatusBadge>
      </div>
      {e.photo_path && !photo && (
        <button
          type="button"
          onClick={showPhoto}
          className="inline-flex items-center gap-1 text-xs font-semibold text-primary underline"
        >
          <Camera className="size-3.5" /> See bill photo
        </button>
      )}
      {photo && <img src={photo} alt="Bill" className="max-h-64 rounded-lg border border-border" />}

      <div className="flex flex-wrap gap-2">
        {isMgr && e.status === "pending" && e.entry_type !== "advance" && (
          <>
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                set(
                  {
                    status: "approved",
                    decided_by_name: myName,
                    decided_at: new Date().toISOString(),
                  },
                  "Approved",
                )
              }
              className={cn(btn, "h-10 bg-primary text-primary-foreground")}
            >
              <Check className="size-4" /> Approve
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={reject}
              className={cn(btn, "h-10 border border-border")}
            >
              Reject
            </button>
          </>
        )}
        {isMoney && e.entry_type === "request" && e.status === "approved" && !pay && (
          <button
            type="button"
            onClick={() => setPay({ mode: "UPI", ref: "" })}
            className={cn(btn, "h-10 bg-primary text-primary-foreground")}
          >
            Mark paid
          </button>
        )}
        {pay && (
          <div className="flex w-full flex-wrap gap-2">
            <select
              className={cn(field, "h-10 w-28")}
              value={pay.mode}
              onChange={(x) => setPay({ ...pay, mode: x.target.value })}
            >
              {["UPI", "Cash", "NEFT", "Cheque"].map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
            <input
              className={cn(field, "h-10 flex-1")}
              placeholder="Reference / UTR"
              value={pay.ref}
              onChange={(x) => setPay({ ...pay, ref: x.target.value })}
            />
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                set(
                  {
                    status: "paid",
                    pay_mode: pay.mode,
                    pay_reference: pay.ref.trim(),
                    paid_on: todayIso(),
                    paid_by_name: myName,
                  },
                  "Marked paid",
                )
              }
              className={cn(btn, "h-10 bg-primary text-primary-foreground")}
            >
              Save
            </button>
          </div>
        )}
        {e.status === "pending" && (e.created_by === mineId || isMgr) && (
          <button type="button" onClick={onEdit} className={cn(btn, "h-10 border border-border")}>
            <Pencil className="size-4" /> Edit
          </button>
        )}
        {isMgr && (
          <button
            type="button"
            aria-label="Delete entry"
            onClick={del}
            className={cn(btn, "h-10 border border-border")}
          >
            <Trash2 className="size-4" />
          </button>
        )}
      </div>
    </article>
  );
}

function EntryForm({
  kind,
  value,
  projectId,
  userId,
  myName,
  onClose,
  onSaved,
}: {
  kind: "request" | "expense" | "advance";
  value: Entry | null;
  projectId: string;
  userId: string | null;
  myName: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [f, setF] = useState({
    amount: value ? String(value.amount) : "",
    category: value?.category ?? (kind === "expense" ? CATEGORIES[0]! : ""),
    payee: value?.payee ?? "",
    purpose: value?.purpose ?? "",
    stage_code: value?.stage_code ?? "",
    entry_date: value?.entry_date ?? todayIso(),
    person_id: value?.person_id ?? "",
    pay_mode: "UPI",
    pay_reference: "",
  });
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const people = useQuery({
    queryKey: ["profiles", "wallet"],
    enabled: kind === "advance",
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id,full_name,email,status")
        .eq("status", "approved")
        .order("full_name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const save = async () => {
    const amount = num(f.amount);
    if (!(amount > 0)) return void toast.error("Enter the amount.");
    if (kind === "request" && !f.purpose.trim())
      return void toast.error("Say what the money is for.");
    if (kind === "advance" && !f.person_id) return void toast.error("Choose who gets the advance.");
    setBusy(true);
    try {
      let photo_path = value?.photo_path ?? "";
      if (file) {
        const path = `${projectId}/wallet/${Date.now()}-${file.name.replace(/[^\w.-]+/g, "_")}`;
        const { error } = await supabase.storage
          .from("site-media")
          .upload(path, file, { upsert: false, contentType: file.type || "image/jpeg" });
        if (error) throw error;
        photo_path = path;
      }
      const person =
        kind === "advance" ? (people.data ?? []).find((p) => p.id === f.person_id) : null;
      const body = {
        project_id: projectId,
        entry_type: kind,
        entry_date: f.entry_date,
        amount,
        category: f.category,
        payee: f.payee.trim(),
        purpose: f.purpose.trim(),
        stage_code: f.stage_code,
        photo_path,
        ...(kind === "advance"
          ? {
              person_id: f.person_id,
              person_name: person?.full_name || person?.email || "",
              status: "paid",
              paid_on: f.entry_date,
              paid_by_name: myName,
              pay_mode: f.pay_mode,
              pay_reference: f.pay_reference.trim(),
            }
          : value
            ? {}
            : { person_id: userId, person_name: myName, status: "pending" }),
      };
      const { error } = value
        ? await supabase.from("wallet_entries").update(body).eq("id", value.id)
        : await supabase.from("wallet_entries").insert({ ...body, created_by: userId });
      if (error) throw error;
      if (!value && kind !== "advance")
        await supabase.from("notifications").insert({
          title: `${kind === "request" ? "Money request" : "Site expense"} ₹${Math.round(amount).toLocaleString("en-IN")} from ${myName}`,
          body: [f.category, f.purpose, f.payee && `to ${f.payee}`].filter(Boolean).join(" · "),
          category: "Approval",
          priority: kind === "request" ? "High" : "Medium",
          link: "/wallet",
          project_id: projectId,
        });
      toast.success(
        kind === "advance" ? "Advance recorded" : value ? "Updated" : "Sent for approval",
      );
      onSaved();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const title = value
    ? "Edit"
    : kind === "request"
      ? "Ask for money"
      : kind === "expense"
        ? "Log a site expense"
        : "Give an advance";
  return (
    <section className="space-y-2 rounded-xl border-2 border-primary/40 bg-card p-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold">{title}</h2>
        <button type="button" aria-label="Close" onClick={onClose}>
          <X className="size-5" />
        </button>
      </div>
      {kind === "advance" && (
        <select
          className={field}
          value={f.person_id}
          onChange={(e) => setF({ ...f, person_id: e.target.value })}
        >
          <option value="">Who gets it?</option>
          {(people.data ?? []).map((p) => (
            <option key={p.id} value={p.id}>
              {p.full_name || p.email}
            </option>
          ))}
        </select>
      )}
      <div className="grid grid-cols-2 gap-2">
        <input
          type="number"
          inputMode="decimal"
          className={field}
          placeholder="Amount ₹"
          value={f.amount}
          onChange={(e) => setF({ ...f, amount: e.target.value })}
        />
        <input
          type="date"
          className={field}
          value={f.entry_date}
          onChange={(e) => setF({ ...f, entry_date: e.target.value })}
        />
      </div>
      {kind === "expense" && (
        <select
          className={field}
          value={f.category}
          onChange={(e) => setF({ ...f, category: e.target.value })}
        >
          {CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      )}
      <input
        className={field}
        placeholder={
          kind === "request"
            ? "What is it for? (e.g. pay shuttering labour advance)"
            : kind === "expense"
              ? "What was bought / done"
              : "Note (petty cash for the week…)"
        }
        value={f.purpose}
        onChange={(e) => setF({ ...f, purpose: e.target.value })}
      />
      {kind !== "advance" && (
        <input
          className={field}
          placeholder={kind === "request" ? "Pay to (name, if not you)" : "Shop / paid to"}
          value={f.payee}
          onChange={(e) => setF({ ...f, payee: e.target.value })}
        />
      )}
      {kind !== "advance" && (
        <StageSelect
          projectId={projectId}
          value={f.stage_code}
          onChange={(v) => setF({ ...f, stage_code: v })}
          className={field}
        />
      )}
      {kind === "advance" && (
        <div className="grid grid-cols-2 gap-2">
          <select
            className={field}
            value={f.pay_mode}
            onChange={(e) => setF({ ...f, pay_mode: e.target.value })}
          >
            {["UPI", "Cash", "NEFT", "Cheque"].map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
          <input
            className={field}
            placeholder="Reference / UTR"
            value={f.pay_reference}
            onChange={(e) => setF({ ...f, pay_reference: e.target.value })}
          />
        </div>
      )}
      {kind === "expense" && (
        <label className={cn(btn, "w-full cursor-pointer border border-dashed border-border")}>
          <Camera className="size-4" />{" "}
          {file ? file.name : value?.photo_path ? "Change bill photo" : "Photo of the bill"}
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </label>
      )}
      <button
        type="button"
        disabled={busy}
        onClick={save}
        className={cn(btn, "w-full bg-primary text-primary-foreground disabled:opacity-50")}
      >
        <Send className="size-4" />{" "}
        {busy
          ? "Saving…"
          : kind === "advance"
            ? "Record advance"
            : value
              ? "Save"
              : "Send for approval"}
      </button>
    </section>
  );
}
