import { useEffect, useState } from "react";
import { Bell, BellOff, X } from "lucide-react";
import { alertState, refreshAlerts, turnOffAlerts, turnOnAlerts, type AlertState } from "@/lib/phone-alerts";
import { cn } from "@/lib/utils";

const HELP: Record<AlertState, string> = {
  on: "This phone gets an alert for team messages, tasks and approvals, even when the app is closed.",
  off: "Turn on to get an alert on this phone for team messages, tasks and approvals.",
  blocked:
    "Alerts are blocked for this site. Open the browser's site settings, allow Notifications, then come back.",
  unsupported: "This browser cannot show alerts. Use Chrome on Android, or install the app.",
  "install-first":
    "On iPhone: tap Share, then Add to Home Screen, open SiteYantra from the home screen, and turn alerts on there.",
};

function useAlerts() {
  const [st, setSt] = useState<AlertState | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  useEffect(() => {
    void alertState().then(setSt);
  }, []);
  const toggle = async () => {
    setBusy(true);
    setErr("");
    try {
      setSt(st === "on" ? await turnOffAlerts() : await turnOnAlerts());
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not change alerts.");
    } finally {
      setBusy(false);
    }
  };
  return { st, busy, err, toggle };
}

/** Row used in the alerts drop-down and on the team chat page. */
export function PhoneAlertsRow({ className }: { className?: string }) {
  const { st, busy, err, toggle } = useAlerts();
  if (!st) return null;
  const canToggle = st === "on" || st === "off";
  return (
    <div className={cn("flex items-start gap-3 rounded-lg border border-border bg-card px-3 py-2.5", className)}>
      {st === "on" ? (
        <Bell className="mt-0.5 size-5 shrink-0 text-emerald-600" />
      ) : (
        <BellOff className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
      )}
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-semibold text-foreground">
          {st === "on" ? "Phone alerts are on" : "Phone alerts are off"}
        </p>
        <p className="mt-0.5 text-[12px] text-muted-foreground">{err || HELP[st]}</p>
      </div>
      {canToggle && (
        <button
          type="button"
          onClick={toggle}
          disabled={busy}
          className={cn(
            "min-h-10 shrink-0 rounded-md px-3 text-[13px] font-semibold disabled:opacity-50",
            st === "on" ? "border border-input bg-card text-foreground" : "bg-primary text-primary-foreground",
          )}
        >
          {busy ? "…" : st === "on" ? "Turn off" : "Turn on"}
        </button>
      )}
    </div>
  );
}

const DISMISS = "saha-phone-alerts-dismissed";

/** Slim bar shown once on phones until alerts are on or the person closes it. */
export function PhoneAlertsNudge() {
  const { st, busy, err, toggle } = useAlerts();
  const [hidden, setHidden] = useState(true);
  useEffect(() => {
    void refreshAlerts();
    try {
      setHidden(localStorage.getItem(DISMISS) === "1");
    } catch {
      setHidden(false);
    }
  }, []);
  if (hidden || !st || st === "on" || st === "unsupported") return null;
  const close = () => {
    setHidden(true);
    try {
      localStorage.setItem(DISMISS, "1");
    } catch {
      /* ignore */
    }
  };
  return (
    <div className="flex items-center gap-2 border-b border-border bg-primary-soft px-3 py-2 md:hidden" role="region" aria-label="Phone alerts">
      <Bell className="size-5 shrink-0 text-primary" />
      <p className="min-w-0 flex-1 text-[13px] text-foreground">
        {err || (st === "off" ? "Get alerts on this phone for messages and approvals." : HELP[st])}
      </p>
      {st === "off" && (
        <button
          type="button"
          onClick={toggle}
          disabled={busy}
          className="min-h-10 shrink-0 rounded-md bg-primary px-3 text-[13px] font-semibold text-primary-foreground disabled:opacity-50"
        >
          {busy ? "…" : "Turn on"}
        </button>
      )}
      <button type="button" onClick={close} aria-label="Close" className="grid size-10 shrink-0 place-items-center rounded-md text-muted-foreground">
        <X className="size-5" />
      </button>
    </div>
  );
}
