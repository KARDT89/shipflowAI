import type { PromptMessages } from "./types"

export type ReviewPromptInput = {
  prd: {
    problemStatement: string
    goals: string[]
    nonGoals: string[]
    acceptanceCriteria: string[]
    edgeCases: string[]
  }
  tasks?: Array<{
    title: string
    description: string
  }>
  diff: string
}

export function buildReviewPrompt({
  prd,
  tasks = [],
  diff,
}: ReviewPromptInput): PromptMessages {
  const taskContext =
    tasks.length > 0
      ? tasks.map((task) => `- ${task.title}: ${task.description}`).join("\n")
      : "No tasks were provided."

  return {
    system:
      "You are ShipFlow AI. Review the pull request diff against the approved PRD. Flag only actionable product, correctness, security, or acceptance-criteria issues.",
    user: [
      "PRD problem statement:",
      prd.problemStatement,
      "",
      "Goals:",
      prd.goals.map((goal) => `- ${goal}`).join("\n"),
      "",
      "Non-goals:",
      prd.nonGoals.map((nonGoal) => `- ${nonGoal}`).join("\n"),
      "",
      "Acceptance criteria:",
      prd.acceptanceCriteria.map((criterion) => `- ${criterion}`).join("\n"),
      "",
      "Edge cases:",
      prd.edgeCases.map((edgeCase) => `- ${edgeCase}`).join("\n"),
      "",
      "Tasks:",
      taskContext,
      "",
      "Pull request diff:",
      diff,
      "",
      "Return structured output matching the review run schema.",
    ].join("\n"),
  }
}
