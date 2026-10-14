import { createFileRoute, redirect } from "@tanstack/react-router";

// Retired (review notes, 14 Oct: no mock-up or duplicate pages); old links land on the live page.
export const Route = createFileRoute("/site-material-guide")({
  beforeLoad: () => {
    throw redirect({ to: "/stage-drawings" });
  },
  component: () => null,
});
