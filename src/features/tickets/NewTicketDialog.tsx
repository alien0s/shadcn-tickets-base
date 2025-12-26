import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { TICKET_PRIORITY_STYLES, type TicketPriorityKey, TICKET_TYPE_STYLES, type TicketTypeKey } from "@/config/ticket-constants";
import { FileDropZone } from "@/components/common/FileDropZone";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function NewTicketDialog({ open, onOpenChange }: Props) {
  const [priority, setPriority] = useState<TicketPriorityKey>("baixa");
  const [ticketType, setTicketType] = useState<TicketTypeKey>("duvida");
  const [files, setFiles] = useState<File[]>([]);

  // Handle paste events
  useEffect(() => {
    if (!open) return;

    const handlePaste = (e: ClipboardEvent) => {
      if (e.clipboardData?.files) {
        const pastedFiles = Array.from(e.clipboardData.files);
        if (pastedFiles.length > 0) {
          e.preventDefault();
          setFiles((prev) => [...prev, ...pastedFiles]);
        }
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex flex-col h-screen max-h-screen w-full max-w-full left-0 top-0 translate-x-0 translate-y-0 rounded-none overflow-hidden p-4 min-[500px]:w-[95vw] min-[500px]:max-w-[600px] min-[500px]:left-1/2 min-[500px]:-translate-x-1/2 sm:top-1/2 sm:-translate-y-1/2 sm:h-auto sm:max-h-[90vh] sm:w-full sm:max-w-[550px] sm:rounded-lg sm:p-6 dark:border-2">
        <DialogHeader>
          <DialogTitle>Novo ticket</DialogTitle>
        </DialogHeader>

        <form
          className="flex flex-col flex-1 min-h-0 gap-4 overflow-y-auto sm:overflow-visible"
          onSubmit={(e) => {
            e.preventDefault();
            // TODO: integração com API
            console.log("Criando ticket com prioridade:", priority);
            console.log("Tipo:", ticketType);
            console.log("Arquivos:", files);
            onOpenChange(false);
          }}
        >
          <div className="space-y-4 pr-1 pl-1 flex-1 min-h-0">
            <div className="space-y-1">
              <label className="text-sm font-medium">Assunto</label>
              <Input placeholder="Descreva rapidamente o problema" required />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Tipo</label>
              <div className="flex gap-2">
                {(Object.keys(TICKET_TYPE_STYLES) as TicketTypeKey[])
                  .map((key) => {
                    const style = TICKET_TYPE_STYLES[key];
                    const isSelected = ticketType === key;
                    const Icon = style.icon;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setTicketType(key)}
                        className={cn(
                          "px-3 py-1 rounded-md text-xs font-medium transition-all border flex items-center gap-1.5",
                          isSelected
                            ? style.activeClass
                            : "bg-transparent text-muted-foreground border-border hover:bg-accent"
                        )}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        {style.label}
                      </button>
                    );
                  })}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Prioridade</label>
              <div className="flex gap-2">
                {(Object.keys(TICKET_PRIORITY_STYLES) as TicketPriorityKey[])
                  .map((key) => {
                    const style = TICKET_PRIORITY_STYLES[key];
                    const isSelected = priority === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setPriority(key)}
                        className={cn(
                          "px-3 py-1 rounded-md text-xs font-medium transition-all border",
                          isSelected
                            ? style.className + " border-transparent"
                            : "bg-transparent text-muted-foreground border-border hover:bg-accent"
                        )}
                      >
                        {style.label}
                      </button>
                    );
                  })}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Descrição</label>
              <Textarea
                rows={3}
                placeholder="Detalhe o que está acontecendo..."
                required
                className="resize-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Anexos</label>
              <FileDropZone files={files} onFilesChange={setFiles} />
            </div>
          </div>

          <DialogFooter className="sticky bottom-0 left-0 right-0 flex-row w-full gap-2 bg-background pt-4 pb-2 sm:justify-end sm:space-x-0 sm:pb-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="flex-1 sm:flex-none"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              className="flex-1 sm:flex-none bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Criar ticket
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
