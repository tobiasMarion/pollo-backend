import { fastify } from 'fastify'
import { routes } from './routes'
import {
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
  ZodTypeProvider
} from 'fastify-type-provider-zod'
import fastifySwagger from '@fastify/swagger'
import ScalarApiReference from '@scalar/fastify-api-reference'
import fastifyCors from '@fastify/cors'

const app = fastify().withTypeProvider<ZodTypeProvider>()

app.setValidatorCompiler(validatorCompiler)
app.setSerializerCompiler(serializerCompiler)

app.register(routes)

app.register(fastifySwagger, {
  openapi: {
    info: {
      title: 'Pollo API',
      description: 'An app to sync a million fireflies',
      version: '1.0.0'
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    }
  },
  transform: jsonSchemaTransform
})
app.register(ScalarApiReference, { routePrefix: '/docs' })

app.register(fastifyCors)

app.listen({ port: 3000 }).then(() => {
  console.log(`HTTP Server running on http://localhost:${3000}`)
  console.log(`Docs available on http://localhost:${3000}/docs`)
})
