import { supabase } from '../../config/supabase.js'
import { CreateSchoolRequest, School, UpdateSchoolRequest } from '@ticket-system/types'
import { NotFoundError } from '../../shared/errors/AppError.js'

export class SchoolsRepository {
  async findById(id: string): Promise<School> {
    const { data, error } = await supabase
      .from('schools')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      throw new NotFoundError('Escola nao encontrada')
    }

    return data as School
  }

  async findAll() {
    const { data, error } = await supabase
      .from('schools')
      .select('*')
      .order('name', { ascending: true })

    if (error) throw error
    return (data ?? []) as School[]
  }

  async findAllByTenant(tenantId: string) {
    const { data, error } = await supabase
      .from('schools')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('name', { ascending: true })

    if (error) throw error
    return (data ?? []) as School[]
  }

  async create(payload: CreateSchoolRequest & { tenant_id: string }) {
    const { data, error } = await supabase
      .from('schools')
      .insert({
        tenant_id: payload.tenant_id,
        name: payload.name,
        abbreviation: payload.abbreviation,
        active: payload.active ?? true
      })
      .select()
      .single()

    if (error) throw error
    return data as School
  }

  async update(id: string, payload: UpdateSchoolRequest) {
    const { data, error } = await supabase
      .from('schools')
      .update({
        name: payload.name,
        abbreviation: payload.abbreviation,
        active: payload.active ?? true
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as School
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('schools')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  async existsByNameOrAbbreviationInTenant(input: {
    tenantId: string
    name: string
    abbreviation: string
    excludeSchoolId?: string
  }) {
    const { data, error } = await supabase
      .from('schools')
      .select('id, name, abbreviation')
      .eq('tenant_id', input.tenantId)

    if (error) throw error

    const normalizedName = input.name.trim().toLowerCase()
    const normalizedAbbreviation = input.abbreviation.trim().toUpperCase()

    return (data ?? []).some((item) => {
      if (input.excludeSchoolId && item.id === input.excludeSchoolId) {
        return false
      }

      const currentName = String(item.name ?? '').trim().toLowerCase()
      const currentAbbreviation = String(item.abbreviation ?? '').trim().toUpperCase()

      return currentName === normalizedName || currentAbbreviation === normalizedAbbreviation
    })
  }

  async findRoleNameById(roleId: string): Promise<string | null> {
    const { data, error } = await supabase
      .from('roles')
      .select('name')
      .eq('id', roleId)
      .single()

    if (error || !data) return null
    return String(data.name)
  }
}
