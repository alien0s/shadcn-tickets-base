export interface SubjectWorkload {
  id: string
  tenant_id: string
  school_id: string
  series_id: string
  subject_id: string
  weekly_classes: number
  annual_hours?: number | null
  is_mandatory: boolean
  created_at: string
  updated_at: string
  subjects?: {
    id: string
    name: string
  } | null
}

export interface CreateSubjectWorkloadRequest {
  school_id: string
  series_id: string
  subject_id: string
  weekly_classes: number
  annual_hours?: number
  is_mandatory?: boolean
}

export interface UpdateSubjectWorkloadRequest {
  weekly_classes?: number
  annual_hours?: number | null
  is_mandatory?: boolean
}
