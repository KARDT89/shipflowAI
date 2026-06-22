# ShipFlow AI — UI Specification

> This is the source of truth for all UI decisions in `apps/web`. Give this file to any AI agent building UI for this project. When in doubt: use a shadcn component first. Build a custom component only when no shadcn component fits.

---

## 1. Component Import Paths

All shadcn components live in `@workspace/ui/components/<name>`. Import pattern:

```tsx
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, CardAction } from "@workspace/ui/components/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@workspace/ui/components/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@workspace/ui/components/dialog"
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from "@workspace/ui/components/alert-dialog"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@workspace/ui/components/sheet"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@workspace/ui/components/select"
import { Input } from "@workspace/ui/components/input"
import { Textarea } from "@workspace/ui/components/textarea"
import { Label } from "@workspace/ui/components/label"
import { Separator } from "@workspace/ui/components/separator"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { Progress } from "@workspace/ui/components/progress"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@workspace/ui/components/table"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@workspace/ui/components/dropdown-menu"
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@workspace/ui/components/tooltip"
import { Avatar, AvatarImage, AvatarFallback } from "@workspace/ui/components/avatar"
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@workspace/ui/components/collapsible"
import { ScrollArea } from "@workspace/ui/components/scroll-area"
import { Sidebar, SidebarContent, SidebarHeader, SidebarFooter, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@workspace/ui/components/sidebar"
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from "@workspace/ui/components/breadcrumb"
import { Empty } from "@workspace/ui/components/empty"
import { Spinner } from "@workspace/ui/components/spinner"
import { Sonner } from "@workspace/ui/components/sonner"
import { toast } from "sonner"
```

---

## 2. Available Component Inventory

| Component | Use for |
|-----------|---------|
| `Badge` | Status indicators, severity labels, category tags |
| `Button` | All actions — variant determines hierarchy |
| `Card` | Feature request rows, review issue cards, metric tiles, repo cards |
| `Tabs` | Feature request detail page (Overview / PRD / Tasks / Review History / Audit Log) |
| `Dialog` | Confirmation modals, feature request creation form |
| `AlertDialog` | Destructive confirmations only (disconnect repo, reject release) |
| `Sheet` | Mobile sidebar, quick-view panels on narrow viewports |
| `Select` | Status filter, workspace switcher |
| `Input` | Feature request title, repo URL, all single-line fields |
| `Textarea` | Feature request description, PRD section editor |
| `Label` | Every form field — always pair with Input/Textarea |
| `Separator` | Section dividers in cards, sidebar sections |
| `Skeleton` | Page-level loading — mirror the shape of real content |
| `Progress` | AI review credit usage bar |
| `Table` | Review issues list, audit log |
| `DropdownMenu` | Overflow actions (•••), org switcher in sidebar |
| `Tooltip` | Icon-only button labels, truncated text explanations |
| `Avatar` | Lifecycle timeline actor avatars |
| `Collapsible` | Expandable reasoning in review issue cards, audit log payload |
| `ScrollArea` | Sidebar scroll, review history list, audit log |
| `Sidebar` | App shell sidebar (shadcn Sidebar — do not build a custom nav) |
| `Breadcrumb` | Page header navigation trail |
| `Empty` | Empty states for all lists |
| `Spinner` | Inline loading within buttons and cards (not page-level) |
| `Sonner` / `toast` | All toast notifications |

---

## 3. Design Principles

ShipFlow is an engineering tool, not a marketing surface. Every screen serves one step of the lifecycle. The UI makes the lifecycle state machine legible — not decorative.

- **Clarity over novelty.** If it doesn't carry lifecycle information, it's suspect.
- **Status is always visible.** Open any feature request and know: current state, what happened, what can happen next.
- **Progressive disclosure.** Dashboard → list → detail → drill-in. Never dump everything at once.
- **Empty states are prompts.** "No repositories connected" shows a button to connect one.

---

## 4. Status Badge System

Status badges appear everywhere. Always use `<Badge>` — never a custom `<div>` or `<span>` for status.

### Lifecycle State → Badge Variant

