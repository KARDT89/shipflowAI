import { drizzleAdapter } from "@better-auth/drizzle-adapter"
import { db } from "@shipflow/db"
import { betterAuth } from "better-auth"
import { organization } from "better-auth/plugins"

const githubClientId = process.env.GITHUB_APP_CLIENT_ID
const githubClientSecret = process.env.GITHUB_APP_CLIENT_SECRET

export const auth = betterAuth({
  appName: "ShipFlow AI",
  baseURL: process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders:
    githubClientId && githubClientSecret
      ? {
          github: {
            clientId: githubClientId,
            clientSecret: githubClientSecret,
          },
        }
      : undefined,
  plugins: [
    organization({
      schema: {
        organization: {
          additionalFields: {
            polarCustomerId: {
              type: "string",
              required: false,
              input: false,
            },
            plan: {
              type: "string",
              required: true,
              defaultValue: "free",
              input: false,
            },
          },
        },
      },
    }),
  ],
})

export type Session = typeof auth.$Infer.Session
