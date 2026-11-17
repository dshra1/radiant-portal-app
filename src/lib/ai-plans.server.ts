import type { SupabaseClient } from "@supabase/supabase-js";
import { AI_FEATURES, PLAN_FILE, isOn, type AiFeatureKey, type Plan } from "@/lib/ai-plans";

const offMessage = (key: AiFeatureKey) => {
  const name = AI_FEATURES.find((f) => f.key === key)?.name ?? key;
  return `${name} is not in your firm's plan. An admin can switch it on in AI Features & Plans.`;
};

/** Throws if the firm's plan has switched this AI feature off. */
export async function assertAiFeature(supabase: SupabaseClient, key: AiFeatureKey) {
  const dl = await supabase.storage.from("site-media").download(PLAN_FILE);
  if (!dl.data) return; // no plan saved yet: everything on
  let plan: Plan | null = null;
  try {
    plan = JSON.parse(await dl.data.text()) as Plan;
  } catch {
    return;
  }
  if (!isOn(plan, key)) throw new Error(offMessage(key));
}

/** Same check for routes that only hold the user's access token. Returns an error message or null. */
export async function aiFeatureOffWithToken(accessToken: string, key: AiFeatureKey) {
  const res = await fetch(
    `${process.env["SUPABASE_URL"]}/storage/v1/object/authenticated/site-media/${PLAN_FILE}`,
    {
      headers: {
        apikey: process.env["SUPABASE_PUBLISHABLE_KEY"]!,
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );
  if (!res.ok) return null;
  try {
    const plan = (await res.json()) as Plan;
    return isOn(plan, key) ? null : offMessage(key);
  } catch {
    return null;
  }
}
