import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Upload, Images, FileText, HardHat } from "lucide-react";
import { Shell } from "@/components/saha/Shell";
import { supabase } from "@/integrations/supabase/client";
import { useActiveProject } from "@/hooks/useActiveProject";
import { useSessionUser } from "@/lib/access";
import { MEDIA_CATEGORIES } from "./site-media";

export const Route = createFileRoute("/media-upload-studio")({
  head: () => ({
    meta: [
      { title: "Media Upload Studio | Saha OS" },
      {
        name: "description",
        content:
          "Bulk-upload dated site photos and videos with stage, area and caption details straight into the project record.",
      },
      { property: "og:title", content: "Media Upload Studio | Saha OS" },
      {
        property: "og:description",
        content: "Bulk upload site photos and videos with stage and caption details.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  const project = useActiveProject();
  const user = useSessionUser();
  const queryClient = useQueryClient();
  const enabled = Boolean(user?.id) && Boolean(project.id);

  const [files, setFiles] = useState<File[]>([]);
  const [category, setCategory] = useState<string>("progress");
  const [stage, setStage] = useState("");
  const [caption, setCaption] = useState("");
  const [capturedOn, setCapturedOn] = useState(new Date().toISOString().slice(0, 10));
  const [progress, setProgress] = useState(0);

  const recent = useQuery({
    queryKey: ["project_media", "recent", project.id],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_media")
        .select("id,title,caption,category,stage,captured_on")
        .eq("project_id", project.id)
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data ?? [];
    },
  });

  const upload = useMutation({
    mutationFn: async () => {
      if (!project.id) throw new Error("Select a project first");
      if (files.length === 0) throw new Error("Choose files to upload");
      let done = 0;
      for (const file of files) {
        const safe = file.name.replace(/[^\w.\-]+/g, "_");
        const path = `${project.id}/${Date.now()}-${safe}`;
        const { error: upErr } = await supabase.storage.from("site-media").upload(path, file, {
          upsert: false,
          contentType: file.type || undefined,
        });
        if (upErr) throw upErr;
        const { error } = await supabase.from("project_media").insert({
          project_id: project.id,
          path,
          title: file.name,
          caption,
          stage,
          category,
          captured_on: capturedOn || null,
          uploaded_by: user?.id ?? null,
          uploaded_by_name: user?.email ?? "",
        });
        if (error) throw error;
        done += 1;
        setProgress(Math.round((done / files.length) * 100));
      }
    },
    onSuccess: async () => {
      toast.success(`${files.length} file(s) added to the project record`);
      setFiles([]);
      setCaption("");
      setProgress(0);
      await queryClient.invalidateQueries({ queryKey: ["project_media"] });
    },
    onError: (e: Error) => {
      setProgress(0);
      toast.error(e.message);
    },
  });

  const inputCls = "rounded-lg border border-border bg-background px-3 py-2 text-sm";

  return (
    <Shell title="Media Upload Studio">
      <div className="flex flex-col gap-6 pb-16">
        <header className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            {project.name} · {project.location}
          </p>
          <h1 className="text-2xl font-bold">Upload studio</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Add a batch of photos or videos in one go, tagged with stage, area and date.
          </p>
        </header>

        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-xs font-semibold uppercase text-muted-foreground">Category</span>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputCls}>
                {MEDIA_CATEGORIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-xs font-semibold uppercase text-muted-foreground">Stage / area</span>
              <input value={stage} onChange={(e) => setStage(e.target.value)} className={inputCls} />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-xs font-semibold uppercase text-muted-foreground">Captured on</span>
              <input
                type="date"
                value={capturedOn}
                onChange={(e) => setCapturedOn(e.target.value)}
                className={inputCls}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-xs font-semibold uppercase text-muted-foreground">Caption</span>
              <input value={caption} onChange={(e) => setCaption(e.target.value)} className={inputCls} />
            </label>
            <label className="flex flex-col gap-1 text-sm md:col-span-3">
              <span className="text-xs font-semibold uppercase text-muted-foreground">Choose files</span>
              <input
                type="file"
                multiple
                accept="image/*,video/*,application/pdf"
                onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
                className={inputCls}
              />
            </label>
            <div className="flex items-end">
              <button
                onClick={() => upload.mutate()}
                disabled={upload.isPending}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
              >
                <Upload className="h-4 w-4" />
                {upload.isPending ? `Uploading ${progress}%` : `Upload ${files.length || ""}`}
              </button>
            </div>
          </div>
          {files.length > 0 ? (
            <ul className="mt-4 grid grid-cols-1 gap-2 text-sm md:grid-cols-2">
              {files.map((f) => (
                <li key={f.name} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                  <span className="truncate">{f.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {(f.size / (1024 * 1024)).toFixed(1)} MB
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
          {upload.isPending ? (
            <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full bg-primary" style={{ width: `${progress}%` }} />
            </div>
          ) : null}
        </section>

        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Just uploaded</h2>
            <Link
              to="/site-media"
              className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold hover:bg-muted"
            >
              Open media library
            </Link>
          </div>
          <ul className="mt-3 divide-y divide-border">
            {(recent.data ?? []).length === 0 ? (
              <li className="py-6 text-center text-sm text-muted-foreground">
                Nothing uploaded for this project yet.
              </li>
            ) : null}
            {(recent.data ?? []).map((m) => (
              <li key={m.id} className="flex items-center justify-between py-3 text-sm">
                <div>
                  <p className="font-semibold">{m.caption || m.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {[m.category, m.stage, m.captured_on].filter(Boolean).join(" · ")}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Link
            to="/site-media"
            className="rounded-2xl border border-border bg-card p-5 shadow-sm hover:border-primary"
          >
            <Images className="h-5 w-5 text-primary" />
            <p className="mt-2 font-semibold">Media library</p>
            <p className="text-xs text-muted-foreground">Browse, download or remove project media.</p>
          </Link>
          <Link
            to="/drawing-decipher"
            className="rounded-2xl border border-border bg-card p-5 shadow-sm hover:border-primary"
          >
            <FileText className="h-5 w-5 text-primary" />
            <p className="mt-2 font-semibold">Drawings</p>
            <p className="text-xs text-muted-foreground">Upload and read the drawing register.</p>
          </Link>
          <Link
            to="/qa-inspection"
            className="rounded-2xl border border-border bg-card p-5 shadow-sm hover:border-primary"
          >
            <HardHat className="h-5 w-5 text-primary" />
            <p className="mt-2 font-semibold">QA inspections</p>
            <p className="text-xs text-muted-foreground">Log what the photos show.</p>
          </Link>
        </div>
      </div>
    </Shell>
  );
}
