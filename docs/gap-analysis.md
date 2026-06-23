# Gap Analysis: ShipFlow AI — PRD vs Current State

## Summary

The infrastructure (auth, DB, GitHub webhooks, tRPC, Inngest skeleton) is well-aligned with the PRD. The core product value — AI-driven clarification, PRD generation, and code review — has not been started. The gaps below are ordered by impact on the demo-able product loop.

---

## Critical Gaps (blockers for a working demo)

### 1. `packages/ai` is empty — zero AI calls exist
The entire value proposition depends on this. The PRD specifies 6 AI workflows (clarification, PRD gen, task gen, code review, re-review, release readiness). None are implemented.

**What's needed:**
- `packages/ai/src/client.ts` — `@openrouter/ai-sdk-provider` client, default model `openai/gpt-4.1-nano`
- `packages/ai/src/schemas/` — Zod schemas for each AI output (prd, clarification, tasks, reviewRun)
- `packages/ai/src/prompts/` — system + user prompts for each workflow
- Use AI SDK v6 `generateText` with `Output.object({ schema })` (not `generateObject`)

### 2. Inngest has only 1 of 7 required functions — and it's the wrong one first
The PRD defines 7 Inngest functions. We have a stub `onPullRequestOpened` that writes lifecycle events. The critical missing chain is:

| PRD Event | Function | Status |
|---|---|---|
| `feature_request.created` | `clarify-request` | ❌ Missing |
| `clarification.answered` | `generate-prd` | ❌ Missing |
| `prd.approved` | `generate-tasks` | ❌ Missing |
| `github.pr.opened` / `github.pr.updated` | `run-review` | ❌ Missing (stub only) |
| `review.failed` | `request-fixes` | ❌ Missing |
| `review.passed` | `check-release-readiness` | ❌ Missing |
| `release.decided` | `finalize-release` | ❌ Missing |

Note: PRD uses dot-notation event names (`feature_request.created`, `github.pr.opened`). Current code uses slash notation (`github/pull_request.opened`). Inngest accepts both — not a breaking issue, but should be consistent.

### 3. `pull_requests.feature_request_id` is not being set
The PRD data model has `pull_requests(id, repository_id, feature_request_id, ...)`. When a PR webhook fires, the code review workflow needs to know *which feature request's PRD and acceptance criteria* to compare against.

Currently `upsertPullRequest` has no `featureRequestId` field in the webhook handler. Without this, the `run-review` Inngest function cannot load the right PRD context — making context-aware AI review impossible.

**Fix options (pick one):**
- A: UI flow — user manually links a PR to a feature request from the FR detail page
- B: Auto-link — when a PR is opened against a branch named `fr-{id}` or similar convention  
- C: Allow unlinked PRs, but block review run if no FR is associated (surface in UI)

Option C is closest to the PRD's edge case handling: *"PR opened against a repo not yet linked to a feature request → event stored, surfaced as 'unlinked PR' for manual association."*

---

## Moderate Gaps (needed for full lifecycle)

### 4. Missing tRPC routers
| Router | Status |
|---|---|
| `review.listRuns`, `review.getRun`, `review.listIssues` | ❌ Missing |
| `prd.approve`, `prd.requestRevision` | ❌ Missing |
| `approval.decide`, `approval.history` | ❌ Missing |
| `billing.*` | ❌ Missing |
| `featureRequest.answerClarification` | ❌ Missing |

### 5. Feature request detail tabs 4–5 are stubs
Review History and Audit Log tabs show `<ComingSoon />`. These will be unblocked once Inngest review functions write to `reviewRuns`, `reviewIssues`, and `lifecycleEvents` tables.

### 6. URL structure divergence
PRD specifies separate page routes per section:
```
/feature-requests/[id]/prd
/feature-requests/[id]/tasks  
/feature-requests/[id]/reviews
```
Current implementation uses tabs on one page at `/dashboard/feature-requests/[id]`.

**Assessment:** Tabs on one page is a reasonable UX simplification and the PRD's routing was indicative, not prescriptive. This is acceptable — no change needed.

### 7. Missing pages
| Page | Status |
|---|---|
| `/workspace/settings` (members, billing) | ❌ Missing |
| `/projects/[id]` (repos, feature requests) | ❌ Missing |
| `/billing` | ❌ Missing |

