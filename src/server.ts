import Fastify from 'fastify'

const app = Fastify()

app.get('/', () => {
  return { hello: 'world' }
})

app.listen({ port: 3000 }, () => {
  console.log('Server running on http://localhost:3000')
})
