import {
  createRepository,
  findGithubInstallation,
  listProjectsByOrg,
  listRepositoriesByProject,
} from "@shipflow/db"
import { getInstallationRepo } from "@shipflow/github"
import { TRPCError } from "@trpc/server"
import { z } from "zod"

import {
  createTRPCRouter,
  organizationManagerProcedure,
  tenantProcedure,
} from "../trpc"

export const repositoriesRouter = createTRPCRouter({
  link: organizationManagerProcedure
    .input(
      z.object({
        projectId: z.string().uuid(),
        installationId: z.string().min(1),
        githubRepositoryId: z.string().min(1),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const organizationId = ctx.activeOrganizationId
      if (!organizationId) {
        throw new TRPCError({ code: "PRECONDITION_FAILED" })
      }
      const orgProjects = await listProjectsByOrg(organizationId)
      const project = orgProjects.find((p) => p.id === input.projectId)
      if (!project) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Project does not belong to the active organization.",
        })
      }

      const installation = await findGithubInstallation(input.installationId)
      if (!installation || installation.organizationId !== organizationId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "GitHub installation is not linked to this organization.",
        })
      }

      const repository = await getInstallationRepo(
        Number(input.installationId),
        input.githubRepositoryId
      )
      if (!repository) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Repository is not accessible to your GitHub account.",
        })
      }

      return createRepository({
        projectId: input.projectId,
        githubInstallationId: input.installationId,
        githubRepositoryId: input.githubRepositoryId,
        owner: repository.owner,
        name: repository.name,
        defaultBranch: repository.defaultBranch,
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
