import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Per-person read status for notifications.
 *
 * - A notification addressed to one person (recipient_id set) keeps using the
 *   shared `is_read` flag: only that recipient reads it.
 * - A team-wide notification (recipient_id null) is read per person through
 *   the `notification_reads` table, so one person reading it does not hide it
 *   for everyone else.
 */

export type ReadableNote = {
  id: string;
  recipient_id: string | null;
  is_read: boolean;
};

/** How many team-wide notifications to look back over when counting unread. */
const TEAM_WIDE_WINDOW = 300;

/** Ids of team-wide notifications the user has read. */
export async function fetchReadIds(userId: string): Promise<Set<string>> {
  const { data, error } = await supabase
    .from("notification_reads")
    .select("notification_id")
    .eq("user_id", userId);
  if (error) throw error;
  return new Set((data ?? []).map((r) => r.notification_id));
}

/** True when this notification is unread for this user. */
export function isUnreadFor(n: ReadableNote, readIds: Set<string>): boolean {
  // addressed items keep the recipient's own flag (an admin viewing someone
  // else's item sees that person's status, and cannot change it)
  if (n.recipient_id) return !n.is_read;
  return !readIds.has(n.id);
}

/** Mark one notification read (or unread) for the signed-in user only. */
export async function setNotificationRead(
  n: ReadableNote,
  userId: string,
  read: boolean,
): Promise<void> {
  if (n.recipient_id) {
    if (n.recipient_id !== userId) return; // never mark someone else's item read
    const { error } = await supabase.from("notifications").update({ is_read: read }).eq("id", n.id);
    if (error) throw error;
    return;
  }
  if (read) {
    const { error } = await supabase
      .from("notification_reads")
      .upsert(
        { notification_id: n.id, user_id: userId },
        { onConflict: "notification_id,user_id", ignoreDuplicates: true },
      );
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from("notification_reads")
      .delete()
      .eq("notification_id", n.id)
      .eq("user_id", userId);
    if (error) throw error;
  }
}

/** Mark many notifications read for the signed-in user only. */
export async function markNotificationsRead(notes: ReadableNote[], userId: string): Promise<void> {
  const own = notes.filter((n) => n.recipient_id === userId && !n.is_read).map((n) => n.id);
  const team = notes.filter((n) => !n.recipient_id).map((n) => n.id);
  if (own.length > 0) {
    const { error } = await supabase.from("notifications").update({ is_read: true }).in("id", own);
    if (error) throw error;
  }
  if (team.length > 0) {
    const { error } = await supabase.from("notification_reads").upsert(
      team.map((id) => ({ notification_id: id, user_id: userId })),
      { onConflict: "notification_id,user_id", ignoreDuplicates: true },
    );
    if (error) throw error;
  }
}

/** Mark everything unread for this user as read: their own items and every team-wide notice. */
export async function markAllNotificationsRead(userId: string): Promise<void> {
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("recipient_id", userId)
    .eq("is_read", false);
  if (error) throw error;
  const [{ data: team, error: tErr }, readIds] = await Promise.all([
    supabase
      .from("notifications")
      .select("id")
      .is("recipient_id", null)
      .order("created_at", { ascending: false })
      .limit(1000),
    fetchReadIds(userId),
  ]);
  if (tErr) throw tErr;
  const toMark = (team ?? []).map((n) => n.id).filter((id) => !readIds.has(id));
  if (toMark.length === 0) return;
  const { error: rErr } = await supabase.from("notification_reads").upsert(
    toMark.map((id) => ({ notification_id: id, user_id: userId })),
    { onConflict: "notification_id,user_id", ignoreDuplicates: true },
  );
  if (rErr) throw rErr;
}

/** Count of notifications unread for this user (own addressed items + team-wide not yet read). */
export async function countUnreadNotifications(
  userId: string,
  opts: { categories?: string[]; addressedOnly?: boolean } = {},
): Promise<number> {
  let own = supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("recipient_id", userId)
    .eq("is_read", false);
  if (opts.categories) own = own.in("category", opts.categories);
  const { count: ownCount, error } = await own;
  if (error) throw error;
  if (opts.addressedOnly) return ownCount ?? 0;

  let team = supabase
    .from("notifications")
    .select("id")
    .is("recipient_id", null)
    .order("created_at", { ascending: false })
    .limit(TEAM_WIDE_WINDOW);
  if (opts.categories) team = team.in("category", opts.categories);
  const [{ data: teamRows, error: tErr }, readIds] = await Promise.all([
    team,
    fetchReadIds(userId),
  ]);
  if (tErr) throw tErr;
  const teamUnread = (teamRows ?? []).filter((n) => !readIds.has(n.id)).length;
  return (ownCount ?? 0) + teamUnread;
}

/** The set of team-wide notification ids this user has read (shared query key). */
export function useNotificationReadIds(userId: string | null | undefined) {
  return useQuery({
    queryKey: ["notifications", "reads", userId],
    enabled: Boolean(userId),
    queryFn: () => fetchReadIds(userId!),
    refetchInterval: 15000,
  });
}

/**
 * Unread notification count for the signed-in user, per person.
 * Use `{ categories: ["Chat", "Task"], addressedOnly: true }` for the chat badge.
 */
export function useUnreadNotificationCount(
  userId: string | null | undefined,
  opts: { categories?: string[]; addressedOnly?: boolean } = {},
) {
  return useQuery({
    queryKey: [
      "notifications",
      "unread-count-per-user",
      userId,
      opts.categories?.join(",") ?? "",
      Boolean(opts.addressedOnly),
    ],
    enabled: Boolean(userId),
    queryFn: () => countUnreadNotifications(userId!, opts),
    refetchInterval: 6000,
    refetchOnWindowFocus: true,
  });
}
