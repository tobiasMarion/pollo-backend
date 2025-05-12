import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { NotFoundError } from '@/http/_errors/not-found'
import { auth } from '@/http/middlewares/auth'
import { events } from '@/lib/events'
import { edgeSchema } from '@/services/graph/draw/schemas'

export async function getGraphEdges(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get(
      '/events/:eventId/edges',
      {
        schema: {
          tags: ['Event'],
          summary: 'Get Edges in the Event Graph',
          params: z.object({
            eventId: z.string().uuid()
          }),
          response: {
            200: z.object({
              edges: z.array(edgeSchema)
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

        const edges = await event.getGraphEdges()

        return reply.send({ edges })
      }
    )
}
