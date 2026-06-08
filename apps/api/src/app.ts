import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import multipart from '@fastify/multipart'
import fastifyStatic from '@fastify/static'
import swagger from '@fastify/swagger'
import swaggerUi from '@fastify/swagger-ui'
import path from 'path'
import { env } from './config/env.js'
import { errorHandler } from './shared/errors/errorHandler.js'
import { healthRoutes } from './modules/health/health.routes.js'
import { usersRoutes } from './modules/users/users.routes.js'
import { authRoutes } from './modules/auth/auth.routes.js'
import { departmentsRoutes } from './modules/departments/departments.routes.js'
import { entitiesRoutes } from './modules/entities/entities.routes.js'
import { rolesRoutes } from './modules/roles/roles.routes.js'
import { ticketsRoutes } from './modules/tickets/tickets.routes.js'
import { schoolsRoutes } from './modules/schools/schools.routes.js'
import { teachersRoutes } from './modules/teachers/teachers.routes.js'
import { classesRoutes } from './modules/classes/classes.routes.js'
import { timeSlotsRoutes } from './modules/time-slots/time-slots.routes.js'
import { schedulesRoutes } from './modules/schedules/schedules.routes.js'
import { subjectsRoutes } from './modules/subjects/subjects.routes.js'
import { educationLevelsRoutes } from './modules/education-levels/education-levels.routes.js'
import { seriesRoutes } from './modules/series/series.routes.js'
import { matrixRoutes } from './modules/matrix/matrix.routes.js'
import { ticketPricesRoutes } from './modules/ticket-prices/ticket-prices.routes.js'
import { tenantRoutes } from './modules/tenant/tenant.routes.js'

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
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true)
        return
      }

      try {
        const requestUrl = new URL(origin)
        const configuredFrontendUrl = new URL(env.frontendUrl)
        const sameConfiguredOrigin = requestUrl.origin === configuredFrontendUrl.origin
        const isLocalhostTenantOrigin =
          env.nodeEnv !== 'production' &&
          requestUrl.protocol === 'http:' &&
          (requestUrl.hostname === 'localhost' || requestUrl.hostname.endsWith('.localhost'))

        callback(null, sameConfiguredOrigin || isLocalhostTenantOrigin)
      } catch {
        callback(null, false)
      }
    },
    credentials: true
  })
  
  await fastify.register(jwt, { 
    secret: env.jwt.secret,
    sign: {
      expiresIn: env.jwt.expiration
    }
  })

  await fastify.register(multipart, {
    limits: {
      files: 6,
      fileSize: 20 * 1024 * 1024
    }
  })

  await fastify.register(fastifyStatic, {
    root: path.resolve(process.cwd(), 'src', 'uploads'),
    prefix: '/uploads/'
  })

  await fastify.register(swagger, {
    openapi: {
      info: {
        title: 'thurnos API',
        description: 'API documentation for thurnos',
        version: '1.0.0'
      },
      servers: [
        {
          url: `http://localhost:${env.port}`,
          description: 'Development server'
        }
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT'
          }
        }
      }
    }
  })

  await fastify.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true
    },
    staticCSP: true,
    transformStaticCSP: (header) => header
  })

  // Registrar rotas
  await fastify.register(healthRoutes, { prefix: '/api' })
  await fastify.register(authRoutes, { prefix: '/api/auth' })
  await fastify.register(usersRoutes, { prefix: '/api/users' })
  await fastify.register(departmentsRoutes, { prefix: '/api/departments' })
  await fastify.register(entitiesRoutes, { prefix: '/api/entities' })
  await fastify.register(rolesRoutes, { prefix: '/api/roles' })
  await fastify.register(ticketsRoutes, { prefix: '/api/tickets' })
  await fastify.register(schoolsRoutes, { prefix: '/api/schools' })
  await fastify.register(teachersRoutes, { prefix: '/api/teachers' })
  await fastify.register(classesRoutes, { prefix: '/api/classes' })
  await fastify.register(timeSlotsRoutes, { prefix: '/api/time-slots' })
  await fastify.register(schedulesRoutes, { prefix: '/api/schedules' })
  await fastify.register(subjectsRoutes, { prefix: '/api/subjects' })
  await fastify.register(educationLevelsRoutes, { prefix: '/api/education-levels' })
  await fastify.register(seriesRoutes, { prefix: '/api/series' })
  await fastify.register(matrixRoutes, { prefix: '/api/matrix' })
  await fastify.register(ticketPricesRoutes, { prefix: '/api/ticket-prices' })
  await fastify.register(tenantRoutes, { prefix: '/api/tenant' })

  return fastify
}
