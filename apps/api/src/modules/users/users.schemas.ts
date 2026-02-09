export const usersSchemas = {
  list: {
    querystring: {
      type: 'object',
      properties: {
        page: { type: 'integer', minimum: 1, default: 1 },
        limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 }
      }
    }
  },

  getById: {
    params: {
      type: 'object',
      required: ['id'],
      properties: {
        id: { type: 'string', format: 'uuid' }
      }
    }
  },

  create: {
    body: {
      type: 'object',
      required: ['name', 'last_name', 'email', 'department_id', 'role_id', 'entity_id'],
      properties: {
        name: { type: 'string', minLength: 3, maxLength: 255 },
        last_name: { type: 'string', minLength: 3, maxLength: 50 },
        email: { type: 'string', format: 'email' },
        department_id: { type: 'string', format: 'uuid' },
        entity_id: { type: 'string', format: 'uuid' },
        role_id: { type: 'string', format: 'uuid' },
        avatar_url: { type: 'string', format: 'uri' },
        is_active: { type: 'boolean' }
      }
    }
  },

  update: {
    params: {
      type: 'object',
      required: ['id'],
      properties: {
        id: { type: 'string', format: 'uuid' }
      }
    },
    body: {
      type: 'object',
      properties: {
        name: { type: 'string', minLength: 3, maxLength: 255 },
        last_name: { type: 'string', minLength: 2, maxLength: 50 },
        email: { type: 'string', format: 'email' },
        department_id: { type: 'string', format: 'uuid' },
        entity_id: { type: 'string', format: 'uuid' },
        role_id: { type: 'string', format: 'uuid' },
        avatar_url: { type: 'string', format: 'uri' },
        is_active: { type: 'boolean' }
      }
    }
  }
}
