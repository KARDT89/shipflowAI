import { createTRPCRouter, tenantProcedure } from "../trpc"

export const healthRouter = createTRPCRouter({
  authenticated: tenantProcedure.query(({ ctx }) => ({
    status: "ok" as const,
    user: {
      id: ctx.session.user.id,
      email: ctx.session.user.email,
    },
    organization: {
      id: ctx.activeOrganizationId,
      role: ctx.membership.role,
    },
  })),
})
