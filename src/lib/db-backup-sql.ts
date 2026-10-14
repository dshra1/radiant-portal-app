/**
 * Builds the restore SQL from a table dump. No imports, so it can be tested
 * on its own against a local Postgres.
 */
import { BACKUP_TABLES } from "./db-backup-tables";

type Row = Record<string, unknown>;
export type Dump = Record<string, Row[]>;

/** Columns that point to a sign-in account (auth.users). */
const USER_COLUMNS: Record<string, string[]> = {
  bill_payments: ["created_by"],
  bills: ["created_by"],
  boq_change_requests: ["decided_by", "requested_by"],
  capital_entries: ["created_by"],
  labour_entries: ["created_by"],
  notifications: ["recipient_id", "sender_id"],
  owner_decisions: ["decided_by"],
  owner_requests: ["raised_by"],
  pour_cards: ["approved_by", "created_by"],
  price_quotes: ["created_by"],
  profiles: ["id"],
  project_charges: ["created_by"],
  project_media: ["uploaded_by"],
  qa_inspections: ["created_by"],
  rfq_bids: ["created_by"],
  rfqs: ["created_by"],
  site_stages: ["created_by"],
  stock_items: ["created_by"],
  stock_movements: ["created_by"],
  team_messages: ["recipient_id", "sender_id"],
  user_roles: ["user_id"],
  vendors: ["created_by"],
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function sqlString(s: string) {
  return `'${s.replace(/'/g, "''")}'`;
}

/** A dollar-quote tag that does not occur inside the text. */
function dollarTag(text: string) {
  let n = 0;
  while (text.includes(`$bk${n}$`)) n++;
  return `$bk${n}$`;
}

function jsonLiteral(value: unknown) {
  const text = JSON.stringify(value);
  const tag = dollarTag(text);
  return `${tag}${text}${tag}::jsonb`;
}

export function buildRestoreSql(
  dump: Dump,
  opts: { includeSchema: boolean; sourceUrl: string; schemaSql: string },
): string {
  const out: string[] = [];
  const stamp = new Date().toISOString();
  out.push(
    "-- Saha OS (radiant-portal-app) full backup",
    `-- Taken ${stamp} from ${opts.sourceUrl}`,
    "-- Restore: paste into the SQL Editor of a NEW, EMPTY Supabase project and press Run.",
    "-- Users get their accounts back without passwords: each one uses 'Forgot password' once.",
    "",
    "begin;",
    "",
  );
  if (opts.includeSchema) {
    out.push(
      "-- ========== 1. tables, functions, policies, buckets ==========",
      opts.schemaSql,
      "",
      // The early setup scripts add demo rows (sample projects, chat messages); start clean.
      "-- remove the demo rows the setup scripts add",
      `truncate table ${BACKUP_TABLES.map((t) => `public.${t}`).join(", ")} cascade;`,
      "",
    );
  }

  // ---- 2. sign-in accounts ----
  const profiles = (dump["profiles"] ?? []) as Row[];
  const people = new Map<string, { email: string; name: string }>();
  for (const p of profiles) {
    const id = String(p["id"] ?? "");
    if (UUID_RE.test(id))
      people.set(id, { email: String(p["email"] ?? ""), name: String(p["full_name"] ?? "") });
  }
  // Every account id referenced anywhere must exist, or the links would break.
  const referenced = new Set<string>();
  for (const [table, cols] of Object.entries(USER_COLUMNS)) {
    for (const r of dump[table] ?? []) {
      for (const c of cols) {
        const v = r[c];
        if (typeof v === "string" && UUID_RE.test(v)) referenced.add(v);
      }
    }
  }
  const placeholders = [...referenced].filter((id) => !people.has(id));

  out.push("-- ========== 2. sign-in accounts (same ids, no passwords) ==========");
  const accounts = [
    ...[...people].map(([id, p]) => ({
      id,
      email: p.email || `user-${id}@invalid.local`,
      name: p.name,
      confirmed: Boolean(p.email),
    })),
    ...placeholders.map((id) => ({
      id,
      email: `removed-${id}@invalid.local`,
      name: "",
      confirmed: false,
    })),
  ];
  for (const a of accounts) {
    const meta = jsonLiteral({ full_name: a.name });
    out.push(
      `insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change)` +
        ` values ('00000000-0000-0000-0000-000000000000', ${sqlString(a.id)}, 'authenticated', 'authenticated', ${sqlString(a.email.toLowerCase())}, '', ${a.confirmed ? "now()" : "null"}, '{"provider":"email","providers":["email"]}'::jsonb, ${meta}, now(), now(), '', '', '', '')` +
        ` on conflict (id) do nothing;`,
    );
    if (a.confirmed) {
      out.push(
        `insert into auth.identities (provider_id, user_id, identity_data, provider, created_at, updated_at)` +
          ` values (${sqlString(a.id)}, ${sqlString(a.id)}, ${jsonLiteral({ sub: a.id, email: a.email.toLowerCase(), email_verified: true })}, 'email', now(), now())` +
          ` on conflict do nothing;`,
      );
    }
  }
  // The new-user triggers add default roles; the backup's roles replace them.
  if (accounts.length) {
    out.push(
      `delete from public.user_roles where user_id in (${accounts.map((a) => sqlString(a.id)).join(", ")});`,
    );
  }
  out.push("");

  // ---- 3. data ----
  out.push("-- ========== 3. data ==========");
  for (const table of BACKUP_TABLES) {
    const rows = dump[table] ?? [];
    if (!rows.length) continue;
    const cols = Object.keys(rows[0]!);
    const colList = cols.map((c) => `"${c}"`).join(", ");
    const conflict =
      table === "profiles"
        ? `on conflict (id) do update set (${colList}) = (${cols.map((c) => `excluded."${c}"`).join(", ")})`
        : "on conflict do nothing";
    out.push(
      `-- ${table}: ${rows.length} rows`,
      `insert into public.${table} (${colList}) select ${colList} from jsonb_populate_recordset(null::public.${table}, ${jsonLiteral(rows)}) ${conflict};`,
    );
  }
  if (placeholders.length) {
    out.push(
      "",
      "-- Accounts that no longer had a profile are kept only so old records still point somewhere; hide them from the team list.",
      "delete from public.profiles where email like 'removed-%@invalid.local';",
    );
  }
  out.push("", "commit;", "");
  return out.join("\n");
}
