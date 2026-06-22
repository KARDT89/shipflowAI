import type { Session } from "@shipflow/auth"
import type { Membership, TRPCContext } from "./context"
import { createContextFromSession } from "./context"
import { createCaller } from "./router"
import { describe, expect, it } from "vitest"

const session = {
  user: {
    id: "user-1",
    email: "owner@example.com",
    emailVerified: true,
    name: "Owner",
    image: null,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  },
  session: {
    id: "session-1",
    token: "token",
    userId: "user-1",
    expiresAt: new Date("2027-01-01T00:00:00.000Z"),
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    ipAddress: null,
    userAgent: null,
    activeOrganizationId: "org-1",
  },
} satisfies Session

const membership = {
  id: "member-1",
  organizationId: "org-1",
  userId: "user-1",
  role: "owner",
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
} satisfies Membership

function context(overrides: Partial<TRPCContext> = {}) {
  return {
    ...createContextFromSession({ session }),
    membership,
    ...overrides,
  }
}

describe("tenant authorization", () => {
  it("rejects anonymous callers", async () => {
    const caller = createCaller(createContextFromSession({ session: null }))

    await expect(caller.health.authenticated()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    })
  })

  it("requires an active organization", async () => {
    const caller = createCaller(
      context({
        activeOrganizationId: null,
        membership: null,
      })
    )

    await expect(caller.health.authenticated()).rejects.toMatchObject({
      code: "PRECONDITION_FAILED",
    })
  })

  it("rejects stale organization membership", async () => {
    const caller = createCaller(context({ membership: null }))

    await expect(caller.health.authenticated()).rejects.toMatchObject({
      code: "FORBIDDEN",
    })
  })

  it("returns identity derived from the verified context", async () => {
    const caller = createCaller(context())

    await expect(caller.health.authenticated()).resolves.toEqual({
      status: "ok",
      user: {
        id: "user-1",
        email: "owner@example.com",
      },
      organization: {
        id: "org-1",
        role: "owner",
      },
    })
  })
})
