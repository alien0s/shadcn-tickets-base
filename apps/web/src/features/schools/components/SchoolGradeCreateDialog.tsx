import { ChevronLeft, ChevronRight, LoaderCircleIcon, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { BreakForm, CreateTimeSlotsGradePayload, ScheduleRow } from "../types";
import { WEEKDAY_LABELS } from "../utils/school-profile.utils";

type SchoolGradeCreateDialogProps = {
  open: boolean;
  createStep: number;
  lessonMinutes: string;
  morningStart: string;
  morningEnd: string;
  afternoonStart: string;
  afternoonEnd: string;
  breakForms: BreakForm[];
  breakValidationMessage: string | null;
  previewRows: ScheduleRow[];
  totalColumns: number;
  hasPreviewTimes: boolean;
  canAdvanceCurrentStep: boolean;
  isCreatingGrade: boolean;
  createGradePayload: CreateTimeSlotsGradePayload | null;
  onOpenChange: (open: boolean) => void;
  onStepChange: (step: number | ((current: number) => number)) => void;
  onLessonMinutesChange: (value: string) => void;
  onMorningStartChange: (value: string) => void;
  onMorningEndChange: (value: string) => void;
  onAfternoonStartChange: (value: string) => void;
  onAfternoonEndChange: (value: string) => void;
  onAddBreak: () => void;
  onUpdateBreak: (id: string, field: "start" | "end", value: string) => void;
  onRemoveBreak: (id: string) => void;
  onCreateGrade: () => void;
};

export function SchoolGradeCreateDialog({
  open,
  createStep,
  lessonMinutes,
  morningStart,
  morningEnd,
  afternoonStart,
  afternoonEnd,
  breakForms,
  breakValidationMessage,
  previewRows,
  totalColumns,
  hasPreviewTimes,
  canAdvanceCurrentStep,
  isCreatingGrade,
  createGradePayload,
  onOpenChange,
  onStepChange,
  onLessonMinutesChange,
  onMorningStartChange,
  onMorningEndChange,
  onAfternoonStartChange,
  onAfternoonEndChange,
  onAddBreak,
  onUpdateBreak,
  onRemoveBreak,
  onCreateGrade,
}: SchoolGradeCreateDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex h-[100dvh] max-h-[100dvh] w-full max-w-full translate-x-0 translate-y-0 flex-col overflow-hidden rounded-none p-4 left-0 top-0 min-[500px]:left-1/2 min-[500px]:w-[95vw] min-[500px]:max-w-[760px] min-[500px]:-translate-x-1/2 sm:top-1/2 sm:h-auto sm:max-h-[90vh] sm:w-full sm:max-w-[760px] sm:-translate-y-1/2 sm:rounded-lg sm:p-6"
        onEscapeKeyDown={(event) => {
          if (isCreatingGrade) event.preventDefault();
        }}
        onInteractOutside={(event) => {
          if (isCreatingGrade) event.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>Criar grade</DialogTitle>
          <DialogDescription>Etapa {createStep} de 3</DialogDescription>
        </DialogHeader>

        <div className="mt-2 flex-1 overflow-auto pr-1">
          <div key={createStep} className="animate-in fade-in-0 slide-in-from-right-2 duration-200">
            {createStep === 1 ? (
              <div className="space-y-4 px-1 py-1">
                <h3 className="text-sm font-medium">
                  1. Defina quantos minutos cada aula vai ter
                </h3>
                <div className="max-w-[260px]">
                  <Input
                    type="number"
                    min={1}
                    max={180}
                    value={lessonMinutes}
                    onChange={(event) => onLessonMinutesChange(event.target.value)}
                    placeholder="Ex: 50"
                    className="h-14 rounded-sm px-4 text-2xl font-semibold tabular-nums"
                  />
                </div>
              </div>
            ) : null}

            {createStep === 2 ? (
              <div className="space-y-3">
                <h3 className="text-sm font-medium">2. Defina os turnos</h3>

                <div className="space-y-3 rounded-lg border border-border bg-muted/20 p-3">
                  <p className="text-sm font-semibold text-foreground">Turno matutino</p>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Comeca</p>
                      <Input
                        type="time"
                        value={morningStart}
                        onChange={(event) => onMorningStartChange(event.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Termina</p>
                      <Input
                        type="time"
                        value={morningEnd}
                        onChange={(event) => onMorningEndChange(event.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-3 rounded-lg border border-border bg-muted/20 p-3">
                  <p className="text-sm font-semibold text-foreground">Turno vespertino</p>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Comeca</p>
                      <Input
                        type="time"
                        value={afternoonStart}
                        onChange={(event) => onAfternoonStartChange(event.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Termina</p>
                      <Input
                        type="time"
                        value={afternoonEnd}
                        onChange={(event) => onAfternoonEndChange(event.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="h-px w-full bg-border" />

                <div className="space-y-3 rounded-lg border border-border bg-muted/20 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-foreground">Intervalos (opcional)</p>
                    <Button type="button" size="sm" variant="outline" onClick={onAddBreak}>
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {breakForms.map((form) => (
                      <div
                        key={form.id}
                        className="grid grid-cols-1 gap-3 rounded-md border border-border/70 p-3 sm:grid-cols-2"
                      >
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Inicio</p>
                          <Input
                            type="time"
                            value={form.start}
                            onChange={(event) => onUpdateBreak(form.id, "start", event.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm text-muted-foreground">Termino</p>
                            {breakForms.length > 1 ? (
                              <button
                                type="button"
                                className="text-xs text-muted-foreground hover:text-foreground"
                                onClick={() => onRemoveBreak(form.id)}
                              >
                                Remover
                              </button>
                            ) : null}
                          </div>
                          <Input
                            type="time"
                            value={form.end}
                            onChange={(event) => onUpdateBreak(form.id, "end", event.target.value)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {breakValidationMessage ? (
                    <p className="text-xs font-medium text-orange-600 dark:text-orange-300">
                      {breakValidationMessage}
                    </p>
                  ) : null}
                </div>
              </div>
            ) : null}

            {createStep === 3 ? (
              <div className="space-y-3">
                <h3 className="text-sm font-medium">3. Pre-visualizacao da grade</h3>
                <div className="overflow-auto rounded-lg border border-border">
                  <table className="w-full min-w-[720px] table-fixed border-collapse">
                    <thead className="bg-muted/30">
                      <tr>
                        <th className="h-8 w-[66px] border-b border-r border-border px-2 text-left text-sm font-semibold">
                          Hora
                        </th>
                        {WEEKDAY_LABELS.map((label) => (
                          <th
                            key={label}
                            className="h-8 border-b border-r border-border px-2 text-center text-sm font-semibold last:border-r-0"
                          >
                            {label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewRows.map((row) =>
                        row.type === "interval" ? (
                          <tr key={row.key}>
                            <th className="h-10 border-b border-r border-border px-2 text-left text-sm font-medium text-foreground/80">
                              {row.startTime}
                            </th>
                            <td
                              colSpan={WEEKDAY_LABELS.length}
                              className={
                                row.variant === "lunch"
                                  ? "h-10 border-b border-border bg-[repeating-linear-gradient(135deg,rgba(132,204,22,0.22)_0px,rgba(132,204,22,0.22)_10px,transparent_10px,transparent_20px)]"
                                  : "h-10 border-b border-border bg-[repeating-linear-gradient(135deg,rgba(249,115,22,0.22)_0px,rgba(249,115,22,0.22)_10px,transparent_10px,transparent_20px)]"
                              }
                            />
                          </tr>
                        ) : (
                          <tr key={row.key}>
                            <th className="h-10 border-b border-r border-border px-2 text-left text-sm font-medium text-foreground/80">
                              {row.time}
                            </th>
                            {WEEKDAY_LABELS.map((label) => (
                              <td
                                key={`${label}-${row.key}`}
                                className="h-10 border-b border-r border-border last:border-r-0"
                              />
                            ))}
                          </tr>
                        )
                      )}
                      {!hasPreviewTimes ? (
                        <tr>
                          <td colSpan={totalColumns} className="h-10 px-3 text-sm text-muted-foreground">
                            Preencha os horarios para visualizar a grade.
                          </td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <DialogFooter className="w-full flex-row gap-2 bg-background pt-4 sm:justify-end sm:space-x-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isCreatingGrade}>
            Cancelar
          </Button>
          {createStep > 1 ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => onStepChange((current) => current - 1)}
              disabled={isCreatingGrade}
            >
              <ChevronLeft className="h-4 w-4" />
              Voltar
            </Button>
          ) : null}
          {createStep < 3 ? (
            <Button
              type="button"
              onClick={() => onStepChange((current) => current + 1)}
              disabled={!canAdvanceCurrentStep || isCreatingGrade}
            >
              <ChevronRight className="h-4 w-4" />
              Avancar
            </Button>
          ) : (
            <Button
              type="button"
              onClick={onCreateGrade}
              disabled={isCreatingGrade || !createGradePayload || !hasPreviewTimes}
            >
              {isCreatingGrade ? (
                <>
                  <LoaderCircleIcon className="h-4 w-4 animate-spin" />
                  Criando grade...
                </>
              ) : (
                "Finalizar criacao de grade"
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
