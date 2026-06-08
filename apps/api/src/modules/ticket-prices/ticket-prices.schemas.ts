import { z } from 'zod'

const relatedSchoolSchema = {
  type: 'object',
  nullable: true,
  properties: {
    id: { type: 'string', format: 'uuid' },
    name: { type: 'string' },
    abbreviation: { type: 'string' }
  }
}

const relatedSubjectSchema = {
  type: 'object',
  nullable: true,
  properties: {
    id: { type: 'string', format: 'uuid' },
    name: { type: 'string' }
  }
}

const relatedEducationLevelSchema = {
  type: 'object',
  nullable: true,
  properties: {
    id: { type: 'string', format: 'uuid' },
    name: { type: 'string' },
    abbreviation: { type: 'string', nullable: true }
  }
}

const ticketPriceItemSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    tenant_id: { type: 'string', format: 'uuid' },
    school_id: { type: 'string', format: 'uuid' },
    subject_id: { type: 'string', format: 'uuid', nullable: true },
    education_level_id: { type: 'string', format: 'uuid', nullable: true },
    price_per_lesson: { type: 'number' },
    created_at: { type: 'string', format: 'date-time' },
    updated_at: { type: 'string', format: 'date-time' },
    schools: relatedSchoolSchema,
    subjects: relatedSubjectSchema,
    education_levels: relatedEducationLevelSchema
  }
}

export const ticketPricesSchemas = {
  list: {
    querystring: {
      type: 'object',
      properties: {
        school_id: { type: 'string', format: 'uuid' },
        subject_id: { type: 'string', format: 'uuid' },
        education_level_id: { type: 'string', format: 'uuid' }
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
            items: ticketPriceItemSchema
          }
        }
      }
    }
  },
  getById: {
    params: {
      type: 'object',
      required: ['id'],
      properties: {
        id: { type: 'string', format: 'uuid' }
      }
    },
    response: {
      200: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          message: { type: 'string' },
          data: ticketPriceItemSchema
        }
      }
    }
  },
  create: {
    body: {
      type: 'object',
      required: ['school_id', 'price_per_lesson'],
      properties: {
        school_id: { type: 'string', format: 'uuid' },
        subject_id: { type: 'string', format: 'uuid', nullable: true },
        education_level_id: { type: 'string', format: 'uuid', nullable: true },
        price_per_lesson: { type: 'number', exclusiveMinimum: 0 }
      }
    },
    response: {
      201: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          message: { type: 'string' },
          data: ticketPriceItemSchema
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
        school_id: { type: 'string', format: 'uuid' },
        subject_id: { type: 'string', format: 'uuid', nullable: true },
        education_level_id: { type: 'string', format: 'uuid', nullable: true },
        price_per_lesson: { type: 'number', exclusiveMinimum: 0 }
      }
    },
    response: {
      200: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          message: { type: 'string' },
          data: ticketPriceItemSchema
        }
      }
    }
  }
}

const combinationValidationMessage = 'subject_id ou education_level_id deve ser informado'

export const listTicketPricesQuerySchema = z.object({
  school_id: z.string().uuid('school_id invalido').optional(),
  subject_id: z.string().uuid('subject_id invalido').optional(),
  education_level_id: z.string().uuid('education_level_id invalido').optional()
})

export const createTicketPriceSchema = z.object({
  school_id: z.string().uuid('school_id invalido'),
  subject_id: z.string().uuid('subject_id invalido').nullable().optional(),
  education_level_id: z.string().uuid('education_level_id invalido').nullable().optional(),
  price_per_lesson: z.number().positive('price_per_lesson invalido')
}).refine(
  (data) => Boolean(data.subject_id || data.education_level_id),
  { message: combinationValidationMessage }
)

export const updateTicketPriceSchema = z.object({
  school_id: z.string().uuid('school_id invalido').optional(),
  subject_id: z.string().uuid('subject_id invalido').nullable().optional(),
  education_level_id: z.string().uuid('education_level_id invalido').nullable().optional(),
  price_per_lesson: z.number().positive('price_per_lesson invalido').optional()
})

export const ticketPriceIdParamsSchema = z.object({
  id: z.string().uuid('id invalido')
})
