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

export function SignupForm({
  className,
  githubEnabled = false,
  googleEnabled = false,
  ...props
}: React.ComponentProps<"div"> & {
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
    const password = String(form.get("password"))
    const confirmPassword = String(form.get("confirm-password"))

    if (password !== confirmPassword) {
      setError("Passwords do not match.")
      setPending(false)
      return
    }

    const result = await authClient.signUp.email({
      name: String(form.get("name")),
      email: String(form.get("email")),
      password,
    })

    setPending(false)

    if (result.error) {
      setError(
        result.error.message ?? "Could not create account. Please try again."
      )
      return
    }

    router.push("/dashboard")
    router.refresh()
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Create your account</CardTitle>
          <CardDescription>
            Start a workspace and take your first feature from request to
            release.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="name">Full name</FieldLabel>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Ada Lovelace"
                  autoComplete="name"
                  required
                />
              </Field>
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
                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="password">Password</FieldLabel>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="new-password"
                      minLength={8}
                      required
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="confirm-password">
                      Confirm password
                    </FieldLabel>
                    <Input
                      id="confirm-password"
                      name="confirm-password"
                      type="password"
                      autoComplete="new-password"
                      minLength={8}
                      required
                    />
                  </Field>
                </div>
                <FieldDescription>
                  Must be at least 8 characters.
                </FieldDescription>
              </Field>
              {error ? (
                <p className="text-sm text-destructive" role="alert">
                  {error}
                </p>
              ) : null}
              <Field>
                <Button type="submit" disabled={pending}>
                  {pending ? "Creating account…" : "Create account"}
                </Button>
                <FieldDescription className="text-center">
                  Already have an account?{" "}
                  <Link href="/login" className="underline underline-offset-4">
                    Sign in
                  </Link>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
          <SocialAuthButtons
            callbackURL="/dashboard"
            githubEnabled={githubEnabled}
            googleEnabled={googleEnabled}
          />
        </CardContent>
      </Card>
      <FieldDescription className="px-6 text-center">
        By creating an account, you agree to our{" "}
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
