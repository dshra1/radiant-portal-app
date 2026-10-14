import { createFileRoute, redirect } from "@tanstack/react-router";

// Merged into the Saha OS Hub (review notes, 14 Oct): one home page.
export const Route = createFileRoute("/dashboard")({
  beforeLoad: () => {
    throw redirect({ to: "/" });
  },
  component: () => null,
});
