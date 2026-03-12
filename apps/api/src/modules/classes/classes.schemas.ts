import { z } from 'zod'

export const classesSchemas = {
  list: {
    querystring: {
      type: 'object',
      properties: {
        school_id: { type: 'string', format: 'uuid' },
        year: { type: 'integer' }
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
                school_id: { type: 'string', format: 'uuid' },
                shift: { type: 'integer' },
                education_level_id: { type: 'string' },
                series_id: { type: 'string', format: 'uuid' },
                suffix: { type: 'string' },
                series_name: { type: 'string' },
                series_education_level_name: { type: 'string' },
                education_level_name: { type: 'string' },
                name: { type: 'string' },
                code: { type: 'string' },
                year: { type: 'integer' },
                created_at: { type: 'string', format: 'date-time' },
                schedule_count: { type: 'integer' },
                teachers: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string', format: 'uuid' },
                      name: { type: 'string' },
                      avatar_url: { type: ['string', 'null'] }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}

export const createClassSchema = z.object({
  school_id: z.string().uuid('school_id invalido'),
  series_id: z.string().uuid('series_id invalido'),
  suffix: z.enum(['A', 'B', 'C', 'D', 'E'], { message: 'suffix invalido' }),
  shift: z.union([z.literal(1), z.literal(2)]),
  year: z.number().int().gte(2000, 'Ano invalido').lte(2100, 'Ano invalido')
})
