# ShipFlow AI — Delta Tracker

Last updated: 2026-06-23 (session 5)

For ui related context refer to : docs/ui-spec.md

---

## Done ✅

| Area | What exists | File(s) |
|------|------------|---------|
| Monorepo scaffold | pnpm workspaces, Turborepo, shared TS/ESLint configs | `turbo.json`, `pnpm-workspace.yaml`, `packages/typescript-config/`, `packages/eslint-config/` |
| Database schema | All 13 domain tables + 7 auth tables, FK cascades, indexes, enums, Drizzle relations | `packages/db/src/schema/domain.ts`, `packages/db/src/schema/auth.ts` |
| Auth | Better Auth — email/password, organization plugin, session management | `packages/auth/src/` |
| tRPC middleware | 3 procedure tiers: public / protected / tenantProcedure (session + org + membership) | `packages/api/src/trpc.ts`, `packages/api/src/context.ts` |
| Auth UI | Login, signup, org selector, sign-out | `apps/web/app/(auth)/`, `apps/web/components/login-form.tsx`, `apps/web/components/signup-form.tsx` |
| DB query layer | `findMembership` + full feature request CRUD + project/workspace creation queries | `packages/db/src/queries/` |
| Feature request API | tRPC router: `list`, `get`, `getById`, `create`, `updateStatus` — all behind `tenantProcedure` | `packages/api/src/routers/featureRequests.ts` |
| Project/workspace API | tRPC router: `projects.list`, `projects.createWithWorkspace` (transactional) | `packages/api/src/routers/projects.ts` |
| App shell / sidebar | `AppSidebar` with logo, org switcher, nav, user menu + sign-out | `apps/web/components/app-sidebar.tsx`, `apps/web/app/dashboard/layout.tsx` |
| Dashboard UI | Page header + 4 metric tiles + `FeatureRequestsPanel` (clickable cards → detail page) | `apps/web/app/dashboard/page.tsx`, `apps/web/components/feature-requests-panel.tsx` |
| Feature request detail | `/dashboard/feature-requests/[id]` — 5-tab shell (Overview + PRD + Tasks live; Reviews/Audit stubbed) | `apps/web/app/dashboard/feature-requests/[id]/page.tsx`, `apps/web/components/feature-request-detail.tsx` |
| Shared status lib | `STATUS_CONFIG` + `FeatureRequestStatusBadge` | `apps/web/lib/feature-request-status.tsx` |
| Landing page | 5-section landing: nav, hero, lifecycle pipeline, feature cards, CTA + footer | `apps/web/app/page.tsx` |
| Shadcn preset | style `radix-mira`, icon library `remixicon` | `packages/ui/src/styles/globals.css`, `packages/ui/components.json` |
| Vitest setup | Test runner configured and passing | `apps/web/vitest.config.ts`, `apps/web/vitest.setup.ts` |
| 11 tests | API middleware (4) + OrganizationPanel (6) + tRPC smoke (1) | `packages/api/src/routers/health.test.ts`, `apps/web/components/dashboard-actions.test.tsx`, `apps/web/trpc/trpc-smoke.test.tsx` |
| PRD + Tasks data layer | DB queries + tRPC routers; FR detail PRD and Tasks tabs live | `packages/db/src/queries/prds.ts`, `packages/db/src/queries/tasks.ts`, `packages/api/src/routers/prds.ts`, `packages/api/src/routers/tasks.ts` |
| **GitHub App + webhooks** | `@shipflow/github` package; HMAC-verified POST handler; `pull_request` events → `pullRequests` table | `packages/github/src/`, `apps/web/app/api/webhooks/github/route.ts`, `packages/db/src/queries/repositories.ts`, `packages/db/src/queries/pullRequests.ts` |
| **Repo → project linking** | `repositories.link` + `repositories.listByProject` tRPC router; `createRepository` + `listRepositoriesByProject` DB queries; "Link repository" dialog on dashboard | `packages/api/src/routers/repositories.ts`, `packages/db/src/queries/repositories.ts`, `apps/web/components/feature-requests-panel.tsx` |
| **GitHub App install flow** | End-to-end GitHub App installation + repo assignment working: org creation, OAuth link, app install, setup page, repo → project linking | See session 5 below |

---

## What was built this session (2026-06-23 — GitHub install flow fixes, session 5)

