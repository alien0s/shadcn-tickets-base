import { supabase } from '../../config/supabase.js'
import { NotFoundError } from '../../shared/errors/AppError.js'
import type { CreateTicketBody, ListTicketsQuery } from './tickets.schemas.js'

type TicketListRow = {
  id: string
  title: string
  subject: string
  unread_count: number
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
  'requester' | 'assigned_to' | 'status' | 'priority' | 'type' | 'unread_count'
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
    phone: string | null
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
  private async touchTicketUpdatedAt(ticketId: string) {
    const { error } = await supabase
      .from('tickets')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', ticketId)

    if (error) {
      console.error('Erro ao atualizar updated_at do ticket:', error)
    }
  }

  async getRoleNameById(roleId: string) {
    const { data, error } = await supabase
      .from('roles')
      .select('name')
      .eq('id', roleId)
      .single()

    if (error || !data) return null

    return data.name as string
  }

  async getTicketAccess(id: string) {
    const { data, error } = await supabase
      .from('tickets')
      .select('id, requester_user_id, assigned_to_user_id')
      .eq('id', id)
      .single()

    if (error || !data) {
      throw new NotFoundError('Ticket não encontrado')
    }

    return data as {
      id: string
      requester_user_id: string
      assigned_to_user_id: string | null
    }
  }

  async markAsRead(input: { ticket_id: string; user_id: string }) {
    const { data: lastMessage, error: lastMessageError } = await supabase
      .from('ticket_messages')
      .select('id')
      .eq('ticket_id', input.ticket_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (lastMessageError) throw lastMessageError

    const { error } = await supabase
      .from('ticket_user_reads')
      .upsert(
        {
          ticket_id: input.ticket_id,
          user_id: input.user_id,
          last_read_at: new Date().toISOString(),
          last_read_message_id: lastMessage?.id ?? null
        },
        { onConflict: 'ticket_id,user_id' }
      )

    if (error) throw error

    return {
      ticket_id: input.ticket_id,
      marked_read_at: new Date().toISOString()
    }
  }

  async updateStatus(id: string, statusId: number) {
    const { error } = await supabase
      .from('tickets')
      .update({ status_id: statusId })
      .eq('id', id)

    if (error) throw error
  }

  async assignToAgentIfEmpty(ticketId: string, agentId: string) {
    const { error } = await supabase
      .from('tickets')
      .update({ assigned_to_user_id: agentId })
      .eq('id', ticketId)
      .is('assigned_to_user_id', null)

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
    await this.touchTicketUpdatedAt(input.ticket_id)
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

  async findAll(
    input: { userId: string; roleName: string },
    filters: ListTicketsQuery
  ) {
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

    const isAdminOrAgent = input.roleName === 'Admin' || input.roleName === 'Agent'
    if (!isAdminOrAgent) {
      query = query.or(
        `requester_user_id.eq.${input.userId},assigned_to_user_id.eq.${input.userId}`
      )
    }

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

    const ids = (data ?? []).map((row) => (row as TicketListRowRaw).id)
    let unreadByTicket = new Map<string, number>()

    if (ids.length > 0) {
      const { data: unreadRows, error: unreadError } = await supabase
        .from('ticket_unread_counts')
        .select('ticket_id, unread_count')
        .eq('user_id', input.userId)
        .in('ticket_id', ids)

      if (unreadError) throw unreadError

      unreadByTicket = new Map(
        (unreadRows ?? []).map((row) => [row.ticket_id as string, row.unread_count as number])
      )
    }

    const tickets = (data ?? []).map((row) => {
      const raw = row as TicketListRowRaw
      const unread_count = unreadByTicket.get(raw.id) ?? 0
      const requester = Array.isArray(raw.requester)
        ? raw.requester[0] ?? null
        : raw.requester ?? null
      const assignedTo = Array.isArray(raw.assigned_to)
        ? raw.assigned_to[0] ?? null
        : raw.assigned_to ?? null

      return {
        ...raw,
        unread_count,
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
        requester:users!requester_user_id(id, name, email, phone, avatar_url),
        assigned_to:users!assigned_to_user_id(id, name, avatar_url)
      `
      )
      .eq('id', id)
      .single()

    if (error || !data) {
      throw new NotFoundError('Ticket não encontrado')
    }

    const { data: messagesData, error: messagesError } = await supabase
      .from('ticket_messages')
      .select(
        `
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
      `
      )
      .eq('ticket_id', id)
      .order('created_at', { ascending: true })

    if (messagesError) throw messagesError

    const { data: attachmentsRelationData, error: attachmentsError } = await supabase
      .from('ticket_files_relation')
      .select(
        `
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
      `
      )
      .eq('ticket_id', id)

    if (attachmentsError) throw attachmentsError

    type TicketAttachmentRelation = {
      file: TicketFileRow | null
    }

    type TicketMessageRowRaw = Omit<TicketMessageRow, 'user'> & {
      user: TicketMessageRow['user'] | Array<NonNullable<TicketMessageRow['user']>>
    }

    type TicketAttachmentRelationRaw = {
      file: TicketFileRow | TicketFileRow[] | null
    }

    type TicketDetailRowRaw = Omit<TicketDetailRow, 'attachments' | 'messages'>

    const raw = data as TicketDetailRowRaw
    const messageRows = ((messagesData ?? []) as TicketMessageRowRaw[]).map((row) => ({
      ...row,
      user: Array.isArray(row.user) ? row.user[0] ?? null : row.user ?? null
    }))

    const attachmentRows = ((attachmentsRelationData ?? []) as TicketAttachmentRelationRaw[])
      .map((row) => ({
        file: Array.isArray(row.file) ? row.file[0] ?? null : row.file ?? null
      })) as TicketAttachmentRelation[]

    const attachments = attachmentRows
      .map((item) => item.file)
      .filter((file): file is TicketFileRow => Boolean(file))

    return {
      ...raw,
      messages: messageRows,
      attachments
    } as TicketDetailRow
  }
}
