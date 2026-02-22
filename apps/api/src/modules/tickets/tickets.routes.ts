import { FastifyPluginAsync } from 'fastify'
import { TicketsService } from './tickets.service.js'
import { ticketsSchemas } from './tickets.schemas.js'
import { authMiddleware } from '../../shared/middlewares/auth.middleware.js'
import { paginatedResponse, successResponse } from '../../shared/utils/response.js'
import { ValidationError } from '../../shared/errors/AppError.js'
import { saveTicketUpload } from '../../uploads/tickets/tickets-upload.js'
import { saveTicketMessageUpload } from '../../uploads/tickets/messages-upload.js'

export const ticketsRoutes: FastifyPluginAsync = async (fastify) => {
  const ticketsService = new TicketsService()

  // GET /api/tickets
  fastify.get('/', {
    preHandler: [authMiddleware]
  }, async (request) => {
    const filters = ticketsSchemas.list.querystring.parse(request.query)
    const { tickets, total } = await ticketsService.listTickets(request.user, filters)
    return paginatedResponse(tickets, total, filters.page, filters.limit)
  })

  // GET /api/tickets/:id
  fastify.get('/:id', {
    preHandler: [authMiddleware]
  }, async (request) => {
    const { id } = ticketsSchemas.getById.params.parse(request.params)
    const ticket = await ticketsService.getTicketById(id, request.user)
    ticketsService
      .markTicketRead(id, request.user)
      .catch((error) => console.error('Erro ao marcar ticket como lido:', error))
    return successResponse(ticket)
  })

  // POST /api/tickets
  fastify.post('/', {
    preHandler: [authMiddleware]
  }, async (request, reply) => {
    const payload = ticketsSchemas.create.body.parse(request.body)
    const ticket = await ticketsService.createTicket(payload, request.user)
    return reply.status(201).send(successResponse(ticket, 'Ticket criado com sucesso'))
  })

  // POST /api/tickets/:id/attachments
  fastify.post('/:id/attachments', {
    preHandler: [authMiddleware]
  }, async (request, reply) => {
    const { id } = ticketsSchemas.getById.params.parse(request.params)
    const parts = request.parts()
    const uploaded = []

    for await (const part of parts) {
      if (part.type !== 'file') continue

      const saved = await saveTicketUpload({
        ticketId: id,
        filename: part.filename,
        mimeType: part.mimetype,
        fileStream: part.file
      })

      const fileRecord = await ticketsService.addAttachment({
        ticket_id: id,
        name: saved.originalName,
        url: saved.url,
        type: saved.mimeType,
        preview_url: saved.mimeType.startsWith('image/') ? saved.url : null,
        file_size: saved.size,
        uploaded_by_user_id: request.user.id
      })

      uploaded.push(fileRecord)
    }

    if (uploaded.length === 0) {
      throw new ValidationError('Nenhum arquivo enviado')
    }

    return reply
      .status(201)
      .send(successResponse(uploaded, 'Anexos adicionados com sucesso'))
  })

  // POST /api/tickets/:id/messages
  fastify.post('/:id/messages', {
    preHandler: [authMiddleware]
  }, async (request, reply) => {
    const { id } = ticketsSchemas.getById.params.parse(request.params)
    if (request.isMultipart && request.isMultipart()) {
      let content = ''
      const createdMessages = []

      for await (const part of request.parts()) {
        if (part.type === 'field' && part.fieldname === 'content') {
          content = String(part.value ?? '')
          continue
        }

        if (part.type !== 'file') continue

        const saved = await saveTicketMessageUpload({
          ticketId: id,
          filename: part.filename,
          mimeType: part.mimetype,
          fileStream: part.file
        })

        const messageType = saved.mimeType.startsWith('image/') ? 'image' : 'file'
        const message = await ticketsService.addMessageWithAttachment({
          ticket_id: id,
          content: saved.url,
          sender_user_id: request.user.id,
          sender_type: 'customer',
          message_type: messageType,
          requester_role_id: request.user.role_id,
          file: {
            name: saved.originalName,
            url: saved.url,
            type: saved.mimeType,
            preview_url: messageType === 'image' ? saved.url : null,
            file_size: saved.size,
            uploaded_by_user_id: request.user.id
          }
        })

        createdMessages.push(message)
      }

      if (content.trim().length > 0) {
        const message = await ticketsService.addMessage(
          id,
          { content: content.trim() },
          request.user
        )
        createdMessages.push(message)
      }

      if (createdMessages.length === 0) {
        throw new ValidationError('Nenhuma mensagem enviada')
      }

      return reply
        .status(201)
        .send(successResponse(createdMessages, 'Mensagem enviada'))
    }

    const payload = ticketsSchemas.createMessage.body.parse(request.body)
    const message = await ticketsService.addMessage(id, payload, request.user)
    return reply.status(201).send(successResponse(message, 'Mensagem enviada'))
  })

  // PATCH /api/tickets/:id/close
  fastify.patch('/:id/close', {
    preHandler: [authMiddleware]
  }, async (request, reply) => {
    const { id } = ticketsSchemas.close.params.parse(request.params)
    const ticket = await ticketsService.closeTicket(id)
    return reply.status(200).send(successResponse(ticket, 'Ticket fechado com sucesso'))
  })

  // POST /api/tickets/:id/mark-as-read
  fastify.post('/:id/mark-as-read', {
    preHandler: [authMiddleware]
  }, async (request, reply) => {
    const { id } = ticketsSchemas.getById.params.parse(request.params)
    const result = await ticketsService.markTicketRead(id, request.user)
    return reply.status(200).send(successResponse(result))
  })
}