### Create organization flow (`apps/web/components/app-sidebar.tsx`, `apps/web/app/dashboard/page.tsx`, `apps/web/components/dashboard-actions.tsx`)
- Sidebar "Create organization" DropdownMenuItem was a dead link to `/dashboard?create-org=1` (no handler existed) → replaced with a controlled Dialog containing `OrganizationForm`
- Dashboard empty state (no active org) was static text → replaced with `OrganizationForm` directly so new users can act immediately
- `OrganizationForm`: removed manual slug field; slug is now auto-generated from the name (`toSlug()` — lowercase, hyphens, strip non-alphanumeric)

### GitHub OAuth login redirect (`apps/web/components/social-auth-buttons.tsx`)
- "Continue with GitHub" on login/signup was hardcoding `callbackURL = "/github/install"` for GitHub — this sent users through the GitHub App installation flow instead of just signing them in
- Fixed: all providers now use the same `callbackURL` prop (typically `/dashboard`)

### Auth config (`packages/auth/src/index.ts`)
- `allowDifferentEmails: false` → `true` so users can link a GitHub account whose email differs from their app account email

### GitHub App setup page (`apps/web/app/github/setup/page.tsx`)
- Added pre-flight check: if the user has no GitHub account linked, show a "Link GitHub account" action button instead of crashing
- `loadVerifiedSetup` previously called `auth.api.getAccessToken` to retrieve the user's stored OAuth token — this failed because `encryptOAuthTokens: true` requires decryption that broke during the multi-redirect install chain
- Rewrote `loadVerifiedSetup` to use GitHub App-level auth entirely (no user OAuth token):
  - `getInstallationAccount(installationNumber)` — App JWT → `GET /app/installations/{id}`
  - `listInstallationRepositories(installationNumber)` — installation token → `GET /installation/repositories`
- Removed `requestHeaders` from `loadVerifiedSetup` signature (was only needed for `getAccessToken`)
- Added `console.error` to catch block so real errors appear in server logs
- Improved `ErrorState`: optional `action` prop adds a recovery button; all error paths now show "Connect GitHub again" → `/github/install`

### GitHub package (`packages/github/src/app.ts`, `packages/github/src/index.ts`)
- Added `getInstallationAccount(installationId: number)` — uses `app.octokit` (App JWT) to call `GET /app/installations/{id}`; returns account or `null`
- Added `listInstallationRepositories(installationId: number)` — uses `app.getInstallationOctokit()` (installation token) to paginate `GET /installation/repositories`
- Added `getInstallationRepo(installationId, repositoryId)` — finds a single repo from `listInstallationRepositories` by ID
- Fixed `getUserInstallationRepos` pagination bug: bare `return repositories` after the `if` block was short-circuiting the `while` loop after the first page (should be `page += 1`)
- All three new functions exported from `src/index.ts`

### Repositories tRPC router (`packages/api/src/routers/repositories.ts`)
- `repositories.link` was using `auth.api.getAccessToken` + `getUserInstallationRepo` (user OAuth) to verify repos — same token failure as the setup page
- Removed `auth` import and user-token block entirely; now uses `getInstallationRepo(installationId, repositoryId)` via app-level installation token

### GitHub App configuration required (not code)
- **Setup URL** in GitHub App settings must be set to `{app_url}/github/setup` with "Redirect on update" checked — without this, GitHub drops users on `github.com/settings/installations/{id}` after installation
- If the app is already installed, navigate directly to `/github/setup?installation_id={id}` to complete setup

### Verified working (typecheck)
- `pnpm --filter @shipflow/github typecheck` ✅
- `pnpm --filter @shipflow/api typecheck` ✅
- `pnpm --filter web typecheck` ✅
- Full flow verified: org creation → GitHub OAuth link → App install → `/github/setup` → repo assignment → dashboard shows `githubAppInstalled=true`

---

## What was built previously (2026-06-23 — Repo → project linking, session 4)

### Repositories tRPC router (`packages/api/src/routers/repositories.ts`)
- `repositories.link` — `tenantProcedure`; validates `projectId` belongs to active org via `listProjectsByOrg`; inserts into `repositories` table; returns the created row
- `repositories.listByProject` — `tenantProcedure`; same org ownership guard; returns all repos for a project

### DB queries (extended `packages/db/src/queries/repositories.ts`)
- `createRepository(data)` — insert and return; accepts `projectId`, `githubInstallationId`, `githubRepositoryId`, `owner`, `name`, `defaultBranch`
- `listRepositoriesByProject(projectId)` — simple select

