import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAccess } from "@/lib/access";

/** Fields whose change moves money, so partners must sign off before it commits. */
export type CommercialPatch = {
  quantity?: number;
  rate?: number;
  brand?: string;
  supplier?: string;
};

export const COMMERCIAL_FIELDS = ["quantity", "rate", "brand", "supplier"] as const;

export type ChangeRequest = {
  id: string;
  project_id: string;
  boq_item_id: string | null;
  trade: string;
  description: string;
  unit: string;
  change_type: string;
  source: string;
  current_values: Record<string, unknown>;
  proposed_values: Record<string, unknown>;
  current_amount: number;
  proposed_amount: number;
  saving: number;
  note: string;
  status: "pending" | "approved" | "rejected";
  requested_by: string | null;
  requested_by_name: string;
  decided_by: string | null;
  decided_by_name: string;
  decided_at: string | null;
  decision_note: string;
  created_at: string;
};

export function isCommercialPatch(patch: Record<string, unknown>) {
  return Object.keys(patch).some((k) => (COMMERCIAL_FIELDS as readonly string[]).includes(k));
}

export function num(v: unknown) {
  const n = Number(String(v ?? "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

export type RaiseInput = {
  projectId: string;
  itemId: string | null;
  trade: string;
  description: string;
  unit: string;
  quantity: number;
  currentValues: CommercialPatch;
  proposedValues: CommercialPatch;
  changeType?: string;
  source?: string;
  note?: string;
  requestedBy: string | null;
  requestedByName: string;
};

/** Logs a proposed BOQ change for partner sign-off. Nothing is written to the BOQ yet. */
export async function raiseChangeRequest(input: RaiseInput) {
  const qty = num(input.proposedValues.quantity ?? input.quantity);
  const currentQty = num(input.currentValues.quantity ?? input.quantity);
  const currentRate = num(input.currentValues.rate);
  const proposedRate = num(input.proposedValues.rate ?? input.currentValues.rate);
  const currentAmount = currentQty * currentRate;
  const proposedAmount = qty * proposedRate;

  const { data, error } = await supabase
    .from("boq_change_requests")
    .insert({
      project_id: input.projectId,
      boq_item_id: input.itemId,
      trade: input.trade,
      description: input.description,
      unit: input.unit,
      change_type: input.changeType ?? "edit",
      source: input.source ?? "manual",
      current_values: input.currentValues as never,
      proposed_values: input.proposedValues as never,
      current_amount: currentAmount,
      proposed_amount: proposedAmount,
      saving: currentAmount - proposedAmount,
      note: input.note ?? "",
      requested_by: input.requestedBy,
      requested_by_name: input.requestedByName,
    })
    .select("id")
    .maybeSingle();
  if (error) throw error;
  return data?.id as string | undefined;
}

/** Approves a request and writes the proposed values onto the BOQ line. */
export async function approveChangeRequest(
  req: ChangeRequest,
  decider: { id: string | null; name: string },
  note = "",
) {
  if (req.boq_item_id) {
    const patch: Record<string, unknown> = {};
    for (const field of COMMERCIAL_FIELDS) {
      const value = req.proposed_values?.[field];
      if (value === undefined || value === null) continue;
      patch[field] = field === "quantity" || field === "rate" ? num(value) : String(value);
    }
    if (Object.keys(patch).length > 0) {
      const { error } = await supabase.from("boq_items").update(patch).eq("id", req.boq_item_id);
      if (error) throw error;
    }
  }
  const { error } = await supabase
    .from("boq_change_requests")
    .update({
      status: "approved",
      decided_by: decider.id,
      decided_by_name: decider.name,
      decided_at: new Date().toISOString(),
      decision_note: note,
    })
    .eq("id", req.id);
  if (error) throw error;
}

export async function rejectChangeRequest(
  req: ChangeRequest,
  decider: { id: string | null; name: string },
  note = "",
) {
  const { error } = await supabase
    .from("boq_change_requests")
    .update({
      status: "rejected",
      decided_by: decider.id,
      decided_by_name: decider.name,
      decided_at: new Date().toISOString(),
      decision_note: note,
    })
    .eq("id", req.id);
  if (error) throw error;
}

/** Loads change requests for a project, newest first. */
export function useChangeRequests(projectId: string, status?: "pending" | "decided") {
  return useQuery({
    queryKey: ["boq_change_requests", projectId, status ?? "all"],
    enabled: Boolean(projectId),
    refetchOnWindowFocus: true,
    queryFn: async () => {
      let q = supabase
        .from("boq_change_requests")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });
      if (status === "pending") q = q.eq("status", "pending");
      if (status === "decided") q = q.neq("status", "pending");
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as ChangeRequest[];
    },
  });
}

const STORAGE_KEY = "saha.boq.approvalMode";

/**
 * Approval gate: when on, cost-affecting BOQ edits become requests instead of
 * direct writes. Only Admin / PM can decide on requests or switch the gate off.
 */
export function useApprovalGate() {
  const { access } = useAccess();
  const canDecide = Boolean(
    access?.roles.includes("admin") || access?.roles.includes("pm"),
  );
  const [approvalMode, setMode] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === "off") setMode(false);
  }, []);

  const setApprovalMode = (on: boolean) => {
    setMode(on);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, on ? "on" : "off");
    }
  };

  // Members without decision rights always work through approvals.
  const gateOn = canDecide ? approvalMode : true;

  return {
    gateOn,
    canDecide,
    setApprovalMode,
    decider: {
      id: access?.userId ?? null,
      name: access?.profile?.full_name || access?.email || "Member",
    },
  };
}
