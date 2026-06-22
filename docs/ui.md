# ShipFlow AI — UI Design Guidelines

## 1. Design Principles

ShipFlow is a professional tool for engineering teams. Every screen serves a workflow step — not a brand moment. The UI should feel like the inside of a well-run engineering org: precise, fast, unambiguous. It should never feel like a startup landing page that snuck into the dashboard. 

ALWAYS use SHADCN UI!

**Four guiding principles:**

- **Clarity over novelty.** The lifecycle state machine is the product. The UI's job is to make that machine legible at every stage. Every decoration that doesn't carry lifecycle information is suspect.
- **Status is always visible.** A user should be able to open any feature request and understand its current state, what happened, and what can happen next without reading a wall of text.
- **Progressive disclosure.** Show the summary; let the user drill in. The dashboard shows counts and states. The feature-request page shows the full thread. The review run page shows individual issues.
- **Empty states are prompts, not voids.** Every empty list is an invitation to act. "No repositories connected" shows a button to connect one, not a blank card.

---

## 2. Visual Identity

### Design Direction

ShipFlow sits at the intersection of developer tooling (precise, dense, keyboard-friendly) and product management (readable, status-first, collaborative). The palette should feel like a terminal that learned graphic design: dark primary surfaces, bright semantic accents, mono type for code and identifiers, sans for everything else.

### Color Palette

Use semantic color tokens via CSS variables for all UI elements. Reserve named ramps for categorical data in charts and diagrams.

| Role | Token | Usage |
|---|---|---|
| Page background | `--color-background-tertiary` | Outermost bg, behind cards |
| Card / panel surface | `--color-background-primary` | Content areas, sidebars |
| Raised surface | `--color-background-secondary` | Metric cards, code blocks, inputs |
| Primary text | `--color-text-primary` | Headings, labels, body |
| Muted text | `--color-text-secondary` | Captions, metadata, empty states |
| Hint text | `--color-text-tertiary` | Placeholders, timestamps |
| Border default | `--color-border-tertiary` | Card edges, dividers |
| Border emphasis | `--color-border-secondary` | Hover, focused elements |
| Info (primary action) | `--color-background-info` / `--color-text-info` | CTAs, links, active nav |
| Success | `--color-background-success` / `--color-text-success` | `approved`, `shipped`, `review_passed` |
| Warning | `--color-background-warning` / `--color-text-warning` | `clarifying`, `fix_needed`, `pending_human_approval` |
| Danger | `--color-background-danger` / `--color-text-danger` | `rejected`, blocking issues, errors |

**Status color mapping** (core to the product):

| Lifecycle state | Semantic color |
|---|---|
| `draft` | tertiary (neutral) |
| `clarifying` | warning |
| `prd_generated`, `tasks_generated` | info |
| `prd_approved`, `tasks_approved` | info |
| `in_development` | info |
| `ai_review_running` | info (pulsing indicator) |
| `review_failed`, `fix_needed` | danger |
| `review_passed` | success |
| `pending_human_approval` | warning |
| `approved`, `shipped` | success |
| `rejected` | danger |

### Typography

Two font families, three roles:

| Role | Family | Size | Weight |
|---|---|---|---|
| Display / heading | `--font-sans` | 22px (h1), 18px (h2), 16px (h3) | 500 |
| Body | `--font-sans` | 15–16px | 400 |
| Code / identifiers | `--font-mono` | 13px | 400 |
| Captions / metadata | `--font-sans` | 13px | 400, color-text-secondary |

**Rules:**
- Sentence case everywhere. Never ALL CAPS for labels. Title Case only for proper nouns (product name).
- Use `--font-mono` for: PR numbers, commit SHAs, file paths, review issue line numbers, environment variable names, any string that is a code identifier.
- Use `text-wrap: balance` on headings to prevent orphaned single words.
- Use `font-variant-numeric: tabular-nums` on any column with counts or numeric data.
- Ellipsis character `…` (not `...`) in loading states: "Generating PRD…", "Running review…".
- Curly quotes `"` `"` in all prose copy. Straight `"` only inside code/mono contexts.

### Spacing

Use multiples of 4px for component-level spacing, and rem for vertical rhythm between sections.

