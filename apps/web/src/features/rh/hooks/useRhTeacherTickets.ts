import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib";
import type {
  RhSchoolSection,
  RhTeacherDirectoryItem,
  RhTeacherLessonTicket,
  RhTeacherTicketRow,
} from "../types/rh.types";

type RelationName = {
  name?: string | null;
};

type RelationTimeSlot = {
  start_time?: string | null;
  end_time?: string | null;
};

type ScheduleApi = {
  id: string;
  school_id?: string;
  class_id?: string;
  teacher_id?: string;
  subject_id?: string;
  day_of_week: number | string;
  classes?: RelationName | RelationName[] | null;
  subjects?: RelationName | RelationName[] | null;
  time_slots?: RelationTimeSlot | RelationTimeSlot[] | null;
};

type ClassApi = {
  id: string;
  school_id: string;
  education_level_id?: string | null;
  name?: string | null;
  code?: string | null;
};

type TicketPriceEntry = {
  label: string;
  value: number;
};

type TicketPriceMaps = {
  bySubject: Map<string, Map<string, TicketPriceEntry>>;
  byEducationLevel: Map<string, Map<string, TicketPriceEntry>>;
};

type UseRhTeacherTicketsArgs = {
  enabled: boolean;
  sections: RhSchoolSection[];
  teachers: RhTeacherDirectoryItem[];
};

const DAY_LABELS: Record<number, string> = {
  1: "Seg",
  2: "Ter",
  3: "Qua",
  4: "Qui",
  5: "Sex",
};

function pickFirstName(relation?: RelationName | RelationName[] | null): string {
  if (!relation) return "";
  if (Array.isArray(relation)) return relation[0]?.name?.trim() ?? "";
  return relation.name?.trim() ?? "";
}

function pickTimeSlot(relation?: RelationTimeSlot | RelationTimeSlot[] | null): RelationTimeSlot | null {
  if (!relation) return null;
  if (Array.isArray(relation)) return relation[0] ?? null;
  return relation;
}

