import { CreateSubjectRequest } from '@ticket-system/types'
import { UnauthorizedError, ValidationError } from '../../shared/errors/AppError.js'
import { SubjectsRepository } from './subjects.repository.js'

const ADMINISTRATIVE_DEPARTMENT_ID = '7240712b-96de-418a-b6b3-344d12d64237'

type CreateSubjectContext = {
  userId: string
  roleId: string
}

export class SubjectsService {
  private repository: SubjectsRepository

  constructor() {
    this.repository = new SubjectsRepository()
  }

  async listSubjects() {
    return this.repository.findAll()
  }

  async createSubject(context: CreateSubjectContext, payload: CreateSubjectRequest) {
    const roleName = await this.repository.findRoleNameById(context.roleId)
    const isRoot = roleName?.toLowerCase() === 'root'

    if (!isRoot) {
      const departmentId = await this.repository.findDepartmentIdByUserId(context.userId)
      const isAdministrative = departmentId === ADMINISTRATIVE_DEPARTMENT_ID

      if (!isAdministrative) {
        throw new UnauthorizedError('Apenas departamento administrativo ou root podem criar disciplinas')
      }
    }

    const normalizedName = payload.name.trim()
    const existing = await this.repository.findByName(normalizedName)
    if (existing) {
      throw new ValidationError('Disciplina já existe com esse nome')
    }

    return this.repository.create({ name: normalizedName })
  }
}
