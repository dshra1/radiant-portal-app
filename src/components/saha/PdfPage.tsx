import { useEffect, useRef, useState } from "react";
import { Loader2, Minus, Plus } from "lucide-react";

/**
 * One page of a PDF drawn on a canvas. A PDF in an <iframe> shows nothing on Android
 * phones and ignores "#page=" on iPhones, so the site team saw a blank box or sheet 1
 * instead of the sheet for their stage. This draws exactly the page asked for, at the
 * width of the screen, with zoom buttons; the browser's own viewer stays one tap away.
 */
export function PdfPage({ url, page }: { url: string; page: number }) {
  const holder = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [state, setState] = useState<"loading" | "ok" | "error">("loading");
  const [zoom, setZoom] = useState(1);
  const [pages, setPages] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let task: { cancel: () => void } | null = null;
    setState("loading");
    void (async () => {
      try {
        const pdfjs = await import("pdfjs-dist");
        const workerUrl = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
        pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
        const doc = await pdfjs.getDocument({ url }).promise;
        if (cancelled) return;
        setPages(doc.numPages);
        const p = await doc.getPage(Math.min(Math.max(1, page), doc.numPages));
        const width = holder.current?.clientWidth || 360;
        const base = p.getViewport({ scale: 1 });
        // Sharp on phones: draw at device pixels, show at the holder's width × zoom.
        const dpr = Math.min(window.devicePixelRatio || 1, 3);
        const scale = ((width * zoom) / base.width) * dpr;
        const vp = p.getViewport({ scale });
        const c = canvas.current;
        if (!c || cancelled) return;
        c.width = Math.floor(vp.width);
        c.height = Math.floor(vp.height);
        c.style.width = `${Math.floor(vp.width / dpr)}px`;
        c.style.height = `${Math.floor(vp.height / dpr)}px`;
        const ctx = c.getContext("2d");
        if (!ctx) throw new Error("no canvas");
        const render = p.render({ canvasContext: ctx, viewport: vp });
        task = render;
        await render.promise;
        if (!cancelled) setState("ok");
      } catch (e) {
        if (!cancelled && (e as { name?: string }).name !== "RenderingCancelledException")
          setState("error");
      }
    })();
    return () => {
      cancelled = true;
      task?.cancel();
    };
  }, [url, page, zoom]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-border bg-card px-2 py-1 text-xs">
        <button
          type="button"
          aria-label="Zoom out"
          onClick={() => setZoom((z) => Math.max(1, z - 0.5))}
          className="rounded border border-border p-1"
        >
          <Minus className="size-3.5" />
        </button>
        <span className="tnum">{Math.round(zoom * 100)}%</span>
        <button
          type="button"
          aria-label="Zoom in"
          onClick={() => setZoom((z) => Math.min(4, z + 0.5))}
          className="rounded border border-border p-1"
        >
          <Plus className="size-3.5" />
        </button>
        {pages > 0 && (
          <span className="ml-auto text-muted-foreground">
            Sheet page {page} of {pages}
          </span>
        )}
      </div>
      <div ref={holder} className="relative flex-1 overflow-auto bg-white">
        {state === "loading" && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
            <Loader2 className="mr-2 size-4 animate-spin" /> Opening the sheet…
          </div>
        )}
        {state === "error" && (
          <p className="p-4 text-sm text-muted-foreground">
            This sheet could not be drawn here. Use “Open full screen”.
          </p>
        )}
        <canvas ref={canvas} className="block" />
      </div>
    </div>
  );
}
