import { SignupForm } from "@/components/signup-form"
import { RiShipLine } from "@remixicon/react"
import Link from "next/link"

export default function SignupPage() {
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
        <SignupForm />
      </div>
    </div>
  )
}
