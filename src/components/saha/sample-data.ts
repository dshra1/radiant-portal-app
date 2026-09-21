// Screens that still render illustrative/reference figures instead of live
// project data. Remove a path from this list once that screen is wired to
// site_projects / boq_items and shows real numbers (or an empty state).
export const SAMPLE_DATA_ROUTES: Record<string, string> = {
  "/command-operations": "operational activity feed and metrics",
  "/project-controls": "schedule and cost control indices",
  "/system-directory": "directory records",
};
