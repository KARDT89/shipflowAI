import { createWorkspaceWithProject, listProjectsByOrg } from "@shipflow/db"
import { z } from "zod"

import { createTRPCRouter, tenantProcedure } from "../trpc"

function toSlug(name: string) {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "project"
  )
}

export const projectsRouter = createTRPCRouter({
  list: tenantProcedure.query(({ ctx }) => {
    return listProjectsByOrg(ctx.activeOrganizationId)
  }),

  createWithWorkspace: tenantProcedure
    .input(
      z.object({
        workspaceName: z.string().min(1),
        projectName: z.string().min(1),
      })
    )
    .mutation(({ input, ctx }) => {
      return createWorkspaceWithProject({
        organizationId: ctx.activeOrganizationId,
        workspaceName: input.workspaceName,
        workspaceSlug: toSlug(input.workspaceName),
        projectName: input.projectName,
        projectSlug: toSlug(input.projectName),
      })
    }),
})
