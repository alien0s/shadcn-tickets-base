import { FastifyPluginAsync } from 'fastify'
import { authMiddleware } from '../../shared/middlewares/auth.middleware.js'
import { successResponse } from '../../shared/utils/response.js'
import { educationLevelsSchemas } from './education-levels.schemas.js'
import { EducationLevelsService } from './education-levels.service.js'

export const educationLevelsRoutes: FastifyPluginAsync = async (fastify) => {
  const educationLevelsService = new EducationLevelsService()

  fastify.get('/', {
    schema: {
      ...educationLevelsSchemas.list,
      tags: ['Education Levels'],
      summary: 'List education levels',
      description: 'Lista niveis de ensino cadastrados',
      security: [{ bearerAuth: [] }]
    },
    preHandler: [authMiddleware]
  }, async () => {
    const levels = await educationLevelsService.listEducationLevels()
    return successResponse(levels)
  })
}

