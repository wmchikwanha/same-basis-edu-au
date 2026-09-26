import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database, Json } from "@/integrations/supabase/types";
import { logGovernance } from "./governance.server";
import type { SchoolData } from "./admin-types";

type DB = SupabaseClient<Database>;

const NCCD_CATEGORIES = ["Cognitive", "Social-Emotional", "Physical", "Sensory"] as const;
const NCCD_LEVELS = ["QDTP", "Supplementary", "Substantial", "Extensive"] as const;

/** Verifies the caller is a school admin, using their own RLS-scoped client. */
async function requireAdmin(supabase: DB, userId: string) {
  const [{ data: isAdmin }, { data: schoolId }] = await Promise.all([
    supabase.rpc("has_role", { _user_id: userId, _role: "admin" }),
    supabase.rpc("user_school_id", { _user_id: userId }),
  ]);
  if (!isAdmin || !schoolId) throw new Error("Only school administrators can do this.");
  return schoolId as string;
}

async function teacherIdsFor(supabase: DB, schoolId: string) {
  const { data } = await supabase
    .from("school_members")
    .select("user_id, active, created_at")
    .eq("school_id", schoolId);
  return data ?? [];
}

async function assertTeacherInSchool(supabase: DB, schoolId: string, teacherId: string) {
  const members = await teacherIdsFor(supabase, schoolId);
  if (!members.some((m) => m.user_id === teacherId)) {
    throw new Error("That teacher is not part of your school.");
  }
}

/* ----------------------------------------------------------- role lookup */

export const getMyRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    return { isAdmin: Boolean(data) };
  });

/* ------------------------------------------------------------ school data */

