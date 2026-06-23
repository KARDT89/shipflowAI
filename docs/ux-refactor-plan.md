# ShipFlow UX Refactor: Professional End-to-End Product Flow

Last updated: 2026-06-23

## Purpose

ShipFlow has the core lifecycle machinery coming online, but the product surface still feels like a set of backend checkpoints rather than a guided professional workspace. This plan defines the target information architecture and user experience for a full end-to-end product, aligned with:

- `docs/shipflow ai v1.md`
- `docs/PLAN.md`
- `docs/ui-spec.md`
- `docs/gap-analysis.md`
- `docs/delta.md`

The goal is not to make the app prettier in isolation. The goal is to make the lifecycle understandable, trustworthy, and operational: request -> PRD -> tasks -> PR -> AI review -> human approval -> shipped.

## Current UX Problems

- Organization creation feels purposeless because users are asked to create an org before the app explains that orgs own members, projects, repositories, billing, and review credits.
- GitHub connection feels incomplete because the UI does not clearly show account link state, GitHub App installation state, connected repositories, webhook health, or unlinked PRs.
- The dashboard feels generic because metric tiles are placeholders and feature requests are hidden behind a project selector.
- Feature request detail tabs are data buckets, not guided lifecycle steps.
- Tasks are a flat list, not the Kanban board promised by the product direction.
- Review History and Audit Log are empty, so AI activity feels disconnected from the product.
- The manual status dropdown makes the product feel like a debug tool instead of a workflow system.
- Empty states explain what is missing, but they do not consistently explain why it matters or what the next action unlocks.

## Target Product Flow

1. **Create organization**
   - Explain that organizations contain workspaces, projects, repositories, members, billing, and AI review credits.
   - After creation, send the user into an onboarding/setup checklist.

2. **Create project**
   - Treat the project as the first meaningful delivery workspace.
   - Explain that projects group feature requests and connected repositories.

3. **Connect GitHub**
   - Present GitHub as what unlocks real PR review, not as a detached integration.
   - Show clear setup states:
     - GitHub account not linked.
     - GitHub App not installed.
     - App installed but no repositories assigned.
     - Repositories connected and webhook-ready.

4. **Submit feature request**
   - User submits request from Dashboard or Project detail.
   - AI asks clarification questions if needed.
   - User answers clarification questions.
   - AI generates PRD.
   - User approves PRD.
   - AI generates tasks.

5. **Plan and execute work**
   - Tasks appear in Kanban columns: `To Do`, `In Progress`, `Done`.
   - User can move tasks manually.
   - Once tasks exist, UI prompts the user to open or link a GitHub PR.

6. **Link PR and run review**
   - GitHub webhooks store real PRs.
   - PRs appear as linked or unlinked.
   - User links an unlinked PR to a feature request.
   - AI review runs against the approved PRD, generated tasks, and real PR diff.
   - Review History shows pass/fail, issues, severity, file paths, and reasoning.

7. **Approve and ship**
   - If review passes, show release readiness.
   - Human approves or rejects release.
   - Approval writes an audit event.
   - Feature reaches `shipped`.

## Navigation Structure

### `/dashboard`

Purpose: active organization command center.

Should contain:

- Setup checklist until completed:
  - Create organization.
  - Create project.
  - Connect GitHub.
  - Submit first feature request.
  - Generate first PRD.
  - Review first PR.
- Real metrics:
  - Active reviews.
  - Needs clarification.
  - PRDs awaiting approval.
  - Tasks generated.
  - Pending human approval.
  - Shipped this period.
- Needs-attention queue:
  - Clarification questions waiting.
  - Draft PRDs awaiting approval.
  - Failed reviews.
  - Unlinked PRs.
  - Pending release approvals.
- Recent lifecycle activity.
- Recent feature requests across projects.
- Primary CTA: `Submit feature request`.

### `/projects`

Purpose: project portfolio.

Should contain:

- Project list/cards.
- Each project card shows:
  - Name.
  - Connected repo count.
  - Open feature requests.
  - Active reviews.
  - Pending approvals.
  - Last activity.
- CTA: `Create project`.
- Empty state explains projects as delivery workspaces, not generic folders.

### `/projects/[id]`

Purpose: project-level delivery workspace.

Should contain:

- **Overview**
  - Project status summary.
  - Lifecycle counts.
  - Connected repositories.
  - Recent feature requests.
  - Unlinked PRs for repositories in this project.
- **Feature Requests**
  - Filter by lifecycle status.
  - Submit feature request.
  - List requests with status, current blocker, and next action.
- **Repositories**
  - Repositories assigned to this project.
  - Connect or assign repository.
  - Webhook health.
  - Open PRs.