These are needed for the full demo but not for the core AI loop.

### 8. `packages/billing` is empty
Polar integration doesn't exist. Credit enforcement on review runs is a PRD requirement (acceptance criterion #7). Can be deferred until AI review loop is working.

---

## Minor / Acceptable Deviations

| Item | Status |
|---|---|
| Drag-and-drop Kanban (`@dnd-kit`) | Not installed; tasks use status-cycle buttons instead. Acceptable for demo. |
| `clarification_threads` table | Defined in schema but no UI or tRPC router to drive clarification Q&A. Needed once AI clarification function exists. |
| `release_approvals` table / tRPC | Defined in schema; no UI yet. Unblocked after review passes. |
| Email delivery (sandbox mode) | Console-logged tokens — correct per PRD intent. |

---

## Recommended Re-alignment Sequence

### Priority 1 — `packages/ai` setup (unlocks everything)
Build the AI package first because all 7 Inngest functions depend on it.

Files to create:
- `packages/ai/package.json` — deps: `ai` (SDK v6), `@openrouter/ai-sdk-provider`, `zod`
- `packages/ai/src/client.ts` — `createOpenRouter` client, reads `OPENROUTER_API_KEY` + `AI_MODEL` env
- `packages/ai/src/schemas/clarification.ts` — `{ needs_clarification: boolean, questions: string[], existing_feature_match?: string }`
- `packages/ai/src/schemas/prd.ts` — matches all 7 PRD fields (problemStatement, goals, nonGoals, userStories, acceptanceCriteria, edgeCases, successMetrics)
- `packages/ai/src/schemas/tasks.ts` — `{ tasks: Array<{ title: string, description: string }> }`
- `packages/ai/src/schemas/reviewRun.ts` — `{ issues: [...], summary, recommendation: 'pass' | 'fail' }`
- `packages/ai/src/prompts/clarification.ts`, `prd.ts`, `tasks.ts`, `review.ts`
- Add `OPENROUTER_API_KEY` and `AI_MODEL` to `turbo.json globalEnv`

### Priority 2 — `feature_request.created` Inngest function + tRPC trigger
The first user-visible AI action: submit a feature request → AI generates clarification questions.

- Add `inngest.send("feature_request.created", ...)` in `featureRequests.create` tRPC procedure
- Add `clarify-request` Inngest function: call clarification AI → if questions, set status `clarifying` + write to `clarificationThreads` table
- Add `featureRequest.answerClarification` tRPC procedure → triggers `clarification.answered` → `generate-prd`
- Update FR detail Overview tab: if status = `clarifying`, show questions with answer inputs

### Priority 3 — PRD and task generation Inngest functions
- `generate-prd` function: triggered by `clarification.answered` → call PRD AI → write `prds` row → set status `prd_generated`
- `generate-tasks` function: triggered by `prd.approved` (via `prd.approve` tRPC) → call tasks AI → write `tasks` rows → set status `tasks_generated`
- Add `prd.approve` tRPC procedure (triggers Inngest event)

### Priority 4 — PR → FR linking + code review function
- Add "Link PR to Feature Request" UI on FR detail page (or use Option C — surface unlinked PRs)
- `run-review` Inngest function: fetch diff via `getInstallationOctokit` → load PRD + tasks → call review AI → write `reviewRuns` + `reviewIssues` → set status
- Unblock Review History tab on FR detail

### Priority 5 — Approval flow + remaining UI
- `approval.decide` tRPC procedure
- Approval action bar on FR detail (shown when `status = pending_human_approval`)
- `/workspace/settings` and `/billing` pages

### Priority 6 — Billing (Polar)
Last because it doesn't affect the demo loop, only monetization.

---

## Verification
After Priority 1–4 are done, a full end-to-end demo should be possible:
1. Submit a feature request → AI asks clarification questions (visible in UI)
2. Answer questions → AI generates PRD (visible in PRD tab)
3. Approve PRD → AI generates tasks (visible in Tasks tab)
4. Open a real PR on a linked repo → AI runs code review (visible in Review History tab)
5. Review passes → approve for ship (approval action bar)
