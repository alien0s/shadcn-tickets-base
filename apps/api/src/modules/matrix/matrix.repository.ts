import {
  CreateSubjectWorkloadRequest,
  SubjectWorkload,
  UpdateSubjectWorkloadRequest
} from '@ticket-system/types'
import { supabase } from '../../config/supabase.js'
import { NotFoundError } from '../../shared/errors/AppError.js'

type SubjectWorkloadRow = SubjectWorkload & {
  subjects?: { id: string; name: string } | Array<{ id: string; name: string }> | null
}

export class MatrixRepository {
  async findAll(filters: { schoolId?: string; seriesId?: string } = {}) {
    let query = supabase
      .from('subject_workloads')
      .select('*, subjects(id, name)')
      .order('created_at', { ascending: false })

    if (filters.schoolId) {
      query = query.eq('school_id', filters.schoolId)
    }

    if (filters.seriesId) {
      query = query.eq('series_id', filters.seriesId)
    }

    const { data, error } = await query
    if (error) throw error

    return this.mapRows((data ?? []) as SubjectWorkloadRow[])
  }

  async findAllByTenant(tenantId: string, filters: { schoolId?: string; seriesId?: string } = {}) {
    let query = supabase
      .from('subject_workloads')
      .select('*, schools!inner(tenant_id), subjects(id, name)')
      .eq('schools.tenant_id', tenantId)
      .order('created_at', { ascending: false })

    if (filters.schoolId) {
      query = query.eq('school_id', filters.schoolId)
    }

    if (filters.seriesId) {
      query = query.eq('series_id', filters.seriesId)
    }

    const { data, error } = await query
    if (error) throw error

    return this.mapRows((data ?? []) as SubjectWorkloadRow[])
  }

  async findById(id: string): Promise<SubjectWorkload> {
    const { data, error } = await supabase
      .from('subject_workloads')
      .select('*, subjects(id, name)')
      .eq('id', id)
      .single()

    if (error || !data) {
      throw new NotFoundError('Carga da matriz nao encontrada')
    }

    return this.mapRows([data as SubjectWorkloadRow])[0]
  }

  async create(payload: CreateSubjectWorkloadRequest & { tenant_id: string }) {
    const { data, error } = await supabase
      .from('subject_workloads')
      .insert({
        tenant_id: payload.tenant_id,
        school_id: payload.school_id,
        series_id: payload.series_id,
        subject_id: payload.subject_id,
        weekly_classes: payload.weekly_classes,
        annual_hours: payload.annual_hours ?? null,
        is_mandatory: payload.is_mandatory ?? true
      })
      .select('*, subjects(id, name)')
      .single()

    if (error) throw error
    return this.mapRows([data as SubjectWorkloadRow])[0]
  }

  async update(id: string, payload: UpdateSubjectWorkloadRequest) {
    const { data, error } = await supabase
      .from('subject_workloads')
      .update({
        weekly_classes: payload.weekly_classes,
        annual_hours: payload.annual_hours,
        is_mandatory: payload.is_mandatory,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select('*, subjects(id, name)')
      .single()

    if (error) throw error
    return this.mapRows([data as SubjectWorkloadRow])[0]
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('subject_workloads')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  async existsBySchoolSeriesSubject(input: {
    schoolId: string
    seriesId: string
    subjectId: string
    excludeId?: string
  }) {
    const { data, error } = await supabase
      .from('subject_workloads')
      .select('id')
      .eq('school_id', input.schoolId)
      .eq('series_id', input.seriesId)
      .eq('subject_id', input.subjectId)

    if (error) throw error

    return (data ?? []).some((item) => {
      if (input.excludeId && item.id === input.excludeId) return false
      return true
    })
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

  async findRoleNameById(roleId: string): Promise<string | null> {
    const { data, error } = await supabase
      .from('roles')
      .select('name')
      .eq('id', roleId)
      .single()

    if (error || !data) return null
    return String(data.name)
  }

  private mapRows(rows: SubjectWorkloadRow[]): SubjectWorkload[] {
    return rows.map((row) => {
      const subjectRelation = Array.isArray(row.subjects) ? row.subjects[0] : row.subjects

      return {
        ...row,
        subjects: subjectRelation
          ? {
              id: String(subjectRelation.id),
              name: String(subjectRelation.name)
            }
          : null
      }
    })
  }
}
