import type { FastifyInstance } from 'fastify'
import { ZodError } from 'zod'

import { BadRequestError } from './_errors/bad-request'
import { NotFoundError } from './_errors/not-found'
import { UnauthorizedError } from './_errors/unauthorized-error'

type FastifyErrorHandler = FastifyInstance['errorHandler']

export const errorHandler: FastifyErrorHandler = (error, request, reply) => {
  if (error instanceof ZodError) {
    return reply.status(400).send({
      message: 'Validation Error',
      errors: error.flatten().fieldErrors
    })
  }

  if (error instanceof BadRequestError) {
    return reply.status(400).send({
      message: error.message
    })
  }

  if (error instanceof UnauthorizedError) {
    return reply.status(401).send({
      message: error.message
    })
  }

  if (error instanceof NotFoundError) {
    return reply.status(404).send({
      message: error.message
    })
  }

  console.log(error)
  // send error to observability platform

  return reply.status(500).send({ message: 'Interal server error.' })
}
