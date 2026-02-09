import { supabase } from '../../config/supabase.js'
import { NotFoundError } from '../../shared/errors/AppError.js'
import type { CreateTicketBody, ListTicketsQuery } from './tickets.schemas.js'

type TicketListRow = {
  id: string
  title: string
  subject: string
  status: {
    id: number
    key: string
    label: string
    order: number
  } | null
  priority: {
    id: number
    key: string
    label: string
    order: number
  } | null
  type: {
    id: number
    key: string
    label: string
  } | null
  created_at: string
  updated_at: string
  requester: {
    id: string
    name: string
    avatar_url?: string | null
  } | null
  assigned_to: {
    id: string
    name: string
    avatar_url?: string | null
  } | null
}

type TicketListRowRaw = Omit<
  TicketListRow,
  'requester' | 'assigned_to' | 'status' | 'priority' | 'type'
> & {
  status:
    | TicketListRow['status']
    | Array<NonNullable<TicketListRow['status']>>
    | null
  priority:
    | TicketListRow['priority']
    | Array<NonNullable<TicketListRow['priority']>>
    | null
  type:
    | TicketListRow['type']
    | Array<NonNullable<TicketListRow['type']>>
    | null
  requester:
    | TicketListRow['requester']
    | Array<NonNullable<TicketListRow['requester']>>
    | null
  assigned_to:
    | TicketListRow['assigned_to']
    | Array<NonNullable<TicketListRow['assigned_to']>>
    | null
}

type TicketMessageRow = {
  id: string
  ticket_id: string
  type: string
  sender_user_id: string | null
  sender_type: string
  content: string | null
  created_at: string
  delivered_at?: string | null
  read_at?: string | null
  user: {
    id: string
    name: string
    avatar_url?: string | null
  } | null
}

type TicketFileRow = {
  id: string
  name: string
  url: string
  type: string
  preview_url?: string | null
  file_size: number
  uploaded_at: string
}

export type TicketDetailRow = {
  id: string
  title: string
  subject: string
  status: {
    id: number
    key: string
    label: string
    order: number
  } | null
  priority: {
    id: number
    key: string
    label: string
    order: number
  } | null
  type: {
    id: number
    key: string
    label: string
  } | null
  requester_user_id: string
  assigned_to_user_id: string | null
  entity_id: string
  os_id: number | null
  os?: {
    id: number
    name: string
    version: string | null
    family: string
  } | null
  browser?: string | null
  created_at: string
  updated_at: string
  resolved_at?: string | null
  requester: {
    id: string
    name: string
    email: string
    avatar_url?: string | null
  } | null
  assigned_to: {
    id: string
    name: string
    avatar_url?: string | null
  } | null
  messages: TicketMessageRow[]
  attachments: TicketFileRow[]
}

export class TicketsRepository {
  async updateStatus(id: string, statusId: number) {
    const { error } = await supabase
      .from('tickets')
      .update({ status_id: statusId })
      .eq('id', id)

    if (error) throw error
  }

  async createTicket(input: CreateTicketBody & { requester_user_id: string; entity_id: string }) {
    const { title, subject, priority, type, os_id, browser, requester_user_id, entity_id } = input

    const [statusResult, priorityResult, typeResult] = await Promise.all([
      supabase.from('ticket_statuses').select('id').eq('key', 'open').single(),
      supabase.from('ticket_priorities').select('id').eq('key', priority).single(),
      supabase.from('ticket_types').select('id').eq('key', type).single()
    ])

    if (statusResult.error) throw statusResult.error
    if (priorityResult.error) throw priorityResult.error
    if (typeResult.error) throw typeResult.error

    const { data, error } = await supabase
      .from('tickets')
      .insert({
        title,
        subject,
        status_id: statusResult.data.id,
        priority_id: priorityResult.data.id,
        type_id: typeResult.data.id,
        requester_user_id,
        entity_id,
        os_id,
        browser
      })
      .select('id')
      .single()

    if (error || !data) throw error

    return data.id as string
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
    const { data, error } = await supabase
      .from('ticket_files')
      .insert({
        name: input.name,
        url: input.url,
        type: input.type,
        preview_url: input.preview_url ?? null,
        file_size: input.file_size,
        uploaded_by_user_id: input.uploaded_by_user_id
      })
      .select()
      .single()

    if (error || !data) throw error

    const relation = await supabase
      .from('ticket_files_relation')
      .insert({
        ticket_id: input.ticket_id,
        file_id: data.id
      })

    if (relation.error) throw relation.error

    return data as TicketFileRow
  }

