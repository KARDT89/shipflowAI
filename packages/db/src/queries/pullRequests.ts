import { and, eq } from "drizzle-orm"

import { db } from "../client"
import { pullRequests } from "../schema/domain"

export async function upsertPullRequest(data: {
  repositoryId: string
  githubPrNumber: number
  headSha: string
  baseSha: string
  status: string
  openedAt: Date
}) {
  const [row] = await db
    .insert(pullRequests)
    .values(data)
    .onConflictDoUpdate({
      target: [pullRequests.repositoryId, pullRequests.githubPrNumber],
      set: {
        headSha: data.headSha,
        baseSha: data.baseSha,
        status: data.status,
      },
    })
    .returning()
  return row
}

export async function updatePullRequestStatus(
  repositoryId: string,
  githubPrNumber: number,
  status: string
) {
  const [row] = await db
    .update(pullRequests)
    .set({ status })
    .where(
      and(
        eq(pullRequests.repositoryId, repositoryId),
        eq(pullRequests.githubPrNumber, githubPrNumber)
      )
    )
    .returning()
  return row
}
