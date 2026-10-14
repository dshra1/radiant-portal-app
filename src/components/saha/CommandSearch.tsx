import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { HardHat, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import type { NavGroup } from "@/components/saha/nav";
import { stageName } from "@/lib/site-week";

type Result =
  | { kind: "page"; key: string; label: string; hint: string; to: string }
  | { kind: "stage"; key: string; label: string; hint: string; code: string };

/**
 * Top-bar search: menu pages the current role can open plus the active
 * project's programme stages. Enter opens the highlighted result, Esc closes,
 * Ctrl/⌘+K opens it from anywhere.
 */
export function CommandSearch({ groups, projectId }: { groups: NavGroup[]; projectId: string }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState("");
  const [index, setIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) {
      setTerm("");
      setIndex(0);
      window.setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  const { data: stages = [] } = useQuery({
    queryKey: ["site_stages", "search", projectId],
    enabled: open && Boolean(projectId),
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_stages")
        .select("code,name,floor,stage_group")
        .eq("project_id", projectId)
        .order("sort", { ascending: true });
      if (error) throw error;
      return (data ?? []).filter((s) => s.code);
    },
  });

  const results = useMemo<Result[]>(() => {
    const t = term.trim().toLowerCase();
    const pages: Result[] = [];
    const seen = new Set<string>();
    for (const g of groups)
      for (const i of g.items) {
        if (seen.has(i.to)) continue;
        seen.add(i.to);
        if (!t || `${i.label} ${g.label}`.toLowerCase().includes(t))
          pages.push({ kind: "page", key: i.to, label: i.label, hint: g.label, to: i.to });
      }
    const st: Result[] = t
      ? stages
          .filter((s) =>
            `${s.code} ${s.name} ${s.floor} ${s.stage_group}`.toLowerCase().includes(t),
          )
          .slice(0, 20)
          .map((s) => ({
            kind: "stage",
            key: `stage-${s.code}`,
            label: `${s.code} · ${stageName(s.name ?? "")}`,
            hint: [s.stage_group, s.floor].filter(Boolean).join(" · "),
            code: s.code,
          }))
      : [];
    return [...pages.slice(0, t ? 12 : 8), ...st];
  }, [groups, stages, term]);

  const go = (r: Result | undefined) => {
    if (!r) return;
    setOpen(false);
    if (r.kind === "page") navigate({ to: r.to });
    else navigate({ to: "/site-execution" });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Search pages and stages"
        title="Search (Ctrl+K)"
        className="inline-flex shrink-0 items-center gap-2 rounded border border-input bg-background px-2.5 py-1.5 text-muted-foreground hover:text-foreground"
      >
        <Search className="size-3.5" />
        <span className="hidden text-xs lg:inline">Search pages, stages…</span>
        <kbd className="hidden rounded border border-border px-1 text-[10px] lg:inline">Ctrl K</kbd>
      </button>
      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-[300] flex items-start justify-center bg-black/40 p-4 pt-[12vh]"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) setOpen(false);
            }}
          >
            <div
              role="dialog"
              aria-label="Search"
              className="w-full max-w-lg overflow-hidden rounded-xl border border-border bg-card shadow-2xl"
            >
              <div className="flex items-center gap-2 border-b border-border px-3">
                <Search className="size-4 text-muted-foreground" />
                <input
                  ref={inputRef}
                  value={term}
                  onChange={(e) => {
                    setTerm(e.target.value);
                    setIndex(0);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") setOpen(false);
                    else if (e.key === "Enter") {
                      e.preventDefault();
                      go(results[index] ?? results[0]);
                    } else if (e.key === "ArrowDown") {
                      e.preventDefault();
                      setIndex((i) => Math.min(i + 1, results.length - 1));
                    } else if (e.key === "ArrowUp") {
                      e.preventDefault();
                      setIndex((i) => Math.max(i - 1, 0));
                    }
                  }}
                  placeholder="Search pages or programme stages (code or name)…"
                  className="h-11 w-full bg-transparent text-sm outline-none"
                />
              </div>
              <ul className="max-h-[50vh] overflow-y-auto p-1.5">
                {results.length === 0 && (
                  <li className="px-2 py-3 text-xs text-muted-foreground">Nothing matches.</li>
                )}
                {results.map((r, i) => (
                  <li key={r.key}>
                    <button
                      type="button"
                      onMouseEnter={() => setIndex(i)}
                      onClick={() => go(r)}
                      className={cn(
                        "flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-[13px]",
                        i === index ? "bg-secondary" : "",
                      )}
                    >
                      {r.kind === "stage" && <HardHat className="size-3.5 shrink-0 text-primary" />}
                      <span className="min-w-0 flex-1 truncate font-medium">{r.label}</span>
                      <span className="shrink-0 truncate text-[11px] text-muted-foreground">
                        {r.kind === "stage" ? `Stage · ${r.hint}` : r.hint}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
