import { getClosestEvent } from '@prisma/client/sql'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { prisma } from '@/lib/prisma'

export async function getNearbyEvent(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    '/events/around',
    {
      schema: {
        tags: ['Event'],
        summary: 'Get nearby Events',
        querystring: z.object({
          latitude: z.coerce.number().min(-90).max(90),
          longitude: z.coerce.number().min(-90).max(90)
        }),
        response: {}
      }
    },
    async ({ query }, reply) => {
      const closestEvent = await prisma.$queryRawTyped(
        getClosestEvent(query.latitude, query.longitude)
      )

      console.log(closestEvent)
      reply.send(closestEvent)
    }
  )
}
