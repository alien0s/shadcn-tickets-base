import {
  CreateTicketPriceRequest,
  TicketPrice,
  UpdateTicketPriceRequest
} from '@ticket-system/types'
import { supabase } from '../../config/supabase.js'
import { NotFoundError, ServiceUnavailableError } from '../../shared/errors/AppError.js'

type TicketPriceRelation<T> = T | T[] | null | undefined

type TicketPriceRow = Omit<TicketPrice, 'price_per_lesson' | 'schools' | 'subjects' | 'education_levels'> & {
  price_per_lesson: number | string
  schools?: TicketPriceRelation<{
    id: string
    name: string
    abbreviation: string
  }>
  subjects?: TicketPriceRelation<{
    id: string
    name: string
  }>
  education_levels?: TicketPriceRelation<{
    id: string
    name: string
    abbreviation?: string | null
  }>
}

export class TicketPricesRepository {
  async findAll(filters: {
    schoolId?: string
    subjectId?: string
    educationLevelId?: string
  } = {}) {
    let query = this.baseSelect()

    if (filters.schoolId) {
      query = query.eq('school_id', filters.schoolId)
    }

    if (filters.subjectId) {
      query = query.eq('subject_id', filters.subjectId)
    }

    if (filters.educationLevelId) {
      query = query.eq('education_level_id', filters.educationLevelId)
    }

    const { data, error } = await query

    this.throwIfSchemaMissing(error)
    if (error) throw error
    return this.mapRows((data ?? []) as TicketPriceRow[])
  }

  async findAllByTenant(
    tenantId: string,
    filters: {
      schoolId?: string
      subjectId?: string
      educationLevelId?: string
    } = {}
  ) {
    let query = this.baseSelect().eq('tenant_id', tenantId)

    if (filters.schoolId) {
      query = query.eq('school_id', filters.schoolId)
    }

    if (filters.subjectId) {
      query = query.eq('subject_id', filters.subjectId)
    }

    if (filters.educationLevelId) {
      query = query.eq('education_level_id', filters.educationLevelId)
    }

    const { data, error } = await query

    this.throwIfSchemaMissing(error)
    if (error) throw error
    return this.mapRows((data ?? []) as TicketPriceRow[])
  }

  async findById(id: string): Promise<TicketPrice> {
    const { data, error } = await this.baseSelect()
      .eq('id', id)
      .single()

    this.throwIfSchemaMissing(error)
    if (error || !data) {
      throw new NotFoundError('Preco de ticket nao encontrado')
    }

    return this.mapRows([data as TicketPriceRow])[0]
  }

  async create(payload: CreateTicketPriceRequest & { tenant_id: string }) {
    const { data, error } = await supabase
      .from('ticket_price')
      .insert({
        tenant_id: payload.tenant_id,
        school_id: payload.school_id,
        subject_id: payload.subject_id ?? null,
        education_level_id: payload.education_level_id ?? null,
        price_per_lesson: payload.price_per_lesson
      })
      .select(`
        id,
        tenant_id,
        school_id,
        subject_id,
        education_level_id,
        price_per_lesson,
        created_at,
        updated_at,
        schools(id, name, abbreviation),
        subjects(id, name),
        education_levels(id, name, abbreviation)
      `)
      .single()

    this.throwIfSchemaMissing(error)
    if (error) throw error
    return this.mapRows([data as TicketPriceRow])[0]
  }

  async update(
    id: string,
    payload: UpdateTicketPriceRequest & { tenant_id: string }
  ) {
    const { data, error } = await supabase
      .from('ticket_price')
      .update({
        tenant_id: payload.tenant_id,
        school_id: payload.school_id,
        subject_id: payload.subject_id ?? null,
        education_level_id: payload.education_level_id ?? null,
        price_per_lesson: payload.price_per_lesson,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        id,
        tenant_id,
        school_id,
        subject_id,
        education_level_id,
        price_per_lesson,
        created_at,
        updated_at,
        schools(id, name, abbreviation),
        subjects(id, name),
        education_levels(id, name, abbreviation)
      `)
      .single()

    this.throwIfSchemaMissing(error)
    if (error || !data) {
      throw new NotFoundError('Preco de ticket nao encontrado')
    }

    return this.mapRows([data as TicketPriceRow])[0]
  }

  async existsByCombination(input: {
    schoolId: string
    subjectId?: string | null
    educationLevelId?: string | null
    excludeId?: string
  }) {
    let query = supabase
      .from('ticket_price')
      .select('id')
      .eq('school_id', input.schoolId)

    query = input.subjectId
      ? query.eq('subject_id', input.subjectId)
      : query.is('subject_id', null)

    query = input.educationLevelId
      ? query.eq('education_level_id', input.educationLevelId)
      : query.is('education_level_id', null)

    const { data, error } = await query

    this.throwIfSchemaMissing(error)
    if (error) throw error

    return (data ?? []).some((item) => {
      if (input.excludeId && item.id === input.excludeId) {
        return false
      }

      return true
    })
  }

  async findSchoolById(schoolId: string): Promise<{ id: string; tenant_id: string }> {
    const { data, error } = await supabase
      .from('schools')
      .select('id, tenant_id')
      .eq('id', schoolId)
      .single()

    if (error || !data) {
      throw new NotFoundError('Escola nao encontrada')
    }

    return {
      id: String(data.id),
      tenant_id: String(data.tenant_id)
    }
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

  private baseSelect() {
    return supabase
      .from('ticket_price')
      .select(`
        id,
        tenant_id,
        school_id,
        subject_id,
        education_level_id,
        price_per_lesson,
        created_at,
        updated_at,
        schools(id, name, abbreviation),
        subjects(id, name),
        education_levels(id, name, abbreviation)
      `)
      .order('created_at', { ascending: false })
  }

  private mapRows(rows: TicketPriceRow[]): TicketPrice[] {
    return rows.map((row) => {
      const school = this.firstRelation(row.schools)
      const subject = this.firstRelation(row.subjects)
      const educationLevel = this.firstRelation(row.education_levels)

      return {
        ...row,
        price_per_lesson: Number(row.price_per_lesson),
        schools: school
          ? {
              id: String(school.id),
              name: String(school.name),
              abbreviation: String(school.abbreviation)
            }
          : null,
        subjects: subject
          ? {
              id: String(subject.id),
              name: String(subject.name)
            }
          : null,
        education_levels: educationLevel
          ? {
              id: String(educationLevel.id),
              name: String(educationLevel.name),
              abbreviation: educationLevel.abbreviation ? String(educationLevel.abbreviation) : null
            }
          : null
      }
    })
  }

  private firstRelation<T>(value: TicketPriceRelation<T>): T | null {
    if (!value) {
      return null
    }

    return Array.isArray(value) ? value[0] ?? null : value
  }

  private throwIfSchemaMissing(error: { code?: string | null } | null) {
    if (error?.code === 'PGRST205') {
      throw new ServiceUnavailableError(
        'Tabela ticket_price nao encontrada neste ambiente. Aplique o SQL apps/sql/ticket_price.sql no banco.'
      )
    }
  }
}
