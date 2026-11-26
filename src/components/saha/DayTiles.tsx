import { Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Camera,
  ChevronLeft,
  ChevronRight,
  FileDown,
  HardHat,
  Loader2,
  PackageMinus,
  PackagePlus,
  Ruler,
  Truck,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { buildDprPdf, shareDpr, useDay } from "@/lib/dpr";
import { todayIso } from "@/lib/dates";
import { cn } from "@/lib/utils";

/**
 * Site Today's day at a glance: one tile per kind of record for the chosen day, each opening
 * the page where it is entered or edited, and one button for the daily progress report PDF.
 */
export function DayTiles({
  projectId,
  projectName,
  location,
}: {
  projectId: string;
  projectName: string;
  location: string;
}) {
  const [date, setDate] = useState(todayIso());
  const q = useDay(projectId, date);
  const d = q.data;
  const [busy, setBusy] = useState(false);
  const shift = (n: number) => {
    const t = new Date(new Date(date).getTime() + n * 864e5).toISOString().slice(0, 10);
    if (t <= todayIso()) setDate(t);
  };
  const tiles = [
    {
      label: "Labour present",
      value: d ? d.labour.reduce((s, l) => s + l.heads, 0) : undefined,
      sub: d ? `${new Set(d.labour.map((l) => l.contractor)).size} contractors` : "",
      icon: Users,
      to: "/contractors-labour",
      warn: d?.labour.some((l) => l.far) ? "entered away from site" : "",
    },
    {
      label: "Machine hours",
      value: d ? Number(d.machines.reduce((s, m) => s + m.hours, 0).toFixed(1)) : undefined,
      sub: d ? `${d.machines.reduce((s, m) => s + m.diesel, 0).toFixed(0)} l diesel` : "",
      icon: Truck,
      to: "/machines",
      warn: "",
    },
    {
      label: "Material received",
      value: d?.received.length,
      sub: "GRN entries",
      icon: PackagePlus,
      to: "/inventory-control",
      warn: "",
    },
    {
      label: "Material used",
      value: d?.used.length,
      sub: "issues to stages",
      icon: PackageMinus,
      to: "/inventory-control",
      warn: "",
    },
    {
      label: "Subcon work",
      value: d?.subcon.length,
      sub: "measured",
      icon: Ruler,
      to: "/contractors-labour",
      search: { tab: "wo" },
      warn: "",
    },
    {
      label: "Photos",
      value: d?.photos.length,
      sub: "today",
      icon: Camera,
      to: "/site-media",
      warn: "",
    },
  ];

  const makeDpr = async () => {
    if (!d) return;
    setBusy(true);
    try {
      const bytes = await buildDprPdf(projectName, location, d);
      const how = await shareDpr(
        bytes,
        `DPR-${projectName.replace(/\W+/g, "-")}-${d.date}.pdf`,
        `DPR ${projectName} ${d.date}`,
      );
      toast.success(how === "shared" ? "Report shared" : "Report downloaded");
    } catch (e) {
      toast.error(`Could not make the report: ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          aria-label="Previous day"
          onClick={() => shift(-1)}
          className="grid size-10 place-items-center rounded-full border border-border bg-card"
        >
          <ChevronLeft className="size-5" />
        </button>
        <div className="text-center">
          <p className="text-sm font-bold">
            {date === todayIso()
              ? "Today"
              : new Date(date).toLocaleDateString("en-IN", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                })}
          </p>
          {date !== todayIso() && (
            <button
              type="button"
              onClick={() => setDate(todayIso())}
              className="text-xs font-semibold text-primary underline"
            >
              Back to today
            </button>
          )}
        </div>
        <button
          type="button"
          aria-label="Next day"
          disabled={date >= todayIso()}
          onClick={() => shift(1)}
          className="grid size-10 place-items-center rounded-full border border-border bg-card disabled:opacity-30"
        >
          <ChevronRight className="size-5" />
        </button>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {tiles.map((t) => (
          <Link
            key={t.label}
            to={t.to}
            search={(t.search ?? {}) as never}
            className={cn(
              "flex min-h-[5.5rem] flex-col justify-between rounded-xl border bg-card p-2.5",
              t.warn ? "border-warning" : "border-border",
            )}
          >
            <span className="flex items-center justify-between text-muted-foreground">
              <t.icon className="size-4" />
              <span
                className={cn(
                  "text-xl font-bold tnum",
                  t.value ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {t.value ?? "…"}
              </span>
            </span>
            <span>
              <span className="block text-[11px] font-semibold leading-tight">{t.label}</span>
              <span
                className={cn(
                  "block text-[10px] leading-tight",
                  t.warn ? "text-[oklch(0.55_0.13_70)]" : "text-muted-foreground",
                )}
              >
                {t.warn || t.sub}
              </span>
            </span>
          </Link>
        ))}
      </div>
      <button
        type="button"
        onClick={makeDpr}
        disabled={!d || busy}
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground disabled:opacity-50"
      >
        {busy ? <Loader2 className="size-4 animate-spin" /> : <FileDown className="size-4" />}
        {busy ? "Making the report…" : "Daily progress report (PDF) · share on WhatsApp"}
      </button>
      {!d && q.isError && (
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          <HardHat className="size-3.5" /> Some records could not be read:{" "}
          {(q.error as Error).message}
        </p>
      )}
    </section>
  );
}
