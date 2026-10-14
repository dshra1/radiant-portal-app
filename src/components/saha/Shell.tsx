import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  LayoutDashboard,
  Building2,
  Calculator,
  ClipboardCheck,
  ScanEye,
  PanelLeftClose,
  PanelLeft,
  MessagesSquare,
  Home,
  ChevronRight,
  ChevronDown,
  Plus,
  UnfoldVertical,
  Bot,
  LogOut,
  LifeBuoy,
  KeyRound,
  Check,
  Receipt,
  HardHat,
  Users,
  FileSpreadsheet,
  Wallet,
  ShieldAlert,
  Wifi,
  WifiOff,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import sahaLogo from "@/assets/saha-logo.jpeg.asset.json";
import { navForRole, roles, type NavItem } from "@/components/saha/nav";
import { useAccess, useSessionUser } from "@/lib/access";
import { useActiveProject, useActiveProjectSetter } from "@/hooks/useActiveProject";
import { useOnline } from "@/lib/use-online";
import { NotificationBell } from "@/components/saha/NotificationBell";
import { CommandSearch } from "@/components/saha/CommandSearch";

function useSignOut() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  return async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };
}

/** Transparent full-screen layer that closes an open dropdown when clicked. */
function Backdrop({ onClose }: { onClose: () => void }) {
  return (
    <button
      type="button"
      aria-label="Close menu"
      tabIndex={-1}
      onClick={onClose}
      className="fixed inset-0 z-40 cursor-default"
    />
  );
}

const quickAdd: { to: string; label: string; icon: typeof Receipt }[] = [
  { to: "/bills-payments", label: "New bill", icon: Receipt },
  { to: "/site-today", label: "Daily report", icon: HardHat },
  { to: "/contractors-labour", label: "Labour entry", icon: Users },
  { to: "/po-create", label: "Raise PO", icon: FileSpreadsheet },
  { to: "/capital-ledger", label: "Record receipt", icon: Wallet },
];

const mobileNav: NavItem[] = [
  { to: "/", label: "Hub", icon: Home },
  { to: "/site-today", label: "Site Today", icon: LayoutDashboard },
  { to: "/projects", label: "Projects", icon: Building2 },
  { to: "/boq-engine", label: "BOQ", icon: Calculator },
  { to: "/pour-cards", label: "Pours", icon: ClipboardCheck },
  { to: "/quality", label: "QA", icon: ScanEye },
];

const groupTones: Record<string, string> = {
  quick: "oklch(0.72 0.17 152)",
  planning: "oklch(0.72 0.14 250)",
  site: "oklch(0.78 0.15 70)",
  stock: "oklch(0.75 0.16 152)",
  accounts: "oklch(0.75 0.13 200)",
  money: "oklch(0.74 0.15 300)",
  qa: "oklch(0.78 0.14 100)",
};

function groupTone(id: string) {
  return groupTones[id] ?? "oklch(0.75 0.12 152)";
}

