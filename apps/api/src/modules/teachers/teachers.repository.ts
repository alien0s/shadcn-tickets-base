import { supabase } from '../../config/supabase.js'
import { Teacher, TeacherWithSubjects } from '@ticket-system/types'

type FindTeachersFilters = {
  schoolId?: string
  active?: boolean
}

type TeacherWithSubjectsRow = Teacher & {
  teacher_subjects?: Array<{
    subject_id?: string | null
    subjects?: { id?: string | null; name?: string | null } | Array<{ id?: string | null; name?: string | null }> | null
  }> | null
}

type UpdateTeacherPayload = {
  name?: string
  email?: string | null
  school_id?: string
  active?: boolean
  avatar_url?: string | null
}

export class TeachersRepository {
  private mapTeacherWithSubjects(teacher: TeacherWithSubjectsRow): TeacherWithSubjects {
    const subjectsMap = new Map<string, { id: string; name: string }>()

    for (const teacherSubject of teacher.teacher_subjects ?? []) {
      const relation = teacherSubject.subjects
      const subject = Array.isArray(relation) ? relation[0] : relation
      const id = String(subject?.id ?? teacherSubject.subject_id ?? '').trim()
      const name = String(subject?.name ?? '').trim()
      if (!id || !name) continue
      subjectsMap.set(id, { id, name })
    }

    return {
      ...teacher,
      subjects: Array.from(subjectsMap.values()).sort((a, b) => a.name.localeCompare(b.name))
    }
  }

  async findAll(filters: FindTeachersFilters = {}) {
    let query = supabase
      .from('teachers')
      .select('id, tenant_id, school_id, name, email, avatar_url, active, created_at, teacher_subjects(subject_id, subjects(id, name))')
      .order('name', { ascending: true })

    if (filters.schoolId) {
      query = query.eq('school_id', filters.schoolId)
    }

    if (typeof filters.active === 'boolean') {
      query = query.eq('active', filters.active)
    }

    const { data, error } = await query
    if (error) throw error
    return (data ?? []).map((item) => this.mapTeacherWithSubjects(item as TeacherWithSubjectsRow))
  }

  async findAllByTenant(tenantId: string, filters: FindTeachersFilters = {}) {
    let query = supabase
      .from('teachers')
      .select('id, tenant_id, school_id, name, email, avatar_url, active, created_at, teacher_subjects(subject_id, subjects(id, name))')
      .eq('tenant_id', tenantId)
      .order('name', { ascending: true })

    if (filters.schoolId) {
      query = query.eq('school_id', filters.schoolId)
    }

    if (typeof filters.active === 'boolean') {
      query = query.eq('active', filters.active)
    }

    const { data, error } = await query
    if (error) throw error
    return (data ?? []).map((item) => this.mapTeacherWithSubjects(item as TeacherWithSubjectsRow))
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

  async create(payload: {
    tenant_id: string
    school_id: string
    name: string
    email?: string | null
    active?: boolean
    avatar_url?: string
  }): Promise<Teacher> {
    const { data, error } = await supabase
      .from('teachers')
      .insert(payload)
      .select('id, tenant_id, school_id, name, email, avatar_url, active, created_at')
      .single()

    if (error) throw error
    return data as Teacher
  }

  async findById(teacherId: string): Promise<Teacher | null> {
    const { data, error } = await supabase
      .from('teachers')
      .select('id, tenant_id, school_id, name, email, avatar_url, active, created_at')
      .eq('id', teacherId)
      .maybeSingle()

    if (error || !data) return null
    return data as Teacher
  }

  async findByIdWithSubjects(teacherId: string): Promise<TeacherWithSubjects | null> {
    const { data, error } = await supabase
      .from('teachers')
      .select('id, tenant_id, school_id, name, email, avatar_url, active, created_at, teacher_subjects(subject_id, subjects(id, name))')
      .eq('id', teacherId)
      .maybeSingle()

    if (error || !data) return null
    return this.mapTeacherWithSubjects(data as TeacherWithSubjectsRow)
  }

  async updateById(teacherId: string, payload: UpdateTeacherPayload): Promise<Teacher> {
    const { data, error } = await supabase
      .from('teachers')
      .update(payload)
      .eq('id', teacherId)
      .select('id, tenant_id, school_id, name, email, avatar_url, active, created_at')
      .single()

    if (error) throw error
    return data as Teacher
  }

  async deleteById(teacherId: string): Promise<void> {
    const { error } = await supabase
      .from('teachers')
      .delete()
      .eq('id', teacherId)

    if (error) throw error
  }

  async isSchoolInTenant(schoolId: string, tenantId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('schools')
      .select('id')
      .eq('id', schoolId)
      .eq('tenant_id', tenantId)
      .maybeSingle()

    if (error) throw error
    return Boolean(data)
  }

  async findTenantIdBySchoolId(schoolId: string): Promise<string | null> {
    const { data, error } = await supabase
      .from('schools')
      .select('tenant_id')
      .eq('id', schoolId)
      .maybeSingle()

    if (error || !data) return null
    return data.tenant_id ? String(data.tenant_id) : null
  }

  async countSubjectsByIds(subjectIds: string[]): Promise<number> {
    if (subjectIds.length === 0) return 0

    const { data, error } = await supabase
      .from('subjects')
      .select('id')
      .in('id', subjectIds)

    if (error) throw error
    return (data ?? []).length
  }

  async replaceTeacherSubjects(input: {
    teacherId: string
    tenantId: string
    subjectIds: string[]
  }): Promise<void> {
    const { error: deleteError } = await supabase
      .from('teacher_subjects')
      .delete()
      .eq('teacher_id', input.teacherId)

    if (deleteError) throw deleteError

    if (input.subjectIds.length === 0) return

    const rows = input.subjectIds.map((subjectId) => ({
      tenant_id: input.tenantId,
      teacher_id: input.teacherId,
      subject_id: subjectId
    }))

    const { error: insertError } = await supabase
      .from('teacher_subjects')
      .insert(rows)

    if (insertError) throw insertError
  }
}
