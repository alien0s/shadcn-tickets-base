type NameRelation = { name?: string | null } | Array<{ name?: string | null }> | null | undefined;

type TimeSlotLike = {
  start_time?: string | null;
  end_time?: string | null;
};

type TimeSlotRelation = TimeSlotLike | TimeSlotLike[] | null | undefined;

type ScheduleLike = {
  classes?: NameRelation;
  time_slots?: TimeSlotRelation;
  time_slot_id?: string;
};

function extractClassName(relation: NameRelation): string {
  if (!relation) return "";
  if (Array.isArray(relation)) return String(relation[0]?.name ?? "").trim();
  return String(relation.name ?? "").trim();
}

function extractTimeSlot(relation: TimeSlotRelation): TimeSlotLike | null {
  if (!relation) return null;
  if (Array.isArray(relation)) return relation[0] ?? null;
  return relation;
}

function toMinutes(value?: string | null): number | null {
  if (!value) return null;
  const [h, m] = value.slice(0, 5).split(":");
  const hour = Number(h);
  const minute = Number(m);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;
  return hour * 60 + minute;
}

export function calculateTeacherScheduleStats(
  schedules: ScheduleLike[],
  options?: {
    resolveSlotById?: (timeSlotId: string) => TimeSlotLike | null | undefined;
    defaultLessonMinutes?: number;
  }
): {
  lessonsCount: number;
  totalMinutes: number;
  totalHours: number;
  classNames: string[];
} {
  const defaultLessonMinutes = options?.defaultLessonMinutes ?? 60;
  const classesSet = new Set<string>();
  let minutes = 0;

  for (const schedule of schedules) {
    const className = extractClassName(schedule.classes);
    if (className) classesSet.add(className);

    const relatedSlot = extractTimeSlot(schedule.time_slots);
    const resolvedSlot =
      relatedSlot ??
      (schedule.time_slot_id ? options?.resolveSlotById?.(schedule.time_slot_id) ?? null : null);

    const start = toMinutes(resolvedSlot?.start_time ?? null);
    const end = toMinutes(resolvedSlot?.end_time ?? null);

    if (start !== null && end !== null && end > start) {
      minutes += end - start;
    } else {
      minutes += defaultLessonMinutes;
    }
  }

  return {
    lessonsCount: schedules.length,
    totalMinutes: minutes,
    totalHours: Math.round((minutes / 60) * 10) / 10,
    classNames: Array.from(classesSet).sort((a, b) => a.localeCompare(b)),
  };
}
