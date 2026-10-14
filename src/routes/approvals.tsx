import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Calculator, Lock, Users } from "lucide-react";
import { Shell } from "@/components/saha/Shell";
import { PageTabs } from "@/components/saha/ui";
import { useAccess } from "@/lib/access";
import { BoqChangeApprovals } from "@/components/saha/approvals/BoqChangeApprovals";
import { OwnerDecisions } from "@/components/saha/approvals/OwnerDecisions";

type Tab = "boq" | "owner";
type Search = { tab?: Tab };

export const Route = createFileRoute("/approvals")({
  validateSearch: (s: Record<string, unknown>): Search =>
    s["tab"] === "boq" || s["tab"] === "owner" ? { tab: s["tab"] } : {},
  head: () => ({
    meta: [
      { title: "Approvals — BOQ Changes and Owner Decisions | Saha OS" },
      {
        name: "description",
        content:
          "One place for every sign-off: cost-affecting BOQ changes decided by the admin, and payment requests, drawings and decisions sent to the owners with their approve or reject replies.",
      },
      { property: "og:title", content: "Approvals — BOQ Changes and Owner Decisions" },
      {
        property: "og:description",
        content: "BOQ change approvals and the owners' written decision trail.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/approvals" });
  const { access } = useAccess();
  const isAdmin = Boolean(access?.isAdmin);
  const isOwner = Boolean(access?.roles.includes("landowner_investor"));
  // Owners land on their own decisions; everyone else on the BOQ change queue.
  const tab: Tab = search.tab ?? (isOwner && !isAdmin ? "owner" : "boq");
  return (
    <Shell title="Approvals">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <PageTabs
          tabs={[
            { key: "boq", label: "BOQ changes", icon: <Calculator className="size-4" /> },
            { key: "owner", label: "Owner decisions", icon: <Users className="size-4" /> },
          ]}
          active={tab}
          onChange={(t) => void navigate({ search: { tab: t }, replace: true })}
        />
        <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <Lock className="size-3.5" />
          {tab === "boq"
            ? isAdmin
              ? "You are the admin: you approve or reject BOQ changes."
              : "BOQ changes are decided by the admin only; you can raise and follow them."
            : isAdmin || isOwner
              ? "You can record an owner's approve or reject decision."
              : "Only the owner (landowner / investor login) or the admin records a decision."}
        </p>
      </div>
      {tab === "owner" ? <OwnerDecisions /> : <BoqChangeApprovals />}
    </Shell>
  );
}
