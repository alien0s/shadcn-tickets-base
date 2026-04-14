import { supabase } from '../../config/supabase.js'
import { User } from '@ticket-system/types'
import { NotFoundError } from '../../shared/errors/AppError.js'

export class UsersRepository {
  private readonly allowedSortFields = ['name', 'email', 'created_at', 'last_name']

  private normalizeEmail(email: string) {
    return email.trim().toLowerCase()
  }

  private getValidSortBy(sortBy: string) {
    return this.allowedSortFields.includes(sortBy) ? sortBy : 'created_at'
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    sortBy: string = 'created_at',
    order: 'asc' | 'desc' = 'desc'
  ) {
    const offset = (page - 1) * limit
    const validSortBy = this.getValidSortBy(sortBy)

    const { data, error, count } = await supabase
      .from('users')
      .select('*', { count: 'exact' })
      .range(offset, offset + limit - 1)
      .order(validSortBy, { ascending: order === 'asc' })

    if (error) throw error

    return { users: data as User[], total: count || 0 }
  }

  async findAllByTenant(
    tenantId: string,
    page: number = 1,
    limit: number = 10,
    sortBy: string = 'created_at',
    order: 'asc' | 'desc' = 'desc'
  ) {
    const offset = (page - 1) * limit
    const validSortBy = this.getValidSortBy(sortBy)

    const { data, error, count } = await supabase
      .from('users')
      .select('*', { count: 'exact' })
      .eq('tenant_id', tenantId)
      .range(offset, offset + limit - 1)
      .order(validSortBy, { ascending: order === 'asc' })

    if (error) throw error

    return { users: data as User[], total: count || 0 }
  }

  async findAllByUserId(
    userId: string,
    page: number = 1,
    limit: number = 10,
    sortBy: string = 'created_at',
    order: 'asc' | 'desc' = 'desc'
  ) {
    const offset = (page - 1) * limit
    const validSortBy = this.getValidSortBy(sortBy)

    const { data, error, count } = await supabase
      .from('users')
      .select('*', { count: 'exact' })
      .eq('id', userId)
      .range(offset, offset + limit - 1)
      .order(validSortBy, { ascending: order === 'asc' })

    if (error) throw error

    return { users: data as User[], total: count || 0 }
  }

  async findAccessContextById(id: string) {
    const { data, error } = await supabase
      .from('users')
      .select('id, tenant_id, department_id, roles(name)')
      .eq('id', id)
      .single()

    if (error || !data) {
      throw new NotFoundError('Usuario nao encontrado')
    }

    const roleRelation = Array.isArray(data.roles) ? data.roles[0] : data.roles

    return {
      id: String(data.id),
      tenant_id: data.tenant_id ? String(data.tenant_id) : undefined,
      department_id: data.department_id ? String(data.department_id) : undefined,
      role_name: roleRelation?.name ? String(roleRelation.name).toLowerCase() : 'client'
    }
  }

  async findById(id: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      throw new NotFoundError('Usuario nao encontrado')
    }

    return data as User
  }

  async findByEmail(email: string) {
    const normalizedEmail = this.normalizeEmail(email)

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .ilike('email', normalizedEmail)
      .limit(1)
      .maybeSingle()

    if (error) return null
    return data as User
  }

  async create(userData: Omit<User, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('users')
      .insert({
        ...userData,
        email: this.normalizeEmail(userData.email)
      })
      .select()
      .single()

    if (error) throw error
    return data as User
  }

  async update(id: string, userData: Partial<User>) {
    const { data, error } = await supabase
      .from('users')
      .update({
        ...userData,
        ...(typeof userData.email === 'string' ? { email: this.normalizeEmail(userData.email) } : {})
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    if (!data) throw new NotFoundError('Usuario nao encontrado')

    return data as User
  }

  async delete(id: string) {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id)

    if (error) throw error
  }
}
