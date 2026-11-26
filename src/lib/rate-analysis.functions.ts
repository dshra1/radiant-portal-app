import { aiUse } from "@/lib/ai-use";
import { createServerFn } from "@tanstack/react-start";
import { streamText } from "ai";
import type { Component, Kind } from "@/lib/rate-analysis";

/**
 * AI rate analysis for BOQ lines no standard norm fits (precast items, compound walls,
 * waterproofing systems, fixtures…). PREVIEW ONLY: the BOQ Budget page shows the parts
 * marked "AI estimate, check" and keeps them only when the user saves the budget.
 */

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
  const end = cleaned.lastIndexOf("]");
  if (start === -1) return [];
  const slice = end > start ? cleaned.slice(start, end + 1) : cleaned.slice(start);
  for (const attempt of [
    slice,
    slice.replace(/,\s*$/, "") + "]",
    slice.replace(/,[^,]*$/, "") + "]",
  ]) {
    try {
      const parsed: unknown = JSON.parse(attempt);
      if (Array.isArray(parsed)) return parsed as Record<string, unknown>[];
    } catch {
      /* try next repair */
    }
  }
  return [];
}

const KINDS: Kind[] = ["material", "labour", "equipment"];

export type AiBreakdown = { id: string; components: Component[] };

export const suggestRateAnalysis = createServerFn({ method: "POST" })
  .middleware([aiUse("boq-ai")])
  .inputValidator(
    (input: {
      lines: { id: string; description: string; unit: string; rate: number }[];
      known: { name: string; unit: string; rate: number }[];
    }) => input,
  )
  .handler(async ({ data }) => {
    const lines = data.lines.slice(0, 40);
    if (lines.length === 0) return { results: [] as AiBreakdown[] };
    const key = process.env["GOOGLE_GENERATIVE_AI_API_KEY"];
    if (!key) throw new Error("AI is not configured for this workspace");
    const { createAiProvider, SAHA_MODEL } = await import("@/lib/ai-gateway.server");
    const model = createAiProvider(key)(SAHA_MODEL);

    const results: AiBreakdown[] = [];
    for (let i = 0; i < lines.length; i += 10) {
      const batch = lines.slice(i, i + 10);
      const result = streamText({
        model,
        system: [
          "You are an Indian quantity surveyor doing rate analysis for a Hyderabad building BOQ.",
          "For each BOQ line, break ONE unit of the line into its cost parts: materials, labour and equipment.",
          "Each part: kind (material|labour|equipment), name, unit the rate is in, qty per ONE unit of the BOQ line, a realistic current Hyderabad rate ex-GST in ₹ for that unit, and basis (max 70 chars: how qty was worked out, e.g. CPWD norm or coverage).",
          "Prefer the company's known rates when a part matches one of them (use the same name and unit).",
          "Labour: use a contractor rate per unit of work unless daily wages are clearly meant.",
          "Equipment hire rates exclude diesel; add dieselLph (litres per hour) for diesel machines.",
          "Do not include GST, overheads or profit. If a line is a lump sum or provisional sum you cannot break down, omit it.",
          'Return ONLY a JSON array: [{"id":string,"parts":[{"kind":"material","name":string,"unit":string,"qty":number,"rate":number,"basis":string,"dieselLph"?:number}]}]',
        ].join("\n"),
        prompt: [
          `COMPANY RATES (JSON): ${JSON.stringify(data.known.slice(0, 80))}`,
          `BOQ LINES (JSON, rate = the BOQ's sale/estimate rate, for scale only): ${JSON.stringify(batch)}`,
          "Respond with the JSON array only.",
        ].join("\n\n"),
      });
      const text = await result.text;
      for (const raw of extractJsonArray(text)) {
        const id = String(raw["id"] ?? "");
        if (!batch.some((b) => b.id === id)) continue;
        const parts = Array.isArray(raw["parts"])
          ? (raw["parts"] as Record<string, unknown>[])
          : [];
        const components: Component[] = [];
        parts.forEach((p, n) => {
          const kind = String(p["kind"] ?? "") as Kind;
          const name = String(p["name"] ?? "")
            .trim()
            .slice(0, 80);
          const qty = toNum(p["qty"]);
          const rate = toNum(p["rate"]);
          if (!KINDS.includes(kind) || !name || qty <= 0 || rate < 0) return;
          const lph = toNum(p["dieselLph"]);
          components.push({
            key: `ai_${n}_${name
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "_")
              .slice(0, 30)}`,
            kind,
            name,
            unit:
              String(p["unit"] ?? "")
                .trim()
                .slice(0, 12) || "nos",
            qty,
            rate,
            basis:
              String(p["basis"] ?? "")
                .trim()
                .slice(0, 90) || "AI estimate",
            ...(kind === "equipment" && lph > 0 ? { dieselLph: lph } : {}),
            origin: "ai",
          });
        });
        if (components.length) results.push({ id, components });
      }
    }
    return { results };
  });
