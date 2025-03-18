import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { events } from '@/lib/events'
import { prisma } from '@/lib/prisma'
import { type Message, messageSchema } from '@/schemas/messages'

export async function adminEvent(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    '/events/:eventId/admin',
    {
      websocket: true,
      schema: {
        tags: ['Event'],
        summary: '[WS] Admin Event',
        description: `<strong>⚠️ Attention</strong>: <br />
        This is an WS route used to admin an event. Your fist message sent needs 
        to be and <code>{type: 'AUTHENTICATION', token: jwtToken}</code>.`,
        params: z.object({
          eventId: z.string().uuid()
        })
      }
    },
    (socket, { params }) => {
      let isAuthenticated = false

      socket.on('message', async messageBuffer => {
        const { success, data, error } = messageSchema.safeParse(
          JSON.parse(messageBuffer.toString())
        )

        if (!success) {
          socket.send(error.toString())
          socket.close()
          return
        }

        if (!isAuthenticated && data.type !== 'AUTHENTICATION') {
          socket.send('UNAUTHORIZED')
          socket.close()
        }

        if (data.type === 'AUTHENTICATION') {
          const { sub } = app.jwt.verify<{ sub: string }>(data.token)

          const event = await prisma.event.findUnique({
            where: { id: params.eventId, userId: sub, status: 'OPEN' }
          })

          if (!event) {
            socket.send('UNAUTHORIZED')
            socket.close()

            return
          }

          isAuthenticated = true

          events.get(params.eventId)?.setAdminConnection((message: Message) => {
            socket.send.bind(socket)(JSON.stringify(message))
          })
        }
      })
    }
  )
}
