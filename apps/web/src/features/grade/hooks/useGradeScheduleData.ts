import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib";
import { toast } from "sonner";
import { calculateTeacherScheduleStats } from "@/features/teachers/utils/teacherScheduleStats";
import type { ShiftEvent, ShiftKey, WeekDay } from "../types";

type TimeSlotApi = {
  id: string;
  shift: number | string;
  order_index: number;
  start_time: string;
  end_time?: string | null;
};

type RelationName = {
  name?: string | null;
};

type RelationTimeSlot = {
  start_time?: string | null;
  shift?: number | string | null;
};

type ScheduleApi = {
  id: string;
  day_of_week: number | string;
  time_slot_id?: string;
  classes?: RelationName | RelationName[] | null;
  subjects?: RelationName | RelationName[] | null;
  time_slots?: RelationTimeSlot | RelationTimeSlot[] | null;
};

type ClassApi = {
  id: string;
  name: string;
};

type SubjectApi = {
  id: string;
  name: string;
};

const classesCatalogBySchoolCache = new Map<string, ClassApi[]>();
let subjectsCatalogCache: SubjectApi[] | null = null;
const timeSlotsBySchoolCache = new Map<string, TimeSlotApi[]>();
const schedulesByTeacherAndSchoolCache = new Map<string, ScheduleApi[]>();
const GRADE_SCHEDULE_CACHE_KEY = "grade:schedule-data:v1";

function readGradeScheduleCache() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(GRADE_SCHEDULE_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as {
      subjects?: SubjectApi[] | null;
      classesBySchool?: Array<[string, ClassApi[]]>;
      timeSlotsBySchool?: Array<[string, TimeSlotApi[]]>;
      schedulesByTeacherAndSchool?: Array<[string, ScheduleApi[]]>;
    };
    return parsed;
  } catch {
    return null;
  }
}

function hydrateGradeScheduleCacheInMemory() {
  const hydrated = readGradeScheduleCache();
  if (!hydrated) return;

  if (Array.isArray(hydrated.subjects)) {
    subjectsCatalogCache = hydrated.subjects;
  }
  if (Array.isArray(hydrated.classesBySchool)) {
    for (const [key, value] of hydrated.classesBySchool) {
      if (typeof key === "string" && Array.isArray(value)) {
        classesCatalogBySchoolCache.set(key, value);
      }
    }
  }
  if (Array.isArray(hydrated.timeSlotsBySchool)) {
    for (const [key, value] of hydrated.timeSlotsBySchool) {
      if (typeof key === "string" && Array.isArray(value)) {
        timeSlotsBySchoolCache.set(key, value);
      }
    }
  }
  if (Array.isArray(hydrated.schedulesByTeacherAndSchool)) {
    for (const [key, value] of hydrated.schedulesByTeacherAndSchool) {
      if (typeof key === "string" && Array.isArray(value)) {
        schedulesByTeacherAndSchoolCache.set(key, value);
      }
    }
  }
}

function writeGradeScheduleCache() {
  if (typeof window === "undefined") return;
  try {
    const payload = {
      subjects: subjectsCatalogCache,
      classesBySchool: Array.from(classesCatalogBySchoolCache.entries()),
      timeSlotsBySchool: Array.from(timeSlotsBySchoolCache.entries()),
      schedulesByTeacherAndSchool: Array.from(schedulesByTeacherAndSchoolCache.entries()),
    };
    window.sessionStorage.setItem(GRADE_SCHEDULE_CACHE_KEY, JSON.stringify(payload));
  } catch {
    // Ignore storage quota/availability errors.
  }
}

hydrateGradeScheduleCacheInMemory();

export function invalidateGradeClassesCache(schoolId?: string): void {
  if (schoolId) {
    classesCatalogBySchoolCache.delete(schoolId);
    for (const key of schedulesByTeacherAndSchoolCache.keys()) {
      if (key.endsWith(`:${schoolId}`)) {
        schedulesByTeacherAndSchoolCache.delete(key);
      }
    }
  } else {
    classesCatalogBySchoolCache.clear();
    schedulesByTeacherAndSchoolCache.clear();
  }
  writeGradeScheduleCache();
}

