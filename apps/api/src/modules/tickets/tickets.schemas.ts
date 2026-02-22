import { z } from 'zod'

export const TicketStatus = z.enum([
  'open',
  'pending',
  'closed'
])

export const TicketPriority = z.enum(['low', 'normal', 'high'])
export const TicketType = z.enum(['error', 'suggestion', 'question'])

const listTicketsQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  status: TicketStatus.optional(),
  priority: TicketPriority.optional(),
  type: TicketType.optional(),
  search: z.string().trim().min(1).optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  sortBy: z.enum(['created_at', 'updated_at', 'priority', 'status']).default('created_at'),
  order: z.enum(['asc', 'desc']).default('desc')
})

const getTicketByIdParamsSchema = z.object({
  id: z.string().uuid()
})

const createTicketBodySchema = z.object({
  title: z.string().trim().min(3).max(500),
  subject: z.string().trim().min(3).max(5000),
  priority: TicketPriority,
  type: TicketType,
  os_id: z.number().int().positive().optional(),
  browser: z.string().trim().max(255).optional()
})

const createTicketMessageBodySchema = z.object({
  content: z.string().trim().min(1).max(4000)
})

const closeTicketParamsSchema = z.object({
  id: z.string().uuid()
})

const markAsReadParamsSchema = z.object({
  id: z.string().uuid()
})

export const ticketsSchemas = {
  list: {
    querystring: listTicketsQuerySchema
  },
  getById: {
    params: getTicketByIdParamsSchema
  },
  create: {
    body: createTicketBodySchema
  },
  createMessage: {
    body: createTicketMessageBodySchema
  },
  close: {
    params: closeTicketParamsSchema
  },
  markAsRead: {
    params: markAsReadParamsSchema
  }
}

export type ListTicketsQuery = z.infer<typeof listTicketsQuerySchema>
export type GetTicketByIdParams = z.infer<typeof getTicketByIdParamsSchema>
export type CreateTicketBody = z.infer<typeof createTicketBodySchema>
export type CreateTicketMessageBody = z.infer<typeof createTicketMessageBodySchema>
export type CloseTicketParams = z.infer<typeof closeTicketParamsSchema>
export type MarkAsReadParams = z.infer<typeof markAsReadParamsSchema>
