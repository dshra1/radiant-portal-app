import { createFileRoute, Link } from "@tanstack/react-router";
import { Fragment, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronDown, ChevronRight, IndianRupee, Loader2, Send, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Shell } from "@/components/saha/Shell";
import { useActiveProject } from "@/hooks/useActiveProject";
import { useAccess, useSessionUser } from "@/lib/access";
import { fmtDay, n } from "@/lib/programme-progress";
import { PRE, type StageBudget } from "@/lib/stage-budget";
import {
  CATS,
  approveActual,
  dueDateFor,
  lakhs,
  requestStagePayment,
  rupees,
  saveActual,
  sendActual,
  payersFor,
  useStageFinance,
  type FinanceRow,
  type Money4,
} from "@/lib/stage-finance";
import type { Payer } from "@/lib/flats";

type Search = { stage?: string };

export const Route = createFileRoute("/stage-budget")({
  validateSearch: (s: Record<string, unknown>): Search =>
    typeof s["stage"] === "string" ? { stage: s["stage"] } : {},
  head: () => ({
    meta: [
      { title: "Stage Budget & Owner Payments | Saha OS" },
      {
        name: "description",
        content:
          "Money each stage needs (material, machinery, labour, misc), payment requests to the landowners by share, and approved actual costs.",
      },
    ],
  }),
  component: Page,
});

const monthLabel = (k: string) =>
  k === "unscheduled"
    ? "Unscheduled"
    : new Date(`${k}-01T00:00:00Z`).toLocaleDateString("en-IN", {
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      });

