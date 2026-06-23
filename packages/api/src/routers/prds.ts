import {
  approveLatestPrdForFeatureRequest,
  createLifecycleEvent,
  getPrdForFeatureRequest,
  updateFeatureRequestStatus,
} from "@shipflow/db"
import { inngest } from "@shipflow/inngest"
import { TRPCError } from "@trpc/server"
import { z } from "zod"

import { createTRPCRouter, tenantProcedure } from "../trpc"

export const prdsRouter = createTRPCRouter({
  getByFeatureRequestId: tenantProcedure
    .input(z.object({ featureRequestId: z.string().uuid() }))
    .query(({ input, ctx }) =>
      getPrdForFeatureRequest(input.featureRequestId, ctx.activeOrganizationId)
    ),

  approve: tenantProcedure
    .input(z.object({ featureRequestId: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      const prd = await getPrdForFeatureRequest(
        input.featureRequestId,
        ctx.activeOrganizationId
      )

      if (!prd) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No PRD found for this feature request.",
        })
      }

      if (prd.status !== "draft") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Only draft PRDs can be approved.",
        })
      }

      const approvedPrd = await approveLatestPrdForFeatureRequest(
        input.featureRequestId,
        ctx.activeOrganizationId
      )

      if (!approvedPrd) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "The latest PRD could not be approved.",
        })
      }

      await updateFeatureRequestStatus(input.featureRequestId, "prd_approved")

      await createLifecycleEvent({
        featureRequestId: input.featureRequestId,
        actorType: "user",
        actorId: ctx.session.user.id,
        event: "prd_approved",
        fromStatus: "prd_generated",
        toStatus: "prd_approved",
        payload: {
          prdId: approvedPrd.id,
          version: approvedPrd.version,
        },
      })

      await inngest.send({
        name: "prd.approved",
        data: {
          featureRequestId: input.featureRequestId,
          organizationId: ctx.activeOrganizationId,
          prdId: approvedPrd.id,
        },
      })

      return approvedPrd
    }),
})
