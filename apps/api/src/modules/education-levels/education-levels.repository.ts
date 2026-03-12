import { supabase } from '../../config/supabase.js'

export type EducationLevel = {
  id: string
  name: string
  abbreviation?: string | null
  created_at: string
}

export class EducationLevelsRepository {
  async findAll() {
    const { data, error } = await supabase
      .from('education_levels')
      .select('id, name, abbreviation, created_at')
      .order('name', { ascending: true })

    if (error) throw error
    return (data ?? []) as EducationLevel[]
  }
}

