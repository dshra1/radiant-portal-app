import { createFileRoute, redirect } from "@tanstack/react-router";

// Merged (14 Oct: fewer, non-duplicate pages); old links and bookmarks land on the merged page.
export const Route = createFileRoute("/brand-benchmark")({
  beforeLoad: () => {
    throw redirect({ to: "/price-intelligence", search: { tab: "brands" } });
  },
  component: () => null,
});
