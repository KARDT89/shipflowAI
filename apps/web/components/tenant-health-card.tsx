"use client"

import { useQuery } from "@tanstack/react-query"
import { Badge } from "@workspace/ui/components/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

import { useTRPC } from "@/trpc/client"

export function TenantHealthCard() {
  const trpc = useTRPC()
  const health = useQuery(trpc.health.authenticated.queryOptions())

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <CardTitle>Tenant API</CardTitle>
          <Badge variant={health.isError ? "destructive" : "default"}>
            {health.isError
              ? "Unavailable"
              : health.data
                ? "Connected"
                : "Loading"}
          </Badge>
        </div>
        <CardDescription>
          Authenticated tRPC access for the active organization.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {health.data ? (
          <dl className="grid gap-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Organization</dt>
              <dd className="font-mono">{health.data.organization.id}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Role</dt>
              <dd className="capitalize">{health.data.organization.role}</dd>
            </div>
          </dl>
        ) : health.isError ? (
          <p className="text-sm text-destructive">{health.error.message}</p>
        ) : (
          <p className="text-sm text-muted-foreground">
            Checking tenant access...
          </p>
        )}
      </CardContent>
    </Card>
  )
}
