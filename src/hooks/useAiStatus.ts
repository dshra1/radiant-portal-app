import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getAiStatus } from "@/lib/ai-status.functions";

export const AI_OFF_REASON =
  "AI is switched off: the Gemini key (GOOGLE_GENERATIVE_AI_API_KEY) is not set in the Cloudflare worker settings.";

/** True / false once known; undefined while checking (buttons stay usable). */
export function useAiConfigured() {
  const fn = useServerFn(getAiStatus);
  const q = useQuery({
    queryKey: ["ai-status"],
    queryFn: () => fn(),
    staleTime: 10 * 60 * 1000,
    retry: false,
  });
  return q.data?.configured;
}
