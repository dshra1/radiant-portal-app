/**
 * Landowners' presentation behind the login.
 *
 * The three pages (all owners, 77:76 only, 78:93 only) are bundled into the
 * Worker instead of public/, so they are never served to anyone who is not
 * signed in. GET /owner-presentation with the user's Supabase access token:
 *  - PMC (admin / manager): the full page, every owner selectable;
 *  - an approved landowner: only their project's page, locked to their own name;
 *  - anyone else: 403.
 * Drawings and images stay in public/landowner-presentation/files.
 */
import allHtml from "../presentation/all.html?raw";
import a7776Html from "../presentation/7776.html?raw";
import b7893Html from "../presentation/7893.html?raw";

export const PRESENTATION_PATH = "/owner-presentation";

/** Owner ids used inside the page, by project. */
const OWNERS_A = ["geeta", "vijay", "shivanand", "ramana"];
const OWNERS_B = ["krishna", "srinath", "srihari"];

function ownerId(name: string): { id: string; page: "a" | "b" } | null {
  const first = name.toLowerCase().trim().split(/\s+/)[0] ?? "";
  if (OWNERS_A.includes(first)) return { id: first, page: "a" };
  if (OWNERS_B.includes(first)) return { id: first, page: "b" };
  return null;
}

function json(status: number, message: string): Response {
  return new Response(JSON.stringify({ message }), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
}

function prepare(html: string, origin: string, owner: string | null, lock: boolean): string {
  // The page reads ?owner= and &lock=1 from its own URL; it is shown from srcdoc / a blob,
  // so the choice is written into the page here, on the server.
  const q = owner ? `?owner=${encodeURIComponent(owner)}${lock ? "&lock=1" : ""}` : "";
  return html
    .replaceAll("new URLSearchParams(location.search)", `new URLSearchParams(${JSON.stringify(q)})`)
    .replace(/<head([^>]*)>/i, `<head$1><base href="${origin}/landowner-presentation/">`);
}

export async function servePresentation(
  request: Request,
  upstream: string,
  apiKey: string,
): Promise<Response> {
  if (request.method !== "GET") return json(405, "GET only");
  const auth = request.headers.get("authorization") ?? "";
  if (!/^Bearer\s+\S+/i.test(auth)) return json(401, "Sign in first");
  if (!apiKey) return json(500, "Server key missing");

  const headers = { apikey: apiKey, authorization: auth };
  const userRes = await fetch(`${upstream}/auth/v1/user`, { headers });
  if (!userRes.ok) return json(401, "Session expired: sign in again");
  const user = (await userRes.json()) as { id?: string };
  if (!user.id) return json(401, "Sign in first");

  const rpc = async (fn: string, body: Record<string, string>): Promise<unknown> => {
    const r = await fetch(`${upstream}/rest/v1/rpc/${fn}`, {
      method: "POST",
      headers: { ...headers, "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    return r.ok ? r.json() : null;
  };
  const [approved, manager, name] = await Promise.all([
    rpc("is_approved", { _user_id: user.id }),
    rpc("is_manager", { _uid: user.id }),
    rpc("owner_name_of", { _uid: user.id }),
  ]);
  if (approved !== true) return json(403, "Your login is waiting for the admin's approval");

  const origin = new URL(request.url).origin;
  const asked = new URL(request.url).searchParams.get("owner") ?? "";
  let html: string;
  if (manager === true) {
    html = prepare(allHtml, origin, asked || null, false);
  } else {
    const o = ownerId(typeof name === "string" ? name : "");
    if (!o) return json(403, "Your login is not linked to a landowner yet");
    html = prepare(o.page === "a" ? a7776Html : b7893Html, origin, o.id, true);
  }
  return new Response(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "private, no-store",
      "x-robots-tag": "noindex",
    },
  });
}
