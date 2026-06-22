# ShipFlow AI — Product Requirements Document

## 1. Problem Statement

Engineering teams lose throughput at the handoff points between product and engineering: vague requests, undocumented requirements, manual PR review, and approval bottlenecks. ShipFlow AI removes the handoff friction by running the entire delivery lifecycle — request, PRD, tasks, code, review, fix, re-review, approval, ship — inside one system, with AI doing the clarification, documentation, and first-pass review work, and humans retaining final release authority.

## 2. Goals

- Run the full loop: Feature Request → PRD → Tasks → Code → AI Review → Fixes → Re-Review → Human Approval → Ship.
- Connect to real GitHub repositories via Octokit. No mocked PR or diff data anywhere in the product.
- Use AI SDK for clarification, PRD generation, task generation, code review, QA validation, and release-readiness checks. Reviews must evaluate intent (PRD/acceptance criteria match), not just syntax.
- Multi-tenant workspace model: org → workspace → project → repo → feature request → PRD → tasks → PR → review history.
- Async execution for every long-running step via Inngest, with visible progress state in the UI.
- Auth via BetterAuth, sandbox/test mode (no production email/OAuth secrets required to run the demo).
- Monetization via Polar: plans, usage limits, AI review credits.

## 3. Non-Goals

- No support for non-GitHub VCS (GitLab, Bitbucket) in v1.
- No support for languages/runtimes beyond what the AI review model can read as plain diffs (no language-specific static analysis tooling integration in v1).
- No real-time pair-programming or in-editor agent. Coding agents/developers push code outside the platform; ShipFlow consumes the resulting PR.
- No custom workflow builder. The lifecycle state machine is fixed in v1.

## 4. Personas

- **Product Owner** — submits feature requests, answers AI clarification questions, reviews/approves PRDs and tasks.
- **Engineer / Coding Agent** — implements tasks, opens PRs, responds to AI review issues.
- **Reviewer / Release Manager** — reads AI review history and makes the final approve/reject call.
- **Org Admin** — manages workspace, billing plan, repo connections, seats.

## 5. Core Lifecycle (State Machine)

```
draft
  → clarifying              (AI asks follow-up questions)
  → prd_generated
  → prd_approved
  → tasks_generated
  → tasks_approved
  → in_development          (PR opened, linked to feature request)
  → ai_review_running
  → review_failed → fix_needed → ai_review_running   (loop)
  → review_passed
  → pending_human_approval
  → approved → shipped
  → rejected → fix_needed   (alternate exit from human approval)
```

Each transition is an event. Every event is logged with actor (`user` or `ai`), timestamp, and payload, forming the review/audit history shown in the UI.

## 6. Monorepo Architecture

```
shipflow/
├── apps/
│   └── web/                 # Next.js App Router, tRPC client, Shadcn UI
├── packages/
│   ├── api/                 # tRPC routers + procedures
│   ├── db/                  # Drizzle schema, migrations, PostgreSQL client
│   ├── auth/                 # BetterAuth config (org plugin, GitHub provider)
│   ├── github/               # Octokit App client, webhook verification, diff fetch
│   ├── ai/                   # AI SDK prompts, Zod schemas, structured-output calls
│   ├── inngest/               # Inngest client + function definitions
│   ├── billing/               # Polar client, plan config, credit ledger
│   └── ui/                    # Shared Shadcn components
├── turbo.json
└── package.json
```

Rationale for Drizzle over Prisma: explicit query building, no generated client abstraction layer, smaller runtime, matches the rest of your stack (Pollify, Wasi, OIDC server all use Drizzle).

## 7. Tech Stack

| Layer | Choice |
|---|---|
| Frontend | Next.js (App Router) |
| API | tRPC |
| UI | Shadcn UI |
| Auth | BetterAuth (sandbox/test mode, GitHub OAuth provider, organization plugin) |
| Billing | Polar |
| VCS | Octokit (GitHub App, not plain OAuth app — needed for installation-scoped webhook + repo access) |
| AI | Vercel AI SDK, structured output via `generateObject` + Zod schemas |
| Async | Inngest |
| ORM | Drizzle |
| DB | PostgreSQL |
| Hosting | Vercel (web) + Vercel-hosted Inngest functions or Inngest Cloud |
| Monorepo | Turborepo |

## 8. Data Model (core entities)

```
organizations(id, name, polar_customer_id, plan, created_at)
workspaces(id, org_id, name)
workspace_members(workspace_id, user_id, role)
projects(id, workspace_id, name)
repositories(id, project_id, github_installation_id, owner, name, default_branch)
feature_requests(id, project_id, source, raw_input, status, created_by)
clarification_threads(id, feature_request_id, question, answer, asked_by_ai)
prds(id, feature_request_id, problem_statement, goals, non_goals, user_stories,
     acceptance_criteria, edge_cases, success_metrics, status, version)
tasks(id, prd_id, title, description, status, order)
pull_requests(id, repository_id, feature_request_id, github_pr_number, head_sha,
               base_sha, status, opened_at)
review_runs(id, pull_request_id, trigger, status, started_at, completed_at)
review_issues(id, review_run_id, severity, category, file_path, line, description,
               resolved boolean)
release_approvals(id, feature_request_id, decided_by, decision, decided_at, notes)
usage_credits(id, org_id, period_start, period_end, ai_reviews_used, ai_reviews_limit)
subscriptions(id, org_id, polar_subscription_id, plan_id, status, current_period_end)
```

