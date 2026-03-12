import { CreateSubjectRequest, Subject } from '@ticket-system/types'
import { supabase } from '../../config/supabase.js'

export class SubjectsRepository {
  async findAll() {
    const { data, error } = await supabase
      .from('subjects')
      .select('*')
      .order('name', { ascending: true })

    if (error) throw error
    return (data ?? []) as Subject[]
  }

  async create(payload: CreateSubjectRequest) {
    const { data, error } = await supabase
      .from('subjects')
      .insert(payload)
      .select()
      .single()

    if (error) throw error
    return data as Subject
  }

  async findByName(name: string): Promise<Subject | null> {
    const { data, error } = await supabase
      .from('subjects')
      .select('*')
      .eq('name', name)
      .maybeSingle()

    if (error || !data) return null
    return data as Subject
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

  async findDepartmentIdByUserId(userId: string): Promise<string | null> {
    const { data, error } = await supabase
      .from('users')
      .select('department_id')
      .eq('id', userId)
      .single()

    if (error || !data) return null
    return data.department_id ? String(data.department_id) : null
  }
}
