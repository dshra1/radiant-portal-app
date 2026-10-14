import { createFileRoute, redirect } from "@tanstack/react-router";

// Merged (14 Oct: fewer, non-duplicate pages); old links and bookmarks land on the merged page.
export const Route = createFileRoute("/qa-inspection")({
  beforeLoad: () => {
    throw redirect({ to: "/quality", search: { tab: "inspections" } });
  },
  component: () => null,
});
