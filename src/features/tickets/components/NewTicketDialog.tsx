import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import {
  type TicketPriorityKey,
  TICKET_TYPE_STYLES,
  type TicketTypeKey,
} from "@/config/ticket-constants";
import { FileDropZone } from "@/components/common/FileDropZone";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { PriorityPill } from "./PriorityPill";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

// ✅ dedupe por chave estável (name+size+lastModified) como você pediu
function getFileKey(file: File) {
  return `${file.name}::${file.size}::${file.lastModified}`;
}

function mergeFilesDedupe(prev: File[], incoming: File[]) {
  if (incoming.length === 0) return { next: prev, duplicates: [] as File[] };

  const seen = new Set(prev.map(getFileKey));
  const next = [...prev];
  const duplicates: File[] = [];

  for (const file of incoming) {
    const key = getFileKey(file);
    if (seen.has(key)) {
      duplicates.push(file);
      continue;
    }
    seen.add(key);
    next.push(file);
  }

  return { next, duplicates };
}

export function NewTicketDialog({ open, onOpenChange }: Props) {
  const [priority, setPriority] = useState<TicketPriorityKey>("baixa");
  const [ticketType, setTicketType] = useState<TicketTypeKey>("duvida");
  const [files, setFiles] = useState<File[]>([]);
  const [shouldAutoFocus, setShouldAutoFocus] = useState(false);

  // ✅ refs para evitar recriar/fechar sobre estado em listeners
  const openRef = useRef(open);
  openRef.current = open;

  // ✅ handlers estáveis para evitar inline em listas (sem overengineering)
  const handleSelectTicketType = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      const next = e.currentTarget.dataset.type as TicketTypeKey | undefined;
      if (!next) return;
      setTicketType(next);
    },
    []
  );

  const handleSelectPriority = useCallback((next: TicketPriorityKey) => {
    setPriority(next);
  }, []);

  const handleClose = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  const ticketTypeKeys = useMemo(
    () => Object.keys(TICKET_TYPE_STYLES) as TicketTypeKey[],
    []
  );

  // Handle paste events (Ctrl+V) — com dedupe + SSR safety
  useEffect(() => {
    if (!open) return;
    if (typeof window === "undefined") return;

    const handlePaste = (e: ClipboardEvent) => {
      // ✅ garante que só processa quando o dialog está aberto
      if (!openRef.current) return;

      const pasted = e.clipboardData?.files;
      if (!pasted || pasted.length === 0) return;

      const pastedFiles = Array.from(pasted);
      e.preventDefault();

      setFiles((prev) => {
        const { next, duplicates } = mergeFilesDedupe(prev, pastedFiles);

        if (duplicates.length > 0) {
          const names = duplicates.map((f) => f.name).join(", ");
          toast.warning(`Arquivo ja adicionado: ${names}`);
        }

        return next;
      });
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [open]);

  // Decide se deve auto focar (desktop) — com SSR safety
  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(max-width: 767px)");
    const updateAutoFocus = () => setShouldAutoFocus(!mediaQuery.matches);

    updateAutoFocus();

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", updateAutoFocus);
    } else {
      mediaQuery.addListener(updateAutoFocus);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener("change", updateAutoFocus);
      } else {
        mediaQuery.removeListener(updateAutoFocus);
      }
    };
  }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      // TODO: integração com API
      console.log("Criando ticket com prioridade:", priority);
      console.log("Tipo:", ticketType);
      console.log("Arquivos:", files);

      toast.success("Ticket criado com sucesso");
      onOpenChange(false);
    },
    [files, onOpenChange, priority, ticketType]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex flex-col h-[100dvh] max-h-[100dvh] w-full max-w-full left-0 top-0 translate-x-0 translate-y-0 rounded-none overflow-hidden p-4 min-[500px]:w-[95vw] min-[500px]:max-w-[600px] min-[500px]:left-1/2 min-[500px]:-translate-x-1/2 sm:top-1/2 sm:-translate-y-1/2 sm:h-auto sm:max-h-[90vh] sm:w-full sm:max-w-[550px] sm:rounded-lg sm:p-6"
        onOpenAutoFocus={(event) => {
          // ✅ evita abrir teclado no mobile automaticamente
          if (!shouldAutoFocus) event.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>Novo ticket</DialogTitle>
        </DialogHeader>

        <form
          className="flex flex-col flex-1 min-h-0 gap-4 overflow-y-auto sm:overflow-visible"
          onSubmit={handleSubmit}
        >
          <div className="space-y-4 pr-1 pl-1 flex-1 min-h-0">
            <div className="space-y-1">
              <label className="text-sm font-medium">Assunto</label>
              <Input placeholder="Descreva rapidamente o problema" required />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Tipo</label>
              <div className="flex gap-2">
                {ticketTypeKeys.map((key) => {
                  const style = TICKET_TYPE_STYLES[key];
                  const isSelected = ticketType === key;
                  const Icon = style.icon;

                  return (
                    <button
                      key={key}
                      type="button"
                      data-type={key} // ✅ usado pelo handler estável
                      onClick={handleSelectTicketType}
                      className={cn(
                        "px-3 py-1 rounded-md text-xs font-medium transition-all border flex items-center gap-1.5",
                        isSelected
                          ? style.activeClass
                          : "bg-transparent text-muted-foreground border-border hover:bg-accent"
                      )}
                      aria-pressed={isSelected} // ✅ a11y
                    >
                      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                      {style.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Prioridade</label>
              <div className="flex gap-2">
                {(["baixa", "media", "alta"] as TicketPriorityKey[]).map((key) => {
                  const isSelected = priority === key;

                  return (
                    <PriorityPill
                      key={key}
                      priority={key}
                      size="sm"
                      isSelected={isSelected}
                      useStyle={isSelected}
                      showSelectedRing={false}
                      className={isSelected ? undefined : "hover:bg-accent"}
                      onClick={() => handleSelectPriority(key)} // ✅ callback estável + lista pequena
                    />
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
              <FileDropZone
                files={files}
                onFilesChange={(next) => {
                  setFiles(mergeFilesDedupe([], next).next);
                }}

                onDuplicateFiles={(duplicates) => {
                  if (duplicates.length === 0) return;
                  const names = duplicates.map((file) => file.name).join(", ");
                  toast.warning(`Arquivo ja adicionado: ${names}`);
                }}
              />
            </div>
          </div>

          <DialogFooter className="sticky bottom-0 left-0 right-0 flex-row w-full gap-2 bg-background pt-4 pb-[calc(0.5rem+var(--safe-bottom, env(safe-area-inset-bottom)))] sm:justify-end sm:space-x-0 sm:pb-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="flex-1 sm:flex-none"
              onClick={handleClose}
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
