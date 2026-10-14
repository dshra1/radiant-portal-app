/**
 * Owners' extras to buy: every flat choice the PMC has accepted into the plan
 * that differs from our specification (an option, not "our spec"). Each one is
 * bought for that flat: added to the department tender for its item, then
 * ordered on a PO tagged OWNER:<flat>:<item code>.
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DEPARTMENTS, deptAppliesTo, rfqNumberOf } from "@/lib/tender-departments";
import { chooseByOf, linesOf } from "@/lib/owner-portal";

export type OwnerExtra = {
  selectionId: string;
  flatNo: string;
  owner: string;
  code: string;
  item: string;
  unit: string;
  qty: number;
  specMake: string;
  specRate: number;
  choice: string;
  make: string;
  rate: number;
  gst: number;
  delta: number;
  needBy: string | null;
  chooseBy: string | null;
  dept: { code: string; name: string } | null;
  /** RFQ line already added for this flat's choice. */
  onTender: string | null;
  /** PO number already covering it. */
  po: string | null;
  acceptedAt: string | null;
};

export const extraKey = (flatNo: string, code: string) => `OWNER:${flatNo}:${code}`;
export const extraMarker = (flatNo: string) => `[owner's choice · flat ${flatNo}]`;

const DEPT_OF = (() => {
  const m = new Map<string, { code: string; name: string; need: string }>();
  for (const d of DEPARTMENTS)
    for (const i of d.items) {
      if (!i.code) continue;
      const prev = m.get(i.code);
      if (!prev || i.need < prev.need) m.set(i.code, { code: d.code, name: d.name, need: i.need });
    }
  return m;
})();

export function deptOf(code: string) {
  return DEPT_OF.get(code) ?? null;
}

