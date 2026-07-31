import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import {
  demoClass,
  demoStudents,
  demoTopics,
  type AdjustmentRecord,
  type ClassRecord,
  type CurriculumTopic,
  type EvidenceLog,
  type NccdLevel,
  type NccdPillar,
  type AdjustmentStatus,
  type Student,
  type StudentProfile,
} from "./demo-data";
import { weekNumberFor } from "./term";
import type { TeacherProfile } from "./workspace-types";

type DB = SupabaseClient<Database>;

export type { TeacherProfile } from "./workspace-types";

export interface WorkspacePayload {
  profile: TeacherProfile;
  classes: ClassRecord[];
  students: Student[];
  topics: CurriculumTopic[];
  adjustments: AdjustmentRecord[];
  evidenceLogs: EvidenceLog[];
}

function isoDaysAgo(days: number): string {
  return new Date(Date.now() - days * 86_400_000).toISOString();
}

/* ---------------------------------------------------------------- mapping */

function mapClass(row: Database["public"]["Tables"]["classes"]["Row"]): ClassRecord {
  return { id: row.id, name: row.name, yearLevel: row.year_level, subject: row.subject };
}

function mapStudent(row: Database["public"]["Tables"]["students"]["Row"]): Student {
  return {
    id: row.id,
    classId: row.class_id,
    firstName: row.first_name,
    lastName: row.last_name,
    preferredName: row.preferred_name,
    profile: row.profile as unknown as StudentProfile,
  };
}

function mapTopic(
  row: Database["public"]["Tables"]["curriculum_topics"]["Row"],
): CurriculumTopic {
  return {
    id: row.id,
    subject: row.subject,
    yearLevel: row.year_level,
    topic: row.topic,
    strand: row.strand,
    description: row.description,
  };
}

function mapAdjustment(
  row: Database["public"]["Tables"]["adjustments"]["Row"],
): AdjustmentRecord {
  return {
    id: row.id,
    studentId: row.student_id,
    classId: row.class_id ?? "",
    curriculumTopicId: row.curriculum_topic_id ?? "",
    activityDescription: row.activity_description,
    generatedAdjustment: row.generated_adjustment,
    udlBenefit: row.udl_benefit,
    culturalNote: row.cultural_note,
    traumaNote: row.trauma_note,
    rationale: row.rationale,
    nccdPillar: row.nccd_pillar as NccdPillar,
    evidenceType: row.evidence_type as NccdLevel,
    teacherAction: row.teacher_action,
    status: row.status as AdjustmentStatus,
    createdAt: row.created_at,
    implementedAt: row.implemented_at,
  };
}

function mapEvidence(
  row: Database["public"]["Tables"]["evidence_logs"]["Row"],
): EvidenceLog {
  return {
    id: row.id,
    adjustmentId: row.adjustment_id,
    studentId: row.student_id,
    logDate: row.log_date,
    weekNumber: row.week_number,
    pillar: row.pillar as NccdPillar,
    evidenceSummary: row.evidence_summary,
    source: row.source as EvidenceLog["source"],
    createdAt: row.created_at,
  };
}

export function adjustmentToRow(record: AdjustmentRecord, userId: string) {
  return {
    id: record.id,
    user_id: userId,
    student_id: record.studentId,
    class_id: record.classId || null,
    curriculum_topic_id: record.curriculumTopicId || null,
    activity_description: record.activityDescription,
    generated_adjustment: record.generatedAdjustment,
    udl_benefit: record.udlBenefit,
    cultural_note: record.culturalNote,
    trauma_note: record.traumaNote,
    rationale: record.rationale,
    nccd_pillar: record.nccdPillar,
    evidence_type: record.evidenceType,
    teacher_action: record.teacherAction,
    status: record.status,
    created_at: record.createdAt,
    implemented_at: record.implementedAt,
  };
}

export function evidenceToRow(log: EvidenceLog, userId: string) {
  return {
    id: log.id,
    user_id: userId,
    adjustment_id: log.adjustmentId,
    student_id: log.studentId,
    log_date: log.logDate,
    week_number: log.weekNumber,
    pillar: log.pillar,
    evidence_summary: log.evidenceSummary,
    source: log.source,
    created_at: log.createdAt,
  };
}

/* ---------------------------------------------------------------- seeding */

