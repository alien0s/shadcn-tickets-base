import { FastifyPluginAsync } from 'fastify'
import { authMiddleware } from '../../shared/middlewares/auth.middleware.js'
import { successResponse } from '../../shared/utils/response.js'
import { seriesSchemas } from './series.schemas.js'
import { SeriesService } from './series.service.js'

export const seriesRoutes: FastifyPluginAsync = async (fastify) => {
  const seriesService = new SeriesService()

  fastify.get('/', {
    schema: {
      ...seriesSchemas.list,
      tags: ['Series'],
      summary: 'List series',
      description: 'Lista series, com filtro opcional por nivel de ensino',
      security: [{ bearerAuth: [] }]
    },
    preHandler: [authMiddleware]
  }, async (request) => {
    const query = request.query as { education_level_id?: string }
    const series = await seriesService.listSeries(query.education_level_id)
    return successResponse(series)
  })
}
