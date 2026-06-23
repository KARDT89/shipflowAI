import { z } from "zod"

export const tasksOutputSchema = z.object({
  tasks: z.array(
    z.object({
      title: z.string().min(1),
      description: z.string().min(1),
    })
  ),
})

export type TasksOutput = z.infer<typeof tasksOutputSchema>
