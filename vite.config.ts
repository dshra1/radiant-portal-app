// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// Cloudflare Workers Builds (hosting outside Lovable) sets WORKERS_CI=1. Only then do we
// name the worker and pass the server-side settings; Lovable's own builds are unchanged.
// Secrets (GOOGLE_GENERATIVE_AI_API_KEY) are set in the Cloudflare dashboard, never here.
const cloudflareWorker = process.env["WORKERS_CI"]
  ? {
      nitro: {
        cloudflare: {
          wrangler: {
            name: "radiant-portal-app",
            compatibility_date: "2026-09-01",
            observability: { enabled: true },
            vars: {
              SUPABASE_URL: "https://kimwplrodbviijzaoypl.supabase.co",
              SUPABASE_PUBLISHABLE_KEY: "sb_publishable_PNSCAjWJSk5pqRaY7D0imQ_dYwhuG27",
              SUPABASE_PROJECT_ID: "kimwplrodbviijzaoypl",
            },
            // Branch previews (`wrangler preview`) refuse to run without this block.
            // There is no separate test database, so previews use the live one:
            // anything saved in a preview is saved for real.
            previews: {
              vars: {
                SUPABASE_URL: "https://kimwplrodbviijzaoypl.supabase.co",
                SUPABASE_PUBLISHABLE_KEY: "sb_publishable_PNSCAjWJSk5pqRaY7D0imQ_dYwhuG27",
                SUPABASE_PROJECT_ID: "kimwplrodbviijzaoypl",
              },
            },
          },
        },
      },
    }
  : {};

// The options type lists only a few nitro keys; nitro itself accepts cloudflare.wrangler.
type Options = NonNullable<Parameters<typeof defineConfig>[0]>;

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  ...(cloudflareWorker as unknown as Partial<Options>),
});
