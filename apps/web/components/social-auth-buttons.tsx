"use client"

import { authClient } from "@shipflow/auth/client"
import { Button } from "@workspace/ui/components/button"
import { RiGithubFill, RiGoogleFill } from "@remixicon/react"
import { useState } from "react"

export function SocialAuthButtons({
  callbackURL,
  githubEnabled,
  googleEnabled,
}: {
  callbackURL: string
  githubEnabled: boolean
  googleEnabled: boolean
}) {
  const [pending, setPending] = useState<"github" | "google" | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function signIn(provider: "github" | "google") {
    setPending(provider)
    setError(null)
    const result = await authClient.signIn.social({
      provider,
      callbackURL,
    })
    if (result?.error) {
      setPending(null)
      setError(result.error.message ?? `Could not continue with ${provider}.`)
    }
  }

  if (!githubEnabled && !googleEnabled) return null

  return (
    <div className="grid gap-2">
      <div className="relative py-2 text-center text-xs text-muted-foreground">
        <span className="relative z-10 bg-card px-2">Or continue with</span>
        <span className="absolute inset-x-0 top-1/2 border-t" aria-hidden />
      </div>
      {githubEnabled ? (
        <Button
          type="button"
          variant="outline"
          disabled={pending !== null}
          onClick={() => signIn("github")}
        >
          <RiGithubFill className="size-4" aria-hidden />
          {pending === "github" ? "Connecting..." : "Continue with GitHub"}
        </Button>
      ) : null}
      {googleEnabled ? (
        <Button
          type="button"
          variant="outline"
          disabled={pending !== null}
          onClick={() => signIn("google")}
        >
          <RiGoogleFill className="size-4" aria-hidden />
          {pending === "google" ? "Connecting..." : "Continue with Google"}
        </Button>
      ) : null}
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
