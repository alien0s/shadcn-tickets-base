import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type {
  RhDraftTicketPriceRow,
  RhOption,
  RhSavedTicketPriceRow,
  RhSchoolSection,
  RhTicketPriceRow,
} from "../types/rh.types";

type RhTicketPricesTableProps = {
  sections: RhSchoolSection[];
  isLoading: boolean;
  error: string | null;
  getAvailableOptions: (schoolId: string, rowId: string) => RhOption[];
  onAddRow: (schoolId: string) => void;
  onStartEditingRow: (schoolId: string, rowId: string) => void;
  onUpdateRowOption: (schoolId: string, rowId: string, optionKey: string) => void;
  onUpdateRowPrice: (schoolId: string, rowId: string, value: string) => void;
  onRemoveRow: (schoolId: string, rowId: string) => void;
  onSaveRow: (schoolId: string, rowId: string) => Promise<boolean>;
};

type LevelOrSubjectSelectProps = {
  value: string;
  options: RhOption[];
  onChange: (value: string) => void;
};

// Dropdown pesquisavel usado apenas nas linhas em criacao ou edicao.
function LevelOrSubjectSelect({ value, options, onChange }: LevelOrSubjectSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  const selectedOption = options.find((option) => option.key === value);
  const filteredOptions = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return options;
    }

    return options.filter((option) => option.label.toLowerCase().includes(query));
  }, [options, search]);

  const educationLevelOptions = filteredOptions.filter((option) => option.type === "education-level");
  const subjectOptions = filteredOptions.filter((option) => option.type === "subject");

  useEffect(() => {
    if (!open) {
      return;
    }

    const frame = requestAnimationFrame(() => {
      inputRef.current?.focus();
    });

    return () => cancelAnimationFrame(frame);
  }, [open]);

  return (
    <DropdownMenu
      modal={false}
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          setSearch("");
        }
        setOpen(nextOpen);
      }}
    >
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="h-11 w-full justify-between rounded-lg border-border/70 bg-background px-3 text-left text-sm font-medium shadow-none hover:bg-muted/30"
        >
          <span className={cn("truncate", !selectedOption && "text-muted-foreground")}>
            {selectedOption?.label ?? "Selecionar nivel ou disciplina"}
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="max-h-[min(24rem,var(--radix-dropdown-menu-content-available-height))] w-[var(--radix-dropdown-menu-trigger-width)] min-w-[var(--radix-dropdown-menu-trigger-width)] overflow-y-auto"
      >
        <div className="border-b border-border p-2">
          <Input
            ref={inputRef}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Pesquisar opcao"
            className="h-8"
            onKeyDown={(event) => event.stopPropagation()}
          />
        </div>

        {educationLevelOptions.length > 0 ? (
          <>
            <DropdownMenuLabel>Niveis de ensino</DropdownMenuLabel>
            {educationLevelOptions.map((option) => (
              <DropdownMenuItem
                key={option.key}
                onSelect={() => {
                  onChange(option.key);
                  setOpen(false);
                }}
              >
                {option.label}
              </DropdownMenuItem>
            ))}
          </>
        ) : null}

        {educationLevelOptions.length > 0 && subjectOptions.length > 0 ? <DropdownMenuSeparator /> : null}

        {subjectOptions.length > 0 ? (
          <>
            <DropdownMenuLabel>Disciplinas</DropdownMenuLabel>
            {subjectOptions.map((option) => (
              <DropdownMenuItem
                key={option.key}
                onSelect={() => {
                  onChange(option.key);
                  setOpen(false);
                }}
              >
                {option.label}
              </DropdownMenuItem>
            ))}
          </>
        ) : null}

        {filteredOptions.length === 0 ? (
          <div className="px-3 py-2 text-sm text-muted-foreground">Nenhuma opcao encontrada.</div>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function isDraftRow(row: RhTicketPriceRow): row is RhDraftTicketPriceRow {
  return row.isDraft === true;
}

function hasDraftChanges(row: RhDraftTicketPriceRow) {
  if (row.mode === "create") {
    return true;
  }

  return row.optionKey !== (row.originalOptionKey ?? "") || row.pricePerLesson !== (row.originalPricePerLesson ?? "");
}

function formatTicketPrice(value: number): string {
  const hasDecimals = Math.abs(value % 1) > 0.0001;

  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(value);
}

function SavedTicketPriceValue({ value }: { value: number }) {
  const formattedPrice = formatTicketPrice(value);

  return (
    <div className="flex h-11 items-center justify-center rounded-lg bg-muted/20 px-3 text-sm font-semibold text-foreground">
      {formattedPrice}
    </div>
  );
}

function SavedRowActions({
  schoolId,
  row,
  onStartEditingRow,
}: {
  schoolId: string;
  row: RhSavedTicketPriceRow;
  onStartEditingRow: (schoolId: string, rowId: string) => void;
}) {
  if (row.optionType === "mixed") {
    return <div className="text-right text-xs text-muted-foreground">Legado</div>;
  }

  return (
    <div className="flex justify-end">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-9 gap-1.5 px-2 text-xs"
        onClick={() => onStartEditingRow(schoolId, row.id)}
      >
        <Pencil className="h-3.5 w-3.5" />
        Editar
      </Button>
    </div>
  );
}

export function RhTicketPricesTable({
  sections,
  isLoading,
  error,
  getAvailableOptions,
  onAddRow,
  onStartEditingRow,
  onUpdateRowOption,
  onUpdateRowPrice,
  onRemoveRow,
  onSaveRow,
}: RhTicketPricesTableProps) {
  if (error) {
    return <div className="p-6 text-sm text-muted-foreground">{error}</div>;
  }

  if (isLoading) {
    return <div className="p-6 text-sm text-muted-foreground">Carregando catalogos do RH...</div>;
  }

  if (sections.length === 0) {
    return <div className="p-6 text-sm text-muted-foreground">Nenhuma escola visivel foi encontrada.</div>;
  }

  return (
    // A tabela ocupa toda a area central do dialog e empilha as escolas sem cards internos.
    <div className="flex min-h-full flex-col divide-y divide-border">
      {sections.map((section) => (
        <section key={section.schoolId} className="bg-card">
          <div className="border-b border-border bg-muted/30 px-6 py-4">
            <div className="min-w-0">
              <h2 className="truncate text-sm font-semibold text-foreground">{section.schoolLabel}</h2>
              <p className="truncate text-xs text-muted-foreground">{section.schoolName}</p>
            </div>
          </div>

          <Table className="table-fixed">
            <TableHeader>
              <TableRow className="border-border">
                <TableHead className="w-[48%] px-6">Nivel ou disciplina</TableHead>
                <TableHead className="w-[30%] px-6">Valor do ticket</TableHead>
                <TableHead className="w-[22%] px-6 text-right">Acoes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {section.rows.length === 0 ? (
                <TableRow className="border-border">
                  <TableCell colSpan={3} className="px-6 py-8 text-center text-sm text-muted-foreground">
                    Nenhum preco cadastrado para esta escola.
                  </TableCell>
                </TableRow>
              ) : (
                section.rows.map((row) => (
                  <TableRow key={row.id} className="border-border">
                    <TableCell className="px-6 py-3">
                      {isDraftRow(row) ? (
                        <LevelOrSubjectSelect
                          value={row.optionKey}
                          options={getAvailableOptions(section.schoolId, row.id)}
                          onChange={(value) => onUpdateRowOption(section.schoolId, row.id, value)}
                        />
                      ) : (
                        <span className="block text-sm font-medium text-foreground">{row.optionLabel}</span>
                      )}
                    </TableCell>
                    <TableCell className="px-6 py-3">
                      {isDraftRow(row) ? (
                        <Input
                          value={row.pricePerLesson}
                          onChange={(event) => onUpdateRowPrice(section.schoolId, row.id, event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter") {
                              event.preventDefault();
                              void onSaveRow(section.schoolId, row.id);
                            }

                            if (event.key === "Escape") {
                              event.preventDefault();
                              onRemoveRow(section.schoolId, row.id);
                            }
                          }}
                          placeholder="0,00"
                          inputMode="decimal"
                          className="h-11 rounded-lg border-border/70 bg-muted/20 text-center text-sm font-semibold shadow-none"
                        />
                      ) : (
                        <SavedTicketPriceValue value={row.pricePerLesson} />
                      )}
                    </TableCell>
                    <TableCell className="px-6 py-3">
                      {isDraftRow(row) ? (
                        <div className="flex items-center justify-end gap-1">
                          {hasDraftChanges(row) ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              aria-label={row.mode === "edit" ? "Salvar edicao" : "Salvar preco"}
                              disabled={row.isSaving}
                              onClick={() => {
                                void onSaveRow(section.schoolId, row.id);
                              }}
                            >
                              {row.isSaving ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Check className="h-4 w-4" />
                              )}
                            </Button>
                          ) : null}
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label={row.mode === "edit" ? "Cancelar edicao" : "Remover linha"}
                            disabled={row.isSaving}
                            onClick={() => onRemoveRow(section.schoolId, row.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <SavedRowActions
                          schoolId={section.schoolId}
                          row={row}
                          onStartEditingRow={onStartEditingRow}
                        />
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}

              <TableRow className="border-border">
                <TableCell colSpan={3} className="p-0">
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-12 w-full justify-center rounded-none border-0 border-t border-border text-sm text-muted-foreground hover:bg-muted/30 hover:text-foreground"
                    onClick={() => onAddRow(section.schoolId)}
                  >
                    <Plus className="h-4 w-4" />
                    Adicionar preco
                  </Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </section>
      ))}
    </div>
  );
}
