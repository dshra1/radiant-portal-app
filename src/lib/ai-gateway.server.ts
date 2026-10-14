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

// "gemini-3.7-flash" is not a model the Gemini API offers, so every AI call failed.
// gemini-3.8-flash is Google's current stable Flash model. Override with GEMINI_MODEL
// in the hosting environment if Google retires it.
export const SAHA_MODEL = process.env["GEMINI_MODEL"] || "gemini-3.8-flash";
