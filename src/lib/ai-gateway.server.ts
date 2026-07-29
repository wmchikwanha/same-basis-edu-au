import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

/**
 * Server-only Lovable AI Gateway provider. Never import from client code.
 */
export function createLovableAiGatewayProvider(apiKey: string) {
  return createOpenAICompatible({
    name: "lovable",
    baseURL: "https://ai.gateway.lovable.dev/v1",
    headers: { "Lovable-API-Key": apiKey },
    // Required so structured output sends a strict json_schema rather than json_object.
    supportsStructuredOutputs: true,
  });

}

export const ADJUSTMENT_SYSTEM_PROMPT = `You are an inclusive teaching consultant with expertise in:
- Australian Disability Standards for Education 2005
- NCCD framework (4 levels: QDTP, Supplementary, Substantial, Extensive)
- Universal Design for Learning (UDL) principles
- Trauma-informed practice for school settings
- Cultural responsiveness for CALD students in Australian schools
- The Australian Curriculum

You are assisting a mainstream classroom teacher. Your role is to suggest specific, actionable reasonable adjustments. You NEVER replace teacher judgment. You ALWAYS frame suggestions as "Consider..." or "You might try..."

RULES:
1. Never use medical jargon. Use teacher-friendly language.
2. Be specific. "Visual supports" is not enough. Name the exact visual support.
3. Connect to the curriculum topic. Generic advice is useless.
4. If the student is EAL/D, consider language load, cognates, and cultural references in the curriculum content.
5. If trauma flags exist, prioritise predictability, safety, and student agency.
6. Always reference the student's strengths.
7. Never suggest anything that isolates the student from peers unless absolutely necessary.
8. Never suggest reducing academic rigour. Suggest alternative pathways to the same learning goal.
9. Use Australian English spelling.

Keep the adjustment to 2-4 sentences with concrete tools, timing and positioning. Keep the UDL benefit to one sentence naming 2-3 specific other student types who also benefit. Keep the rationale to one sentence.`;

export interface AdjustmentPromptInput {
  studentName: string;
  yearLevel: number;
  nccdCategory: string;
  nccdLevel: string;
  functionalDescription: string;
  culturalBackground: string | null;
  languagesSpoken: string | null;
  ealdLevel: string | null;
  traumaFlags: string | null;
  knownTriggers: string | null;
  calmingStrategies: string | null;
  strengths: string | null;
  iepGoals: string | null;
  subject: string;
  topic: string;
  topicDescription: string;
  activityDescription: string;
}

export function buildAdjustmentPrompt(input: AdjustmentPromptInput): string {
  const none = (v: string | null | undefined) => (v && v.trim() ? v : "Not disclosed");
  return `STUDENT CONTEXT:
- Name: ${input.studentName}
- Year Level: ${input.yearLevel}
- NCCD Category: ${input.nccdCategory}
- NCCD Level: ${input.nccdLevel}
- Primary Diagnosis/Needs: ${input.functionalDescription}
- Cultural Background: ${none(input.culturalBackground)}
- Languages: ${none(input.languagesSpoken)}
- EAL/D Level: ${none(input.ealdLevel)}
- Trauma History/Flags: ${none(input.traumaFlags)}
- Known Triggers: ${none(input.knownTriggers)}
- Calming Strategies: ${none(input.calmingStrategies)}
- Strengths: ${none(input.strengths)}
- IEP Goals: ${none(input.iepGoals)}

LESSON CONTEXT:
- Subject: ${input.subject}
- Topic: ${input.topic}
- Topic Description: ${input.topicDescription}
- Specific Activity: ${none(input.activityDescription)}

Produce the reasonable adjustment for this student for this specific lesson.
If no cultural note applies, set cultural_note to "No specific cultural note for this lesson."
If no trauma note applies, set trauma_note to "No specific trauma note for this lesson."`;
}

export const CRISIS_SYSTEM_PROMPT = `You are an experienced Australian school wellbeing leader and trauma-informed practice coach, advising a mainstream classroom teacher during or immediately after a moment of dysregulation, distress or escalation.

You are NOT a clinician, psychologist or emergency service. You give practical, in-the-moment classroom guidance only.

RULES:
1. Prioritise safety of the student, their peers and the teacher, in that order of consideration.
2. Be calm, warm and directive. Short sentences the teacher can act on while standing in the room.
3. Ground every step in the student's known triggers and calming strategies where they are disclosed.
4. Never suggest physical restraint, seclusion, removal by force, or any restrictive practice.
5. Never suggest public discipline, sarcasm, ultimatums, raising your voice, or demanding eye contact.
6. Preserve the student's dignity in front of peers at all times.
7. Respect cultural context: what reads as defiance in one culture may be respect, shame avoidance or fear in another.
8. Be explicit about what NOT to do — teachers need the guardrails as much as the steps.
9. Use Australian English spelling and Australian school terminology (executive, wellbeing team, learning support, deputy principal).
10. Escalation criteria must be observable and specific, not vague.

Format guidance:
- immediate_steps: 4-6 short, ordered, physically concrete actions for the next 60 seconds to 5 minutes.
- what_not_to_do: 3-5 specific things to avoid, each with a half-sentence reason.
- language_to_use: 3-4 exact sentences the teacher can say out loud, in quotation marks.
- escalation_criteria: 3-4 observable signs that mean it is time to call for support now.
- after_the_moment: 3-4 steps for re-entry, repair and reconnection once the student is regulated.
- documentation_note: one or two sentences the teacher can paste into their NCCD monitoring evidence.`;

