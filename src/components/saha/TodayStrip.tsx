import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ClipboardCheck,
  FileSpreadsheet,
  HardHat,
  ListChecks,
  PackageCheck,
  Receipt,
  Ruler,
  ShieldAlert,
  ShieldCheck,
  Truck,
  Users,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAccess, useSessionUser } from "@/lib/access";
import { useActiveProject } from "@/hooks/useActiveProject";
import { MR_VENDOR } from "@/lib/material-requests";
import { cn } from "@/lib/utils";

/**
 * Today strip: three counters (what is waiting on me) and one-tap actions, the same on the
 * home page and behind the phone bar's "+" button. Every action opens an existing page, so
 * nothing new is added to the menu.
 */

type Action = {
  to: string;
  search?: Record<string, string>;
  label: string;
  icon: typeof Truck;
  /** Database roles that may use it; empty = everyone who can write. */
  roles?: string[];
};

const SITE = ["admin", "pm", "site_engineer", "site_supervisor", "purchase_stores"];
const BUY = ["admin", "pm", "purchase_stores"];
const MONEY = ["admin", "pm", "accounts"];

const QUICK_ACTIONS: Action[] = [
  {
    to: "/material-requests",
    search: { new: "1" },
    label: "Request material",
    icon: PackageCheck,
    roles: SITE,
  },
  { to: "/site-today", label: "Daily report", icon: HardHat, roles: SITE },
  { to: "/contractors-labour", label: "Labour entry", icon: Users, roles: SITE },
  {
    to: "/machines",
    search: { log: "1" },
    label: "Machine hours & diesel",
    icon: Truck,
    roles: SITE,
  },
  {
    to: "/contractors-labour",
    search: { tab: "wo" },
    label: "Measure subcon work",
    icon: Ruler,
    roles: SITE,
  },
  { to: "/quality", search: { tab: "ncr" }, label: "Raise NCR", icon: ShieldAlert, roles: SITE },
  { to: "/po-create", label: "Raise PO", icon: FileSpreadsheet, roles: BUY },
  { to: "/bills-payments", label: "New bill", icon: Receipt, roles: MONEY },
];

function useQuickActions() {
  const { access } = useAccess();
  const roles = access?.roles ?? [];
  const admin = access?.isAdmin ?? false;
  return QUICK_ACTIONS.filter(
    (a) => admin || !a.roles || a.roles.some((r) => roles.includes(r as never)),
  );
}

export function QuickActionGrid({
  onPick,
  className,
}: {
  onPick?: () => void;
  className?: string;
}) {
  const actions = useQuickActions();
  if (actions.length === 0) return null;
  return (
    <div className={cn("grid grid-cols-4 gap-2 sm:grid-cols-8", className)}>
      {actions.map((a) => (
        <Link
          key={a.label}
          to={a.to}
          search={(a.search ?? {}) as never}
          onClick={onPick}
          className="flex min-h-[4.5rem] flex-col items-center justify-center gap-1.5 rounded-xl border border-border bg-card px-1 py-2 text-center text-[11px] font-semibold leading-tight hover:border-primary/40 hover:bg-primary-soft"
        >
          <span className="grid size-9 place-items-center rounded-full bg-primary-soft text-primary">
            <a.icon className="size-4" />
          </span>
          {a.label}
        </Link>
      ))}
    </div>
  );
}

function Counter({
  to,
  label,
  value,
  icon: Icon,
}: {
  to: string;
  label: string;
  value: number | undefined;
  icon: typeof Truck;
}) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 hover:border-primary/40"
    >
      <span
        className={cn(
          "grid size-10 shrink-0 place-items-center rounded-full",
          value ? "bg-warning-soft text-[oklch(0.55_0.13_70)]" : "bg-primary-soft text-primary",
        )}
      >
        <Icon className="size-5" />
      </span>
      <span className="min-w-0">
        <span className="block text-2xl font-bold leading-none tnum">{value ?? "…"}</span>
        <span className="block truncate text-xs text-muted-foreground">{label}</span>
      </span>
    </Link>
  );
}

export function TodayStrip() {
  const user = useSessionUser();
  const { access } = useAccess();
  const project = useActiveProject();
  const pid = project.id;
  const canApprove = !!access && (access.isAdmin || access.roles.includes("pm"));

  const counts = useQuery({
    queryKey: ["today-strip", pid, user?.id, canApprove],
    enabled: Boolean(user?.id && pid),
    refetchInterval: 30000,
    queryFn: async () => {
      const pending = supabase
        .from("purchase_orders")
        .select("id", { count: "exact", head: true })
        .eq("project_id", pid)
        .eq("status", "pending")
        .neq("vendor_name", MR_VENDOR);
      const requests = supabase
        .from("purchase_orders")
        .select("id", { count: "exact", head: true })
        .eq("project_id", pid)
        .eq("vendor_name", MR_VENDOR)
        .in("status", ["draft", "pending"]);
      const todos = supabase
        .from("team_messages")
        .select("id", { count: "exact", head: true })
        .eq("is_task", true)
        .eq("recipient_id", user!.id)
        .neq("status", "Done");
      const [a, b, c] = await Promise.all([pending, requests, todos]);
      return { approvals: a.count ?? 0, requests: b.count ?? 0, todos: c.count ?? 0 };
    },
  });

  return (
    <section className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        <Counter
          to={canApprove ? "/purchase-orders" : "/approvals"}
          label={canApprove ? "POs to approve" : "Waiting approval"}
          value={counts.data?.approvals}
          icon={ShieldCheck}
        />
        <Counter
          to="/material-requests"
          label="Material requests open"
          value={counts.data?.requests}
          icon={ClipboardCheck}
        />
        <Counter to="/tasks" label="My to-dos" value={counts.data?.todos} icon={ListChecks} />
      </div>
      <QuickActionGrid />
    </section>
  );
}
