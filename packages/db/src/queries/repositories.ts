import { eq } from "drizzle-orm"

import { db } from "../client"
import { repositories } from "../schema/domain"

export async function findRepositoryByGithubId(githubRepositoryId: string) {
  return db.query.repositories.findFirst({
    where: eq(repositories.githubRepositoryId, githubRepositoryId),
  })
}
