// Tipos simples usados pela tela de RH para opcoes e linhas da tabela.
export type RhOptionType = "subject" | "education-level";

export type RhOption = {
  id: string;
  key: string;
  label: string;
  type: RhOptionType;
};

export type RhSavedTicketPriceRow = {
  id: string;
  schoolId: string;
  optionKey: string;
  optionLabel: string;
  optionType: RhOptionType | "mixed";
  pricePerLesson: number;
  isDraft?: false;
};

export type RhDraftMode = "create" | "edit";

// Linha temporaria usada para criacao e edicao inline antes do save.
export type RhDraftTicketPriceRow = {
  id: string;
  schoolId: string;
  optionKey: string;
  pricePerLesson: string;
  isDraft: true;
  mode: RhDraftMode;
  sourceId?: string;
  originalOptionKey?: string;
  originalPricePerLesson?: string;
  isSaving?: boolean;
};

export type RhTicketPriceRow = RhSavedTicketPriceRow | RhDraftTicketPriceRow;

// Estrutura final exibida por escola dentro do modal de precos.
export type RhSchoolSection = {
  schoolId: string;
  schoolLabel: string;
  schoolName: string;
  savedCount: number;
  rows: RhTicketPriceRow[];
};

export type RhTeacherDirectoryItem = {
  id: string;
  schoolId: string;
  name: string;
  avatarUrl?: string | null;
};

export type RhTeacherLessonTicket = {
  id: string;
  dayLabel: string;
  timeLabel: string;
  className: string;
  subjectName: string;
  ticketLabel: string;
  ticketValue: number;
  hasTicket: boolean;
};

export type RhTeacherTicketRow = {
  id: string;
  name: string;
  avatarUrl?: string | null;
  lessonsCount: number;
  totalTickets: number;
  lessons: RhTeacherLessonTicket[];
};