  async addMessage(input: {
    ticket_id: string
    content: string
    sender_user_id: string
    sender_type: 'agent' | 'customer' | 'system'
    type?: 'text' | 'file' | 'image'
  }) {
    const { data, error } = await supabase
      .from('ticket_messages')
      .insert({
        ticket_id: input.ticket_id,
        type: input.type ?? 'text',
        sender_user_id: input.sender_user_id,
        sender_type: input.sender_type,
        content: input.content
      })
      .select(
        `
        *,
        user:users(id, name, avatar_url)
      `
      )
      .single()

    if (error || !data) throw error
    return data as TicketMessageRow
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
    const message = await this.addMessage({
      ticket_id: input.ticket_id,
      content: input.content,
      sender_user_id: input.sender_user_id,
      sender_type: input.sender_type,
      type: input.message_type
    })

    const { data: fileData, error: fileError } = await supabase
      .from('ticket_files')
      .insert({
        name: input.file.name,
        url: input.file.url,
        type: input.file.type,
        preview_url: input.file.preview_url ?? null,
        file_size: input.file.file_size,
        uploaded_by_user_id: input.file.uploaded_by_user_id
      })
      .select()
      .single()

    if (fileError || !fileData) throw fileError

    const ticketRelation = await supabase
      .from('ticket_files_relation')
      .insert({
        ticket_id: input.ticket_id,
        file_id: fileData.id
      })

    if (ticketRelation.error) throw ticketRelation.error

    const messageRelation = await supabase
      .from('message_files_relation')
      .insert({
        message_id: message.id,
        file_id: fileData.id
      })

    if (messageRelation.error) throw messageRelation.error

    return message
  }

  async findAll(filters: ListTicketsQuery) {
    const { page, limit, status, priority, type, search, sortBy, order, dateFrom, dateTo } = filters
    const offset = (page - 1) * limit

    const sortColumnByKey: Record<ListTicketsQuery['sortBy'], string> = {
      created_at: 'created_at',
      updated_at: 'updated_at',
      priority: 'priority_id',
      status: 'status_id'
    }

    let query = supabase
      .from('tickets')
      .select(
        `
        id,
        title,
        subject,
        status:ticket_statuses(id, key, label, order),
        priority:ticket_priorities(id, key, label, order),
        type:ticket_types(id, key, label),
        created_at,
        updated_at,
        requester:users!requester_user_id(id, name, avatar_url),
        assigned_to:users!assigned_to_user_id(id, name, avatar_url)
      `,
        { count: 'exact' }
      )

    if (status) query = query.eq('ticket_statuses.key', status)
    if (priority) query = query.eq('ticket_priorities.key', priority)
    if (type) query = query.eq('ticket_types.key', type)
    if (search) {
      query = query.or(`title.ilike.%${search}%,subject.ilike.%${search}%`)
    }
    if (dateFrom) query = query.gte('created_at', dateFrom)
    if (dateTo) query = query.lte('created_at', dateTo)

    query = query.order(sortColumnByKey[sortBy], { ascending: order === 'asc' })
    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) throw error

    const tickets = (data ?? []).map((row) => {
      const raw = row as TicketListRowRaw
      const requester = Array.isArray(raw.requester)
        ? raw.requester[0] ?? null
        : raw.requester ?? null
      const assignedTo = Array.isArray(raw.assigned_to)
        ? raw.assigned_to[0] ?? null
        : raw.assigned_to ?? null

      return {
        ...raw,
        requester,
        assigned_to: assignedTo
      } as TicketListRow
    })

    return { tickets, total: count ?? 0 }
  }

  async findById(id: string) {
    const { data, error } = await supabase
      .from('tickets')
      .select(
        `
        *,
        status:ticket_statuses(id, key, label, order),
        priority:ticket_priorities(id, key, label, order),
        type:ticket_types(id, key, label),
        os:operating_systems(id, name, version, family),
        requester:users!requester_user_id(id, name, email, avatar_url),
        assigned_to:users!assigned_to_user_id(id, name, avatar_url),
        messages:ticket_messages(
          id,
          ticket_id,
          type,
          sender_user_id,
          sender_type,
          content,
          created_at,
          delivered_at,
          read_at,
          user:users(id, name, avatar_url)
        ),
        attachments:ticket_files_relation(
          attached_at,
          file:ticket_files(
            id,
            name,
            url,
            type,
            preview_url,
            file_size,
            uploaded_at
          )
        )
      `
      )
      .eq('id', id)
      .order('created_at', { ascending: true, foreignTable: 'ticket_messages' })
      .single()

    if (error || !data) {
      throw new NotFoundError('Ticket não encontrado')
    }

    type TicketAttachmentRelation = {
      file: TicketFileRow | null
    }

    type TicketDetailRowRaw = Omit<TicketDetailRow, 'attachments'> & {
      attachments?: TicketAttachmentRelation[] | null
    }

    const raw = data as TicketDetailRowRaw

    const attachments = (raw.attachments ?? [])
      .map((item) => item.file)
      .filter((file): file is TicketFileRow => Boolean(file))

    return {
      ...raw,
      attachments
    } as TicketDetailRow
  }
}
