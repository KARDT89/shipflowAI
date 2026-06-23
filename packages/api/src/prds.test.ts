import type { Session } from "@shipflow/auth"
import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  approveLatestPrdForFeatureRequest: vi.fn(),
  createLifecycleEvent: vi.fn(),
  getPrdForFeatureRequest: vi.fn(),
  inngestSend: vi.fn(),
  updateFeatureRequestStatus: vi.fn(),
}))

vi.mock("@shipflow/db", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@shipflow/db")>()),
  approveLatestPrdForFeatureRequest: mocks.approveLatestPrdForFeatureRequest,
  createLifecycleEvent: mocks.createLifecycleEvent,
  getPrdForFeatureRequest: mocks.getPrdForFeatureRequest,
  updateFeatureRequestStatus: mocks.updateFeatureRequestStatus,
}))

vi.mock("@shipflow/inngest", () => ({
  inngest: {
    send: mocks.inngestSend,
  },
}))

import { createContextFromSession } from "./context"
import { createCaller } from "./router"

const featureRequestId = "11111111-1111-4111-8111-111111111111"
const prdId = "22222222-2222-4222-8222-222222222222"

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

function caller() {
  return createCaller(
    createContextFromSession({
      session,
      membership: {
        id: "member-1",
        organizationId: "org-1",
        userId: "user-1",
        role: "owner",
        createdAt: new Date(),
      },
    })
  )
}

describe("PRD approval", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getPrdForFeatureRequest.mockResolvedValue({
      id: prdId,
      featureRequestId,
      status: "draft",
      version: 1,
    })
    mocks.approveLatestPrdForFeatureRequest.mockResolvedValue({
      id: prdId,
      featureRequestId,
      status: "approved",
      version: 1,
    })
    mocks.updateFeatureRequestStatus.mockResolvedValue({
      id: featureRequestId,
      status: "prd_approved",
    })
    mocks.createLifecycleEvent.mockResolvedValue({ id: "event-1" })
    mocks.inngestSend.mockResolvedValue({ ids: ["event-1"] })
  })

  it("approves a draft PRD and emits task generation", async () => {
    await expect(
      caller().prds.approve({ featureRequestId })
    ).resolves.toMatchObject({
      id: prdId,
      status: "approved",
    })

    expect(mocks.approveLatestPrdForFeatureRequest).toHaveBeenCalledWith(
      featureRequestId,
      "org-1"
    )
    expect(mocks.updateFeatureRequestStatus).toHaveBeenCalledWith(
      featureRequestId,
      "prd_approved"
    )
    expect(mocks.createLifecycleEvent).toHaveBeenCalledWith({
      featureRequestId,
      actorType: "user",
      actorId: "user-1",
      event: "prd_approved",
      fromStatus: "prd_generated",
      toStatus: "prd_approved",
      payload: {
        prdId,
        version: 1,
      },
    })
    expect(mocks.inngestSend).toHaveBeenCalledWith({
      name: "prd.approved",
      data: {
        featureRequestId,
        organizationId: "org-1",
        prdId,
      },
    })
  })

  it("rejects a missing PRD", async () => {
    mocks.getPrdForFeatureRequest.mockResolvedValue(null)

    await expect(caller().prds.approve({ featureRequestId })).rejects.toMatchObject(
      { code: "NOT_FOUND" }
    )

    expect(mocks.approveLatestPrdForFeatureRequest).not.toHaveBeenCalled()
    expect(mocks.inngestSend).not.toHaveBeenCalled()
  })

  it("rejects a non-draft PRD", async () => {
    mocks.getPrdForFeatureRequest.mockResolvedValue({
      id: prdId,
      featureRequestId,
      status: "approved",
      version: 1,
    })

    await expect(caller().prds.approve({ featureRequestId })).rejects.toMatchObject(
      { code: "BAD_REQUEST" }
    )

    expect(mocks.approveLatestPrdForFeatureRequest).not.toHaveBeenCalled()
    expect(mocks.inngestSend).not.toHaveBeenCalled()
  })
})
