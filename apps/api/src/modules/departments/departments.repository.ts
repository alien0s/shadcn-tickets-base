import { supabase } from '../../config/supabase.js'
import { Department, CreateDepartmentRequest } from '@ticket-system/types'

export class DepartmentsRepository {
  async findAll() {
    const { data, error } = await supabase
      .from('departments')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    return data as Department[]
  }

  async create(payload: CreateDepartmentRequest) {
    const { data, error } = await supabase
      .from('departments')
      .insert(payload)
      .select()
      .single()

    if (error) throw error
    return data as Department
  }

  async findByName(name: string): Promise<Department | null> {
    const { data, error } = await supabase
      .from('departments')
      .select('*')
      .eq('name', name)
      .single()

    if (error) return null
    return data as Department
  }
}
