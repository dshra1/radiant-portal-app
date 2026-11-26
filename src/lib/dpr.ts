/**
 * Daily progress report (DPR): one day of one project, gathered from the records staff already
 * keep (labour register, machine log, goods receipts and issues, work measured for subcontract
 * work orders, site photos, the daily report text), drawn as an A4 PDF with pdf-lib and shared
 * from the phone (WhatsApp via the share sheet) or downloaded.
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const num = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

export type DayData = {
  date: string;
  labour: { contractor: string; trade: string; heads: number; work: string; far: boolean }[];
  machines: { name: string; hours: number; diesel: number; work: string }[];
  received: { item: string; qty: number; unit: string; party: string; po: string }[];
  used: { item: string; qty: number; unit: string; stage: string }[];
  subcon: { contractor: string; item: string; qty: number; unit: string; location: string }[];
  photos: { path: string; title: string }[];
  report: { by: string; body: string }[];
};

export function useDay(projectId: string, date: string) {
  return useQuery({
    queryKey: ["day-tiles", projectId, date],
    enabled: Boolean(projectId && date),
    refetchInterval: 60000,
    queryFn: async (): Promise<DayData> => {
      const next = new Date(new Date(date).getTime() + 864e5).toISOString().slice(0, 10);
      const [lab, mach, moves, meas, media, rep] = await Promise.all([
        supabase
          .from("labour_entries")
          .select("contractor,trade,headcount,work_done,geo_distance_m")
          .eq("project_id", projectId)
          .eq("work_date", date),
        supabase
          .from("machine_logs")
          .select("hours,diesel_l,work_done,machines(name)")
          .eq("project_id", projectId)
          .eq("log_date", date),
        supabase
          .from("stock_movements")
          .select("description,quantity,unit,party,po_number,movement_type,stage_code")
          .eq("project_id", projectId)
          .eq("movement_date", date),
        supabase
          .from("wo_measurements")
          .select("item_id,qty,location,work_orders(contractor,items)")
          .eq("project_id", projectId)
          .eq("measured_on", date),
        supabase
          .from("project_media")
          .select("path,title,captured_on,created_at")
          .eq("project_id", projectId)
          .or(
            `captured_on.eq.${date},and(captured_on.is.null,created_at.gte.${date},created_at.lt.${next})`,
          )
          .limit(30),
        supabase
          .from("team_messages")
          .select("author_name,body,created_at,channel")
          .eq("project_id", projectId)
          .eq("channel", "Daily report")
          .gte("created_at", date)
          .lt("created_at", next),
      ]);
      type M = {
        hours: number;
        diesel_l: number;
        work_done: string;
        machines: { name: string } | null;
      };
      type W = {
        item_id: string;
        qty: number;
        location: string;
        work_orders: {
          contractor: string;
          items: { id: string; description: string; unit: string }[];
        } | null;
      };
      return {
        date,
        labour: (lab.data ?? []).map((l) => ({
          contractor: l.contractor,
          trade: l.trade,
          heads: num(l.headcount),
          work: l.work_done,
          far: num(l.geo_distance_m) > 300,
        })),
        machines: ((mach.data ?? []) as unknown as M[]).map((m) => ({
          name: m.machines?.name ?? "Machine",
          hours: num(m.hours),
          diesel: num(m.diesel_l),
          work: m.work_done,
        })),
        received: (moves.data ?? [])
          .filter((m) => m.movement_type === "receipt")
          .map((m) => ({
            item: m.description,
            qty: num(m.quantity),
            unit: m.unit,
            party: m.party,
            po: m.po_number,
          })),
        used: (moves.data ?? [])
          .filter((m) => m.movement_type === "issue")
          .map((m) => ({
            item: m.description,
            qty: num(m.quantity),
            unit: m.unit,
            stage: m.stage_code,
          })),
        subcon: ((meas.data ?? []) as unknown as W[]).map((w) => {
          const it = (w.work_orders?.items ?? []).find((x) => x.id === w.item_id);
          return {
            contractor: w.work_orders?.contractor ?? "",
            item: it?.description ?? "Work",
            qty: num(w.qty),
            unit: it?.unit ?? "",
            location: w.location,
          };
        }),
        photos: (media.data ?? []).map((m) => ({ path: m.path, title: m.title })),
        report: (rep.data ?? []).map((r) => ({ by: r.author_name, body: r.body })),
      };
    },
  });
}

/** pdf-lib's standard fonts only draw Latin-1: keep text readable. */
const safe = (s: string) =>
  String(s ?? "")
    .replace(/₹/g, "Rs ")
    .replace(/[–—]/g, "-")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, " ")
    .split("")
    .filter((c) => {
      const n = c.charCodeAt(0);
      return (n >= 32 && n <= 126) || (n >= 160 && n <= 255);
    })
    .join("");

