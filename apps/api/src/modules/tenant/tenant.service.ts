import type { UpdateTenantInfoRequest } from '@ticket-system/types'
import { UnauthorizedError, ValidationError } from '../../shared/errors/AppError.js'
import { TenantRepository } from './tenant.repository.js'

type GetTenantInfoContext = {
  tenantId?: string
  roleId: string
  selectedTenantId?: string
}

export class TenantService {
  private repository: TenantRepository

  constructor() {
    this.repository = new TenantRepository()
  }

  async getCurrentTenantInfo(context: GetTenantInfoContext) {
    const tenantId = await this.resolveTenantId(context)
    return this.repository.findInfoById(tenantId)
  }

  async updateCurrentTenantInfo(context: GetTenantInfoContext, payload: UpdateTenantInfoRequest) {
    const tenantId = await this.resolveTenantId(context)
    await this.repository.findInfoById(tenantId)

    return this.repository.updateInfo(tenantId, {
      ...payload,
      name: payload.name.trim(),
      slug: payload.slug.trim().toLowerCase(),
      profile: payload.profile
        ? {
            ...payload.profile,
            state: payload.profile.state?.trim().toUpperCase() ?? null
          }
        : undefined
    })
  }

  private async resolveTenantId(context: GetTenantInfoContext) {
    const roleName = await this.repository.findRoleNameById(context.roleId)
    const isRoot = roleName?.toLowerCase() === 'root'
    const tenantId = isRoot ? context.selectedTenantId ?? context.tenantId : context.tenantId

    if (!tenantId) {
      if (isRoot) {
        throw new ValidationError('Selecione uma empresa para visualizar as informacoes')
      }

      throw new UnauthorizedError('Tenant nao encontrado no token do usuario')
    }

    return tenantId
  }
}
