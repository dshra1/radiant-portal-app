import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import * as D from "@/lib/ask-data.server";

/**
 * Voice (Alexa) for the Construction app. One Alexa skill, "saha site", serves both SiteYantra apps:
 * Amazon calls the Interiorz server (which checks Amazon's signature), and that server asks this endpoint
 * about construction projects. Only that server may call it: every action except "code" needs the shared
 * key VOICE_BRIDGE_KEY in the x-voice-key header.
 *
 *   code      signed-in user  -> a 6-digit code to say: "Alexa, ask saha site to link code 482193"
 *   link      {code}          -> {user_id, name}   (code works once, for 10 minutes)
 *   projects  {user_id}       -> the user's projects
 *   ask       {user_id, project_id, question} -> {speech, card_title, card}
 *
 * Answers use the same read-only lookups as Ask (ask-data.server), so figures come from the records.
 * Nothing is ever saved by voice. Landowner/investor logins cannot use voice.
 */
const VOICE_ROLES = [
  "admin",
  "pm",
  "site_engineer",
  "site_supervisor",
  "purchase_stores",
  "accounts",
];
const MONEY_ROLES = ["admin", "pm", "accounts", "purchase_stores"];
const CODE_MINUTES = 10;

const json = (o: unknown, status = 200) =>
  new Response(JSON.stringify(o), { status, headers: { "content-type": "application/json" } });

async function sha256(s: string) {
  const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode("voice:" + s));
  return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");
}

