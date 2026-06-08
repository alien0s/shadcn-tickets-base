import { FastifyPluginAsync } from 'fastify'
import { authMiddleware } from '../../shared/middlewares/auth.middleware.js'
import { successResponse } from '../../shared/utils/response.js'
import { TenantService } from './tenant.service.js'
import { tenantInfoQuerySchema, tenantSchemas, updateTenantInfoSchema } from './tenant.schemas.js'

export const tenantRoutes: FastifyPluginAsync = async (fastify) => {
  const tenantService = new TenantService()

  fastify.get('/current', {
    schema: {
      ...tenantSchemas.current,
      tags: ['Tenant'],
      summary: 'Get current tenant info',
      description: 'Retorna as informacoes cadastrais e de cobranca do tenant atual',
      security: [{ bearerAuth: [] }]
    },
    preHandler: [authMiddleware]
  }, async (request) => {
    const query = tenantInfoQuerySchema.parse(request.query)
    const tenant = await tenantService.getCurrentTenantInfo({
      tenantId: request.user.tenant_id,
      roleId: request.user.role_id,
      selectedTenantId: query.tenant_id
    })

    return successResponse(tenant)
  })

  fastify.patch('/current', {
    schema: {
      ...tenantSchemas.updateCurrent,
      tags: ['Tenant'],
      summary: 'Update current tenant info',
      description: 'Atualiza as informacoes cadastrais e de cobranca do tenant atual',
      security: [{ bearerAuth: [] }]
    },
    preHandler: [authMiddleware]
  }, async (request) => {
    const query = tenantInfoQuerySchema.parse(request.query)
    const payload = updateTenantInfoSchema.parse(request.body)
    const tenant = await tenantService.updateCurrentTenantInfo({
      tenantId: request.user.tenant_id,
      roleId: request.user.role_id,
      selectedTenantId: query.tenant_id
    }, payload)

    return successResponse(tenant, 'Organizacao atualizada com sucesso')
  })
}
