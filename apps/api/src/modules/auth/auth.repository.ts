import { supabase } from '../../config/supabase.js'
import { User } from '@ticket-system/types'
import { NotFoundError } from '../../shared/errors/AppError.js'

/**
 * Repository de Autenticação
 * Responsável por todas as operações de banco relacionadas à autenticação
 */
export class AuthRepository {

  /**
   * Busca usuário por email
   * @param email - Email do usuário
   * @returns User completo com password_hash
   */
  async findByEmail(email: string): Promise<any | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*, roles(name, scope)')  // ← JOIN com tabela roles
      .eq('email', email)
      .eq('is_active', true)
      .single()

    if (error || !data) return null
    return data
  }

  /**
   * Busca usuário por ID
   */
  async findById(id: string): Promise<any | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*, roles(name, scope)')  // ← JOIN com tabela roles
      .eq('id', id)
      .single()

    if (error || !data) return null
    return data
  }

  /**
   * Cria novo usuário com senha
   */
  async createUser(userData: {
    name: string
    last_name: string
    email: string
    password_hash: string
    entity_id: string
    role_id: string
    avatar_url?: string
  }): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .insert({
        ...userData,
        is_active: true
      })
      .select()
      .single()

    if (error) throw error
    return data as User
  }

  /**
   * Atualiza último login do usuário
   */
  async updateLastLogin(userId: string): Promise<void> {
    const { error } = await supabase
      .from('users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', userId)

    if (error) throw error
  }

  /**
   * Atualiza configuração de 2FA
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
   * Salva token de reset de senha
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
   * Busca usuário por token de reset
   */
  async findByResetToken(token: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('password_reset_token', token)
      .gt('password_reset_expires_at', new Date().toISOString()) // Token não expirado
      .single()

    if (error || !data) return null
    return data as User
  }

  /**
   * Atualiza senha do usuário e limpa token de reset
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
   * Busca ou cria usuário via Microsoft AD
   * Usado no OAuth callback
   */
  async findOrCreateMicrosoftUser(profile: {
    email: string
    name: string
    avatar_url?: string
  }): Promise<User> {
    // Tenta buscar usuário existente
    let user = await this.findByEmail(profile.email)

    if (user) return user

    // Se não existe, cria novo usuário
    // NOTA: Em produção, definir entity_id e role_id padrão ou solicitar na primeira vez
    const { data, error } = await supabase
      .from('users')
      .insert({
        email: profile.email,
        name: profile.name,
        avatar_url: profile.avatar_url,
        entity_id: '550e8400-e29b-41d4-a716-446655440001', // TODO: Definir entidade padrão
        role_id: '650e8400-e29b-41d4-a716-446655440001', // TODO: Definir role padrão
        is_active: true
      })
      .select()
      .single()

    if (error) throw error
    return data as User
  }
}
