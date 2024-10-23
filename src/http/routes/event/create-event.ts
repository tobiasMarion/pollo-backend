import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { auth } from '@/http/middlewares/auth'
import { events } from '@/lib/events'
import { prisma } from '@/lib/prisma'
import { EventService } from '@/services/event'

export async function createEvent(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .post(
      '/events',
      {
        schema: {
          tags: ['Event'],
          summary: 'Create Event',
          body: z.object({
            name: z.string(),
            latitude: z.number(),
            longitude: z.number(),
            type: z.enum(['TORCH', 'SCREEN'])
          }),
          response: {
            201: z.object({ eventId: z.string().uuid() })
          }
        }
      },
      async (request, reply) => {
        const userId = await request.getCurrentUserId()

        const { name, latitude, longitude, type } = request.body

        const { id } = await prisma.event.create({
          data: { name, type, latitude, longitude, userId }
        })

        events.set(id, new EventService({ adminId: userId }))

        return reply.status(201).send({ eventId: id })
      }
    )
}
