import { getPrdForFeatureRequest } from "@shipflow/db"
import { z } from "zod"

import { createTRPCRouter, tenantProcedure } from "../trpc"

export const prdsRouter = createTRPCRouter({
  getByFeatureRequestId: tenantProcedure
    .input(z.object({ featureRequestId: z.string().uuid() }))
    .query(({ input, ctx }) =>
      getPrdForFeatureRequest(input.featureRequestId, ctx.activeOrganizationId)
    ),
})
