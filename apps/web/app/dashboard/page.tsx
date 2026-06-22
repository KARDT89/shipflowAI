import { auth } from "@shipflow/auth"
import { dehydrate, HydrationBoundary } from "@tanstack/react-query"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@workspace/ui/components/breadcrumb"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@workspace/ui/components/empty"
import { Separator } from "@workspace/ui/components/separator"
import { SidebarTrigger } from "@workspace/ui/components/sidebar"
import { headers } from "next/headers"

import { FeatureRequestsPanel } from "@/components/feature-requests-panel"
import { getQueryClient, trpc } from "@/trpc/server"

export const dynamic = "force-dynamic"

const metricTiles = [
  { label: "Active reviews", value: "—" },
  { label: "Pending approval", value: "—" },
  { label: "In development", value: "—" },
  { label: "Shipped", value: "—" },
]

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  const queryClient = getQueryClient()

  if (session?.session.activeOrganizationId) {
    await queryClient.prefetchQuery(trpc.projects.list.queryOptions())
  }

  const hasOrg = Boolean(session?.session.activeOrganizationId)

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex h-14 shrink-0 items-center gap-2 px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mx-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>Dashboard</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <div className="flex flex-1 flex-col gap-6 p-6 pt-0">
        <div>
          <h1 className="text-xl font-medium">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Feature requests across all projects
          </p>
        </div>

        <Separator />

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {metricTiles.map((tile) => (
            <Card key={tile.label}>
              <CardHeader>
                <CardDescription>{tile.label}</CardDescription>
                <CardTitle className="text-2xl tabular-nums">
                  {tile.value}
                </CardTitle>
              </CardHeader>
            </Card>
          ))}
        </div>

        {hasOrg ? (
          <HydrationBoundary state={dehydrate(queryClient)}>
            <FeatureRequestsPanel />
          </HydrationBoundary>
        ) : (
          <Empty>
            <EmptyHeader>
              <EmptyTitle>No organization selected</EmptyTitle>
              <EmptyDescription>
                Select or create an organization using the switcher in the
                sidebar to get started.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </div>
    </div>
  )
}
