import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  useDraggable,
  type DragEndEvent,
  type DragMoveEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { ChevronDown, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getSubjectColorClasses } from "@/lib/subject-colors";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { WEEK_DAYS, type ShiftEvent, type ShiftKey, type WeekDay } from "../types";
import {
  CELL_GAP,
  HEADER_HEIGHT,
  SLOT_HEIGHT,
  TIME_COL_WIDTH,
  useGradeGrid,
  type EventBlockItem,
} from "../hooks/useGradeGrid";

type GradeGridProps = {
  shift: ShiftKey;
  events: ShiftEvent[];
  isSchoolScheduleConfigured?: boolean;
  turmaOptions: readonly string[];
  subjectOptions: readonly string[];
  selectedTeacherSubjectOptions?: readonly string[];
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
  onDeleteSchedule?: (scheduleId: string) => Promise<boolean>;
  onValidateTurmaSelection?: (input: {
    dayIndex: number;
    startSlot: number;
    shift: ShiftKey;
    turma: string;
  }) => Promise<{ hasConflict: boolean; teacherName?: string }>;
};

const DAY_LABELS: Record<WeekDay, string> = {
  seg: "Seg",
  ter: "Ter",
  qua: "Qua",
  qui: "Qui",
  sex: "Sex",
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

type CardSelectProps = {
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
  ariaLabel: string;
  placeholder: string;
};

function CardSelect({ value, onChange, options, ariaLabel, placeholder }: CardSelectProps) {
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="h-8 w-full justify-between rounded-md px-3 text-sm font-medium focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
          aria-label={ariaLabel}
          onClick={(event) => event.stopPropagation()}
          onMouseDown={(event) => event.stopPropagation()}
        >
          <span className={cn("truncate", !value && "text-muted-foreground")}>{value || placeholder}</span>
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="grade-card-menu w-[220px]">
        <DropdownMenuRadioGroup value={value} onValueChange={onChange}>
          {options.map((option) => (
            <DropdownMenuRadioItem key={option} value={option}>
              {option}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

type EventBlockProps = {
  item: EventBlockItem;
  dayWidth: number;
  isDimmed: boolean;
  isEditing: boolean;
  turmaOptions: readonly string[];
  subjectOptions: readonly string[];
  autoAssignedSubject: string | null;
  onOpenEditor: (eventId: string) => void;
  onCloseEditor: () => void;
  onDeleteItem?: (eventId: string) => void;
  onUpdateFields: (eventId: string, fields: Partial<Pick<EventBlockItem, "turma" | "subject">>) => void;
};

const EventBlock = memo(function EventBlock({
  item,
  dayWidth,
  isDimmed,
  isEditing,
  turmaOptions,
  subjectOptions,
  autoAssignedSubject,
  onOpenEditor,
  onCloseEditor,
  onDeleteItem,
  onUpdateFields,
}: EventBlockProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: item.id,
    disabled: item.draggable === false,
  });

  const tone = useMemo(() => getSubjectColorClasses(item.subject), [item.subject]);

  const positionedStyle = useMemo(
    () => ({
      top: HEADER_HEIGHT + item.startSlot * SLOT_HEIGHT + CELL_GAP,
      left: TIME_COL_WIDTH + item.dayIndex * dayWidth + CELL_GAP,
      width: dayWidth - CELL_GAP * 2,
      height: SLOT_HEIGHT - CELL_GAP * 2,
    }),
    [dayWidth, item.dayIndex, item.startSlot]
  );

  const dndStyle = useMemo(
    () => ({
      transform: CSS.Transform.toString(transform),
    }),
    [transform]
  );

  const handleOpenEditor = useCallback(
    () => {
      onOpenEditor(item.id);
    },
    [item.id, onOpenEditor]
  );

  const handleFieldTurma = useCallback(
    (value: string) => {
      if (autoAssignedSubject) {
        onUpdateFields(item.id, { turma: value, subject: autoAssignedSubject });
        if (value) onCloseEditor();
        return;
      }

      onUpdateFields(item.id, { turma: value });
      if (value && item.subject) onCloseEditor();
    },
    [autoAssignedSubject, item.id, item.subject, onCloseEditor, onUpdateFields]
  );

  const handleFieldSubject = useCallback(
    (value: string) => {
      onUpdateFields(item.id, { subject: value });
      if (value && item.turma) onCloseEditor();
    },
    [item.id, item.turma, onCloseEditor, onUpdateFields]
  );

  const handleCardClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      event.stopPropagation();
      handleOpenEditor();
    },
    [handleOpenEditor]
  );

  return (
    <div
      ref={setNodeRef}
      style={{ ...positionedStyle, ...dndStyle }}
      className={cn("absolute z-10 touch-none", isDragging && "opacity-55", isDimmed && "opacity-60")}
      onClick={handleCardClick}
      {...attributes}
      {...listeners}
    >
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div
        className={cn(
          "relative h-full w-full rounded-md border py-2",
          isEditing
            ? "border-primary/30 bg-background text-foreground"
            : cn(tone.text, tone.border, tone.background, "px-3")
        )}
          >
        {isEditing ? (
          <div className="flex h-full flex-col justify-center gap-2" onClick={(event) => event.stopPropagation()}>
            <CardSelect
              value={item.turma}
              onChange={handleFieldTurma}
              options={turmaOptions}
              ariaLabel="Selecionar turma do horario"
              placeholder="Turma"
            />
            <CardSelect
              value={item.subject}
              onChange={handleFieldSubject}
              options={subjectOptions}
              ariaLabel="Selecionar materia do horario"
              placeholder="Matéria"
            />
          </div>
        ) : (
          <div className="space-y-1">
            <p className="truncate text-base font-semibold">{item.turma}</p>
            <p className="truncate text-sm font-medium opacity-90">{item.subject}</p>
          </div>
        )}
          </div>
        </ContextMenuTrigger>
        {!isEditing ? (
          <ContextMenuContent className="w-44">
            <ContextMenuItem
              onSelect={() => {
                onOpenEditor(item.id);
              }}
            >
              <Pencil className="h-4 w-4" />
              Editar
            </ContextMenuItem>
            <ContextMenuItem
              className="text-destructive focus:bg-destructive/10 focus:text-destructive"
              onSelect={() => {
                onDeleteItem?.(item.id);
              }}
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </ContextMenuItem>
          </ContextMenuContent>
        ) : null}
      </ContextMenu>
    </div>
  );
});

type PendingEditorProps = {
  dayWidth: number;
  dayIndex: number;
  startSlot: number;
  turma: string;
  subject: string;
  turmaOptions: readonly string[];
  subjectOptions: readonly string[];
  onTurmaChange: (value: string) => void;
  onSubjectChange: (value: string) => void;
};

const PendingEditorBlock = memo(function PendingEditorBlock({
  dayWidth,
  dayIndex,
  startSlot,
  turma,
  subject,
  turmaOptions,
  subjectOptions,
  onTurmaChange,
  onSubjectChange,
}: PendingEditorProps) {
  const positionedStyle = useMemo(
    () => ({
      top: HEADER_HEIGHT + startSlot * SLOT_HEIGHT + CELL_GAP,
      left: TIME_COL_WIDTH + dayIndex * dayWidth + CELL_GAP,
      width: dayWidth - CELL_GAP * 2,
      height: SLOT_HEIGHT - CELL_GAP * 2,
    }),
    [dayIndex, dayWidth, startSlot]
  );

  return (
    <div style={positionedStyle} className="absolute z-10">
      <div
        className="relative flex h-full w-full flex-col justify-center gap-2 rounded-md py-2"
        onClick={(event) => event.stopPropagation()}
      >
        <CardSelect
          value={turma}
          onChange={onTurmaChange}
          options={turmaOptions}
          ariaLabel="Selecionar turma"
          placeholder="Turma"
        />
        <CardSelect
          value={subject}
          onChange={onSubjectChange}
          options={subjectOptions}
          ariaLabel="Selecionar matéria"
          placeholder="Matéria"
        />
      </div>
    </div>
  );
});

export function GradeGrid({
  shift,
  events = [],
  isSchoolScheduleConfigured = true,
  turmaOptions = [],
  subjectOptions = [],
  selectedTeacherSubjectOptions = [],
  timesByShift,
  onPersistMove,
  onCreateSchedule,
  onDeleteSchedule,
  onValidateTurmaSelection,
}: GradeGridProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const [dragPreview, setDragPreview] = useState<{ dayIndex: number; startSlot: number } | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [pendingDeleteScheduleId, setPendingDeleteScheduleId] = useState<string | null>(null);

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

  const dayWidth = useMemo(
    () => {
      const minDayWidth = 136;
      const fitDayWidth = (containerWidth - TIME_COL_WIDTH) / WEEK_DAYS.length;
      return Math.max(minDayWidth, fitDayWidth);
    },
    [containerWidth]
  );
  const gridWidth = useMemo(
    () => TIME_COL_WIDTH + dayWidth * WEEK_DAYS.length,
    [dayWidth]
  );

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

      setDragPreview((previous) => {
        if (previous && previous.dayIndex === nextDay && previous.startSlot === nextSlot) {
          return previous;
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

  const handlePendingTurma = useCallback(
    (value: string) => {
      const run = async () => {
        if (pendingEditor && onValidateTurmaSelection) {
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
  const isGridDimmed = !isSchoolScheduleConfigured;

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
    const deleted = await handleDeleteEvent(pendingDeleteScheduleId);
    if (deleted) {
      setIsDeleteDialogOpen(false);
      setPendingDeleteScheduleId(null);
    }
  }, [handleDeleteEvent, pendingDeleteScheduleId]);

  return (
    <div ref={containerRef} className="relative overflow-auto rounded-lg border border-border" onClick={closeEditor}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStartWithPreview}
        onDragMove={handleDragMoveWithPreview}
        onDragCancel={handleDragCancelWithPreview}
        onDragEnd={handleDragEndWithMetrics}
      >
          <div className="relative" style={{ width: gridWidth }}>
            <table className="w-full table-fixed border-collapse">
            <thead className="sticky top-0 z-20 bg-background">
              <tr>
                <th
                  className="h-10 border-b border-r border-border px-2 text-left"
                  style={{ width: TIME_COL_WIDTH }}
                />
                {WEEK_DAYS.map((day) => (
                  <th key={day} className="h-10 border-b border-r border-border px-3 text-center text-base font-semibold last:border-r-0">
                    {DAY_LABELS[day]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {times.map((time, slotIndex) => (
                <tr key={time}>
                  <th className="h-24 border-b border-r border-border px-2 text-left text-base font-semibold text-foreground/80">
                    {time}
                  </th>
                  {WEEK_DAYS.map((day, dayIndex) => {
                    const key = `${day}-${time}`;
                    const isOccupied = (occupiedCells.get(`${dayIndex}-${slotIndex}`) ?? []).length > 0;
                    return (
                      <td
                        key={key}
                        className={cn(
                          "h-24 border-b border-r border-border p-0 align-top last:border-r-0",
                          isGridDimmed && "bg-muted/20"
                        )}
                        onClick={(event) => {
                          if (!isSchoolScheduleConfigured) return;
                          if (isOccupied) {
                            toast.warning("Esse horário já tem uma aula.");
                            return;
                          }
                          event.stopPropagation();
                          openEmptyEditor(dayIndex, slotIndex);
                        }}
                      />
                    );
                  })}
                </tr>
              ))}
            </tbody>
            </table>

            {items.map((item) => (
              <EventBlock
                key={item.id}
                item={item}
                dayWidth={dayWidth}
                isDimmed={isGridDimmed}
                isEditing={editingEventId === item.id}
                turmaOptions={turmaSelectOptions}
                subjectOptions={subjectSelectOptions}
                autoAssignedSubject={autoAssignedSubject}
                onOpenEditor={openEditor}
                onCloseEditor={closeEditor}
                onDeleteItem={(eventId) => {
                  openDeleteDialog(eventId);
                }}
                onUpdateFields={updateEventFields}
              />
            ))}

            {dragPreview ? (
              <div
                className="pointer-events-none absolute z-[9]"
                style={{
                  top: HEADER_HEIGHT + dragPreview.startSlot * SLOT_HEIGHT + CELL_GAP,
                  left: TIME_COL_WIDTH + dragPreview.dayIndex * dayWidth + CELL_GAP,
                  width: dayWidth - CELL_GAP * 2,
                  height: SLOT_HEIGHT - CELL_GAP * 2,
                }}
              >
                <div
                  className={cn(
                    "h-full w-full rounded-md border-2 border-dashed",
                    isDropBlocked
                      ? "border-destructive/80 bg-destructive/10"
                      : "border-primary/70 bg-primary/5"
                  )}
                />
              </div>
            ) : null}

            {pendingEditor ? (
              <PendingEditorBlock
                dayWidth={dayWidth}
                dayIndex={pendingEditor.dayIndex}
                startSlot={pendingEditor.startSlot}
                turma={pendingEditor.turma}
                subject={pendingEditor.subject}
                turmaOptions={turmaSelectOptions}
                subjectOptions={subjectSelectOptions}
                onTurmaChange={handlePendingTurma}
                onSubjectChange={handlePendingSubject}
              />
            ) : null}
          </div>

        <DragOverlay>
          {activeDragItem ? (
            <div
              className={cn(
                "rounded-md border px-3 py-2",
                getSubjectColorClasses(activeDragItem.subject).text,
                getSubjectColorClasses(activeDragItem.subject).border,
                getSubjectColorClasses(activeDragItem.subject).background
              )}
              style={{
                width: dayWidth - CELL_GAP * 2,
                height: SLOT_HEIGHT - CELL_GAP * 2,
              }}
            >
              <div className="space-y-1">
                <p className="truncate text-base font-semibold">{activeDragItem.turma}</p>
                <p className="truncate text-sm font-medium opacity-90">{activeDragItem.subject}</p>
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={(open) => {
          setIsDeleteDialogOpen(open);
          if (!open) {
            setPendingDeleteScheduleId(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação vai excluir a aula da grade e não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(event) => {
                event.preventDefault();
                void handleConfirmDelete();
              }}
            >
              Excluir aula
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