export function useOwnerExtras(projectId: string) {
  return useQuery({
    queryKey: ["owner_extras", projectId],
    enabled: Boolean(projectId),
    queryFn: async (): Promise<OwnerExtra[]> => {
      const [sels, flats, types, opts] = await Promise.all([
        supabase
          .from("flat_selections")
          .select("*")
          .eq("project_id", projectId)
          .eq("status", "accepted")
          .not("option_id", "is", null),
        supabase.from("flats").select("flat_no,type_code,owner_name").eq("project_id", projectId),
        supabase.from("flat_types").select("code,lines").eq("project_id", projectId),
        supabase.from("flat_options").select("*").eq("project_id", projectId),
      ]);
      const pr = await supabase
        .from("site_projects")
        .select("name")
        .eq("id", projectId)
        .maybeSingle();
      const ownMaster = deptAppliesTo(pr.data?.name);
      for (const r of [sels, flats, types, opts]) if (r.error) throw r.error;
      const rows = sels.data ?? [];
      if (!rows.length) return [];

      // What is already on a tender or a PO.
      const codes = [...new Set(rows.map((r) => r.item_code))];
      const rfqs = await supabase
        .from("rfqs")
        .select("id,rfq_number")
        .eq("project_id", projectId)
        .like("rfq_number", "CE-D%");
      const rfqNo = new Map((rfqs.data ?? []).map((r) => [r.id, r.rfq_number]));
      const rfqItems = rfqNo.size
        ? await supabase
            .from("rfq_items")
            .select("rfq_id,item_code,description")
            .in("rfq_id", [...rfqNo.keys()])
            .in("item_code", codes)
        : { data: [] as { rfq_id: string; item_code: string; description: string }[] };
      const keys = rows.map((r) => extraKey(r.flat_no, r.item_code));
      const poItems = await supabase
        .from("purchase_order_items")
        .select("po_id,material_key")
        .in("material_key", keys);
      const poIds = [...new Set((poItems.data ?? []).map((p) => p.po_id))];
      const pos = poIds.length
        ? await supabase.from("purchase_orders").select("id,po_number,status").in("id", poIds)
        : { data: [] as { id: string; po_number: string; status: string }[] };
      const poNo = new Map(
        (pos.data ?? [])
          .filter((p) => !/reject|cancel/i.test(p.status ?? ""))
          .map((p) => [p.id, p.po_number]),
      );
      const poByKey = new Map<string, string>();
      for (const it of poItems.data ?? []) {
        const no = poNo.get(it.po_id);
        if (no) poByKey.set(it.material_key, no);
      }

      const flatBy = new Map((flats.data ?? []).map((f) => [f.flat_no, f]));
      const typeBy = new Map((types.data ?? []).map((t) => [t.code, linesOf(t.lines)]));
      const optBy = new Map((opts.data ?? []).map((o) => [o.id, o]));
      const out: OwnerExtra[] = [];
      for (const s of rows) {
        const flat = flatBy.get(s.flat_no);
        const line = (typeBy.get(flat?.type_code ?? "") ?? []).find((l) => l.code === s.item_code);
        const opt = s.option_id ? optBy.get(s.option_id) : undefined;
        if (!opt) continue;
        const dept = ownMaster ? deptOf(s.item_code) : null;
        const marker = extraMarker(s.flat_no);
        const tender = (rfqItems.data ?? []).find(
          (i) => i.item_code === s.item_code && i.description.includes(marker),
        );
        out.push({
          selectionId: s.id,
          flatNo: s.flat_no,
          owner: flat?.owner_name ?? "",
          code: s.item_code,
          item: line?.item ?? s.item_code,
          unit: line?.unit ?? "",
          qty: Number(line?.qty ?? 0),
          specMake: line?.make ?? "",
          specRate: Number(line?.rate ?? 0),
          choice: opt.label,
          make: opt.make,
          rate: Number(opt.rate),
          gst: Number(opt.gst_pct),
          delta: Number(s.delta),
          needBy: dept?.need ?? null,
          chooseBy: chooseByOf(s.item_code, pr.data?.name ?? ""),
          dept: dept ? { code: dept.code, name: dept.name } : null,
          onTender: tender ? (rfqNo.get(tender.rfq_id) ?? "tender") : null,
          po: poByKey.get(extraKey(s.flat_no, s.item_code)) ?? null,
          acceptedAt: s.decided_at,
        });
      }
      return out.sort(
        (a, b) =>
          (a.needBy ?? "9").localeCompare(b.needBy ?? "9") || a.flatNo.localeCompare(b.flatNo),
      );
    },
  });
}

/** Adds an owner's choice as its own line on the department tender for that item. */
export async function addExtraToTender(projectId: string, x: OwnerExtra) {
  if (!x.dept) throw new Error(`${x.code} is not in any department tender`);
  const rfq = await supabase
    .from("rfqs")
    .select("id,status")
    .eq("project_id", projectId)
    .eq("rfq_number", rfqNumberOf(x.dept.code))
    .maybeSingle();
  if (rfq.error) throw rfq.error;
  if (!rfq.data) throw new Error("Load the department tenders first (Tender Comparison)");
  if (rfq.data.status === "awarded")
    throw new Error(
      `${rfqNumberOf(x.dept.code)} is already awarded: raise a PO for this flat instead`,
    );
  const last = await supabase
    .from("rfq_items")
    .select("sort")
    .eq("rfq_id", rfq.data.id)
    .order("sort", { ascending: false })
    .limit(1)
    .maybeSingle();
  const ins = await supabase.from("rfq_items").insert({
    rfq_id: rfq.data.id,
    sort: (last.data?.sort ?? 0) + 1,
    item_code: x.code,
    description: [
      `${x.code} · ${x.item} — ${x.choice}`,
      x.make ? `(make: ${x.make})` : "",
      extraMarker(x.flatNo),
      `replaces our spec${x.specMake ? ` (${x.specMake})` : ""} for this flat`,
      x.needBy ? `[needed from ${x.needBy}]` : "",
    ]
      .filter(Boolean)
      .join(" "),
    qty: x.qty,
    unit: x.unit,
    benchmark_rate: x.rate,
    gst_pct: x.gst,
  });
  if (ins.error) throw ins.error;
  return rfqNumberOf(x.dept.code);
}
