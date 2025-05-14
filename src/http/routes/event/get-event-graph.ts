import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { NotFoundError } from '@/http/_errors/not-found'
import { auth } from '@/http/middlewares/auth'
import { events } from '@/lib/events'
import { edgeSchema, metadataSchema } from '@/schemas/graph'

export async function getEventGraph(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get(
      '/events/:eventId/graph',
      {
        schema: {
          tags: ['Event'],
          summary: 'Get Event Graph',
          params: z.object({
            eventId: z.string().uuid()
          }),
          response: {
            200: z.object({
              nodes: z.record(metadataSchema),
              edges: z.array(edgeSchema)
            })
          }
        }
      },
      async (request, reply) => {
        const { eventId } = request.params
        const userId = await request.getCurrentUserId()

        const event = events.get(eventId)

        if (!event || event.getAdminId() !== userId) {
          throw new NotFoundError('Event not found')
        }

        const graph = await event.getEventGraph()

        return reply.send(graph)
      }
    )
}
