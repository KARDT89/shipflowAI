import { auth } from "@shipflow/auth"
import { dehydrate, HydrationBoundary } from "@tanstack/react-query"
import { Badge } from "@workspace/ui/components/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

import {
  OrganizationPanel,
  SignOutButton,
} from "@/components/dashboard-actions"
import { TenantHealthCard } from "@/components/tenant-health-card"
import { getQueryClient, trpc } from "@/trpc/server"

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session) {
    redirect("/login")
  }

  const queryClient = getQueryClient()

  if (session.session.activeOrganizationId) {
    await queryClient.prefetchQuery(trpc.health.authenticated.queryOptions())
  }

  return (
    <main className="mx-auto min-h-svh max-w-6xl px-6 py-10">
      <header className="flex items-center justify-between gap-6">
        <div>
          <p className="text-sm text-muted-foreground">ShipFlow AI</p>
          <h1 className="text-2xl font-semibold tracking-tight">
            Welcome, {session.user.name}
          </h1>
        </div>
        <SignOutButton />
      </header>

      <section className="mt-12 grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <CardTitle>Organization</CardTitle>
              <Badge
                variant={
                  session.session.activeOrganizationId ? "default" : "secondary"
                }
              >
                {session.session.activeOrganizationId
                  ? "Active"
                  : "Setup required"}
              </Badge>
            </div>
            <CardDescription>
              Organizations own workspaces, projects, repositories, and billing.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <OrganizationPanel />
          </CardContent>
        </Card>

        {session.session.activeOrganizationId ? (
          <HydrationBoundary state={dehydrate(queryClient)}>
            <TenantHealthCard />
          </HydrationBoundary>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Tenant API</CardTitle>
              <CardDescription>
                Select or create an organization to enable tenant access.
              </CardDescription>
            </CardHeader>
          </Card>
        )}
      </section>
    </main>
  )
}
