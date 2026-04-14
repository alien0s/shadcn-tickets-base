import { DndContext, DragOverlay, closestCenter } from "@dnd-kit/core";
import { ClipboardPaste } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { getSubjectColorClasses } from "@/lib/subject-colors";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { WEEK_DAYS, type GradeGridProps, type WeekDay } from "../types";
import { CELL_GAP, HEADER_HEIGHT, SLOT_HEIGHT, TIME_COL_WIDTH } from "../hooks/useGradeGrid";
import { useGradeGridController } from "../hooks/useGradeGridController";
import { EventBlock, PendingEditorBlock } from "./GradeGridBlocks";
import { GradeGridDeleteDialog } from "./GradeGridDeleteDialog";

const DAY_LABELS: Record<WeekDay, string> = {
  seg: "Seg",
  ter: "Ter",
  qua: "Qua",
  qui: "Qui",
  sex: "Sex",
};

export function GradeGrid(props: GradeGridProps) {
  const controller = useGradeGridController(props);

  return (
    <div
      ref={controller.containerRef}
      className={cn(
        "relative overflow-auto rounded-lg border border-border",
        controller.pendingPasteSlot && "cursor-not-allowed"
      )}
      onClick={() => {
        controller.setOpenEventContextMenuId(null);
        controller.setOpenSlotContextMenuKey(null);
        controller.closeEditor();
      }}
    >
      <DndContext
        sensors={controller.sensors}
        collisionDetection={closestCenter}
        onDragStart={controller.handleDragStartWithPreview}
        onDragMove={controller.handleDragMoveWithPreview}
        onDragCancel={controller.handleDragCancelWithPreview}
        onDragEnd={controller.handleDragEndWithMetrics}
      >
        <div className="relative" style={{ width: controller.gridWidth }}>
          {/* A tabela desenha a malha base; os blocos de aula ficam posicionados por cima. */}
          <table className="w-full table-fixed border-collapse">
            <thead className="sticky top-0 z-20 bg-background">
              <tr>
                <th
                  className="h-10 border-b border-r border-border px-2 text-left"
                  style={{ width: TIME_COL_WIDTH }}
                />
                {WEEK_DAYS.map((day) => (
                  <th
                    key={day}
                    className="h-10 border-b border-r border-border px-3 text-center text-base font-semibold last:border-r-0"
                  >
                    {DAY_LABELS[day]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {controller.times.map((time, slotIndex) => (
                <tr key={time}>
                  <th
                    className={cn(
                      "h-24 border-b border-r border-border px-2 text-left text-base font-semibold text-foreground/80",
                      controller.breakLabelByAnchorTime.has(time) && "relative"
                    )}
                  >
                    {time}
                    {controller.breakLabelByAnchorTime.has(time) ? (
                      <>
                        <div
                          aria-hidden="true"
                          className="pointer-events-none absolute inset-x-0 bottom-0 h-[2px] translate-y-1/2 bg-slate-300/80 dark:bg-slate-600/70"
                        />
                        <span className="absolute left-1/2 bottom-0 inline-flex -translate-x-1/2 translate-y-1/2 rounded-full bg-muted px-3 text-[12px] font-semibold text-muted-foreground">
                          {controller.breakLabelByAnchorTime.get(time)}
                        </span>
                      </>
                    ) : null}
                  </th>

                  {WEEK_DAYS.map((day, dayIndex) => {
                    const key = `${day}-${time}`;
                    const breakLabel = controller.breakLabelByAnchorTime.get(time);
                    const isOccupied =
                      (controller.occupiedCells.get(`${dayIndex}-${slotIndex}`) ?? []).length > 0;

                    return (
                      <ContextMenu
                        key={key}
                        onOpenChange={(open) => controller.handleSlotContextMenuOpenChange(key, open)}
                      >
                        <ContextMenuTrigger asChild>
                          <td
                            className={cn(
                              "h-24 border-b border-r border-border p-0 align-top last:border-r-0",
                              breakLabel && "relative",
                              controller.isGridDimmed && "bg-muted/20"
                            )}
                            onContextMenuCapture={(event) => {
                              if (!controller.shouldSuppressSlotInteraction()) return;
                              event.preventDefault();
                              event.stopPropagation();
                            }}
                            onClick={(event) => {
                              if (controller.shouldSuppressSlotInteraction()) {
                                event.preventDefault();
                                event.stopPropagation();
                                return;
                              }

                              if (!props.isSchoolScheduleConfigured) return;

                              // Slot vazio abre o editor pendente apenas quando não há
                              // aula ocupando a célula e não existe clique residual do menu.
                              if (isOccupied) {
                                toast.warning("Esse horário já tem uma aula.");
                                return;
                              }

                              event.stopPropagation();
                              controller.setOpenEventContextMenuId(null);
                              controller.setOpenSlotContextMenuKey(null);
                              controller.openEmptyEditor(dayIndex, slotIndex);
                            }}
                          >
                            {breakLabel ? (
                              <div
                                aria-hidden="true"
                                className="pointer-events-none absolute inset-x-0 bottom-0 h-[2px] translate-y-1/2 bg-slate-300/80 dark:bg-slate-600/70"
                              />
                            ) : null}
                            {controller.pendingPasteSlot?.dayIndex === dayIndex &&
                            controller.pendingPasteSlot?.startSlot === slotIndex ? (
                              <div className="flex h-full w-full items-center p-2">
                                <Skeleton className="h-full w-full rounded-md border border-primary/20 bg-primary/10" />
                              </div>
                            ) : null}
                          </td>
                        </ContextMenuTrigger>
                        {!isOccupied && controller.copiedLesson && controller.openSlotContextMenuKey === key ? (
                          <ContextMenuContent className="w-44">
                            <ContextMenuItem
                              onSelect={() => {
                                void controller.handlePasteToSlot(dayIndex, slotIndex);
                              }}
                            >
                              <ClipboardPaste className="h-4 w-4" />
                              Colar
                            </ContextMenuItem>
                          </ContextMenuContent>
                        ) : null}
                      </ContextMenu>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>

          {controller.items.map((item) => (
            <EventBlock
              key={item.id}
              item={item}
              dayWidth={controller.dayWidth}
              isDimmed={controller.isGridDimmed}
              isEditing={controller.editingEventId === item.id}
              isContextMenuOpen={controller.openEventContextMenuId === item.id}
              turmaOptions={controller.turmaSelectOptions}
              subjectOptions={controller.subjectSelectOptions}
              autoAssignedSubject={controller.autoAssignedSubject}
              onOpenEditor={controller.openEditor}
              onCloseEditor={controller.closeEditor}
              onContextMenuOpenChange={controller.handleEventContextMenuOpenChange}
              shouldSuppressEditorOpen={controller.shouldSuppressSlotInteraction}
              onCopyItem={controller.handleCopyItem}
              onDeleteItem={controller.handleRequestDelete}
              onUpdateFields={controller.updateEventFields}
            />
          ))}

          {controller.dragPreview ? (
            // O preview mostra exatamente onde a aula vai cair antes do drop final.
            <div
              className="pointer-events-none absolute z-[9]"
              style={{
                top: HEADER_HEIGHT + controller.dragPreview.startSlot * SLOT_HEIGHT + CELL_GAP,
                left: TIME_COL_WIDTH + controller.dragPreview.dayIndex * controller.dayWidth + CELL_GAP,
                width: controller.dayWidth - CELL_GAP * 2,
                height: SLOT_HEIGHT - CELL_GAP * 2,
              }}
            >
              <div
                className={cn(
                  "h-full w-full rounded-md border-2 border-dashed",
                  controller.isDropBlocked
                    ? "border-destructive/80 bg-destructive/10"
                    : "border-primary/70 bg-primary/5"
                )}
              />
            </div>
          ) : null}

          {controller.activePendingBlock ? (
            // O bloco pendente cobre o fluxo de criação rápida e também o preview
            // temporário enquanto a nova aula ainda está sendo persistida.
            <PendingEditorBlock
              dayWidth={controller.dayWidth}
              dayIndex={controller.activePendingBlock.dayIndex}
              startSlot={controller.activePendingBlock.startSlot}
              turma={controller.activePendingBlock.turma}
              subject={controller.activePendingBlock.subject}
              isSaving={controller.isActivePendingBlockSaving}
              isTurmaLoading={controller.isPendingTurmaValidation}
              turmaOptions={controller.turmaSelectOptions}
              subjectOptions={controller.subjectSelectOptions}
              onTurmaChange={controller.handlePendingTurma}
              onSubjectChange={controller.handlePendingSubject}
            />
          ) : null}
        </div>

        {controller.pendingPasteSlot ? (
          // Durante o colar, a grade fica bloqueada para evitar cliques concorrentes
          // enquanto a validação e a criação da aula ainda estão em andamento.
          <div className="absolute inset-0 z-[25] cursor-not-allowed bg-background/5" aria-hidden="true" />
        ) : null}

        <DragOverlay>
          {controller.activeDragItem ? (
            <div
              className={cn(
                "rounded-md border px-3 py-2",
                getSubjectColorClasses(controller.activeDragItem.subject).text,
                getSubjectColorClasses(controller.activeDragItem.subject).border,
                getSubjectColorClasses(controller.activeDragItem.subject).background
              )}
              style={{
                width: controller.dayWidth - CELL_GAP * 2,
                height: SLOT_HEIGHT - CELL_GAP * 2,
              }}
            >
              <div className="space-y-1">
                <p className="truncate text-base font-semibold">{controller.activeDragItem.turma}</p>
                <p className="truncate text-sm font-medium opacity-90">
                  {controller.activeDragItem.subject}
                </p>
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <GradeGridDeleteDialog
        open={controller.isDeleteDialogOpen}
        isDeletingSchedule={controller.isDeletingSchedule}
        onOpenChange={(open) => {
          if (controller.isDeletingSchedule) return;
          controller.setIsDeleteDialogOpen(open);
          if (!open) {
            controller.setPendingDeleteScheduleId(null);
          }
        }}
        onConfirm={() => {
          void controller.handleConfirmDelete();
        }}
      />
    </div>
  );
}
