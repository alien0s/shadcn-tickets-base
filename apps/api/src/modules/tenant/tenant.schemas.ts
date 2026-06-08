import { z } from 'zod'

export const tenantInfoQuerySchema = z.object({
  tenant_id: z.string().uuid('tenant_id invalido').optional()
})

const emptyToNull = (value: unknown) => {
  if (typeof value !== 'string') return value
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

export const updateTenantInfoSchema = z.object({
  name: z.string().trim().min(1, 'Nome da empresa e obrigatorio').max(255),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, 'Slug da empresa e obrigatorio')
    .max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug deve conter letras minusculas, numeros e hifens'),
  profile: z.object({
    cnpj: z.preprocess(emptyToNull, z.string().regex(/^\d{14}$/, 'CNPJ invalido').nullable().optional()),
    phone: z.preprocess(emptyToNull, z.string().regex(/^\d{10,11}$/, 'Telefone invalido').nullable().optional()),
    email: z.preprocess(emptyToNull, z.string().email('Email comercial invalido').nullable().optional()),
    address: z.preprocess(emptyToNull, z.string().max(255).nullable().optional()),
    city: z.preprocess(emptyToNull, z.string().max(100).nullable().optional()),
    state: z.preprocess(emptyToNull, z.string().length(2, 'Estado deve ter 2 caracteres').nullable().optional()),
    zip_code: z.preprocess(emptyToNull, z.string().regex(/^\d{8}$/, 'CEP invalido').nullable().optional())
  }).optional(),
  billing: z.object({
    payment_method: z.enum(['credit_card', 'boleto', 'pix']).nullable().optional(),
    billing_email: z.preprocess(emptyToNull, z.string().email('Email de cobranca invalido').nullable().optional())
  }).optional()
})

export const tenantSchemas = {
  current: {
    querystring: {
      type: 'object',
      properties: {
        tenant_id: { type: 'string', format: 'uuid' }
      }
    }
  },
  updateCurrent: {
    querystring: {
      type: 'object',
      properties: {
        tenant_id: { type: 'string', format: 'uuid' }
      }
    },
    body: {
      type: 'object',
      required: ['name', 'slug'],
      properties: {
        name: { type: 'string', maxLength: 255 },
        slug: { type: 'string', maxLength: 100 },
        profile: {
          type: 'object',
          properties: {
            cnpj: { type: ['string', 'null'] },
            phone: { type: ['string', 'null'] },
            email: { type: ['string', 'null'], format: 'email' },
            address: { type: ['string', 'null'] },
            city: { type: ['string', 'null'] },
            state: { type: ['string', 'null'], minLength: 2, maxLength: 2 },
            zip_code: { type: ['string', 'null'] }
          }
        },
        billing: {
          type: 'object',
          properties: {
            payment_method: { type: ['string', 'null'], enum: ['credit_card', 'boleto', 'pix', null] },
            billing_email: { type: ['string', 'null'], format: 'email' }
          }
        }
      }
    }
  }
}
