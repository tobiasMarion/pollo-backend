declare module '@scalar/fastify-api-reference' {
  import { FastifyPluginCallback } from 'fastify'

  const fastifyApiReference: FastifyPluginCallback<{ routePrefix: string }>
  export default fastifyApiReference
}
