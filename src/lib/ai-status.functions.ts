import { createServerFn } from "@tanstack/react-start";

/**
 * Whether the Gemini key is set on the server. Pages use it to explain why the AI
 * buttons are off instead of failing on click.
 */
export const getAiStatus = createServerFn({ method: "GET" }).handler(async () => {
  return { configured: Boolean(process.env["GOOGLE_GENERATIVE_AI_API_KEY"]) };
});
