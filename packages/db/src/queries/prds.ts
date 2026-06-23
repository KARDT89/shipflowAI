import { and, desc, eq } from "drizzle-orm"

import { db } from "../client"
import { prds, featureRequests, projects, workspaces } from "../schema/domain"

type CreatePrdInput = {
  featureRequestId: string
  problemStatement: string
  goals: string[]
  nonGoals: string[]
  userStories: string[]
  acceptanceCriteria: string[]
  edgeCases: string[]
  successMetrics: string[]
}

export async function createPrd({
  featureRequestId,
  problemStatement,
  goals,
  nonGoals,
  userStories,
  acceptanceCriteria,
  edgeCases,
  successMetrics,
}: CreatePrdInput) {
  const [row] = await db
    .insert(prds)
    .values({
      featureRequestId,
      problemStatement,
      goals,
      nonGoals,
      userStories,
      acceptanceCriteria,
      edgeCases,
      successMetrics,
      status: "draft",
      version: 1,
    })
    .returning()

  return row!
}

export async function getPrdForFeatureRequest(
  featureRequestId: string,
  organizationId: string
) {
  const [row] = await db
    .select({ prd: prds })
    .from(prds)
    .innerJoin(featureRequests, eq(prds.featureRequestId, featureRequests.id))
    .innerJoin(projects, eq(featureRequests.projectId, projects.id))
    .innerJoin(workspaces, eq(projects.workspaceId, workspaces.id))
    .where(
      and(
        eq(prds.featureRequestId, featureRequestId),
        eq(workspaces.organizationId, organizationId)
      )
    )
    .orderBy(desc(prds.version))
    .limit(1)
  return row?.prd ?? null
}
