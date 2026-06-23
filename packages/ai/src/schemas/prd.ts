import { z } from "zod"

export const prdOutputSchema = z.object({
  problemStatement: z.string().min(1),
  goals: z.array(z.string().min(1)),
  nonGoals: z.array(z.string().min(1)),
  userStories: z.array(z.string().min(1)),
  acceptanceCriteria: z.array(z.string().min(1)),
  edgeCases: z.array(z.string().min(1)),
  successMetrics: z.array(z.string().min(1)),
})

export type PrdOutput = z.infer<typeof prdOutputSchema>
