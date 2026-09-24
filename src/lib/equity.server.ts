import type { SupabaseClient } from "@supabase/supabase-js";
import { generateText, Output } from "ai";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";
import { logGovernance } from "./governance.server";
import type { EquityFlagDraft } from "./equity-types";

type DB = SupabaseClient<Database>;

interface Rule {
  pattern: RegExp;
  category: EquityFlagDraft["category"];
  severity: EquityFlagDraft["severity"];
  reason: string;
}

/**
 * Deterministic zero-discrimination lexicon. Grounded in the Disability
 * Standards for Education 2005 (adjustments must enable participation "on the
 * same basis") and strengths-based, culturally safe practice.
 */
const RULES: Rule[] = [
  {
    pattern: /\b(exclude[ds]?|excluding|exclusion)\s+(him|her|them|from|the student)\b/i,
    category: "exclusion",
    severity: "high",
    reason: "Suggests excluding the student rather than adjusting access to the same activity.",
  },
  {
    pattern: /\b(separate|different|another)\s+(room|classroom|space)\s+(for the (whole|entire)|all lesson|for the lesson)\b/i,
    category: "exclusion",
    severity: "high",
    reason: "Removes the student from the learning environment for the lesson.",
  },
  {
    pattern: /\b(sit out|skip the (task|activity|practical)|excused from|exempt(ed)? from)\b/i,
    category: "exclusion",
    severity: "medium",
    reason: "Opts the student out of the learning rather than adjusting how they access it.",
  },
  {
    pattern: /\b(lower(ed)? (the )?expectations?|easier (outcome|standard)|reduce the (outcome|standard)|simplif(y|ied) the (outcome|curriculum|standard))\b/i,
    category: "lowered-expectations",
    severity: "high",
    reason: "Changes the curriculum outcome instead of the access pathway (Standards 2005, same basis).",
  },
  {
    pattern: /\b(can'?t|cannot|unable to) (learn|understand|cope|keep up)\b/i,
    category: "deficit-language",
    severity: "medium",
    reason: "Deficit framing about capability — describe functional impact and supports instead.",
  },
  {
    pattern: /\b(suffers? from|afflicted|wheelchair[- ]bound|confined to a wheelchair|retarded|slow learner|low[- ]functioning|high[- ]functioning|handicapped|normal (students|kids|children))\b/i,
    category: "stigmatising-language",
    severity: "high",
    reason: "Stigmatising or outdated disability language — use person-first or identity-first respectful terms.",
  },
  {
    pattern: /\b(naughty|attention[- ]seeking|manipulative|lazy|defiant child|problem child|troublemaker)\b/i,
    category: "deficit-language",
    severity: "medium",
    reason: "Labels behaviour as character — trauma-informed practice describes the need behind behaviour.",
  },
  {
    pattern: /\b(people from (his|her|their) culture|in (his|her|their) culture (they|people) (all|always|usually)|(africans|asians|arabs|refugees|aboriginal people|migrants) (are|tend to|usually|always))\b/i,
    category: "cultural-stereotyping",
    severity: "high",
    reason: "Generalises about a cultural or ethnic group — refer only to this student's own recorded context.",
  },
  {
    pattern: /\b(poor english|broken english|no english)\b/i,
    category: "deficit-language",
    severity: "low",
    reason: "Deficit framing of language — describe EAL/D phase and home-language strengths.",
  },
];

function excerptAround(text: string, index: number, length: number) {
  const start = Math.max(0, index - 60);
  const end = Math.min(text.length, index + length + 60);
  return `${start > 0 ? "…" : ""}${text.slice(start, end)}${end < text.length ? "…" : ""}`;
}

export function screenWithRules(texts: string[]): EquityFlagDraft[] {
  const flags: EquityFlagDraft[] = [];
  const joined = texts.filter(Boolean).join("\n");
  for (const rule of RULES) {
    const match = rule.pattern.exec(joined);
    if (match) {
      flags.push({
        category: rule.category,
        severity: rule.severity,
        phrase: match[0],
        reason: rule.reason,
        excerpt: excerptAround(joined, match.index, match[0].length),
        detector: "rules",
      });
    }
  }
  return flags;
}

const AiCheck = z.object({
  concerns: z.array(
    z.object({
      category: z.enum([
        "exclusion",
        "lowered-expectations",
        "deficit-language",
        "stigmatising-language",
        "cultural-stereotyping",
      ]),
      severity: z.enum(["low", "medium", "high"]),
      phrase: z.string(),
      reason: z.string(),
    }),
  ),
});

async function screenWithAi(text: string): Promise<EquityFlagDraft[]> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) return [];
  const gateway = createLovableAiGatewayProvider(key);
  try {
    const { output } = await generateText({
      model: gateway("openai/gpt-5.6-sol"),
      system:
        "You are an equity and anti-discrimination reviewer for Australian schools (Disability Discrimination Act 1992, Disability Standards for Education 2005). Review teacher guidance for: excluding the student, lowering curriculum expectations instead of adjusting access, deficit or stigmatising disability language, labelling behaviour as character, and cultural stereotyping. Only report clear, quotable concerns. Return an empty list when the text is appropriate. Never flag respectful, strengths-based adjustments.",
      prompt: `Text to review:\n"""\n${text.slice(0, 4000)}\n"""`,
      output: Output.object({ schema: AiCheck }),
      providerOptions: { lovable: { reasoningEffort: "none" } },
      abortSignal: AbortSignal.timeout(12_000),
    });
    return (output as z.infer<typeof AiCheck>).concerns.slice(0, 4).map((c) => ({
      ...c,
      phrase: c.phrase.slice(0, 200),
      excerpt: c.phrase.slice(0, 300),
      detector: "ai-review" as const,
    }));
  } catch (error) {
    console.error("equity AI review skipped", error instanceof Error ? error.message : error);
    return [];
  }
}

/**
 * Screens AI output before a teacher sees it, stores any flags against the
 * teacher (visible to the school admin) and writes to the governance log.
 */
export async function screenAndRecord(
  supabase: DB,
  userId: string,
  input: { surface: string; studentId?: string | null; texts: string[] },
): Promise<EquityFlagDraft[]> {
  const ruleFlags = screenWithRules(input.texts);
  const aiFlags = await screenWithAi(input.texts.join("\n"));
  const seen = new Set(ruleFlags.map((f) => f.category));
  const flags = [...ruleFlags, ...aiFlags.filter((f) => !seen.has(f.category))];
  if (!flags.length) return [];

  const { data: schoolId } = await supabase.rpc("user_school_id", { _user_id: userId });
  const { error } = await supabase.from("equity_flags").insert(
    flags.map((f) => ({
      school_id: (schoolId as string | null) ?? null,
      user_id: userId,
      student_id: input.studentId ?? null,
      surface: input.surface,
      category: f.category,
      phrase: f.phrase,
      reason: f.reason,
      severity: f.severity,
      excerpt: f.excerpt,
      detector: f.detector,
    })),
  );
  if (error) console.error("equity flag insert failed", error.message);
  await logGovernance(supabase, userId, {
    category: "equity",
    eventType: "equity_flag_raised",
    targetType: input.studentId ? "student" : null,
    targetId: input.studentId ?? null,
    summary: `${flags.length} equity concern(s) flagged on ${input.surface} output: ${flags
      .map((f) => f.category)
      .join(", ")}.`,
  });
  return flags;
}
