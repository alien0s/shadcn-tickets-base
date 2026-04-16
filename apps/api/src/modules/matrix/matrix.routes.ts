import { FastifyPluginAsync } from 'fastify'
import { authMiddleware } from '../../shared/middlewares/auth.middleware.js'
import { successResponse } from '../../shared/utils/response.js'
import {
  createSubjectWorkloadSchema,
  listSubjectWorkloadsQuerySchema,
  matrixSchemas,
  subjectWorkloadIdParamsSchema,
  updateSubjectWorkloadSchema
} from './matrix.schemas.js'
import { MatrixService } from './matrix.service.js'

export const matrixRoutes: FastifyPluginAsync = async (fastify) => {
  const matrixService = new MatrixService()

  fastify.get('/', {
    schema: {
      ...matrixSchemas.list,
      tags: ['Matrix'],
      summary: 'List subject workloads',
      description: 'Lista cargas da matriz por escola e serie',
      security: [{ bearerAuth: [] }]
    },
    preHandler: [authMiddleware]
  }, async (request) => {
    const query = listSubjectWorkloadsQuerySchema.parse(request.query)

    const workloads = await matrixService.listSubjectWorkloads(
      {
        tenantId: request.user.tenant_id,
        roleId: request.user.role_id
      },
      {
        schoolId: query.school_id,
        seriesId: query.series_id
      }
    )

    return successResponse(workloads)
  })

  fastify.post('/', {
    schema: {
      ...matrixSchemas.create,
      tags: ['Matrix'],
      summary: 'Create subject workload',
      description: 'Cria carga semanal da matriz para uma escola, serie e disciplina',
      security: [{ bearerAuth: [] }]
    },
    preHandler: [authMiddleware]
  }, async (request, reply) => {
    const payload = createSubjectWorkloadSchema.parse(request.body)

    const workload = await matrixService.createSubjectWorkload(
      {
        tenantId: request.user.tenant_id,
        roleId: request.user.role_id
      },
      payload
    )

    return reply.status(201).send(successResponse(workload, 'Carga da matriz criada com sucesso'))
  })

  fastify.patch('/:id', {
    schema: {
      ...matrixSchemas.update,
      tags: ['Matrix'],
      summary: 'Update subject workload',
      description: 'Atualiza carga da matriz',
      security: [{ bearerAuth: [] }]
    },
    preHandler: [authMiddleware]
  }, async (request) => {
    const params = subjectWorkloadIdParamsSchema.parse(request.params)
    const payload = updateSubjectWorkloadSchema.parse(request.body)

    const workload = await matrixService.updateSubjectWorkload(
      {
        tenantId: request.user.tenant_id,
        roleId: request.user.role_id
      },
      params.id,
      payload
    )

    return successResponse(workload, 'Carga da matriz atualizada com sucesso')
  })

  fastify.delete('/:id', {
    schema: {
      ...matrixSchemas.delete,
      tags: ['Matrix'],
      summary: 'Delete subject workload',
      description: 'Exclui carga da matriz',
      security: [{ bearerAuth: [] }]
    },
    preHandler: [authMiddleware]
  }, async (request) => {
    const params = subjectWorkloadIdParamsSchema.parse(request.params)

    await matrixService.deleteSubjectWorkload(
      {
        tenantId: request.user.tenant_id,
        roleId: request.user.role_id
      },
      params.id
    )

    return successResponse(null, 'Carga da matriz excluida com sucesso')
  })
}
