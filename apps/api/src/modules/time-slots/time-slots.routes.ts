import { FastifyPluginAsync } from 'fastify'
import { authMiddleware } from '../../shared/middlewares/auth.middleware.js'
import { successResponse } from '../../shared/utils/response.js'
import {
  createTimeSlotSchema,
  createTimeSlotsGradeSchema,
  deleteTimeSlotsGradeSchema,
  importTimeSlotsGradeSchema,
  timeSlotsSchemas
} from './time-slots.schemas.js'
import { TimeSlotsService } from './time-slots.service.js'

export const timeSlotsRoutes: FastifyPluginAsync = async (fastify) => {
  const timeSlotsService = new TimeSlotsService()

  // GET /api/time-slots?school_id=...
  fastify.get('/', {
    schema: {
      ...timeSlotsSchemas.list,
      tags: ['TimeSlots'],
      summary: 'List time slots',
      description: 'Lista horários da escola informada (root: todos, demais: apenas do tenant)',
      security: [{ bearerAuth: [] }]
    },
    preHandler: [authMiddleware]
  }, async (request) => {
    const query = request.query as {
      school_id: string
      shift?: number
    }

    const timeSlots = await timeSlotsService.listTimeSlots(
      {
        tenantId: request.user.tenant_id,
        roleId: request.user.role_id
      },
      {
        schoolId: query.school_id,
        shift: query.shift
      }
    )

    return successResponse(timeSlots)
  })

  fastify.post('/generate', {
    schema: {
      ...timeSlotsSchemas.createGrade,
      tags: ['TimeSlots'],
      summary: 'Create school grade time slots',
      description: 'Cria toda a grade de horarios da escola em lote, incluindo intervalos',
      security: [{ bearerAuth: [] }]
    },
    preHandler: [authMiddleware]
  }, async (request, reply) => {
    const payload = createTimeSlotsGradeSchema.parse(request.body)
    const createdTimeSlots = await timeSlotsService.createGrade(
      {
        tenantId: request.user.tenant_id,
        roleId: request.user.role_id
      },
      payload
    )

    return reply.status(201).send(successResponse(createdTimeSlots, 'Grade criada com sucesso'))
  })

  fastify.post('/import', {
    schema: {
      ...timeSlotsSchemas.importGrade,
      tags: ['TimeSlots'],
      summary: 'Import school grade time slots',
      description: 'Importa a grade de horarios de outra escola para a escola destino',
      security: [{ bearerAuth: [] }]
    },
    preHandler: [authMiddleware]
  }, async (request) => {
    const payload = importTimeSlotsGradeSchema.parse(request.body)
    const importedTimeSlots = await timeSlotsService.importGrade(
      {
        tenantId: request.user.tenant_id,
        roleId: request.user.role_id
      },
      payload
    )

    return successResponse(importedTimeSlots, 'Grade importada com sucesso')
  })

  fastify.delete('/school/:school_id', {
    schema: {
      ...timeSlotsSchemas.deleteGrade,
      tags: ['TimeSlots'],
      summary: 'Delete school grade time slots',
      description: 'Remove toda a grade de horarios da escola',
      security: [{ bearerAuth: [] }]
    },
    preHandler: [authMiddleware]
  }, async (request) => {
    const params = deleteTimeSlotsGradeSchema.parse(request.params)

    await timeSlotsService.deleteGrade(
      {
        tenantId: request.user.tenant_id,
        roleId: request.user.role_id
      },
      params.school_id
    )

    return successResponse(null, 'Grade excluida com sucesso')
  })

  // POST /api/time-slots
  fastify.post('/', {
    schema: {
      tags: ['TimeSlots'],
      summary: 'Create time slot',
      description: 'Cria horário para uma escola, respeitando o escopo de tenant',
      security: [{ bearerAuth: [] }]
    },
    preHandler: [authMiddleware]
  }, async (request, reply) => {
    const payload = createTimeSlotSchema.parse(request.body)
    const createdTimeSlot = await timeSlotsService.createTimeSlot(
      {
        tenantId: request.user.tenant_id,
        roleId: request.user.role_id
      },
      payload
    )

    return reply.status(201).send(successResponse(createdTimeSlot, 'Horário criado com sucesso'))
  })
}
