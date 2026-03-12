import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, ChevronDown, LoaderCircleIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type SchoolOption = {
  id: string;
  name: string;
};

type EducationLevelOption = {
  id: string;
  name: string;
};

type SeriesOption = {
  id: string;
  educationLevelId: string;
  name: string;
};

type CreateClassPayload = {
  school_id: string;
  series_id: string;
  suffix: string;
  shift: number;
  year: number;
};

type ClassesCreateDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schoolOptions: SchoolOption[];
  educationLevelOptions: EducationLevelOption[];
  seriesOptions: SeriesOption[];
  defaultSchoolId?: string;
  onSubmit: (payload: CreateClassPayload) => Promise<void>;
};

const SCHOOL_COLOR_CLASSES = [
  "bg-blue-100 border-blue-200",
  "bg-rose-100 border-rose-200",
  "bg-amber-100 border-amber-200",
  "bg-emerald-100 border-emerald-200",
  "bg-orange-100 border-orange-200",
] as const;

const SUFFIX_OPTIONS = ["A", "B", "C", "D", "E"] as const;
const SHIFT_OPTIONS = [
  { value: 1, label: "Matutino" },
  { value: 2, label: "Vespertino" },
] as const;
const CURRENT_YEAR = new Date().getFullYear();

function getSchoolColorClass(index: number): string {
  return SCHOOL_COLOR_CLASSES[index % SCHOOL_COLOR_CLASSES.length];
}

