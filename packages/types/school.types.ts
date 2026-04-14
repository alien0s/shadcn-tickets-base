export interface School {
  id: string
  tenant_id: string
  name: string
  abbreviation: string
  active: boolean
  created_at: string
}

export interface CreateSchoolRequest {
  tenant_id?: string
  name: string
  abbreviation: string
  active?: boolean
}

export interface UpdateSchoolRequest {
  name: string
  abbreviation: string
  active?: boolean
}
