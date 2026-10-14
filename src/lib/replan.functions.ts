import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generateText } from "ai";

export type RecoveryInput = {
  projectId: string;
  handover: { report: string; plan: string; forecast: string; slipDays: number };
  critical: {
    code: string;
    name: string;
    start: string;
    end: string;
    slip: number;
    driver: string;
  }[];
  late: { code: string; name: string; slip: number; driver: string; pct: number }[];
  materialHolds: { code: string; what: string; arrives: string }[];
};

/**
 * Recovery suggestions for a slipping programme: the forecast is worked out in
 * the app (no AI); the AI only reads it and proposes practical site actions.
 * Read-only: nothing changes until the PM applies a re-plan.
 */
export const suggestRecovery = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: RecoveryInput) => input)
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: project, error } = await supabase
      .from("site_projects")
      .select("name,location")
      .eq("id", data.projectId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!project) throw new Error("Project not found");

    const key = process.env["GOOGLE_GENERATIVE_AI_API_KEY"];
    if (!key) throw new Error("AI is not configured for this workspace (set the Gemini key)");
    const { createAiProvider, SAHA_MODEL } = await import("@/lib/ai-gateway.server");
    const model = createAiProvider(key)(SAHA_MODEL);

    const { text } = await generateText({
      model,
      system: [
        "You are a senior construction planner on an RCC residential building in Hyderabad (stilt + 5 floors).",
        "You get a programme forecast worked out from site progress: the critical path, late stages and material not yet ordered.",
        "Propose 4 to 7 concrete recovery actions the PM can take this week, most effective first.",
        "Each action: what to do, on which stage codes, and roughly how many days it can recover. Be realistic: never shorten concrete curing, de-shuttering times or hold-point inspections; prefer extra gangs, parallel fronts, ordering material today, extended shifts, re-sequencing finishes floor by floor.",
        "Write in short plain sentences for a site team. Use a numbered list. No preamble, no markdown headings.",
      ].join("\n"),
      prompt: [
        `PROJECT: ${project.name} · ${project.location}`,
        `HANDOVER: report ${data.handover.report}, current plan ${data.handover.plan}, forecast ${data.handover.forecast} (${data.handover.slipDays} days vs plan).`,
        `CRITICAL PATH: ${JSON.stringify(data.critical.slice(0, 25))}`,
        `LATE STAGES: ${JSON.stringify(data.late.slice(0, 20))}`,
        `MATERIAL NOT ORDERED IN TIME: ${JSON.stringify(data.materialHolds.slice(0, 15))}`,
      ].join("\n\n"),
    });
    return { text: text.trim() };
  });