| Lifecycle state | Badge variant | Additional class |
|----------------|--------------|-----------------|
| `draft` | `outline` | — |
| `clarifying` | `secondary` | `text-warning` (custom class) |
| `prd_generated` | `secondary` | — |
| `prd_approved` | `secondary` | — |
| `tasks_generated` | `secondary` | — |
| `tasks_approved` | `secondary` | — |
| `in_development` | `default` | — |
| `ai_review_running` | `default` | `animate-pulse` |
| `review_failed` | `destructive` | — |
| `fix_needed` | `destructive` | — |
| `review_passed` | `secondary` | `text-success` (custom class) |
| `pending_human_approval` | `secondary` | `text-warning` (custom class) |
| `approved` | `secondary` | `text-success` (custom class) |
| `shipped` | `default` | `bg-success text-success-foreground` |
| `rejected` | `destructive` | — |

### Review Issue Severity → Badge Variant

| Severity | Variant |
|----------|---------|
| `blocking` | `destructive` |
| `non_blocking` | `outline` |

### Review Issue Category → Badge Variant

| Category | Variant |
|----------|---------|
| `requirements_mismatch` | `destructive` |
| `security` | `destructive` |
| `performance` | `secondary` |
| `edge_case` | `outline` |
| `code_quality` | `outline` |

### Status Badge Usage Example

```tsx
import { Badge } from "@workspace/ui/components/badge"
import { cn } from "@workspace/ui/lib/utils"

function FeatureRequestStatusBadge({ status }: { status: string }) {
  const config: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", label: string }> = {
    draft:                   { variant: "outline",     label: "Draft" },
    clarifying:              { variant: "secondary",   label: "Clarifying" },
    prd_generated:           { variant: "secondary",   label: "PRD generated" },
    prd_approved:            { variant: "secondary",   label: "PRD approved" },
    tasks_generated:         { variant: "secondary",   label: "Tasks generated" },
    tasks_approved:          { variant: "secondary",   label: "Tasks approved" },
    in_development:          { variant: "default",     label: "In development" },
    ai_review_running:       { variant: "default",     label: "Review running…" },
    review_failed:           { variant: "destructive", label: "Review failed" },
    fix_needed:              { variant: "destructive", label: "Fix needed" },
    review_passed:           { variant: "secondary",   label: "Review passed" },
    pending_human_approval:  { variant: "secondary",   label: "Pending approval" },
    approved:                { variant: "secondary",   label: "Approved" },
    shipped:                 { variant: "default",     label: "Shipped" },
    rejected:                { variant: "destructive", label: "Rejected" },
  }
  const { variant, label } = config[status] ?? { variant: "outline", label: status }
  return <Badge variant={variant}>{label}</Badge>
}
```

---

## 5. Button Hierarchy

| Action type | Variant | Size | Example |
|-------------|---------|------|---------|
| Primary CTA | `default` | `default` | "Submit feature request", "Approve PRD" |
| Secondary / cancel | `outline` | `default` | "Cancel", "Go back" |
| Destructive | `destructive` | `default` | "Reject release", "Disconnect repository" |
| Ghost nav item | `ghost` | `sm` | Sidebar nav items |
| Icon-only toolbar | `ghost` | `icon` | Edit pencil, close |
| Inline text link | `link` | — | "View full PRD", "Show reasoning" |

```tsx
// Primary action
<Button variant="default">Approve PRD</Button>

// Dangerous action — always opens AlertDialog before executing
<Button variant="destructive">Disconnect repository</Button>

// Icon-only — always needs aria-label
<Button variant="ghost" size="icon" aria-label="Edit section">
  <PencilIcon />
</Button>
```

---

## 6. Card Patterns

Use shadcn `<Card>` for all card surfaces. Use `size="sm"` for compact contexts (sidebar widgets, metric tiles).

### Feature Request Row Card

```tsx
<Card>
  <CardHeader>
    <CardTitle>{featureRequest.title}</CardTitle>
    <CardAction>
      <FeatureRequestStatusBadge status={featureRequest.status} />
    </CardAction>
    <CardDescription>{project.name} · {formatDate(featureRequest.createdAt)}</CardDescription>
  </CardHeader>
</Card>
```

### Metric Tile (Dashboard)

```tsx
<Card size="sm">
  <CardHeader>
    <CardDescription>Active reviews</CardDescription>
    <CardTitle className="text-2xl tabular-nums">{count}</CardTitle>
  </CardHeader>
</Card>
```

### Review Issue Card

Use `<Card>` with a left border override for severity. Never use raw `<div>` for these.

