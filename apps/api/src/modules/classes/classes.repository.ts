import { supabase } from '../../config/supabase.js'
import { Class, CreateClassRequest } from '@ticket-system/types'
import { NotFoundError, ValidationError } from '../../shared/errors/AppError.js'

type FindClassesFilters = {
  schoolId?: string
  year?: number
}

type ClassRowWithSchoolTenant = {
  id: string
  school_id: string
  shift?: number | null
  education_level_id?: string | null
  series_id?: string | null
  suffix?: string | null
  name?: string | null
  code?: string | null
  year: number
  created_at: string
  schools?: Array<{
    tenant_id: string
  }> | null
  education_levels?: { name?: string } | Array<{ name?: string }> | null
  series?:
    | {
        name?: string | null
        education_level_id?: string | null
        education_levels?: { name?: string | null } | Array<{ name?: string | null }> | null
      }
    | Array<{
        name?: string | null
        education_level_id?: string | null
        education_levels?: { name?: string | null } | Array<{ name?: string | null }> | null
      }>
    | null
  schedules?: Array<{
    teachers?: { id?: string; name?: string; avatar_url?: string | null } | Array<{ id?: string; name?: string; avatar_url?: string | null }> | null
  }> | null
}

type TeacherSummary = {
  id: string
  name: string
  avatar_url?: string | null
}

type SeriesLookup = {
  id: string
  education_level_id: string
  name: string
}

type ClassEnriched = Class & {
  education_level_name?: string
  series_id?: string
  suffix?: string
  series_name?: string
  series_education_level_name?: string
  teachers: TeacherSummary[]
  schedule_count: number
}

export class ClassesRepository {
  async findById(id: string): Promise<Class> {
    const { data, error } = await supabase
      .from('classes')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      throw new NotFoundError('Turma nao encontrada')
    }

