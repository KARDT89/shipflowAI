import type { InferInsertModel } from "drizzle-orm"
import { and, asc, eq } from "drizzle-orm"

import { db } from "../client"
import {
  featureRequests,
  prds,
  projects,
  tasks,
  workspaces,
} from "../schema/domain"
import type { taskStatus } from "../schema/domain"

type TaskStatus = (typeof taskStatus.enumValues)[number]

export async function createTasksForPrd({
  prdId,
  generatedTasks,
}: {
  prdId: string
  generatedTasks: Array<{ title: string; description: string }>
}) {
  if (generatedTasks.length === 0) return []

  const values: Array<InferInsertModel<typeof tasks>> = generatedTasks.map(
    (task, index) => ({
      prdId,
      title: task.title,
      description: task.description,
      order: index,
    })
  )

  return db.insert(tasks).values(values).returning()
}

export async function listTasksByFeatureRequestId(
  featureRequestId: string,
  organizationId: string
) {
  return db
    .select({ task: tasks })
    .from(tasks)
    .innerJoin(prds, eq(tasks.prdId, prds.id))
    .innerJoin(featureRequests, eq(prds.featureRequestId, featureRequests.id))
    .innerJoin(projects, eq(featureRequests.projectId, projects.id))
    .innerJoin(workspaces, eq(projects.workspaceId, workspaces.id))
    .where(
      and(
        eq(featureRequests.id, featureRequestId),
        eq(workspaces.organizationId, organizationId)
      )
    )
    .orderBy(asc(tasks.order))
    .then((rows) => rows.map((r) => r.task))
}

export async function updateTaskStatus(id: string, status: TaskStatus) {
  const [row] = await db
    .update(tasks)
    .set({ status })
    .where(eq(tasks.id, id))
    .returning()
  return row
}
