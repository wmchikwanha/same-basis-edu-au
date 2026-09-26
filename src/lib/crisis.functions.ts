import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { CRISIS_SYSTEM_PROMPT, buildCrisisPrompt } from "./ai-gateway.server";
import { CrisisInput, CrisisOutput } from "./ai-schemas";
import { runStructured } from "./ai-run.server";
import { screenAndRecord } from "./equity.server";
import { flattenText } from "./equity-types";

export const generateCrisisGuidance = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => CrisisInput.parse(input))
  .handler(async ({ data, context }) => {
    const res = await runStructured(
      CrisisOutput,
      CRISIS_SYSTEM_PROMPT,
      buildCrisisPrompt(data),
      "generateCrisisGuidance",
    );
    if (!res.ok) return res;
    const equityFlags = await screenAndRecord(context.supabase, context.userId, {
      surface: "crisis",
      texts: flattenText(res.result),
    });
    return { ...res, equityFlags };
  });
