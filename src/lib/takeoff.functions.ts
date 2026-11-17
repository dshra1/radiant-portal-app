import { aiUse } from "@/lib/ai-use";
import { createServerFn } from "@tanstack/react-start";
import { generateText } from "ai";
import { cleanSlot, SLOT_PROMPTS, type SlotKey, type Takeoff } from "@/lib/takeoff";

const SYSTEM = [
  "You are a quantity surveyor reading Indian residential building drawings (architectural, structural, electrical, plumbing).",
  "Read dimensions exactly as printed. Convert feet-inches to decimal feet (12'6\" = 12.5) and millimetres to feet (÷ 304.8) or inches (÷ 25.4) as the field name asks.",
  "Count marks carefully on layouts; when a typical floor plan is marked for several floors, say so in repeat / levels instead of multiplying sizes.",
  "Never invent values: use 0 or leave a list empty when the drawing does not show it, and say what was missing in notes.",
  'Return ONLY minified JSON of the shape asked for, plus a "notes" array of short strings (what you assumed, what was unreadable). No markdown fences, no commentary.',
];

export type ReadDrawingResult = { data: Partial<Takeoff>; notes: string[] };

/** Reads one uploaded drawing (PDF or image in site-media) for one checklist slot. */
export const readDrawing = createServerFn({ method: "POST" })
  .middleware([aiUse("drawing-reader")])
  .inputValidator(
    (input: { slot: SlotKey; fileName: string; mediaType: string; storagePath: string }) => input,
  )
  .handler(async ({ data, context }): Promise<ReadDrawingResult> => {
    const key = process.env["GOOGLE_GENERATIVE_AI_API_KEY"];
    if (!key)
      throw new Error(
        "AI is switched off: the Gemini key (GOOGLE_GENERATIVE_AI_API_KEY) is not set in the Cloudflare worker settings.",
      );
    const prompt = SLOT_PROMPTS[data.slot];
    if (!prompt) throw new Error("Unknown drawing type");

    const { data: signed, error } = await context.supabase.storage
      .from("site-media")
      .createSignedUrl(data.storagePath, 600);
    if (error || !signed?.signedUrl) throw new Error("Could not open the uploaded drawing");
    const res = await fetch(signed.signedUrl);
    if (!res.ok) throw new Error("Could not download the uploaded drawing");
    const bytes = Buffer.from(await res.arrayBuffer());
    if (!bytes.byteLength) throw new Error("The uploaded drawing is empty");
    if (bytes.byteLength > 20 * 1024 * 1024)
      throw new Error("The drawing is over 20 MB: export it as a smaller PDF or split the sheets");

    const { createAiProvider, SAHA_MODEL } = await import("@/lib/ai-gateway.server");
    const gateway = createAiProvider(key);
    let text: string;
    try {
      const out = await generateText({
        model: gateway(SAHA_MODEL),
        system: SYSTEM.join("\n"),
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: `${prompt}\nDrawing file: ${data.fileName}` },
              { type: "file", data: bytes, mediaType: data.mediaType || "application/pdf" },
            ],
          },
        ],
      });
      text = out.text;
    } catch (e) {
      const m = e instanceof Error ? e.message : String(e);
      if (/429/.test(m)) throw new Error("The drawing reader is busy: try again in a minute");
      if (/402|quota|billing/i.test(m))
        throw new Error("AI credits are exhausted: check the Gemini API billing");
      throw new Error(`Reading the drawing failed: ${m.slice(0, 200)}`);
    }
    const a = text.indexOf("{");
    const b = text.lastIndexOf("}");
    if (a < 0 || b <= a) throw new Error("Nothing could be read from this drawing");
    let raw: Record<string, unknown>;
    try {
      raw = JSON.parse(text.slice(a, b + 1)) as Record<string, unknown>;
    } catch {
      throw new Error("Nothing could be read from this drawing");
    }
    const notes = Array.isArray(raw["notes"])
      ? (raw["notes"] as unknown[]).map(String).slice(0, 12)
      : [];
    return { data: cleanSlot(data.slot, raw), notes };
  });
