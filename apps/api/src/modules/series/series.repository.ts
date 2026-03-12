import { supabase } from '../../config/supabase.js'

export type Series = {
  id: string
  education_level_id: string
  education_level_name?: string
  name: string
  created_at: string
}

type SeriesRow = {
  id: string
  education_level_id: string
  name: string
  created_at: string
  education_levels?: { name?: string } | Array<{ name?: string }> | null
}

export class SeriesRepository {
  async findAll(educationLevelId?: string) {
    let query = supabase
      .from('series')
      .select('id, education_level_id, name, created_at, education_levels(name)')
      .order('name', { ascending: true })

    if (educationLevelId) {
      query = query.eq('education_level_id', educationLevelId)
    }

    const { data, error } = await query
    if (error) throw error

    const rows = (data ?? []) as SeriesRow[]
    return rows.map((row) => {
      const relation = row.education_levels
      const educationLevelName = Array.isArray(relation) ? relation[0]?.name : relation?.name

      return {
        id: row.id,
        education_level_id: row.education_level_id,
        education_level_name: educationLevelName ? String(educationLevelName) : undefined,
        name: row.name,
        created_at: row.created_at
      }
    })
  }
}
