import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { NotFoundError } from '@/http/_errors/not-found'
import { UnauthorizedError } from '@/http/_errors/unauthorized-error'
import { auth } from '@/http/middlewares/auth'
import { events } from '@/lib/events'
import { prisma } from '@/lib/prisma'

export async function closeEvent(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .put(
      '/events/:eventId/close',
      {
        schema: {
          tags: ['Event'],
          summary: 'Close event',
          description:
            "When an event is closed, it's pixels matrix is calculated",
          params: z.object({
            eventId: z.string().uuid()
          }),
          body: z.null(),
          response: {
            200: z.null()
          }
        }
      },
      async (request, reply) => {
        const { eventId } = request.params
        const userId = await request.getCurrentUserId()

        const event = events.get(eventId)

        if (!event) {
          throw new NotFoundError('Event not found')
        }

        if (event.getAdminId() !== userId) {
          throw new UnauthorizedError()
        }

        await prisma.event.update({
          where: { id: eventId },
          data: { status: 'CLOSED' }
        })

        event.close()

        return reply.send()
      }
    )
}