type UseGradeScheduleDataResult = {
  events: ShiftEvent[];
  timesByShift: Record<ShiftKey, readonly string[]>;
  hasConfiguredTimeSlots: boolean;
  turmaOptions: readonly string[];
  subjectOptions: readonly string[];
  teacherStats: {
    lessonsCount: number;
    totalHours: number;
    totalMinutes: number;
    classNames: string[];
  };
  isLoadingTimeSlots: boolean;
  isLoadingSchedules: boolean;
  isLoadingCatalog: boolean;
  persistScheduleMove: (input: {
    scheduleId: string;
    dayIndex: number;
    startSlot: number;
    shift: ShiftKey;
  }) => Promise<boolean>;
  createScheduleFromSelection: (input: {
    dayIndex: number;
    startSlot: number;
    shift: ShiftKey;
    turma: string;
    subject: string;
  }) => Promise<boolean>;
  deleteScheduleById: (scheduleId: string) => Promise<boolean>;
  checkClassConflictAtSelection: (input: {
    dayIndex: number;
    startSlot: number;
    shift: ShiftKey;
    turma: string;
  }) => Promise<{ hasConflict: boolean; teacherName?: string }>;
};

const DEFAULT_TIMES_BY_SHIFT: Record<ShiftKey, readonly string[]> = {
  M: ["07:00", "08:00", "09:00", "10:00", "11:00", "12:00"],
  V: ["13:00", "14:00", "15:00", "16:00", "17:00"],
};
const FRONT_SHIFT_SPLIT_HOUR = 13;

const DAY_OF_WEEK_MAP: Record<number, WeekDay> = {
  1: "seg",
  2: "ter",
  3: "qua",
  4: "qui",
  5: "sex",
};

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function toShiftKey(shift: unknown): ShiftKey | null {
  if (typeof shift === "string") {
    const normalized = shift.trim().toUpperCase();
    if (normalized === "M") return "M";
    if (normalized === "V") return "V";
  }

  const numericShift = toNumber(shift);
  if (numericShift === 1) return "M";
  if (numericShift === 2) return "V";
  return null;
}

function resolveShiftFromTime(time?: string | null): ShiftKey | null {
  const normalized = normalizeTime(time);
  if (!normalized) return null;
  const hour = Number(normalized.split(":")[0]);
  if (!Number.isFinite(hour)) return null;
  return hour < FRONT_SHIFT_SPLIT_HOUR ? "M" : "V";
}

function normalizeTime(value?: string | null): string {
  if (!value) return "";
  return value.slice(0, 5);
}

function toShiftNumber(shift: ShiftKey): number {
  return shift === "M" ? 1 : 2;
}

function pickFirstName(relation?: RelationName | RelationName[] | null): string {
  if (!relation) return "";
  if (Array.isArray(relation)) {
    return relation[0]?.name?.trim() ?? "";
  }
  return relation.name?.trim() ?? "";
}

function pickTimeSlot(relation?: RelationTimeSlot | RelationTimeSlot[] | null): RelationTimeSlot | null {
  if (!relation) return null;
  if (Array.isArray(relation)) return relation[0] ?? null;
  return relation;
}

function uniqueSorted(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean))).sort((a, b) => a.localeCompare(b));
}

function normalizeLabel(value: string): string {
  return value.trim().toLowerCase();
}

function toWeekDay(value: number | string): WeekDay | null {
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "seg" || normalized === "ter" || normalized === "qua" || normalized === "qui" || normalized === "sex") {
      return normalized;
    }
  }

  const numericDay = toNumber(value);
  if (numericDay === null) return null;

  if (numericDay >= 1 && numericDay <= 5) {
    return DAY_OF_WEEK_MAP[numericDay];
  }

  return null;
}

