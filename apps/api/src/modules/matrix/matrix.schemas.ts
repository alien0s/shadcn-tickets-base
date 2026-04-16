import { z } from 'zod'

export const matrixSchemas = {
  list: {
    querystring: {
      type: 'object',
      properties: {
        school_id: { type: 'string', format: 'uuid' },
        series_id: { type: 'string', format: 'uuid' }
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
                series_id: { type: 'string', format: 'uuid' },
                subject_id: { type: 'string', format: 'uuid' },
                weekly_classes: { type: 'integer' },
                annual_hours: { type: 'integer' },
                is_mandatory: { type: 'boolean' },
                created_at: { type: 'string', format: 'date-time' },
                updated_at: { type: 'string', format: 'date-time' },
                subjects: {
                  type: 'object',
                  properties: {
                    id: { type: 'string', format: 'uuid' },
                    name: { type: 'string' }
                  }
                }
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
      required: ['school_id', 'series_id', 'subject_id', 'weekly_classes'],
      properties: {
        school_id: { type: 'string', format: 'uuid' },
        series_id: { type: 'string', format: 'uuid' },
        subject_id: { type: 'string', format: 'uuid' },
        weekly_classes: { type: 'integer', minimum: 1 },
        annual_hours: { type: 'integer', minimum: 0 },
        is_mandatory: { type: 'boolean' }
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
        weekly_classes: { type: 'integer', minimum: 1 },
        annual_hours: { type: 'integer', minimum: 0 },
        is_mandatory: { type: 'boolean' }
      }
    }
  },
  delete: {
    params: {
      type: 'object',
      required: ['id'],
      properties: {
        id: { type: 'string', format: 'uuid' }
      }
    }
  }
}

export const listSubjectWorkloadsQuerySchema = z.object({
  school_id: z.string().uuid('school_id invalido').optional(),
  series_id: z.string().uuid('series_id invalido').optional()
})

export const createSubjectWorkloadSchema = z.object({
  school_id: z.string().uuid('school_id invalido'),
  series_id: z.string().uuid('series_id invalido'),
  subject_id: z.string().uuid('subject_id invalido'),
  weekly_classes: z.number().int('weekly_classes invalido').min(1, 'weekly_classes invalido'),
  annual_hours: z.number().int('annual_hours invalido').min(0, 'annual_hours invalido').optional(),
  is_mandatory: z.boolean().optional()
})

export const updateSubjectWorkloadSchema = z.object({
  weekly_classes: z.number().int('weekly_classes invalido').min(1, 'weekly_classes invalido').optional(),
  annual_hours: z.number().int('annual_hours invalido').min(0, 'annual_hours invalido').nullable().optional(),
  is_mandatory: z.boolean().optional()
})

export const subjectWorkloadIdParamsSchema = z.object({
  id: z.string().uuid('id invalido')
})
