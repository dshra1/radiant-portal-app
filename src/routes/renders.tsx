import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle, Bath, ImagePlus, Loader2, PlugZap, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Shell } from "@/components/saha/Shell";
import { supabase } from "@/integrations/supabase/client";
import { useActiveProject } from "@/hooks/useActiveProject";
import { useAiConfigured, AI_OFF_REASON } from "@/hooks/useAiStatus";
import { allSheets, type Sheet } from "@/lib/drawing-sheets";
import { PRICE_PER_USE } from "@/lib/ai-credits";
import { generateRender, type RenderKind } from "@/lib/render.functions";

export const Route = createFileRoute("/renders")({
  head: () => ({
    meta: [
      { title: "Renders | SiteSutra" },
      {
        name: "description",
        content:
          "Photo-real renders of bathrooms and electrical walls straight from the project's drawings.",
      },
    ],
  }),
  component: Page,
});

const KINDS: { kind: RenderKind; label: string; icon: typeof Bath; sheets: RegExp }[] = [
  { kind: "bathroom", label: "Bathroom (finished)", icon: Bath, sheets: /TOILET|P\. ROOM|POWDER/i },
  {
    kind: "wall-finished",
    label: "Electrical wall (finished)",
    icon: PlugZap,
    sheets: /ELECTRICAL CONDUIT/i,
  },
  {
    kind: "wall-conduit",
    label: "Electrical wall (conduits before plaster)",
    icon: PlugZap,
    sheets: /ELECTRICAL CONDUIT/i,
  },
];
const OPTIONS: Record<RenderKind, { key: string; label: string; placeholder: string }[]> = {
  bathroom: [
    { key: "style", label: "Style", placeholder: "modern Indian contemporary" },
    { key: "wallTile", label: "Wall tiles", placeholder: "large-format matt beige 600x1200" },
    { key: "floorTile", label: "Floor tiles", placeholder: "anti-skid matt grey 600x600" },
    {
      key: "sanitary",
      label: "Sanitaryware",
      placeholder: "white wall-hung WC, counter-top basin",
    },
    {
      key: "fittings",
      label: "Fittings finish",
      placeholder: "chrome / matte black / brushed gold",
    },
    { key: "shower", label: "Shower", placeholder: "linear drain, clear glass partition" },
    { key: "vanity", label: "Vanity", placeholder: "wall-hung wood-finish vanity with mirror" },
    { key: "lighting", label: "Lighting", placeholder: "warm white recessed lights" },
  ],
  "wall-finished": [
    { key: "room", label: "Room", placeholder: "master bedroom" },
    { key: "wall", label: "Wall finish", placeholder: "smooth emulsion, warm off-white" },
    { key: "plates", label: "Switch plates", placeholder: "white modular / black glass touch" },
  ],
  "wall-conduit": [],
};

/** Draws one PDF page to a PNG (about 1600 px wide) for the render. */
async function pageToPng(url: string, page: number) {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = (
    await import("pdfjs-dist/build/pdf.worker.min.mjs?url")
  ).default;
  const doc = await pdfjs.getDocument({ url }).promise;
  const p = await doc.getPage(Math.min(Math.max(1, page), doc.numPages));
  const base = p.getViewport({ scale: 1 });
  const vp = p.getViewport({ scale: 1600 / base.width });
  const c = document.createElement("canvas");
  c.width = Math.floor(vp.width);
  c.height = Math.floor(vp.height);
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, c.width, c.height);
  await p.render({ canvasContext: ctx, viewport: vp }).promise;
  return c.toDataURL("image/png").split(",")[1]!;
}
const fileToBase64 = (f: File) =>
  new Promise<string>((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result).split(",")[1]!);
    r.onerror = () => rej(new Error("Could not read the file"));
    r.readAsDataURL(f);
  });

