import { Schedule } from '@ticket-system/types'
import { supabase } from '../../config/supabase.js'

type ScheduleFilters = {
  teacherId?: string
  classId?: string
  schoolId?: string
}

export type ScheduleWithRelations = Schedule & {
  classes?:
    | {
        name?: string
        suffix?: string | null
        series?: { name?: string } | Array<{ name?: string }> | null
      }
    | Array<{
        name?: string
        suffix?: string | null
        series?: { name?: string } | Array<{ name?: string }> | null
      }>
    | null
  teachers?: { name?: string } | Array<{ name?: string }> | null
  subjects?: { name?: string } | Array<{ name?: string }> | null
  time_slots?:
    | { start_time?: string; end_time?: string | null; shift?: number }
    | Array<{ start_time?: string; end_time?: string | null; shift?: number }>
    | null
}

function applyScheduleFilters<T extends Record<string, any>>(query: T, filters: ScheduleFilters): T {
  let next = query

  if (filters.teacherId) {
    next = next.eq('teacher_id', filters.teacherId)
  }

  if (filters.classId) {
    next = next.eq('class_id', filters.classId)
  }

  if (filters.schoolId) {
    next = next.eq('school_id', filters.schoolId)
  }

  return next
}

export class SchedulesRepository {
  async findByTeacher(filters: ScheduleFilters) {
    let query = supabase
      .from('schedules')
      .select('id, tenant_id, school_id, class_id, teacher_id, subject_id, time_slot_id, day_of_week, created_at, classes(suffix, series(name)), teachers(name), subjects(name), time_slots(start_time, end_time, shift)')
      .order('day_of_week', { ascending: true })

    query = applyScheduleFilters(query, filters)

    const { data, error } = await query
    if (!error) {
      return this.normalizeScheduleClassNames((data ?? []) as ScheduleWithRelations[])
    }

    let legacyQuery = supabase
      .from('schedules')
      .select('id, tenant_id, school_id, class_id, teacher_id, subject_id, time_slot_id, day_of_week, created_at, classes(name), teachers(name), subjects(name), time_slots(start_time, end_time, shift)')
      .order('day_of_week', { ascending: true })

    legacyQuery = applyScheduleFilters(legacyQuery, filters)

    const { data: legacyData, error: legacyError } = await legacyQuery
    if (legacyError) throw error

    return this.normalizeScheduleClassNames((legacyData ?? []) as ScheduleWithRelations[])
  }

