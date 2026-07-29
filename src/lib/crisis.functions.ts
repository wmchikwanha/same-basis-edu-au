import { createServerFn } from "@tanstack/react-start";
import { CRISIS_SYSTEM_PROMPT, buildCrisisPrompt } from "./ai-gateway.server";
import { CrisisInput, CrisisOutput } from "./ai-schemas";
import { runStructured } from "./ai-run.server";

export const generateCrisisGuidance = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => CrisisInput.parse(input))
  .handler(async ({ data }) =>
    runStructured(
      CrisisOutput,
      CRISIS_SYSTEM_PROMPT,
      buildCrisisPrompt(data),
      "generateCrisisGuidance",
    ),
  );
