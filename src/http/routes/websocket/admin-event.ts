import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { events } from '@/lib/events'
import { prisma } from '@/lib/prisma'

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

      socket.on('message', async (messageBuffer) => {
        const message: Message = JSON.parse(messageBuffer.toString())

        if (!isAuthenticated && message.type !== 'AUTHENTICATION') {
          socket.terminate()
        }

        if (message.type === 'AUTHENTICATION') {
          try {
            const { sub } = app.jwt.verify<{ sub: string }>(message.token)

            await prisma.event.findUniqueOrThrow({
              where: { id: params.eventId, userId: sub }
            })

            isAuthenticated = true

            events[params.eventId].setAdminConnection(socket.send.bind(socket))
          } catch {
            socket.terminate()
          }
        }
      })
    }
  )
}
