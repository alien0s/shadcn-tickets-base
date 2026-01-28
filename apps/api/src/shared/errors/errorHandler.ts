import { FastifyError, FastifyReply, FastifyRequest } from 'fastify'
import { AppError } from './AppError.js'

export async function errorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
) {
  // Log do erro
  request.log.error(error)

  // Erro customizado da aplicação
  if (error instanceof AppError) {
    return reply.status(error.statusCode).send({
      error: {
        message: error.message,
        code: error.code,
        statusCode: error.statusCode
      }
    })
  }

  // Erro de validação do Fastify
  if (error.validation) {
    return reply.status(400).send({
      error: {
        message: 'Erro de validação',
        code: 'VALIDATION_ERROR',
        statusCode: 400,
        details: error.validation
      }
    })
  }

  // Erro genérico
  const statusCode = error.statusCode || 500
  const message = statusCode === 500
    ? 'Erro interno do servidor'
    : error.message

  return reply.status(statusCode).send({
    error: {
      message,
      code: 'INTERNAL_ERROR',
      statusCode
    }
  })
}
