import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { streamText } from "ai";

/**
 * AI labour-only market rates for the BOQ "Labour Contracts" section — PREVIEW ONLY.
 * Unlike generateLabourRates in boq.functions.ts this writes nothing: the BOQ
 * Engine shows the rows marked as AI estimates and inserts them only after the
 * user confirms (and chooses whether to replace earlier AI estimates).
 */

export type LabourEstimate = {
  category: string;
  description: string;
  unit: string;
  quantity: number;
  rate: number;
  supplier: string;
  notes: string;
};

function toNum(v: unknown) {
  const n = Number(String(v ?? "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function extractJsonArray(text: string): Record<string, unknown>[] {
  const cleaned = text
    .replace(/```json/gi, "```")
    .split("```")
    .join("\n");
  const start = cleaned.indexOf("[");
  if (start === -1) return [];
  let depth = 0;
  let end = -1;
  let inStr = false;
  for (let i = start; i < cleaned.length; i++) {
    const ch = cleaned[i];
    if (inStr) {
      if (ch === "\\") i++;
      else if (ch === '"') inStr = false;
      continue;
    }
    if (ch === '"') inStr = true;
    else if (ch === "[") depth++;
    else if (ch === "]") {
      depth--;
      if (depth === 0) {
        end = i;
        break;
      }
    }
  }
  const slice = end === -1 ? cleaned.slice(start) : cleaned.slice(start, end + 1);
  const attempts = [slice, slice.replace(/,\s*$/, "") + "]", slice.replace(/,[^,]*$/, "") + "]"];
  for (const attempt of attempts) {
    try {
      const parsed: unknown = JSON.parse(attempt);
      if (Array.isArray(parsed)) return parsed as Record<string, unknown>[];
    } catch {
      /* try next repair */
    }
  }
  return [];
}

export const previewLabourRates = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { projectId: string }) => input)
  .handler(async ({ data, context }): Promise<{ rows: LabourEstimate[] }> => {
    const { supabase } = context;
    const { data: project, error } = await supabase
      .from("site_projects")
      .select(
        "name,location,type,total_built_up_sft,total_slab_sft,typical_floors,cellar_floors,stilt_floors,concrete_grade,blockwork_type,finishing_spec,contract_type",
      )
      .eq("id", data.projectId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!project) throw new Error("Project not found");

    const key = process.env["GOOGLE_GENERATIVE_AI_API_KEY"];
    if (!key) throw new Error("AI is not configured for this workspace");
    const { createAiProvider, SAHA_MODEL } = await import("@/lib/ai-gateway.server");
    const gateway = createAiProvider(key);

    const result = streamText({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      model: gateway(SAHA_MODEL) as any,
      system: [
        "You are a senior site contracts manager in Hyderabad (Telangana), India, quoting LABOUR-ONLY contract rates (material supplied by the owner) for a building project.",
        "Return ONLY a JSON array, no prose or markdown. Each element:",
        '{"trade":string,"description":string,"unit":string,"quantity":number,"rate":number,"supplier":string,"notes":string}',
        "One element per labour package: Excavation & earthwork, Barbending / steel fixing, Shuttering / centering (carpentry), Concreting / mason gang, Block masonry, Internal plastering, External plastering, Waterproofing applicator, Flooring & tiling (incl. dado), Granite fixing, Painting, Plumbing (sanitary + CPVC), Electrical wiring, Carpentry & door fixing, False ceiling, Fabrication & railing, Housekeeping / helpers, Site supervision gang.",
        "unit: use prevailing Indian labour contract units only — SFT for area-based packages, RFT for lengths, KG or MT for barbending, CUM for excavation/concrete, NOS for counts, MONTH for supervision/housekeeping.",
        "rate = realistic CURRENT Hyderabad labour-only contract rate in INR per that unit (plain number, no symbols). quantity = derived from the given geometry using standard thumb rules.",
        'supplier = a generic vendor label such as "Labour contractor — to be finalised" (never invent a real company name).',
        'notes = the rate basis in max 80 chars, e.g. "Hyd market 2026, labour only, owner supplies material".',
      ].join("\n"),
      prompt: [
        `PROJECT BRIEF (JSON): ${JSON.stringify(project)}`,
        "Give the full labour package list with market rates. Respond with the JSON array only.",
      ].join("\n\n"),
    });

    const parsed = extractJsonArray(await result.text);
    const rows = parsed
      .filter((r) => String(r["description"] ?? "").trim())
      .map((item): LabourEstimate => ({
        category: String(item["trade"] ?? "Labour contract").trim() || "Labour contract",
        description: String(item["description"] ?? "").trim(),
        unit:
          String(item["unit"] ?? "SFT")
            .trim()
            .toUpperCase() || "SFT",
        quantity: Math.round(toNum(item["quantity"]) * 100) / 100,
        rate: Math.round(toNum(item["rate"]) * 100) / 100,
        supplier: String(item["supplier"] ?? "").trim(),
        notes: String(item["notes"] ?? "").trim(),
      }));
    if (rows.length === 0) throw new Error("AI returned no usable labour rates");
    return { rows };
  });
