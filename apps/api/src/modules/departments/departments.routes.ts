import { FastifyPluginAsync } from 'fastify'
import { DepartmentsService } from './departments.service.js'
import { createDepartmentSchema } from './departments.schemas.js'
import { authMiddleware } from '../../shared/middlewares/auth.middleware.js'
import { successResponse } from '../../shared/utils/response.js'

export const departmentsRoutes: FastifyPluginAsync = async (fastify) => {
  const departmentsService = new DepartmentsService()

  // GET /api/departments
  fastify.get('/', {
    schema: {
      tags: ['Departamentos']
    },
    preHandler: [authMiddleware]
  }, async () => {
    const departments = await departmentsService.listDepartments()
    return successResponse(departments)
  })

  // POST /api/departments
  fastify.post('/', {
    schema: {
      tags: ['Departamentos']
    },
    preHandler: [authMiddleware]
  }, async (request, reply) => {
    const payload = createDepartmentSchema.parse(request.body)
    const department = await departmentsService.createDepartment(payload)
    return reply.status(201).send(successResponse(department, 'Departamento criado com sucesso'))
  })
}
