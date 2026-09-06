import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCallback, useEffect, useState } from "react";
import { useSessionUser } from "@/lib/access";

export type ActiveProject = {
  id: string;
  name: string;
  location: string;
  type: string;
  health: string;
};

const STORAGE_KEY = "saha-active-project-id";
const CHANGE_EVENT = "saha-active-project-changed";

const FALLBACK: ActiveProject = {
  id: "",
  name: "No project yet",
  location: "Add a project in Project Details",
  type: "—",
  health: "—",
};

export function useActiveProject(): ActiveProject {
  const user = useSessionUser();
  const { data } = useQuery({
    queryKey: ["site_projects", "active-identity"],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_projects")
        .select("id,name,location,type,health")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const [storedId, setStoredId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const read = () => setStoredId(window.localStorage.getItem(STORAGE_KEY));
    read();
    window.addEventListener(CHANGE_EVENT, read);
    window.addEventListener("storage", read);
    return () => {
      window.removeEventListener(CHANGE_EVENT, read);
      window.removeEventListener("storage", read);
    };
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
        window.dispatchEvent(new Event(CHANGE_EVENT));
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
