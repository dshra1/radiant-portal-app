import { createFileRoute } from "@tanstack/react-router";
import { generateText, stepCountIs, tool } from "ai";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { aiFeatureOffWithToken } from "@/lib/ai-plans.server";
import { createAiProvider, SAHA_MODEL } from "@/lib/ai-gateway.server";
import * as D from "@/lib/ask-data.server";
import * as X from "@/lib/ask-actions.server";

/**
 * "Ask" assistant: quick questions (tap a chip) are answered straight from the database, no AI and no credits.
 * Typed questions go to the AI, which can only answer through the same read-only lookups.
 */
type Intent = {
  kind: "stock" | "low" | "stage" | "upcoming" | "now" | "boq" | "pos" | "verify";
  q?: string;
  days?: number;
};
type Body = {
  projectId?: string;
  intent?: Intent;
  question?: string;
  confirm?: X.AskAction;
  history?: { role: "user" | "assistant"; text: string }[];
};

function userSupabase(accessToken: string) {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient(process.env["SUPABASE_URL"]!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { apikey: key, Authorization: `Bearer ${accessToken}` } },
  });
}

async function runIntent(sb: ReturnType<typeof userSupabase>, pid: string, it: Intent) {
  switch (it.kind) {
    case "stock":
      return D.stockLookup(sb, pid, it.q ?? "");
    case "low":
      return D.lowStock(sb, pid);
    case "stage":
      return D.stageNeeds(sb, pid, it.q ?? "");
    case "upcoming":
      return D.upcomingNeeds(sb, pid, it.days ?? 14);
    case "now":
      return D.siteNow(sb, pid);
    case "boq":
      return D.boqLookup(sb, pid, it.q ?? "");
    case "pos":
      return D.pendingPOs(sb, pid);
    case "verify":
      return X.verify(sb, pid, it.days ?? 7);
  }
}

const json = (o: unknown, status = 200) =>
  new Response(JSON.stringify(o), { status, headers: { "content-type": "application/json" } });