/** Text pdf-lib's standard font can't draw (Telugu, Hindi, other scripts). */
const needsImage = (s: string) =>
  [...String(s ?? "")].some((c) => c.charCodeAt(0) > 0xff && !"₹–—‘’“”".includes(c));

/**
 * Draw text with the phone's own fonts (the browser joins Telugu/Hindi letters correctly)
 * onto a canvas, wrapped to `widthPt`, and return it as a PNG with its height in points.
 */
async function textPng(text: string, widthPt: number, sizePt: number) {
  if (typeof document === "undefined") return null;
  const k = 3; // pixels per point: sharp when printed
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const font = `${sizePt * k}px "Noto Sans Telugu","Noto Sans Devanagari","Nirmala UI","Kohinoor Telugu",system-ui,sans-serif`;
  ctx.font = font;
  const maxW = widthPt * k;
  const lines: string[] = [];
  for (const para of String(text).split(/\n/)) {
    let cur = "";
    for (const w of para.split(/\s+/).filter(Boolean)) {
      const t = cur ? `${cur} ${w}` : w;
      if (ctx.measureText(t).width > maxW && cur) {
        lines.push(cur);
        cur = w;
      } else cur = t;
    }
    lines.push(cur);
  }
  const lh = sizePt * 1.35 * k;
  canvas.width = Math.ceil(maxW);
  const pad = sizePt * 0.35 * k;
  canvas.height = Math.max(1, Math.ceil(lines.length * lh + 2 * pad));
  ctx.font = font;
  ctx.fillStyle = "#000";
  ctx.textBaseline = "top";
  lines.forEach((ln, i) => ctx.fillText(ln, 0, pad + i * lh));
  const blob: Blob | null = await new Promise((r) => canvas.toBlob(r, "image/png"));
  if (!blob) return null;
  return {
    png: new Uint8Array(await blob.arrayBuffer()),
    heightPt: canvas.height / k,
    widthPt: canvas.width / k,
  };
}

