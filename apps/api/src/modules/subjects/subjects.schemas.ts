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
                created_at: { type: 'string', format: 'date-time' }
              }
            }
          }
        }
      }
    }
  }
}

export const createSubjectSchema = z.object({
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres').max(100, 'Nome deve ter no máximo 100 caracteres')
})
