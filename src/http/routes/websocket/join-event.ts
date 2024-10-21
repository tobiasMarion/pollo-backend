import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { events } from '@/lib/events'

export async function joinEvent(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    '/events/:eventId/join',
    {
      websocket: true,
      schema: {
        tags: ['Event'],
        summary: '[WS] Join Event',
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
      connection.on('message', (rawMessage) => {
        const message = z
          .object({
            type: z.string(),
            latitude: z.number().min(-90).max(90),
            longitude: z.number().min(-90).max(90),
            accuracy: z.number(),
            altitude: z.number(),
            altitudeAccuracy: z.number()
          })
          .parse(JSON.parse(rawMessage.toString()))

        const {
          type,
          latitude,
          longitude,
          accuracy,
          altitude,
          altitudeAccuracy
        } = message

        if (type === 'JOIN' && events[params.eventId]) {
          events[params.eventId].subscribe({
            latitude,
            longitude,
            accuracy,
            altitude,
            altitudeAccuracy,
            sendMessage: (message) => connection.send(JSON.stringify(message))
          })
        }
      })
    }
  )
}
