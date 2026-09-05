import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/boq")({
  beforeLoad: () => {
    throw redirect({ to: "/boq-engine" });
  },
  head: () => ({
    meta: [
      { title: "BOQ Engine — Saha OS Next" },
      {
        name: "description",
        content:
          "Project-specific bill of quantities with AI estimates, price optimizer and live rate intelligence.",
      },
      { property: "og:title", content: "BOQ Engine — Saha OS Next" },
      {
        property: "og:description",
        content: "Project-specific BOQ with AI estimates and price optimizer.",
      },
    ],
  }),
  component: () => null,
});
