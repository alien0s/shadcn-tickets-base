import { CreateSubjectRequest, Subject, UpdateSubjectRequest } from '@ticket-system/types'
import { supabase } from '../../config/supabase.js'
import { NotFoundError } from '../../shared/errors/AppError.js'

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

  async update(id: string, payload: UpdateSubjectRequest) {
    const { data, error } = await supabase
      .from('subjects')
      .update(payload)
      .eq('id', id)
      .select('*')
      .single()

    if (error || !data) {
      throw new NotFoundError('Disciplina não encontrada')
    }

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

  async findById(id: string): Promise<Subject | null> {
    const { data, error } = await supabase
      .from('subjects')
      .select('*')
      .eq('id', id)
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
