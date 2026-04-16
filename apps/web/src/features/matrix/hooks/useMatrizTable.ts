import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import type { MatrizSeriesColumn, MatrizTableCell, MatrizTableRow } from "../types/matriz.types";

type SeriesApiItem = {
  id: string;
  education_level_id: string;
  name: string;
  created_at: string;
};

type MatrixApiItem = {
  id: string;
  school_id: string;
  series_id: string;
  subject_id: string;
  weekly_classes: number;
  annual_hours?: number | null;
  subjects?: {
    id: string;
    name: string;
  } | null;
};

type SubjectApiItem = {
  id: string;
  name: string;
  icon?: string | null;
};

type DraftRow = {
  id: string;
  subjectId: string;
  subjectName: string;
  cells: Record<string, string>;
};

function normalizeSeriesShortLabel(name: string): string {
  return name.trim().toUpperCase();
}

function sortSeriesByName(a: SeriesApiItem, b: SeriesApiItem): number {
  const aMatch = a.name.match(/\d+/);
  const bMatch = b.name.match(/\d+/);

  if (aMatch && bMatch) {
    const byNumber = Number(aMatch[0]) - Number(bMatch[0]);
    if (byNumber !== 0) return byNumber;
  }

  return a.name.localeCompare(b.name, "pt-BR", { numeric: true, sensitivity: "base" });
}

function createEmptyCell(): MatrizTableCell {
  return {
    value: null,
    annualHours: null,
  };
}

function mapWorkloadToCell(workload: MatrixApiItem): MatrizTableCell {
  return {
    workloadId: workload.id,
    value: workload.weekly_classes,
    annualHours: workload.annual_hours ?? null,
  };
}

function hasDuplicateSubjectInLevel(
  subjectId: string,
  rows: MatrizTableRow[],
  draftRows: DraftRow[],
  ignoreDraftRowId?: string
): boolean {
  const existsInSavedRows = rows.some((row) => row.subjectId === subjectId);
  if (existsInSavedRows) return true;

  return draftRows.some((row) => row.id !== ignoreDraftRowId && row.subjectId === subjectId);
}

function buildAvailableSubjectOptions(
  rowId: string,
  subjectOptions: Array<{ id: string; name: string }>,
  rows: MatrizTableRow[],
  draftRows: DraftRow[]
) {
  const usedSubjectIds = new Set<string>();

  for (const row of rows) {
    if (row.subjectId) {
      usedSubjectIds.add(row.subjectId);
    }
  }

  for (const row of draftRows) {
    if (row.id !== rowId && row.subjectId) {
      usedSubjectIds.add(row.subjectId);
    }
  }

  const currentDraft = draftRows.find((row) => row.id === rowId);
  const currentSubjectId = currentDraft?.subjectId ?? "";

  return subjectOptions.filter((option) => option.id === currentSubjectId || !usedSubjectIds.has(option.id));
}

function upsertSavedCell(
  currentRows: MatrizTableRow[],
  columns: MatrizSeriesColumn[],
  workload: MatrixApiItem
): MatrizTableRow[] {
  const subjectId = workload.subject_id;
  const subjectName = workload.subjects?.name?.trim() || "Componente sem nome";

  const nextRows = currentRows.map((row) => ({
    ...row,
    cells: { ...row.cells },
  }));

  const targetIndex = nextRows.findIndex((row) => row.subjectId === subjectId || row.id === subjectId);

  if (targetIndex === -1) {
    const newRow: MatrizTableRow = {
      id: subjectId,
      subjectId,
      subjectName,
      cells: Object.fromEntries(columns.map((column) => [column.id, createEmptyCell()])),
    };

    newRow.cells[workload.series_id] = mapWorkloadToCell(workload);

    return [...nextRows, newRow].sort((a, b) =>
      a.subjectName.localeCompare(b.subjectName, "pt-BR", { sensitivity: "base" })
    );
  }

  nextRows[targetIndex].cells[workload.series_id] = mapWorkloadToCell(workload);

  return nextRows;
}

