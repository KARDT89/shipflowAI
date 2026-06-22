import { asc, eq } from "drizzle-orm"

import { db } from "../client"
import { projects, workspaces } from "../schema/domain"

export async function listProjectsByOrg(organizationId: string) {
  return db
    .select({
      id: projects.id,
      name: projects.name,
      slug: projects.slug,
      workspaceId: projects.workspaceId,
      workspaceName: workspaces.name,
      createdAt: projects.createdAt,
    })
    .from(projects)
    .innerJoin(workspaces, eq(projects.workspaceId, workspaces.id))
    .where(eq(workspaces.organizationId, organizationId))
    .orderBy(asc(projects.createdAt))
}

export async function createWorkspaceWithProject({
  organizationId,
  workspaceName,
  workspaceSlug,
  projectName,
  projectSlug,
}: {
  organizationId: string
  workspaceName: string
  workspaceSlug: string
  projectName: string
  projectSlug: string
}) {
  return db.transaction(async (tx) => {
    const workspaceRows = await tx
      .insert(workspaces)
      .values({ organizationId, name: workspaceName, slug: workspaceSlug })
      .returning()
    const workspace = workspaceRows[0]!
    const projectRows = await tx
      .insert(projects)
      .values({ workspaceId: workspace.id, name: projectName, slug: projectSlug })
      .returning()
    const project = projectRows[0]!
    return { workspace, project }
  })
}
