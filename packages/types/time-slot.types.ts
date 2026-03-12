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
