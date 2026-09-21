import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Plus, Check, Pencil, Search } from "lucide-react";
import { navGroups, navForRole, type NavItem } from "@/components/saha/nav";
import { useAccess } from "@/lib/access";
import { cn } from "@/lib/utils";

const DEFAULT_PATHS = ["/projects", "/boq-engine", "/po-create", "/qa-inspection", "/tasks", "/bills-payments"];

function storageKey(userId: string | null | undefined) {
  return `saha-quick-access-${userId ?? "anon"}`;
}

/** Editable, per-user shortcut panel. Lives on the Command Dashboard. */
export function QuickAccess() {
  const { access } = useAccess();
  const userId = access?.userId ?? null;
  const role = access?.labels?.[0] ?? "Admin / Owner";
  const isAdmin = Boolean(access?.isAdmin);

  const allowed = useMemo(() => {
    const groups = navForRole(role, isAdmin);
    const paths = new Set(groups.flatMap((g) => g.items.map((i) => i.to)));
    // Full catalogue, but only the entries this role may open
    return navGroups
      .flatMap((g) => g.items.map((i) => ({ ...i, group: g.label })))
      .filter((i) => paths.has(i.to))
      .filter((i, idx, arr) => arr.findIndex((x) => x.to === i.to) === idx);
  }, [role, isAdmin]);

  const [paths, setPaths] = useState<string[]>(DEFAULT_PATHS);
  const [editing, setEditing] = useState(false);
  const [q, setQ] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = window.localStorage.getItem(storageKey(userId));
      if (saved) {
        const ids = JSON.parse(saved) as string[];
        if (Array.isArray(ids)) setPaths(ids);
      }
    } catch {
      // ignore
    }
  }, [userId]);

  const save = (next: string[]) => {
    setPaths(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(storageKey(userId), JSON.stringify(next));
    }
  };

  const toggle = (to: string) => {
    if (paths.includes(to)) save(paths.filter((p) => p !== to));
    else if (paths.length < 12) save([...paths, to]);
  };

  const pinned: (NavItem & { group?: string })[] = paths
    .map((p) => allowed.find((i) => i.to === p))
    .filter(Boolean) as (NavItem & { group?: string })[];

  const catalogue = allowed.filter((i) =>
    q.trim() ? i.label.toLowerCase().includes(q.trim().toLowerCase()) : true,
  );

  return (
    <div className="panel p-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold">My quick access</h2>
          <p className="text-xs text-muted-foreground">Pin the screens you use most — saved for your login.</p>
        </div>
        <button
          type="button"
          onClick={() => setEditing((v) => !v)}
          className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border px-2.5 text-xs font-semibold text-foreground hover:bg-muted"
        >
          {editing ? <Check className="size-3.5" /> : <Pencil className="size-3.5" />}
          {editing ? "Done" : "Edit"}
        </button>
      </div>

      {editing && (
        <div className="mt-3 rounded-xl border border-border bg-muted/40 p-3">
          <div className="flex items-center gap-2 rounded-md border border-border bg-background px-2">
            <Search className="size-3.5 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search screens…"
              className="h-8 w-full bg-transparent text-xs outline-none"
            />
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">Tap to pin or unpin (up to 12).</p>
          <div className="mt-2 flex max-h-56 flex-wrap gap-2 overflow-y-auto">
            {catalogue.map((i) => {
              const Icon = i.icon;
              const active = paths.includes(i.to);
              return (
                <button
                  key={i.to}
                  type="button"
                  onClick={() => toggle(i.to)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
                    active
                      ? "border-primary bg-primary-soft text-primary"
                      : "border-border bg-card text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Icon className="size-3" />
                  {i.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {pinned.map((i) => {
          const Icon = i.icon;
          return (
            <Link
              key={i.to}
              to={i.to}
              className="flex items-center gap-2 rounded-xl border border-border bg-card p-3 text-left transition-colors hover:border-primary/40 hover:bg-muted/40"
            >
              <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary">
                <Icon className="size-4" />
              </span>
              <span className="min-w-0 truncate text-[12px] font-semibold">{i.label}</span>
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="flex items-center gap-2 rounded-xl border border-dashed border-border p-3 text-left text-muted-foreground transition-colors hover:border-primary/40 hover:bg-muted/30"
        >
          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-muted">
            <Plus className="size-4" />
          </span>
          <span className="truncate text-[12px] font-semibold">Add shortcut</span>
        </button>
      </div>
    </div>
  );
}
