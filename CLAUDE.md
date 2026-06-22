# ShipFlow AI — Delta Tracker

Last updated: 2026-06-23 (session 2)

---

## Done ✅

| Area | What exists | File(s) |
|------|------------|---------|
| Monorepo scaffold | pnpm workspaces, Turborepo, shared TS/ESLint configs | `turbo.json`, `pnpm-workspace.yaml`, `packages/typescript-config/`, `packages/eslint-config/` |
| Database schema | All 13 domain tables + 7 auth tables, FK cascades, indexes, enums, Drizzle relations | `packages/db/src/schema/domain.ts`, `packages/db/src/schema/auth.ts` |
| Auth | Better Auth — email/password, organization plugin, session management | `packages/auth/src/` |
| tRPC middleware | 3 procedure tiers: public / protected / tenantProcedure (session + org + membership) | `packages/api/src/trpc.ts`, `packages/api/src/context.ts` |
| Auth UI | Login, signup, org selector, sign-out — revamped login-03 + signup-03 blocks | `apps/web/app/(auth)/`, `apps/web/components/login-form.tsx`, `apps/web/components/signup-form.tsx` |
| **DB query layer** | `findMembership` + full feature request CRUD + project/workspace creation queries | `packages/db/src/queries/` |
| **Feature request API** | tRPC router: `list`, `get`, `getById`, `create`, `updateStatus` — all behind `tenantProcedure` | `packages/api/src/routers/featureRequests.ts` |
| **Project/workspace API** | tRPC router: `projects.list`, `projects.createWithWorkspace` (transactional workspace + project) | `packages/api/src/routers/projects.ts` |
| **App shell / sidebar** | `AppSidebar` with logo, org switcher, nav (Dashboard/Projects/Repos/Settings/Billing), user menu + sign-out | `apps/web/components/app-sidebar.tsx`, `apps/web/app/dashboard/layout.tsx` |
| **Dashboard UI** | Page header + SidebarTrigger + 4 metric tiles + `FeatureRequestsPanel` (clickable cards linking to detail page) | `apps/web/app/dashboard/page.tsx`, `apps/web/components/feature-requests-panel.tsx` |
| **Feature request detail page** | `/dashboard/feature-requests/[id]` — server prefetch, 5-tab shell (Overview + PRD + Tasks live; Reviews/Audit stubbed), status update | `apps/web/app/dashboard/feature-requests/[id]/page.tsx`, `apps/web/components/feature-request-detail.tsx` |
| **Shared status lib** | `STATUS_CONFIG` + `FeatureRequestStatusBadge` extracted for reuse | `apps/web/lib/feature-request-status.tsx` |
| **Landing page** | 5-section landing: sticky nav, hero, lifecycle pipeline, 3 feature cards, GitHub callout, CTA + footer | `apps/web/app/page.tsx` |
| **Shadcn preset** | Applied preset `b44rDiJUW` — style `radix-mira`, icon library `remixicon` | `packages/ui/src/styles/globals.css`, `packages/ui/components.json` |
| Vitest setup | Test runner configured and passing — JSX transform fixed, DOM cleanup fixed | `apps/web/vitest.config.ts`, `apps/web/vitest.setup.ts` |
| **11 → 11 tests** | All 11 tests passing: API middleware (4) + OrganizationPanel (6) + tRPC smoke (1) | `packages/api/src/routers/health.test.ts`, `apps/web/components/dashboard-actions.test.tsx`, `apps/web/trpc/trpc-smoke.test.tsx` |
| **PRD + Tasks data layer** | DB queries + tRPC routers for PRDs and Tasks; FR detail PRD and Tasks tabs live | `packages/db/src/queries/prds.ts`, `packages/db/src/queries/tasks.ts`, `packages/api/src/routers/prds.ts`, `packages/api/src/routers/tasks.ts` |

---

## What was built this session (2026-06-23 — PRD + Tasks data layer)

### DB queries

**`packages/db/src/queries/prds.ts`** (new) — `getPrdForFeatureRequest(featureRequestId, organizationId)`
- Joins `prds → featureRequests → projects → workspaces` for full org-scoped isolation
- Orders by `version DESC`, returns latest PRD or `null`

**`packages/db/src/queries/tasks.ts`** (new)
- `listTasksByFeatureRequestId(featureRequestId, organizationId)` — joins through the full chain `tasks → prds → featureRequests → projects → workspaces`, ordered by `tasks.order ASC`
- `updateTaskStatus(id, status)` — simple update returning the updated row

**`packages/db/src/index.ts`** — exported all three new functions

### tRPC routers

**`packages/api/src/routers/prds.ts`** (new) — `prds.getByFeatureRequestId`
- Returns `null` (not `NOT_FOUND`) when no PRD exists — absence is a valid product state

**`packages/api/src/routers/tasks.ts`** (new)
- `tasks.listByFeatureRequest` — returns tasks array (empty array when no PRD/tasks)
- `tasks.updateStatus` — cycles `todo → in_progress → done`

**`packages/api/src/router.ts`** — registered `prds` and `tasks` routers

