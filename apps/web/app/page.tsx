import { Button } from "@workspace/ui/components/button"
import Link from "next/link"

export default function Page() {
  return (
    <main className="mx-auto flex min-h-svh max-w-6xl flex-col justify-center px-6 py-20">
      <p className="mb-5 text-sm font-medium text-muted-foreground">
        ShipFlow AI
      </p>
      <h1 className="max-w-4xl text-5xl font-semibold tracking-tight text-balance md:text-7xl">
        Carry product intent all the way to release.
      </h1>
      <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
        Clarify feature requests, generate actionable plans, review real GitHub
        pull requests, and keep humans in control of the final ship decision.
      </p>
      <div className="mt-10 flex gap-3">
        <Button asChild size="lg">
          <Link href="/signup">Create an account</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/login">Sign in</Link>
        </Button>
      </div>
    </main>
  )
}
