import { z } from 'zod'

export const createEventSchema = z.object({
  name: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  type: z.enum(['TORCH', 'SCREEN'])
})

export type CreateEvent = z.infer<typeof createEventSchema>
