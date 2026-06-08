import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { ToolbarOption } from "@/features/grade/types";

type RhToolbarProps = {
  schoolId: string;
  schoolOptions: readonly ToolbarOption[];
  isLoading: boolean;
  onSchoolChange: (value: string) => void;
};

const EMPTY_OPTIONS: readonly ToolbarOption[] = [];
const noop = () => {};

// Mantem uma cor visual simples para cada escola no seletor.
const SCHOOL_COLOR_CLASSES = [
  "bg-blue-100 border-blue-200",
  "bg-rose-100 border-rose-200",
  "bg-amber-100 border-amber-200",
  "bg-emerald-100 border-emerald-200",
  "bg-orange-100 border-orange-200",
] as const;

function getSchoolColorClass(index: number): string {
  return SCHOOL_COLOR_CLASSES[index % SCHOOL_COLOR_CLASSES.length];
}

// Dropdown principal para trocar a escola ativa na pagina.
function SchoolSelect({
  schoolId = "",
  schoolOptions = EMPTY_OPTIONS,
  onSchoolChange = noop,
  isLoading = false,
}: Partial<RhToolbarProps>) {
  const selectedOption = schoolOptions.find((option) => option.value === schoolId);
  const selectedLabel = selectedOption?.label ?? "Sem escolas";
  const selectedIndex = schoolOptions.findIndex((option) => option.value === schoolId);
  const selectedColorClass = getSchoolColorClass(selectedIndex >= 0 ? selectedIndex : 0);
  const coloredOptions = useMemo(
    () =>
      schoolOptions.map((option, index) => ({
        ...option,
        colorClass: getSchoolColorClass(index),
      })),
    [schoolOptions]
  );
  const [open, setOpen] = useState(false);

  if (isLoading) {
    return <Skeleton className="h-11 w-[210px] rounded-lg" />;
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={schoolOptions.length === 0}
          className="h-11 w-[210px] justify-between gap-2 bg-background px-2 font-medium text-foreground hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
          aria-label="Selecionar escola"
        >
          <span
            className={cn("h-8 w-8 shrink-0 rounded-lg border", selectedColorClass)}
            aria-hidden="true"
          />
          <span className="min-w-0 flex-1 truncate text-left text-sm">{selectedLabel}</span>
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[210px]">
        {coloredOptions.length === 0 ? (
          <DropdownMenuItem disabled>Nenhuma escola disponivel</DropdownMenuItem>
        ) : (
          coloredOptions.map((option) => {
            const isActive = option.value === schoolId;

            return (
              <DropdownMenuItem
                key={option.value}
                onSelect={() => {
                  onSchoolChange(option.value);
                  setOpen(false);
                }}
                className={cn(isActive && "bg-accent/40 font-medium text-primary")}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={cn("h-8 w-8 shrink-0 rounded-lg border", option.colorClass)}
                    aria-hidden="true"
                  />
                  <span className="truncate">{option.label}</span>
                </div>
              </DropdownMenuItem>
            );
          })
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function RhToolbar(props: RhToolbarProps) {
  return (
    // Toolbar reduzido: hoje so controla a selecao da escola.
    <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end sm:gap-3">
      <SchoolSelect {...props} />
    </div>
  );
}
