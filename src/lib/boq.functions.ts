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

const SFT_PER_SQM = 10.7639;
const RFT_PER_M = 3.28084;

/**
 * Indian site practice: areas in sft, lengths in rft. If the model answers in
 * metric, convert the quantity and rate so the line amount stays identical.
 * Only ever applied to freshly generated AI rows, never to saved/edited data.
 */
function toSiteUnits(unit: string, quantity: number, rate: number) {
  const u = unit.toLowerCase().replace(/[\s.]/g, "");
  const area = ["sqm", "sqmt", "sqmts", "sqmtr", "sqmtrs", "m2", "sqmeter", "sqmetre", "squaremetre", "squaremeter"];
  const length = ["m", "mtr", "mtrs", "rm", "rmt", "meter", "metre", "runningmetre", "runningmeter"];
  if (area.includes(u)) {
    return { unit: "SFT", quantity: quantity * SFT_PER_SQM, rate: rate / SFT_PER_SQM };
  }
  if (length.includes(u)) {
    return { unit: "RFT", quantity: quantity * RFT_PER_M, rate: rate / RFT_PER_M };
  }
  return { unit, quantity, rate };
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

    // Owner-declared brand preferences (set on the Brand Preferences screen).
    const prefs = Array.isArray(project.brand_preferences)
      ? (project.brand_preferences as Record<string, unknown>[])
          .map((p) => ({
            material: String(p?.["material"] ?? "").trim(),
            brand: String(p?.["brand"] ?? "").trim(),
            series: String(p?.["series"] ?? "").trim(),
            supplier: String(p?.["supplier"] ?? "").trim(),
            notes: String(p?.["notes"] ?? "").trim(),
          }))
          .filter((p) => p.material && p.brand)
      : [];

    const prefLines = prefs
      .map(
        (p) =>
          `- ${p.material}: ${p.brand}${p.series ? ` (${p.series})` : ""}${p.supplier ? ` — supplier ${p.supplier}` : ""}${p.notes ? ` — ${p.notes}` : ""}`,
      )
      .join("\n");

    const system = [
      "You are a senior Indian quantity surveyor preparing a pre-drawing concept BOQ / budget estimate for a Hyderabad (Telangana) building project. Architectural drawings are NOT available yet, so derive everything from standard thumb rules, IS codes, CPWD norms and current Hyderabad market rates in INR.",
      "Return ONLY a JSON array — no prose, no markdown fences. Each element must be an object with exactly these keys:",
      '{"trade":string,"description":string,"unit":string,"quantity":number,"rate":number,"brand":string,"supplier":string,"notes":string}',
      "quantity and rate are plain numbers (rate = per-unit rate in INR, no symbols or commas). notes holds the short derivation thumb rule. brand/supplier use realistic Indian brands and supply channels; use \"\" where not applicable.",
      "Quantities MUST be derived from the given geometry (built-up sft, slab sft, floor counts) and be internally consistent with the specified material grades and quality tiers.",
      "UNITS: use Indian site units only — areas in SFT (never SQM / sq mt / m2), lengths in RFT, concrete in CUM, steel in KG or MT, counts in NOS, cement in BAGS. Flooring, wall tiling, granite, plastering, painting, waterproofing and false ceiling MUST be quoted in SFT with a per-SFT rate.",
      "AREA DETAIL: for every finishing trade (Flooring, Wall Tiling, Granite Works, False Ceiling, Painting, Waterproofing, Sanitaryware, CP Fittings) the description MUST name the room/location it applies to, e.g. \"Vitrified tile flooring 800x800 — living & dining\", \"Anti-skid flooring — bathroom floor\", \"Ceramic dado up to 7ft — bathroom wall\", \"Granite — kitchen platform\", \"Flooring — bedrooms\", \"Flooring — balcony\", \"Flooring — staircase & lobby\", \"Flooring — utility\". Split each finishing trade into separate line items per area instead of one lumped item.",
      prefLines
        ? [
            "OWNER'S APPROVED BRANDS — these are mandatory. For any item belonging to one of these materials you MUST set \"brand\" to exactly the make named below (append the series/grade when given) and price the item at that brand's realistic Hyderabad rate. Never substitute a different make for these, and never leave the brand blank for them. Copy the supplier when one is given.",
            prefLines,
            "For materials NOT listed above, propose a suitable realistic Indian brand as usual.",
          ].join("\n")
        : "",
    ]
      .filter(Boolean)
      .join("\n");


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

    const rows = collected.map(({ trade, item }, index) => {
      const site = toSiteUnits(
        String(item.unit ?? "NOS").trim() || "NOS",
        toNum(item.quantity),
        toNum(item.rate),
      );
      return {
        project_id: data.projectId,
        stage: trade,
        category: trade,
        item_code: `AI-${String(index + 1).padStart(4, "0")}`,
        description: String(item.description ?? "").trim(),
        unit: site.unit,
        quantity: Math.round(site.quantity * 100) / 100,
        rate: Math.round(site.rate * 100) / 100,
        brand: String(item.brand ?? "").trim(),
        supplier: String(item.supplier ?? "").trim(),
        notes: String(item.notes ?? "").trim(),
        source: "ai",
        sort_order: index,
      };
    });


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

export type BrandOption = {
  brand: string;
  supplier: string;
  rate: number;
  tier: string;
  why: string;
};

export type BrandSuggestion = {
  itemId: string;
  description: string;
  trade: string;
  unit: string;
  quantity: number;
  currentBrand: string;
  currentRate: number;
  options: BrandOption[];
};

/**
 * Brand / value-engineering alternatives for one or more BOQ line items.
 * Returns 3-4 realistic Indian brand options per item with per-unit rates so
 * the owner can compare and apply a substitution.
 */
export const suggestBrandOptions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { itemIds: string[] }) => input)
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const ids = (data.itemIds ?? []).slice(0, 15);
    if (ids.length === 0) return { suggestions: [] as BrandSuggestion[] };

    const { data: items, error } = await supabase
      .from("boq_items")
      .select("id,project_id,stage,category,description,unit,quantity,rate,brand,supplier")
      .in("id", ids);
    if (error) throw new Error(error.message);
    if (!items || items.length === 0) return { suggestions: [] as BrandSuggestion[] };

    const { data: project } = await supabase
      .from("site_projects")
      .select(
        "name,location,type,finishing_spec,paint_spec,plumbing_spec,electrical_spec,flooring_spec,sanitaryware_spec,doors_windows_spec,steel_grade,concrete_grade,blockwork_type",
      )
      .eq("id", items[0]!.project_id)
      .maybeSingle();

    const key = process.env["LOVABLE_API_KEY"];
    if (!key) throw new Error("AI is not configured for this workspace");
    const { createLovableAiGatewayProvider, SAHA_MODEL } = await import("@/lib/ai-gateway.server");
    const gateway = createLovableAiGatewayProvider(key);

    const payload = items.map((it) => ({
      id: it.id,
      trade: it.stage,
      description: it.description,
      unit: it.unit,
      quantity: Number(it.quantity) || 0,
      currentBrand: it.brand || "",
      currentRate: Number(it.rate) || 0,
    }));

    const result = streamText({
      model: gateway(SAHA_MODEL),
      system: [
        "You are a procurement and value-engineering specialist for building construction in Hyderabad, India.",
        "For each BOQ line item given, propose 3-4 REAL alternative brands / makes available in the Indian market that can supply that item, spanning economy, standard and premium tiers.",
        "Return ONLY a JSON array, no prose or markdown. Each element:",
        '{"id":string,"options":[{"brand":string,"supplier":string,"rate":number,"tier":"Economy"|"Standard"|"Premium","why":string}]}',
        "rate = realistic current per-unit rate in INR for that brand and the item's unit (plain number). why = one short line on quality/warranty/lead-time trade-off (max 90 chars).",
        "Where a branded product does not apply (e.g. earthwork labour), propose execution/vendor options instead and keep rates realistic.",
        "Always include at least one option cheaper than the current rate when a credible cheaper make exists.",
      ].join("\n"),
      prompt: [
        project
          ? `PROJECT CONTEXT: ${JSON.stringify(project)}`
          : "PROJECT CONTEXT: general residential building",
        `LINE ITEMS: ${JSON.stringify(payload)}`,
        "Respond with the JSON array only, one element per line item id.",
      ].join("\n\n"),
    });

    const parsed = extractJsonArray(await result.text) as unknown as {
      id?: unknown;
      options?: unknown;
    }[];

    const byId = new Map<string, BrandOption[]>();
    for (const entry of parsed) {
      const id = String(entry.id ?? "");
      if (!id || !Array.isArray(entry.options)) continue;
      const options: BrandOption[] = (entry.options as RawItem[])
        .map((o) => ({
          brand: String((o as { brand?: unknown }).brand ?? "").trim(),
          supplier: String((o as { supplier?: unknown }).supplier ?? "").trim(),
          rate: toNum((o as { rate?: unknown }).rate),
          tier: String((o as { tier?: unknown }).tier ?? "Standard").trim() || "Standard",
          why: String((o as { why?: unknown }).why ?? "").trim(),
        }))
        .filter((o) => o.brand !== "");
      if (options.length) byId.set(id, options);
    }

    const suggestions: BrandSuggestion[] = items
      .filter((it) => byId.has(it.id))
      .map((it) => ({
        itemId: it.id,
        description: it.description,
        trade: it.stage,
        unit: it.unit,
        quantity: Number(it.quantity) || 0,
        currentBrand: it.brand || "",
        currentRate: Number(it.rate) || 0,
        options: byId.get(it.id)!,
      }));

    return { suggestions };
  });


