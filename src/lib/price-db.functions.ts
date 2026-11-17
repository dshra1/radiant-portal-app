import { assertAiFeature } from "@/lib/ai-plans.server";
import { createServerFn } from "@tanstack/react-start";
import { generateText } from "ai";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { GstBasis, PriceLine } from "@/lib/price-db";

export type ReadList = {
  listNo: string;
  effective: string;
  gst: GstBasis;
  lines: Omit<PriceLine, "id">[];
  partial: boolean;
};

const SYSTEM = [
  "You read Indian manufacturers' MRP price lists and product catalogues for construction materials",
  "(wires, cables, switches, pipes, fittings, sanitaryware, CP fittings, tiles, paints, lighting).",
  "Extract the list header and EVERY priced product line. Return ONLY minified JSON:",
  '{"list_no":"","effective_date":"YYYY-MM-DD","gst_basis":"incl|excl|unknown","partial":false,"items":[{"item_code":"","item":"","category":"","unit":"","mrp":0,"gst_pct":0}]}',
  "list_no: the printed price-list number or reference (e.g. LDC List Price No. 04/2026-27); empty if none.",
  "effective_date: the 'effective', 'w.e.f.' or 'dated' date of the list; empty if none.",
  "gst_basis: incl if MRPs are printed as inclusive of all taxes/GST, excl if the list says GST extra, else unknown.",
  "item: the full product name with its size/variant/pack (e.g. 'FR-LSH 1.5 sq mm single core, 90 m coil, red').",
  "mrp: the MRP or list price per unit as printed (number only, INR). Never a discounted or total price.",
  "unit: the unit the MRP is for (nos, coil, box, sqft, rmt, ltr, kg, set, per 100 m...). Keep coil/pack lengths in item.",
  "If one product has a price per size/colour/pack in a grid, output one item per size/pack.",
  "Output at most 600 items; if the document has more, set partial true.",
  "No commentary, no markdown fences.",
];

const num = (v: unknown) => {
  const n = Number(String(v ?? "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
};
const str = (v: unknown) => (typeof v === "string" ? v.trim() : v == null ? "" : String(v));

function htmlToText(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<(br|\/p|\/div|\/tr|\/li|\/h\d)[^>]*>/gi, "\n")
    .replace(/<\/t[dh]>/gi, " | ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#8377;|&#x20b9;/gi, "₹")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n+/g, "\n")
    .trim();
}

/**
 * Reads a brand's price list: fetched from a public link (PDF or web page), or a file already
 * uploaded to the price-proformas bucket. Returns the list header and MRP lines.
 */
export const readPriceList = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      url?: string;
      storagePath?: string;
      fileName?: string;
      mediaType?: string;
      brand: string;
    }) => input,
  )
  .handler(async ({ data, context }): Promise<ReadList> => {
    await assertAiFeature(context.supabase as never, "price-reader");
    const key = process.env["GOOGLE_GENERATIVE_AI_API_KEY"];
    if (!key) throw new Error("AI is not configured for this workspace");

    let bytes: Buffer | null = null;
    let text: string | null = null;
    let mediaType = data.mediaType || "application/pdf";
    let label = data.fileName || "";

    if (data.url) {
      let u: URL;
      try {
        u = new URL(data.url);
      } catch {
        throw new Error("That link is not a valid web address");
      }
      if (u.protocol !== "https:" && u.protocol !== "http:")
        throw new Error("Only web links can be fetched");
      const res = await fetch(u.toString(), {
        headers: {
          "user-agent": "Mozilla/5.0 (compatible; SahaOS price list reader)",
          accept: "*/*",
        },
        redirect: "follow",
      });
      if (!res.ok)
        throw new Error(
          `The brand's site answered ${res.status}. Check the link, or upload the list instead.`,
        );
      const type = (res.headers.get("content-type") ?? "").toLowerCase();
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.byteLength > 20 * 1024 * 1024)
        throw new Error(
          "That file is over 20 MB. Download the price-list pages and upload them instead.",
        );
      label = u.toString();
      if (type.includes("pdf") || u.pathname.toLowerCase().endsWith(".pdf")) {
        bytes = buf;
        mediaType = "application/pdf";
      } else if (type.startsWith("image/")) {
        bytes = buf;
        mediaType = type.split(";")[0] ?? "image/jpeg";
      } else {
        text = htmlToText(buf.toString("utf8")).slice(0, 180_000);
        if (text.length < 40)
          throw new Error(
            "The page had no readable text (it may need a browser). Upload the list instead.",
          );
      }
    } else if (data.storagePath) {
      const { data: signed, error } = await context.supabase.storage
        .from("price-proformas")
        .createSignedUrl(data.storagePath, 600);
      if (error || !signed?.signedUrl) throw new Error("Could not open the uploaded file");
      const res = await fetch(signed.signedUrl);
      if (!res.ok) throw new Error("Could not download the uploaded file");
      bytes = Buffer.from(await res.arrayBuffer());
    } else {
      throw new Error("Give a link or upload a file");
    }

    const { createAiProvider, SAHA_MODEL } = await import("@/lib/ai-gateway.server");
    const gateway = createAiProvider(key);
    const ask = `Brand: ${data.brand}. Source: ${label}. Extract the MRP price list. Return the JSON object only.`;
    let out: string;
    try {
      const result = await generateText({
        model: gateway(SAHA_MODEL),
        system: SYSTEM.join("\n"),
        messages: [
          {
            role: "user",
            content: bytes
              ? [
                  { type: "text", text: ask },
                  { type: "file", data: bytes, mediaType },
                ]
              : [{ type: "text", text: `${ask}\n\n--- PAGE TEXT ---\n${text}` }],
          },
        ],
      });
      out = result.text;
    } catch (e) {
      const m = e instanceof Error ? e.message : String(e);
      if (/429/.test(m)) throw new Error("The reader is busy right now. Try again in a minute.");
      if (/402|quota|billing/i.test(m))
        throw new Error("AI credits are exhausted. Check the Gemini API billing.");
      throw new Error(`Reading failed: ${m.slice(0, 200)}`);
    }
    const s = out.indexOf("{");
    const e = out.lastIndexOf("}");
    if (s < 0 || e <= s) throw new Error("No prices could be read from this source");
    let p: Record<string, unknown>;
    try {
      p = JSON.parse(out.slice(s, e + 1)) as Record<string, unknown>;
    } catch {
      throw new Error(
        "No prices could be read from this source (the list may be too long; try a smaller section)",
      );
    }
    const items = Array.isArray(p["items"]) ? (p["items"] as Record<string, unknown>[]) : [];
    const gst = str(p["gst_basis"]);
    const eff = str(p["effective_date"]);
    return {
      listNo: str(p["list_no"]),
      effective: /^\d{4}-\d{2}-\d{2}$/.test(eff) ? eff : "",
      gst: gst === "incl" || gst === "excl" ? gst : "unknown",
      partial: Boolean(p["partial"]),
      lines: items
        .map((r) => ({
          item_code: str(r["item_code"]),
          item: str(r["item"]),
          category: str(r["category"]),
          unit: str(r["unit"]),
          mrp: num(r["mrp"]),
          gst_pct: num(r["gst_pct"]),
        }))
        .filter((l) => l.item && l.mrp > 0),
    };
  });
