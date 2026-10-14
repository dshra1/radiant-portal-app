import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createClient } from "@supabase/supabase-js";
import { createAiProvider, SAHA_MODEL } from "@/lib/ai-gateway.server";
import type { Database } from "@/integrations/supabase/types";

type ChatRequestBody = { messages?: unknown; threadId?: unknown };

function serverSupabase(accessToken: string) {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient<Database>(process.env["SUPABASE_URL"]!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        h.set("apikey", key);
        h.set("Authorization", `Bearer ${accessToken}`);
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

async function buildLiveContext(accessToken: string) {
  const sb = serverSupabase(accessToken);
  const [projects, notifications, messages] = await Promise.all([
    sb
      .from("site_projects")
      .select(
        "id,name,location,type,health,target_budget,estimate_amount,saleable_sft,contingency_pct,spend,total_built_up_sft,total_slab_sft,single_floor_slab_sft,concrete_grade,steel_grade,start_date,target_handover_date,brand_preferences,landowners",
      )
      .limit(30),
    sb
      .from("notifications")
      .select("title,body,category,created_at")
      .order("created_at", { ascending: false })
      .limit(25),
    sb
      .from("team_messages")
      .select("channel,author_name,author_role,body")
      .order("created_at", { ascending: false })
      .limit(30),
  ]);
  for (const r of [projects, notifications, messages]) {
    if (r.error) console.error("saha ai context read failed:", r.error.message);
  }

  // The PMC report for each project: BOQ by package, programme stages, stock and tenders.
  const reports: string[] = [];
  for (const p of (projects.data ?? []).slice(0, 3)) {
    const [boq, stages, stock, rfqs] = await Promise.all([
      sb
        .from("boq_items")
        .select("package,package_no,item_code,quantity,rate,gst_pct,work_scope")
        .eq("project_id", p.id),
      sb
        .from("site_stages")
        .select(
          "code,name,stage_group,floor,planned_start,planned_end,actual_pct,hold_point,closed_at",
        )
        .eq("project_id", p.id)
        .neq("code", "")
        .order("sort"),
      sb
        .from("stock_items")
        .select("description,unit,reorder_level,order_by")
        .eq("project_id", p.id)
        .limit(400),
      sb.from("rfqs").select("title,status").eq("project_id", p.id).limit(60),
    ]);
    const pk = new Map<string, { excl: number; incl: number; lines: number }>();
    let excl = 0;
    let incl = 0;
    for (const l of boq.data ?? []) {
      if (l.item_code === "CONT") continue;
      const e = Number(l.quantity) * Number(l.rate);
      const i = e * (1 + (l.gst_pct === null ? 18 : Number(l.gst_pct)) / 100);
      excl += e;
      incl += i;
      const k = `${l.package_no} ${l.package || "Other"}`;
      const t = pk.get(k) ?? { excl: 0, incl: 0, lines: 0 };
      t.excl += e;
      t.incl += i;
      t.lines++;
      pk.set(k, t);
    }
    const cont = Number(p.contingency_pct ?? 5) / 100;
    const today = new Date().toISOString().slice(0, 10);
    const st = stages.data ?? [];
    const onNow = st.filter(
      (s) => !s.closed_at && (s.planned_start ?? "") <= today && (s.planned_end ?? "") >= today,
    );
    const next = st.filter((s) => !s.closed_at && (s.planned_start ?? "") > today).slice(0, 8);
    reports.push(
      [
        `PMC REPORT FOR ${p.name} (the report is final and is the reference; use these figures, not rules of thumb):`,
        `BOQ: excl. GST Rs ${Math.round(excl)}, incl. GST Rs ${Math.round(incl)}, + ${Math.round(cont * 100)}% contingency = project cost Rs ${Math.round(incl * (1 + cont))}; budget Rs ${p.target_budget}; saleable ${p.saleable_sft} sft.`,
        `packages = ${JSON.stringify([...pk.entries()].map(([k, v]) => ({ package: k, excl: Math.round(v.excl), incl: Math.round(v.incl), lines: v.lines })))}`,
        `programme: ${st.length} stages, start ${p.start_date}, handover ${p.target_handover_date}. On now: ${JSON.stringify(onNow.map((s) => `${s.code} ${s.name} ${s.actual_pct}%`))}. Next: ${JSON.stringify(next.map((s) => `${s.code} ${s.name} from ${s.planned_start}`))}`,
        `stage_groups = ${JSON.stringify([...new Set(st.map((s) => s.stage_group))])}`,
        `stock (material, unit, order-by) = ${JSON.stringify(
          (stock.data ?? [])
            .filter((x) => x.order_by)
            .slice(0, 120)
            .map((x) => [x.description, x.unit, x.order_by]),
        )}`,
        `tenders = ${JSON.stringify((rfqs.data ?? []).map((r) => `${r.title} (${r.status})`))}`,
      ].join("\n"),
    );
  }

  return [
    "LIVE APP DATA (JSON, read-only snapshot):",
    `projects = ${JSON.stringify(projects.data ?? [])}`,
    ...reports,
    `notifications = ${JSON.stringify(notifications.data ?? [])}`,
    `recent_team_chat = ${JSON.stringify(messages.data ?? [])}`,
  ].join("\n\n");
}

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const accessToken = (request.headers.get("Authorization") ?? "").replace(/^Bearer /i, "");
        if (!accessToken) return new Response("Unauthorized", { status: 401 });
        const authCheck = await fetch(`${process.env["SUPABASE_URL"]}/auth/v1/user`, {
          headers: {
            apikey: process.env["SUPABASE_PUBLISHABLE_KEY"]!,
            Authorization: `Bearer ${accessToken}`,
          },
        });
        if (!authCheck.ok) return new Response("Unauthorized", { status: 401 });
        const authUser = (await authCheck.json()) as { id?: string };
        const profileRes = await fetch(
          `${process.env["SUPABASE_URL"]}/rest/v1/profiles?id=eq.${encodeURIComponent(authUser.id ?? "")}&select=status`,
          {
            headers: {
              apikey: process.env["SUPABASE_PUBLISHABLE_KEY"]!,
              Authorization: `Bearer ${accessToken}`,
            },
          },
        );
        const profileRows = profileRes.ok
          ? ((await profileRes.json()) as { status?: string }[])
          : [];
        if (profileRows[0]?.status !== "approved")
          return new Response("Your account is waiting for approval by an admin", { status: 403 });

        const body = (await request.json()) as ChatRequestBody;
        const messages = body.messages;
        const threadId = typeof body.threadId === "string" ? body.threadId : null;
        if (!Array.isArray(messages)) {
          return new Response("Messages are required", { status: 400 });
        }

        const key = process.env["GOOGLE_GENERATIVE_AI_API_KEY"];
        if (!key) return new Response("AI is not configured", { status: 500 });

        const uiMessages = messages as UIMessage[];
        const context = await buildLiveContext(accessToken);
        const gateway = createAiProvider(key);

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
            const sb = serverSupabase(accessToken);
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
