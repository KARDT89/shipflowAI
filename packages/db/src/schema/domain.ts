import { relations } from "drizzle-orm"
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core"

import { organization, user } from "./auth"

export const featureRequestStatus = pgEnum("feature_request_status", [
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

export const actorType = pgEnum("actor_type", ["user", "ai", "system"])
export const taskStatus = pgEnum("task_status", ["todo", "in_progress", "done"])
export const prdStatus = pgEnum("prd_status", [
  "draft",
  "approved",
  "revision_requested",
])
export const reviewStatus = pgEnum("review_status", [
  "running",
  "passed",
  "failed",
  "errored",
])
export const issueSeverity = pgEnum("issue_severity", [
  "blocking",
  "non_blocking",
])
export const approvalDecision = pgEnum("approval_decision", [
  "approved",
  "rejected",
])

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
}

export const workspaces = pgTable(
  "workspaces",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("workspaces_organization_slug_unique").on(
      table.organizationId,
      table.slug
    ),
    index("workspaces_organization_idx").on(table.organizationId),
  ]
)

export const workspaceMembers = pgTable(
  "workspace_members",
  {
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    role: text("role").default("member").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("workspace_members_unique").on(table.workspaceId, table.userId),
  ]
)

export const projects = pgTable(
  "projects",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("projects_workspace_slug_unique").on(
      table.workspaceId,
      table.slug
    ),
    index("projects_workspace_idx").on(table.workspaceId),
  ]
)

export const repositories = pgTable(
  "repositories",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    githubInstallationId: text("github_installation_id").notNull(),
    githubRepositoryId: text("github_repository_id").notNull(),
    owner: text("owner").notNull(),
    name: text("name").notNull(),
    defaultBranch: text("default_branch").default("main").notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("repositories_github_id_unique").on(table.githubRepositoryId),
  ]
)

export const featureRequests = pgTable(
  "feature_requests",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    source: text("source").default("manual").notNull(),
    rawInput: text("raw_input").notNull(),
    status: featureRequestStatus("status").default("draft").notNull(),
    createdBy: text("created_by")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    ...timestamps,
  },
  (table) => [
    index("feature_requests_project_status_idx").on(
      table.projectId,
      table.status
    ),
  ]
)

export const clarificationThreads = pgTable("clarification_threads", {
  id: uuid("id").defaultRandom().primaryKey(),
  featureRequestId: uuid("feature_request_id")
    .notNull()
    .references(() => featureRequests.id, { onDelete: "cascade" }),
  question: text("question").notNull(),
  answer: text("answer"),
  askedByAi: boolean("asked_by_ai").default(true).notNull(),
  ...timestamps,
})

export const prds = pgTable("prds", {
  id: uuid("id").defaultRandom().primaryKey(),
  featureRequestId: uuid("feature_request_id")
    .notNull()
    .references(() => featureRequests.id, { onDelete: "cascade" }),
  problemStatement: text("problem_statement").notNull(),
  goals: jsonb("goals").$type<string[]>().default([]).notNull(),
  nonGoals: jsonb("non_goals").$type<string[]>().default([]).notNull(),
  userStories: jsonb("user_stories").$type<string[]>().default([]).notNull(),
  acceptanceCriteria: jsonb("acceptance_criteria")
    .$type<string[]>()
    .default([])
    .notNull(),
  edgeCases: jsonb("edge_cases").$type<string[]>().default([]).notNull(),
  successMetrics: jsonb("success_metrics")
    .$type<string[]>()
    .default([])
    .notNull(),
  status: prdStatus("status").default("draft").notNull(),
  version: integer("version").default(1).notNull(),
  ...timestamps,
})

export const tasks = pgTable(
  "tasks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    prdId: uuid("prd_id")
      .notNull()
      .references(() => prds.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description").notNull(),
    status: taskStatus("status").default("todo").notNull(),
    order: integer("order").default(0).notNull(),
    ...timestamps,
  },
  (table) => [index("tasks_prd_order_idx").on(table.prdId, table.order)]
)

export const pullRequests = pgTable(
  "pull_requests",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    repositoryId: uuid("repository_id")
      .notNull()
      .references(() => repositories.id, { onDelete: "cascade" }),
    featureRequestId: uuid("feature_request_id").references(
      () => featureRequests.id,
      {
        onDelete: "set null",
      }
    ),
    githubPrNumber: integer("github_pr_number").notNull(),
    headSha: text("head_sha").notNull(),
    baseSha: text("base_sha").notNull(),
    status: text("status").default("open").notNull(),
    openedAt: timestamp("opened_at", { withTimezone: true }).notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("pull_requests_repository_number_unique").on(
      table.repositoryId,
      table.githubPrNumber
    ),
  ]
)

export const reviewRuns = pgTable("review_runs", {
  id: uuid("id").defaultRandom().primaryKey(),
  pullRequestId: uuid("pull_request_id")
    .notNull()
    .references(() => pullRequests.id, { onDelete: "cascade" }),
  trigger: text("trigger").notNull(),
  status: reviewStatus("status").default("running").notNull(),
  summary: text("summary"),
  startedAt: timestamp("started_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
})

export const reviewIssues = pgTable("review_issues", {
  id: uuid("id").defaultRandom().primaryKey(),
  reviewRunId: uuid("review_run_id")
    .notNull()
    .references(() => reviewRuns.id, { onDelete: "cascade" }),
  severity: issueSeverity("severity").notNull(),
  category: text("category").notNull(),
  filePath: text("file_path").notNull(),
  line: integer("line"),
  description: text("description").notNull(),
  reasoning: text("reasoning").notNull(),
  resolved: boolean("resolved").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
})

export const releaseApprovals = pgTable("release_approvals", {
  id: uuid("id").defaultRandom().primaryKey(),
  featureRequestId: uuid("feature_request_id")
    .notNull()
    .references(() => featureRequests.id, { onDelete: "cascade" }),
  decidedBy: text("decided_by")
    .notNull()
    .references(() => user.id, { onDelete: "restrict" }),
  decision: approvalDecision("decision").notNull(),
  decidedAt: timestamp("decided_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  notes: text("notes"),
})

export const lifecycleEvents = pgTable(
  "lifecycle_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    featureRequestId: uuid("feature_request_id")
      .notNull()
      .references(() => featureRequests.id, { onDelete: "cascade" }),
    actorType: actorType("actor_type").notNull(),
    actorId: text("actor_id"),
    event: text("event").notNull(),
    fromStatus: featureRequestStatus("from_status"),
    toStatus: featureRequestStatus("to_status"),
    payload: jsonb("payload")
      .$type<Record<string, unknown>>()
      .default({})
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("lifecycle_events_feature_created_idx").on(
      table.featureRequestId,
      table.createdAt
    ),
  ]
)

export const workspacesRelations = relations(workspaces, ({ many }) => ({
  members: many(workspaceMembers),
  projects: many(projects),
}))

export const projectsRelations = relations(projects, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [projects.workspaceId],
    references: [workspaces.id],
  }),
  repositories: many(repositories),
  featureRequests: many(featureRequests),
}))

export const prdsRelations = relations(prds, ({ one, many }) => ({
  featureRequest: one(featureRequests, {
    fields: [prds.featureRequestId],
    references: [featureRequests.id],
  }),
  tasks: many(tasks),
}))

export const reviewRunsRelations = relations(reviewRuns, ({ one, many }) => ({
  pullRequest: one(pullRequests, {
    fields: [reviewRuns.pullRequestId],
    references: [pullRequests.id],
  }),
  issues: many(reviewIssues),
}))
