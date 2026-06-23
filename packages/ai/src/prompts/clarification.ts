import type { PromptMessages } from "./types"

export type ClarificationPromptInput = {
  rawInput: string
  existingFeatures?: string[]
}

export function buildClarificationPrompt({
  rawInput,
  existingFeatures = [],
}: ClarificationPromptInput): PromptMessages {
  const existingFeatureContext =
    existingFeatures.length > 0
      ? existingFeatures.map((feature) => `- ${feature}`).join("\n")
      : "No existing feature requests were provided."

  return {
    system:
      "You are ShipFlow AI. Decide whether a submitted feature request is clear enough to turn into a PRD. Ask only essential clarification questions.",
    user: [
      "Feature request:",
      rawInput,
      "",
      "Existing feature requests to consider for duplicate or related work:",
      existingFeatureContext,
      "",
      "Return structured output matching the clarification schema.",
    ].join("\n"),
  }
}
