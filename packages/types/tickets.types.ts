export interface Ticket {
  id: string
  title: string
  subject: string
  status_id: number
  priority_id: number
  type_id: number
  requester_user_id: string
  entity_id: string
  assigned_to_user_id?: string
  os_id?: number
  browser?: string
  created_at: string
  updated_at: string
  resolved_at?: string
}

export interface ChatMessage {
  id: string
  ticket_id: string
  type: 'text' | 'file' | 'image' | 'system'
  sender_user_id?: string
  sender_type: 'agent' | 'customer' | 'system'
  content?: string
  created_at: string
  delivered_at?: string
  read_at?: string
}