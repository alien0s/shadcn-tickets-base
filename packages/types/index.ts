export interface User {
  id: string
  name: string
  email: string
  avatar_url?: string
  entity_id: string
  role_id: string
  
  created_at: string

  // Campos de autenticação (não retornar para o frontend)
  password_hash?: string
  two_factor_enabled?: boolean
  last_login_at?: string
  is_active?: boolean
  password_reset_token?: string
  password_reset_expires_at?: string
}
// User sem dados sensíveis (para retornar ao frontend)
export interface UserPublic {
  id: string
  name: string
  email: string
  avatar_url?: string
  entity_id: string
  role_id: string
  role_name: string
  created_at: string
  two_factor_enabled: boolean
  last_login_at?: string
  is_active: boolean
}

// DTOs de Autenticação
export interface RegisterRequest {
  name: string
  email: string
  password: string
  entity_id: string
  role_id: string
  avatar_url?: string
}

export interface LoginRequest {
  email: string
  password: string
  two_factor_code?: string
}

export interface LoginResponse {
  user: UserPublic
  token: string
  requires_2fa?: boolean
}

export interface ForgotPasswordRequest {
  email: string
}

export interface ResetPasswordRequest {
  token: string
  new_password: string
}

export interface Enable2FAResponse {
  secret: string
  qr_code: string
  backup_codes: string[]
}

export interface Verify2FARequest {
  code: string
}
// end user
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

export interface HealthResponse {
  status: string
  timestamp: string
  uptime: number
  message: string
}
/**
 * Resposta de login com dados extras
 */
export interface LoginUserResponse extends UserPublic {
  role_name: string
}