import { FastifyPluginAsync } from 'fastify'
import { ValidationError } from '../../shared/errors/AppError.js'
import { authMiddleware } from '../../shared/middlewares/auth.middleware.js'
import { successResponse } from '../../shared/utils/response.js'
import { TeachersService } from './teachers.service.js'
import { createTeacherSchema, teachersSchemas, updateTeacherSchema } from './teachers.schemas.js'
import { saveTeacherAvatarUpload } from '../../uploads/teachers/teachers-avatar-upload.js'

export const teachersRoutes: FastifyPluginAsync = async (fastify) => {
  const teachersService = new TeachersService()

  // GET /api/teachers
  fastify.get('/', {
    schema: {
      ...teachersSchemas.list,
      tags: ['Teachers'],
      summary: 'List teachers',
      description: 'Lista professores visíveis para o usuário (root: todos, demais: apenas do tenant)',
      security: [{ bearerAuth: [] }]
    },
    preHandler: [authMiddleware]
  }, async (request) => {
    const query = request.query as {
      school_id?: string
      active?: boolean
    }

    const teachers = await teachersService.listTeachers(
      {
        tenantId: request.user.tenant_id,
        roleId: request.user.role_id
      },
      {
        schoolId: query.school_id,
        active: query.active
      }
    )

    return successResponse(teachers)
  })

  // PATCH /api/teachers/:id
  fastify.patch('/:id', {
    schema: {
      ...teachersSchemas.update,
      tags: ['Teachers'],
      summary: 'Update teacher',
      description: 'Atualiza professor e disciplinas atribuÃ­das',
      security: [{ bearerAuth: [] }]
    },
    preHandler: [authMiddleware]
  }, async (request) => {
    const { id } = request.params as { id: string }
    const payload = updateTeacherSchema.parse(request.body)

    const teacher = await teachersService.updateTeacher(
      id,
      {
        tenantId: request.user.tenant_id,
        roleId: request.user.role_id
      },
      payload
    )

    return successResponse(teacher, 'Professor atualizado com sucesso')
  })

  // POST /api/teachers
  fastify.post('/', {
    schema: {
      ...teachersSchemas.create,
      tags: ['Teachers'],
      summary: 'Create teacher',
      description: 'Cria professor com disciplinas vinculadas',
      security: [{ bearerAuth: [] }]
    },
    preHandler: [authMiddleware]
  }, async (request, reply) => {
    const payload = createTeacherSchema.parse(request.body)

    const teacher = await teachersService.createTeacher(
      {
        tenantId: request.user.tenant_id,
        roleId: request.user.role_id
      },
      payload
    )

    return reply.status(201).send(successResponse(teacher, 'Professor criado com sucesso'))
  })

  // POST /api/teachers/:id/avatar
  fastify.post('/:id/avatar', {
    preHandler: [authMiddleware]
  }, async (request, reply) => {
    const { id } = request.params as { id: string }

    if (!request.isMultipart || !request.isMultipart()) {
      throw new ValidationError('Envio de arquivo invÃ¡lido')
    }

    let uploadedAvatarUrl: string | null = null
    const host = request.headers.host ?? 'localhost'

    for await (const part of request.parts()) {
      if (part.type !== 'file') continue

      const saved = await saveTeacherAvatarUpload({
        teacherId: id,
        filename: part.filename,
        mimeType: part.mimetype,
        fileStream: part.file
      })

      uploadedAvatarUrl = new URL(saved.url, `${request.protocol}://${host}`).toString()
      break
    }

    if (!uploadedAvatarUrl) {
      throw new ValidationError('Nenhum arquivo enviado')
    }

    const teacher = await teachersService.updateTeacherAvatar(
      id,
      {
        tenantId: request.user.tenant_id,
        roleId: request.user.role_id
      },
      uploadedAvatarUrl
    )

    return reply
      .status(201)
      .send(successResponse(teacher, 'Foto do professor atualizada com sucesso'))
  })

  // DELETE /api/teachers/:id
  fastify.delete('/:id', {
    schema: {
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', format: 'uuid' }
        }
      },
      tags: ['Teachers'],
      summary: 'Delete teacher',
      description: 'Remove professor por id',
      security: [{ bearerAuth: [] }]
    },
    preHandler: [authMiddleware]
  }, async (request, reply) => {
    const { id } = request.params as { id: string }

    await teachersService.deleteTeacher(
      id,
      {
        tenantId: request.user.tenant_id,
        roleId: request.user.role_id
      }
    )

    return reply.status(204).send()
  })
}
