import { z } from 'zod'

export const timeSlotsSchemas = {
  list: {
    querystring: {
      type: 'object',
      required: ['school_id'],
      properties: {
        school_id: { type: 'string', format: 'uuid' },
        shift: { type: 'integer', minimum: 1, maximum: 3 }
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
                shift: { type: 'integer' },
                order_index: { type: 'integer' },
                start_time: { type: 'string' },
                end_time: { type: 'string' },
                is_break: { type: 'boolean' },
                break_label: { type: ['string', 'null'] },
                created_at: { type: 'string', format: 'date-time' }
              }
            }
          }
        }
      }
    }
  }
}

export const createTimeSlotSchema = z.object({
  tenant_id: z.string().uuid('tenant_id inválido').optional(),
  school_id: z.string().uuid('school_id inválido'),
  shift: z.number().int().min(1).max(3),
  order_index: z.number().int().min(1),
  start_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'start_time inválido'),
  end_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'end_time inválido'),
  is_break: z.boolean().optional(),
  break_label: z.string().max(50).nullable().optional()
})
