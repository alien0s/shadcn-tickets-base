import { ArrowDownToLine, ChevronDown, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ScheduleRow } from "../types";
import { WEEKDAY_LABELS } from "../utils/school-profile.utils";

type SchoolGradeSectionProps = {
  hasSchedule: boolean;
  scheduleRows: ScheduleRow[];
  onImportGrade: () => void;
  onCreateGrade: () => void;
  onEditGrade: () => void;
  onDeleteGrade: () => void;
};

export function SchoolGradeSection({
  hasSchedule,
  scheduleRows,
  onImportGrade,
  onCreateGrade,
  onEditGrade,
  onDeleteGrade,
}: SchoolGradeSectionProps) {
  return (
    <section className="w-full rounded-xl border border-border bg-card p-4 sm:p-5 lg:flex-[2]">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Grade</h2>

        <div className="flex shrink-0 items-center gap-2">
          <Button type="button" size="sm" variant="outline" onClick={onImportGrade}>
            <ArrowDownToLine className="h-3.5 w-3.5" />
            Importar grade
          </Button>

          {!hasSchedule ? (
            <Button type="button" size="sm" variant="default" onClick={onCreateGrade}>
              <Plus className="h-3.5 w-3.5" />
              Criar grade
            </Button>
          ) : null}

          {hasSchedule ? (
            <>
              <div className="hidden items-center gap-2 min-[740px]:flex">
                <Button type="button" size="sm" variant="outline" onClick={onEditGrade}>
                  <Pencil className="h-3.5 w-3.5" />
                  Editar grade
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="text-destructive hover:text-destructive"
                  onClick={onDeleteGrade}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Excluir grade
                </Button>
              </div>

              <div className="min-[740px]:hidden">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button type="button" size="sm" variant="outline">
                      Acoes
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onSelect={onEditGrade}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Editar grade
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onSelect={onDeleteGrade}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Excluir grade
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </>
          ) : null}
        </div>
      </div>

      {hasSchedule ? (
        <div className="overflow-auto rounded-lg border border-border">
          <table className="w-full min-w-[720px] table-fixed border-collapse">
            <thead className="bg-muted/30">
              <tr>
                <th className="h-9 w-[58px] border-b border-r border-border px-2 text-left text-sm font-semibold">
                  Hora
                </th>
                {WEEKDAY_LABELS.map((label) => (
                  <th
                    key={label}
                    className="h-10 border-b border-r border-border px-2 text-center text-sm font-semibold last:border-r-0"
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {scheduleRows.map((row) =>
                row.type === "interval" ? (
                  <tr key={row.key}>
                    <th className="h-8 border-b border-r border-border px-2 text-left text-sm font-medium text-foreground/80">
                      {row.startTime}
                    </th>
                    <td
                      colSpan={WEEKDAY_LABELS.length}
                      className={
                        row.variant === "lunch"
                          ? "h-8 border-b border-border bg-[repeating-linear-gradient(135deg,rgba(132,204,22,0.22)_0px,rgba(132,204,22,0.22)_10px,transparent_10px,transparent_20px)]"
                          : "h-8 border-b border-border bg-[repeating-linear-gradient(135deg,rgba(249,115,22,0.22)_0px,rgba(249,115,22,0.22)_10px,transparent_10px,transparent_20px)]"
                      }
                    />
                  </tr>
                ) : (
                  <tr key={row.key}>
                    <th className="h-12 border-b border-r border-border px-2 text-left text-sm font-medium text-foreground/80">
                      {row.time}
                    </th>
                    {WEEKDAY_LABELS.map((label) => (
                      <td
                        key={`${label}-${row.key}`}
                        className="h-12 border-b border-r border-border last:border-r-0"
                      />
                    ))}
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground">
          Essa escola ainda nao possui grade configurada. Clique em "Criar grade" ou "Importar
          grade" para iniciar.
        </div>
      )}
    </section>
  );
}
