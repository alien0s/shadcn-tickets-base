import { supabase } from '../../config/supabase.js'
import { Entity, CreateEntityRequest } from '@ticket-system/types'

export class EntitiesRepository {
  async findAll() {
    const { data, error } = await supabase
      .from('entities')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    return data as Entity[]
  }

  async findByName(name: string) {
    const { data, error } = await supabase
      .from('entities')
      .select('*')
      .eq('name', name)
      .single()

    if (error) return null
    return data as Entity
  }

  async create(payload: CreateEntityRequest) {
    const { data, error } = await supabase
      .from('entities')
      .insert(payload)
      .select()
      .single()

    if (error) throw error
    return data as Entity
  }
}
