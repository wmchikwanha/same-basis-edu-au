import { z } from "zod";

export const CrisisInput = z.object({
  studentName: z.string(),
  yearLevel: z.number(),
  nccdCategory: z.string(),
  nccdLevel: z.string(),
  functionalDescription: z.string(),
  culturalBackground: z.string().nullable(),
  languagesSpoken: z.string().nullable(),
  traumaFlags: z.string().nullable(),
  knownTriggers: z.string().nullable(),
  calmingStrategies: z.string().nullable(),
  strengths: z.string().nullable(),
  situation: z.string(),
  setting: z.string(),
});

export const CrisisOutput = z.object({
  immediate_steps: z.array(z.string()),
  what_not_to_do: z.array(z.string()),
  language_to_use: z.array(z.string()),
  escalation_criteria: z.array(z.string()),
  after_the_moment: z.array(z.string()),
  documentation_note: z.string(),
});

export type CrisisGuidance = z.infer<typeof CrisisOutput>;

export const FamilyInput = z.object({
  studentName: z.string(),
  fullName: z.string(),
  yearLevel: z.number(),
  subject: z.string(),
  purpose: z.string(),
  culturalBackground: z.string().nullable(),
  languagesSpoken: z.string().nullable(),
  familyCommunicationPref: z.string().nullable(),
  strengths: z.string().nullable(),
  iepGoals: z.string().nullable(),
  adjustmentsSummary: z.string(),
  teacherNotes: z.string(),
  teacherName: z.string(),
  schoolName: z.string(),
});

export const FamilyOutput = z.object({
  subject_line: z.string(),
  message_body: z.string(),
  translation_note: z.string(),
  cultural_note: z.string(),
  suggested_followup: z.string(),
});

export type FamilyMessage = z.infer<typeof FamilyOutput>;
