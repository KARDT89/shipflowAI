import type { PromptMessages } from "./types"

export type TasksPromptInput = {
  prd: {
    problemStatement: string
    goals: string[]
    acceptanceCriteria: string[]
    edgeCases: string[]
  }
}

export function buildTasksPrompt({ prd }: TasksPromptInput): PromptMessages {
  return {
    system:
      "You are ShipFlow AI. Break an approved PRD into implementation tasks for engineers. Keep tasks small, ordered, and directly tied to acceptance criteria.",
    user: [
      "Problem statement:",
      prd.problemStatement,
      "",
      "Goals:",
      prd.goals.map((goal) => `- ${goal}`).join("\n"),
      "",
      "Acceptance criteria:",
      prd.acceptanceCriteria.map((criterion) => `- ${criterion}`).join("\n"),
      "",
      "Edge cases:",
      prd.edgeCases.map((edgeCase) => `- ${edgeCase}`).join("\n"),
      "",
      "Return structured output matching the tasks schema.",
    ].join("\n"),
  }
}
