export interface Entity {
  id: string
  name: string
  created_at: string
}

export interface CreateEntityRequest {
  name: string
}
