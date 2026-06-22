import { auth } from "@shipflow/auth"
import {
  findMembership,
  listGithubInstallationsByOrganization,
} from "@shipflow/db"
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
import { Separator } from "@workspace/ui/components/separator"
import { SidebarTrigger } from "@workspace/ui/components/sidebar"
import { headers } from "next/headers"

import { OrganizationForm } from "@/components/dashboard-actions"
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
  const requestHeaders = await headers()
  const session = await auth.api.getSession({ headers: requestHeaders })
  const queryClient = getQueryClient()
  const organizationId = session?.session.activeOrganizationId

  const [accounts, installations, membership] = session
    ? await Promise.all([
        auth.api.listUserAccounts({ headers: requestHeaders }),
        organizationId
          ? listGithubInstallationsByOrganization(organizationId)
          : Promise.resolve([]),
        organizationId
          ? findMembership({ userId: session.user.id, organizationId })
          : Promise.resolve(null),
      ])
    : [[], [], null]

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
            <FeatureRequestsPanel
              canManageGitHub={Boolean(
                membership && ["owner", "admin"].includes(membership.role)
              )}
              githubAccountLinked={accounts.some(
                (account) => account.providerId === "github"
              )}
              githubAppInstalled={installations.length > 0}
            />
          </HydrationBoundary>
        ) : (
          <div className="flex flex-col gap-4 max-w-md">
            <div>
              <h2 className="text-base font-medium">Create your organization</h2>
              <p className="text-sm text-muted-foreground">
                Get started by creating an organization to manage your projects.
              </p>
            </div>
            <OrganizationForm />
          </div>
        )}
      </div>
    </div>
  )
}