| Token | Value | Usage |
|---|---|---|
| xs | 4px | Icon-to-label gap, inline badge padding |
| sm | 8px | Input padding, compact list items |
| md | 12px | Card internal gap, tag spacing |
| lg | 16px | Section dividers, button padding |
| xl | 24px | Card padding, sidebar sections |
| 2xl | 32–40px | Page section gaps |

### Border Radius

| Element | Radius |
|---|---|
| Cards, panels, modals | `var(--border-radius-lg)` (12px) |
| Buttons, inputs, tags | `var(--border-radius-md)` (8px) |
| Pills / status badges | 9999px (fully rounded) |
| Code blocks | `var(--border-radius-md)` |

---

## 3. Layout System

### App Shell

```
┌─────────────────────────────────────────────────┐
│  Sidebar (240px fixed)  │  Main content (flex 1) │
│                         │                         │
│  [Logo / Org switcher]  │  [Page header]          │
│                         │  [Content area]         │
│  Nav:                   │                         │
│  · Dashboard            │                         │
│  · Projects             │                         │
│  · [Active project]     │                         │
│    · Repositories       │                         │
│    · Feature Requests   │                         │
│  · Billing              │                         │
│  · Workspace Settings   │                         │
│                         │                         │
│  [User / plan badge]    │                         │
└─────────────────────────────────────────────────┘
```

- Sidebar is `240px` fixed, `--color-background-secondary` background, `0.5px` right border.
- Main content area has a max-width of `880px` centered with auto horizontal margins for reading comfort on wide screens.
- Page headers: title (h1, 22px), optional subtitle (14px, muted), and a right-aligned action area (primary CTA button).
- No full-bleed hero sections inside the app. The landing page (`/`) can be full-bleed.

### Grid

Use a 12-column grid with 24px gutters for complex layouts (dashboard, billing).

For most pages, use a single-column or two-pane layout:
- **Single-column**: feature request detail, PRD viewer, review history.
- **Two-pane**: task board (filter sidebar + Kanban), repository list + connect panel.

---

## 4. Component Patterns

### Status Badges

Status badges are the most frequently rendered component. Use pills with semantic colors.

```
[● draft]           neutral pill
[● clarifying]      warning pill
[↻ ai_review_running]  info pill + pulse animation
[✓ shipped]         success pill
[✗ rejected]        danger pill
```

- Font: 12px, `--font-sans`, 500 weight.
- Padding: `4px 10px`.
- Border-radius: `9999px`.
- Icon: 14px Tabler icon, `aria-hidden="true"`, right of dot or inline.
- Loading state (`ai_review_running`): use a 1.4s opacity pulse on the leading dot only (not the whole badge). Respect `prefers-reduced-motion` — remove the animation, keep the badge.

### Lifecycle Timeline

Every feature request page shows a vertical timeline of state transitions. Each entry:

```
[actor avatar]  [state label]  [timestamp]
               [optional payload summary]
```

- Connector: `1px` solid `--color-border-tertiary` between entries.
- Actor: 24px avatar circle for humans; 20px Tabler `ti-cpu` icon for AI actor.
- Timestamp: 12px, `--color-text-tertiary`, `Intl.DateTimeFormat` — never hardcoded format.
- Payload summary: 13px, mono for code identifiers, collapsed by default, expand on click.
- Most recent entry has no bottom connector.

### Review Issue Cards

Used in the review run detail view.

```
┌─────────────────────────────────────────────────┐
│  [severity badge]  [category badge]              │
│  packages/ai/prompts.ts:42                       │
│                                                  │
│  Description of the issue in plain language.     │
│                                                  │
│  Reasoning: Why this matters to the PRD's        │
│  acceptance criteria.                            │
│                                                  │
│  [resolved]  or  [mark resolved]                 │
└─────────────────────────────────────────────────┘
```

- `blocking` severity: `1.5px solid` danger border on left edge, no border-radius on that side.
- `non_blocking` severity: info left border.
- File path in `--font-mono`, 13px.
- Reasoning section is collapsible (show first 2 lines, "Show reasoning" link).
- Resolved issues: reduced opacity (0.5), "resolved" pill, not removable from view (audit trail).

### PRD Sections

The PRD viewer renders structured sections. Each section:

