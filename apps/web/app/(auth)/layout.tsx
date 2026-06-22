import Link from "next/link"
import type { ReactNode } from "react"

export default function AuthLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <main className="grid min-h-svh place-items-center bg-muted/30 px-6 py-12">
      <div className="flex w-full flex-col items-center gap-8">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          ShipFlow AI
        </Link>
        {children}
      </div>
    </main>
  )
}