  async findByTeacherAndTenant(tenantId: string, filters: ScheduleFilters) {
    let query = supabase
      .from('schedules')
      .select('id, tenant_id, school_id, class_id, teacher_id, subject_id, time_slot_id, day_of_week, created_at, classes(suffix, series(name)), teachers(name), subjects(name), time_slots(start_time, end_time, shift)')
      .eq('tenant_id', tenantId)
      .order('day_of_week', { ascending: true })

    query = applyScheduleFilters(query, filters)

    const { data, error } = await query
    if (!error) {
      return this.normalizeScheduleClassNames((data ?? []) as ScheduleWithRelations[])
    }

    let legacyQuery = supabase
      .from('schedules')
      .select('id, tenant_id, school_id, class_id, teacher_id, subject_id, time_slot_id, day_of_week, created_at, classes(name), teachers(name), subjects(name), time_slots(start_time, end_time, shift)')
      .eq('tenant_id', tenantId)
      .order('day_of_week', { ascending: true })

    legacyQuery = applyScheduleFilters(legacyQuery, filters)

    const { data: legacyData, error: legacyError } = await legacyQuery
    if (legacyError) throw error

    return this.normalizeScheduleClassNames((legacyData ?? []) as ScheduleWithRelations[])
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

  async findById(scheduleId: string) {
    const { data, error } = await supabase
      .from('schedules')
      .select('id, tenant_id')
      .eq('id', scheduleId)
      .maybeSingle()

    if (error || !data) return null
    return data as { id: string; tenant_id: string }
  }

  async create(payload: {
    tenant_id: string
    school_id: string
    class_id: string
    teacher_id: string
    subject_id: string
    time_slot_id: string
    day_of_week: number
  }) {
    const { data, error } = await supabase
      .from('schedules')
      .insert(payload)
      .select('id, tenant_id, school_id, class_id, teacher_id, subject_id, time_slot_id, day_of_week, created_at')
      .single()

    if (error) throw error
    return data as Schedule
  }

  async findByIdWithScope(scheduleId: string) {
    const { data, error } = await supabase
      .from('schedules')
      .select('id, tenant_id, school_id, teacher_id, class_id, subject_id, time_slot_id, day_of_week')
      .eq('id', scheduleId)
      .maybeSingle()

    if (error || !data) return null
    return data as {
      id: string
      tenant_id: string
      school_id: string
      teacher_id: string
      class_id: string
      subject_id: string
      time_slot_id: string
      day_of_week: number
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

  async findTenantIdBySchoolId(schoolId: string): Promise<string | null> {
    const { data, error } = await supabase
      .from('schools')
      .select('tenant_id')
      .eq('id', schoolId)
      .maybeSingle()

    if (error || !data) return null
    return String(data.tenant_id)
  }

  async findSchoolIdByTimeSlotId(timeSlotId: string): Promise<string | null> {
    const { data, error } = await supabase
      .from('time_slots')
      .select('school_id')
      .eq('id', timeSlotId)
      .maybeSingle()

    if (error || !data) return null
    return String(data.school_id)
  }

  async findTeacherConflict(input: {
    schoolId: string
    teacherId: string
    timeSlotId: string
    dayOfWeek: number
    excludeScheduleId?: string
  }): Promise<{ id: string; teacher_name: string | null } | null> {
    let query = supabase
      .from('schedules')
      .select('id, teachers(name)')
      .eq('school_id', input.schoolId)
      .eq('teacher_id', input.teacherId)
      .eq('time_slot_id', input.timeSlotId)
      .eq('day_of_week', input.dayOfWeek)

    if (input.excludeScheduleId) {
      query = query.neq('id', input.excludeScheduleId)
    }

    const { data, error } = await query.maybeSingle()
    if (error) throw error
    if (!data) return null

    const relation = (data as any).teachers
    const teacherName = Array.isArray(relation)
      ? relation[0]?.name ?? null
      : relation?.name ?? null

    return {
      id: String((data as any).id),
      teacher_name: teacherName ? String(teacherName) : null
    }
  }

  async findClassConflict(input: {
    schoolId: string
    classId: string
    timeSlotId: string
    dayOfWeek: number
    excludeScheduleId?: string
  }): Promise<{ id: string; teacher_name: string | null } | null> {
    let query = supabase
      .from('schedules')
      .select('id, teachers(name)')
      .eq('school_id', input.schoolId)
      .eq('class_id', input.classId)
      .eq('time_slot_id', input.timeSlotId)
      .eq('day_of_week', input.dayOfWeek)

    if (input.excludeScheduleId) {
      query = query.neq('id', input.excludeScheduleId)
    }

    const { data, error } = await query.maybeSingle()
    if (error) throw error
    if (!data) return null

    const relation = (data as any).teachers
    const teacherName = Array.isArray(relation)
      ? relation[0]?.name ?? null
      : relation?.name ?? null

    return {
      id: String((data as any).id),
      teacher_name: teacherName ? String(teacherName) : null
    }
  }

  async updatePosition(scheduleId: string, payload: { dayOfWeek: number; timeSlotId: string }) {
    const { data, error } = await supabase
      .from('schedules')
      .update({
        day_of_week: payload.dayOfWeek,
        time_slot_id: payload.timeSlotId
      })
      .eq('id', scheduleId)
      .select('id, tenant_id, school_id, class_id, teacher_id, subject_id, time_slot_id, day_of_week, created_at')
      .single()

    if (error) throw error
    return data as Schedule
  }

  async updateScheduleFields(scheduleId: string, payload: {
    classId: string
    teacherId: string
    subjectId: string
  }) {
    const { data, error } = await supabase
      .from('schedules')
      .update({
        class_id: payload.classId,
        teacher_id: payload.teacherId,
        subject_id: payload.subjectId
      })
      .eq('id', scheduleId)
      .select('id, tenant_id, school_id, class_id, teacher_id, subject_id, time_slot_id, day_of_week, created_at')
      .single()

    if (error) throw error
    return data as Schedule
  }

  async deleteById(scheduleId: string): Promise<void> {
    const { error } = await supabase
      .from('schedules')
      .delete()
      .eq('id', scheduleId)

    if (error) throw error
  }

  private normalizeScheduleClassNames(rows: ScheduleWithRelations[]): ScheduleWithRelations[] {
    return rows.map((row) => {
      const classRelation = Array.isArray(row.classes) ? row.classes[0] : row.classes
      const directName = String(classRelation?.name ?? '').trim()
      if (directName) {
        return row
      }

      const seriesRelation = classRelation?.series
      const series = Array.isArray(seriesRelation) ? seriesRelation[0] : seriesRelation
      const seriesName = String(series?.name ?? '').trim()
      const suffix = String(classRelation?.suffix ?? '').trim()
      const fallbackName = [seriesName, suffix].filter(Boolean).join(' ').trim()

      return {
        ...row,
        classes: { name: fallbackName || 'Turma' }
      }
    })
  }
}
