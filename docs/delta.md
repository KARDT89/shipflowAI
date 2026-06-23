# ShipFlow AI — Delta Tracker

Last updated: 2026-06-23 (session 6)

---

## Done ✅

| Area | What exists | File(s) |
|------|------------|---------|
| Monorepo scaffold | pnpm workspaces, Turborepo, shared TS/ESLint configs | `turbo.json`, `pnpm-workspace.yaml`, `packages/typescript-config/`, `packages/eslint-config/` |
| Database schema | Domain/auth tables, FK cascades, indexes, enums, Drizzle relations | `packages/db/src/schema/` |
| Auth | Better Auth email/password, GitHub OAuth linking, organization plugin, sessions | `packages/auth/src/`, `apps/web/app/(auth)/` |
| tRPC middleware | public/protected/tenant procedures with session + active org checks | `packages/api/src/trpc.ts`, `packages/api/src/context.ts` |
| App shell + dashboard | Sidebar, org switcher, dashboard metrics, feature request panel | `apps/web/app/dashboard/`, `apps/web/components/` |
| Feature request CRUD | List/get/create/update status behind tenant procedures | `packages/api/src/routers/featureRequests.ts`, `packages/db/src/queries/featureRequests.ts` |
| Feature request detail | Overview + PRD + Tasks tabs live; Reviews/Audit still stubbed | `apps/web/components/feature-request-detail.tsx` |
| PRD + tasks data layer | Latest PRD fetch, task listing, task status update | `packages/db/src/queries/prds.ts`, `packages/db/src/queries/tasks.ts`, `packages/api/src/routers/prds.ts`, `packages/api/src/routers/tasks.ts` |
| GitHub App install flow | OAuth link, app install/setup, installation repo listing, repo assignment to projects | `apps/web/app/github/`, `apps/web/components/github-install-callback.tsx`, `packages/github/src/` |
| Repo → project linking | `repositories.link`, `repositories.listByProject`, repo insert/list queries | `packages/api/src/routers/repositories.ts`, `packages/db/src/queries/repositories.ts` |
| GitHub webhooks | HMAC-verified `POST /api/webhooks/github`; PR events persist `pullRequests`; PR events emit Inngest | `apps/web/app/api/webhooks/github/route.ts` |
| Inngest foundation | Inngest client, typed events, Next route, PR-opened lifecycle stub | `packages/inngest/src/`, `apps/web/app/api/inngest/route.ts` |
| AI package foundation | OpenRouter client, strict Zod schemas, prompts, provider diagnostics | `packages/ai/src/` |
| Clarification loop | Feature request create emits `feature_request.created`; Inngest runs AI clarification, writes questions, sets `clarifying`, writes lifecycle event | `packages/api/src/routers/featureRequests.ts`, `packages/inngest/src/functions/clarifyRequest.ts`, `packages/db/src/queries/clarificationThreads.ts` |

---

## Latest Session — AI Clarification Loop Working

### What changed

- Added `generateClarification()` using AI SDK v6 `generateText` + `Output.object`.
- Added strict OpenAI/OpenRouter-compatible schemas: no model-facing `.default()` or optional properties.
- Added AI provider diagnostics that expose safe status/body details in Inngest failures.
- Added clarification thread DB queries.
- Added `feature_request.created` Inngest event and `clarify-request` function.
- Wired `featureRequests.create` to emit the clarification event asynchronously.

### Verified working

Latest local Inngest run completed end to end:

| Step | Duration |
|------|----------|
| `get-feature-request` | 127ms |
| `get-project-feature-requests` | 144ms |
| `generate-clarification` | 1.824s |
| `create-clarification-questions` | 123ms |
| `set-status-clarifying` | 151ms |
| `write-clarification-requested-event` | 147ms |
| Finalization | 143ms |

Expected DB outcome:
- `feature_requests.status = 'clarifying'`
- `clarification_threads` contains AI-generated questions
- `lifecycle_events` contains `clarification_requested`

### Config note

GitHub is still posting to `/api/webhooks` in local logs. The app route is `/api/webhooks/github`, so the GitHub App webhook URL must be updated outside code.

---

## Still Missing / Not Started ❌

| Area | Gap | Depends on |
|------|-----|------------|
| Clarification answer flow | No UI/tRPC procedure to answer AI clarification questions | Clarification loop ✅ |
| PRD generation workflow | No `clarification.answered` → AI PRD generation → `prds` insert → `prd_generated` status | Answer flow |
| PRD approval workflow | No `prd.approve` procedure/event to trigger task generation | PRD generation |
| Task generation workflow | No `prd.approved` → AI task generation → `tasks` inserts | PRD approval |
| PR → feature request linking | `pull_requests.feature_request_id` is not assigned; review context can be missing | Repo/PR flow |
| GitHub diff fetcher/commenter | No PR diff fetch helper or PR review/comment poster yet | Review workflow |
| Code review workflow | No `reviewRuns` / `reviewIssues` AI review function | PRD/tasks + PR linking |
| Review/Audit tabs | Review History and Audit Log UI still stubbed | Review/lifecycle query routers |
| Approval flow | No release readiness check or human approval action bar | Review passed state |
| Billing | `packages/billing` still placeholder; no Polar credits/checkout/webhooks | After review loop works |

---

## Issues / Notes

| Issue | Location | Severity |
|-------|----------|----------|
| GitHub webhook URL is configured as `/api/webhooks` somewhere outside code | GitHub App settings / tunnel config | High for GitHub PR webhook testing |
| `featureRequests.list` is scoped to one `projectId` | `packages/api/src/routers/featureRequests.ts` | Low for now |
| Existing lint warnings remain in UI/web files | `packages/ui`, `apps/web` | Low, unrelated to AI workflow |

---

## Next Step — Clarification Answers → PRD Generation

**Goal**: turn the working clarification loop into the first complete product planning loop.

1. Add clarification DB queries:
   - list unanswered questions for a feature request
   - update answers for clarification thread rows

2. Add `featureRequests.answerClarification` tRPC procedure:
   - input: `{ featureRequestId, answers: Array<{ clarificationThreadId, answer }> }`
   - validate tenant access through org/project/workspace join
   - persist answers
   - emit `clarification.answered`

3. Add AI PRD generation:
   - `packages/ai/src/generatePrd.ts`
   - use existing PRD prompt/schema with `generateText` + `Output.object`
   - keep provider diagnostics

4. Add DB write support:
   - `createPrd(featureRequestId, prdOutput)`
   - update feature request status to `prd_generated`
   - write lifecycle event `prd_generated`

5. Add Inngest function:
   - event: `clarification.answered`
   - function: `generate-prd`
   - load feature request + clarification answers
   - generate and insert PRD

6. Minimal UI:
   - in feature request detail, when status is `clarifying`, show AI questions and answer inputs
   - submit answers and refresh detail page
   - PRD tab should then show generated PRD

---

## Build Sequence Reference

```
Step 1: Monorepo + auth                         ✅ Done
Step 2: Feature request CRUD                    ✅ Done
Step 3: Feature request detail shell            ✅ Done
Step 4: GitHub App + webhooks                   ✅ Done
Step 4b: Repo → project linking                 ✅ Done
Step 5: Inngest foundation                      ✅ Done
Step 6a: AI package foundation                  ✅ Done
Step 6b: Feature request clarification loop     ✅ Done
Step 6c: Clarification answers → PRD generation ← DO THIS NEXT
Step 6d: PRD approval → task generation         ← After 6c
Step 7: PR linking + AI review                  ← After PRD/tasks
Step 8: Approval + billing + polish             ← After review loop
```