const SEED_EVIDENCE: Array<{
  student: string;
  daysAgo: number;
  pillar: NccdPillar;
  summary: string;
}> = [
  {
    student: "Aisha",
    daysAgo: 18,
    pillar: "Consultation",
    summary:
      "Phone call with Aisha's mother through an Arabic interpreter. Agreed on a quiet exit signal and confirmed Friday afternoons are not a good time to call.",
  },
  {
    student: "Aisha",
    daysAgo: 11,
    pillar: "Adjustment",
    summary:
      "Provided a visual entry card for group work and seating beside the window. Aisha joined the practical for the full lesson.",
  },
  {
    student: "James",
    daysAgo: 16,
    pillar: "Adjustment",
    summary:
      "Chunked the practical into four written steps with a visual timer. James completed all four steps unprompted.",
  },
  {
    student: "James",
    daysAgo: 6,
    pillar: "Monitoring",
    summary:
      "Tracked on-task time across the double period: 34 of 45 minutes, up from 21 minutes in week 1.",
  },
  {
    student: "Thi",
    daysAgo: 14,
    pillar: "Adjustment",
    summary:
      "Sent the reading passage home 24 hours ahead and offered an oral response option. Thi answered three extension questions verbally.",
  },
  {
    student: "Sarah",
    daysAgo: 9,
    pillar: "Adjustment",
    summary:
      "Laptop and speech-to-text used for the full written response. Output length doubled compared with handwritten work.",
  },
  {
    student: "Bakari",
    daysAgo: 13,
    pillar: "Consultation",
    summary:
      "Met with Bakari and the community liaison officer. Agreed on advance notice for any timetable change and an opt-out for family-themed tasks.",
  },
  {
    student: "Bakari",
    daysAgo: 4,
    pillar: "Monitoring",
    summary:
      "Two schedule changes flagged in advance this week; no withdrawal from class observed on either day.",
  },
  {
    student: "Emma",
    daysAgo: 12,
    pillar: "Adjustment",
    summary:
      "Scheduled sensory break at the 45-minute mark plus advance warning of the noisy demonstration. Emma stayed in the room for the whole lesson.",
  },
  {
    student: "Emma",
    daysAgo: 3,
    pillar: "Review",
    summary:
      "Reviewed the sensory break timing with the learning support team. Keeping the 45-minute cycle for the rest of the term.",
  },
];

async function seedWorkspace(supabase: DB, userId: string): Promise<void> {
  const { data: classRow, error: classError } = await supabase
    .from("classes")
    .insert({
      user_id: userId,
      name: demoClass.name,
      year_level: demoClass.yearLevel,
      subject: demoClass.subject,
    })
    .select()
    .single();
  if (classError || !classRow) throw classError ?? new Error("Could not create the class");

  const { data: studentRows, error: studentError } = await supabase
    .from("students")
    .insert(
      demoStudents.map((s, i) => ({
        user_id: userId,
        class_id: classRow.id,
        first_name: s.firstName,
        last_name: s.lastName,
        preferred_name: s.preferredName,
        profile: s.profile as unknown as Database["public"]["Tables"]["students"]["Insert"]["profile"],
        sort_order: i,
      })),
    )
    .select();
  if (studentError || !studentRows) throw studentError ?? new Error("Could not add students");

  const { data: topicRows, error: topicError } = await supabase
    .from("curriculum_topics")
    .insert(
      demoTopics.map((t, i) => ({
        user_id: userId,
        subject: t.subject,
        year_level: t.yearLevel,
        topic: t.topic,
        strand: t.strand,
        description: t.description,
        sort_order: i,
      })),
    )
    .select();
  if (topicError) throw topicError;

  const byName = new Map(studentRows.map((row) => [row.preferred_name, row.id]));

  const logs = SEED_EVIDENCE.flatMap((entry) => {
    const studentId = byName.get(entry.student);
    if (!studentId) return [];
    const created = isoDaysAgo(entry.daysAgo);
    return [
      {
        user_id: userId,
        student_id: studentId,
        adjustment_id: null,
        log_date: created.slice(0, 10),
        week_number: weekNumberFor(new Date(created)),
        pillar: entry.pillar,
        evidence_summary: entry.summary,
        source: "teacher-recorded",
        created_at: created,
      },
    ];
  });
  if (logs.length) {
    const { error } = await supabase.from("evidence_logs").insert(logs);
    if (error) throw error;
  }

  const firstTopic = topicRows?.[0]?.id ?? null;
  const aisha = byName.get("Aisha");
  const james = byName.get("James");
  const seedAdjustments = [
    aisha && {
      user_id: userId,
      student_id: aisha,
      class_id: classRow.id,
      curriculum_topic_id: firstTopic,
      activity_description: "Group practical: observing evidence of chemical change.",
      generated_adjustment:
        "Give Aisha a named role card (observer/recorder) before the group forms, and seat the group away from the fume cupboard so the extraction fan noise is muted.",
      udl_benefit:
        "A defined role and a written entry point reduce the working-memory load of joining an open-ended group task for every student.",
      cultural_note:
        "Aisha is still building academic English. The role card uses the same five words each lesson so the routine, not the language, carries the meaning.",
      trauma_note:
        "Sudden loud noise is a known trigger. Advance warning of the fan and a visible exit to the quiet corner keep her in control of the space.",
      rationale:
        "Predictable entry plus reduced auditory load addresses the functional impact recorded in her profile without lowering the curriculum expectation.",
      nccd_pillar: "Adjustment",
      evidence_type: "Substantial",
      teacher_action: null,
      status: "implemented",
      created_at: isoDaysAgo(11),
      implemented_at: isoDaysAgo(11),
    },
    james && {
      user_id: userId,
      student_id: james,
      class_id: classRow.id,
      curriculum_topic_id: firstTopic,
      activity_description: "Group practical: observing evidence of chemical change.",
      generated_adjustment:
        "Break the method into four numbered steps on a card at the bench and give James the equipment-manager role so the task stays physical.",
      udl_benefit:
        "Written, chunked steps beside the practical support every student who loses the thread of a spoken method.",
      cultural_note: "No cultural adjustment required for this task.",
      trauma_note: "No trauma-related considerations recorded for James.",
      rationale:
        "Multi-step verbal instruction is the recorded barrier; converting it to written chunks with a movement-based role targets exactly that.",
      nccd_pillar: "Adjustment",
      evidence_type: "Supplementary",
      teacher_action: null,
      status: "implemented",
      created_at: isoDaysAgo(16),
      implemented_at: isoDaysAgo(16),
    },
  ].filter(Boolean) as Database["public"]["Tables"]["adjustments"]["Insert"][];

  if (seedAdjustments.length) {
    const { error } = await supabase.from("adjustments").insert(seedAdjustments);
    if (error) throw error;
  }
}

