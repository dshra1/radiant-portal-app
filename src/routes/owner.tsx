import { createFileRoute, Link } from "@tanstack/react-router";
import { Fragment, useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Building2,
  CheckCircle2,
  ClipboardList,
  HardHat,
  IndianRupee,
  MessageSquarePlus,
  Presentation,
  Settings2,
} from "lucide-react";
import { toast } from "sonner";
import { Shell } from "@/components/saha/Shell";
import { HandoverForecast } from "@/components/saha/HandoverForecast";
import { supabase } from "@/integrations/supabase/client";
import { useActiveProject } from "@/hooks/useActiveProject";
import { useAccess } from "@/lib/access";
import { boqTotals } from "@/lib/boq-totals";
import { useOwnerLiability } from "@/lib/owner-liability";
import { fmtDay, plannedPctToday } from "@/lib/programme-progress";
import { useSiteWeek } from "@/lib/site-week";
import {
  STATUS_LABEL,
  chooseByOf,
  deltaOf,
  lineIncl,
  linesOf,
  optionsFor,
  sameName,
  useMyOwnerName,
  usePortalData,
  type OptionRow,
  type SelectionRow,
} from "@/lib/owner-portal";
import type { FlatLineRow } from "@/lib/flats";

type Tab = "presentation" | "overview" | "common" | "flat" | "requests" | "options";
const TABS: Tab[] = ["presentation", "overview", "common", "flat", "requests", "options"];

export const Route = createFileRoute("/owner")({
  validateSearch: (s: Record<string, unknown>): { tab?: Tab; owner?: string } => {
    const out: { tab?: Tab; owner?: string } = {};
    if (TABS.includes(s["tab"] as Tab)) out.tab = s["tab"] as Tab;
    if (typeof s["owner"] === "string" && s["owner"]) out.owner = s["owner"];
    return out;
  },
  head: () => ({
    meta: [
      { title: "Owner's Portal | Saha OS" },
      {
        name: "description",
        content:
          "For each landowner: progress, common and individual costs, choices for their own flat, approvals and change requests.",
      },
    ],
  }),
  component: Page,
});

const rs = (v: number) => `₹${Math.round(v).toLocaleString("en-IN")}`;
const cr = (v: number) =>
  Math.abs(v) >= 1e7 ? `₹${(v / 1e7).toFixed(2)} Cr` : `₹${(v / 1e5).toFixed(2)} L`;
const signed = (v: number) =>
  Math.round(v) === 0 ? "—" : `${v > 0 ? "+" : "−"}${rs(Math.abs(v))}`;