export const Route = createFileRoute("/api/ask")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const token = (request.headers.get("Authorization") ?? "").replace(/^Bearer /i, "");
        if (!token) return json({ error: "Please sign in" }, 401);
        const who = await fetch(`${process.env["SUPABASE_URL"]}/auth/v1/user`, {
          headers: {
            apikey: process.env["SUPABASE_PUBLISHABLE_KEY"]!,
            Authorization: `Bearer ${token}`,
          },
        });
        if (!who.ok) return json({ error: "Please sign in" }, 401);
        const user = (await who.json()) as { id?: string };
        const sb = userSupabase(token);
        const prof = await sb
          .from("profiles")
          .select("status,full_name,email")
          .eq("id", user.id ?? "")
          .maybeSingle();
        const me = (prof.data ?? {}) as { status?: string; full_name?: string; email?: string };
        if (me.status !== "approved")
          return json({ error: "Your account is waiting for approval by an admin" }, 403);

        const body = (await request.json()) as Body;
        const projects = await D.projectsOf(sb);
        const project = projects.find((p) => p.id === body.projectId) ?? projects[0];
        if (!project) return json({ error: "No project yet. Add one in Project Details." }, 400);

        if (body.confirm) {
          try {
            const msg = await X.commit(sb, project.id, body.confirm, {
              id: user.id ?? "",
              name: me.full_name || me.email || "",
            });
            return json({ text: msg, tables: [], project: project.name, saved: true });
          } catch (e) {
            return json({ error: `Not saved: ${(e as Error).message}` }, 400);
          }
        }

        if (body.intent) {
          const table = await runIntent(sb, project.id, body.intent);
          return json({ text: "", tables: table ? [table] : [], project: project.name, ai: false });
        }

        const question = String(body.question ?? "")
          .trim()
          .slice(0, 800);
        if (!question) return json({ error: "Type a question" }, 400);
        const key = process.env["GOOGLE_GENERATIVE_AI_API_KEY"];
        if (!key)
          return json({ error: "AI is not configured. Use the quick questions above." }, 500);
        const off = await aiFeatureOffWithToken(token, "assistant");
        if (off) return json({ error: off }, 403);
        const credits = await import("@/lib/ai-credits.server");
        let reservation: string | null = null;
        try {
          reservation = await credits.reserveAi("assistant", user.id ?? "");
        } catch (e) {
          return json({ error: (e as Error).message }, 402);
        }

        const tables: D.AskTable[] = [];
        const proposals: X.Proposal[] = [];
        const offer = async (a: X.AskAction) => {
          const p = await X.propose(sb, pid, a);
          proposals.push(p);
          return {
            shown_to_user_for_confirmation: true,
            title: p.title,
            lines: p.lines,
            warnings: p.warnings,
            blocked: p.blocked ?? null,
          };
        };
        const keep = (t: D.AskTable) => {
          tables.push(t);
          return { title: t.title, columns: t.columns, rows: t.rows.slice(0, 40), note: t.note };
        };
        const pid = project.id;
        try {
          const google = createAiProvider(key);
          const history = (body.history ?? [])
            .slice(-8)
            .map((h) => ({ role: h.role, content: String(h.text).slice(0, 1500) }));
          const res = await generateText({
            model: google(SAHA_MODEL),
            stopWhen: stepCountIs(6),
            system: [
              `You are Ask, the assistant inside the SiteYantra Construction app: it answers from the live records, records entries the user confirms, and checks what supervisors and accounts entered. The user works on the project "${project.name}" (${project.location}).`,
              "Answer ONLY from the tools. They read the live app: stock register, programme stages with their material ledger, BOQ, purchase orders, material requests, party balances (bills and payments) and machines. Never guess a quantity, rate or date. If a tool returns nothing, say so and suggest what to check.",
              "The tool results are shown to the user as tables under your answer, so do not repeat every row: give the answer in 1 to 3 short sentences (the key number first), then mention anything short or late.",
              "ENTRIES: when the user reports something to record (material received or issued, stage progress, labour on site), call the matching record_* tool. It does NOT save: the user sees a card and must tap Confirm. Tell them to check the card and confirm; mention any warnings plainly. Never claim it is saved.",
              "CHECKING: you are also the confirming party for what site supervisors and accounts enter. When asked whether something is right, or to check entries, use check_entries and the lookups and say clearly what matches and what doesn't.",
              "Use Indian number formats. Reply in the user's language (English, Hindi or Telugu).",
            ].join("\n"),
            messages: [...history, { role: "user" as const, content: question }],
            tools: {
              stock: tool({
                description:
                  "Current stock balance of a material in this project's stock register (opening + receipts − issues). Empty query lists all.",
                inputSchema: z.object({
                  material: z.string().describe("Material name, e.g. cement, 12 mm steel, M-sand"),
                }),
                execute: async ({ material }) => keep(await D.stockLookup(sb, pid, material)),
              }),
              low_stock: tool({
                description: "Materials at or below their reorder level that are already due.",
                inputSchema: z.object({}),
                execute: async () => keep(await D.lowStock(sb, pid)),
              }),
              stage_materials: tool({
                description:
                  "Material needed for a programme stage or activity (by stage code or part of its name, e.g. '3rd floor slab', 'plastering'), compared with stock on hand.",
                inputSchema: z.object({ stage: z.string() }),
                execute: async ({ stage }) => keep(await D.stageNeeds(sb, pid, stage)),
              }),
              upcoming_materials: tool({
                description:
                  "Total material needed for all stages planned in the next N days, compared with stock on hand.",
                inputSchema: z.object({ days: z.number().int().min(1).max(120) }),
                execute: async ({ days }) => keep(await D.upcomingNeeds(sb, pid, days)),
              }),
              site_now: tool({
                description: "Stages on now and stages past their planned finish.",
                inputSchema: z.object({}),
                execute: async () => keep(await D.siteNow(sb, pid)),
              }),
              boq: tool({
                description: "BOQ quantity, rate and amount for an item.",
                inputSchema: z.object({ item: z.string() }),
                execute: async ({ item }) => keep(await D.boqLookup(sb, pid, item)),
              }),
              record_stock: tool({
                description:
                  "Propose a stock receipt or issue for the user to confirm (not saved until they tap Confirm).",
                inputSchema: z.object({
                  movement: z.enum(["receipt", "issue"]),
                  material: z.string(),
                  quantity: z.number(),
                  date: z.string().optional().describe("YYYY-MM-DD; default today"),
                  po_number: z.string().optional(),
                  party: z
                    .string()
                    .optional()
                    .describe("supplier for a receipt, contractor/team for an issue"),
                  stage: z
                    .string()
                    .optional()
                    .describe("stage code or name the material is issued to"),
                  remarks: z.string().optional(),
                }),
                execute: async (a) => offer({ type: "stock", ...a } as X.StockAction),
              }),
              record_stage_progress: tool({
                description:
                  "Propose a stage progress update (percent complete) for the user to confirm.",
                inputSchema: z.object({ stage: z.string(), percent: z.number().min(0).max(100) }),
                execute: async (a) => offer({ type: "stage", ...a }),
              }),
              record_labour: tool({
                description: "Propose a day's labour entry for the user to confirm.",
                inputSchema: z.object({
                  date: z.string().optional(),
                  contractor: z.string(),
                  trade: z.string(),
                  headcount: z.number(),
                  work_done: z.string().optional(),
                  area: z.string().optional(),
                }),
                execute: async (a) => offer({ type: "labour", ...a } as X.LabourAction),
              }),
              check_entries: tool({
                description:
                  "Check what supervisors and accounts entered recently (stock register, stages, bills) for things that don't add up.",
                inputSchema: z.object({ days: z.number().int().min(1).max(60).default(7) }),
                execute: async ({ days }) => keep(await X.verify(sb, pid, days)),
              }),
              project_overview: tool({
                description:
                  "Project details, budget and recent alerts, for general questions about the project.",
                inputSchema: z.object({}),
                execute: async () => {
                  const [p, notes] = await Promise.all([
                    sb
                      .from("site_projects")
                      .select(
                        "name,location,type,health,target_budget,estimate_amount,saleable_sft,spend,start_date,target_handover_date",
                      )
                      .eq("id", pid)
                      .maybeSingle(),
                    sb
                      .from("notifications")
                      .select("title,body,created_at")
                      .order("created_at", { ascending: false })
                      .limit(15),
                  ]);
                  return { project: p.data, recent_alerts: notes.data ?? [] };
                },
              }),
              purchase_orders: tool({
                description: "Purchase orders awaiting approval or delivery.",
                inputSchema: z.object({}),
                execute: async () => keep(await D.pendingPOs(sb, pid)),
              }),
              material_requests: tool({
                description:
                  "Material requests from site still waiting for Purchase to choose the vendor.",
                inputSchema: z.object({}),
                execute: async () => keep(await D.openRequests(sb, pid)),
              }),
              party_balance: tool({
                description:
                  "What the project owes a vendor, subcontractor or hire party (billed, paid, retention, to pay). Empty party lists the top balances.",
                inputSchema: z.object({
                  party: z.string().describe("Party name or part of it; empty for all"),
                }),
                execute: async ({ party }) => keep(await D.partyBalance(sb, pid, party)),
              }),
              machines: tool({
                description: "Machines on site with hours and diesel today and this month.",
                inputSchema: z.object({}),
                execute: async () => keep(await D.machinesToday(sb, pid)),
              }),
            },
          });
          await credits.settleAi(reservation);
          return json({ text: res.text, tables, proposals, project: project.name, ai: true });
        } catch (e) {
          await credits.releaseAi(reservation);
          return json(
            { error: `Couldn't answer just now: ${(e as Error).message.slice(0, 160)}`, tables },
            502,
          );
        }
      },
    },
  },
});
