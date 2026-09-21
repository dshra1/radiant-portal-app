import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, X, ShieldCheck, History, IndianRupee } from "lucide-react";
import { Shell } from "@/components/saha/Shell";
import { useSessionUser } from "@/lib/access";
import { supabase } from "@/integrations/supabase/client";
import {
  approveChangeRequest,
  rejectChangeRequest,
  useApprovalGate,
  useChangeRequests,
  num,
  type ChangeRequest,
} from "@/lib/approvals";

export const Route = createFileRoute("/approvals")({
  head: () => ({
    meta: [
      { title: "Change Approvals — Partner Sign-off on BOQ Changes | Saha OS" },
      {
        name: "description",
        content:
          "Every cost-affecting BOQ change and cheaper brand suggestion waits here until a partner approves or rejects it, with a full decision history.",
      },
      { property: "og:title", content: "Change Approvals — Partner Sign-off on BOQ Changes" },
      {
        property: "og:description",
        content: "Approve or reject proposed BOQ rate, brand and quantity changes before they commit.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function inr(v: number) {
  return `₹${Math.round(v).toLocaleString("en-IN")}`;
}

function Values({ values }: { values: Record<string, unknown> }) {
  const get = (k: string) => values[k];
  const parts = [
    get("brand") ? `Brand ${String(get("brand"))}` : "",
    get("supplier") ? `Supplier ${String(get("supplier"))}` : "",
    get("rate") !== undefined && get("rate") !== null ? `Rate ${inr(num(get("rate")))}` : "",
    get("quantity") !== undefined && get("quantity") !== null
      ? `Qty ${num(get("quantity")).toLocaleString("en-IN")}`
      : "",
  ].filter(Boolean);
  return <span>{parts.length ? parts.join(" · ") : "—"}</span>;
}

function Page() {
  const qc = useQueryClient();
  const { canDecide, decider } = useApprovalGate();
  const [projectId, setProjectId] = useState("");
  const [tab, setTab] = useState<"pending" | "decided">("pending");
  const [status, setStatus] = useState("");
  const [notes, setNotes] = useState<Record<string, string>>({});

  const projectsQuery = useQuery({
    queryKey: ["site_projects", "approvals"],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_projects")
        .select("id,name,location")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
  const projects = projectsQuery.data ?? [];
  const activeId = projectId || projects[0]?.id || "";

  const requests = useChangeRequests(activeId, tab);
  const rows = requests.data ?? [];

  const pendingSaving = useMemo(
    () => rows.filter((r) => r.status === "pending").reduce((s, r) => s + num(r.saving), 0),
    [rows],
  );

  const refresh = async () => {
    await qc.invalidateQueries({ queryKey: ["boq_change_requests"] });
    await qc.invalidateQueries({ queryKey: ["boq_items"] });
  };

  const decide = useMutation({
    mutationFn: async ({ req, action }: { req: ChangeRequest; action: "approve" | "reject" }) => {
      const note = notes[req.id] ?? "";
      if (action === "approve") await approveChangeRequest(req, decider, note);
      else await rejectChangeRequest(req, decider, note);
      return action;
    },
    onSuccess: async (action) => {
      setStatus(
        action === "approve"
          ? "Approved and committed to the BOQ."
          : "Rejected — the BOQ line is unchanged.",
      );
      await refresh();
    },
    onError: (e: Error) => setStatus(`Could not save the decision: ${e.message}`),
  });

  return (
    <Shell title="Change Approvals">
      <div className="space-y-6">
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/80">
            Cost governance
          </p>
          <h1 className="flex items-center gap-3 text-2xl font-extrabold uppercase tracking-tight text-foreground sm:text-3xl">
            <ShieldCheck className="h-7 w-7 text-primary" />
            Partner Approvals
          </h1>
          <p className="max-w-3xl text-sm text-muted-foreground">
            Cost-affecting BOQ edits and cheaper brand suggestions are held here. Nothing changes in
            the BOQ until a partner approves it.
          </p>
        </header>

        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Project
          </span>
          <select
            value={activeId}
            onChange={(e) => {
              setProjectId(e.target.value);
              setStatus("");
            }}
            className="min-w-[220px] rounded-xl border border-border bg-background px-3 py-2 text-sm"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} {p.location ? `· ${p.location}` : ""}
              </option>
            ))}
          </select>
          <div className="ml-auto flex flex-wrap gap-2">
            {(["pending", "decided"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`rounded-xl px-4 py-2 text-sm font-semibold ${
                  tab === t
                    ? "bg-primary text-primary-foreground"
                    : "border border-border bg-background text-foreground"
                }`}
              >
                {t === "pending" ? "Awaiting approval" : "Decision history"}
              </button>
            ))}
            <Link
              to="/cost-dashboard"
              className="inline-flex items-center gap-2 rounded-xl border border-primary/40 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary"
            >
              <IndianRupee className="h-4 w-4" />
              Cost dashboard
            </Link>
          </div>
        </div>

        {tab === "pending" ? (
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-border bg-card p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Waiting on partners
              </p>
              <p className="mt-1 text-xl font-bold text-foreground">{rows.length}</p>
            </div>
            <div className="rounded-2xl border border-emerald-600/30 bg-emerald-600/5 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Savings if all approved
              </p>
              <p className="mt-1 text-xl font-bold text-foreground">
                {inr(Math.max(0, pendingSaving))}
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Your rights
              </p>
              <p className="mt-1 text-sm font-semibold text-foreground">
                {canDecide ? "You can approve or reject" : "You can raise requests only"}
              </p>
            </div>
          </div>
        ) : null}

        {status ? (
          <p className="rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-foreground">
            {status}
          </p>
        ) : null}

        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="flex items-center gap-2 border-b border-border bg-muted/40 px-4 py-3">
            {tab === "pending" ? (
              <ShieldCheck className="h-4 w-4 text-primary" />
            ) : (
              <History className="h-4 w-4 text-primary" />
            )}
            <h2 className="text-sm font-bold uppercase tracking-wider text-primary">
              {tab === "pending" ? `Awaiting approval (${rows.length})` : `History (${rows.length})`}
            </h2>
          </div>

          {requests.isPending ? (
            <p className="p-6 text-sm text-muted-foreground">Loading…</p>
          ) : rows.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">
              {tab === "pending"
                ? "No changes are waiting. Edits made in the BOQ Engine or Budget Fit will appear here for sign-off."
                : "No decisions recorded yet."}
            </p>
          ) : (
            <div className="divide-y divide-border">
              {rows.map((r) => (
                <div key={r.id} className="space-y-3 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">
                        {r.trade || "BOQ"} · {r.source}
                      </p>
                      <p className="text-sm font-semibold text-foreground">{r.description}</p>
                      <p className="text-xs text-muted-foreground">
                        Raised by {r.requested_by_name || "member"} ·{" "}
                        {new Date(r.created_at).toLocaleString("en-IN")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-sm font-bold ${
                          num(r.saving) > 0
                            ? "text-emerald-600"
                            : num(r.saving) < 0
                              ? "text-destructive"
                              : "text-muted-foreground"
                        }`}
                      >
                        {num(r.saving) === 0
                          ? "no cost change"
                          : `${num(r.saving) > 0 ? "saves" : "adds"} ${inr(Math.abs(num(r.saving)))}`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {inr(num(r.current_amount))} → {inr(num(r.proposed_amount))}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-2 text-xs sm:grid-cols-2">
                    <div className="rounded-xl border border-border bg-background p-3">
                      <p className="font-semibold uppercase tracking-wider text-muted-foreground">
                        Now
                      </p>
                      <p className="mt-1 text-foreground">
                        <Values values={r.current_values ?? {}} />
                      </p>
                    </div>
                    <div className="rounded-xl border border-sky-500/40 bg-sky-500/5 p-3">
                      <p className="font-semibold uppercase tracking-wider text-sky-700">Proposed</p>
                      <p className="mt-1 text-foreground">
                        <Values values={r.proposed_values ?? {}} />
                      </p>
                    </div>
                  </div>

                  {r.note ? (
                    <p className="text-xs text-muted-foreground">Reason: {r.note}</p>
                  ) : null}

                  {r.status === "pending" ? (
                    canDecide ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <input
                          value={notes[r.id] ?? ""}
                          onChange={(e) =>
                            setNotes((n) => ({ ...n, [r.id]: e.target.value }))
                          }
                          placeholder="Remark for the record (optional)"
                          className="min-w-[200px] flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => decide.mutate({ req: r, action: "approve" })}
                          disabled={decide.isPending}
                          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
                        >
                          <Check className="h-4 w-4" /> Approve &amp; commit
                        </button>
                        <button
                          type="button"
                          onClick={() => decide.mutate({ req: r, action: "reject" })}
                          disabled={decide.isPending}
                          className="inline-flex items-center gap-2 rounded-xl border border-destructive/40 bg-destructive/5 px-4 py-2 text-sm font-semibold text-destructive disabled:opacity-60"
                        >
                          <X className="h-4 w-4" /> Reject
                        </button>
                      </div>
                    ) : (
                      <p className="text-xs font-semibold text-amber-600">
                        Waiting for Admin / PM approval.
                      </p>
                    )
                  ) : (
                    <p className="text-xs font-semibold text-muted-foreground">
                      {r.status === "approved" ? "Approved" : "Rejected"} by{" "}
                      {r.decided_by_name || "partner"}
                      {r.decided_at
                        ? ` on ${new Date(r.decided_at).toLocaleString("en-IN")}`
                        : ""}
                      {r.decision_note ? ` — ${r.decision_note}` : ""}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Shell>
  );
}
