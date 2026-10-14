/**
 * Owner's portal data: which landowner a login is, their flats and flat types,
 * the options they may pick for each individual-works item, their selections,
 * and the cost difference against our specification.
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import type { FlatLineRow } from "@/lib/flats";
import { DEPARTMENTS } from "@/lib/tender-departments";

export type OptionRow = Database["public"]["Tables"]["flat_options"]["Row"];
export type SelectionRow = Database["public"]["Tables"]["flat_selections"]["Row"];
export type ChangeRequestRow = Database["public"]["Tables"]["owner_change_requests"]["Row"];

const n = (v: unknown) => {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
};
export const sameName = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

/** The landowner this login is linked to ('' when not linked). */
export function useMyOwnerName(userId: string | null | undefined) {
  return useQuery({
    queryKey: ["owner_links", "me", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("owner_links")
        .select("owner_name")
        .eq("user_id", userId!)
        .maybeSingle();
      if (error) throw error;
      return data?.owner_name ?? "";
    },
  });
}

/** Latest date to choose, per item code: the item's first need on site less 3 weeks. */
const CHOOSE_BY = (() => {
  const m = new Map<string, string>();
  for (const d of DEPARTMENTS)
    for (const i of d.items) {
      if (!i.code || !i.need) continue;
      const prev = m.get(i.code);
      if (!prev || i.need < prev) m.set(i.code, i.need);
    }
  const out = new Map<string, string>();
  for (const [k, v] of m)
    out.set(k, new Date(Date.parse(`${v}T00:00:00Z`) - 21 * 86_400_000).toISOString().slice(0, 10));
  return out;
})();
export const chooseByOf = (code: string) => CHOOSE_BY.get(code) ?? null;

/** Cost of a line incl. GST at a rate (excl. GST). */
export const lineIncl = (qty: number, rate: number, gstPct: number) =>
  n(qty) * n(rate) * (1 + n(gstPct) / 100);

/** Difference (incl. GST) between an option and our specification for one flat. */
export function deltaOf(line: FlatLineRow, opt: Pick<OptionRow, "rate" | "gst_pct"> | null) {
  if (!opt) return 0;
  return lineIncl(line.qty, opt.rate, opt.gst_pct) - lineIncl(line.qty, line.rate, line.gst);
}

export function usePortalData(projectId: string) {
  return useQuery({
    queryKey: ["owner_portal", projectId],
    enabled: Boolean(projectId),
    queryFn: async () => {
      const [flats, types, opts, sels, reqs, pr, links] = await Promise.all([
        supabase.from("flats").select("*").eq("project_id", projectId).order("flat_no"),
        supabase.from("flat_types").select("*").eq("project_id", projectId).order("sort"),
        supabase.from("flat_options").select("*").eq("project_id", projectId).order("sort"),
        supabase.from("flat_selections").select("*").eq("project_id", projectId),
        supabase
          .from("owner_change_requests")
          .select("*")
          .eq("project_id", projectId)
          .order("created_at", { ascending: false }),
        supabase.from("site_projects").select("landowners").eq("id", projectId).maybeSingle(),
        supabase.from("owner_links").select("user_id,owner_name"),
      ]);
      for (const r of [flats, types, opts, sels, reqs, pr]) if (r.error) throw r.error;
      const owners = (Array.isArray(pr.data?.landowners) ? pr.data.landowners : []) as {
        name?: string;
        share_pct?: number | string;
      }[];
      return {
        flats: flats.data ?? [],
        types: types.data ?? [],
        options: opts.data ?? [],
        selections: sels.data ?? [],
        requests: reqs.data ?? [],
        owners: owners
          .map((o) => ({ name: String(o.name ?? "").trim(), share: n(o.share_pct) }))
          .filter((o) => o.name),
        // Only admin / PM can read other people's links (RLS); owners see their own.
        links: links.data ?? [],
      };
    },
  });
}

export const linesOf = (lines: unknown) => (Array.isArray(lines) ? (lines as FlatLineRow[]) : []);

/** Options that apply to an item for a flat type (type-specific first). */
export function optionsFor(options: OptionRow[], code: string, typeCode: string) {
  return options
    .filter((o) => o.item_code === code && (!o.type_code || o.type_code === typeCode))
    .sort((a, b) => a.sort - b.sort || a.label.localeCompare(b.label));
}

export const STATUS_LABEL: Record<string, string> = {
  draft: "Chosen, not yet approved",
  owner_approved: "Approved by owner · waiting for PMC",
  accepted: "In the plan",
  rejected: "Not possible · see PMC note",
};
