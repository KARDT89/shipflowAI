import { generateText, Output } from "ai"

import { DEFAULT_AI_MODEL, getAiModel } from "./client"
import { getAiErrorDiagnosticMessage, logAiError } from "./logAiError"
import { buildTasksPrompt, type TasksPromptInput } from "./prompts/tasks"
import { tasksOutputSchema, type TasksOutput } from "./schemas/tasks"

export async function generateTasks(
  input: TasksPromptInput
): Promise<TasksOutput> {
  const prompt = buildTasksPrompt(input)
  const model = process.env.AI_MODEL ?? DEFAULT_AI_MODEL

  try {
    const result = await generateText({
      model: getAiModel(model),
      system: prompt.system,
      prompt: prompt.user,
      output: Output.object({
        schema: tasksOutputSchema,
        name: "tasks",
      }),
    })

    return result.output
  } catch (error) {
    const context = {
      workflow: "generateTasks",
      model,
    }
    logAiError(error, context)
    throw new Error(getAiErrorDiagnosticMessage(error, context), {
      cause: error,
    })
  }
}
