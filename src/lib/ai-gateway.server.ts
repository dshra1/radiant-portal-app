import { createGoogleGenerativeAI } from "@ai-sdk/google";

/**
 * Direct Google Gemini provider — replaces Lovable's metered AI gateway.
 * Get a free/pay-as-you-go key at https://aistudio.google.com/apikey and set
 * GOOGLE_GENERATIVE_AI_API_KEY in your deployment environment.
 */
export function createAiProvider(apiKey: string) {
  return createGoogleGenerativeAI({
    apiKey,
  });
}

// Same model the app was already using via the gateway — no behavior change.
export const SAHA_MODEL = "gemini-3.7-flash";