`review_issues.severity` is `blocking | non_blocking`. A `review_run` cannot resolve to `review_passed` while any `blocking` issue is unresolved.

## 9. GitHub Integration (Octokit)

- Use a **GitHub App**, not a plain OAuth App. Required for: org-level installation, fine-grained repo permissions, and receiving webhooks scoped to installed repos only.
- Permissions needed: `contents:read`, `pull_requests:write` (to post review comments), `metadata:read`.
- Webhook events to subscribe: `installation`, `pull_request` (opened, synchronize, closed), `pull_request_review_comment`.
- Webhook handler: verify signature (`X-Hub-Signature-256`), persist raw event, emit Inngest event (`github/pr.opened`, `github/pr.updated`). Webhook route does no AI work itself — it only ingests and hands off to Inngest.
- Diff fetching: use `octokit.rest.pulls.listFiles` to get changed files, `octokit.rest.pulls.get` for PR metadata, raw patch content per file from the same response (no separate clone step needed for v1).
- Posting review output: `octokit.rest.pulls.createReview` with `event: 'COMMENT'` and per-file `comments[]` for blocking issues; summary review body lists all issues with severity.
- No mock data path. If a repository is not connected, the feature request stays at `in_development` with a UI prompt to connect a repo — it does not synthesize a fake PR.

## 10. AI Workflows (AI SDK)

All AI calls use `generateObject` with a Zod schema — never freeform text parsing.

1. **Clarification** — input: raw feature request. Output: `{ needs_clarification: boolean, questions: string[], existing_feature_match?: string }`. If `existing_feature_match` is set, the UI surfaces "this may already exist" instead of proceeding.
2. **PRD generation** — input: feature request + clarification answers. Output schema matches the `prds` table fields exactly (problem statement, goals, non-goals, user stories, acceptance criteria, edge cases, success metrics).
3. **Task generation** — input: approved PRD. Output: ordered list of `{ title, description }` engineering tasks.
4. **Code review** — input: PRD, acceptance criteria, task list, PR diff (changed files + patches). Output: `{ issues: [{ severity, category, file_path, line, description, reasoning }], summary, recommendation: 'pass' | 'fail' }`. `category` ∈ `requirements_mismatch | security | performance | edge_case | code_quality`. `reasoning` is mandatory per issue — this is what separates it from a linter.
5. **Re-review** — same schema as code review, scoped additionally to "issues from the previous run and whether they were resolved."
6. **Release readiness check** — input: PRD, latest review_run, unresolved issue count. Output: `{ ready: boolean, blocking_reasons: string[] }`. This is advisory — it does not gate the human approval action, it informs it.

## 11. Inngest Workflows

| Event | Function | Steps |
|---|---|---|
| `feature_request.created` | `clarify-request` | run clarification AI call → if questions exist, set status `clarifying` and stop; else proceed to PRD generation |
| `clarification.answered` | `generate-prd` | re-run clarification check → generate PRD → save → set status `prd_generated` |
| `prd.approved` | `generate-tasks` | generate task list → save → set status `tasks_generated` |
| `github.pr.opened` / `github.pr.updated` | `run-review` | fetch PR diff via Octokit → load PRD + tasks → run code review AI call → persist `review_run` + `review_issues` → set status `review_passed` or `review_failed` |
| `review.failed` | `request-fixes` | set status `fix_needed`, notify assignee (in-app) |
| `pr.resynchronized` (after fix) | `run-review` (same function, re-review path) | same as above, with prior issues included in context |
| `review.passed` | `check-release-readiness` | run readiness AI call → set status `pending_human_approval` |
| `release.decided` | `finalize-release` | on approve: set status `shipped`, decrement nothing further; on reject: set status `fix_needed` |

Every function step is visible in the UI as a timeline entry on the feature request page (status, started_at, completed_at, output summary).

## 12. Auth (BetterAuth)

- Sandbox/test mode: GitHub OAuth provider configured with a dev OAuth app, magic-link or email/password fallback with console-logged tokens instead of real email delivery.
- Organization plugin for workspace membership and roles (`owner`, `admin`, `member`).
- Session includes active workspace ID; all tRPC procedures resolve tenant scope from session, not from client-supplied IDs.

## 13. Billing (Polar)

- Plans: `free`, `pro`, `team` — define in `packages/billing/plans.ts` with limits: max repos, AI reviews/month, feature requests/month.
- Checkout: Polar-hosted checkout link generated per org on upgrade.
- Webhooks to handle: `subscription.created`, `subscription.updated`, `subscription.canceled`, `order.paid` → update `subscriptions` and reset `usage_credits` period.
- Credit enforcement: every AI review run decrements `usage_credits.ai_reviews_used`; tRPC procedure rejects new review runs once `ai_reviews_used >= ai_reviews_limit`, surfaced in UI as an upgrade prompt.

