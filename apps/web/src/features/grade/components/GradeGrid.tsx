import { DndContext, DragOverlay, closestCenter } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import { getSubjectColorClasses } from "@/lib/subject-colors";
import { type GradeGridProps } from "../types";
import { CELL_GAP, HEADER_HEIGHT, SLOT_HEIGHT, TIME_COL_WIDTH } from "../hooks/useGradeGrid";
import { useGradeGridController } from "../hooks/useGradeGridController";
import { EventBlock, PendingEditorBlock } from "./GradeGridBlocks";
import { GradeGridDeleteDialog } from "./GradeGridDeleteDialog";
import { GradeGridTable } from "./GradeGridTable";

export function GradeGrid(props: GradeGridProps) {
  const controller = useGradeGridController(props);

  return (
    <div
      data-grade-screen-grid
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
          {/*
            Modo facil: esta parte desenha so a malha vazia da grade.
            Modo tecnico: o renderer da tabela base foi extraido para manter este arquivo focado em composicao.
          */}
          <GradeGridTable
            times={controller.times}
            isGridDimmed={controller.isGridDimmed}
            copiedLesson={controller.copiedLesson}
            openSlotContextMenuKey={controller.openSlotContextMenuKey}
            breakLabelByAnchorTime={controller.breakLabelByAnchorTime}
            occupiedCells={controller.occupiedCells}
            pendingPasteSlot={controller.pendingPasteSlot}
            isSchoolScheduleConfigured={props.isSchoolScheduleConfigured}
            shouldSuppressSlotInteraction={controller.shouldSuppressSlotInteraction}
            setOpenEventContextMenuId={controller.setOpenEventContextMenuId}
            setOpenSlotContextMenuKey={controller.setOpenSlotContextMenuKey}
            openEmptyEditor={controller.openEmptyEditor}
            handleSlotContextMenuOpenChange={controller.handleSlotContextMenuOpenChange}
            handlePasteToSlot={controller.handlePasteToSlot}
          />

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
              subjectIconsByName={props.subjectIconsByName}
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
            <>
              {/*
                Modo facil: o usuario ve para qual celula a aula vai cair antes de soltar.
                Modo tecnico: o preview usa o mesmo calculo de linha e coluna do drop real.
              */}
              <div
                className="pointer-events-none absolute z-[9]"
                style={{
                  top: HEADER_HEIGHT + controller.dragPreview.startSlot * SLOT_HEIGHT + CELL_GAP,
                  left:
                    TIME_COL_WIDTH + controller.dragPreview.dayIndex * controller.dayWidth + CELL_GAP,
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
            </>
          ) : null}

          {controller.activePendingBlock ? (
            <>
              {/*
                Modo facil: o bloco pendente mostra o rascunho ou o salvamento da nova aula no proprio slot.
                Modo tecnico: pendingEditor e pendingSavedPreview compartilham o mesmo renderer para evitar flicker.
              */}
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
                subjectIconsByName={props.subjectIconsByName}
                onTurmaChange={controller.handlePendingTurma}
                onSubjectChange={controller.handlePendingSubject}
              />
            </>
          ) : null}
        </div>

        {controller.pendingPasteSlot ? (
          <>
            {/*
              Modo facil: enquanto cola, a grade fica travada para nao misturar cliques.
              Modo tecnico: o overlay bloqueia interacoes concorrentes durante validacao e criacao assincrona.
            */}
            <div
              className="absolute inset-0 z-[25] cursor-not-allowed bg-background/5"
              aria-hidden="true"
            />
          </>
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
