import { Link, useRouterState } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
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

} from "lucide-react";
import { cn } from "@/lib/utils";
import sahaLogo from "@/assets/saha-logo.jpeg.asset.json";

const nav = [
  { to: "/", label: "Saha OS Hub", icon: LayoutDashboard },
  { to: "/dashboard", label: "Command Center", icon: LayoutDashboard },
  { to: "/projects", label: "Projects", icon: Building2 },
  { to: "/boq", label: "BOQ & Rates", icon: Calculator },
  { to: "/procurement", label: "Procurement", icon: ShoppingCart },
  { to: "/pour-cards", label: "Pour Cards", icon: ClipboardCheck },
  { to: "/qa", label: "AI Visual QA", icon: ScanEye },
] as const;

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
  const [role, setRole] = useState("Project Manager (PM)");
  const [sunlight, setSunlight] = useState(false);

  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="flex min-h-screen bg-background">
      <aside
        className={cn(
          "sticky top-0 hidden h-screen shrink-0 flex-col border-r border-sidebar-border bg-sidebar bg-[image:var(--gradient-hero)] transition-[width] duration-200 md:flex",
          expanded ? "w-60" : "w-16",
        )}
      >
        <div className="flex h-13 items-center gap-2 border-b border-sidebar-border px-4 py-3">
          <img
            src={sahaLogo.url}
            alt="Saha Developers"
            className="size-7 shrink-0 rounded bg-white object-contain p-0.5"
          />

          {expanded && (
            <span className="truncate text-sm font-semibold tracking-tight text-sidebar-accent-foreground">
              Saha OS <span className="text-sidebar-primary">Next</span>
            </span>
          )}
        </div>

        <nav className="flex-1 space-y-0.5 p-2">
          {nav.map((item) => {
            const active = pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                title={item.label}
                className={cn(
                  "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium text-sidebar-foreground transition-all",
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
        </nav>

        <div className="border-t border-sidebar-border p-2">
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
        <header className="sticky top-0 z-20 flex h-13 items-center gap-3 border-b border-border bg-card/80 px-4 py-2.5 backdrop-blur-md">
          <Link
            to="/"
            aria-label="Go home"
            className="inline-flex items-center justify-center rounded-md bg-primary/10 p-2 text-primary transition-colors hover:bg-primary/20"
          >
            <Home className="size-4" />
          </Link>
          <div className="hidden items-center gap-2 rounded border border-input bg-background px-2.5 py-1.5 sm:flex">
            <Search className="size-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Search POs, BOQ codes, grids…</span>
          </div>
          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <label className="sr-only" htmlFor="saha-role">Active role</label>
            <select
              id="saha-role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="hidden rounded-md border border-input bg-background px-2 py-1 text-[11px] font-medium text-foreground lg:block"
            >
              <option>Project Manager (PM)</option>
              <option>Site Engineer</option>
              <option>Site Supervisor</option>
              <option>Accounts</option>
            </select>
            <span className="hidden items-center gap-1.5 rounded-full bg-primary-soft px-2 py-1 text-[11px] font-medium text-primary lg:flex">
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
            <span className="hidden items-center gap-1.5 label-caps text-muted-foreground sm:flex">
              <span className="size-1.5 rounded-full bg-primary" /> Site sync live
            </span>
            <span className="relative inline-flex">
              <Bell className="size-4 text-muted-foreground" />
              <span className="absolute -right-1.5 -top-1.5 grid size-3.5 place-items-center rounded-full bg-destructive text-[8px] font-bold text-destructive-foreground">
                4
              </span>
            </span>
            <span className="grid size-7 place-items-center rounded-full bg-secondary text-[11px] font-semibold text-secondary-foreground">
              SD
            </span>
          </div>

        </header>

        <div className="border-b border-border bg-gradient-to-b from-primary-soft/50 to-card px-4 pb-5 pt-4 md:px-6">
          <div className="mx-auto flex w-full max-w-[1400px] flex-wrap items-end justify-between gap-3">
            <div className="min-w-0">
              <h1 className="display-title truncate text-2xl text-foreground sm:text-3xl">{title}</h1>
              {subtitle && (
                <p className="mt-0.5 text-[13px] text-muted-foreground">{subtitle}</p>
              )}
            </div>
            {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
          </div>
        </div>

        <main className="flex-1 p-4 md:p-6">
          <div className="mx-auto w-full max-w-[1400px]">{children}</div>
        </main>


        <nav className="sticky bottom-0 z-20 grid grid-cols-6 border-t border-border bg-card md:hidden">
          {nav.map((item) => {
            const active = pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
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