## 14. tRPC Router Surface

```
auth.*            session, org switch
workspace.*        create, list, members
project.*          create, list
repository.*        connect (installation callback), list, disconnect
featureRequest.*     create, list, get, answerClarification
prd.*               get, approve, requestRevision
task.*              list, updateStatus
pullRequest.*        list (by feature request), get
review.*            listRuns, getRun, listIssues
approval.*           decide (approve/reject), history
billing.*            getPlan, getUsage, createCheckout
```

## 15. Pages

- `/` — landing
- `/login`, `/signup`
- `/dashboard` — org-level feature request list across projects, status overview
- `/workspace/settings` — members, billing
- `/projects/[id]` — repos, feature requests
- `/feature-requests/[id]` — single source of truth: clarification thread, PRD, task board tab, PR + review history tab, approval action
- `/projects/[id]/repositories` — GitHub App install/connect flow
- `/feature-requests/[id]/prd` — PRD viewer/editor
- `/feature-requests/[id]/tasks` — Kanban board
- `/feature-requests/[id]/reviews` — review run history, issues list, severity filter
- `/billing` — plan, usage, upgrade

## 16. Environment Variables

```
DATABASE_URL=
BETTER_AUTH_SECRET=
GITHUB_APP_ID=
GITHUB_APP_PRIVATE_KEY=
GITHUB_WEBHOOK_SECRET=
GITHUB_APP_CLIENT_ID=
GITHUB_APP_CLIENT_SECRET=
OPENAI_API_KEY=            # or ANTHROPIC_API_KEY, depending on AI SDK provider choice
INNGEST_EVENT_KEY=
INNGEST_SIGNING_KEY=
POLAR_ACCESS_TOKEN=
POLAR_WEBHOOK_SECRET=
NEXT_PUBLIC_APP_URL=
```

## 17. Build Sequence (hackathon-scoped)

1. Monorepo scaffold (Turborepo, `apps/web`, `packages/db` with Drizzle + Postgres, `packages/auth` with BetterAuth sandbox config). Auth working end to end before anything else.
2. `packages/github`: GitHub App registration, installation flow, webhook receiver that only persists + emits Inngest events. Verify real webhook delivery before building any AI logic.
3. `packages/inngest`: wire the function table from section 11 with stub AI calls (return hardcoded shape, not hardcoded PR data) to validate the event chain end to end.
4. `packages/ai`: replace stubs with real `generateObject` calls — clarification, PRD, tasks, review, readiness — one at a time, testing each against a real connected repo and real PR.
5. UI: feature request detail page (clarification → PRD → tasks → PR/review tabs), Kanban board, review issue list with severity badges, approval action.
6. `packages/billing`: Polar plan config, checkout, webhook handler, usage credit enforcement on the review-run procedure.
7. Polish pass: dashboard, landing page, README, demo video, LinkedIn/X post with required tags and hashtag.

## 18. Acceptance Criteria

- A feature request submitted with insufficient detail produces AI-generated clarification questions before any PRD is created.
- A PRD generated by the platform contains all seven required sections.
- Tasks generated from a PRD appear on a Kanban board and can be manually reordered/status-changed.
- Connecting a real GitHub repository and opening a real PR triggers a webhook-driven review run with no manual step.
- A review run with a blocking issue cannot reach `review_passed`; resolving the issue and pushing a new commit triggers a re-review automatically.
- A feature only reaches `shipped` after an explicit human approval action recorded in `release_approvals`.
- Exceeding the plan's AI review credit limit blocks new review runs and surfaces an upgrade path.
- No code path returns synthetic PR/diff/review data — every review result traces to a real Octokit API response.

## 19. Edge Cases

- Feature request describes something already shipped → AI flags `existing_feature_match`, no PRD generated unless user explicitly overrides.
- PR opened against a feature request with no approved PRD → review run blocked, UI prompts PRD approval first.
- Webhook delivered for a PR on a repo not yet linked to a feature request → event stored, surfaced as "unlinked PR" for manual association.
- Reviewer re-review finds new issues not present in the first pass → both old and new issues shown, only newly-introduced blocking issues affect status.
- Org downgrades plan mid-period with usage already over the new limit → existing in-flight review runs complete, new runs blocked until next period or upgrade.

## 20. Success Metrics

- Time from feature request creation to first PRD draft.
- Number of AI review cycles before human approval (lower is better — signals review quality and clarity of PRD).
- Percentage of feature requests reaching `shipped` without manual status override.
- AI review credit consumption per shipped feature (cost efficiency signal).

## 21. Hackathon Submission Checklist

- [ ] Public GitHub repository
- [ ] Deployed live project (Vercel)
- [ ] Demo video
- [ ] README: overview, tech stack, architecture, setup instructions, env vars, DB schema notes, GitHub integration setup, Inngest workflow explanation, AI features implemented
- [ ] LinkedIn + X/Twitter post before/at start of build, tagging ChaiCode, Hitesh Sir, Piyush, hashtag #chaicode, closing line "Builder Mode On | iPhone Giveaway Hackathon":
