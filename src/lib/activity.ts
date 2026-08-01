import { logActivity } from "./activity.functions";
import type { ActivityEvent, ActivitySurface } from "./activity-types";

/**
 * Fire-and-forget audit trail write. Never blocks or breaks the UI —
 * a failed audit write is logged to the console only.
 */
export function recordActivity(input: {
  eventType: ActivityEvent;
  surface: ActivitySurface;
  summary: string;
  studentId?: string | null;
  adjustmentId?: string | null;
  durationMs?: number | null;
  success?: boolean;
}) {
  void logActivity({
    data: { success: true, ...input },
  }).catch((error: unknown) => console.error("activity log failed", error));
}
