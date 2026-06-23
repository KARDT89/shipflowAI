import {
  clearGithubAccountTokens,
  deleteRepositoriesByGithubIds,
  deleteRepositoriesByInstallationId,
  findRepositoryByGithubId,
  updatePullRequestStatus,
  upsertPullRequest,
} from "@shipflow/db"
import { getWebhooks } from "@shipflow/github"
import { inngest } from "@shipflow/inngest"

const webhooks = getWebhooks()

webhooks.on(
  ["pull_request.opened", "pull_request.synchronize", "pull_request.reopened"],
  async ({ payload }) => {
    if (!payload.repository) return
    const repo = await findRepositoryByGithubId(
      payload.repository.id.toString()
    )
    if (!repo) return
    const pr = await upsertPullRequest({
      repositoryId: repo.id,
      githubPrNumber: payload.pull_request.number,
      headSha: payload.pull_request.head.sha,
      baseSha: payload.pull_request.base.sha,
      status: "open",
      openedAt: new Date(payload.pull_request.created_at),
    })
    if (pr) {
      await inngest
        .send({
          name: "github/pull_request.opened",
          data: {
            pullRequestId: pr.id,
            repositoryId: repo.id,
            githubPrNumber: payload.pull_request.number,
          },
        })
        .catch((err) => {
          console.error("[github webhook] inngest.send error", err)
        })
    }
  }
)

webhooks.on("pull_request.closed", async ({ payload }) => {
  if (!payload.repository) return
  const repo = await findRepositoryByGithubId(payload.repository.id.toString())
  if (!repo) return
  await updatePullRequestStatus(
    repo.id,
    payload.pull_request.number,
    payload.pull_request.merged ? "merged" : "closed"
  )
})

webhooks.on("installation.deleted", async ({ payload }) => {
  await deleteRepositoriesByInstallationId(String(payload.installation.id))
})

webhooks.on("installation_repositories.removed", async ({ payload }) => {
  await deleteRepositoriesByGithubIds(
    String(payload.installation.id),
    payload.repositories_removed.map((repository) => String(repository.id))
  )
})

webhooks.on("github_app_authorization.revoked", async ({ payload }) => {
  await clearGithubAccountTokens(String(payload.sender.id))
})

export async function POST(req: Request) {
  const payload = await req.text()
  const id = req.headers.get("x-github-delivery") ?? ""
  const name = req.headers.get("x-github-event") ?? ""
  const signature = req.headers.get("x-hub-signature-256") ?? ""

  const verified = await webhooks.verify(payload, signature)
  if (!verified) {
    return Response.json({ error: "Invalid signature" }, { status: 401 })
  }

  try {
    await webhooks.receive({
      id,
      name: name as never,
      payload: JSON.parse(payload),
    })
  } catch (error) {
    console.error("[github webhook] handler error", error)
  }

  return Response.json({ ok: true })
}
