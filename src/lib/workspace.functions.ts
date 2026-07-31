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
import type { Database } from "@/integrations/supabase/types";

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
        fullName: z.string().min(1).max(80).optional(),
        schoolName: z.string().min(1).max(120).optional(),
        state: z.string().min(1).max(20).optional(),
        role: z.string().min(1).max(60).optional(),
        yearLevel: z.number().int().min(1).max(12).optional(),
        assessmentContext: z.string().max(600).optional(),
        aiConsent: z.boolean().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const patch: Database["public"]["Tables"]["profiles"]["Update"] = {
      updated_at: new Date().toISOString(),
    };
    if (data.fullName !== undefined) patch.full_name = data.fullName;
    if (data.schoolName !== undefined) patch.school_name = data.schoolName;
    if (data.state !== undefined) patch.state = data.state;
    if (data.role !== undefined) patch.role = data.role;
    if (data.yearLevel !== undefined) patch.year_level = data.yearLevel;
    if (data.assessmentContext !== undefined) patch.assessment_context = data.assessmentContext;
    if (data.aiConsent !== undefined) {
      patch.ai_consent = data.aiConsent;
      patch.ai_consent_at = data.aiConsent ? new Date().toISOString() : null;
    }

    const { data: updated, error } = await context.supabase
      .from("profiles")
      .update(patch)
      .eq("id", context.userId)
      .select()
      .maybeSingle();
    if (error) throw new Error(error.message);

    if (!updated) {
      const email = (context.claims.email as string | undefined) ?? "";
      const { error: insertError } = await context.supabase
        .from("profiles")
        .insert({ id: context.userId, full_name: email ? email.split("@")[0] : "Teacher", ...patch });
      if (insertError) throw new Error(insertError.message);
    }
    return { ok: true as const };
  });

export const resetWorkspace = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await resetWorkspaceForUser(context.supabase, context.userId);
    return { ok: true as const };
  });
