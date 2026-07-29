import { createServerFn } from "@tanstack/react-start";
import { FAMILY_SYSTEM_PROMPT, buildFamilyPrompt } from "./ai-gateway.server";
import { FamilyInput, FamilyOutput } from "./ai-schemas";
import { runStructured } from "./ai-run.server";

export const generateFamilyMessage = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => FamilyInput.parse(input))
  .handler(async ({ data }) =>
    runStructured(
      FamilyOutput,
      FAMILY_SYSTEM_PROMPT,
      buildFamilyPrompt(data),
      "generateFamilyMessage",
    ),
  );
