import { z } from 'zod'

export const createEventSchema = z.object({
  name: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  type: z.enum(['TORCH', 'SCREEN'])
})

export type CreateEvent = z.infer<typeof createEventSchema>

export const eventSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(['TORCH', 'SCREEN']),
  name: z.string(),
  status: z.enum(['OPEN', 'CLOSED', 'FINISHED']),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  userId: z.string(),
  createdAt: z.date(),
  updatedAt: z.date()
})

export type Event = z.infer<typeof eventSchema>
