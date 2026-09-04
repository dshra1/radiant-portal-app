import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Shell } from "@/components/saha/Shell";
import { supabase } from "@/integrations/supabase/client";
import { roleSlugToLabel, roleSlugs, useAccess, type RoleSlug } from "@/lib/access";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/access-control")({
  head: () => ({
    meta: [
      { title: "Access & Permissions · Saha OS" },
      {
        name: "description",
        content:
          "Admin control centre to approve new sign-ins and assign role-based viewing permissions across Saha OS.",
      },
      { property: "og:title", content: "Access & Permissions · Saha OS" },
      {
        property: "og:description",
        content: "Approve members and assign role-based viewing permissions in Saha OS.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AccessControl,
});

type MemberRow = {
  id: string;
  email: string;
  full_name: string;
  status: string;
  created_at: string;
};

function AccessControl() {
  const { access, loading } = useAccess();
  const qc = useQueryClient();

  const members = useQuery({
    queryKey: ["access-members"],
    enabled: !!access?.isAdmin,
    queryFn: async () => {
      const [{ data: profiles, error: pErr }, { data: roleRows, error: rErr }] = await Promise.all([
        supabase
          .from("profiles")
          .select("id,email,full_name,status,created_at")
          .order("created_at", { ascending: true }),
        supabase.from("user_roles").select("user_id,role"),
      ]);
      if (pErr) throw pErr;
      if (rErr) throw rErr;
      const byUser = new Map<string, RoleSlug[]>();
      for (const row of roleRows ?? []) {
        const list = byUser.get(row.user_id) ?? [];
        list.push(row.role as RoleSlug);
        byUser.set(row.user_id, list);
      }
      return ((profiles ?? []) as MemberRow[]).map((m) => ({
        ...m,
        roles: byUser.get(m.id) ?? [],
      }));
    },
  });

  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("profiles")
        .update({
          status,
          approved_by: status === "approved" ? (access?.userId ?? null) : null,
          approved_at: status === "approved" ? new Date().toISOString() : null,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["access-members"] });
    },
  });

  const toggleRole = useMutation({
    mutationFn: async ({ id, role, has }: { id: string; role: RoleSlug; has: boolean }) => {
      if (has) {
        const { error } = await supabase
          .from("user_roles")
          .delete()
          .eq("user_id", id)
          .eq("role", role);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("user_roles")
          .insert({ user_id: id, role, granted_by: access?.userId ?? null });
        if (error) throw error;
      }
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["access-members"] });
      await qc.invalidateQueries({ queryKey: ["access"] });
    },
  });

  if (loading) {
    return (
      <Shell title="Access & Permissions" subtitle="Loading">
        <p className="text-sm text-muted-foreground">Loading members…</p>
      </Shell>
    );
  }

  if (!access?.isAdmin) {
    return (
      <Shell title="Access & Permissions" subtitle="Admin only">
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-base font-bold">Admins only</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Only an Admin / Owner can approve members and assign viewing permissions.
          </p>
        </div>
      </Shell>
    );
  }

  const rows = members.data ?? [];
  const pending = rows.filter((m) => m.status !== "approved");

  return (
    <Shell
      title="Access & Permissions"
      subtitle={`${rows.length} members · ${pending.length} awaiting approval`}
    >
      <div className="space-y-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="label-caps text-primary">How this works</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Anyone who signs in with Google or email lands in <strong>pending</strong> and sees no
            data. Approve them, then tick the roles they may use — the sidebar and every screen are
            limited to those roles. Admin grants full access, including this page.
          </p>
        </div>

        {members.isError && (
          <p className="text-sm font-semibold text-destructive">
            Could not load members: {(members.error as Error).message}
          </p>
        )}

        {rows.length === 0 && !members.isPending && (
          <p className="text-sm text-muted-foreground">No members have signed in yet.</p>
        )}

        <div className="space-y-3">
          {rows.map((m) => {
            const isSelf = m.id === access.userId;
            return (
              <div key={m.id} className="rounded-xl border border-border bg-card p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">{m.full_name || m.email}</p>
                    <p className="truncate text-xs text-muted-foreground">{m.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide",
                        m.status === "approved"
                          ? "bg-primary/15 text-primary"
                          : m.status === "blocked"
                            ? "bg-destructive/15 text-destructive"
                            : "bg-amber-500/15 text-amber-600",
                      )}
                    >
                      {m.status}
                    </span>
                    {m.status !== "approved" ? (
                      <button
                        type="button"
                        onClick={() => setStatus.mutate({ id: m.id, status: "approved" })}
                        className="h-8 rounded-lg bg-primary px-3 text-xs font-bold text-primary-foreground"
                      >
                        Approve
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={isSelf}
                        onClick={() => setStatus.mutate({ id: m.id, status: "blocked" })}
                        className="h-8 rounded-lg border border-border px-3 text-xs font-bold disabled:opacity-40"
                      >
                        Block
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {roleSlugs.map((slug) => {
                    const has = m.roles.includes(slug);
                    const lockSelfAdmin = isSelf && slug === "admin" && has;
                    return (
                      <button
                        key={slug}
                        type="button"
                        disabled={lockSelfAdmin}
                        onClick={() => toggleRole.mutate({ id: m.id, role: slug, has })}
                        className={cn(
                          "rounded-lg border px-3 py-1.5 text-xs font-semibold transition",
                          has
                            ? "border-primary bg-primary/15 text-primary"
                            : "border-border text-muted-foreground hover:border-primary/50",
                          lockSelfAdmin && "opacity-60",
                        )}
                      >
                        {roleSlugToLabel[slug]}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Shell>
  );
}
