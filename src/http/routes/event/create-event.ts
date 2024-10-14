import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { auth } from '@/http/middlewares/auth'

export async function createEvent(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .post(
      '/events',
      {
        schema: {
          tags: ['Event'],
          summary: `Create Event`,
          body: z.object({
            name: z.string(),
            locationReference: z.object({
              latitude: z.number(),
              longitude: z.number(),
              radius: z.number()
            })
          }),
          response: {
            201: z.object({ eventId: z.string().uuid() })
          }
        }
      },
      async (request, reply) => {
        const userId = await request.getCurrentUserId()

        return reply.status(201).send({ eventId: userId })
      }
    )
}
