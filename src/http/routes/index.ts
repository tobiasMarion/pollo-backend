import type { FastifyInstance } from 'fastify'

import { authenticateWithGitHub } from './auth/authenticate-with-github'
import { getProfile } from './auth/get-profile'
import { closeEvent } from './event/close-event'
import { createEvent } from './event/create-event'
import { getEventById } from './event/get-event'
import { getEventAround } from './event/get-event-by-location'
import { getParticipants } from './event/get-participants'
import { adminEvent } from './websocket/admin-event'
import { joinEvent } from './websocket/join-event'

export async function routes(app: FastifyInstance) {
  // Auth
  app.register(authenticateWithGitHub)
  app.register(getProfile)

  // Events
  app.register(createEvent)
  app.register(getEventById)
  app.register(getEventAround)
  app.register(getParticipants)
  app.register(closeEvent)

  // Websockets
  app.register(joinEvent)
  app.register(adminEvent)
}
