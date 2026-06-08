import { useEffect, useMemo, useState } from "react";
import { CircleDollarSign } from "lucide-react";
import type { SubjectWorkload } from "@ticket-system/types";
import { Button } from "@/components/ui/button";
import { useGradeDirectory } from "@/features/grade/hooks/useGradeDirectory";
import type { ToolbarOption } from "@/features/grade/types";
import { api } from "@/lib";
import { RhHeader } from "./components/RhHeader";
import { RhHoursCard, RhTicketValueCard } from "./components/RhSummaryCards";
import { RhTeacherTicketsTable } from "./components/RhTeacherTicketsTable";
import { RhTicketPricesDialog } from "./components/RhTicketPricesDialog";
import { RhToolbar } from "./components/RhToolbar";
import { useRhTeacherTickets } from "./hooks/useRhTeacherTickets";
import { useRhTicketPrices } from "./hooks/useRhTicketPrices";

export function Rh() {
  // Reaproveita o diretório de escolas já usado na grade.
  const { schools, teachers, isLoadingSchools, isLoadingTeachers } = useGradeDirectory(null);
  const schoolDirectory = useMemo(
    () =>
      schools
        .map((school) => ({
          id: school.id,
          label: school.abbreviation?.trim() ? school.abbreviation.trim().toUpperCase() : school.name,
          name: school.name,
        }))
        .sort((a, b) => a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" })),
    [schools]
  );
  const teacherDirectory = useMemo(
    () =>
      teachers.map((teacher) => ({
        id: teacher.id,
        schoolId: teacher.school_id,
        name: teacher.name,
        avatarUrl: teacher.avatar_url ?? null,
      })),
    [teachers]
  );
  const {
    sections,
    isLoadingCatalogs,
    error,
    addRow,
    startEditingRow,
    updateRowOption,
    updateRowPrice,
    removeRow,
    saveRow,
    getAvailableOptions,
  } = useRhTicketPrices(schoolDirectory);
  const [selectedSchoolId, setSelectedSchoolId] = useState("");
  const [isTicketPricesDialogOpen, setIsTicketPricesDialogOpen] = useState(false);
  const [matrixRows, setMatrixRows] = useState<SubjectWorkload[]>([]);
  const [isLoadingMatrixSummary, setIsLoadingMatrixSummary] = useState(false);

  // Converte o diretório para o formato esperado pelo seletor do toolbar.
  const schoolOptions = useMemo<readonly ToolbarOption[]>(
    () =>
      schoolDirectory.map((school) => ({
        value: school.id,
        label: school.label,
      })),
    [schoolDirectory]
  );

  useEffect(() => {
    if (schoolOptions.length === 0) {
      setSelectedSchoolId("");
      return;
    }

    const isCurrentValid = schoolOptions.some((option) => option.value === selectedSchoolId);
    if (!isCurrentValid) {
      setSelectedSchoolId(schoolOptions[0].value);
    }
  }, [schoolOptions, selectedSchoolId]);

  useEffect(() => {
    let isCancelled = false;

    // Busca a matriz da escola para calcular o total de horas.
    const loadMatrixSummary = async () => {
      if (!selectedSchoolId) {
        setMatrixRows([]);
        setIsLoadingMatrixSummary(false);
        return;
      }

      setIsLoadingMatrixSummary(true);

      try {
        const data = await api.get<SubjectWorkload[]>(`/matrix?school_id=${encodeURIComponent(selectedSchoolId)}`);

        if (!isCancelled) {
          setMatrixRows(data ?? []);
        }
      } catch {
        if (!isCancelled) {
          setMatrixRows([]);
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingMatrixSummary(false);
        }
      }
    };

    void loadMatrixSummary();

    return () => {
      isCancelled = true;
    };
  }, [selectedSchoolId]);

  const visibleSections = useMemo(() => {
    if (!selectedSchoolId) {
      return sections;
    }

    return sections.filter((section) => section.schoolId === selectedSchoolId);
  }, [sections, selectedSchoolId]);
  const {
    rows: teacherTicketRows,
    isLoading: isLoadingTeacherTickets,
    error: teacherTicketsError,
  } = useRhTeacherTickets({
    enabled: Boolean(selectedSchoolId),
    sections: visibleSections,
    teachers: teacherDirectory,
  });

  const selectedSchoolLabel = useMemo(
    () => schoolOptions.find((option) => option.value === selectedSchoolId)?.label ?? "Escola",
    [schoolOptions, selectedSchoolId]
  );

  const selectedSchoolName = useMemo(
    () => schoolDirectory.find((school) => school.id === selectedSchoolId)?.name ?? "Escola selecionada",
    [schoolDirectory, selectedSchoolId]
  );

  const totalTicketValue = useMemo(
    () =>
      visibleSections.reduce(
        (sum, section) =>
          sum +
          section.rows.reduce((rowSum, row) => {
            if (row.isDraft) {
              return rowSum;
            }

            return rowSum + row.pricePerLesson;
          }, 0),
        0
      ),
    [visibleSections]
  );

  const totalTicketItems = useMemo(
    () => visibleSections.reduce((sum, section) => sum + section.savedCount, 0),
    [visibleSections]
  );

  const totalAnnualHours = useMemo(
    () =>
      matrixRows.reduce((sum, row) => {
        const annualHours = row.annual_hours ?? row.weekly_classes * 40;
        return sum + annualHours;
      }, 0),
    [matrixRows]
  );

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex min-h-full max-w-7xl flex-col px-3 pb-5 pt-3 sm:px-5 lg:px-8">
          <div className="flex flex-col space-y-4">
            <div className="flex items-center justify-between gap-2">
              <RhHeader />
              <RhToolbar
                schoolId={selectedSchoolId}
                schoolOptions={schoolOptions}
                isLoading={isLoadingCatalogs || isLoadingSchools}
                onSchoolChange={setSelectedSchoolId}
              />
            </div>

            {/* Bloco principal com identificação da escola e cards-resumo. */}
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-start">
              <div className="w-full max-w-[460px] shrink-0 xl:max-w-[500px]">
                <p className="text-xl font-semibold leading-tight text-foreground">{selectedSchoolName}</p>
                <p className="mt-1 text-sm text-muted-foreground">{selectedSchoolLabel}</p>
                {/* Abre o modal para criar ou editar os preços da escola atual. */}
                <Button
                  type="button"
                  variant="outline"
                  className="mt-3 h-10 gap-2.5 px-4"
                  onClick={() => setIsTicketPricesDialogOpen(true)}
                  disabled={!selectedSchoolId || isLoadingCatalogs || isLoadingSchools}
                >
                  <CircleDollarSign className="h-4 w-4" />
                  {totalTicketItems === 0 ? "Criar ticket de aula" : "Editar ticket de aula"}
                </Button>
              </div>

              {/* Cards rápidos para total financeiro e total de horas da escola. */}
              <div className="flex w-full flex-col items-start gap-4 sm:flex-row sm:flex-wrap xl:w-auto xl:flex-nowrap">
                <RhTicketValueCard
                  totalTicketValue={totalTicketValue}
                  totalTicketItems={totalTicketItems}
                  isLoading={isLoadingCatalogs || isLoadingSchools || isLoadingMatrixSummary}
                />

                <RhHoursCard
                  totalAnnualHours={totalAnnualHours}
                  totalWorkloads={matrixRows.length}
                  isLoading={isLoadingCatalogs || isLoadingSchools || isLoadingMatrixSummary}
                />
              </div>
            </div>

            <RhTeacherTicketsTable
              rows={teacherTicketRows}
              isLoading={isLoadingTeacherTickets || isLoadingTeachers}
              error={teacherTicketsError}
            />
          </div>
        </div>
      </div>

      {/* Modal com a tabela completa de preços por escola. */}
      <RhTicketPricesDialog
        open={isTicketPricesDialogOpen}
        onOpenChange={setIsTicketPricesDialogOpen}
        isLoadingCatalogs={isLoadingCatalogs}
        error={error}
        sections={visibleSections}
        getAvailableOptions={getAvailableOptions}
        onAddRow={addRow}
        onStartEditingRow={startEditingRow}
        onUpdateRowOption={updateRowOption}
        onUpdateRowPrice={updateRowPrice}
        onRemoveRow={removeRow}
        onSaveRow={saveRow}
      />
    </div>
  );
}
