import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { inrCompact, num } from "@/data/saha";
import { useAccess, useSessionUser } from "@/lib/access";
import { useActiveProject, useActiveProjectSetter } from "@/hooks/useActiveProject";
import { cn } from "@/lib/utils";
import {
  Building2,
  Bell,
  MessagesSquare,
  ChevronDown,
  ChevronRight,
  Plus,
  CloudCog,
  AlertTriangle,
  CheckCircle2,
  Info,
  ArrowRight,
} from "lucide-react";

import { NotificationBell } from "@/components/saha/NotificationBell";

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
  const [projectMenuOpen, setProjectMenuOpen] = useState(false);

  const firstName = access?.profile?.full_name?.split(" ")[0] ?? access?.email?.split("@")[0] ?? "Saha";
  const greeting = greetingForHour();

  const { data: projects = [] } = useQuery({
    queryKey: ["site_projects", "hub-summary"],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_projects")
        .select("id,name,location,target_budget,spend,total_staff,health,total_built_up_sft")
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

  const { data: unreadChats = 0 } = useQuery({
    queryKey: ["notifications", "unread-chat-count", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { count, error } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("is_read", false)
        .eq("recipient_id", user!.id)
        .in("category", ["Chat", "Task"]);
      if (error) throw error;
      return count ?? 0;
    },
    refetchInterval: 6000,
    refetchOnWindowFocus: true,
  });

  const { data: boqCount = 0 } = useQuery({
    queryKey: ["boq_items", "count", activeProject.id],
    queryFn: async () => {
      if (!activeProject.id) return 0;
      const { count, error } = await supabase
        .from("boq_items")
        .select("id", { count: "exact", head: true })
        .eq("project_id", activeProject.id);
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!activeProject.id,
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

  const unreadCount = notifications.filter((n) => !n.is_read).length;


  const markRead = async (id: string) => {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
  };

  const markAllRead = async () => {
    const ids = notifications.filter((n) => !n.is_read).map((n) => n.id);
    if (!ids.length) return;
    await supabase.from("notifications").update({ is_read: true }).in("id", ids);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top greeting bar */}
      <header className="border-b border-border bg-card px-5 py-6 sm:px-8">
        <div className="mx-auto flex w-full max-w-none flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h1 className="display-title text-2xl sm:text-3xl">
              {greeting}, <span className="text-primary">{firstName}</span>
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {unreadCount > 0
                ? `You have ${unreadCount} notification${unreadCount === 1 ? "" : "s"} requiring attention.`
                : "No pending notifications. Your projects are up to date."}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/messages"
              className="relative inline-flex shrink-0 items-center rounded-full bg-secondary p-2.5 text-muted-foreground transition-colors hover:bg-secondary/70 hover:text-foreground"
              aria-label="Team chat"
              title="Team chat"
            >
              <MessagesSquare className="size-5" />
              {unreadChats > 0 && (
                <span className="absolute -right-1 -top-1 grid size-4 place-items-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground">
                  {unreadChats > 9 ? "9+" : unreadChats}
                </span>
              )}
            </Link>
            <NotificationBell size="lg" />


            <div className="relative">
              <button
                type="button"
                onClick={() => setProjectMenuOpen((v) => !v)}
                className="flex min-w-[14rem] items-center justify-between gap-3 rounded-xl border border-border bg-secondary px-4 py-2.5 text-left transition-colors hover:bg-secondary/70"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-secondary-foreground">
                    {activeProject.name}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">{activeProject.location}</span>
                </span>
                <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
              </button>

              {projectMenuOpen && (
                <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-xl border border-border bg-card p-3 shadow-lg">
                  <div className="flex items-center justify-between gap-2 border-b border-border pb-2">
                    <span className="text-sm font-semibold">Active project</span>
                    <Link
                      to="/projects"
                      onClick={() => setProjectMenuOpen(false)}
                      className="inline-flex items-center gap-1 rounded bg-primary px-2 py-1 text-[11px] font-semibold text-primary-foreground hover:bg-primary-hover"
                    >
                      <Plus className="size-3" /> New
                    </Link>
                  </div>
                  <ul className="mt-2 max-h-60 space-y-1 overflow-y-auto">
                    {projects.length === 0 && (
                      <li className="px-1 py-2 text-xs text-muted-foreground">No projects yet.</li>
                    )}
                    {projects.map((p) => (
                      <li key={p.id}>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveProject(p.id);
                            setProjectMenuOpen(false);
                            void navigate({ to: "/dashboard" });
                          }}
                          className={cn(
                            "flex w-full items-center justify-between gap-2 rounded px-2 py-1.5 text-left hover:bg-secondary",
                            p.id === activeProject.id && "bg-primary-soft",
                          )}
                        >
                          <span className="min-w-0">
                            <span className="block truncate text-[13px] font-medium">{p.name}</span>
                            <span className="block truncate text-xs text-muted-foreground">{p.location}</span>
                          </span>
                          {p.id === activeProject.id && (
                            <span className="label-caps shrink-0 rounded bg-primary px-1.5 py-0.5 text-[10px] text-primary-foreground">
                              Active
                            </span>
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="hidden items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-right sm:flex">
              <CloudCog className="size-4 text-primary" />
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Sync status</p>
                <p className="text-xs font-semibold text-foreground">Online · Synced</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-none flex-col gap-6 px-5 py-6 lg:px-8">
        {/* Projects — tap a card to open its dashboard */}
        <section>
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <h2 className="display-title text-lg">Your projects</h2>
              <p className="text-sm text-muted-foreground">
                {projects.length === 0
                  ? "No projects yet — add your first site."
                  : "Tap a project to open its Command Dashboard."}
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
                    void navigate({ to: "/dashboard" });
                  }}
                  title={`Open ${p.name} dashboard`}
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

                  <div className="mt-4 grid grid-cols-3 gap-3">
                    <MiniMetric label="Built-up" value={`${num(Number(p.total_built_up_sft ?? 0))} sft`} />
                    <MiniMetric label="Staff" value={num(Number(p.total_staff ?? 0))} />
                    <MiniMetric
                      label={isActive ? "POs Pending" : "BOQ Items"}
                      value={isActive ? String(pendingPOs) : String(boqCount && isActive ? boqCount : "—")}
                    />
                  </div>

                  <div className="mt-4">
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Budget consumed</span>
                      <span className="font-semibold">
                        {inrCompact(spend)} / {inrCompact(budget)}
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
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
                    onClick={markAllRead}
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
                  <p className="text-sm text-muted-foreground">Nothing pending for {activeProject.name}.</p>
                </div>
              )}
              {notifications.map((n) => {
                const tone = priorityTone(n.priority);
                return (
                  <div
                    key={n.id}
                    className={cn(
                      "group flex items-start gap-4 px-5 py-4 transition-colors hover:bg-muted/40",
                      !n.is_read && "bg-primary-soft/30",
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
                        <h3 className={cn("text-sm font-semibold", !n.is_read && "text-foreground")}>{n.title}</h3>
                        <span className="shrink-0 text-xs text-muted-foreground">{timeAgo(n.created_at)}</span>
                      </div>
                      <p className="mt-0.5 text-sm text-muted-foreground">{n.body}</p>
                      <div className="mt-2 flex items-center gap-2">
                        {n.link && (
                          <Link
                            to={n.link}
                            onClick={() => markRead(n.id)}
                            className="inline-flex items-center gap-1 rounded-md bg-primary px-2.5 py-1 text-[11px] font-semibold text-primary-foreground hover:bg-primary-hover"
                          >
                            Review <ArrowRight className="size-3" />
                          </Link>
                        )}
                        {!n.is_read && (
                          <button
                            type="button"
                            onClick={() => markRead(n.id)}
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

      </main>

    </div>
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
