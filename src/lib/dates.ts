/**
 * Calendar dates in the user's own time zone (India). `toISOString()` is UTC, so
 * before 5:30 AM IST it gives yesterday's date: a night pour or an early roll-call
 * would be recorded on the wrong day.
 */
export function isoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Today's date, YYYY-MM-DD, in local time. */
export function todayIso(): string {
  return isoDate(new Date());
}
