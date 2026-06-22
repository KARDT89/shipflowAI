import { eq } from "drizzle-orm"

import { db } from "../client"
import { repositories } from "../schema/domain"

export async function findRepositoryByGithubId(githubRepositoryId: string) {
  return db.query.repositories.findFirst({
    where: eq(repositories.githubRepositoryId, githubRepositoryId),
  })
}

export async function createRepository(data: {
  projectId: string
  githubInstallationId: string
  githubRepositoryId: string
  owner: string
  name: string
  defaultBranch?: string
}) {
  const rows = await db
    .insert(repositories)
    .values({
      projectId: data.projectId,
      githubInstallationId: data.githubInstallationId,
      githubRepositoryId: data.githubRepositoryId,
      owner: data.owner,
      name: data.name,
      defaultBranch: data.defaultBranch ?? "main",
    })
    .returning()
  return rows[0]!
}

export async function listRepositoriesByProject(projectId: string) {
  return db.query.repositories.findMany({
    where: eq(repositories.projectId, projectId),
  })
}
