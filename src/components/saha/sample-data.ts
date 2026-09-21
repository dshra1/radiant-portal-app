// Screens that still render illustrative/reference figures instead of live
// project data. Remove a path from this list once that screen is wired to
// site_projects / boq_items and shows real numbers (or an empty state).
export const SAMPLE_DATA_ROUTES: Record<string, string> = {
  "/qa": "QA gates, defect counts and inspection history",
  "/qa-inspection": "inspection checklists and pass/fail counts",
  "/pour-cards": "pour card schedule and approvals",
  "/field-console": "biometric attendance and field activity counts",
  "/contractors-labour": "labour headcount and productivity",
  "/site-execution": "stage progress, workforce and material runway",
  "/command-operations": "operational activity feed and metrics",
  "/project-controls": "schedule and cost control indices",
  "/media-upload-studio": "uploaded media samples",
  "/site-media": "site media samples",
  "/system-directory": "directory records",
  "/roles-access": "sample role assignments",
};
