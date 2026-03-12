export interface Teacher {
  id: string
  tenant_id: string
  school_id: string
  name: string
  email?: string
  avatar_url?: string
  active: boolean
  created_at: string
}

export interface TeacherSubject {
  id: string
  name: string
}

export interface TeacherWithSubjects extends Teacher {
  subjects: TeacherSubject[]
}
