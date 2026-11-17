import { createMiddleware } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { AiFeatureKey } from "@/lib/ai-plans";

/**
 * Middleware for every AI server function: signed-in approved user, feature in the firm's
 * plan, enough prepaid credits; the price is deducted only when the AI run succeeds.
 */
export const aiUse = (key: AiFeatureKey) =>
  createMiddleware({ type: "function" })
    .middleware([requireSupabaseAuth])
    .server(async ({ next, context }) => {
      const { assertAiFeature } = await import("@/lib/ai-plans.server");
      const { checkAiUse, chargeAiUse } = await import("@/lib/ai-credits.server");
      await assertAiFeature(context.supabase as never, key);
      await checkAiUse(key);
      const result = await next();
      await chargeAiUse(key, context.userId);
      return result;
    });
