import { generateText, Output } from "ai"

import { DEFAULT_AI_MODEL, getAiModel } from "./client"
import { getAiErrorDiagnosticMessage, logAiError } from "./logAiError"
import {
  buildClarificationPrompt,
  type ClarificationPromptInput,
} from "./prompts/clarification"
import {
  clarificationOutputSchema,
  type ClarificationOutput,
} from "./schemas/clarification"

export async function generateClarification(
  input: ClarificationPromptInput
): Promise<ClarificationOutput> {
  const prompt = buildClarificationPrompt(input)
  const model = process.env.AI_MODEL ?? DEFAULT_AI_MODEL

  try {
    const result = await generateText({
      model: getAiModel(model),
      system: prompt.system,
      prompt: prompt.user,
      output: Output.object({
        schema: clarificationOutputSchema,
        name: "clarification",
      }),
    })

    return result.output
  } catch (error) {
    const context = {
      workflow: "generateClarification",
      model,
    }
    logAiError(error, context)
    throw new Error(getAiErrorDiagnosticMessage(error, context), {
      cause: error,
    })
  }
}
