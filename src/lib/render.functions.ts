import { createServerFn } from "@tanstack/react-start";
import { generateText } from "ai";
import { aiUse } from "@/lib/ai-use";

export type RenderKind = "bathroom" | "wall-finished" | "wall-conduit";
export type RenderInput = {
  projectId: string;
  kind: RenderKind;
  title: string; // e.g. "FLAT-01 · A18 · A. TOILET (M.BEDROOM)"
  imageBase64: string; // PNG/JPEG of the drawing page, photo or sketch
  mediaType: string;
  options: Record<string, string>;
};

const BASE = [
  "You are an architectural visualiser for an Indian residential builder.",
  "The attached image is a construction drawing (or a site photo / sketch). Follow its layout exactly:",
  "positions, sizes and heights of fixtures, points and openings must match the drawing. Do not add or move fixtures.",
  "Ignore the drawing's title block, dimension text and annotations in the output: produce a clean image with no text, labels or watermarks.",
];

function prompt(kind: RenderKind, title: string, o: Record<string, string>) {
  const extra = o["notes"] ? `Client notes: ${o["notes"]}.` : "";
  if (kind === "bathroom")
    return [
      ...BASE,
      `Make a photo-real interior render of this bathroom (${title}) as finished, seen from the door at eye level, 4:3.`,
      `Style: ${o["style"] || "modern Indian contemporary"}. Wall tiles: ${o["wallTile"] || "large-format matt beige 600x1200"}. Floor tiles: ${o["floorTile"] || "anti-skid matt grey 600x600"}.`,
      `Sanitaryware: ${o["sanitary"] || "white wall-hung WC with concealed cistern, counter-top basin"}. Fittings finish: ${o["fittings"] || "chrome"}.`,
      `Shower: ${o["shower"] || "linear drain with clear glass partition"}. Vanity: ${o["vanity"] || "wall-hung wood-finish vanity with mirror"}. Lighting: ${o["lighting"] || "warm white recessed lights"}.`,
      "Realistic materials, soft natural light, no people.",
      extra,
    ].join("\n");
  if (kind === "wall-finished")
    return [
      ...BASE,
      `Make a photo-real render of this wall (${title}) as finished, straight-on elevation view, 16:9.`,
      "Show every switch board, socket, TV/data point and light point exactly where and at the height the elevation marks it; wiring is concealed.",
      `Wall finish: ${o["wall"] || "smooth emulsion, warm off-white"}. Switch plates: ${o["plates"] || "white modular"}. Room: ${o["room"] || "as named in the title"}.`,
      "Furniture only if it helps read the switch positions (bed, sofa, TV unit, counter), kept simple.",
      extra,
    ].join("\n");
  return [
    ...BASE,
    `Make a realistic site view of this wall (${title}) before plaster, straight-on, 16:9: AAC block wall with chased conduits.`,
    "Draw each conduit run and each back box exactly as the elevation marks it (heights from floor, routes up to the slab or down to the floor).",
    "Use orange/grey PVC conduit and galvanised back boxes; mark each box with a small coloured tag for its type (switch board, socket, TV/data, light). Clean, construction-site lighting.",
    extra,
  ].join("\n");
}

/** One render with the Gemini image model; saved to the project's media under RENDERS. */
export const generateRender = createServerFn({ method: "POST" })
  .middleware([aiUse("render")])
  .inputValidator((input: RenderInput) => input)
  .handler(async ({ data, context }) => {
    const key = process.env["GOOGLE_GENERATIVE_AI_API_KEY"];
    if (!key) throw new Error("AI is not configured for this workspace");
    if (!data.projectId) throw new Error("Choose a project first");
    const bytes = Buffer.from(data.imageBase64, "base64");
    if (bytes.byteLength > 8 * 1024 * 1024)
      throw new Error("The drawing image is too large (over 8 MB)");
    const { createAiProvider } = await import("@/lib/ai-gateway.server");
    const google = createAiProvider(key);
    const model = process.env["SAHA_IMAGE_MODEL"] || "gemini-2.5-flash-image";
    let result;
    try {
      result = await generateText({
        model: google(model),
        providerOptions: {
          google: {
            responseModalities: ["TEXT", "IMAGE"],
            imageConfig: { aspectRatio: data.kind === "bathroom" ? "4:3" : "16:9" },
          },
        },
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt(data.kind, data.title, data.options) },
              { type: "file", data: bytes, mediaType: data.mediaType || "image/png" },
            ],
          },
        ],
      });
    } catch (e) {
      const m = e instanceof Error ? e.message : String(e);
      if (/429/.test(m)) throw new Error("The render service is busy. Try again in a minute.");
      throw new Error(`Render failed: ${m.slice(0, 200)}`);
    }
    const img = result.files.find((f) => f.mediaType.startsWith("image/"));
    if (!img) throw new Error("No image came back. Try again, or simplify the notes.");
    const ext = img.mediaType.includes("jpeg") ? "jpg" : "png";
    const path = `${data.projectId}/RENDERS/${Date.now()}-${data.kind}.${ext}`;
    const up = await context.supabase.storage
      .from("site-media")
      .upload(path, new Blob([new Uint8Array(img.uint8Array)], { type: img.mediaType }), {
        contentType: img.mediaType,
      });
    if (up.error) throw new Error(`Could not save the render: ${up.error.message}`);
    await context.supabase.from("project_media").insert({
      project_id: data.projectId,
      path,
      title: `${data.kind === "bathroom" ? "Bathroom render" : data.kind === "wall-finished" ? "Wall render" : "Conduit layout"} · ${data.title}`,
      stage: "RENDERS",
      category: "render",
      caption: JSON.stringify({ kind: data.kind, options: data.options }).slice(0, 900),
    } as never);
    const signed = await context.supabase.storage.from("site-media").createSignedUrl(path, 3600);
    return { path, url: signed.data?.signedUrl ?? "" };
  });
