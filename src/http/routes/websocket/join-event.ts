import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { events } from '@/lib/events'
import {
  type Message,
  messageSchema,
  safeParseJsonMessage
} from '@/schemas/messages'

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
    async (socket, { params }) => {
      const event = events.get(params.eventId)
      let deviceId = ''

      if (!event) {
        socket.close()
        return
      }

      socket.on('message', rawMessage => {
        const result = safeParseJsonMessage(
          rawMessage.toString(),
          messageSchema
        )

        if (!result.success) {
          console.log(rawMessage.toString())
          socket.send(JSON.stringify(result.error))
          socket.close()
          return
        }

        const { data } = result

        if (!deviceId && data.type !== 'JOIN') {
          socket.send(
            'You have to join the event first before sending and receiveing messages'
          )
          socket.close()
          return
        }

        switch (data.type) {
          case 'JOIN':
            deviceId = data.deviceId
            event.subscribe({
              ...data,
              sendMessage: (message: Message) =>
                socket.send.bind(socket)(JSON.stringify(message))
            })
            break

          case 'LOCATION_UPDATE':
            event.updateSubLocation(deviceId, data.location)
            break

          case 'DISTANCE':
            console.log(data)
            break

          default:
            console.log(data)
            break
        }
      })

      socket.on('close', () => {
        event.unsubscribe(deviceId)
      })
    }
  )
}
