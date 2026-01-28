import { UsersRepository } from './users.repository.js'
import { ValidationError } from '../../shared/errors/AppError.js'
import { User } from '@ticket-system/types'

export class UsersService {
  private repository: UsersRepository

  constructor() {
    this.repository = new UsersRepository()
  }

  async listUsers(page: number = 1, limit: number = 10) {
    return this.repository.findAll(page, limit)
  }

  async getUserById(id: string) {
    return this.repository.findById(id)
  }

  async createUser(userData: Omit<User, 'id' | 'created_at'>) {
    // Validar se email já existe
    const existingUser = await this.repository.findByEmail(userData.email)
    if (existingUser) {
      throw new ValidationError('Email já cadastrado')
    }

    return this.repository.create(userData)
  }

  async updateUser(id: string, userData: Partial<User>) {
    // Não permitir alterar email, entity_id, role_id por aqui
    const allowedFields = { name: userData.name, avatar_url: userData.avatar_url }
    return this.repository.update(id, allowedFields)
  }

  async deleteUser(id: string) {
    return this.repository.delete(id)
  }
}
