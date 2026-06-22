"use client"

import type { AppRouter } from "@shipflow/api"
import { QueryClientProvider, type QueryClient } from "@tanstack/react-query"
import { createTRPCClient, httpBatchLink } from "@trpc/client"
import { createTRPCContext } from "@trpc/tanstack-react-query"
import { useState, type ReactNode } from "react"
import superjson from "superjson"

import { makeQueryClient } from "./query-client"

export const { TRPCProvider, useTRPC, useTRPCClient } =
  createTRPCContext<AppRouter>()

let browserQueryClient: QueryClient | undefined

export function getQueryClient() {
  if (typeof window === "undefined") {
    return makeQueryClient()
  }

  browserQueryClient ??= makeQueryClient()
  return browserQueryClient
}

function getUrl() {
  if (typeof window !== "undefined") {
    return "/api/trpc"
  }

  return `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/api/trpc`
}

export function TRPCReactProvider({
  children,
}: Readonly<{ children: ReactNode }>) {
  const queryClient = getQueryClient()
  const [trpcClient] = useState(() =>
    createTRPCClient<AppRouter>({
      links: [
        httpBatchLink({
          transformer: superjson,
          url: getUrl(),
        }),
      ],
    })
  )

  return (
    <QueryClientProvider client={queryClient}>
      <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
        {children}
      </TRPCProvider>
    </QueryClientProvider>
  )
}
