import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { events } from '@/lib/events'
import { prisma } from '@/lib/prisma'
import { type Message, messageSchema } from '@/schemas/messages'
import type { EventService } from '@/services/event'

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
      let event: EventService | null = null

      socket.on('message', async messageBuffer => {
        const {
          success,
          data: message,
          error
        } = messageSchema.safeParse(JSON.parse(messageBuffer.toString()))

        if (!success) {
          socket.send(error.toString())
          socket.close()
          return
        }

        if (!isAuthenticated && message.type !== 'AUTHENTICATION') {
          socket.send('UNAUTHORIZED')
          socket.close()

          return
        }

        if (message.type === 'AUTHENTICATION') {
          const { sub } = app.jwt.verify<{ sub: string }>(message.token)

          const eventOnDB = await prisma.event.findUnique({
            where: { id: params.eventId, userId: sub, status: 'OPEN' }
          })

          if (!eventOnDB) {
            socket.send('UNAUTHORIZED')
            socket.close()

            return
          }

          isAuthenticated = true
          event = events.get(eventOnDB.id)!

          event.setAdminConnection((message: Message) => {
            socket.send.bind(socket)(JSON.stringify(message))
          })
        }

        if (message.type === 'EFFECT') {
          if (event) {
            event.publish(message)
          }
        }
      })
    }
  )
}
