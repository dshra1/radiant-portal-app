import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isH3SwallowedErrorBody(body)) return response;

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as { unhandled?: unknown; message?: unknown };
    return payload.unhandled === true && payload.message === "HTTPError";
  } catch {
    return false;
  }
}

/**
 * Supabase relay at /sb/* on the app's own domain. Indian ISPs (Jio and others)
 * block *.supabase.co since Feb 2026, so phones on those networks got "Failed to
 * fetch" at sign-in. The browser talks to /sb/…; this Worker forwards to Supabase
 * (Cloudflare reaches it fine). Auth, database, storage and signed file URLs all
 * pass through unchanged.
 */
const SB_PREFIX = "/sb/";
const SB_DEFAULT = "https://kimwplrodbviijzaoypl.supabase.co";

function supabaseUpstream(env: unknown): string {
  const fromEnv =
    (env as { SUPABASE_URL?: string } | undefined)?.SUPABASE_URL ??
    (typeof process !== "undefined" ? process.env?.["SUPABASE_URL"] : undefined);
  return (fromEnv || SB_DEFAULT).replace(/\/+$/, "");
}

async function relayToSupabase(request: Request, env: unknown): Promise<Response> {
  const url = new URL(request.url);
  const target = supabaseUpstream(env) + url.pathname.slice(SB_PREFIX.length - 1) + url.search;
  const headers = new Headers(request.headers);
  headers.delete("host");
  headers.delete("cookie");
  const init: RequestInit & { duplex?: string } = {
    method: request.method,
    headers,
    redirect: "manual",
  };
  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = request.body;
    init.duplex = "half";
  }
  const upstream = await fetch(target, init);
  const out = new Headers(upstream.headers);
  out.delete("content-encoding");
  out.delete("content-length");
  out.set("x-sb-relay", "1");
  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: out,
  });
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    if (new URL(request.url).pathname.startsWith(SB_PREFIX)) {
      try {
        return await relayToSupabase(request, env);
      } catch (error) {
        console.error("supabase relay failed", error);
        return new Response(JSON.stringify({ message: "Supabase relay failed" }), {
          status: 502,
          headers: { "content-type": "application/json", "x-sb-relay": "1" },
        });
      }
    }
    try {
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};
