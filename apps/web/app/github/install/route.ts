import { auth } from "@shipflow/auth"
import { findMembership } from "@shipflow/db"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

export async function GET() {
  const requestHeaders = await headers()
  const session = await auth.api.getSession({ headers: requestHeaders })
  if (!session) redirect("/login?callbackURL=/github/install")

  const organizationId = session.session.activeOrganizationId
  if (!organizationId) redirect("/dashboard")

  const membership = await findMembership({
    userId: session.user.id,
    organizationId,
  })
  if (!membership || !["owner", "admin"].includes(membership.role)) {
    redirect("/dashboard?github=forbidden")
  }

  const accounts = await auth.api.listUserAccounts({ headers: requestHeaders })
  if (!accounts.some((account) => account.providerId === "github")) {
    redirect("/dashboard?github=link-required")
  }

  const slug = process.env.GITHUB_APP_SLUG
  if (!slug) redirect("/dashboard?github=not-configured")
  redirect(
    `https://github.com/apps/${encodeURIComponent(slug)}/installations/new`
  )
}
