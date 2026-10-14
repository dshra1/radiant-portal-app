import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { isUnreadFor, setNotificationRead, useNotificationReadIds } from "@/lib/notification-reads";
import { inrCompact, num } from "@/data/saha";
import { useAccess, useSessionUser } from "@/lib/access";
import { useActiveProject, useActiveProjectSetter } from "@/hooks/useActiveProject";
import { cn } from "@/lib/utils";
import {
  Bell,
  ChevronRight,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Info,
  ArrowRight,
} from "lucide-react";

import { Shell } from "@/components/saha/Shell";
import { SiteWeekPanel } from "@/components/saha/SiteWeekPanel";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Saha OS — Action Centre" },
      {
        name: "description",
        content:
          "Project-specific action centre for Saha OS: notifications, approvals, live project metrics and quick workspace access.",
      },
      { property: "og:title", content: "Saha OS — Action Centre" },
      {
        property: "og:description",
        content:
          "Project-specific action centre for Saha OS: notifications, approvals, live project metrics and quick workspace access.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

type Notification = {
  id: string;
  title: string;
  body: string;
  category: string;
  priority: string;
  link: string;
  is_read: boolean;
  created_at: string;
  project_id: string | null;
  recipient_id: string | null;
};

function greetingForHour() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function priorityTone(priority: string) {
  const p = priority.toLowerCase();
  if (p === "high" || p === "urgent") return "warning";
  if (p === "normal") return "info";
  if (p === "low") return "success";
  return "info";
}

function Index() {
  const { access } = useAccess();
  const user = useSessionUser();
  const navigate = useNavigate();
  const activeProject = useActiveProject();
  const setActiveProject = useActiveProjectSetter();
  const queryClient = useQueryClient();

  // A landowner-only login goes straight to their portal.
  const ownerOnly =
    !!access && access.roles.length > 0 && access.roles.every((r) => r === "landowner_investor");
  useEffect(() => {
    if (ownerOnly) void navigate({ to: "/owner", replace: true });
  }, [ownerOnly, navigate]);

  const firstName =
    access?.profile?.full_name?.split(" ")[0] ?? access?.email?.split("@")[0] ?? "Saha";
  const greeting = greetingForHour();

  const { data: projects = [] } = useQuery({
    queryKey: ["site_projects", "hub-summary"],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_projects")
        .select(
          "id,name,location,target_budget,spend,total_staff,health,total_built_up_sft,saleable_sft,estimate_amount",
        )
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications", "landing", activeProject.id, user?.id],
    queryFn: async () => {
      let q = supabase
        .from("notifications")
        .select("id,title,body,category,priority,link,is_read,created_at,project_id,recipient_id")
        .order("created_at", { ascending: false })
        .limit(50);
      // Each user sees workspace-wide notifications (no recipient) plus those addressed to them
      if (user?.id) {
        q = q.or(`recipient_id.eq.${user.id},recipient_id.is.null`);
      }
      const { data, error } = await q;
      if (error) throw error;
      const rows = (data ?? []) as Notification[];
      // Then narrow to the active project (or workspace-wide) in memory to avoid nested OR syntax
      if (!activeProject.id) return rows;
      return rows.filter((n) => !n.project_id || n.project_id === activeProject.id);
    },
    enabled: Boolean(user?.id),
  });

  const projectIds = projects.map((p) => p.id);
  const { data: boqCounts = {} } = useQuery({
    queryKey: ["boq_items", "count-by-project", projectIds],
    enabled: projectIds.length > 0,
    queryFn: async () => {
      const entries = await Promise.all(
        projectIds.map(async (id) => {
          const { count, error } = await supabase
            .from("boq_items")
            .select("id", { count: "exact", head: true })
            .eq("project_id", id);
          if (error) throw error;
          return [id, count ?? 0] as const;
        }),
      );
      return Object.fromEntries(entries) as Record<string, number>;
    },
  });

  const { data: pendingPOs = 0 } = useQuery({
    queryKey: ["purchase_orders", "pending-count", activeProject.id],
    queryFn: async () => {
      if (!activeProject.id) return 0;
      const { count, error } = await supabase
        .from("purchase_orders")
        .select("id", { count: "exact", head: true })
        .eq("project_id", activeProject.id)
        .in("status", ["draft", "pending"]);
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!activeProject.id,
  });

  // Read status is per person (team-wide notices use notification_reads).
  const { data: readIds = new Set<string>() } = useNotificationReadIds(user?.id);
  const unread = notifications.filter((n) => isUnreadFor(n, readIds));
  const unreadCount = unread.length;

  const markRead = async (ids: string[]) => {
    if (!ids.length || !user?.id) return;
    try {
      for (const n of notifications.filter((x) => ids.includes(x.id)))
        await setNotificationRead(n, user.id, true);
    } catch (e) {
      toast.error(`Could not mark as read: ${(e as Error).message}`);
    }
    // Refreshes this list, the bell, the chat badge and the Action Centre page.
    await queryClient.invalidateQueries({ queryKey: ["notifications"] });
  };

  const markAllRead = () => markRead(unread.map((n) => n.id));

  return (
    <Shell
      title="Saha OS Hub"
      subtitle={`${greeting}, ${firstName} · ${
        unreadCount > 0
          ? `${unreadCount} notification${unreadCount === 1 ? "" : "s"} need attention`
          : "no pending notifications"
      }`}
    >
      <div className="flex w-full flex-col gap-6">
        {activeProject.id ? <SiteWeekPanel projectId={activeProject.id} /> : null}
        {/* Projects — tap a card to open its dashboard */}
        <section>
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <h2 className="display-title text-lg">Your projects</h2>
              <p className="text-sm text-muted-foreground">
                {projects.length === 0
                  ? "No projects yet — add your first site."
                  : "Tap a project to open Site Execution."}
              </p>
            </div>
            <Link
              to="/projects"
              className="inline-flex h-9 shrink-0 items-center gap-1 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground hover:bg-primary-hover"
            >
              <Plus className="size-3.5" /> New project
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {projects.map((p) => {
              const budget = Number(p.target_budget ?? 0);
              const spend = Number(p.spend ?? 0);
              const pct = Math.min(100, budget ? (spend / budget) * 100 : 0);
              const isActive = p.id === activeProject.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setActiveProject(p.id);
                    void navigate({ to: "/site-execution" });
                  }}
                  title={`Open ${p.name} programme`}
                  className={cn(
                    "group block w-full cursor-pointer rounded-2xl border bg-gradient-to-br from-primary/10 to-card p-5 text-left transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary/40",
                    isActive ? "border-primary/40" : "border-border",
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="label-caps rounded bg-primary-soft px-2 py-0.5 text-primary">
                          {p.health || "—"}
                        </span>
                        {isActive && (
                          <span className="label-caps rounded bg-primary px-1.5 py-0.5 text-[10px] text-primary-foreground">
                            Active
                          </span>
                        )}
                      </div>
                      <h3 className="mt-2 display-title truncate text-xl">{p.name}</h3>
                      <p className="truncate text-sm text-muted-foreground">{p.location || "—"}</p>
                    </div>
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground opacity-90 transition-opacity group-hover:opacity-100">
                      Open <ChevronRight className="size-3.5" />
                    </span>
                  </div>

                  <div className={cn("mt-4 grid gap-3", isActive ? "grid-cols-4" : "grid-cols-3")}>
                    <MiniMetric
                      label={Number(p.saleable_sft ?? 0) ? "Saleable" : "Built-up"}
                      value={`${num(Number(p.saleable_sft || p.total_built_up_sft || 0))} sft`}
                    />
                    <MiniMetric
                      label="Estimate"
                      value={
                        Number(p.estimate_amount ?? 0) ? inrCompact(Number(p.estimate_amount)) : "—"
                      }
                    />
                    <MiniMetric
                      label="BOQ Items"
                      value={p.id in boqCounts ? num(boqCounts[p.id] ?? 0) : "…"}
                    />
                    {isActive && <MiniMetric label="POs Pending" value={String(pendingPOs)} />}
                  </div>

                  <div className="mt-4">
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">
                        Spent of budget
                        {Number(p.estimate_amount ?? 0) > budget && budget > 0
                          ? ` · estimate ${Math.round(((Number(p.estimate_amount) - budget) / budget) * 100)}% over`
                          : ""}
                      </span>
                      <span className="font-semibold">
                        {inrCompact(spend)} / {inrCompact(budget)}
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <div className="flex flex-col gap-6">
          {/* Action Centre */}
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div className="flex items-center gap-2">
                <Bell className="size-5 text-primary" />
                <h2 className="display-title text-lg">Action Centre</h2>
                {unreadCount > 0 && (
                  <span className="grid size-5 place-items-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Link
                  to="/notifications"
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  View all
                </Link>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={() => void markAllRead()}
                    className="text-xs font-semibold text-muted-foreground hover:text-foreground"
                  >
                    Mark read
                  </button>
                )}
              </div>
            </div>

            <div className="divide-y divide-border">
              {notifications.length === 0 && (
                <div className="flex flex-col items-center justify-center gap-2 px-5 py-10 text-center">
                  <CheckCircle2 className="size-8 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">
                    Nothing pending for {activeProject.name}.
                  </p>
                </div>
              )}
              {notifications.map((n) => {
                const tone = priorityTone(n.priority);
                return (
                  <div
                    key={n.id}
                    className={cn(
                      "group flex items-start gap-4 px-5 py-4 transition-colors hover:bg-muted/40",
                      isUnreadFor(n, readIds) && "bg-primary-soft/30",
                    )}
                  >
                    <div
                      className={cn(
                        "grid size-10 shrink-0 place-items-center rounded-xl",
                        tone === "warning" && "bg-warning-soft text-warning",
                        tone === "info" && "bg-info-soft text-info",
                        tone === "success" && "bg-primary-soft text-primary",
                      )}
                    >
                      {tone === "warning" ? (
                        <AlertTriangle className="size-5" />
                      ) : tone === "info" ? (
                        <Info className="size-5" />
                      ) : (
                        <CheckCircle2 className="size-5" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <h3
                          className={cn(
                            "text-sm font-semibold",
                            isUnreadFor(n, readIds) && "text-foreground",
                          )}
                        >
                          {n.title}
                        </h3>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {timeAgo(n.created_at)}
                        </span>
                      </div>
                      <p className="mt-0.5 text-sm text-muted-foreground">{n.body}</p>
                      <div className="mt-2 flex items-center gap-2">
                        {n.link && (
                          <Link
                            to={n.link}
                            onClick={() => void markRead([n.id])}
                            className="inline-flex items-center gap-1 rounded-md bg-primary px-2.5 py-1 text-[11px] font-semibold text-primary-foreground hover:bg-primary-hover"
                          >
                            Review <ArrowRight className="size-3" />
                          </Link>
                        )}
                        {isUnreadFor(n, readIds) && (
                          <button
                            type="button"
                            onClick={() => void markRead([n.id])}
                            className="text-xs text-muted-foreground hover:text-foreground"
                          >
                            Dismiss
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </Shell>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card/60 p-3 text-center">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}
