import { z } from "zod"

export const clarificationOutputSchema = z.object({
  needs_clarification: z.boolean(),
  questions: z.array(z.string().min(1)),
  existing_feature_match: z.string().min(1).nullable(),
})

export type ClarificationOutput = z.infer<typeof clarificationOutputSchema>
