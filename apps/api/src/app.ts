import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import { env } from './config/env.js'
import { errorHandler } from './shared/errors/errorHandler.js'
import { healthRoutes } from './modules/health/health.routes.js'
import { usersRoutes } from './modules/users/users.routes.js'
import { authRoutes } from './modules/auth/auth.routes.js'

export async function buildApp() {
  const fastify = Fastify({
    logger: {
      transport: {
        target: 'pino-pretty',
        options: {
          translateTime: 'HH:MM:ss',
          ignore: 'pid,hostname'
        }
      }
    }
  })

  // Error handler global
  fastify.setErrorHandler(errorHandler)

  // Plugins
  await fastify.register(cors, { 
    origin: env.frontendUrl,
    credentials: true 
  })
  
  await fastify.register(jwt, { 
    secret: env.jwt.secret,
    sign: {
      expiresIn: env.jwt.expiration
    }
  })

  // Registrar rotas
  await fastify.register(healthRoutes, { prefix: '/api' })
  await fastify.register(authRoutes, { prefix: '/api/auth' })
  await fastify.register(usersRoutes, { prefix: '/api/users' })

  return fastify
}