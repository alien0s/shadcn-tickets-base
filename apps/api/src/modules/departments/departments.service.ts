import { DepartmentsRepository } from './departments.repository.js'
import { CreateDepartmentRequest } from '@ticket-system/types'
import { ValidationError } from '../../shared/errors/AppError.js'

export class DepartmentsService {
  private repository: DepartmentsRepository

  constructor() {
    this.repository = new DepartmentsRepository()
  }

  async listDepartments() {
    return this.repository.findAll()
  }

  async createDepartment(payload: CreateDepartmentRequest) {
  // Validar se departamento já existe
  const existing = await this.repository.findByName(payload.name)
  if (existing) {
    throw new ValidationError('Departamento já existe com esse nome')
  }
  
  return this.repository.create(payload)
}
}
