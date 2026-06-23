import type { InferInsertModel } from "drizzle-orm"

import { db } from "../client"
import { lifecycleEvents } from "../schema/domain"

export async function createLifecycleEvent(
  data: InferInsertModel<typeof lifecycleEvents>
) {
  const [row] = await db.insert(lifecycleEvents).values(data).returning()
  return row!
}
