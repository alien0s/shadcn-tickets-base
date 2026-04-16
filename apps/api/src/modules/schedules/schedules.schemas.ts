import { z } from 'zod'

export const schedulesSchemas = {
  list: {
    querystring: {
      type: 'object',
      anyOf: [
        { required: ['teacher_id'] },
        { required: ['class_id'] }
      ],
      properties: {
        teacher_id: { type: 'string', format: 'uuid' },
        class_id: { type: 'string', format: 'uuid' },
        school_id: { type: 'string', format: 'uuid' }
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
                class_id: { type: 'string', format: 'uuid' },
                teacher_id: { type: 'string', format: 'uuid' },
                subject_id: { type: 'string', format: 'uuid' },
                time_slot_id: { type: 'string', format: 'uuid' },
                day_of_week: { type: 'integer' },
                created_at: { type: 'string', format: 'date-time' },
                classes: {
                  type: ['object', 'null'],
                  properties: {
                    name: { type: 'string' }
                  }
                },
                teachers: {
                  type: ['object', 'null'],
                  properties: {
                    name: { type: 'string' }
                  }
                },
                subjects: {
                  type: ['object', 'null'],
                  properties: {
                    name: { type: 'string' }
                  }
                },
                time_slots: {
                  type: ['object', 'null'],
                  properties: {
                    start_time: { type: 'string' },
                    end_time: { type: ['string', 'null'] },
                    shift: { type: 'integer' }
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  classConflict: {
    querystring: {
      type: 'object',
      required: ['school_id', 'class_id', 'time_slot_id', 'day_of_week'],
      properties: {
        school_id: { type: 'string', format: 'uuid' },
        class_id: { type: 'string', format: 'uuid' },
        time_slot_id: { type: 'string', format: 'uuid' },
        day_of_week: { type: 'integer', minimum: 1, maximum: 5 }
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
              has_conflict: { type: 'boolean' },
              teacher_name: { type: ['string', 'null'] }
            }
          }
        }
      }
    }
  },
  remove: {
    params: {
      type: 'object',
      required: ['id'],
      properties: {
        id: { type: 'string', format: 'uuid' }
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
      required: ['class_id', 'teacher_id', 'subject_id'],
      properties: {
        class_id: { type: 'string', format: 'uuid' },
        teacher_id: { type: 'string', format: 'uuid' },
        subject_id: { type: 'string', format: 'uuid' }
      }
    }
  }
}

export const createScheduleSchema = z.object({
  school_id: z.string().uuid('school_id inválido'),
  class_id: z.string().uuid('class_id inválido'),
  teacher_id: z.string().uuid('teacher_id inválido'),
  subject_id: z.string().uuid('subject_id inválido'),
  time_slot_id: z.string().uuid('time_slot_id inválido'),
  day_of_week: z.number().int().min(1).max(5)
})

export const repositionScheduleSchema = z.object({
  schedule_id: z.string().uuid('schedule_id inválido'),
  day_of_week: z.number().int().min(1).max(5),
  time_slot_id: z.string().uuid('time_slot_id inválido')
})

export const updateScheduleSchema = z.object({
  class_id: z.string().uuid('class_id inválido'),
  teacher_id: z.string().uuid('teacher_id inválido'),
  subject_id: z.string().uuid('subject_id inválido')
})
