import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import type { ReactNode } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { OrganizationPanel } from "./dashboard-actions"

const mocks = vi.hoisted(() => ({
  activeOrganization: {
    data: null as null | { id: string; name: string },
    isPending: false,
  },
  create: vi.fn(),
  organizations: {
    data: [] as Array<{ id: string; name: string }>,
    isPending: false,
  },
  refresh: vi.fn(),
  setActive: vi.fn(),
}))

vi.mock("@shipflow/auth/client", () => ({
  authClient: {
    organization: {
      create: mocks.create,
      setActive: mocks.setActive,
    },
    useActiveOrganization: () => mocks.activeOrganization,
    useListOrganizations: () => mocks.organizations,
  },
}))

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: mocks.refresh,
  }),
}))

function renderPanel() {
  const queryClient = new QueryClient()
  const clear = vi.spyOn(queryClient, "clear")

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }

  return { clear, ...render(<OrganizationPanel />, { wrapper: Wrapper }) }
}

describe("organization selection", () => {
  beforeEach(() => {
    mocks.activeOrganization = { data: null, isPending: false }
    mocks.organizations = { data: [], isPending: false }
    mocks.create.mockReset()
    mocks.refresh.mockReset()
    mocks.setActive.mockReset()
  })

  it("shows organization creation only when the user has no organizations", () => {
    renderPanel()

    expect(
      screen.getByRole("button", { name: "Create organization" })
    ).toBeInTheDocument()
    expect(
      screen.queryByLabelText("Active organization")
    ).not.toBeInTheDocument()
  })

  it("lists existing organizations instead of the creation form", () => {
    mocks.organizations = {
      data: [
        { id: "org-1", name: "Acme" },
        { id: "org-2", name: "Globex" },
      ],
      isPending: false,
    }
    mocks.activeOrganization = {
      data: { id: "org-1", name: "Acme" },
      isPending: false,
    }

    renderPanel()

    expect(screen.getByRole("option", { name: "Acme" })).toBeInTheDocument()
    expect(screen.getByRole("option", { name: "Globex" })).toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: "Create organization" })
    ).not.toBeInTheDocument()
  })

  it("switches the active organization and clears tenant cache", async () => {
    mocks.organizations = {
      data: [
        { id: "org-1", name: "Acme" },
        { id: "org-2", name: "Globex" },
      ],
      isPending: false,
    }
    mocks.activeOrganization = {
      data: { id: "org-1", name: "Acme" },
      isPending: false,
    }
    mocks.setActive.mockResolvedValue({ data: {}, error: null })
    const { clear } = renderPanel()

    fireEvent.change(screen.getByLabelText("Active organization"), {
      target: { value: "org-2" },
    })

    await waitFor(() => {
      expect(mocks.setActive).toHaveBeenCalledWith({ organizationId: "org-2" })
      expect(clear).toHaveBeenCalledOnce()
      expect(mocks.refresh).toHaveBeenCalledOnce()
    })
  })

  it("activates a newly created organization", async () => {
    const user = userEvent.setup()
    mocks.create.mockResolvedValue({ data: { id: "org-new" }, error: null })
    mocks.setActive.mockResolvedValue({ data: {}, error: null })
    const { clear } = renderPanel()

    await user.type(screen.getByLabelText("Organization name"), "New Company")
    await user.type(screen.getByLabelText("Slug"), "new-company")
    await user.click(
      screen.getByRole("button", { name: "Create organization" })
    )

    await waitFor(() =>
      expect(mocks.create).toHaveBeenCalledWith({
        name: "New Company",
        slug: "new-company",
        keepCurrentActiveOrganization: false,
      })
    )
    expect(mocks.setActive).toHaveBeenCalledWith({ organizationId: "org-new" })
    expect(clear).toHaveBeenCalledOnce()
    expect(mocks.refresh).toHaveBeenCalledOnce()
  })

  it("surfaces organization switching errors without clearing cache", async () => {
    mocks.organizations = {
      data: [{ id: "org-1", name: "Acme" }],
      isPending: false,
    }
    mocks.setActive.mockResolvedValue({
      data: null,
      error: { message: "Access denied" },
    })
    const { clear } = renderPanel()

    fireEvent.change(screen.getByLabelText("Active organization"), {
      target: { value: "org-1" },
    })

    expect(await screen.findByRole("alert")).toHaveTextContent("Access denied")
    expect(clear).not.toHaveBeenCalled()
    expect(mocks.refresh).not.toHaveBeenCalled()
  })
})
