# ShipFlow AI

ShipFlow AI carries feature requests through clarification, planning, implementation, AI review,
human approval, and release.

## Requirements

- Node.js 20.9 or newer
- pnpm 11
- PostgreSQL

## Local setup

```bash
pnpm install
cp .env.example .env
pnpm db:up
pnpm db:migrate
pnpm dev
```

The web application runs at `http://localhost:3000`. Email/password authentication works without
external providers. GitHub sign-in is enabled when both GitHub client environment variables exist.

The root `.env` is loaded before Turbo starts, so its values are inherited by the web app and all
workspace packages. Docker Compose uses the same file automatically for PostgreSQL configuration.

```bash
pnpm db:up    # start PostgreSQL and wait until it is healthy
pnpm db:logs  # follow PostgreSQL logs
pnpm db:down  # stop PostgreSQL without deleting its data volume
```

## Database and authentication

Drizzle schemas and migrations live in `packages/db`. Better Auth owns its generated auth schema;
ShipFlow's domain schema is maintained separately and both are included in the same migration.

```bash
pnpm auth:generate # regenerate Better Auth's Drizzle schema
pnpm db:generate   # generate SQL after schema changes
pnpm db:migrate    # apply committed migrations
pnpm db:studio     # inspect the configured database
```

Run migrations outside the Vercel request runtime.

## UI components

```bash
pnpm --filter @workspace/ui exec shadcn add button dialog
```

Import shared components from `@workspace/ui/components/*`.

## Verification

```bash
pnpm lint
pnpm typecheck
pnpm build
```
