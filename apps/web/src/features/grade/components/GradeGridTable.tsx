import { memo } from "react";
import { ClipboardPaste } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { TIME_COL_WIDTH } from "../hooks/useGradeGrid";
import { WEEK_DAYS, type WeekDay } from "../types";

const DAY_LABELS: Record<WeekDay, string> = {
  seg: "Seg",
  ter: "Ter",
  qua: "Qua",
  qui: "Qui",
  sex: "Sex",
};

type GradeGridTableProps = {
  times: readonly string[];
  isGridDimmed: boolean;
  copiedLesson: { turma: string; subject: string } | null;
  openSlotContextMenuKey: string | null;
  breakLabelByAnchorTime: Map<string, string>;
  occupiedCells: Map<string, string[]>;
  pendingPasteSlot: { dayIndex: number; startSlot: number } | null;
  isSchoolScheduleConfigured?: boolean;
  shouldSuppressSlotInteraction: () => boolean;
  setOpenEventContextMenuId: (value: string | null) => void;
  setOpenSlotContextMenuKey: (value: string | null) => void;
  openEmptyEditor: (dayIndex: number, slotIndex: number) => void;
  handleSlotContextMenuOpenChange: (slotKey: string, open: boolean) => void;
  handlePasteToSlot: (dayIndex: number, startSlot: number) => Promise<void>;
};

export const GradeGridTable = memo(function GradeGridTable({
  times,
  isGridDimmed,
  copiedLesson,
  openSlotContextMenuKey,
  breakLabelByAnchorTime,
  occupiedCells,
  pendingPasteSlot,
  isSchoolScheduleConfigured = true,
  shouldSuppressSlotInteraction,
  setOpenEventContextMenuId,
  setOpenSlotContextMenuKey,
  openEmptyEditor,
  handleSlotContextMenuOpenChange,
  handlePasteToSlot,
}: GradeGridTableProps) {
  return (
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
        {times.map((time, slotIndex) => (
          <tr key={time}>
            <th
              className={cn(
                "h-24 border-b border-r border-border px-2 text-left text-base font-semibold text-foreground/80",
                breakLabelByAnchorTime.has(time) && "relative"
              )}
            >
              {time}
              {breakLabelByAnchorTime.has(time) ? (
                <>
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-0 bottom-0 h-[2px] translate-y-1/2 bg-slate-300/80 dark:bg-slate-600/70"
                  />
                  <span className="absolute left-1/2 bottom-0 inline-flex -translate-x-1/2 translate-y-1/2 rounded-full bg-muted px-3 text-[12px] font-semibold text-muted-foreground">
                    {breakLabelByAnchorTime.get(time)}
                  </span>
                </>
              ) : null}
            </th>

            {WEEK_DAYS.map((day, dayIndex) => {
              const key = `${day}-${time}`;
              const breakLabel = breakLabelByAnchorTime.get(time);
              const isOccupied = (occupiedCells.get(`${dayIndex}-${slotIndex}`) ?? []).length > 0;

              return (
                <ContextMenu
                  key={key}
                  onOpenChange={(open) => handleSlotContextMenuOpenChange(key, open)}
                >
                  <ContextMenuTrigger asChild>
                    <td
                      className={cn(
                        "h-24 border-b border-r border-border p-0 align-top last:border-r-0",
                        breakLabel && "relative",
                        isGridDimmed && "bg-muted/20"
                      )}
                      onContextMenuCapture={(event) => {
                        if (!shouldSuppressSlotInteraction()) return;
                        event.preventDefault();
                        event.stopPropagation();
                      }}
                      onClick={(event) => {
                        if (shouldSuppressSlotInteraction()) {
                          event.preventDefault();
                          event.stopPropagation();
                          return;
                        }

                        if (!isSchoolScheduleConfigured) return;

                        /*
                          Modo facil: slot vazio abre o editor; slot ocupado so avisa e nao deixa duplicar.
                          Modo tecnico: occupiedCells e a fonte unica da verdade para bloquear criacao em celula ja usada.
                        */
                        if (isOccupied) {
                          toast.warning("Esse horário já tem uma aula.");
                          return;
                        }

                        event.stopPropagation();
                        setOpenEventContextMenuId(null);
                        setOpenSlotContextMenuKey(null);
                        openEmptyEditor(dayIndex, slotIndex);
                      }}
                    >
                      {breakLabel ? (
                        <div
                          aria-hidden="true"
                          className="pointer-events-none absolute inset-x-0 bottom-0 h-[2px] translate-y-1/2 bg-slate-300/80 dark:bg-slate-600/70"
                        />
                      ) : null}

                      {pendingPasteSlot?.dayIndex === dayIndex &&
                      pendingPasteSlot?.startSlot === slotIndex ? (
                        <div className="flex h-full w-full items-center p-2">
                          <Skeleton className="h-full w-full rounded-md border border-primary/20 bg-primary/10" />
                        </div>
                      ) : null}
                    </td>
                  </ContextMenuTrigger>

                  {!isOccupied && copiedLesson && openSlotContextMenuKey === key ? (
                    <ContextMenuContent className="w-44">
                      <ContextMenuItem
                        onSelect={() => {
                          void handlePasteToSlot(dayIndex, slotIndex);
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
  );
});
