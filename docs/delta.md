# ShipFlow AI — Delta Tracker

Last updated: 2026-06-23

---

## Done ✅

| Area | What exists | File(s) |
|------|------------|---------|
| Monorepo scaffold | pnpm workspaces, Turborepo, shared TS/ESLint configs | `turbo.json`, `pnpm-workspace.yaml`, `packages/typescript-config/`, `packages/eslint-config/` |
| Database schema | All 13 domain tables + 7 auth tables, FK cascades, indexes, enums, Drizzle relations | `packages/db/src/schema/domain.ts`, `packages/db/src/schema/auth.ts` |
| Auth | Better Auth — email/password, organization plugin, session management | `packages/auth/src/` |
| tRPC middleware | 3 procedure tiers: public / protected / tenantProcedure (session + org + membership) | `packages/api/src/trpc.ts`, `packages/api/src/context.ts` |
| Auth UI | Login, signup, org selector, sign-out | `apps/web/app/(auth)/`, `apps/web/components/dashboard-actions.tsx` |
| Dashboard skeleton | Shows org selector + tenant health card | `apps/web/app/dashboard/page.tsx`, `apps/web/components/tenant-health-card.tsx` |
| **DB query layer** | `findMembership` + full feature request CRUD + project/workspace creation queries | `packages/db/src/queries/` |
| **Feature request API** | tRPC router: `list`, `get`, `create`, `updateStatus` — all behind `tenantProcedure` | `packages/api/src/routers/featureRequests.ts` |
| **Project/workspace API** | tRPC router: `projects.list`, `projects.createWithWorkspace` (transactional workspace + project) | `packages/api/src/routers/projects.ts` |
| **Dashboard UI** | `FeatureRequestsPanel` — live list, create-project dialog, submit-FR dialog, status badges, skeletons, empty states, toasts | `apps/web/components/feature-requests-panel.tsx` |
| Vitest setup | Test runner configured and passing for both packages — JSX transform fixed, DOM cleanup fixed | `apps/web/vitest.config.ts`, `apps/web/vitest.setup.ts` |
| **11 → 11 tests** | All 11 tests passing: API middleware (4) + OrganizationPanel (6) + tRPC smoke (1) | `packages/api/src/routers/health.test.ts`, `apps/web/components/dashboard-actions.test.tsx`, `apps/web/trpc/trpc-smoke.test.tsx` |

---

## What was built this session (2026-06-23)

### Feature request CRUD — DB + API

**`packages/db/src/queries/featureRequests.ts`**
- `listFeatureRequestsByProject(projectId)` — ordered by `createdAt DESC`, returns `id`, `status`, `rawInput`, `source`, `createdAt`
- `getFeatureRequestById(id, projectId)` — scoped to project (prevents cross-tenant reads)
- `createFeatureRequest({ projectId, rawInput, createdBy, source })` — inserts and returns row
- `updateFeatureRequestStatus(id, status)` — single-column update, returns row

**`packages/api/src/routers/featureRequests.ts`**
- All 4 procedures behind `tenantProcedure` (session + org + membership required)
- Status transitions validated by a Zod enum mirroring the DB `featureRequestStatus` enum
- `get` and `updateStatus` throw `NOT_FOUND` if row is missing

### Project + workspace creation — DB + API

**`packages/db/src/queries/projects.ts`**
- `listProjectsByOrg(organizationId)` — joins `projects ← workspaces` to list all projects for an org; returns `id`, `name`, `slug`, `workspaceId`, `workspaceName`, `createdAt`
- `createWorkspaceWithProject(...)` — DB transaction: inserts workspace then project atomically; slugs are derived server-side

**`packages/api/src/routers/projects.ts`**
- `projects.list` — `tenantProcedure`, no input; uses `ctx.activeOrganizationId` for scoping
- `projects.createWithWorkspace` — `tenantProcedure`, input: `{ workspaceName, projectName }`; auto-slugifies both

### Dashboard UI

**`apps/web/components/feature-requests-panel.tsx`**
- Client component mounted below the org/health cards in the dashboard
- On first render: fetches `projects.list` (server-prefetched via `HydrationBoundary`)
- **No projects state** → `<Empty>` + "Create your first project" `<Dialog>` (workspace name + project name fields)
- **Has projects, no FRs** → `<Empty>` + "Submit feature request" `<Dialog>` (single `<Textarea>` for `rawInput`)
- **Has FRs** → card list with `rawInput` as title, `FeatureRequestStatusBadge`, project name + date in description
- Multiple projects → tab-style project switcher (button row)
- Loading → `<Skeleton>` matching card shape
- All mutations use `useTRPCClient()` (avoids tRPC v11 `mutationFn | undefined` type conflict with spread pattern)
- Cache invalidation on success via `queryClient.invalidateQueries({ queryKey })`
- Toasts via `sonner` — success auto-dismiss, errors explicit

