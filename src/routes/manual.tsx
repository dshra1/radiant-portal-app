import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Shell } from "@/components/saha/Shell";
import { alwaysVisible, navGroups, roleGroups } from "@/components/saha/nav";
import manualHtml from "../manual/staff-manual.html?raw";

export const Route = createFileRoute("/manual")({
  head: () => ({
    meta: [
      { title: "Staff Manual | Saha OS" },
      {
        name: "description",
        content:
          "How to use Saha OS by role: briefing, guided tour, weekly stage cycle, page map and who can do what.",
      },
    ],
  }),
  component: Page,
});

/**
 * The live menu, passed to the manual so its page map, "in your menu" marks and
 * role briefings always follow the app: a page added, renamed or merged in
 * nav.ts shows up in the manual without editing the manual.
 */
function liveMenu() {
  const groupIds = navGroups.map((g) => g.id);
  const sees: Record<string, string[]> = {};
  for (const [label, id] of Object.entries(ROLE_ID)) {
    const g = roleGroups[label as keyof typeof roleGroups];
    sees[id] = g === "all" ? groupIds : [...g];
  }
  return {
    groups: navGroups.map((g) => ({
      id: g.id,
      label: g.label.replace(/^Main · /, ""),
      pages: g.items.map((i) => ({ to: i.to, label: i.label, adminOnly: Boolean(i.adminOnly) })),
    })),
    sees,
    always: alwaysVisible,
  };
}

/** App role labels (Shell's "Active role") to the manual's role ids. */
const ROLE_ID: Record<string, string> = {
  "Admin / Owner": "admin",
  "Project Manager (PM)": "pm",
  "Site Engineer": "eng",
  "Site Supervisor": "sup",
  "Purchase / Stores": "buy",
  Accounts: "acc",
  "Landowner / Investor": "own",
};

function Page() {
  const [doc, setDoc] = useState("");
  useEffect(() => {
    let role = "pm";
    try {
      role = ROLE_ID[window.localStorage.getItem("saha-role") ?? ""] ?? "pm";
    } catch {
      /* storage blocked: fall back to PM */
    }
    const boot = `<script>window.SAHA_APP=${JSON.stringify(window.location.origin)};window.SAHA_ROLE=${JSON.stringify(role)};window.SAHA_NAV=${JSON.stringify(liveMenu()).replace(/</g, "\\u003c")};</script>`;
    setDoc(
      `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">${boot}</head><body style="margin:0">${manualHtml}</body></html>`,
    );
  }, []);
  return (
    <Shell title="Staff Manual">
      {doc ? (
        <iframe
          title="Saha OS Staff Manual"
          srcDoc={doc}
          className="block w-full border-0"
          style={{ height: "calc(100dvh - 120px)" }}
        />
      ) : (
        <p className="p-6 text-sm text-muted-foreground">Loading the manual…</p>
      )}
    </Shell>
  );
}
