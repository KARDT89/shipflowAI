import { initTRPC, TRPCError } from "@trpc/server"
import superjson from "superjson"

import type { TRPCContext } from "./context"

const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
})

const requireSession = t.middleware(({ ctx, next }) => {
  if (!ctx.session) {
    throw new TRPCError({ code: "UNAUTHORIZED" })
  }

  return next({
    ctx: {
      ...ctx,
      session: ctx.session,
    },
  })
})

const requireTenant = t.middleware(({ ctx, next }) => {
  if (!ctx.session) {
    throw new TRPCError({ code: "UNAUTHORIZED" })
  }

  if (!ctx.activeOrganizationId) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "Select an active organization before continuing.",
    })
  }

  if (
    !ctx.membership ||
    ctx.membership.userId !== ctx.session.user.id ||
    ctx.membership.organizationId !== ctx.activeOrganizationId
  ) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You are not a member of the active organization.",
    })
  }

  return next({
    ctx: {
      ...ctx,
      session: ctx.session,
      activeOrganizationId: ctx.activeOrganizationId,
      membership: ctx.membership,
    },
  })
})

export const createTRPCRouter = t.router
export const createCallerFactory = t.createCallerFactory
export const publicProcedure = t.procedure
export const protectedProcedure = t.procedure.use(requireSession)
export const tenantProcedure = protectedProcedure.use(requireTenant)
