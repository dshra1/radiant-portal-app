import { createFileRoute, redirect } from "@tanstack/react-router";

// Merged (14 Oct: fewer, non-duplicate pages); old links and bookmarks land on the merged page.
export const Route = createFileRoute("/billing-expenditure")({
  beforeLoad: () => {
    throw redirect({ to: "/bills-payments", search: { tab: "outflows" } });
  },
  component: () => null,
});
