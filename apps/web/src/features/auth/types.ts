/**
 * Papéis do usuário (simplificado)
 */
export type UserRole = "root" | "admin" | "agent" | "client"

/**
 * Modelo do usuário autenticado
 */
export type AuthUser = {
  id: string
  name: string
  last_name?: string
  email: string
  phone?: string
  role: UserRole
  avatar_url?: string
  department_id?: string
  tenant_id: string
  tenant_slug?: string
  tenant_name?: string
  entity_id: string
  role_id: string
  two_factor_enabled: boolean
  last_login_at?: string
  is_active: boolean
  os_id?: number
  browser?: string
}

/**
 * Payload de login
 */
export type LoginPayload = {
  email: string
  password: string
}

/**
 * Payload de cadastro
 */
export type RegisterPayload = {
  name: string
  last_name: string
  email: string
  password: string
  tenant_id?: string
  entity_id?: string
  role_id: string
  avatar_url?: string
}

/**
 * Resposta de login da API
 */
export type LoginResponse = {
  user?: AuthUser & { role_name?: string }  // ← API retorna role_name
  token?: string
  supabase_token?: string
  requires_2fa?: boolean
}
