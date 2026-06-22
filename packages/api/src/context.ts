import { auth, type Session } from "@shipflow/auth"
import { db, findMembership, member } from "@shipflow/db"

export type Database = typeof db
export type Membership = typeof member.$inferSelect

export type TRPCContext = {
  db: Database
  headers: Headers
  session: Session | null
  activeOrganizationId: string | null
  membership: Membership | null
}

type CreateContextFromSessionOptions = {
  session: Session | null
  database?: Database
  membership?: Membership | null
  headers?: Headers
}

export function createContextFromSession({
  session,
  database = db,
  membership = null,
  headers = new Headers(),
}: CreateContextFromSessionOptions): TRPCContext {
  return {
    db: database,
    headers,
    session,
    activeOrganizationId: session?.session.activeOrganizationId ?? null,
    membership,
  }
}

export async function createTRPCContext({
  headers,
}: {
  headers: Headers
}): Promise<TRPCContext> {
  const session = await auth.api.getSession({ headers })
  const activeOrganizationId = session?.session.activeOrganizationId

  const membership =
    session && activeOrganizationId
      ? await findMembership({
          userId: session.user.id,
          organizationId: activeOrganizationId,
        })
      : null

  return createContextFromSession({ session, membership, headers })
}
