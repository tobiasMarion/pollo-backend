import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { NotFoundError } from '@/http/_errors/not-found'
import { events } from '@/lib/events'

export async function getParticipants(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    '/events/:eventId/participants',
    {
      schema: {
        tags: ['Event'],
        summary: "Get Event's participants",
        params: z.object({
          eventId: z.string().uuid()
        }),
        response: {
          200: z.object({
            participants: z.array(
              z.object({
                deviceId: z.string(),
                location: z.object({
                  latitude: z.number().min(-90).max(90),
                  longitude: z.number().min(-180).max(180),
                  horizontalAccuracy: z.number(),
                  altitude: z.number(),
                  verticalAccuracy: z.number()
                })
              })
            )
          })
        }
      }
    },
    async (request, reply) => {
      const { eventId } = request.params

      const event = events.get(eventId)

      if (!event) {
        throw new NotFoundError('Event not found')
      }

      const participants = event.getSubscribers()

      return reply.send({ participants })
    }
  )
}
