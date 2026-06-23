import { createOpenRouter } from "@openrouter/ai-sdk-provider"

export const DEFAULT_AI_MODEL = "openai/gpt-4.1-nano"

export function getAiModel(model = process.env.AI_MODEL ?? DEFAULT_AI_MODEL) {
  const apiKey = process.env.OPENROUTER_API_KEY

  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is required to create an AI model.")
  }

  const openrouter = createOpenRouter({ apiKey })
  return openrouter(model)
}
