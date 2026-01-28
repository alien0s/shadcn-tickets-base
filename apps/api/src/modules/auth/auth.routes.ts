import { FastifyPluginAsync } from 'fastify'
import { AuthService } from './auth.service.js'
import { authSchemas } from './auth.schemas.js'
import { authMiddleware } from '../../shared/middlewares/auth.middleware.js'
import { successResponse } from '../../shared/utils/response.js'
import { LoginRequest, RegisterRequest } from '@ticket-system/types'
import { UnauthorizedError } from '../../shared/errors/AppError.js'

/**
 * Rotas de Autenticação
 */
export const authRoutes: FastifyPluginAsync = async (fastify) => {
  const authService = new AuthService(fastify)

  /**
   * POST /api/auth/register
   * Registra novo usuário no sistema
   */
  fastify.post('/register', {
    schema: authSchemas.register
  }, async (request, reply) => {
    const user = await authService.register(request.body as RegisterRequest)
    return reply.status(201).send(
      successResponse(user, 'Usuário cadastrado com sucesso')
    )
  })

  /**
   * POST /api/auth/login
   * Login do usuário (etapa 1 - credenciais)
   * Retorna token OU indica que precisa de 2FA
   */
  fastify.post('/login', {
    schema: authSchemas.login
  }, async (request, reply) => {
    const result = await authService.login(request.body as LoginRequest)
    
    if (result.requires_2fa) {
      return successResponse(
        { requires_2fa: true },
        'Código 2FA enviado para seu email'
      )
    }
    
    return successResponse(result, 'Login realizado com sucesso')
  })

  /**
   * POST /api/auth/verify-2fa
   * Verifica código 2FA enviado por email
   */
  fastify.post('/verify-2fa', {
    schema: authSchemas.verify2FA
  }, async (request, reply) => {
    const { email, code } = request.body as { email: string, code: string }
    const result = await authService.verify2FACode(email, code)
    return successResponse(result, 'Autenticação 2FA concluída com sucesso')
  })

  /**
   * POST /api/auth/forgot-password
   * Solicita recuperação de senha
   */
  fastify.post('/forgot-password', {
    schema: authSchemas.forgotPassword
  }, async (request, reply) => {
    const { email } = request.body as { email: string }
    await authService.forgotPassword(email)
    return successResponse(
      null,
      'Se o email existir, você receberá instruções para redefinir sua senha'
    )
  })

  /**
   * POST /api/auth/reset-password
   * Redefine senha usando token enviado por email
   */
  fastify.post('/reset-password', {
    schema: authSchemas.resetPassword
  }, async (request, reply) => {
    const { token, new_password } = request.body as { token: string, new_password: string }
    await authService.resetPassword(token, new_password)
    return successResponse(null, 'Senha redefinida com sucesso')
  })

  /**
   * POST /api/auth/enable-2fa
   * Habilita autenticação de dois fatores (protegida)
   */
  fastify.post('/enable-2fa', {
    schema: authSchemas.enable2FA,
    preHandler: [authMiddleware]
  }, async (request, reply) => {
    await authService.enable2FA(request.user.id)
    return successResponse(null, 'Autenticação de dois fatores habilitada')
  })

  /**
   * POST /api/auth/disable-2fa
   * Desabilita autenticação de dois fatores (protegida)
   */
  fastify.post('/disable-2fa', {
    schema: authSchemas.disable2FA,
    preHandler: [authMiddleware]
  }, async (request, reply) => {
    await authService.disable2FA(request.user.id)
    return successResponse(null, 'Autenticação de dois fatores desabilitada')
  })

  /**
   * GET /api/auth/me
   * Retorna dados do usuário autenticado
   */
  fastify.get('/me', {
    preHandler: [authMiddleware]
  }, async (request, reply) => {
    const user = await authService.getUserById(request.user.id)
    
    if (!user) {
      throw new UnauthorizedError('Usuário não encontrado')
    }
    
    return successResponse(user)
  })

  /**
   * GET /api/auth/microsoft
   * Inicia fluxo OAuth2 com Microsoft AD
   * Redireciona para página de login da Microsoft
   */
  fastify.get('/microsoft', async (request, reply) => {
    // TODO: Implementar quando tiver credenciais Microsoft AD
    // Por enquanto, retorna erro informativo
    return reply.status(501).send({
      error: {
        message: 'Login com Microsoft AD ainda não configurado',
        code: 'NOT_IMPLEMENTED',
        statusCode: 501
      }
    })
  })

  /**
   * GET /api/auth/microsoft/callback
   * Callback do OAuth2 Microsoft AD
   * Recebe o código de autorização e cria/loga o usuário
   */
  fastify.get('/microsoft/callback', async (request, reply) => {
    // TODO: Implementar quando tiver credenciais Microsoft AD
    return reply.status(501).send({
      error: {
        message: 'Callback Microsoft AD ainda não configurado',
        code: 'NOT_IMPLEMENTED',
        statusCode: 501
      }
    })
  })
}