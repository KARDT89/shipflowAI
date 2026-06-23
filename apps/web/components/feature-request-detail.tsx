"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { Separator } from "@workspace/ui/components/separator"
import { Skeleton } from "@workspace/ui/components/skeleton"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs"
import { Textarea } from "@workspace/ui/components/textarea"
import { useState } from "react"
import { toast } from "sonner"

import {
  FeatureRequestStatusBadge,
  STATUS_CONFIG,
} from "@/lib/feature-request-status"
import { useTRPC, useTRPCClient } from "@/trpc/client"

const STATUS_OPTIONS = Object.entries(STATUS_CONFIG).map(([value, { label }]) => ({
  value,
  label,
}))

function DetailSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <Skeleton className="h-7 w-2/3" />
        <Skeleton className="h-5 w-28" />
      </div>
      <Skeleton className="h-4 w-48" />
      <Skeleton className="h-9 w-full max-w-xs" />
      <Skeleton className="h-48 w-full" />
    </div>
  )
}

const PRD_STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  approved: "Approved",
  revision_requested: "Revision Requested",
}

function ComingSoon() {
  return (
    <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
      Coming soon
    </div>
  )
}

function ClarificationAnswers({ featureRequestId }: { featureRequestId: string }) {
  const trpc = useTRPC()
  const trpcClient = useTRPCClient()
  const queryClient = useQueryClient()
  const [answers, setAnswers] = useState<Record<string, string>>({})

  const clarificationsQuery = trpc.featureRequests.listClarifications.queryOptions({
    featureRequestId,
  })
  const featureRequestQuery = trpc.featureRequests.getById.queryOptions({
    id: featureRequestId,
  })
  const prdQuery = trpc.prds.getByFeatureRequestId.queryOptions({
    featureRequestId,
  })

  const { data: clarifications, isPending } = useQuery(clarificationsQuery)

  const answerMutation = useMutation({
    mutationFn: () =>
      trpcClient.featureRequests.answerClarification.mutate({
        featureRequestId,
        answers:
          clarifications?.map((thread) => ({
            clarificationThreadId: thread.id,
            answer: (answers[thread.id] ?? thread.answer ?? "").trim(),
          })) ?? [],
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clarificationsQuery.queryKey })
      queryClient.invalidateQueries({ queryKey: featureRequestQuery.queryKey })
      queryClient.invalidateQueries({ queryKey: prdQuery.queryKey })
      toast.success("Answers submitted. PRD generation is running.")
    },
    onError: (err: { message?: string }) => {
      toast.error(`Could not submit answers. ${err.message ?? "Try again."}`)
    },
  })

  if (isPending) return <Skeleton className="h-40 w-full" />

  if (!clarifications || clarifications.length === 0) return null

  const hasMissingAnswer = clarifications.some(
    (thread) => (answers[thread.id] ?? thread.answer ?? "").trim().length === 0
  )
  const allAnswered = clarifications.every(
    (thread) => thread.answer && thread.answer.trim().length > 0
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Clarification Questions
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {clarifications.map((thread, index) => (
          <div key={thread.id} className="flex flex-col gap-2">
            <p className="text-sm font-medium">
              {index + 1}. {thread.question}
            </p>
            <Textarea
              value={answers[thread.id] ?? thread.answer ?? ""}
              disabled={Boolean(thread.answer) || answerMutation.isPending}
              onChange={(event) =>
                setAnswers((current) => ({
                  ...current,
                  [thread.id]: event.target.value,
                }))
              }
              placeholder="Answer this clarification"
            />
          </div>
        ))}

        <div className="flex items-center gap-3">
          <Button
            disabled={hasMissingAnswer || answerMutation.isPending}
            onClick={() => answerMutation.mutate()}
          >
            {answerMutation.isPending
              ? "Submitting..."
              : allAnswered
                ? "Generate PRD"
                : "Submit answers"}
          </Button>
          {allAnswered && (
            <p className="text-xs text-muted-foreground">
              Answers submitted. PRD generation should start shortly.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function PrdTab({ featureRequestId }: { featureRequestId: string }) {
  const trpc = useTRPC()
  const trpcClient = useTRPCClient()
  const queryClient = useQueryClient()

  const prdQuery = trpc.prds.getByFeatureRequestId.queryOptions({
    featureRequestId,
  })
  const featureRequestQuery = trpc.featureRequests.getById.queryOptions({
    id: featureRequestId,
  })
  const tasksQuery = trpc.tasks.listByFeatureRequest.queryOptions({
    featureRequestId,
  })

  const { data: prd, isPending } = useQuery(prdQuery)

  const approveMutation = useMutation({
    mutationFn: () => trpcClient.prds.approve.mutate({ featureRequestId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: prdQuery.queryKey })
      queryClient.invalidateQueries({ queryKey: featureRequestQuery.queryKey })
      queryClient.invalidateQueries({ queryKey: tasksQuery.queryKey })
      toast.success("PRD approved. Task generation is running.")
    },
    onError: (err: { message?: string }) => {
      toast.error(`Could not approve PRD. ${err.message ?? "Try again."}`)
    },
  })

  if (isPending) return <Skeleton className="h-48 w-full" />

  if (!prd) {
    return (
      <Card>
        <CardContent className="flex h-48 items-center justify-center text-sm text-muted-foreground">
          PRD not yet generated. It will appear here once the AI workflow runs.
        </CardContent>
      </Card>
    )
  }

  const sections: { label: string; value: string | string[] }[] = [
    { label: "Problem Statement", value: prd.problemStatement },
    { label: "Goals", value: prd.goals },
    { label: "Non-Goals", value: prd.nonGoals },
    { label: "User Stories", value: prd.userStories },
    { label: "Acceptance Criteria", value: prd.acceptanceCriteria },
    { label: "Edge Cases", value: prd.edgeCases },
    { label: "Success Metrics", value: prd.successMetrics },
  ]

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary">
          {PRD_STATUS_LABEL[prd.status] ?? prd.status}
        </Badge>
        <span className="text-xs text-muted-foreground">v{prd.version}</span>
        {prd.status === "draft" && (
          <Button
            className="ml-auto"
            disabled={approveMutation.isPending}
            onClick={() => approveMutation.mutate()}
          >
            {approveMutation.isPending ? "Approving..." : "Approve PRD"}
          </Button>
        )}
      </div>
      {sections.map(({ label, value }) => {
        if (Array.isArray(value) && value.length === 0) return null
        return (
          <Card key={label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {Array.isArray(value) ? (
                <ul className="list-disc space-y-1 pl-4 text-sm">
                  {value.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm">{value}</p>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

const TASK_STATUS_NEXT: Record<string, "todo" | "in_progress" | "done"> = {
  todo: "in_progress",
  in_progress: "done",
  done: "todo",
}

const TASK_STATUS_ICON: Record<string, string> = {
  todo: "ri-checkbox-blank-circle-line",
  in_progress: "ri-refresh-line",
  done: "ri-checkbox-circle-line",
}

const TASK_STATUS_LABEL: Record<string, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  done: "Done",
}

function TasksTab({ featureRequestId }: { featureRequestId: string }) {
  const trpc = useTRPC()
  const trpcClient = useTRPCClient()
  const queryClient = useQueryClient()

  const tasksQuery = trpc.tasks.listByFeatureRequest.queryOptions({ featureRequestId })
  const { data: tasks, isPending } = useQuery(tasksQuery)

  const statusMutation = useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string
      status: "todo" | "in_progress" | "done"
    }) => trpcClient.tasks.updateStatus.mutate({ id, status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tasksQuery.queryKey })
    },
    onError: (err: { message?: string }) => {
      toast.error(`Could not update task. ${err.message ?? "Try again."}`)
    },
  })

  if (isPending) return <Skeleton className="h-48 w-full" />

  if (!tasks || tasks.length === 0) {
    return (
      <Card>
        <CardContent className="flex h-48 items-center justify-center text-sm text-muted-foreground">
          Tasks will appear here after the PRD is approved.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {tasks.map((task) => (
        <Card key={task.id}>
          <CardContent className="flex items-start gap-3 py-4">
            <button
              className="mt-0.5 shrink-0 text-lg text-muted-foreground hover:text-foreground disabled:opacity-50"
              disabled={statusMutation.isPending}
              title={`Mark as ${TASK_STATUS_LABEL[TASK_STATUS_NEXT[task.status] ?? "todo"]}`}
              onClick={() =>
                statusMutation.mutate({
                  id: task.id,
                  status: TASK_STATUS_NEXT[task.status] ?? "todo",
                })
              }
            >
              <i className={TASK_STATUS_ICON[task.status]} />
            </button>
            <div className="flex flex-col gap-0.5">
              <p className="text-sm font-medium leading-snug">{task.title}</p>
              {task.description && (
                <p className="text-xs text-muted-foreground">{task.description}</p>
              )}
            </div>
            <Badge variant="outline" className="ml-auto shrink-0 text-xs">
              {TASK_STATUS_LABEL[task.status]}
            </Badge>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export function FeatureRequestDetail({ id }: { id: string }) {
  const trpc = useTRPC()
  const trpcClient = useTRPCClient()
  const queryClient = useQueryClient()

  const { data: fr, isPending } = useQuery(
    trpc.featureRequests.getById.queryOptions({ id })
  )

  const statusMutation = useMutation({
    mutationFn: (status: string) =>
      trpcClient.featureRequests.updateStatus.mutate({
        id,
        status: status as Parameters<
          typeof trpcClient.featureRequests.updateStatus.mutate
        >[0]["status"],
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: trpc.featureRequests.getById.queryOptions({ id }).queryKey,
      })
      toast.success("Status updated")
    },
    onError: (err: { message?: string }) => {
      toast.error(`Could not update status. ${err.message ?? "Try again."}`)
    },
  })

  if (isPending) return <DetailSkeleton />

  if (!fr) return null

  const title =
    fr.rawInput.length > 80 ? `${fr.rawInput.slice(0, 80)}…` : fr.rawInput

  const createdDate = new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  }).format(new Date(fr.createdAt))

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-xl font-medium">{title}</h1>
          <FeatureRequestStatusBadge status={fr.status} />
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Created {createdDate} · {fr.source}
        </p>
      </div>

      <Separator />

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="prd">PRD</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="reviews">Review History</TabsTrigger>
          <TabsTrigger value="audit">Audit Log</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6 flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Request
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm">{fr.rawInput}</p>
            </CardContent>
          </Card>

          {fr.status === "clarifying" && (
            <ClarificationAnswers featureRequestId={id} />
          )}

          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium">Update status</p>
            <Select
              value={fr.status}
              disabled={statusMutation.isPending}
              onValueChange={(value) => statusMutation.mutate(value)}
            >
              <SelectTrigger className="w-56">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </TabsContent>

        <TabsContent value="prd" className="mt-6">
          <PrdTab featureRequestId={id} />
        </TabsContent>

        <TabsContent value="tasks" className="mt-6">
          <TasksTab featureRequestId={id} />
        </TabsContent>

        <TabsContent value="reviews" className="mt-6">
          <ComingSoon />
        </TabsContent>

        <TabsContent value="audit" className="mt-6">
          <ComingSoon />
        </TabsContent>
      </Tabs>
    </div>
  )
}
