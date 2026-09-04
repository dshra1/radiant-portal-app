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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import sahaLogo from "@/assets/saha-logo.jpeg.asset.json";
import { navForRole, roles, type NavItem } from "@/components/saha/nav";

const mobileNav: NavItem[] = [
  { to: "/", label: "Hub", icon: Home },
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/projects", label: "Projects", icon: Building2 },
  { to: "/boq", label: "BOQ", icon: Calculator },
  { to: "/pour-cards", label: "Pours", icon: ClipboardCheck },
  { to: "/qa", label: "QA", icon: ScanEye },
];

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
  const [role, setRole] = useState<string>(() => {
    if (typeof window === "undefined") return "Admin / Owner";
    return window.localStorage.getItem("saha-role") ?? "Admin / Owner";
  });

  useEffect(() => {
    if (typeof window !== "undefined") window.localStorage.setItem("saha-role", role);
  }, [role]);
  const [sunlight, setSunlight] = useState(false);
  const [projectMenu, setProjectMenu] = useState(false);

  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const groups = useMemo(() => navForRole(role), [role]);

  const activeGroup = useMemo(
    () => groups.find((g) => g.items.some((i) => i.to === pathname))?.id ?? groups[0]?.id ?? "planning",
    [groups, pathname],
  );
  const [open, setOpen] = useState<Record<string, boolean>>({ [activeGroup]: true });

  useEffect(() => {
    setOpen((prev) => ({ ...prev, [activeGroup]: true }));
  }, [activeGroup]);

  const { data: projects = [] } = useQuery({
    queryKey: ["site_projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_projects")
        .select("id,name,location,health")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
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
                {roles.map((r) => (
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
                    <span className="label-caps">{group.label}</span>
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
            <button
              type="button"
              className="relative inline-flex shrink-0 items-center"
              aria-label="Notifications"
            >
              <Bell className="size-4 text-muted-foreground" />
              <span className="absolute -right-1.5 -top-1.5 grid size-3.5 place-items-center rounded-full bg-destructive text-[8px] font-bold text-destructive-foreground">
                4
              </span>
            </button>
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
          <div className="mx-auto w-full max-w-none">{children}</div>
        </main>

        <nav className="sticky bottom-0 z-20 grid grid-cols-6 border-t border-border bg-card md:hidden">
          {mobileNav.map((item) => {
            const active = pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                aria-label={item.label}
                className={cn(
                  "flex flex-col items-center gap-1 py-2 text-[9px] font-medium",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <item.icon className="size-4" />
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
