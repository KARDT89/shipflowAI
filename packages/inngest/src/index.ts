export { inngest } from "./client"
export type { Events } from "./events"
export { clarifyRequest } from "./functions/clarifyRequest"
export { onPullRequestOpened } from "./functions/onPullRequestOpened"

import { clarifyRequest } from "./functions/clarifyRequest"
import { onPullRequestOpened } from "./functions/onPullRequestOpened"

export const functions = [clarifyRequest, onPullRequestOpened]
