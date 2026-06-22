import "dotenv/config"

import { defineConfig } from "drizzle-kit"
import { z } from "zod"

const env = z
  .object({
    DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  })
  .parse(process.env)

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/schema/index.ts",
  out: "./drizzle",
  dbCredentials: {
    url: env.DATABASE_URL,
  },
  strict: true,
  verbose: true,
})
