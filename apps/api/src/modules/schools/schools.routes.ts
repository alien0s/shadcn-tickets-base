import { FastifyPluginAsync } from 'fastify'
import { authMiddleware } from '../../shared/middlewares/auth.middleware.js'
import { successResponse } from '../../shared/utils/response.js'
import { SchoolsService } from './schools.service.js'
import {
  createSchoolSchema,
  deleteSchoolParamsSchema,
  schoolsSchemas,
  updateSchoolSchema
} from './schools.schemas.js'

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

  // POST /api/schools
  fastify.post('/', {
    schema: {
      ...schoolsSchemas.create,
      tags: ['Schools'],
      summary: 'Create school',
      description: 'Cria uma nova escola no tenant do usuario ou no tenant informado pelo root',
      security: [{ bearerAuth: [] }]
    },
    preHandler: [authMiddleware]
  }, async (request, reply) => {
    const payload = createSchoolSchema.parse(request.body)
    const school = await schoolsService.createSchool({
      tenantId: request.user.tenant_id,
      roleId: request.user.role_id
    }, payload)

    return reply.status(201).send(successResponse(school, 'Escola criada com sucesso'))
  })

  // PATCH /api/schools/:school_id
  fastify.patch('/:school_id', {
    schema: {
      ...schoolsSchemas.update,
      tags: ['Schools'],
      summary: 'Update school',
      description: 'Atualiza uma escola respeitando o escopo de tenant do usuario autenticado',
      security: [{ bearerAuth: [] }]
    },
    preHandler: [authMiddleware]
  }, async (request) => {
    const { school_id } = deleteSchoolParamsSchema.parse(request.params)
    const payload = updateSchoolSchema.parse(request.body)

    const school = await schoolsService.updateSchool({
      tenantId: request.user.tenant_id,
      roleId: request.user.role_id
    }, school_id, payload)

    return successResponse(school, 'Escola atualizada com sucesso')
  })

  // DELETE /api/schools/:school_id
  fastify.delete('/:school_id', {
    schema: {
      ...schoolsSchemas.delete,
      tags: ['Schools'],
      summary: 'Delete school',
      description: 'Exclui uma escola respeitando o escopo de tenant do usuario autenticado',
      security: [{ bearerAuth: [] }]
    },
    preHandler: [authMiddleware]
  }, async (request, reply) => {
    const { school_id } = deleteSchoolParamsSchema.parse(request.params)

    await schoolsService.deleteSchool({
      tenantId: request.user.tenant_id,
      roleId: request.user.role_id
    }, school_id)

    return reply.status(204).send()
  })
}
