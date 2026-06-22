import { featureRequestsRouter } from "./routers/featureRequests"
import { healthRouter } from "./routers/health"
import { projectsRouter } from "./routers/projects"
import { createCallerFactory, createTRPCRouter } from "./trpc"

export const appRouter = createTRPCRouter({
  health: healthRouter,
  featureRequests: featureRequestsRouter,
  projects: projectsRouter,
})

export type AppRouter = typeof appRouter
export const createCaller = createCallerFactory(appRouter)