export const getSchoolData = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<SchoolData> => {
    const { supabase, userId } = context;
    const schoolId = await requireAdmin(supabase, userId);
    const members = await teacherIdsFor(supabase, schoolId);
    const ids = members.map((m) => m.user_id);

    const [school, profiles, roles, classes, students, adjustments, evidence, activity, flags, governance] =
      await Promise.all([
        supabase.from("schools").select("*").eq("id", schoolId).single(),
        supabase.from("profiles").select("*").in("id", ids),
        supabase.from("user_roles").select("user_id, role").in("user_id", ids),
        supabase.from("classes").select("*").in("user_id", ids).order("created_at"),
        supabase.from("students").select("*").in("user_id", ids).order("sort_order"),
        supabase
          .from("adjustments")
          .select("id, user_id, student_id, status, nccd_pillar, generated_adjustment, teacher_action, created_at, implemented_at")
          .in("user_id", ids)
          .order("created_at", { ascending: false }),
        supabase
          .from("evidence_logs")
          .select("id, user_id, student_id, pillar, evidence_summary, log_date, source, created_at")
          .in("user_id", ids)
          .order("created_at", { ascending: false }),
        supabase
          .from("ai_activity_events")
          .select("id, user_id, student_id, event_type, surface, summary, duration_ms, success, created_at")
          .in("user_id", ids)
          .order("created_at", { ascending: false })
          .limit(1000),
        supabase.from("equity_flags").select("*").in("user_id", ids).order("created_at", { ascending: false }),
        supabase
          .from("governance_events")
          .select("*")
          .eq("school_id", schoolId)
          .order("created_at", { ascending: false })
          .limit(1000),
      ]);

    // Emails live in the auth system; read them only after the admin check above.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const emails = new Map<string, string>();
    await Promise.all(
      ids.map(async (id) => {
        const { data } = await supabaseAdmin.auth.admin.getUserById(id);
        if (data.user?.email) emails.set(id, data.user.email);
      }),
    );

    const adminIds = new Set((roles.data ?? []).filter((r) => r.role === "admin").map((r) => r.user_id));

    return {
      school: { id: schoolId, name: school.data?.name ?? "School" },
      currentUserId: userId,
      teachers: members.map((m) => {
        const p = (profiles.data ?? []).find((x) => x.id === m.user_id);
        return {
          id: m.user_id,
          fullName: p?.full_name ?? "Teacher",
          email: emails.get(m.user_id) ?? "",
          role: p?.role ?? "Classroom Teacher",
          yearLevel: p?.year_level ?? 8,
          active: m.active,
          isAdmin: adminIds.has(m.user_id),
          aiConsent: p?.ai_consent ?? false,
          aiConsentAt: p?.ai_consent_at ?? null,
          joinedAt: m.created_at,
        };
      }),
      classes: (classes.data ?? []).map((c) => ({
        id: c.id,
        teacherId: c.user_id,
        name: c.name,
        yearLevel: c.year_level,
        subject: c.subject,
      })),
      students: (students.data ?? []).map((s) => ({
        id: s.id,
        teacherId: s.user_id,
        classId: s.class_id,
        firstName: s.first_name,
        lastName: s.last_name,
        preferredName: s.preferred_name,
        profile: s.profile as unknown as SchoolData["students"][number]["profile"],
      })),
      adjustments: (adjustments.data ?? []).map((a) => ({
        id: a.id,
        teacherId: a.user_id,
        studentId: a.student_id,
        status: a.status,
        pillar: a.nccd_pillar,
        text: a.generated_adjustment,
        teacherAction: a.teacher_action,
        createdAt: a.created_at,
      })),
      evidence: (evidence.data ?? []).map((e) => ({
        id: e.id,
        teacherId: e.user_id,
        studentId: e.student_id,
        pillar: e.pillar,
        summary: e.evidence_summary,
        logDate: e.log_date,
        source: e.source,
      })),
      activity: (activity.data ?? []).map((a) => ({
        id: a.id,
        teacherId: a.user_id,
        studentId: a.student_id,
        eventType: a.event_type,
        surface: a.surface,
        summary: a.summary,
        durationMs: a.duration_ms,
        success: a.success,
        createdAt: a.created_at,
      })),
      flags: (flags.data ?? []).map((f) => ({
        id: f.id,
        teacherId: f.user_id,
        studentId: f.student_id,
        surface: f.surface,
        category: f.category,
        phrase: f.phrase,
        reason: f.reason,
        severity: f.severity,
        excerpt: f.excerpt,
        detector: f.detector,
        status: f.status,
        resolutionNote: f.resolution_note,
        resolvedAt: f.resolved_at,
        createdAt: f.created_at,
      })),
      governance: (governance.data ?? []).map((g) => ({
        id: g.id,
        actorId: g.actor_id,
        actorName: g.actor_name,
        category: g.category,
        eventType: g.event_type,
        targetType: g.target_type,
        targetId: g.target_id,
        summary: g.summary,
        createdAt: g.created_at,
      })),
    };
  });

/* --------------------------------------------------------- teacher admin */

export const createTeacher = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        fullName: z.string().trim().min(2).max(80),
        email: z.string().trim().email().max(160),
        password: z.string().min(8).max(72),
        yearLevel: z.number().int().min(1).max(12),
        role: z.string().trim().min(2).max(60).default("Classroom Teacher"),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const schoolId = await requireAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: school } = await supabaseAdmin.from("schools").select("name").eq("id", schoolId).single();

    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email.toLowerCase(),
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: data.fullName },
    });
    if (error || !created.user) {
      throw new Error(
        error?.message?.includes("already") ? "An account with that email already exists." : "Could not create the account.",
      );
    }
    const teacherId = created.user.id;
    await supabaseAdmin.from("school_members").insert({ user_id: teacherId, school_id: schoolId });
    await supabaseAdmin.from("user_roles").insert({ user_id: teacherId, role: "teacher" });
    await supabaseAdmin.from("profiles").upsert({
      id: teacherId,
      full_name: data.fullName,
      role: data.role,
      year_level: data.yearLevel,
      school_name: school?.name ?? "School",
    });
    await logGovernance(context.supabase, context.userId, {
      category: "admin",
      eventType: "teacher_created",
      targetType: "teacher",
      targetId: teacherId,
      summary: `Created teacher account for ${data.fullName} (${data.email.toLowerCase()}).`,
    });
    return { ok: true as const, teacherId };
  });

