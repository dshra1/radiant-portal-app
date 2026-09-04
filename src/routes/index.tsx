import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { inrCompact, num } from "@/data/saha";
import { useAccess, useSessionUser } from "@/lib/access";
import { useActiveProject, useActiveProjectSetter } from "@/hooks/useActiveProject";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Calculator,
  ShoppingCart,
  ClipboardCheck,
  ScanEye,
  Building2,
  FileText,
  Users,
  TrendingUp,
  Bell,
  ChevronDown,
  Plus,
  CloudCog,
  Sun,
  Wind,
  Droplets,
  CloudRain,
  AlertTriangle,
  CheckCircle2,
  Info,
  MoreHorizontal,
  ArrowRight,
} from "lucide-react";

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
};

type Shortcut = {
  id: string;
  label: string;
  to: string;
  icon: React.ElementType;
  tone: "primary" | "secondary" | "warning" | "info" | "success";
};

const DEFAULT_SHORTCUTS: Shortcut[] = [
  { id: "dashboard", label: "Command", to: "/dashboard", icon: LayoutDashboard, tone: "primary" },
  { id: "projects", label: "Projects", to: "/projects", icon: Building2, tone: "secondary" },
  { id: "boq", label: "BOQ Engine", to: "/boq-engine", icon: Calculator, tone: "success" },
  { id: "po", label: "Raise PO", to: "/po-create", icon: ShoppingCart, tone: "warning" },
  { id: "qa", label: "QA Audit", to: "/qa-inspection", icon: ScanEye, tone: "info" },
  { id: "pours", label: "Pour Cards", to: "/pour-cards", icon: ClipboardCheck, tone: "secondary" },
];

const ALL_SHORTCUTS: Shortcut[] = [
  ...DEFAULT_SHORTCUTS,
  { id: "billing", label: "Billing", to: "/billing-expenditure", icon: FileText, tone: "secondary" },
  { id: "team", label: "Team Chat", to: "/messages", icon: Users, tone: "info" },
  { id: "forecast", label: "Forecast", to: "/financial-forecast", icon: TrendingUp, tone: "success" },
];

const SHORTCUT_STORAGE_KEY = "saha-home-shortcuts";

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

