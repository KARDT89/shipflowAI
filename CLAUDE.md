# ShipFlow AI — Delta Tracker

Last updated: 2026-06-23 (session 3)

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

---

## What was built this session (2026-06-23 — GitHub App + webhooks)

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

## Missing / Not Started ❌

| Area | Gap | Depends on |
|------|-----|------------|
| **Repo → project linking** | `repositories` table is empty; no UI or tRPC router to link a GitHub repo to a project | GitHub App installed on repo |
| **Inngest package** | `packages/inngest/` is empty — no event definitions, no workflow functions | Repo linked to project (so PR webhooks persist) |
| **AI package** | `packages/ai/` is empty — no prompts, no Zod schemas, no structured output calls | Inngest wired |
| **GitHub diff fetcher** | `packages/github/` has no Octokit installation client, no diff fetcher, no PR comment poster | Inngest workflow triggering it |
| **PRD generation workflow** | No Inngest function to take a feature request → call AI → write PRD + tasks to DB | AI + Inngest |
| **Code review workflow** | No review run creation, no issue parsing, no re-review loop, no `reviewRuns` rows | All AI/Inngest |
| **FR detail tabs 4–5** | Review History / Audit Log are `<ComingSoon />` stubs | `lifecycleEvents` rows (written by AI workflows) |
| **Billing** | `packages/billing/` is empty — no Polar client, no credit enforcement | Inngest wired |
| **Release approval UI** | No approval action bar, no readiness check | Review workflow complete |

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
Step 4b: Repo → project linking  ← DO THIS NEXT (repositories table empty; blocks all PR persistence)
Step 5: Inngest wiring           ← after 4b (webhook → Inngest event → lifecycleEvents first data)
Step 6: AI SDK integration       ← after 5 (PRD generation + code review functions)
Step 7: Billing                  ← after 5 (credit enforcement in Inngest functions)
Step 8: Polish + demo
```
