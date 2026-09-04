import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  LayoutDashboard,
  Building2,
  Calculator,
  ShoppingCart,
  ClipboardCheck,
  ScanEye,
  PanelLeftClose,
  PanelLeft,
  Bell,
  MessagesSquare,
  Search,
  Home,
  Sun,
  CloudCog,
  FileText,
  BarChart3,
  HardHat,
  Video,
  Store,
  Receipt,
  Landmark,
  Wallet,
  ChevronRight,
  ChevronDown,
  Plus,
  UnfoldVertical,
  Bot,
  LogOut,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import sahaLogo from "@/assets/saha-logo.jpeg.asset.json";
import { navForRole, roles, type NavItem } from "@/components/saha/nav";
import { useAccess, useSessionUser } from "@/lib/access";
import { SAMPLE_DATA_ROUTES } from "@/components/saha/sample-data";


import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";

function SignOutButton() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  return (
    <button
      type="button"
      aria-label="Sign out"
      title="Sign out"
      onClick={async () => {
        await queryClient.cancelQueries();
        queryClient.clear();
        await supabase.auth.signOut();
        navigate({ to: "/auth", replace: true });
      }}
      className="inline-flex shrink-0 items-center justify-center rounded-md bg-muted p-2 text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground"
    >
      <LogOut className="size-4" />
    </button>
  );
}

