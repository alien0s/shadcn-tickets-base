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
  },
  deleteGrade: {
    params: {
      type: 'object',
      required: ['school_id'],
      properties: {
        school_id: { type: 'string', format: 'uuid' }
      }
    },
    response: {
      200: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          message: { type: 'string' },
          data: { type: 'null' }
        }
      }
    }
  },
  createGrade: {
    body: {
      type: 'object',
      required: ['school_id', 'lesson_minutes'],
      properties: {
        tenant_id: { type: 'string', format: 'uuid' },
        school_id: { type: 'string', format: 'uuid' },
        lesson_minutes: { type: 'integer', minimum: 1, maximum: 180 },
        morning: {
          type: ['object', 'null'],
          properties: {
            start_time: { type: 'string' },
            end_time: { type: 'string' }
          }
        },
        afternoon: {
          type: ['object', 'null'],
          properties: {
            start_time: { type: 'string' },
            end_time: { type: 'string' }
          }
        },
        night: {
          type: ['object', 'null'],
          properties: {
            start_time: { type: 'string' },
            end_time: { type: 'string' }
          }
        },
        breaks: {
          type: 'array',
          items: {
            type: 'object',
            required: ['start_time', 'end_time'],
            properties: {
              start_time: { type: 'string' },
              end_time: { type: 'string' },
              break_label: { type: ['string', 'null'] }
            }
          }
        }
      }
    },
    response: {
      201: {
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
  },
  importGrade: {
    body: {
      type: 'object',
      required: ['source_school_id', 'target_school_id'],
      properties: {
        source_school_id: { type: 'string', format: 'uuid' },
        target_school_id: { type: 'string', format: 'uuid' },
        overwrite: { type: 'boolean' }
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
  tenant_id: z.string().uuid('tenant_id invalido').optional(),
  school_id: z.string().uuid('school_id invalido'),
  shift: z.number().int().min(1).max(3),
  order_index: z.number().int().min(1),
  start_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'start_time invalido'),
  end_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'end_time invalido'),
  is_break: z.boolean().optional(),
  break_label: z.string().max(50).nullable().optional()
})

const timeRangeSchema = z.object({
  start_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'start_time invalido'),
  end_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'end_time invalido')
})

export const createTimeSlotsGradeSchema = z.object({
  tenant_id: z.string().uuid('tenant_id invalido').optional(),
  school_id: z.string().uuid('school_id invalido'),
  lesson_minutes: z.number().int().min(1).max(180),
  morning: timeRangeSchema.nullish(),
  afternoon: timeRangeSchema.nullish(),
  night: timeRangeSchema.nullish(),
  breaks: z.array(
    z.object({
      start_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'start_time invalido'),
      end_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'end_time invalido'),
      break_label: z.string().max(50).nullable().optional()
    })
  ).optional()
}).superRefine((payload, ctx) => {
  if (!payload.morning && !payload.afternoon && !payload.night) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Informe pelo menos um turno'
    })
  }
})

export const deleteTimeSlotsGradeSchema = z.object({
  school_id: z.string().uuid('school_id invalido')
})

export const importTimeSlotsGradeSchema = z.object({
  source_school_id: z.string().uuid('source_school_id invalido'),
  target_school_id: z.string().uuid('target_school_id invalido'),
  overwrite: z.boolean().optional()
}).superRefine((payload, ctx) => {
  if (payload.source_school_id === payload.target_school_id) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Selecione uma escola diferente para importar a grade'
    })
  }
})
