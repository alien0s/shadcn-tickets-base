import { UsersRepository } from './users.repository.js'
import { ValidationError } from '../../shared/errors/AppError.js'
import { User } from '@ticket-system/types'

const ADMIN_DEPARTMENT_ID = '7240712b-96de-418a-b6b3-344d12d64237'

export class UsersService {
  private repository: UsersRepository

  constructor() {
    this.repository = new UsersRepository()
  }

  async listUsers(
    page: number = 1,
    limit: number = 10,
    sortBy: string = 'created_at',
    order: 'asc' | 'desc' = 'desc',
    requesterId?: string
  ) {
    if (!requesterId) {
      return this.repository.findAll(page, limit, sortBy, order)
    }

    const requester = await this.repository.findAccessContextById(requesterId)

    if (requester.role_name !== 'client') {
      return this.repository.findAll(page, limit, sortBy, order)
    }

    if (requester.department_id === ADMIN_DEPARTMENT_ID) {
      const tenantId = requester.tenant_id
      if (!tenantId) {
        throw new ValidationError('Usuario client sem tenant vinculado')
      }

      return this.repository.findAllByTenant(tenantId, page, limit, sortBy, order)
    }

    return this.repository.findAllByUserId(requester.id, page, limit, sortBy, order)
  }

  async getUserById(id: string) {
    return this.repository.findById(id)
  }

  async createUser(userData: Omit<User, 'id' | 'created_at'>) {
    const existingUser = await this.repository.findByEmail(userData.email)
    if (existingUser) {
      throw new ValidationError('Email ja cadastrado')
    }

    return this.repository.create(userData)
  }

  async updateUser(
    id: string,
    userData: Partial<User> & {
      last_name?: string
      email?: string
      phone?: string
      entity_id?: string
      department_id?: string
      role_id?: string
    }
  ) {
    const allowedFields = {
      name: userData.name,
      last_name: userData.last_name,
      email: userData.email,
      phone: userData.phone,
      entity_id: userData.entity_id,
      department_id: userData.department_id,
      role_id: userData.role_id,
      avatar_url: userData.avatar_url,
      is_active: userData.is_active
    }
    return this.repository.update(id, allowedFields)
  }

  async updateUserAvatar(id: string, avatarUrl: string) {
    return this.repository.update(id, { avatar_url: avatarUrl })
  }

  async deleteUser(id: string) {
    return this.repository.delete(id)
  }
}
