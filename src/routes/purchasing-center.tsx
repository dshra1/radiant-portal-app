import { createFileRoute, redirect } from "@tanstack/react-router";

// Merged (14 Oct: fewer, non-duplicate pages); old links and bookmarks land on the merged page.
export const Route = createFileRoute("/purchasing-center")({
  beforeLoad: () => {
    throw redirect({ to: "/procurement", search: { status: undefined } });
  },
  component: () => null,
});