- **Activity**
  - Project-scoped lifecycle events.

### `/repositories`

Purpose: GitHub integration control plane.

Should contain:

- GitHub setup banner:
  - Account linked?
  - App installed?
  - Webhook receiving events?
  - Repositories assigned?
- Connected repositories table:
  - Owner/name.
  - Project.
  - Default branch.
  - Installation account.
  - Last webhook event.
  - Open PR count.
  - Unlinked PR count.
- Unlinked PR inbox:
  - PR number/title/repository/branch.
  - Link to feature request.
  - Trigger review after linking.
- Actions:
  - Connect GitHub.
  - Manage installation.
  - Assign repository to project.
  - Disconnect repository with confirmation.

### `/settings`

Purpose: organization and account administration.

Should contain:

- **Organization**
  - Active org.
  - Rename org.
  - Org slug.
- **Members**
  - Member list.
  - Role badges: owner/admin/member.
  - Invite member.
  - Change role.
  - Remove member.
- **Workspaces / Projects**
  - Workspace list.
  - Project list.
  - Rename/archive project.
- **Integrations**
  - GitHub status summary.
  - Link to Repositories.
- **Account**
  - User profile.
  - Linked GitHub account.
  - Theme.
  - Sign out.

Admin-only actions should be hidden or disabled for non-admin users.

### `/billing`

Purpose: plan, usage, and AI review credit management.

Initial truthful shell:

- Current plan.
- AI review credits used / limit.
- Repository limit.
- Feature request limit.
- Billing status: sandbox until Polar is wired.
- Upgrade CTA clearly marked unavailable or sandbox.

Full Polar version:

- `billing.getPlan`, `billing.getUsage`, `billing.createCheckout`.
- Polar checkout.
- Subscription status.
- Current period.
- Invoice/customer portal link.
- Credit enforcement on AI review runs.
- Upgrade prompt when review credits are exhausted.

Billing should gate AI review runs first, not clarification, PRD generation, or task generation.

## Feature Request Detail Structure

### Header

Always show:

- Short title generated from the request or first sentence.
- Status badge.
- Project.
- Current next action.
- Primary action button based on lifecycle state.

Examples:

- `clarifying` -> `Answer questions`
- `prd_generated` -> `Approve PRD`
- `tasks_generated` -> `Link PR`
- `review_failed` -> `View blocking issues`
- `pending_human_approval` -> `Approve release`

Move the manual status dropdown out of the normal user path. Keep it dev-only or behind an environment flag if needed.

### Overview Tab

Purpose: lifecycle summary.

Should contain:

- Original request.
- Current state explanation.
- Next required action.
- Lifecycle progress rail:
  - Request.
  - Clarification.
  - PRD.
  - Tasks.
  - Development.
  - AI Review.
  - Human Approval.
  - Shipped.
- Clarification questions only when relevant.
- Linked PR summary when available.
- Latest review summary when available.

### PRD Tab

Purpose: review product requirements.

Should contain:

- PRD status and version.
- Approval action for draft PRDs.
- Future action: request revision.
- Sections:
  - Problem statement.
  - Goals.
  - Non-goals.
  - User stories.
  - Acceptance criteria.
  - Edge cases.
  - Success metrics.
- Professional document layout rather than many visually equal isolated cards.
- After approval, show approved-by and approved-at once that data is available.

### Tasks Tab

Purpose: engineering execution board.

Replace the flat task list with Kanban:

- Columns:
  - `To Do`
  - `In Progress`
  - `Done`
- Task card:
  - Title.
  - Description.
  - Status.
  - Optional acceptance criteria reference later.
- Actions:
  - Move task between columns.
  - Mark all tasks approved if the `tasks_approved` state remains part of the workflow.
- Empty states:
  - Before PRD approval: “Approve PRD to generate tasks.”
  - During generation: loading/progress.
  - After generation failure: retry action.

### PR / Review Tab

Purpose: code review workflow.

Should contain:

- Linked PR card:
  - Repository.
  - PR number.
  - Branch.
  - Head SHA.
  - Status.
  - Open on GitHub.
- If no linked PR:
  - Show unlinked PRs from connected repositories.
  - Link selected PR to this feature request.
  - Explain that ShipFlow reviews real GitHub PRs only.
- Review runs:
  - Latest review summary.
  - Pass/fail/running/errored status.
  - Started/completed timestamps.
  - Trigger: opened, synchronized, manual retry.
- Review issues:
  - Severity badge.
  - Category badge.
  - File path and line.
  - Description.
  - Collapsible reasoning.
- Actions:
  - Retry review.
  - Open PR on GitHub.
  - Later: post comments to GitHub.

### Approval Tab

