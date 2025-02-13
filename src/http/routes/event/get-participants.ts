import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { NotFoundError } from '@/http/_errors/not-found'
import { auth } from '@/http/middlewares/auth'
import { events } from '@/lib/events'

export async function getParticipants(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get(
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
                  id: z.string().uuid(),
                  latitude: z.number(),
                  longitude: z.number(),
                  accuracy: z.number()
                })
              )
            })
          }
        }
      },
      async (request, reply) => {
        const userId = await request.getCurrentUserId()
        const { eventId } = request.params

        const event = events.get(eventId)

        if (!event || event.getAdminId() !== userId) {
          throw new NotFoundError('Event not found')
        }

        const participants = event.getSubscribers()

        return reply.send({ participants })
      }
    )
}
