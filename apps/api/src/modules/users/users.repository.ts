import { supabase } from '../../config/supabase.js'
import { User } from '@ticket-system/types'
import { NotFoundError } from '../../shared/errors/AppError.js'

export class UsersRepository {
  /**
 * Busca todos os usuários com paginação e ordenação
 * @param page - Número da página
 * @param limit - Quantidade de registros por página
 * @param sortBy - Campo para ordenar (ex: 'name', 'email', 'created_at')
 * @param order - Direção: 'asc' (crescente) ou 'desc' (decrescente)
 */
async findAll(
  page: number = 1, 
  limit: number = 10,
  sortBy: string = 'created_at',  // ← ADICIONAR
  order: 'asc' | 'desc' = 'desc'   // ← ADICIONAR
) {
  const offset = (page - 1) * limit

  // Validar campos permitidos para ordenação (segurança)
  const allowedSortFields = ['name', 'email', 'created_at', 'last_name']
  const validSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'created_at'

  const { data, error, count } = await supabase
    .from('users')
    .select('*', { count: 'exact' })
    .range(offset, offset + limit - 1)
    .order(validSortBy, { ascending: order === 'asc' }) // ← USAR PARÂMETROS DINÂMICOS

  if (error) throw error

  return { users: data as User[], total: count || 0 }
}

  async findById(id: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      throw new NotFoundError('Usuário não encontrado')
    }

    return data as User
  }

  async findByEmail(email: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()

    if (error) return null
    return data as User
  }

  async create(userData: Omit<User, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('users')
      .insert(userData)
      .select()
      .single()

    if (error) throw error
    return data as User
  }

  async update(id: string, userData: Partial<User>) {
    const { data, error } = await supabase
      .from('users')
      .update(userData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    if (!data) throw new NotFoundError('Usuário não encontrado')

    return data as User
  }

  async delete(id: string) {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id)

    if (error) throw error
  }
}
