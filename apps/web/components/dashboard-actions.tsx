"use client"

import { authClient } from "@shipflow/auth/client"
import { useQueryClient } from "@tanstack/react-query"
import { Button } from "@workspace/ui/components/button"
import { Field, FieldGroup, FieldLabel } from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import {
  NativeSelect,
  NativeSelectOption,
} from "@workspace/ui/components/native-select"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { useRouter } from "next/navigation"
import { useState, type ChangeEvent, type FormEvent } from "react"

function toSlug(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export function OrganizationForm() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [name, setName] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    setError(null)

    const slug = toSlug(name)
    if (!slug) {
      setError("Organization name must contain at least one letter or number.")
      setPending(false)
      return
    }

    const result = await authClient.organization.create({
      name,
      slug,
      keepCurrentActiveOrganization: false,
    })

    if (result.error) {
      setPending(false)
      setError(result.error.message ?? "Could not create the organization.")
      return
    }

    if (result.data) {
      const activation = await authClient.organization.setActive({
        organizationId: result.data.id,
      })

      if (activation.error) {
        setPending(false)
        setError(
          activation.error.message ??
            "Organization created, but could not be activated."
        )
        return
      }
    }

    queryClient.clear()
    router.refresh()
  }

  const slug = toSlug(name)

  return (
    <form onSubmit={handleSubmit} className="max-w-md">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="organization-name">Organization name</FieldLabel>
          <Input
            id="organization-name"
            name="name"
            placeholder="Acme Engineering"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          {slug ? (
            <p className="text-xs text-muted-foreground">
              Slug: <span className="font-mono">{slug}</span>
            </p>
          ) : null}
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

export function OrganizationPanel() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const organizations = authClient.useListOrganizations()
  const activeOrganization = authClient.useActiveOrganization()
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function switchOrganization(event: ChangeEvent<HTMLSelectElement>) {
    setPending(true)
    setError(null)

    const result = await authClient.organization.setActive({
      organizationId: event.target.value,
    })

    setPending(false)
    if (result.error) {
      setError(result.error.message ?? "Could not switch organizations.")
      return
    }

    queryClient.clear()
    router.refresh()
  }

  if (organizations.isPending || activeOrganization.isPending) {
    return (
      <Skeleton
        className="h-8 w-full max-w-xs"
        aria-label="Loading organizations"
      />
    )
  }

  if (!organizations.data?.length) {
    return <OrganizationForm />
  }

  return (
    <div className="space-y-3">
      <FieldLabel htmlFor="active-organization">Active organization</FieldLabel>
      <NativeSelect
        id="active-organization"
        className="w-full max-w-xs"
        value={activeOrganization.data?.id ?? ""}
        onChange={switchOrganization}
        disabled={pending}
      >
        <NativeSelectOption value="" disabled>
          Select an organization
        </NativeSelectOption>
        {organizations.data.map((organization) => (
          <NativeSelectOption key={organization.id} value={organization.id}>
            {organization.name}
          </NativeSelectOption>
        ))}
      </NativeSelect>
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
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