export function useGradeScheduleData(
  selectedSchoolId: string | null,
  selectedTeacherId: string | null
): UseGradeScheduleDataResult {
  const [timeSlots, setTimeSlots] = useState<TimeSlotApi[]>([]);
  const [schedules, setSchedules] = useState<ScheduleApi[]>([]);
  const [classes, setClasses] = useState<ClassApi[]>([]);
  const [subjects, setSubjects] = useState<SubjectApi[]>([]);
  const [isLoadingTimeSlots, setIsLoadingTimeSlots] = useState(false);
  const [isLoadingSchedules, setIsLoadingSchedules] = useState(false);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(false);

  useEffect(() => {
    if (!subjectsCatalogCache) {
      hydrateGradeScheduleCacheInMemory();
    }

    if (subjectsCatalogCache) {
      setSubjects(subjectsCatalogCache);
      return;
    }

    let isCancelled = false;

    const loadSubjects = async () => {
      setIsLoadingCatalog(true);
      try {
        const subjectsData = await api.get<SubjectApi[]>("/subjects");
        if (!isCancelled) {
          subjectsCatalogCache = subjectsData ?? [];
          setSubjects(subjectsCatalogCache);
          writeGradeScheduleCache();
        }
      } catch {
        if (!isCancelled) {
          setSubjects([]);
        }
      } finally {
        if (!isCancelled) setIsLoadingCatalog(false);
      }
    };

    loadSubjects();
    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedSchoolId) {
      setClasses([]);
      return;
    }

    if (!classesCatalogBySchoolCache.has(selectedSchoolId)) {
      hydrateGradeScheduleCacheInMemory();
    }

    const cached = classesCatalogBySchoolCache.get(selectedSchoolId);
    let isCancelled = false;
    setClasses(cached ?? []);

    const loadClasses = async () => {
      setIsLoadingCatalog(true);
      try {
        const classesData = await api.get<ClassApi[]>(
          `/classes?school_id=${encodeURIComponent(selectedSchoolId)}`
        );
        if (!isCancelled) {
          const next = classesData ?? [];
          classesCatalogBySchoolCache.set(selectedSchoolId, next);
          setClasses(next);
          writeGradeScheduleCache();
        }
      } catch {
        if (!isCancelled) {
          setClasses([]);
        }
      } finally {
        if (!isCancelled) setIsLoadingCatalog(false);
      }
    };

    loadClasses();
    return () => {
      isCancelled = true;
    };
  }, [selectedSchoolId]);

  useEffect(() => {
    if (!selectedSchoolId) {
      setTimeSlots([]);
      return;
    }

    if (!timeSlotsBySchoolCache.has(selectedSchoolId)) {
      hydrateGradeScheduleCacheInMemory();
    }

    const cached = timeSlotsBySchoolCache.get(selectedSchoolId);
    setTimeSlots(cached ?? []);

    let isCancelled = false;
    const loadTimeSlots = async () => {
      setIsLoadingTimeSlots(true);
      try {
        const data = await api.get<TimeSlotApi[]>(
          `/time-slots?school_id=${encodeURIComponent(selectedSchoolId)}`
        );
        if (!isCancelled) {
          const next = data ?? [];
          timeSlotsBySchoolCache.set(selectedSchoolId, next);
          setTimeSlots(next);
          writeGradeScheduleCache();
        }
      } catch {
        if (!isCancelled) setTimeSlots([]);
      } finally {
        if (!isCancelled) setIsLoadingTimeSlots(false);
      }
    };

    loadTimeSlots();
    return () => {
      isCancelled = true;
    };
  }, [selectedSchoolId]);

  useEffect(() => {
    if (!selectedTeacherId || !selectedSchoolId) {
      setSchedules([]);
      return;
    }

    const schedulesCacheKey = `${selectedTeacherId}:${selectedSchoolId}`;
    if (!schedulesByTeacherAndSchoolCache.has(schedulesCacheKey)) {
      hydrateGradeScheduleCacheInMemory();
    }
    const cached = schedulesByTeacherAndSchoolCache.get(schedulesCacheKey);
    setSchedules(cached ?? []);

    let isCancelled = false;
    const loadSchedules = async () => {
      setIsLoadingSchedules(true);
      try {
        const params = new URLSearchParams({
          teacher_id: selectedTeacherId,
          school_id: selectedSchoolId,
        });
        const data = await api.get<ScheduleApi[]>(`/schedules?${params.toString()}`);
        if (!isCancelled) {
          const next = data ?? [];
          schedulesByTeacherAndSchoolCache.set(schedulesCacheKey, next);
          setSchedules(next);
          writeGradeScheduleCache();
        }
      } catch {
        if (!isCancelled) setSchedules([]);
      } finally {
        if (!isCancelled) setIsLoadingSchedules(false);
      }
    };

    loadSchedules();
    return () => {
      isCancelled = true;
    };
  }, [selectedSchoolId, selectedTeacherId]);

  const timesByShift = useMemo(() => {
    if (timeSlots.length === 0) return DEFAULT_TIMES_BY_SHIFT;

    const byShift: Record<ShiftKey, string[]> = { M: [], V: [] };

    for (const slot of timeSlots) {
      const shiftKey = toShiftKey(slot.shift);
      if (!shiftKey) continue;
      byShift[shiftKey].push(normalizeTime(slot.start_time));
    }

    return {
      M: byShift.M.length > 0 ? uniqueSorted(byShift.M) : DEFAULT_TIMES_BY_SHIFT.M,
      V: byShift.V.length > 0 ? uniqueSorted(byShift.V) : DEFAULT_TIMES_BY_SHIFT.V,
    };
  }, [timeSlots]);

  const hasConfiguredTimeSlots = timeSlots.length > 0;

  const events = useMemo<ShiftEvent[]>(() => {
    return schedules
      .map((schedule) => {
        const day = toWeekDay(schedule.day_of_week);
        if (!day) return null;

        const timeSlot = pickTimeSlot(schedule.time_slots);
        const shift = toShiftKey(timeSlot?.shift) ?? resolveShiftFromTime(timeSlot?.start_time);
        if (!shift) return null;

        const time = normalizeTime(timeSlot?.start_time);
        if (!time) return null;

        return {
          id: schedule.id,
          shift,
          day,
          time,
          className: pickFirstName(schedule.classes) || "Turma",
          subject: pickFirstName(schedule.subjects) || "Matéria",
        } satisfies ShiftEvent;
      })
      .filter((event): event is ShiftEvent => Boolean(event));
  }, [schedules]);

  const turmaOptions = useMemo(() => {
    return uniqueSorted(classes.map((item) => item.name.trim()));
  }, [classes]);

  const subjectOptions = useMemo(() => {
    const fromSubjects = uniqueSorted(subjects.map((item) => item.name.trim()));
    if (fromSubjects.length > 0) return fromSubjects;
    return uniqueSorted(events.map((event) => event.subject));
  }, [subjects, events]);

  const teacherStats = useMemo(() => {
    const slotById = new Map(timeSlots.map((slot) => [slot.id, slot]));
    return calculateTeacherScheduleStats(schedules, {
      resolveSlotById: (timeSlotId) => slotById.get(timeSlotId),
      defaultLessonMinutes: 60,
    });
  }, [schedules, timeSlots]);

  const persistScheduleMove = async ({
    scheduleId,
    dayIndex,
    startSlot,
    shift,
  }: {
    scheduleId: string;
    dayIndex: number;
    startSlot: number;
    shift: ShiftKey;
  }): Promise<boolean> => {
    const timeAtSlot = timesByShift[shift]?.[startSlot];
    if (!timeAtSlot) return false;

    const expectedShift = toShiftNumber(shift);
    const targetTimeSlot = timeSlots.find((slot) => {
      const slotShift = toNumber(slot.shift);
      return slotShift === expectedShift && normalizeTime(slot.start_time) === timeAtSlot;
    });

    if (!targetTimeSlot) return false;

    try {
      await api.post("/schedules/reposition", {
        schedule_id: scheduleId,
        day_of_week: dayIndex + 1,
        time_slot_id: targetTimeSlot.id,
      });

      setSchedules((previous) =>
        previous.map((schedule) =>
          schedule.id === scheduleId
            ? {
                ...schedule,
                day_of_week: dayIndex + 1,
                time_slot_id: targetTimeSlot.id,
                time_slots: {
                  ...pickTimeSlot(schedule.time_slots),
                  start_time: targetTimeSlot.start_time,
                  shift: targetTimeSlot.shift,
                },
              }
            : schedule
        )
      );
      if (selectedTeacherId && selectedSchoolId) {
        const schedulesCacheKey = `${selectedTeacherId}:${selectedSchoolId}`;
        const current = schedulesByTeacherAndSchoolCache.get(schedulesCacheKey) ?? [];
        const updated = current.map((schedule) =>
          schedule.id === scheduleId
            ? {
                ...schedule,
                day_of_week: dayIndex + 1,
                time_slot_id: targetTimeSlot.id,
                time_slots: {
                  ...pickTimeSlot(schedule.time_slots),
                  start_time: targetTimeSlot.start_time,
                  shift: targetTimeSlot.shift,
                },
              }
            : schedule
        );
        schedulesByTeacherAndSchoolCache.set(schedulesCacheKey, updated);
        writeGradeScheduleCache();
      }

      return true;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Nao foi possivel mover a aula para esse horario.";
      toast.error(message);
      return false;
    }
  };

  const createScheduleFromSelection = async ({
    dayIndex,
    startSlot,
    shift,
    turma,
    subject,
  }: {
    dayIndex: number;
    startSlot: number;
    shift: ShiftKey;
    turma: string;
    subject: string;
  }): Promise<boolean> => {
    if (!selectedSchoolId || !selectedTeacherId) return false;

    const turmaEntity = classes.find((item) => normalizeLabel(item.name) === normalizeLabel(turma));
    const subjectEntity = subjects.find((item) => normalizeLabel(item.name) === normalizeLabel(subject));
    const timeAtSlot = timesByShift[shift]?.[startSlot];

    if (!turmaEntity || !subjectEntity || !timeAtSlot) {
      toast.error("Não foi possível salvar a aula com os dados selecionados.");
      return false;
    }

    const expectedShift = toShiftNumber(shift);
    const targetTimeSlot = timeSlots.find((slot) => {
      const slotShift = toNumber(slot.shift);
      return slotShift === expectedShift && normalizeTime(slot.start_time) === timeAtSlot;
    });

    if (!targetTimeSlot) {
      toast.error("Não foi possível localizar o horário para salvar a aula.");
      return false;
    }

    try {
      const created = await api.post<{ id: string; day_of_week: number }>(
        "/schedules",
        {
          school_id: selectedSchoolId,
          class_id: turmaEntity.id,
          teacher_id: selectedTeacherId,
          subject_id: subjectEntity.id,
          time_slot_id: targetTimeSlot.id,
          day_of_week: dayIndex + 1,
        }
      );

      setSchedules((previous) => [
        ...previous,
        {
          id: created?.id ?? `tmp-${Date.now()}`,
          day_of_week: dayIndex + 1,
          time_slot_id: targetTimeSlot.id,
          classes: { name: turmaEntity.name },
          subjects: { name: subjectEntity.name },
          time_slots: {
            start_time: targetTimeSlot.start_time,
            shift: targetTimeSlot.shift,
          },
        },
      ]);
      if (selectedTeacherId && selectedSchoolId) {
        const schedulesCacheKey = `${selectedTeacherId}:${selectedSchoolId}`;
        const current = schedulesByTeacherAndSchoolCache.get(schedulesCacheKey) ?? [];
        schedulesByTeacherAndSchoolCache.set(schedulesCacheKey, [
          ...current,
          {
            id: created?.id ?? `tmp-${Date.now()}`,
            day_of_week: dayIndex + 1,
            time_slot_id: targetTimeSlot.id,
            classes: { name: turmaEntity.name },
            subjects: { name: subjectEntity.name },
            time_slots: {
              start_time: targetTimeSlot.start_time,
              shift: targetTimeSlot.shift,
            },
          },
        ]);
        writeGradeScheduleCache();
      }

      toast.success(`Aula na turma ${turmaEntity.name} foi salva`);
      return true;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Não foi possível salvar a aula.";
      toast.error(message);
      return false;
    }
  };

  const deleteScheduleById = async (scheduleId: string): Promise<boolean> => {
    try {
      await api.delete(`/schedules/${encodeURIComponent(scheduleId)}`);

      setSchedules((previous) => previous.filter((schedule) => schedule.id !== scheduleId));

      if (selectedTeacherId && selectedSchoolId) {
        const schedulesCacheKey = `${selectedTeacherId}:${selectedSchoolId}`;
        const current = schedulesByTeacherAndSchoolCache.get(schedulesCacheKey) ?? [];
        schedulesByTeacherAndSchoolCache.set(
          schedulesCacheKey,
          current.filter((schedule) => schedule.id !== scheduleId)
        );
        writeGradeScheduleCache();
      }

      toast.success("Aula removida com sucesso.");
      return true;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Não foi possível remover a aula.";
      toast.error(message);
      return false;
    }
  };

  const checkClassConflictAtSelection = async ({
    dayIndex,
    startSlot,
    shift,
    turma,
  }: {
    dayIndex: number;
    startSlot: number;
    shift: ShiftKey;
    turma: string;
  }): Promise<{ hasConflict: boolean; teacherName?: string }> => {
    if (!selectedSchoolId) return { hasConflict: false };

    const turmaEntity = classes.find((item) => normalizeLabel(item.name) === normalizeLabel(turma));
    const timeAtSlot = timesByShift[shift]?.[startSlot];
    if (!turmaEntity || !timeAtSlot) {
      return { hasConflict: false };
    }

    const expectedShift = toShiftNumber(shift);
    const targetTimeSlot = timeSlots.find((slot) => {
      const slotShift = toNumber(slot.shift);
      return slotShift === expectedShift && normalizeTime(slot.start_time) === timeAtSlot;
    });

    if (!targetTimeSlot) {
      return { hasConflict: false };
    }

    try {
      const params = new URLSearchParams({
        school_id: selectedSchoolId,
        class_id: turmaEntity.id,
        time_slot_id: targetTimeSlot.id,
        day_of_week: String(dayIndex + 1),
      });

      const data = await api.get<{ has_conflict: boolean; teacher_name?: string | null }>(
        `/schedules/class-conflict?${params.toString()}`
      );

      return {
        hasConflict: Boolean(data?.has_conflict),
        teacherName: data?.teacher_name ?? undefined,
      };
    } catch {
      return { hasConflict: false };
    }
  };

  return {
    events,
    timesByShift,
    hasConfiguredTimeSlots,
    turmaOptions,
    subjectOptions,
    teacherStats,
    isLoadingTimeSlots,
    isLoadingSchedules,
    isLoadingCatalog,
    persistScheduleMove,
    createScheduleFromSelection,
    deleteScheduleById,
    checkClassConflictAtSelection,
  };
}
