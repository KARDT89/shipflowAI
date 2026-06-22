import { App } from "@octokit/app"

let app: App | undefined

export function getGitHubApp() {
  const appId = process.env.GITHUB_APP_ID
  const privateKey = process.env.GITHUB_APP_PRIVATE_KEY
  const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET
  if (!appId || !privateKey || !webhookSecret) {
    throw new Error("GitHub App credentials are not configured")
  }

  app ??= new App({
    appId,
    privateKey,
    webhooks: { secret: webhookSecret },
  })
  return app
}

const githubApiVersion = "2022-11-28"

type GitHubInstallation = {
  id: number
  account: {
    id: number
    login: string
    type: string
  } | null
}

export type GitHubRepository = {
  id: string
  owner: string
  name: string
  fullName: string
  defaultBranch: string
}

async function githubUserRequest<T>(accessToken: string, path: string) {
  const response = await fetch(`https://api.github.com${path}`, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${accessToken}`,
      "X-GitHub-Api-Version": githubApiVersion,
    },
    cache: "no-store",
  })

  if (!response.ok) {
    throw new Error(`GitHub request failed with status ${response.status}`)
  }

  return (await response.json()) as T
}

export async function getUserInstallation(
  accessToken: string,
  installationId: number
) {
  let page = 1
  while (true) {
    const response = await githubUserRequest<{
      installations: GitHubInstallation[]
    }>(accessToken, `/user/installations?per_page=100&page=${page}`)
    const installation = response.installations.find(
      (candidate) => candidate.id === installationId
    )
    if (installation) return installation
    if (response.installations.length < 100) return null
    page += 1
  }
}

export async function getUserInstallationRepos(
  accessToken: string,
  installationId: number
) {
  const repositories: GitHubRepository[] = []
  let page = 1

  while (true) {
    const response = await githubUserRequest<{
      repositories: Array<{
        id: number
        owner: { login: string }
        name: string
        full_name: string
        default_branch: string
      }>
    }>(
      accessToken,
      `/user/installations/${installationId}/repositories?per_page=100&page=${page}`
    )
    repositories.push(
      ...response.repositories.map((repository) => ({
        id: String(repository.id),
        owner: repository.owner.login,
        name: repository.name,
        fullName: repository.full_name,
        defaultBranch: repository.default_branch,
      }))
    )
    if (response.repositories.length < 100) return repositories
    page += 1
  }
}

export async function getInstallationAccount(
  installationId: number
): Promise<GitHubInstallation["account"]> {
  const app = getGitHubApp()
  try {
    const response = await app.octokit.request(
      "GET /app/installations/{installation_id}",
      {
        installation_id: installationId,
        headers: { "X-GitHub-Api-Version": githubApiVersion },
      }
    )
    return response.data.account as GitHubInstallation["account"]
  } catch {
    return null
  }
}

export async function listInstallationRepositories(
  installationId: number
): Promise<GitHubRepository[]> {
  const app = getGitHubApp()
  const octokit = await app.getInstallationOctokit(installationId)
  const repositories: GitHubRepository[] = []
  let page = 1

  while (true) {
    const response = await octokit.request("GET /installation/repositories", {
      per_page: 100,
      page,
      headers: { "X-GitHub-Api-Version": githubApiVersion },
    })
    const repos = response.data.repositories as Array<{
      id: number
      owner: { login: string }
      name: string
      full_name: string
      default_branch: string
    }>
    repositories.push(
      ...repos.map((repo) => ({
        id: String(repo.id),
        owner: repo.owner.login,
        name: repo.name,
        fullName: repo.full_name,
        defaultBranch: repo.default_branch,
      }))
    )
    if (repos.length < 100) return repositories
    page += 1
  }
}

export async function getUserInstallationRepo(
  accessToken: string,
  installationId: number,
  repositoryId: string
) {
  const repositories = await getUserInstallationRepos(
    accessToken,
    installationId
  )
  return (
    repositories.find((repository) => repository.id === repositoryId) ?? null
  )
}

export async function getInstallationRepo(
  installationId: number,
  repositoryId: string
): Promise<GitHubRepository | null> {
  const repositories = await listInstallationRepositories(installationId)
  return repositories.find((r) => r.id === repositoryId) ?? null
}
