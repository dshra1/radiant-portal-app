import { useEffect, type ReactNode } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAccess } from "@/lib/access";

function Screen({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0C1F17] px-6 py-12">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-8 text-center shadow-xl">
        {children}
      </div>
    </div>
  );
}

/**
 * Client-side gate. Every screen except /auth needs a signed-in user AND an
 * approved membership: a new Google/email sign-in starts as "pending" and sees
 * nothing until an admin approves them and assigns viewing permissions.
 */
export function AuthGate({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isPublic = pathname.startsWith("/auth") || pathname.startsWith("/api");
  const { loading, signedIn, access, refetch } = useAccess();

  useEffect(() => {
    if (!loading && !signedIn && !isPublic) navigate({ to: "/auth", replace: true });
  }, [loading, signedIn, isPublic, navigate]);

  if (isPublic) return <>{children}</>;

  if (loading || !signedIn) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0C1F17] text-sm font-medium text-white/70">
        Checking your access…
      </div>
    );
  }

  const status = access?.profile?.status ?? "pending";

  if (status === "blocked") {
    return (
      <Screen>
        <h1 className="text-lg font-bold text-white">Access revoked</h1>
        <p className="mt-3 text-sm text-white/70">
          Your workspace access has been withdrawn by an administrator. Contact the project
          admin if you believe this is a mistake.
        </p>
        <SignOut />
      </Screen>
    );
  }

  if (!access?.isApproved) {
    return (
      <Screen>
        <p className="label-caps text-emerald-300">Awaiting approval</p>
        <h1 className="mt-2 text-lg font-bold text-white">Permission required</h1>
        <p className="mt-3 text-sm text-white/70">
          You are signed in as <span className="font-semibold text-white">{access?.email}</span>.
          An admin or project manager must approve your account and assign the screens you may
          view before the workspace opens.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => refetch()}
            className="h-10 rounded-lg bg-emerald-500 text-sm font-bold text-emerald-950"
          >
            Check again
          </button>
          <SignOut />
        </div>
      </Screen>
    );
  }

  if (access.roles.length === 0) {
    return (
      <Screen>
        <p className="label-caps text-amber-300">No permissions yet</p>
        <h1 className="mt-2 text-lg font-bold text-white">Approved, awaiting a role</h1>
        <p className="mt-3 text-sm text-white/70">
          Your account is approved but no viewing permissions have been assigned yet. The admin
          decides which sections you can open.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => refetch()}
            className="h-10 rounded-lg bg-emerald-500 text-sm font-bold text-emerald-950"
          >
            Check again
          </button>
          <SignOut />
        </div>
      </Screen>
    );
  }

  return <>{children}</>;
}

function SignOut() {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      onClick={async () => {
        await supabase.auth.signOut();
        navigate({ to: "/auth", replace: true });
      }}
      className="h-10 rounded-lg border border-white/20 text-sm font-semibold text-white/80"
    >
      Sign out
    </button>
  );
}
