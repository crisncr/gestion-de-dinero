import type { FastifyReply, FastifyRequest } from 'fastify'

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
  }
}

export function sendError(reply: FastifyReply, error: unknown) {
  if (error instanceof HttpError) {
    return reply.code(error.status).send({ error: error.message })
  }
  const message = error instanceof Error ? error.message : 'Error interno'
  if (message.startsWith('Falta ')) {
    return reply.code(500).send({ error: message })
  }
  console.error(error)
  return reply.code(500).send({ error: 'Error interno' })
}

export async function readJson<T>(request: FastifyRequest) {
  return (request.body ?? {}) as T
}
