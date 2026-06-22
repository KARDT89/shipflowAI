"use client"

import { authClient } from "@shipflow/auth/client"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { cn } from "@workspace/ui/lib/utils"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, type FormEvent } from "react"

import { SocialAuthButtons } from "./social-auth-buttons"

export function LoginForm({
  className,
  callbackURL = "/dashboard",
  githubEnabled = false,
  googleEnabled = false,
  ...props
}: React.ComponentProps<"div"> & {
  callbackURL?: string
  githubEnabled?: boolean
  googleEnabled?: boolean
}) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setPending(true)

    const form = new FormData(event.currentTarget)
    const result = await authClient.signIn.email({
      email: String(form.get("email")),
      password: String(form.get("password")),
    })

    setPending(false)

    if (result.error) {
      setError(
        result.error.message ?? "Authentication failed. Please try again."
      )
      return
    }

    router.push(callbackURL)
    router.refresh()
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Welcome back</CardTitle>
          <CardDescription>
            Sign in to continue to your ShipFlow workspace.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  minLength={8}
                  required
                />
              </Field>
              {error ? (
                <p className="text-sm text-destructive" role="alert">
                  {error}
                </p>
              ) : null}
              <Field>
                <Button type="submit" disabled={pending}>
                  {pending ? "Signing in…" : "Sign in"}
                </Button>
                <FieldDescription className="text-center">
                  Don&apos;t have an account?{" "}
                  <Link href="/signup" className="underline underline-offset-4">
                    Create one
                  </Link>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
          <SocialAuthButtons
            callbackURL={callbackURL}
            githubEnabled={githubEnabled}
            googleEnabled={googleEnabled}
          />
        </CardContent>
      </Card>
      <FieldDescription className="px-6 text-center">
        By signing in, you agree to our{" "}
        <a href="#" className="underline underline-offset-4">
          Terms of Service
        </a>{" "}
        and{" "}
        <a href="#" className="underline underline-offset-4">
          Privacy Policy
        </a>
        .
      </FieldDescription>
    </div>
  )
}
