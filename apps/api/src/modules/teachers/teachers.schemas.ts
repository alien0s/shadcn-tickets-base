import { z } from 'zod'

export const teachersSchemas = {
  list: {
    querystring: {
      type: 'object',
      properties: {
        school_id: { type: 'string', format: 'uuid' },
        active: { type: 'boolean' }
      }
    },
    response: {
      200: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          message: { type: 'string' },
          data: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string', format: 'uuid' },
                tenant_id: { type: 'string', format: 'uuid' },
                school_id: { type: 'string', format: 'uuid' },
                name: { type: 'string' },
                email: { type: 'string' },
                avatar_url: { type: 'string' },
                active: { type: 'boolean' },
                created_at: { type: 'string', format: 'date-time' },
                subjects: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string', format: 'uuid' },
                      name: { type: 'string' }
                    },
                    required: ['id', 'name']
                  }
                }
              }
            }
          }
        }
      }
    }
  }
  ,
  create: {
    body: {
      type: 'object',
      required: ['name', 'school_id'],
      properties: {
        name: { type: 'string', minLength: 2, maxLength: 255 },
        email: { type: 'string', format: 'email' },
        school_id: { type: 'string', format: 'uuid' },
        active: { type: 'boolean' },
        avatar_url: {
          oneOf: [
            { type: 'string', format: 'uri' },
            { type: 'null' }
          ]
        },
        subject_ids: {
          type: 'array',
          items: { type: 'string', format: 'uuid' }
        }
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
        name: { type: 'string', minLength: 2, maxLength: 255 },
        email: { type: 'string', format: 'email' },
        school_id: { type: 'string', format: 'uuid' },
        active: { type: 'boolean' },
        avatar_url: { type: 'string', format: 'uri' },
        subject_ids: {
          type: 'array',
          items: { type: 'string', format: 'uuid' }
        }
      }
    }
  }
}

export const createTeacherSchema = z.object({
  name: z.string().trim().min(2).max(255),
  email: z.string().trim().email().optional(),
  school_id: z.string().uuid(),
  active: z.boolean().optional(),
  avatar_url: z.string().url().optional(),
  subject_ids: z.array(z.string().uuid()).optional()
})

export const updateTeacherSchema = z.object({
  name: z.string().trim().min(2).max(255).optional(),
  email: z.string().trim().email().optional(),
  school_id: z.string().uuid().optional(),
  active: z.boolean().optional(),
  avatar_url: z.string().url().nullable().optional(),
  subject_ids: z.array(z.string().uuid()).optional()
})
