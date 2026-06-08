import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib";
import { toast } from "sonner";
import { calculateTeacherScheduleStats } from "@/features/teachers/utils/teacherScheduleStats";
import {
  getSubjectsCatalogVersion,
  SUBJECTS_CATALOG_UPDATED_EVENT,
} from "@/utils/subjects-catalog";
import type { ShiftEvent, ShiftKey, WeekDay } from "../types";

type TimeSlotApi = {
  id: string;
  shift: number | string;
  order_index: number;
  start_time: string;
  end_time?: string | null;
  is_break?: boolean | null;
};

type BreakMarker = {
  labelTime: string;
  anchorTime: string;
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
  class_id?: string;
  teacher_id?: string;
  subject_id?: string;
  time_slot_id?: string;
  classes?: RelationName | RelationName[] | null;
  teachers?: RelationName | RelationName[] | null;
  subjects?: RelationName | RelationName[] | null;
  time_slots?: RelationTimeSlot | RelationTimeSlot[] | null;
};

type ClassApi = {
  id: string;
  name?: string | null;
  code?: string | null;
  series_id?: string | null;
  series_name?: string | null;
};

type SubjectApi = {
  id: string;
  name: string;
  icon?: string | null;
};

type MatrixApi = {
  id: string;
  school_id: string;
  series_id: string;
  subject_id: string;
  weekly_classes: number;
  subjects?: {
    id?: string;
    name?: string | null;
  } | null;
};

const classesCatalogBySchoolCache = new Map<string, ClassApi[]>();
let subjectsCatalogCache: SubjectApi[] | null = null;
let subjectsCatalogFetchedAt = 0;
let subjectsCatalogVersion: string | null = null;
const matrixBySchoolCache = new Map<string, MatrixApi[]>();
const timeSlotsBySchoolCache = new Map<string, TimeSlotApi[]>();
const schedulesByTeacherAndSchoolCache = new Map<string, ScheduleApi[]>();
const GRADE_SCHEDULE_CACHE_KEY = "grade:schedule-data:v4";
const SUBJECTS_CATALOG_STALE_MS = 2 * 60 * 1000;

