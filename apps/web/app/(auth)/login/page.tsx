import { LoginForm } from "@/components/login-form"
import { RiShipLine } from "@remixicon/react"
import Link from "next/link"

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackURL?: string }>
}) {
  const params = await searchParams
  const callbackURL = params.callbackURL?.startsWith("/")
    ? params.callbackURL
    : "/dashboard"
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted/30 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Link
          href="/"
          className="flex items-center gap-2 self-center font-semibold tracking-tight"
        >
          <div className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <RiShipLine className="size-4" aria-hidden />
          </div>
          ShipFlow AI
        </Link>
        <LoginForm
          callbackURL={callbackURL}
          githubEnabled={Boolean(process.env.GITHUB_APP_CLIENT_ID)}
          googleEnabled={Boolean(process.env.GOOGLE_CLIENT_ID)}
        />
      </div>
    </div>
  )
}
