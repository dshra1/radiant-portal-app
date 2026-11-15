import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { inr, inrCompact } from "@/data/saha";
import { packageOf, savingOf, type AltLine, type AlternateRow } from "@/lib/boq-alternates";

/** Small badge in a BOQ row: how many alternates the line has and the best saving. */
export function AlternatesBadge({
  line,
  alts,
  open,
  onToggle,
}: {
  line: AltLine;
  alts: AlternateRow[];
  open: boolean;
  onToggle: () => void;
}) {
  const best = alts.reduce((m, a) => Math.max(m, savingOf(line, a)), 0);
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`mt-1.5 inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[11px] font-semibold ${
        alts.length
          ? "border-primary/50 bg-primary-soft text-primary"
          : "border-input text-muted-foreground"
      }`}
    >
      {open ? "Hide alternates" : `Alternates (${alts.length})`}
      {!open && best > 0 && <span className="tnum">· saves {inrCompact(best)}</span>}
    </button>
  );
}

/** The alternates of one line: compare, use one, add or remove. */
export function AlternatesPanel({
  projectId,
  line,
  alts,
  canEdit,
  gateOn,
  busy,
  onUse,
  onClose,
  aiNote,
}: {
  projectId: string;
  line: AltLine;
  alts: AlternateRow[];
  canEdit: boolean;
  gateOn: boolean;
  busy: boolean;
  onUse: (alt: AlternateRow) => void;
  onClose: () => void;
  aiNote?: React.ReactNode;
}) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ label: "", make: "", rate: "", note: "" });
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);
  const individual = (line.work_scope ?? "") === "individual";

  async function add() {
    const rate = Number(form.rate);
    if (!form.label.trim() || !Number.isFinite(rate) || rate < 0) {
      setMsg("Enter a name and a rate per " + line.unit + ".");
      return;
    }
    setSaving(true);
    setMsg("");
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("flat_options").insert({
      project_id: projectId,
      item_code: line.item_code,
      type_code: individual ? "" : `pkg:${packageOf(line)}`,
      label: form.label.trim(),
      make: form.make.trim(),
      rate,
      gst_pct: Number(line.gst_pct ?? 18) || 0,
      note: form.note.trim(),
      sort: alts.length + 1,
      created_by: u.user?.id ?? null,
    });
    setSaving(false);
    if (error) {
      setMsg(`Could not save: ${error.message}`);
      return;
    }
    setForm({ label: "", make: "", rate: "", note: "" });
    setMsg("Alternate saved.");
    await qc.invalidateQueries({ queryKey: ["boq_alternates", projectId] });
    await qc.invalidateQueries({ queryKey: ["owner_portal", projectId] });
  }

  async function remove(a: AlternateRow) {
    const { error } = await supabase.from("flat_options").delete().eq("id", a.id);
    if (error) setMsg(`Could not remove: ${error.message}`);
    await qc.invalidateQueries({ queryKey: ["boq_alternates", projectId] });
  }

  const current = Number(line.rate) || 0;
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="label-caps text-primary">
          Alternates · {line.item_code} · {line.description.slice(0, 80)}
        </span>
        <button
          type="button"
          onClick={onClose}
          className="text-[11px] font-semibold text-muted-foreground"
        >
          Close
        </button>
      </div>
      <p className="text-[12px] text-muted-foreground">
        Now: <b className="text-foreground">{line.brand || "our specification"}</b> at{" "}
        <b className="tnum text-foreground">
          {inr(current)} / {line.unit}
        </b>
        . Savings are for the full quantity incl. GST.
        {individual &&
          " Individual-works alternates are also offered to flat owners in the Owner's Portal."}
      </p>
      {alts.length === 0 ? (
        <p className="rounded border border-dashed border-border p-3 text-[12px] text-muted-foreground">
          No alternates yet for this line.{canEdit ? " Add one below." : ""}
        </p>
      ) : (
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
          {alts.map((a) => {
            const s = savingOf(line, a);
            return (
              <div
                key={a.id}
                className="flex flex-col rounded-lg border border-border bg-card p-2.5"
              >
                <div className="text-[13px] font-bold text-foreground">{a.label}</div>
                {a.make && <div className="text-[12px] text-muted-foreground">{a.make}</div>}
                <div className="mt-1.5 flex items-baseline justify-between gap-2">
                  <span className="text-sm font-semibold tnum">
                    {inr(Number(a.rate))} / {line.unit}
                  </span>
                  <span
                    className={`text-[11px] font-bold tnum ${s > 0 ? "text-primary" : s < 0 ? "text-destructive" : "text-muted-foreground"}`}
                  >
                    {s === 0
                      ? "same cost"
                      : `${s > 0 ? "saves " : "adds "}${inrCompact(Math.abs(s))}`}
                  </span>
                </div>
                {a.note && <p className="mt-1 text-[11px] text-muted-foreground">{a.note}</p>}
                {isPairedAlternate(a) && (
                  <p className="mt-1 text-[11px] font-semibold text-warning">
                    Goes with another line's alternate: choose both together. The optimizer leaves
                    it to you.
                  </p>
                )}
                <div className="mt-auto flex gap-1.5 pt-2">
                  <button
                    type="button"
                    disabled={busy || !canEdit}
                    title={canEdit ? undefined : "Only an admin or PM can change the BOQ"}
                    onClick={() => onUse(a)}
                    className="h-8 flex-1 rounded bg-primary text-[12px] font-semibold text-primary-foreground disabled:opacity-50"
                  >
                    {gateOn ? "Send for approval" : "Use this"}
                  </button>
                  {canEdit && (
                    <button
                      type="button"
                      onClick={() => void remove(a)}
                      aria-label="Remove this alternate"
                      className="rounded border border-input px-2 text-destructive"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      {canEdit && (
        <div className="rounded-lg border border-border bg-card p-2.5">
          <div className="mb-1.5 text-[12px] font-semibold text-foreground">Add an alternate</div>
          <div className="grid gap-2 sm:grid-cols-[2fr_1.5fr_1fr_2fr_auto]">
            <input
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              placeholder="What it is (e.g. 600 × 1200 GVT, factory direct)"
              className="h-9 rounded border border-input bg-background px-2 text-sm"
            />
            <input
              value={form.make}
              onChange={(e) => setForm({ ...form, make: e.target.value })}
              placeholder="Make / brand"
              className="h-9 rounded border border-input bg-background px-2 text-sm"
            />
            <input
              value={form.rate}
              onChange={(e) => setForm({ ...form, rate: e.target.value })}
              inputMode="decimal"
              placeholder={`₹ / ${line.unit}`}
              className="h-9 rounded border border-input bg-background px-2 text-right text-sm tnum"
            />
            <input
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              placeholder="Note: dealer, quote ref, quality check"
              className="h-9 rounded border border-input bg-background px-2 text-sm"
            />
            <button
              type="button"
              disabled={saving}
              onClick={() => void add()}
              className="inline-flex h-9 items-center justify-center gap-1 rounded border border-primary px-3 text-[12px] font-semibold text-primary disabled:opacity-50"
            >
              <Plus className="size-3.5" />
              {saving ? "Saving…" : "Add"}
            </button>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">Rate excl. GST, per {line.unit}.</p>
        </div>
      )}
      {aiNote}
      {msg && <p className="text-[12px] font-medium text-primary">{msg}</p>}
    </div>
  );
}
