import { useCallback, useEffect, useMemo, useState } from "react";
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
}: UseGradeGridParams) {
  const safeShift: ShiftKey = shift === "V" ? "V" : "M";
  const times = safeShift === "M" ? timesByShift.M : timesByShift.V;

  const [items, setItems] = useState<EventBlockItem[]>(() =>
    buildInitialEvents(safeShift, events, timesByShift)
  );
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [pendingEditor, setPendingEditor] = useState<{
    dayIndex: number;
    startSlot: number;
    turma: string;
    subject: string;
  } | null>(null);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

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
    setItems(buildInitialEvents(safeShift, events, timesByShift));
    setEditingEventId(null);
    setPendingEditor(null);
  }, [safeShift, events, timesByShift]);

  const openEditor = useCallback((eventId: string) => {
    setPendingEditor(null);
    setEditingEventId(eventId);
  }, []);

  const closeEditor = useCallback(() => {
    setEditingEventId(null);
    setPendingEditor(null);
  }, []);

  const openEmptyEditor = useCallback((dayIndex: number, startSlot: number) => {
    setEditingEventId(null);
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
      let nextSnapshot:
        | {
            dayIndex: number;
            startSlot: number;
            turma: string;
            subject: string;
          }
        | null = null;

      setPendingEditor((previous) => {
        if (!previous) return previous;
        const next = { ...previous, ...fields };
        nextSnapshot = next;
        return next;
      });

      if (!nextSnapshot?.turma || !nextSnapshot?.subject) return;

      const saveSchedule = async () => {
        const alreadyOccupied = items.some(
          (item) =>
            item.dayIndex === nextSnapshot!.dayIndex &&
            item.startSlot === nextSnapshot!.startSlot
        );

        if (alreadyOccupied) {
          toast.warning("Esse horário já tem uma aula.");
          return;
        }

        if (!onCreateSchedule) {
          toast.error("Criação de aula não configurada.");
          return;
        }

        const saved = await onCreateSchedule({
          dayIndex: nextSnapshot.dayIndex,
          startSlot: nextSnapshot.startSlot,
          shift: safeShift,
          turma: nextSnapshot.turma,
          subject: nextSnapshot.subject,
        });

        if (saved) {
          setPendingEditor(null);
        }
      };

      void saveSchedule();
    },
    [items, onCreateSchedule, safeShift]
  );

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