Purpose: final release decision.

Should contain:

- Release readiness summary.
- Latest review status.
- Blocking issue count.
- Human approval actions:
  - Approve ship.
  - Reject and request fixes.
- Approval history.
- Notes field for release manager.
- Empty state until `review_passed`.

### Audit Log Tab

Purpose: trust and traceability.

Should contain:

- Timeline of lifecycle events.
- Actor: user / AI / system.
- Event name.
- From status -> to status.
- Timestamp.
- Collapsible payload.

This tab should make async AI activity feel accountable instead of magical.

## Onboarding Flow

### First sign-in with no organization

Show focused onboarding, not the normal dashboard.

Steps:

1. Create organization.
2. Create first project.
3. Connect GitHub.
4. Submit feature request.

Each step must explain why it exists:

- Organization owns members, billing, repositories, and review credits.
- Project groups feature requests and repositories.
- GitHub enables real PR review.
- Feature request starts the AI delivery lifecycle.

### Organization exists but no project

Make project creation the main action.

### Project exists but no GitHub connection

Allow feature requests, but clearly show GitHub is required for PR review.

### GitHub connected but no feature requests

Prompt the user to submit the first feature request.

## Visual and Interaction Direction

- Keep the app dense and operational, like a professional engineering tool.
- Use structured tables, queues, boards, and timelines instead of decorative layouts.
- Make every empty state action-oriented.
- Use icons for concrete actions:
  - GitHub connection.
  - Open external PR.
  - Retry review.
  - Approve.
  - Reject.
- Use status badges everywhere.
- Keep page headers consistent:
  - Breadcrumb.
  - Title.
  - Short description.
  - Primary action.
- Do not use marketing-style hero sections inside the app.
- Use cards for repeated items, not every page section.
- Use tables for repositories, members, billing usage, and audit logs.
- Use Kanban only for tasks, not the whole lifecycle.

## Implementation Order

1. **Information architecture cleanup**
   - Create real routes for Projects, Repositories, Settings, and Billing.
   - Add a shared page header component.
   - Add a setup checklist component.

2. **Dashboard refactor**
   - Replace placeholder metrics.
   - Add needs-attention queue.
   - Add onboarding states.

3. **Projects**
   - Build `/projects` and `/projects/[id]`.
   - Move project selection out of the dashboard feature request panel.

4. **Repositories**
   - Build GitHub health page.
   - Add connected repository table.
   - Add unlinked PR inbox.

5. **Feature request detail redesign**
   - Add lifecycle progress rail.
   - Move manual status dropdown out of primary flow.
   - Refactor tabs into Overview, PRD, Tasks, PR & Review, Approval, Audit Log.

6. **Kanban**
   - Replace task list with a 3-column board.
   - Add drag/drop later with `@dnd-kit`; first pass can use column move buttons if visually board-like.

7. **Settings**
   - Add org profile, members, integrations, and account sections.

8. **Billing**
   - Add truthful sandbox billing shell.
   - Wire Polar after the AI review loop is stable.

9. **Polish pass**
   - Consistent loading skeletons.
   - Better empty states.
   - Better copy.
   - Responsive checks.
   - Remove debug affordances from normal user path.

## When To Start Implementing This Refactor

Start implementing this UX refactor after the current planning loop is committed and verified:

1. Feature request creation works.
2. Clarification works.
3. PRD generation works.
4. PRD approval works.
5. Task generation works.

That point has effectively arrived. The next backend milestone is PR linking and AI review, but the UX refactor should begin now in parallel with that work, starting with information architecture and onboarding. Do not wait until billing or release approval are complete; the current UI will make future workflow work harder to understand and test.

Recommended immediate sequence:

1. Commit the current PRD/task-generation work.
2. Implement the navigation/page shell refactor and onboarding checklist.
3. Build Projects and Repositories pages.
4. Then implement PR linking + AI review inside the new Repositories and feature-request Review surfaces.

## Acceptance Criteria

- A new user understands why they are creating an organization.
- A user can tell whether GitHub is fully connected and what remains incomplete.
- Dashboard shows real work needing attention.
- Projects and repositories are not placeholder pages.
- Feature request detail clearly shows current lifecycle state and next action.
- Tasks appear as a Kanban board.
- Review and audit areas explain what happened and why.
- Billing honestly communicates current plan and usage, even before full Polar checkout is wired.
- The app feels like a professional delivery system, not a demo stitched around backend workflows.

## Assumptions

- Keep the current stack and shadcn component system.
- Keep humans in control of PRD approval, PR linking, and release approval.
- Do not implement autonomous code editing or PR creation in this UX refactor.
- Prioritize professional flow and clarity before visual flourish.
