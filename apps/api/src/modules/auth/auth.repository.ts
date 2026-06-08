import { User } from '@ticket-system/types'
import { supabase } from '../../config/supabase.js'
import { ServiceUnavailableError } from '../../shared/errors/AppError.js'

/**
 * Repository de autenticacao.
 * Centraliza as consultas de usuarios usadas no fluxo de login.
 */
export class AuthRepository {
  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase()
  }

  /**
   * Busca usuario por email.
   * Retorna o registro completo com password_hash para o login.
   */
  async findByEmail(email: string): Promise<any | null> {
    const normalizedEmail = this.normalizeEmail(email)

    const { data, error } = await supabase
      .from('users')
      .select('*, roles(name, scope), tenants!users_tenant_id_fkey(slug, name)')
      .ilike('email', normalizedEmail)
      .eq('is_active', true)
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error('[AuthRepository.findByEmail] Supabase error', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      })

      throw new ServiceUnavailableError(
        'Nao foi possivel validar seu login agora. O servico de autenticacao esta indisponivel.'
      )
    }

    if (!data) return null
    return data
  }

  /**
   * Busca usuario por ID.
   */
  async findById(id: string): Promise<any | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*, roles(name, scope), tenants!users_tenant_id_fkey(slug, name)')
      .eq('id', id)
      .single()

    if (error || !data) return null
    return data
  }

  /**
   * Cria novo usuario com senha.
   */
  async createUser(userData: {
    name: string
    last_name: string
    email: string
    password_hash: string
    tenant_id?: string
    entity_id: string
    role_id: string
    avatar_url?: string
  }): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .insert({
        ...userData,
        email: this.normalizeEmail(userData.email),
        is_active: true
      })
      .select()
      .single()

    if (error) throw error
    return data as User
  }

  /**
   * Atualiza ultimo login do usuario.
   */
  async updateLastLogin(userId: string): Promise<void> {
    const { error } = await supabase
      .from('users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', userId)

    if (error) throw error
  }

  /**
   * Atualiza configuracao de 2FA.
   */
  async update2FASettings(userId: string, enabled: boolean, secret?: string): Promise<void> {
    const { error } = await supabase
      .from('users')
      .update({
        two_factor_enabled: enabled,
        two_factor_secret: secret || null
      })
      .eq('id', userId)

    if (error) throw error
  }

  /**
   * Salva token de reset de senha.
   */
  async savePasswordResetToken(userId: string, token: string, expiresAt: Date): Promise<void> {
    const { error } = await supabase
      .from('users')
      .update({
        password_reset_token: token,
        password_reset_expires_at: expiresAt.toISOString()
      })
      .eq('id', userId)

    if (error) throw error
  }

  /**
   * Busca usuario por token de reset.
   */
  async findByResetToken(token: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('password_reset_token', token)
      .gt('password_reset_expires_at', new Date().toISOString())
      .single()

    if (error || !data) return null
    return data as User
  }

  /**
   * Atualiza senha do usuario e limpa token de reset.
   */
  async updatePassword(userId: string, passwordHash: string): Promise<void> {
    const { error } = await supabase
      .from('users')
      .update({
        password_hash: passwordHash,
        password_reset_token: null,
        password_reset_expires_at: null
      })
      .eq('id', userId)

    if (error) throw error
  }

  /**
   * Busca ou cria usuario via Microsoft AD.
   */
  async findOrCreateMicrosoftUser(profile: {
    email: string
    name: string
    avatar_url?: string
  }): Promise<User> {
    const user = await this.findByEmail(profile.email)

    if (user) return user

    const { data, error } = await supabase
      .from('users')
      .insert({
        email: profile.email,
        name: profile.name,
        avatar_url: profile.avatar_url,
        entity_id: '550e8400-e29b-41d4-a716-446655440001',
        role_id: '650e8400-e29b-41d4-a716-446655440001',
        is_active: true
      })
      .select()
      .single()

    if (error) throw error
    return data as User
  }
}
