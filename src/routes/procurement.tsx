import { createFileRoute } from "@tanstack/react-router";
import { Shell } from "@/components/saha/Shell";
import { ActionButton, MetricTile, Section, StatusBadge } from "@/components/saha/ui";
import { inrCompact, projects, purchaseOrders } from "@/data/saha";

export const Route = createFileRoute("/procurement")({
  head: () => ({
    meta: [
      { title: "Procurement & PO Guardrails — Saha OS Next" },
      {
        name: "description",
        content:
          "Multi-vendor purchase orders with market price guardrails, approval workflow and delivery tracking across construction sites.",
      },
      { property: "og:title", content: "Procurement & PO Guardrails — Saha OS Next" },
      {
        property: "og:description",
        content: "Vendor purchase orders with price guardrails, approvals and dispatch tracking.",
      },
    ],
  }),
  component: Procurement,
});

const statusTone = {
  Draft: "slate",
  "Pending Approval": "amber",
  Approved: "emerald",
  Dispatched: "sky",
  Delivered: "emerald",
} as const;

function Procurement() {
  const value = purchaseOrders.reduce((s, p) => s + p.totalValue, 0);
  const breaches = purchaseOrders.filter((p) => p.guardrail === "Exceeds Market +3%");

  return (
    <Shell
      title="Procurement"
      subtitle="Multi-vendor purchase orders with market price guardrails"
      actions={<ActionButton>Raise PO</ActionButton>}
    >
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricTile label="Open PO value" value={inrCompact(value)} />
        <MetricTile
          label="Guardrail breaches"
          value={String(breaches.length)}
          delta="Require variance approval"
          tone="bad"
        />
        <MetricTile
          label="Awaiting approval"
          value={String(purchaseOrders.filter((p) => p.status === "Pending Approval").length)}
          tone="warn"
          delta="SLA 24h"
        />
        <MetricTile
          label="Delivered this month"
          value={String(purchaseOrders.filter((p) => p.status === "Delivered").length)}
          tone="good"
          delta="On schedule"
        />
      </div>

      <Section title="Purchase orders" className="mt-3">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-[13px]">
            <thead>
              <tr className="border-b border-border bg-secondary/60">
                {["PO number", "Project", "Vendor", "Material", "Value", "Guardrail", "Status", "Raised"].map(
                  (h) => (
                    <th
                      key={h}
                      className="label-caps px-3 py-2 text-left font-medium text-muted-foreground"
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {purchaseOrders.map((po) => (
                <tr key={po.id} className="border-b border-border hover:bg-secondary/40">
                  <td className="px-3 py-2 font-semibold tnum">{po.poNumber}</td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {projects.find((p) => p.id === po.projectId)?.name}
                  </td>
                  <td className="px-3 py-2">{po.vendor}</td>
                  <td className="px-3 py-2 text-muted-foreground">{po.material}</td>
                  <td className="px-3 py-2 font-semibold tnum">{inrCompact(po.totalValue)}</td>
                  <td className="px-3 py-2">
                    <StatusBadge tone={po.guardrail === "Within Budget" ? "emerald" : po.guardrail === "Approved Variance" ? "sky" : "red"}>
                      {po.guardrail}
                    </StatusBadge>
                  </td>
                  <td className="px-3 py-2">
                    <StatusBadge tone={statusTone[po.status]}>{po.status}</StatusBadge>
                  </td>
                  <td className="px-3 py-2 text-muted-foreground tnum">{po.raised}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
    </Shell>
  );
}
