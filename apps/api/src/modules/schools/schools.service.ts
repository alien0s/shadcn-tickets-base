import { CreateSchoolRequest, UpdateSchoolRequest } from '@ticket-system/types'
import { UnauthorizedError, ValidationError } from '../../shared/errors/AppError.js'
import { SchoolsRepository } from './schools.repository.js'

type ListSchoolsContext = {
  tenantId?: string
  roleId: string
}

type CreateSchoolContext = {
  tenantId?: string
  roleId: string
}

type DeleteSchoolContext = {
  tenantId?: string
  roleId: string
}

type UpdateSchoolContext = {
  tenantId?: string
  roleId: string
}

export class SchoolsService {
  private repository: SchoolsRepository

  constructor() {
    this.repository = new SchoolsRepository()
  }

  async listSchools(context: ListSchoolsContext) {
    const roleName = await this.repository.findRoleNameById(context.roleId)
    const isRoot = roleName?.toLowerCase() === 'root'

    if (isRoot) {
      return this.repository.findAll()
    }

    if (!context.tenantId) {
      throw new UnauthorizedError('Tenant não encontrado no token do usuário')
    }

    return this.repository.findAllByTenant(context.tenantId)
  }

  async createSchool(context: CreateSchoolContext, payload: CreateSchoolRequest) {
    const roleName = await this.repository.findRoleNameById(context.roleId)
    const isRoot = roleName?.toLowerCase() === 'root'

    if (!isRoot && !context.tenantId) {
      throw new UnauthorizedError('Tenant nao encontrado no token do usuario')
    }

    const tenantId = isRoot ? payload.tenant_id ?? context.tenantId : context.tenantId

    if (!tenantId) {
      throw new ValidationError('tenant_id e obrigatorio para criar escola')
    }

    const normalizedName = payload.name.trim()
    const normalizedAbbreviation = payload.abbreviation.trim().toUpperCase()

    if (!normalizedName) {
      throw new ValidationError('Nome da escola e obrigatorio')
    }

    if (!normalizedAbbreviation) {
      throw new ValidationError('Sigla da escola e obrigatoria')
    }

    const hasDuplicate = await this.repository.existsByNameOrAbbreviationInTenant({
      tenantId,
      name: normalizedName,
      abbreviation: normalizedAbbreviation
    })

    if (hasDuplicate) {
      throw new ValidationError('Ja existe escola com este nome ou sigla neste tenant')
    }

    return this.repository.create({
      tenant_id: tenantId,
      name: normalizedName,
      abbreviation: normalizedAbbreviation,
      active: payload.active ?? true
    })
  }

  async deleteSchool(context: DeleteSchoolContext, schoolId: string) {
    const roleName = await this.repository.findRoleNameById(context.roleId)
    const isRoot = roleName?.toLowerCase() === 'root'

    if (!isRoot && !context.tenantId) {
      throw new UnauthorizedError('Tenant nao encontrado no token do usuario')
    }

    const school = await this.repository.findById(schoolId)

    if (!isRoot && school.tenant_id !== context.tenantId) {
      throw new UnauthorizedError('Escola nao pertence ao tenant do usuario')
    }

    await this.repository.delete(schoolId)
  }

  async updateSchool(context: UpdateSchoolContext, schoolId: string, payload: UpdateSchoolRequest) {
    const roleName = await this.repository.findRoleNameById(context.roleId)
    const isRoot = roleName?.toLowerCase() === 'root'

    if (!isRoot && !context.tenantId) {
      throw new UnauthorizedError('Tenant nao encontrado no token do usuario')
    }

    const currentSchool = await this.repository.findById(schoolId)

    if (!isRoot && currentSchool.tenant_id !== context.tenantId) {
      throw new UnauthorizedError('Escola nao pertence ao tenant do usuario')
    }

    const normalizedName = payload.name.trim()
    const normalizedAbbreviation = payload.abbreviation.trim().toUpperCase()

    if (!normalizedName) {
      throw new ValidationError('Nome da escola e obrigatorio')
    }

    if (!normalizedAbbreviation) {
      throw new ValidationError('Sigla da escola e obrigatoria')
    }

    const hasDuplicate = await this.repository.existsByNameOrAbbreviationInTenant({
      tenantId: currentSchool.tenant_id,
      name: normalizedName,
      abbreviation: normalizedAbbreviation,
      excludeSchoolId: schoolId
    })

    if (hasDuplicate) {
      throw new ValidationError('Ja existe escola com este nome ou sigla neste tenant')
    }

    return this.repository.update(schoolId, {
      name: normalizedName,
      abbreviation: normalizedAbbreviation,
      active: payload.active ?? currentSchool.active
    })
  }
}
