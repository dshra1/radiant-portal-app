import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCallback, useEffect, useState } from "react";

export type ActiveProject = {
  id: string;
  name: string;
  location: string;
  type: string;
  health: string;
};

const STORAGE_KEY = "saha-active-project-id";

const FALLBACK: ActiveProject = {
  id: "",
  name: "No project yet",
  location: "Add a project in Project Details",
  type: "—",
  health: "—",
};

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

  const [storedId, setStoredId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setStoredId(window.localStorage.getItem(STORAGE_KEY));
  }, []);

  const row = data?.find((r) => r.id === storedId) ?? data?.[0];
  if (!row) return FALLBACK;
  return {
    id: row.id,
    name: row.name || FALLBACK.name,
    location: row.location || "—",
    type: row.type || "—",
    health: row.health || "—",
  };
}

export function useActiveProjectSetter() {
  const queryClient = useQueryClient();

  return useCallback(
    (id: string) => {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(STORAGE_KEY, id);
      }
      queryClient.invalidateQueries({ queryKey: ["site_projects", "active-identity"] });
      queryClient.invalidateQueries({ queryKey: ["site_projects", "hub-summary"] });
      queryClient.invalidateQueries({ queryKey: ["site_projects", "navigation-summary"] });
      queryClient.invalidateQueries({ queryKey: ["boq_items"] });
      queryClient.invalidateQueries({ queryKey: ["purchase_orders"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    [queryClient],
  );
}
