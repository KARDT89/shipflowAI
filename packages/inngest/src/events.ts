export type Events = {
  "feature_request.created": {
    data: {
      featureRequestId: string
      organizationId: string
    }
  }
  "github/pull_request.opened": {
    data: {
      pullRequestId: string
      repositoryId: string
      githubPrNumber: number
    }
  }
  "github/pull_request.synchronized": {
    data: {
      pullRequestId: string
      repositoryId: string
      headSha: string
    }
  }
}
