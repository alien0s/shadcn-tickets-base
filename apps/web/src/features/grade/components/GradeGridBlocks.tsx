import { memo, useCallback, useMemo, type MouseEvent } from "react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { ChevronDown, Clipboard, LoaderCircleIcon, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getSubjectColorClasses } from "@/lib/subject-colors";
import { getLucideIconByName } from "@/utils/subject-icons";
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
import {
  CELL_GAP,
  HEADER_HEIGHT,
  SLOT_HEIGHT,
  TIME_COL_WIDTH,
  type EventBlockItem,
} from "../hooks/useGradeGrid";
import type { CopiedLesson } from "../types";

type SubjectIconsByName = Record<string, string | null | undefined>;

type CardSelectProps = {
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
  ariaLabel: string;
  placeholder: string;
  isLoading?: boolean;
  iconByOption?: SubjectIconsByName;
};

function CardSelect({
  value,
  onChange,
  options,
  ariaLabel,
  placeholder,
  isLoading = false,
  iconByOption,
}: CardSelectProps) {
  const SelectedIcon = useMemo(
    () => getLucideIconByName(value ? iconByOption?.[value] : undefined),
    [iconByOption, value]
  );

  // O select fica desacoplado do card para evitar propagacao de clique
  // quando o usuario abre o menu dentro do bloco da grade.
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="h-8 w-full justify-between rounded-md px-3 text-sm font-medium focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
          aria-label={ariaLabel}
          disabled={isLoading}
          onClick={(event) => event.stopPropagation()}
          onMouseDown={(event) => event.stopPropagation()}
        >
          <span className="flex min-w-0 items-center gap-2">
            {SelectedIcon ? (
              <SelectedIcon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            ) : null}
            <span className={cn("truncate", !value && "text-muted-foreground")}>
              {value || placeholder}
            </span>
          </span>
          <span className="flex items-center gap-1.5">
            {isLoading ? (
              <LoaderCircleIcon className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : null}
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="grade-card-menu w-[var(--radix-dropdown-menu-trigger-width)] min-w-[var(--radix-dropdown-menu-trigger-width)]"
      >
        <DropdownMenuRadioGroup value={value} onValueChange={onChange}>
          {options.map((option) => {
            const OptionIcon = getLucideIconByName(iconByOption?.[option]);

            return (
              <DropdownMenuRadioItem key={option} value={option} className="pl-2">
                <span className="flex items-center gap-2">
                  {OptionIcon ? (
                    <OptionIcon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                  ) : null}
                  <span>{option}</span>
                </span>
              </DropdownMenuRadioItem>
            );
          })}
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
  isContextMenuOpen: boolean;
  turmaOptions: readonly string[];
  subjectOptions: readonly string[];
  subjectIconsByName?: SubjectIconsByName;
  autoAssignedSubject: string | null;
  onOpenEditor: (eventId: string) => void;
  onCloseEditor: () => void;
  onContextMenuOpenChange: (eventId: string, open: boolean) => void;
  shouldSuppressEditorOpen: () => boolean;
  onCopyItem?: (item: CopiedLesson) => void;
  onDeleteItem?: (eventId: string) => void;
  onUpdateFields: (eventId: string, fields: Partial<Pick<EventBlockItem, "turma" | "subject">>) => void;
};

export const EventBlock = memo(function EventBlock({
  item,
  dayWidth,
  isDimmed,
  isEditing,
  isContextMenuOpen,
  turmaOptions,
  subjectOptions,
  subjectIconsByName,
  autoAssignedSubject,
  onOpenEditor,
  onCloseEditor,
  onContextMenuOpenChange,
  shouldSuppressEditorOpen,
  onCopyItem,
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

  const handleOpenEditor = useCallback(() => {
    onOpenEditor(item.id);
  }, [item.id, onOpenEditor]);

  const handleFieldTurma = useCallback(
    (value: string) => {
      if (autoAssignedSubject) {
        onUpdateFields(item.id, { turma: value, subject: autoAssignedSubject });
        return;
      }

      onUpdateFields(item.id, { turma: value });
    },
    [autoAssignedSubject, item.id, onUpdateFields]
  );

  const handleFieldSubject = useCallback(
    (value: string) => {
      onUpdateFields(item.id, { subject: value });
    },
    [item.id, onUpdateFields]
  );

  const handleCardClick = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      if (shouldSuppressEditorOpen()) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }

      event.stopPropagation();
      handleOpenEditor();
    },
    [handleOpenEditor, shouldSuppressEditorOpen]
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
      <ContextMenu onOpenChange={(open) => onContextMenuOpenChange(item.id, open)}>
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
              <div
                className="flex h-full flex-col justify-center gap-2"
                onClick={(event) => event.stopPropagation()}
              >
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
                  iconByOption={subjectIconsByName}
                  ariaLabel="Selecionar materia do horario"
                  placeholder="Materia"
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
        {!isEditing && isContextMenuOpen ? (
          <ContextMenuContent className="w-44">
            <ContextMenuItem
              onSelect={() => {
                onCopyItem?.({
                  turma: item.turma,
                  subject: item.subject,
                  classId: item.classId,
                  teacherId: item.teacherId,
                  subjectId: item.subjectId,
                });
              }}
            >
              <Clipboard className="h-4 w-4" />
              Copiar
            </ContextMenuItem>
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
              Excluir
            </ContextMenuItem>
          </ContextMenuContent>
        ) : null}
      </ContextMenu>
    </div>
  );
});

type PendingEditorBlockProps = {
  dayWidth: number;
  dayIndex: number;
  startSlot: number;
  turma: string;
  subject: string;
  isSaving: boolean;
  isTurmaLoading: boolean;
  turmaOptions: readonly string[];
  subjectOptions: readonly string[];
  subjectIconsByName?: SubjectIconsByName;
  onTurmaChange: (value: string) => void;
  onSubjectChange: (value: string) => void;
};

export const PendingEditorBlock = memo(function PendingEditorBlock({
  dayWidth,
  dayIndex,
  startSlot,
  turma,
  subject,
  isSaving,
  isTurmaLoading,
  turmaOptions,
  subjectOptions,
  subjectIconsByName,
  onTurmaChange,
  onSubjectChange,
}: PendingEditorBlockProps) {
  const tone = useMemo(() => getSubjectColorClasses(subject), [subject]);

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
      {isSaving && turma && subject ? (
        <div
          className={cn(
            "relative h-full w-full rounded-md border px-3 py-2",
            tone.text,
            tone.border,
            tone.background
          )}
        >
          <div className="space-y-1">
            <p className="truncate text-base font-semibold">{turma}</p>
            <p className="truncate text-sm font-medium opacity-90">{subject}</p>
          </div>
        </div>
      ) : (
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
            isLoading={isTurmaLoading}
          />
          <CardSelect
            value={subject}
            onChange={onSubjectChange}
            options={subjectOptions}
            iconByOption={subjectIconsByName}
            ariaLabel="Selecionar materia"
            placeholder="Materia"
          />
        </div>
      )}
    </div>
  );
});
