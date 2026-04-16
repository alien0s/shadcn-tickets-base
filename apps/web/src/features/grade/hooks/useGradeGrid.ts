import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { toast } from "sonner";
import { type ShiftEvent, type ShiftKey, type WeekDay } from "../types";

export const SLOT_HEIGHT = 96;
export const TIME_COL_WIDTH = 64;
export const CELL_GAP = 8;
export const HEADER_HEIGHT = 40;

export type EventBlockItem = {
  id: string;
  turma: string;
  subject: string;
  classId?: string;
  teacherId?: string;
  subjectId?: string;
  startSlot: number;
  endSlot: number;
  dayIndex: number;
  daySpan: number;
  draggable: boolean;
};

type UseGradeGridParams = {
  shift: ShiftKey;
  events: ShiftEvent[];
  turmaOptions: readonly string[];
  subjectOptions: readonly string[];
  timesByShift?: Record<ShiftKey, readonly string[]>;
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
  }) => Promise<boolean>;
  onUpdateSchedule?: (input: {
    scheduleId: string;
    turma: string;
    subject: string;
    classId?: string;
    teacherId?: string;
    subjectId?: string;
  }) => Promise<boolean>;
};

const DEFAULT_SHIFT_TIMES: Record<ShiftKey, readonly string[]> = {
  M: ["07:00", "08:00", "09:00", "10:00", "11:00", "12:00"],
  V: ["13:00", "14:00", "15:00", "16:00", "17:00"],
};

