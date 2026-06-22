"use client"

import { authClient } from "@shipflow/auth/client"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@workspace/ui/components/sidebar"
import {
  RiArrowDownSLine,
  RiBillLine,
  RiDashboard3Line,
  RiGithubLine,
  RiLogoutBoxLine,
  RiMoonLine,
  RiProjectorLine,
  RiSettings3Line,
  RiShipLine,
  RiSunLine,
} from "@remixicon/react"
import { useQueryClient } from "@tanstack/react-query"
import { useTheme } from "next-themes"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState } from "react"

import { OrganizationForm } from "@/components/dashboard-actions"

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: RiDashboard3Line },
  { label: "Projects", href: "/projects", icon: RiProjectorLine },
  { label: "Repositories", href: "/repositories", icon: RiGithubLine },
  { label: "Settings", href: "/settings", icon: RiSettings3Line },
  { label: "Billing", href: "/billing", icon: RiBillLine },
] as const

export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const queryClient = useQueryClient()
  const session = authClient.useSession()
  const organizations = authClient.useListOrganizations()
  const activeOrganization = authClient.useActiveOrganization()
  const [createOrgOpen, setCreateOrgOpen] = useState(false)
  const { resolvedTheme, setTheme } = useTheme()

  async function switchOrganization(id: string) {
    await authClient.organization.setActive({ organizationId: id })
    queryClient.clear()
    router.refresh()
  }

  async function signOut() {
    await authClient.signOut()
    router.push("/login")
    router.refresh()
  }

  const user = session.data?.user
  const orgs = organizations.data ?? []
  const activeOrg = activeOrganization.data

  return (
    <Sidebar>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg">
                  <div className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
                    <RiShipLine className="size-4" aria-hidden />
                  </div>
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate font-semibold text-sm">
                      {activeOrg?.name ?? "ShipFlow AI"}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {activeOrg ? "Organization" : "No organization"}
                    </span>
                  </div>
                  <RiArrowDownSLine
                    className="ml-auto size-4 shrink-0 text-muted-foreground"
                    aria-hidden
                  />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                {orgs.map((org) => (
                  <DropdownMenuItem
                    key={org.id}
                    onClick={() => switchOrganization(org.id)}
                  >
                    {org.name}
                    {activeOrg?.id === org.id && (
                      <span className="ml-auto text-xs text-muted-foreground">
                        Active
                      </span>
                    )}
                  </DropdownMenuItem>
                ))}
                {orgs.length > 0 && <DropdownMenuSeparator />}
                <DropdownMenuItem onClick={() => setCreateOrgOpen(true)}>
                  Create organization
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Dialog open={createOrgOpen} onOpenChange={setCreateOrgOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create organization</DialogTitle>
                </DialogHeader>
                <OrganizationForm />
              </DialogContent>
            </Dialog>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarMenu>
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href + "/"))
            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton asChild isActive={isActive}>
                  <Link href={item.href}>
                    <item.icon className="size-4" aria-hidden />
                    {item.label}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg">
                  <Avatar className="size-8">
                    <AvatarImage src={user?.image ?? undefined} alt={user?.name} />
                    <AvatarFallback className="text-xs">
                      {user?.name?.slice(0, 2).toUpperCase() ?? "??"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate text-sm font-medium">
                      {user?.name}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {user?.email}
                    </span>
                  </div>
                  <RiArrowDownSLine
                    className="ml-auto size-4 shrink-0 text-muted-foreground"
                    aria-hidden
                  />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem disabled>Account settings</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() =>
                    setTheme(resolvedTheme === "dark" ? "light" : "dark")
                  }
                >
                  {resolvedTheme === "dark" ? (
                    <RiSunLine className="size-4" aria-hidden />
                  ) : (
                    <RiMoonLine className="size-4" aria-hidden />
                  )}
                  {resolvedTheme === "dark" ? "Light mode" : "Dark mode"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut}>
                  <RiLogoutBoxLine className="size-4" aria-hidden />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
