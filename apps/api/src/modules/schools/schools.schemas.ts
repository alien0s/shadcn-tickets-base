import { z } from 'zod'

export const schoolsSchemas = {
  list: {
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
                name: { type: 'string' },
                abbreviation: { type: 'string' },
                active: { type: 'boolean' },
                created_at: { type: 'string', format: 'date-time' }
              }
            }
          }
        }
      }
    }
  },
  create: {
    body: {
      type: 'object',
      required: ['name', 'abbreviation'],
      properties: {
        tenant_id: { type: 'string', format: 'uuid' },
        name: { type: 'string', minLength: 1, maxLength: 255 },
        abbreviation: { type: 'string', minLength: 1, maxLength: 7 },
        active: { type: 'boolean' }
      }
    },
    response: {
      201: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          message: { type: 'string' },
          data: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              tenant_id: { type: 'string', format: 'uuid' },
              name: { type: 'string' },
              abbreviation: { type: 'string' },
              active: { type: 'boolean' },
              created_at: { type: 'string', format: 'date-time' }
            }
          }
        }
      }
    }
  },
  update: {
    params: {
      type: 'object',
      required: ['school_id'],
      properties: {
        school_id: { type: 'string', format: 'uuid' }
      }
    },
    body: {
      type: 'object',
      required: ['name', 'abbreviation'],
      properties: {
        name: { type: 'string', minLength: 1, maxLength: 255 },
        abbreviation: { type: 'string', minLength: 1, maxLength: 7 },
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
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              tenant_id: { type: 'string', format: 'uuid' },
              name: { type: 'string' },
              abbreviation: { type: 'string' },
              active: { type: 'boolean' },
              created_at: { type: 'string', format: 'date-time' }
            }
          }
        }
      }
    }
  },
  delete: {
    params: {
      type: 'object',
      required: ['school_id'],
      properties: {
        school_id: { type: 'string', format: 'uuid' }
      }
    }
  }
}

export const createSchoolSchema = z.object({
  tenant_id: z.string().uuid('tenant_id invalido').optional(),
  name: z.string().trim().min(1, 'name invalido').max(255, 'name invalido'),
  abbreviation: z.string().trim().min(1, 'abbreviation invalida').max(7, 'abbreviation invalida'),
  active: z.boolean().optional()
})

export const updateSchoolSchema = z.object({
  name: z.string().trim().min(1, 'name invalido').max(255, 'name invalido'),
  abbreviation: z.string().trim().min(1, 'abbreviation invalida').max(7, 'abbreviation invalida'),
  active: z.boolean().optional()
})

export const deleteSchoolParamsSchema = z.object({
  school_id: z.string().uuid('school_id invalido')
})
