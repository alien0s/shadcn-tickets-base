import { FastifyPluginAsync } from 'fastify'
import { UsersService } from './users.service.js'
import { usersSchemas } from './users.schemas.js'
import { authMiddleware } from '../../shared/middlewares/auth.middleware.js'
import { successResponse, paginatedResponse } from '../../shared/utils/response.js'

const userSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    name: { type: 'string' },
    last_name: { type: 'string' },
    email: { type: 'string', format: 'email' },
    department_id: { type: 'string', format: 'uuid' },
    entity_id: { type: 'string', format: 'uuid' },
    role_id: { type: 'string', format: 'uuid' },
    avatar_url: { type: 'string', format: 'uri' },
    is_active: { type: 'boolean' },
    created_at: { type: 'string', format: 'date-time' },
    updated_at: { type: 'string', format: 'date-time' }
  }
}

const errorResponseSchema = {
  type: 'object',
  properties: {
    error: { type: 'string' },
    message: { type: 'string' }
  }
}

const successUserResponseSchema = {
  type: 'object',
  properties: {
    success: { type: 'boolean' },
    message: { type: 'string' },
    data: userSchema
  }
}

const paginatedUsersResponseSchema = {
  type: 'object',
  properties: {
    success: { type: 'boolean' },
    data: {
      type: 'array',
      items: userSchema
    },
    pagination: {
      type: 'object',
      properties: {
        total: { type: 'integer' },
        page: { type: 'integer' },
        limit: { type: 'integer' },
        totalPages: { type: 'integer' }
      }
    }
  }
}

export const usersRoutes: FastifyPluginAsync = async (fastify) => {
  const usersService = new UsersService()

  // GET /api/users
fastify.get('/', {
  schema: {
    ...usersSchemas.list,
    tags: ['Users'],
    summary: 'List users',
    description: 'Retrieve paginated list of users with optional sorting',
    querystring: {
      type: 'object',
      properties: {
        ...usersSchemas.list.querystring.properties,
        sortBy: { type: 'string', default: 'created_at', description: 'Field to sort by' },
        order: { type: 'string', enum: ['asc', 'desc'], default: 'desc', description: 'Sort order' }
      }
    },
    response: {
      200: {
        description: 'Successful response',
        ...paginatedUsersResponseSchema
      },
      400: {
        description: 'Bad request',
        ...errorResponseSchema
      },
      500: {
        description: 'Internal server error',
        ...errorResponseSchema
      }
    }
  },
  //preHandler: [authMiddleware]
}, async (request, reply) => {
  // Extrai query params com valores padrão
  const { 
    page = 1, 
    limit = 10,
    sortBy = 'created_at',  // ← ADICIONAR: campo padrão para ordenar
    order = 'desc'           // ← ADICIONAR: direção padrão (desc/asc)
  } = request.query as any

  
  
  // Passa todos os parâmetros para o service
  const { users, total } = await usersService.listUsers(page, limit, sortBy, order)
  return paginatedResponse(users, total, page, limit)
})

  // GET /api/users/:id
  fastify.get('/:id', {
    schema: {
      ...usersSchemas.getById,
      tags: ['Users'],
      summary: 'Get user by id',
      description: 'Retrieve a single user by id',
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          description: 'Successful response',
          ...successUserResponseSchema
        },
        401: {
          description: 'Unauthorized',
          ...errorResponseSchema
        },
        404: {
          description: 'User not found',
          ...errorResponseSchema
        },
        500: {
          description: 'Internal server error',
          ...errorResponseSchema
        }
      }
    },
    preHandler: [authMiddleware]
  }, async (request, reply) => {
    const { id } = request.params as any
    const user = await usersService.getUserById(id)
    return successResponse(user)
  })

  // POST /api/users
  fastify.post('/', {
    schema: {
      ...usersSchemas.create,
      tags: ['Users'],
      summary: 'Create user',
      description: 'Create a new user',
      security: [{ bearerAuth: [] }],
      response: {
        201: {
          description: 'User created',
          ...successUserResponseSchema
        },
        400: {
          description: 'Bad request',
          ...errorResponseSchema
        },
        401: {
          description: 'Unauthorized',
          ...errorResponseSchema
        },
        500: {
          description: 'Internal server error',
          ...errorResponseSchema
        }
      }
    },
    preHandler: [authMiddleware]
  }, async (request, reply) => {
    const user = await usersService.createUser(request.body as any)
    return reply.status(201).send(successResponse(user, 'Usuário criado com sucesso'))
  })

  // PATCH /api/users/:id
  fastify.patch('/:id', {
    schema: {
      ...usersSchemas.update,
      tags: ['Users'],
      summary: 'Update user',
      description: 'Update an existing user by id',
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          description: 'User updated',
          ...successUserResponseSchema
        },
        400: {
          description: 'Bad request',
          ...errorResponseSchema
        },
        401: {
          description: 'Unauthorized',
          ...errorResponseSchema
        },
        404: {
          description: 'User not found',
          ...errorResponseSchema
        },
        500: {
          description: 'Internal server error',
          ...errorResponseSchema
        }
      }
    },
    preHandler: [authMiddleware]
  }, async (request, reply) => {
    const { id } = request.params as any
    const user = await usersService.updateUser(id, request.body as any)
    return successResponse(user, 'Usuário atualizado com sucesso')
  })

  // DELETE /api/users/:id
  fastify.delete('/:id', {
    schema: {
      ...usersSchemas.getById,
      tags: ['Users'],
      summary: 'Delete user',
      description: 'Delete an existing user by id',
      security: [{ bearerAuth: [] }],
      response: {
        204: {
          description: 'User deleted',
          type: 'null'
        },
        401: {
          description: 'Unauthorized',
          ...errorResponseSchema
        },
        403: {
          description: 'Forbidden',
          ...errorResponseSchema
        },
        404: {
          description: 'User not found',
          ...errorResponseSchema
        },
        500: {
          description: 'Internal server error',
          ...errorResponseSchema
        }
      }
    },
    preHandler: [authMiddleware]
  }, async (request, reply) => {
    const { id } = request.params as any

      // ✅ SEGURANÇA: Não permite excluir próprio usuário
  if (request.user.id === id) {
    return reply.status(403).send({ 
      error: 'Você não pode excluir sua própria conta' 
    })
  }
  
    await usersService.deleteUser(id)
    return reply.status(204).send()
  })
}