### Link Repository UI (`apps/web/components/feature-requests-panel.tsx`)
- `LinkRepositoryDialog` — Dialog with project selector (Select), installation ID, repository ID, owner, repo name, and optional default branch fields
- "Link repository" outline button added next to "Submit feature request" in the panel header (only visible when projects exist)
- On success: invalidates `repositories.listByProject` query key and shows toast

### PRD alignment update
- `CLAUDE.md` — added alignment snapshot table, marked 4b in progress → done, added missing tRPC routers/pages to gap table
- `docs/PLAN.md` — added Current Status table showing step completion

### Verified working (typecheck)
- `pnpm --filter @shipflow/api typecheck` ✅
- `pnpm --filter web typecheck` ✅
- PR webhooks will now write to `pullRequests` once a `repositories` row is inserted via the UI

---

## What was built previously (2026-06-23 — GitHub App + webhooks)

### GitHub package (`packages/github/`)

**`packages/github/src/app.ts`**
- Octokit `App` singleton using `GITHUB_APP_ID` + `GITHUB_APP_PRIVATE_KEY` + `GITHUB_WEBHOOK_SECRET`
- Will be used by the future diff fetcher and PR comment poster (installation client comes later)

**`packages/github/src/webhooks.ts`**
- `Webhooks` instance for HMAC-SHA256 signature verification
- Secret falls back to `""` when env var not set — all requests will 401 until configured

**Dependencies added**: `@octokit/app`, `@octokit/webhooks`

### DB queries

**`packages/db/src/queries/repositories.ts`**
- `findRepositoryByGithubId(githubRepositoryId: string)` — looks up a `repositories` row by GitHub's integer repo ID (stored as text)
- Used by the webhook handler to resolve: GitHub repo ID → internal project linkage

**`packages/db/src/queries/pullRequests.ts`**
- `upsertPullRequest(data)` — insert or update on `(repositoryId, githubPrNumber)` unique index; updates `headSha`, `baseSha`, `status` on conflict
- `updatePullRequestStatus(repositoryId, githubPrNumber, status)` — sets `"merged"` or `"closed"`

### Webhook route handler

**`apps/web/app/api/webhooks/github/route.ts`** — `POST /api/webhooks/github`

Architecture decision: `verifyAndReceive` was split into two explicit steps:
1. `webhooks.verify(payload, signature)` — returns `false` on bad secret, never throws; used to gate the 401 response
2. `webhooks.receive({ id, name, payload })` — fires registered handlers; errors are caught and logged but still return 200 (GitHub should not retry for our internal handler failures)

This split is important: `verifyAndReceive` wraps all handler errors in an `AggregateError` and rethrows, which previously caused handler crashes (e.g. `payload.repository` missing on test payloads) to be returned as 401 instead of 200.

Event handlers registered at module level:
- `pull_request.opened / synchronize / reopened` → guard `payload.repository`, look up `repositories` row, upsert into `pullRequests` with `status: "open"`
- `pull_request.closed` → update status to `"merged"` (if `merged === true`) or `"closed"`
- Silently no-ops if the repo isn't in the `repositories` table

### Other changes
- `apps/web/package.json` — added `@shipflow/github` and `@shipflow/db` as direct deps
- `turbo.json` — added `GITHUB_APP_ID`, `GITHUB_APP_PRIVATE_KEY`, `GITHUB_WEBHOOK_SECRET` to `globalEnv`

### Verified working
- Bad signature → `{"error":"Invalid signature"}` (401) ✅
- Good signature + minimal payload → `{"ok":true}` (200), handler skips cleanly ✅
- End-to-end PR write requires a row in `repositories` (currently empty — see next step)

---

## What was built previously (2026-06-23 — PRD + Tasks data layer)

**`packages/db/src/queries/prds.ts`** — `getPrdForFeatureRequest(featureRequestId, organizationId)`
- Joins `prds → featureRequests → projects → workspaces`, orders by `version DESC`, returns latest or `null`

**`packages/db/src/queries/tasks.ts`**
- `listTasksByFeatureRequestId` — full join chain, ordered by `tasks.order ASC`
- `updateTaskStatus` — simple update

**`packages/api/src/routers/prds.ts`** — `prds.getByFeatureRequestId` (returns `null`, not `NOT_FOUND`)

**`packages/api/src/routers/tasks.ts`** — `tasks.listByFeatureRequest`, `tasks.updateStatus`

