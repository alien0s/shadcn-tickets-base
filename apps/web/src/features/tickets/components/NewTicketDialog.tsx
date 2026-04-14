import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import { useAuth } from "@/features/auth";
import { api } from "@/lib";
import { useFileAttachments } from "@/features/UploadFileMessage/hooks/useFileAttachments";
import { getStoredToken } from "@/features/auth/utils/auth-storage";
import { expireAuthSession, isUnauthorizedApiResponse } from "@/features/auth/utils/auth-session";
import { LoaderCircleIcon } from "lucide-react";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void | Promise<void>;
};

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

type TicketDraftCache = {
  title: string;
  subject: string;
  priority: TicketPriorityKey;
  ticketType: TicketTypeKey;
  files: File[];
};

let ticketDraftCache: TicketDraftCache | null = null;

export function NewTicketDialog({ open, onOpenChange, onCreated }: Props) {
  const { user } = useAuth();
  const [priority, setPriority] = useState<TicketPriorityKey>("baixa");
  const [ticketType, setTicketType] = useState<TicketTypeKey>("duvida");
  const [shouldAutoFocus, setShouldAutoFocus] = useState(false);
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const attachments = useFileAttachments({
    maxFiles: 4,
    onDuplicateFiles: (duplicates) => {
      if (duplicates.length === 0) return;
      const names = duplicates.map((file) => file.name).join(", ");
      toast.warning(`Arquivo ja adicionado: ${names}`);
    },
  });
  const hasRestoredRef = useRef(false);

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
      if (!openRef.current) return;

      const pasted = e.clipboardData?.files;
      if (!pasted || pasted.length === 0) return;

      const pastedFiles = Array.from(pasted);
      e.preventDefault();
      attachments.addFiles(pastedFiles);
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [open, attachments.addFiles]);

  useEffect(() => {
    if (open) {
      if (
        ticketDraftCache &&
        !hasRestoredRef.current &&
        attachments.selectedFiles.length === 0
      ) {
        setTitle(ticketDraftCache.title);
        setSubject(ticketDraftCache.subject);
        setPriority(ticketDraftCache.priority);
        setTicketType(ticketDraftCache.ticketType);

        if (ticketDraftCache.files.length > 0) {
          attachments.addFiles(ticketDraftCache.files);
        }

        hasRestoredRef.current = true;
      }

      return;
    }

    ticketDraftCache = {
      title,
      subject,
      priority,
      ticketType,
      files: attachments.selectedFiles
    };
    hasRestoredRef.current = false;
  }, [
    open,
    title,
    subject,
    priority,
    ticketType,
    attachments.selectedFiles,
    attachments.addFiles
  ]);

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

  const uploadAttachments = useCallback(
    async (ticketId: string) => {
      if (attachments.selectedFiles.length === 0) return;

      const formData = new FormData();
      attachments.selectedFiles.forEach((file) => {
        formData.append("files", file);
      });

      const token = getStoredToken();
      const response = await fetch(
        `${API_URL}/tickets/${ticketId}/attachments`,
        {
          method: "POST",
          body: formData,
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }
      );

      const result = await response.json();

      if (!response.ok || !result?.success) {
        if (isUnauthorizedApiResponse(response.status, result)) {
          expireAuthSession();
        }

        throw new Error(
          result?.error?.message ||
            result?.message ||
            "Erro ao enviar anexos"
        );
      }
    },
    [attachments.selectedFiles]
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      if (isSubmitting) return;

      const priorityMap: Record<TicketPriorityKey, "low" | "normal" | "high"> = {
        baixa: "low",
        media: "normal",
        alta: "high",
      };

      const typeMap: Record<TicketTypeKey, "error" | "suggestion" | "question"> = {
        erro: "error",
        sugestao: "suggestion",
        duvida: "question",
      };

      setIsSubmitting(true);

      try {
        const { message, data } = await api.postWithMeta<{ id: string }>(
          "/tickets",
          {
          title: title.trim(),
          subject: subject.trim(),
          priority: priorityMap[priority],
          type: typeMap[ticketType],
          ...(user?.os_id ? { os_id: user.os_id } : {}),
          ...(user?.browser ? { browser: user.browser } : {}),
          }
        );

        if (data?.id) {
          await uploadAttachments(data.id);
        }

        toast.success(message || "Ticket criado com sucesso");
        attachments.clearFiles();
        ticketDraftCache = null;
        setTitle("");
        setSubject("");
        setPriority("baixa");
        setTicketType("duvida");
        await onCreated?.();
        onOpenChange(false);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Erro ao criar ticket";
        toast.error(message);
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      isSubmitting,
      onOpenChange,
      priority,
      subject,
      ticketType,
      title,
      uploadAttachments,
      user,
      attachments,
      onCreated,
    ]
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
          <DialogDescription>
            Preencha os detalhes do problema para abrir um novo ticket.
          </DialogDescription>
        </DialogHeader>

        <form
          className="flex flex-col flex-1 min-h-0 gap-4 overflow-y-auto sm:overflow-visible"
          onSubmit={handleSubmit}
        >
          <div className="space-y-4 pr-1 pl-1 flex-1 min-h-0">
            <div className="space-y-1">
              <label className="text-sm font-medium">Assunto</label>
              <Input
                placeholder="Descreva rapidamente o problema"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                required
                disabled={isSubmitting}
              />
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
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Anexos</label>
              <FileDropZone
                controller={attachments}
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
              disabled={isSubmitting}
            >
              Cancelar
            </Button>

          <Button
            type="submit"
            size="sm"
            className="flex-1 sm:flex-none bg-primary text-primary-foreground hover:bg-primary/90"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span className="inline-flex items-center gap-2">
                <LoaderCircleIcon className="h-4 w-4 animate-spin" />
                Criando
              </span>
            ) : (
              "Criar ticket"
            )}
          </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
