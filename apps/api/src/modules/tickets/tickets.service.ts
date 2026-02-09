import { TicketsRepository } from './tickets.repository.js'
import type { CreateTicketBody, CreateTicketMessageBody, ListTicketsQuery } from './tickets.schemas.js'

export class TicketsService {
  private repository: TicketsRepository

  constructor() {
    this.repository = new TicketsRepository()
  }

  async listTickets(filters: ListTicketsQuery) {
    return this.repository.findAll(filters)
  }

  async getTicketById(id: string) {
    return this.repository.findById(id)
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
    requester: { id: string }
  ) {
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
  }) {
    return this.repository.addMessageWithAttachment(input)
  }

  async closeTicket(id: string) {
    await this.repository.updateStatus(id, 3)
    return this.repository.findById(id)
  }
}
