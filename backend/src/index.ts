import cors from '@fastify/cors'
import fastifyStatic from '@fastify/static'
import Fastify from 'fastify'
import { existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { ZodError } from 'zod'
import { env } from './env.js'
import { HttpError, sendError } from './http.js'
import { prisma } from './prisma.js'
import { agendaRoutes } from './routes/agenda.js'
import { authRoutes } from './routes/auth.js'
import { householdRoutes } from './routes/household.js'
import { moneyRoutes } from './routes/money.js'
import { petRoutes } from './routes/pets.js'

const app = Fastify({
  logger: {
    level: 'info',
    serializers: {
      req: (req) => ({ method: req.method, url: req.url }),
      res: (res) => ({ statusCode: res.statusCode }),
    },
  },
  disableRequestLogging: true,
  bodyLimit: 8 * 1024 * 1024,
})

await app.register(cors, { origin: true })
const sourceDir = dirname(fileURLToPath(import.meta.url))
const legalRoot =
  [resolve(sourceDir, '../../legal'), resolve(sourceDir, '../legal')].find((path) => existsSync(path)) ??
  resolve(sourceDir, '../../legal')

await app.register(fastifyStatic, {
  root: legalRoot,
  prefix: '/legal/',
})

app.setErrorHandler((error, _request, reply) => {
  if (error instanceof ZodError) {
    const first = error.issues[0]?.message || 'Datos inválidos'
    return reply.code(400).send({ error: first })
  }
  if (error instanceof HttpError) {
    return reply.code(error.status).send({ error: error.message })
  }
  return sendError(reply, error)
})

app.get('/health', async () => ({ ok: true, service: 'hogar360-api' }))

await app.register(authRoutes)
await app.register(householdRoutes)
await app.register(moneyRoutes)
await app.register(petRoutes)
await app.register(agendaRoutes)

try {
  await prisma.$connect()
  await app.listen({ port: env.port, host: env.host })
  console.log(`Casa360 API en http://localhost:${env.port}`)
} catch (error) {
  app.log.error(error)
  process.exit(1)
}
