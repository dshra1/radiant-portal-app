import { useEffect, useState, type ReactNode } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

/**
 * Client-side gate: every screen except /auth requires a signed-in user,
 * because all project/BOQ/chat data is now restricted to authenticated users.
 */
export function AuthGate({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isPublic = pathname.startsWith("/auth") || pathname.startsWith("/api");
  const [status, setStatus] = useState<"loading" | "in" | "out">("loading");

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (active) setStatus(data.session ? "in" : "out");
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setStatus(session ? "in" : "out");
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (status === "out" && !isPublic) navigate({ to: "/auth", replace: true });
  }, [status, isPublic, navigate]);

  if (isPublic) return <>{children}</>;

  if (status !== "in") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0C1F17] text-sm font-medium text-white/70">
        Checking your session…
      </div>
    );
  }

  return <>{children}</>;
}
