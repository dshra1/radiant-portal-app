import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileText, Upload, FileDown, Trash2, ExternalLink } from "lucide-react";
import { Shell } from "@/components/saha/Shell";
import { supabase } from "@/integrations/supabase/client";
import { useActiveProject } from "@/hooks/useActiveProject";
import { useAccess } from "@/lib/access";

export const Route = createFileRoute("/drawing-decipher")({
  head: () => ({
    meta: [
      { title: "Drawings & Documents Register — Saha OS" },
      { name: "description", content: "Upload drawing revisions, open and delete project documents and export the drawing register for your project." },
      { property: "og:title", content: "Drawings & Documents Register — Saha OS" },
      { property: "og:description", content: "Upload drawing revisions, open and delete project documents and export the drawing register." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

const BUCKET = "project-drawings";

function fmtSize(bytes: number) {
  if (!bytes) return "—";
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function esc(v: string) {
  return `"${String(v).replace(/"/g, '""')}"`;
}

function Page() {
  const project = useActiveProject();
  const qc = useQueryClient();
  const { access } = useAccess();
  const canEdit = Boolean(access?.isAdmin || access?.roles.some((r) => r === "pm" || r === "site_engineer"));
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");

  const filesQuery = useQuery({
    queryKey: ["project-drawings", project.id],
    enabled: Boolean(project.id),
    queryFn: async () => {
      const { data, error } = await supabase.storage
        .from(BUCKET)
        .list(project.id, { limit: 200, sortBy: { column: "created_at", order: "desc" } });
      if (error) throw error;
      return (data ?? []).filter((f) => f.name !== ".emptyFolderPlaceholder");
    },
  });

  const files = (filesQuery.data ?? []).filter((f) =>
    f.name.toLowerCase().includes(search.trim().toLowerCase()),
  );

  const uploadMutation = useMutation({
    mutationFn: async (list: FileList) => {
      for (const file of Array.from(list)) {
        const path = `${project.id}/${Date.now()}-${file.name.replace(/[^\w.\-]+/g, "_")}`;
        const { error } = await supabase.storage.from(BUCKET).upload(path, file);
        if (error) throw error;
      }
      return list.length;
    },
    onSuccess: async (n) => {
      setStatus(`${n} file${n > 1 ? "s" : ""} uploaded to this project.`);
      await qc.invalidateQueries({ queryKey: ["project-drawings", project.id] });
    },
    onError: (e: Error) => setStatus(`Upload failed: ${e.message}`),
  });

  const deleteMutation = useMutation({
    mutationFn: async (name: string) => {
      const { error } = await supabase.storage.from(BUCKET).remove([`${project.id}/${name}`]);
      if (error) throw error;
    },
    onSuccess: async () => {
      setStatus("File removed.");
      await qc.invalidateQueries({ queryKey: ["project-drawings", project.id] });
    },
    onError: (e: Error) => setStatus(`Delete failed: ${e.message}`),
  });

  const open = async (name: string) => {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(`${project.id}/${name}`, 3600);
    if (error || !data) {
      setStatus(error?.message ?? "Could not open this file.");
      return;
    }
    window.open(data.signedUrl, "_blank", "noreferrer");
  };

  const exportRegister = () => {
    if (files.length === 0) {
      setStatus("Nothing to export yet — upload a drawing first.");
      return;
    }
    const csv = [
      ["File", "Size", "Uploaded", "Type"].map(esc).join(","),
      ...files.map((f) =>
        [
          f.name,
          fmtSize(Number(f.metadata?.['size'] ?? 0)),
          f.created_at ? new Date(f.created_at).toLocaleString("en-IN") : "—",
          String(f.metadata?.['mimetype'] ?? "—"),
        ]
          .map(esc)
          .join(","),
      ),
    ].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `drawing-register-${(project.name || "project").replace(/\s+/g, "-")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setStatus(`Exported ${files.length} rows.`);
  };

  return (
    <Shell title="Drawings & Documents">
      <div className="space-y-6">
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/80">
            Drawing register · {project.name}
          </p>
          <h1 className="flex items-center gap-3 text-2xl font-extrabold uppercase tracking-tight text-foreground sm:text-3xl">
            <FileText className="h-7 w-7 text-primary" />
            Drawings & Documents
          </h1>
          <p className="max-w-3xl text-sm text-muted-foreground">
            Upload drawing revisions, tender documents and approvals for this project. Files are stored
            privately and can be opened, downloaded or removed here.
          </p>
        </header>

        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-4">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search files…"
            className="min-w-[220px] flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={exportRegister}
            className="inline-flex items-center gap-2 rounded-xl border border-primary/40 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary"
          >
            <FileDown className="h-4 w-4" />
            Export register
          </button>
          {canEdit ? (
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
              <Upload className="h-4 w-4" />
              {uploadMutation.isPending ? "Uploading…" : "Upload revision"}
              <input
                type="file"
                multiple
                className="hidden"
                disabled={!project.id || uploadMutation.isPending}
                onChange={(e) => {
                  if (e.target.files?.length) uploadMutation.mutate(e.target.files);
                  e.target.value = "";
                }}
              />
            </label>
          ) : (
            <span className="text-xs text-muted-foreground">View only for your role</span>
          )}
        </div>

        {status ? (
          <p className="rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-foreground">
            {status}
          </p>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { label: "Files on record", value: String((filesQuery.data ?? []).length) },
            {
              label: "Total size",
              value: fmtSize(
                (filesQuery.data ?? []).reduce((s, f) => s + Number(f.metadata?.['size'] ?? 0), 0),
              ),
            },
            {
              label: "Latest upload",
              value:
                filesQuery.data?.[0]?.created_at
                  ? new Date(filesQuery.data[0].created_at!).toLocaleDateString("en-IN")
                  : "—",
            },
          ].map((c) => (
            <div key={c.label} className="rounded-2xl border border-emerald-600/30 bg-emerald-600/5 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">{c.label}</p>
              <p className="mt-1 text-xl font-bold text-foreground">{c.value}</p>
            </div>
          ))}
        </div>

        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="border-b border-border bg-muted/40 px-4 py-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-primary">Document register</h2>
          </div>
          {!project.id ? (
            <p className="p-6 text-sm text-muted-foreground">Add a project first, then upload its drawings.</p>
          ) : filesQuery.isPending ? (
            <p className="p-6 text-sm text-muted-foreground">Loading files…</p>
          ) : filesQuery.error ? (
            <p className="p-6 text-sm text-destructive">{(filesQuery.error as Error).message}</p>
          ) : files.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">
              No documents yet — use Upload revision to add drawings for {project.name}.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <th className="px-4 py-2">File</th>
                    <th className="px-4 py-2">Size</th>
                    <th className="px-4 py-2">Uploaded</th>
                    <th className="px-4 py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {files.map((f) => (
                    <tr key={f.name} className="border-b border-border/60">
                      <td className="px-4 py-2 font-medium text-foreground">
                        {f.name.replace(/^\d+-/, "")}
                      </td>
                      <td className="px-4 py-2">{fmtSize(Number(f.metadata?.['size'] ?? 0))}</td>
                      <td className="px-4 py-2">
                        {f.created_at ? new Date(f.created_at).toLocaleString("en-IN") : "—"}
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => open(f.name)}
                            className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            Open
                          </button>
                          {canEdit ? (
                            <button
                              type="button"
                              onClick={() => deleteMutation.mutate(f.name)}
                              className="inline-flex items-center gap-1 rounded-lg border border-destructive/40 px-3 py-1.5 text-xs font-semibold text-destructive"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Delete
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Shell>
  );
}
