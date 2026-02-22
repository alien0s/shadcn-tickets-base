import { TicketsRepository } from './tickets.repository.js'
import type { CreateTicketBody, CreateTicketMessageBody, ListTicketsQuery } from './tickets.schemas.js'
import { AppError } from '../../shared/errors/AppError.js'

type AuthUser = {
  id: string
  entity_id: string
  role_id: string
}

export class TicketsService {
  private repository: TicketsRepository

  constructor() {
    this.repository = new TicketsRepository()
  }

  private async resolveRoleName(roleId: string) {
    const roleName = await this.repository.getRoleNameById(roleId)
    return roleName ?? 'Client'
  }

  async listTickets(user: AuthUser, filters: ListTicketsQuery) {
    const roleName = await this.resolveRoleName(user.role_id)
    return this.repository.findAll({ userId: user.id, roleName }, filters)
  }

  async getTicketById(id: string, user: AuthUser) {
    const ticket = await this.repository.findById(id)
    const roleName = await this.resolveRoleName(user.role_id)
    const isAdminOrAgent = roleName === 'Admin' || roleName === 'Agent'

    const canAccess =
      isAdminOrAgent ||
      ticket.requester_user_id === user.id ||
      ticket.assigned_to_user_id === user.id

    if (!canAccess) {
      throw new AppError('Acesso negado', 403, 'FORBIDDEN')
    }

    return ticket
  }

  async markTicketRead(ticketId: string, user: AuthUser) {
    const ticket = await this.repository.getTicketAccess(ticketId)
    const roleName = await this.resolveRoleName(user.role_id)
    const isAdminOrAgent = roleName === 'Admin' || roleName === 'Agent'
    const canAccess =
      isAdminOrAgent ||
      ticket.requester_user_id === user.id ||
      ticket.assigned_to_user_id === user.id

    if (!canAccess) {
      throw new AppError('Acesso negado', 403, 'FORBIDDEN')
    }

    return this.repository.markAsRead({
      ticket_id: ticketId,
      user_id: user.id
    })
  }

  async createTicket(payload: CreateTicketBody, requester: { id: string; entity_id: string }) {
    const ticketId = await this.repository.createTicket({
      ...payload,
      requester_user_id: requester.id,
      entity_id: requester.entity_id
    })

    return this.repository.findById(ticketId)
  }

  async addAttachment(input: {
    ticket_id: string
    name: string
    url: string
    type: string
    preview_url?: string | null
    file_size: number
    uploaded_by_user_id: string
  }) {
    return this.repository.addAttachment(input)
  }

  async addMessage(
    ticketId: string,
    payload: CreateTicketMessageBody,
    requester: { id: string; role_id?: string }
  ) {
    if (requester.role_id) {
      const roleName = await this.resolveRoleName(requester.role_id)
      if (roleName === 'Agent') {
        await this.repository.assignToAgentIfEmpty(ticketId, requester.id)
      }
    }

    return this.repository.addMessage({
      ticket_id: ticketId,
      content: payload.content,
      sender_user_id: requester.id,
      sender_type: 'customer'
    })
  }

  async addMessageWithAttachment(input: {
    ticket_id: string
    content: string
    sender_user_id: string
    sender_type: 'agent' | 'customer' | 'system'
    message_type: 'file' | 'image'
    file: {
      name: string
      url: string
      type: string
      preview_url?: string | null
      file_size: number
      uploaded_by_user_id: string
    }
    requester_role_id?: string
  }) {
    if (input.requester_role_id) {
      const roleName = await this.resolveRoleName(input.requester_role_id)
      if (roleName === 'Agent') {
        await this.repository.assignToAgentIfEmpty(input.ticket_id, input.sender_user_id)
      }
    }

    return this.repository.addMessageWithAttachment(input)
  }

  async closeTicket(id: string) {
    await this.repository.updateStatus(id, 3)
    return this.repository.findById(id)
  }
}
