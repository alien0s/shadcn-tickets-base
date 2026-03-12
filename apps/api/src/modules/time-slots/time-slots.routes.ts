import { FastifyPluginAsync } from 'fastify'
import { authMiddleware } from '../../shared/middlewares/auth.middleware.js'
import { successResponse } from '../../shared/utils/response.js'
import { createTimeSlotSchema, timeSlotsSchemas } from './time-slots.schemas.js'
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
