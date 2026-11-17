import { createMiddleware } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { AiFeatureKey } from "@/lib/ai-plans";

/**
 * Middleware for every AI server function: signed-in approved user, feature in the firm's
 * plan, credits reserved with SAHA's central billing before the run; kept if the run succeeds,
 * refunded if it fails.
 */
export const aiUse = (key: AiFeatureKey) =>
  createMiddleware({ type: "function" })
    .middleware([requireSupabaseAuth])
    .server(async ({ next, context }) => {
      const { assertAiFeature } = await import("@/lib/ai-plans.server");
      const { reserveAi, settleAi, releaseAi } = await import("@/lib/ai-credits.server");
      await assertAiFeature(context.supabase as never, key);
      const reservation = await reserveAi(key, context.userId);
      try {
        const result = await next();
        await settleAi(reservation);
        return result;
      } catch (e) {
        await releaseAi(reservation);
        throw e;
      }
    });