    return data as Class
  }

  async findAll(filters: FindClassesFilters = {}) {
    let query = supabase
      .from('classes')
      .select('id, school_id, shift, series_id, suffix, year, created_at, series(name, education_level_id, education_levels(name)), schedules(teachers(id, name, avatar_url))')
      .order('year', { ascending: false })
      .order('created_at', { ascending: false })

    if (filters.schoolId) {
      query = query.eq('school_id', filters.schoolId)
    }

    if (typeof filters.year === 'number') {
      query = query.eq('year', filters.year)
    }

    const { data, error } = await query
    if (!error) {
      return this.mapRowsToEnrichedClasses((data ?? []) as ClassRowWithSchoolTenant[])
    }

    let legacyQuery = supabase
      .from('classes')
      .select('id, school_id, shift, education_level_id, name, code, year, created_at, education_levels(name), schedules(teachers(id, name, avatar_url))')
      .order('year', { ascending: false })
      .order('created_at', { ascending: false })

    if (filters.schoolId) {
      legacyQuery = legacyQuery.eq('school_id', filters.schoolId)
    }

    if (typeof filters.year === 'number') {
      legacyQuery = legacyQuery.eq('year', filters.year)
    }

    const { data: legacyData, error: legacyError } = await legacyQuery
    if (legacyError) throw error

    return this.mapRowsToEnrichedClasses((legacyData ?? []) as ClassRowWithSchoolTenant[])
  }

  async findAllByTenant(tenantId: string, filters: FindClassesFilters = {}) {
    let query = supabase
      .from('classes')
      .select('id, school_id, shift, series_id, suffix, year, created_at, schools!inner(tenant_id), series(name, education_level_id, education_levels(name)), schedules(teachers(id, name, avatar_url))')
      .eq('schools.tenant_id', tenantId)
      .order('year', { ascending: false })
      .order('created_at', { ascending: false })

    if (filters.schoolId) {
      query = query.eq('school_id', filters.schoolId)
    }

    if (typeof filters.year === 'number') {
      query = query.eq('year', filters.year)
    }

    const { data, error } = await query
    if (!error) {
      return this.mapRowsToEnrichedClasses((data ?? []) as ClassRowWithSchoolTenant[])
    }

    let legacyQuery = supabase
      .from('classes')
      .select('id, school_id, shift, education_level_id, name, code, year, created_at, schools!inner(tenant_id), education_levels(name), schedules(teachers(id, name, avatar_url))')
      .eq('schools.tenant_id', tenantId)
      .order('year', { ascending: false })
      .order('created_at', { ascending: false })

    if (filters.schoolId) {
      legacyQuery = legacyQuery.eq('school_id', filters.schoolId)
    }

    if (typeof filters.year === 'number') {
      legacyQuery = legacyQuery.eq('year', filters.year)
    }

    const { data: legacyData, error: legacyError } = await legacyQuery
    if (legacyError) throw error

    return this.mapRowsToEnrichedClasses((legacyData ?? []) as ClassRowWithSchoolTenant[])
  }

  async create(payload: CreateClassRequest) {
    const series = await this.findSeriesById(payload.series_id)
    const compatName = [series.name, payload.suffix].filter(Boolean).join(' ').trim()
    const compatCode = this.buildClassCode(series.name, payload.suffix, payload.shift)
    const initialInsertPayload: Record<string, unknown> = {
      school_id: payload.school_id,
      series_id: payload.series_id,
      suffix: payload.suffix,
      shift: payload.shift,
      year: payload.year,
      // Compatibilidade com schema legado ainda presente em alguns bancos
      education_level_id: series.education_level_id,
      name: compatName || null,
      code: compatCode || null
    }

    const { data, error } = await this.insertClassRow(initialInsertPayload)
    if (!error) return data as Class

    if (error.code === 'PGRST204') {
      const fallbackPayload = this.removeMissingColumnsFromPayload(initialInsertPayload, error.message)
      const fallbackResult = await this.insertClassRow(fallbackPayload)
      if (!fallbackResult.error) return fallbackResult.data as Class
      throw fallbackResult.error
    }

    throw error
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('classes')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  async deleteSchedulesByClassId(classId: string): Promise<number> {
    const { data, error } = await supabase
      .from('schedules')
      .delete()
      .eq('class_id', classId)
      .select('id')

    if (error) throw error
    return data?.length ?? 0
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

  async existsBySeriesSuffixInSchoolYear(
    schoolId: string,
    seriesId: string,
    suffix: string,
    shift: number,
    year: number
  ): Promise<boolean> {
    const { data, error } = await supabase
      .from('classes')
      .select('id')
      .eq('school_id', schoolId)
      .eq('series_id', seriesId)
      .eq('suffix', suffix)
      .eq('shift', shift)
      .eq('year', year)
      .maybeSingle()

    if (error) throw error
    return Boolean(data)
  }

  async findSeriesById(seriesId: string): Promise<SeriesLookup> {
    const { data, error } = await supabase
      .from('series')
      .select('id, education_level_id, name')
      .eq('id', seriesId)
      .maybeSingle()

    if (error) throw error
    if (!data) {
      throw new ValidationError('Serie nao encontrada')
    }

    return {
      id: String(data.id),
      education_level_id: String(data.education_level_id),
      name: String(data.name ?? '').trim()
    }
  }

  private mapRowsToEnrichedClasses(rows: ClassRowWithSchoolTenant[]): ClassEnriched[] {
    return rows.map((row) => {
      const teachersMap = new Map<string, TeacherSummary>()
      const schedules = row.schedules ?? []

      for (const schedule of schedules) {
        const relation = schedule?.teachers
        const teachers = Array.isArray(relation) ? relation : relation ? [relation] : []

        for (const teacher of teachers) {
          const id = String(teacher?.id ?? '').trim()
          if (!id) continue

          teachersMap.set(id, {
            id,
            name: String(teacher?.name ?? 'Professor'),
            avatar_url: teacher?.avatar_url ?? null
          })
        }
      }

      const levelRelation = row.education_levels
      const levelName = Array.isArray(levelRelation)
        ? levelRelation[0]?.name
        : levelRelation?.name

      const seriesRelation = Array.isArray(row.series) ? row.series[0] : row.series
      const seriesName = String(seriesRelation?.name ?? '').trim()
      const suffix = String(row.suffix ?? '').trim()
      const fallbackName = [seriesName, suffix].filter(Boolean).join(' ')
      const shift = typeof row.shift === 'number' ? row.shift : undefined

      const seriesLevelRelation = seriesRelation?.education_levels
      const seriesLevelName = Array.isArray(seriesLevelRelation)
        ? seriesLevelRelation[0]?.name
        : seriesLevelRelation?.name
      const resolvedEducationLevelId =
        String(row.education_level_id ?? seriesRelation?.education_level_id ?? '').trim()
      const resolvedName = String(row.name ?? '').trim() || fallbackName || 'Turma'
      const resolvedCode = String(row.code ?? '').trim() || this.buildClassCode(seriesName, suffix, shift)

      return {
        id: row.id,
        school_id: row.school_id,
        shift,
        education_level_id: resolvedEducationLevelId,
        name: resolvedName,
        code: resolvedCode,
        year: row.year,
        created_at: row.created_at,
        education_level_name: levelName ?? undefined,
        series_id: row.series_id ? String(row.series_id) : undefined,
        suffix: suffix || undefined,
        series_name: seriesName || undefined,
        series_education_level_name: seriesLevelName ?? undefined,
        teachers: Array.from(teachersMap.values()),
        schedule_count: schedules.length
      }
    })
  }

  private buildClassCode(seriesName: string, suffix: string, shift?: number): string {
    const trimmedSeries = String(seriesName ?? '').trim()
    const trimmedSuffix = String(suffix ?? '').trim().toUpperCase()
    if (!trimmedSeries || !trimmedSuffix || !shift) return ''

    const shiftLetter = shift === 1 ? 'M' : shift === 2 ? 'V' : shift === 3 ? 'N' : ''
    if (!shiftLetter) return ''

    const base = trimmedSeries
      .replace(/\bano\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim()

    const codeBase = base || trimmedSeries
    return `${codeBase} ${trimmedSuffix}${shiftLetter}`.trim()
  }

  private async insertClassRow(payload: Record<string, unknown>) {
    return supabase
      .from('classes')
      .insert(payload)
      .select()
      .single()
  }

  private removeMissingColumnsFromPayload(
    payload: Record<string, unknown>,
    message: string
  ): Record<string, unknown> {
    const nextPayload = { ...payload }
    const removableColumns = ['name', 'code', 'education_level_id'] as const

    for (const column of removableColumns) {
      if (message.includes(`'${column}'`)) {
        delete nextPayload[column]
      }
    }

    return nextPayload
  }
}