function normalizeTime(value?: string | null): string {
  return value ? value.slice(0, 5) : "";
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function getDayLabel(value: number | string): string {
  const numericDay = toNumber(value);
  return numericDay ? DAY_LABELS[numericDay] ?? `Dia ${numericDay}` : "Dia";
}

function getTimeLabel(schedule: ScheduleApi): string {
  const timeSlot = pickTimeSlot(schedule.time_slots);
  const start = normalizeTime(timeSlot?.start_time);
  const end = normalizeTime(timeSlot?.end_time);

  if (start && end) return `${start} - ${end}`;
  return start || "-";
}

function getTimeSortValue(schedule: ScheduleApi): string {
  return normalizeTime(pickTimeSlot(schedule.time_slots)?.start_time);
}

function getClassName(schedule: ScheduleApi, classItem?: ClassApi): string {
  const relationName = pickFirstName(schedule.classes);
  const code = classItem?.code?.trim();
  const name = classItem?.name?.trim();
  return relationName || code || name || "Turma";
}

function parseTicketOptionKey(optionKey: string): { type: "subject" | "education-level"; id: string } | null {
  const [type, id] = optionKey.split(":");
  if (!id || (type !== "subject" && type !== "education-level")) return null;
  return { type, id };
}

function setNestedPrice(
  target: Map<string, Map<string, TicketPriceEntry>>,
  schoolId: string,
  id: string,
  entry: TicketPriceEntry
) {
  const schoolPrices = target.get(schoolId) ?? new Map<string, TicketPriceEntry>();
  schoolPrices.set(id, entry);
  target.set(schoolId, schoolPrices);
}

function buildTicketPriceMaps(sections: RhSchoolSection[]): TicketPriceMaps {
  const bySubject = new Map<string, Map<string, TicketPriceEntry>>();
  const byEducationLevel = new Map<string, Map<string, TicketPriceEntry>>();

  for (const section of sections) {
    for (const row of section.rows) {
      if (row.isDraft) continue;

      const parsed = parseTicketOptionKey(row.optionKey);
      if (!parsed || row.optionType === "mixed") continue;

      const entry = {
        label: row.optionLabel,
        value: row.pricePerLesson,
      };

      if (parsed.type === "subject") {
        setNestedPrice(bySubject, section.schoolId, parsed.id, entry);
      } else {
        setNestedPrice(byEducationLevel, section.schoolId, parsed.id, entry);
      }
    }
  }

  return { bySubject, byEducationLevel };
}

function resolveTicketPrice(
  ticketPriceMaps: TicketPriceMaps,
  schoolId: string,
  subjectId?: string,
  educationLevelId?: string | null
): TicketPriceEntry | null {
  if (subjectId) {
    const subjectTicket = ticketPriceMaps.bySubject.get(schoolId)?.get(subjectId);
    if (subjectTicket) return subjectTicket;
  }

  if (educationLevelId) {
    const educationLevelTicket = ticketPriceMaps.byEducationLevel.get(schoolId)?.get(educationLevelId);
    if (educationLevelTicket) return educationLevelTicket;
  }

  return null;
}

function buildLessonTicket(
  schedule: ScheduleApi,
  classById: Map<string, ClassApi>,
  ticketPriceMaps: TicketPriceMaps
): RhTeacherLessonTicket {
  const classItem = schedule.class_id ? classById.get(schedule.class_id) : undefined;
  const schoolId = schedule.school_id ?? classItem?.school_id ?? "";
  const ticket = resolveTicketPrice(
    ticketPriceMaps,
    schoolId,
    schedule.subject_id,
    classItem?.education_level_id
  );

  return {
    id: schedule.id,
    dayLabel: getDayLabel(schedule.day_of_week),
    timeLabel: getTimeLabel(schedule),
    className: getClassName(schedule, classItem),
    subjectName: pickFirstName(schedule.subjects) || "Materia",
    ticketLabel: ticket?.label ?? "Sem ticket",
    ticketValue: ticket?.value ?? 0,
    hasTicket: Boolean(ticket),
  };
}

function sortLessons(left: ScheduleApi, right: ScheduleApi): number {
  const leftDay = toNumber(left.day_of_week) ?? 0;
  const rightDay = toNumber(right.day_of_week) ?? 0;
  if (leftDay !== rightDay) return leftDay - rightDay;
  return getTimeSortValue(left).localeCompare(getTimeSortValue(right));
}

function sortTeachers(left: RhTeacherDirectoryItem, right: RhTeacherDirectoryItem): number {
  return left.name.localeCompare(right.name, "pt-BR", { sensitivity: "base" });
}

export function useRhTeacherTickets({
  enabled,
  sections,
  teachers,
}: UseRhTeacherTicketsArgs): {
  rows: RhTeacherTicketRow[];
  isLoading: boolean;
  error: string | null;
} {
  const [classes, setClasses] = useState<ClassApi[]>([]);
  const [schedulesByTeacher, setSchedulesByTeacher] = useState<Record<string, ScheduleApi[]>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const schoolIdKey = useMemo(
    () => Array.from(new Set(sections.map((section) => section.schoolId))).sort().join("|"),
    [sections]
  );
  const schoolIds = useMemo(() => (schoolIdKey ? schoolIdKey.split("|") : []), [schoolIdKey]);

  const schoolTeachers = useMemo(() => {
    const visibleSchools = new Set(schoolIds);
    return teachers
      .filter((teacher) => visibleSchools.has(teacher.schoolId))
      .slice()
      .sort(sortTeachers);
  }, [schoolIds, teachers]);

  useEffect(() => {
    if (!enabled || schoolIds.length === 0 || schoolTeachers.length === 0) {
      setClasses([]);
      setSchedulesByTeacher({});
      setIsLoading(false);
      setError(null);
      return;
    }

    let isActive = true;

    const loadTeacherTickets = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const [classEntries, scheduleEntries] = await Promise.all([
          Promise.all(
            schoolIds.map(async (schoolId) => {
              const data = await api.get<ClassApi[]>(`/classes?school_id=${encodeURIComponent(schoolId)}`);
              return [schoolId, data ?? []] as const;
            })
          ),
          Promise.all(
            schoolTeachers.map(async (teacher) => {
              const params = new URLSearchParams({
                school_id: teacher.schoolId,
                teacher_id: teacher.id,
              });
              const data = await api.get<ScheduleApi[]>(`/schedules?${params.toString()}`);
              return [teacher.id, data ?? []] as const;
            })
          ),
        ]);

        if (!isActive) return;

        setClasses(classEntries.flatMap(([, schoolClasses]) => schoolClasses));
        setSchedulesByTeacher(
          scheduleEntries.reduce<Record<string, ScheduleApi[]>>((accumulator, [teacherId, schedules]) => {
            accumulator[teacherId] = schedules;
            return accumulator;
          }, {})
        );
      } catch {
        if (!isActive) return;
        setClasses([]);
        setSchedulesByTeacher({});
        setError("Nao foi possivel carregar aulas e tickets dos professores.");
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    void loadTeacherTickets();

    return () => {
      isActive = false;
    };
  }, [enabled, schoolIdKey, schoolIds, schoolTeachers]);

  const ticketPriceMaps = useMemo(() => buildTicketPriceMaps(sections), [sections]);
  const classById = useMemo(() => new Map(classes.map((item) => [item.id, item])), [classes]);

  const rows = useMemo<RhTeacherTicketRow[]>(
    () =>
      schoolTeachers.map((teacher) => {
        const lessons = (schedulesByTeacher[teacher.id] ?? [])
          .slice()
          .sort(sortLessons)
          .map((schedule) => buildLessonTicket(schedule, classById, ticketPriceMaps));

        return {
          id: teacher.id,
          name: teacher.name,
          avatarUrl: teacher.avatarUrl,
          lessonsCount: lessons.length,
          totalTickets: lessons.reduce((sum, lesson) => sum + lesson.ticketValue, 0),
          lessons,
        };
      }),
    [classById, schedulesByTeacher, schoolTeachers, ticketPriceMaps]
  );

  return { rows, isLoading, error };
}
