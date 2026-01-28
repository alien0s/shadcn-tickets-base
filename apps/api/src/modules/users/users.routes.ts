import { FastifyPluginAsync } from 'fastify'
import { UsersService } from './users.service.js'
import { usersSchemas } from './users.schemas.js'
import { authMiddleware } from '../../shared/middlewares/auth.middleware.js'
import { successResponse, paginatedResponse } from '../../shared/utils/response.js'

export const usersRoutes: FastifyPluginAsync = async (fastify) => {
  const usersService = new UsersService()

  // GET /api/users
  fastify.get('/', {
    schema: usersSchemas.list,
    //preHandler: [authMiddleware]
  }, async (request, reply) => {
    const { page, limit } = request.query as any
    const { users, total } = await usersService.listUsers(page, limit)
    return paginatedResponse(users, total, page, limit)
  })

  // GET /api/users/:id
  fastify.get('/:id', {
    schema: usersSchemas.getById,
    preHandler: [authMiddleware]
  }, async (request, reply) => {
    const { id } = request.params as any
    const user = await usersService.getUserById(id)
    return successResponse(user)
  })

  // POST /api/users
  fastify.post('/', {
    schema: usersSchemas.create,
    preHandler: [authMiddleware]
  }, async (request, reply) => {
    const user = await usersService.createUser(request.body as any)
    return reply.status(201).send(successResponse(user, 'Usuário criado com sucesso'))
  })

  // PATCH /api/users/:id
  fastify.patch('/:id', {
    schema: usersSchemas.update,
    preHandler: [authMiddleware]
  }, async (request, reply) => {
    const { id } = request.params as any
    const user = await usersService.updateUser(id, request.body as any)
    return successResponse(user, 'Usuário atualizado com sucesso')
  })

  // DELETE /api/users/:id
  fastify.delete('/:id', {
    schema: usersSchemas.getById,
    preHandler: [authMiddleware]
  }, async (request, reply) => {
    const { id } = request.params as any
    await usersService.deleteUser(id)
    return reply.status(204).send()
  })
}
