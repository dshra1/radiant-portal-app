import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/boq-upload")({
  beforeLoad: () => {
    throw redirect({ to: "/boq-engine" });
  },
  head: () => ({
    meta: [
      { title: "BOQ Engine — SiteYantra Construction Management App" },
      {
        name: "description",
        content: "Upload, edit and export your project BOQ inside the live BOQ Engine.",
      },
      { property: "og:title", content: "BOQ Engine — SiteYantra Construction Management App" },
      {
        property: "og:description",
        content: "Upload, edit and export your project BOQ inside the live BOQ Engine.",
      },
    ],
  }),
  component: () => null,
});
