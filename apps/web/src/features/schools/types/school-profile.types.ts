export type SchoolApi = {
  id: string;
  name: string;
  abbreviation?: string | null;
};

export type ClassApi = {
  id: string;
  school_id: string;
};

export type TeacherApi = {
  id: string;
  school_id: string;
};

export type TimeSlotApi = {
  id: string;
  shift: number | string;
  order_index: number;
  start_time: string;
  end_time?: string;
  is_break?: boolean;
  break_label?: string | null;
};

export type CreateTimeSlotsGradePayload = {
  school_id: string;
  lesson_minutes: number;
  morning?: {
    start_time: string;
    end_time: string;
  };
  afternoon?: {
    start_time: string;
    end_time: string;
  };
  breaks?: Array<{
    start_time: string;
    end_time: string;
  }>;
};

export type ImportableGradeSummary = {
  schoolId: string;
  schoolName: string;
  schoolAbbreviation: string;
  lessonMinutes: number | null;
  shifts: Array<{
    shift: number;
    startTime: string;
    endTime: string;
  }>;
};

export type SchoolProfileProps = {
  schoolId: string | null;
};

export type BreakForm = {
  id: string;
  start: string;
  end: string;
};

export type ValidBreak = {
  id: string;
  start: string;
  end: string;
  startMinutes: number;
  endMinutes: number;
  shift: "morning" | "afternoon";
};

export type ScheduleRow =
  | { type: "time"; key: string; time: string }
  | { type: "interval"; key: string; startTime: string; variant: "lunch" | "break" };