const mobileNav: NavItem[] = [
  { to: "/", label: "Hub", icon: Home },
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/projects", label: "Projects", icon: Building2 },
  { to: "/boq", label: "BOQ", icon: Calculator },
  { to: "/pour-cards", label: "Pours", icon: ClipboardCheck },
  { to: "/qa", label: "QA", icon: ScanEye },
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
  const [sunlight, setSunlight] = useState(false);
  const [projectMenu, setProjectMenu] = useState(false);

  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const groups = useMemo(() => navForRole(role, isAdmin), [role, isAdmin]);


  const activeGroup = useMemo(
    () => groups.find((g) => g.items.some((i) => i.to === pathname))?.id ?? groups[0]?.id ?? "planning",
    [groups, pathname],
  );
  const [open, setOpen] = useState<Record<string, boolean>>({ [activeGroup]: true });

  useEffect(() => {
    setOpen((prev) => ({ ...prev, [activeGroup]: true }));
  }, [activeGroup]);

  const { data: projects = [] } = useQuery({
    queryKey: ["site_projects", "navigation-summary"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_projects")
        .select("id,name,location,health")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ["notifications", "unread-count", user?.id],
    queryFn: async () => {
      let q = supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("is_read", false);
      if (user?.id) {
        q = q.or(`recipient_id.eq.${user.id},recipient_id.is.null`);
      }
      const { count, error } = await q;
      if (error) throw error;
      return count ?? 0;
    },
    refetchInterval: 20000,
  });
  const current = projects[0];


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
                    onClick={() => setOpen((p) => ({ ...p, [group.id]: !p[group.id] }))}
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
              <div className="flex items-center gap-2 rounded bg-sidebar-accent/40 px-2.5 py-1.5">
                <span className="size-1.5 animate-pulse rounded-full bg-sidebar-primary" />
                <span className="label-caps truncate text-sidebar-accent-foreground">
                  99.8% Biometric &amp; IoT sync · online
                </span>
              </div>
              <div className="flex items-center justify-between px-2.5 label-caps text-sidebar-foreground/60">
                <span>Civil Platform Engine</span>
                <span>v3.2.0</span>
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
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 overflow-hidden border-b border-border bg-card/80 px-4 py-2.5 backdrop-blur-md">
          <Link
            to="/"
            aria-label="Go home"
            className="inline-flex shrink-0 items-center justify-center rounded-md bg-primary/10 p-2 text-primary transition-colors hover:bg-primary/20"
          >
            <Home className="size-4" />
          </Link>

          <SignOutButton />


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
                    {current?.name ?? "No active project"}
                  </span>
                  {current && (
                    <span className="label-caps rounded bg-primary-soft px-1.5 py-0.5 text-primary">
                      Active
                    </span>
                  )}
                </span>
                <span className="block truncate text-xs text-secondary-foreground/75">
                  {current?.location ?? "Add a project to begin"}
                </span>
              </span>
              <UnfoldVertical className="size-3.5 shrink-0 text-secondary-foreground/70" />
            </button>

            {projectMenu && (
              <div className="absolute left-0 top-full z-50 mt-2 w-80 rounded-xl border border-border bg-card p-3 shadow-lg">
                <div className="flex items-center justify-between gap-2 border-b border-border pb-2">
                  <span className="text-sm font-semibold">Projects management</span>
                  <Link
                    to="/projects"
                    onClick={() => setProjectMenu(false)}
                    className="inline-flex items-center gap-1 rounded bg-primary px-2 py-1 text-[11px] font-semibold text-primary-foreground hover:bg-primary-hover"
                  >
                    <Plus className="size-3" /> Add project
                  </Link>
                </div>
                <ul className="mt-2 max-h-60 space-y-1 overflow-y-auto">
                  {projects.length === 0 && (
                    <li className="px-1 py-2 text-xs text-muted-foreground">No projects yet.</li>
                  )}
                  {projects.map((p) => (
                    <li key={p.id}>
                      <Link
                        to="/projects"
                        onClick={() => setProjectMenu(false)}
                        className="flex items-center justify-between gap-2 rounded px-2 py-1.5 hover:bg-secondary"
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-[13px] font-medium">{p.name}</span>
                          <span className="block truncate text-xs text-muted-foreground">
                            {p.location}
                          </span>
                        </span>
                        <span className="label-caps shrink-0 text-muted-foreground">{p.health}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="hidden items-center gap-2 rounded border border-input bg-background px-2.5 py-1.5 lg:flex">
            <Search className="size-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Search projects, BOQs, vendors…</span>
          </div>

          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <span className="hidden items-center gap-1.5 rounded-full bg-primary-soft px-2 py-1 text-[11px] font-medium text-primary xl:flex">
              <CloudCog className="size-3.5" /> 3 cached — syncing
            </span>
            <span className="hidden items-center gap-1.5 label-caps text-muted-foreground xl:flex">
              <Sun className="size-3.5" /> 31°C Clear • Madhapur
            </span>
            <button
              type="button"
              onClick={() => setSunlight((v) => !v)}
              aria-pressed={sunlight}
              title="Sunlight Mode"
              className={cn(
                "hidden items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] font-medium transition-colors sm:inline-flex",
                sunlight
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-input text-muted-foreground hover:text-foreground",
              )}
            >
              <Sun className="size-3.5" /> Sunlight
            </button>
            <Link
              to="/messages"
              className="inline-flex shrink-0 items-center"
              aria-label="Team chat"
              title="Team chat"
            >
              <MessagesSquare className="size-4 text-muted-foreground hover:text-foreground" />
            </Link>
            <Link
              to="/notifications"
              className="relative inline-flex shrink-0 items-center"
              aria-label="Notifications"
              title="Action centre"
            >
              <Bell className="size-4 text-muted-foreground hover:text-foreground" />
              {unreadCount > 0 && (
                <span className="absolute -right-1.5 -top-1.5 grid size-3.5 place-items-center rounded-full bg-destructive text-[8px] font-bold text-destructive-foreground">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Link>
            <Link
              to="/projects"
              className="hidden items-center gap-1.5 rounded-md bg-primary px-2.5 py-1.5 text-[12px] font-semibold text-primary-foreground transition-colors hover:bg-primary-hover sm:inline-flex"
            >
              <Plus className="size-3.5" /> Add Entry
            </Link>
            <span className="grid size-7 shrink-0 place-items-center rounded-full bg-secondary text-[11px] font-semibold text-secondary-foreground">
              SD
            </span>
          </div>
        </header>

        <div className="border-b border-border bg-gradient-to-b from-primary-soft/50 to-card px-4 pb-5 pt-4 md:px-6">
          <div className="mx-auto flex w-full max-w-none flex-wrap items-end justify-between gap-3">
            <div className="min-w-0">
              <h1 className="display-title truncate text-2xl text-foreground sm:text-3xl">{title}</h1>
              {subtitle && <p className="mt-0.5 text-[13px] text-muted-foreground">{subtitle}</p>}
            </div>
            {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
          </div>
        </div>

        <main className="flex-1 p-4 md:p-6">
          <div className="mx-auto w-full max-w-none">
            {SAMPLE_DATA_ROUTES[pathname] && (
              <div className="mb-4 flex items-start gap-2 rounded-lg border border-warning/40 bg-warning-soft px-3 py-2 text-[12px] text-warning">
                <Info className="mt-0.5 size-3.5 shrink-0" />
                <p>
                  <span className="font-bold uppercase tracking-wide">Sample data</span> — the{" "}
                  {SAMPLE_DATA_ROUTES[pathname]} shown here are illustrative placeholders, not your
                  project&apos;s numbers. Live screens today: Project Details, Project Setup, BOQ Engine,
                  Command Center, Notifications and Chat.
                </p>
              </div>
            )}
            {children}
          </div>
        </main>


        <Link
          to="/ai"
          aria-label="Saha AI Assistant"
          className="fixed bottom-20 right-4 z-30 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-[13px] font-semibold text-primary-foreground shadow-lg transition-colors hover:bg-primary-hover md:bottom-6 md:right-6"
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
