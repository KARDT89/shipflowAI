import { z } from "zod"

export const reviewRunOutputSchema = z.object({
  summary: z.string().min(1),
  recommendation: z.enum(["pass", "fail"]),
  issues: z.array(
    z.object({
      severity: z.enum(["blocking", "non_blocking"]),
      category: z.string().min(1),
      filePath: z.string().min(1),
      line: z.number().int().positive().nullable(),
      description: z.string().min(1),
      reasoning: z.string().min(1),
    })
  ),
})

export type ReviewRunOutput = z.infer<typeof reviewRunOutputSchema>