/**
 * Tries to find a real product image on the internet for a BOQ line item
 * (e.g. "Kohler July series diverter/spout"). The model proposes candidate
 * image URLs from manufacturer/dealer sites; each candidate is verified
 * server-side and only a URL that really serves an image is saved.
 * Returns found:false when nothing verifies, so the UI can ask for an upload.
 */
export const findProductImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { itemId: string; query?: string }) => input)
  .handler(async ({ data, context }) => {
    const { supabase } = context;

    const { data: item, error } = await supabase
      .from("boq_items")
      .select("id,stage,description,brand,unit")
      .eq("id", data.itemId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!item) throw new Error("Line item not found");

    const searchText =
      (data.query ?? "").trim() || `${item.brand} ${item.description}`.trim();
    if (!searchText) return { found: false as const, searchText: "" };

    const key = process.env["LOVABLE_API_KEY"];
    if (!key) throw new Error("AI is not configured for this workspace");
    const { createLovableAiGatewayProvider, SAHA_MODEL } = await import("@/lib/ai-gateway.server");
    const gateway = createLovableAiGatewayProvider(key);

    const result = streamText({
      model: gateway(SAHA_MODEL),
      system: [
        "You locate product photographs for Indian construction and bathroom/electrical/finishing products.",
        "Given a product description, return ONLY a JSON array of 6 candidate DIRECT image URLs (ending in .jpg/.jpeg/.png/.webp) from manufacturer or authorised dealer/e-commerce websites.",
        'Format: ["https://...jpg", "https://...png"]',
        "Prefer official brand product pages and large Indian retailers. Do not return search-result pages, data URIs or placeholders.",
      ].join("\n"),
      prompt: `PRODUCT: ${searchText}\nTRADE: ${item.stage}\nReturn the JSON array only.`,
    });

    const text = await result.text;
    const urls = Array.from(
      new Set(
        (text.match(/https?:\/\/[^\s"'<>\]]+/g) ?? []).filter((u) =>
          /\.(jpe?g|png|webp)(\?|$)/i.test(u),
        ),
      ),
    ).slice(0, 8);

    for (const url of urls) {
      try {
        const probe = await fetch(url, { method: "GET", headers: { Accept: "image/*" } });
        const type = probe.headers.get("content-type") ?? "";
        if (probe.ok && type.startsWith("image/")) {
          const upd = await supabase
            .from("boq_items")
            .update({ image_url: url, image_source: "web" })
            .eq("id", item.id);
          if (upd.error) throw new Error(upd.error.message);
          return { found: true as const, imageUrl: url, searchText };
        }
      } catch {
        /* try the next candidate */
      }
    }

    return { found: false as const, searchText, candidates: urls };
  });
