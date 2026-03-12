import { CreateTimeSlotRequest, TimeSlot } from '@ticket-system/types'
import { supabase } from '../../config/supabase.js'

type TimeSlotsFilters = {
  schoolId: string
  shift?: number
}

export class TimeSlotsRepository {
  async findAll(filters: TimeSlotsFilters) {
    let query = supabase
      .from('time_slots')
      .select('*')
      .eq('school_id', filters.schoolId)
      .order('shift', { ascending: true })
      .order('order_index', { ascending: true })

    if (typeof filters.shift === 'number') {
      query = query.eq('shift', filters.shift)
    }

    const { data, error } = await query
    if (error) throw error

    return (data ?? []) as TimeSlot[]
  }

  async findAllByTenant(tenantId: string, filters: TimeSlotsFilters) {
    let query = supabase
      .from('time_slots')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('school_id', filters.schoolId)
      .order('shift', { ascending: true })
      .order('order_index', { ascending: true })

    if (typeof filters.shift === 'number') {
      query = query.eq('shift', filters.shift)
    }

    const { data, error } = await query
    if (error) throw error

    return (data ?? []) as TimeSlot[]
  }

  async create(payload: CreateTimeSlotRequest) {
    const { data, error } = await supabase
      .from('time_slots')
      .insert(payload)
      .select()
      .single()

    if (error) throw error
    return data as TimeSlot
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
}
