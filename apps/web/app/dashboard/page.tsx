import { auth } from "@shipflow/auth"
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

import { OrganizationForm, SignOutButton } from "@/components/dashboard-actions"

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session) {
    redirect("/login")
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
            {session.session.activeOrganizationId ? (
              <p className="text-sm text-muted-foreground">
                Active organization: {session.session.activeOrganizationId}
              </p>
            ) : (
              <OrganizationForm />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Feature requests</CardTitle>
            <CardDescription>
              Your delivery lifecycle will appear here.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              No feature requests yet.
            </p>
          </CardContent>
        </Card>
      </section>
    </main>
  )
}
