import { CreateTimeSlotRequest } from '@ticket-system/types'
import { UnauthorizedError, ValidationError } from '../../shared/errors/AppError.js'
import { TimeSlotsRepository } from './time-slots.repository.js'

type ListTimeSlotsContext = {
  tenantId?: string
  roleId: string
}

type ListTimeSlotsFilters = {
  schoolId: string
  shift?: number
}

type CreateTimeSlotContext = {
  tenantId?: string
  roleId: string
}

export class TimeSlotsService {
  private repository: TimeSlotsRepository

  constructor() {
    this.repository = new TimeSlotsRepository()
  }

  async listTimeSlots(context: ListTimeSlotsContext, filters: ListTimeSlotsFilters) {
    const roleName = await this.repository.findRoleNameById(context.roleId)
    const isRoot = roleName?.toLowerCase() === 'root'

    if (isRoot) {
      return this.repository.findAll(filters)
    }

    if (!context.tenantId) {
      throw new UnauthorizedError('Tenant não encontrado no token do usuário')
    }

    return this.repository.findAllByTenant(context.tenantId, filters)
  }

  async createTimeSlot(context: CreateTimeSlotContext, payload: CreateTimeSlotRequest) {
    const roleName = await this.repository.findRoleNameById(context.roleId)
    const isRoot = roleName?.toLowerCase() === 'root'

    if (!isRoot && !context.tenantId) {
      throw new UnauthorizedError('Tenant não encontrado no token do usuário')
    }

    if (!isRoot && context.tenantId) {
      const schoolBelongsToTenant = await this.repository.isSchoolInTenant(payload.school_id, context.tenantId)
      if (!schoolBelongsToTenant) {
        throw new UnauthorizedError('Escola não pertence ao tenant do usuário')
      }
    }

    const tenantId = isRoot ? payload.tenant_id : context.tenantId
    if (!tenantId) {
      throw new ValidationError('tenant_id é obrigatório para criar horário')
    }

    return this.repository.create({
      ...payload,
      tenant_id: tenantId
    })
  }
}