function weatherFromLocation(_location: string) {
  // Placeholder: in production this can call a weather API. Returns sensible defaults for Hyderabad.
  return { temp: 31, condition: "Clear", humidity: "High", advice: "Field work recommended before 11:00 AM." };
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
  const activeProject = useActiveProject();
  const setActiveProject = useActiveProjectSetter();
  const [projectMenuOpen, setProjectMenuOpen] = useState(false);
  const [editShortcuts, setEditShortcuts] = useState(false);
  const [shortcuts, setShortcuts] = useState<Shortcut[]>(DEFAULT_SHORTCUTS);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = window.localStorage.getItem(SHORTCUT_STORAGE_KEY);
      if (saved) {
        const ids: string[] = JSON.parse(saved);
        const ordered = ids
          .map((id) => ALL_SHORTCUTS.find((s) => s.id === id))
          .filter(Boolean) as Shortcut[];
        if (ordered.length) setShortcuts(ordered);
      }
    } catch {
      // ignore
    }
  }, []);

  const saveShortcuts = (next: Shortcut[]) => {
    setShortcuts(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(SHORTCUT_STORAGE_KEY, JSON.stringify(next.map((s) => s.id)));
    }
  };

  const toggleShortcut = (s: Shortcut) => {
    const exists = shortcuts.find((x) => x.id === s.id);
    if (exists) {
      saveShortcuts(shortcuts.filter((x) => x.id !== s.id));
    } else if (shortcuts.length < 8) {
      saveShortcuts([...shortcuts, s]);
    }
  };

  const firstName = access?.profile?.full_name?.split(" ")[0] ?? access?.email?.split("@")[0] ?? "Saha";
  const greeting = greetingForHour();

  const { data: projects = [] } = useQuery({
    queryKey: ["site_projects", "hub-summary"],
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
    enabled: true,
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

  const activeRow = useMemo(
    () => projects.find((p) => p.id === activeProject.id) ?? projects[0],
    [projects, activeProject.id],
  );

  const stats = useMemo(() => {
    const totalBudget = projects.reduce((s, p) => s + Number(p.target_budget ?? 0), 0);
    const totalSpend = projects.reduce((s, p) => s + Number(p.spend ?? 0), 0);
    const totalStaff = projects.reduce((s, p) => s + Number(p.total_staff ?? 0), 0);
    const atRisk = projects.filter((p) => p.health && p.health !== "On Track").length;
    const active = activeRow;
    return {
      totalProjects: projects.length,
      totalBudget,
      totalSpend,
      totalStaff,
      atRisk,
      activeBudget: Number(active?.target_budget ?? 0),
      activeSpend: Number(active?.spend ?? 0),
      activeStaff: Number(active?.total_staff ?? 0),
      activeBuiltUp: Number(active?.total_built_up_sft ?? 0),
      activeHealth: active?.health ?? "—",
    };
  }, [projects, activeRow]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const pendingCount = notifications.filter(
    (n) => !n.is_read && (n.priority.toLowerCase() === "high" || n.priority.toLowerCase() === "urgent"),
  ).length;

  const weather = weatherFromLocation(activeProject.location);

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

      <main className="mx-auto grid w-full max-w-none gap-6 px-5 py-6 lg:grid-cols-12 lg:px-8">
        {/* Left column: stats + action centre */}
        <div className="flex flex-col gap-6 lg:col-span-8">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard
              label="Active Projects"
              value={String(stats.totalProjects)}
              hint={stats.totalProjects > 1 ? `${stats.totalProjects} running` : undefined}
              tone="primary"
              icon={Building2}
            />
            <StatCard
              label="Active Budget"
              value={inrCompact(stats.activeBudget)}
              hint={stats.activeBudget > 0 ? `${Math.round((stats.activeSpend / (stats.activeBudget || 1)) * 100)}% spent` : undefined}
              tone="success"
              icon={TrendingUp}
            />
            <StatCard
              label="Workforce on Site"
              value={num(stats.activeStaff)}
              hint={stats.activeStaff > 0 ? "Total staff" : undefined}
              tone="info"
              icon={Users}
            />
            <StatCard
              label="Attention Items"
              value={String(pendingCount + pendingPOs)}
              hint={pendingPOs > 0 ? `${pendingPOs} PO pending` : undefined}
              tone={pendingCount + pendingPOs > 0 ? "warning" : "success"}
              icon={Bell}
            />
          </div>

          {/* Active project summary */}
          {activeRow && (
            <div className="rounded-2xl border border-border bg-gradient-to-br from-primary/10 to-card p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="label-caps rounded bg-primary-soft px-2 py-0.5 text-primary">{activeProject.health}</span>
                    <span className="text-xs text-muted-foreground">{activeProject.type}</span>
                  </div>
                  <h2 className="mt-2 display-title text-xl sm:text-2xl">{activeProject.name}</h2>
                  <p className="text-sm text-muted-foreground">{activeProject.location}</p>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <MiniMetric label="BOQ Items" value={String(boqCount)} />
                  <MiniMetric label="Built-up" value={`${num(stats.activeBuiltUp)} sft`} />
                  <MiniMetric label="POs Pending" value={String(pendingPOs)} />
                </div>
              </div>
              <div className="mt-5">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Budget consumed</span>
                  <span className="font-semibold">
                    {inrCompact(stats.activeSpend)} / {inrCompact(stats.activeBudget)}
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${Math.min(100, (stats.activeSpend / (stats.activeBudget || 1)) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          )}

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

        {/* Right column: shortcuts + insight */}
        <div className="flex flex-col gap-6 lg:col-span-4">
          {/* Quick Access */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="display-title text-sm uppercase tracking-wider text-muted-foreground">Quick Access</h2>
              <button
                type="button"
                onClick={() => setEditShortcuts((v) => !v)}
                className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                title="Edit shortcuts"
              >
                <MoreHorizontal className="size-4" />
              </button>
            </div>

            {editShortcuts && (
              <div className="mt-3 rounded-xl border border-border bg-muted/50 p-3">
                <p className="mb-2 text-xs text-muted-foreground">Tap to pin/unpin shortcuts (max 8)</p>
                <div className="flex flex-wrap gap-2">
                  {ALL_SHORTCUTS.map((s) => {
                    const active = shortcuts.some((x) => x.id === s.id);
                    const Icon = s.icon;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => toggleShortcut(s)}
                        className={cn(
                          "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                          active
                            ? "border-primary bg-primary-soft text-primary"
                            : "border-border bg-card text-muted-foreground hover:text-foreground",
                        )}
                      >
                        <Icon className="size-3" />
                        {s.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="mt-4 grid grid-cols-2 gap-3">
              {shortcuts.map((s) => {
                const Icon = s.icon;
                return (
                  <Link
                    key={s.id}
                    to={s.to}
                    className={cn(
                      "group flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-all hover:-translate-y-0.5",
                      s.tone === "primary" && "border-primary/20 bg-primary-soft/50 hover:border-primary",
                      s.tone === "secondary" && "border-border bg-secondary/50 hover:border-primary/30",
                      s.tone === "success" && "border-primary/20 bg-primary-soft/30 hover:border-primary",
                      s.tone === "warning" && "border-warning/30 bg-warning-soft/50 hover:border-warning",
                      s.tone === "info" && "border-info/30 bg-info-soft/50 hover:border-info",
                    )}
                  >
                    <div
                      className={cn(
                        "grid size-10 place-items-center rounded-full text-white shadow-sm transition-colors",
                        s.tone === "primary" && "bg-primary",
                        s.tone === "secondary" && "bg-muted-foreground/70",
                        s.tone === "success" && "bg-primary",
                        s.tone === "warning" && "bg-warning",
                        s.tone === "info" && "bg-info",
                      )}
                    >
                      <Icon className="size-5" />
                    </div>
                    <span className="text-xs font-semibold text-foreground">{s.label}</span>
                  </Link>
                );
              })}
              <button
                type="button"
                onClick={() => setEditShortcuts((v) => !v)}
                className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border p-4 text-center text-muted-foreground transition-colors hover:border-primary/30 hover:bg-muted/30"
              >
                <div className="grid size-10 place-items-center rounded-full bg-muted text-muted-foreground">
                  <Plus className="size-5" />
                </div>
                <span className="text-xs font-semibold">Customize</span>
              </button>
            </div>
          </div>

          {/* Contextual insight */}
          <div className="relative overflow-hidden rounded-2xl bg-primary p-6 text-primary-foreground shadow-lg">
            <div className="relative z-10">
              <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary-foreground/70">
                <Sun className="size-4" /> Site Context
              </h3>
              <div className="mt-3 flex items-baseline gap-3">
                <span className="display-title text-3xl">{weather.temp}°C</span>
                <span className="text-sm font-medium">{weather.condition}</span>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-primary-foreground/80">{weather.advice}</p>
              <div className="mt-4 flex gap-4 text-xs text-primary-foreground/70">
                <span className="flex items-center gap-1"><Droplets className="size-3" /> {weather.humidity}</span>
                <span className="flex items-center gap-1"><Wind className="size-3" /> Light breeze</span>
              </div>
            </div>
            <div className="absolute -right-6 -bottom-6 size-32 rounded-full bg-primary-foreground/10 blur-2xl" />
          </div>

          {/* All modules link */}
          <Link
            to="/system-directory"
            className="flex items-center justify-between rounded-xl border border-border bg-card p-4 text-sm font-semibold text-foreground shadow-sm transition-colors hover:bg-muted/50"
          >
            Browse all modules
            <ArrowRight className="size-4 text-muted-foreground" />
          </Link>
        </div>
      </main>
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
  tone,
  icon: Icon,
}: {
  label: string;
  value: string;
  hint?: string | undefined;
  tone: "primary" | "success" | "info" | "warning" | "secondary";
  icon: React.ElementType;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm transition-colors hover:border-primary/20">
      <div className="flex items-start justify-between">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
        <div
          className={cn(
            "grid size-8 place-items-center rounded-lg",
            tone === "primary" && "bg-primary-soft text-primary",
            tone === "success" && "bg-primary-soft text-primary",
            tone === "secondary" && "bg-secondary text-secondary-foreground",
            tone === "info" && "bg-info-soft text-info",
            tone === "warning" && "bg-warning-soft text-warning",
          )}
        >
          <Icon className="size-4" />
        </div>
      </div>
      <p className="mt-2 display-title text-2xl">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
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