**`apps/web/components/feature-request-detail.tsx`**
- PRD tab: renders all sections (problemStatement, goals, nonGoals, userStories, acceptanceCriteria, edgeCases, successMetrics) with status badge + version number
- Tasks tab: status-cycle buttons (`todo → in_progress → done`) with remixicon icons, per-task badge, React Query invalidation

---

## PRD Alignment Snapshot

| PRD Step | Description | Status |
|---|---|---|
| 1 | Monorepo scaffold + auth end-to-end | ✅ Done |
| 2 | GitHub App registration + webhook receiver | ✅ Done |
| 3 | Inngest wiring with stub AI calls | ❌ Not started |
| 4 | Real AI calls (clarification → PRD → review) | ❌ Not started |
| 5 | UI: clarification → PRD → tasks → review tabs | ⚠️ Partial |
| 6 | Billing (Polar) | ❌ Not started |
| 7 | Polish + deploy + demo | ❌ Not started |

**Overall: ~40–45% of PRD surface implemented.**

---

## Missing / Not Started ❌

| Area | Gap | Depends on |
|------|-----|------------|
| **Repo → project linking** | ✅ Done (session 4) | — |
| **GitHub App install flow** | ✅ Done (session 5) — org creation, OAuth, install, setup, repo assignment all working end-to-end | — |
| **Inngest package** | `packages/inngest/` is empty — no event definitions, no workflow functions | Repo linked to project (so PR webhooks persist) |
| **AI package** | `packages/ai/` is empty — no prompts, no Zod schemas, no structured output calls | Inngest wired |
| **GitHub diff fetcher** | PR diffs can now be fetched via `app.getInstallationOctokit()` (installation token available); diff fetcher + PR comment poster not yet implemented | Inngest workflow triggering it |
| **PRD generation workflow** | No Inngest function to take a feature request → call AI → write PRD + tasks to DB | AI + Inngest |
| **Code review workflow** | No review run creation, no issue parsing, no re-review loop, no `reviewRuns` rows | All AI/Inngest |
| **FR detail tabs 4–5** | Review History / Audit Log are `<ComingSoon />` stubs | `lifecycleEvents` rows (written by AI workflows) |
| **Billing** | `packages/billing/` is empty — no Polar client, no credit enforcement | Inngest wired |
| **Release approval UI** | No approval action bar, no readiness check | Review workflow complete |
| **Missing tRPC routers** | `repositories.*`, `prd.approve/requestRevision`, `review.*`, `approval.*`, `billing.*` | Various |
| **Missing pages** | `/workspace/settings`, `/projects/[id]/repositories`, `/billing` | Various |

---

## Issues / Wrong Calls

| Issue | Location | Severity |
|-------|----------|----------|
| 3 packages completely empty | `packages/ai`, `packages/inngest`, `packages/billing` | High — core product workflows |
| `featureRequests.list` scoped to single `projectId` | `packages/api/src/routers/featureRequests.ts` | Low — fine for now |

---

## Next Steps — Detailed

### Step 4b: Repo → Project linking (immediate unblock)

**Why**: The `repositories` table is empty. Every `pull_request` webhook arrives, passes signature verification, then silently no-ops in the handler because `findRepositoryByGithubId` returns `null`. Nothing writes to `pullRequests` until at least one `repositories` row exists.

**What to build**:

1. **`packages/api/src/routers/repositories.ts`** (new tRPC router)
   - `repositories.link: tenantProcedure`
     - Input: `{ projectId: uuid, installationId: string, githubRepositoryId: string, owner: string, name: string, defaultBranch?: string }`
     - Inserts into `repositories` table
     - Must validate `projectId` belongs to `ctx.activeOrganizationId` (join through workspaces)
     - Returns the created row
   - `repositories.listByProject: tenantProcedure`
     - Input: `{ projectId: uuid }`
     - Returns all repos linked to a project

2. **`packages/db/src/queries/repositories.ts`** (extend existing)
   - Add `createRepository(data)` — insert and return
   - Add `listRepositoriesByProject(projectId)` — simple select

3. **Dashboard UI** — a "Link Repository" flow somewhere accessible:
   - Option A: Project settings page at `/dashboard/projects/[id]/settings` (cleanest but requires a new page)
   - Option B: Inline on the dashboard sidebar or existing project card (faster to ship)
   - The form needs: the GitHub installation ID (from the webhook payload `installation.id`) and the repo details
   - The installation ID comes from the GitHub App installation — the user can find it at `github.com/settings/installations` or from a webhook delivery payload under `installation.id`

