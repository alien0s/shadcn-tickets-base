import { NotFoundError, UnauthorizedError, ValidationError } from '../../shared/errors/AppError.js'
import { SchedulesRepository } from './schedules.repository.js'

type ListSchedulesContext = {
  tenantId?: string
  roleId: string
}

type ListSchedulesFilters = {
  teacherId?: string
  classId?: string
  schoolId?: string
}

type RepositionScheduleContext = {
  tenantId?: string
  roleId: string
}

type RepositionSchedulePayload = {
  scheduleId: string
  dayOfWeek: number
  timeSlotId: string
}

type CreateScheduleContext = {
  tenantId?: string
  roleId: string
}

type CreateSchedulePayload = {
  schoolId: string
  classId: string
  teacherId: string
  subjectId: string
  timeSlotId: string
  dayOfWeek: number
}

type DeleteScheduleContext = {
  tenantId?: string
  roleId: string
}

type FindClassConflictContext = {
  tenantId?: string
  roleId: string
}

type FindClassConflictPayload = {
  schoolId: string
  classId: string
  timeSlotId: string
  dayOfWeek: number
}

export class SchedulesService {
  private repository: SchedulesRepository

  constructor() {
    this.repository = new SchedulesRepository()
  }

  async listSchedules(context: ListSchedulesContext, filters: ListSchedulesFilters) {
    if (!filters.teacherId && !filters.classId) {
      throw new ValidationError('teacher_id ou class_id deve ser informado')
    }

    const roleName = await this.repository.findRoleNameById(context.roleId)
    const isRoot = roleName?.toLowerCase() === 'root'

    if (isRoot) {
      return this.repository.findByTeacher(filters)
    }

    if (!context.tenantId) {
      throw new UnauthorizedError('Tenant não encontrado no token do usuário')
    }

    return this.repository.findByTeacherAndTenant(context.tenantId, filters)
  }

  async createSchedule(context: CreateScheduleContext, payload: CreateSchedulePayload) {
    const roleName = await this.repository.findRoleNameById(context.roleId)
    const isRoot = roleName?.toLowerCase() === 'root'

    if (!isRoot && !context.tenantId) {
      throw new UnauthorizedError('Tenant não encontrado no token do usuário')
    }

    const tenantId = isRoot
      ? (context.tenantId ?? await this.repository.findTenantIdBySchoolId(payload.schoolId))
      : context.tenantId
    if (!tenantId) {
      throw new ValidationError('tenant_id não encontrado para criar aula')
    }

    if (!isRoot) {
      const schoolBelongsToTenant = await this.repository.isSchoolInTenant(payload.schoolId, tenantId)
      if (!schoolBelongsToTenant) {
        throw new UnauthorizedError('Escola não pertence ao tenant do usuário')
      }
    }

    const teacherConflict = await this.repository.findTeacherConflict({
      schoolId: payload.schoolId,
      teacherId: payload.teacherId,
      timeSlotId: payload.timeSlotId,
      dayOfWeek: payload.dayOfWeek
    })
    if (teacherConflict) {
      const teacherName = teacherConflict.teacher_name ?? 'selecionado'
      throw new ValidationError(`Professor ${teacherName} ja possui aula nesse horario nesta escola`)
    }

    const classConflict = await this.repository.findClassConflict({
      schoolId: payload.schoolId,
      classId: payload.classId,
      timeSlotId: payload.timeSlotId,
      dayOfWeek: payload.dayOfWeek
    })
    if (classConflict) {
      const teacherName = classConflict.teacher_name
      if (teacherName) {
        throw new ValidationError(`Turma ja possui aula com o professor ${teacherName} nesse horario`)
      }
      throw new ValidationError('Turma ja possui aula nesse horario nesta escola')
    }

    try {
      return await this.repository.create({
        tenant_id: tenantId,
        school_id: payload.schoolId,
        class_id: payload.classId,
        teacher_id: payload.teacherId,
        subject_id: payload.subjectId,
        time_slot_id: payload.timeSlotId,
        day_of_week: payload.dayOfWeek
      })
    } catch (error: any) {
      const code = String(error?.code ?? '')
      if (code === '23505') {
        throw new ValidationError('Slot já ocupado para esta aula')
      }
      throw error
    }
  }

