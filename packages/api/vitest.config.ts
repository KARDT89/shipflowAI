import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    environment: "node",
    env: {
      BETTER_AUTH_SECRET: "test-secret-at-least-32-characters-long",
      BETTER_AUTH_URL: "http://localhost:3000",
      DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/shipflow_test",
      NEXT_PUBLIC_APP_URL: "http://localhost:3000",
    },
  },
})