4. **Register router** in `packages/api/src/router.ts`

**How to get the installationId**: Check any recent webhook delivery in GitHub App → Advanced → Recent Deliveries → payload → `installation.id`. It's an integer like `12345678`.

---

### Step 5: Inngest wiring

**Why**: Once PRs are persisting to the `pullRequests` table, the next trigger point is firing an Inngest event when a PR opens/updates so the AI review workflow can begin.

**What to build**:

1. **`packages/inngest/`** — wire up as a real TypeScript package (same pattern as `packages/github/`)
   - `src/client.ts` — `new Inngest({ id: "shipflow" })` using `INNGEST_EVENT_KEY`
   - `src/events.ts` — typed event definitions:
     ```typescript
     type Events = {
       "github/pull_request.opened": { data: { pullRequestId: string; repositoryId: string; featureRequestId?: string } }
       "github/pull_request.synchronized": { data: { pullRequestId: string; headSha: string } }
     }
     ```
   - `src/index.ts` — re-exports

2. **`apps/web/app/api/inngest/route.ts`** — Inngest serve handler
   - `serve({ client: inngest, functions: [...] })`
   - Mount at `/api/inngest` (Inngest dashboard connects here)

3. **Wire webhook → Inngest event**: In `apps/web/app/api/webhooks/github/route.ts`, after `upsertPullRequest` succeeds, call `inngest.send("github/pull_request.opened", { data: { ... } })`

4. **First Inngest function** (stub that proves the chain works):
   - `src/functions/onPullRequestOpened.ts`
   - Triggered by `"github/pull_request.opened"`
   - For now: just logs the event and writes a `lifecycleEvents` row with `event: "pr_received"`, `actorType: "system"`
   - This makes the Audit Log tab show real data for the first time

---

### Step 6: AI SDK integration

**Why**: Once Inngest is wired, each function can call the AI package to generate PRDs and run code review.

**What to build**:

1. **`packages/ai/`** — wire as a real package
   - `src/client.ts` — `createOpenRouter(apiKey)` from `@openrouter/ai-sdk-provider`, default model from `AI_MODEL` env var
   - `src/schemas/prd.ts` — Zod schema matching the `prds` table columns (problemStatement, goals[], nonGoals[], userStories[], acceptanceCriteria[], edgeCases[], successMetrics[])
   - `src/schemas/reviewIssue.ts` — Zod schema for a single code review issue (file, line, severity, description, suggestion)
   - `src/prompts/generatePrd.ts` — system + user prompt for PRD generation from `rawInput`
   - `src/prompts/reviewDiff.ts` — system + user prompt for code review from a PR diff

2. **Inngest function: PRD generation**
   - Triggered when a feature request reaches `status: "clarifying"` or manually triggered
   - Calls `generateText` with `Output.object({ schema: prdSchema })`
   - Writes the result to `prds` table via `createPrd()`
   - Updates FR status to `"prd_generated"`
   - Writes a `lifecycleEvents` row

3. **Inngest function: code review**
   - Triggered by `"github/pull_request.opened"` or `"github/pull_request.synchronized"`
   - Fetches the PR diff using the Octokit installation client (needs to be added to `packages/github/`)
   - Calls AI with the diff
   - Writes `reviewRuns` + `reviewIssues` rows
   - Posts a PR comment via Octokit
   - Updates FR status appropriately

---

## Build Sequence Reference

```
Step 1: Monorepo + auth          ✅ Done
Step 2: Feature request CRUD     ✅ Done
Step 3: Feature request detail   ✅ Done (Overview + PRD + Tasks live; Reviews/Audit stubbed)
Step 4: GitHub App + webhooks    ✅ Done (HMAC verified; pull_request → pullRequests table)
Step 4b: Repo → project linking  ✅ Done (session 4)
Step 4c: GitHub App install flow ✅ Done (session 5) — org creation, OAuth link, setup, repo assignment
Step 5: Inngest wiring           ← DO THIS NEXT (webhook → Inngest event → lifecycleEvents first data)
Step 6: AI SDK integration       ← after 5 (PRD generation + code review functions)
Step 7: Billing                  ← after 5 (credit enforcement in Inngest functions)
Step 8: Polish + demo
```