export function Shell({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const [expanded, setExpanded] = useState(true);
  const { access } = useAccess();
  const user = useSessionUser();
  const isAdmin = access?.isAdmin ?? false;
  /** Roles the admin assigned to this account; admins may preview any role. */
  const allowedRoles = useMemo<string[]>(
    () => (isAdmin ? [...roles] : (access?.labels ?? [])),
    [isAdmin, access?.labels],
  );
  const [role, setRole] = useState<string>(() => {
    if (typeof window === "undefined") return "Admin / Owner";
    return window.localStorage.getItem("saha-role") ?? "Admin / Owner";
  });

  useEffect(() => {
    if (allowedRoles.length && !allowedRoles.includes(role)) setRole(allowedRoles[0]!);
  }, [allowedRoles, role]);

  useEffect(() => {
    if (typeof window !== "undefined") window.localStorage.setItem("saha-role", role);
  }, [role]);
  const [projectMenu, setProjectMenu] = useState(false);
  const [addMenu, setAddMenu] = useState(false);
  const [userMenu, setUserMenu] = useState(false);
  const online = useOnline();
  const signOut = useSignOut();
  const active = useActiveProject();
  const setActiveProject = useActiveProjectSetter();

  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const groups = useMemo(() => navForRole(role, isAdmin), [role, isAdmin]);

  const activeGroup = useMemo(
    () =>
      groups.find((g) => g.items.some((i) => i.to === pathname))?.id ?? groups[0]?.id ?? "planning",
    [groups, pathname],
  );
  const [open, setOpen] = useState<Record<string, boolean>>({ [activeGroup]: true });

  /** Group the user last pressed in the sidebar; its items show in the top bar. */
  const [pickedGroup, setPickedGroup] = useState<string | null>(null);

  useEffect(() => {
    setOpen((prev) => ({ ...prev, [activeGroup]: true }));
    // Follow navigation: once the user lands on a page, its group owns the top bar.
    setPickedGroup(null);
  }, [activeGroup]);

  const topGroup = useMemo(() => {
    const id = pickedGroup ?? activeGroup;
    return groups.find((g) => g.id === id) ?? groups.find((g) => g.id === activeGroup) ?? groups[0];
  }, [groups, pickedGroup, activeGroup]);

  const { data: projects = [] } = useQuery({
    queryKey: ["site_projects", "navigation-summary"],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_projects")
        .select("id,name,location,health")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
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
  const current = projects.find((p) => p.id === active.id);
  const displayName = access?.profile?.full_name?.trim() || user?.email || "";
  const initials =
    displayName
      .split(/[\s@._-]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]!.toUpperCase())
      .join("") || "?";

  return (
    <div className="flex min-h-screen bg-background">
      <aside
        className={cn(
          "sticky top-0 hidden h-screen shrink-0 flex-col border-r border-sidebar-border bg-sidebar bg-[image:var(--gradient-hero)] transition-[width] duration-200 md:flex",
          expanded ? "w-64" : "w-16",
        )}
      >
        <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-4">
          <img
            src={sahaLogo.url}
            alt="Saha Developers"
            className="size-8 shrink-0 rounded bg-white object-contain p-0.5"
          />
          {expanded && (
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-bold tracking-tight text-sidebar-accent-foreground">
                Saha OS
              </span>
              <span className="label-caps truncate text-sidebar-foreground/70">
                Enterprise Civil Suite
              </span>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {expanded && (
            <div className="mb-2 border-b border-sidebar-border px-2 pb-3">
              <label className="label-caps text-sidebar-foreground/70" htmlFor="saha-role">
                Active role
              </label>
              <select
                id="saha-role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="mt-1 h-8 w-full rounded bg-sidebar-accent/60 px-2 text-[13px] font-medium text-sidebar-accent-foreground"
              >
                {(allowedRoles.length ? allowedRoles : roles).map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          )}

          {groups.map((group) => {
            const isOpen = expanded ? (open[group.id] ?? false) : true;
            return (
              <div key={group.id} className="mb-1">
                {expanded ? (
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => {
                      setPickedGroup(group.id);
                      setOpen((p) => ({ ...p, [group.id]: !p[group.id] }));
                    }}
                    className="flex w-full items-center justify-between gap-2 rounded px-3 py-2 text-left text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <span
                        className="h-3.5 w-[3px] shrink-0 rounded-full"
                        style={{ background: groupTone(group.id) }}
                      />
                      <span className="label-caps truncate" style={{ color: groupTone(group.id) }}>
                        {group.label}
                      </span>
                    </span>
                    {isOpen ? (
                      <ChevronDown className="size-3.5 shrink-0" />
                    ) : (
                      <ChevronRight className="size-3.5 shrink-0" />
                    )}
                  </button>
                ) : (
                  <div className="mx-2 my-2 h-px bg-sidebar-border" />
                )}

                {isOpen && (
                  <div className="mt-0.5 space-y-0.5">
                    {group.items.map((item) => {
                      const active = pathname === item.to;
                      return (
                        <Link
                          key={item.to}
                          to={item.to}
                          title={item.label}
                          className={cn(
                            "flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium text-sidebar-foreground transition-all",
                            active
                              ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-[inset_2px_0_0_0_var(--color-sidebar-primary)]"
                              : "hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                          )}
                        >
                          <item.icon
                            className={cn("size-4 shrink-0", active && "text-sidebar-primary")}
                          />
                          {expanded && <span className="truncate">{item.label}</span>}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="space-y-2 border-t border-sidebar-border p-2">
          {expanded && (
            <>
              <Link
                to="/manual"
                className="mb-1 flex items-center gap-3 rounded px-3 py-2 text-[13px] font-semibold text-sidebar-foreground transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
              >
                <LifeBuoy className="size-4" />
                <span>How to use Saha OS</span>
              </Link>
              <div className="flex items-center justify-between px-2.5 label-caps text-sidebar-foreground/60">
                <span>SAHA Developers · PMC</span>
              </div>
            </>
          )}
          <button
            onClick={() => setExpanded((v) => !v)}
            className="flex w-full items-center gap-3 rounded px-3 py-2 text-[13px] font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
          >
            {expanded ? <PanelLeftClose className="size-4" /> : <PanelLeft className="size-4" />}
            {expanded && <span>Collapse</span>}
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-card px-4 py-2.5">
          <Link
            to="/"
            aria-label="Go home"
            className="inline-flex shrink-0 items-center justify-center rounded-md bg-primary/10 p-2 text-primary transition-colors hover:bg-primary/20"
          >
            <Home className="size-4" />
          </Link>

          <div className="relative hidden min-w-0 sm:block">
            <button
              type="button"
              onClick={() => setProjectMenu((v) => !v)}
              aria-expanded={projectMenu}
              className="flex max-w-[19rem] items-center gap-2 rounded bg-secondary px-2.5 py-1.5 text-left transition-colors hover:bg-secondary/70"
            >
              <span className="min-w-0">
                <span className="flex items-center gap-1.5">
                  <span className="truncate text-[13px] font-semibold text-secondary-foreground">
                    {current?.name ?? active.name}
                  </span>
                  {current && (
                    <span className="label-caps rounded bg-primary-soft px-1.5 py-0.5 text-primary">
                      Active
                    </span>
                  )}
                </span>
                <span className="block truncate text-xs text-secondary-foreground/75">
                  {current?.location ?? active.location}
                </span>
              </span>
              <UnfoldVertical className="size-3.5 shrink-0 text-secondary-foreground/70" />
            </button>

            {projectMenu && <Backdrop onClose={() => setProjectMenu(false)} />}
            {projectMenu && (
              <div className="absolute left-0 top-full z-50 mt-2 w-80 rounded-xl border border-border bg-card p-3 shadow-lg">
                <div className="flex items-center justify-between gap-2 border-b border-border pb-2">
                  <span className="text-sm font-semibold">Switch project</span>
                  <Link
                    to="/projects"
                    onClick={() => setProjectMenu(false)}
                    className="inline-flex items-center gap-1 rounded bg-primary px-2 py-1 text-[11px] font-semibold text-primary-foreground hover:bg-primary-hover"
                  >
                    Manage projects
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
                          setProjectMenu(false);
                        }}
                        className={cn(
                          "flex w-full items-center justify-between gap-2 rounded px-2 py-1.5 text-left hover:bg-secondary",
                          p.id === active.id && "bg-secondary",
                        )}
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-[13px] font-medium">{p.name}</span>
                          <span className="block truncate text-xs text-muted-foreground">
                            {p.location}
                          </span>
                        </span>
                        <span className="flex shrink-0 items-center gap-1 label-caps text-muted-foreground">
                          {p.health}
                          {p.id === active.id && <Check className="size-3.5 text-primary" />}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <CommandSearch groups={groups} projectId={active.id} />

          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <span
              className={cn(
                "hidden items-center gap-1.5 rounded-full px-2 py-1 text-[11px] font-medium xl:flex",
                online ? "bg-primary-soft text-primary" : "bg-destructive/10 text-destructive",
              )}
              title={
                online ? "Connected" : "No connection — changes will fail until you are back online"
              }
            >
              {online ? <Wifi className="size-3.5" /> : <WifiOff className="size-3.5" />}
              {online ? "Online" : "Offline"}
            </span>
            {!online && (
              <WifiOff className="size-4 text-destructive xl:hidden" aria-label="Offline" />
            )}
            <Link
              to="/messages"
              className="relative inline-flex shrink-0 items-center"
              aria-label="Team chat"
              title="Team chat"
            >
              <MessagesSquare className="size-4 text-muted-foreground hover:text-foreground" />
              {unreadChats > 0 && (
                <span className="absolute -right-1.5 -top-1.5 grid size-3.5 place-items-center rounded-full bg-destructive text-[8px] font-bold text-destructive-foreground">
                  {unreadChats > 9 ? "9+" : unreadChats}
                </span>
              )}
            </Link>
            <NotificationBell size="sm" />
            <div className="relative hidden sm:block">
              <button
                type="button"
                onClick={() => setAddMenu((v) => !v)}
                aria-expanded={addMenu}
                className="inline-flex items-center gap-1.5 rounded-md bg-primary px-2.5 py-1.5 text-[12px] font-semibold text-primary-foreground transition-colors hover:bg-primary-hover"
              >
                <Plus className="size-3.5" /> Add Entry
                <ChevronDown className="size-3" />
              </button>
              {addMenu && <Backdrop onClose={() => setAddMenu(false)} />}
              {addMenu && (
                <div className="absolute right-0 top-full z-50 mt-2 w-52 rounded-xl border border-border bg-card p-1.5 shadow-lg">
                  {quickAdd.map((q) => (
                    <Link
                      key={q.to}
                      to={q.to}
                      onClick={() => setAddMenu(false)}
                      className="flex items-center gap-2 rounded px-2 py-1.5 text-[13px] hover:bg-secondary"
                    >
                      <q.icon className="size-3.5 text-muted-foreground" />
                      {q.label}
                    </Link>
                  ))}
                  <Link
                    to="/quality"
                    search={{ tab: "ncr" }}
                    onClick={() => setAddMenu(false)}
                    className="flex items-center gap-2 rounded px-2 py-1.5 text-[13px] hover:bg-secondary"
                  >
                    <ShieldAlert className="size-3.5 text-muted-foreground" />
                    Raise NCR
                  </Link>
                </div>
              )}
            </div>
            <div className="relative">
              <button
                type="button"
                onClick={() => setUserMenu((v) => !v)}
                aria-expanded={userMenu}
                aria-label="Account menu"
                title={displayName}
                className="grid size-7 shrink-0 place-items-center rounded-full bg-secondary text-[11px] font-semibold text-secondary-foreground hover:ring-2 hover:ring-primary/40"
              >
                {initials}
              </button>
              {userMenu && <Backdrop onClose={() => setUserMenu(false)} />}
              {userMenu && (
                <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded-xl border border-border bg-card p-1.5 shadow-lg">
                  <div className="border-b border-border px-2 pb-2 pt-1">
                    {access?.profile?.full_name && (
                      <p className="truncate text-[13px] font-semibold">
                        {access.profile.full_name}
                      </p>
                    )}
                    <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
                    {(access?.labels.length ?? 0) > 0 && (
                      <p className="mt-1 flex flex-wrap gap-1">
                        {access!.labels.map((l) => (
                          <span
                            key={l}
                            className="rounded bg-primary-soft px-1.5 py-0.5 text-[10px] font-semibold text-primary"
                          >
                            {l}
                          </span>
                        ))}
                      </p>
                    )}
                  </div>
                  <Link
                    to="/manual"
                    onClick={() => setUserMenu(false)}
                    className="mt-1 flex items-center gap-2 rounded px-2 py-1.5 text-[13px] hover:bg-secondary"
                  >
                    <LifeBuoy className="size-3.5 text-muted-foreground" /> How to use
                  </Link>
                  <Link
                    to="/reset-password"
                    onClick={() => setUserMenu(false)}
                    className="flex items-center gap-2 rounded px-2 py-1.5 text-[13px] hover:bg-secondary"
                  >
                    <KeyRound className="size-3.5 text-muted-foreground" /> Change password
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setUserMenu(false);
                      void signOut();
                    }}
                    className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-[13px] text-destructive hover:bg-secondary"
                  >
                    <LogOut className="size-3.5" /> Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {topGroup && topGroup.items.length > 0 && (
          <nav
            aria-label={`${topGroup.label} pages`}
            className="sticky top-16 z-10 flex items-center gap-1 overflow-x-auto border-b border-border bg-card/90 px-3 py-1.5 backdrop-blur-md md:px-4"
          >
            <span
              className="label-caps mr-1 hidden shrink-0 items-center gap-1.5 sm:flex"
              style={{ color: groupTone(topGroup.id) }}
            >
              <span
                className="h-3.5 w-[3px] rounded-full"
                style={{ background: groupTone(topGroup.id) }}
              />
              {topGroup.label}
            </span>
            {topGroup.items.map((item) => {
              const active = pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors",
                    active
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                  )}
                >
                  <item.icon className="size-3.5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        )}

        <div className="border-b border-border bg-gradient-to-b from-primary-soft/50 to-card px-4 pb-5 pt-4 md:px-6">
          <div className="mx-auto flex w-full max-w-none flex-wrap items-end justify-between gap-3">
            <div className="min-w-0">
              <h1 className="display-title truncate text-2xl text-foreground sm:text-3xl">
                {title}
              </h1>
              {subtitle && <p className="mt-0.5 text-[13px] text-muted-foreground">{subtitle}</p>}
            </div>
            {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
          </div>
        </div>

        <main className="flex-1 p-4 md:p-6">
          <div className="mx-auto w-full max-w-none">{children}</div>
        </main>

        <Link
          to="/ai"
          aria-label="Saha AI Assistant"
          className="fixed bottom-20 right-4 z-30 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-[13px] font-semibold text-primary-foreground shadow-lg transition-colors hover:bg-primary-hover md:bottom-[4.5rem]"
        >
          <Bot className="size-4" />
          <span className="hidden sm:inline">Saha AI Assistant</span>
        </Link>

        <nav className="sticky bottom-0 z-20 flex h-16 w-full items-center justify-around border-t border-border bg-card px-2 md:hidden">
          {mobileNav.map((item) => {
            const active = pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                aria-label={item.label}
                className={cn(
                  "flex flex-1 flex-col items-center justify-center gap-0.5 py-1 text-[10px] font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <item.icon className="size-5" />
                <span className="leading-none">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
