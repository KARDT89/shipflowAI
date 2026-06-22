"use client"

import { authClient } from "@shipflow/auth/client"
import { Button } from "@workspace/ui/components/button"
import { RiGithubFill } from "@remixicon/react"
import { useState } from "react"
import { toast } from "sonner"

export function GitHubConnectButton({
  githubAccountLinked,
  githubAppInstalled,
}: {
  githubAccountLinked: boolean
  githubAppInstalled: boolean
}) {
  const [pending, setPending] = useState(false)

  async function linkGitHubAccount() {
    setPending(true)
    const result = await authClient.linkSocial({
      provider: "github",
      callbackURL: "/github/install",
    })
    if (result?.error) {
      setPending(false)
      toast.error(result.error.message ?? "Could not link your GitHub account.")
    }
    // On success, authClient redirects to callbackURL — component unmounts before this point.
  }

  return (
    <div className="flex items-center gap-3">
      <span className="hidden text-xs text-muted-foreground lg:inline">
        Account: {githubAccountLinked ? "linked" : "not linked"} · App:{" "}
        {githubAppInstalled ? "installed" : "not installed"}
      </span>
      {githubAccountLinked ? (
        <Button variant="outline" asChild>
          <a href="/github/install">
            <RiGithubFill className="size-4" aria-hidden />
            {githubAppInstalled ? "Manage GitHub" : "Connect GitHub"}
          </a>
        </Button>
      ) : (
        <Button
          variant="outline"
          disabled={pending}
          onClick={linkGitHubAccount}
        >
          <RiGithubFill className="size-4" aria-hidden />
          {pending ? "Connecting..." : "Connect GitHub"}
        </Button>
      )}
    </div>
  )
}