```tsx
<Card className={cn(
  "border-l-2",
  issue.severity === "blocking" ? "border-l-destructive" : "border-l-border"
)}>
  <CardHeader>
    <div className="flex gap-2">
      <Badge variant="destructive">{issue.severity}</Badge>
      <Badge variant="outline">{issue.category}</Badge>
    </div>
    <CardTitle className="font-mono text-sm">{issue.filePath}:{issue.line}</CardTitle>
  </CardHeader>
  <CardContent>
    <p>{issue.description}</p>
    <Collapsible>
      <CollapsibleTrigger asChild>
        <Button variant="link" size="sm">Show reasoning</Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <p className="text-sm text-muted-foreground">{issue.reasoning}</p>
      </CollapsibleContent>
    </Collapsible>
  </CardContent>
</Card>
```

---

## 7. Page Layout & Navigation

### App Shell

Use shadcn `<Sidebar>` for the nav. Do not build a custom sidebar component.

```tsx
// apps/web/app/layout.tsx structure
<SidebarProvider>
  <Sidebar>
    <SidebarHeader>
      {/* Logo + OrgSwitcher (DropdownMenu) */}
    </SidebarHeader>
    <SidebarContent>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton asChild>
            <Link href="/dashboard">Dashboard</Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
        {/* Projects, Settings, Billing */}
      </SidebarMenu>
    </SidebarContent>
    <SidebarFooter>
      {/* CreditUsageIndicator + UserMenu */}
    </SidebarFooter>
  </Sidebar>
  <main id="main-content">
    {children}
  </main>
</SidebarProvider>
```

### Page Header Pattern

Every page uses this structure — no variations.

```tsx
<div className="flex items-start justify-between">
  <div>
    <Breadcrumb>...</Breadcrumb>
    <h1 className="text-xl font-medium">{title}</h1>
    <p className="text-sm text-muted-foreground">{subtitle}</p>
  </div>
  <div className="flex gap-2">
    {/* Primary action button */}
  </div>
</div>
<Separator className="my-4" />
```

---

## 8. Feature Request Detail Page (`/feature-requests/[id]`)

Core screen — use `<Tabs>` from shadcn. Five tabs.

```tsx
<Tabs defaultValue="overview">
  <TabsList>
    <TabsTrigger value="overview">Overview</TabsTrigger>
    <TabsTrigger value="prd">PRD</TabsTrigger>
    <TabsTrigger value="tasks">Tasks</TabsTrigger>
    <TabsTrigger value="reviews">Review History</TabsTrigger>
    <TabsTrigger value="audit">Audit Log</TabsTrigger>
  </TabsList>

  <TabsContent value="overview">
    {/* Lifecycle timeline + clarification thread + PRD summary + linked PR card */}
  </TabsContent>

  <TabsContent value="prd">
    {/* PRD sections + sticky approval bar at bottom */}
  </TabsContent>

  <TabsContent value="tasks">
    {/* Kanban board */}
  </TabsContent>

  <TabsContent value="reviews">
    {/* Review run list — each run is a Card, expanding with review issues */}
  </TabsContent>

  <TabsContent value="audit">
    {/* Audit log as Table */}
  </TabsContent>
</Tabs>
```

---

## 9. Forms

Always use `<Label>` + `<Input>` / `<Textarea>` pairs. Never placeholder-only.

### Feature Request Creation (Dialog)

```tsx
<Dialog>
  <DialogTrigger asChild>
    <Button>Submit feature request</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>New feature request</DialogTitle>
    </DialogHeader>
    <form>
      <div className="grid gap-4">
        <div className="grid gap-1.5">
          <Label htmlFor="fr-title">Feature title <span aria-hidden>*</span></Label>
          <Input id="fr-title" name="title" required placeholder="e.g. Add CSV export to reports…" />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="fr-description">Description</Label>
          <Textarea id="fr-description" name="description" rows={4} />
        </div>
      </div>
    </form>
    <DialogFooter>
      <Button variant="outline" type="button">Cancel</Button>
      <Button type="submit">Submit feature request</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### Destructive Confirmation — use AlertDialog, not Dialog

```tsx
<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button variant="destructive">Disconnect repository</Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Disconnect {repo.owner}/{repo.name}?</AlertDialogTitle>
      <AlertDialogDescription>
        Existing review history is kept. Future webhooks from this repository will be ignored.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/80">
        Disconnect repository
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

