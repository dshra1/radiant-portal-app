import { createFileRoute } from "@tanstack/react-router";
import { buildPushHTTPRequest } from "@pushforge/builder";

/**
 * Phone alerts. The database calls this after every new team message or notification (trigger
 * push_after_insert), with only {table, id}. The row is read here with the server key, so the call needs no
 * secret: a caller can at most cause a fresh row to be sent, and push_sent makes sure each row is sent once.
 *
 * Who gets it: the row's recipient when it has one, otherwise every approved member; never the sender.
 */
type Row = {
  id: string;
  created_at: string;
  sender_id: string | null;
  recipient_id: string | null;
  project_id: string | null;
  title?: string;
  body?: string;
  link?: string;
  priority?: string;
  author_name?: string;
  channel?: string;
  is_task?: boolean;
};
type Sub = { id: string; user_id: string; endpoint: string; p256dh: string; auth: string };

const json = (o: unknown, status = 200) =>
  new Response(JSON.stringify(o), { status, headers: { "content-type": "application/json" } });

const short = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1).trimEnd() + "…" : s);

function message(table: string, r: Row) {
  if (table === "team_messages") {
    const who = r.author_name || "Team";
    return {
      title: r.is_task ? `New task from ${who}` : r.recipient_id ? `${who} (direct message)` : `${who} in team chat`,
      body: short(r.body ?? "", 160),
      url: r.is_task ? "/tasks" : "/messages",
      tag: `msg-${r.channel ?? "general"}`,
    };
  }
  return {
    title: (r.priority === "High" || r.priority === "Urgent" ? "Urgent: " : "") + (r.title ?? "New alert"),
    body: short(r.body ?? "", 160),
    url: r.link && r.link.startsWith("/") ? r.link : "/notifications",
    tag: `note-${r.id}`,
  };
}

export const Route = createFileRoute("/api/push/send")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const jwk = process.env["VAPID_PRIVATE_JWK"];
        if (!jwk) return json({ skipped: "VAPID_PRIVATE_JWK is not set" });
        let b: { table?: string; id?: string };
        try {
          b = (await request.json()) as typeof b;
        } catch {
          return json({ error: "bad body" }, 400);
        }
        const table = b.table === "team_messages" || b.table === "notifications" ? b.table : null;
        if (!table || !/^[0-9a-f-]{36}$/i.test(b.id ?? "")) return json({ error: "bad body" }, 400);

        const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
        const got = await db.from(table).select("*").eq("id", b.id!).maybeSingle();
        const r = got.data as Row | null;
        if (!r) return json({ skipped: "not found" });
        if (Date.now() - new Date(r.created_at).getTime() > 10 * 60_000) return json({ skipped: "old" });

        const claim = await db
          .from("push_sent" as never)
          .upsert({ source: table, row_id: r.id } as never, { onConflict: "source,row_id", ignoreDuplicates: true })
          .select();
        if (claim.error) return json({ error: claim.error.message }, 500);
        if (!claim.data?.length) return json({ skipped: "already sent" });

        let users: string[];
        if (r.recipient_id) users = [r.recipient_id];
        else {
          const p = await db.from("profiles").select("id").eq("status", "approved");
          users = (p.data ?? []).map((x) => x.id);
        }
        users = users.filter((u) => u && u !== r.sender_id);
        if (!users.length) return json({ sent: 0 });

        const s = await db
          .from("push_subscriptions" as never)
          .select("id,user_id,endpoint,p256dh,auth")
          .in("user_id" as never, users as never);
        const subs = (s.data ?? []) as unknown as Sub[];
        const payload = message(table, r);
        let sent = 0;
        const gone: string[] = [];
        await Promise.all(
          subs.map(async (sub) => {
            try {
              const req = await buildPushHTTPRequest({
                privateJWK: jwk,
                subscription: { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
                message: {
                  payload,
                  adminContact: "mailto:support@siteyantra.com",
                  options: { ttl: 24 * 3600, urgency: "high" },
                },
              });
              const res = await fetch(req.endpoint, { method: "POST", headers: req.headers, body: req.body });
              if (res.status === 404 || res.status === 410) gone.push(sub.id);
              else if (res.ok) sent++;
            } catch {
              /* one bad device must not stop the others */
            }
          }),
        );
        if (gone.length) await db.from("push_subscriptions" as never).delete().in("id" as never, gone as never);
        return json({ sent, devices: subs.length, removed: gone.length });
      },
    },
  },
});
