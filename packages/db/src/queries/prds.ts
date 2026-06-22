import { desc, and, eq } from "drizzle-orm"

import { db } from "../client"
import { prds, featureRequests, projects, workspaces } from "../schema/domain"

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
