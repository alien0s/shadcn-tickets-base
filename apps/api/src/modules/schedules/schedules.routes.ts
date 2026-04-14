import { FastifyPluginAsync } from 'fastify'
import { authMiddleware } from '../../shared/middlewares/auth.middleware.js'
import { successResponse } from '../../shared/utils/response.js'
import { createScheduleSchema, repositionScheduleSchema, schedulesSchemas } from './schedules.schemas.js'
import { SchedulesService } from './schedules.service.js'

export const schedulesRoutes: FastifyPluginAsync = async (fastify) => {
  const schedulesService = new SchedulesService()

  // GET /api/schedules?teacher_id=...&school_id=...
  fastify.get('/', {
    schema: {
      ...schedulesSchemas.list,
      tags: ['Schedules'],
      summary: 'List schedules by teacher',
      description: 'Lista aulas (schedules) do professor selecionado no escopo de tenant',
      security: [{ bearerAuth: [] }]
    },
    preHandler: [authMiddleware]
  }, async (request) => {
    const query = request.query as {
      teacher_id?: string
      class_id?: string
      school_id?: string
    }

    const schedules = await schedulesService.listSchedules(
      {
        tenantId: request.user.tenant_id,
        roleId: request.user.role_id
      },
      {
        teacherId: query.teacher_id,
        classId: query.class_id,
        schoolId: query.school_id
      }
    )

    return successResponse(schedules)
  })

  // GET /api/schedules/class-conflict?school_id=...&class_id=...&time_slot_id=...&day_of_week=...
  fastify.get('/class-conflict', {
    schema: {
      ...schedulesSchemas.classConflict,
      tags: ['Schedules'],
      summary: 'Check class conflict in slot',
      description: 'Valida se a turma ja possui aula no slot/dia informado',
      security: [{ bearerAuth: [] }]
    },
    preHandler: [authMiddleware]
  }, async (request) => {
    const query = request.query as {
      school_id: string
      class_id: string
      time_slot_id: string
      day_of_week: number
    }

    const conflict = await schedulesService.findClassConflictAtSlot(
      {
        tenantId: request.user.tenant_id,
        roleId: request.user.role_id
      },
      {
        schoolId: query.school_id,
        classId: query.class_id,
        timeSlotId: query.time_slot_id,
        dayOfWeek: query.day_of_week
      }
    )

    return successResponse({
      has_conflict: Boolean(conflict),
      teacher_name: conflict?.teacher_name ?? null
    })
  })

  // POST /api/schedules
  fastify.post('/', {
    schema: {
      tags: ['Schedules'],
      summary: 'Create schedule',
      description: 'Cria uma aula na grade',
      security: [{ bearerAuth: [] }]
    },
    preHandler: [authMiddleware]
  }, async (request, reply) => {
    const payload = createScheduleSchema.parse(request.body)

    const createdSchedule = await schedulesService.createSchedule(
      {
        tenantId: request.user.tenant_id,
        roleId: request.user.role_id
      },
      {
        schoolId: payload.school_id,
        classId: payload.class_id,
        teacherId: payload.teacher_id,
        subjectId: payload.subject_id,
        timeSlotId: payload.time_slot_id,
        dayOfWeek: payload.day_of_week
      }
    )

    return reply.status(201).send(successResponse(createdSchedule, 'Aula criada com sucesso'))
  })

  // POST /api/schedules/reposition
  fastify.post('/reposition', {
    schema: {
      tags: ['Schedules'],
      summary: 'Reposition schedule',
      description: 'Move uma aula para outro slot vazio',
      security: [{ bearerAuth: [] }]
    },
    preHandler: [authMiddleware]
  }, async (request) => {
    const payload = repositionScheduleSchema.parse(request.body)

    const updatedSchedule = await schedulesService.repositionSchedule(
      {
        tenantId: request.user.tenant_id,
        roleId: request.user.role_id
      },
      {
        scheduleId: payload.schedule_id,
        dayOfWeek: payload.day_of_week,
        timeSlotId: payload.time_slot_id
      }
    )

    return successResponse(updatedSchedule, 'Aula reposicionada com sucesso')
  })

  // DELETE /api/schedules/:id
  fastify.delete('/:id', {
    schema: {
      ...schedulesSchemas.remove,
      tags: ['Schedules'],
      summary: 'Delete schedule',
      description: 'Remove uma aula da grade',
      security: [{ bearerAuth: [] }]
    },
    preHandler: [authMiddleware]
  }, async (request, reply) => {
    const { id } = request.params as { id: string }

    await schedulesService.deleteSchedule(id, {
      tenantId: request.user.tenant_id,
      roleId: request.user.role_id
    })

    return reply.status(204).send()
  })
}
