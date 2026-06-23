import { generateText, Output } from "ai"

import { DEFAULT_AI_MODEL, getAiModel } from "./client"
import { getAiErrorDiagnosticMessage, logAiError } from "./logAiError"
import { buildPrdPrompt, type PrdPromptInput } from "./prompts/prd"
import { prdOutputSchema, type PrdOutput } from "./schemas/prd"

export async function generatePrd(input: PrdPromptInput): Promise<PrdOutput> {
  const prompt = buildPrdPrompt(input)
  const model = process.env.AI_MODEL ?? DEFAULT_AI_MODEL

  try {
    const result = await generateText({
      model: getAiModel(model),
      system: prompt.system,
      prompt: prompt.user,
      output: Output.object({
        schema: prdOutputSchema,
        name: "prd",
      }),
    })

    return result.output
  } catch (error) {
    const context = {
      workflow: "generatePrd",
      model,
    }
    logAiError(error, context)
    throw new Error(getAiErrorDiagnosticMessage(error, context), {
      cause: error,
    })
  }
}