/* ---------------------------------------------------------------- loading */

export function mapProfile(
  row: Database["public"]["Tables"]["profiles"]["Row"],
): TeacherProfile {
  return {
    id: row.id,
    fullName: row.full_name,
    schoolName: row.school_name,
    state: row.state,
    role: row.role,
    yearLevel: row.year_level,
    assessmentContext: row.assessment_context,
    aiConsent: row.ai_consent,
    aiConsentAt: row.ai_consent_at,
  };
}

async function ensureProfile(
  supabase: DB,
  userId: string,
  fallbackName: string,
): Promise<TeacherProfile> {
  const { data } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  if (data) return mapProfile(data);
  const { data: created, error } = await supabase
    .from("profiles")
    .insert({ id: userId, full_name: fallbackName })
    .select()
    .single();
  if (error || !created) throw error ?? new Error("Could not create your profile");
  return mapProfile(created);
}

export async function loadWorkspaceForUser(
  supabase: DB,
  userId: string,
  fallbackName: string,
): Promise<WorkspacePayload> {
  const profile = await ensureProfile(supabase, userId, fallbackName);

  const { data: existingClasses } = await supabase
    .from("classes")
    .select("*")
    .order("created_at", { ascending: true });

  if (!existingClasses || existingClasses.length === 0) {
    await seedWorkspace(supabase, userId);
  }

  const [classes, students, topics, adjustments, evidenceLogs] = await Promise.all([
    supabase.from("classes").select("*").order("created_at", { ascending: true }),
    supabase.from("students").select("*").order("sort_order", { ascending: true }),
    supabase.from("curriculum_topics").select("*").order("sort_order", { ascending: true }),
    supabase.from("adjustments").select("*").order("created_at", { ascending: false }),
    supabase.from("evidence_logs").select("*").order("created_at", { ascending: false }),
  ]);

  return {
    profile,
    classes: (classes.data ?? []).map(mapClass),
    students: (students.data ?? []).map(mapStudent),
    topics: (topics.data ?? []).map(mapTopic),
    adjustments: (adjustments.data ?? []).map(mapAdjustment),
    evidenceLogs: (evidenceLogs.data ?? []).map(mapEvidence),
  };
}

export async function resetWorkspaceForUser(supabase: DB, userId: string): Promise<void> {
  await supabase.from("evidence_logs").delete().eq("user_id", userId);
  await supabase.from("adjustments").delete().eq("user_id", userId);
  await supabase.from("students").delete().eq("user_id", userId);
  await supabase.from("curriculum_topics").delete().eq("user_id", userId);
  await supabase.from("classes").delete().eq("user_id", userId);
  await seedWorkspace(supabase, userId);
}
