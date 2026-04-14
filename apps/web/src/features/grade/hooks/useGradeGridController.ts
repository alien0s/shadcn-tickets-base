import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { DragEndEvent, DragMoveEvent, DragStartEvent } from "@dnd-kit/core";
import { toast } from "sonner";
import {
  SLOT_HEIGHT,
  TIME_COL_WIDTH,
  useGradeGrid,
  type EventBlockItem,
} from "./useGradeGrid";
import type { CopiedLesson, GradeGridProps } from "../types";
import { WEEK_DAYS } from "../types";

const SLOT_INTERACTION_GUARD_MS = 180;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function useGradeGridController({
  shift,
  events,
  copyScopeKey,
  isSchoolScheduleConfigured = true,
  turmaOptions = [],
  subjectOptions = [],
  selectedTeacherSubjectOptions = [],
  timesByShift,
  breakMarkersByShift,
  onPersistMove,
  onCreateSchedule,
  onDeleteSchedule,
  onValidateTurmaSelection,
}: GradeGridProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [dragPreview, setDragPreview] = useState<{ dayIndex: number; startSlot: number } | null>(
    null
  );
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [pendingDeleteScheduleId, setPendingDeleteScheduleId] = useState<string | null>(null);
  const [isDeletingSchedule, setIsDeletingSchedule] = useState(false);
  const [openEventContextMenuId, setOpenEventContextMenuId] = useState<string | null>(null);
  const [openSlotContextMenuKey, setOpenSlotContextMenuKey] = useState<string | null>(null);
  const [copiedLesson, setCopiedLesson] = useState<CopiedLesson | null>(null);
  const [isPendingTurmaValidation, setIsPendingTurmaValidation] = useState(false);
  const [pendingPasteSlot, setPendingPasteSlot] = useState<{
    dayIndex: number;
    startSlot: number;
  } | null>(null);
  const suppressSlotInteractionsUntilRef = useRef(0);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const observer = new ResizeObserver(() => {
      setContainerWidth(element.clientWidth);
    });

    observer.observe(element);
    setContainerWidth(element.clientWidth);
    return () => observer.disconnect();
  }, []);

  const previousCopyScopeKeyRef = useRef<string | undefined>(copyScopeKey);

  useEffect(() => {
    if (previousCopyScopeKeyRef.current === copyScopeKey) {
      return;
    }

    // O copiar/colar vale só dentro do escopo atual da grade.
    previousCopyScopeKeyRef.current = copyScopeKey;
    setCopiedLesson(null);
    setOpenSlotContextMenuKey(null);
    setOpenEventContextMenuId(null);
    setPendingPasteSlot(null);
  }, [copyScopeKey]);

  const dayWidth = useMemo(() => {
    const minDayWidth = 136;
    const fitDayWidth = (containerWidth - TIME_COL_WIDTH) / WEEK_DAYS.length;
    return Math.max(minDayWidth, fitDayWidth);
  }, [containerWidth]);

  const gridWidth = useMemo(() => TIME_COL_WIDTH + dayWidth * WEEK_DAYS.length, [dayWidth]);

  const autoAssignedSubject = useMemo(
    () => (selectedTeacherSubjectOptions.length === 1 ? selectedTeacherSubjectOptions[0] : null),
    [selectedTeacherSubjectOptions]
  );

  const resolvedSubjectOptions = useMemo(
    () => (autoAssignedSubject ? selectedTeacherSubjectOptions : subjectOptions),
    [autoAssignedSubject, selectedTeacherSubjectOptions, subjectOptions]
  );

  const {
    times,
    items,
    activeDragItem,
    sensors,
    editingEventId,
    pendingEditor,
    pendingSavedPreview,
    isPendingEditorSaving,
    turmaSelectOptions,
    subjectSelectOptions,
    openEditor,
    openEmptyEditor,
    closeEditor,
    updateEventFields,
    updatePendingFields,
    handleDragStart,
    handleDragCancel,
    handleDragEnd,
  } = useGradeGrid({
    shift,
    events,
    turmaOptions,
    subjectOptions: resolvedSubjectOptions,
    timesByShift,
    onPersistMove,
    onCreateSchedule,
  });

  const breakLabelByAnchorTime = useMemo(() => {
    const markers = breakMarkersByShift?.[shift] ?? [];
    const map = new Map<string, string>();

    for (const marker of markers) {
      if (!marker.anchorTime || !marker.labelTime) continue;
      map.set(marker.anchorTime, marker.labelTime);
    }

    return map;
  }, [breakMarkersByShift, shift]);

  useEffect(() => {
    if (pendingEditor) return;
    setIsPendingTurmaValidation(false);
  }, [pendingEditor]);

  useEffect(() => {
    const handlePointerDownOutside = (event: PointerEvent) => {
      const container = containerRef.current;
      if (!container) return;

      const target = event.target as Node | null;
      if (!target) return;

      const targetElement = target as Element;
      const clickedInsideRadixMenu =
        targetElement.closest(".grade-card-menu") ||
        targetElement.closest("[data-radix-popper-content-wrapper]") ||
        targetElement.closest("[role='menu']");

      if (clickedInsideRadixMenu) {
        return;
      }

      if (!container.contains(target)) {
        setOpenEventContextMenuId(null);
        setOpenSlotContextMenuKey(null);
        closeEditor();
      }
    };

    window.addEventListener("pointerdown", handlePointerDownOutside);
    return () => {
      window.removeEventListener("pointerdown", handlePointerDownOutside);
    };
  }, [closeEditor]);

  const handleDragEndWithMetrics = useCallback(
    (event: DragEndEvent) => {
      void handleDragEnd(event, dayWidth);
      setDragPreview(null);
    },
    [dayWidth, handleDragEnd]
  );

  const handleDragStartWithPreview = useCallback(
    (event: DragStartEvent) => {
      handleDragStart(event);
      const sourceId = String(event.active.id);
      const sourceItem = items.find((item) => item.id === sourceId);
      if (!sourceItem) return;

      setDragPreview({
        dayIndex: sourceItem.dayIndex,
        startSlot: sourceItem.startSlot,
      });
    },
    [handleDragStart, items]
  );

  const handleDragMoveWithPreview = useCallback(
    (event: DragMoveEvent) => {
      const sourceId = String(event.active.id);
      const sourceItem = items.find((item) => item.id === sourceId);
      if (!sourceItem) return;

      const deltaSlots = Math.round(event.delta.y / SLOT_HEIGHT);
      const deltaDays = Math.round(event.delta.x / dayWidth);
      const nextSlot = clamp(sourceItem.startSlot + deltaSlots, 0, Math.max(0, times.length - 1));
      const nextDay = clamp(sourceItem.dayIndex + deltaDays, 0, WEEK_DAYS.length - 1);

      setDragPreview((current) => {
        if (current && current.dayIndex === nextDay && current.startSlot === nextSlot) {
          return current;
        }

        return { dayIndex: nextDay, startSlot: nextSlot };
      });
    },
    [dayWidth, items, times.length]
  );

  const handleDragCancelWithPreview = useCallback(() => {
    handleDragCancel();
    setDragPreview(null);
  }, [handleDragCancel]);

  const occupiedCells = useMemo(() => {
    const map = new Map<string, string[]>();

    items.forEach((item) => {
      const key = `${item.dayIndex}-${item.startSlot}`;
      const current = map.get(key) ?? [];
      current.push(item.id);
      map.set(key, current);
    });

    return map;
  }, [items]);

  const isDropBlocked = useMemo(() => {
    if (!dragPreview || !activeDragItem) return false;

    const key = `${dragPreview.dayIndex}-${dragPreview.startSlot}`;
    const idsAtTarget = occupiedCells.get(key) ?? [];
    return idsAtTarget.some((id) => id !== activeDragItem.id);
  }, [activeDragItem, dragPreview, occupiedCells]);

  useEffect(() => {
    if (!activeDragItem) return;

    const previousCursor = document.body.style.cursor;
    document.body.style.cursor = isDropBlocked ? "not-allowed" : "grabbing";

    return () => {
      document.body.style.cursor = previousCursor;
    };
  }, [activeDragItem, isDropBlocked]);

  useEffect(() => {
    if (!pendingPasteSlot) return;

    const previousCursor = document.body.style.cursor;
    document.body.style.cursor = "not-allowed";

    return () => {
      document.body.style.cursor = previousCursor;
    };
  }, [pendingPasteSlot]);

  useEffect(() => {
    if (!isDeletingSchedule) return;

    const previousCursor = document.body.style.cursor;
    document.body.style.cursor = "not-allowed";

    return () => {
      document.body.style.cursor = previousCursor;
    };
  }, [isDeletingSchedule]);

  const handlePendingTurma = useCallback(
    (value: string) => {
      const run = async () => {
        if (pendingEditor && onValidateTurmaSelection) {
          setIsPendingTurmaValidation(true);

          try {
            const result = await onValidateTurmaSelection({
              dayIndex: pendingEditor.dayIndex,
              startSlot: pendingEditor.startSlot,
              shift,
              turma: value,
            });

            if (result.hasConflict) {
              if (result.teacherName) {
                toast.warning(`Turma já tem aula nesse horário com ${result.teacherName}.`);
              } else {
                toast.warning("Turma já tem aula nesse horário.");
              }
              return;
            }
          } finally {
            setIsPendingTurmaValidation(false);
          }
        }

        if (autoAssignedSubject) {
          updatePendingFields({ turma: value, subject: autoAssignedSubject });
          return;
        }

        updatePendingFields({ turma: value });
      };

      void run();
    },
    [autoAssignedSubject, onValidateTurmaSelection, pendingEditor, shift, updatePendingFields]
  );

  const handlePendingSubject = useCallback(
    (value: string) => {
      updatePendingFields({ subject: value });
    },
    [updatePendingFields]
  );

  const handleDeleteEvent = useCallback(
    async (eventId: string): Promise<boolean> => {
      if (!onDeleteSchedule) return false;

      const deleted = await onDeleteSchedule(eventId);
      if (deleted) {
        closeEditor();
      }

      return deleted;
    },
    [closeEditor, onDeleteSchedule]
  );

  const openDeleteDialog = useCallback((scheduleId: string) => {
    setPendingDeleteScheduleId(scheduleId);
    setIsDeleteDialogOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!pendingDeleteScheduleId) return;

    setIsDeletingSchedule(true);

    try {
      const deleted = await handleDeleteEvent(pendingDeleteScheduleId);
      if (deleted) {
        setIsDeleteDialogOpen(false);
        setPendingDeleteScheduleId(null);
      }
    } finally {
      setIsDeletingSchedule(false);
    }
  }, [handleDeleteEvent, pendingDeleteScheduleId]);

  const armSlotInteractionGuard = useCallback(() => {
    // Evita click-through do menu contextual logo após ações como copiar e excluir.
    suppressSlotInteractionsUntilRef.current = Date.now() + SLOT_INTERACTION_GUARD_MS;
  }, []);

  const shouldSuppressSlotInteraction = useCallback(() => {
    return Date.now() < suppressSlotInteractionsUntilRef.current;
  }, []);

  const handleEventContextMenuOpenChange = useCallback(
    (eventId: string, open: boolean) => {
      if (open) {
        if (shouldSuppressSlotInteraction()) return;
        setOpenSlotContextMenuKey(null);
        setOpenEventContextMenuId(eventId);
        return;
      }

      setOpenEventContextMenuId((current) => (current === eventId ? null : current));
    },
    [shouldSuppressSlotInteraction]
  );

  const handleSlotContextMenuOpenChange = useCallback(
    (slotKey: string, open: boolean) => {
      if (open) {
        if (shouldSuppressSlotInteraction()) return;
        setOpenEventContextMenuId(null);
        setOpenSlotContextMenuKey(slotKey);
        return;
      }

      setOpenSlotContextMenuKey((current) => (current === slotKey ? null : current));
    },
    [shouldSuppressSlotInteraction]
  );

  const handleCopyItem = useCallback(
    (item: CopiedLesson) => {
      armSlotInteractionGuard();
      closeEditor();
      setOpenEventContextMenuId(null);
      setOpenSlotContextMenuKey(null);
      setCopiedLesson(item);
      toast.success("Aula copiada.");
    },
    [armSlotInteractionGuard, closeEditor]
  );

  const handleRequestDelete = useCallback(
    (scheduleId: string) => {
      armSlotInteractionGuard();
      closeEditor();
      setOpenEventContextMenuId(null);
      setOpenSlotContextMenuKey(null);
      openDeleteDialog(scheduleId);
    },
    [armSlotInteractionGuard, closeEditor, openDeleteDialog]
  );

  const handlePasteToSlot = useCallback(
    async (dayIndex: number, startSlot: number) => {
      if (!copiedLesson) {
        toast.warning("Nenhuma aula copiada.");
        return;
      }

      setOpenEventContextMenuId(null);
      setOpenSlotContextMenuKey(null);
      closeEditor();

      const alreadyOccupied = items.some(
        (item) => item.dayIndex === dayIndex && item.startSlot === startSlot
      );

      if (alreadyOccupied) {
        toast.warning("Esse horário já tem uma aula.");
        return;
      }

      if (!onCreateSchedule) {
        toast.error("Criação de aula não configurada.");
        return;
      }

      setPendingPasteSlot({ dayIndex, startSlot });

      try {
        if (onValidateTurmaSelection) {
          const result = await onValidateTurmaSelection({
            dayIndex,
            startSlot,
            shift,
            turma: copiedLesson.turma,
          });

          if (result.hasConflict) {
            if (result.teacherName) {
              toast.warning(`Turma já tem aula nesse horário com ${result.teacherName}.`);
            } else {
              toast.warning("Turma já tem aula nesse horário.");
            }
            return;
          }
        }

        await onCreateSchedule({
          dayIndex,
          startSlot,
          shift,
          turma: copiedLesson.turma,
          subject: copiedLesson.subject,
          classId: copiedLesson.classId,
          teacherId: copiedLesson.teacherId,
          subjectId: copiedLesson.subjectId,
        });
      } finally {
        setPendingPasteSlot((current) => {
          if (!current) return null;
          return current.dayIndex === dayIndex && current.startSlot === startSlot ? null : current;
        });
      }
    },
    [closeEditor, copiedLesson, items, onCreateSchedule, onValidateTurmaSelection, shift]
  );

  const activePendingBlock = pendingSavedPreview ?? pendingEditor;
  const isActivePendingBlockSaving = isPendingEditorSaving || Boolean(pendingSavedPreview);
  const isGridDimmed = !isSchoolScheduleConfigured;

  return {
    containerRef,
    dayWidth,
    gridWidth,
    times,
    items,
    activeDragItem,
    sensors,
    editingEventId,
    activePendingBlock,
    isActivePendingBlockSaving,
    isPendingEditorSaving,
    isPendingTurmaValidation,
    turmaSelectOptions,
    subjectSelectOptions,
    autoAssignedSubject,
    breakLabelByAnchorTime,
    occupiedCells,
    dragPreview,
    isDropBlocked,
    copiedLesson,
    pendingPasteSlot,
    openEventContextMenuId,
    openSlotContextMenuKey,
    isGridDimmed,
    isDeleteDialogOpen,
    isDeletingSchedule,
    shouldSuppressSlotInteraction,
    openEditor,
    openEmptyEditor,
    closeEditor,
    updateEventFields,
    handleDragStartWithPreview,
    handleDragMoveWithPreview,
    handleDragCancelWithPreview,
    handleDragEndWithMetrics,
    handlePendingTurma,
    handlePendingSubject,
    handleEventContextMenuOpenChange,
    handleSlotContextMenuOpenChange,
    handleCopyItem,
    handleRequestDelete,
    handlePasteToSlot,
    handleConfirmDelete,
    setOpenEventContextMenuId,
    setOpenSlotContextMenuKey,
    setIsDeleteDialogOpen,
    setPendingDeleteScheduleId,
  };
}
