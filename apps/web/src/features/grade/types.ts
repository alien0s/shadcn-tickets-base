export const WEEK_DAYS = ["seg", "ter", "qua", "qui", "sex"] as const;

export type WeekDay = (typeof WEEK_DAYS)[number];
export type ShiftKey = "M" | "V";

export type ShiftEvent = {
  id: string;
  shift: ShiftKey;
  day: WeekDay;
  time: string;
  className: string;
  subject: string;
};

export type GradeFilters = {
  turma: string;
  professor: string;
};

