Ready for review
Select text to add comments on the plan
ShipFlow AI — Automatic GitHub App Installation Flow
Context
The current "Link Repository" dialog asks users to manually copy-paste numeric GitHub installation IDs and repository IDs from webhook delivery payloads — completely opaque and wrong. A customer should just click "Connect GitHub", pick their repos on GitHub's own UI, and come back to ShipFlow where repos are already discovered and ready to assign to projects.

This replaces the manual LinkRepositoryDialog with a proper GitHub App installation flow that:

Sends the user to GitHub's app install page
Receives the callback with installation_id
Auto-discovers all repos for that installation via Octokit
Shows a clean "assign repo → project" UI
Calls the existing repositories.link mutation for each assignment
How GitHub App Installations Work
User clicks "Connect GitHub" → opens https://github.com/apps/{APP_SLUG}/installations/new
User selects repos on GitHub's UI → clicks Install
GitHub redirects to the App's Setup URL (configured in GitHub App settings) with: GET /github/callback?installation_id=12345678&setup_action=install
ShipFlow callback page uses githubApp.getInstallationOctokit(installationId) → lists all repos
User assigns repos to projects → calls existing repositories.link tRPC mutation
Redirects to dashboard ✅
What Needs to Be Set (One-Time GitHub App Config)
In GitHub App settings → "Setup URL": set to
https://matrix-nuptials-phonics.ngrok-free.dev/github/callback

Also need GITHUB_APP_SLUG env var (the URL-friendly name from github.com/apps/YOUR_SLUG).

Files to Create / Modify
1. packages/github/src/app.ts — add getInstallationRepos helper
export async function getInstallationRepos(installationId: number) {
  const octokit = await githubApp.getInstallationOctokit(installationId)
  const response = await octokit.request("GET /installation/repositories", {
    per_page: 100,
  })
  return response.data.repositories.map((r) => ({
    id: String(r.id),
    owner: r.owner.login,
    name: r.name,
    fullName: r.full_name,
    defaultBranch: r.default_branch,
  }))
}
Export from packages/github/src/index.ts.

2. apps/web/app/github/callback/page.tsx — new server page (outside dashboard route group)
Reads installation_id + setup_action from searchParams
Auth check via auth.api.getSession → redirects to /login if not signed in
Calls getInstallationRepos(Number(installation_id))
Prefetches projects.list via server-side tRPC
Passes repos + projects to <GitHubInstallCallbackClient>
If no installation_id in params → redirect to /dashboard
3. apps/web/components/github-install-callback.tsx — new "use client" component
State:

assignments: Record<repoId, projectId | "skip"> — one entry per discovered repo
UI:

One row per repo: repo name + project <Select> (options: user's projects + "Skip")
Submit button: "Link selected repositories" → for each repo with a project assigned, calls repositories.link mutation
On all mutations complete → router.push("/dashboard") + toast.success
Reuses:

useTRPCClient() from @/trpc/client
repositories.link mutation (already exists in packages/api/src/routers/repositories.ts)
4. apps/web/components/feature-requests-panel.tsx — replace manual dialog
Remove LinkRepositoryDialog component entirely
Remove "Link repository" button
Add "Connect GitHub" button (when projects exist) that opens: https://github.com/apps/${process.env.NEXT_PUBLIC_GITHUB_APP_SLUG}/installations/new as a regular <a href> with target="_blank" — GitHub's own UI handles the install
5. .env.local — add two new vars
GITHUB_APP_SLUG=your-app-slug-here
NEXT_PUBLIC_GITHUB_APP_SLUG=your-app-slug-here
(NEXT_PUBLIC_ needed because the dashboard button is a client component)

6. apps/web/app/api/webhooks/github/route.ts — add installation event handlers
webhooks.on("installation.deleted", async ({ payload }) => {
  // When user uninstalls the app, remove their repos from our DB
  // (requires adding a deleteRepositoriesByInstallationId query)
})
And handle installation.repositories_removed to clean up delinked repos.

Add deleteRepositoriesByInstallationId(installationId: string) to:

packages/db/src/queries/repositories.ts
packages/db/src/index.ts (export)
Verification
Set GITHUB_APP_SLUG in .env.local and set the Setup URL in GitHub App settings to the ngrok callback
pnpm dev — open localhost:3000/dashboard
Click "Connect GitHub" → GitHub install page opens
Select a repo → Install → GitHub redirects to /github/callback?installation_id=xxx
Callback page shows the repo auto-discovered — select a project → Link
Dashboard shows the repo linked
Open a PR on that repo → check pull_requests table gets a row
Bad path: visiting /github/callback with no session → redirects to /login
Bad path: installation_id not found by Octokit → shows error state, link back to dashboard
What is NOT changing
repositories.link tRPC procedure — already correct, no changes needed
createRepository DB query — already correct
Webhook pull_request handlers — unchanged