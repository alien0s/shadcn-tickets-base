import { useCallback } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TICKET_TYPE_STYLES, type TicketTypeKey } from "@/config/ticket-constants";
import { cn } from "@/lib/utils";

interface TicketTypeTabsProps {
  value: TicketTypeKey | null;
  onValueChange: (value: TicketTypeKey | null) => void;
}

export function TicketTypeTabs({ value, onValueChange }: TicketTypeTabsProps) {
  /**
   * ✅ Toggle "clicou de novo, desmarca".
   * - Usamos onValueChange do Tabs (Radix) para manter controle previsível.
   * - Evita preventDefault + onClick inline em cada trigger.
   */
  const handleValueChange = useCallback(
    (nextValue: string) => {
      const next = (nextValue || null) as TicketTypeKey | null;
      // Se o usuário selecionar o mesmo, desmarca (toggle)
      onValueChange(next === value ? null : next);
    },
    [onValueChange, value]
  );

  // Radix Tabs não gosta de `null`, então usamos "" como "nenhum"
  const tabsValue = value ?? "";

  return (
    <Tabs value={tabsValue} onValueChange={handleValueChange} className="w-full flex-1">
      <TabsList className="w-full h-8 p-1 bg-muted rounded-lg">
        {(Object.keys(TICKET_TYPE_STYLES) as TicketTypeKey[]).map((type) => {
          const style = TICKET_TYPE_STYLES[type];
          const Icon = style.icon;
          const isSelected = value === type;

          return (
            <TabsTrigger
              key={type}
              value={type}
              className={cn(
                "flex-1 h-6 text-xs px-2 rounded-md transition-all data-[state=active]:shadow-sm",
                isSelected ? "flex-[2]" : "flex-1"
              )}
              aria-label={`Filtrar por ${style.label}`} // ✅ a11y mínima
            >
              <Icon className={cn("h-3.5 w-3.5", isSelected ? "mr-1.5" : "")} aria-hidden="true" />
              {isSelected && <span>{style.label}</span>}
            </TabsTrigger>
          );
        })}
      </TabsList>
    </Tabs>
  );
}
