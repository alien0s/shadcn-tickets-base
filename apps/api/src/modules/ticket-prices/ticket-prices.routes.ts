import { FastifyPluginAsync } from 'fastify'
import { authMiddleware } from '../../shared/middlewares/auth.middleware.js'
import { successResponse } from '../../shared/utils/response.js'
import {
  createTicketPriceSchema,
  listTicketPricesQuerySchema,
  ticketPriceIdParamsSchema,
  ticketPricesSchemas,
  updateTicketPriceSchema
} from './ticket-prices.schemas.js'
import { TicketPricesService } from './ticket-prices.service.js'

export const ticketPricesRoutes: FastifyPluginAsync = async (fastify) => {
  const ticketPricesService = new TicketPricesService()

  fastify.get('/', {
    schema: {
      ...ticketPricesSchemas.list,
      tags: ['Ticket Prices'],
      summary: 'List ticket prices',
      description: 'Lista precos de ticket visiveis para o usuario autenticado',
      security: [{ bearerAuth: [] }]
    },
    preHandler: [authMiddleware]
  }, async (request) => {
    const query = listTicketPricesQuerySchema.parse(request.query)

    const ticketPrices = await ticketPricesService.listTicketPrices(
      {
        tenantId: request.user.tenant_id,
        roleId: request.user.role_id
      },
      {
        schoolId: query.school_id,
        subjectId: query.subject_id,
        educationLevelId: query.education_level_id
      }
    )

    return successResponse(ticketPrices)
  })

  fastify.get('/:id', {
    schema: {
      ...ticketPricesSchemas.getById,
      tags: ['Ticket Prices'],
      summary: 'Get ticket price by id',
      description: 'Busca um preco de ticket por id',
      security: [{ bearerAuth: [] }]
    },
    preHandler: [authMiddleware]
  }, async (request) => {
    const params = ticketPriceIdParamsSchema.parse(request.params)

    const ticketPrice = await ticketPricesService.getTicketPriceById(
      {
        tenantId: request.user.tenant_id,
        roleId: request.user.role_id
      },
      params.id
    )

    return successResponse(ticketPrice)
  })

  fastify.post('/', {
    schema: {
      ...ticketPricesSchemas.create,
      tags: ['Ticket Prices'],
      summary: 'Create ticket price',
      description: 'Cria um preco de ticket por escola, disciplina e nivel educacional',
      security: [{ bearerAuth: [] }]
    },
    preHandler: [authMiddleware]
  }, async (request, reply) => {
    const payload = createTicketPriceSchema.parse(request.body)

    const ticketPrice = await ticketPricesService.createTicketPrice(
      {
        tenantId: request.user.tenant_id,
        roleId: request.user.role_id
      },
      payload
    )

    return reply.status(201).send(successResponse(ticketPrice, 'Preco de ticket criado com sucesso'))
  })

  fastify.patch('/:id', {
    schema: {
      ...ticketPricesSchemas.update,
      tags: ['Ticket Prices'],
      summary: 'Update ticket price',
      description: 'Atualiza um preco de ticket existente',
      security: [{ bearerAuth: [] }]
    },
    preHandler: [authMiddleware]
  }, async (request) => {
    const params = ticketPriceIdParamsSchema.parse(request.params)
    const payload = updateTicketPriceSchema.parse(request.body)

    const ticketPrice = await ticketPricesService.updateTicketPrice(
      {
        tenantId: request.user.tenant_id,
        roleId: request.user.role_id
      },
      params.id,
      payload
    )

    return successResponse(ticketPrice, 'Preco de ticket atualizado com sucesso')
  })
}