export function useMatrizTable(schoolId: string, educationLevelId: string) {
  const [columns, setColumns] = useState<MatrizSeriesColumn[]>([]);
  const [rows, setRows] = useState<MatrizTableRow[]>([]);
  const [draftRows, setDraftRows] = useState<DraftRow[]>([]);
  const [subjectOptions, setSubjectOptions] = useState<Array<{ id: string; name: string; icon?: string | null }>>([]);
  const [savingCellKey, setSavingCellKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    const loadTable = async () => {
      if (!schoolId || !educationLevelId) {
        setColumns([]);
        setRows([]);
        setDraftRows([]);
        setError(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const [seriesData, matrixData, subjectsData] = await Promise.all([
          api.get<SeriesApiItem[]>("/series"),
          api.get<MatrixApiItem[]>(`/matrix?school_id=${encodeURIComponent(schoolId)}`),
          api.get<SubjectApiItem[]>("/subjects"),
        ]);

        if (!isActive) return;

        const nextColumns = [...(seriesData ?? [])]
          .filter((item) => item.education_level_id === educationLevelId)
          .sort(sortSeriesByName)
          .map((item) => ({
            id: item.id,
            name: item.name,
            shortLabel: normalizeSeriesShortLabel(item.name),
          }));

        const validSeriesIds = new Set(nextColumns.map((column) => column.id));
        const groupedRows = new Map<string, MatrizTableRow>();

        for (const item of matrixData ?? []) {
          if (!validSeriesIds.has(item.series_id)) continue;

          const subjectKey = item.subject_id || item.subjects?.name || item.id;
          const subjectName = item.subjects?.name?.trim() || "Componente sem nome";

          if (!groupedRows.has(subjectKey)) {
            groupedRows.set(subjectKey, {
              id: subjectKey,
              subjectId: item.subject_id,
              subjectName,
              cells: Object.fromEntries(nextColumns.map((column) => [column.id, createEmptyCell()])),
            });
          }

          const currentRow = groupedRows.get(subjectKey);
          if (!currentRow) continue;

          currentRow.cells[item.series_id] = {
            workloadId: item.id,
            value: item.weekly_classes,
            annualHours: item.annual_hours ?? null,
          };
        }

        setColumns(nextColumns);
        setSubjectOptions(
          [...(subjectsData ?? [])].sort((a, b) =>
            a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" })
          )
        );
        setRows(
          Array.from(groupedRows.values()).sort((a, b) =>
            a.subjectName.localeCompare(b.subjectName, "pt-BR", { sensitivity: "base" })
          )
        );
        setDraftRows([]);
      } catch (requestError) {
        if (!isActive) return;

        setColumns([]);
        setRows([]);
        setDraftRows([]);
        setSubjectOptions([]);
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Não foi possível carregar a matriz da escola."
        );
      } finally {
        if (isActive) setIsLoading(false);
      }
    };

    void loadTable();

    return () => {
      isActive = false;
    };
  }, [educationLevelId, schoolId]);

  const addDraftRow = useCallback(() => {
    setDraftRows((current) => [
      ...current,
      {
        id: `draft-${Date.now()}-${current.length + 1}`,
        subjectId: "",
        subjectName: "",
        cells: Object.fromEntries(columns.map((column) => [column.id, ""])),
      },
    ]);
  }, [columns]);

  const updateDraftSubject = useCallback((rowId: string, subjectId: string) => {
    if (subjectId && hasDuplicateSubjectInLevel(subjectId, rows, draftRows, rowId)) {
      toast.warning("Essa disciplina já foi adicionada para o nível de ensino selecionado.");
      return;
    }

    setDraftRows((current) =>
      current.map((row) => {
        if (row.id !== rowId) return row;

        const selectedSubject = subjectOptions.find((option) => option.id === subjectId);
        return {
          ...row,
          subjectId,
          subjectName: selectedSubject?.name ?? "",
        };
      })
    );
  }, [draftRows, rows, subjectOptions]);

  const updateDraftCell = useCallback((rowId: string, columnId: string, value: string) => {
    setDraftRows((current) =>
      current.map((row) =>
        row.id === rowId
          ? {
              ...row,
              cells: {
                ...row.cells,
                [columnId]: value,
              },
            }
          : row
      )
    );
  }, []);

  const updateSavedCell = useCallback(
    async (workloadId: string, weeklyClasses: number) => {
      if (!Number.isFinite(weeklyClasses) || weeklyClasses < 0) {
        toast.error("Informe um número válido para a carga semanal.");
        return false;
      }

      const targetRow = rows.find((row) =>
        Object.values(row.cells).some((cell) => cell.workloadId === workloadId)
      );
      const targetCell = targetRow
        ? Object.values(targetRow.cells).find((cell) => cell.workloadId === workloadId)
        : null;

      if (!targetCell) {
        toast.error("Carga horária da matriz não encontrada.");
        return false;
      }

      if (targetCell.value === weeklyClasses) {
        return true;
      }

      setSavingCellKey(workloadId);

      try {
        const response = await api.patchWithMeta<MatrixApiItem>(`/matrix/${workloadId}`, {
          weekly_classes: weeklyClasses,
          annual_hours: weeklyClasses * 40,
        });

        setRows((current) =>
          current.map((row) => ({
            ...row,
            cells: Object.fromEntries(
              Object.entries(row.cells).map(([seriesId, cell]) => [
                seriesId,
                cell.workloadId === workloadId ? mapWorkloadToCell(response.data) : cell,
              ])
            ),
          }))
        );

        toast.success(response.message || "Carga horária atualizada com sucesso.");
        return true;
      } catch (requestError) {
        toast.error(
          requestError instanceof Error ? requestError.message : "Não foi possível atualizar a carga horária."
        );
        return false;
      } finally {
        setSavingCellKey((current) => (current === workloadId ? null : current));
      }
    },
    [rows]
  );

  const saveDraftCell = useCallback(
    async (rowId: string, columnId: string) => {
      const draftRow = draftRows.find((row) => row.id === rowId);
      if (!draftRow || !schoolId) return;

      const rawValue = draftRow.cells[columnId]?.trim() ?? "";
      const parsedValue = rawValue === "" ? 0 : Number(rawValue);

      if (!Number.isFinite(parsedValue) || parsedValue < 0) {
        toast.error("Informe um número válido para a carga semanal.");
        return;
      }

      if (parsedValue === 0) {
        return;
      }

      if (!draftRow.subjectId) {
        toast.warning("Selecione uma disciplina antes de salvar a carga horária.");
        return;
      }

      if (hasDuplicateSubjectInLevel(draftRow.subjectId, rows, draftRows, rowId)) {
        toast.warning("Essa disciplina já foi adicionada para o nível de ensino selecionado.");
        return;
      }

      const cellKey = `${rowId}:${columnId}`;
      setSavingCellKey(cellKey);

      try {
        const response = await api.postWithMeta<MatrixApiItem>("/matrix", {
          school_id: schoolId,
          series_id: columnId,
          subject_id: draftRow.subjectId,
          weekly_classes: parsedValue,
          annual_hours: parsedValue * 40,
        });

        setRows((current) => upsertSavedCell(current, columns, response.data));
        setDraftRows((current) =>
          current.map((row) =>
            row.id === rowId
              ? {
                  ...row,
                  cells: {
                    ...row.cells,
                    [columnId]: "",
                  },
                }
              : row
          )
        );

        toast.success(response.message || "Carga horária salva com sucesso.");
      } catch (requestError) {
        toast.error(
          requestError instanceof Error ? requestError.message : "Não foi possível salvar a carga horária."
        );
      } finally {
        setSavingCellKey((current) => (current === cellKey ? null : current));
      }
    },
    [columns, draftRows, rows, schoolId]
  );

  const createMissingCell = useCallback(
    async (subjectId: string | undefined, columnId: string, weeklyClasses: number) => {
      if (!subjectId || !schoolId) {
        toast.error("Não foi possível identificar a disciplina da célula.");
        return false;
      }

      if (!Number.isFinite(weeklyClasses) || weeklyClasses < 0) {
        toast.error("Informe um número válido para a carga semanal.");
        return false;
      }

      if (weeklyClasses === 0) {
        return true;
      }

      const cellKey = `${subjectId}:${columnId}`;
      setSavingCellKey(cellKey);

      try {
        const response = await api.postWithMeta<MatrixApiItem>("/matrix", {
          school_id: schoolId,
          series_id: columnId,
          subject_id: subjectId,
          weekly_classes: weeklyClasses,
          annual_hours: weeklyClasses * 40,
        });

        setRows((current) => upsertSavedCell(current, columns, response.data));
        toast.success(response.message || "Carga horária salva com sucesso.");
        return true;
      } catch (requestError) {
        toast.error(
          requestError instanceof Error ? requestError.message : "Não foi possível salvar a carga horária."
        );
        return false;
      } finally {
        setSavingCellKey((current) => (current === cellKey ? null : current));
      }
    },
    [columns, schoolId]
  );

  const mergedRows = useMemo<MatrizTableRow[]>(() => {
    if (draftRows.length === 0) return rows;

    const draftAsRows = draftRows.map((row) => ({
      id: row.id,
      subjectName: row.subjectName,
      isDraft: true,
      cells: Object.fromEntries(
        columns.map((column) => {
          const rawValue = row.cells[column.id]?.trim() ?? "";
          const parsedValue = rawValue === "" ? null : Number(rawValue);

          return [
            column.id,
            {
              value: Number.isFinite(parsedValue) ? parsedValue : null,
              annualHours: Number.isFinite(parsedValue) ? Number(parsedValue) * 40 : null,
            } satisfies MatrizTableCell,
          ];
        })
      ),
    }));

    return [...rows, ...draftAsRows];
  }, [columns, draftRows, rows]);

  const weeklyTotals = useMemo(() => {
    return Object.fromEntries(
      columns.map((column) => [
        column.id,
        mergedRows.reduce((sum, row) => sum + (row.cells[column.id]?.value ?? 0), 0),
      ])
    );
  }, [columns, mergedRows]);

  const annualTotals = useMemo(() => {
    return Object.fromEntries(
      columns.map((column) => [
        column.id,
        mergedRows.reduce((sum, row) => sum + (row.cells[column.id]?.annualHours ?? 0), 0),
      ])
    );
  }, [columns, mergedRows]);

  const getAvailableSubjectOptions = useCallback(
    (rowId: string) => buildAvailableSubjectOptions(rowId, subjectOptions, rows, draftRows),
    [draftRows, rows, subjectOptions]
  );

  return {
    columns,
    rows: mergedRows,
    draftRows,
    subjectOptions,
    getAvailableSubjectOptions,
    savingCellKey,
    isLoading,
    error,
    addDraftRow,
    updateDraftSubject,
    updateDraftCell,
    saveDraftCell,
    createMissingCell,
    updateSavedCell,
    weeklyTotals,
    annualTotals,
  };
}
