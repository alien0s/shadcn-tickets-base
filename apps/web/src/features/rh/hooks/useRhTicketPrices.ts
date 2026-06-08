import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  CreateTicketPriceRequest,
  TicketPrice,
  UpdateTicketPriceRequest,
} from "@ticket-system/types";
import { toast } from "sonner";
import { api } from "@/lib";
import type {
  RhDraftTicketPriceRow,
  RhOption,
  RhOptionType,
  RhSavedTicketPriceRow,
  RhSchoolSection,
} from "../types/rh.types";

type SubjectApi = {
  id: string;
  name: string;
};

type EducationLevelApi = {
  id: string;
  name: string;
  abbreviation?: string | null;
};

type RhSchoolDirectoryItem = {
  id: string;
  label: string;
  name: string;
};

function createTemporaryId() {
  return typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `rh-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

// Gera uma linha temporaria usada antes do POST real para a API.
function createDraftRow(schoolId: string): RhDraftTicketPriceRow {
  return {
    id: createTemporaryId(),
    schoolId,
    optionKey: "",
    pricePerLesson: "",
    isDraft: true,
    mode: "create",
  };
}

function formatEditablePrice(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
    .format(value)
    .replace(/\./g, "");
}

function createEditDraftRow(row: RhSavedTicketPriceRow): RhDraftTicketPriceRow {
  const formattedPrice = formatEditablePrice(row.pricePerLesson);

  return {
    id: createTemporaryId(),
    schoolId: row.schoolId,
    optionKey: row.optionKey,
    pricePerLesson: formattedPrice,
    isDraft: true,
    mode: "edit",
    sourceId: row.id,
    originalOptionKey: row.optionKey,
    originalPricePerLesson: formattedPrice,
  };
}

function buildOptionKey(type: RhOptionType, id: string): string {
  return `${type}:${id}`;
}

// Le a chave combinada do select para descobrir tipo e id escolhidos.
function parseOptionKey(optionKey: string): { type: RhOptionType; id: string } | null {
  const [type, id] = optionKey.split(":");

  if (!id || (type !== "subject" && type !== "education-level")) {
    return null;
  }

  return { type, id };
}

function normalizePriceInput(rawValue: string): string {
  const cleaned = rawValue.replace(/[^\d.,]/g, "").replace(/\./g, ",");
  const [integerPart = "", ...decimalParts] = cleaned.split(",");

  if (decimalParts.length === 0) {
    return integerPart;
  }

  return `${integerPart},${decimalParts.join("").slice(0, 2)}`;
}

// Converte o valor digitado no input para numero antes do envio.
function parsePriceInput(rawValue: string): number | null {
  const normalized = rawValue.trim().replace(/\./g, "").replace(",", ".");

  if (!normalized) {
    return null;
  }

  const parsedValue = Number(normalized);
  return Number.isFinite(parsedValue) ? parsedValue : null;
}

function sortByLabel<T extends { label: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.label.localeCompare(b.label, "pt-BR", { sensitivity: "base" }));
}

function sortSavedRows(rows: RhSavedTicketPriceRow[]): RhSavedTicketPriceRow[] {
  return [...rows].sort((a, b) => a.optionLabel.localeCompare(b.optionLabel, "pt-BR", { sensitivity: "base" }));
}

// Traduz o retorno da API para o formato que a tabela do RH entende.
function mapTicketPriceToSavedRow(item: TicketPrice): RhSavedTicketPriceRow {
  if (item.subjects && item.education_levels) {
    return {
      id: item.id,
      schoolId: item.school_id,
      optionKey: `mixed:${item.id}`,
      optionLabel: `${item.education_levels.name} / ${item.subjects.name}`,
      optionType: "mixed",
      pricePerLesson: Number(item.price_per_lesson),
    };
  }

  if (item.subjects) {
    return {
      id: item.id,
      schoolId: item.school_id,
      optionKey: buildOptionKey("subject", item.subjects.id),
      optionLabel: item.subjects.name,
      optionType: "subject",
      pricePerLesson: Number(item.price_per_lesson),
    };
  }

  if (item.education_levels) {
    return {
      id: item.id,
      schoolId: item.school_id,
      optionKey: buildOptionKey("education-level", item.education_levels.id),
      optionLabel: item.education_levels.name,
      optionType: "education-level",
      pricePerLesson: Number(item.price_per_lesson),
    };
  }

  return {
    id: item.id,
    schoolId: item.school_id,
    optionKey: `mixed:${item.id}`,
    optionLabel: "Registro sem referencia",
    optionType: "mixed",
    pricePerLesson: Number(item.price_per_lesson),
  };
}

export function useRhTicketPrices(schools: RhSchoolDirectoryItem[]) {
  const [options, setOptions] = useState<RhOption[]>([]);
  const [savedRowsBySchool, setSavedRowsBySchool] = useState<Record<string, RhSavedTicketPriceRow[]>>({});
  const [draftRowsBySchool, setDraftRowsBySchool] = useState<Record<string, RhDraftTicketPriceRow[]>>({});
  const [isLoadingCatalogs, setIsLoadingCatalogs] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    // Carrega catalogos e precos salvos uma unica vez ao abrir a pagina.
    const loadCatalogs = async () => {
      setIsLoadingCatalogs(true);
      setError(null);

      try {
        const [subjectsData, educationLevelsData, ticketPricesData] = await Promise.all([
          api.get<SubjectApi[]>("/subjects"),
          api.get<EducationLevelApi[]>("/education-levels"),
          api.get<TicketPrice[]>("/ticket-prices"),
        ]);

        if (!isActive) {
          return;
        }

        const educationLevelOptions = sortByLabel(
          [...(educationLevelsData ?? [])].map((item) => ({
            id: item.id,
            key: buildOptionKey("education-level", item.id),
            label: item.name,
            type: "education-level" as const,
          }))
        );

        const subjectOptions = sortByLabel(
          [...(subjectsData ?? [])].map((item) => ({
            id: item.id,
            key: buildOptionKey("subject", item.id),
            label: item.name,
            type: "subject" as const,
          }))
        );

        const groupedSavedRows = (ticketPricesData ?? []).reduce<Record<string, RhSavedTicketPriceRow[]>>(
          (accumulator, item) => {
            const row = mapTicketPriceToSavedRow(item);
            accumulator[row.schoolId] = sortSavedRows([...(accumulator[row.schoolId] ?? []), row]);
            return accumulator;
          },
          {}
        );

        setOptions([...educationLevelOptions, ...subjectOptions]);
        setSavedRowsBySchool(groupedSavedRows);
        setDraftRowsBySchool({});
      } catch {
        if (!isActive) {
          return;
        }

        setError("Nao foi possivel carregar os catalogos do RH.");
        setOptions([]);
        setSavedRowsBySchool({});
        setDraftRowsBySchool({});
      } finally {
        if (isActive) {
          setIsLoadingCatalogs(false);
        }
      }
    };

    void loadCatalogs();

    return () => {
      isActive = false;
    };
  }, []);

  const getAvailableOptions = useCallback(
    (schoolId: string, rowId: string) => {
      // Evita duplicar disciplina ou nivel ja usado na mesma escola.
      const draftRows = draftRowsBySchool[schoolId] ?? [];
      const savedRows = savedRowsBySchool[schoolId] ?? [];
      const currentRow = draftRows.find((row) => row.id === rowId);
      const usedKeys = new Set<string>();

      for (const row of savedRows) {
        if (row.optionType !== "mixed" && row.id !== currentRow?.sourceId) {
          usedKeys.add(row.optionKey);
        }
      }

      for (const row of draftRows) {
        if (row.id !== rowId && row.optionKey) {
          usedKeys.add(row.optionKey);
        }
      }

      return options.filter((option) => option.key === currentRow?.optionKey || !usedKeys.has(option.key));
    },
    [draftRowsBySchool, options, savedRowsBySchool]
  );

  const addRow = useCallback((schoolId: string) => {
    setDraftRowsBySchool((current) => ({
      ...current,
      [schoolId]: [...(current[schoolId] ?? []), createDraftRow(schoolId)],
    }));
  }, []);

  const startEditingRow = useCallback((schoolId: string, rowId: string) => {
    setDraftRowsBySchool((currentDraftRows) => {
      const currentSchoolDraftRows = currentDraftRows[schoolId] ?? [];

      if (currentSchoolDraftRows.some((row) => row.mode === "edit" && row.sourceId === rowId)) {
        return currentDraftRows;
      }

      const savedRow = (savedRowsBySchool[schoolId] ?? []).find((row) => row.id === rowId);
      if (!savedRow || savedRow.optionType === "mixed") {
        return currentDraftRows;
      }

      return {
        ...currentDraftRows,
        [schoolId]: [...currentSchoolDraftRows, createEditDraftRow(savedRow)],
      };
    });
  }, [savedRowsBySchool]);

  const updateRowOption = useCallback((schoolId: string, rowId: string, optionKey: string) => {
    setDraftRowsBySchool((current) => ({
      ...current,
      [schoolId]: (current[schoolId] ?? []).map((row) =>
        row.id === rowId
          ? {
              ...row,
              optionKey,
            }
          : row
      ),
    }));
  }, []);

  const updateRowPrice = useCallback((schoolId: string, rowId: string, value: string) => {
    setDraftRowsBySchool((current) => ({
      ...current,
      [schoolId]: (current[schoolId] ?? []).map((row) =>
        row.id === rowId
          ? {
              ...row,
              pricePerLesson: normalizePriceInput(value),
            }
          : row
      ),
    }));
  }, []);

  const removeRow = useCallback((schoolId: string, rowId: string) => {
    setDraftRowsBySchool((current) => ({
      ...current,
      [schoolId]: (current[schoolId] ?? []).filter((row) => row.id !== rowId),
    }));
  }, []);

  const saveRow = useCallback(
    async (schoolId: string, rowId: string) => {
      // Valida a linha localmente antes de enviar o save para a API.
      const draftRow = (draftRowsBySchool[schoolId] ?? []).find((row) => row.id === rowId);
      if (!draftRow) {
        return false;
      }

      if (!draftRow.optionKey) {
        toast.warning("Selecione um nivel ou disciplina antes de salvar.");
        return false;
      }

      const parsedOption = parseOptionKey(draftRow.optionKey);
      if (!parsedOption) {
        toast.error("Nao foi possivel identificar a opcao selecionada.");
        return false;
      }

      const parsedPrice = parsePriceInput(draftRow.pricePerLesson);
      if (!parsedPrice || parsedPrice <= 0) {
        toast.warning("Informe um valor de ticket maior que zero.");
        return false;
      }

      const schoolSavedRows = savedRowsBySchool[schoolId] ?? [];
      const schoolDraftRows = draftRowsBySchool[schoolId] ?? [];
      const duplicatedSelection =
        schoolSavedRows.some((row) => row.id !== draftRow.sourceId && row.optionKey === draftRow.optionKey) ||
        schoolDraftRows.some((row) => row.id !== rowId && row.optionKey === draftRow.optionKey);

      if (duplicatedSelection) {
        toast.warning("Ja existe um preco cadastrado para essa opcao nesta escola.");
        return false;
      }

      setDraftRowsBySchool((current) => ({
        ...current,
        [schoolId]: (current[schoolId] ?? []).map((row) =>
          row.id === rowId
            ? {
                ...row,
                isSaving: true,
              }
            : row
        ),
      }));

      try {
        const basePayload = {
          school_id: schoolId,
          price_per_lesson: parsedPrice,
          subject_id: parsedOption.type === "subject" ? parsedOption.id : null,
          education_level_id: parsedOption.type === "education-level" ? parsedOption.id : null,
        };
        const createPayload: CreateTicketPriceRequest = basePayload;
        const updatePayload: UpdateTicketPriceRequest = basePayload;

        const response =
          draftRow.mode === "edit" && draftRow.sourceId
            ? await api.patchWithMeta<TicketPrice>(
                `/ticket-prices/${encodeURIComponent(draftRow.sourceId)}`,
                updatePayload
              )
            : await api.postWithMeta<TicketPrice>(
                "/ticket-prices",
                createPayload
              );

        const savedRow = mapTicketPriceToSavedRow(response.data);

        setSavedRowsBySchool((current) => {
          const currentRows = current[schoolId] ?? [];
          const nextRows =
            draftRow.mode === "edit" && draftRow.sourceId
              ? currentRows.map((row) => (row.id === draftRow.sourceId ? savedRow : row))
              : [...currentRows, savedRow];

          return {
            ...current,
            [schoolId]: sortSavedRows(nextRows),
          };
        });

        setDraftRowsBySchool((current) => ({
          ...current,
          [schoolId]: (current[schoolId] ?? []).filter((row) => row.id !== rowId),
        }));

        toast.success(
          response.message ||
            (draftRow.mode === "edit"
              ? "Preco de ticket atualizado com sucesso."
              : "Preco de ticket criado com sucesso.")
        );
        return true;
      } catch (requestError) {
        setDraftRowsBySchool((current) => ({
          ...current,
          [schoolId]: (current[schoolId] ?? []).map((row) =>
            row.id === rowId
              ? {
                  ...row,
                  isSaving: false,
                }
              : row
          ),
        }));

        toast.error(
          requestError instanceof Error
            ? requestError.message
            : draftRow.mode === "edit"
              ? "Nao foi possivel atualizar o preco de ticket."
              : "Nao foi possivel criar o preco de ticket."
        );
        return false;
      }
    },
    [draftRowsBySchool, savedRowsBySchool]
  );

  const sections = useMemo<RhSchoolSection[]>(() => {
    // Junta linhas salvas, linhas em edicao e novas linhas no formato final da tabela.
    return schools.map((school) => {
      const savedRows = savedRowsBySchool[school.id] ?? [];
      const draftRows = draftRowsBySchool[school.id] ?? [];
      const editDraftsBySourceId = new Map(
        draftRows
          .filter((row) => row.mode === "edit" && row.sourceId)
          .map((row) => [row.sourceId as string, row])
      );
      const createDrafts = draftRows.filter((row) => row.mode === "create");
      const orderedRows = savedRows.map((row) => editDraftsBySourceId.get(row.id) ?? row);

      return {
        schoolId: school.id,
        schoolLabel: school.label,
        schoolName: school.name,
        savedCount: savedRows.length,
        rows: [...orderedRows, ...createDrafts],
      };
    });
  }, [draftRowsBySchool, savedRowsBySchool, schools]);

  const totalSavedRows = useMemo(
    () => Object.values(savedRowsBySchool).reduce((sum, rows) => sum + rows.length, 0),
    [savedRowsBySchool]
  );

  return {
    sections,
    totalSavedRows,
    schoolCount: schools.length,
    isLoadingCatalogs,
    error,
    addRow,
    startEditingRow,
    updateRowOption,
    updateRowPrice,
    removeRow,
    saveRow,
    getAvailableOptions,
  };
}
