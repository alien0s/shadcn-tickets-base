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
  classId?: string;
  teacherId?: string;
  subjectId?: string;
};

export type GradeFilters = {
  turma: string;
  professor: string;
};

export type BreakMarker = {
  labelTime: string;
  anchorTime: string;
};

export type CopiedLesson = {
  turma: string;
  subject: string;
  classId?: string;
  teacherId?: string;
  subjectId?: string;
};

export type GradeGridProps = {
  shift: ShiftKey;
  events: ShiftEvent[];
  copyScopeKey?: string;
  isSchoolScheduleConfigured?: boolean;
  turmaOptions: readonly string[];
  subjectOptions: readonly string[];
  selectedTeacherSubjectOptions?: readonly string[];
  timesByShift?: Record<ShiftKey, readonly string[]>;
  breakMarkersByShift?: Record<ShiftKey, readonly BreakMarker[]>;
  onPersistMove?: (input: {
    scheduleId: string;
    dayIndex: number;
    startSlot: number;
    shift: ShiftKey;
  }) => Promise<boolean>;
  onCreateSchedule?: (input: {
    dayIndex: number;
    startSlot: number;
    shift: ShiftKey;
    turma: string;
    subject: string;
    classId?: string;
    teacherId?: string;
    subjectId?: string;
  }) => Promise<boolean>;
  onDeleteSchedule?: (scheduleId: string) => Promise<boolean>;
  onValidateTurmaSelection?: (input: {
    dayIndex: number;
    startSlot: number;
    shift: ShiftKey;
    turma: string;
  }) => Promise<{ hasConflict: boolean; teacherName?: string }>;
};

export type ToolbarOption = {
  value: string;
  label: string;
  avatarUrl?: string;
};

export type GradeToolbarProps = {
  viewMode: "professor" | "turma";
  shift: ShiftKey;
  escola: string;
  professor: string;
  turmaId: string;
  onShiftChange: (value: ShiftKey) => void;
  onEscolaChange: (value: string) => void;
  onProfessorChange: (value: string) => void;
  onTurmaChange: (value: string) => void;
  escolaOptions: readonly ToolbarOption[];
  professorOptions: readonly ToolbarOption[];
  turmaOptions: readonly ToolbarOption[];
  isLoadingSchools: boolean;
  isLoadingTeachers: boolean;
  isLoadingTurmas: boolean;
  isProfessorPanelOpen: boolean;
  onToggleProfessorPanel: () => void;
};

