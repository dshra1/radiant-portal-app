import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type ActiveProject = {
  id: string;
  name: string;
  location: string;
  type: string;
  health: string;
};

const FALLBACK: ActiveProject = {
  id: "",
  name: "No project yet",
  location: "Add a project in Project Details",
  type: "—",
  health: "—",
};

/**
 * The most recently created live project, used so imported screens show the
 * owner's real project identity instead of demo names.
 */
export function useActiveProject(): ActiveProject {
  const { data } = useQuery({
    queryKey: ["site_projects", "active-identity"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_projects")
        .select("id,name,location,type,health")
        .order("created_at", { ascending: false })
        .limit(1);
      if (error) throw error;
      return data ?? [];
    },
  });

  const row = data?.[0];
  if (!row) return FALLBACK;
  return {
    id: row.id,
    name: row.name || FALLBACK.name,
    location: row.location || "—",
    type: row.type || "—",
    health: row.health || "—",
  };
}