- Section label: 12px, `--color-text-tertiary`, uppercase tracking (exception to sentence-case rule — this is a label, not a heading).
- Content: 15px body prose.
- Editable sections show a pencil icon on hover (Tabler `ti-edit`, 16px).
- Approval action floats at the bottom of the page in a sticky footer bar — never buried at the top.

### Kanban Board

Task board for `/feature-requests/[id]/tasks`.

- Columns: `Not Started`, `In Progress`, `Done`.
- Cards: `--color-background-primary`, 0.5px border, border-radius-lg, 12px padding.
- Card body: task title (15px, 500), task description excerpt (13px, muted, 2-line clamp).
- Drag handle: Tabler `ti-grip-vertical`, left edge of card, visible on hover only.
- During drag: `box-shadow: 0 4px 16px rgba(0,0,0,0.12)`, `opacity: 0.9`, `cursor: grabbing`.
- Empty column: dashed border, muted "No tasks" label, 48px height.

### Approval Action Bar

Visible on feature requests in `pending_human_approval` state. Sticky to the bottom of the viewport.

```
┌─────────────────────────────────────────────────────┐
│  Release readiness: [ready / blocking reasons]       │
│                           [Reject]  [Approve →]      │
└─────────────────────────────────────────────────────┘
```

- Background: `--color-background-primary`, `0.5px` top border.
- Approve: primary button (info color).
- Reject: secondary button (danger text, neutral border).
- Both open a confirmation modal — never an immediate action.
- Readiness summary: green check or amber warning icon + plain-language summary.

### Credit Usage Indicator

Shown in the sidebar near the user section and on the billing page.

```
AI Reviews: ██████░░░░  6 / 10 used
```

- Progress bar: 8px height, border-radius 4px, info fill color.
- At ≥ 80% used: warning fill color.
- At 100%: danger fill, "Upgrade to continue" link below.
- Use `aria-label="AI reviews: 6 of 10 used"` on the progress bar container.

---

## 5. Page Templates

### Dashboard (`/dashboard`)

**Layout:** Full-width content area, two-column grid at ≥ 800px.

**Left column:** Feature request list, filterable by state. Each row: project name, FR title, status badge, last-updated timestamp.

**Right column:** Metric cards (2×2 grid):
- Total feature requests
- Active reviews
- Shipped this month
- AI review credits used / limit

Below metrics: Inngest workflow activity feed (last 5 events, each with event name, timestamp, feature request link).

**Empty state (new org):** Centered illustration area with two CTAs: "Create your first project" and "Connect a repository".

### Feature Request Detail (`/feature-requests/[id]`)

This is the core screen. It renders the entire lifecycle in one vertical scroll.

**Page header:** FR title, status badge, created-by info, action buttons (context-aware: "Answer clarifications", "Approve PRD", "View PR", "Approve release" — only the relevant action shows).

**Tab bar:** Overview · PRD · Tasks · Review History · Audit Log

**Overview tab:**
- Lifecycle timeline (always visible at top)
- Clarification thread (if any)
- PRD summary (first 3 lines + "View full PRD" link)
- Linked PR card (if any): PR number, branch, last commit SHA, review status

**PRD tab:** Full PRD sections, editable, with approval action bar sticky at bottom.

**Tasks tab:** Kanban board.

**Review History tab:** List of review runs (newest first). Each run: status, trigger, timestamp, issue count breakdown (N blocking, N non-blocking). Clicking a run expands the full issue list.

**Audit Log tab:** Raw event log, newest first. Actor, event type, timestamp, payload (collapsed JSON).

### Repository Connect Flow (`/projects/[id]/repositories`)

**Step 1:** List connected repos. Empty state: "No repositories connected. Connect a GitHub repository to enable PR-driven reviews."

**Step 2:** "Connect repository" → opens GitHub App install flow (new tab or redirect). On callback, repo appears in list.

**Step 3:** Each repo card shows: owner/name, default branch, installation status, last webhook received (or "No webhooks received yet" in muted text).

**Unlinked PR banner:** If a webhook was received for a PR with no matching feature request, show a dismissable banner at the top of the repo card: "1 unlinked PR — associate it with a feature request."

---

## 6. Forms

