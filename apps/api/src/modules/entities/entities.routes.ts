import { FastifyPluginAsync } from 'fastify'
import { EntitiesService } from './entities.service.js'
import { createEntitySchema } from './entities.schemas.js'
import { authMiddleware } from '../../shared/middlewares/auth.middleware.js'
import { successResponse } from '../../shared/utils/response.js'

export const entitiesRoutes: FastifyPluginAsync = async (fastify) => {
  const entitiesService = new EntitiesService()

  // GET /api/entities
  fastify.get('/', {
    schema: {
      tags: ['Entidades']
    },
    //preHandler: [authMiddleware]
  }, async () => {
    const entities = await entitiesService.listEntities()
    return successResponse(entities)
  })

  // POST /api/entities
  fastify.post('/', {
    schema: {
      tags: ['Entidades']
    },
    preHandler: [authMiddleware]
  }, async (request, reply) => {
    const payload = createEntitySchema.parse(request.body)
    const entity = await entitiesService.createEntity(payload)
    return reply.status(201).send(successResponse(entity, 'Entidade criada com sucesso'))
  })
}
