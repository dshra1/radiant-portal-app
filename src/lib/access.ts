import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Role } from "@/components/saha/nav";

/** Database role slugs mapped to the labels used across the UI. */
export const roleSlugToLabel = {
  admin: "Admin / Owner",
  pm: "Project Manager (PM)",
  site_engineer: "Site Engineer",
  site_supervisor: "Site Supervisor",
  purchase_stores: "Purchase / Stores",
  accounts: "Accounts",
  landowner_investor: "Landowner / Investor",
} as const satisfies Record<string, Role>;

export type RoleSlug = keyof typeof roleSlugToLabel;

export const roleSlugs = Object.keys(roleSlugToLabel) as RoleSlug[];

export const labelToRoleSlug = Object.fromEntries(
  roleSlugs.map((slug) => [roleSlugToLabel[slug], slug]),
) as Record<Role, RoleSlug>;

export type AccessProfile = {
  id: string;
  email: string;
  full_name: string;
  status: string;
  requested_note: string;
  created_at: string;
};

export type Access = {
  userId: string | null;
  email: string;
  profile: AccessProfile | null;
  roles: RoleSlug[];
  isAdmin: boolean;
  isApproved: boolean;
  labels: Role[];
};

export function useSessionUser() {
  const [user, setUser] = useState<{ id: string; email: string } | null | undefined>(undefined);
  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      const u = data.session?.user;
      setUser(u ? { id: u.id, email: u.email ?? "" } : null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      const u = session?.user;
      setUser(u ? { id: u.id, email: u.email ?? "" } : null);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);
  return user;
}

/** Loads the signed-in member's approval status and assigned permissions. */
export function useAccess() {
  const user = useSessionUser();
  const query = useQuery({
    queryKey: ["access", user?.id ?? "anon"],
    enabled: !!user?.id,
    queryFn: async (): Promise<Access> => {
      const [{ data: profile, error: pErr }, { data: roleRows, error: rErr }] = await Promise.all([
        supabase
          .from("profiles")
          .select("id,email,full_name,status,requested_note,created_at")
          .eq("id", user!.id)
          .maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", user!.id),
      ]);
      if (pErr) throw pErr;
      if (rErr) throw rErr;
      const roles = (roleRows ?? []).map((r) => r.role as RoleSlug);
      return {
        userId: user!.id,
        email: user!.email,
        profile: (profile as AccessProfile | null) ?? null,
        roles,
        isAdmin: roles.includes("admin"),
        isApproved: profile?.status === "approved",
        labels: roles.map((r) => roleSlugToLabel[r]),
      };
    },
  });

  return {
    loading: user === undefined || (!!user && query.isPending),
    signedIn: !!user,
    access: query.data ?? null,
    error: query.error,
    refetch: query.refetch,
  };
}
