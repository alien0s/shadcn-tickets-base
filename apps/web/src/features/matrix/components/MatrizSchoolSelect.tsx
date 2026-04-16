import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type MatrizSchoolSelectProps = {
  value: string;
  options: ReadonlyArray<{
    value: string;
    label: string;
  }>;
  isLoading: boolean;
  onChange: (value: string) => void;
};

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

export function MatrizSchoolSelect({
  value,
  options,
  isLoading,
  onChange,
}: MatrizSchoolSelectProps) {
  const selectedOption = options.find((option) => option.value === value);
  const selectedLabel = selectedOption?.label ?? "Sem escolas";
  const selectedIndex = options.findIndex((option) => option.value === value);
  const selectedColorClass = getSchoolColorClass(selectedIndex >= 0 ? selectedIndex : 0);

  if (isLoading) {
    return <Skeleton className="h-11 w-[210px] rounded-md" />;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={options.length === 0}
          className="h-11 w-[210px] justify-between gap-2 bg-background px-2 font-medium text-foreground hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
          aria-label="Selecionar escola"
        >
          <span
            className={cn("h-8 w-8 shrink-0 rounded-md border", selectedColorClass)}
            aria-hidden="true"
          />
          <span className="min-w-0 flex-1 truncate text-left text-sm">{selectedLabel}</span>
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[210px]">
        {options.length === 0 ? (
          <DropdownMenuItem disabled>Nenhuma escola disponível</DropdownMenuItem>
        ) : (
          options.map((option, index) => {
            const isActive = option.value === value;

            return (
              <DropdownMenuItem
                key={option.value}
                onSelect={() => {
                  onChange(option.value);
                }}
                className={cn(isActive && "bg-accent/40 font-medium text-primary")}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={cn("h-8 w-8 shrink-0 rounded-md border", getSchoolColorClass(index))}
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