### FR detail tab UI

**`apps/web/components/feature-request-detail.tsx`**
- PRD tab: renders all PRD sections (problemStatement, goals, nonGoals, userStories, acceptanceCriteria, edgeCases, successMetrics) with status badge + version; shows "AI hasn't run yet" empty state when null
- Tasks tab: status-cycle buttons (`todo → in_progress → done`) using remixicon icons, per-task badge, optimistic invalidation via React Query; shows "awaiting PRD approval" empty state when empty

---

## What was built previously (2026-06-23 — feature request detail)

### Org-scoped DB query

**`packages/db/src/queries/featureRequests.ts`** — added `getFeatureRequestForOrg(id, organizationId)`
- Joins `featureRequests → projects → workspaces` to validate org ownership without requiring `projectId` in the URL
- Returns the full feature request row or `null`

**`packages/db/src/index.ts`** — exported `getFeatureRequestForOrg`

### New tRPC procedure

**`packages/api/src/routers/featureRequests.ts`** — added `getById`
- Input: `{ id: UUID }` only — no `projectId` needed
- Uses `ctx.activeOrganizationId` from `tenantProcedure` for tenant isolation
- Throws `NOT_FOUND` if the FR doesn't belong to the active org

### Feature request detail page

**`apps/web/app/dashboard/feature-requests/[id]/page.tsx`**
- Server component; `fetchQuery` (not `prefetchQuery`) so a missing/wrong-org ID triggers `notFound()` immediately
- Breadcrumb: Dashboard › Feature Request
- Wraps `<FeatureRequestDetail>` in `<HydrationBoundary>`

**`apps/web/components/feature-request-detail.tsx`**
- Title (first 80 chars of `rawInput`), status badge, created date + source metadata
- 5-tab shell: Overview (full `rawInput` + status `<Select>`), PRD / Tasks / Review History / Audit Log (all "Coming soon")
- Status update calls `featureRequests.updateStatus`, invalidates `getById` query, shows toast

### Shared status lib + panel wiring

**`apps/web/lib/feature-request-status.tsx`** — `STATUS_CONFIG` + `FeatureRequestStatusBadge` extracted from the panel into a shared module

**`apps/web/components/feature-requests-panel.tsx`**
- Uses shared status lib (removed inline duplicate)
- FR cards now wrapped in `<Link href="/dashboard/feature-requests/[id]">` with hover highlight

---

## Missing / Not Started ❌

| Area | Gap | Depends on |
|------|-----|------------|
| **FR detail tabs 4–5** | Review History / Audit Log are placeholder stubs | GitHub webhooks → `lifecycleEvents` table |
| **GitHub package** | `packages/github/` is an empty shell — no Octokit client, no diff fetcher, no review poster | GitHub App credentials |
| **Webhook handler** | No `app/api/webhooks/github/route.ts`, no signature verification, no event persistence | GitHub package |
| **Inngest package** | `packages/inngest/` is an empty shell — no event definitions, no workflow functions | GitHub webhooks |
| **AI package** | `packages/ai/` is an empty shell — no prompts, no Zod schemas, no structured output | Inngest |
| **PRD/task generation** | No AI workflows wired anywhere | AI + Inngest packages |
| **Code review workflow** | No review run creation, no issue parsing, no re-review loop | All of the above |
| **Billing** | `packages/billing/` is an empty shell — no Polar client, no credit enforcement | Inngest |
| **Release approval UI** | No approval action bar, no readiness check | Review workflow |

---

## Issues / Wrong Calls

| Issue | Location | Severity |
|-------|----------|----------|
| 4 packages declared in workspace but completely empty | `packages/ai`, `packages/github`, `packages/inngest`, `packages/billing` | High — these are the entire product |
| `featureRequests.list` is scoped to a single `projectId` — no cross-project view | `packages/api/src/routers/featureRequests.ts` | Low — fine for now, revisit when adding sidebar nav |

---

## Smallest Next Step: GitHub App + webhooks (Step 4)

All self-contained UI/data work is done. The product can't progress further without the GitHub integration — it unblocks Inngest, AI, the Review History tab, and the Audit Log tab.

**What "done" looks like:**

1. `packages/github/` — Octokit client (`@octokit/app`), webhook validation (`@octokit/webhooks`), diff fetcher, PR comment poster
2. `apps/web/app/api/webhooks/github/route.ts` — signature-verified handler, `push`/`pull_request` event persistence to `lifecycleEvents`
3. Wire incoming events to `lifecycleEvents` table for the Audit Log tab

---

## Build Sequence Reference

```
Step 1: Monorepo + auth          ✅ Done
Step 2: Feature request CRUD     ✅ Done
Step 3: Feature request detail   ✅ Done (Overview + PRD + Tasks tabs live; Reviews/Audit stubbed)
Step 4: GitHub App + webhooks    ← requires external GitHub App setup
Step 5: Inngest wiring           ← blocked by step 4
Step 6: AI SDK integration       ← blocked by step 5
Step 7: Billing                  ← blocked by step 5
Step 8: Polish + demo
```
