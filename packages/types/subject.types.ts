export interface Subject {
  id: string
  name: string
  created_at: string
}

export interface CreateSubjectRequest {
  name: string
}
