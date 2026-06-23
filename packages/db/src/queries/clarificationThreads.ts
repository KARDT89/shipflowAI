import type { InferInsertModel } from "drizzle-orm"
import { and, asc, eq } from "drizzle-orm"

import { db } from "../client"
import {
  clarificationThreads,
  featureRequests,
  projects,
  workspaces,
} from "../schema/domain"

export async function createClarificationQuestions({
  featureRequestId,
  questions,
}: {
  featureRequestId: string
  questions: string[]
}) {
  if (questions.length === 0) return []

  const values: Array<InferInsertModel<typeof clarificationThreads>> =
    questions.map((question) => ({
      featureRequestId,
      question,
      askedByAi: true,
    }))

  return db.insert(clarificationThreads).values(values).returning()
}

export async function listClarificationThreadsByFeatureRequestId(
  featureRequestId: string,
  organizationId: string
) {
  return db
    .select({ clarificationThread: clarificationThreads })
    .from(clarificationThreads)
    .innerJoin(
      featureRequests,
      eq(clarificationThreads.featureRequestId, featureRequests.id)
    )
    .innerJoin(projects, eq(featureRequests.projectId, projects.id))
    .innerJoin(workspaces, eq(projects.workspaceId, workspaces.id))
    .where(
      and(
        eq(clarificationThreads.featureRequestId, featureRequestId),
        eq(workspaces.organizationId, organizationId)
      )
    )
    .orderBy(asc(clarificationThreads.createdAt))
    .then((rows) => rows.map((row) => row.clarificationThread))
}
