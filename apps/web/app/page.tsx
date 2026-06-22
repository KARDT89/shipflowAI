import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Separator } from "@workspace/ui/components/separator"
import {
  RiArrowRightLine,
  RiCheckboxCircleLine,
  RiFileTextLine,
  RiGithubLine,
  RiMessageLine,
  RiShieldCheckLine,
  RiShipLine,
} from "@remixicon/react"
import Link from "next/link"

const lifecycleSteps = [
  { label: "Request", variant: "outline" as const },
  { label: "Clarify", variant: "outline" as const },
  { label: "PRD", variant: "secondary" as const },
  { label: "Tasks", variant: "secondary" as const },
  { label: "Code", variant: "secondary" as const },
  { label: "Review", variant: "default" as const },
  { label: "Ship", variant: "default" as const },
]

const features = [
  {
    icon: RiMessageLine,
    title: "AI clarification",
    description:
      "Vague feature requests are clarified before any plan is created. No more guessing what the product team actually wanted.",
  },
  {
    icon: RiFileTextLine,
    title: "Automated PRD",
    description:
      "Problem statement, goals, acceptance criteria, edge cases — generated from the clarified request and ready for human review.",
  },
  {
    icon: RiShieldCheckLine,
    title: "Code review that understands intent",
    description:
      "Every PR is reviewed against the PRD and task list, not just for syntax. Blocking issues must be resolved before shipping.",
  },
]

const benefits = [
  "Feature request → PRD in minutes",
  "No more vague specs reaching engineering",
  "AI reviews every PR against accepted criteria",
  "Human approval required before anything ships",
]

export default function Page() {
  return (
    <div className="flex min-h-svh flex-col">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <Link
            href="/"
            className="flex items-center gap-2 font-semibold tracking-tight"
          >
            <div className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <RiShipLine className="size-4" aria-hidden />
            </div>
            ShipFlow AI
          </Link>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/login">Sign in</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/signup">Get started</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="mx-auto max-w-6xl px-6 py-24 md:py-32">
          <Badge variant="outline" className="mb-6">
            AI-powered delivery lifecycle
          </Badge>
          <h1 className="max-w-4xl text-4xl font-semibold tracking-tight text-balance md:text-6xl">
            Carry product intent all the way to release.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            Clarify feature requests, generate actionable plans, review real
            GitHub pull requests, and keep humans in control of the final ship
            decision.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/signup">Get started free</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/login">Sign in</Link>
            </Button>
          </div>
        </section>

        <Separator />

        {/* Lifecycle pipeline */}
        <section className="mx-auto max-w-6xl px-6 py-16">
          <p className="mb-8 text-sm font-medium text-muted-foreground uppercase tracking-wider">
            The full lifecycle, automated
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {lifecycleSteps.map((step, i) => (
              <div key={step.label} className="flex items-center gap-2">
                <Badge variant={step.variant}>{step.label}</Badge>
                {i < lifecycleSteps.length - 1 && (
                  <RiArrowRightLine
                    className="size-3.5 shrink-0 text-muted-foreground"
                    aria-hidden
                  />
                )}
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Every transition is logged. Every decision is auditable.
          </p>
        </section>

        <Separator />

        {/* Feature cards */}
        <section className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="mb-12 text-2xl font-semibold tracking-tight">
            Built for the full handoff chain
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            {features.map((feature) => (
              <Card key={feature.title}>
                <CardHeader>
                  <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <feature.icon className="size-5" aria-hidden />
                  </div>
                  <CardTitle className="text-base">{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>

        <Separator />

        {/* GitHub integration callout */}
        <section className="mx-auto max-w-6xl px-6 py-16">
          <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
            <div className="max-w-lg">
              <h2 className="mb-3 text-2xl font-semibold tracking-tight">
                Real GitHub PRs. No synthetic data.
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Connect your GitHub App, open a pull request, and ShipFlow
                triggers a full AI review against the accepted PRD and task
                list — automatically, on every push.
              </p>
              <ul className="mt-6 space-y-2">
                {benefits.map((b) => (
                  <li key={b} className="flex items-start gap-2 text-sm">
                    <RiCheckboxCircleLine
                      className="mt-0.5 size-4 shrink-0 text-primary"
                      aria-hidden
                    />
                    {b}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex shrink-0 items-center justify-center rounded-xl border bg-muted/40 p-8">
              <RiGithubLine className="size-16 text-muted-foreground" aria-hidden />
            </div>
          </div>
        </section>

        <Separator />

        {/* Bottom CTA */}
        <section className="mx-auto max-w-6xl px-6 py-24 text-center">
          <h2 className="mb-4 text-3xl font-semibold tracking-tight">
            Start building today.
          </h2>
          <p className="mb-8 text-muted-foreground">
            Connect your first repository in minutes.
          </p>
          <Button asChild size="lg">
            <Link href="/signup">Create your account</Link>
          </Button>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <p className="text-sm text-muted-foreground">
            © 2025 ShipFlow AI · Built for engineers who ship.
          </p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <Link href="/login" className="hover:text-foreground transition-colors">
              Sign in
            </Link>
            <Link href="/signup" className="hover:text-foreground transition-colors">
              Get started
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
