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
      required: ['name', 'email', 'entity_id', 'role_id'],
      properties: {
        name: { type: 'string', minLength: 3, maxLength: 255 },
        email: { type: 'string', format: 'email' },
        entity_id: { type: 'string', format: 'uuid' },
        role_id: { type: 'string', format: 'uuid' },
        avatar_url: { type: 'string', format: 'uri' }
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
        avatar_url: { type: 'string', format: 'uri' }
      }
    }
  }
}
