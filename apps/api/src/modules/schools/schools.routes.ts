import { FastifyPluginAsync } from 'fastify'
import { authMiddleware } from '../../shared/middlewares/auth.middleware.js'
import { successResponse } from '../../shared/utils/response.js'
import { SchoolsService } from './schools.service.js'
import { schoolsSchemas } from './schools.schemas.js'

export const schoolsRoutes: FastifyPluginAsync = async (fastify) => {
  const schoolsService = new SchoolsService()

  // GET /api/schools
  fastify.get('/', {
    schema: {
      ...schoolsSchemas.list,
      tags: ['Schools'],
      summary: 'List schools',
      description: 'Lista escolas visíveis para o usuário (root: todas, demais: apenas do tenant)',
      security: [{ bearerAuth: [] }]
    },
    preHandler: [authMiddleware]
  }, async (request) => {
    const schools = await schoolsService.listSchools({
      tenantId: request.user.tenant_id,
      roleId: request.user.role_id
    })

    return successResponse(schools)
  })
}