function Page() {
  const project = useActiveProject();
  const pid = project.id;
  const ai = useAiConfigured();
  const qc = useQueryClient();
  const render = useServerFn(generateRender);
  const [kind, setKind] = useState<RenderKind>("bathroom");
  const [sheet, setSheet] = useState<Sheet | null>(null);
  const [upload, setUpload] = useState<File | null>(null);
  const [q, setQ] = useState("");
  const [opts, setOpts] = useState<Record<string, string>>({});
  const [latest, setLatest] = useState<string | null>(null);

  const K = KINDS.find((k) => k.kind === kind)!;
  const sheets = useMemo(
    () =>
      allSheets(project.name).filter(
        (s) =>
          K.sheets.test(`${s.title} ${s.sub}`) &&
          !s.cont &&
          (!q || `${s.title}`.toLowerCase().includes(q.toLowerCase())),
      ),
    [project.name, K, q],
  );

  const gallery = useQuery({
    queryKey: ["renders", pid],
    enabled: Boolean(pid),
    queryFn: async () => {
      const { data } = await supabase
        .from("project_media")
        .select("id,path,title,created_at")
        .eq("project_id", pid)
        .eq("stage", "RENDERS")
        .order("created_at", { ascending: false })
        .limit(24);
      const rows = (data ?? []) as {
        id: string;
        path: string;
        title: string;
        created_at: string;
      }[];
      const signed = await Promise.all(
        rows.map((r) => supabase.storage.from("site-media").createSignedUrl(r.path, 3600)),
      );
      return rows.map((r, i) => ({ ...r, url: signed[i]?.data?.signedUrl ?? "" }));
    },
  });

  const go = useMutation({
    mutationFn: async () => {
      let imageBase64 = "";
      let mediaType = "image/png";
      let title = "";
      if (upload) {
        imageBase64 = await fileToBase64(upload);
        mediaType = upload.type || "image/jpeg";
        title = upload.name.replace(/\.[a-z]+$/i, "");
      } else if (sheet) {
        const { data } = await supabase.storage
          .from("project-drawings")
          .createSignedUrl(`${pid}/${sheet.file}`, 600);
        if (!data?.signedUrl) throw new Error("Could not open the drawing");
        imageBase64 = await pageToPng(data.signedUrl, sheet.page);
        title = sheet.title;
      } else throw new Error("Pick a drawing sheet or upload an image");
      return render({
        data: { projectId: pid, kind, title, imageBase64, mediaType, options: opts },
      });
    },
    onSuccess: (r) => {
      setLatest(r.url);
      toast.success("Render ready");
      qc.invalidateQueries({ queryKey: ["renders", pid] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const input = "w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm";
  return (
    <Shell title="Renders">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 p-4">
        <header className="rounded-2xl border border-border bg-card p-5">
          <p className="label-caps text-primary">From your drawings</p>
          <h1 className="text-2xl font-extrabold">Bathroom and wall renders</h1>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            Pick a toilet's plumbing sheet or a room's electrical sheet, choose finishes, and get a
            photo-real render that follows the drawing: every WC, drain, basin, switch board and
            socket where the drawing puts it. Use it for client sign-off, or the conduit view to
            brief the electrician. {PRICE_PER_USE.render} credits per render.
          </p>
          {ai === false && (
            <p className="mt-3 flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" /> {AI_OFF_REASON}
            </p>
          )}
        </header>

        <section className="rounded-2xl border border-border bg-card p-4">
          <p className="label-caps text-muted-foreground">1 · What to render</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {KINDS.map((k) => (
              <button
                key={k.kind}
                type="button"
                onClick={() => {
                  setKind(k.kind);
                  setSheet(null);
                }}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm ${kind === k.kind ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}
              >
                <k.icon className="size-4" /> {k.label}
              </button>
            ))}
          </div>

          <p className="label-caps mt-4 text-muted-foreground">2 · From which drawing</p>
          <input
            className={`${input} mt-2`}
            placeholder="Search sheets (e.g. A18, master, kitchen)"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <div className="mt-2 max-h-64 overflow-auto rounded-lg border border-border">
            {sheets.length === 0 && (
              <p className="p-3 text-sm text-muted-foreground">
                No matching sheets for this project. Upload a drawing image or photo instead.
              </p>
            )}
            {sheets.map((s) => (
              <button
                key={`${s.file}:${s.page}`}
                type="button"
                onClick={() => {
                  setSheet(s);
                  setUpload(null);
                }}
                className={`block w-full border-b border-border p-2 text-left text-sm last:border-0 ${sheet === s ? "bg-primary/10 font-semibold" : "hover:bg-muted/50"}`}
              >
                {s.title}
                <span className="block text-xs font-normal text-muted-foreground">
                  {s.file.replace(/\.pdf$/, "")} · p.{s.page}
                </span>
              </button>
            ))}
          </div>
          <label className="mt-2 inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm">
            <ImagePlus className="size-4" />{" "}
            {upload ? upload.name : "Or upload a drawing image, photo or sketch"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) {
                  setUpload(f);
                  setSheet(null);
                }
                e.target.value = "";
              }}
            />
          </label>

          {OPTIONS[kind].length > 0 && (
            <>
              <p className="label-caps mt-4 text-muted-foreground">3 · Finishes</p>
              <div className="mt-2 grid gap-2 text-sm md:grid-cols-2">
                {OPTIONS[kind].map((o) => (
                  <label key={o.key}>
                    <span className="text-xs text-muted-foreground">{o.label}</span>
                    <input
                      className={input}
                      placeholder={o.placeholder}
                      value={opts[o.key] ?? ""}
                      onChange={(e) => setOpts({ ...opts, [o.key]: e.target.value })}
                    />
                  </label>
                ))}
              </div>
            </>
          )}
          <label className="mt-2 block text-sm">
            <span className="text-xs text-muted-foreground">Notes (optional)</span>
            <input
              className={input}
              placeholder="e.g. niche in the shower wall, mirror light above the basin"
              value={opts["notes"] ?? ""}
              onChange={(e) => setOpts({ ...opts, notes: e.target.value })}
            />
          </label>
          <button
            type="button"
            disabled={go.isPending || ai === false || (!sheet && !upload)}
            onClick={() => go.mutate()}
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
          >
            {go.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Sparkles className="size-4" />
            )}{" "}
            {go.isPending
              ? "Rendering (about 20 seconds)…"
              : `Make the render · ${PRICE_PER_USE.render} credits`}
          </button>
          {latest && (
            <img
              src={latest}
              alt="Latest render"
              className="mt-4 w-full rounded-xl border border-border"
            />
          )}
        </section>

        {(gallery.data?.length ?? 0) > 0 && (
          <section className="rounded-2xl border border-border bg-card p-4">
            <p className="label-caps text-muted-foreground">Renders for {project.name}</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {gallery.data!.map((g) => (
                <a
                  key={g.id}
                  href={g.url}
                  target="_blank"
                  rel="noopener"
                  className="block overflow-hidden rounded-xl border border-border"
                >
                  <img
                    src={g.url}
                    alt={g.title}
                    className="aspect-video w-full object-cover"
                    loading="lazy"
                  />
                  <p className="p-2 text-xs">
                    {g.title}
                    <span className="block text-muted-foreground">
                      {new Date(g.created_at).toLocaleString("en-IN")}
                    </span>
                  </p>
                </a>
              ))}
            </div>
          </section>
        )}
      </div>
    </Shell>
  );
}
