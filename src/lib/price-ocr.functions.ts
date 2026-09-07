import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";


export type ExtractedQuoteItem = {
  item_code: string;
  description: string;
  brand: string;
  trade: string;
  unit: string;
  quantity: number;
  rate: number;
  discount_pct: number;
  gst_pct: number;
};

export type ExtractedQuote = {
  vendor_name: string;
  vendor_gstin: string;
  vendor_contact: string;
  quote_ref: string;
  quote_date: string;
  trade: string;
  notes: string;
  items: ExtractedQuoteItem[];
};

function num(v: unknown): number {
  const n = Number(String(v ?? "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}
function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : v == null ? "" : String(v);
}

const SYSTEM = [
  "You read Indian vendor proforma invoices, quotations and price lists for construction materials.",
  "Extract the vendor header and EVERY priced line item accurately.",
  "Return ONLY minified JSON with this exact shape:",
  '{"vendor_name":"","vendor_gstin":"","vendor_contact":"","quote_ref":"","quote_date":"YYYY-MM-DD","trade":"","notes":"","items":[{"item_code":"","description":"","brand":"","trade":"","unit":"","quantity":0,"rate":0,"discount_pct":0,"gst_pct":0}]}',
  "rate = unit rate before GST (per unit, in INR). Never put the line total in rate.",
  "Convert per-sqm rates to the unit printed on the document; keep the printed unit text (nos, sqft, sqm, kg, bag, rmt, ltr).",
  "trade is the construction trade, e.g. Flooring, Sanitaryware, Electrical, Plumbing, Painting, Reinforcement (Steel), Wall Tiling.",
  "Use empty strings and 0 where a value is not printed. No commentary, no markdown fences.",
];

/** Reads a proforma / quotation (image or PDF) and returns structured price lines. */
export const extractQuoteFromFile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { fileName: string; mediaType: string; dataBase64: string }) => input)
  .handler(async ({ data }): Promise<ExtractedQuote> => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) throw new Error("AI is not configured for this workspace");
    const { createLovableAiGatewayProvider, SAHA_MODEL } = await import("@/lib/ai-gateway.server");
    const gateway = createLovableAiGatewayProvider(key);

    const bytes = Buffer.from(data.dataBase64, "base64");
    const isImage = data.mediaType.startsWith("image/");

    const result = await generateText({
      model: gateway(SAHA_MODEL),
      messages: [
        { role: "system", content: SYSTEM.join("\n") },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Extract the price data from this document (${data.fileName}). Return the JSON object only.`,
            },
            isImage
              ? { type: "image" as const, image: bytes, mediaType: data.mediaType }
              : {
                  type: "file" as const,
                  data: bytes,
                  mediaType: data.mediaType || "application/pdf",
                  filename: data.fileName,
                },
          ],
        },
      ],
    });

    const text = result.text ?? "";
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start < 0 || end <= start) throw new Error("Could not read any price data from this file");

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(text.slice(start, end + 1)) as Record<string, unknown>;
    } catch {
      throw new Error("Could not read any price data from this file");
    }

    const rawItems = Array.isArray(parsed["items"]) ? (parsed["items"] as unknown[]) : [];
    const headerTrade = str(parsed["trade"]);
    const items: ExtractedQuoteItem[] = rawItems
      .map((raw) => {
        const r = (raw ?? {}) as Record<string, unknown>;
        return {
          item_code: str(r["item_code"]),
          description: str(r["description"]),
          brand: str(r["brand"]),
          trade: str(r["trade"]) || headerTrade,
          unit: str(r["unit"]),
          quantity: num(r["quantity"]),
          rate: num(r["rate"]),
          discount_pct: num(r["discount_pct"]),
          gst_pct: num(r["gst_pct"]),
        };
      })
      .filter((i) => i.description || i.item_code);

    const date = str(parsed["quote_date"]);
    return {
      vendor_name: str(parsed["vendor_name"]),
      vendor_gstin: str(parsed["vendor_gstin"]),
      vendor_contact: str(parsed["vendor_contact"]),
      quote_ref: str(parsed["quote_ref"]),
      quote_date: /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : "",
      trade: headerTrade,
      notes: str(parsed["notes"]),
      items,
    };
  });