function Page() {
  const search = Route.useSearch();
  const project = useActiveProject();
  const user = useSessionUser();
  const { access } = useAccess();
  const canApprove = Boolean(access?.isAdmin || access?.roles.includes("pm"));
  const qc = useQueryClient();
  const q = useStageFinance(project.id);
  const [open, setOpen] = useState<string>(search.stage ?? "");
  const [busy, setBusy] = useState("");
  const who = { id: user?.id ?? null, name: user?.email ?? "PMC" };

  const data = q.data;
  const stageInfo = useMemo(() => new Map((data?.stages ?? []).map((s) => [s.code, s])), [data]);
  const months = useMemo(() => {
    const m = new Map<string, StageBudget[]>();
    for (const b of data?.budget.stages ?? []) {
      const k = (b.plannedStart ?? "").slice(0, 7) || "unscheduled";
      m.set(k, [...(m.get(k) ?? []), b]);
    }
    return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [data]);

  const refresh = () => qc.invalidateQueries({ queryKey: ["stage_finance", project.id] });
  const due = (b: StageBudget) => {
    const s = stageInfo.get(b.code);
    return s
      ? dueDateFor(s)
      : dueDateFor({ plannedStart: b.plannedStart, materials: [], steel: null });
  };

  async function request(list: StageBudget[]) {
    if (!data) return;
    const todo = list.filter((b) => !data.finance.get(b.code)?.called_at);
    if (!todo.length) {
      toast.info("Already requested");
      return;
    }
    setBusy(`req-${todo.map((b) => b.code).join(",")}`);
    try {
      const total = await requestStagePayment(
        project.id,
        todo.map((b) => ({ budget: b, due: due(b) })),
        data.owners,
        data.credit,
        who,
        data.flatInfo,
      );
      toast.success(
        `Requested ${lakhs(total)} from the landowners (Capital Ledger and Approvals → Owner decisions)`,
      );
      await refresh();
    } catch (e) {
      toast.error((e as Error).message);
    }
    setBusy("");
  }

  const shareTotal = (data?.owners ?? []).reduce((t, o) => t + o.share, 0);
  const requested = [...(data?.finance.values() ?? [])].reduce((t, r) => t + n(r.call_total), 0);
  const actualSent = [...(data?.finance.values() ?? [])]
    .filter((r) => r.actual_status === "sent")
    .reduce((t, r) => t + n(r.actual_total), 0);

  return (
    <Shell title="Stage Budget & Owner Payments">
      <div className="flex flex-col gap-4 px-4 pb-16 pt-4 md:px-6">
        <header className="rounded-2xl border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            {project.name} · PMC
          </p>
          <h1 className="flex items-center gap-2 text-xl font-bold">
            <IndianRupee className="size-5 text-primary" /> Stage budget and landowner payments
          </h1>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            What each stage needs (material, machinery, labour, misc; BOQ incl. GST), requested from
            the landowners by their share before the stage starts. After the stage, enter the actual
            cost; once you approve it, it is sent to the landowners with a top-up request or a
            credit for the next stage.
          </p>
          {data && (
            <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
              <Tile label="Budget, all stages (incl. GST)" value={lakhs(data.budget.total)} />
              <Tile label="Requested from landowners" value={lakhs(requested)} />
              <Tile label="Actual sent to landowners" value={lakhs(actualSent)} />
              <Tile label="Credit to carry forward" value={lakhs(Math.max(0, data.credit))} />
            </div>
          )}
          {data && (
            <div className="mt-3 text-[13px]">
              <b>Landowners:</b>{" "}
              {data.owners.length === 0 ? (
                <span className="text-destructive">none on record. </span>
              ) : (
                data.owners.map((o) => `${o.name} ${o.share}%`).join(" · ")
              )}
              {data.owners.length > 0 && Math.abs(shareTotal - 100) > 0.01 && (
                <span className="text-amber-700">
                  {" "}
                  (shares add up to {shareTotal}%; requests are split pro rata)
                </span>
              )}{" "}
              <Link to="/landowners-investment" className="text-primary underline">
                edit shares
              </Link>{" "}
              ·{" "}
              <Link to="/capital-ledger" className="text-primary underline">
                capital ledger
              </Link>{" "}
              ·{" "}
              <Link to="/approvals" search={{ tab: "owner" }} className="text-primary underline">
                owner approvals
              </Link>
            </div>
          )}
        </header>

        {q.isPending && (
          <p className="text-sm text-muted-foreground">Working out the stage budgets…</p>
        )}
        {q.isError && (
          <p className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
            {(q.error as Error).message}
          </p>
        )}

        {data &&
          months.map(([k, list]) => {
            const total = list.reduce((t, b) => t + b.total, 0);
            const pending = list.filter((b) => !data.finance.get(b.code)?.called_at);
            return (
              <section key={k} className="overflow-hidden rounded-2xl border border-border bg-card">
                <div className="flex flex-wrap items-center gap-2 border-b border-border bg-secondary/40 px-4 py-2">
                  <h2 className="text-sm font-bold">{monthLabel(k)}</h2>
                  <span className="text-sm text-muted-foreground">
                    {list.length} stage{list.length > 1 ? "s" : ""} · {lakhs(total)}
                  </span>
                  {canApprove && pending.length > 0 && (
                    <button
                      type="button"
                      disabled={Boolean(busy)}
                      onClick={() => void request(pending)}
                      className="ml-auto inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground disabled:opacity-50"
                    >
                      <Send className="size-3.5" /> Request{" "}
                      {lakhs(pending.reduce((t, b) => t + b.total, 0))} for this month
                    </button>
                  )}
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[820px] text-[13px]">
                    <thead className="text-[11px] uppercase text-muted-foreground">
                      <tr>
                        <th className="px-3 py-1.5 text-left">Stage</th>
                        <th className="px-2 text-left">Starts</th>
                        {CATS.map((c) => (
                          <th key={c.key} className="px-2 text-right">
                            {c.label}
                          </th>
                        ))}
                        <th className="px-2 text-right">Total</th>
                        <th className="px-3 text-left">Owners</th>
                      </tr>
                    </thead>
                    <tbody>
                      {list.map((b) => {
                        const f = data.finance.get(b.code);
                        const isOpen = open === b.code;
                        return (
                          <Fragment key={b.code}>
                            <tr
                              className={`cursor-pointer border-t border-border/60 hover:bg-secondary/40 ${isOpen ? "bg-secondary/40" : ""}`}
                              onClick={() => setOpen(isOpen ? "" : b.code)}
                            >
                              <td className="px-3 py-1.5">
                                <span className="inline-flex items-center gap-1">
                                  {isOpen ? (
                                    <ChevronDown className="size-3.5" />
                                  ) : (
                                    <ChevronRight className="size-3.5" />
                                  )}
                                  <b>{b.code === PRE ? "Pre-start" : b.code}</b>{" "}
                                  {b.name.slice(0, 48)}
                                </span>
                              </td>
                              <td className="px-2 whitespace-nowrap">{fmtDay(b.plannedStart)}</td>
                              {CATS.map((c) => (
                                <td key={c.key} className="px-2 text-right tnum">
                                  {b[c.key] ? lakhs(b[c.key]) : "—"}
                                </td>
                              ))}
                              <td className="px-2 text-right font-semibold tnum">
                                {lakhs(b.total)}
                              </td>
                              <td className="px-3 text-[12px]">
                                <Status f={f} />
                              </td>
                            </tr>
                            {isOpen && (
                              <tr>
                                <td colSpan={8} className="bg-background p-0">
                                  <StageDetail
                                    b={b}
                                    f={f}
                                    recorded={data.recorded.get(b.code)}
                                    payers={payersFor(
                                      b.total,
                                      b.individual,
                                      data.owners,
                                      data.flatInfo,
                                    )}
                                    due={due(b)}
                                    canApprove={canApprove}
                                    busy={busy}
                                    onRequest={() => void request([b])}
                                    onSave={async (actual, notes) => {
                                      setBusy("save");
                                      try {
                                        await saveActual(project.id, b.code, actual, notes);
                                        toast.success(
                                          "Actual cost saved (draft): approve it to send",
                                        );
                                        await refresh();
                                      } catch (e) {
                                        toast.error((e as Error).message);
                                      }
                                      setBusy("");
                                    }}
                                    onApprove={async () => {
                                      setBusy("approve");
                                      try {
                                        await approveActual(project.id, b.code, who);
                                        toast.success("Approved");
                                        await refresh();
                                      } catch (e) {
                                        toast.error((e as Error).message);
                                      }
                                      setBusy("");
                                    }}
                                    onSend={async () => {
                                      if (!f) return;
                                      setBusy("send");
                                      try {
                                        await sendActual(
                                          project.id,
                                          f,
                                          b.name,
                                          b.total,
                                          data.owners,
                                          who,
                                          data.flatInfo,
                                        );
                                        toast.success("Cost statement sent to the landowners");
                                        await refresh();
                                      } catch (e) {
                                        toast.error((e as Error).message);
                                      }
                                      setBusy("");
                                    }}
                                  />
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
          })}
      </div>
    </Shell>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border p-3">
      <span className="text-[11px] font-semibold uppercase text-muted-foreground">{label}</span>
      <div className="mt-1 text-lg font-bold">{value}</div>
    </div>
  );
}

function Status({ f }: { f: FinanceRow | undefined }) {
  if (!f?.called_at && f?.actual_status !== "draft")
    return <span className="text-muted-foreground">not requested</span>;
  return (
    <span className="flex flex-col">
      {f.called_at && (
        <span className="text-emerald-700">
          requested {lakhs(f.call_total)} · {fmtDay(f.called_at)}
        </span>
      )}
      {f.actual_status !== "none" && (
        <span className={f.actual_status === "sent" ? "text-emerald-700" : "text-amber-700"}>
          actual {lakhs(f.actual_total)} · {f.actual_status}
        </span>
      )}
    </span>
  );
}

function StageDetail({
  b,
  f,
  recorded,
  payers,
  due,
  canApprove,
  busy,
  onRequest,
  onSave,
  onApprove,
  onSend,
}: {
  b: StageBudget;
  f: FinanceRow | undefined;
  recorded: (Money4 & { bills: number; labourDays: number }) | undefined;
  payers: Payer[];
  due: string;
  canApprove: boolean;
  busy: string;
  onRequest: () => void;
  onSave: (a: Money4, notes: string) => Promise<void>;
  onApprove: () => Promise<void>;
  onSend: () => Promise<void>;
}) {
  const [actual, setActual] = useState<Money4>({
    material: n(f?.actual?.material ?? b.material),
    machinery: n(f?.actual?.machinery ?? b.machinery),
    labour: n(f?.actual?.labour ?? b.labour),
    misc: n(f?.actual?.misc ?? b.misc),
  });
  const [notes, setNotes] = useState(f?.notes ?? "");
  const locked = f?.actual_status === "approved" || f?.actual_status === "sent";
  const total = CATS.reduce((t, c) => t + n(actual[c.key]), 0);
  const top = [...b.lines].sort((x, y) => y.amount - x.amount);

  return (
    <div className="grid gap-4 p-4 lg:grid-cols-2">
      <div>
        <h3 className="text-sm font-bold">
          What the budget is made of ({b.lines.length} BOQ lines)
        </h3>
        <div className="mt-1 max-h-72 overflow-y-auto">
          <table className="w-full text-[12px]">
            <tbody>
              {top.map((l, i) => (
                <tr key={i} className="border-t border-border/50 align-top">
                  <td className="pr-2 text-muted-foreground">{l.code}</td>
                  <td className="pr-2">
                    {l.description.slice(0, 80)}
                    <span className="block text-[11px] text-muted-foreground">
                      {l.category} · {l.basis}
                    </span>
                  </td>
                  <td className="whitespace-nowrap text-right tnum">{rupees(l.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-[12px] text-muted-foreground">
          Shared lines (concrete, steel, labour contract, site costs) are split by each stage's
          concrete, steel or working days. Money needed by <b>{fmtDay(due)}</b> (a week before the
          start or the first order-by date).
        </p>
        {payers.length > 0 && (
          <div className="mt-3">
            <h3 className="text-sm font-bold">Who pays this stage</h3>
            <p className="text-[12px] text-muted-foreground">
              Common works {rupees(b.total - (b.individual ?? 0))} by share %; individual works{" "}
              {rupees(b.individual ?? 0)} to each flat's owner (unallotted flats by share).
            </p>
            <table className="mt-1 w-full text-[12px]">
              <thead className="text-left text-muted-foreground">
                <tr>
                  <th className="pr-2 font-medium">Payer</th>
                  <th className="pr-2 text-right font-medium">Common</th>
                  <th className="pr-2 text-right font-medium">Own flats</th>
                  <th className="pr-2 text-right font-medium">Unallotted</th>
                  <th className="text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {payers.map((p) => (
                  <tr key={p.name} className="border-t border-border/50">
                    <td className="pr-2">
                      {p.name}
                      {p.flats.length > 0 && (
                        <span className="block text-[11px] text-muted-foreground">
                          flats {p.flats.join(", ")}
                        </span>
                      )}
                    </td>
                    <td className="pr-2 text-right tnum">{rupees(p.common)}</td>
                    <td className="pr-2 text-right tnum">{rupees(p.individual)}</td>
                    <td className="pr-2 text-right tnum">{rupees(p.unallotted)}</td>
                    <td className="text-right font-semibold tnum">{rupees(p.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {canApprove && !f?.called_at && (
          <button
            type="button"
            disabled={Boolean(busy)}
            onClick={onRequest}
            className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-50"
          >
            <Send className="size-3.5" /> Request {lakhs(b.total)} from the landowners
          </button>
        )}
      </div>

      {b.code !== PRE && (
        <div className="rounded-xl border border-border p-3">
          <h3 className="text-sm font-bold">Actual cost after the stage</h3>
          {recorded ? (
            <div className="mt-1 rounded-lg bg-secondary/60 p-2 text-[12px]">
              Recorded against {b.code}: {recorded.bills} bill{recorded.bills === 1 ? "" : "s"}
              {recorded.labourDays ? `, ${recorded.labourDays} labour man-days` : ""} ·{" "}
              {CATS.map((c) => `${c.label.toLowerCase()} ${lakhs(recorded[c.key])}`).join(", ")}
              {!locked && (
                <button
                  type="button"
                  onClick={() =>
                    setActual({
                      material: recorded.material,
                      machinery: recorded.machinery,
                      labour: recorded.labour,
                      misc: recorded.misc,
                    })
                  }
                  className="ml-2 font-semibold text-primary underline"
                >
                  Use these figures
                </button>
              )}
            </div>
          ) : (
            <p className="mt-1 text-[12px] text-muted-foreground">
              Tag bills (Bills &amp; Payments) and the labour log (Contractors &amp; Labour) with
              stage {b.code} and they add up here.
            </p>
          )}
          <p className="text-[12px] text-muted-foreground">
            From the bills, labour and machinery paid for this stage. Saved as a draft; only an
            admin or PM can approve it and send it to the landowners.
          </p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {CATS.map((c) => (
              <label key={c.key} className="text-[12px]">
                {c.label} <span className="text-muted-foreground">(budget {lakhs(b[c.key])})</span>
                <input
                  type="number"
                  disabled={locked}
                  value={Math.round(actual[c.key])}
                  onChange={(e) => setActual({ ...actual, [c.key]: Number(e.target.value) || 0 })}
                  className="mt-0.5 h-8 w-full rounded-lg border border-border bg-background px-2 text-sm disabled:opacity-60"
                />
              </label>
            ))}
          </div>
          <textarea
            disabled={locked}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Notes: bill numbers, reasons for variance"
            className="mt-2 w-full rounded-lg border border-border bg-background p-2 text-sm disabled:opacity-60"
          />
          <p className="text-sm">
            Actual <b>{rupees(total)}</b> vs budget {rupees(b.total)}
            {f?.call_total ? ` · requested ${rupees(f.call_total)}` : ""}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {!locked && (
              <button
                type="button"
                disabled={Boolean(busy)}
                onClick={() => void onSave(actual, notes)}
                className="rounded-lg border border-primary px-3 py-1.5 text-xs font-semibold text-primary disabled:opacity-50"
              >
                {busy === "save" ? <Loader2 className="inline size-3.5 animate-spin" /> : null} Save
                actual (draft)
              </button>
            )}
            {canApprove && f?.actual_status === "draft" && (
              <button
                type="button"
                disabled={Boolean(busy)}
                onClick={() => void onApprove()}
                className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
              >
                <ShieldCheck className="size-3.5" /> Approve
              </button>
            )}
            {canApprove && f?.actual_status === "approved" && (
              <button
                type="button"
                disabled={Boolean(busy)}
                onClick={() => void onSend()}
                className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-50"
              >
                <Send className="size-3.5" /> Send cost statement to landowners
              </button>
            )}
            {f?.actual_status === "approved" && (
              <span className="text-xs text-emerald-700">
                Approved by {f.approved_by_name} · {fmtDay(f.approved_at)}
              </span>
            )}
            {f?.actual_status === "sent" && (
              <span className="text-xs text-emerald-700">
                Sent to the landowners · {fmtDay(f.sent_at)}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
