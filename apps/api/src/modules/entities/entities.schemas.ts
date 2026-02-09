import { z } from 'zod'

export const createEntitySchema = z.object({
  name: z
    .string({
      required_error: 'Nome é obrigatório',
      invalid_type_error: 'Nome deve ser um texto'
    })
    .trim()
    .min(1, { message: 'Nome é obrigatório' })
    .max(100, { message: 'Nome deve ter no máximo 100 caracteres' })
})
