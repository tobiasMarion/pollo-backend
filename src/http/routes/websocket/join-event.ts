import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { events } from '@/lib/events'

export async function JoinEvent(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    '/event/:eventId/join',
    {
      websocket: true,
      schema: {
        tags: ['Event'],
        summary: '[WS] Join event',
        description: `<strong>⚠️ Attention</strong>: <br />
          This is an WS route used to join an event 
          and receive instructions of how to paint that pixel. When a user send
          a <b>JOIN</b> message, it is registering himself as a pixel on the current events.`,
        params: z.object({
          eventId: z.string().uuid()
        })
      }
    },
    async (connection, { params }) => {
      connection.on('JOIN', (message) => {
        const user = z
          .object({
            latitude: z.number().min(-90).max(90),
            longitude: z.number().min(-90).max(90),
            accuracy: z.number(),
            altitude: z.number(),
            altitudeAccuracy: z.number()
          })
          .parse(message)

        if (events[params.eventId]) {
          events[params.eventId].subscribe({
            ...user,
            sendMessage: (message) => connection.send(JSON.stringify(message))
          })
        }
      })
    }
  )
}
