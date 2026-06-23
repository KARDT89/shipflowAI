import { generateTasks as generateTasksAi } from "@shipflow/ai"
import {
  createLifecycleEvent,
  createTasksForPrd,
  getPrdForFeatureRequest,
  updateFeatureRequestStatus,
} from "@shipflow/db"

import { inngest } from "../client"

export const generateTasks = inngest.createFunction(
  { id: "generate-tasks" },
  { event: "prd.approved" },
  async ({ event, step }) => {
    const { featureRequestId, organizationId, prdId } = event.data

    const prd = await step.run("get-approved-prd", () =>
      getPrdForFeatureRequest(featureRequestId, organizationId)
    )

    if (!prd || prd.id !== prdId || prd.status !== "approved") {
      console.log(
        `[inngest] approved PRD ${prdId} not found for feature request ${featureRequestId}, skipping task generation`
      )
      return
    }

    const tasksOutput = await step.run("generate-tasks", () =>
      generateTasksAi({
        prd: {
          problemStatement: prd.problemStatement,
          goals: prd.goals,
          acceptanceCriteria: prd.acceptanceCriteria,
          edgeCases: prd.edgeCases,
        },
      })
    )

    if (tasksOutput.tasks.length === 0) {
      throw new Error("AI task generation returned zero tasks")
    }

    const createdTasks = await step.run("create-tasks", () =>
      createTasksForPrd({
        prdId: prd.id,
        generatedTasks: tasksOutput.tasks,
      })
    )

    await step.run("set-status-tasks-generated", () =>
      updateFeatureRequestStatus(featureRequestId, "tasks_generated")
    )

    await step.run("write-tasks-generated-event", () =>
      createLifecycleEvent({
        featureRequestId,
        actorType: "ai",
        event: "tasks_generated",
        fromStatus: "prd_approved",
        toStatus: "tasks_generated",
        payload: {
          prdId: prd.id,
          taskCount: createdTasks.length,
        },
      })
    )

    return {
      status: "tasks_generated",
      prdId: prd.id,
      taskCount: createdTasks.length,
    }
  }
)
