import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { streamText } from "ai";

// The 25 construction trade categories every AI estimate must cover.
export const BOQ_TRADES = [
  "Preliminaries",
  "Earthwork",
  "Plain Cement Concrete (PCC)",
  "RCC Works",
  "Reinforcement (Steel)",
  "Shuttering / Formwork",
  "Masonry",
  "Plastering",
  "Waterproofing",
  "Flooring",
  "Wall Tiling",
  "Granite Works",
  "False Ceiling",
  "Doors",
  "Windows & Glazing",
  "Painting",
  "Sanitaryware",
  "CP Fittings",
  "Plumbing",
  "Electrical",
  "Fire Fighting",
  "Lift Works",
  "External Development",
  "Services (Transformer / DG / STP)",
  "Miscellaneous",
] as const;

type RawItem = {
  trade?: unknown;
  description?: unknown;
  unit?: unknown;
  quantity?: unknown;
  rate?: unknown;
  brand?: unknown;
  supplier?: unknown;
  notes?: unknown;
};

function toNum(v: unknown) {
  const n = Number(String(v ?? "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function extractJsonArray(text: string): RawItem[] {
  const cleaned = text.replace(/```json/gi, "```").split("```").join("\n");
  const start = cleaned.indexOf("[");
  if (start === -1) return [];
  // Walk to the matching bracket so trailing prose does not break parsing.
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
      const parsed = JSON.parse(attempt);
      if (Array.isArray(parsed)) return parsed as RawItem[];
    } catch {
      /* try next repair */
    }
  }
  return [];
}

export const generateBoqEstimate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { projectId: string; extraBrief?: string }) => input)
  .handler(async ({ data, context }) => {
    const { supabase } = context;

    const { data: project, error } = await supabase
      .from("site_projects")
      .select("*")
      .eq("id", data.projectId)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!project) throw new Error("Project not found");

    const key = process.env["LOVABLE_API_KEY"];
    if (!key) throw new Error("AI is not configured for this workspace");

    const { createLovableAiGatewayProvider, SAHA_MODEL } = await import("@/lib/ai-gateway.server");
    const gateway = createLovableAiGatewayProvider(key);
    const model = gateway(SAHA_MODEL);

    const brief = {
      name: project.name,
      location: project.location,
      type: project.type,
      singleFloorSlabSft: project.single_floor_slab_sft,
      cellarFloors: project.cellar_floors,
      stiltFloors: project.stilt_floors,
      typicalFloors: project.typical_floors,
      totalBuiltUpSft: project.total_built_up_sft,
      totalSlabSft: project.total_slab_sft,
      targetBudget: project.target_budget,
      concreteGrade: project.concrete_grade,
      steelGrade: project.steel_grade,
      steelRatioKgPerSft: project.steel_ratio_kg_per_sft,
      cementBagsPerSft: project.cement_bags_per_sft,
      blockwork: project.blockwork_type,
      finishingSpec: project.finishing_spec,
      paintSpec: project.paint_spec,
      plumbingSpec: project.plumbing_spec,
      electricalSpec: project.electrical_spec,
      flooringSpec: project.flooring_spec,
      doorsWindowsSpec: project.doors_windows_spec,
      sanitarywareSpec: project.sanitaryware_spec,
      contractType: project.contract_type,
      workflowTemplate: project.workflow_template,
    };

    const system = [
      "You are a senior Indian quantity surveyor preparing a pre-drawing concept BOQ / budget estimate for a Hyderabad (Telangana) building project. Architectural drawings are NOT available yet, so derive everything from standard thumb rules, IS codes, CPWD norms and current Hyderabad market rates in INR.",
      "Return ONLY a JSON array — no prose, no markdown fences. Each element must be an object with exactly these keys:",
      '{"trade":string,"description":string,"unit":string,"quantity":number,"rate":number,"brand":string,"supplier":string,"notes":string}',
      "quantity and rate are plain numbers (rate = per-unit rate in INR, no symbols or commas). notes holds the short derivation thumb rule. brand/supplier use realistic Indian brands and supply channels; use \"\" where not applicable.",
      "Quantities MUST be derived from the given geometry (built-up sft, slab sft, floor counts) and be internally consistent with the specified material grades and quality tiers.",
    ].join("\n");

    const batches: (typeof BOQ_TRADES)[number][][] = [];
    for (let i = 0; i < BOQ_TRADES.length; i += 5) {
      batches.push(BOQ_TRADES.slice(i, i + 5) as (typeof BOQ_TRADES)[number][]);
    }

    const collected: { trade: string; item: RawItem }[] = [];

    for (const trades of batches) {
      const result = streamText({
        model,
        system,
        prompt: [
          `PROJECT BRIEF (JSON): ${JSON.stringify(brief)}`,
          `Cover ONLY these trade categories in this response, using the trade name EXACTLY as written for the "trade" field: ${trades.join(" | ")}`,
          "Give 8-14 realistic line items for EVERY listed trade (site preparation through finishing and handover as applicable to each trade). Do not skip a trade.",
          data.extraBrief ? `ADDITIONAL INSTRUCTIONS FROM THE OWNER: ${data.extraBrief}` : "",
          "Respond with the JSON array only.",
        ]
          .filter(Boolean)
          .join("\n\n"),
      });

      const text = await result.text;
      for (const item of extractJsonArray(text)) {
        const trade = String(item.trade ?? "").trim();
        const matched = trades.find((t) => t.toLowerCase() === trade.toLowerCase()) ?? trades[0]!;
        if (!String(item.description ?? "").trim()) continue;
        collected.push({ trade: matched, item });
      }
    }

    if (collected.length === 0) throw new Error("AI returned no usable line items");

    const del = await supabase
      .from("boq_items")
      .delete()
      .eq("project_id", data.projectId)
      .eq("source", "ai");
    if (del.error) throw new Error(del.error.message);

    const rows = collected.map(({ trade, item }, index) => ({
      project_id: data.projectId,
      stage: trade,
      category: trade,
      item_code: `AI-${String(index + 1).padStart(4, "0")}`,
      description: String(item.description ?? "").trim(),
      unit: String(item.unit ?? "NOS").trim() || "NOS",
      quantity: toNum(item.quantity),
      rate: toNum(item.rate),
      brand: String(item.brand ?? "").trim(),
      supplier: String(item.supplier ?? "").trim(),
      notes: String(item.notes ?? "").trim(),
      source: "ai",
      sort_order: index,
    }));

    const chunk = 300;
    for (let i = 0; i < rows.length; i += chunk) {
      const insert = await supabase.from("boq_items").insert(rows.slice(i, i + chunk));
      if (insert.error) throw new Error(insert.error.message);
    }

    const covered = new Set(rows.map((r) => r.stage));
    return {
      inserted: rows.length,
      tradesCovered: covered.size,
      tradesMissing: BOQ_TRADES.filter((t) => !covered.has(t)),
    };
  });
