/** Shared types for the AI activity / audit trail. */

export const ACTIVITY_EVENTS = [
  "generated",
  "regenerated",
  "edited",
  "accepted",
  "declined",
  "saved",
  "exported",
  "imported",
  "error",
  "timeout",
] as const;

export type ActivityEvent = (typeof ACTIVITY_EVENTS)[number];

export const ACTIVITY_SURFACES = [
  "planner",
  "crisis",
  "family",
  "evidence",
  "import",
  "settings",
] as const;

export type ActivitySurface = (typeof ACTIVITY_SURFACES)[number];

export interface ActivityRecord {
  id: string;
  studentId: string | null;
  adjustmentId: string | null;
  eventType: ActivityEvent;
  surface: ActivitySurface;
  summary: string;
  durationMs: number | null;
  success: boolean;
  createdAt: string;
}

export const ACTIVITY_LABELS: Record<ActivityEvent, string> = {
  generated: "AI output created",
  regenerated: "AI output regenerated",
  edited: "Teacher edited AI output",
  accepted: "Accepted and logged as evidence",
  declined: "Declined",
  saved: "Saved for later",
  exported: "Exported",
  imported: "Data imported",
  error: "Server error",
  timeout: "Timed out",
};
