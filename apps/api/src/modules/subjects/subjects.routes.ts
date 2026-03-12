import { FastifyPluginAsync } from 'fastify'
import { authMiddleware } from '../../shared/middlewares/auth.middleware.js'
import { successResponse } from '../../shared/utils/response.js'
import { createSubjectSchema, subjectsSchemas } from './subjects.schemas.js'
import { SubjectsService } from './subjects.service.js'

export const subjectsRoutes: FastifyPluginAsync = async (fastify) => {
  const subjectsService = new SubjectsService()

  // GET /api/subjects
  fastify.get('/', {
    schema: {
      ...subjectsSchemas.list,
      tags: ['Subjects'],
      summary: 'List subjects',
      description: 'Lista disciplinas',
      security: [{ bearerAuth: [] }]
    },
    preHandler: [authMiddleware]
  }, async () => {
    const subjects = await subjectsService.listSubjects()
    return successResponse(subjects)
  })

  // POST /api/subjects
  fastify.post('/', {
    schema: {
      tags: ['Subjects'],
      summary: 'Create subject',
      description: 'Cria disciplina (somente root ou departamento administrativo)',
      security: [{ bearerAuth: [] }]
    },
    preHandler: [authMiddleware]
  }, async (request, reply) => {
    const payload = createSubjectSchema.parse(request.body)
    const subject = await subjectsService.createSubject(
      {
        userId: request.user.id,
        roleId: request.user.role_id
      },
      payload
    )

    return reply.status(201).send(successResponse(subject, 'Disciplina criada com sucesso'))
  })
}