function Page() {
  const project = useActiveProject();
  const search = Route.useSearch();
  const { access } = useAccess();
  const isManager = Boolean(access?.isAdmin || access?.roles.includes("pm"));
  const me = useMyOwnerName(access?.userId);
  const data = usePortalData(project.id);
  const [tab, setTab] = useState<Tab>(search.tab ?? "overview");
  const [viewAs, setViewAs] = useState(search.owner ?? "");

  const owners = useMemo(() => data.data?.owners ?? [], [data.data]);
  const ownerName = isManager ? viewAs || owners[0]?.name || "" : (me.data ?? "");
  useEffect(() => {
    if (isManager && !viewAs && owners[0]) setViewAs(owners[0].name);
  }, [isManager, viewAs, owners]);

  const owner = owners.find((o) => sameName(o.name, ownerName));
  const myFlats = (data.data?.flats ?? []).filter((f) => sameName(f.owner_name, ownerName));

  if (!isManager && me.isSuccess && !me.data)
    return (
      <Shell title="Owner's Portal">
        <div className="mx-auto max-w-xl rounded-xl border border-border bg-card p-6 text-sm">
          <h1 className="text-lg font-bold">Your login is not linked to a landowner yet</h1>
          <p className="mt-2 text-muted-foreground">
            The admin links each landowner&apos;s login to their name in Access &amp; Permissions.
            Once that is done this page shows your share of the costs, your flats and their options,
            and the progress on site.
          </p>
        </div>
      </Shell>
    );

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "presentation", label: "Presentation", icon: <Presentation className="size-4" /> },
    { key: "overview", label: "Overview & progress", icon: <HardHat className="size-4" /> },
    { key: "common", label: "Common works", icon: <IndianRupee className="size-4" /> },
    {
      key: "flat",
      label: `My flat${myFlats.length > 1 ? "s" : ""}`,
      icon: <Building2 className="size-4" />,
    },
    { key: "requests", label: "Requests", icon: <MessageSquarePlus className="size-4" /> },
    ...(isManager
      ? [{ key: "options" as Tab, label: "Options (PMC)", icon: <Settings2 className="size-4" /> }]
      : []),
  ];

  return (
    <Shell title="Owner's Portal">
      <div className="flex flex-col gap-4 px-4 pb-16 pt-4 md:px-6">
        <header className="rounded-2xl border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{project.name}</p>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold">
                {ownerName
                  ? `${ownerName}${owner ? ` · ${owner.share}% share` : ""}`
                  : "Owner's Portal"}
              </h1>
              <p className="text-sm text-muted-foreground">
                {myFlats.length
                  ? `Flats: ${myFlats.map((f) => f.flat_no).join(", ")}`
                  : "No flat allotted yet: individual works are shared by % until flats are allotted."}
              </p>
            </div>
            {isManager && owners.length > 0 && (
              <label className="text-sm">
                View as{" "}
                <select
                  className="ml-1 rounded-md border border-border bg-background px-2 py-1"
                  value={viewAs}
                  onChange={(e) => setViewAs(e.target.value)}
                >
                  {owners.map((o) => (
                    <option key={o.name} value={o.name}>
                      {o.name} ({o.share}%)
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {tabs.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-semibold ${tab === t.key ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background"}`}
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </div>
        </header>

        {tab === "presentation" ? (
          <OwnerPresentation ownerName={ownerName} lock={!isManager} />
        ) : data.isLoading || !ownerName ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : tab === "overview" ? (
          <Overview projectId={project.id} ownerName={ownerName} />
        ) : tab === "common" ? (
          <CommonWorks projectId={project.id} ownerName={ownerName} share={owner?.share ?? 0} />
        ) : tab === "flat" ? (
          <MyFlats projectId={project.id} ownerName={ownerName} isManager={isManager} />
        ) : tab === "requests" ? (
          <Requests projectId={project.id} ownerName={ownerName} isManager={isManager} />
        ) : (
          <Options projectId={project.id} />
        )}
      </div>
    </Shell>
  );
}

// ---------------------------------------------------------------- presentation
/**
 * The landowners' presentation (plans, services, branded specs and lump-sum
 * costs for 77:76 and 78:93) is a static page in public/landowner-presentation.
 * The owner's name preselects them inside the page.
 */
function OwnerPresentation({ ownerName, lock }: { ownerName: string; lock: boolean }) {
  // A landowner sees only their own flats / wing; the PMC can switch owners.
  const src = `/landowner-presentation/index.html${ownerName ? `?owner=${encodeURIComponent(ownerName)}${lock ? "&lock=1" : ""}` : ""}`;
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm text-muted-foreground">
        Plans, furniture, electrical, plumbing, makes and finishes, and the common, unit and total
        cost for each landowner.{" "}
        <a className="font-semibold text-primary underline" href={src} target="_blank" rel="noreferrer">
          Open full screen
        </a>
      </p>
      <iframe
        key={src}
        title="Landowners' presentation"
        src={src}
        className="h-[calc(100vh-14rem)] min-h-[560px] w-full rounded-xl border border-border bg-white"
      />
    </div>
  );
}

// ---------------------------------------------------------------- overview
function Overview({ projectId, ownerName }: { projectId: string; ownerName: string }) {
  const week = useSiteWeek(projectId);
  const li = useOwnerLiability(projectId);
  const mine = li.data?.list.find((l) => sameName(l.name, ownerName));
  const reqs = useQuery({
    queryKey: ["owner_requests", "portal", projectId, ownerName],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("owner_requests")
        .select("id,title,due_date,status,audience,target_owner_name,created_at")
        .eq("project_id", projectId)
        .eq("status", "open")
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data ?? []).filter(
        (r) =>
          r.audience === "all" || !r.target_owner_name || sameName(r.target_owner_name, ownerName),
      );
    },
  });
  const stages = useMemo(() => week.data?.stages ?? [], [week.data]);
  const prog = useMemo(() => {
    let w = 0,
      plan = 0,
      act = 0;
    for (const s of stages) {
      const d = Math.max(1, s.durationDays || 1);
      w += d;
      plan += d * plannedPctToday({ planned_start: s.plannedStart, planned_end: s.plannedEnd });
      act += d * s.actualPct;
    }
    return { planned: w ? plan / w : 0, actual: w ? act / w : 0 };
  }, [stages]);
  const groups = useMemo(() => {
    const m = new Map<string, { n: number; done: number; w: number; act: number }>();
    for (const s of stages) {
      const g = m.get(s.group) ?? { n: 0, done: 0, w: 0, act: 0 };
      g.n++;
      if (s.actualPct >= 100 || s.closedAt) g.done++;
      const d = Math.max(1, s.durationDays || 1);
      g.w += d;
      g.act += d * s.actualPct;
      m.set(s.group, g);
    }
    return [...m.entries()];
  }, [stages]);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className="rounded-xl border border-border bg-card p-4">
        <h2 className="flex items-center gap-2 font-semibold">
          <HardHat className="size-4 text-primary" /> Progress on site
        </h2>
        <HandoverForecast projectId={projectId} linked={false} className="mt-2" />
        <div className="mt-3 grid grid-cols-2 gap-3">
          <Tile label="Work done (weighted)" value={`${prog.actual.toFixed(1)}%`} />
          <Tile label="Planned by today" value={`${prog.planned.toFixed(1)}%`} />
        </div>
        <h3 className="mt-4 text-sm font-semibold">This week</h3>
        <ul className="mt-1 space-y-1 text-sm">
          {(week.data?.now ?? []).slice(0, 6).map((s) => (
            <li key={s.code}>
              <b>{s.code}</b> {s.name.replace(/^[A-Z0-9]+ · /, "")}{" "}
              <span className="text-muted-foreground">· {s.actualPct}% done</span>
            </li>
          ))}
          {!(week.data?.now ?? []).length && (
            <li className="text-muted-foreground">
              Nothing on site yet. Ground work starts {fmtDay(week.data?.startDate ?? null)}.
            </li>
          )}
        </ul>
        <h3 className="mt-3 text-sm font-semibold">Coming next</h3>
        <ul className="mt-1 space-y-1 text-sm">
          {(week.data?.next ?? []).slice(0, 5).map((s) => (
            <li key={s.code}>
              <b>{s.code}</b> {s.name.replace(/^[A-Z0-9]+ · /, "")}{" "}
              <span className="text-muted-foreground">· from {fmtDay(s.plannedStart)}</span>
            </li>
          ))}
        </ul>
        <h3 className="mt-3 text-sm font-semibold">Stage of work</h3>
        <div className="mt-1 space-y-1.5">
          {groups.map(([g, v]) => (
            <div key={g} className="text-xs">
              <div className="flex justify-between">
                <span>{g}</span>
                <span className="text-muted-foreground">
                  {v.done}/{v.n} stages · {(v.act / v.w).toFixed(0)}%
                </span>
              </div>
              <div className="h-1.5 rounded bg-muted">
                <div
                  className="h-1.5 rounded bg-primary"
                  style={{ width: `${Math.min(100, v.act / v.w)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-3 text-sm">
          <Link to="/site-media" className="text-primary underline">
            Site photos
          </Link>
          <Link to="/quality" className="text-primary underline">
            Quality checks and cube results
          </Link>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-4">
        <h2 className="flex items-center gap-2 font-semibold">
          <IndianRupee className="size-4 text-primary" /> Your money
        </h2>
        {mine ? (
          <>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <Tile label="Common works (your share)" value={cr(mine.common.total)} />
              <Tile label="Your flats (individual works)" value={cr(mine.ownFlats)} />
              <Tile label="Share of unallotted flats" value={cr(mine.unallotted)} />
              <Tile label="Total liability" value={cr(mine.total)} strong />
              <Tile label="Received so far" value={cr(mine.received)} />
              <Tile label="Balance to fund" value={cr(mine.balance)} strong />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Common works: BOQ incl. GST + contingency × your share. Individual works: your flats
              at our specification plus the extras you chose and the PMC accepted.
            </p>
          </>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">No figures yet.</p>
        )}
        <h3 className="mt-4 text-sm font-semibold">Waiting for your decision</h3>
        <ul className="mt-1 space-y-1 text-sm">
          {(reqs.data ?? []).map((r) => (
            <li key={r.id} className="flex items-start justify-between gap-2">
              <span>
                {r.title}
                {r.due_date && (
                  <span className="text-muted-foreground"> · by {fmtDay(r.due_date)}</span>
                )}
              </span>
              <Link
                to="/approvals"
                search={{ tab: "owner" } as never}
                className="shrink-0 text-primary underline"
              >
                Respond
              </Link>
            </li>
          ))}
          {!(reqs.data ?? []).length && <li className="text-muted-foreground">Nothing pending.</li>}
        </ul>
        <div className="mt-3 flex flex-wrap gap-3 text-sm">
          <Link to="/capital-ledger" className="text-primary underline">
            Calls and receipts
          </Link>
          <Link to="/landowners-investment" className="text-primary underline">
            Full break-up
          </Link>
        </div>
      </section>
    </div>
  );
}

// ---------------------------------------------------------------- common works
function CommonWorks({
  projectId,
  ownerName,
  share,
}: {
  projectId: string;
  ownerName: string;
  share: number;
}) {
  const boq = useQuery({
    queryKey: ["boq_items", "owner-common", projectId],
    queryFn: async () => {
      const [b, p] = await Promise.all([
        supabase
          .from("boq_items")
          .select("quantity,rate,gst_pct,work_scope,package,package_no,item_code")
          .eq("project_id", projectId),
        supabase
          .from("site_projects")
          .select("contingency_pct,landowners")
          .eq("id", projectId)
          .maybeSingle(),
      ]);
      if (b.error) throw b.error;
      const c = p.data?.contingency_pct ?? 5;
      const own = (Array.isArray(p.data?.landowners) ? p.data.landowners : []) as {
        share_pct?: number;
      }[];
      const totalShare = own.reduce((s, o) => s + Number(o.share_pct ?? 0), 0) || 100;
      const t = boqTotals(
        (b.data ?? []).filter((l) => l.work_scope !== "individual"),
        Number(c),
      );
      return { t, c: Number(c), totalShare };
    },
  });
  const [ask, setAsk] = useState<string | null>(null);
  if (!boq.data) return <p className="text-sm text-muted-foreground">Loading…</p>;
  const { t, c, totalShare } = boq.data;
  const f = share / totalShare;
  const k = 1 + c / 100;
  return (
    <section className="rounded-xl border border-border bg-card">
      <div className="border-b border-border p-4">
        <h2 className="font-semibold">Common works, by package</h2>
        <p className="text-sm text-muted-foreground">
          Structure, external walls, windows, lift, common areas and services up to each flat. These
          are shared by the landowners&apos; %: your share {share}%. Amounts include GST and {c}%
          contingency.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-muted/40 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-2">Package</th>
              <th className="px-3 py-2 text-right">Building total</th>
              <th className="px-3 py-2 text-right">Your share</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {t.packages.map((p) => (
              <Fragment key={p.name}>
                <tr className="border-t border-border">
                  <td className="px-3 py-2">{p.name}</td>
                  <td className="px-3 py-2 text-right tnum">{cr(p.incl * k)}</td>
                  <td className="px-3 py-2 text-right font-semibold tnum">{cr(p.incl * k * f)}</td>
                  <td className="px-3 py-2 text-right">
                    <button
                      type="button"
                      className="text-xs text-primary underline"
                      onClick={() => setAsk(ask === p.name ? null : p.name)}
                    >
                      Request a change
                    </button>
                  </td>
                </tr>
                {ask === p.name && (
                  <tr>
                    <td colSpan={4} className="bg-background px-3 py-3">
                      <RequestForm
                        projectId={projectId}
                        ownerName={ownerName}
                        scope="common"
                        subject={`Common works: ${p.name}`}
                        onDone={() => setAsk(null)}
                      />
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
          <tfoot className="border-t-2 border-border font-semibold">
            <tr>
              <td className="px-3 py-2">Total common works</td>
              <td className="px-3 py-2 text-right tnum">{cr(t.subtotal.incl * k)}</td>
              <td className="px-3 py-2 text-right tnum">{cr(t.subtotal.incl * k * f)}</td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------- my flats
function MyFlats({
  projectId,
  ownerName,
  isManager,
}: {
  projectId: string;
  ownerName: string;
  isManager: boolean;
}) {
  const q = usePortalData(projectId);
  const flats = (q.data?.flats ?? []).filter((f) => sameName(f.owner_name, ownerName));
  const [flatNo, setFlatNo] = useState("");
  const flat = flats.find((f) => f.flat_no === flatNo) ?? flats[0];
  if (!flats.length)
    return (
      <div className="rounded-xl border border-border bg-card p-6 text-sm">
        No flat is allotted to {ownerName} yet. When the PMC sets the flat owners on the Flats page,
        your flats and their options appear here.
      </div>
    );
  return (
    <div className="flex flex-col gap-3">
      {flats.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {flats.map((f) => (
            <button
              key={f.flat_no}
              type="button"
              onClick={() => setFlatNo(f.flat_no)}
              className={`rounded-lg border px-3 py-1.5 text-sm font-semibold ${flat?.flat_no === f.flat_no ? "border-primary bg-primary/10" : "border-border bg-card"}`}
            >
              Flat {f.flat_no}
            </button>
          ))}
        </div>
      )}
      {flat && (
        <FlatChoices
          key={flat.id}
          projectId={projectId}
          flatNo={flat.flat_no}
          typeCode={flat.type_code}
          ownerName={ownerName}
          isManager={isManager}
        />
      )}
    </div>
  );
}

function FlatChoices({
  projectId,
  flatNo,
  typeCode,
  ownerName,
  isManager,
}: {
  projectId: string;
  flatNo: string;
  typeCode: string;
  ownerName: string;
  isManager: boolean;
}) {
  const projectName = useActiveProject().name;
  const qc = useQueryClient();
  const q = usePortalData(projectId);
  const { access } = useAccess();
  const type = q.data?.types.find((t) => t.code === typeCode);
  const lines = linesOf(type?.lines);
  const options = q.data?.options ?? [];
  const sels = (q.data?.selections ?? []).filter((s) => s.flat_no === flatNo);
  const selOf = (code: string) => sels.find((s) => s.item_code === code);
  const [pick, setPick] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [ask, setAsk] = useState<string | null>(null);
  const refresh = () => qc.invalidateQueries({ queryKey: ["owner_portal", projectId] });

  const chosen = (l: FlatLineRow): OptionRow | null => {
    const id = pick[l.code] ?? selOf(l.code)?.option_id ?? "";
    return options.find((o) => o.id === id) ?? null;
  };
  const groups = useMemo(() => {
    const m = new Map<string, FlatLineRow[]>();
    for (const l of lines) m.set(l.pkg, [...(m.get(l.pkg) ?? []), l]);
    return [...m.entries()];
  }, [lines]);
  const base = lines.reduce((s, l) => s + lineIncl(l.qty, l.rate, l.gst), 0);
  const extra = lines.reduce((s, l) => s + deltaOf(l, chosen(l)), 0);
  const accepted = sels
    .filter((s) => s.status === "accepted")
    .reduce((t, s) => t + Number(s.delta), 0);
  const waiting = sels.filter((s) => s.status === "owner_approved");

  async function save(status: "draft" | "owner_approved") {
    setBusy(true);
    try {
      const rows = lines
        .filter((l) => {
          const s = selOf(l.code);
          if (s?.status === "accepted") return false; // locked
          return status === "owner_approved" || pick[l.code] !== undefined;
        })
        .map((l) => {
          const opt = chosen(l);
          return {
            project_id: projectId,
            flat_no: flatNo,
            item_code: l.code,
            option_id: opt?.id ?? null,
            delta: Math.round(deltaOf(l, opt)),
            status,
          };
        });
      for (let i = 0; i < rows.length; i += 100) {
        const r = await supabase
          .from("flat_selections")
          .upsert(rows.slice(i, i + 100), { onConflict: "project_id,flat_no,item_code" });
        if (r.error) throw r.error;
      }
      if (status === "owner_approved") {
        await supabase.from("notifications").insert({
          title: `${ownerName} approved the selections for flat ${flatNo}`,
          body: `${rows.length} items; extras ${signed(extra)} incl. GST over our specification. Accept them into the plan on the Owner's Portal.`,
          category: "Owner",
          priority: "High",
          link: "/owner",
          project_id: projectId,
          sender_id: access?.userId ?? null,
        });
      }
      setPick({});
      toast.success(status === "draft" ? "Choices saved" : "Approved and sent to the PMC");
      await refresh();
    } catch (e) {
      toast.error((e as Error).message);
    }
    setBusy(false);
  }

  async function decide(accept: boolean) {
    setBusy(true);
    try {
      const ids = waiting.map((s) => s.id);
      if (!ids.length) throw new Error("No selections waiting for the PMC");
      const r = await supabase
        .from("flat_selections")
        .update({ status: accept ? "accepted" : "rejected" })
        .in("id", ids);
      if (r.error) throw r.error;
      // The flat's extras = sum of the accepted differences.
      const all = await supabase
        .from("flat_selections")
        .select("delta,status")
        .eq("project_id", projectId)
        .eq("flat_no", flatNo);
      if (all.error) throw all.error;
      const total = (all.data ?? [])
        .filter((s) => s.status === "accepted")
        .reduce((t, s) => t + Number(s.delta), 0);
      const up = await supabase
        .from("flats")
        .update({ owner_extra: Math.round(total) })
        .eq("project_id", projectId)
        .eq("flat_no", flatNo);
      if (up.error) throw up.error;
      const link = q.data?.links.find((l) => sameName(l.owner_name, ownerName));
      await supabase.from("notifications").insert({
        title: accept
          ? `Your selections for flat ${flatNo} are in the plan`
          : `Your selections for flat ${flatNo} need another look`,
        body: accept
          ? `Extras ${signed(total)} incl. GST are added to your flat's individual works.`
          : "See the PMC notes on the Owner's Portal.",
        category: "Owner",
        priority: "Normal",
        link: "/owner?tab=flat",
        project_id: projectId,
        sender_id: access?.userId ?? null,
        recipient_id: link?.user_id ?? null,
      });
      const toBuy = waiting.filter((s) => s.option_id).length;
      if (accept && toBuy)
        await supabase.from("notifications").insert({
          title: `Flat ${flatNo}: ${toBuy} owner's choice${toBuy > 1 ? "s" : ""} to buy`,
          body: "Accepted into the plan. Add to the department tender or raise a PO for this flat (Procurement → Owners' extras to buy).",
          category: "Procurement",
          priority: "Normal",
          link: "/procurement",
          project_id: projectId,
          sender_id: access?.userId ?? null,
        });
      await qc.invalidateQueries({ queryKey: ["owner_extras", projectId] });
      toast.success(
        accept ? `Accepted: flat ${flatNo} extras ${signed(total)}` : "Sent back to the owner",
      );
      await refresh();
      await qc.invalidateQueries({ queryKey: ["owner_liability", projectId] });
      await qc.invalidateQueries({ queryKey: ["flats", projectId] });
    } catch (e) {
      toast.error((e as Error).message);
    }
    setBusy(false);
  }

  if (!type) return <p className="text-sm text-muted-foreground">Flat type not found.</p>;
  return (
    <section className="rounded-xl border border-border bg-card">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border p-4">
        <div>
          <h2 className="font-semibold">
            Flat {flatNo} · {type.label}
          </h2>
          <p className="max-w-3xl text-sm text-muted-foreground">
            These are your flat&apos;s individual works at our specification. Where the PMC has
            added alternatives, pick one from the list: the difference (incl. GST) shows at once.
            Approve when you are happy; the PMC then accepts it into the plan, and the purchase
            orders, stage payments and your break-up follow it. Choose each item by the date shown
            so it can be ordered in time.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 text-right text-sm">
          <Tile label="Our specification" value={cr(base)} />
          <Tile label="Your extras (shown)" value={signed(extra)} />
          <Tile label="Extras in the plan" value={signed(accepted)} strong />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] text-sm">
          <thead className="bg-muted/40 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-2">Item</th>
              <th className="px-3 py-2 text-right">Qty</th>
              <th className="px-3 py-2">Our specification</th>
              <th className="px-3 py-2">Your choice</th>
              <th className="px-3 py-2 text-right">Difference</th>
              <th className="px-3 py-2">Choose by</th>
              <th className="px-3 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {groups.map(([pkg, ls]) => (
              <Fragment key={pkg}>
                <tr className="bg-muted/20">
                  <td
                    colSpan={7}
                    className="px-3 py-1.5 text-xs font-bold uppercase text-muted-foreground"
                  >
                    {pkg}
                  </td>
                </tr>
                {ls.map((l) => {
                  const opts = optionsFor(options, l.code, typeCode);
                  const s = selOf(l.code);
                  const locked = s?.status === "accepted";
                  const value = pick[l.code] ?? s?.option_id ?? "";
                  const by = chooseByOf(l.code, projectName);
                  const late = by && !s && by < new Date().toISOString().slice(0, 10);
                  return (
                    <Fragment key={l.code}>
                      <tr className="border-t border-border/60 align-top">
                        <td className="px-3 py-2">
                          <span className="text-muted-foreground">{l.code}</span> {l.item}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2 text-right tnum">
                          {l.qty.toLocaleString("en-IN")} {l.unit}
                        </td>
                        <td className="px-3 py-2 text-xs">
                          {l.make || "—"}
                          <span className="block text-muted-foreground">
                            {rs(lineIncl(l.qty, l.rate, l.gst))}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          {opts.length ? (
                            <select
                              disabled={locked || busy}
                              value={value}
                              onChange={(e) => setPick({ ...pick, [l.code]: e.target.value })}
                              className="w-full max-w-[260px] rounded-md border border-border bg-background px-2 py-1 text-sm disabled:opacity-70"
                            >
                              <option value="">Our specification</option>
                              {opts.map((o) => (
                                <option key={o.id} value={o.id}>
                                  {o.label}
                                  {o.make ? ` · ${o.make}` : ""} ({signed(deltaOf(l, o))})
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              Our specification (no alternatives yet)
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-right tnum">
                          {signed(deltaOf(l, chosen(l)))}
                        </td>
                        <td
                          className={`whitespace-nowrap px-3 py-2 text-xs ${late ? "font-semibold text-red-600" : ""}`}
                        >
                          {by ? fmtDay(by) : "—"}
                        </td>
                        <td className="px-3 py-2 text-xs">
                          {s ? STATUS_LABEL[s.status] : "Not chosen"}
                          {s?.pmc_note && (
                            <span className="block text-muted-foreground">PMC: {s.pmc_note}</span>
                          )}
                          {!locked && (
                            <button
                              type="button"
                              className="block text-primary underline"
                              onClick={() => setAsk(ask === l.code ? null : l.code)}
                            >
                              Ask for a change
                            </button>
                          )}
                        </td>
                      </tr>
                      {ask === l.code && (
                        <tr>
                          <td colSpan={7} className="bg-background px-3 py-3">
                            <RequestForm
                              projectId={projectId}
                              ownerName={ownerName}
                              scope="flat"
                              flatNo={flatNo}
                              itemCode={l.code}
                              subject={`Flat ${flatNo}: ${l.item}`}
                              onDone={() => setAsk(null)}
                            />
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center gap-2 border-t border-border p-4">
        <button
          type="button"
          disabled={busy || !Object.keys(pick).length}
          onClick={() => void save("draft")}
          className="rounded-lg border border-border px-3 py-1.5 text-sm font-semibold disabled:opacity-50"
        >
          Save choices
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => void save("owner_approved")}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
        >
          <CheckCircle2 className="size-4" /> Approve my flat&apos;s selections
        </button>
        {isManager && (
          <>
            <span className="mx-2 text-xs text-muted-foreground">
              PMC: {waiting.length} item{waiting.length === 1 ? "" : "s"} waiting
            </span>
            <button
              type="button"
              disabled={busy || !waiting.length}
              onClick={() => void decide(true)}
              className="rounded-lg bg-emerald-700 px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              Accept into the plan
            </button>
            <button
              type="button"
              disabled={busy || !waiting.length}
              onClick={() => void decide(false)}
              className="rounded-lg border border-border px-3 py-1.5 text-sm font-semibold disabled:opacity-50"
            >
              Send back
            </button>
          </>
        )}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------- requests
function RequestForm({
  projectId,
  ownerName,
  scope,
  flatNo = "",
  itemCode = "",
  subject,
  onDone,
}: {
  projectId: string;
  ownerName: string;
  scope: "common" | "flat";
  flatNo?: string;
  itemCode?: string;
  subject: string;
  onDone: () => void;
}) {
  const qc = useQueryClient();
  const { access } = useAccess();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-semibold">{subject}</p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        placeholder="What would you like changed, and why?"
        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
      />
      <div className="flex gap-2">
        <button
          type="button"
          disabled={busy || !text.trim()}
          onClick={async () => {
            setBusy(true);
            const r = await supabase.from("owner_change_requests").insert({
              project_id: projectId,
              owner_name: ownerName,
              scope,
              flat_no: flatNo,
              item_code: itemCode,
              subject,
              details: text.trim(),
            });
            if (r.error) toast.error(r.error.message);
            else {
              await supabase.from("notifications").insert({
                title: `Change request from ${ownerName}: ${subject}`,
                body: text.trim().slice(0, 300),
                category: "Owner",
                priority: "High",
                link: "/owner?tab=requests",
                project_id: projectId,
                sender_id: access?.userId ?? null,
              });
              toast.success("Request sent to the PMC");
              await qc.invalidateQueries({ queryKey: ["owner_portal", projectId] });
              onDone();
            }
            setBusy(false);
          }}
          className="rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
        >
          Send request
        </button>
        <button
          type="button"
          onClick={onDone}
          className="rounded-lg border border-border px-3 py-1.5 text-sm"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function Requests({
  projectId,
  ownerName,
  isManager,
}: {
  projectId: string;
  ownerName: string;
  isManager: boolean;
}) {
  const qc = useQueryClient();
  const q = usePortalData(projectId);
  const list = (q.data?.requests ?? []).filter(
    (r) => isManager || sameName(r.owner_name, ownerName),
  );
  const [asking, setAsking] = useState(false);
  const [reply, setReply] = useState<Record<string, string>>({});
  async function respond(id: string, status: "accepted" | "declined" | "done") {
    const r = await supabase
      .from("owner_change_requests")
      .update({ status, response: reply[id] ?? "" })
      .eq("id", id);
    if (r.error) toast.error(r.error.message);
    else {
      const req = list.find((x) => x.id === id);
      const link = q.data?.links.find((l) => req && sameName(l.owner_name, req.owner_name));
      await supabase.from("notifications").insert({
        title: `Your request "${req?.subject ?? ""}" is ${status}`,
        body: reply[id] ?? "",
        category: "Owner",
        priority: "Normal",
        link: "/owner?tab=requests",
        project_id: projectId,
        recipient_id: link?.user_id ?? null,
      });
      toast.success("Response sent");
      await qc.invalidateQueries({ queryKey: ["owner_portal", projectId] });
    }
  }
  return (
    <section className="rounded-xl border border-border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border p-4">
        <div>
          <h2 className="flex items-center gap-2 font-semibold">
            <ClipboardList className="size-4 text-primary" /> Change requests
          </h2>
          <p className="text-sm text-muted-foreground">
            {isManager
              ? "All owners' requests. Reply and mark accepted, declined or done."
              : "Your requests to the PMC and their replies."}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setAsking(!asking)}
          className="rounded-lg border border-border px-3 py-1.5 text-sm font-semibold"
        >
          New request
        </button>
      </div>
      {asking && (
        <div className="border-b border-border p-4">
          <RequestForm
            projectId={projectId}
            ownerName={ownerName}
            scope="common"
            subject="General request"
            onDone={() => setAsking(false)}
          />
        </div>
      )}
      <ul className="divide-y divide-border">
        {list.map((r: (typeof list)[number]) => (
          <li key={r.id} className="p-4 text-sm">
            <div className="flex flex-wrap justify-between gap-2">
              <span className="font-semibold">{r.subject}</span>
              <span className="text-xs uppercase text-muted-foreground">
                {r.status} · {fmtDay(r.created_at)}
                {isManager && ` · ${r.owner_name}`}
              </span>
            </div>
            {r.details && <p className="mt-1 whitespace-pre-wrap">{r.details}</p>}
            {r.response && <p className="mt-1 rounded bg-muted/40 p-2">PMC: {r.response}</p>}
            {isManager && r.status === "open" && (
              <div className="mt-2 flex flex-wrap gap-2">
                <input
                  value={reply[r.id] ?? ""}
                  onChange={(e) => setReply({ ...reply, [r.id]: e.target.value })}
                  placeholder="Reply to the owner"
                  className="min-w-[240px] flex-1 rounded-md border border-border bg-background px-2 py-1"
                />
                <button
                  type="button"
                  onClick={() => void respond(r.id, "accepted")}
                  className="rounded-md bg-primary px-2 py-1 text-xs font-semibold text-primary-foreground"
                >
                  Accept
                </button>
                <button
                  type="button"
                  onClick={() => void respond(r.id, "declined")}
                  className="rounded-md border border-border px-2 py-1 text-xs"
                >
                  Decline
                </button>
                <button
                  type="button"
                  onClick={() => void respond(r.id, "done")}
                  className="rounded-md border border-border px-2 py-1 text-xs"
                >
                  Done
                </button>
              </div>
            )}
          </li>
        ))}
        {!list.length && <li className="p-4 text-sm text-muted-foreground">No requests yet.</li>}
      </ul>
    </section>
  );
}

// ---------------------------------------------------------------- options (PMC)
function Options({ projectId }: { projectId: string }) {
  const qc = useQueryClient();
  const q = usePortalData(projectId);
  const types = useMemo(() => q.data?.types ?? [], [q.data]);
  const items = useMemo(() => {
    const m = new Map<
      string,
      { code: string; item: string; unit: string; make: string; rate: number; pkg: string }
    >();
    for (const t of types)
      for (const l of linesOf(t.lines))
        if (!m.has(l.code))
          m.set(l.code, {
            code: l.code,
            item: l.item,
            unit: l.unit,
            make: l.make,
            rate: l.rate,
            pkg: l.pkg,
          });
    return [...m.values()];
  }, [types]);
  const [form, setForm] = useState({
    code: "",
    type: "",
    label: "",
    make: "",
    rate: "",
    gst: "18",
    note: "",
  });
  const cur = items.find((i) => i.code === form.code);
  async function add() {
    if (!form.code || !form.label.trim() || !Number(form.rate)) {
      toast.error("Pick the item, name the option and give its rate");
      return;
    }
    const r = await supabase.from("flat_options").insert({
      project_id: projectId,
      item_code: form.code,
      type_code: form.type,
      label: form.label.trim(),
      make: form.make.trim(),
      rate: Number(form.rate),
      gst_pct: Number(form.gst) || 18,
      note: form.note.trim(),
    });
    if (r.error) toast.error(r.error.message);
    else {
      toast.success("Option added: owners can pick it now");
      setForm({ ...form, label: "", make: "", rate: "", note: "" });
      await qc.invalidateQueries({ queryKey: ["owner_portal", projectId] });
    }
  }
  async function remove(o: OptionRow) {
    const used = (q.data?.selections ?? []).some(
      (s: SelectionRow) => s.option_id === o.id && s.status === "accepted",
    );
    if (used) {
      toast.error("An owner's accepted choice uses this option; it can't be removed");
      return;
    }
    const r = await supabase.from("flat_options").delete().eq("id", o.id);
    if (r.error) toast.error(r.error.message);
    else await qc.invalidateQueries({ queryKey: ["owner_portal", projectId] });
  }
  const opts = q.data?.options ?? [];
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
      <section className="rounded-xl border border-border bg-card p-4">
        <h2 className="font-semibold">Add an option for owners</h2>
        <p className="text-sm text-muted-foreground">
          Our specification is always the default. Add alternatives (another make, size or series)
          with their rate excl. GST per unit; owners see the difference for their flat.
        </p>
        <div className="mt-3 grid gap-2 text-sm">
          <label>
            Item
            <select
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              className="mt-1 w-full rounded-md border border-border bg-background px-2 py-1"
            >
              <option value="">Choose…</option>
              {items.map((i) => (
                <option key={i.code} value={i.code}>
                  {i.pkg} · {i.code} {i.item}
                </option>
              ))}
            </select>
          </label>
          {cur && (
            <p className="text-xs text-muted-foreground">
              Our spec: {cur.make || "—"} at {rs(cur.rate)} per {cur.unit} excl. GST
            </p>
          )}
          <label>
            Flat type
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="mt-1 w-full rounded-md border border-border bg-background px-2 py-1"
            >
              <option value="">All flat types</option>
              {types.map((t) => (
                <option key={t.code} value={t.code}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Option name
            <input
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              placeholder="e.g. Italian-finish 800 × 1600"
              className="mt-1 w-full rounded-md border border-border bg-background px-2 py-1"
            />
          </label>
          <label>
            Make / model
            <input
              value={form.make}
              onChange={(e) => setForm({ ...form, make: e.target.value })}
              className="mt-1 w-full rounded-md border border-border bg-background px-2 py-1"
            />
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label>
              Rate ₹ per {cur?.unit ?? "unit"} (excl. GST)
              <input
                value={form.rate}
                onChange={(e) => setForm({ ...form, rate: e.target.value })}
                inputMode="decimal"
                className="mt-1 w-full rounded-md border border-border bg-background px-2 py-1"
              />
            </label>
            <label>
              GST %
              <input
                value={form.gst}
                onChange={(e) => setForm({ ...form, gst: e.target.value })}
                inputMode="decimal"
                className="mt-1 w-full rounded-md border border-border bg-background px-2 py-1"
              />
            </label>
          </div>
          <label>
            Note (source of the rate)
            <input
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              placeholder="e.g. dealer quote 12 Nov"
              className="mt-1 w-full rounded-md border border-border bg-background px-2 py-1"
            />
          </label>
          <button
            type="button"
            onClick={() => void add()}
            className="rounded-lg bg-primary px-3 py-1.5 font-semibold text-primary-foreground"
          >
            Add option
          </button>
        </div>
      </section>
      <section className="rounded-xl border border-border bg-card">
        <h2 className="border-b border-border p-4 font-semibold">
          Options available ({opts.length})
        </h2>
        <ul className="divide-y divide-border text-sm">
          {opts.map((o) => {
            const it = items.find((i) => i.code === o.item_code);
            return (
              <li key={o.id} className="flex items-start justify-between gap-2 p-3">
                <span>
                  <b>{o.label}</b>
                  {o.make && ` · ${o.make}`}
                  <span className="block text-xs text-muted-foreground">
                    {o.item_code} {it?.item ?? ""} · {rs(o.rate)}/{it?.unit ?? "unit"} excl. GST ·{" "}
                    {o.type_code || "all types"}
                    {o.note && ` · ${o.note}`}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => void remove(o)}
                  className="text-xs text-red-600 underline"
                >
                  Remove
                </button>
              </li>
            );
          })}
          {!opts.length && (
            <li className="p-4 text-muted-foreground">
              No alternatives yet: owners see our specification only.
            </li>
          )}
        </ul>
      </section>
    </div>
  );
}

function Tile({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="rounded-lg border border-border bg-background p-2">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={`tnum ${strong ? "text-lg font-bold" : "font-semibold"}`}>{value}</p>
    </div>
  );
}
