import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, Check, CheckCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSessionUser } from "@/lib/access";
import { cn } from "@/lib/utils";

type Note = {
  id: string;
  title: string;
  body: string;
  category: string;
  priority: string;
  link: string;
  is_read: boolean;
  created_at: string;
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.round(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

export function NotificationBell({
  size = "sm",
  className,
}: {
  size?: "sm" | "lg";
  className?: string;
}) {
  const user = useSessionUser();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const { data: notes = [] } = useQuery({
    queryKey: ["notifications", "bell-recent", user?.id],
    queryFn: async () => {
      let q = supabase
        .from("notifications")
        .select("id,title,body,category,priority,link,is_read,created_at")
        .order("created_at", { ascending: false })
        .limit(12);
      if (user?.id) q = q.or(`recipient_id.eq.${user.id},recipient_id.is.null`);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as Note[];
    },
    refetchInterval: 6000,
    refetchOnWindowFocus: true,
  });

  const unread = notes.filter((n) => !n.is_read).length;
  const invalidate = () => void qc.invalidateQueries({ queryKey: ["notifications"] });

  const markOne = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("notifications").update({ is_read: true }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const markAll = useMutation({
    mutationFn: async () => {
      const ids = notes.filter((n) => !n.is_read).map((n) => n.id);
      if (ids.length === 0) return;
      const { error } = await supabase.from("notifications").update({ is_read: true }).in("id", ids);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const lg = size === "lg";

  return (
    <div ref={wrapRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
        aria-expanded={open}
        title="Action centre"
        className={cn(
          "relative inline-flex shrink-0 items-center",
          lg
            ? "rounded-full bg-secondary p-2.5 text-muted-foreground transition-colors hover:bg-secondary/70 hover:text-foreground"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        <Bell className={lg ? "size-5" : "size-4"} />
        {unread > 0 && (
          <span
            className={cn(
              "absolute grid place-items-center rounded-full bg-destructive font-bold text-destructive-foreground",
              lg ? "-right-1 -top-1 size-4 text-[9px]" : "-right-1.5 -top-1.5 size-3.5 text-[8px]",
            )}
          >
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-border bg-card shadow-lg">
          <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
            <p className="text-[12px] font-bold uppercase tracking-wide text-muted-foreground">
              Recent alerts
            </p>
            <button
              type="button"
              onClick={() => markAll.mutate()}
              disabled={unread === 0 || markAll.isPending}
              className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-primary disabled:opacity-40"
            >
              <CheckCheck className="size-3.5" /> Mark all read
            </button>
          </div>

          <ul className="max-h-80 overflow-y-auto divide-y divide-border">
            {notes.length === 0 && (
              <li className="px-3 py-6 text-center text-[13px] text-muted-foreground">
                Nothing pending here.
              </li>
            )}
            {notes.map((n) => (
              <li
                key={n.id}
                className={cn("flex gap-2 px-3 py-2.5", !n.is_read && "bg-primary-soft/40")}
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold text-foreground">{n.title}</p>
                  {n.body && (
                    <p className="mt-0.5 line-clamp-2 text-[12px] text-muted-foreground">{n.body}</p>
                  )}
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                    <span>{timeAgo(n.created_at)}</span>
                    <span>· {n.category}</span>
                    {n.link && (
                      <Link
                        to={n.link}
                        onClick={() => setOpen(false)}
                        className="font-semibold text-primary underline"
                      >
                        Open
                      </Link>
                    )}
                  </div>
                </div>
                {!n.is_read && (
                  <button
                    type="button"
                    onClick={() => markOne.mutate(n.id)}
                    title="Mark as read"
                    aria-label="Mark as read"
                    className="h-fit rounded-md border border-input bg-card p-1.5 text-muted-foreground hover:text-foreground"
                  >
                    <Check className="size-3.5" />
                  </button>
                )}
              </li>
            ))}
          </ul>

          <Link
            to="/notifications"
            onClick={() => setOpen(false)}
            className="block border-t border-border px-3 py-2 text-center text-[12px] font-semibold text-primary hover:bg-secondary"
          >
            View action centre
          </Link>
        </div>
      )}
    </div>
  );
}
