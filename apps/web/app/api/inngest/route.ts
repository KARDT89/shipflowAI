import { serve } from "inngest/next"

import { functions, inngest } from "@shipflow/inngest"

export const { GET, POST, PUT } = serve({ client: inngest, functions })
