import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/** Pick the programme stage a purchase, bill or labour entry is for. */
export function StageSelect({
  projectId,
  value,
  onChange,
  className = "rounded-lg border border-border bg-background px-3 py-2 text-sm",
}: {
  projectId: string;
  value: string;
  onChange: (code: string) => void;
  className?: string;
}) {
  const q = useQuery({
    queryKey: ["stage_codes", projectId],
    enabled: Boolean(projectId),
    staleTime: 300_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_stages")
        .select("code,name,planned_start")
        .eq("project_id", projectId)
        .neq("code", "")
        .order("sort", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className={className}>
      <option value="">— no stage —</option>
      {(q.data ?? []).map((s) => (
        <option key={s.code} value={s.code}>
          {s.code} · {(s.name ?? "").replace(/^[A-Z]{1,3}\d{0,3} · /, "").slice(0, 50)}
        </option>
      ))}
    </select>
  );
}
