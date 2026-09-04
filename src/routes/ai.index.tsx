import { useEffect } from "react";
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

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: existing } = await supabase
        .from("ai_threads")
        .select("id")
        .order("updated_at", { ascending: false })
        .limit(1);
      if (cancelled) return;
      const found = existing?.[0]?.id;
      if (found) {
        navigate({ to: "/ai/$threadId", params: { threadId: found }, replace: true });
        return;
      }
      const { data: created } = await supabase
        .from("ai_threads")
        .insert({ title: "New conversation" })
        .select("id")
        .single();
      if (!cancelled && created)
        navigate({ to: "/ai/$threadId", params: { threadId: created.id }, replace: true });
    })();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return (
    <Shell title="Saha AI Assistant" subtitle="Opening your conversation…">
      <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
        Loading assistant…
      </div>
    </Shell>
  );
}
