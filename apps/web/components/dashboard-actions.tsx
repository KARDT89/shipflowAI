"use client"

import { authClient } from "@shipflow/auth/client"
import { Button } from "@workspace/ui/components/button"
import { Field, FieldGroup, FieldLabel } from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { useRouter } from "next/navigation"
import { useState, type FormEvent } from "react"

export function OrganizationForm() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    setError(null)

    const form = new FormData(event.currentTarget)
    const name = String(form.get("name"))
    const slug = String(form.get("slug"))
    const result = await authClient.organization.create({ name, slug })

    setPending(false)
    if (result.error) {
      setError(result.error.message ?? "Could not create the organization.")
      return
    }

    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="organization-name">Organization name</FieldLabel>
          <Input
            id="organization-name"
            name="name"
            placeholder="Acme Engineering"
            required
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="organization-slug">Slug</FieldLabel>
          <Input
            id="organization-slug"
            name="slug"
            placeholder="acme-engineering"
            pattern="[a-z0-9-]+"
            required
          />
        </Field>
        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
        <Button type="submit" disabled={pending}>
          {pending ? "Creating..." : "Create organization"}
        </Button>
      </FieldGroup>
    </form>
  )
}

export function SignOutButton() {
  const router = useRouter()

  async function signOut() {
    await authClient.signOut()
    router.push("/login")
    router.refresh()
  }

  return (
    <Button variant="outline" onClick={signOut}>
      Sign out
    </Button>
  )
}
