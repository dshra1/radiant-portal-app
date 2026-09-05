import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { streamText } from "ai";

export type BudgetSwap = {
  itemId: string;
  trade: string;
  description: string;
  unit: string;
  quantity: number;
  currentBrand: string;
  currentRate: number;
  currentAmount: number;
  suggestedBrand: string;
  suggestedSupplier: string;
  suggestedRate: number;
  suggestedAmount: number;
  saving: number;
  tier: string;
  why: string;
};

function toNum(v: unknown) {
  const n = Number(String(v ?? "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function extractJsonArray(text: string): Record<string, unknown>[] {
  const cleaned = text.replace(/```json/gi, "```").split("```").join("\n");
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
      const parsed = JSON.parse(attempt);
      if (Array.isArray(parsed)) return parsed as Record<string, unknown>[];
    } catch {
      /* try next repair */
    }
  }
  return [];
}

/**
 * Value-engineering plan: cheaper but credible brand/spec swaps across the
 * highest-cost BOQ lines so the project total lands inside the target budget.
 * Read-only — nothing is written until the owner applies a swap.
 */
export const suggestBudgetFit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { projectId: string; maxItems?: number }) => input)
  .handler(async ({ data, context }) => {
    const { supabase } = context;

    const { data: project, error } = await supabase
      .from("site_projects")
      .select("id,name,location,target_budget,total_built_up_sft,brand_preferences,finishing_spec")
      .eq("id", data.projectId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!project) throw new Error("Project not found");

    const { data: rows, error: boqError } = await supabase
      .from("boq_items")
      .select("id,stage,description,unit,quantity,rate,brand,supplier")
      .eq("project_id", data.projectId);
    if (boqError) throw new Error(boqError.message);

    const items = (rows ?? []).map((r) => ({
      id: String(r.id),
      trade: String(r.stage ?? ""),
      description: String(r.description ?? ""),
      unit: String(r.unit ?? ""),
      quantity: toNum(r.quantity),
      rate: toNum(r.rate),
      brand: String(r.brand ?? ""),
      supplier: String(r.supplier ?? ""),
      amount: toNum(r.quantity) * toNum(r.rate),
    }));

    const total = items.reduce((s, i) => s + i.amount, 0);
    const budget = toNum(project.target_budget);
    const gap = Math.max(0, total - budget);

    if (items.length === 0) {
      return { total, budget, gap, swaps: [] as BudgetSwap[], overBudget: false };
    }

    const key = process.env["LOVABLE_API_KEY"];
    if (!key) throw new Error("AI is not configured for this workspace");

    const { createLovableAiGatewayProvider, SAHA_MODEL } = await import("@/lib/ai-gateway.server");
    const gateway = createLovableAiGatewayProvider(key);
    const model = gateway(SAHA_MODEL);

    const limit = Math.max(10, Math.min(60, data.maxItems ?? 40));
    const targets = [...items].sort((a, b) => b.amount - a.amount).slice(0, limit);

    const prefs = Array.isArray(project.brand_preferences)
      ? (project.brand_preferences as Record<string, unknown>[])
          .map((p) => `${String(p?.["material"] ?? "")}: ${String(p?.["brand"] ?? "")}`)
          .filter((s) => s.trim() !== ":")
          .join("; ")
      : "";

    const swaps: BudgetSwap[] = [];
    const batchSize = 12;

    for (let i = 0; i < targets.length; i += batchSize) {
      const batch = targets.slice(i, i + batchSize);
      const result = streamText({
        model,
        system: [
          "You are an Indian quantity surveyor doing value engineering on a Hyderabad building project BOQ so the total lands inside the owner's budget.",
          "For each line item given, propose ONE cheaper but credible alternative brand / make / specification available in the Indian market, with a realistic current Hyderabad per-unit rate for the item's unit.",
          "Return ONLY a JSON array — no prose, no markdown fences. Each element:",
          '{"id":string,"brand":string,"supplier":string,"rate":number,"tier":"Economy"|"Standard"|"Premium","why":string}',
          "rate must be LOWER than the item's current rate and still buildable — never suggest an unsafe or non-compliant substitute for structural items (concrete grade, steel grade, waterproofing).",
          "why = one short line (max 90 chars) on the quality / warranty / lead-time trade-off.",
          "If nothing cheaper is credible for an item, omit that item entirely.",
          prefs ? `The owner prefers these makes where possible: ${prefs}` : "",
        ]
          .filter(Boolean)
          .join("\n"),
        prompt: [
          `PROJECT: ${project.name} · ${project.location} · finishing spec ${project.finishing_spec ?? "Standard"}`,
          `BUDGET GAP TO CLOSE: ₹${Math.round(gap)} out of a total of ₹${Math.round(total)}.`,
          `LINE ITEMS (JSON): ${JSON.stringify(
            batch.map((b) => ({
              id: b.id,
              trade: b.trade,
              description: b.description,
              unit: b.unit,
              quantity: b.quantity,
              currentRate: b.rate,
              currentBrand: b.brand,
            })),
          )}`,
          "Respond with the JSON array only.",
        ].join("\n\n"),
      });

      const text = await result.text;
      for (const raw of extractJsonArray(text)) {
        const id = String(raw["id"] ?? "").trim();
        const item = batch.find((b) => b.id === id);
        if (!item) continue;
        const rate = toNum(raw["rate"]);
        const brand = String(raw["brand"] ?? "").trim();
        if (!brand || rate <= 0 || rate >= item.rate) continue;
        const suggestedAmount = rate * item.quantity;
        swaps.push({
          itemId: item.id,
          trade: item.trade,
          description: item.description,
          unit: item.unit,
          quantity: item.quantity,
          currentBrand: item.brand,
          currentRate: item.rate,
          currentAmount: item.amount,
          suggestedBrand: brand,
          suggestedSupplier: String(raw["supplier"] ?? "").trim(),
          suggestedRate: Math.round(rate * 100) / 100,
          suggestedAmount: Math.round(suggestedAmount * 100) / 100,
          saving: Math.round((item.amount - suggestedAmount) * 100) / 100,
          tier: String(raw["tier"] ?? "").trim(),
          why: String(raw["why"] ?? "").trim(),
        });
      }
    }

    swaps.sort((a, b) => b.saving - a.saving);

    return {
      total,
      budget,
      gap,
      overBudget: budget > 0 && total > budget,
      swaps,
      sft: toNum(project.total_built_up_sft),
    };
  });
