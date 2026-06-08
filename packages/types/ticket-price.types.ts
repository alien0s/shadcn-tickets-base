export interface TicketPrice {
  id: string
  tenant_id: string
  school_id: string
  subject_id?: string | null
  education_level_id?: string | null
  price_per_lesson: number
  created_at: string
  updated_at: string
  schools?: {
    id: string
    name: string
    abbreviation: string
  } | null
  subjects?: {
    id: string
    name: string
  } | null
  education_levels?: {
    id: string
    name: string
    abbreviation?: string | null
  } | null
}

export interface CreateTicketPriceRequest {
  school_id: string
  subject_id?: string | null
  education_level_id?: string | null
  price_per_lesson: number
}

export interface UpdateTicketPriceRequest {
  school_id?: string
  subject_id?: string | null
  education_level_id?: string | null
  price_per_lesson?: number
}
