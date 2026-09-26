import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { FAMILY_SYSTEM_PROMPT, buildFamilyPrompt } from "./ai-gateway.server";
import { FamilyInput, FamilyOutput } from "./ai-schemas";
import { runStructured } from "./ai-run.server";
import { screenAndRecord } from "./equity.server";
import { flattenText } from "./equity-types";

export const generateFamilyMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => FamilyInput.parse(input))
  .handler(async ({ data, context }) => {
    const res = await runStructured(
      FamilyOutput,
      FAMILY_SYSTEM_PROMPT,
      buildFamilyPrompt(data),
      "generateFamilyMessage",
    );
    if (!res.ok) return res;
    const equityFlags = await screenAndRecord(context.supabase, context.userId, {
      surface: "family",
      texts: flattenText(res.result),
    });
    return { ...res, equityFlags };
  });
