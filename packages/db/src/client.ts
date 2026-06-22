import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import { z } from "zod"

import * as schema from "./schema/index"

const databaseEnv = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
})

function createClient() {
  const { DATABASE_URL } = databaseEnv.parse(process.env)

  return postgres(DATABASE_URL, {
    max: process.env.NODE_ENV === "production" ? 10 : 1,
    prepare: false,
  })
}

const globalForDatabase = globalThis as unknown as {
  shipflowPostgres?: ReturnType<typeof createClient>
}

export const sql = globalForDatabase.shipflowPostgres ?? createClient()

if (process.env.NODE_ENV !== "production") {
  globalForDatabase.shipflowPostgres = sql
}

export const db = drizzle(sql, { schema })
