import { auth } from "@shipflow/auth"
import {
  findGithubInstallation,
  findMembership,
  listProjectsByOrg,
  upsertGithubInstallation,
} from "@shipflow/db"
import {
  getInstallationAccount,
  listInstallationRepositories,
  type GitHubRepository,
} from "@shipflow/github"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { headers } from "next/headers"
import Link from "next/link"
import { redirect } from "next/navigation"

import { GitHubInstallCallbackClient } from "@/components/github-install-callback"

export const dynamic = "force-dynamic"

function ErrorState({
  message,
  action,
}: {
  message: string
  action?: { label: string; href: string }
}) {
  return (
    <main className="flex min-h-svh items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
            <i className="ri-error-warning-line text-lg text-destructive" aria-hidden />
          </div>
          <CardTitle>GitHub connection failed</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          <p className="text-sm text-muted-foreground">{message}</p>
          {action ? (
            <Button asChild>
              <Link href={action.href}>{action.label}</Link>
            </Button>
          ) : null}
          <Button asChild variant="outline">
            <Link href="/dashboard">Back to dashboard</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  )
}

async function loadVerifiedSetup({
  installationId,
  installationNumber,
  organizationId,
  userId,
}: {
  installationId: string
  installationNumber: number
  organizationId: string
  userId: string
}): Promise<
  | { error: string }
  | {
      accountLogin: string
      projects: Awaited<ReturnType<typeof listProjectsByOrg>>
      repositories: GitHubRepository[]
    }
> {
  try {
    const account = await getInstallationAccount(installationNumber)
    if (!account) {
      return {
        error:
          "This installation could not be verified. Make sure the GitHub App is installed and try again.",
      }
    }

    const existing = await findGithubInstallation(installationId)
    if (existing && existing.organizationId !== organizationId) {
      return {
        error:
          "This GitHub installation is already connected to another organization.",
      }
    }

    const installation = await upsertGithubInstallation({
      organizationId,
      installationId,
      accountId: String(account.id),
      accountLogin: account.login,
      accountType: account.type,
      verifiedBy: userId,
    })
    if (!installation) {
      return {
        error: "The installation could not be assigned to this organization.",
      }
    }

    const [repositories, projects] = await Promise.all([
      listInstallationRepositories(installationNumber),
      listProjectsByOrg(organizationId),
    ])
    return {
      accountLogin: account.login,
      projects,
      repositories,
    }
  } catch (err) {
    console.error("[github/setup] loadVerifiedSetup failed:", err)
    return {
      error: "Something went wrong connecting your GitHub installation. Please try again.",
    }
  }
}

export default async function GitHubSetupPage({
  searchParams,
}: {
  searchParams: Promise<{ installation_id?: string }>
}) {
  const { installation_id: rawInstallationId } = await searchParams
  if (!rawInstallationId) redirect("/dashboard")
  const installationNumber = Number(rawInstallationId)
  if (!Number.isSafeInteger(installationNumber) || installationNumber <= 0) {
    return <ErrorState message="GitHub returned an invalid installation." />
  }

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
    return (
      <ErrorState message="Only organization owners and admins can connect GitHub." />
    )
  }

  const accounts = await auth.api.listUserAccounts({ headers: requestHeaders })
  if (!accounts.some((a) => a.providerId === "github")) {
    return (
      <ErrorState
        message="Link your GitHub account first before completing the installation."
        action={{ label: "Link GitHub account", href: "/github/install" }}
      />
    )
  }

  const setup = await loadVerifiedSetup({
    installationId: rawInstallationId,
    installationNumber,
    organizationId,
    userId: session.user.id,
  })
  if ("error" in setup)
    return (
      <ErrorState
        message={setup.error}
        action={{ label: "Connect GitHub again", href: "/github/install" }}
      />
    )

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-3xl flex-col gap-8 px-6 py-12">
      {/* Header */}
      <div className="grid gap-4">
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <i className="ri-arrow-left-line" aria-hidden />
            Dashboard
          </Link>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border bg-card shadow-sm">
              <i className="ri-github-fill text-2xl" aria-hidden />
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight">
                Assign repositories
              </h1>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Choose which repositories to link to your projects. You can
                change this anytime from project settings.
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 rounded-lg border bg-muted/50 px-3 py-2">
            <i className="ri-checkbox-circle-fill text-sm text-green-500" aria-hidden />
            <span className="text-sm font-medium">{setup.accountLogin}</span>
            <span className="text-xs text-muted-foreground">verified</span>
          </div>
        </div>
      </div>

      {/* Repo assignment */}
      <GitHubInstallCallbackClient
        installationId={rawInstallationId}
        repositories={setup.repositories}
        projects={setup.projects}
      />
    </main>
  )
}
