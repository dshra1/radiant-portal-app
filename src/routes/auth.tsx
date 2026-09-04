import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import sahaLogo from "@/assets/saha-logo.jpeg.asset.json";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Sign in — Saha OS" },
      {
        name: "description",
        content:
          "Sign in to Saha OS to access projects, BOQ, site execution, QA/QC and procurement data.",
      },
      { property: "og:title", content: "Sign in — Saha OS" },
      {
        property: "og:description",
        content: "Secure access to your Saha OS civil project workspace.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/", replace: true });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && (event === "SIGNED_IN" || event === "INITIAL_SESSION")) {
        navigate({ to: "/", replace: true });
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      if (mode === "signup") {
        const { data, error: err } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (err) throw err;
        if (!data.session) {
          setMessage("Check your email to confirm your account, then sign in.");
        }
      } else {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Authentication failed.");
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    setError(null);
    try {
      await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
        extraParams: { prompt: "select_account" },
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Google sign-in failed.");
    }
  };


  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0C1F17] px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl backdrop-blur sm:p-8">
        <div className="flex items-center gap-3">
          <img
            src={sahaLogo.url}
            alt="Saha Developers"
            className="h-11 w-11 rounded-lg bg-white object-contain p-1"
          />
          <div>
            <h1 className="text-lg font-extrabold uppercase tracking-wide text-white">Saha OS</h1>
            <p className="text-xs font-medium text-white/60">Enterprise civil suite</p>
          </div>
        </div>

        <h2 className="mt-6 text-xl font-bold text-white">
          {mode === "signin" ? "Sign in to your workspace" : "Create your workspace account"}
        </h2>
        <p className="mt-1 text-sm text-white/60">
          Project, BOQ, chat and financial data is available to signed-in users only.
        </p>

        <button
          type="button"
          onClick={google}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-[#0C1F17] transition hover:bg-white/90"
        >
          Continue with Google
        </button>

        <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-wider text-white/40">
          <span className="h-px flex-1 bg-white/15" /> or email <span className="h-px flex-1 bg-white/15" />
        </div>

        <form onSubmit={submit} className="space-y-3">
          <label className="block text-sm font-medium text-white/80">
            Email
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-white/15 bg-[#0C1F17] px-3 py-2 text-sm text-white outline-none focus:border-[#22C55E]"
              placeholder="you@company.com"
            />
          </label>
          <label className="block text-sm font-medium text-white/80">
            Password
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-white/15 bg-[#0C1F17] px-3 py-2 text-sm text-white outline-none focus:border-[#22C55E]"
              placeholder="••••••••"
            />
          </label>
          {error && <p className="text-sm font-medium text-red-400">{error}</p>}
          {message && <p className="text-sm font-medium text-[#22C55E]">{message}</p>}
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-lg bg-[#22C55E] px-4 py-2.5 text-sm font-bold text-[#0C1F17] transition hover:bg-[#22C55E]/90 disabled:opacity-60"
          >
            {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => {
            setMode(mode === "signin" ? "signup" : "signin");
            setError(null);
            setMessage(null);
          }}
          className="mt-4 w-full text-sm font-medium text-white/70 underline-offset-4 hover:underline"
        >
          {mode === "signin"
            ? "New here? Create an account"
            : "Already have an account? Sign in"}
        </button>
      </div>
    </main>
  );
}
