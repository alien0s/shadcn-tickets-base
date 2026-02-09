import { EntitiesRepository } from './entities.repository.js'
import { CreateEntityRequest } from '@ticket-system/types'
import { ValidationError } from '../../shared/errors/AppError.js'

export class EntitiesService {
  private repository: EntitiesRepository

  constructor() {
    this.repository = new EntitiesRepository()
  }

  async listEntities() {
    return this.repository.findAll()
  }

  async createEntity(payload: CreateEntityRequest) {
    const existing = await this.repository.findByName(payload.name)
    if (existing) {
      throw new ValidationError('Entidade já cadastrada')
    }

    return this.repository.create(payload)
  }
}