import { listTasksByFeatureRequestId, updateTaskStatus } from "@shipflow/db"
import { TRPCError } from "@trpc/server"
import { z } from "zod"

import { createTRPCRouter, tenantProcedure } from "../trpc"

export const tasksRouter = createTRPCRouter({
  listByFeatureRequest: tenantProcedure
    .input(z.object({ featureRequestId: z.string().uuid() }))
    .query(({ input, ctx }) =>
      listTasksByFeatureRequestId(
        input.featureRequestId,
        ctx.activeOrganizationId
      )
    ),

  updateStatus: tenantProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        status: z.enum(["todo", "in_progress", "done"]),
      })
    )
    .mutation(async ({ input }) => {
      const task = await updateTaskStatus(input.id, input.status)
      if (!task) throw new TRPCError({ code: "NOT_FOUND" })
      return task
    }),
})
