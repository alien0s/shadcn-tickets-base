import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { getLucideIconByName } from "@/utils/subject-icons";
import { useMatrizTable } from "../hooks/useMatrizTable";

type MatrizTableProps = {
  schoolId: string;
  educationLevelId: string;
};

type SubjectSelectProps = {
  value: string;
  options: Array<{ id: string; name: string; icon?: string | null }>;
  onChange: (value: string) => void;
};

function SubjectSelect({ value, options, onChange }: SubjectSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const selectedOption = options.find((option) => option.id === value);
  const selectedLabel = selectedOption?.name ?? "";
  const SelectedIcon = getLucideIconByName(selectedOption?.icon);
  const filteredOptions = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return options;

    return options.filter((option) => option.name.toLowerCase().includes(query));
  }, [options, search]);

  useEffect(() => {
    if (!open) {
      setSearch("");
      return;
    }

    const frame = requestAnimationFrame(() => {
      searchInputRef.current?.focus();
    });

    return () => cancelAnimationFrame(frame);
  }, [open]);

  return (
    <DropdownMenu modal={false} open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="h-9 w-full justify-between text-sm font-medium"
          onClick={(event) => event.stopPropagation()}
          onMouseDown={(event) => event.stopPropagation()}
        >
          <span className="flex min-w-0 flex-1 items-center gap-2">
            {SelectedIcon ? <SelectedIcon className="h-4 w-4 shrink-0 text-muted-foreground" /> : null}
            <span className={cn("truncate", !selectedLabel && "text-muted-foreground")}>
              {selectedLabel || "Selecionar disciplina"}
            </span>
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-[var(--radix-dropdown-menu-trigger-width)]">
        <div className="border-b border-border p-2">
          <Input
            ref={searchInputRef}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Pesquisar disciplina"
            className="h-8"
            onKeyDown={(event) => event.stopPropagation()}
            onClick={(event) => event.stopPropagation()}
            onMouseDown={(event) => event.stopPropagation()}
          />
        </div>
        <DropdownMenuRadioGroup value={value} onValueChange={onChange}>
          {filteredOptions.map((option) => {
            const OptionIcon = getLucideIconByName(option.icon);

            return (
              <DropdownMenuRadioItem
                key={option.id}
                value={option.id}
                className="group pl-2 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground [&>span:first-child]:hidden"
              >
                <span className="flex items-center gap-2">
                  {OptionIcon ? (
                    <OptionIcon className="h-4 w-4 shrink-0 text-muted-foreground group-data-[state=checked]:text-primary-foreground" />
                  ) : null}
                  <span>{option.name}</span>
                </span>
              </DropdownMenuRadioItem>
            );
          })}
          {filteredOptions.length === 0 ? (
            <div className="px-3 py-2 text-sm text-muted-foreground">
              Nenhuma disciplina encontrada.
            </div>
          ) : null}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function LoadingTable() {
  return (
    <div className="p-4">
      <div className="space-y-3">
        <Skeleton className="h-12 w-full rounded-xl" />
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-14 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}

function formatSubjectLabel(value: string): string {
  const normalized = value.trim();
  if (!normalized) return "";

  return normalized.charAt(0).toUpperCase() + normalized.slice(1).toLowerCase();
}

function normalizeMatrixInputValue(rawValue: string): string {
  const digitsOnly = rawValue.replace(/\D/g, "");

  if (digitsOnly.length <= 1) {
    return digitsOnly;
  }

  return digitsOnly.slice(-1);
}

export function MatrizTable({ schoolId, educationLevelId }: MatrizTableProps) {
  const [editingCellKey, setEditingCellKey] = useState<string | null>(null);
  const [editingCellValue, setEditingCellValue] = useState("");
  const {
    columns,
    rows,
    draftRows,
    subjectOptions,
    getAvailableSubjectOptions,
    isLoading,
    error,
    addDraftRow,
    updateDraftSubject,
    updateDraftCell,
    saveDraftCell,
    createMissingCell,
    updateSavedCell,
    weeklyTotals,
    annualTotals,
  } = useMatrizTable(schoolId, educationLevelId);

  const startEditingCell = (cellKey: string, currentValue: number | null | undefined) => {
    setEditingCellKey(cellKey);
    setEditingCellValue(currentValue == null ? "" : String(currentValue));
  };

  const stopEditingCell = () => {
    setEditingCellKey(null);
    setEditingCellValue("");
  };

  const commitSavedCell = async (
    workloadId: string | undefined,
    subjectId: string | undefined,
    columnId: string
  ) => {
    const parsedValue = editingCellValue.trim() === "" ? 0 : Number(editingCellValue);

    if (!workloadId) {
      const created = await createMissingCell(subjectId, columnId, parsedValue);
      if (created) {
        stopEditingCell();
      }
      return;
    }

    const saved = await updateSavedCell(workloadId, parsedValue);

    if (saved) {
      stopEditingCell();
    }
  };

  if (!schoolId) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-sm text-muted-foreground">
        Selecione uma escola para visualizar a matriz.
      </div>
    );
  }

  if (!educationLevelId) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-sm text-muted-foreground">
        Selecione um nível de ensino para montar a matriz.
      </div>
    );
  }

  if (isLoading) {
    return <LoadingTable />;
  }

  if (error) {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        {error}
      </div>
    );
  }

  if (columns.length === 0) {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        Nenhuma série foi encontrada para o nível de ensino selecionado.
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto">
      <Table className="min-w-[760px] table-fixed border-collapse">
        <TableHeader className="sticky top-0 z-10 bg-background">
          <TableRow className="border-border">
            <TableHead
              rowSpan={2}
              className="w-[280px] border-b border-r border-border bg-muted/50 px-4 text-base font-semibold text-foreground"
            >
              Componentes curriculares
            </TableHead>
            <TableHead
              colSpan={columns.length}
              className="border-b border-border bg-muted/50 px-4 text-center text-base font-semibold text-foreground"
            >
              Carga horária
            </TableHead>
          </TableRow>
          <TableRow className="border-border">
            {columns.map((column) => (
              <TableHead
                key={column.id}
                className="min-w-[112px] border-b border-r border-border bg-background px-3 text-center text-sm font-semibold text-foreground last:border-r-0"
                title={column.name}
              >
                {column.shortLabel}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>

        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={columns.length + 1}
                className="h-20 text-center text-sm text-muted-foreground"
              >
                Nenhum componente cadastrado. Clique abaixo para iniciar a matriz.
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow key={row.id} className="border-border">
                <TableCell className="border-r border-border bg-muted/20 px-4">
                  {row.isDraft ? (
                    <SubjectSelect
                      value={draftRows.find((draft) => draft.id === row.id)?.subjectId ?? ""}
                      options={getAvailableSubjectOptions(row.id)}
                      onChange={(value) => updateDraftSubject(row.id, value)}
                    />
                  ) : (
                    <span className="block text-sm font-semibold text-foreground">
                      {formatSubjectLabel(row.subjectName)}
                    </span>
                  )}
                </TableCell>

                {columns.map((column) => {
                  const cell = row.cells[column.id];
                  const draftValue = draftRows.find((draft) => draft.id === row.id)?.cells[column.id] ?? "";
                  const savedCellKey = `${row.id}:${column.id}`;
                  const isEditingSavedCell = !row.isDraft && editingCellKey === savedCellKey;
                  return (
                    <TableCell
                      key={`${row.id}-${column.id}`}
                      className="border-r border-border px-2 py-2 text-center last:border-r-0"
                    >
                      {row.isDraft ? (
                        <div className="flex h-10 w-full items-center justify-center rounded-lg border border-transparent bg-muted/10">
                          <Input
                            inputMode="numeric"
                            value={draftValue}
                            onChange={(event) =>
                              updateDraftCell(row.id, column.id, normalizeMatrixInputValue(event.target.value))
                            }
                            onBlur={() => {
                              void saveDraftCell(row.id, column.id);
                            }}
                            placeholder="0"
                            className="h-full w-full border-0 bg-transparent px-0 text-center text-sm font-semibold shadow-none"
                          />
                        </div>
                      ) : isEditingSavedCell ? (
                        <div className="flex h-10 w-full items-center justify-center rounded-lg border border-transparent bg-muted/10">
                          <Input
                            inputMode="numeric"
                            autoFocus
                            value={editingCellValue}
                            onChange={(event) => setEditingCellValue(normalizeMatrixInputValue(event.target.value))}
                            onBlur={() => {
                              void commitSavedCell(cell?.workloadId, row.subjectId ?? undefined, column.id);
                            }}
                            onKeyDown={(event) => {
                              if (event.key === "Enter") {
                                event.preventDefault();
                                void commitSavedCell(cell?.workloadId, row.subjectId ?? undefined, column.id);
                              }

                              if (event.key === "Escape") {
                                event.preventDefault();
                                stopEditingCell();
                              }
                            }}
                            className="h-full w-full border-0 bg-transparent px-0 text-center text-sm font-semibold shadow-none"
                          />
                        </div>
                      ) : (
                        <div
                          onClick={() => {
                            startEditingCell(savedCellKey, cell.value);
                          }}
                          className={cn(
                            "flex h-10 cursor-text items-center justify-center rounded-lg border border-transparent bg-muted/10 text-sm font-semibold text-foreground"
                          )}
                        >
                          {cell?.value ?? (
                            <span className="text-muted-foreground">0</span>
                          )}
                        </div>
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))
          )}

          {/* A linha final é o gatilho simples para o usuário começar a montar a matriz sem abrir outro modal. */}
          <TableRow className="border-border">
            <TableCell colSpan={columns.length + 1} className="p-0">
              <Button
                type="button"
                variant="ghost"
                className="h-12 w-full justify-center rounded-none border-0 border-t border-border text-sm text-muted-foreground hover:bg-muted/30 hover:text-foreground"
                onClick={addDraftRow}
              >
                <Plus className="h-4 w-4" />
                Adicionar componente curricular
              </Button>
            </TableCell>
          </TableRow>
        </TableBody>

        <TableFooter>
          <TableRow className="border-border">
            <TableCell className="border-r border-border bg-muted/30 px-4 text-sm font-semibold text-foreground">
              Total semanal
            </TableCell>
            {columns.map((column) => (
              <TableCell
                key={`weekly-${column.id}`}
                className="border-r border-border text-center text-sm font-semibold text-foreground last:border-r-0"
              >
                {weeklyTotals[column.id] ?? 0}
              </TableCell>
            ))}
          </TableRow>
          <TableRow className="border-border">
            <TableCell className="border-r border-border bg-muted/30 px-4 text-sm font-semibold text-foreground">
              Horas anuais
            </TableCell>
            {columns.map((column) => (
              <TableCell
                key={`annual-${column.id}`}
                className="border-r border-border text-center text-sm font-semibold text-foreground last:border-r-0"
              >
                {annualTotals[column.id] ?? 0}
              </TableCell>
            ))}
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
}
