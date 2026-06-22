"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
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

function ComingSoon() {
  return (
    <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
      Coming soon
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
          <ComingSoon />
        </TabsContent>

        <TabsContent value="tasks" className="mt-6">
          <ComingSoon />
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
