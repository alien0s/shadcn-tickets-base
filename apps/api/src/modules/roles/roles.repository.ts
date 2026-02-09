import { supabase } from '../../config/supabase.js'
import { Role } from '@ticket-system/types'

export class RolesRepository {
  async findAll() {
    const { data, error } = await supabase
      .from('roles')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    return data as Role[]
  }

  async findByName(name: string) {
    const { data, error } = await supabase
      .from('roles')
      .select('*')
      .eq('name', name)
      .single()

    if (error) return null
    return data as Role
  }
}
