import { generateClarification } from "@shipflow/ai"
import {
  createClarificationQuestions,
  createLifecycleEvent,
  getFeatureRequestForOrg,
  listFeatureRequestsByProject,
  updateFeatureRequestStatus,
} from "@shipflow/db"

import { inngest } from "../client"

export const clarifyRequest = inngest.createFunction(
  { id: "clarify-request" },
  { event: "feature_request.created" },
  async ({ event, step }) => {
    const { featureRequestId, organizationId } = event.data

    const featureRequest = await step.run("get-feature-request", () =>
      getFeatureRequestForOrg(featureRequestId, organizationId)
    )

    if (!featureRequest) {
      console.log(
        `[inngest] feature request ${featureRequestId} not found, skipping`
      )
      return
    }

    const projectFeatureRequests = await step.run(
      "get-project-feature-requests",
      () => listFeatureRequestsByProject(featureRequest.projectId)
    )

    const existingFeatures = projectFeatureRequests
      .filter((fr) => fr.id !== featureRequest.id)
      .map((fr) => fr.rawInput)

    const clarification = await step.run("generate-clarification", () =>
      generateClarification({
        rawInput: featureRequest.rawInput,
        existingFeatures,
      })
    )

    const questions = clarification.questions.filter(
      (question) => question.trim().length > 0
    )
    const existingFeatureMatch = clarification.existing_feature_match
    const needsClarification =
      clarification.needs_clarification ||
      questions.length > 0 ||
      existingFeatureMatch !== null

    if (!needsClarification) {
      await step.run("write-clarification-passed-event", () =>
        createLifecycleEvent({
          featureRequestId: featureRequest.id,
          actorType: "ai",
          event: "clarification_passed",
          payload: {
            needs_clarification: clarification.needs_clarification,
          },
        })
      )

      return { status: featureRequest.status, questionsCreated: 0 }
    }

    await step.run("create-clarification-questions", () =>
      createClarificationQuestions({
        featureRequestId: featureRequest.id,
        questions,
      })
    )

    await step.run("set-status-clarifying", () =>
      updateFeatureRequestStatus(featureRequest.id, "clarifying")
    )

    await step.run("write-clarification-requested-event", () =>
      createLifecycleEvent({
        featureRequestId: featureRequest.id,
        actorType: "ai",
        event: "clarification_requested",
        fromStatus: featureRequest.status,
        toStatus: "clarifying",
        payload: {
          questionCount: questions.length,
          existingFeatureMatch,
        },
      })
    )

    return { status: "clarifying", questionsCreated: questions.length }
  }
)
