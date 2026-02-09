import { RolesRepository } from './roles.repository.js'
import { ValidationError } from '../../shared/errors/AppError.js'

export class RolesService {
  private repository: RolesRepository

  constructor() {
    this.repository = new RolesRepository()
  }

  async listRoles() {
    return this.repository.findAll()
  }

  async validateUniqueName(name: string) {
    const existing = await this.repository.findByName(name)
    if (existing) {
      throw new ValidationError('Role já cadastrado')
    }
  }
}
