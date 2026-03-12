export interface Class {
  id: string
  school_id: string
  shift?: number
  education_level_id?: string
  series_id?: string
  suffix?: string
  name?: string
  code?: string
  year: number
  created_at: string
}

export interface CreateClassRequest {
  school_id: string
  series_id: string
  suffix: string
  shift: number
  year: number
}