export const setTeacherActive = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ teacherId: z.string().uuid(), active: z.boolean() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const schoolId = await requireAdmin(context.supabase, context.userId);
    if (data.teacherId === context.userId) throw new Error("You can't deactivate your own account.");
    await assertTeacherInSchool(context.supabase, schoolId, data.teacherId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("school_members").update({ active: data.active }).eq("user_id", data.teacherId);
    await supabaseAdmin.auth.admin.updateUserById(data.teacherId, {
      ban_duration: data.active ? "none" : "876000h",
    });
    await logGovernance(context.supabase, context.userId, {
      category: "admin",
      eventType: data.active ? "teacher_reactivated" : "teacher_deactivated",
      targetType: "teacher",
      targetId: data.teacherId,
      summary: data.active
        ? "Teacher account reactivated. Sign-in restored."
        : "Teacher account deactivated. Sign-in blocked; all records retained.",
    });
    return { ok: true as const };
  });

/* ---------------------------------------------------- classes & students */

export const createClassForTeacher = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        teacherId: z.string().uuid(),
        name: z.string().trim().min(1).max(80),
        yearLevel: z.number().int().min(1).max(12),
        subject: z.string().trim().min(1).max(60),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const schoolId = await requireAdmin(context.supabase, context.userId);
    await assertTeacherInSchool(context.supabase, schoolId, data.teacherId);
    const { data: row, error } = await context.supabase
      .from("classes")
      .insert({ user_id: data.teacherId, name: data.name, year_level: data.yearLevel, subject: data.subject })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    await logGovernance(context.supabase, context.userId, {
      category: "admin",
      eventType: "class_created",
      targetType: "class",
      targetId: row.id,
      summary: `Created class ${data.name} (Year ${data.yearLevel} ${data.subject}).`,
      details: { teacherId: data.teacherId },
    });
    return { ok: true as const };
  });

const StudentInput = z.object({
  classId: z.string().uuid(),
  firstName: z.string().trim().min(1).max(60),
  lastName: z.string().trim().min(1).max(60),
  preferredName: z.string().trim().max(60).optional(),
  nccdCategory: z.enum(NCCD_CATEGORIES),
  nccdLevel: z.enum(NCCD_LEVELS),
  functionalDescription: z.string().trim().max(1000).default(""),
  culturalBackground: z.string().trim().max(200).optional(),
  ealdLevel: z.string().trim().max(60).optional(),
  strengths: z.string().trim().max(500).optional(),
});

function studentProfile(s: z.infer<typeof StudentInput>): Json {
  return {
    nccdCategory: s.nccdCategory,
    nccdLevel: s.nccdLevel,
    primaryDiagnosis: null,
    functionalDescription: s.functionalDescription,
    culturalBackground: s.culturalBackground || null,
    languagesSpoken: null,
    ealdLevel: s.ealdLevel || null,
    traumaFlags: null,
    knownTriggers: null,
    calmingStrategies: null,
    familyCommunicationPref: null,
    strengths: s.strengths || null,
    iepGoals: null,
  };
}

async function classOwner(supabase: DB, classId: string) {
  const { data } = await supabase.from("classes").select("id, user_id, name").eq("id", classId).maybeSingle();
  if (!data) throw new Error("That class is not in your school.");
  return data;
}

export const addStudentForSchool = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => StudentInput.parse(input))
  .handler(async ({ data, context }) => {
    await requireAdmin(context.supabase, context.userId);
    const klass = await classOwner(context.supabase, data.classId);
    const { data: row, error } = await context.supabase
      .from("students")
      .insert({
        user_id: klass.user_id,
        class_id: klass.id,
        first_name: data.firstName,
        last_name: data.lastName,
        preferred_name: data.preferredName || data.firstName,
        profile: studentProfile(data),
        sort_order: 999,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    await logGovernance(context.supabase, context.userId, {
      category: "admin",
      eventType: "student_added",
      targetType: "student",
      targetId: row.id,
      summary: `Added student ${data.preferredName || data.firstName} ${data.lastName} to ${klass.name}.`,
    });
    return { ok: true as const };
  });

export const moveStudent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ studentId: z.string().uuid(), classId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await requireAdmin(context.supabase, context.userId);
    const klass = await classOwner(context.supabase, data.classId);
    const { error } = await context.supabase
      .from("students")
      .update({ class_id: klass.id, user_id: klass.user_id })
      .eq("id", data.studentId);
    if (error) throw new Error(error.message);
    await logGovernance(context.supabase, context.userId, {
      category: "admin",
      eventType: "student_moved",
      targetType: "student",
      targetId: data.studentId,
      summary: `Moved student to ${klass.name}. Previous evidence stays with the recording teacher.`,
    });
    return { ok: true as const };
  });

