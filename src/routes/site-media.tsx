import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Images, Upload, Trash2, Download, CalendarDays } from "lucide-react";
import { Shell } from "@/components/saha/Shell";
import { supabase } from "@/integrations/supabase/client";
import { useActiveProject } from "@/hooks/useActiveProject";
import { useAccess, useSessionUser } from "@/lib/access";

export const Route = createFileRoute("/site-media")({
  head: () => ({
    meta: [
      { title: "Site Photos | Saha OS" },
      {
        name: "description",
        content:
          "Project photo and video record: upload dated site progress, quality and safety media with captions and download them any time.",
      },
      { property: "og:title", content: "Site Photos | Saha OS" },
      {
        property: "og:description",
        content: "Dated site progress, quality and safety photo record for the project.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

export const MEDIA_CATEGORIES = ["progress", "quality", "safety", "material", "handover"] as const;

type Media = {
  id: string;
  path: string;
  title: string;
  caption: string;
  stage: string;
  category: string;
  captured_on: string | null;
  uploaded_by_name: string;
  created_at: string;
};

function Page() {
  const project = useActiveProject();
  const user = useSessionUser();
  const { access } = useAccess();
  const canDelete = Boolean(access?.isAdmin || access?.roles.includes("pm"));
  const queryClient = useQueryClient();
  const enabled = Boolean(user?.id) && Boolean(project.id);

  const [category, setCategory] = useState<string>("progress");
  const [stage, setStage] = useState("");
  const [caption, setCaption] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [thumbs, setThumbs] = useState<Record<string, string>>({});

  const { data: media = [], isPending } = useQuery({
    queryKey: ["project_media", project.id],
    enabled,
    queryFn: async (): Promise<Media[]> => {
      const { data, error } = await supabase
        .from("project_media")
        .select("id,path,title,caption,stage,category,captured_on,uploaded_by_name,created_at")
        .eq("project_id", project.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Media[];
    },
  });

  useEffect(() => {
    let active = true;
    (async () => {
      const images = media.filter((m) => /\.(png|jpe?g|webp|gif|heic)$/i.test(m.path)).slice(0, 60);
      if (images.length === 0) return;
      const { data } = await supabase.storage
        .from("site-media")
        .createSignedUrls(images.map((m) => m.path), 3600);
      if (!active || !data) return;
      const next: Record<string, string> = {};
      images.forEach((m, i) => {
        const url = data[i]?.signedUrl;
        if (url) next[m.id] = url;
      });
      setThumbs(next);
    })();
    return () => {
      active = false;
    };
  }, [media]);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["project_media", project.id] });

  const upload = useMutation({
    mutationFn: async () => {
      if (files.length === 0) throw new Error("Choose at least one photo or video");
      for (const file of files) {
        const safe = file.name.replace(/[^\w.\-]+/g, "_");
        const path = `${project.id}/${Date.now()}-${safe}`;
        const { error: upErr } = await supabase.storage.from("site-media").upload(path, file, {
          upsert: false,
          contentType: file.type || "application/octet-stream",
        });
        if (upErr) throw upErr;
        const { error } = await supabase.from("project_media").insert({
          project_id: project.id,
          path,
          title: file.name,
          caption,
          stage,
          category,
          captured_on: new Date().toISOString().slice(0, 10),
          uploaded_by: user?.id ?? null,
          uploaded_by_name: user?.email ?? "",
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Uploaded to the project record");
      setFiles([]);
      setCaption("");
      setStage("");
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (m: Media) => {
      await supabase.storage.from("site-media").remove([m.path]);
      const { error } = await supabase.from("project_media").delete().eq("id", m.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Removed");
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  async function open(path: string, download = false) {
    const { data, error } = await supabase.storage.from("site-media").createSignedUrl(path, 600, {
      download,
    });
    if (error || !data?.signedUrl) {
      toast.error(error?.message ?? "Could not open the file");
      return;
    }
    window.open(data.signedUrl, "_blank");
  }

  const filtered = useMemo(
    () => (filter === "all" ? media : media.filter((m) => m.category === filter)),
    [media, filter],
  );

  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const m of media) map[m.category] = (map[m.category] ?? 0) + 1;
    return map;
  }, [media]);

  const inputCls = "rounded-lg border border-border bg-background px-3 py-2 text-sm";

  return (
    <Shell title="Site Photos">
      <div className="flex flex-col gap-6 pb-16">
        <header className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            {project.name} · {project.location}
          </p>
          <h1 className="text-2xl font-bold">Site photo record</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Photos stay private to your team and are saved against this project with the date.
          </p>
        </header>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`rounded-2xl border bg-card p-5 text-left shadow-sm hover:bg-muted/50 ${filter === "all" ? "border-primary ring-1 ring-primary" : "border-border"}`}
          >
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <span>All media</span>
              <Images className="h-4 w-4 text-primary" />
            </div>
            <p className="mt-3 text-2xl font-bold">{media.length}</p>
          </button>
          {MEDIA_CATEGORIES.slice(0, 3).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setFilter(c)}
              className={`rounded-2xl border bg-card p-5 text-left shadow-sm hover:bg-muted/50 ${filter === c ? "border-primary ring-1 ring-primary" : "border-border"}`}
            >
              <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <span>{c}</span>
                <CalendarDays className="h-4 w-4 text-primary" />
              </div>
              <p className="mt-3 text-2xl font-bold">{counts[c] ?? 0}</p>
            </button>
          ))}
        </div>

        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h2 className="text-lg font-bold">Upload media</h2>
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-4">
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
            <label className="flex flex-col gap-1 text-sm md:col-span-2">
              <span className="text-xs font-semibold uppercase text-muted-foreground">Caption</span>
              <input value={caption} onChange={(e) => setCaption(e.target.value)} className={inputCls} />
            </label>
            <label className="flex flex-col gap-1 text-sm md:col-span-3">
              <span className="text-xs font-semibold uppercase text-muted-foreground">Files</span>
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
                disabled={upload.isPending || !project.id}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
              >
                <Upload className="h-4 w-4" />
                {upload.isPending ? "Uploading…" : `Upload${files.length ? ` (${files.length})` : ""}`}
              </button>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Media library</h2>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm"
            >
              <option value="all">All</option>
              {MEDIA_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          {isPending ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Loading media…</p>
          ) : null}
          {!isPending && filtered.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Nothing uploaded yet for this project.
            </p>
          ) : null}
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((m) => (
              <div key={m.id} className="overflow-hidden rounded-xl border border-border">
                <button
                  type="button"
                  onClick={() => open(m.path)}
                  className="block h-40 w-full bg-muted"
                  aria-label={`Open ${m.title}`}
                >
                  {thumbs[m.id] ? (
                    <img src={thumbs[m.id]} alt={m.caption || m.title} className="h-40 w-full object-cover" />
                  ) : (
                    <span className="flex h-40 items-center justify-center text-xs text-muted-foreground">
                      Open file
                    </span>
                  )}
                </button>
                <div className="p-3 text-sm">
                  <p className="truncate font-semibold">{m.caption || m.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {[m.category, m.stage, m.captured_on].filter(Boolean).join(" · ")}
                  </p>
                  <div className="mt-2 flex gap-3 text-xs font-semibold">
                    <button onClick={() => open(m.path)} className="text-primary">
                      Open
                    </button>
                    <button onClick={() => open(m.path, true)} className="inline-flex items-center gap-1">
                      <Download className="h-3 w-3" /> Download
                    </button>
                    {canDelete ? (
                      <button
                        onClick={() => {
                          if (confirm("Remove this file?")) remove.mutate(m);
                        }}
                        className="inline-flex items-center gap-1 text-destructive"
                      >
                        <Trash2 className="h-3 w-3" /> Delete
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="flex flex-wrap gap-2 text-sm">
          <Link to="/media-upload-studio" className="rounded-lg border border-border px-3 py-1.5 hover:bg-muted">
            Upload studio
          </Link>
          <Link to="/qa-inspection" className="rounded-lg border border-border px-3 py-1.5 hover:bg-muted">
            QA inspections
          </Link>
          <Link to="/drawing-decipher" className="rounded-lg border border-border px-3 py-1.5 hover:bg-muted">
            Drawings
          </Link>
        </div>
      </div>
    </Shell>
  );
}
