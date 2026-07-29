import { generateText, Output, NoObjectGeneratedError } from "ai";
import type { z } from "zod";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";

export type AiResult<T> = { ok: true; result: T } | { ok: false; error: string };

/**
 * Shared structured-output call against the Lovable AI Gateway, with the
 * same warm, non-technical failure messages everywhere in the product.
 */
export async function runStructured<T>(
  schema: z.ZodType<T>,
  system: string,
  prompt: string,
  label: string,
): Promise<AiResult<T>> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) {
    return { ok: false, error: "AI is not configured for this project yet." };
  }

  const gateway = createLovableAiGatewayProvider(key);

  try {
    const { output } = await generateText({
      model: gateway("openai/gpt-5.6-sol"),
      system,
      prompt,
      output: Output.object({ schema }),
      providerOptions: { lovable: { reasoningEffort: "none" } },
    });
    return { ok: true, result: output as T };
  } catch (error) {
    if (NoObjectGeneratedError.isInstance(error) && error.text) {
      try {
        const cleaned = error.text.replace(/^```(?:json)?/i, "").replace(/```$/, "");
        return { ok: true, result: schema.parse(JSON.parse(cleaned)) };
      } catch {
        /* fall through to the error response */
      }
    }
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("429")) {
      return {
        ok: false,
        error: "The AI service is busy right now. Please wait a moment and try again.",
      };
    }
    if (message.includes("402")) {
      return {
        ok: false,
        error: "AI credits have run out. Top up credits to keep generating.",
      };
    }
    console.error(`${label} failed`, message);
    return {
      ok: false,
      error: "We could not reach the evidence base just now. Please try again.",
    };
  }
}
