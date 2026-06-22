import { Webhooks } from "@octokit/webhooks"

let webhooks: Webhooks | undefined

export function getWebhooks() {
  const secret = process.env.GITHUB_WEBHOOK_SECRET
  if (!secret) throw new Error("GitHub webhook secret is not configured")
  webhooks ??= new Webhooks({ secret })
  return webhooks
}