const DAY_TO_INDEX: Record<WeekDay, number> = {
  seg: 0,
  ter: 1,
  qua: 2,
  qui: 3,
  sex: 4,
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function sanitizeSelectOptions(options: readonly string[]): string[] {
  const cleaned = options
    .map((option) => option.trim())
    .filter((option) => option.length > 0)
    .filter((option) => option.toLowerCase() !== "selecionar");

  return Array.from(new Set(cleaned));
}

function buildInitialEvents(
  shift: ShiftKey,
  events: ShiftEvent[],
  timesByShift: Record<ShiftKey, readonly string[]>
): EventBlockItem[] {
  const times = shift === "M" ? timesByShift.M : timesByShift.V;
  const timeIndex = new Map(times.map((time, index) => [time, index]));

  return events
    .filter((event) => event.shift === shift)
    .map((event) => ({
      id: event.id,
      turma: event.className,
      subject: event.subject,
      classId: event.classId,
      teacherId: event.teacherId,
      subjectId: event.subjectId,
      startSlot: timeIndex.get(event.time) ?? 0,
      endSlot: (timeIndex.get(event.time) ?? 0) + 1,
      dayIndex: DAY_TO_INDEX[event.day],
      daySpan: 1,
      draggable: true,
    }));
}

export function useGradeGrid({
  shift,
  events = [],
  turmaOptions = [],
  subjectOptions = [],
  timesByShift = DEFAULT_SHIFT_TIMES,
  onPersistMove,
  onCreateSchedule,
  onUpdateSchedule,
}: UseGradeGridParams) {
  const safeShift: ShiftKey = shift === "V" ? "V" : "M";
  const times = safeShift === "M" ? timesByShift.M : timesByShift.V;
  const initialItems = useMemo(
    () => buildInitialEvents(safeShift, events, timesByShift),
    [events, safeShift, timesByShift]
  );

  const [items, setItems] = useState<EventBlockItem[]>(() => initialItems);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [pendingEditor, setPendingEditor] = useState<{
    dayIndex: number;
    startSlot: number;
    turma: string;
    subject: string;
  } | null>(null);
  const [pendingSavedPreview, setPendingSavedPreview] = useState<{
    dayIndex: number;
    startSlot: number;
    turma: string;
    subject: string;
  } | null>(null);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [isPendingEditorSaving, setIsPendingEditorSaving] = useState(false);
  const pendingSaveRequestKeyRef = useRef<string | null>(null);
  const editingSaveRequestKeyRef = useRef<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const activeDragItem = useMemo(
    () => items.find((item) => item.id === activeDragId) ?? null,
    [activeDragId, items]
  );

  const turmaSelectOptions = useMemo(
    () => sanitizeSelectOptions(Array.isArray(turmaOptions) ? turmaOptions : []),
    [turmaOptions]
  );
  const subjectSelectOptions = useMemo(
    () => sanitizeSelectOptions(Array.isArray(subjectOptions) ? subjectOptions : []),
    [subjectOptions]
  );

  useEffect(() => {
    // Reidrata os blocos quando turno, eventos ou grade-base mudam.
    setItems(initialItems);
    setEditingEventId(null);
    setPendingEditor(null);
    setPendingSavedPreview(null);
    setIsPendingEditorSaving(false);
    pendingSaveRequestKeyRef.current = null;
    editingSaveRequestKeyRef.current = null;
  }, [initialItems]);

  const originalItemsById = useMemo(
    () => new Map(initialItems.map((item) => [item.id, item])),
    [initialItems]
  );

  const openEditor = useCallback((eventId: string) => {
    setPendingEditor(null);
    setPendingSavedPreview(null);
    setIsPendingEditorSaving(false);
    pendingSaveRequestKeyRef.current = null;
    setEditingEventId(eventId);
  }, []);

  const closeEditor = useCallback(() => {
    setEditingEventId(null);
    setPendingEditor(null);
    setPendingSavedPreview(null);
    setIsPendingEditorSaving(false);
    pendingSaveRequestKeyRef.current = null;
  }, []);

  const openEmptyEditor = useCallback((dayIndex: number, startSlot: number) => {
    setEditingEventId(null);
    setPendingSavedPreview(null);
    setIsPendingEditorSaving(false);
    pendingSaveRequestKeyRef.current = null;
    setPendingEditor({
      dayIndex,
      startSlot,
      turma: "",
      subject: "",
    });
  }, []);

  const updateEventFields = useCallback(
    (eventId: string, fields: Partial<Pick<EventBlockItem, "turma" | "subject">>) => {
      setItems((previous) =>
        previous.map((item) => (item.id === eventId ? { ...item, ...fields } : item))
      );
    },
    []
  );

  const updatePendingFields = useCallback(
    (fields: Partial<Pick<EventBlockItem, "turma" | "subject">>) => {
      setPendingEditor((previous) => {
        if (!previous) return previous;
        return { ...previous, ...fields };
      });
    },
    []
  );

  useEffect(() => {
    if (!pendingEditor?.turma || !pendingEditor.subject) {
      setIsPendingEditorSaving(false);
      pendingSaveRequestKeyRef.current = null;
      return;
    }

    const requestKey = [
      safeShift,
      pendingEditor.dayIndex,
      pendingEditor.startSlot,
      pendingEditor.turma,
      pendingEditor.subject,
    ].join(":");

    if (pendingSaveRequestKeyRef.current === requestKey) {
      return;
    }

    pendingSaveRequestKeyRef.current = requestKey;

    let isCancelled = false;
    const snapshot = pendingEditor;

    const saveSchedule = async () => {
      setIsPendingEditorSaving(true);

      const alreadyOccupied = items.some(
        (item) => item.dayIndex === snapshot.dayIndex && item.startSlot === snapshot.startSlot
      );

      if (alreadyOccupied) {
        setIsPendingEditorSaving(false);
        toast.warning("Esse horário já tem uma aula.");
        pendingSaveRequestKeyRef.current = null;
        return;
      }

      if (!onCreateSchedule) {
        setIsPendingEditorSaving(false);
        toast.error("Criação de aula não configurada.");
        pendingSaveRequestKeyRef.current = null;
        return;
      }

      const saved = await onCreateSchedule({
        dayIndex: snapshot.dayIndex,
        startSlot: snapshot.startSlot,
        shift: safeShift,
        turma: snapshot.turma,
        subject: snapshot.subject,
      });

      if (isCancelled) {
        return;
      }

      if (saved) {
        setIsPendingEditorSaving(false);
        setPendingSavedPreview(snapshot);
        setPendingEditor((current) => {
          if (
            current &&
            current.dayIndex === snapshot.dayIndex &&
            current.startSlot === snapshot.startSlot &&
            current.turma === snapshot.turma &&
            current.subject === snapshot.subject
          ) {
            return null;
          }
          return current;
        });
        pendingSaveRequestKeyRef.current = null;
        return;
      }

      setIsPendingEditorSaving(false);
      pendingSaveRequestKeyRef.current = null;
    };

    void saveSchedule();

    return () => {
      isCancelled = true;
    };
  }, [items, onCreateSchedule, pendingEditor, safeShift]);

  useEffect(() => {
    if (!editingEventId) {
      editingSaveRequestKeyRef.current = null;
      return;
    }

    const currentItem = items.find((item) => item.id === editingEventId);
    const originalItem = originalItemsById.get(editingEventId);

    if (!currentItem || !originalItem) {
      editingSaveRequestKeyRef.current = null;
      return;
    }

    if (!currentItem.turma || !currentItem.subject) {
      editingSaveRequestKeyRef.current = null;
      return;
    }

    const didChange =
      currentItem.turma !== originalItem.turma || currentItem.subject !== originalItem.subject;

    if (!didChange) {
      editingSaveRequestKeyRef.current = null;
      return;
    }

    const requestKey = [currentItem.id, currentItem.turma, currentItem.subject].join(":");
    if (editingSaveRequestKeyRef.current === requestKey) {
      return;
    }

    editingSaveRequestKeyRef.current = requestKey;

    let isCancelled = false;

    const saveEditedSchedule = async () => {
      if (!onUpdateSchedule) {
        toast.error("Edição de aula não configurada.");
        editingSaveRequestKeyRef.current = null;
        return;
      }

      const saved = await onUpdateSchedule({
        scheduleId: currentItem.id,
        turma: currentItem.turma,
        subject: currentItem.subject,
        classId: currentItem.classId,
        teacherId: currentItem.teacherId,
        subjectId: currentItem.subjectId,
      });

      if (isCancelled) {
        return;
      }

      if (saved) {
        setEditingEventId(null);
        editingSaveRequestKeyRef.current = null;
        return;
      }

      setItems((previous) =>
        previous.map((item) => (item.id === originalItem.id ? { ...originalItem } : item))
      );
      editingSaveRequestKeyRef.current = null;
    };

    void saveEditedSchedule();

    return () => {
      isCancelled = true;
    };
  }, [editingEventId, items, onUpdateSchedule, originalItemsById]);

  useEffect(() => {
    if (!pendingSavedPreview) return;

    const hasRenderedSavedItem = items.some(
      (item) =>
        item.dayIndex === pendingSavedPreview.dayIndex &&
        item.startSlot === pendingSavedPreview.startSlot &&
        item.turma === pendingSavedPreview.turma &&
        item.subject === pendingSavedPreview.subject
    );

    if (hasRenderedSavedItem) {
      setPendingSavedPreview(null);
    }
  }, [items, pendingSavedPreview]);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveDragId(String(event.active.id));
  }, []);

  const handleDragCancel = useCallback(() => {
    setActiveDragId(null);
  }, []);

  const handleDragEnd = useCallback(
    async (event: DragEndEvent, dayWidth: number) => {
      const sourceId = String(event.active.id);
      setActiveDragId(null);
      if (!dayWidth) return;

      const sourceItem = items.find((item) => item.id === sourceId);
      if (!sourceItem) return;

      const deltaSlots = Math.round(event.delta.y / SLOT_HEIGHT);
      const deltaDays = Math.round(event.delta.x / dayWidth);
      if (deltaSlots === 0 && deltaDays === 0) return;

      const duration = 1;
      const maxStart = times.length - duration;
      const nextStart = clamp(sourceItem.startSlot + deltaSlots, 0, Math.max(0, maxStart));
      const nextEnd = nextStart + duration;
      const maxDayIndex = 5 - 1;
      const nextDay = clamp(sourceItem.dayIndex + deltaDays, 0, Math.max(0, maxDayIndex));

      const isOccupiedByOther = items.some(
        (item) =>
          item.id !== sourceId &&
          item.dayIndex === nextDay &&
          item.startSlot === nextStart
      );
      if (isOccupiedByOther) {
        toast.warning("Esse horário já tem uma aula.");
        return;
      }

      const optimisticNext = items.map((item) =>
        item.id === sourceId
          ? {
              ...item,
              startSlot: nextStart,
              endSlot: nextEnd,
              dayIndex: nextDay,
              daySpan: 1,
            }
          : item
      );

      setItems(optimisticNext);

      if (!onPersistMove || sourceId.startsWith("evt-")) return;
      const persisted = await onPersistMove({
        scheduleId: sourceId,
        dayIndex: nextDay,
        startSlot: nextStart,
        shift: safeShift,
      });

      if (!persisted) {
        setItems(items);
        return;
      }

      toast.success("Aula movida com sucesso.");
    },
    [items, onPersistMove, safeShift, times.length]
  );

  return {
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
  };
}
