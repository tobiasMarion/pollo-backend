/* eslint-disable camelcase */
import { getClosestEvent } from '@prisma/client/sql'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { NotFoundError } from '@/http/_errors/not-found'
import { prisma } from '@/lib/prisma'

export async function getEventAround(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    '/events/around',
    {
      schema: {
        tags: ['Event'],
        summary: 'Get Event Around',
        querystring: z.object({
          latitude: z.coerce.number().min(-90).max(90),
          longitude: z.coerce.number().min(-90).max(90)
        }),
        response: {
          200: z.object({
            event: z.object({
              id: z.string().uuid(),
              type: z.enum(['TORCH', 'SCREEN']),
              name: z.string(),
              status: z.enum(['OPEN', 'CLOSED', 'FINISHED']),
              latitude: z.number().min(-90).max(90),
              longitude: z.number().min(-90).max(90),
              userId: z.string(),
              createdAt: z.date(),
              updatedAt: z.date()
            })
          })
        }
      }
    },
    async ({ query }, reply) => {
      const result = await prisma.$queryRawTyped(
        getClosestEvent(query.latitude, query.longitude)
      )

      if (result.length === 0) {
        throw new NotFoundError('There was not any event around you.')
      }

      const {
        id,
        name,
        latitude,
        longitude,
        status,
        type,
        user_id,
        created_at,
        updated_at
      } = result[0]

      reply.send({
        event: {
          id,
          name,
          latitude,
          longitude,
          status,
          type,
          userId: user_id,
          createdAt: created_at,
          updatedAt: updated_at
        }
      })
    }
  )
}
