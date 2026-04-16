export interface User {
  id: string
  name: string
  last_name?: string
  email: string
  phone?: string
  avatar_url?: string
  department_id?: string
  tenant_id?: string
  tenant_slug?: string
  tenant_name?: string
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
  last_name: string
  email: string
  phone?: string
  avatar_url?: string
  department_id?: string
  tenant_id?: string
  tenant_slug?: string
  tenant_name?: string
  entity_id: string
  role_id: string
  role_name: string
  created_at: string
  two_factor_enabled: boolean
  last_login_at?: string
  is_active: boolean
}
export interface CreateUserRequest {
  name: string
  last_name: string  // ← ADICIONAR
  email: string
  phone?: string
  password: string
  tenant_id?: string
  entity_id: string
  role_id: string
  avatar_url?: string
}

export interface UpdateUserRequest {
  name?: string
  last_name?: string  // ← ADICIONAR
  email?: string
  phone?: string
  avatar_url?: string
  role_id?: string
  is_active?: boolean
}
// DTOs de Autenticação
export interface RegisterRequest {
  name: string
  last_name: string
  email: string
  password: string
  tenant_id?: string
  entity_id?: string
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
  supabase_token?: string
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

export * from './department.types'
export * from './entity.types'
export * from './role.types'
export * from './school.types'
export * from './teacher.types'
export * from './subject.types'
export * from './matrix.types'
export * from './time-slot.types'
export * from './schedule.types'
export * from './class.types'
export * from './tickets.types'
