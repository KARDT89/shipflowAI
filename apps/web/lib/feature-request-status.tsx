import { Badge } from "@workspace/ui/components/badge"

export const STATUS_CONFIG: Record<
  string,
  { variant: "default" | "secondary" | "destructive" | "outline"; label: string }
> = {
  draft: { variant: "outline", label: "Draft" },
  clarifying: { variant: "secondary", label: "Clarifying" },
  prd_generated: { variant: "secondary", label: "PRD generated" },
  prd_approved: { variant: "secondary", label: "PRD approved" },
  tasks_generated: { variant: "secondary", label: "Tasks generated" },
  tasks_approved: { variant: "secondary", label: "Tasks approved" },
  in_development: { variant: "default", label: "In development" },
  ai_review_running: { variant: "default", label: "Review running…" },
  review_failed: { variant: "destructive", label: "Review failed" },
  fix_needed: { variant: "destructive", label: "Fix needed" },
  review_passed: { variant: "secondary", label: "Review passed" },
  pending_human_approval: { variant: "secondary", label: "Pending approval" },
  approved: { variant: "secondary", label: "Approved" },
  shipped: { variant: "default", label: "Shipped" },
  rejected: { variant: "destructive", label: "Rejected" },
}

export function FeatureRequestStatusBadge({ status }: { status: string }) {
  const { variant, label } = STATUS_CONFIG[status] ?? {
    variant: "outline" as const,
    label: status,
  }
  return <Badge variant={variant}>{label}</Badge>
}
