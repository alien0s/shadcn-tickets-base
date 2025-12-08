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
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto dark:border-2">
        <DialogHeader>
          <DialogTitle>Novo ticket</DialogTitle>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            // TODO: integração com API
            console.log("Criando ticket com prioridade:", priority);
            console.log("Tipo:", ticketType);
            console.log("Arquivos:", files);
            onOpenChange(false);
          }}
        >
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

          <DialogFooter className="flex items-center justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Criar ticket
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
