import {
  createRepository,
  listProjectsByOrg,
  listRepositoriesByProject,
} from "@shipflow/db"
import { TRPCError } from "@trpc/server"
import { z } from "zod"

import { createTRPCRouter, tenantProcedure } from "../trpc"

export const repositoriesRouter = createTRPCRouter({
  link: tenantProcedure
    .input(
      z.object({
        projectId: z.string().uuid(),
        installationId: z.string().min(1),
        githubRepositoryId: z.string().min(1),
        owner: z.string().min(1),
        name: z.string().min(1),
        defaultBranch: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const orgProjects = await listProjectsByOrg(ctx.activeOrganizationId)
      const project = orgProjects.find((p) => p.id === input.projectId)
      if (!project) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Project does not belong to the active organization.",
        })
      }

      return createRepository({
        projectId: input.projectId,
        githubInstallationId: input.installationId,
        githubRepositoryId: input.githubRepositoryId,
        owner: input.owner,
        name: input.name,
        defaultBranch: input.defaultBranch,
      })
    }),

  listByProject: tenantProcedure
    .input(z.object({ projectId: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      const orgProjects = await listProjectsByOrg(ctx.activeOrganizationId)
      const project = orgProjects.find((p) => p.id === input.projectId)
      if (!project) {
        throw new TRPCError({ code: "FORBIDDEN" })
      }

      return listRepositoriesByProject(input.projectId)
    }),
})
