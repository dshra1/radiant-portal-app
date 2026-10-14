import { createServerFn } from "@tanstack/react-start";
import { generateText } from "ai";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type DrawingCheck = {
  verdict: "in sync" | "partly" | "not in sync" | "cannot tell";
  score: number;
  matches: string[];
  differences: string[];
  advice: string;
};

const SYSTEM = [
  "You are a site quality engineer for a residential RCC building in Hyderabad.",
  "You compare a photo of work built on site (electrical conduits and boxes in a wall, plumbing pipes and points, reinforcement, sleeves, masonry, finishes) with the PMC drawing sheet it must follow.",
  "Look at the named page of the PDF only. Read the drawing's positions, heights, counts and sizes (boxes, conduit runs, pipe points, bar spacing, sleeve positions, openings).",
  "Then judge the photo: what agrees with the sheet, what is missing, extra or in a different place. Be specific (which box, which run, approx. height).",
  "If the photo does not show enough of the work (wrong wall, too close, blurred) say 'cannot tell' and ask for the photo that is needed.",
  'Return ONLY minified JSON: {"verdict":"in sync|partly|not in sync|cannot tell","score":0-100,"matches":["…"],"differences":["…"],"advice":"one or two sentences for the site engineer"}',
].join("\n");

const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
const list = (v: unknown) => (Array.isArray(v) ? v.map(str).filter(Boolean).slice(0, 12) : []);

/** Compares a site photo (site-media bucket) with one page of a drawing set (project-drawings bucket). */
export const checkPhotoAgainstDrawing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      projectId: string;
      drawingFile: string;
      page: number;
      sheetTitle: string;
      photoPath: string;
      photoType: string;
      stage: string;
      note?: string;
    }) => input,
  )
  .handler(async ({ data, context }): Promise<DrawingCheck> => {
    const key = process.env["GOOGLE_GENERATIVE_AI_API_KEY"];
    if (!key)
      throw new Error(
        "Photo checking needs the Gemini key: add GOOGLE_GENERATIVE_AI_API_KEY to the Cloudflare worker's settings",
      );

    const sign = async (bucket: string, path: string) => {
      const { data: s, error } = await context.supabase.storage
        .from(bucket)
        .createSignedUrl(path, 600);
      if (error || !s?.signedUrl) throw new Error(`Could not open ${path}`);
      const res = await fetch(s.signedUrl);
      if (!res.ok) throw new Error(`Could not download ${path}`);
      return Buffer.from(await res.arrayBuffer());
    };
    const [pdf, photo] = await Promise.all([
      sign("project-drawings", `${data.projectId}/${data.drawingFile}`),
      sign("site-media", data.photoPath),
    ]);

    const { createAiProvider, SAHA_MODEL } = await import("@/lib/ai-gateway.server");
    const gateway = createAiProvider(key);
    let text: string;
    try {
      const result = await generateText({
        model: gateway(SAHA_MODEL),
        system: SYSTEM,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Stage ${data.stage}. Drawing: page ${data.page} of the attached PDF, sheet "${data.sheetTitle}". ${data.note ? `Site note: ${data.note}. ` : ""}The second file is the site photo. Compare them and return the JSON only.`,
              },
              { type: "file", data: pdf, mediaType: "application/pdf" },
              { type: "file", data: photo, mediaType: data.photoType || "image/jpeg" },
            ],
          },
        ],
      });
      text = result.text;
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      if (/429/.test(message)) throw new Error("The checker is busy, try again in a minute");
      throw new Error(`Photo check failed: ${message.slice(0, 200)}`);
    }
    const a = text.indexOf("{");
    const b = text.lastIndexOf("}");
    if (a < 0 || b <= a) throw new Error("The checker gave no result; try a clearer photo");
    let j: Record<string, unknown>;
    try {
      j = JSON.parse(text.slice(a, b + 1)) as Record<string, unknown>;
    } catch {
      throw new Error("The checker gave no result; try a clearer photo");
    }
    const v = str(j["verdict"]).toLowerCase();
    const verdict: DrawingCheck["verdict"] =
      v === "in sync" || v === "partly" || v === "not in sync" ? v : "cannot tell";
    return {
      verdict,
      score: Math.max(0, Math.min(100, Number(j["score"]) || 0)),
      matches: list(j["matches"]),
      differences: list(j["differences"]),
      advice: str(j["advice"]),
    };
  });
