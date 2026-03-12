import { NotFoundError, UnauthorizedError, ValidationError } from '../../shared/errors/AppError.js'
import { TeachersRepository } from './teachers.repository.js'

type ListTeachersContext = {
  tenantId?: string
  roleId: string
}

type ListTeachersFilters = {
  schoolId?: string
  active?: boolean
}

type UpdateTeacherContext = {
  tenantId?: string
  roleId: string
}

type UpdateTeacherPayload = {
  name?: string
  email?: string
  school_id?: string
  active?: boolean
  subject_ids?: string[]
  avatar_url?: string | null
}

type CreateTeacherContext = {
  tenantId?: string
  roleId: string
}

type CreateTeacherPayload = {
  name: string
  email?: string
  school_id: string
  active?: boolean
  subject_ids?: string[]
  avatar_url?: string
}

export class TeachersService {
  private repository: TeachersRepository

  constructor() {
    this.repository = new TeachersRepository()
  }

  async listTeachers(context: ListTeachersContext, filters: ListTeachersFilters = {}) {
    const roleName = await this.repository.findRoleNameById(context.roleId)
    const isRoot = roleName?.toLowerCase() === 'root'

    if (isRoot) {
      return this.repository.findAll(filters)
    }

    if (!context.tenantId) {
      throw new UnauthorizedError('Tenant não encontrado no token do usuário')
    }

    return this.repository.findAllByTenant(context.tenantId, filters)
  }

  async createTeacher(context: CreateTeacherContext, payload: CreateTeacherPayload) {
    const roleName = await this.repository.findRoleNameById(context.roleId)
    const isRoot = roleName?.toLowerCase() === 'root'

    if (!isRoot && !context.tenantId) {
      throw new UnauthorizedError('Tenant nÃ£o encontrado no token do usuÃ¡rio')
    }

    const tenantId = isRoot
      ? (await this.repository.findTenantIdBySchoolId(payload.school_id))
      : context.tenantId

    if (!tenantId) {
      throw new ValidationError('tenant_id nÃ£o encontrado para criar professor')
    }

    if (!isRoot) {
      const schoolBelongsToTenant = await this.repository.isSchoolInTenant(payload.school_id, tenantId)
      if (!schoolBelongsToTenant) {
        throw new UnauthorizedError('Escola nÃ£o pertence ao tenant do usuÃ¡rio')
      }
    }

    const subjectIds = Array.isArray(payload.subject_ids)
      ? Array.from(new Set(payload.subject_ids))
      : []

    if (subjectIds.length > 0) {
      const foundCount = await this.repository.countSubjectsByIds(subjectIds)
      if (foundCount !== subjectIds.length) {
        throw new ValidationError('Uma ou mais disciplinas sÃ£o invÃ¡lidas')
      }
    }

    const created = await this.repository.create({
      tenant_id: tenantId,
      school_id: payload.school_id,
      name: payload.name.trim(),
      email: payload.email?.trim() ? payload.email.trim() : null,
      active: payload.active ?? true,
      avatar_url: payload.avatar_url
    })

    if (subjectIds.length > 0) {
      await this.repository.replaceTeacherSubjects({
        teacherId: created.id,
        tenantId,
        subjectIds
      })
    }

    const createdWithSubjects = await this.repository.findByIdWithSubjects(created.id)
    if (!createdWithSubjects) {
      throw new NotFoundError('Professor nÃ£o encontrado')
    }

    return createdWithSubjects
  }

  async updateTeacher(teacherId: string, context: UpdateTeacherContext, payload: UpdateTeacherPayload) {
    const roleName = await this.repository.findRoleNameById(context.roleId)
    const isRoot = roleName?.toLowerCase() === 'root'

    const currentTeacher = await this.repository.findById(teacherId)
    if (!currentTeacher) {
      throw new NotFoundError('Professor nÃ£o encontrado')
    }

    if (!isRoot) {
      if (!context.tenantId) {
        throw new UnauthorizedError('Tenant nÃ£o encontrado no token do usuÃ¡rio')
      }

      if (currentTeacher.tenant_id !== context.tenantId) {
        throw new UnauthorizedError('Professor nÃ£o pertence ao tenant do usuÃ¡rio')
      }
    }

    if (payload.school_id) {
      const targetTenantId = isRoot ? currentTeacher.tenant_id : context.tenantId!
      const schoolAllowed = await this.repository.isSchoolInTenant(payload.school_id, targetTenantId)
      if (!schoolAllowed) {
        throw new ValidationError('Escola invÃ¡lida para o tenant do professor')
      }
    }

    if (Array.isArray(payload.subject_ids)) {
      const uniqueSubjectIds = Array.from(new Set(payload.subject_ids))
      const foundCount = await this.repository.countSubjectsByIds(uniqueSubjectIds)
      if (foundCount !== uniqueSubjectIds.length) {
        throw new ValidationError('Uma ou mais disciplinas sÃ£o invÃ¡lidas')
      }
    }

    const updatePayload = {
      name: payload.name?.trim(),
      email: payload.email?.trim() ? payload.email.trim() : payload.email === '' ? null : undefined,
      school_id: payload.school_id,
      active: payload.active,
      avatar_url: payload.avatar_url === undefined ? undefined : payload.avatar_url
    }

    const hasTeacherUpdates = Object.values(updatePayload).some((value) => value !== undefined)
    if (hasTeacherUpdates) {
      await this.repository.updateById(teacherId, updatePayload)
    }

    if (Array.isArray(payload.subject_ids)) {
      const uniqueSubjectIds = Array.from(new Set(payload.subject_ids))
      await this.repository.replaceTeacherSubjects({
        teacherId,
        tenantId: currentTeacher.tenant_id,
        subjectIds: uniqueSubjectIds
      })
    }

    const updatedTeacher = await this.repository.findByIdWithSubjects(teacherId)
    if (!updatedTeacher) {
      throw new NotFoundError('Professor nÃ£o encontrado')
    }

    return updatedTeacher
  }

  async updateTeacherAvatar(teacherId: string, context: UpdateTeacherContext, avatarUrl: string) {
    return this.updateTeacher(teacherId, context, { avatar_url: avatarUrl })
  }

  async deleteTeacher(teacherId: string, context: UpdateTeacherContext): Promise<void> {
    const roleName = await this.repository.findRoleNameById(context.roleId)
    const isRoot = roleName?.toLowerCase() === 'root'

    const currentTeacher = await this.repository.findById(teacherId)
    if (!currentTeacher) {
      throw new NotFoundError('Professor não encontrado')
    }

    if (!isRoot) {
      if (!context.tenantId) {
        throw new UnauthorizedError('Tenant não encontrado no token do usuário')
      }

      if (currentTeacher.tenant_id !== context.tenantId) {
        throw new UnauthorizedError('Professor não pertence ao tenant do usuário')
      }
    }

    await this.repository.deleteById(teacherId)
  }
}
