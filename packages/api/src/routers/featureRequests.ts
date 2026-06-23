import {
  createFeatureRequest,
  getFeatureRequestById,
  getFeatureRequestForOrg,
  listFeatureRequestsByProject,
  updateFeatureRequestStatus,
} from "@shipflow/db"
import { inngest } from "@shipflow/inngest"
import { TRPCError } from "@trpc/server"
import { z } from "zod"

import { createTRPCRouter, tenantProcedure } from "../trpc"

const featureRequestStatusSchema = z.enum([
  "draft",
  "clarifying",
  "prd_generated",
  "prd_approved",
  "tasks_generated",
  "tasks_approved",
  "in_development",
  "ai_review_running",
  "review_failed",
  "fix_needed",
  "review_passed",
  "pending_human_approval",
  "approved",
  "rejected",
  "shipped",
])

export const featureRequestsRouter = createTRPCRouter({
  list: tenantProcedure
    .input(z.object({ projectId: z.string().uuid() }))
    .query(({ input }) => {
      return listFeatureRequestsByProject(input.projectId)
    }),

  get: tenantProcedure
    .input(z.object({ id: z.string().uuid(), projectId: z.string().uuid() }))
    .query(async ({ input }) => {
      const fr = await getFeatureRequestById(input.id, input.projectId)
      if (!fr) throw new TRPCError({ code: "NOT_FOUND" })
      return fr
    }),

  getById: tenantProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      const fr = await getFeatureRequestForOrg(
        input.id,
        ctx.activeOrganizationId
      )
      if (!fr) throw new TRPCError({ code: "NOT_FOUND" })
      return fr
    }),

  create: tenantProcedure
    .input(
      z.object({
        projectId: z.string().uuid(),
        rawInput: z.string().min(1),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const featureRequest = await createFeatureRequest({
        projectId: input.projectId,
        rawInput: input.rawInput,
        createdBy: ctx.session.user.id,
      })

      await inngest
        .send({
          name: "feature_request.created",
          data: {
            featureRequestId: featureRequest!.id,
            organizationId: ctx.activeOrganizationId,
          },
        })
        .catch((err) => {
          console.error("[featureRequests.create] inngest.send error", err)
        })

      return featureRequest
    }),

  updateStatus: tenantProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        status: featureRequestStatusSchema,
      })
    )
    .mutation(async ({ input }) => {
      const fr = await updateFeatureRequestStatus(input.id, input.status)
      if (!fr) throw new TRPCError({ code: "NOT_FOUND" })
      return fr
    }),
})
