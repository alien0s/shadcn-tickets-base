import {
  CreateSubjectWorkloadRequest,
  UpdateSubjectWorkloadRequest
} from '@ticket-system/types'
import { UnauthorizedError, ValidationError } from '../../shared/errors/AppError.js'
import { MatrixRepository } from './matrix.repository.js'

type MatrixContext = {
  tenantId?: string
  roleId: string
}

type MatrixFilters = {
  schoolId?: string
  seriesId?: string
}

export class MatrixService {
  private repository: MatrixRepository

  constructor() {
    this.repository = new MatrixRepository()
  }

  async listSubjectWorkloads(context: MatrixContext, filters: MatrixFilters = {}) {
    const roleName = await this.repository.findRoleNameById(context.roleId)
    const isRoot = roleName?.toLowerCase() === 'root'

    if (isRoot) {
      return this.repository.findAll(filters)
    }

    if (!context.tenantId) {
      throw new UnauthorizedError('Tenant nao encontrado no token do usuario')
    }

    if (filters.schoolId) {
      const schoolBelongsToTenant = await this.repository.isSchoolInTenant(filters.schoolId, context.tenantId)
      if (!schoolBelongsToTenant) {
        throw new UnauthorizedError('Escola nao pertence ao tenant do usuario')
      }
    }

    return this.repository.findAllByTenant(context.tenantId, filters)
  }

  async createSubjectWorkload(context: MatrixContext, payload: CreateSubjectWorkloadRequest) {
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

    if (!Number.isInteger(payload.weekly_classes) || payload.weekly_classes <= 0) {
      throw new ValidationError('weekly_classes deve ser um inteiro maior que zero')
    }

    const hasDuplicate = await this.repository.existsBySchoolSeriesSubject({
      schoolId: payload.school_id,
      seriesId: payload.series_id,
      subjectId: payload.subject_id
    })

    if (hasDuplicate) {
      throw new ValidationError('Ja existe carga cadastrada para esta escola, serie e disciplina')
    }

    return this.repository.create({
      ...payload,
      tenant_id: context.tenantId ?? ''
    })
  }

  async updateSubjectWorkload(context: MatrixContext, id: string, payload: UpdateSubjectWorkloadRequest) {
    const roleName = await this.repository.findRoleNameById(context.roleId)
    const isRoot = roleName?.toLowerCase() === 'root'

    if (!isRoot && !context.tenantId) {
      throw new UnauthorizedError('Tenant nao encontrado no token do usuario')
    }

    const current = await this.repository.findById(id)

    if (!isRoot && current.tenant_id !== context.tenantId) {
      throw new UnauthorizedError('Carga da matriz nao pertence ao tenant do usuario')
    }

    if (
      payload.weekly_classes !== undefined &&
      (!Number.isInteger(payload.weekly_classes) || payload.weekly_classes <= 0)
    ) {
      throw new ValidationError('weekly_classes deve ser um inteiro maior que zero')
    }

    return this.repository.update(id, {
      weekly_classes: payload.weekly_classes ?? current.weekly_classes,
      annual_hours: payload.annual_hours ?? current.annual_hours ?? null,
      is_mandatory: payload.is_mandatory ?? current.is_mandatory
    })
  }

  async deleteSubjectWorkload(context: MatrixContext, id: string) {
    const roleName = await this.repository.findRoleNameById(context.roleId)
    const isRoot = roleName?.toLowerCase() === 'root'

    if (!isRoot && !context.tenantId) {
      throw new UnauthorizedError('Tenant nao encontrado no token do usuario')
    }

    const current = await this.repository.findById(id)

    if (!isRoot && current.tenant_id !== context.tenantId) {
      throw new UnauthorizedError('Carga da matriz nao pertence ao tenant do usuario')
    }

    await this.repository.delete(id)
  }
}
