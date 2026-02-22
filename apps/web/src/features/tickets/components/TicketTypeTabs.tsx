import { TICKET_TYPE_STYLES, type TicketTypeKey } from "@/config/ticket-constants";
import { cn } from "@/lib/utils";

interface TicketTypeTabsProps {
  value: TicketTypeKey | null;
  onValueChange: (value: TicketTypeKey | null) => void;
}

export function TicketTypeTabs({ value, onValueChange }: TicketTypeTabsProps) {
  return (
    <div className="w-full flex-1">
      <div className="w-full h-8 p-1 bg-muted rounded-lg flex items-center gap-1">
        {(Object.keys(TICKET_TYPE_STYLES) as TicketTypeKey[]).map((type) => {
          const style = TICKET_TYPE_STYLES[type];
          const Icon = style.icon;
          const isSelected = value === type;

          return (
            <button
              key={type}
              type="button"
              onClick={() => onValueChange(isSelected ? null : type)}
              aria-label={`Filtrar por ${style.label}`}
              aria-pressed={isSelected}
              className={cn(
                "h-6 text-xs px-2 rounded-md transition-all shadow-none inline-flex items-center justify-center",
                isSelected
                  ? "flex-[2] bg-background text-foreground"
                  : "flex-1 text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn("h-3.5 w-3.5", isSelected ? "mr-1.5" : "")} aria-hidden="true" />
              {isSelected && <span>{style.label}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
