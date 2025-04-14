import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { auth } from '@/http/middlewares/auth'
import { createNewEvent, events } from '@/lib/events'
import { prisma } from '@/lib/prisma'
import { redis } from '@/lib/redis'
import { createEventSchema } from '@/schemas/event'

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
          body: createEventSchema,
          response: {
            201: z.object({ eventId: z.string().uuid() })
          }
        }
      },
      async (request, reply) => {
        const userId = await request.getCurrentUserId()

        const id = await createNewEvent(
          { ...request.body, adminId: userId },
          events,
          prisma,
          redis
        )

        return reply.status(201).send({ eventId: id })
      }
    )
}