- All inputs need a visible `<label>` (not placeholder-only).
- Use `autocomplete` attributes on all auth and personal-data fields.
- Use correct `type`: `email` for email, `url` for repo URLs, `text` for everything else.
- Placeholders end with `…` and show example format: `e.g. feature/payment-redesign…`
- Disable spellcheck on repo names, branch names, and API keys: `spellcheck={false}`.
- Submit button: enabled until the request starts. Show a spinner during the request. Label stays the same ("Save", "Connect") — don't change it to "Loading".
- Inline errors: red text directly below the relevant field, `aria-live="polite"`, linked to the field with `aria-describedby`.
- Warn before navigating away from unsaved PRD edits with a router guard.
- Destructive actions (disconnect repo, reject release) require a confirmation modal. Modal heading names the action clearly: "Disconnect stripe-payments?" not "Are you sure?". Primary button is danger-colored and specific: "Disconnect repository", not "Confirm".

**Feature Request form (modal or page):**

```
Feature title *
[________________________________]

Description
[________________________________]
[                                ]
[________________________________]

Source
[○ Manual input  ○ Slack  ○ Email]

[Cancel]  [Submit feature request →]
```

---

## 7. Interactions and Motion

- Honor `prefers-reduced-motion`. All animations are opt-in via `@media (prefers-reduced-motion: no-preference)`.
- Animate `transform` and `opacity` only. No `transition: all`.
- AI review running state: pulse animation on the status badge dot, 1.4s ease-in-out loop.
- Kanban drag: translate transform only. No drop shadow during drag (avoid repaints).
- Tab transitions: `opacity` fade, 150ms, no slide (slides cause layout thrash in narrow viewports).
- Inngest step progress: each step in the timeline appears with a 100ms staggered fade-in as events arrive via polling or SSE.
- Toast notifications (`sonner`): success toasts auto-dismiss at 4s. Error toasts persist until dismissed.

---

## 8. Accessibility

- Semantic HTML first: `<button>` for actions, `<a>` for navigation, `<table>` for tabular data (review issues list), `<nav>` for sidebar.
- All icon-only buttons need `aria-label`: `<button aria-label="Close modal">`.
- Decorative icons: `aria-hidden="true"`.
- All form controls need associated `<label>` or `aria-label`.
- Status badges: don't convey state by color alone. Include a text label inside the badge.
- Review issue list: `role="list"`, each card is `role="listitem"`.
- Lifecycle timeline: `role="list"`, each entry `role="listitem"`, timestamp in `<time datetime="...">`.
- All async state changes (toast appearing, review run completing) use `aria-live="polite"`.
- Skip link at top of layout: `<a href="#main-content" class="sr-only focus:not-sr-only">Skip to main content</a>`.
- Headings hierarchical: one `<h1>` per page (page title), `<h2>` for major sections, `<h3>` for subsections.
- Keyboard navigation: all interactive elements reachable by Tab. Modals trap focus and return focus on close.
- Never use `outline-none` without replacing the focus style with `focus-visible:ring-2`.
- Use `:focus-visible` not `:focus` to avoid showing focus rings on mouse click.

---

## 9. Loading and Empty States

### Loading

- Page-level: skeleton screens, not spinners. Each skeleton element should mirror the size of the real content.
- Component-level (inline data, e.g. metric card): show the metric card shell with a 60px×18px skeleton bar where the number goes.
- AI workflow steps in progress: show the timeline entry with `"Running…"` label and the pulse animation. Never hide the timeline while a step is running.

### Empty States

Every empty list needs:
1. A short heading: "No feature requests yet"
2. One-line context: "Feature requests track work from idea to shipped."
3. One primary action button when the user can do something.

Don't show an empty Kanban board without columns. Show the three columns with their "No tasks" empty states.

Don't show a blank review history tab. Show "No review runs yet. Open a PR against a connected repository to trigger an automated review."

---

## 10. Vercel Web Interface Guidelines Compliance

The following rules from the Vercel Web Interface Guidelines apply everywhere in ShipFlow. Treat them as non-negotiable:

**Accessibility**
- Icon-only buttons need `aria-label`
- Form controls need `<label>` or `aria-label`
- Interactive elements need keyboard handlers
- `<button>` for actions, `<a>` for navigation (never `<div onClick>`)
- Images need `alt` (or `alt=""` if decorative)
- Decorative icons need `aria-hidden="true"`
- Async updates need `aria-live="polite"`
- Headings must be hierarchical `<h1>`–`<h6>`