---

## 10. Loading States

Use `<Skeleton>` for page-level loading. Use `<Spinner>` only for inline loading inside a button or card.

```tsx
// Page-level skeleton — mirrors real content shape
function FeatureRequestListSkeleton() {
  return (
    <div className="grid gap-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-5 w-20" />
          </CardHeader>
        </Card>
      ))}
    </div>
  )
}

// Button with loading state — label stays, spinner appears
<Button disabled={isPending}>
  {isPending && <Spinner className="mr-2 size-4" />}
  Approve PRD
</Button>
```

---

## 11. Empty States

Use the `<Empty>` component from `@workspace/ui/components/empty` for all empty lists.

```tsx
<Empty
  title="No feature requests yet"
  description="Feature requests track work from idea to shipped."
  action={<Button>Submit feature request</Button>}
/>
```

Never show a blank page. Show the empty state for every list, table, and tab.

---

## 12. Credit Usage Indicator

Built from shadcn `<Progress>`. Lives in the sidebar footer and billing page.

```tsx
function CreditUsageIndicator({ used, limit }: { used: number; limit: number }) {
  const pct = Math.min((used / limit) * 100, 100)
  const isWarning = pct >= 80
  const isDanger = pct >= 100

  return (
    <div className="grid gap-1.5">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>AI Reviews</span>
        <span className="tabular-nums">{used} / {limit} used</span>
      </div>
      <Progress
        value={pct}
        aria-label={`AI reviews: ${used} of ${limit} used`}
        className={cn(
          isDanger ? "[&>div]:bg-destructive" :
          isWarning ? "[&>div]:bg-warning" : ""
        )}
      />
      {isDanger && (
        <Button variant="link" size="sm" className="h-auto p-0 text-destructive" asChild>
          <Link href="/billing">Upgrade to continue</Link>
        </Button>
      )}
    </div>
  )
}
```

---

## 13. Lifecycle Timeline

The vertical event log on the feature request overview tab. Use semantic HTML — no custom timeline library.

```tsx
<ol role="list" className="relative border-l border-border pl-6">
  {events.map((event) => (
    <li key={event.id} role="listitem" className="mb-6 last:mb-0">
      <div className="absolute -left-2 flex size-4 items-center justify-center rounded-full bg-background ring-1 ring-border">
        {event.actor === "ai"
          ? <CpuIcon className="size-3" aria-hidden />
          : <Avatar className="size-4"><AvatarFallback>{event.actorInitials}</AvatarFallback></Avatar>
        }
      </div>
      <div className="flex items-center gap-2">
        <FeatureRequestStatusBadge status={event.toStatus} />
        <time
          dateTime={event.createdAt.toISOString()}
          className="text-xs text-muted-foreground"
        >
          {new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(event.createdAt)}
        </time>
      </div>
      {event.payload && (
        <Collapsible>
          <CollapsibleTrigger asChild>
            <Button variant="link" size="sm" className="h-auto p-0 text-xs">Show details</Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <pre className="mt-1 rounded-md bg-muted px-3 py-2 font-mono text-xs overflow-x-auto">
              {JSON.stringify(event.payload, null, 2)}
            </pre>
          </CollapsibleContent>
        </Collapsible>
      )}
    </li>
  ))}
</ol>
```

---

## 14. Toast Notifications

Use `sonner` via `toast`. Success auto-dismisses at 4s. Errors persist.

```tsx
// Success
toast.success("PRD approved", { duration: 4000 })

// Error — persists until dismissed
toast.error("Could not load review runs. Try again.")

// Async action with loading state
toast.promise(approveAction(), {
  loading: "Approving PRD…",
  success: "PRD approved",
  error: "Could not approve PRD. Try again.",
})
```

---

## 15. Audit Log Tab

Use `<Table>` from shadcn. Newest event first. Payload JSON expandable per row.