**`apps/web/app/layout.tsx`** — `<Toaster />` added (required for toast notifications to render)

### Test fixes

Two independent root causes, both pre-existing before this session:

1. **JSX parse error** (`components/dashboard-actions.test.tsx`, `trpc/trpc-smoke.test.tsx`): `vitest.config.ts` had `esbuild: { jsx: "automatic" }` but `tsconfig` has `jsx: "preserve"` (Next.js default). Vite honors the tsconfig value and esbuild never transformed JSX. Fixed by replacing the esbuild option with `plugins: [react()]` from `@vitejs/plugin-react`.

2. **DOM bleed between tests + async timing**:
   - `@testing-library/react` cleanup does not auto-register with Vitest when `globals: false` (the default). DOM from one test persisted into the next — causing "Create organization" button to appear in tests that should show the org selector, and "multiple buttons" error in the create-org test. Fixed by adding `afterEach(cleanup)` to `vitest.setup.ts`.
   - `switchOrganization` calls `queryClient.clear()` after `await setActive()` (microtask continuation). The test checked `clear()` synchronously after a `waitFor` for `setActive()` — the continuation hadn't flushed. Fixed by collapsing all three assertions into one `waitFor`.

---

## Missing / Not Started ❌

| Area | Gap | Depends on |
|------|-----|------------|
| **Tasks API** | No router for task list, reorder, status update | DB queries (partial — `tasks` table exists) |
| **Feature request detail page** | No `/feature-requests/[id]` route, no tabs (Overview / PRD / Tasks / Review History / Audit Log) | Feature request API ✅ |
| **GitHub package** | `packages/github/` is an empty shell — no Octokit client, no diff fetcher, no review poster | GitHub App credentials |
| **Webhook handler** | No `app/api/webhooks/github/route.ts`, no signature verification, no event persistence | GitHub package |
| **Inngest package** | `packages/inngest/` is an empty shell — no event definitions, no workflow functions | GitHub webhooks |
| **AI package** | `packages/ai/` is an empty shell — no prompts, no Zod schemas, no structured output | Inngest |
| **PRD/task generation** | No AI workflows wired anywhere | AI + Inngest packages |
| **Code review workflow** | No review run creation, no issue parsing, no re-review loop | All of the above |
| **Billing** | `packages/billing/` is an empty shell — no Polar client, no credit enforcement | Inngest |
| **Release approval UI** | No approval action bar, no readiness check | Review workflow |
| **App shell / sidebar** | No `<Sidebar>` nav — dashboard is a bare page, no breadcrumbs, no page header pattern | UI spec §7 |

---

## Issues / Wrong Calls

| Issue | Location | Severity |
|-------|----------|----------|
| 4 packages declared in workspace but completely empty | `packages/ai`, `packages/github`, `packages/inngest`, `packages/billing` | High — these are the entire product |
| No feature request detail page yet — dashboard cards are not clickable | `apps/web/components/feature-requests-panel.tsx` | Medium — demoable but dead-end UX |
| `featureRequests.list` is scoped to a single `projectId` — no cross-project view | `packages/api/src/routers/featureRequests.ts` | Low — fine for now, revisit when adding sidebar nav |

---

## Smallest Next Step: Feature Request Detail Page

Now that `featureRequests.list` and `featureRequests.get` exist, the most impactful next UI step is the detail page — it unlocks the full lifecycle view (Overview / PRD / Tasks / Reviews / Audit Log tabs from the UI spec).

**What "done" looks like:**

1. `apps/web/app/feature-requests/[id]/page.tsx` — server component, fetches `trpc.featureRequests.get`
2. Tabs shell: Overview / PRD / Tasks / Review History / Audit Log (shadcn `<Tabs>`)
3. Overview tab: raw input, status badge, lifecycle timeline (empty but wired)
4. Make dashboard FR cards link to `/feature-requests/[id]`

No new API needed — `featureRequests.get` already exists. No new external deps.

---

## Build Sequence Reference

```
Step 1: Monorepo + auth          ✅ Done
Step 2: Feature request CRUD     ✅ Done (deviated from plan — no external blockers)
Step 3: Feature request detail   ← next (no new deps)
Step 4: GitHub App + webhooks    ← requires external GitHub App setup
Step 5: Inngest wiring           ← blocked by step 4
Step 6: AI SDK integration       ← blocked by step 5
Step 7: Billing                  ← blocked by step 5
Step 8: Polish + demo
```
