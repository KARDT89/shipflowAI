"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardAction,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@workspace/ui/components/empty"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { Separator } from "@workspace/ui/components/separator"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { Spinner } from "@workspace/ui/components/spinner"
import { Textarea } from "@workspace/ui/components/textarea"
import Link from "next/link"
import { useEffect, useState, type FormEvent } from "react"
import { toast } from "sonner"

import { FeatureRequestStatusBadge } from "@/lib/feature-request-status"
import { useTRPC, useTRPCClient } from "@/trpc/client"

function ListSkeleton() {
  return (
    <div className="grid gap-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-4 w-64" />
            <Skeleton className="h-5 w-20" />
          </CardHeader>
        </Card>
      ))}
    </div>
  )
}

function CreateProjectDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: (projectId: string) => void
}) {
  const trpc = useTRPC()
  const trpcClient = useTRPCClient()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (input: { workspaceName: string; projectName: string }) =>
      trpcClient.projects.createWithWorkspace.mutate(input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: trpc.projects.list.queryOptions().queryKey,
      })
      toast.success("Project created")
      onCreated(data.project.id)
      onOpenChange(false)
    },
    onError: (err: { message?: string }) => {
      toast.error(`Could not create project. ${err.message ?? "Try again."}`)
    },
  })

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    mutation.mutate({
      workspaceName: String(form.get("workspaceName")),
      projectName: String(form.get("projectName")),
    })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!mutation.isPending) {
          mutation.reset()
          onOpenChange(o)
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create your first project</DialogTitle>
          <DialogDescription>
            Projects track feature requests, PRDs, tasks, and code reviews.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-2">
            <div className="grid gap-1.5">
              <Label htmlFor="workspace-name">
                Workspace name <span aria-hidden>*</span>
              </Label>
              <Input
                id="workspace-name"
                name="workspaceName"
                placeholder="e.g. Engineering"
                required
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="project-name">
                Project name <span aria-hidden>*</span>
              </Label>
              <Input
                id="project-name"
                name="projectName"
                placeholder="e.g. Core Platform"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              type="button"
              disabled={mutation.isPending}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && (
                <Spinner className="mr-2 size-4" aria-hidden />
              )}
              Create project
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function LinkRepositoryDialog({
  open,
  onOpenChange,
  projects,
  defaultProjectId,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  projects: { id: string; name: string }[]
  defaultProjectId: string | null
}) {
  const trpc = useTRPC()
  const trpcClient = useTRPCClient()
  const queryClient = useQueryClient()
  const [projectId, setProjectId] = useState<string>(defaultProjectId ?? "")

  useEffect(() => {
    if (defaultProjectId && !projectId) setProjectId(defaultProjectId)
  }, [defaultProjectId, projectId])

  const mutation = useMutation({
    mutationFn: (input: {
      projectId: string
      installationId: string
      githubRepositoryId: string
      owner: string
      name: string
      defaultBranch: string
    }) => trpcClient.repositories.link.mutate(input),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({
        queryKey: trpc.repositories.listByProject.queryOptions({
          projectId: vars.projectId,
        }).queryKey,
      })
      toast.success("Repository linked")
      onOpenChange(false)
    },
    onError: (err: { message?: string }) => {
      toast.error(`Could not link repository. ${err.message ?? "Try again."}`)
    },
  })

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    mutation.mutate({
      projectId,
      installationId: String(form.get("installationId")),
      githubRepositoryId: String(form.get("githubRepositoryId")),
      owner: String(form.get("owner")),
      name: String(form.get("name")),
      defaultBranch: String(form.get("defaultBranch") || "main"),
    })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!mutation.isPending) {
          mutation.reset()
          onOpenChange(o)
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Link a GitHub repository</DialogTitle>
          <DialogDescription>
            Connect a GitHub repo to a project. The installation ID and
            repository ID can be found in any webhook delivery payload under{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">
              installation.id
            </code>{" "}
            and{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">
              repository.id
            </code>
            .
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-2">
            <div className="grid gap-1.5">
              <Label htmlFor="repo-project">Project</Label>
              <Select value={projectId} onValueChange={setProjectId} required>
                <SelectTrigger id="repo-project">
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="installation-id">
                  Installation ID <span aria-hidden>*</span>
                </Label>
                <Input
                  id="installation-id"
                  name="installationId"
                  placeholder="e.g. 12345678"
                  required
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="repo-id">
                  Repository ID <span aria-hidden>*</span>
                </Label>
                <Input
                  id="repo-id"
                  name="githubRepositoryId"
                  placeholder="e.g. 987654321"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="repo-owner">
                  Owner <span aria-hidden>*</span>
                </Label>
                <Input
                  id="repo-owner"
                  name="owner"
                  placeholder="e.g. acme-org"
                  required
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="repo-name">
                  Repository name <span aria-hidden>*</span>
                </Label>
                <Input
                  id="repo-name"
                  name="name"
                  placeholder="e.g. core-api"
                  required
                />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="default-branch">Default branch</Label>
              <Input
                id="default-branch"
                name="defaultBranch"
                placeholder="main"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              type="button"
              disabled={mutation.isPending}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending || !projectId}>
              {mutation.isPending && (
                <Spinner className="mr-2 size-4" aria-hidden />
              )}
              Link repository
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function SubmitFeatureRequestDialog({
  open,
  onOpenChange,
  projectId,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
}) {
  const trpc = useTRPC()
  const trpcClient = useTRPCClient()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (input: { projectId: string; rawInput: string }) =>
      trpcClient.featureRequests.create.mutate(input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: trpc.featureRequests.list.queryOptions({ projectId }).queryKey,
      })
      toast.success("Feature request submitted")
      onOpenChange(false)
    },
    onError: (err: { message?: string }) => {
      toast.error(
        `Could not submit feature request. ${err.message ?? "Try again."}`
      )
    },
  })

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    mutation.mutate({
      projectId,
      rawInput: String(form.get("rawInput")),
    })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!mutation.isPending) {
          mutation.reset()
          onOpenChange(o)
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Submit feature request</DialogTitle>
          <DialogDescription>
            Describe what you want to build. ShipFlow AI will generate a PRD
            and tasks.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-2">
            <div className="grid gap-1.5">
              <Label htmlFor="raw-input">
                What do you want to build? <span aria-hidden>*</span>
              </Label>
              <Textarea
                id="raw-input"
                name="rawInput"
                rows={5}
                placeholder="e.g. Add CSV export to the reports page so users can download their data offline…"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              type="button"
              disabled={mutation.isPending}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && (
                <Spinner className="mr-2 size-4" aria-hidden />
              )}
              Submit feature request
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function FeatureRequestsPanel() {
  const trpc = useTRPC()
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null
  )
  const [createProjectOpen, setCreateProjectOpen] = useState(false)
  const [createFROpen, setCreateFROpen] = useState(false)
  const [linkRepoOpen, setLinkRepoOpen] = useState(false)

  const projectsQuery = useQuery(trpc.projects.list.queryOptions())

  const featureRequestsQuery = useQuery({
    ...trpc.featureRequests.list.queryOptions({
      projectId: selectedProjectId ?? "",
    }),
    enabled: !!selectedProjectId,
  })

  useEffect(() => {
    if (!selectedProjectId && projectsQuery.data?.length) {
      setSelectedProjectId(projectsQuery.data[0]?.id ?? null)
    }
  }, [projectsQuery.data, selectedProjectId])

  const selectedProject = projectsQuery.data?.find(
    (p) => p.id === selectedProjectId
  )

  const projects = projectsQuery.data ?? []

  return (
    <section className="mt-12">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-medium">Feature requests</h2>
          <p className="text-sm text-muted-foreground">
            Track work from idea to shipped.
          </p>
        </div>
        {projects.length > 0 && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setLinkRepoOpen(true)}
            >
              Link repository
            </Button>
            <Button onClick={() => setCreateFROpen(true)}>
              Submit feature request
            </Button>
          </div>
        )}
      </div>
      <Separator className="my-4" />

      {projectsQuery.isPending ? (
        <ListSkeleton />
      ) : projects.length === 0 ? (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyTitle>No projects yet</EmptyTitle>
            <EmptyDescription>
              Create a project to start submitting feature requests.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button onClick={() => setCreateProjectOpen(true)}>
              Create your first project
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <>
          {projects.length > 1 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {projects.map((p) => (
                <Button
                  key={p.id}
                  variant={selectedProjectId === p.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedProjectId(p.id)}
                >
                  {p.name}
                </Button>
              ))}
            </div>
          )}

          {featureRequestsQuery.isPending ? (
            <ListSkeleton />
          ) : featureRequestsQuery.data?.length === 0 ? (
            <Empty className="border border-dashed">
              <EmptyHeader>
                <EmptyTitle>No feature requests yet</EmptyTitle>
                <EmptyDescription>
                  Feature requests track work from idea to shipped.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button onClick={() => setCreateFROpen(true)}>
                  Submit feature request
                </Button>
              </EmptyContent>
            </Empty>
          ) : (
            <div className="grid gap-3">
              {featureRequestsQuery.data?.map((fr) => (
                <Link
                  key={fr.id}
                  href={`/dashboard/feature-requests/${fr.id}`}
                  className="block"
                >
                  <Card className="transition-colors hover:bg-muted/50">
                    <CardHeader>
                      <CardTitle className="line-clamp-2 text-sm">
                        {fr.rawInput}
                      </CardTitle>
                      <CardAction>
                        <FeatureRequestStatusBadge status={fr.status} />
                      </CardAction>
                      <CardDescription>
                        {selectedProject?.name} ·{" "}
                        {new Intl.DateTimeFormat("en", {
                          dateStyle: "medium",
                        }).format(new Date(fr.createdAt))}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </>
      )}

      <CreateProjectDialog
        open={createProjectOpen}
        onOpenChange={setCreateProjectOpen}
        onCreated={(id) => setSelectedProjectId(id)}
      />

      {selectedProjectId && (
        <SubmitFeatureRequestDialog
          open={createFROpen}
          onOpenChange={setCreateFROpen}
          projectId={selectedProjectId}
        />
      )}

      <LinkRepositoryDialog
        open={linkRepoOpen}
        onOpenChange={setLinkRepoOpen}
        projects={projects}
        defaultProjectId={selectedProjectId}
      />
    </section>
  )
}
