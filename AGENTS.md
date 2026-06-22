# ShipFlow AI Project Plan

## Architecture

- Use a pnpm/Turborepo monorepo with `apps/web` as the only deployable application.
- Use Next.js 16 App Router for UI and backend Route Handlers. Node.js 20.9+ is required. [Next.js 16 requirements](https://nextjs.org/docs/app/getting-started/installation)
- Mount tRPC at `/api/trpc`, Better Auth at `/api/auth/*`, and GitHub, Polar, and Inngest handlers under `/api/*`.
- Do not add Express initially. It duplicates Next.js backend capabilities and complicates Vercel deployment.
- Keep business logic in workspace packages so an Express/Railway backend can be extracted later without rewriting routers or workflows.
- Use generic PostgreSQL through a pooled `DATABASE_URL`; run migrations outside the Vercel request runtime.

## Workspace Packages

- `apps/web`: Next.js application, pages, Route Handlers, providers, and layouts.
- `packages/api`: tRPC routers, context, tenant middleware, authorization, and Zod inputs.
- `packages/db`: Drizzle schema, PostgreSQL client, queries, and migrations.
- `packages/auth`: Better Auth configuration and organization plugin.
- `packages/ui`: shared Shadcn components and Tailwind styles.
- `packages/github`: GitHub App installation clients, webhook validation, and PR diff access.
- `packages/ai`: prompts, structured output schemas, model configuration, and AI calls.
- `packages/inngest`: event definitions and durable workflow functions.
- `packages/billing`: Polar client, plans, limits, and credit ledger.
- `packages/config`: shared TypeScript and ESLint configuration.

## Dependencies

**Foundation**

- `next@16`, `react`, `react-dom`: web application and server runtime.
- `turbo`, `typescript`, `pnpm`: monorepo build and package management.
- `eslint`, `eslint-config-next`, `prettier`, `prettier-plugin-tailwindcss`: explicit linting and formatting; Next.js 16 no longer lints during builds.
- `zod`: validation shared by tRPC, environment configuration, and AI outputs.

**API and client state**

- `@trpc/server`, `@trpc/client`: end-to-end typed API.
- `@trpc/tanstack-react-query`, `@tanstack/react-query`: recommended tRPC v11 client integration, caching, mutations, and invalidation. [tRPC setup](https://trpc.io/docs/client/tanstack-react-query/setup)
- `superjson`: preserve dates and other non-JSON-native values across tRPC.

**Database and authentication**

- `drizzle-orm`, `postgres`: PostgreSQL access.
- `drizzle-kit`: development dependency for migration generation and execution.
- `better-auth`: email/password authentication, GitHub OAuth, sessions, and organization membership.
- Use Better Auth’s built-in Drizzle adapter and organization plugin; no separate auth service is needed. [Better Auth installation](https://better-auth.com/docs/installation)

**UI**

- `tailwindcss`, `@tailwindcss/postcss`: Tailwind CSS v4.
- Shadcn CLI-managed dependencies: `radix-ui`, `class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react`, and `tw-animate-css`.
- `sonner`: notifications.
- `react-hook-form`, `@hookform/resolvers`: validated forms.
- `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`: task ordering and Kanban interactions.
- Configure Shadcn’s monorepo support so generated primitives live in `packages/ui`. [Shadcn monorepo guide](https://ui.shadcn.com/docs/monorepo)

**Product integrations**

- `@octokit/app`, `@octokit/webhooks`: GitHub App installation clients, API access, and signature-verified webhooks.
- `inngest`: asynchronous clarification, generation, review, and release workflows. Its Next.js adapter exposes `/api/inngest`. [Inngest handler](https://www.inngest.com/docs/reference/serve)
- `ai`, `@openrouter/ai-sdk-provider`: provider-neutral AI calls through the existing OpenRouter key.
- Use AI SDK v6 `generateText` with `Output.object({ schema })`; this replaces the PRD’s older `generateObject` API while retaining Zod-validated structured output. [AI SDK structured output](https://ai-sdk.dev/docs/ai-sdk-core/generating-structured-data)
- Default `AI_MODEL` to `openai/gpt-4.1-nano` for inexpensive testing, while allowing any OpenRouter model without code changes. [OpenRouter provider](https://ai-sdk.dev/providers/community-providers/openrouter)
- `@polar-sh/sdk`: checkout, subscription API, and verified billing webhooks. [Polar SDK](https://docs.polar.sh/documentation/sdks/typescript-sdk)

**Testing**

- `vitest`, `@vitest/coverage-v8`: unit and integration tests.
- `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`, `jsdom`: UI tests.
- `msw`: test-only API and webhook fixtures; production will have no synthetic PR path.
- `@playwright/test`: authentication and lifecycle browser tests.

## Build Order

1. Scaffold the monorepo, Next.js 16, shared configuration, Shadcn UI package, linting, tests, and environment validation.
2. Build Drizzle schemas and migrations, then Better Auth with email/password, GitHub OAuth, organizations, active organization sessions, and protected dashboard access.
3. Add tRPC context derived from the Better Auth session, tenant-protected procedures, React Query hydration, and an authenticated health procedure.
4. Implement projects, repositories, feature requests, PRDs, tasks, and lifecycle audit events.
5. Add the real GitHub App installation and webhook flow before any AI review logic.
6. Add Inngest workflows, then OpenRouter-backed structured AI workflows one at a time.
7. Build feature-request lifecycle screens, task board, review history, and approval flow.
8. Add Polar plans and credit enforcement after the review workflow functions correctly.
9. Verify builds and deploy `apps/web` to Vercel; move only Inngest execution to Railway if Vercel duration limits become a demonstrated blocker.

## Acceptance and Assumptions

- First milestone: sign up, sign in, create/select an organization, and open a protected dashboard backed by PostgreSQL and tRPC.
- Unit tests cover schemas, tenant enforcement, state transitions, credit enforcement, and AI output parsing.
- Integration tests cover signed webhooks, event persistence, Inngest emission, and blocking review behavior.
- Playwright covers the primary request-to-approval workflow.
- Package versions will be pinned through `pnpm-lock.yaml`, with Next.js fixed to major version 16 and mutually compatible current releases selected during scaffolding.
- Email/password is the sandbox fallback; no production email package is installed initially.
- The filesystem currently contains only the PRD, despite additional files shown in the IDE tabs.
