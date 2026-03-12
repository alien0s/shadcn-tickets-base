/**
 * Schemas de validação para rotas de autenticação
 * Usa JSON Schema para validação automática do Fastify
 */
export const authSchemas = {
  register: {
    body: {
      type: 'object',
      required: ['name', 'last_name', 'email', 'password', 'tenant_id', 'role_id'],
      properties: {
        name: { type: 'string', minLength: 3, maxLength: 255 },
        last_name: { type: 'string', minLength: 1, maxLength: 100 },
        email: { type: 'string', format: 'email' },
        password: { type: 'string', minLength: 8, maxLength: 100 },
        tenant_id: { type: 'string', format: 'uuid' },
        entity_id: { type: 'string', format: 'uuid' },
        role_id: { type: 'string', format: 'uuid' },
        avatar_url: { type: 'string', format: 'uri' }
      }
    }
  },
  
  login: {
    body: {
      type: 'object',
      required: ['email', 'password'],
      properties: {
        email: { type: 'string', format: 'email' },
        password: { type: 'string', minLength: 1 }
      }
    }
  },
  
  verify2FA: {
    body: {
      type: 'object',
      required: ['email', 'code'],
      properties: {
        email: { type: 'string', format: 'email' },
        code: { type: 'string', minLength: 6, maxLength: 6 }
      }
    }
  },
  
  forgotPassword: {
    body: {
      type: 'object',
      required: ['email'],
      properties: {
        email: { type: 'string', format: 'email' }
      }
    }
  },
  
  resetPassword: {
    body: {
      type: 'object',
      required: ['token', 'new_password'],
      properties: {
        token: { type: 'string', minLength: 1 },
        new_password: { type: 'string', minLength: 8, maxLength: 100 }
      }
    }
  },
  
  enable2FA: {
    // Requer autenticação via middleware
  },
  
  disable2FA: {
    // Requer autenticação via middleware
  }
}
