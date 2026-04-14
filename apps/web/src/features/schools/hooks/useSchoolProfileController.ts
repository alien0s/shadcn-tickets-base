import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { usePageTitle } from "@/hooks/usePageTitle";
import { api } from "@/lib/api";
import type {
  BreakForm,
  ClassApi,
  CreateTimeSlotsGradePayload,
  ImportableGradeSummary,
  SchoolApi,
  TeacherApi,
  TimeSlotApi,
  ValidBreak,
} from "../types";
import {
  DEFAULT_BREAK_FORM,
  WEEKDAY_LABELS,
  buildAbbreviation,
  buildPreviewRows,
  buildScheduleRows,
  buildShiftSummaries,
  buildShiftTimesWithBreaks,
  deriveLessonMinutes,
  normalizeTime,
  parseTimeToMinutes,
  timeToMinutes,
} from "../utils/school-profile.utils";

type GuardRef = { current: boolean };

function createBreakForm(id: string = DEFAULT_BREAK_FORM.id): BreakForm {
  return { id, start: "", end: "" };
}

export function useSchoolProfileController(schoolId: string | null) {
  const [allSchools, setAllSchools] = useState<SchoolApi[]>([]);
  const [school, setSchool] = useState<SchoolApi | null>(null);
  const [classCount, setClassCount] = useState(0);
  const [teacherCount, setTeacherCount] = useState(0);
  const [timeSlots, setTimeSlots] = useState<TimeSlotApi[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreatingGrade, setIsCreatingGrade] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isImportListLoading, setIsImportListLoading] = useState(false);
  const [isImportingGrade, setIsImportingGrade] = useState(false);
  const [isImportOverwriteDialogOpen, setIsImportOverwriteDialogOpen] = useState(false);
  const [isDeleteGradeDialogOpen, setIsDeleteGradeDialogOpen] = useState(false);
  const [isDeletingGrade, setIsDeletingGrade] = useState(false);

  const [importableGrades, setImportableGrades] = useState<ImportableGradeSummary[]>([]);
  const [selectedImportSchoolId, setSelectedImportSchoolId] = useState<string | null>(null);

  const [createStep, setCreateStep] = useState(1);
  const [lessonMinutes, setLessonMinutes] = useState("50");
  const [morningStart, setMorningStart] = useState("07:00");
  const [morningEnd, setMorningEnd] = useState("12:00");
  const [afternoonStart, setAfternoonStart] = useState("13:00");
  const [afternoonEnd, setAfternoonEnd] = useState("18:00");
  const [breakForms, setBreakForms] = useState<BreakForm[]>([createBreakForm()]);

  // Carrega todos os dados usados pelo perfil em uma unica rodada para reduzir
  // piscadas e manter escola, contadores e time slots sincronizados.
  const loadProfileData = useCallback(
    async (guard?: GuardRef) => {
      if (!schoolId) {
        if (!guard || guard.current) {
          setError("Escola invalida.");
          setIsLoading(false);
        }
        return;
      }

      if (!guard || guard.current) {
        setIsLoading(true);
        setError(null);
      }

      try {
        const [schoolsData, classesData, teachersData, slotsData] = await Promise.all([
          api.get<SchoolApi[]>("/schools"),
          api.get<ClassApi[]>("/classes"),
          api.get<TeacherApi[]>("/teachers"),
          api.get<TimeSlotApi[]>(`/time-slots?school_id=${encodeURIComponent(schoolId)}`),
        ]);

        if (guard && !guard.current) return;

        const activeSchool = (schoolsData ?? []).find((item) => item.id === schoolId) ?? null;

        setAllSchools(schoolsData ?? []);
        setSchool(activeSchool);
        setClassCount((classesData ?? []).filter((item) => item.school_id === schoolId).length);
        setTeacherCount((teachersData ?? []).filter((item) => item.school_id === schoolId).length);
        setTimeSlots(slotsData ?? []);

        if (!activeSchool) {
          setError("Escola nao encontrada.");
        }
      } catch (requestError) {
        if (guard && !guard.current) return;

        setError(
          requestError instanceof Error
            ? requestError.message
            : "Erro ao carregar o perfil da escola."
        );
        setSchool(null);
        setClassCount(0);
        setTeacherCount(0);
        setTimeSlots([]);
      } finally {
        if (!guard || guard.current) {
          setIsLoading(false);
        }
      }
    },
    [schoolId]
  );

  useEffect(() => {
    const guard = { current: true };

    void loadProfileData(guard);
    return () => {
      guard.current = false;
    };
  }, [loadProfileData]);

  useEffect(() => {
    if (!isImportModalOpen || allSchools.length === 0) {
      return;
    }

    const otherSchools = allSchools.filter((item) => item.id !== schoolId);
    if (otherSchools.length === 0) {
      setImportableGrades([]);
      return;
    }

    let isActive = true;
    setIsImportListLoading(true);

    const loadImportableGrades = async () => {
      try {
        const grades = await Promise.all(
          otherSchools.map(async (item) => {
            const slots = await api.get<TimeSlotApi[]>(
              `/time-slots?school_id=${encodeURIComponent(item.id)}`
            );

            if (!slots || slots.length === 0) {
              return null;
            }

            return {
              schoolId: item.id,
              schoolName: item.name,
              schoolAbbreviation: item.abbreviation?.trim() || buildAbbreviation(item.name),
              lessonMinutes: deriveLessonMinutes(slots),
              shifts: buildShiftSummaries(slots),
            } satisfies ImportableGradeSummary;
          })
        );

        if (!isActive) return;

        const nextGrades = grades
          .filter((item): item is ImportableGradeSummary => Boolean(item))
          .filter((item) => item.shifts.length > 0)
          .sort((left, right) =>
            left.schoolAbbreviation.localeCompare(right.schoolAbbreviation, "pt-BR")
          );

        setImportableGrades(nextGrades);
        setSelectedImportSchoolId((current) =>
          current && nextGrades.some((item) => item.schoolId === current) ? current : null
        );
      } catch (requestError) {
        if (!isActive) return;

        const message =
          requestError instanceof Error
            ? requestError.message
            : "Nao foi possivel carregar as grades para importacao.";

        setImportableGrades([]);
        toast.error(message);
      } finally {
        if (isActive) {
          setIsImportListLoading(false);
        }
      }
    };

    void loadImportableGrades();
    return () => {
      isActive = false;
    };
  }, [allSchools, isImportModalOpen, schoolId]);

  const scheduleTimes = useMemo(
    () =>
      Array.from(new Set(timeSlots.map((slot) => normalizeTime(slot.start_time))))
        .filter((value) => value.length === 5)
        .sort((left, right) => timeToMinutes(left) - timeToMinutes(right)),
    [timeSlots]
  );

  const scheduleRows = useMemo(() => buildScheduleRows(timeSlots), [timeSlots]);
  const hasSchedule = timeSlots.length > 0;
  const schoolAbbreviation =
    school?.abbreviation?.trim() || (school ? buildAbbreviation(school.name) : "ESC");
  const breadcrumbSchoolLabel =
    school?.abbreviation?.trim() || (school ? buildAbbreviation(school.name) : "...");

  usePageTitle(school ? `Perfil ${schoolAbbreviation}` : "Perfil da escola");

  const lessonMinutesNumber = Number(lessonMinutes);
  const canAdvanceStep1 = Number.isInteger(lessonMinutesNumber) && lessonMinutesNumber > 0;

  const morningStartMinutes = parseTimeToMinutes(morningStart);
  const morningEndMinutes = parseTimeToMinutes(morningEnd);
  const afternoonStartMinutes = parseTimeToMinutes(afternoonStart);
  const afternoonEndMinutes = parseTimeToMinutes(afternoonEnd);

  const canAdvanceMorning =
    morningStartMinutes !== null &&
    morningEndMinutes !== null &&
    morningStartMinutes < morningEndMinutes;
  const canAdvanceAfternoon =
    afternoonStartMinutes !== null &&
    afternoonEndMinutes !== null &&
    afternoonStartMinutes < afternoonEndMinutes;

  const parsedBreakForms = useMemo(
    () =>
      breakForms.map((form) => {
        const startMinutes = parseTimeToMinutes(form.start);
        const endMinutes = parseTimeToMinutes(form.end);
        const hasAny = form.start.length > 0 || form.end.length > 0;
        const isComplete = form.start.length > 0 && form.end.length > 0;
        const hasValidRange =
          isComplete &&
          startMinutes !== null &&
          endMinutes !== null &&
          startMinutes < endMinutes;

        const inMorning =
          hasValidRange &&
          morningStartMinutes !== null &&
          morningEndMinutes !== null &&
          startMinutes >= morningStartMinutes &&
          endMinutes <= morningEndMinutes;

        const inAfternoon =
          hasValidRange &&
          afternoonStartMinutes !== null &&
          afternoonEndMinutes !== null &&
          startMinutes >= afternoonStartMinutes &&
          endMinutes <= afternoonEndMinutes;

        return {
          ...form,
          startMinutes,
          endMinutes,
          hasAny,
          isComplete,
          hasValidRange,
          inMorning,
          inAfternoon,
        };
      }),
    [
      afternoonEndMinutes,
      afternoonStartMinutes,
      breakForms,
      morningEndMinutes,
      morningStartMinutes,
    ]
  );

  const hasPartialBreak = parsedBreakForms.some((item) => item.hasAny && !item.isComplete);
  const hasInvalidBreakRange = parsedBreakForms.some((item) => item.isComplete && !item.hasValidRange);
  const hasBreakOutsideShift = parsedBreakForms.some(
    (item) => item.hasValidRange && !item.inMorning && !item.inAfternoon
  );

  const validBreaks = useMemo<ValidBreak[]>(
    () =>
      parsedBreakForms
        .filter((item) => item.hasValidRange && (item.inMorning || item.inAfternoon))
        .map((item) => ({
          id: item.id,
          start: item.start,
          end: item.end,
          startMinutes: item.startMinutes as number,
          endMinutes: item.endMinutes as number,
          shift: item.inMorning ? ("morning" as const) : ("afternoon" as const),
        }))
        .sort((left, right) => left.startMinutes - right.startMinutes),
    [parsedBreakForms]
  );

  const breakValidationMessage = useMemo(() => {
    if (hasPartialBreak) {
      return "Preencha inicio e termino de cada intervalo, ou deixe os dois vazios.";
    }
    if (hasInvalidBreakRange) {
      return "Cada intervalo precisa ter inicio menor que termino.";
    }
    if (hasBreakOutsideShift) {
      return "Os intervalos precisam ficar totalmente dentro de um turno.";
    }
    return null;
  }, [hasBreakOutsideShift, hasInvalidBreakRange, hasPartialBreak]);

  const canAdvanceStep2 = canAdvanceMorning && canAdvanceAfternoon && !breakValidationMessage;

  const morningBreaks = useMemo(
    () => validBreaks.filter((item) => item.shift === "morning"),
    [validBreaks]
  );
  const afternoonBreaks = useMemo(
    () => validBreaks.filter((item) => item.shift === "afternoon"),
    [validBreaks]
  );

  const morningPreviewTimes = useMemo(() => {
    if (!canAdvanceStep1) return [];
    return buildShiftTimesWithBreaks(morningStart, morningEnd, lessonMinutesNumber, morningBreaks);
  }, [canAdvanceStep1, lessonMinutesNumber, morningBreaks, morningEnd, morningStart]);

  const afternoonPreviewTimes = useMemo(() => {
    if (!canAdvanceStep1) return [];
    return buildShiftTimesWithBreaks(
      afternoonStart,
      afternoonEnd,
      lessonMinutesNumber,
      afternoonBreaks
    );
  }, [afternoonBreaks, afternoonEnd, afternoonStart, canAdvanceStep1, lessonMinutesNumber]);

  const previewTimes = useMemo(
    () =>
      Array.from(new Set([...morningPreviewTimes, ...afternoonPreviewTimes])).sort(
        (left, right) => timeToMinutes(left) - timeToMinutes(right)
      ),
    [afternoonPreviewTimes, morningPreviewTimes]
  );

  const previewRows = useMemo(
    () =>
      buildPreviewRows({
        morningPreviewTimes,
        afternoonPreviewTimes,
        morningBreaks,
        afternoonBreaks,
        morningEnd,
      }),
    [afternoonBreaks, afternoonPreviewTimes, morningBreaks, morningEnd, morningPreviewTimes]
  );

  const hasPreviewTimes = previewTimes.length > 0;
  const totalColumns = WEEKDAY_LABELS.length + 1;

  const breaksPayload = useMemo(
    () =>
      validBreaks.map((item) => ({
        start_time: item.start,
        end_time: item.end,
      })),
    [validBreaks]
  );

  const createGradePayload = useMemo<CreateTimeSlotsGradePayload | null>(() => {
    if (!schoolId || !canAdvanceStep1 || !canAdvanceStep2) {
      return null;
    }

    return {
      school_id: schoolId,
      lesson_minutes: lessonMinutesNumber,
      morning: {
        start_time: morningStart,
        end_time: morningEnd,
      },
      afternoon: {
        start_time: afternoonStart,
        end_time: afternoonEnd,
      },
      breaks: breaksPayload,
    };
  }, [
    afternoonEnd,
    afternoonStart,
    breaksPayload,
    canAdvanceStep1,
    canAdvanceStep2,
    lessonMinutesNumber,
    morningEnd,
    morningStart,
    schoolId,
  ]);

  const canAdvanceCurrentStep = createStep === 1 ? canAdvanceStep1 : canAdvanceStep2;

  const resetCreateWizard = useCallback(() => {
    setCreateStep(1);
    setLessonMinutes("50");
    setMorningStart("07:00");
    setMorningEnd("12:00");
    setAfternoonStart("13:00");
    setAfternoonEnd("18:00");
    setBreakForms([createBreakForm()]);
  }, []);

  const addBreakForm = useCallback(() => {
    setBreakForms((current) => [
      ...current,
      createBreakForm(`break-${Date.now()}-${current.length + 1}`),
    ]);
  }, []);

  const updateBreakForm = useCallback((id: string, field: "start" | "end", value: string) => {
    setBreakForms((current) =>
      current.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  }, []);

  const removeBreakForm = useCallback((id: string) => {
    setBreakForms((current) => current.filter((item) => item.id !== id));
  }, []);

  const handleCreateModalOpenChange = useCallback(
    (open: boolean) => {
      if (isCreatingGrade) return;

      setIsCreateModalOpen(open);
      if (!open) {
        resetCreateWizard();
      }
    },
    [isCreatingGrade, resetCreateWizard]
  );

  // Envia a configuracao validada do wizard e atualiza a grade local sem precisar
  // recarregar toda a pagina.
  const handleCreateGrade = useCallback(async () => {
    if (isCreatingGrade) return;

    if (!createGradePayload) {
      toast.error("Preencha os dados da grade antes de finalizar.");
      return;
    }

    if (!hasPreviewTimes) {
      toast.error("A configuracao atual nao gera horarios validos para a grade.");
      return;
    }

    setIsCreatingGrade(true);

    try {
      const { data, message } = await api.postWithMeta<TimeSlotApi[]>(
        "/time-slots/generate",
        createGradePayload
      );

      setTimeSlots(data ?? []);
      setIsCreateModalOpen(false);
      resetCreateWizard();
      toast.success(message || "Grade criada com sucesso.");
    } catch (requestError) {
      const message =
        requestError instanceof Error ? requestError.message : "Nao foi possivel criar a grade.";
      toast.error(message);
    } finally {
      setIsCreatingGrade(false);
    }
  }, [createGradePayload, hasPreviewTimes, isCreatingGrade, resetCreateWizard]);

  const handleImportModalOpenChange = useCallback(
    (open: boolean) => {
      if (isImportingGrade) return;

      setIsImportModalOpen(open);
      if (!open) {
        setSelectedImportSchoolId(null);
        setIsImportOverwriteDialogOpen(false);
      }
    },
    [isImportingGrade]
  );

  // Importa a estrutura de time slots de outra escola. Quando necessario, a
  // sobrescrita e confirmada em um dialogo separado antes da chamada da API.
  const executeImportGrade = useCallback(
    async (overwrite: boolean) => {
      if (!schoolId || !selectedImportSchoolId || isImportingGrade) return;

      setIsImportingGrade(true);

      try {
        const { data, message } = await api.postWithMeta<TimeSlotApi[]>("/time-slots/import", {
          source_school_id: selectedImportSchoolId,
          target_school_id: schoolId,
          overwrite,
        });

        setTimeSlots(data ?? []);
        setIsImportOverwriteDialogOpen(false);
        setIsImportModalOpen(false);
        setSelectedImportSchoolId(null);
        toast.success(message || "Grade importada com sucesso.");
      } catch (requestError) {
        const message =
          requestError instanceof Error
            ? requestError.message
            : "Nao foi possivel importar a grade.";
        toast.error(message);
      } finally {
        setIsImportingGrade(false);
      }
    },
    [isImportingGrade, schoolId, selectedImportSchoolId]
  );

  const handleImportGradeSelection = useCallback(() => {
    if (!selectedImportSchoolId) {
      toast.error("Selecione uma grade para importar.");
      return;
    }

    if (hasSchedule) {
      setIsImportOverwriteDialogOpen(true);
      return;
    }

    void executeImportGrade(false);
  }, [executeImportGrade, hasSchedule, selectedImportSchoolId]);

  const handleDeleteGrade = useCallback(async () => {
    if (!schoolId || isDeletingGrade) return;

    setIsDeletingGrade(true);

    try {
      await api.delete(`/time-slots/school/${encodeURIComponent(schoolId)}`);
      setTimeSlots([]);
      setIsDeleteGradeDialogOpen(false);
      toast.success("Grade excluida com sucesso.");
    } catch (requestError) {
      const message =
        requestError instanceof Error ? requestError.message : "Nao foi possivel excluir a grade.";
      toast.error(message);
    } finally {
      setIsDeletingGrade(false);
    }
  }, [isDeletingGrade, schoolId]);

  return {
    school,
    classCount,
    teacherCount,
    scheduleTimes,
    scheduleRows,
    isLoading,
    error,
    schoolAbbreviation,
    breadcrumbSchoolLabel,
    hasSchedule,
    timeSlots,

    isCreateModalOpen,
    isCreatingGrade,
    createStep,
    setCreateStep,
    lessonMinutes,
    setLessonMinutes,
    morningStart,
    setMorningStart,
    morningEnd,
    setMorningEnd,
    afternoonStart,
    setAfternoonStart,
    afternoonEnd,
    setAfternoonEnd,
    breakForms,
    addBreakForm,
    updateBreakForm,
    removeBreakForm,
    breakValidationMessage,
    canAdvanceCurrentStep,
    createGradePayload,
    previewRows,
    totalColumns,
    hasPreviewTimes,
    handleCreateModalOpenChange,
    handleCreateGrade,

    isImportModalOpen,
    isImportListLoading,
    importableGrades,
    selectedImportSchoolId,
    setSelectedImportSchoolId,
    isImportingGrade,
    isImportOverwriteDialogOpen,
    setIsImportOverwriteDialogOpen,
    handleImportModalOpenChange,
    handleImportGradeSelection,
    executeImportGrade,

    isDeleteGradeDialogOpen,
    setIsDeleteGradeDialogOpen,
    isDeletingGrade,
    handleDeleteGrade,
  };
}
