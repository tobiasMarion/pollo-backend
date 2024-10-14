import type { FastifyInstance } from 'fastify'

import { authenticateWithGitHub } from './auth/authenticate-with-github'
import { createEvent } from './event/create-event'
import { getProfile } from './auth/get-profile'

export async function routes(app: FastifyInstance) {
  // Auth
  app.register(authenticateWithGitHub)
  app.register(getProfile)

  app.register(createEvent)
}
