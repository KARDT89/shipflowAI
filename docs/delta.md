# ShipFlow AI — Delta Tracker

Last updated: 2026-06-23 (session 8)

This file tracks the current implementation state against `docs/shipflow ai v1.md`, `docs/PLAN.md`, `docs/gap-analysis.md`, `docs/ui-spec.md`, and `docs/ux-refactor-plan.md`.

---

## Current Workstate

ShipFlow now has a working product-planning loop:

1. Create feature request.
2. AI asks clarification questions when needed.
3. User answers clarification questions.
4. AI generates PRD.
5. User approves PRD.
6. AI generates ordered tasks.

The next major product gap is connecting this planning loop to real GitHub PR review and improving the UX shell so the lifecycle feels professional and understandable.

---

## Done

| Area | What exists | File(s) |
|------|-------------|---------|
| Monorepo scaffold | pnpm workspaces, Turborepo, shared TS/ESLint configs | `turbo.json`, `pnpm-workspace.yaml`, `packages/typescript-config/`, `packages/eslint-config/` |
| Database schema | Domain/auth tables, FK cascades, indexes, enums, Drizzle relations | `packages/db/src/schema/` |
| Auth | Better Auth email/password, GitHub OAuth linking, organization plugin, sessions | `packages/auth/src/`, `apps/web/app/(auth)/` |
| tRPC middleware | public/protected/tenant procedures with session + active org checks | `packages/api/src/trpc.ts`, `packages/api/src/context.ts` |
| App shell | Sidebar, org switcher, protected dashboard layout | `apps/web/app/dashboard/`, `apps/web/components/app-sidebar.tsx` |
| Feature request CRUD | List/get/create/update status behind tenant procedures | `packages/api/src/routers/featureRequests.ts`, `packages/db/src/queries/featureRequests.ts` |
| Feature request detail shell | Overview, PRD, Tasks, Review History, Audit Log tabs | `apps/web/components/feature-request-detail.tsx` |
| GitHub App install flow | OAuth link, app install/setup, installation repo listing, repo assignment to projects | `apps/web/app/github/`, `apps/web/components/github-install-callback.tsx`, `packages/github/src/` |
| Repo -> project linking | `repositories.link`, `repositories.listByProject`, repo insert/list queries | `packages/api/src/routers/repositories.ts`, `packages/db/src/queries/repositories.ts` |
| GitHub webhooks | HMAC-verified `POST /api/webhooks/github`; PR events persist `pullRequests`; PR events emit Inngest | `apps/web/app/api/webhooks/github/route.ts` |
| Inngest foundation | Inngest client, typed events, Next route, PR-opened lifecycle stub | `packages/inngest/src/`, `apps/web/app/api/inngest/route.ts` |
| AI package foundation | OpenRouter client, strict Zod schemas, prompts, provider diagnostics | `packages/ai/src/` |
| Clarification loop | `feature_request.created` -> `clarify-request`; writes clarification questions, status, lifecycle event | `packages/inngest/src/functions/clarifyRequest.ts`, `packages/db/src/queries/clarificationThreads.ts` |
| Clarification answer flow | UI + tRPC mutation saves answers and emits `clarification.answered` | `apps/web/components/feature-request-detail.tsx`, `packages/api/src/routers/featureRequests.ts` |
| PRD generation | `clarification.answered` -> `generate-prd`; writes PRD, sets `prd_generated`, lifecycle event | `packages/ai/src/generatePrd.ts`, `packages/inngest/src/functions/generatePrd.ts`, `packages/db/src/queries/prds.ts` |
| PRD approval | `prds.approve` approves draft PRD, sets `prd_approved`, emits `prd.approved` | `packages/api/src/routers/prds.ts`, `packages/api/src/prds.test.ts` |
| Task generation | `prd.approved` -> `generate-tasks`; writes ordered tasks, sets `tasks_generated`, lifecycle event | `packages/ai/src/generateTasks.ts`, `packages/inngest/src/functions/generateTasks.ts`, `packages/db/src/queries/tasks.ts` |
| UX refactor plan | Professional end-to-end IA and flow blueprint exported | `docs/ux-refactor-plan.md` |

---

## Verified Recently

The following checks were run after PRD approval and task generation work:

| Command | Result |
|---------|--------|
| `pnpm --filter @shipflow/ai typecheck` | Passed |
| `pnpm --filter @shipflow/db typecheck` | Passed |
| `pnpm --filter @shipflow/inngest typecheck` | Passed |
| `pnpm --filter @shipflow/api test` | Passed: 13 tests |
| `pnpm --filter web typecheck` | Passed |
| `pnpm --filter web lint` | Passed with existing unrelated warnings |

Manual Inngest verification:

- PRD generation completed successfully from clarification answers.
- Task generation completed successfully from PRD approval.

---

## Important UX Reality Check

The backend lifecycle is ahead of the product experience. The current app works, but it feels clunky because:

- Organization creation does not clearly explain why organizations matter.
- GitHub connection does not show a complete setup or health model.
- Dashboard metrics are placeholders.
- Projects, Repositories, Settings, and Billing are not real product surfaces yet.
- Tasks are a flat list, not Kanban.
- Review History and Audit Log are still stubs.
- Manual status changing is visible in the main user flow.

Use `docs/ux-refactor-plan.md` as the source of truth for the next UI/IA refactor.

---

## Still Missing

| Area | Gap | Depends on |
|------|-----|------------|
| UX information architecture | Empty/weak Projects, Repositories, Settings, Billing pages; onboarding is not guided | Current planning loop |
| Kanban tasks | Tasks are displayed as a flat list with status-cycle buttons | Task generation |
| PR -> feature request linking | `pull_requests.feature_request_id` is not assigned; review context can be missing | Repo/PR flow |
| GitHub diff fetcher | No helper to fetch PR changed files/patches via Octokit | Review workflow |
| Code review workflow | No `run-review` Inngest function writing `reviewRuns` and `reviewIssues` | PRD/tasks + PR linking |
| Review History tab | Still stubbed; needs review run and issue display | Review workflow |
| Audit Log tab | Still stubbed; needs lifecycle event query/router/UI | Lifecycle event data |
| Release readiness | No `review.passed` -> readiness check -> `pending_human_approval` | Review workflow |
| Human approval flow | No `approval.decide`, approval history, or ship/reject action bar | Release readiness |
| Billing | `packages/billing` is placeholder; no Polar plans, credits, checkout, webhooks | After review loop works |

---

## Issues / Notes

| Issue | Location | Severity |
|-------|----------|----------|
| GitHub webhook URL has appeared as `/api/webhooks` in local logs, but app route is `/api/webhooks/github` | GitHub App settings / tunnel config | High for GitHub PR testing |
| Event naming mixes dot and slash styles | `packages/inngest/src/events.ts`, webhook route | Medium; standardize before review workflow expands |
| `featureRequests.list` is scoped to one `projectId`, which makes dashboard-wide queues harder | `packages/api/src/routers/featureRequests.ts` | Medium for UX refactor |
| Dashboard metric tiles are placeholders | `apps/web/app/dashboard/page.tsx` | Medium for product polish |
| Existing lint warnings remain in unrelated web files | `apps/web/app/layout.tsx`, `apps/web/app/page.tsx`, `apps/web/components/feature-requests-panel.tsx`, `apps/web/hooks/use-mobile.ts` | Low |

---

## What To Do Next

### Immediate recommendation

Start implementing the UX refactor now, before adding much more workflow surface area.

Reason: the planning loop is now real enough to anchor the product experience, and the next backend work (PR linking + review) needs better Projects/Repositories/Review surfaces anyway. If PR review is built into the current clunky IA, it will likely need to be moved again.

### Next implementation sequence

1. **Commit/stabilize the current planning-loop work**
   - Keep the current working state safe before large UI movement.

2. **Implement UX foundation from `docs/ux-refactor-plan.md`**
   - Add real routes for `/projects`, `/repositories`, `/settings`, and `/billing`.
   - Add shared page header.
   - Add onboarding/setup checklist.
   - Move dashboard toward an org command center.

3. **Build Projects and Repositories surfaces**
   - Projects page and project detail.
   - Repositories page with GitHub health and connected repo list.
   - Prepare unlinked PR inbox.

4. **Refactor feature request detail**
   - Add lifecycle progress rail.
   - Move manual status dropdown out of normal user path.
   - Replace Tasks list with Kanban-style board.
   - Prepare PR & Review, Approval, and Audit tabs.

5. **Implement PR linking + AI review**
   - Add `pullRequests` router and DB queries.
   - Link real PRs to feature requests.
   - Fetch real PR diff.
   - Run AI review.
   - Populate Review History.

6. **Implement release approval**
   - Release readiness.
   - Human approve/reject action.
   - Audit trail.

7. **Implement billing**
   - Start with truthful sandbox billing shell.
   - Add Polar checkout/webhooks/credit enforcement after review runs are stable.

---

## Build Sequence Reference

```
Step 1: Monorepo + auth                         Done
Step 2: Feature request CRUD                    Done
Step 3: Feature request detail shell            Done
Step 4: GitHub App + webhooks                   Done
Step 4b: Repo -> project linking                Done
Step 5: Inngest foundation                      Done
Step 6a: AI package foundation                  Done
Step 6b: Clarification loop                     Done
Step 6c: Clarification answers -> PRD           Done
Step 6d: PRD approval -> task generation        Done
Step 6e: UX/IA refactor                         Do next
Step 7: PR linking + AI review                  After UX foundation
Step 8: Release approval + audit polish         After review loop
Step 9: Billing + deploy polish                 After review loop stabilizes
```
