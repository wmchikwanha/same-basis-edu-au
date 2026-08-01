import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { weekNumberFor } from "./term";

const ClassRow = z.object({
  name: z.string().min(1).max(120),
  yearLevel: z.number().int().min(1).max(12),
  subject: z.string().min(1).max(80),
});

const StudentRow = z.object({
  className: z.string().min(1).max(120),
  firstName: z.string().min(1).max(80),
  lastName: z.string().min(1).max(80),
  preferredName: z.string().max(80).default(""),
  nccdCategory: z.string().max(40).default("Cognitive"),
  nccdLevel: z.string().max(40).default("Supplementary"),
  primaryDiagnosis: z.string().max(200).default(""),
  functionalDescription: z.string().max(1200).default(""),
  culturalBackground: z.string().max(200).default(""),
  languagesSpoken: z.string().max(200).default(""),
  ealdLevel: z.string().max(40).default(""),
  traumaFlags: z.string().max(600).default(""),
  knownTriggers: z.string().max(600).default(""),
  calmingStrategies: z.string().max(600).default(""),
  familyCommunicationPref: z.string().max(400).default(""),
  strengths: z.string().max(600).default(""),
  iepGoals: z.string().max(600).default(""),
});

const EvidenceRow = z.object({
  studentName: z.string().min(1).max(120),
  logDate: z.string().min(8).max(10),
  pillar: z.string().max(40).default("Adjustment"),
  evidenceSummary: z.string().min(1).max(1000),
  source: z.string().max(40).default("teacher-recorded"),
});

const ImportSchema = z.object({
  classes: z.array(ClassRow).max(50).default([]),
  students: z.array(StudentRow).max(300).default([]),
  evidence: z.array(EvidenceRow).max(500).default([]),
});

const orBlank = (value: string) => (value.trim() ? value.trim() : null);

export const importWorkspaceData = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ImportSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const errors: string[] = [];
    let classesAdded = 0;
    let studentsAdded = 0;
    let evidenceAdded = 0;

    // --- classes ---------------------------------------------------------
    const { data: existingClasses } = await supabase
      .from("classes")
      .select("id, name")
      .eq("user_id", userId);
    const classByName = new Map(
      (existingClasses ?? []).map((c) => [c.name.trim().toLowerCase(), c.id]),
    );

    for (const row of data.classes) {
      const key = row.name.trim().toLowerCase();
      if (classByName.has(key)) {
        errors.push(`Class "${row.name}" already exists — skipped.`);
        continue;
      }
      const { data: created, error } = await supabase
        .from("classes")
        .insert({
          user_id: userId,
          name: row.name.trim(),
          year_level: row.yearLevel,
          subject: row.subject.trim(),
        })
        .select("id, name")
        .single();
      if (error || !created) {
        errors.push(`Class "${row.name}" could not be saved.`);
        continue;
      }
      classByName.set(key, created.id);
      classesAdded += 1;
    }

    // --- students --------------------------------------------------------
    const { data: existingStudents } = await supabase
      .from("students")
      .select("id, preferred_name, first_name, sort_order")
      .eq("user_id", userId);
    const studentByName = new Map<string, string>();
    for (const s of existingStudents ?? []) {
      studentByName.set(s.preferred_name.trim().toLowerCase(), s.id);
      studentByName.set(s.first_name.trim().toLowerCase(), s.id);
    }
    let sortOrder = (existingStudents ?? []).length;

    for (const row of data.students) {
      const classId = classByName.get(row.className.trim().toLowerCase());
      if (!classId) {
        errors.push(`${row.firstName}: class "${row.className}" not found — skipped.`);
        continue;
      }
      const preferred = row.preferredName.trim() || row.firstName.trim();
      const { data: created, error } = await supabase
        .from("students")
        .insert({
          user_id: userId,
          class_id: classId,
          first_name: row.firstName.trim(),
          last_name: row.lastName.trim(),
          preferred_name: preferred,
          sort_order: sortOrder++,
          profile: {
            nccdCategory: row.nccdCategory.trim() || "Cognitive",
            nccdLevel: row.nccdLevel.trim() || "Supplementary",
            primaryDiagnosis: orBlank(row.primaryDiagnosis),
            functionalDescription: row.functionalDescription.trim(),
            culturalBackground: orBlank(row.culturalBackground),
            languagesSpoken: orBlank(row.languagesSpoken),
            ealdLevel: orBlank(row.ealdLevel),
            traumaFlags: orBlank(row.traumaFlags),
            knownTriggers: orBlank(row.knownTriggers),
            calmingStrategies: orBlank(row.calmingStrategies),
            familyCommunicationPref: orBlank(row.familyCommunicationPref),
            strengths: orBlank(row.strengths),
            iepGoals: orBlank(row.iepGoals),
          },
        })
        .select("id")
        .single();
      if (error || !created) {
        errors.push(`${row.firstName} could not be saved.`);
        continue;
      }
      studentByName.set(preferred.toLowerCase(), created.id);
      studentsAdded += 1;
    }

    // --- evidence --------------------------------------------------------
    for (const row of data.evidence) {
      const studentId = studentByName.get(row.studentName.trim().toLowerCase());
      if (!studentId) {
        errors.push(`Evidence for "${row.studentName}": no matching student — skipped.`);
        continue;
      }
      const date = new Date(row.logDate);
      if (Number.isNaN(date.getTime())) {
        errors.push(`Evidence for "${row.studentName}": date "${row.logDate}" not understood.`);
        continue;
      }
      const { error } = await supabase.from("evidence_logs").insert({
        user_id: userId,
        student_id: studentId,
        log_date: date.toISOString().slice(0, 10),
        week_number: weekNumberFor(date),
        pillar: row.pillar.trim() || "Adjustment",
        evidence_summary: row.evidenceSummary.trim(),
        source: row.source.trim() || "teacher-recorded",
      });
      if (error) {
        errors.push(`Evidence for "${row.studentName}" could not be saved.`);
        continue;
      }
      evidenceAdded += 1;
    }

    await supabase.from("ai_activity_events").insert({
      user_id: userId,
      event_type: "imported",
      surface: "import",
      summary: `Imported ${classesAdded} classes, ${studentsAdded} students, ${evidenceAdded} evidence entries${
        errors.length ? ` (${errors.length} rows skipped)` : ""
      }.`,
      success: errors.length === 0,
    });

    return { classesAdded, studentsAdded, evidenceAdded, errors: errors.slice(0, 25) };
  });
