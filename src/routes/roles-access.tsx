import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ShieldCheck, Users, UserCheck, UserPlus, MessagesSquare, ClipboardList } from "lucide-react";
import { Shell } from "@/components/saha/Shell";
import { supabase } from "@/integrations/supabase/client";
import { useAccess, useSessionUser, roleSlugToLabel, type RoleSlug } from "@/lib/access";

export const Route = createFileRoute("/roles-access")({
  head: () => ({
    meta: [
      { title: "Roles & Access Activity | Saha OS" },
      {
        name: "description",
        content:
          "Who has access to this project workspace, the permissions assigned to each member and where to approve or change them.",
      },
      { property: "og:title", content: "Roles & Access Activity | Saha OS" },
      {
        property: "og:description",
        content: "Members, assigned permissions and pending access requests for the project workspace.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

type Member = {
  id: string;
  email: string;
  full_name: string;
  status: string;
  created_at: string;
  roles: RoleSlug[];
};

function Page() {
  const user = useSessionUser();
  const { access } = useAccess();
  const isAdmin = Boolean(access?.isAdmin);

  const { data: members = [], isPending } = useQuery({
    queryKey: ["roles-access", "members"],
    enabled: Boolean(user?.id),
    queryFn: async (): Promise<Member[]> => {
      const [{ data: profiles, error: pErr }, { data: roleRows, error: rErr }] = await Promise.all([
        supabase
          .from("profiles")
          .select("id,email,full_name,status,created_at")
          .order("created_at", { ascending: false }),
        supabase.from("user_roles").select("user_id,role"),
      ]);
      if (pErr) throw pErr;
      if (rErr) throw rErr;
      const byUser = new Map<string, RoleSlug[]>();
      for (const r of roleRows ?? []) {
        const list = byUser.get(r.user_id) ?? [];
        list.push(r.role as RoleSlug);
        byUser.set(r.user_id, list);
      }
      return (profiles ?? []).map((p) => ({
        id: p.id,
        email: p.email ?? "",
        full_name: p.full_name ?? "",
        status: p.status ?? "pending",
        created_at: p.created_at ?? "",
        roles: byUser.get(p.id) ?? [],
      }));
    },
  });

  const stats = useMemo(() => {
    const approved = members.filter((m) => m.status === "approved");
    return {
      total: members.length,
      approved: approved.length,
      pending: members.filter((m) => m.status !== "approved").length,
      unassigned: approved.filter((m) => m.roles.length === 0).length,
    };
  }, [members]);

  const byRole = useMemo(() => {
    const map = new Map<RoleSlug, Member[]>();
    for (const m of members) {
      for (const r of m.roles) {
        map.set(r, [...(map.get(r) ?? []), m]);
      }
    }
    return map;
  }, [members]);

  return (
    <Shell title="Roles & Access">
      <div className="flex flex-col gap-6 pb-16">
        <header className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 shadow-sm md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/80">
              Access & audit trail
            </p>
            <h1 className="text-2xl font-bold text-foreground">Roles &amp; access activity</h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Every member who can sign in to this workspace, the permissions they hold and the
              requests still waiting for approval.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {isAdmin ? (
              <Link
                to="/access-control"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
              >
                <ShieldCheck className="h-4 w-4" /> Manage access
              </Link>
            ) : null}
            <Link
              to="/messages"
              className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-semibold hover:bg-muted"
            >
              <MessagesSquare className="h-4 w-4" /> Team chat
            </Link>
            <Link
              to="/approvals"
              className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-semibold hover:bg-muted"
            >
              <ClipboardList className="h-4 w-4" /> Change approvals
            </Link>
          </div>
        </header>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            { label: "Members", value: stats.total, Icon: Users, note: "All sign-ins on record" },
            { label: "Approved", value: stats.approved, Icon: UserCheck, note: "Can use the workspace" },
            { label: "Awaiting approval", value: stats.pending, Icon: UserPlus, note: "Needs a decision" },
            {
              label: "No permissions yet",
              value: stats.unassigned,
              Icon: ShieldCheck,
              note: "Approved but no role set",
            },
          ].map(({ label, value, Icon, note }) => (
            <Link
              key={label}
              to={isAdmin ? "/access-control" : "/roles-access"}
              className="rounded-2xl border border-border bg-card p-5 shadow-sm transition hover:border-primary hover:bg-muted/50"
            >
              <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <span>{label}</span>
                <Icon className="h-4 w-4 text-primary" />
              </div>
              <p className="mt-3 text-2xl font-bold text-foreground">{value}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">{note}</p>
            </Link>
          ))}
        </div>

        <section className="rounded-2xl border border-border bg-card shadow-sm">
          <div className="border-b border-border p-5">
            <h2 className="text-lg font-bold text-foreground">Members and permissions</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {isAdmin
                ? "Open Manage access to approve a member or change their permissions."
                : "Only an admin can change permissions here."}
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="p-3">Member</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Permissions</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isPending ? (
                  <tr>
                    <td className="p-6 text-center text-muted-foreground" colSpan={5}>
                      Loading members…
                    </td>
                  </tr>
                ) : null}
                {!isPending && members.length === 0 ? (
                  <tr>
                    <td className="p-6 text-center text-muted-foreground" colSpan={5}>
                      No members visible to you yet.
                    </td>
                  </tr>
                ) : null}
                {members.map((m) => (
                  <tr key={m.id} className="hover:bg-muted/40">
                    <td className="p-3 font-semibold">
                      {m.full_name || "—"}
                      {m.id === user?.id ? (
                        <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase text-primary">
                          You
                        </span>
                      ) : null}
                    </td>
                    <td className="p-3 text-muted-foreground">{m.email || "—"}</td>
                    <td className="p-3">
                      {m.roles.length ? (
                        <span className="flex flex-wrap gap-1">
                          {m.roles.map((r) => (
                            <span
                              key={r}
                              className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium"
                            >
                              {roleSlugToLabel[r]}
                            </span>
                          ))}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">None assigned</span>
                      )}
                    </td>
                    <td className="p-3 capitalize">{m.status}</td>
                    <td className="p-3 text-muted-foreground">
                      {m.created_at ? m.created_at.slice(0, 10) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h2 className="text-lg font-bold text-foreground">What each permission can open</h2>
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {(Object.keys(roleSlugToLabel) as RoleSlug[]).map((slug) => (
              <div key={slug} className="rounded-xl border border-border p-4">
                <p className="text-sm font-semibold text-foreground">{roleSlugToLabel[slug]}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {(byRole.get(slug) ?? []).length} member
                  {(byRole.get(slug) ?? []).length === 1 ? "" : "s"}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {(byRole.get(slug) ?? []).map((m) => m.full_name || m.email).join(", ") || "Nobody yet"}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </Shell>
  );
}
