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
