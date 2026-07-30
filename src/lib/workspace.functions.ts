import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  adjustmentToRow,
  evidenceToRow,
  loadWorkspaceForUser,
  resetWorkspaceForUser,
} from "./workspace.server";
import type { AdjustmentRecord, EvidenceLog } from "./demo-data";

const AdjustmentSchema = z.object({
  id: z.string(),
  studentId: z.string(),
  classId: z.string(),
  curriculumTopicId: z.string(),
  activityDescription: z.string(),
  generatedAdjustment: z.string(),
  udlBenefit: z.string(),
  culturalNote: z.string().nullable(),
  traumaNote: z.string().nullable(),
  rationale: z.string(),
  nccdPillar: z.string(),
  evidenceType: z.string(),
  teacherAction: z.string().nullable(),
  status: z.string(),
  createdAt: z.string(),
  implementedAt: z.string().nullable(),
});

const EvidenceSchema = z.object({
  id: z.string(),
  adjustmentId: z.string().nullable(),
  studentId: z.string(),
  logDate: z.string(),
  weekNumber: z.number(),
  pillar: z.string(),
  evidenceSummary: z.string(),
  source: z.string(),
  createdAt: z.string(),
});

export const loadWorkspace = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const email = (context.claims.email as string | undefined) ?? "";
    const fallbackName = email ? email.split("@")[0] : "Teacher";
    return loadWorkspaceForUser(context.supabase, context.userId, fallbackName);
  });

export const saveAdjustment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => AdjustmentSchema.parse(input))
  .handler(async ({ data, context }) => {
    const row = adjustmentToRow(data as unknown as AdjustmentRecord, context.userId);
    const { error } = await context.supabase.from("adjustments").upsert(row);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const saveEvidenceLog = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => EvidenceSchema.parse(input))
  .handler(async ({ data, context }) => {
    const row = evidenceToRow(data as unknown as EvidenceLog, context.userId);
    const { error } = await context.supabase.from("evidence_logs").upsert(row);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const updateProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        fullName: z.string().min(1).max(80),
        schoolName: z.string().min(1).max(120),
        state: z.string().min(1).max(20),
        role: z.string().min(1).max(60),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("profiles")
      .update({
        full_name: data.fullName,
        school_name: data.schoolName,
        state: data.state,
        role: data.role,
        updated_at: new Date().toISOString(),
      })
      .eq("id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const resetWorkspace = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await resetWorkspaceForUser(context.supabase, context.userId);
    return { ok: true as const };
  });
