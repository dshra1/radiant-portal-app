import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { DatabaseBackup, Download, Upload, Loader2, ShieldAlert } from "lucide-react";
import { Shell } from "@/components/saha/Shell";
import { Section } from "@/components/saha/ui";
import { supabase } from "@/integrations/supabase/client";
import { useAccess } from "@/lib/access";
import {
  readAllTables,
  buildRestoreSql,
  listAllFiles,
  packedName,
  unpackName,
  downloadBlob,
  type StoredFile,
} from "@/lib/db-backup";

export const Route = createFileRoute("/database-backup")({
  head: () => ({
    meta: [
      { title: "Database Backup — Saha OS" },
      {
        name: "description",
        content:
          "Download a full backup of the project database and files, and restore files into a new database.",
      },
    ],
  }),
  component: Page,
});

const SOURCE_URL = String(import.meta.env["VITE_SUPABASE_URL"] ?? "");

function kb(n: number) {
  return n > 1024 * 1024
    ? `${(n / 1024 / 1024).toFixed(1)} MB`
    : `${Math.max(1, Math.round(n / 1024))} KB`;
}

function Page() {
  const { access, loading } = useAccess();
  const isAdmin = Boolean(access?.isAdmin);
  const [log, setLog] = useState<string[]>([]);
  const [busy, setBusy] = useState("");
  const [includeSchema, setIncludeSchema] = useState(true);
  const [files, setFiles] = useState<StoredFile[] | null>(null);
  const say = (line: string) => setLog((l) => [...l, line]);

  async function backupData() {
    setBusy("data");
    setLog([]);
    try {
      say("Reading every table…");
      const dump = await readAllTables((t, n) => say(`${t}: ${n} rows`));
      const total = Object.values(dump).reduce((s, r) => s + r.length, 0);
      const sql = buildRestoreSql(dump, { includeSchema, sourceUrl: SOURCE_URL });
      const name = `saha-os-backup-${new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-")}.sql`;
      downloadBlob(new Blob([sql], { type: "text/plain" }), name);
      say(
        `Done: ${total.toLocaleString("en-IN")} rows saved to ${name} (${kb(sql.length)}) in your Downloads.`,
      );
    } catch (e) {
      say(`Stopped: ${(e as Error).message}`);
    }
    setBusy("");
  }

  async function findFiles() {
    setBusy("list");
    const { files: list, errors } = await listAllFiles();
    setFiles(list);
    say(`Files: ${list.length} found (${kb(list.reduce((s, f) => s + f.size, 0))}).`);
    for (const e of errors) say(`Could not list ${e}`);
    setBusy("");
  }

  async function downloadFiles() {
    if (!files) return;
    setBusy("files");
    let n = 0;
    for (const f of files) {
      const { data, error } = await supabase.storage.from(f.bucket).download(f.path);
      if (error || !data) {
        say(`✕ ${f.bucket}/${f.path}: ${error?.message ?? "no data"}`);
        continue;
      }
      downloadBlob(data, packedName(f));
      n++;
      await new Promise((r) => setTimeout(r, 400));
    }
    say(
      `Downloaded ${n} of ${files.length} files. Keep their names as they are: the name says where each file goes back.`,
    );
    setBusy("");
  }

  async function restoreFiles(list: FileList) {
    setBusy("restore");
    let ok = 0;
    for (const file of Array.from(list)) {
      const target = unpackName(file.name.replace(/ \(\d+\)(\.[^.]+)$/, "$1"));
      if (!target) {
        say(`Skipped ${file.name}: not a backup file name`);
        continue;
      }
      const { error } = await supabase.storage.from(target.bucket).upload(target.path, file, {
        upsert: true,
        ...(file.type ? { contentType: file.type } : {}),
      });
      if (error) say(`✕ ${target.bucket}/${target.path}: ${error.message}`);
      else ok++;
    }
    say(`Restored ${ok} file${ok === 1 ? "" : "s"} into this database.`);
    setBusy("");
  }

  return (
    <Shell title="Database Backup">
      <div className="space-y-6">
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/80">
            Database · {SOURCE_URL.replace(/^https:\/\//, "")}
          </p>
          <h1 className="flex items-center gap-3 text-2xl font-extrabold uppercase tracking-tight text-foreground sm:text-3xl">
            <DatabaseBackup className="h-7 w-7 text-primary" />
            Database backup
          </h1>
          <p className="max-w-3xl text-sm text-muted-foreground">
            Download everything in this database to your computer: all tables as one restore file,
            and the stored files (drawings, photos, bills, attachments). Use it to keep a copy, or
            to move to your own Supabase project. Nothing is sent anywhere except your Downloads
            folder.
          </p>
        </header>

        {loading ? null : !isAdmin ? (
          <p className="flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
            <ShieldAlert className="h-4 w-4" /> Only an admin can take or restore a backup.
          </p>
        ) : (
          <>
            <Section title="1 · Data (all tables + user accounts)">
              <div className="space-y-3 p-4">
                <label className="flex items-start gap-2 text-sm text-foreground">
                  <input
                    type="checkbox"
                    className="mt-0.5 h-4 w-4"
                    checked={includeSchema}
                    onChange={(e) => setIncludeSchema(e.target.checked)}
                  />
                  <span>
                    Include the database setup (tables, rules, storage buckets) so the file restores
                    into a new, empty Supabase project in one go.
                  </span>
                </label>
                <button
                  type="button"
                  disabled={Boolean(busy)}
                  onClick={() => void backupData()}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
                >
                  {busy === "data" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  Download data backup (.sql)
                </button>
                <p className="text-xs text-muted-foreground">
                  Restore: open the new project's SQL Editor, paste the whole file, press Run.
                  Sign-in accounts come back with the same e-mails but no passwords: each person
                  uses "Forgot password" once.
                </p>
              </div>
            </Section>

            <Section title="2 · Stored files">
              <div className="flex flex-wrap items-center gap-3 p-4">
                <button
                  type="button"
                  disabled={Boolean(busy)}
                  onClick={() => void findFiles()}
                  className="inline-flex items-center gap-2 rounded-xl border border-primary/40 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary disabled:opacity-50"
                >
                  {busy === "list" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Find files
                </button>
                {files && files.length > 0 && (
                  <button
                    type="button"
                    disabled={Boolean(busy)}
                    onClick={() => void downloadFiles()}
                    className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
                  >
                    {busy === "files" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                    Download {files.length} files
                  </button>
                )}
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground">
                  {busy === "restore" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  Restore files into this database
                  <input
                    type="file"
                    multiple
                    className="hidden"
                    disabled={Boolean(busy)}
                    onChange={(e) => {
                      if (e.target.files?.length) void restoreFiles(e.target.files);
                      e.target.value = "";
                    }}
                  />
                </label>
              </div>
            </Section>

            {log.length > 0 && (
              <ul className="space-y-1 rounded-xl border border-border bg-card p-3 text-sm text-foreground">
                {log.map((l, i) => (
                  <li key={i}>{l}</li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </Shell>
  );
}
