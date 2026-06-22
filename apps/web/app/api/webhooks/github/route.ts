import {
  findRepositoryByGithubId,
  updatePullRequestStatus,
  upsertPullRequest,
} from "@shipflow/db"
import { webhooks } from "@shipflow/github"

webhooks.on(
  ["pull_request.opened", "pull_request.synchronize", "pull_request.reopened"],
  async ({ payload }) => {
    if (!payload.repository) return
    const repo = await findRepositoryByGithubId(
      payload.repository.id.toString()
    )
    if (!repo) return
    await upsertPullRequest({
      repositoryId: repo.id,
      githubPrNumber: payload.pull_request.number,
      headSha: payload.pull_request.head.sha,
      baseSha: payload.pull_request.base.sha,
      status: "open",
      openedAt: new Date(payload.pull_request.created_at),
    })
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
    await webhooks.receive({ id, name: name as never, payload: JSON.parse(payload) })
  } catch (error) {
    console.error("[github webhook] handler error", error)
  }

  return Response.json({ ok: true })
}
