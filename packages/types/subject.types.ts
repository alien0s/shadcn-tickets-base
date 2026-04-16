export interface Subject {
  id: string
  name: string
  icon?: string | null
  created_at: string
}

export interface CreateSubjectRequest {
  name: string
  icon?: string | null
}

export interface UpdateSubjectRequest {
  name?: string
  icon?: string | null
}
