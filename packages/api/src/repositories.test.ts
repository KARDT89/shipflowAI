import type { Session } from "@shipflow/auth"
import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  createRepository: vi.fn(),
  findGithubInstallation: vi.fn(),
  getAccessToken: vi.fn(),
  getInstallationRepo: vi.fn(),
  listProjectsByOrg: vi.fn(),
}))

vi.mock("@shipflow/auth", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@shipflow/auth")>()),
  auth: { api: { getAccessToken: mocks.getAccessToken } },
}))

vi.mock("@shipflow/db", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@shipflow/db")>()),
  createRepository: mocks.createRepository,
  findGithubInstallation: mocks.findGithubInstallation,
  listProjectsByOrg: mocks.listProjectsByOrg,
}))

vi.mock("@shipflow/github", () => ({
  getInstallationRepo: mocks.getInstallationRepo,
}))

import { createContextFromSession } from "./context"
import { createCaller } from "./router"

const projectId = "4aaf9f12-a916-4b49-b67c-257bc875fdb9"

const session = {
  user: {
    id: "user-1",
    email: "owner@example.com",
    emailVerified: true,
    name: "Owner",
    image: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  session: {
    id: "session-1",
    token: "token",
    userId: "user-1",
    expiresAt: new Date(Date.now() + 60_000),
    createdAt: new Date(),
    updatedAt: new Date(),
    ipAddress: null,
    userAgent: null,
    activeOrganizationId: "org-1",
  },
} satisfies Session

function caller(role = "owner") {
  return createCaller(
    createContextFromSession({
      session,
      headers: new Headers({ cookie: "session=valid" }),
      membership: {
        id: "member-1",
        organizationId: "org-1",
        userId: "user-1",
        role,
        createdAt: new Date(),
      },
    })
  )
}

describe("secure repository linking", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.listProjectsByOrg.mockResolvedValue([{ id: projectId }])
    mocks.findGithubInstallation.mockResolvedValue({
      installationId: "123",
      organizationId: "org-1",
    })
    mocks.getAccessToken.mockResolvedValue({ accessToken: "secret-user-token" })
    mocks.getInstallationRepo.mockResolvedValue({
      id: "456",
      owner: "trusted-owner",
      name: "trusted-repo",
      defaultBranch: "trunk",
    })
    mocks.createRepository.mockResolvedValue({ id: "repository-1" })
  })

  it("rejects organization members", async () => {
    await expect(
      caller("member").repositories.link({
        projectId,
        installationId: "123",
        githubRepositoryId: "456",
      })
    ).rejects.toMatchObject({ code: "FORBIDDEN" })
    expect(mocks.getAccessToken).not.toHaveBeenCalled()
  })

  it("rejects an installation owned by another organization", async () => {
    mocks.findGithubInstallation.mockResolvedValue({
      installationId: "123",
      organizationId: "org-2",
    })

    await expect(
      caller().repositories.link({
        projectId,
        installationId: "123",
        githubRepositoryId: "456",
      })
    ).rejects.toMatchObject({ code: "FORBIDDEN" })
  })

  it("requires repository access through the installation", async () => {
    mocks.getInstallationRepo.mockResolvedValue(null)

    await expect(
      caller().repositories.link({
        projectId,
        installationId: "123",
        githubRepositoryId: "456",
      })
    ).rejects.toMatchObject({ code: "FORBIDDEN" })
  })

  it("persists only metadata returned by GitHub", async () => {
    await caller().repositories.link({
      projectId,
      installationId: "123",
      githubRepositoryId: "456",
      owner: "forged-owner",
      name: "forged-name",
    } as never)

    expect(mocks.createRepository).toHaveBeenCalledWith({
      projectId,
      githubInstallationId: "123",
      githubRepositoryId: "456",
      owner: "trusted-owner",
      name: "trusted-repo",
      defaultBranch: "trunk",
    })
  })
})