  async findClassConflictAtSlot(context: FindClassConflictContext, payload: FindClassConflictPayload) {
    const roleName = await this.repository.findRoleNameById(context.roleId)
    const isRoot = roleName?.toLowerCase() === 'root'

    if (!isRoot) {
      if (!context.tenantId) {
        throw new UnauthorizedError('Tenant não encontrado no token do usuário')
      }

      const schoolBelongsToTenant = await this.repository.isSchoolInTenant(payload.schoolId, context.tenantId)
      if (!schoolBelongsToTenant) {
        throw new UnauthorizedError('Escola não pertence ao tenant do usuário')
      }
    }

    return this.repository.findClassConflict({
      schoolId: payload.schoolId,
      classId: payload.classId,
      timeSlotId: payload.timeSlotId,
      dayOfWeek: payload.dayOfWeek
    })
  }

  async repositionSchedule(context: RepositionScheduleContext, payload: RepositionSchedulePayload) {
    const roleName = await this.repository.findRoleNameById(context.roleId)
    const isRoot = roleName?.toLowerCase() === 'root'

    const schedule = await this.repository.findByIdWithScope(payload.scheduleId)
    if (!schedule) {
      throw new NotFoundError('Aula não encontrada')
    }

    if (!isRoot) {
      if (!context.tenantId) {
        throw new UnauthorizedError('Tenant não encontrado no token do usuário')
      }

      if (schedule.tenant_id !== context.tenantId) {
        throw new UnauthorizedError('Aula não pertence ao tenant do usuário')
      }
    }

    const targetSchoolId = await this.repository.findSchoolIdByTimeSlotId(payload.timeSlotId)
    if (!targetSchoolId) {
      throw new ValidationError('time_slot_id inválido')
    }

    if (targetSchoolId !== schedule.school_id) {
      throw new ValidationError('Não é permitido mover aula para horário de outra escola')
    }

    const teacherConflict = await this.repository.findTeacherConflict({
      schoolId: schedule.school_id,
      teacherId: schedule.teacher_id,
      timeSlotId: payload.timeSlotId,
      dayOfWeek: payload.dayOfWeek,
      excludeScheduleId: schedule.id
    })
    if (teacherConflict) {
      const teacherName = teacherConflict.teacher_name ?? 'selecionado'
      throw new ValidationError(`Professor ${teacherName} ja possui aula nesse horario nesta escola`)
    }

    const classConflict = await this.repository.findClassConflict({
      schoolId: schedule.school_id,
      classId: schedule.class_id,
      timeSlotId: payload.timeSlotId,
      dayOfWeek: payload.dayOfWeek,
      excludeScheduleId: schedule.id
    })
    if (classConflict) {
      const teacherName = classConflict.teacher_name
      if (teacherName) {
        throw new ValidationError(`Turma ja possui aula com o professor ${teacherName} nesse horario`)
      }
      throw new ValidationError('Turma ja possui aula nesse horario nesta escola')
    }

    try {
      return await this.repository.updatePosition(payload.scheduleId, {
        dayOfWeek: payload.dayOfWeek,
        timeSlotId: payload.timeSlotId
      })
    } catch (error: any) {
      const code = String(error?.code ?? '')
      if (code === '23505') {
        throw new ValidationError('Slot ocupado por outra aula')
      }
      throw error
    }
  }

  async deleteSchedule(scheduleId: string, context: DeleteScheduleContext): Promise<void> {
    const roleName = await this.repository.findRoleNameById(context.roleId)
    const isRoot = roleName?.toLowerCase() === 'root'

    const schedule = await this.repository.findByIdWithScope(scheduleId)
    if (!schedule) {
      throw new NotFoundError('Aula nÃ£o encontrada')
    }

    if (!isRoot) {
      if (!context.tenantId) {
        throw new UnauthorizedError('Tenant nÃ£o encontrado no token do usuÃ¡rio')
      }

      if (schedule.tenant_id !== context.tenantId) {
        throw new UnauthorizedError('Aula nÃ£o pertence ao tenant do usuÃ¡rio')
      }
    }

    await this.repository.deleteById(scheduleId)
  }
}
