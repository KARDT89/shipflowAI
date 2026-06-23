export { inngest } from "./client"
export type { Events } from "./events"
export { clarifyRequest } from "./functions/clarifyRequest"
export { generatePrd } from "./functions/generatePrd"
export { generateTasks } from "./functions/generateTasks"
export { onPullRequestOpened } from "./functions/onPullRequestOpened"

import { clarifyRequest } from "./functions/clarifyRequest"
import { generatePrd } from "./functions/generatePrd"
import { generateTasks } from "./functions/generateTasks"
import { onPullRequestOpened } from "./functions/onPullRequestOpened"

export const functions = [
  clarifyRequest,
  generatePrd,
  generateTasks,
  onPullRequestOpened,
]
