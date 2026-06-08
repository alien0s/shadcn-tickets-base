import { Camera, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

type GradePrintActionsProps = {
  onCapture: () => void;
};

export function GradePrintActions({ onCapture }: GradePrintActionsProps) {
  return (
    <div data-grade-print-hidden className="flex items-center gap-2">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-muted-foreground shadow-none hover:text-foreground"
            onClick={onCapture}
            aria-label="Imprimir relatório da grade"
          >
            <Printer className="h-4 w-4" aria-hidden="true" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Imprimir relatório da grade</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-muted-foreground shadow-none hover:text-foreground"
            aria-label="Imprimir uma captura dessa tela"
            onClick={onCapture}
          >
            <Camera className="h-4 w-4" aria-hidden="true" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Imprimir uma captura dessa tela</TooltipContent>
      </Tooltip>
    </div>
  );
}
