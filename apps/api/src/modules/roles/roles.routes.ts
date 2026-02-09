import { FastifyPluginAsync } from 'fastify'
import { RolesService } from './roles.service.js'
import { authMiddleware } from '../../shared/middlewares/auth.middleware.js'
import { successResponse } from '../../shared/utils/response.js'

export const rolesRoutes: FastifyPluginAsync = async (fastify) => {
  const rolesService = new RolesService()

  // GET /api/roles
  fastify.get('/', {
    schema: {
      tags: ['Permissão']
    },
    //preHandler: [authMiddleware]
  }, async () => {
    const roles = await rolesService.listRoles()
    return successResponse(roles)
  })
}
