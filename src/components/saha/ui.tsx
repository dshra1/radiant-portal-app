import type { ReactNode } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

export function MetricTile({
  label,
  value,
  unit,
  delta,
  tone = "neutral",
  icon,
}: {
  label: string;
  value: string;
  unit?: string;
  delta?: string;
  tone?: "good" | "bad" | "warn" | "neutral";
  icon?: ReactNode;
}) {
  return (
    <div className="panel p-3 transition-shadow hover:shadow-[var(--shadow-level-2)]">
      <div className="flex items-start justify-between gap-2">
        <span className="label-caps text-muted-foreground">{label}</span>
        {icon && <span className="text-muted-foreground">{icon}</span>}
      </div>
      <div className="mt-2 flex items-baseline gap-1.5">
        <span className="metric-figure text-foreground">{value}</span>
        {unit && <span className="text-xs font-medium text-muted-foreground">{unit}</span>}
      </div>
      {delta && (
        <div className="mt-2">
          <TrendPill tone={tone} label={delta} />
        </div>
      )}
    </div>
  );
}

export function TrendPill({
  tone = "neutral",
  label,
}: {
  tone?: "good" | "bad" | "warn" | "neutral";
  label: string;
}) {
  const Icon = tone === "good" ? TrendingUp : tone === "bad" ? TrendingDown : Minus;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-semibold tnum",
        tone === "good" && "bg-primary-soft text-primary",
        tone === "bad" && "bg-destructive-soft text-destructive",
        tone === "warn" && "bg-warning-soft text-warning",
        tone === "neutral" && "bg-secondary text-muted-foreground",
      )}
    >
      <Icon className="size-3" />
      {label}
    </span>
  );
}

export type BadgeTone = "emerald" | "red" | "amber" | "sky" | "slate";

export function StatusBadge({ tone, children }: { tone: BadgeTone; children: ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex h-5 items-center rounded px-1.5 text-[11px] font-medium whitespace-nowrap",
        tone === "emerald" && "bg-primary-soft text-primary",
        tone === "red" && "bg-destructive-soft text-destructive",
        tone === "amber" && "bg-warning-soft text-[oklch(0.55_0.13_70)]",
        tone === "sky" && "bg-info-soft text-info",
        tone === "slate" && "bg-secondary text-secondary-foreground",
      )}
    >
      {children}
    </span>
  );
}

export function PhaseBar({
  phases,
}: {
  phases: { name: string; state: "done" | "active" | "pending" }[];
}) {
  return (
    <div className="flex gap-0.5">
      {phases.map((p) => (
        <div key={p.name} className="flex-1" title={`${p.name} — ${p.state}`}>
          <div
            className={cn(
              "h-1 rounded-sm",
              p.state === "done" && "bg-primary",
              p.state === "active" && "animate-pulse bg-warning",
              p.state === "pending" && "bg-border",
            )}
          />
        </div>
      ))}
    </div>
  );
}

export function Section({
  title,
  action,
  children,
  className,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("panel overflow-hidden", className)}>
      <header className="flex items-center justify-between gap-3 border-b border-border px-3 py-2.5">
        <h2 className="text-sm font-semibold tracking-tight text-foreground">{title}</h2>
        {action}
      </header>
      {children}
    </section>
  );
}

export function ActionButton({
  children,
  variant = "primary",
  onClick,
}: {
  children: ReactNode;
  variant?: "primary" | "secondary" | "danger";
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex h-8 items-center gap-1.5 rounded px-3 text-[13px] font-medium transition-colors",
        variant === "primary" && "bg-primary text-primary-foreground hover:bg-primary-hover",
        variant === "secondary" &&
          "border border-input bg-card text-secondary-foreground hover:bg-secondary",
        variant === "danger" && "bg-destructive text-destructive-foreground hover:opacity-90",
      )}
    >
      {children}
    </button>
  );
}
