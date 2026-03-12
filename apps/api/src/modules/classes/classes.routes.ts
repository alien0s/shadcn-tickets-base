import { FastifyPluginAsync } from 'fastify'
import { authMiddleware } from '../../shared/middlewares/auth.middleware.js'
import { successResponse } from '../../shared/utils/response.js'
import { ClassesService } from './classes.service.js'
import { classesSchemas, createClassSchema } from './classes.schemas.js'

export const classesRoutes: FastifyPluginAsync = async (fastify) => {
  const classesService = new ClassesService()

  // GET /api/classes
  fastify.get('/', {
    schema: {
      ...classesSchemas.list,
      tags: ['Classes'],
      summary: 'List classes',
      description: 'Lista turmas visíveis para o usuário (root: todas, demais: apenas do tenant)',
      security: [{ bearerAuth: [] }]
    },
    preHandler: [authMiddleware]
  }, async (request) => {
    const query = request.query as {
      school_id?: string
      year?: number
    }

    const classes = await classesService.listClasses(
      {
        userId: request.user.id,
        tenantId: request.user.tenant_id,
        roleId: request.user.role_id
      },
      {
        schoolId: query.school_id,
        year: query.year
      }
    )

    return successResponse(classes)
  })

  // POST /api/classes
  fastify.post('/', {
    schema: {
      tags: ['Classes'],
      summary: 'Create class',
      description: 'Cria nova turma respeitando escopo de tenant do usuário autenticado',
      security: [{ bearerAuth: [] }]
    },
    preHandler: [authMiddleware]
  }, async (request, reply) => {
    const payload = createClassSchema.parse(request.body)
    const createdClass = await classesService.createClass(
      {
        tenantId: request.user.tenant_id,
        roleId: request.user.role_id
      },
      payload
    )

    return reply.status(201).send(successResponse(createdClass, 'Turma criada com sucesso'))
  })

  // DELETE /api/classes/:id
  fastify.delete('/:id', {
    schema: {
      tags: ['Classes'],
      summary: 'Delete class',
      description: 'Exclui turma respeitando escopo de tenant do usuario autenticado',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', format: 'uuid' }
        }
      }
    },
    preHandler: [authMiddleware]
  }, async (request, reply) => {
    const { id } = request.params as { id: string }

    await classesService.deleteClass(
      {
        tenantId: request.user.tenant_id,
        roleId: request.user.role_id
      },
      id
    )

    return reply.status(204).send()
  })
}
