import { useCallback, useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { EntitySelectProps } from "../types";

export function EntitySelect({ options, value, onChange }: EntitySelectProps) {
  const [open, setOpen] = useState(false);

  // ✅ ids estáveis para a11y (não muda visual)
  const listboxId = useId();

  // ✅ handler estável: evita inline handler no map e mantém previsível
  const handleOptionClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      const selected = e.currentTarget.dataset.value;
      if (!selected) return;

      onChange(selected);
      setOpen(false);
    },
    [onChange]
  );

  const displayValue = value || "Selecione uma entidade";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button" // ✅ evita submit acidental em forms
          variant="outline"
          className="w-full justify-between px-3"
          aria-haspopup="listbox" // ✅ a11y
          aria-expanded={open} // ✅ a11y
          aria-controls={listboxId} // ✅ a11y
        >
          <span className="truncate">{displayValue}</span>
        </Button>
      </PopoverTrigger>

      <PopoverContent className="p-0 w-[220px]" align="start">
        <div
          id={listboxId}
          role="listbox" // ✅ a11y
          aria-label="Selecione uma entidade"
          className="py-1"
        >
          {options.map((option) => {
            const selected = option === value;

            return (
              <button
                key={option}
                type="button"
                role="option" // ✅ a11y
                aria-selected={selected} // ✅ a11y
                data-value={option} // ✅ usado pelo handler estável
                className={cn(
                  "w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-foreground",
                  selected ? "font-semibold" : "font-normal"
                )}
                onClick={handleOptionClick}
              >
                <span className="flex items-center gap-2">
                  <Check
                    className={cn("h-4 w-4", selected ? "opacity-100" : "opacity-0")}
                    aria-hidden="true" // ✅ ícone decorativo
                  />
                  <span className="truncate">{option}</span>
                </span>
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}