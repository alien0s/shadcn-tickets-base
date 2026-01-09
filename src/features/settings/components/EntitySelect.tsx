import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { EntitySelectProps } from "../types";

export function EntitySelect({ options, value, onChange }: EntitySelectProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-between px-3">
          <span className="truncate">
            {value || "Selecione uma entidade"}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-[220px]" align="start">
        <div className="py-1">
          {options.map((option) => (
            <button
              key={option}
              type="button"
              className={cn(
                "w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-foreground",
                option === value ? "font-semibold" : "font-normal"
              )}
              onClick={() => {
                onChange(option);
                setOpen(false);
              }}
            >
              <span className="flex items-center gap-2">
                <Check
                  className={cn(
                    "h-4 w-4",
                    option === value ? "opacity-100" : "opacity-0"
                  )}
                />
                <span className="truncate">{option}</span>
              </span>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
