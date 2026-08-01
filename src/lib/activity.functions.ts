import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  ACTIVITY_EVENTS,
  ACTIVITY_SURFACES,
  type ActivityEvent,
  type ActivityRecord,
  type ActivitySurface,
} from "./activity-types";

const LogSchema = z.object({
  eventType: z.enum(ACTIVITY_EVENTS),
  surface: z.enum(ACTIVITY_SURFACES),
  summary: z.string().max(600).default(""),
  studentId: z.string().uuid().nullable().optional(),
  adjustmentId: z.string().uuid().nullable().optional(),
  durationMs: z.number().int().min(0).max(600_000).nullable().optional(),
  success: z.boolean().default(true),
});

export const logActivity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => LogSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("ai_activity_events").insert({
      user_id: context.userId,
      student_id: data.studentId ?? null,
      adjustment_id: data.adjustmentId ?? null,
      event_type: data.eventType,
      surface: data.surface,
      summary: data.summary,
      duration_ms: data.durationMs ?? null,
      success: data.success,
    });
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const listActivity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ActivityRecord[]> => {
    const { data, error } = await context.supabase
      .from("ai_activity_events")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(400);
    if (error) throw new Error(error.message);
    return (data ?? []).map((row) => ({
      id: row.id,
      studentId: row.student_id,
      adjustmentId: row.adjustment_id,
      eventType: row.event_type as ActivityEvent,
      surface: row.surface as ActivitySurface,
      summary: row.summary,
      durationMs: row.duration_ms,
      success: row.success,
      createdAt: row.created_at,
    }));
  });

export const clearActivity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { error } = await context.supabase
      .from("ai_activity_events")
      .delete()
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });
