import { UnauthorizedError } from '../../shared/errors/AppError.js'
import { SchoolsRepository } from './schools.repository.js'

type ListSchoolsContext = {
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
}

