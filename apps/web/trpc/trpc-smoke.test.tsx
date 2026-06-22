import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { GET, POST } from "@/app/api/trpc/[trpc]/route"
import { TRPCReactProvider } from "./client"

describe("tRPC integration", () => {
  it("exports GET and POST route handlers", () => {
    expect(GET).toBeTypeOf("function")
    expect(POST).toBeTypeOf("function")
  })

  it("mounts the React Query and tRPC providers", () => {
    render(
      <TRPCReactProvider>
        <p>Provider child</p>
      </TRPCReactProvider>
    )

    expect(screen.getByText("Provider child")).toBeInTheDocument()
  })
})
