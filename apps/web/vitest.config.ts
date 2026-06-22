import { fileURLToPath } from "node:url"

import react from "@vitejs/plugin-react"
import { defineConfig } from "vitest/config"

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL(".", import.meta.url)),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    env: {
      BETTER_AUTH_SECRET: "test-secret-at-least-32-characters-long",
      BETTER_AUTH_URL: "http://localhost:3000",
      DATABASE_URL:
        "postgresql://postgres:postgres@localhost:5432/shipflow_test",
      NEXT_PUBLIC_APP_URL: "http://localhost:3000",
    },
  },
})