function sameKey(a: string, b: string) {
  if (!a || !b || a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

async function member(userId: string) {
  const [p, r] = await Promise.all([
    supabaseAdmin.from("profiles").select("status,full_name,email").eq("id", userId).maybeSingle(),
    supabaseAdmin.from("user_roles").select("role").eq("user_id", userId),
  ]);
  const prof = (p.data ?? null) as { status?: string; full_name?: string; email?: string } | null;
  const roles = ((r.data ?? []) as { role: string }[]).map((x) => x.role);
  if (!prof || prof.status !== "approved")
    return { ok: false as const, why: "This login is not approved." };
  if (!roles.some((x) => VOICE_ROLES.includes(x)))
    return { ok: false as const, why: "Voice answers are for site and office staff logins." };
  return { ok: true as const, name: prof.full_name || prof.email || "", roles };
}

/** Which lookup a spoken question means. No AI: plain word rules, so it is fast and costs nothing. */
export function voiceKind(question: string): { kind: string; q: string; days: number } {
  const t = ` ${question.toLowerCase().replace(/what's/g, "what is")} `;
  const days =
    Number((t.match(/next (\d{1,3}) days?/) ?? [])[1] ?? 0) || (/\bnext (week)\b/.test(t) ? 7 : 14);
  const strip = (s: string) =>
    s
      .replace(
        /\b(how|much|many|what|is|are|the|of|do|we|have|has|in|at|on|for|stock|balance|left|available|there|our|site|store|still|to|come|any|bags?|please|tell|me|about)\b/g,
        " ",
      )
      .replace(/\s+/g, " ")
      .trim();
  if (/\b(material requests?|requests? pending|indents?)\b/.test(t))
    return { kind: "requests", q: "", days };
  if (/\b(owe|owed|due to|balance (with|for|of)|payable to|pay to)\b/.test(t))
    return {
      kind: "owe",
      q: strip(
        t.replace(
          /\b(owe|owed|due|payable|pay|balance|with|for|to|we|how|much|do|does|is)\b/g,
          " ",
        ),
      ),
      days,
    };
  if (/\b(machines?|jcb|excavator|diesel|equipment)\b/.test(t))
    return { kind: "machines", q: "", days };
  if (/\b(purchase orders?|pos?|orders? pending|pending orders?)\b/.test(t))
    return { kind: "pos", q: "", days };
  if (/\b(low|reorder|running out|run out|short of stock)\b/.test(t))
    return { kind: "low", q: "", days };
  if (/\bboq\b/.test(t)) return { kind: "boq", q: strip(t.replace(/\bboq\b/, " ")), days };
  if (/\b(next \d+ days?|next week|coming weeks?|upcoming|need next|needed next)\b/.test(t))
    return { kind: "upcoming", q: "", days };
  if (
    /\b(stage|slab|floor|plaster|plastering|brickwork|footing|column)\b/.test(t) &&
    /\b(need|needed|material|materials)\b/.test(t)
  )
    return {
      kind: "stage",
      q: strip(t.replace(/\b(need|needed|material|materials|for|stage)\b/g, " ")),
      days,
    };
  if (/\b(now|today|on site|happening|going on|progress|late|delayed|next|current)\b/.test(t))
    return { kind: "now", q: "", days };
  return { kind: "stock", q: strip(t), days };
}

const money = (s: unknown) => String(s).replace(/₹/g, "rupees ");

export function speak(kind: string, t: D.AskTable): string {
  const rows = t.rows ?? [];
  const note = (t.note ?? "").trim();
  if (!rows.length) return note || "Nothing recorded for that yet.";
  const head = rows.length > 3 ? `${rows.length} items. The first three: ` : "";
  const take = rows.slice(0, 3);
  let bits: string[] = [];
  if (kind === "stock") bits = take.map((r) => `${r[0]}: ${r[2]} ${r[1]} in stock`);
  else if (kind === "low")
    bits = take.map((r) => `${r[0]}: ${r[2]} ${r[1]} left, reorder at ${r[3]}`);
  else if (kind === "stage" || kind === "upcoming")
    bits = take.map(
      (r) =>
        `${r[0]}: need ${r[2]} ${r[1]}, ${Number(String(r[4]).replace(/,/g, "")) > 0 ? `short by ${r[4]}` : "enough in stock"}`,
    );
  else if (kind === "now") {
    const late = rows
      .filter((r) => String(r[0]).includes("(late)"))
      .map((r) => String(r[0]).replace(" (late)", ""));
    const on = rows
      .filter((r) => !String(r[0]).includes("(late)"))
      .map((r) => `${r[0]}, ${r[3]} done`);
    return [
      note,
      on.length ? `On now: ${on.slice(0, 3).join("; ")}.` : "",
      late.length ? `Running late: ${late.slice(0, 3).join(", ")}.` : "",
    ]
      .filter(Boolean)
      .join(" ");
  } else if (kind === "boq")
    bits = take.map((r) => `${r[0]}: ${r[2]} ${r[3]} at ${money(r[4])}, amount ${money(r[5])}`);
  else if (kind === "pos") bits = take.map((r) => `${r[1]}, ${r[2]}, delivery ${r[3]}`);
  else if (kind === "requests")
    bits = take.map((r) => `${r[0]} from ${r[1]}, needed by ${r[2]}: ${r[4]}`);
  else if (kind === "owe")
    bits = take.map((r) => `${r[0]}: to pay ${money(r[4])}, retention held ${money(r[3])}`);
  else if (kind === "machines")
    bits = take.map((r) => `${r[0]}: ${r[2]} hours and ${r[3]} litres today`);
  return `${head}${bits.join(". ")}.`;
}

function card(t: D.AskTable) {
  const lines = [t.columns.join(" | "), ...t.rows.slice(0, 25).map((r) => r.join(" | "))];
  if (t.note) lines.push(t.note);
  return lines.join("\n").slice(0, 7000);
}

async function run(kind: string, pid: string, q: string, days: number) {
  const sb = supabaseAdmin as unknown as Parameters<typeof D.stockLookup>[0];
  switch (kind) {
    case "low":
      return D.lowStock(sb, pid);
    case "stage":
      return D.stageNeeds(sb, pid, q);
    case "upcoming":
      return D.upcomingNeeds(sb, pid, days);
    case "now":
      return D.siteNow(sb, pid);
    case "boq":
      return D.boqLookup(sb, pid, q);
    case "pos":
      return D.pendingPOs(sb, pid);
    case "requests":
      return D.openRequests(sb, pid);
    case "owe":
      return D.partyBalance(sb, pid, q);
    case "machines":
      return D.machinesToday(sb, pid);
    default:
      return D.stockLookup(sb, pid, q);
  }
}

export const Route = createFileRoute("/api/voice")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json().catch(() => ({}))) as {
          action?: string;
          code?: string;
          user_id?: string;
          project_id?: string;
          question?: string;
        };

        if (body.action === "code") {
          const token = (request.headers.get("Authorization") ?? "").replace(/^Bearer /i, "");
          if (!token) return json({ error: "Please sign in" }, 401);
          const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
          const sb = createClient(process.env["SUPABASE_URL"]!, key, {
            auth: { persistSession: false, autoRefreshToken: false },
            global: { headers: { apikey: key, Authorization: `Bearer ${token}` } },
          });
          const { data } = await sb.auth.getUser(token);
          const uid = data.user?.id;
          if (!uid) return json({ error: "Please sign in" }, 401);
          const m = await member(uid);
          if (!m.ok) return json({ error: m.why }, 403);
          const code = String(
            100000 + ((crypto.getRandomValues(new Uint32Array(1))[0] ?? 0) % 900000),
          );
          const meta = { ...(data.user?.app_metadata ?? {}) } as Record<string, unknown>;
          meta["voice_code"] = await sha256(code);
          meta["voice_code_expires"] = new Date(Date.now() + CODE_MINUTES * 60000).toISOString();
          const up = await supabaseAdmin.auth.admin.updateUserById(uid, { app_metadata: meta });
          if (up.error) return json({ error: "Could not make a code. Try again." }, 500);
          return json({
            code,
            minutes: CODE_MINUTES,
            say: `Alexa, ask saha site to link code ${code.split("").join(" ")}`,
          });
        }

        const bridge = process.env["VOICE_BRIDGE_KEY"] ?? "";
        if (!bridge)
          return json({ error: "Voice is not set up on this app (VOICE_BRIDGE_KEY)." }, 503);
        if (!sameKey(request.headers.get("x-voice-key") ?? "", bridge))
          return json({ error: "Not allowed" }, 403);

        if (body.action === "link") {
          const code = String(body.code ?? "").replace(/\D/g, "");
          if (code.length !== 6) return json({ ok: false });
          const want = await sha256(code);
          const now = new Date().toISOString();
          for (let page = 1; page <= 10; page++) {
            const { data } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 1000 });
            const users = data?.users ?? [];
            const hit = users.find(
              (u) =>
                u.app_metadata?.["voice_code"] === want &&
                String(u.app_metadata?.["voice_code_expires"] ?? "") > now,
            );
            if (hit) {
              const meta = { ...(hit.app_metadata ?? {}) } as Record<string, unknown>;
              delete meta["voice_code"];
              delete meta["voice_code_expires"];
              await supabaseAdmin.auth.admin.updateUserById(hit.id, { app_metadata: meta });
              const m = await member(hit.id);
              if (!m.ok) return json({ ok: false, why: m.why });
              return json({ ok: true, user_id: hit.id, name: m.name });
            }
            if (users.length < 1000) break;
          }
          return json({ ok: false });
        }

        const uid = String(body.user_id ?? "");
        const m = uid ? await member(uid) : { ok: false as const, why: "Not linked." };
        if (!m.ok) return json({ ok: false, why: m.why });

        if (body.action === "projects") {
          const projects = await D.projectsOf(
            supabaseAdmin as unknown as Parameters<typeof D.projectsOf>[0],
          );
          return json({ ok: true, projects });
        }

        if (body.action === "ask") {
          const pid = String(body.project_id ?? "");
          const question = String(body.question ?? "").slice(0, 400);
          const { kind, q, days } = voiceKind(question);
          if (
            (kind === "boq" || kind === "pos" || kind === "owe") &&
            !m.roles.some((r) => MONEY_ROLES.includes(r))
          )
            return json({
              ok: true,
              speech: "BOQ rates and purchase orders are for the office team.",
              card_title: "",
              card: "",
            });
          const t = await run(kind, pid, q, days);
          return json({
            ok: true,
            kind,
            speech: speak(kind, t),
            card_title: t.title,
            card: card(t),
          });
        }

        return json({ error: "Unknown action" }, 400);
      },
    },
  },
});
