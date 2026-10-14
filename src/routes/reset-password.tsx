import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Set a new password — Saha OS" },
      { name: "description", content: "Choose a new password for your Saha OS account." },
    ],
  }),
  component: ResetPasswordPage,
});

/** Opened from the "set a new password" e-mail link; the link signs the person in for this one step. */
function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (
        session &&
        (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN" || event === "INITIAL_SESSION")
      )
        setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("The two passwords do not match.");
      return;
    }
    setBusy(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (err) {
      setError(err.message);
      return;
    }
    navigate({ to: "/", replace: true });
  };

  const field =
    "mt-1 w-full rounded-lg border border-white/15 bg-[#0C1F17] px-3 py-2 text-sm text-white outline-none focus:border-[#22C55E]";

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0C1F17] px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl sm:p-8">
        <h1 className="text-xl font-bold text-white">Set a new password</h1>
        {!ready ? (
          <p className="mt-3 text-sm text-white/70">
            Checking your link… If nothing happens, the link has expired: go to the sign-in page and
            use "Forgot password" again.
          </p>
        ) : (
          <form onSubmit={submit} className="mt-5 space-y-3">
            <label className="block text-sm font-medium text-white/80">
              New password
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={field}
              />
            </label>
            <label className="block text-sm font-medium text-white/80">
              Type it again
              <input
                type="password"
                required
                minLength={8}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className={field}
              />
            </label>
            {error && <p className="text-sm font-medium text-red-400">{error}</p>}
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-lg bg-[#22C55E] px-4 py-2.5 text-sm font-bold text-[#0C1F17] disabled:opacity-60"
            >
              {busy ? "Saving…" : "Save and open Saha OS"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
