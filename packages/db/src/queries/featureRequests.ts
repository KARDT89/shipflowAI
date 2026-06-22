import { and, eq } from "drizzle-orm"

import { db } from "../client"
import { featureRequests, projects, workspaces } from "../schema/domain"
import type { featureRequestStatus } from "../schema/domain"

type FeatureRequestStatus = (typeof featureRequestStatus.enumValues)[number]

export async function listFeatureRequestsByProject(projectId: string) {
  return db.query.featureRequests.findMany({
    where: eq(featureRequests.projectId, projectId),
    columns: {
      id: true,
      status: true,
      rawInput: true,
      source: true,
      createdAt: true,
    },
    orderBy: (fr, { desc }) => [desc(fr.createdAt)],
  })
}

export async function getFeatureRequestById(id: string, projectId: string) {
  return db.query.featureRequests.findFirst({
    where: and(
      eq(featureRequests.id, id),
      eq(featureRequests.projectId, projectId)
    ),
  })
}

export async function getFeatureRequestForOrg(
  id: string,
  organizationId: string
) {
  const [row] = await db
    .select({ featureRequest: featureRequests })
    .from(featureRequests)
    .innerJoin(projects, eq(featureRequests.projectId, projects.id))
    .innerJoin(workspaces, eq(projects.workspaceId, workspaces.id))
    .where(
      and(
        eq(featureRequests.id, id),
        eq(workspaces.organizationId, organizationId)
      )
    )
    .limit(1)
  return row?.featureRequest ?? null
}

export async function createFeatureRequest({
  projectId,
  rawInput,
  createdBy,
  source = "manual",
}: {
  projectId: string
  rawInput: string
  createdBy: string
  source?: string
}) {
  const [row] = await db
    .insert(featureRequests)
    .values({ projectId, rawInput, createdBy, source })
    .returning()
  return row
}

export async function updateFeatureRequestStatus(
  id: string,
  status: FeatureRequestStatus
) {
  const [row] = await db
    .update(featureRequests)
    .set({ status })
    .where(eq(featureRequests.id, id))
    .returning()
  return row
}
