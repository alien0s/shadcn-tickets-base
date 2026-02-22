import { UsersRepository } from './users.repository.js'
import { ValidationError } from '../../shared/errors/AppError.js'
import { User } from '@ticket-system/types'

export class UsersService {
  private repository: UsersRepository

  constructor() {
    this.repository = new UsersRepository()
  }

  /**
 * Lista usuários com paginação e ordenação
 * @param page - Número da página (padrão: 1)
 * @param limit - Itens por página (padrão: 10)
 * @param sortBy - Campo para ordenar (padrão: 'created_at')
 * @param order - Direção da ordenação: 'asc' ou 'desc' (padrão: 'desc')
 */
  async listUsers(
    page: number = 1,
    limit: number = 10,
    sortBy: string = 'created_at',  // ← ADICIONAR
    order: 'asc' | 'desc' = 'desc'   // ← ADICIONAR
  ) {
    return this.repository.findAll(page, limit, sortBy, order)
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

  async updateUser(
    id: string,
    userData: Partial<User> & {
      last_name?: string
      email?: string
      entity_id?: string
      department_id?: string
      role_id?: string
    }
  ) {
    const allowedFields = {
      name: userData.name,
      last_name: userData.last_name,
      email: userData.email,
      entity_id: userData.entity_id,
      department_id: userData.department_id,
      role_id: userData.role_id,
      avatar_url: userData.avatar_url,
      is_active: userData.is_active
    }
    return this.repository.update(id, allowedFields)
  }

  async deleteUser(id: string) {
    return this.repository.delete(id)
  }
}
