import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, ClipboardCheck, Images } from "lucide-react";
import { Shell } from "@/components/saha/Shell";
import { StatusBadge } from "@/components/saha/ui";
import { supabase } from "@/integrations/supabase/client";
import { useActiveProject } from "@/hooks/useActiveProject";
import { useSessionUser } from "@/lib/access";

export const Route = createFileRoute("/qa")({
  head: () => ({
    meta: [
      { title: "Quality Overview | Saha OS" },
      {
        name: "description",
        content:
          "Quality snapshot for the project: open and closed inspections, defects by trade, pour card approvals and quality photos.",
      },
      { property: "og:title", content: "Quality Overview | Saha OS" },
      {
        property: "og:description",
        content: "Snapshot of site quality — inspections, defects by trade and pour approvals.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

const num = (v: unknown) => (Number.isFinite(Number(v)) ? Number(v) : 0);

function Page() {
  const project = useActiveProject();
  const user = useSessionUser();
  const enabled = Boolean(user?.id) && Boolean(project.id);

  const inspections = useQuery({
    queryKey: ["qa_overview", "inspections", project.id],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("qa_inspections")
        .select("id,inspected_on,location_tag,category,severity,findings,defect_count,resolution")
        .eq("project_id", project.id)
        .order("inspected_on", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const pours = useQuery({
    queryKey: ["qa_overview", "pours", project.id],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pour_cards")
        .select("id,pour_ref,element,status,quantity_cum")
        .eq("project_id", project.id);
      if (error) throw error;
      return data ?? [];
    },
  });

  const media = useQuery({
    queryKey: ["qa_overview", "media", project.id],
    enabled,
    queryFn: async () => {
      const { count, error } = await supabase
        .from("project_media")
        .select("id", { count: "exact", head: true })
        .eq("project_id", project.id);
      if (error) throw error;
      return count ?? 0;
    },
  });

  const rows = inspections.data ?? [];

  const stats = useMemo(() => {
    const open = rows.filter((r) => r.resolution !== "Closed");
    const closed = rows.filter((r) => r.resolution === "Closed");
    const defects = rows.reduce((s, r) => s + num(r.defect_count), 0);
    const byCategory = new Map<string, { open: number; total: number; defects: number }>();
    for (const r of rows) {
      const k = r.category || "Other";
      const cur = byCategory.get(k) ?? { open: 0, total: 0, defects: 0 };
      cur.total += 1;
      cur.defects += num(r.defect_count);
      if (r.resolution !== "Closed") cur.open += 1;
      byCategory.set(k, cur);
    }
    return {
      open: open.length,
      closed: closed.length,
      defects,
      closure: rows.length ? (closed.length / rows.length) * 100 : 0,
      byCategory: [...byCategory.entries()].sort((a, b) => b[1].open - a[1].open),
    };
  }, [rows]);

  const pendingPours = (pours.data ?? []).filter((p) => p.status === "pending").length;

  return (
    <Shell title="Quality Overview">
      <div className="flex flex-col gap-6 pb-16">
        <header className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            {project.name} · {project.location}
          </p>
          <h1 className="text-2xl font-bold">Quality at a glance</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Every number here comes from the inspections and pour cards your team records.
          </p>
        </header>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Kpi
            to="/qa-inspection"
            label="Open issues"
            value={String(stats.open)}
            note={`${stats.defects} defects logged`}
            icon={<AlertTriangle className="h-4 w-4 text-primary" />}
          />
          <Kpi
            to="/qa-inspection"
            label="Closed issues"
            value={String(stats.closed)}
            note={`Closure ${stats.closure.toFixed(0)}%`}
            icon={<CheckCircle2 className="h-4 w-4 text-primary" />}
          />
          <Kpi
            to="/pour-cards"
            label="Pours awaiting approval"
            value={String(pendingPours)}
            note="Open pour cards"
            icon={<ClipboardCheck className="h-4 w-4 text-primary" />}
          />
          <Kpi
            to="/site-media"
            label="Site photos on record"
            value={String(media.data ?? 0)}
            note="Open site photos"
            icon={<Images className="h-4 w-4 text-primary" />}
          />
        </div>

        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Defects by trade</h2>
            <Link
              to="/qa-inspection"
              className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold hover:bg-muted"
            >
              Record inspection
            </Link>
          </div>
          {stats.byCategory.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No inspections recorded yet.
            </p>
          ) : (
            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {stats.byCategory.map(([cat, v]) => (
                <div key={cat} className="rounded-xl border border-border p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">{cat}</p>
                    <StatusBadge tone={v.open > 0 ? "amber" : "emerald"}>
                      {v.open > 0 ? `${v.open} open` : "clear"}
                    </StatusBadge>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {v.total} inspections · {v.defects} defects
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-border bg-card shadow-sm">
          <div className="border-b border-border p-4">
            <h2 className="text-lg font-bold">Latest inspections</h2>
          </div>
          <div className="divide-y divide-border">
            {rows.length === 0 ? (
              <p className="p-6 text-center text-sm text-muted-foreground">Nothing recorded yet.</p>
            ) : null}
            {rows.slice(0, 10).map((r) => (
              <Link
                key={r.id}
                to="/qa-inspection"
                className="flex items-center justify-between p-4 text-sm hover:bg-muted/40"
              >
                <div>
                  <p className="font-semibold">
                    {r.location_tag || "Site"} · {r.category}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {r.inspected_on} · {r.findings || "—"}
                  </p>
                </div>
                <StatusBadge tone={r.resolution === "Closed" ? "emerald" : "amber"}>
                  {r.resolution}
                </StatusBadge>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </Shell>
  );
}

function Kpi({
  to,
  label,
  value,
  note,
  icon,
}: {
  to: "/qa-inspection" | "/pour-cards" | "/site-media";
  label: string;
  value: string;
  note: string;
  icon: React.ReactNode;
}) {
  return (
    <Link
      to={to}
      className="rounded-2xl border border-border bg-card p-5 shadow-sm transition hover:border-primary hover:bg-muted/50"
    >
      <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        <span>{label}</span>
        {icon}
      </div>
      <p className="mt-3 text-2xl font-bold">{value}</p>
      <p className="mt-1 text-[11px] text-muted-foreground">{note}</p>
    </Link>
  );
}