```tsx
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Event</TableHead>
      <TableHead>Actor</TableHead>
      <TableHead>Time</TableHead>
      <TableHead className="w-8" />
    </TableRow>
  </TableHeader>
  <TableBody>
    {events.map((event) => (
      <TableRow key={event.id}>
        <TableCell className="font-mono text-xs">{event.eventType}</TableCell>
        <TableCell>{event.actor === "ai" ? "ShipFlow AI" : event.actorName}</TableCell>
        <TableCell className="text-muted-foreground text-xs tabular-nums">
          <time dateTime={event.createdAt.toISOString()}>
            {new Intl.DateTimeFormat("en", { dateStyle: "short", timeStyle: "short" }).format(event.createdAt)}
          </time>
        </TableCell>
        <TableCell>
          <Collapsible>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="icon-xs" aria-label="Show payload">
                <ChevronDownIcon />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <pre className="font-mono text-xs">{JSON.stringify(event.payload, null, 2)}</pre>
            </CollapsibleContent>
          </Collapsible>
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

---

## 16. Approval Action Bar

Sticky bottom bar on the feature request page when status is `pending_human_approval`. Built from native HTML — no custom component needed.

```tsx
{featureRequest.status === "pending_human_approval" && (
  <div className="sticky bottom-0 border-t bg-background px-6 py-3">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-sm">
        {readiness.ready
          ? <><CheckCircleIcon className="size-4 text-success" aria-hidden /> <span>Ready to ship</span></>
          : <><AlertCircleIcon className="size-4 text-warning" aria-hidden /> <span>{readiness.blockingReasons[0]}</span></>
        }
      </div>
      <div className="flex gap-2">
        {/* Reject opens AlertDialog */}
        <RejectReleaseDialog featureRequestId={featureRequest.id} />
        <Button onClick={() => approveRelease()}>Approve →</Button>
      </div>
    </div>
  </div>
)}
```

---

## 17. Typography Rules

| Context | Class |
|---------|-------|
| Page title | `text-xl font-medium` |
| Section heading | `text-base font-medium` |
| Body text | `text-sm` |
| Muted metadata | `text-sm text-muted-foreground` |
| Timestamps, captions | `text-xs text-muted-foreground` |
| PR numbers, SHAs, file paths, line numbers | `font-mono text-sm` |
| Numeric columns | `tabular-nums` |
| Loading labels | Use `…` (ellipsis char), not `...` — e.g. `"Generating PRD…"` |

AI actor in timeline entries: always **"ShipFlow AI"**. Never "AI", "the model", or "Claude".

---

## 18. Accessibility Checklist

Apply before every PR. Non-negotiable.

- [ ] Icon-only buttons have `aria-label`
- [ ] Decorative icons have `aria-hidden="true"`
- [ ] All form inputs have a paired `<Label>`
- [ ] `<button>` for actions, `<a>` / `<Link>` for navigation — never `<div onClick>`
- [ ] Async state changes use `aria-live="polite"` (or Sonner which handles this)
- [ ] Modals trap focus and return it on close (shadcn Dialog/AlertDialog handles this)
- [ ] No `outline-none` without `focus-visible:ring-*` replacement
- [ ] Destructive actions require an `AlertDialog` — not an immediate action
- [ ] Status badges convey state with text, not color alone
- [ ] One `<h1>` per page

---

## 19. Copy Conventions

| Situation | Correct | Wrong |
|-----------|---------|-------|
| Primary button | "Submit feature request" | "Submit" |
| Destructive confirm | "Disconnect repository" | "Yes" / "Confirm" |
| Loading | "Generating PRD…" | "Loading..." |
| Empty state | "No tasks yet. Tasks are generated from the approved PRD." | "Nothing here" |
| Blocked action | "AI review credit limit reached. Upgrade to Pro to continue." | "Limit reached" |
| Error | "Could not load review runs. Try again." | "Error" |
| Approval confirm | "This will mark the feature as shipped." | "Are you sure?" |

---

## 20. Anti-Patterns — Never Do These

- `<div onClick>` — use `<button>` or `<Link>`
- Custom status pill built from scratch — use `<Badge>`
- Custom modal built from scratch — use `<Dialog>` or `<AlertDialog>`
- `transition: all` — animate `transform` and `opacity` only
- `outline-none` without focus ring replacement
- Hardcoded date strings — always use `Intl.DateTimeFormat`
- `...` in UI copy — use `…` (actual ellipsis character)
- Synthetic/mock PR or diff data anywhere — see PRD section 18
- Build a custom sidebar — use shadcn `<Sidebar>`
- Build a custom tabs component — use shadcn `<Tabs>`
