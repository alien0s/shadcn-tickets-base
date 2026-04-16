export type MatrizSeriesColumn = {
  id: string;
  name: string;
  shortLabel: string;
};

export type MatrizTableCell = {
  workloadId?: string;
  value: number | null;
  annualHours: number | null;
};

export type MatrizTableRow = {
  id: string;
  subjectId?: string | null;
  subjectName: string;
  cells: Record<string, MatrizTableCell>;
  isDraft?: boolean;
};
