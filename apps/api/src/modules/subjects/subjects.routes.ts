import { FastifyPluginAsync } from 'fastify'
import { authMiddleware } from '../../shared/middlewares/auth.middleware.js'
import { successResponse } from '../../shared/utils/response.js'
import {
  createSubjectSchema,
  subjectIdParamsSchema,
  subjectsSchemas,
  updateSubjectSchema
} from './subjects.schemas.js'
import { SubjectsService } from './subjects.service.js'

export const subjectsRoutes: FastifyPluginAsync = async (fastify) => {
  const subjectsService = new SubjectsService()

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

  fastify.post('/', {
    schema: {
      tags: ['Subjects'],
      summary: 'Create subject',
      description: 'Cria disciplina',
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

  fastify.patch('/:id', {
    schema: {
      ...subjectsSchemas.update,
      tags: ['Subjects'],
      summary: 'Update subject',
      description: 'Atualiza disciplina e ícone',
      security: [{ bearerAuth: [] }]
    },
    preHandler: [authMiddleware]
  }, async (request) => {
    const params = subjectIdParamsSchema.parse(request.params)
    const payload = updateSubjectSchema.parse(request.body)

    const subject = await subjectsService.updateSubject(
      {
        userId: request.user.id,
        roleId: request.user.role_id
      },
      params.id,
      payload
    )

    return successResponse(subject, 'Disciplina atualizada com sucesso')
  })
}
