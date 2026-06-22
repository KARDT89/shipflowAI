import { featureRequestsRouter } from "./routers/featureRequests"
import { healthRouter } from "./routers/health"
import { prdsRouter } from "./routers/prds"
import { projectsRouter } from "./routers/projects"
import { repositoriesRouter } from "./routers/repositories"
import { tasksRouter } from "./routers/tasks"
import { createCallerFactory, createTRPCRouter } from "./trpc"

export const appRouter = createTRPCRouter({
  health: healthRouter,
  featureRequests: featureRequestsRouter,
  projects: projectsRouter,
  repositories: repositoriesRouter,
  prds: prdsRouter,
  tasks: tasksRouter,
})

export type AppRouter = typeof appRouter
export const createCaller = createCallerFactory(appRouter)