**Focus**
- Never `outline-none` without a `focus-visible:ring-*` replacement
- Use `:focus-visible` over `:focus`

**Forms**
- Inputs need `autocomplete` and meaningful `name`
- Never block paste (`onPaste` + `preventDefault`)
- Disable spellcheck on emails, codes, usernames
- Submit button stays enabled until request starts
- Errors inline next to fields; focus first error on submit

**Animation**
- Honor `prefers-reduced-motion`
- Animate `transform`/`opacity` only
- Never `transition: all`
- Animations interruptible

**Typography**
- `…` not `...`
- Curly quotes in prose
- Loading states end with `…`: "Generating PRD…"
- `font-variant-numeric: tabular-nums` for numeric columns

**Content Handling**
- Text containers handle long content: `truncate` or `break-words`
- Flex children need `min-w-0` for text truncation
- Handle empty states — never render broken UI

**Navigation & State**
- URL reflects state: filters, pagination, active tab in query params
- Links use `<a>` (Cmd/Ctrl+click support)
- Deep-link all stateful UI (active tab, expanded review run, filter state)
- Destructive actions need confirmation — never immediate

**Touch**
- `touch-action: manipulation` on interactive elements
- `overscroll-behavior: contain` in modals and drawers

**Locale**
- Dates/times: `Intl.DateTimeFormat`
- Numbers: `Intl.NumberFormat`
- Credit amounts: `Intl.NumberFormat` with `style: 'unit'`

**Copy and Content**
- Active voice: "Connect a repository", not "A repository should be connected"
- Numerals for counts: "8 issues" not "eight issues"
- Specific button labels: "Approve PRD", "Connect repository", not "Continue" or "Submit"
- Error messages include the fix: "No GitHub App installed. Install the ShipFlow GitHub App to continue."
- `&` over "and" in space-constrained labels (sidebar nav)

**Anti-patterns to avoid in every PR review:**
- `user-scalable=no` in viewport meta
- `onPaste` with `preventDefault`
- `transition: all`
- `outline-none` without focus replacement
- `<div onClick>` instead of `<button>`
- Images without `width` and `height`
- Large arrays `.map()` without virtualization (review issue lists > 50 items)
- Form inputs without labels
- Icon buttons without `aria-label`
- Hardcoded date/number formats

---

## 11. Copy Conventions

| Situation | Correct | Incorrect |
|---|---|---|
| Button submitting a form | "Create feature request" | "Submit" / "Continue" |
| Confirming a destructive action | "Disconnect repository" | "Yes" / "Confirm" |
| Loading state | "Generating PRD…" | "Loading..." / "Please wait" |
| Error with no data | "Could not load review runs. Try again." | "Error" |
| Empty state | "No tasks yet. Tasks are generated from the approved PRD." | "Nothing here" |
| Blocked action | "AI review credit limit reached. Upgrade to Pro to continue." | "Limit reached" |
| Approval confirmation | "This will mark the feature as shipped and close the review loop." | "Are you sure?" |

AI actor is referred to as "ShipFlow AI" in timeline entries, never "AI", "the model", or "Claude". Human actors use their display name.

---

## 12. Page Titles and Document Metadata

- `<title>`: `{page name} — ShipFlow`
- `<meta name="description">`: Only on marketing pages (`/`). Not needed on authenticated app pages.
- `<meta name="theme-color">`: Match page background. Update dynamically if the user has a dark/light preference.

---

## 13. Responsive Behavior

ShipFlow is primarily a desktop product used by engineers. Mobile support is secondary but should not break.

| Breakpoint | Behavior |
|---|---|
| ≥ 1024px | Full sidebar + main content layout |
| 768–1023px | Sidebar collapses to icon-only rail (40px wide) |
| < 768px | Sidebar becomes a bottom sheet, triggered by a menu button |

The Kanban board at < 768px: switch from three columns side-by-side to a single scrollable column per state, with a horizontal pill picker at the top ("Not Started · In Progress · Done") to switch between columns.

The feature request timeline is readable at all breakpoints — no horizontal scroll, timestamp wraps below the actor label if needed.

---

*These guidelines apply to all screens in `apps/web`. Every PR touching UI components should be checked against Section 10 before merge. Questions about a specific component pattern should reference the relevant section by number.*