import type { Session } from "@shipflow/auth"
import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  getFeatureRequestForOrg: vi.fn(),
  inngestSend: vi.fn(),
  listClarificationThreadsByFeatureRequestId: vi.fn(),
  updateClarificationAnswers: vi.fn(),
}))

vi.mock("@shipflow/db", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@shipflow/db")>()),
  getFeatureRequestForOrg: mocks.getFeatureRequestForOrg,
  listClarificationThreadsByFeatureRequestId:
    mocks.listClarificationThreadsByFeatureRequestId,
  updateClarificationAnswers: mocks.updateClarificationAnswers,
}))

vi.mock("@shipflow/inngest", () => ({
  inngest: {
    send: mocks.inngestSend,
  },
}))

import { createContextFromSession } from "./context"
import { createCaller } from "./router"

const featureRequestId = "11111111-1111-4111-8111-111111111111"
const clarificationThreadId = "22222222-2222-4222-8222-222222222222"

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

describe("feature request clarifications", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getFeatureRequestForOrg.mockResolvedValue({
      id: featureRequestId,
      status: "clarifying",
    })
    mocks.listClarificationThreadsByFeatureRequestId.mockResolvedValue([
      {
        id: clarificationThreadId,
        question: "Who is this for?",
        answer: null,
      },
    ])
    mocks.updateClarificationAnswers.mockResolvedValue([
      {
        id: clarificationThreadId,
        answer: "Workspace admins",
      },
    ])
    mocks.inngestSend.mockResolvedValue({ ids: ["event-1"] })
  })

  it("saves all unanswered clarification answers and emits PRD generation", async () => {
    await expect(
      caller().featureRequests.answerClarification({
        featureRequestId,
        answers: [
          {
            clarificationThreadId,
            answer: " Workspace admins ",
          },
        ],
      })
    ).resolves.toEqual({ submitted: 1 })

    expect(mocks.updateClarificationAnswers).toHaveBeenCalledWith({
      featureRequestId,
      answers: [
        {
          id: clarificationThreadId,
          answer: "Workspace admins",
        },
      ],
    })
    expect(mocks.inngestSend).toHaveBeenCalledWith({
      name: "clarification.answered",
      data: {
        featureRequestId,
        organizationId: "org-1",
      },
    })
  })

  it("requires an answer for every unanswered clarification", async () => {
    await expect(
      caller().featureRequests.answerClarification({
        featureRequestId,
        answers: [
          {
            clarificationThreadId: "33333333-3333-4333-8333-333333333333",
            answer: "Nope",
          },
        ],
      })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" })

    expect(mocks.updateClarificationAnswers).not.toHaveBeenCalled()
    expect(mocks.inngestSend).not.toHaveBeenCalled()
  })
})
