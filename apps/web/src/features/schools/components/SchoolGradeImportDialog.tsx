import { LoaderCircleIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import type { ImportableGradeSummary } from "../types";
import { getShiftLabel } from "../utils/school-profile.utils";

type SchoolGradeImportDialogProps = {
  open: boolean;
  isImportListLoading: boolean;
  isImportingGrade: boolean;
  importableGrades: ImportableGradeSummary[];
  selectedImportSchoolId: string | null;
  onOpenChange: (open: boolean) => void;
  onSelectGrade: (schoolId: string) => void;
  onImport: () => void;
};

export function SchoolGradeImportDialog({
  open,
  isImportListLoading,
  isImportingGrade,
  importableGrades,
  selectedImportSchoolId,
  onOpenChange,
  onSelectGrade,
  onImport,
}: SchoolGradeImportDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-[720px] overflow-hidden rounded-lg p-0">
        <DialogHeader className="border-b border-border px-6 py-5">
          <DialogTitle>Importar grade</DialogTitle>
          <DialogDescription>
            Selecione uma escola com grade ja configurada para usar como base.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-5">
          {isImportListLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-24 w-full rounded-xl" />
              <Skeleton className="h-24 w-full rounded-xl" />
              <Skeleton className="h-24 w-full rounded-xl" />
            </div>
          ) : importableGrades.length > 0 ? (
            <ScrollArea className="max-h-[420px] pr-3">
              <div className="space-y-3">
                {importableGrades.map((grade) => {
                  const isSelected = selectedImportSchoolId === grade.schoolId;

                  return (
                    <button
                      key={grade.schoolId}
                      type="button"
                      onClick={() => onSelectGrade(grade.schoolId)}
                      className={`w-full rounded-xl border p-4 text-left transition-colors ${
                        isSelected
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-border bg-card hover:bg-muted/30"
                      }`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full border border-border px-2.5 py-1 text-xs font-semibold">
                              {grade.schoolAbbreviation}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {grade.lessonMinutes
                                ? `${grade.lessonMinutes} min/aula`
                                : "Duracao nao identificada"}
                            </span>
                          </div>
                          <p className="text-sm font-medium text-foreground">{grade.schoolName}</p>
                        </div>

                        <div className="grid min-w-[220px] gap-1 text-right text-xs text-muted-foreground sm:text-sm">
                          {grade.shifts.map((shift) => (
                            <p key={`${grade.schoolId}-${shift.shift}`}>
                              {getShiftLabel(shift.shift)}: {shift.startTime} as {shift.endTime}
                            </p>
                          ))}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          ) : (
            <div className="rounded-xl border border-dashed border-border px-4 py-8 text-sm text-muted-foreground">
              Nenhuma outra escola com grade configurada foi encontrada para importacao.
            </div>
          )}
        </div>

        <DialogFooter className="border-t border-border bg-background px-6 py-4 sm:justify-end">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isImportingGrade}>
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={onImport}
            disabled={!selectedImportSchoolId || isImportListLoading || isImportingGrade}
          >
            {isImportingGrade ? (
              <>
                <LoaderCircleIcon className="h-4 w-4 animate-spin" />
                Importando...
              </>
            ) : (
              "Importar grade"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
