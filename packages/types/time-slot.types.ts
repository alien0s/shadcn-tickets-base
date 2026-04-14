export interface TimeSlot {
  id: string
  tenant_id: string
  school_id: string
  shift: number
  order_index: number
  start_time: string
  end_time: string
  is_break: boolean
  break_label?: string | null
  created_at: string
}

export interface CreateTimeSlotRequest {
  tenant_id?: string
  school_id: string
  shift: number
  order_index: number
  start_time: string
  end_time: string
  is_break?: boolean
  break_label?: string | null
}

export interface CreateTimeSlotsShiftRequest {
  start_time: string
  end_time: string
}

export interface CreateTimeSlotsBreakRequest {
  start_time: string
  end_time: string
  break_label?: string | null
}

export interface CreateTimeSlotsGradeRequest {
  tenant_id?: string
  school_id: string
  lesson_minutes: number
  morning?: CreateTimeSlotsShiftRequest | null
  afternoon?: CreateTimeSlotsShiftRequest | null
  night?: CreateTimeSlotsShiftRequest | null
  breaks?: CreateTimeSlotsBreakRequest[]
}

export interface ImportTimeSlotsGradeRequest {
  source_school_id: string
  target_school_id: string
  overwrite?: boolean
}