function normalizeLevel(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function getLevelTone(level: string): string {
  const normalized = normalizeLevel(level);

  if (normalized.includes("educacao infantil") || normalized === "ei") {
    return "border-sky-200 bg-sky-100 text-sky-700 hover:bg-sky-200";
  }

  if (normalized.includes("fundamental i") || normalized === "ef1") {
    return "border-blue-200 bg-blue-100 text-blue-700 hover:bg-blue-200";
  }

  if (normalized.includes("fundamental ii") || normalized === "ef2") {
    return "border-blue-300 bg-blue-200 text-blue-800 hover:bg-blue-300";
  }

  if (normalized.includes("ensino medio") || normalized === "em") {
    return "border-blue-400 bg-blue-300 text-blue-900 hover:bg-blue-400";
  }

  return "border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200";
}

function buildClassCode(seriesName: string | undefined, suffix: string, shift?: number): string {
  const cleanedSeries = String(seriesName ?? "")
    .replace(/\bano\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
  const normalizedSuffix = String(suffix ?? "").trim().toUpperCase();
  const shiftLetter = shift === 1 ? "M" : shift === 2 ? "V" : "";

  if (!cleanedSeries || !normalizedSuffix || !shiftLetter) return "";
  return `${cleanedSeries} ${normalizedSuffix}${shiftLetter}`.trim();
}

export function ClassesCreateDialog({
  open,
  onOpenChange,
  schoolOptions,
  educationLevelOptions,
  seriesOptions,
  defaultSchoolId,
  onSubmit,
}: ClassesCreateDialogProps) {
  const [schoolId, setSchoolId] = useState("");
  const [educationLevelId, setEducationLevelId] = useState("");
  const [seriesId, setSeriesId] = useState("");
  const [suffix, setSuffix] = useState("");
  const [shift, setShift] = useState<number | null>(null);
  const [year, setYear] = useState(String(CURRENT_YEAR));
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;

    const nextSchool =
      (defaultSchoolId && schoolOptions.some((option) => option.id === defaultSchoolId) ? defaultSchoolId : "") ||
      schoolOptions[0]?.id ||
      "";

    setSchoolId(nextSchool);
    setEducationLevelId("");
    setSeriesId("");
    setSuffix("");
    setShift(null);
    setYear(String(CURRENT_YEAR));
  }, [defaultSchoolId, open, schoolOptions]);

  const selectedSchool = useMemo(
    () => schoolOptions.find((option) => option.id === schoolId),
    [schoolId, schoolOptions]
  );

  const selectedSchoolIndex = useMemo(
    () => schoolOptions.findIndex((option) => option.id === schoolId),
    [schoolId, schoolOptions]
  );

  const selectedSchoolColor = getSchoolColorClass(selectedSchoolIndex >= 0 ? selectedSchoolIndex : 0);

  const filteredSeriesOptions = useMemo(
    () => seriesOptions.filter((option) => option.educationLevelId === educationLevelId),
    [educationLevelId, seriesOptions]
  );

  const selectedSeries = useMemo(
    () => filteredSeriesOptions.find((option) => option.id === seriesId),
    [filteredSeriesOptions, seriesId]
  );

  const generatedCode = useMemo(
    () => buildClassCode(selectedSeries?.name, suffix, shift ?? undefined),
    [selectedSeries?.name, shift, suffix]
  );

  const canSubmit = useMemo(() => {
    const parsedYear = Number(year);
    return (
      schoolId.length > 0 &&
      educationLevelId.length > 0 &&
      seriesId.length > 0 &&
      suffix.length > 0 &&
      typeof shift === "number" &&
      Number.isInteger(parsedYear) &&
      parsedYear >= 2000 &&
      parsedYear <= 2100
    );
  }, [schoolId, educationLevelId, seriesId, suffix, shift, year]);

  const handleSelectEducationLevel = useCallback((levelId: string) => {
    setEducationLevelId(levelId);
    setSeriesId("");
  }, []);

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (isSubmitting || !canSubmit || typeof shift !== "number") return;

      try {
        setIsSubmitting(true);

        await onSubmit({
          school_id: schoolId,
          series_id: seriesId,
          suffix,
          shift,
          year: Number(year),
        });

        toast.success("Turma criada com sucesso.");
        onOpenChange(false);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Nao foi possível criar a turma.";
        toast.error(message);
      } finally {
        setIsSubmitting(false);
      }
    },
    [canSubmit, isSubmitting, onOpenChange, onSubmit, schoolId, seriesId, shift, suffix, year]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex flex-col h-[100dvh] max-h-[100dvh] w-full max-w-full left-0 top-0 translate-x-0 translate-y-0 rounded-none overflow-hidden p-4 min-[500px]:w-[95vw] min-[500px]:max-w-[600px] min-[500px]:left-1/2 min-[500px]:-translate-x-1/2 sm:top-1/2 sm:-translate-y-1/2 sm:h-auto sm:max-h-[90vh] sm:w-full sm:max-w-[520px] sm:rounded-lg sm:p-6">
        <DialogHeader>
          <DialogTitle>Nova turma</DialogTitle>
          <DialogDescription>Preencha os dados para cadastrar uma nova turma.</DialogDescription>
        </DialogHeader>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div className="space-y-1">
            <label className="text-sm font-medium">Escola</label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 w-full justify-between gap-2 px-2 font-medium"
                  disabled={schoolOptions.length === 0 || isSubmitting}
                >
                  <span className={cn("h-8 w-8 shrink-0 rounded-md border", selectedSchoolColor)} aria-hidden="true" />
                  <span className="min-w-0 flex-1 truncate text-left text-sm">
                    {selectedSchool?.name ?? "Selecione a escola"}
                  </span>
                  <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)]">
                {schoolOptions.length === 0 ? (
                  <DropdownMenuItem disabled>Nenhuma escola disponível</DropdownMenuItem>
                ) : (
                  schoolOptions.map((school, index) => (
                    <DropdownMenuItem key={school.id} onSelect={() => setSchoolId(school.id)}>
                      <div className="flex items-center gap-2">
                        <span
                          className={cn("h-8 w-8 shrink-0 rounded-md border", getSchoolColorClass(index))}
                          aria-hidden="true"
                        />
                        <span className="truncate">{school.name}</span>
                      </div>
                    </DropdownMenuItem>
                  ))
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Nível de ensino</label>
            {educationLevelOptions.length === 0 ? (
              <div className="rounded-md border border-dashed border-border px-3 py-2 text-sm text-muted-foreground">
                Nenhum nível disponível
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 p-0.5">
                {educationLevelOptions.map((option) => {
                  const isActive = option.id === educationLevelId;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => handleSelectEducationLevel(option.id)}
                      disabled={isSubmitting}
                      className={cn(
                        "inline-flex w-full items-center justify-start gap-1 rounded-md border px-2 py-1 text-left text-xs font-semibold transition-colors",
                        getLevelTone(option.name),
                        isActive && "ring-2 ring-primary/30"
                      )}
                      aria-pressed={isActive}
                    >
                      {isActive ? <Check className="h-3 w-3" /> : null}
                      {option.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="space-y-1">
              <label className="text-sm font-medium">Série</label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-10 w-full justify-between text-left"
                    disabled={!educationLevelId || filteredSeriesOptions.length === 0 || isSubmitting}
                  >
                    <span className="truncate">{selectedSeries?.name ?? "Selecione"}</span>
                    <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)]">
                  {!educationLevelId ? (
                    <DropdownMenuItem disabled>Selecione o nível de ensino primeiro</DropdownMenuItem>
                  ) : filteredSeriesOptions.length === 0 ? (
                    <DropdownMenuItem disabled>Nenhuma série disponivel para o nível selecionado</DropdownMenuItem>
                  ) : (
                    filteredSeriesOptions.map((option) => (
                      <DropdownMenuItem key={option.id} onSelect={() => setSeriesId(option.id)}>
                        {option.name}
                      </DropdownMenuItem>
                    ))
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Turma</label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button type="button" variant="outline" className="h-10 w-full justify-between text-left" disabled={isSubmitting}>
                    <span className="truncate">{suffix || "Selecione"}</span>
                    <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)]">
                  {SUFFIX_OPTIONS.map((option) => (
                    <DropdownMenuItem key={option} onSelect={() => setSuffix(option)}>
                      {option}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Turno</label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button type="button" variant="outline" className="h-10 w-full justify-between text-left" disabled={isSubmitting}>
                    <span className="truncate">{SHIFT_OPTIONS.find((item) => item.value === shift)?.label ?? "Selecione"}</span>
                    <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)]">
                  {SHIFT_OPTIONS.map((option) => (
                    <DropdownMenuItem key={option.value} onSelect={() => setShift(option.value)}>
                      {option.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-medium">Ano</label>
              <Input
                type="number"
                value={year}
                onChange={(event) => setYear(event.target.value)}
                min={2000}
                max={2100}
                disabled={isSubmitting}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Code</label>
              <Input value={generatedCode} placeholder="Ex: 2º AM" readOnly disabled />
            </div>
          </div>

          <DialogFooter className="flex-row w-full gap-2 bg-background pt-2 sm:justify-end sm:space-x-0">
            <Button type="button" variant="outline" className="flex-1 sm:flex-none" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1 sm:flex-none" disabled={isSubmitting || !canSubmit}>
              {isSubmitting ? (
                <span className="inline-flex items-center gap-2">
                  <LoaderCircleIcon className="h-4 w-4 animate-spin" />
                  Criando
                </span>
              ) : (
                "Criar turma"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
