/**
 * Flats, flat types and who pays what. Common works are the landowners' PMC
 * and are shared by their share %. Individual works belong to each flat (by its
 * type's cost) and go to the flat's owner; a flat with no owner set is carried
 * by the landowners by share until it is allotted.
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type FlatTypeRow = Database["public"]["Tables"]["flat_types"]["Row"];
export type FlatRow = Database["public"]["Tables"]["flats"]["Row"];
export type FlatLineRow = {
  pkg: string;
  code: string;
  item: string;
  make: string;
  unit: string;
  qty: number;
  rate: number;
  gst: number;
  excl: number;
  incl: number;
};

export type ShareOwner = { name: string; role: string; share: number };

export type Payer = {
  name: string;
  role: string;
  /** Share of the common works. */
  common: number;
  /** Individual works of the flats this payer owns. */
  individual: number;
  /** Individual works of flats not yet allotted, carried by share. */
  unallotted: number;
  flats: string[];
  total: number;
};

const n = (v: unknown) => {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
};

export function useFlats(projectId: string) {
  return useQuery({
    queryKey: ["flats", projectId],
    enabled: Boolean(projectId),
    queryFn: async () => {
      const [t, f] = await Promise.all([
        supabase.from("flat_types").select("*").eq("project_id", projectId).order("sort"),
        supabase.from("flats").select("*").eq("project_id", projectId).order("flat_no"),
      ]);
      if (t.error) throw t.error;
      if (f.error) throw f.error;
      return { types: t.data ?? [], flats: f.data ?? [] };
    },
  });
}

const key = (s: string) => s.trim().toLowerCase();

/**
 * Splits an amount into common and individual parts by payer.
 * `common` goes by share; `individual` goes to each flat's owner in proportion
 * to its type's individual cost (flats without an owner go by share).
 */
export function splitToPayers(
  common: number,
  individual: number,
  owners: ShareOwner[],
  flats: Pick<FlatRow, "flat_no" | "type_code" | "owner_name">[],
  types: Pick<FlatTypeRow, "code" | "indiv_incl">[],
): Payer[] {
  const shareTotal = owners.reduce((t, o) => t + n(o.share), 0);
  const out = new Map<string, Payer>();
  const get = (name: string, role: string) => {
    let p = out.get(key(name));
    if (!p) {
      p = { name, role, common: 0, individual: 0, unallotted: 0, flats: [], total: 0 };
      out.set(key(name), p);
    }
    return p;
  };
  for (const o of owners) {
    const frac = shareTotal > 0 ? n(o.share) / shareTotal : 0;
    get(o.name, o.role).common += common * frac;
  }
  const weight = new Map(types.map((t) => [t.code, n(t.indiv_incl)]));
  const w = (f: { type_code: string }) => weight.get(f.type_code) || 1;
  const sum = flats.reduce((t, f) => t + w(f), 0);
  let unallotted = sum > 0 ? 0 : individual;
  for (const f of flats) {
    const part = sum > 0 ? (individual * w(f)) / sum : 0;
    const owner = f.owner_name.trim();
    if (!owner) {
      unallotted += part;
      continue;
    }
    const match = owners.find((o) => key(o.name) === key(owner));
    const p = get(match?.name ?? owner, match?.role ?? "Flat owner");
    p.individual += part;
    p.flats.push(f.flat_no);
  }
  for (const o of owners) {
    const frac = shareTotal > 0 ? n(o.share) / shareTotal : 0;
    get(o.name, o.role).unallotted += unallotted * frac;
  }
  const list = [...out.values()];
  for (const p of list) p.total = p.common + p.individual + p.unallotted;
  return list.filter((p) => p.total > 0.5 || p.flats.length);
}
