import { supabase } from '../../config/supabase.js'
import { School } from '@ticket-system/types'

export class SchoolsRepository {
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

