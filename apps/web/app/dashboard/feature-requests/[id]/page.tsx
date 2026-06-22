import { auth } from "@shipflow/auth"
import { dehydrate, HydrationBoundary } from "@tanstack/react-query"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@workspace/ui/components/breadcrumb"
import { Separator } from "@workspace/ui/components/separator"
import { SidebarTrigger } from "@workspace/ui/components/sidebar"
import { headers } from "next/headers"
import { notFound, redirect } from "next/navigation"

import { FeatureRequestDetail } from "@/components/feature-request-detail"
import { getQueryClient, trpc } from "@/trpc/server"

export const dynamic = "force-dynamic"

export default async function FeatureRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session) redirect("/login")

  const queryClient = getQueryClient()

  if (session.session.activeOrganizationId) {
    try {
      await queryClient.fetchQuery(
        trpc.featureRequests.getById.queryOptions({ id })
      )
    } catch {
      notFound()
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex h-14 shrink-0 items-center gap-2 px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mx-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Feature Request</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <div className="flex flex-1 flex-col gap-6 p-6 pt-0">
        <HydrationBoundary state={dehydrate(queryClient)}>
          <FeatureRequestDetail id={id} />
        </HydrationBoundary>
      </div>
    </div>
  )
}
