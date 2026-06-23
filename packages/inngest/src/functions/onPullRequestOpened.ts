import {
  createLifecycleEvent,
  getRepositoryById,
  listFeatureRequestsByProject,
} from "@shipflow/db"

import { inngest } from "../client"

export const onPullRequestOpened = inngest.createFunction(
  { id: "on-pull-request-opened" },
  { event: "github/pull_request.opened" },
  async ({ event, step }) => {
    const { pullRequestId, repositoryId, githubPrNumber } = event.data

    const repo = await step.run("get-repository", () =>
      getRepositoryById(repositoryId)
    )

    if (!repo) {
      console.log(`[inngest] repository ${repositoryId} not found, skipping`)
      return
    }

    const featureRequests = await step.run("get-feature-requests", () =>
      listFeatureRequestsByProject(repo.projectId)
    )

    if (featureRequests.length === 0) {
      console.log(
        `[inngest] no feature requests for project ${repo.projectId}, skipping`
      )
      return
    }

    await step.run("write-lifecycle-events", () =>
      Promise.all(
        featureRequests.map((fr) =>
          createLifecycleEvent({
            featureRequestId: fr.id,
            actorType: "system",
            event: "pr_received",
            payload: { pullRequestId, githubPrNumber },
          })
        )
      )
    )

    return { lifecycleEventsCreated: featureRequests.length }
  }
)
