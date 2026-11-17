import { createFileRoute } from "@tanstack/react-router";

/**
 * SAHA central billing API. Firm apps call it server-to-server with headers
 *   x-saha-firm: <firm code>, x-saha-key: <firm key>
 * Razorpay calls /api/billing/razorpay-webhook directly (signed with the webhook secret).
 */
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

export const Route = createFileRoute("/api/billing/$action")({
  server: {
    handlers: {
      POST: async ({ request, params }) => {
        const c = await import("@/lib/billing/central.server");
        const action = params.action;
        try {
          if (action === "razorpay-webhook") {
            const raw = await request.text();
            const res = await c.handleWebhook(
              raw,
              request.headers.get("x-razorpay-signature") ?? "",
            );
            return json({ ok: true, res });
          }
          const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
          return json(
            await c.dispatch(
              action,
              request.headers.get("x-saha-firm") ?? "",
              request.headers.get("x-saha-key") ?? "",
              body,
            ),
          );
        } catch (e) {
          const m = e instanceof Error ? e.message : String(e);
          const status = /Unknown firm|wrong key|credentials|signature/i.test(m)
            ? 401
            : /Not enough AI credits|paused/i.test(m)
              ? 402
              : /Unknown action/.test(m)
                ? 404
                : 400;
          return json({ error: m }, status);
        }
      },
    },
  },
});