function readGradeScheduleCache() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(GRADE_SCHEDULE_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as {
      subjects?: SubjectApi[] | null;
      subjectsFetchedAt?: number;
      subjectsVersion?: string | null;
      classesBySchool?: Array<[string, ClassApi[]]>;
      matrixBySchool?: Array<[string, MatrixApi[]]>;
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
  subjectsCatalogFetchedAt =
    typeof hydrated.subjectsFetchedAt === "number" ? hydrated.subjectsFetchedAt : 0;
  subjectsCatalogVersion =
    typeof hydrated.subjectsVersion === "string" ? hydrated.subjectsVersion : null;
  if (Array.isArray(hydrated.classesBySchool)) {
    for (const [key, value] of hydrated.classesBySchool) {
      if (typeof key === "string" && Array.isArray(value)) {
        classesCatalogBySchoolCache.set(key, value);
      }
    }
  }
  if (Array.isArray(hydrated.matrixBySchool)) {
    for (const [key, value] of hydrated.matrixBySchool) {
      if (typeof key === "string" && Array.isArray(value)) {
        matrixBySchoolCache.set(key, value);
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
      subjectsFetchedAt: subjectsCatalogFetchedAt,
      subjectsVersion: subjectsCatalogVersion,
      classesBySchool: Array.from(classesCatalogBySchoolCache.entries()),
      matrixBySchool: Array.from(matrixBySchoolCache.entries()),
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
  breakMarkersByShift: Record<ShiftKey, readonly BreakMarker[]>;
  hasConfiguredTimeSlots: boolean;
  turmaOptions: readonly string[];
  classOptions: Array<{ id: string; name: string }>;
  topEditorOptions: readonly string[];
  subjectOptions: readonly string[];
  subjectIconsByName: Record<string, string | null | undefined>;
  teacherStats: {
    lessonsCount: number;
    totalHours: number;
    totalMinutes: number;
    classNames: string[];
  };
  teacherSubjectProgress: Array<{
    subjectName: string;
    seriesName: string;
    currentCount: number;
    targetCount: number;
  }>;
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
    classId?: string;
    teacherId?: string;
    subjectId?: string;
  }) => Promise<boolean>;
  updateScheduleFromSelection: (input: {
    scheduleId: string;
    turma: string;
    subject: string;
    classId?: string;
    teacherId?: string;
    subjectId?: string;
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

function getClassDisplayName(item: ClassApi): string {
  const code = item.code?.trim();
  if (code) return code;
  const name = item.name?.trim();
  if (name) return name;
  return "";
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
  selectedTeacherId: string | null,
  viewMode: "professor" | "turma" = "professor",
  selectedClassId: string | null = null,
  teacherDirectory: Array<{ id: string; name: string }> = [],
  teacherSubjectNames: string[] = []
): UseGradeScheduleDataResult {
  const [timeSlots, setTimeSlots] = useState<TimeSlotApi[]>([]);
  const [schedules, setSchedules] = useState<ScheduleApi[]>([]);
  const [classes, setClasses] = useState<ClassApi[]>([]);
  const [subjects, setSubjects] = useState<SubjectApi[]>([]);
  const [matrixWorkloads, setMatrixWorkloads] = useState<MatrixApi[]>([]);
  const [isLoadingTimeSlots, setIsLoadingTimeSlots] = useState(false);
  const [isLoadingSchedules, setIsLoadingSchedules] = useState(false);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(false);

  useEffect(() => {
    if (!subjectsCatalogCache) {
      hydrateGradeScheduleCacheInMemory();
    }

    let isCancelled = false;
    const currentCatalogVersion = getSubjectsCatalogVersion();

    if (subjectsCatalogCache) {
      setSubjects(subjectsCatalogCache);
    }

    const shouldRefreshSubjects =
      !subjectsCatalogCache ||
      Date.now() - subjectsCatalogFetchedAt > SUBJECTS_CATALOG_STALE_MS ||
      subjectsCatalogVersion !== currentCatalogVersion;

    const loadSubjects = async (force = false) => {
      if (!force && !shouldRefreshSubjects) {
        return;
      }

      if (!subjectsCatalogCache) {
        setIsLoadingCatalog(true);
      }
      try {
        const subjectsData = await api.get<SubjectApi[]>("/subjects");
        if (!isCancelled) {
          subjectsCatalogCache = subjectsData ?? [];
          subjectsCatalogFetchedAt = Date.now();
          subjectsCatalogVersion = getSubjectsCatalogVersion();
          setSubjects(subjectsCatalogCache);
          writeGradeScheduleCache();
        }
      } catch {
        if (!isCancelled) {
          if (!subjectsCatalogCache) {
            setSubjects([]);
          }
        }
      } finally {
        if (!isCancelled) setIsLoadingCatalog(false);
      }
    };

    void loadSubjects();

    const handleSubjectsCatalogUpdated = () => {
      void loadSubjects(true);
    };

    window.addEventListener(SUBJECTS_CATALOG_UPDATED_EVENT, handleSubjectsCatalogUpdated);
    return () => {
      isCancelled = true;
      window.removeEventListener(SUBJECTS_CATALOG_UPDATED_EVENT, handleSubjectsCatalogUpdated);
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
      setMatrixWorkloads([]);
      return;
    }

    if (!matrixBySchoolCache.has(selectedSchoolId)) {
      hydrateGradeScheduleCacheInMemory();
    }

    const cached = matrixBySchoolCache.get(selectedSchoolId);
    let isCancelled = false;
    setMatrixWorkloads(cached ?? []);

    const loadMatrix = async () => {
      setIsLoadingCatalog(true);
      try {
        const matrixData = await api.get<MatrixApi[]>(
          `/matrix?school_id=${encodeURIComponent(selectedSchoolId)}`
        );
        if (!isCancelled) {
          const next = matrixData ?? [];
          matrixBySchoolCache.set(selectedSchoolId, next);
          setMatrixWorkloads(next);
          writeGradeScheduleCache();
        }
      } catch {
        if (!isCancelled && !cached) {
          setMatrixWorkloads([]);
        }
      } finally {
        if (!isCancelled) setIsLoadingCatalog(false);
      }
    };

    void loadMatrix();
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
    const activeId = viewMode === "turma" ? selectedClassId : selectedTeacherId;
    if (!activeId || !selectedSchoolId) {
      setSchedules([]);
      return;
    }

    const schedulesCacheKey = `${viewMode}:${activeId}:${selectedSchoolId}`;
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
          school_id: selectedSchoolId,
        });
        if (viewMode === "turma" && selectedClassId) {
          params.set("class_id", selectedClassId);
        } else if (selectedTeacherId) {
          params.set("teacher_id", selectedTeacherId);
        }
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
  }, [selectedSchoolId, selectedTeacherId, selectedClassId, viewMode]);

  const timesByShift = useMemo(() => {
    if (timeSlots.length === 0) return DEFAULT_TIMES_BY_SHIFT;

    const byShift: Record<ShiftKey, string[]> = { M: [], V: [] };

    for (const slot of timeSlots) {
      if (slot.is_break) continue;
      const shiftKey = toShiftKey(slot.shift);
      if (!shiftKey) continue;
      byShift[shiftKey].push(normalizeTime(slot.start_time));
    }

    return {
      M: byShift.M.length > 0 ? uniqueSorted(byShift.M) : DEFAULT_TIMES_BY_SHIFT.M,
      V: byShift.V.length > 0 ? uniqueSorted(byShift.V) : DEFAULT_TIMES_BY_SHIFT.V,
    };
  }, [timeSlots]);

  const breakMarkersByShift = useMemo(() => {
    if (timeSlots.length === 0) {
      return { M: [], V: [] } satisfies Record<ShiftKey, readonly BreakMarker[]>;
    }

    const byShift: Record<ShiftKey, BreakMarker[]> = { M: [], V: [] };

    for (const shiftKey of ["M", "V"] as const) {
      const ordered = timeSlots
        .filter((slot) => toShiftKey(slot.shift) === shiftKey)
        .sort((left, right) => left.order_index - right.order_index);

      let previousLessonStart = "";

      for (const slot of ordered) {
        const startTime = normalizeTime(slot.start_time);
        if (!startTime) continue;

        if (!slot.is_break) {
          previousLessonStart = startTime;
          continue;
        }

        if (!previousLessonStart) continue;

        byShift[shiftKey].push({
          labelTime: startTime,
          anchorTime: previousLessonStart,
        });
      }
    }

    return {
      M: byShift.M,
      V: byShift.V,
    } satisfies Record<ShiftKey, readonly BreakMarker[]>;
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

        const event: ShiftEvent = {
          id: schedule.id,
          shift,
          day,
          time,
          className:
            viewMode === "turma"
              ? pickFirstName(schedule.teachers) || "Professor"
              : pickFirstName(schedule.classes) || "Turma",
          subject: pickFirstName(schedule.subjects) || "Matéria",
        };

        if (schedule.class_id) event.classId = schedule.class_id;
        if (schedule.teacher_id) event.teacherId = schedule.teacher_id;
        if (schedule.subject_id) event.subjectId = schedule.subject_id;

        return event;
      })
      .filter((event): event is ShiftEvent => Boolean(event));
  }, [schedules, viewMode]);

  const turmaOptions = useMemo(() => {
    return uniqueSorted(classes.map((item) => getClassDisplayName(item)));
  }, [classes]);

  const classOptions = useMemo(
    () =>
      classes
        .map((item) => ({ id: item.id, name: getClassDisplayName(item) }))
        .filter((item) => item.name.length > 0),
    [classes]
  );

  const topEditorOptions = useMemo(() => {
    if (viewMode === "turma") {
      return uniqueSorted(teacherDirectory.map((item) => item.name.trim()));
    }
    return turmaOptions;
  }, [teacherDirectory, turmaOptions, viewMode]);

  const subjectOptions = useMemo(() => {
    const fromSubjects = uniqueSorted(subjects.map((item) => item.name.trim()));
    if (fromSubjects.length > 0) return fromSubjects;
    return uniqueSorted(events.map((event) => event.subject));
  }, [subjects, events]);

  const subjectIconsByName = useMemo(() => {
    return Object.fromEntries(
      subjects
        .map((item) => [item.name.trim(), item.icon ?? null] as const)
        .filter(([name]) => name.length > 0)
    );
  }, [subjects]);

  const teacherStats = useMemo(() => {
    const slotById = new Map(timeSlots.map((slot) => [slot.id, slot]));
    return calculateTeacherScheduleStats(schedules, {
      resolveSlotById: (timeSlotId) => slotById.get(timeSlotId),
      defaultLessonMinutes: 60,
    });
  }, [schedules, timeSlots]);

  const teacherSubjectProgress = useMemo(() => {
    if (!selectedTeacherId || viewMode !== "professor") {
      return [];
    }

    const classById = new Map(classes.map((item) => [item.id, item]));
    const subjectById = new Map(subjects.map((item) => [item.id, item]));
    const assignedSubjectIds = new Set(
      teacherSubjectNames
        .map((name) =>
          subjects.find((item) => normalizeLabel(item.name) === normalizeLabel(name))?.id ?? ""
        )
        .filter(Boolean)
    );
    const actualCountBySeriesAndSubject = new Map<string, number>();
    const relevantSeriesIds = new Set<string>();

    for (const schedule of schedules) {
      const classId = schedule.class_id ?? "";
      const subjectId = schedule.subject_id ?? "";
      const classEntity = classById.get(classId);
      const seriesId = classEntity?.series_id?.trim() ?? "";
      if (!seriesId || !subjectId) continue;

      relevantSeriesIds.add(seriesId);
      const key = `${seriesId}:${subjectId}`;
      actualCountBySeriesAndSubject.set(key, (actualCountBySeriesAndSubject.get(key) ?? 0) + 1);
    }

    if (relevantSeriesIds.size === 0) {
      return [];
    }

    const progressBySeriesAndSubject = new Map<
      string,
      {
        subjectName: string;
        seriesName: string;
        currentCount: number;
        targetCount: number;
      }
    >();

    for (const [key, currentCount] of actualCountBySeriesAndSubject.entries()) {
      const [seriesId, subjectId] = key.split(":");
      if (!seriesId || !subjectId) continue;
      if (assignedSubjectIds.size > 0 && !assignedSubjectIds.has(subjectId)) continue;

      const seriesName =
        classes.find((item) => item.series_id?.trim() === seriesId)?.series_name?.trim() ?? "S?rie";
      const subjectName =
        subjectById.get(subjectId)?.name?.trim() ??
        pickFirstName(schedules.find((item) => item.subject_id === subjectId)?.subjects) ??
        "Mat?ria";

      progressBySeriesAndSubject.set(key, {
        subjectName,
        seriesName,
        currentCount,
        targetCount: 0,
      });
    }

    for (const workload of matrixWorkloads) {
      const seriesId = workload.series_id?.trim();
      const subjectId = workload.subject_id?.trim();
      if (!seriesId || !subjectId) continue;
      if (!relevantSeriesIds.has(seriesId)) continue;
      if (assignedSubjectIds.size > 0 && !assignedSubjectIds.has(subjectId)) continue;

      const key = `${seriesId}:${subjectId}`;
      if (!actualCountBySeriesAndSubject.has(key)) continue;

      const seriesName =
        classes.find((item) => item.series_id?.trim() === seriesId)?.series_name?.trim() ?? "S?rie";
      const subjectName =
        workload.subjects?.name?.trim() ??
        subjectById.get(subjectId)?.name?.trim() ??
        "Mat?ria";
      const currentCount = actualCountBySeriesAndSubject.get(key) ?? 0;
      const targetCount = Math.max(0, Number(workload.weekly_classes) || 0);

      progressBySeriesAndSubject.set(key, {
        subjectName,
        seriesName,
        currentCount,
        targetCount,
      });
    }

    return Array.from(progressBySeriesAndSubject.values()).sort((left, right) => {
      const bySubject = left.subjectName.localeCompare(right.subjectName, "pt-BR", {
        sensitivity: "base",
      });
      if (bySubject !== 0) return bySubject;
      return left.seriesName.localeCompare(right.seriesName, "pt-BR", {
        sensitivity: "base",
      });
    });
  }, [classes, matrixWorkloads, schedules, selectedTeacherId, subjects, teacherSubjectNames, viewMode]);

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
      const cacheKeyOwnerForMove = viewMode === "turma" ? selectedClassId : selectedTeacherId;
      if (cacheKeyOwnerForMove && selectedSchoolId) {
        const schedulesCacheKey = `${viewMode}:${cacheKeyOwnerForMove}:${selectedSchoolId}`;
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
      const message =
        error instanceof Error
          ? error.message
          : "Não foi possível mover a aula para esse horário.";
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
    classId,
    teacherId,
    subjectId,
  }: {
    dayIndex: number;
    startSlot: number;
    shift: ShiftKey;
    turma: string;
    subject: string;
    classId?: string;
    teacherId?: string;
    subjectId?: string;
  }): Promise<boolean> => {
    const activeTeacherId =
      teacherId ??
      (viewMode === "turma"
        ? teacherDirectory.find((item) => normalizeLabel(item.name) === normalizeLabel(turma))?.id ?? null
        : selectedTeacherId);
    const activeClassId =
      classId ??
      (viewMode === "turma"
        ? selectedClassId
        : classes.find((item) => normalizeLabel(getClassDisplayName(item)) === normalizeLabel(turma))?.id ?? null);

    if (!selectedSchoolId || !activeTeacherId || !activeClassId) return false;

    const subjectEntity =
      subjects.find((item) => item.id === subjectId) ??
      subjects.find((item) => normalizeLabel(item.name) === normalizeLabel(subject));
    const timeAtSlot = timesByShift[shift]?.[startSlot];

    if (!subjectEntity || !timeAtSlot) {
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
          class_id: activeClassId,
          teacher_id: activeTeacherId,
          subject_id: subjectEntity.id,
          time_slot_id: targetTimeSlot.id,
          day_of_week: dayIndex + 1,
        }
      );

      const activeClassEntity = classes.find((item) => item.id === activeClassId);
      const activeClassName = activeClassEntity ? getClassDisplayName(activeClassEntity) || "Turma" : "Turma";
      const activeTeacherName = teacherDirectory.find((item) => item.id === activeTeacherId)?.name ?? "Professor";

      const createdSchedule: ScheduleApi = {
        id: created?.id ?? `tmp-${Date.now()}`,
        day_of_week: dayIndex + 1,
        class_id: activeClassId,
        teacher_id: activeTeacherId,
        subject_id: subjectEntity.id,
        time_slot_id: targetTimeSlot.id,
        classes: { name: activeClassName },
        teachers: { name: activeTeacherName },
        subjects: { name: subjectEntity.name },
        time_slots: {
          start_time: targetTimeSlot.start_time,
          shift: targetTimeSlot.shift,
        },
      };

      setSchedules((previous) => [...previous, createdSchedule]);

      const cacheKeyOwnerForCreate = viewMode === "turma" ? selectedClassId : selectedTeacherId;
      if (cacheKeyOwnerForCreate && selectedSchoolId) {
        const schedulesCacheKey = `${viewMode}:${cacheKeyOwnerForCreate}:${selectedSchoolId}`;
        const current = schedulesByTeacherAndSchoolCache.get(schedulesCacheKey) ?? [];
        schedulesByTeacherAndSchoolCache.set(schedulesCacheKey, [...current, createdSchedule]);
        writeGradeScheduleCache();
      }

      if (viewMode === "turma") {
        toast.success(`Aula com ${activeTeacherName} foi salva`);
      } else {
        toast.success(`Aula na turma ${activeClassName} foi salva`);
      }
      return true;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Não foi possível salvar a aula.";
      toast.error(message);
      return false;
    }
  };

  const updateScheduleFromSelection = async ({
    scheduleId,
    turma,
    subject,
    classId,
    teacherId,
    subjectId,
  }: {
    scheduleId: string;
    turma: string;
    subject: string;
    classId?: string;
    teacherId?: string;
    subjectId?: string;
  }): Promise<boolean> => {
    if (!selectedSchoolId) return false;

    const activeTeacherId =
      teacherId ??
      (viewMode === "turma"
        ? teacherDirectory.find((item) => normalizeLabel(item.name) === normalizeLabel(turma))?.id ?? null
        : selectedTeacherId);
    const activeClassId =
      classId ??
      (viewMode === "turma"
        ? selectedClassId
        : classes.find((item) => normalizeLabel(getClassDisplayName(item)) === normalizeLabel(turma))?.id ?? null);

    if (!activeTeacherId || !activeClassId) {
      toast.error("Não foi possível identificar a turma e o professor da aula.");
      return false;
    }

    const subjectEntity =
      subjects.find((item) => item.id === subjectId) ??
      subjects.find((item) => normalizeLabel(item.name) === normalizeLabel(subject));

    if (!subjectEntity) {
      toast.error("Não foi possível identificar a matéria selecionada.");
      return false;
    }

    try {
      await api.patchWithMeta(`/schedules/${encodeURIComponent(scheduleId)}`, {
        class_id: activeClassId,
        teacher_id: activeTeacherId,
        subject_id: subjectEntity.id,
      });

      const activeClassEntity = classes.find((item) => item.id === activeClassId);
      const activeClassName = activeClassEntity ? getClassDisplayName(activeClassEntity) || "Turma" : "Turma";
      const activeTeacherName = teacherDirectory.find((item) => item.id === activeTeacherId)?.name ?? "Professor";

      setSchedules((previous) =>
        previous.map((schedule) =>
          schedule.id === scheduleId
            ? {
                ...schedule,
                class_id: activeClassId,
                teacher_id: activeTeacherId,
                subject_id: subjectEntity.id,
                classes: { name: activeClassName },
                teachers: { name: activeTeacherName },
                subjects: { name: subjectEntity.name },
              }
            : schedule
        )
      );

      const cacheKeyOwnerForUpdate = viewMode === "turma" ? selectedClassId : selectedTeacherId;
      if (cacheKeyOwnerForUpdate && selectedSchoolId) {
        const schedulesCacheKey = `${viewMode}:${cacheKeyOwnerForUpdate}:${selectedSchoolId}`;
        const current = schedulesByTeacherAndSchoolCache.get(schedulesCacheKey) ?? [];
        const updated = current.map((schedule) =>
          schedule.id === scheduleId
            ? {
                ...schedule,
                class_id: activeClassId,
                teacher_id: activeTeacherId,
                subject_id: subjectEntity.id,
                classes: { name: activeClassName },
                teachers: { name: activeTeacherName },
                subjects: { name: subjectEntity.name },
              }
            : schedule
        );
        schedulesByTeacherAndSchoolCache.set(schedulesCacheKey, updated);
        writeGradeScheduleCache();
      }

      toast.success("Aula atualizada com sucesso.");
      return true;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Não foi possível atualizar a aula.";
      toast.error(message);
      return false;
    }
  };

  const deleteScheduleById = async (scheduleId: string): Promise<boolean> => {
    try {
      await api.delete(`/schedules/${encodeURIComponent(scheduleId)}`);

      setSchedules((previous) => previous.filter((schedule) => schedule.id !== scheduleId));

      const cacheKeyOwnerForDelete = viewMode === "turma" ? selectedClassId : selectedTeacherId;
      if (cacheKeyOwnerForDelete && selectedSchoolId) {
        const schedulesCacheKey = `${viewMode}:${cacheKeyOwnerForDelete}:${selectedSchoolId}`;
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
    if (!selectedSchoolId || viewMode !== "professor") return { hasConflict: false };

    const turmaEntity = classes.find(
      (item) => normalizeLabel(getClassDisplayName(item)) === normalizeLabel(turma)
    );
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
    breakMarkersByShift,
    hasConfiguredTimeSlots,
    turmaOptions,
    classOptions,
    topEditorOptions,
    subjectOptions,
    subjectIconsByName,
    teacherStats,
    teacherSubjectProgress,
    isLoadingTimeSlots,
    isLoadingSchedules,
    isLoadingCatalog,
    persistScheduleMove,
    createScheduleFromSelection,
    updateScheduleFromSelection,
    deleteScheduleById,
    checkClassConflictAtSelection,
  };
}


