/**
 * Papéis do usuário (simplificado)
 */
export type UserRole = "admin" | "agent" | "client"

/**
 * Modelo do usuário autenticado
 */
export type AuthUser = {
  id: string
  name: string
  email: string
  role: UserRole
  avatar_url?: string
  entity_id: string
  role_id: string
  two_factor_enabled: boolean
  last_login_at?: string
  is_active: boolean
}

/**
 * Payload de login
 */
export type LoginPayload = {
  email: string
  password: string
}

/**
 * Resposta de login da API
 */
export type LoginResponse = {
  user?: AuthUser & { role_name?: string }  // ← API retorna role_name
  token?: string
  requires_2fa?: boolean
}
