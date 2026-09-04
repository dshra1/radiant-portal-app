import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createClient } from "@supabase/supabase-js";
import { createLovableAiGatewayProvider, SAHA_MODEL } from "@/lib/ai-gateway.server";
import type { Database } from "@/integrations/supabase/types";

type ChatRequestBody = { messages?: unknown; threadId?: unknown };

function serverSupabase() {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient<Database>(process.env["SUPABASE_URL"]!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`)
          h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

function textOf(message: UIMessage) {
  return message.parts
    .map((p) => (p.type === "text" ? p.text : ""))
    .join("")
    .trim();
}

async function buildLiveContext() {
  const sb = serverSupabase();
  const [projects, notifications, messages] = await Promise.all([
    sb.from("site_projects").select("name,location,health,budget,spent,phases").limit(30),
    sb.from("notifications").select("title,body,severity,is_read,created_at").limit(25),
    sb.from("team_messages").select("channel,author_name,author_role,body").limit(30),
  ]);

  return [
    "LIVE APP DATA (JSON, read-only snapshot):",
    `projects = ${JSON.stringify(projects.data ?? [])}`,
    `notifications = ${JSON.stringify(notifications.data ?? [])}`,
    `recent_team_chat = ${JSON.stringify(messages.data ?? [])}`,
  ].join("\n\n");
}

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json()) as ChatRequestBody;
        const messages = body.messages;
        const threadId = typeof body.threadId === "string" ? body.threadId : null;
        if (!Array.isArray(messages)) {
          return new Response("Messages are required", { status: 400 });
        }

        const key = process.env["LOVABLE_API_KEY"];
        if (!key) return new Response("AI is not configured", { status: 500 });

        const uiMessages = messages as UIMessage[];
        const context = await buildLiveContext();
        const gateway = createLovableAiGatewayProvider(key);

        const result = streamText({
          model: gateway(SAHA_MODEL),
          system: [
            "You are Saha AI Assistant, the in-app assistant for Saha OS, an enterprise civil construction management suite used by Saha Developers (Hyderabad, India).",
            "You help site engineers, project managers, purchase/stores, accounts and owners with projects, BOQ, pour cards, QA, procurement, vendors, billing and site progress.",
            "Answer using the live app data below whenever the question relates to projects, budgets, alerts or team chat. If the data does not contain the answer, say so plainly instead of inventing numbers.",
            "Use Indian number formatting (₹, lakh/crore) for money. Be concise, use short markdown sections and bullets.",
            context,
          ].join("\n\n"),
          messages: await convertToModelMessages(uiMessages),
          onFinish: async ({ text }) => {
            if (!threadId) return;
            const sb = serverSupabase();
            const last = uiMessages[uiMessages.length - 1];
            const rows: { thread_id: string; role: string; content: string }[] = [];
            if (last && last.role === "user")
              rows.push({ thread_id: threadId, role: "user", content: textOf(last) });
            if (text.trim())
              rows.push({ thread_id: threadId, role: "assistant", content: text.trim() });
            if (rows.length) {
              const { error } = await sb.from("ai_messages").insert(rows);
              if (error) console.error("ai_messages insert failed", error.message);
            }
            const title = rows[0]?.content?.slice(0, 60);
            await sb
              .from("ai_threads")
              .update({ updated_at: new Date().toISOString(), ...(title ? { title } : {}) })
              .eq("id", threadId)
              .eq("title", "New conversation");
            await sb
              .from("ai_threads")
              .update({ updated_at: new Date().toISOString() })
              .eq("id", threadId);
          },
        });

        return result.toUIMessageStreamResponse({ originalMessages: uiMessages });
      },
    },
  },
});
