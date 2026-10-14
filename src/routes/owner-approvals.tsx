import { createFileRoute, redirect } from "@tanstack/react-router";

// Merged (14 Oct: fewer, non-duplicate pages); old links and bookmarks land on the merged page.
export const Route = createFileRoute("/owner-approvals")({
  beforeLoad: () => {
    throw redirect({ to: "/approvals", search: { tab: "owner" } });
  },
  component: () => null,
});
