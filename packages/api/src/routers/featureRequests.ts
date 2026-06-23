import {
  createFeatureRequest,
  getFeatureRequestById,
  getFeatureRequestForOrg,
  listClarificationThreadsByFeatureRequestId,
  listFeatureRequestsByProject,
  updateClarificationAnswers,
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

  listClarifications: tenantProcedure
    .input(z.object({ featureRequestId: z.string().uuid() }))
    .query(({ input, ctx }) =>
      listClarificationThreadsByFeatureRequestId(
        input.featureRequestId,
        ctx.activeOrganizationId
      )
    ),

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

  answerClarification: tenantProcedure
    .input(
      z.object({
        featureRequestId: z.string().uuid(),
        answers: z
          .array(
            z.object({
              clarificationThreadId: z.string().uuid(),
              answer: z.string().trim().min(1),
            })
          )
          .min(1),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const featureRequest = await getFeatureRequestForOrg(
        input.featureRequestId,
        ctx.activeOrganizationId
      )

      if (!featureRequest) throw new TRPCError({ code: "NOT_FOUND" })

      if (featureRequest.status !== "clarifying") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Clarification answers can only be submitted while clarifying.",
        })
      }

      const threads = await listClarificationThreadsByFeatureRequestId(
        input.featureRequestId,
        ctx.activeOrganizationId
      )

      if (threads.length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No clarification questions found for this feature request.",
        })
      }

      const threadsById = new Map(threads.map((thread) => [thread.id, thread]))
      const answersByThreadId = new Map(
        input.answers.map((answer) => [
          answer.clarificationThreadId,
          answer.answer.trim(),
        ])
      )

      const unknownAnswer = input.answers.find(
        (answer) => !threadsById.has(answer.clarificationThreadId)
      )

      if (unknownAnswer) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "One or more clarification answers do not belong here.",
        })
      }

      const unansweredThreads = threads.filter(
        (thread) => !thread.answer || thread.answer.trim().length === 0
      )
      const missingAnswer = unansweredThreads.find(
        (thread) => !answersByThreadId.has(thread.id)
      )

      if (missingAnswer) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Please answer every clarification question before submitting.",
        })
      }

      const updatedAnswers =
        unansweredThreads.length > 0
          ? await updateClarificationAnswers({
              featureRequestId: input.featureRequestId,
              answers: unansweredThreads.map((thread) => ({
                id: thread.id,
                answer: answersByThreadId.get(thread.id)!,
              })),
            })
          : []

      await inngest.send({
        name: "clarification.answered",
        data: {
          featureRequestId: input.featureRequestId,
          organizationId: ctx.activeOrganizationId,
        },
      })

      return {
        submitted: updatedAnswers.length,
      }
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
