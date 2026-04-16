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

type MatrizClassSelectProps = {
  value: string;
  options: ReadonlyArray<{
    value: string;
    label: string;
  }>;
  isLoading: boolean;
  onChange: (value: string) => void;
};

export function MatrizClassSelect({
  value,
  options,
  isLoading,
  onChange,
}: MatrizClassSelectProps) {
  const selectedOption = options.find((option) => option.value === value);
  const selectedLabel = selectedOption?.label ?? "Sem turmas";

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
          aria-label="Selecionar turma"
        >
          <span className="min-w-0 flex-1 truncate text-left text-sm">{selectedLabel}</span>
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[210px]">
        {options.length === 0 ? (
          <DropdownMenuItem disabled>Nenhuma turma disponível</DropdownMenuItem>
        ) : (
          options.map((option) => {
            const isActive = option.value === value;

            return (
              <DropdownMenuItem
                key={option.value}
                onSelect={() => {
                  onChange(option.value);
                }}
                className={cn(isActive && "bg-accent/40 font-medium text-primary")}
              >
                <span className="truncate">{option.label}</span>
              </DropdownMenuItem>
            );
          })
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
