import {
  CreateTimeSlotRequest,
  CreateTimeSlotsGradeRequest,
  ImportTimeSlotsGradeRequest
} from '@ticket-system/types'
import { UnauthorizedError, ValidationError } from '../../shared/errors/AppError.js'
import { TimeSlotsRepository } from './time-slots.repository.js'

type ListTimeSlotsContext = {
  tenantId?: string
  roleId: string
}

type ListTimeSlotsFilters = {
  schoolId: string
  shift?: number
}

type CreateTimeSlotContext = {
  tenantId?: string
  roleId: string
}

type GradeShiftConfig = {
  shift: 1 | 2 | 3
  startMinutes: number
  endMinutes: number
}

type GradeBreakConfig = {
  startMinutes: number
  endMinutes: number
  break_label: string | null
  shift: 1 | 2 | 3
}

function parseTimeToMinutes(value: string): number | null {
  const [hoursRaw, minutesRaw] = value.split(':')
  const hours = Number(hoursRaw)
  const minutes = Number(minutesRaw)

  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null

  return hours * 60 + minutes
}

function minutesToTime(value: number): string {
  const hours = Math.floor(value / 60)
  const minutes = value % 60
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

function normalizeTime(value: string): string {
  const [hours = '', minutes = ''] = value.split(':')
  return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`
}

function buildLessonSegments(
  startMinutes: number,
  endMinutes: number,
  lessonMinutes: number,
  breaks: Array<{ startMinutes: number; endMinutes: number }>
): Array<{ startMinutes: number; endMinutes: number }> {
  const sortedBreaks = breaks
    .filter((item) => item.startMinutes < item.endMinutes)
    .slice()
    .sort((left, right) => left.startMinutes - right.startMinutes)

  const lessonSlots: Array<{ startMinutes: number; endMinutes: number }> = []
  let segmentStart = startMinutes

  for (const breakItem of sortedBreaks) {
    for (
      let current = segmentStart;
      current + lessonMinutes <= breakItem.startMinutes;
      current += lessonMinutes
    ) {
      lessonSlots.push({ startMinutes: current, endMinutes: current + lessonMinutes })
    }

    segmentStart = breakItem.endMinutes
  }

  for (
    let current = segmentStart;
    current + lessonMinutes <= endMinutes;
    current += lessonMinutes
  ) {
    lessonSlots.push({ startMinutes: current, endMinutes: current + lessonMinutes })
  }

  return lessonSlots
}

export class TimeSlotsService {
  private repository: TimeSlotsRepository

  constructor() {
    this.repository = new TimeSlotsRepository()
  }

  async listTimeSlots(context: ListTimeSlotsContext, filters: ListTimeSlotsFilters) {
    const roleName = await this.repository.findRoleNameById(context.roleId)
    const isRoot = roleName?.toLowerCase() === 'root'

    if (isRoot) {
      return this.repository.findAll(filters)
    }

    if (!context.tenantId) {
      throw new UnauthorizedError('Tenant nao encontrado no token do usuario')
    }

    return this.repository.findAllByTenant(context.tenantId, filters)
  }

  async createTimeSlot(context: CreateTimeSlotContext, payload: CreateTimeSlotRequest) {
    const tenantId = await this.resolveTenantId(context, payload.school_id, payload.tenant_id)

    return this.repository.create({
      ...payload,
      tenant_id: tenantId
    })
  }

  async createGrade(context: CreateTimeSlotContext, payload: CreateTimeSlotsGradeRequest) {
    const tenantId = await this.resolveTenantId(context, payload.school_id, payload.tenant_id)
    const shifts = this.extractShiftConfigs(payload)
    const breaks = this.extractBreakConfigs(payload, shifts)

    const existingTimeSlots = await this.repository.findAllByTenant(tenantId, {
      schoolId: payload.school_id
    })
    if (existingTimeSlots.length > 0) {
      throw new ValidationError('A escola ja possui horarios cadastrados')
    }

    const timeSlotsToCreate = shifts.flatMap((shiftConfig) => {
      const shiftBreaks = breaks.filter((item) => item.shift === shiftConfig.shift)
      return this.buildShiftTimeSlots({
        tenantId,
        schoolId: payload.school_id,
        lessonMinutes: payload.lesson_minutes,
        shift: shiftConfig,
        breaks: shiftBreaks
      })
    })

    if (timeSlotsToCreate.length === 0) {
      throw new ValidationError('Nao foi possivel gerar horarios para a grade informada')
    }

    return this.repository.createMany(timeSlotsToCreate)
  }

  async deleteGrade(context: CreateTimeSlotContext, schoolId: string) {
    const tenantId = await this.resolveTenantId(context, schoolId)
    await this.repository.deleteBySchool(tenantId, schoolId)
  }

  async importGrade(context: CreateTimeSlotContext, payload: ImportTimeSlotsGradeRequest) {
    const sourceTenantId = await this.resolveTenantId(context, payload.source_school_id)
    const targetTenantId = await this.resolveTenantId(context, payload.target_school_id)

    const sourceTimeSlots = await this.repository.findAllByTenant(sourceTenantId, {
      schoolId: payload.source_school_id
    })

    if (sourceTimeSlots.length === 0) {
      throw new ValidationError('A escola selecionada nao possui grade para importar')
    }

    const targetTimeSlots = await this.repository.findAllByTenant(targetTenantId, {
      schoolId: payload.target_school_id
    })

    if (targetTimeSlots.length > 0 && !payload.overwrite) {
      throw new ValidationError('A escola destino ja possui grade cadastrada')
    }

    if (targetTimeSlots.length > 0) {
      await this.repository.deleteBySchool(targetTenantId, payload.target_school_id)
    }

    const copiedTimeSlots = sourceTimeSlots.map((slot) => ({
      tenant_id: targetTenantId,
      school_id: payload.target_school_id,
      shift: slot.shift,
      order_index: slot.order_index,
      start_time: normalizeTime(slot.start_time),
      end_time: normalizeTime(slot.end_time),
      is_break: slot.is_break,
      break_label: slot.break_label ?? null
    }))

    return this.repository.createMany(copiedTimeSlots)
  }

  private async resolveTenantId(
    context: CreateTimeSlotContext,
    schoolId: string,
    payloadTenantId?: string
  ) {
    const roleName = await this.repository.findRoleNameById(context.roleId)
    const isRoot = roleName?.toLowerCase() === 'root'

    if (!isRoot && !context.tenantId) {
      throw new UnauthorizedError('Tenant nao encontrado no token do usuario')
    }

    if (!isRoot && context.tenantId) {
      const schoolBelongsToTenant = await this.repository.isSchoolInTenant(schoolId, context.tenantId)
      if (!schoolBelongsToTenant) {
        throw new UnauthorizedError('Escola nao pertence ao tenant do usuario')
      }
    }

    const tenantId = isRoot
      ? payloadTenantId ?? context.tenantId ?? (await this.repository.findSchoolTenantId(schoolId))
      : context.tenantId
    if (!tenantId) {
      throw new ValidationError('tenant_id e obrigatorio para criar horario')
    }

    return tenantId
  }

  private extractShiftConfigs(payload: CreateTimeSlotsGradeRequest): GradeShiftConfig[] {
    const rawShifts: Array<{ shift: 1 | 2 | 3; start_time: string; end_time: string } | null> = [
      payload.morning ? { shift: 1, ...payload.morning } : null,
      payload.afternoon ? { shift: 2, ...payload.afternoon } : null,
      payload.night ? { shift: 3, ...payload.night } : null
    ]

    return rawShifts
      .filter((value): value is NonNullable<typeof value> => Boolean(value))
      .map((shiftConfig) => {
        const startMinutes = parseTimeToMinutes(shiftConfig.start_time)
        const endMinutes = parseTimeToMinutes(shiftConfig.end_time)

        if (startMinutes === null || endMinutes === null) {
          throw new ValidationError(`Horario invalido para o turno ${shiftConfig.shift}`)
        }

        if (startMinutes >= endMinutes) {
          throw new ValidationError(`O inicio deve ser menor que o fim no turno ${shiftConfig.shift}`)
        }

        return {
          shift: shiftConfig.shift,
          startMinutes,
          endMinutes
        }
      })
  }

  private extractBreakConfigs(
    payload: CreateTimeSlotsGradeRequest,
    shifts: GradeShiftConfig[]
  ): GradeBreakConfig[] {
    const breaks = (payload.breaks ?? []).map((item) => {
      const startMinutes = parseTimeToMinutes(item.start_time)
      const endMinutes = parseTimeToMinutes(item.end_time)

      if (startMinutes === null || endMinutes === null) {
        throw new ValidationError('Intervalo com horario invalido')
      }

      if (startMinutes >= endMinutes) {
        throw new ValidationError('Cada intervalo precisa ter inicio menor que termino')
      }

      const matchingShift = shifts.find(
        (shift) => startMinutes >= shift.startMinutes && endMinutes <= shift.endMinutes
      )

      if (!matchingShift) {
        throw new ValidationError('Intervalo deve ficar totalmente dentro de um turno configurado')
      }

      return {
        startMinutes,
        endMinutes,
        break_label: item.break_label?.trim() || 'Intervalo',
        shift: matchingShift.shift
      }
    })

    const groupedByShift = new Map<number, GradeBreakConfig[]>()
    for (const item of breaks) {
      const current = groupedByShift.get(item.shift) ?? []
      current.push(item)
      groupedByShift.set(item.shift, current)
    }

    for (const shiftBreaks of groupedByShift.values()) {
      const sorted = shiftBreaks.sort((left, right) => left.startMinutes - right.startMinutes)
      for (let index = 1; index < sorted.length; index += 1) {
        if (sorted[index].startMinutes < sorted[index - 1].endMinutes) {
          throw new ValidationError('Intervalos do mesmo turno nao podem se sobrepor')
        }
      }
    }

    return breaks
  }

  private buildShiftTimeSlots(input: {
    tenantId: string
    schoolId: string
    lessonMinutes: number
    shift: GradeShiftConfig
    breaks: GradeBreakConfig[]
  }): CreateTimeSlotRequest[] {
    const { tenantId, schoolId, lessonMinutes, shift, breaks } = input

    const lessonSlots = buildLessonSegments(
      shift.startMinutes,
      shift.endMinutes,
      lessonMinutes,
      breaks
    )

    if (lessonSlots.length === 0) {
      throw new ValidationError(`Nenhum horario de aula valido foi gerado para o turno ${shift.shift}`)
    }

    const entries = [
      ...lessonSlots.map((slot) => ({
        startMinutes: slot.startMinutes,
        endMinutes: slot.endMinutes,
        is_break: false,
        break_label: null as string | null
      })),
      ...breaks.map((breakItem) => ({
        startMinutes: breakItem.startMinutes,
        endMinutes: breakItem.endMinutes,
        is_break: true,
        break_label: breakItem.break_label
      }))
    ].sort((left, right) => {
      if (left.startMinutes !== right.startMinutes) {
        return left.startMinutes - right.startMinutes
      }

      return Number(left.is_break) - Number(right.is_break)
    })

    return entries.map((entry, index) => ({
      tenant_id: tenantId,
      school_id: schoolId,
      shift: shift.shift,
      order_index: index + 1,
      start_time: normalizeTime(minutesToTime(entry.startMinutes)),
      end_time: normalizeTime(minutesToTime(entry.endMinutes)),
      is_break: entry.is_break,
      break_label: entry.break_label
    }))
  }
}
