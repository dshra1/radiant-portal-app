/**
 * Full backup of the app's database as one SQL file, for moving to a new,
 * empty Supabase project. The file is built in the admin's browser from what
 * the admin can read and downloaded straight to their computer; nothing is
 * sent anywhere else.
 *
 * The restore file:
 *  1. (optional) creates every table, function, policy and storage bucket
 *     (supabase/setup/schema.sql, the 43 migrations in order);
 *  2. creates the sign-in accounts with the same ids and e-mails, without
 *     passwords: each person sets a new one with "Forgot password";
 *  3. loads every table in dependency order, keeping all ids.
 * It runs inside one transaction, so it either applies fully or not at all.
 */
import { supabase } from "@/integrations/supabase/client";
import schemaSql from "../../supabase/setup/schema.sql?raw";
import { BACKUP_TABLES } from "./db-backup-tables";
import { buildRestoreSql as build, type Dump } from "./db-backup-sql";

export { BACKUP_TABLES };
export type { Dump };

export const BACKUP_BUCKETS = [
  "project-drawings",
  "site-media",
  "boq-images",
  "owner-approvals",
  "chat-attachments",
  "financial-docs",
  "price-proformas",
] as const;

type Row = Record<string, unknown>;

const PAGE = 1000;

export async function readAllTables(onTable?: (t: string, n: number) => void): Promise<Dump> {
  const dump: Dump = {};
  for (const table of BACKUP_TABLES) {
    const rows: Row[] = [];
    for (let from = 0; ; from += PAGE) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from(table)
        .select("*")
        .range(from, from + PAGE - 1);
      if (error) throw new Error(`${table}: ${error.message}`);
      rows.push(...((data ?? []) as Row[]));
      if (!data || data.length < PAGE) break;
    }
    dump[table] = rows;
    onTable?.(table, rows.length);
  }
  return dump;
}

export function buildRestoreSql(dump: Dump, opts: { includeSchema: boolean; sourceUrl: string }) {
  return build(dump, { ...opts, schemaSql });
}

// ---------- files ----------

export type StoredFile = { bucket: string; path: string; size: number };

export async function listAllFiles(): Promise<{ files: StoredFile[]; errors: string[] }> {
  const files: StoredFile[] = [];
  const errors: string[] = [];
  const walk = async (bucket: string, prefix: string) => {
    const { data, error } = await supabase.storage.from(bucket).list(prefix, { limit: 1000 });
    if (error) {
      errors.push(`${bucket}: ${error.message}`);
      return;
    }
    for (const item of data ?? []) {
      const path = prefix ? `${prefix}/${item.name}` : item.name;
      if (item.id === null) await walk(bucket, path);
      else if (item.name !== ".emptyFolderPlaceholder")
        files.push({ bucket, path, size: Number(item.metadata?.["size"] ?? 0) });
    }
  };
  for (const b of BACKUP_BUCKETS) await walk(b, "");
  return { files, errors };
}

/** bucket + path packed into one safe file name, and back. */
const SEP = "~~";
export function packedName(f: { bucket: string; path: string }) {
  return [f.bucket, ...f.path.split("/")].join(SEP);
}
export function unpackName(name: string): { bucket: string; path: string } | null {
  const parts = name.split(SEP);
  if (parts.length < 2) return null;
  const [bucket, ...rest] = parts;
  if (!(BACKUP_BUCKETS as readonly string[]).includes(bucket!)) return null;
  return { bucket: bucket!, path: rest.join("/") };
}

export function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
