import type {
  ImportableGradeSummary,
  ScheduleRow,
  TimeSlotApi,
  ValidBreak,
} from "../types";

export const WEEKDAY_LABELS = ["Seg", "Ter", "Qua", "Qui", "Sex"] as const;
export const AFTERNOON_START_MINUTES = 13 * 60;
export const DEFAULT_BREAK_FORM = { id: "break-1", start: "", end: "" } as const;

export function normalizeTime(value: string): string {
  return String(value ?? "").slice(0, 5);
}

export function timeToMinutes(value: string): number {
  const normalized = normalizeTime(value);
  const [hours, minutes] = normalized.split(":").map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return Number.MAX_SAFE_INTEGER;
  return hours * 60 + minutes;
}

export function parseTimeToMinutes(value: string): number | null {
  const [hours, minutes] = value.split(":").map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  return hours * 60 + minutes;
}

export function minutesToTime(value: number): string {
  const hours = Math.floor(value / 60);
  const minutes = value % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function buildAbbreviation(name: string): string {
  const words = String(name ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) return "ESC";
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase();

  return words
    .slice(0, 3)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}

// Recria a cadencia das aulas apos cada intervalo para manter a pre-visualizacao
// alinhada com a mesma regra usada ao persistir os time slots no backend.
export function buildShiftTimesWithBreaks(
  start: string,
  end: string,
  lessonMinutes: number,
  intervals: Array<{ startMinutes: number; endMinutes: number }>
): string[] {
  const startMinutes = parseTimeToMinutes(start);
  const endMinutes = parseTimeToMinutes(end);
  if (startMinutes === null || endMinutes === null) return [];
  if (lessonMinutes <= 0 || startMinutes >= endMinutes) return [];

  const sortedIntervals = intervals
    .filter((interval) => interval.startMinutes < interval.endMinutes)
    .slice()
    .sort((left, right) => left.startMinutes - right.startMinutes);

  const times: string[] = [];
  let segmentStart = startMinutes;

  for (const interval of sortedIntervals) {
    for (
      let current = segmentStart;
      current + lessonMinutes <= interval.startMinutes;
      current += lessonMinutes
    ) {
      times.push(minutesToTime(current));
    }

    segmentStart = interval.endMinutes;
  }

  for (let current = segmentStart; current + lessonMinutes <= endMinutes; current += lessonMinutes) {
    times.push(minutesToTime(current));
  }

  return times;
}

export function getShiftLabel(shift: number): string {
  if (shift === 1) return "Matutino";
  if (shift === 2) return "Vespertino";
  return "Noturno";
}

export function deriveLessonMinutes(slots: TimeSlotApi[]): number | null {
  const firstLesson = slots.find((slot) => !slot.is_break && slot.end_time);
  if (!firstLesson?.end_time) return null;

  const startMinutes = parseTimeToMinutes(normalizeTime(firstLesson.start_time));
  const endMinutes = parseTimeToMinutes(normalizeTime(firstLesson.end_time));

  if (startMinutes === null || endMinutes === null || endMinutes <= startMinutes) {
    return null;
  }

  return endMinutes - startMinutes;
}

export function buildShiftSummaries(slots: TimeSlotApi[]): ImportableGradeSummary["shifts"] {
  const grouped = new Map<number, TimeSlotApi[]>();

  for (const slot of slots) {
    const shift = Number(slot.shift);
    if (!Number.isFinite(shift)) continue;

    const current = grouped.get(shift) ?? [];
    current.push(slot);
    grouped.set(shift, current);
  }

  return [...grouped.entries()]
    .sort((left, right) => left[0] - right[0])
    .map(([shift, shiftSlots]) => {
      const orderedLessons = shiftSlots
        .filter((slot) => !slot.is_break)
        .sort((left, right) => {
          const startDiff =
            timeToMinutes(normalizeTime(left.start_time)) - timeToMinutes(normalizeTime(right.start_time));

          if (startDiff !== 0) {
            return startDiff;
          }

          return left.order_index - right.order_index;
        });

      const first = orderedLessons[0];
      const last = orderedLessons[orderedLessons.length - 1];

      return {
        shift,
        startTime: normalizeTime(first?.start_time ?? ""),
        endTime: normalizeTime(last?.end_time ?? ""),
      };
    })
    .filter((shift) => shift.startTime && shift.endTime);
}

export function buildScheduleRows(timeSlots: TimeSlotApi[]): ScheduleRow[] {
  const orderedSlots = [...timeSlots].sort((left, right) => {
    const leftShift = Number(left.shift);
    const rightShift = Number(right.shift);

    if (leftShift !== rightShift) {
      return leftShift - rightShift;
    }

    return left.order_index - right.order_index;
  });

  const rows: ScheduleRow[] = [];

  for (let index = 0; index < orderedSlots.length; index += 1) {
    const slot = orderedSlots[index];
    const previousSlot = orderedSlots[index - 1];
    const slotStartTime = normalizeTime(slot.start_time);

    if (
      previousSlot &&
      !previousSlot.is_break &&
      !slot.is_break &&
      timeToMinutes(normalizeTime(previousSlot.start_time)) < AFTERNOON_START_MINUTES &&
      timeToMinutes(slotStartTime) >= AFTERNOON_START_MINUTES
    ) {
      const lunchStartTime = normalizeTime(previousSlot.end_time ?? "");

      if (lunchStartTime) {
        rows.push({
          type: "interval",
          key: `lunch-${previousSlot.id}-${slot.id}`,
          startTime: lunchStartTime,
          variant: "lunch",
        });
      }
    }

    rows.push(
      slot.is_break
        ? {
            type: "interval",
            key: slot.id,
            startTime: slotStartTime,
            variant: "break",
          }
        : {
            type: "time",
            key: slot.id,
            time: slotStartTime,
          }
    );
  }

  return rows;
}

export function buildPreviewRows(input: {
  morningPreviewTimes: string[];
  afternoonPreviewTimes: string[];
  morningBreaks: ValidBreak[];
  afternoonBreaks: ValidBreak[];
  morningEnd: string;
}): ScheduleRow[] {
  const {
    morningPreviewTimes,
    afternoonPreviewTimes,
    morningBreaks,
    afternoonBreaks,
    morningEnd,
  } = input;

  const buildRowsWithBreaks = (times: string[], breaks: ValidBreak[]): ScheduleRow[] => {
    const rows = times.map((time) => ({ type: "time" as const, key: `time-${time}`, time }));
    if (breaks.length === 0) return rows;

    const orderedBreaks = breaks.slice().sort((left, right) => left.startMinutes - right.startMinutes);
    const nextRows: ScheduleRow[] = [];
    let breakIndex = 0;

    for (const row of rows) {
      while (
        breakIndex < orderedBreaks.length &&
        orderedBreaks[breakIndex].startMinutes <= timeToMinutes(row.time)
      ) {
        nextRows.push({
          type: "interval",
          key: `break-${orderedBreaks[breakIndex].id}`,
          startTime: orderedBreaks[breakIndex].start,
          variant: "break",
        });
        breakIndex += 1;
      }

      nextRows.push(row);
    }

    while (breakIndex < orderedBreaks.length) {
      nextRows.push({
        type: "interval",
        key: `break-${orderedBreaks[breakIndex].id}`,
        startTime: orderedBreaks[breakIndex].start,
        variant: "break",
      });
      breakIndex += 1;
    }

    return nextRows;
  };

  const showLunchDivider = morningPreviewTimes.length > 0 && afternoonPreviewTimes.length > 0;
  const morningRows = buildRowsWithBreaks(morningPreviewTimes, morningBreaks);
  const afternoonRows = buildRowsWithBreaks(afternoonPreviewTimes, afternoonBreaks);

  if (!showLunchDivider) {
    return [...morningRows, ...afternoonRows];
  }

  return [
    ...morningRows,
    {
      type: "interval",
      key: "interval-lunch",
      startTime: morningEnd,
      variant: "lunch",
    },
    ...afternoonRows,
  ];
}
