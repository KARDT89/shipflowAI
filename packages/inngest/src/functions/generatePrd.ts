import { generatePrd as generatePrdAi } from "@shipflow/ai"
import {
  createLifecycleEvent,
  createPrd,
  getFeatureRequestForOrg,
  listClarificationThreadsByFeatureRequestId,
  updateFeatureRequestStatus,
} from "@shipflow/db"

import { inngest } from "../client"

export const generatePrd = inngest.createFunction(
  { id: "generate-prd" },
  { event: "clarification.answered" },
  async ({ event, step }) => {
    const { featureRequestId, organizationId } = event.data

    const featureRequest = await step.run("get-feature-request", () =>
      getFeatureRequestForOrg(featureRequestId, organizationId)
    )

    if (!featureRequest) {
      console.log(
        `[inngest] feature request ${featureRequestId} not found, skipping PRD generation`
      )
      return
    }

    const clarificationThreads = await step.run("get-clarifications", () =>
      listClarificationThreadsByFeatureRequestId(featureRequestId, organizationId)
    )

    const clarifications = clarificationThreads
      .filter((thread) => thread.answer && thread.answer.trim().length > 0)
      .map((thread) => ({
        question: thread.question,
        answer: thread.answer!,
      }))

    const prd = await step.run("generate-prd", () =>
      generatePrdAi({
        rawInput: featureRequest.rawInput,
        clarifications,
      })
    )

    const createdPrd = await step.run("create-prd", () =>
      createPrd({
        featureRequestId: featureRequest.id,
        ...prd,
      })
    )

    await step.run("set-status-prd-generated", () =>
      updateFeatureRequestStatus(featureRequest.id, "prd_generated")
    )

    await step.run("write-prd-generated-event", () =>
      createLifecycleEvent({
        featureRequestId: featureRequest.id,
        actorType: "ai",
        event: "prd_generated",
        fromStatus: featureRequest.status,
        toStatus: "prd_generated",
        payload: {
          prdId: createdPrd.id,
          version: createdPrd.version,
          clarificationCount: clarifications.length,
        },
      })
    )

    return {
      status: "prd_generated",
      prdId: createdPrd.id,
      clarificationCount: clarifications.length,
    }
  }
)
