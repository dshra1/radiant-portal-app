import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Shell } from "@/components/saha/Shell";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/ai/")({
  head: () => ({
    meta: [
      { title: "Saha AI Assistant — Saha OS" },
      {
        name: "description",
        content:
          "Ask the Saha AI Assistant about live projects, budgets, site alerts and team activity across Saha OS.",
      },
      { property: "og:title", content: "Saha AI Assistant — Saha OS" },
      {
        property: "og:description",
        content: "AI assistant grounded in your live Saha OS project data.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AiIndex,
});

function AiIndex() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    (async () => {
      try {
        const { data: existing, error: listErr } = await supabase
          .from("ai_threads")
          .select("id")
          .order("updated_at", { ascending: false })
          .limit(1);
        if (listErr) throw listErr;
        if (cancelled) return;
        const found = existing?.[0]?.id;
        if (found) {
          void navigate({ to: "/ai/$threadId", params: { threadId: found }, replace: true });
          return;
        }
        const { data: created, error: createErr } = await supabase
          .from("ai_threads")
          .insert({ title: "New conversation" })
          .select("id")
          .single();
        if (createErr) throw createErr;
        if (!cancelled && created)
          void navigate({ to: "/ai/$threadId", params: { threadId: created.id }, replace: true });
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [navigate, attempt]);

  return (
    <Shell
      title="Saha AI Assistant"
      subtitle={error ? "Could not open a conversation" : "Opening your conversation…"}
    >
      {error ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-6 text-sm text-destructive">
          <p>Could not open the assistant: {error}</p>
          <button
            type="button"
            onClick={() => setAttempt((n) => n + 1)}
            className="mt-3 rounded-md border border-border bg-card px-3 py-1.5 font-semibold text-foreground hover:bg-secondary"
          >
            Retry
          </button>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
          Loading assistant…
        </div>
      )}
    </Shell>
  );
}
