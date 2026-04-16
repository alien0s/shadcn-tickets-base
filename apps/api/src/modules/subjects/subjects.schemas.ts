import { z } from 'zod'

export const subjectsSchemas = {
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
                name: { type: 'string' },
                icon: { type: 'string', nullable: true },
                created_at: { type: 'string', format: 'date-time' }
              }
            }
          }
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
        name: { type: 'string', minLength: 2, maxLength: 100 },
        icon: { type: 'string', nullable: true, maxLength: 50 }
      }
    }
  }
}

export const createSubjectSchema = z.object({
  name: z.string().trim().min(2, 'Nome deve ter no mínimo 2 caracteres').max(100, 'Nome deve ter no máximo 100 caracteres'),
  icon: z.string().trim().max(50, 'Ícone deve ter no máximo 50 caracteres').nullable().optional()
})

export const updateSubjectSchema = z.object({
  name: z.string().trim().min(2, 'Nome deve ter no mínimo 2 caracteres').max(100, 'Nome deve ter no máximo 100 caracteres').optional(),
  icon: z.string().trim().max(50, 'Ícone deve ter no máximo 50 caracteres').nullable().optional()
})

export const subjectIdParamsSchema = z.object({
  id: z.string().uuid('id inválido')
})
