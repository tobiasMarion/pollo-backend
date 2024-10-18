import type { FastifyInstance } from 'fastify'

import { authenticateWithGitHub } from './auth/authenticate-with-github'
import { getProfile } from './auth/get-profile'
import { createEvent } from './event/create-event'
import { getEventById } from './event/getEvent'
import { adminEvent } from './websocket/admin-event'
import { JoinEvent } from './websocket/join-event'

export async function routes(app: FastifyInstance) {
  // Auth
  app.register(authenticateWithGitHub)
  app.register(getProfile)

  // Events
  app.register(createEvent)
  app.register(getEventById)

  // Websockets
  app.register(JoinEvent)
  app.register(adminEvent)
}
