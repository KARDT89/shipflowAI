"use client"

import { useMutation } from "@tanstack/react-query"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { Spinner } from "@workspace/ui/components/spinner"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"
import { toast } from "sonner"

import { useTRPCClient } from "@/trpc/client"

type Repository = {
  id: string
  fullName: string
}

function RepoIcon() {
  return (
    <i className="ri-git-repository-line text-muted-foreground" aria-hidden />
  )
}

export function GitHubInstallCallbackClient({
  installationId,
  repositories,
  projects,
}: {
  installationId: string
  repositories: Repository[]
  projects: Array<{ id: string; name: string }>
}) {
  const router = useRouter()
  const trpcClient = useTRPCClient()
  const [search, setSearch] = useState("")
  const [assignments, setAssignments] = useState<Record<string, string>>(
    Object.fromEntries(
      repositories.map((repository) => [repository.id, "skip"])
    )
  )
  const [linkedIds, setLinkedIds] = useState<string[]>([])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return repositories
    return repositories.filter((r) => r.fullName.toLowerCase().includes(q))
  }, [repositories, search])

  const assignedCount = repositories.filter(
    (r) => !linkedIds.includes(r.id) && assignments[r.id] !== "skip"
  ).length

  const mutation = useMutation({
    mutationFn: async () => {
      const selected = repositories.filter(
        (repository) =>
          !linkedIds.includes(repository.id) &&
          assignments[repository.id] !== "skip"
      )
      const results = await Promise.allSettled(
        selected.map((repository) =>
          trpcClient.repositories.link.mutate({
            projectId: assignments[repository.id]!,
            installationId,
            githubRepositoryId: repository.id,
          })
        )
      )
      return {
        failed: results.filter((result) => result.status === "rejected").length,
        linked: selected
          .filter((_, index) => results[index]?.status === "fulfilled")
          .map((repository) => repository.id),
      }
    },
    onSuccess: ({ failed, linked }) => {
      setLinkedIds((current) => [...new Set([...current, ...linked])])
      if (failed > 0) {
        toast.error(
          `${failed} repositories could not be linked. Try them again.`
        )
        return
      }
      const count = linked.length
      toast.success(
        count === 1 ? "Repository linked" : `${count} repositories linked`
      )
      router.push("/dashboard")
      router.refresh()
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message ?? "Could not link the selected repositories.")
    },
  })

  if (repositories.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-12 text-center">
        <i className="ri-git-repository-line text-3xl text-muted-foreground" aria-hidden />
        <div>
          <p className="text-sm font-medium">No repositories found</p>
          <p className="text-sm text-muted-foreground">
            This installation has no repositories accessible to your GitHub App.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="grid gap-4">
      {/* Search + summary bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-xs">
          <i
            className="ri-search-line pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            className="pl-9"
            placeholder="Search repositories…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <p className="shrink-0 text-sm text-muted-foreground">
          {repositories.length} {repositories.length === 1 ? "repository" : "repositories"}
          {linkedIds.length > 0 && (
            <span className="ml-2 text-foreground">
              · {linkedIds.length} linked
            </span>
          )}
          {assignedCount > 0 && (
            <span className="ml-2 text-foreground">
              · {assignedCount} pending
            </span>
          )}
        </p>
      </div>

      {/* Repo list */}
      <div className="grid gap-2">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed py-10 text-center">
            <i className="ri-search-line text-2xl text-muted-foreground" aria-hidden />
            <p className="text-sm text-muted-foreground">
              No repositories match &ldquo;{search}&rdquo;
            </p>
          </div>
        ) : (
          filtered.map((repository) => {
            const [owner, name] = repository.fullName.split("/")
            const isLinked = linkedIds.includes(repository.id)
            const isAssigned =
              !isLinked && assignments[repository.id] !== "skip"

            return (
              <div
                key={repository.id}
                className={`grid gap-3 rounded-xl border p-4 transition-colors sm:grid-cols-[1fr_240px] sm:items-center ${isLinked ? "bg-muted/40" : isAssigned ? "border-primary/40 bg-primary/5" : ""}`}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <RepoIcon />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm">
                      <span className="text-muted-foreground">{owner}/</span>
                      <span className="font-semibold">{name}</span>
                    </p>
                  </div>
                </div>

                {isLinked ? (
                  <div className="flex items-center gap-1.5 sm:justify-end">
                    <i className="ri-checkbox-circle-fill text-sm text-green-500" aria-hidden />
                    <Badge variant="secondary" className="text-green-600">
                      Linked
                    </Badge>
                  </div>
                ) : (
                  <Select
                    value={assignments[repository.id]}
                    disabled={mutation.isPending}
                    onValueChange={(value) =>
                      setAssignments((current) => ({
                        ...current,
                        [repository.id]: value,
                      }))
                    }
                  >
                    <SelectTrigger
                      aria-label={`Project for ${repository.fullName}`}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="skip">
                        <span className="text-muted-foreground">Skip for now</span>
                      </SelectItem>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 border-t pt-4">
        <Button
          variant="ghost"
          onClick={() => router.push("/dashboard")}
          disabled={mutation.isPending}
        >
          Skip for now
        </Button>
        <Button
          disabled={mutation.isPending || assignedCount === 0}
          onClick={() => mutation.mutate()}
        >
          {mutation.isPending ? (
            <Spinner className="size-4" aria-hidden />
          ) : (
            <i className="ri-links-line" aria-hidden />
          )}
          Link {assignedCount > 0 ? assignedCount : ""}{" "}
          {assignedCount === 1 ? "repository" : "repositories"}
        </Button>
      </div>
    </div>
  )
}