export const importSchoolStudents = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        rows: z
          .array(StudentInput.omit({ classId: true }).extend({ teacherEmail: z.string().email(), className: z.string().min(1).max(80) }))
          .max(500),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const schoolId = await requireAdmin(context.supabase, context.userId);
    const members = await teacherIdsFor(context.supabase, schoolId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const byEmail = new Map<string, string>();
    await Promise.all(
      members.map(async (m) => {
        const { data: u } = await supabaseAdmin.auth.admin.getUserById(m.user_id);
        if (u.user?.email) byEmail.set(u.user.email.toLowerCase(), m.user_id);
      }),
    );
    const { data: classes } = await context.supabase
      .from("classes")
      .select("id, user_id, name")
      .in("user_id", members.map((m) => m.user_id));

    const errors: string[] = [];
    let added = 0;
    for (const [i, row] of data.rows.entries()) {
      const teacherId = byEmail.get(row.teacherEmail.toLowerCase());
      if (!teacherId) {
        errors.push(`Row ${i + 2}: no teacher with email ${row.teacherEmail} in this school.`);
        continue;
      }
      const klass = (classes ?? []).find(
        (c) => c.user_id === teacherId && c.name.trim().toLowerCase() === row.className.trim().toLowerCase(),
      );
      if (!klass) {
        errors.push(`Row ${i + 2}: class "${row.className}" not found for ${row.teacherEmail}.`);
        continue;
      }
      const { error } = await context.supabase.from("students").insert({
        user_id: teacherId,
        class_id: klass.id,
        first_name: row.firstName,
        last_name: row.lastName,
        preferred_name: row.preferredName || row.firstName,
        profile: studentProfile({ ...row, classId: klass.id }),
        sort_order: 999,
      });
      if (error) errors.push(`Row ${i + 2}: ${error.message}`);
      else added++;
    }
    await logGovernance(context.supabase, context.userId, {
      category: "data",
      eventType: "school_import",
      summary: `Whole-school student import: ${added} added, ${errors.length} rejected.`,
    });
    return { added, errors };
  });

/* ----------------------------------------------------------- equity flags */

export const resolveEquityFlag = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        flagId: z.string().uuid(),
        status: z.enum(["resolved-appropriate", "resolved-followed-up", "open"]),
        note: z.string().trim().min(3).max(600),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await requireAdmin(context.supabase, context.userId);
    const { data: row, error } = await context.supabase
      .from("equity_flags")
      .update({
        status: data.status,
        resolution_note: data.note,
        resolved_by: context.userId,
        resolved_at: new Date().toISOString(),
      })
      .eq("id", data.flagId)
      .select("id, category")
      .single();
    if (error) throw new Error(error.message);
    await logGovernance(context.supabase, context.userId, {
      category: "equity",
      eventType: "equity_flag_reviewed",
      targetType: "equity_flag",
      targetId: row.id,
      summary: `Equity flag (${row.category}) marked ${data.status}: ${data.note}`,
    });
    return { ok: true as const };
  });

export const logAdminExport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ summary: z.string().max(300) }).parse(input))
  .handler(async ({ data, context }) => {
    await requireAdmin(context.supabase, context.userId);
    await logGovernance(context.supabase, context.userId, {
      category: "data",
      eventType: "exported",
      summary: data.summary,
    });
    return { ok: true as const };
  });
