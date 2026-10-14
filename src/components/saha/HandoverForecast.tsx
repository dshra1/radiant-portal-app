import { Link } from "@tanstack/react-router";
import { CalendarClock } from "lucide-react";
import { fmtDay } from "@/lib/programme-progress";
import { iso, useProgrammeForecast } from "@/lib/use-forecast";
import { cn } from "@/lib/utils";

/** "Forecast handover" pill from the live programme forecast, linking to Re-plan. */
export function HandoverForecast({
  projectId,
  linked = true,
  className,
}: {
  projectId: string;
  linked?: boolean;
  className?: string;
}) {
  const f = useProgrammeForecast(projectId);
  const fc = f.data?.fc;
  if (!fc || !Number.isFinite(fc.forecastHandover)) return null;
  const slip = fc.forecastHandover - fc.plannedHandover;
  const body = (
    <>
      <CalendarClock className="size-3.5" />
      Expected handover {fmtDay(iso(fc.forecastHandover))}
      {slip > 0 ? ` · ${slip} days behind plan` : " · on plan"}
    </>
  );
  const cls = cn(
    "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
    slip > 0 ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary",
    className,
  );
  return linked ? (
    <Link to="/replan" className={cls}>
      {body}
    </Link>
  ) : (
    <span className={cls}>{body}</span>
  );
}