export async function buildDprPdf(projectName: string, location: string, d: DayData) {
  const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const W = 595;
  const H = 842;
  const M = 40;
  let page = doc.addPage([W, H]);
  let y = H - M;
  const green = rgb(0.06, 0.43, 0.34);
  const grey = rgb(0.4, 0.4, 0.4);

  const ensure = (h: number) => {
    if (y - h < M) {
      page = doc.addPage([W, H]);
      y = H - M;
    }
  };
  const wrap = (text: string, size: number, width: number, f = font) => {
    const words = safe(text).split(/\s+/);
    const lines: string[] = [];
    let cur = "";
    for (const w of words) {
      const t = cur ? `${cur} ${w}` : w;
      if (f.widthOfTextAtSize(t, size) > width && cur) {
        lines.push(cur);
        cur = w;
      } else cur = t;
    }
    if (cur) lines.push(cur);
    return lines;
  };
  const text = (s: string, x: number, size = 10, f = font, color = rgb(0, 0, 0)) =>
    page.drawText(safe(s), { x, y, size, font: f, color });
  const heading = (s: string, count?: number) => {
    ensure(30);
    y -= 8;
    page.drawRectangle({
      x: M,
      y: y - 4,
      width: W - 2 * M,
      height: 18,
      color: rgb(0.9, 0.96, 0.93),
    });
    text(`${s}${count !== undefined ? `  (${count})` : ""}`, M + 6, 11, bold, green);
    y -= 20;
  };
  const table = async (cols: { label: string; w: number }[], rows: string[][]) => {
    if (rows.length === 0) {
      ensure(14);
      text("Nothing recorded.", M + 6, 9, font, grey);
      y -= 14;
      return;
    }
    ensure(14);
    let x = M;
    for (const c of cols) {
      text(c.label, x + 4, 8, bold, grey);
      x += c.w;
    }
    y -= 12;
    for (const [n, r] of rows.entries()) {
      const cells = await Promise.all(
        r.map(async (v, i) => {
          const w = (cols[i]?.w ?? 60) - 8;
          if (needsImage(v)) {
            const img = await textPng(v, w, 9);
            if (img) return { img, h: img.heightPt };
          }
          const lines = wrap(v, 9, w);
          return { lines, h: lines.length * 11 };
        }),
      );
      const h = Math.max(...cells.map((c) => c.h)) + 6;
      ensure(h);
      if (n > 0)
        page.drawLine({
          start: { x: M, y: y + 10 },
          end: { x: W - M, y: y + 10 },
          thickness: 0.3,
          color: rgb(0.85, 0.85, 0.85),
        });
      x = M;
      for (const [i, c] of cells.entries()) {
        if ("img" in c && c.img) {
          const png = await doc.embedPng(c.img.png);
          page.drawImage(png, {
            x: x + 4,
            y: y + 9 - c.img.heightPt,
            width: c.img.widthPt,
            height: c.img.heightPt,
          });
        } else if ("lines" in c && c.lines)
          c.lines.forEach((ln, k) => page.drawText(ln, { x: x + 4, y: y - k * 11, size: 9, font }));
        x += cols[i]?.w ?? 60;
      }
      y -= h;
    }
  };

  // Header
  text("DAILY PROGRESS REPORT", M, 16, bold, green);
  y -= 20;
  text(`${projectName}${location ? ` · ${location}` : ""}`, M, 11, bold);
  y -= 14;
  text(
    new Date(d.date).toLocaleDateString("en-IN", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
    M,
    10,
    font,
    grey,
  );
  y -= 10;
  const heads = d.labour.reduce((s, l) => s + l.heads, 0);
  const hrs = d.machines.reduce((s, m) => s + m.hours, 0);
  y -= 14;
  text(
    `Labour ${heads} · Machine hours ${hrs.toFixed(1)} · Material in ${d.received.length} · Material used ${d.used.length} · Subcon entries ${d.subcon.length} · Photos ${d.photos.length}`,
    M,
    9,
    font,
    grey,
  );
  y -= 6;

  heading("Work summary");
  if (d.report.length === 0) {
    text("No daily report written.", M + 6, 9, font, grey);
    y -= 14;
  }
  for (const r of d.report) {
    const img = needsImage(r.body) ? await textPng(r.body, W - 2 * M - 12, 10) : null;
    if (img) {
      ensure(Math.min(img.heightPt, H - 2 * M));
      const png = await doc.embedPng(img.png);
      page.drawImage(png, {
        x: M + 6,
        y: y + 10 - img.heightPt,
        width: img.widthPt,
        height: img.heightPt,
      });
      y -= img.heightPt;
    } else
      for (const ln of wrap(r.body, 10, W - 2 * M - 12)) {
        ensure(13);
        text(ln, M + 6, 10);
        y -= 13;
      }
    ensure(13);
    text(`- ${r.by}`, M + 6, 8, font, grey);
    y -= 14;
  }

  heading("Labour", heads);
  await table(
    [
      { label: "Contractor", w: 130 },
      { label: "Trade", w: 100 },
      { label: "Heads", w: 50 },
      { label: "Work done", w: 235 },
    ],
    d.labour.map((l) => [
      l.contractor || "-",
      l.trade,
      String(l.heads),
      `${l.work}${l.far ? " (entered away from site)" : ""}`,
    ]),
  );
  heading("Machines & diesel", d.machines.length);
  await table(
    [
      { label: "Machine", w: 160 },
      { label: "Hours", w: 60 },
      { label: "Diesel (l)", w: 70 },
      { label: "Work", w: 225 },
    ],
    d.machines.map((m) => [
      m.name,
      m.hours.toFixed(1),
      m.diesel ? m.diesel.toFixed(0) : "-",
      m.work,
    ]),
  );
  heading("Material received", d.received.length);
  await table(
    [
      { label: "Item", w: 200 },
      { label: "Qty", w: 80 },
      { label: "From", w: 145 },
      { label: "PO", w: 90 },
    ],
    d.received.map((r) => [r.item, `${r.qty} ${r.unit}`, r.party, r.po]),
  );
  heading("Material used", d.used.length);
  await table(
    [
      { label: "Item", w: 255 },
      { label: "Qty", w: 100 },
      { label: "Stage", w: 160 },
    ],
    d.used.map((r) => [r.item, `${r.qty} ${r.unit}`, r.stage]),
  );
  heading("Subcontract progress", d.subcon.length);
  await table(
    [
      { label: "Contractor", w: 130 },
      { label: "Work", w: 200 },
      { label: "Qty", w: 80 },
      { label: "Where", w: 105 },
    ],
    d.subcon.map((s) => [s.contractor, s.item, `${s.qty} ${s.unit}`, s.location]),
  );

  // Photos: up to 6, two per row.
  const pics = d.photos.slice(0, 6);
  if (pics.length) {
    heading("Site photos", d.photos.length);
    const boxW = (W - 2 * M - 10) / 2;
    const boxH = 170;
    let col = 0;
    for (const p of pics) {
      try {
        const { data } = await supabase.storage.from("site-media").createSignedUrl(p.path, 300);
        if (!data?.signedUrl) continue;
        const bytes = new Uint8Array(await (await fetch(data.signedUrl)).arrayBuffer());
        const isPng = bytes[0] === 0x89 && bytes[1] === 0x50;
        const isJpg = bytes[0] === 0xff && bytes[1] === 0xd8;
        if (!isPng && !isJpg) continue;
        const img = isPng ? await doc.embedPng(bytes) : await doc.embedJpg(bytes);
        if (col === 0) ensure(boxH + 16);
        const s = Math.min(boxW / img.width, boxH / img.height);
        const x = M + col * (boxW + 10);
        page.drawImage(img, {
          x,
          y: y - img.height * s,
          width: img.width * s,
          height: img.height * s,
        });
        if (p.title)
          page.drawText(safe(p.title).slice(0, 60), {
            x,
            y: y - boxH - 10,
            size: 8,
            font,
            color: grey,
          });
        col = (col + 1) % 2;
        if (col === 0) y -= boxH + 20;
      } catch {
        /* skip a photo that can't be read */
      }
    }
    if (col === 1) y -= boxH + 20;
  }

  const pages = doc.getPages();
  pages.forEach((pg, i) =>
    pg.drawText(
      safe(`${projectName} · DPR ${d.date} · page ${i + 1} of ${pages.length} · SiteYantra`),
      {
        x: M,
        y: 20,
        size: 7,
        font,
        color: grey,
      },
    ),
  );
  return doc.save();
}

/** Share the PDF from the phone (WhatsApp etc.), or download it on a laptop. */
export async function shareDpr(bytes: Uint8Array, fileName: string, title: string) {
  const file = new File([bytes as BlobPart], fileName, { type: "application/pdf" });
  const nav = navigator as Navigator & { canShare?: (d: { files: File[] }) => boolean };
  if (nav.canShare?.({ files: [file] })) {
    try {
      await nav.share({ files: [file], title });
      return "shared";
    } catch {
      /* cancelled: fall through to download */
    }
  }
  const a = document.createElement("a");
  a.href = URL.createObjectURL(file);
  a.download = fileName;
  a.click();
  return "downloaded";
}
