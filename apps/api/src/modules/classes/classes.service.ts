import { CreateClassRequest } from '@ticket-system/types'
import { UnauthorizedError, ValidationError } from '../../shared/errors/AppError.js'
import { ClassesRepository } from './classes.repository.js'

const ADMINISTRATIVE_DEPARTMENT_ID = '7240712b-96de-418a-b6b3-344d12d64237'

type ListClassesContext = {
  userId: string
  tenantId?: string
  roleId: string
}

type ListClassesFilters = {
  schoolId?: string
  year?: number
}

type CreateClassContext = {
  tenantId?: string
  roleId: string
}

type DeleteClassContext = {
  tenantId?: string
  roleId: string
}

export class ClassesService {
  private repository: ClassesRepository

  constructor() {
    this.repository = new ClassesRepository()
  }

  async listClasses(context: ListClassesContext, filters: ListClassesFilters = {}) {
    const roleName = await this.repository.findRoleNameById(context.roleId)
    const isRoot = roleName?.toLowerCase() === 'root'

    if (isRoot) {
      return this.repository.findAll(filters)
    }

    if (!context.tenantId) {
      throw new UnauthorizedError('Tenant nao encontrado no token do usuario')
    }

    const departmentId = await this.repository.findDepartmentIdByUserId(context.userId)
    const isAdministrativeDepartment = departmentId === ADMINISTRATIVE_DEPARTMENT_ID

    if (isAdministrativeDepartment) {
      return this.repository.findAllByTenant(context.tenantId, filters)
    }

    return this.repository.findAllByTenant(context.tenantId, filters)
  }

  async createClass(context: CreateClassContext, payload: CreateClassRequest) {
    const roleName = await this.repository.findRoleNameById(context.roleId)
    const isRoot = roleName?.toLowerCase() === 'root'

    if (!isRoot && !context.tenantId) {
      throw new UnauthorizedError('Tenant nao encontrado no token do usuario')
    }

    if (!isRoot && context.tenantId) {
      const schoolBelongsToTenant = await this.repository.isSchoolInTenant(payload.school_id, context.tenantId)
      if (!schoolBelongsToTenant) {
        throw new UnauthorizedError('Escola nao pertence ao tenant do usuario')
      }
    }

    const duplicatedClass = await this.repository.existsBySeriesSuffixInSchoolYear(
      payload.school_id,
      payload.series_id,
      payload.suffix,
      payload.shift,
      payload.year
    )

    if (duplicatedClass) {
      throw new ValidationError('Ja existe turma com esta serie/sufixo para esta escola e ano')
    }

    return this.repository.create(payload)
  }

  async deleteClass(context: DeleteClassContext, classId: string) {
    const roleName = await this.repository.findRoleNameById(context.roleId)
    const isRoot = roleName?.toLowerCase() === 'root'

    if (!isRoot && !context.tenantId) {
      throw new UnauthorizedError('Tenant nao encontrado no token do usuario')
    }

    const currentClass = await this.repository.findById(classId)

    if (!isRoot && context.tenantId) {
      const schoolBelongsToTenant = await this.repository.isSchoolInTenant(currentClass.school_id, context.tenantId)
      if (!schoolBelongsToTenant) {
        throw new UnauthorizedError('Turma nao pertence ao tenant do usuario')
      }
    }

    await this.repository.deleteSchedulesByClassId(classId)
    await this.repository.delete(classId)
  }
}
