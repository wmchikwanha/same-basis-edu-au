import { createServerFn } from "@tanstack/react-start";
import { generateText, Output, NoObjectGeneratedError } from "ai";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { screenAndRecord } from "./equity.server";
import {
  ADJUSTMENT_SYSTEM_PROMPT,
  buildAdjustmentPrompt,
  createLovableAiGatewayProvider,
} from "./ai-gateway.server";

const AdjustmentInput = z.object({
  studentName: z.string(),
  yearLevel: z.number(),
  nccdCategory: z.string(),
  nccdLevel: z.string(),
  functionalDescription: z.string(),
  culturalBackground: z.string().nullable(),
  languagesSpoken: z.string().nullable(),
  ealdLevel: z.string().nullable(),
  traumaFlags: z.string().nullable(),
  knownTriggers: z.string().nullable(),
  calmingStrategies: z.string().nullable(),
  strengths: z.string().nullable(),
  iepGoals: z.string().nullable(),
  subject: z.string(),
  topic: z.string(),
  topicDescription: z.string(),
  activityDescription: z.string(),
  studentId: z.string().uuid().nullable().optional(),
});

const AdjustmentOutput = z.object({
  adjustment: z.string(),
  udl_benefit: z.string(),
  cultural_note: z.string(),
  trauma_note: z.string(),
  rationale: z.string(),
});

export const generateAdjustment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => AdjustmentInput.parse(input))
  .handler(async ({ data, context }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) {
      return {
        ok: false as const,
        error: "AI is not configured for this project yet.",
      };
    }

    const gateway = createLovableAiGatewayProvider(key);

    try {
      const { output } = await generateText({
        model: gateway("openai/gpt-5.6-sol"),
        system: ADJUSTMENT_SYSTEM_PROMPT,
        prompt: buildAdjustmentPrompt(data),
        output: Output.object({ schema: AdjustmentOutput }),
        providerOptions: { lovable: { reasoningEffort: "none" } },
      });

      const equityFlags = await screenAndRecord(context.supabase, context.userId, {
        surface: "planner",
        studentId: data.studentId ?? null,
        texts: Object.values(output as Record<string, string>),
      });
      return { ok: true as const, result: output, equityFlags };
    } catch (error) {
      if (NoObjectGeneratedError.isInstance(error) && error.text) {
        try {
          const cleaned = error.text.replace(/^```(?:json)?/i, "").replace(/```$/, "");
          return {
            ok: true as const,
            result: AdjustmentOutput.parse(JSON.parse(cleaned)),
            equityFlags: [] as import("./equity-types").EquityFlagDraft[],
          };
        } catch {
          /* fall through to the error response */
        }
      }
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes("429")) {
        return {
          ok: false as const,
          error: "The AI service is busy right now. Please wait a moment and try again.",
        };
      }
      if (message.includes("402")) {
        return {
          ok: false as const,
          error: "AI credits have run out. Top up credits to keep generating adjustments.",
        };
      }
      console.error("generateAdjustment failed", message);
      return {
        ok: false as const,
        error: "We could not reach the evidence base just now. Please try again.",
      };
    }
  });
