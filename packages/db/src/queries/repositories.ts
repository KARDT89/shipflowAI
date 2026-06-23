import { and, eq, inArray } from "drizzle-orm"

import { db } from "../client"
import { githubInstallations, repositories } from "../schema/domain"

export async function findGithubInstallation(installationId: string) {
  return db.query.githubInstallations.findFirst({
    where: eq(githubInstallations.installationId, installationId),
  })
}

export async function listGithubInstallationsByOrganization(
  organizationId: string
) {
  return db.query.githubInstallations.findMany({
    where: eq(githubInstallations.organizationId, organizationId),
  })
}

export async function upsertGithubInstallation(data: {
  organizationId: string
  installationId: string
  accountId: string
  accountLogin: string
  accountType: string
  verifiedBy: string
}) {
  const rows = await db
    .insert(githubInstallations)
    .values(data)
    .onConflictDoUpdate({
      target: githubInstallations.installationId,
      set: {
        accountId: data.accountId,
        accountLogin: data.accountLogin,
        accountType: data.accountType,
        verifiedBy: data.verifiedBy,
        updatedAt: new Date(),
      },
      setWhere: eq(githubInstallations.organizationId, data.organizationId),
    })
    .returning()
  return rows[0]
}

export async function findRepositoryByGithubId(githubRepositoryId: string) {
  return db.query.repositories.findFirst({
    where: eq(repositories.githubRepositoryId, githubRepositoryId),
  })
}

export async function getRepositoryById(id: string) {
  return db.query.repositories.findFirst({
    where: eq(repositories.id, id),
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

export async function deleteRepositoriesByInstallationId(
  installationId: string
) {
  return db.transaction(async (tx) => {
    await tx
      .delete(repositories)
      .where(eq(repositories.githubInstallationId, installationId))
    return tx
      .delete(githubInstallations)
      .where(eq(githubInstallations.installationId, installationId))
      .returning()
  })
}

export async function deleteRepositoriesByGithubIds(
  installationId: string,
  githubRepositoryIds: string[]
) {
  if (githubRepositoryIds.length === 0) return []
  return db
    .delete(repositories)
    .where(
      and(
        eq(repositories.githubInstallationId, installationId),
        inArray(repositories.githubRepositoryId, githubRepositoryIds)
      )
    )
    .returning()
}
