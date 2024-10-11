import type { FastifyInstance } from 'fastify'

import { authenticateWithGitHub } from './auth/authenticate-with-github'

export async function routes(app: FastifyInstance) {
  // Auth
  app.register(authenticateWithGitHub)
}
