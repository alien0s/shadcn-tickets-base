import { CreateSubjectRequest, UpdateSubjectRequest } from '@ticket-system/types'
import { NotFoundError, UnauthorizedError, ValidationError } from '../../shared/errors/AppError.js'
import { SubjectsRepository } from './subjects.repository.js'

const ADMINISTRATIVE_DEPARTMENT_ID = '7240712b-96de-418a-b6b3-344d12d64237'

type SubjectContext = {
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

  async createSubject(context: SubjectContext, payload: CreateSubjectRequest) {
    await this.ensureCanManageSubjects(context)

    const normalizedName = payload.name.trim()
    const existing = await this.repository.findByName(normalizedName)
    if (existing) {
      throw new ValidationError('Disciplina já existe com esse nome')
    }

    return this.repository.create({
      name: normalizedName,
      icon: payload.icon?.trim() || null
    })
  }

  async updateSubject(context: SubjectContext, id: string, payload: UpdateSubjectRequest) {
    await this.ensureCanManageSubjects(context)

    const current = await this.repository.findById(id)
    if (!current) {
      throw new NotFoundError('Disciplina não encontrada')
    }

    const nextName = payload.name?.trim() ?? current.name
    const existing = await this.repository.findByName(nextName)
    if (existing && existing.id !== id) {
      throw new ValidationError('Disciplina já existe com esse nome')
    }

    return this.repository.update(id, {
      name: nextName,
      icon: payload.icon?.trim() || null
    })
  }

  private async ensureCanManageSubjects(context: SubjectContext) {
    const roleName = await this.repository.findRoleNameById(context.roleId)
    const isRoot = roleName?.toLowerCase() === 'root'

    if (isRoot) {
      return
    }

    const departmentId = await this.repository.findDepartmentIdByUserId(context.userId)
    const isAdministrative = departmentId === ADMINISTRATIVE_DEPARTMENT_ID

    if (!isAdministrative) {
      throw new UnauthorizedError('Apenas departamento administrativo ou root podem gerenciar disciplinas')
    }
  }
}
