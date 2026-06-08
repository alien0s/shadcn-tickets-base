import {
  CreateTicketPriceRequest,
  UpdateTicketPriceRequest
} from '@ticket-system/types'
import { UnauthorizedError, ValidationError } from '../../shared/errors/AppError.js'
import { TicketPricesRepository } from './ticket-prices.repository.js'

type TicketPriceContext = {
  tenantId?: string
  roleId: string
}

type TicketPriceFilters = {
  schoolId?: string
  subjectId?: string
  educationLevelId?: string
}

export class TicketPricesService {
  private repository: TicketPricesRepository

  constructor() {
    this.repository = new TicketPricesRepository()
  }

  async listTicketPrices(context: TicketPriceContext, filters: TicketPriceFilters = {}) {
    const isRoot = await this.isRoot(context.roleId)

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

  async getTicketPriceById(context: TicketPriceContext, id: string) {
    const isRoot = await this.isRoot(context.roleId)

    if (!isRoot && !context.tenantId) {
      throw new UnauthorizedError('Tenant nao encontrado no token do usuario')
    }

    const ticketPrice = await this.repository.findById(id)

    if (!isRoot && ticketPrice.tenant_id !== context.tenantId) {
      throw new UnauthorizedError('Preco de ticket nao pertence ao tenant do usuario')
    }

    return ticketPrice
  }

  async createTicketPrice(context: TicketPriceContext, payload: CreateTicketPriceRequest) {
    const isRoot = await this.isRoot(context.roleId)

    if (!isRoot && !context.tenantId) {
      throw new UnauthorizedError('Tenant nao encontrado no token do usuario')
    }

    this.validateCombination(payload.subject_id, payload.education_level_id)
    this.validatePrice(payload.price_per_lesson)

    const school = await this.repository.findSchoolById(payload.school_id)

    if (!isRoot && school.tenant_id !== context.tenantId) {
      throw new UnauthorizedError('Escola nao pertence ao tenant do usuario')
    }

    const hasDuplicate = await this.repository.existsByCombination({
      schoolId: payload.school_id,
      subjectId: payload.subject_id ?? null,
      educationLevelId: payload.education_level_id ?? null
    })

    if (hasDuplicate) {
      throw new ValidationError('Ja existe preco cadastrado para esta combinacao')
    }

    return this.repository.create({
      ...payload,
      tenant_id: school.tenant_id
    })
  }

  async updateTicketPrice(context: TicketPriceContext, id: string, payload: UpdateTicketPriceRequest) {
    const isRoot = await this.isRoot(context.roleId)

    if (!isRoot && !context.tenantId) {
      throw new UnauthorizedError('Tenant nao encontrado no token do usuario')
    }

    const current = await this.repository.findById(id)

    if (!isRoot && current.tenant_id !== context.tenantId) {
      throw new UnauthorizedError('Preco de ticket nao pertence ao tenant do usuario')
    }

    const nextSchoolId = payload.school_id ?? current.school_id
    const nextSubjectId = payload.subject_id !== undefined ? payload.subject_id : current.subject_id ?? null
    const nextEducationLevelId = payload.education_level_id !== undefined
      ? payload.education_level_id
      : current.education_level_id ?? null
    const nextPrice = payload.price_per_lesson ?? current.price_per_lesson

    this.validateCombination(nextSubjectId, nextEducationLevelId)
    this.validatePrice(nextPrice)

    const school = await this.repository.findSchoolById(nextSchoolId)

    if (!isRoot && school.tenant_id !== context.tenantId) {
      throw new UnauthorizedError('Escola nao pertence ao tenant do usuario')
    }

    const hasDuplicate = await this.repository.existsByCombination({
      schoolId: nextSchoolId,
      subjectId: nextSubjectId,
      educationLevelId: nextEducationLevelId,
      excludeId: id
    })

    if (hasDuplicate) {
      throw new ValidationError('Ja existe preco cadastrado para esta combinacao')
    }

    return this.repository.update(id, {
      school_id: nextSchoolId,
      subject_id: nextSubjectId,
      education_level_id: nextEducationLevelId,
      price_per_lesson: nextPrice,
      tenant_id: school.tenant_id
    })
  }

  private async isRoot(roleId: string) {
    const roleName = await this.repository.findRoleNameById(roleId)
    return roleName?.toLowerCase() === 'root'
  }

  private validateCombination(subjectId?: string | null, educationLevelId?: string | null) {
    if (!subjectId && !educationLevelId) {
      throw new ValidationError('subject_id ou education_level_id deve ser informado')
    }
  }

  private validatePrice(price: number) {
    if (!Number.isFinite(price) || price <= 0) {
      throw new ValidationError('price_per_lesson deve ser maior que zero')
    }
  }
}
