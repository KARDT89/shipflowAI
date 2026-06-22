import { and, eq } from "drizzle-orm"

import { db } from "../client"
import { account, member } from "../schema/auth"

export async function findMembership({
  userId,
  organizationId,
}: {
  userId: string
  organizationId: string
}) {
  return db.query.member.findFirst({
    where: and(
      eq(member.userId, userId),
      eq(member.organizationId, organizationId)
    ),
  })
}

export async function clearGithubAccountTokens(accountId: string) {
  return db
    .update(account)
    .set({
      accessToken: null,
      refreshToken: null,
      accessTokenExpiresAt: null,
      refreshTokenExpiresAt: null,
      updatedAt: new Date(),
    })
    .where(
      and(eq(account.providerId, "github"), eq(account.accountId, accountId))
    )
    .returning({ id: account.id })
}
