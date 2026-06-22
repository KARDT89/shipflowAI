import { and, eq } from "drizzle-orm"

import { db } from "../client"
import { member } from "../schema/auth"

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