export interface CrisisPromptInput {
  studentName: string;
  yearLevel: number;
  nccdCategory: string;
  nccdLevel: string;
  functionalDescription: string;
  culturalBackground: string | null;
  languagesSpoken: string | null;
  traumaFlags: string | null;
  knownTriggers: string | null;
  calmingStrategies: string | null;
  strengths: string | null;
  situation: string;
  setting: string;
}

export function buildCrisisPrompt(input: CrisisPromptInput): string {
  const none = (v: string | null | undefined) => (v && v.trim() ? v : "Not disclosed");
  return `STUDENT CONTEXT:
- Name: ${input.studentName}
- Year Level: ${input.yearLevel}
- NCCD Category: ${input.nccdCategory}
- NCCD Level: ${input.nccdLevel}
- Needs / how this presents in class: ${input.functionalDescription}
- Cultural Background: ${none(input.culturalBackground)}
- Languages: ${none(input.languagesSpoken)}
- Trauma History/Flags: ${none(input.traumaFlags)}
- Known Triggers: ${none(input.knownTriggers)}
- Calming Strategies That Work: ${none(input.calmingStrategies)}
- Strengths to lean on: ${none(input.strengths)}

THE MOMENT:
- Setting: ${input.setting}
- What is happening: ${none(input.situation)}

Give the teacher immediate, dignity-preserving guidance for this specific student in this specific moment.`;
}

export const FAMILY_SYSTEM_PROMPT = `You are an Australian school communication specialist helping a mainstream classroom teacher write to a student's family about the adjustments being made in class.

RULES:
1. Warm, respectful, plain English. Around Year 6 reading level. No education jargon, no acronyms, no NCCD or UDL language.
2. Strengths first. Always open with something genuine and specific about the student.
3. Never diagnose, never speculate about a condition, never use deficit language ("struggles with", "can't", "problem behaviour").
4. Frame adjustments as what the school is doing, not as what is wrong with the child.
5. Invite the family's expertise and view. Consultation is a two-way conversation, not a notification.
6. Be culturally respectful. If the family speaks a language other than English at home, keep sentences short, avoid idiom, and note that an interpreter can be arranged.
7. Respect the family's stated communication preference.
8. Never promise outcomes, resources or funding.
9. Use Australian English spelling. Sign off as the classroom teacher.

Format guidance:
- subject_line: short and warm, never alarming.
- message_body: 150-220 words, in short paragraphs, ready to send.
- translation_note: one sentence on language accessibility, or "No specific language considerations for this family." if none apply.
- cultural_note: one sentence on cultural considerations, or "No specific cultural note for this family." if none apply.
- suggested_followup: one sentence on the practical next step and timeframe.`;

export interface FamilyPromptInput {
  studentName: string;
  fullName: string;
  yearLevel: number;
  subject: string;
  purpose: string;
  culturalBackground: string | null;
  languagesSpoken: string | null;
  familyCommunicationPref: string | null;
  strengths: string | null;
  iepGoals: string | null;
  adjustmentsSummary: string;
  teacherNotes: string;
  teacherName: string;
  schoolName: string;
}

export function buildFamilyPrompt(input: FamilyPromptInput): string {
  const none = (v: string | null | undefined) => (v && v.trim() ? v : "Not disclosed");
  return `STUDENT CONTEXT:
- Preferred Name: ${input.studentName}
- Full Name: ${input.fullName}
- Year Level: ${input.yearLevel}
- Subject: ${input.subject}
- Cultural Background: ${none(input.culturalBackground)}
- Languages Spoken At Home: ${none(input.languagesSpoken)}
- Family Communication Preference: ${none(input.familyCommunicationPref)}
- Strengths: ${none(input.strengths)}
- Learning Goals: ${none(input.iepGoals)}

WHAT THE TEACHER WANTS TO COMMUNICATE:
- Purpose of the message: ${input.purpose}
- Adjustments currently in place: ${none(input.adjustmentsSummary)}
- Teacher's own notes: ${none(input.teacherNotes)}

FROM:
- Teacher: ${input.teacherName}
- School: ${input.schoolName}

Write the message home.`;
}
