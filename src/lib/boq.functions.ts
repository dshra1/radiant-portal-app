import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { streamText, Output } from "ai";
import { z } from "zod";

const ItemSchema = z.object({
  stage: z.string(),
  category: z.string(),
  description: z.string(),
  unit: z.string(),
  quantity: z.number(),
  rate: z.number(),
  brand: z.string(),
  supplier: z.string(),
  notes: z.string(),
});

const EstimateSchema = z.object({ items: z.array(ItemSchema) });

export const generateBoqEstimate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { projectId: string; replaceAi?: boolean; extraBrief?: string }) => input)
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

    const result = streamText({
      model: gateway(SAHA_MODEL),
      output: Output.object({ schema: EstimateSchema }),
      system: [
        "You are a senior Indian quantity surveyor preparing a pre-drawing budget estimate (concept BOQ) for a Hyderabad / Telangana building project.",
        "Produce a COMPLETE stage-wise bill of quantities from site preparation to final handover, even though architectural drawings are not yet available. Use standard thumb rules, IS codes, CPWD norms and current Hyderabad market rates in INR.",
        "Cover every stage, using these stage names exactly:",
        "Stage 01: Site Preparation & Enabling Works",
        "Stage 02: Earthwork & Foundation",
        "Stage 03: RCC Substructure & Plinth",
        "Stage 04: RCC Superstructure",
        "Stage 05: Masonry & Blockwork",
        "Stage 06: Plastering & Waterproofing",
        "Stage 07: Plumbing & Sanitary",
        "Stage 08: Electrical & Low Voltage",
        "Stage 09: Doors, Windows & Joinery",
        "Stage 10: Flooring, Tiling & Cladding",
        "Stage 11: Painting & Finishes",
        "Stage 12: External Development & Handover",
        "Return 120-200 line items spread across ALL stages. Quantities must be derived from the given geometry (built-up sft, slab sft, floor counts) and be internally consistent. rate is the per-unit rate in INR (numeric, no symbols). Use realistic Indian brands and supplier channel names. notes holds the derivation thumb rule (short).",
      ].join("\n"),
      prompt: [
        `PROJECT BRIEF (JSON): ${JSON.stringify(brief)}`,
        data.extraBrief ? `ADDITIONAL INSTRUCTIONS: ${data.extraBrief}` : "",
      ]
        .filter(Boolean)
        .join("\n\n"),
    });

    const output = await result.output;
    const items = output.items ?? [];
    if (items.length === 0) throw new Error("AI returned no line items");

    if (data.replaceAi !== false) {
      const del = await supabase
        .from("boq_items")
        .delete()
        .eq("project_id", data.projectId)
        .eq("source", "ai");
      if (del.error) throw new Error(del.error.message);
    }

    const rows = items.map((item, index) => ({
      project_id: data.projectId,
      stage: item.stage || "Stage 01: Site Preparation & Enabling Works",
      category: item.category || "General",
      item_code: `AI-${String(index + 1).padStart(4, "0")}`,
      description: item.description,
      unit: item.unit || "NOS",
      quantity: Number.isFinite(item.quantity) ? item.quantity : 0,
      rate: Number.isFinite(item.rate) ? item.rate : 0,
      brand: item.brand ?? "",
      supplier: item.supplier ?? "",
      notes: item.notes ?? "",
      source: "ai",
      sort_order: index,
    }));

    const insert = await supabase.from("boq_items").insert(rows);
    if (insert.error) throw new Error(insert.error.message);

    return { inserted: rows.length };
  });
