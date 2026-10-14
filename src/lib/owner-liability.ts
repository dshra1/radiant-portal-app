/**
 * Each payer's liability as the report splits it, and what they have put in.
 *
 * - Common works (the landowners' PMC): BOQ common lines incl. GST, plus the
 *   project contingency, shared by each landowner's share %.
 * - Individual works: each flat's type cost (incl. GST and contingency, from the
 *   common vs individual workbook) plus the owner's own extras, to that flat's
 *   owner. Flats with no owner yet are carried by the landowners by share.
 * - Contributions: capital calls and money received in the Capital Ledger.
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { boqTotals } from "@/lib/boq-totals";

const n = (v: unknown) => {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
};
const key = (s: string) => s.trim().toLowerCase();

export type LiabilityEntry = {
  date: string | null;
  type: string;
  milestone: string;
  reference: string;
  amount: number;
  status: string;
};

export type Liability = {
  name: string;
  role: string;
  share: number;
  common: { excl: number; gst: number; contingency: number; total: number };
  flats: { no: string; type: string; base: number; extra: number }[];
  ownFlats: number;
  unallotted: number;
  total: number;
  called: number;
  received: number;
  openCalls: number;
  balance: number;
  entries: LiabilityEntry[];
};

export function useOwnerLiability(projectId: string) {
  return useQuery({
    queryKey: ["owner_liability", projectId],
    enabled: Boolean(projectId),
    queryFn: async () => {
      const [pr, boq, types, flats, cap] = await Promise.all([
        supabase
          .from("site_projects")
          .select("landowners,contingency_pct")
          .eq("id", projectId)
          .maybeSingle(),
        supabase
          .from("boq_items")
          .select("quantity,rate,gst_pct,work_scope,package,package_no,item_code")
          .eq("project_id", projectId),
        supabase.from("flat_types").select("code,label,indiv_total").eq("project_id", projectId),
        supabase
          .from("flats")
          .select("flat_no,type_code,owner_name,owner_extra")
          .eq("project_id", projectId)
          .order("flat_no"),
        supabase
          .from("capital_entries")
          .select("owner_name,owner_role,entry_type,amount,status,entry_date,milestone,reference")
          .eq("project_id", projectId)
          .order("entry_date", { ascending: true }),
      ]);
      for (const r of [pr, boq, types, flats, cap]) if (r.error) throw r.error;
      const cPct =
        pr.data?.contingency_pct === null || pr.data?.contingency_pct === undefined
          ? 5
          : n(pr.data.contingency_pct);
      const t = boqTotals(boq.data ?? [], cPct);
      const f = cPct / 100;
      const commonExcl = t.common.excl;
      const commonGst = t.common.gst;
      const commonCont = t.common.incl * f;
      const commonTotal = t.common.incl + commonCont;

      const typeOf = new Map((types.data ?? []).map((x) => [x.code, x]));
      const flatList = (flats.data ?? []).map((x) => ({
        no: x.flat_no,
        type: typeOf.get(x.type_code)?.label ?? x.type_code,
        owner: x.owner_name.trim(),
        base: n(typeOf.get(x.type_code)?.indiv_total),
        extra: n(x.owner_extra),
      }));
      // No flats on record: the individual works stay with the landowners by share.
      const individualTotal = flatList.length
        ? flatList.reduce((s, x) => s + x.base + x.extra, 0)
        : t.individual.incl * (1 + f);
      const unallottedTotal = flatList.length
        ? flatList.filter((x) => !x.owner).reduce((s, x) => s + x.base + x.extra, 0)
        : individualTotal;

      const raw = Array.isArray(pr.data?.landowners)
        ? (pr.data.landowners as Record<string, unknown>[])
        : [];
      const owners = raw
        .map((o) => ({
          name: String(o["name"] ?? "").trim(),
          role: String(o["role"] ?? "Land Holder"),
          share: n(o["share_pct"]),
        }))
        .filter((o) => o.name);
      const shareTotal = owners.reduce((s, o) => s + o.share, 0);

      const out = new Map<string, Liability>();
      const get = (name: string, role: string, share = 0) => {
        let l = out.get(key(name));
        if (!l) {
          l = {
            name,
            role,
            share,
            common: { excl: 0, gst: 0, contingency: 0, total: 0 },
            flats: [],
            ownFlats: 0,
            unallotted: 0,
            total: 0,
            called: 0,
            received: 0,
            openCalls: 0,
            balance: 0,
            entries: [],
          };
          out.set(key(name), l);
        }
        return l;
      };
      for (const o of owners) {
        const frac = shareTotal > 0 ? o.share / shareTotal : 0;
        const l = get(o.name, o.role, o.share);
        l.common = {
          excl: commonExcl * frac,
          gst: commonGst * frac,
          contingency: commonCont * frac,
          total: commonTotal * frac,
        };
        l.unallotted = unallottedTotal * frac;
      }
      for (const x of flatList) {
        if (!x.owner) continue;
        const l = get(
          owners.find((o) => key(o.name) === key(x.owner))?.name ?? x.owner,
          "Flat owner",
        );
        l.flats.push({ no: x.no, type: x.type, base: x.base, extra: x.extra });
        l.ownFlats += x.base + x.extra;
      }
      for (const e of cap.data ?? []) {
        const name = (e.owner_name ?? "").trim();
        if (!name) continue;
        const l = get(
          owners.find((o) => key(o.name) === key(name))?.name ?? name,
          e.owner_role || "Other",
        );
        const amt = n(e.amount);
        const type = String(e.entry_type).toLowerCase();
        if (type === "call") {
          l.called += amt;
          if (e.status !== "received") l.openCalls += amt;
        } else if (type === "receipt" || type === "deposit") l.received += amt;
        l.entries.push({
          date: e.entry_date,
          type,
          milestone: e.milestone,
          reference: e.reference,
          amount: amt,
          status: e.status,
        });
      }
      const list = [...out.values()];
      for (const l of list) {
        l.total = l.common.total + l.ownFlats + l.unallotted;
        l.balance = l.total - l.received;
      }
      return {
        list,
        contingencyPct: cPct,
        common: { excl: commonExcl, gst: commonGst, contingency: commonCont, total: commonTotal },
        individualTotal,
        unallottedTotal,
        flats: flatList,
        hasFlats: flatList.length > 0,
      };
    },
  });
}
