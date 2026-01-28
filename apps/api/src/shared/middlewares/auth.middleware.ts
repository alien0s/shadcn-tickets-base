import { FastifyRequest, FastifyReply } from 'fastify'
import { UnauthorizedError } from '../errors/AppError.js'

export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    await request.jwtVerify()
  } catch (error) {
    throw new UnauthorizedError('Token inválido ou expirado')
  }
}

// Decorator para adicionar user ao request
declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: {
      id: string
      email: string
      entity_id: string
      role_id: string
    }
    user: {
      id: string
      email: string
      entity_id: string
      role_id: string
    }
  }
}
