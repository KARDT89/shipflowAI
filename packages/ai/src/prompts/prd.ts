import type { PromptMessages } from "./types"

export type PrdPromptInput = {
  rawInput: string
  clarifications?: Array<{
    question: string
    answer: string
  }>
}

export function buildPrdPrompt({
  rawInput,
  clarifications = [],
}: PrdPromptInput): PromptMessages {
  const clarificationContext =
    clarifications.length > 0
      ? clarifications
          .map(({ question, answer }) => `Q: ${question}\nA: ${answer}`)
          .join("\n\n")
      : "No clarification answers were provided."

  return {
    system:
      "You are ShipFlow AI. Write concise product requirements for an engineering team. Be specific, testable, and avoid invented scope.",
    user: [
      "Feature request:",
      rawInput,
      "",
      "Clarifications:",
      clarificationContext,
      "",
      "Return structured output matching the PRD schema.",
    ].join("\n"),
  }
}
