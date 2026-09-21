import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { Users, AlertTriangle, ClipboardCheck, PackageCheck } from "lucide-react";
import { Shell } from "@/components/saha/Shell";
import { StatusBadge } from "@/components/saha/ui";
import { supabase } from "@/integrations/supabase/client";
import { useActiveProject } from "@/hooks/useActiveProject";
import { useSessionUser } from "@/lib/access";

export const Route = createFileRoute("/field-console")({
  head: () => ({
    meta: [
      { title: "Field Console | Saha OS" },
      {
        name: "description",
        content:
          "Today on site: labour deployed, pour cards awaiting approval, open quality issues and material movements for the selected project.",
      },
      { property: "og:title", content: "Field Console | Saha OS" },
      {
        property: "og:description",
        content: "One screen for today's site activity — labour, pours, quality issues and materials.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

const today = () => new Date().toISOString().slice(0, 10);
const num = (v: unknown) => (Number.isFinite(Number(v)) ? Number(v) : 0);

function Page() {
  const project = useActiveProject();
  const user = useSessionUser();
  const enabled = Boolean(user?.id) && Boolean(project.id);

  const labour = useQuery({
    queryKey: ["field-console", "labour", project.id],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("labour_entries")
        .select("id,work_date,contractor,trade,headcount,hours,day_rate,area,work_done")
        .eq("project_id", project.id)
        .order("work_date", { ascending: false })
        .limit(60);
      if (error) throw error;
      return data ?? [];
    },
  });

  const pours = useQuery({
    queryKey: ["field-console", "pours", project.id],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pour_cards")
        .select("id,pour_ref,element,level,grade,quantity_cum,pour_date,status")
        .eq("project_id", project.id)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data ?? [];
    },
  });

  const qa = useQuery({
    queryKey: ["field-console", "qa", project.id],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("qa_inspections")
        .select("id,inspected_on,location_tag,category,severity,findings,resolution")
        .eq("project_id", project.id)
        .order("inspected_on", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data ?? [];
    },
  });

  const moves = useQuery({
    queryKey: ["field-console", "moves", project.id],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stock_movements")
        .select("id,movement_date,movement_type,description,quantity,unit,party")
        .eq("project_id", project.id)
        .order("movement_date", { ascending: false })
        .limit(15);
      if (error) throw error;
      return data ?? [];
    },
  });

  const t = today();
  const todayLabour = useMemo(
    () => (labour.data ?? []).filter((l) => l.work_date === t),
    [labour.data, t],
  );
  const openQa = useMemo(
    () => (qa.data ?? []).filter((r) => r.resolution !== "Closed"),
    [qa.data],
  );
  const pendingPours = useMemo(
    () => (pours.data ?? []).filter((p) => p.status === "pending"),
    [pours.data],
  );
  const todayMoves = useMemo(
    () => (moves.data ?? []).filter((m) => m.movement_date === t),
    [moves.data, t],
  );

  return (
    <Shell title="Field Console">
      <div className="flex flex-col gap-6 pb-16">
        <header className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            {project.name} · {project.location}
          </p>
          <h1 className="text-2xl font-bold">Today on site — {t}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Everything the site team needs to act on today. Tap any card to open the full register.
          </p>
        </header>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <KpiLink
            to="/contractors-labour"
            label="Workers on site"
            value={String(todayLabour.reduce((s, l) => s + num(l.headcount), 0))}
            note="Open labour log"
            icon={<Users className="h-4 w-4 text-primary" />}
          />
          <KpiLink
            to="/pour-cards"
            label="Pours awaiting approval"
            value={String(pendingPours.length)}
            note="Open pour cards"
            icon={<ClipboardCheck className="h-4 w-4 text-primary" />}
          />
          <KpiLink
            to="/qa-inspection"
            label="Open quality issues"
            value={String(openQa.length)}
            note="Open inspections"
            icon={<AlertTriangle className="h-4 w-4 text-primary" />}
          />
          <KpiLink
            to="/inventory-control"
            label="Material moves today"
            value={String(todayMoves.length)}
            note="Open stock ledger"
            icon={<PackageCheck className="h-4 w-4 text-primary" />}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <Panel title="Labour deployed today" to="/contractors-labour" action="Log labour">
            {todayLabour.length === 0 ? (
              <Empty text="No labour logged for today yet." />
            ) : (
              <ul className="divide-y divide-border">
                {todayLabour.map((l) => (
                  <li key={l.id} className="flex items-center justify-between py-3 text-sm">
                    <div>
                      <p className="font-semibold">{l.contractor || "Unassigned"}</p>
                      <p className="text-xs text-muted-foreground">
                        {[l.trade, l.area, l.work_done].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                    <span className="font-bold">{num(l.headcount)} nos</span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="Pour cards" to="/pour-cards" action="New pour card">
            {(pours.data ?? []).length === 0 ? (
              <Empty text="No pour cards raised yet." />
            ) : (
              <ul className="divide-y divide-border">
                {(pours.data ?? []).slice(0, 8).map((p) => (
                  <li key={p.id} className="flex items-center justify-between py-3 text-sm">
                    <div>
                      <p className="font-semibold">
                        {p.pour_ref} · {p.element}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {[p.level, p.grade, `${num(p.quantity_cum)} cum`, p.pour_date ?? ""]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </div>
                    <StatusBadge
                      tone={
                        p.status === "approved"
                          ? "emerald"
                          : p.status === "pending"
                            ? "amber"
                            : p.status === "poured"
                              ? "sky"
                              : "slate"
                      }
                    >
                      {p.status}
                    </StatusBadge>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="Open quality issues" to="/qa-inspection" action="Record inspection">
            {openQa.length === 0 ? (
              <Empty text="No open quality issues." />
            ) : (
              <ul className="divide-y divide-border">
                {openQa.slice(0, 8).map((r) => (
                  <li key={r.id} className="flex items-center justify-between py-3 text-sm">
                    <div>
                      <p className="font-semibold">{r.location_tag || r.category || "Inspection"}</p>
                      <p className="text-xs text-muted-foreground">{r.findings || "—"}</p>
                    </div>
                    <StatusBadge
                      tone={
                        r.severity === "High" ? "red" : r.severity === "Medium" ? "amber" : "slate"
                      }
                    >
                      {r.severity}
                    </StatusBadge>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="Recent material movements" to="/inventory-control" action="Open stock">
            {(moves.data ?? []).length === 0 ? (
              <Empty text="No stock movements recorded yet." />
            ) : (
              <ul className="divide-y divide-border">
                {(moves.data ?? []).slice(0, 8).map((m) => (
                  <li key={m.id} className="flex items-center justify-between py-3 text-sm">
                    <div>
                      <p className="font-semibold">{m.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {[m.movement_date, m.movement_type, m.party].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                    <span className="font-bold">
                      {num(m.quantity)} {m.unit}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>
    </Shell>
  );
}

type AppRoute =
  | "/contractors-labour"
  | "/pour-cards"
  | "/qa-inspection"
  | "/inventory-control";

function KpiLink({
  to,
  label,
  value,
  note,
  icon,
}: {
  to: AppRoute;
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

function Panel({
  title,
  to,
  action,
  children,
}: {
  title: string;
  to: AppRoute;
  action: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">{title}</h2>
        <Link to={to} className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold hover:bg-muted">
          {action}
        </Link>
      </div>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="py-6 text-center text-sm text-muted-foreground">{text}</p>;
}
