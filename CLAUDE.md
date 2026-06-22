# ShipFlow AI — Delta Tracker

Last updated: 2026-06-22

---

## Done ✅

| Area | What exists | File(s) |
|------|------------|---------|
| Monorepo scaffold | pnpm workspaces, Turborepo, shared TS/ESLint configs | `turbo.json`, `pnpm-workspace.yaml`, `packages/typescript-config/`, `packages/eslint-config/` |
| Database schema | All 13 domain tables + 7 auth tables, FK cascades, indexes, enums, Drizzle relations | `packages/db/src/schema/domain.ts`, `packages/db/src/schema/auth.ts` |
| Auth | Better Auth — email/password, organization plugin, session management | `packages/auth/src/` |
| tRPC middleware | 3 procedure tiers: public / protected / tenantProcedure (session + org + membership) | `packages/api/src/trpc.ts`, `packages/api/src/context.ts` |
| 1 API endpoint | `health.authenticated` returns userId, orgId, role | `packages/api/src/routers/health.ts` |
| Auth UI | Login, signup, org selector, sign-out | `apps/web/app/(auth)/`, `apps/web/components/organization-panel.tsx` |
| Dashboard skeleton | Shows org selector + tenant health card | `apps/web/app/dashboard/page.tsx`, `apps/web/components/tenant-health-card.tsx` |
| Vitest setup | Test runner configured for both `apps/web` and `packages/api` | `apps/web/vitest.config.ts`, `packages/api/vitest.config.ts` |
| 11 tests | Auth middleware (4) + OrganizationPanel component (6) + tRPC smoke test (1) | `packages/api/src/routers/health.test.ts`, `apps/web/components/dashboard-actions.test.tsx` |

---

## Missing / Not Started ❌

| Area | Gap | Depends on |
|------|-----|------------|
| **DB query layer** | Only `findMembership` exists. Zero queries for feature requests, PRDs, tasks, PRs, reviews, approvals | Nothing — pure DB work |
| **Feature request API** | No tRPC router for CRUD or status transitions | DB queries |
| **Project/workspace API** | No router for projects or workspaces | DB queries |
| **Tasks API** | No router for task list, reorder, status update | DB queries |
| **Dashboard UI** | Feature request list, pipeline metrics, status overview | Feature request API |
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
| `docs/ui.md` is the Claude `artifact-design` skill template, not a project doc | `docs/ui.md` | Low — confusing but harmless |
| `docs/SKILL.md` is also a generic design reference, not ShipFlow-specific | `docs/SKILL.md` | Low |
| 4 packages declared in workspace but completely empty | `packages/ai`, `packages/github`, `packages/inngest`, `packages/billing` | High — these are the entire product |

---

## Smallest Next Step: Feature Request CRUD

**Why this first, not GitHub webhooks:**
- Zero external dependencies (no GitHub App to register, no secrets to provision)
- Immediately testable with the existing DB + auth stack
- Produces something visible in the UI (a real list in the dashboard)
- Unblocks the GitHub + Inngest work anyway — they emit events that create feature requests

**What "done" looks like:**

1. `packages/db/src/queries/featureRequests.ts`
   - `listByWorkspace(workspaceId)` → list with status, title, createdAt
   - `getById(id)` → full row
   - `create(data)` → insert + return
   - `updateStatus(id, status)` → status transition

2. `packages/api/src/routers/featureRequests.ts`
   - `list` — `tenantProcedure`, returns feature requests for active org's workspaces
   - `create` — `tenantProcedure`, input: `{ title, description, workspaceId }`
   - `get` — `tenantProcedure`, input: `{ id }`
   - `updateStatus` — `tenantProcedure`, input: `{ id, status }`

3. Wire router into `packages/api/src/router.ts`

4. `apps/web/app/dashboard/page.tsx` — replace static card with real `trpc.featureRequests.list` query

**Estimate:** ~2–3 hours of focused work, no new dependencies, immediately demoable.

---

## Build Sequence Reference (from docs/PLAN.md)

```
Step 1: Monorepo + auth          ✅ Done
Step 2: GitHub App + webhooks    ← next in plan (requires external GitHub App setup)
Step 3: Inngest wiring           ← blocked by step 2
Step 4: AI SDK integration       ← blocked by step 3
Step 5: UI                       ← can start in parallel with step 2
Step 6: Billing                  ← blocked by step 3
Step 7: Polish + demo
```

Recommended deviation: build the feature request CRUD (Step 5 partial) before GitHub (Step 2) because it has no external blockers and validates the full tRPC → DB → UI pipeline end-to-end.
